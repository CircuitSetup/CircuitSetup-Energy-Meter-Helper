"""Durable, topology-driven ATM90E32 voltage and current calibration."""

from __future__ import annotations

import asyncio
import math
import re
from collections.abc import Awaitable, Callable, Mapping, Sequence
from contextlib import suppress
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from hashlib import sha256
from statistics import fmean
from time import monotonic
from typing import Any, cast
from uuid import uuid4

from .config_document import ESPHomeConfigDocument
from .device_builder import ESPHomeConfigSnapshot
from .entity_binding import BoundEntity, EntityBindingError, GroupBinding, MeterBinding
from .entity_catalog import EntityCatalog, EntityCatalogError
from .esphome_api import ESPHomeSessionDisconnectedError
from .log_parser import (
    CalibrationLogLine,
    GainRunEvidence,
    LogEvidenceError,
    RestoreEvidence,
    parse_gain_run,
    parse_restore,
)
from .models import MeterTopology, StoredInterruptedSession
from .preflight import ReferenceZeroError, zero_reference_guard
from .session_manager import CalibrationLease, PendingCalibrationOrigin, SessionManager
from .state_tracker import SensorSampleWindow
from .store import PhaseGainTable, VerifiedCalibrationRecord, VerifiedGainGroup
from .topology import topology_from_config

type MarkerWriter = Callable[[str, StoredInterruptedSession | None], Awaitable[None]]
type VerifiedWriter = Callable[[VerifiedCalibrationRecord], Awaitable[None]]
type CalibrationSnapshotReader = Callable[
    [str, MeterTopology], Awaitable[ESPHomeConfigSnapshot]
]

_CONFIGURATION_ID = re.compile(r"[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml")


class CalibrationState(StrEnum):
    APPLIED_PENDING_RESTART_VERIFICATION = "applied_pending_restart_verification"
    RESULT_OUTSIDE_TOLERANCE = "result_outside_tolerance"
    INDETERMINATE = "indeterminate"


class CalibrationError(RuntimeError):
    """A calibration cannot be accepted safely."""


class CalibrationStabilityError(CalibrationError):
    """Fresh sensor samples are not stable enough for calibration."""


class CalibrationInvariantError(CalibrationError):
    """ATM gain evidence changed a non-target gain."""


class IterationConfirmationRequired(CalibrationError):
    """A subsequent calibration iteration needs explicit user approval."""


class CalibrationIterationLimitError(CalibrationError):
    """The current calibration operation already used all three attempts."""


class CalibrationRebindError(CalibrationError):
    """Fresh native entity metadata cannot produce a generation-local binding."""


class RestartVerificationError(CalibrationError):
    """Post-restart flash evidence is incomplete or does not match exactly."""


class RestartDisconnectTimeoutError(RestartVerificationError):
    """The native Restart command did not disconnect within 20 seconds."""


@dataclass(frozen=True, slots=True)
class CalibrationResult:
    state: CalibrationState
    group_key: str
    phase: str | None
    changed_channels: tuple[int, ...]
    iteration: int
    before_values: tuple[float, ...]
    after_values: tuple[float, ...]
    error_percent_values: tuple[float, ...]
    gain_evidence: GainRunEvidence | None
    restore_evidence: dict[str, RestoreEvidence] | dict[str, object] | None
    retry_allowed: bool


@dataclass(frozen=True, slots=True)
class RestartVerificationResult:
    """Verified record plus the refreshed generation-local binding."""

    record: VerifiedCalibrationRecord
    binding: MeterBinding


@dataclass(slots=True)
class _BoundZeroer:
    engine: CalibrationEngine
    binding: MeterBinding | None
    substitutions: dict[str, str]

    async def async_zero_all_references(self, session: Any) -> None:
        if self.binding is None:
            raise CalibrationRebindError(
                "reference cleanup has no binding for the current generation"
            )
        await self.engine.async_zero_all_references(session, self.binding)


