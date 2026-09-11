"""Durable, topology-driven ATM90E32 voltage and current calibration."""

from __future__ import annotations

import asyncio
import math
import re
from collections.abc import Awaitable, Callable, Mapping, Sequence
from contextlib import suppress
from dataclasses import dataclass, replace
from datetime import UTC, datetime
from enum import StrEnum
from hashlib import sha256
from statistics import fmean
from time import monotonic
from typing import Any, Literal, cast
from uuid import uuid4

from .config_document import ESPHomeConfigDocument
from .device_builder import ESPHomeConfigSnapshot
from .entity_binding import (
    BoundEntity,
    EntityBindingError,
    GroupBinding,
    MeterBinding,
    OffsetControlBinding,
)
from .entity_catalog import EntityCatalog, EntityCatalogError
from .esphome_api import ESPHomeSessionDisconnectedError
from .log_parser import (
    CalibrationLogLine,
    GainRunEvidence,
    LogEvidenceError,
    OffsetClearEvidence,
    OffsetRunEvidence,
    PowerOffsetRunEvidence,
    RestoreEvidence,
    parse_gain_run,
    parse_offset_clear,
    parse_offset_run,
    parse_power_offset_run,
    parse_restore,
)
from .models import (
    MeterTopology,
    PhaseOffsetTable,
    PhasePowerOffsetTable,
    StoredInterruptedSession,
)
from .offset_readiness import OffsetReadinessStage, async_check_offset_readiness
from .offset_recovery import (
    ZERO_OFFSETS,
    OffsetRecovery,
    StockOffsetPreparation,
    _validate_source,
)
from .preflight import (
    ReferenceZeroError,
    validate_offset_controls,
    zero_reference_guard,
)
from .session_manager import CalibrationLease, PendingCalibrationOrigin, SessionManager
from .state_tracker import SensorSampleWindow
from .store import (
    PhaseGainTable,
    VerifiedCalibrationRecord,
    VerifiedGainGroup,
    VerifiedOffsetGroup,
    VerifiedPowerOffsetGroup,
)
from .topology import (
    topology_from_config,
    voltage_reference_fingerprint_for_meter,
    voltage_reference_topology_from_config,
)

DEFAULT_EVIDENCE_TIMEOUT = 35.0
_SUPPORTED_UPDATE_INTERVALS = frozenset((1, 2, 5, 10, 30, 60))

type MarkerWriter = Callable[[str, StoredInterruptedSession | None], Awaitable[None]]
type VerifiedWriter = Callable[[VerifiedCalibrationRecord], Awaitable[None]]
type CalibrationSnapshotReader = Callable[
    [str, MeterTopology], Awaitable[ESPHomeConfigSnapshot]
]
type TrustedVoltageFingerprintReader = Callable[
    [str, ESPHomeConfigDocument, MeterTopology], Awaitable[str | None]
]

_CONFIGURATION_ID = re.compile(r"[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml")


class CalibrationState(StrEnum):
    APPLIED_PENDING_RESTART_VERIFICATION = "applied_pending_restart_verification"
    RESULT_OUTSIDE_TOLERANCE = "result_outside_tolerance"
    INDETERMINATE = "indeterminate"


