"""Durable, topology-driven ATM90E32 voltage and current calibration."""

from __future__ import annotations

import asyncio
import math
from collections.abc import Awaitable, Callable, Mapping, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from statistics import fmean
from time import monotonic
from typing import Any, cast

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
from .models import StoredInterruptedSession
from .preflight import ReferenceZeroError, zero_reference_guard
from .session_manager import SessionManager
from .state_tracker import SensorSampleWindow

type MarkerWriter = Callable[[str, StoredInterruptedSession | None], Awaitable[None]]


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
    ) -> None:
        if sample_count < 1 or zero_concurrency < 1:
            raise ValueError("sample count and zero concurrency must be positive")
        if not _positive_finite(stability_limit_percent, evidence_timeout):
            raise ValueError("calibration limits must be finite and positive")
        self.sessions = sessions
        self._persist_interrupted = persist_interrupted
        self._sample_count = sample_count
        self._stability_limit_percent = stability_limit_percent
        self._zero_concurrency = zero_concurrency
        self._evidence_timeout = evidence_timeout
        self._operation_sequences: dict[str, int] = {}

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
        last_error: LogEvidenceError | None = None
        candidate: GainRunEvidence | None = None
        # Current firmware logs only failures after save/verify, not success.
        # Reparse until the full bounded window ends; silence is not a terminal.
        while monotonic() < deadline:
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
            try:
                parsed = parse_gain_run(
                    correlated,
                    connection_generation=generation,
                    operation_sequence=sequence,
                    target_instance_id=instance_id,
                    button_name=button_name,
                    dispatched_after=dispatched_after,
                )
            except LogEvidenceError as error:
                last_error = error
                candidate = None
            else:
                candidate = parsed
            await asyncio.sleep(0.05)
        if candidate is not None:
            return candidate
        if last_error is not None:
            raise last_error
        raise LogEvidenceError("gain evidence collection timed out")

    async def _wait_restore(
        self,
        session: Any,
        *,
        generation: int,
        expected_instance_ids: set[str],
        started_after: float,
        baseline: tuple[str, ...],
    ) -> dict[str, RestoreEvidence] | dict[str, object]:
        wait = getattr(session, "async_wait_for_restore", None)
        if wait is not None:
            return cast(
                dict[str, object],
                await wait(
                    connection_generation=generation,
                    expected_instance_ids=expected_instance_ids,
                    started_after=started_after,
                    timeout=self._evidence_timeout,
                ),
            )
        deadline = monotonic() + self._evidence_timeout
        last_error: LogEvidenceError | None = None
        while monotonic() < deadline:
            new_lines = _new_log_lines(baseline, tuple(session.log_lines))
            correlated = tuple(
                CalibrationLogLine(
                    generation, 0, started_after + (index + 1) * 1e-6, line
                )
                for index, line in enumerate(new_lines)
            )
            try:
                return parse_restore(
                    correlated,
                    connection_generation=generation,
                    expected_instance_ids=expected_instance_ids,
                    started_after=started_after,
                )
            except LogEvidenceError as error:
                last_error = error
            await asyncio.sleep(0.05)
        if last_error is not None:
            raise last_error
        raise LogEvidenceError("restore evidence timed out")

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