class CalibrationEngine:
    """Execute one explicitly requested calibration while holding both locks."""

    def __init__(
        self,
        sessions: SessionManager,
        persist_interrupted: MarkerWriter,
        *,
        sample_count: int = 3,
        stability_limit_percent: float = 1.0,
        zero_concurrency: int = 2,
        evidence_timeout: float = 10.0,
        persist_verified: VerifiedWriter | None = None,
        restart_disconnect_timeout: float = 20.0,
        restart_restore_timeout: float = 120.0,
        restart_backoff_initial: float = 0.25,
        calibration_snapshot_reader: CalibrationSnapshotReader | None = None,
    ) -> None:
        if sample_count < 1 or zero_concurrency < 1:
            raise ValueError("sample count and zero concurrency must be positive")
        if not _positive_finite(
            stability_limit_percent,
            evidence_timeout,
            restart_disconnect_timeout,
            restart_restore_timeout,
            restart_backoff_initial,
        ):
            raise ValueError("calibration limits must be finite and positive")
        self.sessions = sessions
        self._persist_interrupted = persist_interrupted
        self._sample_count = sample_count
        self._stability_limit_percent = stability_limit_percent
        self._zero_concurrency = zero_concurrency
        self._evidence_timeout = evidence_timeout
        self._persist_verified = persist_verified
        self._restart_disconnect_timeout = restart_disconnect_timeout
        self._restart_restore_timeout = restart_restore_timeout
        self._restart_backoff_initial = restart_backoff_initial
        self._calibration_snapshot_reader = calibration_snapshot_reader
        self._operation_sequences: dict[str, int] = {}

    async def async_verify_after_restart(
        self,
        mac: str,
        session: Any,
        binding: MeterBinding,
        *,
        substitutions: Mapping[str, str],
    ) -> RestartVerificationResult:
        """Restart once and persist only exact flash evidence for changed groups."""
        if self._persist_verified is None:
            raise RestartVerificationError("verified calibration persistence is absent")
        lease = await self.sessions.async_acquire_calibration(mac)
        claimed = None
        consumed = False
        try:
            try:
                pending = self.sessions.claim_calibration_origin(
                    lease, session, binding
                )
                claimed = pending
            except RuntimeError as error:
                raise RestartVerificationError(
                    "server-owned calibration origin is missing"
                ) from error
            expected = pending.expected_phase_gains
            try:
                groups = tuple(
                    VerifiedGainGroup(instance_id, gains)
                    for instance_id, gains in expected.items()
                )
            except ValueError as error:
                raise RestartVerificationError(
                    "server-owned expected gain table is invalid"
                ) from error
            self._validate_binding_generation(session, binding)
            if unknown := set(expected).difference(
                _instance_id(group.key) for group in binding.groups
            ):
                raise RestartVerificationError(
                    "changed gain group is outside the bound topology: "
                    + ", ".join(sorted(unknown))
                )
            catalog = EntityCatalog(session.entities, binding.connection_generation)
            restart = catalog.by_object_id("button", "restart")
            if len(restart) != 1 or restart[0].name != "Restart":
                raise RestartVerificationError(
                    "the native Restart button is unavailable"
                )
            disconnect = _register_disconnect_waiter(session)
            try:
                descriptor = restart[0]
                await session.async_press_button(
                    descriptor.key, device_id=descriptor.device_id
                )
            except BaseException:
                await _cancel_waiter(disconnect)
                raise
            try:
                async with asyncio.timeout(self._restart_disconnect_timeout):
                    await asyncio.shield(disconnect)
            except asyncio.CancelledError:
                await _cancel_waiter(disconnect)
                raise
            except TimeoutError as error:
                await _cancel_waiter(disconnect)
                raise RestartDisconnectTimeoutError(
                    "the native Restart button did not disconnect within the "
                    "required 20-second window"
                ) from error

            restore_started = monotonic()
            baseline = tuple(getattr(session, "log_lines", ()))
            deadline = monotonic() + self._restart_restore_timeout
            try:
                await self._reconnect_after_restart(session, deadline)
                rebound = self._rebind_after_reconnect(session, binding, substitutions)
                remaining = deadline - monotonic()
                if remaining <= 0:
                    raise TimeoutError
                generation = int(session.connection_generation)
                evidence = await self._wait_restore(
                    session,
                    generation=generation,
                    expected_instance_ids=set(expected),
                    started_after=restore_started,
                    baseline=baseline,
                    timeout=remaining,
                    require_connection=True,
                )
            except TimeoutError as error:
                raise RestartVerificationError(
                    "reconnect and restore evidence timed out"
                ) from error
            except LogEvidenceError as error:
                raise RestartVerificationError(str(error)) from error
            _validate_restart_evidence(
                evidence,
                expected,
                generation=generation,
            )
            _require_connected_generation(session, generation)
            rebound = self._rebind_after_reconnect(session, binding, substitutions)
            record = VerifiedCalibrationRecord(
                mac=mac.casefold(),
                config_filename=pending.config_filename,
                config_sha256=pending.config_sha256,
                topology_addon_count=pending.topology.addon_count,
                topology_project_name=pending.topology.project_name,
                topology_connection_type=pending.topology.connection_type,
                topology_voltage_layout=pending.topology.voltage_layout,
                connection_generation=generation,
                groups=groups,
                verification_id=uuid4().hex,
            )
            connection_guard = getattr(session, "hold_connection_generation", None)
            if connection_guard is None:
                raise RestartVerificationError(
                    "ESPHome session lifecycle guard is unavailable"
                )
            try:
                async with connection_guard(generation):
                    _require_connected_generation(session, generation)
                    await self._persist_verified(record)
                    _require_connected_generation(session, generation)
                    self.sessions.consume_calibration_origin(
                        lease, pending.operation_id, pending.revision
                    )
                    consumed = True
                    return RestartVerificationResult(record, rebound)
            except ESPHomeSessionDisconnectedError as error:
                raise RestartVerificationError(
                    "ESPHome session disconnected during verified persistence"
                ) from error
        finally:
            if claimed is not None and not consumed:
                self.sessions.release_calibration_origin_claim(
                    lease, claimed.operation_id, claimed.revision
                )
            lease.release()

    async def _reconnect_after_restart(self, session: Any, deadline: float) -> None:
        """Retry transient boot-time connection failures within one deadline."""
        attempt = 0
        last_error: BaseException | None = None
        while (remaining := deadline - monotonic()) > 0:
            try:
                async with asyncio.timeout(remaining):
                    await session.async_reconnect(dump_config=True)
                return
            except asyncio.CancelledError:
                raise
            except (ConnectionError, OSError, TimeoutError) as error:
                last_error = error
            delay = min(
                self._restart_backoff_initial * (2**attempt),
                5.0,
                max(0.0, deadline - monotonic()),
            )
            attempt += 1
            if delay:
                await asyncio.sleep(delay)
        raise RestartVerificationError(
            "ESPHome reconnect attempts exhausted before the restore deadline"
        ) from last_error

    async def _calibration_origin(
        self,
        lease: CalibrationLease,
        session: Any,
        binding: MeterBinding,
    ) -> PendingCalibrationOrigin | None:
        """Load an authoritative source once, before any calibration mutation."""
        pending = self.sessions.calibration_origin_for_update(lease, session, binding)
        if pending is not None:
            return pending
        if self._calibration_snapshot_reader is None:
            raise ValueError("authoritative configuration snapshot reader is required")
        snapshot = await self._calibration_snapshot_reader(lease.mac, binding.topology)
        if (
            not isinstance(snapshot, ESPHomeConfigSnapshot)
            or sha256(snapshot.content.encode()).hexdigest() != snapshot.sha256
        ):
            raise ValueError("authoritative configuration hash is invalid")
        if _CONFIGURATION_ID.fullmatch(snapshot.configuration) is None:
            raise ValueError("authoritative configuration filename is invalid")
        try:
            source_topology = topology_from_config(
                ESPHomeConfigDocument.parse(snapshot.content),
                native_project_name=binding.topology.project_name,
            )
        except ValueError as error:
            raise ValueError(
                "authoritative configuration topology is invalid"
            ) from error
        if not _same_topology_identity(source_topology, binding.topology):
            raise ValueError(
                "authoritative configuration topology does not match the session"
            )
        return self.sessions._begin_calibration_origin(
            lease, session, binding, snapshot
        )

    async def async_zero_all_references(
        self, session: Any, binding: MeterBinding
    ) -> None:
        """Zero groups concurrently, while preserving sequential writes per group."""
        semaphore = asyncio.Semaphore(self._zero_concurrency)
        failures: list[BaseException] = []

        async def zero_group(group: GroupBinding) -> None:
            async with semaphore:
                for entity in group.references:
                    try:
                        await self._set_number(session, entity, 0.0)
                    except Exception as error:  # noqa: BLE001 - aggregate all acks
                        failures.append(error)

        await asyncio.gather(*(zero_group(group) for group in binding.groups))
        if failures:
            raise ReferenceZeroError(tuple(failures))

    async def async_calibrate_voltage(
        self,
        mac: str,
        session: Any,
        binding: MeterBinding,
        group_key: str,
        trusted_voltage: float,
        tolerance_percent: float,
        *,
        iteration: int = 1,
        confirm_iteration: bool = False,
        substitutions: Mapping[str, str] | None = None,
    ) -> CalibrationResult:
        operation = f"voltage:{group_key}"
        attempt = self._prepare_iteration(
            mac,
            operation,
            iteration,
            confirm_iteration,
            trusted_voltage,
            tolerance_percent,
        )
        self._validate_binding_generation(session, binding)
        group = self._group(binding, group_key)
        channels = tuple(_channel_number(entity) for entity in group.current_references)
        lease = await self.sessions.async_acquire_calibration(mac)
        try:
            origin = await self._calibration_origin(lease, session, binding)
            before = await self._windows(session, group.voltage_sensors)
            marker = self._marker(channels)
            await self._persist_interrupted(mac, marker)
            self.sessions.record_calibration_iteration(mac, operation, attempt)
            zeroer = _BoundZeroer(self, binding, dict(substitutions or {}))
            async with zero_reference_guard(zeroer, session):
                await self._set_number(
                    session, group.voltage_reference, trusted_voltage
                )
                for current_reference in group.current_references:
                    await self._set_number(session, current_reference, 0.0)
                evidence, restore = await self._run_gain(
                    mac, session, group, _instance_id(group.key), zeroer
                )
                if evidence is None:
                    return self._indeterminate_result(
                        group, channels, attempt, before, restore
                    )
                self._validate_voltage_evidence(evidence, trusted_voltage)
                if origin is not None:
                    origin = self.sessions.record_calibration_group(
                        lease,
                        origin.operation_id,
                        origin.revision,
                        session,
                        binding,
                        evidence.instance_id,
                        _phase_gain_table(evidence),
                    )
                after = await self._windows(session, group.voltage_sensors)
                errors = tuple(
                    _error_percent(window.mean, trusted_voltage) for window in after
                )
                return CalibrationResult(
                    _result_state(errors, tolerance_percent),
                    group.key,
                    None,
                    channels,
                    attempt,
                    tuple(window.mean for window in before),
                    tuple(window.mean for window in after),
                    errors,
                    evidence,
                    None,
                    max(errors) > tolerance_percent and attempt < 3,
                )
        finally:
            lease.release()

    async def async_calibrate_current(
        self,
        mac: str,
        session: Any,
        binding: MeterBinding,
        channel: int,
        trusted_current: float,
        reporting_multiplier: float,
        tolerance_percent: float,
        *,
        iteration: int = 1,
        confirm_iteration: bool = False,
        substitutions: Mapping[str, str] | None = None,
    ) -> CalibrationResult:
        operation = f"current:{channel}"
        attempt = self._prepare_iteration(
            mac,
            operation,
            iteration,
            confirm_iteration,
            trusted_current,
            reporting_multiplier,
            tolerance_percent,
        )
        self._validate_binding_generation(session, binding)
        group, phase_index = self._channel_group(binding, channel)
        sensor = group.current_sensors[phase_index]
        reference = group.current_references[phase_index]
        lease = await self.sessions.async_acquire_calibration(mac)
        try:
            origin = await self._calibration_origin(lease, session, binding)
            before = (await self._window(session, sensor),)
            marker = self._marker((channel,))
            await self._persist_interrupted(mac, marker)
            self.sessions.record_calibration_iteration(mac, operation, attempt)
            zeroer = _BoundZeroer(self, binding, dict(substitutions or {}))
            async with zero_reference_guard(zeroer, session):
                await self._set_number(
                    session, reference, trusted_current / reporting_multiplier
                )
                evidence, restore = await self._run_gain(
                    mac, session, group, _instance_id(group.key), zeroer
                )
                phase = "ABC"[phase_index]
                if evidence is None:
                    return self._indeterminate_result(
                        group, (channel,), attempt, before, restore, phase
                    )
                self._validate_current_evidence(
                    evidence,
                    phase_index,
                    trusted_current / reporting_multiplier,
                )
                if origin is not None:
                    origin = self.sessions.record_calibration_group(
                        lease,
                        origin.operation_id,
                        origin.revision,
                        session,
                        binding,
                        evidence.instance_id,
                        _phase_gain_table(evidence),
                    )
                after = (await self._window(session, sensor),)
                errors = (_error_percent(after[0].mean, trusted_current),)
                return CalibrationResult(
                    _result_state(errors, tolerance_percent),
                    group.key,
                    phase,
                    (channel,),
                    attempt,
                    (before[0].mean,),
                    (after[0].mean,),
                    errors,
                    evidence,
                    None,
                    errors[0] > tolerance_percent and attempt < 3,
                )
        finally:
            lease.release()

    async def async_recover_interrupted(
        self,
        mac: str,
        session: Any,
        binding: MeterBinding,
        marker: StoredInterruptedSession,
        *,
        substitutions: Mapping[str, str] | None = None,
    ) -> None:
        lease = await self.sessions.async_acquire_calibration(mac)
        try:
            await self._persist_interrupted(
                mac,
                StoredInterruptedSession(
                    "interrupted",
                    marker.started_at,
                    marker.changed_channels,
                    marker.config_transaction_id,
                ),
            )
            await session.async_reconnect()
            rebound = self._rebind_after_reconnect(
                session, binding, dict(substitutions or {})
            )
            await self.async_zero_all_references(session, rebound)
            await self._persist_interrupted(mac, None)
            self.sessions.reset_calibration_iterations(mac)
        finally:
            lease.release()

    async def _run_gain(
        self,
        mac: str,
        session: Any,
        group: GroupBinding,
        instance_id: str,
        zeroer: _BoundZeroer,
    ) -> tuple[
        GainRunEvidence | None,
        dict[str, RestoreEvidence] | dict[str, object] | None,
    ]:
        generation = int(session.connection_generation)
        sequence = self._next_sequence(mac)
        dispatched_after = monotonic()
        waiter = self._gain_waiter(
            session,
            generation=generation,
            sequence=sequence,
            instance_id=instance_id,
            button_name=group.run_gain.descriptor.name,
            dispatched_after=dispatched_after,
        )
        try:
            await session.async_press_button(
                group.run_gain.descriptor.key,
                device_id=group.run_gain.descriptor.device_id,
            )
        except BaseException:
            await _discard_waiter(waiter)
            raise
        try:
            evidence = await waiter
        except ESPHomeSessionDisconnectedError:
            restore_started = monotonic()
            baseline = tuple(getattr(session, "log_lines", ()))
            previous_binding = zeroer.binding
            zeroer.binding = None
            if previous_binding is None:
                raise CalibrationRebindError("the previous entity binding is absent")
            await session.async_reconnect()
            zeroer.binding = self._rebind_after_reconnect(
                session, previous_binding, zeroer.substitutions
            )
            restore = await self._wait_restore(
                session,
                generation=int(session.connection_generation),
                expected_instance_ids={instance_id},
                started_after=restore_started,
                baseline=baseline,
            )
            return None, restore
        if evidence.instance_id != instance_id:
            raise CalibrationInvariantError("gain evidence is for another instance")
        if (
            evidence.connection_generation != generation
            or evidence.operation_sequence != sequence
        ):
            raise CalibrationInvariantError("gain evidence correlation does not match")
        if not evidence.immediate_apply_acceptable:
            raise CalibrationInvariantError("gain save or register verification failed")
        return evidence, None

    def _gain_waiter(
        self,
        session: Any,
        *,
        generation: int,
        sequence: int,
        instance_id: str,
        button_name: str,
        dispatched_after: float,
    ) -> Awaitable[GainRunEvidence]:
        expect = getattr(session, "expect_gain_run", None)
        if expect is not None:
            return cast(
                Awaitable[GainRunEvidence],
                expect(
                    connection_generation=generation,
                    operation_sequence=sequence,
                    target_instance_id=instance_id,
                    button_name=button_name,
                    dispatched_after=dispatched_after,
                ),
            )
        baseline = tuple(getattr(session, "log_lines", ()))
        return asyncio.create_task(
            self._poll_gain(
                session,
                baseline,
                generation,
                sequence,
                instance_id,
                button_name,
                dispatched_after,
            )
        )

    async def _poll_gain(
        self,
        session: Any,
        baseline: tuple[str, ...],
        generation: int,
        sequence: int,
        instance_id: str,
        button_name: str,
        dispatched_after: float,
    ) -> GainRunEvidence:
        deadline = monotonic() + self._evidence_timeout
        # Current firmware logs only failures after save/verify, not success.
        # Reparse until the full bounded window ends; silence is not a terminal.

        def parse_current_snapshot() -> GainRunEvidence:
            if getattr(session, "connected", True) is False:
                raise ESPHomeSessionDisconnectedError(
                    "connection ended before complete gain evidence"
                )
            new_lines = _new_log_lines(baseline, tuple(session.log_lines))
            correlated = tuple(
                CalibrationLogLine(
                    generation,
                    sequence,
                    dispatched_after + (index + 1) * 1e-6,
                    line,
                )
                for index, line in enumerate(new_lines)
            )
            return parse_gain_run(
                correlated,
                connection_generation=generation,
                operation_sequence=sequence,
                target_instance_id=instance_id,
                button_name=button_name,
                dispatched_after=dispatched_after,
            )

        while True:
            with suppress(LogEvidenceError):
                parse_current_snapshot()
            remaining = deadline - monotonic()
            if remaining <= 0:
                break
            await asyncio.sleep(min(0.05, remaining))
        return parse_current_snapshot()

    async def _wait_restore(
        self,
        session: Any,
        *,
        generation: int,
        expected_instance_ids: set[str],
        started_after: float,
        baseline: tuple[str, ...],
        timeout: float | None = None,
        require_connection: bool = False,
    ) -> dict[str, RestoreEvidence] | dict[str, object]:
        evidence_timeout = self._evidence_timeout if timeout is None else timeout
        evidence: dict[str, RestoreEvidence] | dict[str, object]
        if require_connection:
            _require_connected_generation(session, generation)
        wait = getattr(session, "async_wait_for_restore", None)
        if wait is not None:
            async with asyncio.timeout(evidence_timeout):
                evidence = cast(
                    dict[str, object],
                    await wait(
                        connection_generation=generation,
                        expected_instance_ids=expected_instance_ids,
                        started_after=started_after,
                        timeout=evidence_timeout,
                    ),
                )
            if require_connection:
                _require_connected_generation(session, generation)
            return evidence
        deadline = monotonic() + evidence_timeout
        while monotonic() < deadline:
            if require_connection:
                _require_connected_generation(session, generation)
            await asyncio.sleep(min(0.05, max(0.0, deadline - monotonic())))
            if require_connection:
                _require_connected_generation(session, generation)
        new_lines = _new_log_lines(baseline, tuple(session.log_lines))
        correlated = tuple(
            CalibrationLogLine(generation, 0, started_after + (index + 1) * 1e-6, line)
            for index, line in enumerate(new_lines)
        )
        evidence = parse_restore(
            correlated,
            connection_generation=generation,
            expected_instance_ids=expected_instance_ids,
            started_after=started_after,
        )
        if require_connection:
            _require_connected_generation(session, generation)
        return evidence

    async def _windows(
        self, session: Any, entities: Sequence[BoundEntity]
    ) -> tuple[SensorSampleWindow, ...]:
        boundary = monotonic()
        windows = await asyncio.gather(
            *(self._window(session, entity, boundary=boundary) for entity in entities)
        )
        return tuple(windows)

    async def _window(
        self,
        session: Any,
        entity: BoundEntity,
        *,
        boundary: float | None = None,
    ) -> SensorSampleWindow:
        descriptor = entity.descriptor
        raw = await session.async_wait_for_sensor_window(
            descriptor.key,
            device_id=descriptor.device_id,
            sample_count=self._sample_count,
            after=monotonic() if boundary is None else boundary,
            timeout=self._evidence_timeout,
        )
        window = _sample_window(raw)
        if len(window.values) != self._sample_count:
            raise CalibrationStabilityError("sensor window has the wrong sample count")
        if window.range_percent > self._stability_limit_percent:
            raise CalibrationStabilityError(
                f"{entity.role} range exceeds the stability limit"
            )
        return window

    @staticmethod
    async def _set_number(session: Any, entity: BoundEntity, value: float) -> None:
        descriptor = entity.descriptor
        step = float(descriptor.info.step)
        await session.async_set_number(
            descriptor.key,
            value,
            device_id=descriptor.device_id,
            tolerance=step / 2,
        )

    @staticmethod
    def _validate_voltage_evidence(
        evidence: GainRunEvidence, trusted_voltage: float
    ) -> None:
        if any(
            not math.isclose(
                phase.reference_voltage, trusted_voltage, rel_tol=1e-6, abs_tol=0.01
            )
            or not math.isclose(phase.reference_current, 0.0, abs_tol=1e-6)
            for phase in evidence.phases
        ):
            raise CalibrationInvariantError(
                "voltage calibration log has unexpected reference values"
            )
        if any(
            phase.old_current_gain != phase.new_current_gain
            for phase in evidence.phases
        ):
            raise CalibrationInvariantError(
                "voltage calibration changed a current gain"
            )

    @staticmethod
    def _validate_current_evidence(
        evidence: GainRunEvidence,
        target_phase_index: int,
        raw_reference_current: float,
    ) -> None:
        for index, phase in enumerate(evidence.phases):
            expected_current = (
                raw_reference_current if index == target_phase_index else 0.0
            )
            if not math.isclose(phase.reference_voltage, 0.0, abs_tol=1e-6) or not (
                math.isclose(
                    phase.reference_current,
                    expected_current,
                    rel_tol=1e-6,
                    abs_tol=1e-4,
                )
            ):
                raise CalibrationInvariantError(
                    "current calibration log has unexpected reference values"
                )
            if phase.old_voltage_gain != phase.new_voltage_gain:
                raise CalibrationInvariantError(
                    "current calibration changed a voltage gain"
                )
            if (
                index != target_phase_index
                and phase.old_current_gain != phase.new_current_gain
            ):
                raise CalibrationInvariantError(
                    "current calibration changed a non-target current gain"
                )

    def _prepare_iteration(
        self,
        mac: str,
        operation: str,
        iteration: int,
        confirm_iteration: bool,
        *positive_values: float,
    ) -> int:
        if iteration < 1 or iteration > 3:
            raise ValueError("calibration permits at most three iterations")
        expected = self.sessions.next_calibration_iteration(mac, operation)
        if expected > 3:
            raise CalibrationIterationLimitError(
                "calibration permits at most three attempts for this operation"
            )
        if iteration != expected or (expected > 1 and not confirm_iteration):
            raise IterationConfirmationRequired(
                f"explicit confirmation is required for iteration {expected}"
            )
        if not _positive_finite(*positive_values):
            raise ValueError("calibration values must be finite and positive")
        return expected

    @staticmethod
    def _validate_binding_generation(session: Any, binding: MeterBinding) -> None:
        if int(session.connection_generation) != binding.connection_generation:
            raise CalibrationError("entity binding is stale after reconnect")

    @staticmethod
    def _rebind_after_reconnect(
        session: Any, binding: MeterBinding, substitutions: Mapping[str, str]
    ) -> MeterBinding:
        generation = int(session.connection_generation)
        if generation <= binding.connection_generation:
            raise CalibrationRebindError(
                "reconnect did not produce a fresh connection generation"
            )
        entities = tuple(getattr(session, "entities", ()))
        if not entities:
            raise CalibrationRebindError("reconnect returned no fresh entity metadata")
        if not substitutions:
            raise CalibrationRebindError(
                "authoritative substitutions are required to rebind entities"
            )
        try:
            catalog = EntityCatalog(entities, generation)
            rebound = binding.rebind(catalog, substitutions)
        except (EntityBindingError, EntityCatalogError) as error:
            raise CalibrationRebindError(
                "fresh entity metadata cannot be rebound safely"
            ) from error
        if rebound.connection_generation != generation:
            raise CalibrationRebindError("rebound entities use a stale generation")
        return rebound

    @staticmethod
    def _group(binding: MeterBinding, key: str) -> GroupBinding:
        for group in binding.groups:
            if group.key == key:
                return group
        raise ValueError(f"unknown calibration group {key}")

    @staticmethod
    def _channel_group(binding: MeterBinding, channel: int) -> tuple[GroupBinding, int]:
        if not 1 <= channel <= binding.topology.ct_count:
            raise ValueError("CT channel is outside the detected topology")
        role = f"ct{channel}.reference_current"
        for group in binding.groups:
            for index, reference in enumerate(group.current_references):
                if reference.role == role:
                    return group, index
        raise ValueError(f"CT{channel} is not bound")

    @staticmethod
    def _marker(channels: tuple[int, ...]) -> StoredInterruptedSession:
        return StoredInterruptedSession(
            "active",
            datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            channels,
        )

    def _next_sequence(self, mac: str) -> int:
        sequence = self._operation_sequences.get(mac, 0) + 1
        self._operation_sequences[mac] = sequence
        return sequence

    @staticmethod
    def _indeterminate_result(
        group: GroupBinding,
        channels: tuple[int, ...],
        iteration: int,
        before: tuple[SensorSampleWindow, ...],
        restore: dict[str, RestoreEvidence] | dict[str, object] | None,
        phase: str | None = None,
    ) -> CalibrationResult:
        return CalibrationResult(
            CalibrationState.INDETERMINATE,
            group.key,
            phase,
            channels,
            iteration,
            tuple(window.mean for window in before),
            (),
            (),
            None,
            restore,
            False,
        )