class OffsetCalibrationState(StrEnum):
    CAPTURED_PENDING_CONFIGURATION = "captured_pending_configuration"
    APPLIED_PENDING_RESTART_VERIFICATION = "applied_pending_restart_verification"
    PARTIAL = "partial"
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
class CalibrationTimingPolicy:
    """Bound calibration waits to the installed meter reporting interval."""

    update_interval_s: int
    sample_count: int

    def __post_init__(self) -> None:
        if (
            type(self.update_interval_s) is not int
            or self.update_interval_s not in _SUPPORTED_UPDATE_INTERVALS
            or type(self.sample_count) is not int
            or self.sample_count < 1
        ):
            raise ValueError("calibration timing inputs are invalid")

    @property
    def sensor_window_timeout_s(self) -> float:
        return max(35.0, self.update_interval_s * (self.sample_count + 1) + 5.0)

    @property
    def evidence_timeout_s(self) -> float:
        return max(35.0, self.update_interval_s * 2 + 15.0)


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
class OffsetCalibrationResult:
    state: OffsetCalibrationState
    board_index: int
    stage: OffsetReadinessStage
    expected_tables: tuple[tuple[str, PhaseOffsetTable | PhasePowerOffsetTable], ...]
    unfinished_group_keys: tuple[str, ...]
    retry_allowed: bool
    error: str | None = None


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
        evidence_timeout: float = DEFAULT_EVIDENCE_TIMEOUT,
        persist_verified: VerifiedWriter | None = None,
        restart_disconnect_timeout: float = 20.0,
        restart_restore_timeout: float = 120.0,
        restart_backoff_initial: float = 0.25,
        calibration_snapshot_reader: CalibrationSnapshotReader | None = None,
        trusted_voltage_fingerprint_reader: TrustedVoltageFingerprintReader
        | None = None,
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
        self._trusted_voltage_fingerprint_reader = trusted_voltage_fingerprint_reader
        self._operation_sequences: dict[str, int] = {}

    async def async_verify_after_restart(
        self,
        mac: str,
        session: Any,
        binding: MeterBinding,
        *,
        substitutions: Mapping[str, str],
    ) -> RestartVerificationResult:
        return await self._async_verify_after_restart(
            mac, session, binding, substitutions=substitutions, gains_only=False
        )

    async def async_verify_gains_after_restart(
        self,
        mac: str,
        session: Any,
        binding: MeterBinding,
        *,
        substitutions: Mapping[str, str],
    ) -> RestartVerificationResult:
        """Verify real gains while retaining strict offsets in their original owner."""
        return await self._async_verify_after_restart(
            mac, session, binding, substitutions=substitutions, gains_only=True
        )

    async def _async_verify_after_restart(
        self,
        mac: str,
        session: Any,
        binding: MeterBinding,
        *,
        substitutions: Mapping[str, str],
        gains_only: bool,
    ) -> RestartVerificationResult:
        """Restart once and persist only exact flash evidence for changed groups."""
        if self._persist_verified is None:
            raise RestartVerificationError("verified calibration persistence is absent")
        lease = await self.sessions.async_acquire_calibration(mac)
        claimed = None
        consumed = False
        try:
            try:
                if self.sessions.pending_calibration(lease.mac) is None:
                    raise RuntimeError("server-owned calibration origin is missing")
                await self._calibration_origin(lease, session, binding)
                pending = self.sessions.claim_calibration_origin(
                    lease, session, binding
                )
                claimed = pending
            except RuntimeError as error:
                raise RestartVerificationError(
                    "server-owned calibration origin is missing"
                ) from error
            expected_gains = pending.expected_phase_gains
            if gains_only and not expected_gains:
                raise RestartVerificationError(
                    "server-owned gain calibration is missing"
                )
            expected_offsets = {} if gains_only else pending.expected_phase_offsets
            expected_power_offsets = (
                {} if gains_only else pending.expected_phase_power_offsets
            )
            expected_instance_ids = (
                set(expected_gains)
                | set(expected_offsets)
                | set(expected_power_offsets)
            )
            expected_categories: dict[
                str, set[Literal["gain", "offset", "power_offset"]]
            ] = {instance_id: set() for instance_id in expected_instance_ids}
            for instance_id in expected_gains:
                expected_categories[instance_id].add("gain")
            for instance_id in expected_offsets:
                expected_categories[instance_id].add("offset")
            for instance_id in expected_power_offsets:
                expected_categories[instance_id].add("power_offset")
            try:
                groups = tuple(
                    VerifiedGainGroup(instance_id, gains)
                    for instance_id, gains in expected_gains.items()
                )
                offset_groups = tuple(
                    VerifiedOffsetGroup(instance_id, offsets)
                    for instance_id, offsets in expected_offsets.items()
                )
                power_offset_groups = tuple(
                    VerifiedPowerOffsetGroup(instance_id, offsets)
                    for instance_id, offsets in expected_power_offsets.items()
                )
            except ValueError as error:
                raise RestartVerificationError(
                    "server-owned expected calibration table is invalid"
                ) from error
            self._validate_binding_generation(session, binding)
            if unknown := expected_instance_ids.difference(
                _instance_id(group.key) for group in binding.groups
            ):
                raise RestartVerificationError(
                    "changed calibration group is outside the bound topology: "
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
            operation_sequence = self._next_sequence(lease.mac)
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
                    expected_instance_ids=expected_instance_ids,
                    expected_categories=expected_categories,
                    operation_sequence=operation_sequence,
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
                expected_gains,
                expected_offsets,
                expected_power_offsets,
                generation=generation,
            )
            _require_connected_generation(session, generation)
            rebound = self._rebind_after_reconnect(session, binding, substitutions)
            record = VerifiedCalibrationRecord(
                mac=pending.mac,
                config_filename=pending.config_filename,
                config_sha256=pending.config_sha256,
                topology_addon_count=pending.topology.addon_count,
                topology_project_name=pending.topology.project_name,
                topology_connection_type=pending.topology.connection_type,
                topology_voltage_layout=pending.topology.voltage_layout,
                topology_voltage_fingerprint=pending.voltage_topology_fingerprint,
                connection_generation=generation,
                groups=groups,
                verification_id=uuid4().hex,
                offset_groups=offset_groups,
                power_offset_groups=power_offset_groups,
                source_handoff_available=(
                    pending.config_filename is not None
                    and bool(groups)
                    and not offset_groups
                    and not power_offset_groups
                ),
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
                    if gains_only:
                        self.sessions.consume_calibration_gains(
                            lease, pending.operation_id, pending.revision
                        )
                    else:
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
        """Revalidate the authoritative source before each leased mutation."""
        pending = self.sessions.calibration_origin_for_update(lease, session, binding)
        if self._calibration_snapshot_reader is None:
            if pending is not None:
                if (
                    pending.config_filename is not None
                    or pending.config_sha256 is not None
                ):
                    raise ValueError("calibration source authority changed")
                return pending
            return self.sessions._begin_calibration_origin(
                lease, session, binding, None
            )
        snapshot = await self._calibration_snapshot_reader(lease.mac, binding.topology)
        if (
            not isinstance(snapshot, ESPHomeConfigSnapshot)
            or sha256(snapshot.content.encode()).hexdigest() != snapshot.sha256
        ):
            raise ValueError("authoritative configuration hash is invalid")
        if _CONFIGURATION_ID.fullmatch(snapshot.configuration) is None:
            raise ValueError("authoritative configuration filename is invalid")
        document = ESPHomeConfigDocument.parse(snapshot.content)
        try:
            source_topology = topology_from_config(
                document,
                native_project_name=binding.topology.project_name,
            )
        except ValueError as error:
            raise ValueError(
                "authoritative configuration topology is invalid"
            ) from error
        trusted_voltage_fingerprint = (
            await self._trusted_voltage_fingerprint_reader(
                lease.mac, document, source_topology
            )
            if self._trusted_voltage_fingerprint_reader is not None
            else None
        )
        source_voltage_fingerprint = voltage_reference_topology_from_config(
            document,
            source_topology,
            trusted_fingerprint=trusted_voltage_fingerprint,
        ).fingerprint
        if not _same_topology_identity(source_topology, binding.topology):
            raise ValueError(
                "authoritative configuration topology does not match the session"
            )
        if pending is not None:
            if (
                snapshot.configuration != pending.config_filename
                or snapshot.sha256 != pending.config_sha256
                or not _same_topology_identity(source_topology, pending.topology)
                or (
                    pending.voltage_topology_fingerprint
                    or voltage_reference_fingerprint_for_meter(source_topology)
                )
                != source_voltage_fingerprint
            ):
                raise ValueError(
                    "authoritative configuration changed since calibration began"
                )
            return pending
        return self.sessions._begin_calibration_origin(
            lease, session, binding, snapshot, source_voltage_fingerprint
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

    async def async_calibrate_offset_board(
        self,
        mac: str,
        session: Any,
        binding: MeterBinding,
        board_index: int,
        stage: OffsetReadinessStage,
        *,
        confirm_retry: bool = False,
        timing_policy: CalibrationTimingPolicy | None = None,
    ) -> OffsetCalibrationResult:
        """Run one offset stage for both chips on a selected board."""
        if stage not in (1, 2):
            raise ValueError("offset calibration stage must be 1 or 2")
        if board_index < 0:
            raise ValueError("board_index must be non-negative")
        issues = validate_offset_controls(binding)
        if issues:
            raise CalibrationError(
                "offset controls are not ready: "
                + "; ".join(issue.detail for issue in issues)
            )
        self._validate_binding_generation(session, binding)
        start = board_index * 2
        groups = binding.groups[start : start + 2]
        controls = binding.offset_capability.controls[start : start + 2]
        if len(groups) != 2 or len(controls) != 2:
            raise ValueError("selected board must contain two meter groups")
        selected = tuple(
            (group, control, _instance_id(group.key))
            for group, control in zip(groups, controls, strict=True)
        )
        operation = f"offset:{board_index}:{stage}"
        lease = await self.sessions.async_acquire_calibration(mac)
        try:
            mac = lease.mac
            origin = self.sessions.calibration_origin_for_update(
                lease, session, binding
            )
            if origin is not None:
                origin = await self._calibration_origin(lease, session, binding)
            expected = _pending_offset_tables(origin, stage)
            if stage == 2 and not all(
                origin is not None and instance_id in origin.expected_phase_offsets
                for _, _, instance_id in selected
            ):
                raise CalibrationError(
                    "Stage 1 offset calibration must complete for both selected chips"
                )
            if all(instance_id in expected for _, _, instance_id in selected):
                return _offset_result(
                    OffsetCalibrationState.APPLIED_PENDING_RESTART_VERIFICATION,
                    board_index,
                    stage,
                    selected,
                    expected,
                )
            attempt = self.sessions.next_calibration_iteration(mac, operation)
            if attempt > 1 and not confirm_retry:
                raise CalibrationError("explicit confirmation is required for retry")
            readiness = await async_check_offset_readiness(
                session,
                binding,
                board_index,
                stage,
                timeout=self._sensor_timeout(timing_policy),
            )
            if (
                not readiness.ready
                or readiness.connection_generation != binding.connection_generation
                or readiness.stage != stage
            ):
                detail = "; ".join(readiness.reasons) or "evidence correlation changed"
                raise CalibrationError(f"offset readiness failed: {detail}")
            if origin is None:
                origin = await self._calibration_origin(lease, session, binding)
            if origin is None:
                raise CalibrationInvariantError("calibration origin is absent")
            channels = tuple(
                _channel_number(reference)
                for group, _, _ in selected
                for reference in group.current_references
            )
            await self._persist_interrupted(mac, self._marker(channels))
            generation = readiness.connection_generation
            self._validate_offset_generation(session, generation)
            self.sessions.record_calibration_iteration(mac, operation, attempt)
            zeroer = _BoundZeroer(self, binding, {})
            async with zero_reference_guard(zeroer, session):
                for group, control, instance_id in selected:
                    if instance_id in expected:
                        continue
                    button = (
                        control.run_offset if stage == 1 else control.run_power_offset
                    )
                    try:
                        evidence = await self._run_offset(
                            mac,
                            session,
                            button,
                            instance_id,
                            stage,
                            generation,
                            timing_policy,
                        )
                    except Exception as error:  # noqa: BLE001 - typed partial result
                        state = (
                            OffsetCalibrationState.PARTIAL
                            if any(
                                selected_id in expected
                                for _, _, selected_id in selected
                            )
                            else OffsetCalibrationState.INDETERMINATE
                        )
                        return _offset_result(
                            state,
                            board_index,
                            stage,
                            selected,
                            expected,
                            error=str(error) or type(error).__name__,
                        )
                    table = _offset_table(evidence)
                    origin = self.sessions.record_offset_calibration_group(
                        lease,
                        origin.operation_id,
                        origin.revision,
                        session,
                        binding,
                        instance_id,
                        stage,
                        table,
                    )
                    expected[instance_id] = table
            return _offset_result(
                OffsetCalibrationState.APPLIED_PENDING_RESTART_VERIFICATION,
                board_index,
                stage,
                selected,
                expected,
            )
        finally:
            lease.release()

    async def async_calibrate_prepared_offset_board(
        self,
        mac: str,
        session: Any,
        binding: MeterBinding,
        board_index: int,
        preparation: StockOffsetPreparation,
        recovery: OffsetRecovery,
        *,
        source_reader: Callable[[], Awaitable[ESPHomeConfigSnapshot]],
        claim_guard: Callable[[], None] = lambda: None,
        timing_policy: CalibrationTimingPolicy | None = None,
    ) -> OffsetCalibrationResult:
        """Capture stock candidates only through an installed, backed-up preparation.

        No runtime clear authorization survives this leased call. Failed or cancelled
        attempts require a new reviewed preparation, never an automatic retry.
        """
        self._validate_binding_generation(session, binding)
        if validate_offset_controls(binding):
            raise CalibrationError("offset controls are not ready")
        if (
            type(board_index) is not int
            or not 0 <= board_index < binding.topology.board_count
        ):
            raise ValueError("invalid offset board")
        stage = preparation.stage
        start = board_index * 2
        selected = tuple(
            (group, control, _instance_id(group.key))
            for group, control in zip(
                binding.groups[start : start + 2],
                binding.offset_capability.controls[start : start + 2],
                strict=True,
            )
        )
        if not set(preparation.targets) <= {item[2] for item in selected}:
            raise ValueError("preparation targets changed")
        lease = await self.sessions.async_acquire_calibration(mac)
        try:
            generation = binding.connection_generation

            async def read_snapshot(
                instance: str, offset_stage: OffsetReadinessStage
            ) -> Any:
                try:
                    snapshots = await session.async_offset_table_snapshot(
                        {instance}, offset_stage=offset_stage
                    )
                    return snapshots.get(instance)
                except Exception:  # noqa: BLE001 - never reflect native logs from failed snapshots
                    raise CalibrationError(
                        "fresh saved offset tables are unavailable"
                    ) from None

            async def reconcile() -> ESPHomeConfigSnapshot:
                claim_guard()
                _require_connected_generation(session, generation)
                record = await recovery.async_require(
                    lease, preparation, installed=True
                )
                if replace(record.topology, evidence=()) != replace(
                    binding.topology, evidence=()
                ):
                    raise ValueError("preparation topology changed")
                try:
                    source = await source_reader()
                    _validate_source(source, binding.topology)
                except Exception:  # noqa: BLE001 - source transport/parser may contain private YAML
                    raise CalibrationError(
                        "authoritative preparation source is unavailable"
                    ) from None
                if (
                    source.configuration != record.original.configuration
                    or source.sha256 != preparation.proposed_sha256
                ):
                    raise ValueError("preparation source changed")
                claim_guard()
                _require_connected_generation(session, generation)
                return source

            source = await reconcile()
            record = await recovery.async_require(lease, preparation, installed=True)
            expected = {
                item.instance_id: item.phase_values
                for item in record.results
                if item.stage == stage
            }
            pending = self.sessions.pending_calibration(mac)
            if pending is not None:
                expected.update(_pending_offset_tables(pending, stage))
            unfinished = {
                instance for _, _, instance in selected if instance not in expected
            }
            if unfinished != set(preparation.targets) - set(expected):
                raise ValueError("preparation does not cover unfinished chips")
            if unfinished.intersection(record.attempted):
                raise ValueError(
                    "offset chip already attempted; new preparation required"
                )
            for completed in record.results:
                observed = await read_snapshot(completed.instance_id, completed.stage)
                if observed is None and completed.phase_values == ZERO_OFFSETS:
                    # Stock cannot restore-prove an all-zero table. Retain the
                    # candidate for configuration handoff; never clear/rerun it.
                    continue
                if (
                    observed is None
                    or observed.phase_values != completed.phase_values
                    or observed.connection_generation != generation
                    or observed.instance_id != completed.instance_id
                    or observed.offset_stage != completed.stage
                ):
                    raise ValueError(
                        "completed offset candidate needs device reconciliation"
                    )
            stage_one = {item.instance_id for item in record.results if item.stage == 1}
            if pending is not None:
                stage_one.update(pending.expected_phase_offsets)
            if stage == 2 and not {item[2] for item in selected} <= stage_one:
                raise ValueError("Stage 1 must complete for both selected chips")
            for _, _, instance in selected:
                if instance not in unfinished:
                    continue
                snapshot = await read_snapshot(instance, stage)
                if (
                    snapshot is None
                    or snapshot.connection_generation != generation
                    or snapshot.instance_id != instance
                    or snapshot.offset_stage != stage
                ):
                    raise ValueError("fresh saved offset table is unavailable")
                source = await reconcile()
                await recovery.async_backup(
                    lease, source, binding.topology, (snapshot,)
                )
            # The fresh source receipt is the only permitted origin rebase.
            if pending is not None:
                self.sessions.rebind_prepared_calibration(
                    lease, session, binding, source, record
                )
            readiness = await async_check_offset_readiness(
                session,
                binding,
                board_index,
                stage,
                timeout=self._sensor_timeout(timing_policy),
            )
            if not readiness.ready or readiness.connection_generation != generation:
                raise CalibrationError("offset physical readiness failed")
            if unfinished:
                await self._persist_interrupted(
                    mac,
                    self._marker(
                        tuple(
                            _channel_number(ref)
                            for group, _, instance in selected
                            if instance in unfinished
                            for ref in group.current_references
                        )
                    ),
                )
            async with zero_reference_guard(_BoundZeroer(self, binding, {}), session):
                for _, control, instance in selected:
                    if instance not in unfinished:
                        continue
                    try:
                        await reconcile()
                        await recovery.async_begin_attempt(lease, preparation, instance)
                        await reconcile()
                        clear = await self._prepared_offset_action(
                            mac,
                            session,
                            control.restore_offset
                            if stage == 1
                            else control.restore_power_offset,
                            instance,
                            stage,
                            generation,
                            clear=True,
                            timing_policy=timing_policy,
                        )
                        if (
                            not isinstance(clear, OffsetClearEvidence)
                            or clear.phase_values != ZERO_OFFSETS
                        ):
                            raise CalibrationInvariantError(
                                "clear did not report exact zero offsets"
                            )
                        # no_stored is a no-op, never a flash erase/readback assertion.
                        await reconcile()
                        readiness = await async_check_offset_readiness(
                            session,
                            binding,
                            board_index,
                            stage,
                            timeout=self._sensor_timeout(timing_policy),
                        )
                        if (
                            not readiness.ready
                            or readiness.connection_generation != generation
                        ):
                            raise CalibrationError(
                                "offset physical readiness changed after clear"
                            )
                        await reconcile()
                        evidence = await self._prepared_offset_action(
                            mac,
                            session,
                            control.run_offset
                            if stage == 1
                            else control.run_power_offset,
                            instance,
                            stage,
                            generation,
                            clear=False,
                            timing_policy=timing_policy,
                        )
                        if (
                            not isinstance(
                                evidence, (OffsetRunEvidence, PowerOffsetRunEvidence)
                            )
                            or not evidence.flash_saved
                        ):
                            raise CalibrationInvariantError("offset save is absent")
                        await reconcile()
                        table = _offset_table(evidence)
                        await recovery.async_capture_result(
                            lease,
                            preparation,
                            instance,
                            table,
                            generation,
                            evidence.register_verified,
                        )
                        expected[instance] = table
                    except Exception:  # noqa: BLE001 - return no raw device/storage errors
                        return replace(
                            _offset_result(
                                OffsetCalibrationState.PARTIAL
                                if any(item[2] in expected for item in selected)
                                else OffsetCalibrationState.INDETERMINATE,
                                board_index,
                                stage,
                                selected,
                                expected,
                                error="stock offset action is indeterminate; retained recovery required",
                            ),
                            retry_allowed=False,
                        )
            return replace(
                _offset_result(
                    OffsetCalibrationState.CAPTURED_PENDING_CONFIGURATION,
                    board_index,
                    stage,
                    selected,
                    expected,
                ),
                retry_allowed=False,
            )
        finally:
            lease.release()

    async def _prepared_offset_action(
        self,
        mac: str,
        session: Any,
        button: BoundEntity,
        instance: str,
        stage: OffsetReadinessStage,
        generation: int,
        *,
        clear: bool,
        timing_policy: CalibrationTimingPolicy | None,
    ) -> OffsetClearEvidence | OffsetRunEvidence | PowerOffsetRunEvidence:
        """Accumulate a bounded continuous ring window; parse only at its end."""
        sequence = self._next_sequence(mac)
        previous = tuple(session.log_lines)
        dispatched_after = monotonic()
        captured: list[CalibrationLogLine] = []
        size = 0
        _require_connected_generation(session, generation)
        await session.async_press_button(
            button.descriptor.key, device_id=button.descriptor.device_id
        )
        deadline = monotonic() + self._evidence_timeout_for(timing_policy)
        while True:
            _require_connected_generation(session, generation)
            current = tuple(session.log_lines)
            if current[: len(previous)] == previous:
                additions = current[len(previous) :]
            else:
                overlaps = [
                    count
                    for count in range(1, min(len(previous), len(current)) + 1)
                    if previous[-count:] == current[:count]
                ]
                if len(overlaps) != 1:
                    raise CalibrationInvariantError("offset log continuity was lost")
                additions = current[overlaps[0] :]
            for line in additions:
                size += len(line.encode())
                if len(captured) >= 4096 or size > 512 * 1024:
                    raise CalibrationInvariantError(
                        "offset observation window overflowed"
                    )
                captured.append(
                    CalibrationLogLine(generation, sequence, monotonic(), line)
                )
            previous = current
            remaining = deadline - monotonic()
            if remaining <= 0:
                break
            await asyncio.sleep(min(0.005, remaining))
        if clear:
            return parse_offset_clear(
                captured,
                offset_stage=stage,
                connection_generation=generation,
                operation_sequence=sequence,
                target_instance_id=instance,
                button_name=button.descriptor.name,
                dispatched_after=dispatched_after,
            )
        parser = parse_offset_run if stage == 1 else parse_power_offset_run
        return parser(
            captured,
            allow_unverified=True,
            connection_generation=generation,
            operation_sequence=sequence,
            target_instance_id=instance,
            button_name=button.descriptor.name,
            dispatched_after=dispatched_after,
        )

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
        timing_policy: CalibrationTimingPolicy | None = None,
    ) -> CalibrationResult:
        return (
            await self.async_calibrate_voltages(
                mac,
                session,
                binding,
                ((group_key, trusted_voltage, iteration),),
                tolerance_percent,
                confirm_iteration=confirm_iteration,
                substitutions=substitutions,
                timing_policy=timing_policy,
            )
        )[0]

    async def async_calibrate_voltages(
        self,
        mac: str,
        session: Any,
        binding: MeterBinding,
        references: tuple[tuple[str, float, int], ...],
        tolerance_percent: float,
        *,
        confirm_iteration: bool = False,
        substitutions: Mapping[str, str] | None = None,
        timing_policy: CalibrationTimingPolicy | None = None,
    ) -> tuple[CalibrationResult, ...]:
        if not references:
            raise ValueError("voltage calibration requires at least one group")
        groups = tuple(self._group(binding, item[0]) for item in references)
        if len({group.key for group in groups}) != len(groups):
            raise ValueError("voltage calibration groups must be unique")
        attempts = tuple(
            self._prepare_iteration(
                mac,
                f"voltage:{group_key}",
                iteration,
                confirm_iteration,
                trusted_voltage,
                tolerance_percent,
            )
            for group_key, trusted_voltage, iteration in references
        )
        self._validate_binding_generation(session, binding)
        channels_by_group = tuple(
            tuple(_channel_number(entity) for entity in group.current_references)
            for group in groups
        )
        changed_channels = tuple(channel for channels in channels_by_group for channel in channels)
        lease = await self.sessions.async_acquire_calibration(mac)
        try:
            mac = lease.mac
            origin = await self._calibration_origin(lease, session, binding)
            marker = self._marker(changed_channels)
            await self._persist_interrupted(mac, marker)
            for (group_key, _reference, _iteration), attempt in zip(
                references, attempts, strict=True
            ):
                self.sessions.record_calibration_iteration(
                    mac, f"voltage:{group_key}", attempt
                )
            zeroer = _BoundZeroer(self, binding, dict(substitutions or {}))
            async with zero_reference_guard(zeroer, session):
                await asyncio.gather(
                    *(
                        self._set_number(session, group.voltage_reference, reference)
                        for group, (_key, reference, _iteration) in zip(
                            groups, references, strict=True
                        )
                    )
                )
                gain_runs = await self._run_gains(
                    mac, session, groups, zeroer, timing_policy
                )
                if any(evidence is not None and evidence.flash_saved for evidence, _ in gain_runs):
                    await self._persist_interrupted(
                        mac, replace(marker, state="flash_saved")
                    )
                results: list[CalibrationResult] = []
                for group, (_key, trusted_voltage, _iteration), attempt, channels, (
                    evidence,
                    restore,
                ) in zip(
                    groups,
                    references,
                    attempts,
                    channels_by_group,
                    gain_runs,
                    strict=True,
                ):
                    if evidence is None:
                        results.append(
                            self._indeterminate_result(
                                group, channels, attempt, (), restore
                            )
                        )
                        continue
                    self._validate_voltage_evidence(evidence, trusted_voltage)
                    before = tuple(
                        phase.measured_voltage for phase in evidence.phases
                    )
                    after = tuple(
                        _projected_value(
                            phase.measured_voltage,
                            phase.old_voltage_gain,
                            phase.new_voltage_gain,
                        )
                        for phase in evidence.phases
                    )
                    errors = tuple(
                        _error_percent(value, trusted_voltage) for value in after
                    )
                    state = _result_state(errors, tolerance_percent)
                    if origin is not None and state is CalibrationState.APPLIED_PENDING_RESTART_VERIFICATION:
                        origin = self.sessions.record_calibration_group(
                            lease,
                            origin.operation_id,
                            origin.revision,
                            session,
                            binding,
                            evidence.instance_id,
                            _phase_gain_table(evidence),
                        )
                    results.append(
                        CalibrationResult(
                            state,
                            group.key,
                            None,
                            channels,
                            attempt,
                            before,
                            after,
                            errors,
                            evidence,
                            None,
                            max(errors) > tolerance_percent and attempt < 3,
                        )
                    )
                return tuple(results)
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
        timing_policy: CalibrationTimingPolicy | None = None,
    ) -> CalibrationResult:
        return await self.async_calibrate_currents(
            mac,
            session,
            binding,
            ((channel, trusted_current, reporting_multiplier),),
            tolerance_percent,
            iteration=iteration,
            confirm_iteration=confirm_iteration,
            substitutions=substitutions,
            timing_policy=timing_policy,
        )

    async def async_calibrate_currents(
        self,
        mac: str,
        session: Any,
        binding: MeterBinding,
        references: tuple[tuple[int, float, float], ...],
        tolerance_percent: float,
        *,
        iteration: int = 1,
        confirm_iteration: bool = False,
        substitutions: Mapping[str, str] | None = None,
        timing_policy: CalibrationTimingPolicy | None = None,
    ) -> CalibrationResult:
        if not 1 <= len(references) <= 3:
            raise ValueError("current calibration requires one to three references")
        channels = tuple(item[0] for item in references)
        if len(set(channels)) != len(channels):
            raise ValueError("current calibration channels must be unique")
        bound_channels = tuple(
            self._channel_group(binding, channel) for channel in channels
        )
        group = bound_channels[0][0]
        if any(bound_group.key != group.key for bound_group, _ in bound_channels):
            raise ValueError(
                "current calibration channels must share one ATM90E32 chip"
            )
        phase_indices = tuple(index for _, index in bound_channels)
        operation = "current:" + ",".join(str(channel) for channel in channels)
        attempt = self._prepare_iteration(
            mac,
            operation,
            iteration,
            confirm_iteration,
            *(value for item in references for value in item[1:]),
            tolerance_percent,
        )
        self._validate_binding_generation(session, binding)
        lease = await self.sessions.async_acquire_calibration(mac)
        try:
            mac = lease.mac
            origin = await self._calibration_origin(lease, session, binding)
            marker = self._marker(channels)
            await self._persist_interrupted(mac, marker)
            self.sessions.record_calibration_iteration(mac, operation, attempt)
            zeroer = _BoundZeroer(self, binding, dict(substitutions or {}))
            async with zero_reference_guard(zeroer, session):
                raw_references: dict[int, float] = {}
                multipliers: dict[int, float] = {}
                trusted: dict[int, float] = {}
                for (channel, trusted_current, multiplier), phase_index in zip(
                    references, phase_indices, strict=True
                ):
                    raw_references[phase_index] = trusted_current / multiplier
                    multipliers[phase_index] = multiplier
                    trusted[phase_index] = trusted_current
                    await self._set_number(
                        session,
                        group.current_references[phase_index],
                        raw_references[phase_index],
                    )
                evidence, restore = await self._run_gain(
                    mac,
                    session,
                    group,
                    _instance_id(group.key),
                    zeroer,
                    timing_policy,
                )
                phase = "ABC"[phase_indices[0]] if len(phase_indices) == 1 else None
                if evidence is None:
                    return self._indeterminate_result(
                        group, channels, attempt, (), restore, phase
                    )
                if evidence.flash_saved:
                    await self._persist_interrupted(
                        mac, replace(marker, state="flash_saved")
                    )
                self._validate_current_evidence(evidence, raw_references)
                before = tuple(
                    evidence.phases[index].measured_current * multipliers[index]
                    for index in phase_indices
                )
                after = tuple(
                    _projected_value(
                        evidence.phases[index].measured_current,
                        evidence.phases[index].old_current_gain,
                        evidence.phases[index].new_current_gain,
                        multipliers[index],
                    )
                    for index in phase_indices
                )
                errors = tuple(
                    _error_percent(value, trusted[index])
                    for value, index in zip(after, phase_indices, strict=True)
                )
                state = _result_state(errors, tolerance_percent)
                if (
                    origin is not None
                    and state is CalibrationState.APPLIED_PENDING_RESTART_VERIFICATION
                ):
                    self.sessions.record_calibration_group(
                        lease,
                        origin.operation_id,
                        origin.revision,
                        session,
                        binding,
                        evidence.instance_id,
                        _phase_gain_table(evidence),
                    )
                return CalibrationResult(
                    state,
                    group.key,
                    phase,
                    channels,
                    attempt,
                    before,
                    after,
                    errors,
                    evidence,
                    None,
                    max(errors) > tolerance_percent and attempt < 3,
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
            mac = lease.mac
            if self.sessions.pending_calibration(mac) is not None:
                await self._calibration_origin(lease, session, binding)
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
        timing_policy: CalibrationTimingPolicy | None = None,
    ) -> tuple[
        GainRunEvidence | None,
        dict[str, RestoreEvidence] | dict[str, object] | None,
    ]:
        return (await self._run_gains(mac, session, (group,), zeroer, timing_policy))[0]

    async def _run_gains(
        self,
        mac: str,
        session: Any,
        groups: tuple[GroupBinding, ...],
        zeroer: _BoundZeroer,
        timing_policy: CalibrationTimingPolicy | None = None,
    ) -> tuple[
        tuple[
            GainRunEvidence | None,
            dict[str, RestoreEvidence] | dict[str, object] | None,
        ],
        ...,
    ]:
        generation = int(session.connection_generation)
        runs = tuple(
            (
                group,
                _instance_id(group.key),
                self._next_sequence(mac),
                monotonic(),
            )
            for group in groups
        )
        waiters = tuple(
            self._gain_waiter(
                session,
                generation=generation,
                sequence=sequence,
                instance_id=instance_id,
                button_name=group.run_gain.descriptor.name,
                dispatched_after=dispatched_after,
                timeout=self._evidence_timeout_for(timing_policy),
            )
            for group, instance_id, sequence, dispatched_after in runs
        )
        try:
            await asyncio.gather(
                *(
                    session.async_press_button(
                        group.run_gain.descriptor.key,
                        device_id=group.run_gain.descriptor.device_id,
                    )
                    for group in groups
                )
            )
        except BaseException:
            await asyncio.gather(*(_discard_waiter(waiter) for waiter in waiters))
            raise
        try:
            evidence_items = tuple(await asyncio.gather(*waiters))
        except ESPHomeSessionDisconnectedError:
            await asyncio.gather(*(_discard_waiter(waiter) for waiter in waiters))
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
                expected_instance_ids={
                    instance_id for _group, instance_id, _sequence, _after in runs
                },
                expected_categories={
                    instance_id: {"gain"}
                    for _group, instance_id, _sequence, _after in runs
                },
                operation_sequence=self._next_sequence(mac),
                started_after=restore_started,
                baseline=baseline,
                timeout=self._evidence_timeout_for(timing_policy),
            )
            return tuple((None, restore) for _group in groups)
        except BaseException:
            await asyncio.gather(*(_discard_waiter(waiter) for waiter in waiters))
            raise
        results = []
        for evidence, (_group, instance_id, sequence, _after) in zip(
            evidence_items, runs, strict=True
        ):
            if evidence.instance_id != instance_id:
                raise CalibrationInvariantError("gain evidence is for another instance")
            if evidence.connection_generation != generation or evidence.operation_sequence != sequence:
                raise CalibrationInvariantError("gain evidence correlation does not match")
            if not evidence.immediate_apply_acceptable:
                raise CalibrationInvariantError("gain save or register verification failed")
            results.append((evidence, None))
        return tuple(results)

    async def _run_offset(
        self,
        mac: str,
        session: Any,
        button: BoundEntity,
        instance_id: str,
        stage: OffsetReadinessStage,
        generation: int,
        timing_policy: CalibrationTimingPolicy | None = None,
    ) -> OffsetRunEvidence | PowerOffsetRunEvidence:
        self._validate_offset_generation(session, generation)
        sequence = self._next_sequence(mac)
        dispatched_after = monotonic()
        waiter = self._offset_waiter(
            session,
            generation=generation,
            sequence=sequence,
            instance_id=instance_id,
            button_name=button.descriptor.name,
            dispatched_after=dispatched_after,
            stage=stage,
            timeout=self._evidence_timeout_for(timing_policy),
        )
        try:
            self._validate_offset_generation(session, generation)
            await session.async_press_button(
                button.descriptor.key, device_id=button.descriptor.device_id
            )
        except BaseException:
            await _discard_waiter(waiter)
            raise
        try:
            evidence = await waiter
        except asyncio.CancelledError:
            await _discard_waiter(waiter)
            raise
        expected_type = OffsetRunEvidence if stage == 1 else PowerOffsetRunEvidence
        if not isinstance(evidence, expected_type):
            raise CalibrationInvariantError("offset evidence has the wrong stage")
        if evidence.instance_id != instance_id:
            raise CalibrationInvariantError("offset evidence is for another instance")
        if (
            evidence.connection_generation != generation
            or evidence.operation_sequence != sequence
        ):
            raise CalibrationInvariantError(
                "offset evidence correlation does not match"
            )
        if not evidence.flash_saved or not evidence.register_verified:
            raise CalibrationInvariantError(
                "offset save or register verification failed"
            )
        return evidence

    @staticmethod
    def _validate_offset_generation(session: Any, generation: int) -> None:
        if int(session.connection_generation) != generation:
            raise CalibrationError("offset readiness is stale after reconnect")

    def _offset_waiter(
        self,
        session: Any,
        *,
        generation: int,
        sequence: int,
        instance_id: str,
        button_name: str,
        dispatched_after: float,
        stage: OffsetReadinessStage,
        timeout: float | None = None,
    ) -> Awaitable[OffsetRunEvidence | PowerOffsetRunEvidence]:
        factory_name = "expect_offset_run" if stage == 1 else "expect_power_offset_run"
        expect = getattr(session, factory_name, None)
        if expect is not None:
            evidence = expect(
                connection_generation=generation,
                operation_sequence=sequence,
                target_instance_id=instance_id,
                button_name=button_name,
                dispatched_after=dispatched_after,
            )

            async def wait_for_evidence() -> OffsetRunEvidence | PowerOffsetRunEvidence:
                try:
                    async with asyncio.timeout(
                        self._evidence_timeout if timeout is None else timeout
                    ):
                        return await evidence
                finally:
                    if isinstance(evidence, asyncio.Future) and not evidence.done():
                        evidence.cancel()

            waiter = asyncio.create_task(wait_for_evidence())
            if isinstance(evidence, asyncio.Future):
                waiter.add_done_callback(
                    lambda _task: evidence.cancel()
                    if _task.cancelled() and not evidence.done()
                    else None
                )
            return waiter
        baseline = tuple(getattr(session, "log_lines", ()))
        return asyncio.create_task(
            self._poll_offset(
                session,
                baseline,
                generation,
                sequence,
                instance_id,
                button_name,
                dispatched_after,
                stage,
                timeout,
            )
        )

    async def _poll_offset(
        self,
        session: Any,
        baseline: tuple[str, ...],
        generation: int,
        sequence: int,
        instance_id: str,
        button_name: str,
        dispatched_after: float,
        stage: OffsetReadinessStage,
        timeout: float | None = None,
    ) -> OffsetRunEvidence | PowerOffsetRunEvidence:
        deadline = monotonic() + (
            self._evidence_timeout if timeout is None else timeout
        )
        parser = parse_offset_run if stage == 1 else parse_power_offset_run
        while True:
            if getattr(session, "connected", True) is False:
                raise ESPHomeSessionDisconnectedError(
                    "connection ended before complete offset evidence"
                )
            self._validate_offset_generation(session, generation)
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
                return parser(
                    correlated,
                    connection_generation=generation,
                    operation_sequence=sequence,
                    target_instance_id=instance_id,
                    button_name=button_name,
                    dispatched_after=dispatched_after,
                    allow_unverified=monotonic() >= deadline,
                )
            except LogEvidenceError:
                remaining = deadline - monotonic()
                if remaining <= 0:
                    raise
                await asyncio.sleep(min(0.05, remaining))

    def _gain_waiter(
        self,
        session: Any,
        *,
        generation: int,
        sequence: int,
        instance_id: str,
        button_name: str,
        dispatched_after: float,
        timeout: float | None = None,
    ) -> Awaitable[GainRunEvidence]:
        expect = getattr(session, "expect_gain_run", None)
        if expect is not None:
            evidence = expect(
                connection_generation=generation,
                operation_sequence=sequence,
                target_instance_id=instance_id,
                button_name=button_name,
                dispatched_after=dispatched_after,
            )

            async def wait_for_evidence() -> GainRunEvidence:
                try:
                    async with asyncio.timeout(
                        self._evidence_timeout if timeout is None else timeout
                    ):
                        return await evidence
                finally:
                    if isinstance(evidence, asyncio.Future) and not evidence.done():
                        evidence.cancel()

            waiter = asyncio.create_task(wait_for_evidence())
            if isinstance(evidence, asyncio.Future):
                waiter.add_done_callback(
                    lambda _task: evidence.cancel()
                    if _task.cancelled() and not evidence.done()
                    else None
                )
            return waiter
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
                timeout,
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
        timeout: float | None = None,
    ) -> GainRunEvidence:
        deadline = monotonic() + (
            self._evidence_timeout if timeout is None else timeout
        )
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
        expected_categories: dict[str, set[Literal["gain", "offset", "power_offset"]]],
        operation_sequence: int,
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
                        expected_categories=expected_categories,
                        operation_sequence=operation_sequence,
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
            CalibrationLogLine(
                generation,
                operation_sequence,
                started_after + (index + 1) * 1e-6,
                line,
            )
            for index, line in enumerate(new_lines)
        )
        evidence = parse_restore(
            correlated,
            connection_generation=generation,
            expected_instance_ids=expected_instance_ids,
            started_after=started_after,
            operation_sequence=operation_sequence,
            expected_categories=expected_categories,
        )
        if require_connection:
            _require_connected_generation(session, generation)
        return evidence

    async def _windows(
        self,
        session: Any,
        entities: Sequence[BoundEntity],
        timing_policy: CalibrationTimingPolicy | None = None,
    ) -> tuple[SensorSampleWindow, ...]:
        boundary = monotonic()
        windows = await asyncio.gather(
            *(
                self._window(
                    session, entity, boundary=boundary, timing_policy=timing_policy
                )
                for entity in entities
            )
        )
        return tuple(windows)

    async def _window(
        self,
        session: Any,
        entity: BoundEntity,
        *,
        boundary: float | None = None,
        timing_policy: CalibrationTimingPolicy | None = None,
    ) -> SensorSampleWindow:
        descriptor = entity.descriptor
        raw = await session.async_wait_for_sensor_window(
            descriptor.key,
            device_id=descriptor.device_id,
            sample_count=self._sample_count,
            after=monotonic() if boundary is None else boundary,
            timeout=self._sensor_timeout(timing_policy),
        )
        window = _sample_window(raw)
        if len(window.values) != self._sample_count:
            raise CalibrationStabilityError("sensor window has the wrong sample count")
        if window.range_percent > self._stability_limit_percent:
            raise CalibrationStabilityError(
                f"{entity.role} range exceeds the stability limit"
            )
        return window

    def _sensor_timeout(self, timing_policy: CalibrationTimingPolicy | None) -> float:
        return (
            timing_policy.sensor_window_timeout_s
            if timing_policy is not None
            else self._evidence_timeout
        )

    def _evidence_timeout_for(
        self, timing_policy: CalibrationTimingPolicy | None
    ) -> float:
        return (
            timing_policy.evidence_timeout_s
            if timing_policy is not None
            else self._evidence_timeout
        )

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
        raw_references: Mapping[int, float],
    ) -> None:
        for index, phase in enumerate(evidence.phases):
            expected_current = raw_references.get(index, 0.0)
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
                index not in raw_references
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
        before: tuple[float, ...],
        restore: dict[str, RestoreEvidence] | dict[str, object] | None,
        phase: str | None = None,
    ) -> CalibrationResult:
        return CalibrationResult(
            CalibrationState.INDETERMINATE,
            group.key,
            phase,
            channels,
            iteration,
            before,
            (),
            (),
            None,
            restore,
            False,
        )