async def _discard_waiter(waiter: Awaitable[GainRunEvidence]) -> None:
    if isinstance(waiter, asyncio.Future) and not waiter.done():
        waiter.cancel()
    try:
        await waiter
    except BaseException:  # noqa: BLE001 - consume the owned waiter outcome
        return


def _register_disconnect_waiter(session: Any) -> asyncio.Future[Any]:
    """Create the disconnect future before dispatching native Restart."""
    factory = getattr(session, "expect_disconnect", None)
    if factory is not None:
        return asyncio.ensure_future(factory())

    async def wait_until_disconnected() -> None:
        while bool(getattr(session, "connected", False)):
            await asyncio.sleep(0.05)

    return asyncio.create_task(wait_until_disconnected())


async def _cancel_waiter(waiter: asyncio.Future[Any]) -> None:
    if not waiter.done():
        waiter.cancel()
    with suppress(BaseException):
        await waiter


def _require_connected_generation(session: Any, generation: int) -> None:
    if (
        not bool(getattr(session, "connected", False))
        or int(getattr(session, "connection_generation", -1)) != generation
    ):
        raise RestartVerificationError(
            "ESPHome session disconnected during restore verification"
        )


def _validate_restart_evidence(
    evidence: Mapping[str, object],
    expected: Mapping[str, PhaseGainTable],
    *,
    generation: int,
) -> None:
    missing = set(expected).difference(evidence)
    if missing:
        raise RestartVerificationError(
            "missing restore evidence for " + ", ".join(sorted(missing))
        )
    unexpected = set(evidence).difference(expected)
    if unexpected:
        raise RestartVerificationError(
            "unexpected restore evidence for " + ", ".join(sorted(unexpected))
        )
    for instance_id, expected_gains in expected.items():
        restored = evidence[instance_id]
        if not isinstance(restored, RestoreEvidence):
            raise RestartVerificationError(
                f"{instance_id}: restore evidence has an invalid shape"
            )
        if (
            restored.instance_id != instance_id
            or restored.connection_generation != generation
        ):
            raise RestartVerificationError(
                f"{instance_id}: restore evidence correlation does not match"
            )
        if restored.source != "flash" or not restored.register_verified:
            raise RestartVerificationError(
                f"{instance_id}: saved flash was not verified as authoritative"
            )
        if any(
            "spi" in line.casefold()
            and ("fail" in line.casefold() or "error" in line.casefold())
            for line in restored.matching_lines
        ):
            raise RestartVerificationError(
                f"{instance_id}: SPI restore verification failed"
            )
        if restored.phase_gains != expected_gains:
            raise RestartVerificationError(
                f"{instance_id}: restored gains do not exactly match expected gains"
            )