def _pending_offset_tables(
    origin: PendingCalibrationOrigin | None, stage: OffsetReadinessStage
) -> dict[str, PhaseOffsetTable | PhasePowerOffsetTable]:
    if origin is None:
        return {}
    return (
        dict(origin.expected_phase_offsets)
        if stage == 1
        else dict(origin.expected_phase_power_offsets)
    )


def _offset_table(
    evidence: OffsetRunEvidence | PowerOffsetRunEvidence,
) -> PhaseOffsetTable | PhasePowerOffsetTable:
    if isinstance(evidence, OffsetRunEvidence):
        return (
            (evidence.phases[0].voltage_offset, evidence.phases[0].current_offset),
            (evidence.phases[1].voltage_offset, evidence.phases[1].current_offset),
            (evidence.phases[2].voltage_offset, evidence.phases[2].current_offset),
        )
    return (
        (
            evidence.phases[0].active_power_offset,
            evidence.phases[0].reactive_power_offset,
        ),
        (
            evidence.phases[1].active_power_offset,
            evidence.phases[1].reactive_power_offset,
        ),
        (
            evidence.phases[2].active_power_offset,
            evidence.phases[2].reactive_power_offset,
        ),
    )


def _offset_result(
    state: OffsetCalibrationState,
    board_index: int,
    stage: OffsetReadinessStage,
    selected: Sequence[tuple[GroupBinding, OffsetControlBinding, str]],
    expected: Mapping[str, PhaseOffsetTable | PhasePowerOffsetTable],
    *,
    error: str | None = None,
) -> OffsetCalibrationResult:
    return OffsetCalibrationResult(
        state,
        board_index,
        stage,
        tuple(
            (group.key, expected[instance_id])
            for group, _, instance_id in selected
            if instance_id in expected
        ),
        tuple(
            group.key
            for group, _, instance_id in selected
            if instance_id not in expected
        ),
        state is not OffsetCalibrationState.APPLIED_PENDING_RESTART_VERIFICATION,
        error,
    )