def _phase_gain_table(evidence: GainRunEvidence) -> PhaseGainTable:
    return (
        (evidence.phases[0].new_voltage_gain, evidence.phases[0].new_current_gain),
        (evidence.phases[1].new_voltage_gain, evidence.phases[1].new_current_gain),
        (evidence.phases[2].new_voltage_gain, evidence.phases[2].new_current_gain),
    )


def _same_topology_identity(left: MeterTopology, right: MeterTopology) -> bool:
    voltage_layouts = {left.voltage_layout, right.voltage_layout}
    return (
        left.addon_count == right.addon_count
        and left.project_name == right.project_name
        and left.connection_type == right.connection_type
        and (
            left.voltage_layout == right.voltage_layout
            or voltage_layouts == {"single", "standard"}
        )
    )


def _sample_window(raw: Any) -> SensorSampleWindow:
    if isinstance(raw, SensorSampleWindow):
        return raw
    try:
        states = tuple(raw)
        if any(
            bool(getattr(state, "missing_state", False))
            or bool(getattr(state, "unavailable", False))
            or getattr(state, "available", True) is False
            for state in states
        ):
            raise CalibrationStabilityError("sensor sample is unavailable")
        values = tuple(float(state.state) for state in states)
    except CalibrationStabilityError:
        raise
    except (AttributeError, TypeError, ValueError) as error:
        raise CalibrationStabilityError("sensor samples are invalid") from error
    if not values or not all(math.isfinite(value) for value in values):
        raise CalibrationStabilityError("sensor samples are invalid")
    mean = fmean(values)
    if not math.isfinite(mean) or mean == 0:
        raise CalibrationStabilityError("sensor window has zero mean")
    return SensorSampleWindow(
        values,
        tuple(float(index) for index in range(len(values))),
        mean,
        min(values),
        max(values),
        100.0 * (max(values) - min(values)) / abs(mean),
    )


def _instance_id(group_key: str) -> str:
    if group_key.startswith("main_"):
        return f"meter_main{group_key.removeprefix('main_')}"
    return group_key


def _channel_number(entity: BoundEntity) -> int:
    role = entity.role
    if not role.startswith("ct") or "." not in role:
        raise ValueError(f"invalid current-reference role {role}")
    return int(role[2 : role.index(".")])


def _new_log_lines(
    baseline: tuple[str, ...], current: tuple[str, ...]
) -> tuple[str, ...]:
    overlap = min(len(baseline), len(current))
    while overlap and baseline[-overlap:] != current[:overlap]:
        overlap -= 1
    return current[overlap:]


def _result_state(
    errors: tuple[float, ...], tolerance_percent: float
) -> CalibrationState:
    if max(errors) > tolerance_percent:
        return CalibrationState.RESULT_OUTSIDE_TOLERANCE
    return CalibrationState.APPLIED_PENDING_RESTART_VERIFICATION


def _error_percent(actual: float, expected: float) -> float:
    return 100.0 * abs(actual - expected) / expected


def _positive_finite(*values: float) -> bool:
    return all(math.isfinite(value) and value > 0 for value in values)