async def _discard_waiter(waiter: Awaitable[Any]) -> None:
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
    expected_gains: Mapping[str, PhaseGainTable],
    expected_offsets: Mapping[str, PhaseOffsetTable],
    expected_power_offsets: Mapping[str, PhasePowerOffsetTable],
    *,
    generation: int,
) -> None:
    expected_instance_ids = (
        set(expected_gains) | set(expected_offsets) | set(expected_power_offsets)
    )
    missing = expected_instance_ids.difference(evidence)
    if missing:
        raise RestartVerificationError(
            "missing restore evidence for " + ", ".join(sorted(missing))
        )
    unexpected = set(evidence).difference(expected_instance_ids)
    if unexpected:
        raise RestartVerificationError(
            "unexpected restore evidence for " + ", ".join(sorted(unexpected))
        )
    for instance_id in expected_instance_ids:
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
        if restored.source != "flash":
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
        gain_expected = expected_gains.get(instance_id)
        if gain_expected is None and restored.phase_gains is not None:
            raise RestartVerificationError(
                f"{instance_id}: unexpected gain restore evidence"
            )
        if gain_expected is not None and (
            not restored.register_verified or restored.phase_gains != gain_expected
        ):
            raise RestartVerificationError(
                f"{instance_id}: restored gains do not exactly match expected gains"
            )
        offset_expected = expected_offsets.get(instance_id)
        if offset_expected is None and (
            restored.phase_offsets is not None or restored.offset_register_verified
        ):
            raise RestartVerificationError(
                f"{instance_id}: unexpected offset restore evidence"
            )
        if offset_expected is not None and (
            not restored.offset_register_verified
            or restored.phase_offsets != offset_expected
        ):
            raise RestartVerificationError(
                f"{instance_id}: restored offsets were not verified exactly"
            )
        power_expected = expected_power_offsets.get(instance_id)
        if power_expected is None and (
            restored.phase_power_offsets is not None
            or restored.power_offset_register_verified
        ):
            raise RestartVerificationError(
                f"{instance_id}: unexpected power offset restore evidence"
            )
        if power_expected is not None and (
            not restored.power_offset_register_verified
            or restored.phase_power_offsets != power_expected
        ):
            raise RestartVerificationError(
                f"{instance_id}: restored power offsets were not verified exactly"
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


def _projected_value(
    measured: float, old_gain: int, new_gain: int, multiplier: float = 1.0
) -> float:
    return measured * new_gain / old_gain * multiplier


def _positive_finite(*values: float) -> bool:
    return all(math.isfinite(value) and value > 0 for value in values)
