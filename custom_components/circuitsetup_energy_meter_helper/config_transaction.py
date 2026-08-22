"""Confirmed Device Builder configuration and OTA install transactions."""

from __future__ import annotations

import asyncio
import re
from collections.abc import AsyncIterator, Callable, Mapping
from contextlib import asynccontextmanager
from dataclasses import dataclass, field, replace
from enum import StrEnum
from hashlib import sha256
from typing import Protocol
from uuid import uuid4

from .config_mutator import ConfigMutationError, build_calibrated_gain_mutation
from .device_builder import (
    ConfigChangedError,
    ESPHomeConfigSnapshot,
    JobProgress,
    JobProgressStage,
    JobResult,
)
from .models import (
    ConfigMutationPlan,
    MeterTopology,
    StoredCTSelection,
    SubstitutionChange,
)
from .session_manager import ConfigLease, SessionManager, canonical_mac
from .store import VerifiedCalibrationRecord

MAX_VISIBLE_DIFF_BYTES = 32_768
MAX_VISIBLE_DIFF_LINES = 512
MAX_EVIDENCE_BYTES = 2_048
MAX_EVIDENCE_LINES = 32
MAX_UPLOAD_PROGRESS_BYTES = 2_048
MAX_UPLOAD_PROGRESS_LINES = 32


class ConfigTransactionState(StrEnum):
    """The only legal visible configuration transaction states."""

    PREVIEWED = "previewed"
    WRITE_CONFIRMED = "write_confirmed"
    WRITTEN = "written"
    VALIDATED = "validated"
    COMPILED = "compiled"
    INSTALL_CONFIRMATION_REQUIRED = "install_confirmation_required"
    INSTALLING = "installing"
    RECONNECTING = "reconnecting"
    VERIFIED = "verified"
    ROLLED_BACK = "rolled_back"
    FAILED = "failed"


class TransactionEvidenceCode(StrEnum):
    """Allowlisted failure evidence safe to serialize to the panel."""

    WRITE_FAILED = "write_failed"
    WRITE_NOT_APPLIED = "write_not_applied"
    WRITE_RECOVERY_REQUIRED = "write_recovery_required"
    SOURCE_CHANGED = "source_changed"
    VALIDATION_FAILED = "validation_failed"
    VALIDATION_UNAVAILABLE = "validation_unavailable"
    COMPILE_FAILED = "compile_failed"
    UPLOAD_FAILED = "upload_failed"
    RECONNECT_UNAVAILABLE = "reconnect_unavailable"
    IDENTITY_MISMATCH = "identity_mismatch"
    TOPOLOGY_MISMATCH = "topology_mismatch"
    ENTITY_MISMATCH = "entity_mismatch"
    SENSOR_COUNT_MISMATCH = "sensor_count_mismatch"
    PERSISTENCE_FAILED = "persistence_failed"
    ROLLBACK_FAILED = "rollback_failed"
    CANCELLED = "cancelled"


class TransactionProgress(StrEnum):
    """Allowlisted progress markers; Device Builder text is never forwarded."""

    CONFIG_WRITTEN = "config_written"
    CONFIG_VALIDATED = "config_validated"
    FIRMWARE_COMPILED = "firmware_compiled"
    OTA_UPLOADED = "ota_uploaded"
    DEVICE_VERIFIED = "device_verified"
    METADATA_PERSISTED = "metadata_persisted"
    CONFIG_RESTORED = "config_restored"


class RollbackFailedError(RuntimeError):
    """The original configuration could not be safely restored."""


class DeviceBuilder(Protocol):
    async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot: ...

    async def async_update_config(
        self, snapshot: ESPHomeConfigSnapshot, proposed_content: str
    ) -> None: ...

    async def async_validate(self, configuration: str) -> JobResult: ...

    async def async_compile(self, configuration: str) -> JobResult: ...

    async def async_upload(
        self,
        configuration: str,
        progress: Callable[[JobProgress], None] | None = None,
    ) -> JobResult: ...

    async def async_restore_content(
        self,
        configuration: str,
        content: str,
        expected_current_sha256: str | None = None,
    ) -> None: ...


class VerifiedPersistence(Protocol):
    async def async_save_verified_ct_selections(
        self, mac: str, selections: tuple[StoredCTSelection, ...]
    ) -> None: ...

    async def async_get_verified_calibration(
        self, mac: str
    ) -> VerifiedCalibrationRecord | None: ...

    async def async_claim_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool: ...

    async def async_revalidate_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool: ...


@dataclass(frozen=True, slots=True)
class ReconnectEvidence:
    """Minimal native-API verification result injected until Task 14."""

    mac: str
    topology: MeterTopology
    ct_names: Mapping[int, str]
    current_sensor_count: int


class ReconnectVerifier(Protocol):
    async def async_verify(self, mac: str) -> ReconnectEvidence: ...


@dataclass(frozen=True, slots=True)
class ValidationDetail:
    """Useful validation counts and code without arbitrary builder text."""

    code: int | None
    reported_error_count: int | None
    reported_warning_count: int | None
    error_record_count: int
    warning_record_count: int


@dataclass(frozen=True, slots=True)
class TransactionStatus:
    """The complete and deliberately YAML-free public transaction surface."""

    transaction_id: str
    state: ConfigTransactionState
    source_sha256: str
    changes: tuple[SubstitutionChange, ...]
    redacted_diff: str
    rollback_available: bool = False
    evidence: tuple[TransactionEvidenceCode, ...] = ()
    progress: tuple[TransactionProgress, ...] = ()
    validation_detail: ValidationDetail | None = None
    upload_progress: tuple[JobProgress, ...] = ()


@dataclass(slots=True)
class _ConfigTransaction:
    """Sensitive in-memory transaction data; never return this object."""

    transaction_id: str
    mac: str
    topology: MeterTopology
    source_sha256: str
    changes: tuple[SubstitutionChange, ...]
    redacted_diff: str
    plan: ConfigMutationPlan | None = field(repr=False)
    prior_content: str | None = field(repr=False)
    selections: tuple[StoredCTSelection, ...] = field(default=(), repr=False)
    verification_id: str | None = field(default=None, repr=False)
    state: ConfigTransactionState = ConfigTransactionState.PREVIEWED
    rollback_available: bool = False
    evidence: list[TransactionEvidenceCode] = field(default_factory=list)
    progress: list[TransactionProgress] = field(default_factory=list)
    validation_detail: ValidationDetail | None = None
    upload_progress: list[JobProgress] = field(default_factory=list)
    lease: ConfigLease | None = field(default=None, repr=False)
    operation_lock: asyncio.Lock = field(default_factory=asyncio.Lock, repr=False)
    active_tasks: set[asyncio.Task[object]] = field(default_factory=set, repr=False)
    closed: bool = field(default=False, repr=False)

    def scrub(self) -> None:
        """Erase full YAML and selections when this transaction no longer owns work."""
        self.plan = None
        self.prior_content = None
        self.selections = ()
        self.closed = True

    def mark_unresolved(self) -> None:
        """Record safe recovery evidence before bounded unload cleanup."""
        self.state = ConfigTransactionState.FAILED
        self.rollback_available = False
        if TransactionEvidenceCode.WRITE_RECOVERY_REQUIRED not in self.evidence:
            self.evidence.append(TransactionEvidenceCode.WRITE_RECOVERY_REQUIRED)


class ConfigTransactionManager:
    """Serialize confirmed config write, build, OTA, reconnect, and persistence."""

    def __init__(
        self,
        device_builder: DeviceBuilder,
        verifier: ReconnectVerifier,
        persistence: VerifiedPersistence,
        sessions: SessionManager,
        *,
        reconciliation_timeout: float = 30.0,
    ) -> None:
        self._device_builder = device_builder
        self._verifier = verifier
        self._persistence = persistence
        self.sessions = sessions
        self._reconciliation_timeout = reconciliation_timeout

    async def async_preview(
        self,
        mac: str,
        topology: MeterTopology,
        plan: ConfigMutationPlan,
        source_snapshot: ESPHomeConfigSnapshot,
        selections: tuple[StoredCTSelection, ...] = (),
    ) -> TransactionStatus:
        """Retain full content only in memory and return a safe review surface."""
        if (
            source_snapshot.configuration != plan.configuration
            or source_snapshot.sha256 != plan.source_sha256
            or sha256(source_snapshot.content.encode()).hexdigest()
            != source_snapshot.sha256
        ):
            raise ValueError("source snapshot does not match mutation plan")
        _validate_changes(plan.changes)
        transaction = _ConfigTransaction(
            uuid4().hex,
            canonical_mac(mac),
            topology,
            plan.source_sha256,
            plan.changes,
            _safe_diff(plan.redacted_diff),
            plan,
            source_snapshot.content,
            selections,
        )
        self.sessions._register_transaction(transaction.transaction_id, transaction)
        return _status(transaction)

    async def async_preview_calibrated_gains(
        self,
        mac: str,
        topology: MeterTopology,
        verification_id: str,
    ) -> TransactionStatus:
        """Re-read YAML and open the normal reviewed transaction for final gains."""
        mac = canonical_mac(mac)
        lease = await self.sessions.async_acquire_config(mac)
        transaction: _ConfigTransaction | None = None
        try:
            verified = await self._persistence.async_get_verified_calibration(mac)
            if verified is None or verified.verification_id != verification_id:
                raise ConfigMutationError(
                    "request does not identify the current verified calibration"
                )
            if verified.mac != mac:
                raise ConfigMutationError(
                    "verified calibration belongs to another device"
                )
            if (
                verified.topology_addon_count != topology.addon_count
                or verified.topology_project_name != topology.project_name
                or verified.topology_connection_type != topology.connection_type
                or verified.topology_voltage_layout != topology.voltage_layout
            ):
                raise ConfigMutationError(
                    "verified calibration topology does not match target"
                )
            if not verified.source_handoff_available:
                raise ConfigMutationError("verified calibration has already been used")
            snapshot = await self._device_builder.async_get_config(
                verified.config_filename
            )
            plan = build_calibrated_gain_mutation(snapshot, topology, verified)
            status = await self.async_preview(mac, topology, plan, snapshot)
            transaction = self._transaction(status.transaction_id)
            transaction.verification_id = verification_id
            if not await self._persistence.async_claim_verified_calibration(
                mac, verification_id, transaction.transaction_id
            ):
                self._finish(transaction, ConfigTransactionState.FAILED)
                raise ConfigMutationError("verified calibration has already been used")
            return status
        except BaseException:
            if transaction is not None and not transaction.closed:
                self._finish(transaction, ConfigTransactionState.FAILED)
            raise
        finally:
            lease.release()

    def status(self, transaction_id: str) -> TransactionStatus:
        """Return only the safe DTO for a live transaction."""
        return _status(self._transaction(transaction_id))

    async def async_confirm_write(
        self, transaction_id: str, confirmed_by_admin_user_id: str
    ) -> TransactionStatus:
        """Write and validate after the first administrator confirmation."""
        _require_confirmation(confirmed_by_admin_user_id)
        transaction = self._transaction(transaction_id)
        async with _operation(transaction):
            if transaction.state is not ConfigTransactionState.PREVIEWED:
                raise RuntimeError(
                    "write confirmation is not legal in the current state"
                )
            transaction.lease = await self.sessions.async_acquire_config(
                transaction.mac
            )
            try:
                verification_current = (
                    transaction.verification_id is None
                    or await self._persistence.async_revalidate_verified_calibration(
                        transaction.mac,
                        transaction.verification_id,
                        transaction.transaction_id,
                    )
                )
            except BaseException as error:
                self._finish(
                    transaction,
                    ConfigTransactionState.FAILED,
                    (
                        TransactionEvidenceCode.CANCELLED
                        if isinstance(error, asyncio.CancelledError)
                        else TransactionEvidenceCode.SOURCE_CHANGED
                    ),
                )
                raise
            if not verification_current:
                self._finish(
                    transaction,
                    ConfigTransactionState.FAILED,
                    TransactionEvidenceCode.SOURCE_CHANGED,
                )
                raise ConfigMutationError("verified calibration preview was superseded")
            transaction.state = ConfigTransactionState.WRITE_CONFIRMED
            plan, prior_content = _sensitive(transaction)
            snapshot = ESPHomeConfigSnapshot(
                plan.configuration, prior_content, transaction.source_sha256
            )
            try:
                await self._device_builder.async_update_config(
                    snapshot, plan.proposed_content
                )
            except ConfigChangedError:
                self._finish(
                    transaction,
                    ConfigTransactionState.FAILED,
                    TransactionEvidenceCode.SOURCE_CHANGED,
                )
                raise
            except asyncio.CancelledError:
                await self._drain_uncertain_update(
                    transaction, TransactionEvidenceCode.CANCELLED
                )
                raise
            except Exception:
                return await self._drain_uncertain_update(
                    transaction, TransactionEvidenceCode.WRITE_FAILED
                )
                raise
            transaction.state = ConfigTransactionState.WRITTEN
            _progress(transaction, TransactionProgress.CONFIG_WRITTEN)
            try:
                validation = await self._device_builder.async_validate(
                    plan.configuration
                )
            except asyncio.CancelledError:
                await self._rollback_after_cancellation(transaction)
                raise
            except Exception:  # noqa: BLE001 - external validation boundary
                transaction.validation_detail = ValidationDetail(None, None, None, 0, 0)
                return await self._rollback_locked(
                    transaction, TransactionEvidenceCode.VALIDATION_UNAVAILABLE
                )
            if not validation.success:
                transaction.validation_detail = _validation_detail(validation)
                return await self._rollback_locked(
                    transaction, TransactionEvidenceCode.VALIDATION_FAILED
                )
            transaction.state = ConfigTransactionState.VALIDATED
            _progress(transaction, TransactionProgress.CONFIG_VALIDATED)
            return await self._compile_locked(transaction)

    async def _drain_uncertain_update(
        self,
        transaction: _ConfigTransaction,
        cause: TransactionEvidenceCode,
    ) -> TransactionStatus:
        """Finish reconciliation even when the initiating caller is cancelled."""
        cleanup = asyncio.create_task(
            self._reconcile_uncertain_update(transaction, cause)
        )
        transaction.active_tasks.add(cleanup)
        try:
            while not cleanup.done():
                try:
                    await asyncio.shield(cleanup)
                except asyncio.CancelledError:
                    continue
            return cleanup.result()
        finally:
            transaction.active_tasks.discard(cleanup)

    async def _reconcile_uncertain_update(
        self,
        transaction: _ConfigTransaction,
        cause: TransactionEvidenceCode,
    ) -> TransactionStatus:
        plan, _ = _sensitive(transaction)
        _evidence(transaction, cause)
        try:
            async with asyncio.timeout(self._reconciliation_timeout):
                current = await self._device_builder.async_get_config(
                    plan.configuration
                )
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001 - uncertainty must remain recoverable
            return self._retain_write_recovery(transaction)
        if transaction.closed:
            return _status(transaction)
        if current.sha256 == transaction.source_sha256:
            return self._finish(
                transaction,
                ConfigTransactionState.FAILED,
                TransactionEvidenceCode.WRITE_NOT_APPLIED,
            )
        proposed_sha256 = sha256(plan.proposed_content.encode()).hexdigest()
        if current.sha256 == proposed_sha256:
            return await self._rollback_locked(
                transaction, expected_current_sha256=proposed_sha256
            )
        return self._retain_write_recovery(transaction)

    @staticmethod
    def _retain_write_recovery(
        transaction: _ConfigTransaction,
    ) -> TransactionStatus:
        if transaction.closed:
            return _status(transaction)
        transaction.state = ConfigTransactionState.FAILED
        transaction.rollback_available = False
        _evidence(transaction, TransactionEvidenceCode.WRITE_RECOVERY_REQUIRED)
        return _status(transaction)

    async def async_compile(self, transaction_id: str) -> TransactionStatus:
        """Compile one valid edit; concurrent/replayed calls cannot claim it twice."""
        transaction = self._transaction(transaction_id)
        async with _operation(transaction):
            return await self._compile_locked(transaction)

    async def _compile_locked(
        self, transaction: _ConfigTransaction
    ) -> TransactionStatus:
        if transaction.state is not ConfigTransactionState.VALIDATED:
            raise RuntimeError("compile is not legal in the current state")
        plan, _ = _sensitive(transaction)
        try:
            result = await self._device_builder.async_compile(plan.configuration)
        except asyncio.CancelledError:
            await self._rollback_after_cancellation(transaction)
            raise
        except Exception:  # noqa: BLE001 - external job boundary
            result = None
        if result is None or not result.success:
            transaction.state = ConfigTransactionState.FAILED
            transaction.rollback_available = True
            _evidence(transaction, TransactionEvidenceCode.COMPILE_FAILED)
            return _status(transaction)
        transaction.state = ConfigTransactionState.COMPILED
        _progress(transaction, TransactionProgress.FIRMWARE_COMPILED)
        transaction.state = ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        return _status(transaction)

    async def async_confirm_install(
        self, transaction_id: str, confirmed_by_admin_user_id: str
    ) -> TransactionStatus:
        """Run OTA only after the second confirmation, then verify and persist."""
        _require_confirmation(confirmed_by_admin_user_id)
        transaction = self._transaction(transaction_id)
        async with _operation(transaction):
            if (
                transaction.state
                is not ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
            ):
                raise RuntimeError(
                    "install confirmation is not legal in the current state"
                )
            transaction.state = ConfigTransactionState.INSTALLING
            plan, _ = _sensitive(transaction)
            try:
                result = await self._device_builder.async_upload(
                    plan.configuration,
                    lambda update: _upload_progress(transaction, update),
                )
            except asyncio.CancelledError:
                self._finish(
                    transaction,
                    ConfigTransactionState.FAILED,
                    TransactionEvidenceCode.CANCELLED,
                )
                raise
            except Exception:  # noqa: BLE001 - external transport boundary
                result = None
            if result is None or not result.success:
                return self._finish(
                    transaction,
                    ConfigTransactionState.FAILED,
                    TransactionEvidenceCode.UPLOAD_FAILED,
                )
            _progress(transaction, TransactionProgress.OTA_UPLOADED)
            transaction.state = ConfigTransactionState.RECONNECTING
            try:
                verification = await self._verifier.async_verify(transaction.mac)
            except asyncio.CancelledError:
                self._finish(
                    transaction,
                    ConfigTransactionState.FAILED,
                    TransactionEvidenceCode.CANCELLED,
                )
                raise
            except Exception:  # noqa: BLE001 - external verifier boundary
                return self._finish(
                    transaction,
                    ConfigTransactionState.FAILED,
                    TransactionEvidenceCode.RECONNECT_UNAVAILABLE,
                )
            if error := _verify_reconnect(transaction, verification):
                return self._finish(transaction, ConfigTransactionState.FAILED, error)
            _progress(transaction, TransactionProgress.DEVICE_VERIFIED)
            selections = tuple(
                replace(
                    selection,
                    config_sha256=sha256(plan.proposed_content.encode()).hexdigest(),
                )
                for selection in transaction.selections
            )
            try:
                await self._persistence.async_save_verified_ct_selections(
                    transaction.mac, selections
                )
            except asyncio.CancelledError:
                self._finish(
                    transaction,
                    ConfigTransactionState.FAILED,
                    TransactionEvidenceCode.CANCELLED,
                )
                raise
            except Exception:  # noqa: BLE001 - external storage boundary
                return self._finish(
                    transaction,
                    ConfigTransactionState.FAILED,
                    TransactionEvidenceCode.PERSISTENCE_FAILED,
                )
            _progress(transaction, TransactionProgress.METADATA_PERSISTED)
            return self._finish(transaction, ConfigTransactionState.VERIFIED)

    async def async_rollback(self, transaction_id: str) -> TransactionStatus:
        """Consume the one available rollback and restore through Device Builder once."""
        transaction = self._transaction(transaction_id)
        async with _operation(transaction):
            if (
                transaction.state is not ConfigTransactionState.FAILED
                or not transaction.rollback_available
            ):
                raise RuntimeError("rollback is not available in the current state")
            return await self._rollback_locked(transaction)

    async def _rollback_locked(
        self,
        transaction: _ConfigTransaction,
        cause: TransactionEvidenceCode | None = None,
        *,
        expected_current_sha256: str | None = None,
    ) -> TransactionStatus:
        transaction.rollback_available = False
        if cause is not None:
            _evidence(transaction, cause)
        plan, prior_content = _sensitive(transaction)
        expected_current_sha256 = (
            expected_current_sha256
            or sha256(plan.proposed_content.encode()).hexdigest()
        )
        try:
            # DeviceBuilder.async_restore_content owns restore plus exactly one validation.
            async with asyncio.timeout(self._reconciliation_timeout):
                await self._device_builder.async_restore_content(
                    plan.configuration,
                    prior_content,
                    expected_current_sha256=expected_current_sha256,
                )
        except asyncio.CancelledError:
            self._finish(
                transaction,
                ConfigTransactionState.FAILED,
                TransactionEvidenceCode.CANCELLED,
            )
            raise
        except TimeoutError, ConfigChangedError:
            return self._retain_write_recovery(transaction)
        except Exception as error:
            self._finish(
                transaction,
                ConfigTransactionState.FAILED,
                TransactionEvidenceCode.ROLLBACK_FAILED,
            )
            raise RollbackFailedError("configuration rollback failed") from error
        _progress(transaction, TransactionProgress.CONFIG_RESTORED)
        return self._finish(transaction, ConfigTransactionState.ROLLED_BACK)

    async def _rollback_after_cancellation(
        self, transaction: _ConfigTransaction
    ) -> None:
        try:
            await self._rollback_locked(
                transaction, TransactionEvidenceCode.VALIDATION_UNAVAILABLE
            )
        except RollbackFailedError:
            pass

    def _transaction(self, transaction_id: str) -> _ConfigTransaction:
        transaction = self.sessions._get_transaction(transaction_id)
        if not isinstance(transaction, _ConfigTransaction):
            raise KeyError("unknown configuration transaction")
        return transaction

    def _finish(
        self,
        transaction: _ConfigTransaction,
        state: ConfigTransactionState,
        code: TransactionEvidenceCode | None = None,
    ) -> TransactionStatus:
        if transaction.closed:
            return _status(transaction)
        transaction.state = state
        transaction.rollback_available = False
        if code is not None:
            _evidence(transaction, code)
        status = _status(transaction)
        _release(transaction)
        transaction.scrub()
        self.sessions._remove_transaction(transaction.transaction_id)
        return status


@asynccontextmanager
async def _operation(transaction: _ConfigTransaction) -> AsyncIterator[None]:
    task = asyncio.current_task()
    if task is None:
        raise RuntimeError("configuration transaction requires an asyncio task")
    transaction.active_tasks.add(task)
    try:
        async with transaction.operation_lock:
            yield
    finally:
        transaction.active_tasks.discard(task)


def _require_confirmation(user_id: str) -> None:
    if not user_id:
        raise PermissionError("administrator confirmation is required")


def _sensitive(
    transaction: _ConfigTransaction,
) -> tuple[ConfigMutationPlan, str]:
    if transaction.plan is None or transaction.prior_content is None:
        raise RuntimeError("configuration transaction has been cleaned up")
    return transaction.plan, transaction.prior_content


def _release(transaction: _ConfigTransaction) -> None:
    if transaction.lease is not None:
        transaction.lease.release()
        transaction.lease = None


def _status(transaction: _ConfigTransaction) -> TransactionStatus:
    evidence = tuple(transaction.evidence[-MAX_EVIDENCE_LINES:])
    progress = tuple(transaction.progress[-MAX_EVIDENCE_LINES:])
    if len("\n".join((*evidence, *progress)).encode()) > MAX_EVIDENCE_BYTES:
        raise RuntimeError("allowlisted transaction evidence exceeded its byte cap")
    if len(repr(transaction.upload_progress).encode()) > MAX_UPLOAD_PROGRESS_BYTES:
        raise RuntimeError("structured upload progress exceeded its byte cap")
    return TransactionStatus(
        transaction.transaction_id,
        transaction.state,
        transaction.source_sha256,
        transaction.changes,
        transaction.redacted_diff,
        transaction.rollback_available,
        evidence,
        progress,
        transaction.validation_detail,
        tuple(transaction.upload_progress),
    )


def _evidence(transaction: _ConfigTransaction, code: TransactionEvidenceCode) -> None:
    if code not in transaction.evidence:
        transaction.evidence.append(code)


def _progress(transaction: _ConfigTransaction, progress: TransactionProgress) -> None:
    if progress not in transaction.progress:
        transaction.progress.append(progress)


def _upload_progress(transaction: _ConfigTransaction, progress: JobProgress) -> None:
    """Retain only bounded, typed stage/percentage upload progress."""
    if (
        not isinstance(progress, JobProgress)
        or not isinstance(progress.stage, JobProgressStage)
        or progress.percentage is not None
        and not 0 <= progress.percentage <= 100
    ):
        return
    transaction.upload_progress.append(progress)
    del transaction.upload_progress[:-MAX_UPLOAD_PROGRESS_LINES]
    while (
        transaction.upload_progress
        and len(repr(transaction.upload_progress).encode()) > MAX_UPLOAD_PROGRESS_BYTES
    ):
        del transaction.upload_progress[0]


_DIAGNOSTIC_RECORD = re.compile(
    r"^\s*(?:\[[^\]\r\n]{1,64}\]\s*)?(ERROR|WARNING)\b", re.IGNORECASE
)


def _validation_detail(result: JobResult) -> ValidationDetail:
    """Count only anchored diagnostic records without retaining their text."""
    error_records = 0
    warning_records = 0
    bytes_seen = 0
    lines_seen = 0
    for value in (result.summary, *result.output_tail):
        for line in value.splitlines():
            if lines_seen >= MAX_EVIDENCE_LINES or bytes_seen >= MAX_EVIDENCE_BYTES:
                break
            lines_seen += 1
            remaining = MAX_EVIDENCE_BYTES - bytes_seen
            encoded = line.encode()[:remaining]
            bytes_seen += len(encoded)
            match = _DIAGNOSTIC_RECORD.match(encoded.decode("utf-8", "ignore"))
            if match is None:
                continue
            if match.group(1).lower() == "error":
                error_records = min(999, error_records + 1)
            else:
                warning_records = min(999, warning_records + 1)
    code = result.code
    return ValidationDetail(
        code
        if isinstance(code, int)
        and not isinstance(code, bool)
        and -32_768 <= code <= 32_767
        else None,
        _safe_protocol_count(result.error_count),
        _safe_protocol_count(result.warning_count),
        error_records,
        warning_records,
    )


def _safe_protocol_count(value: object) -> int | None:
    return (
        value
        if isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 999
        else None
    )


def _validate_changes(changes: tuple[SubstitutionChange, ...]) -> None:
    if len(changes) > 100:
        raise ValueError("too many configuration changes")
    if any(
        value is not None
        and (
            len(value.encode()) > 512 or any(ord(character) < 32 for character in value)
        )
        for change in changes
        for value in (change.key, change.old_value, change.new_value)
    ):
        raise ValueError("configuration change is not safe for display")


def _safe_diff(diff: str) -> str:
    """Redact secret-bearing lines, controls, line count, and encoded bytes."""
    lines: list[str] = []
    for raw_line in diff.splitlines()[:MAX_VISIBLE_DIFF_LINES]:
        line = "".join(
            character
            for character in raw_line
            if character == "\t" or ord(character) >= 32 and ord(character) != 127
        )
        lowered = line.lower()
        if any(
            marker in lowered
            for marker in ("password", "token", "secret", "encryption_key", "api_key")
        ):
            line = "[redacted]"
        lines.append(line)
    visible = "\n".join(lines)
    encoded = visible.encode()
    if len(encoded) <= MAX_VISIBLE_DIFF_BYTES:
        return visible
    marker = b"\n[truncated]"
    return (
        encoded[: MAX_VISIBLE_DIFF_BYTES - len(marker)].decode("utf-8", "ignore")
        + marker.decode()
    )


def _verify_reconnect(
    transaction: _ConfigTransaction, evidence: ReconnectEvidence
) -> TransactionEvidenceCode | None:
    if canonical_mac(evidence.mac) != transaction.mac:
        return TransactionEvidenceCode.IDENTITY_MISMATCH
    if evidence.topology != transaction.topology:
        return TransactionEvidenceCode.TOPOLOGY_MISMATCH
    expected_channels = set(range(1, transaction.topology.ct_count + 1))
    if set(evidence.ct_names) != expected_channels:
        return TransactionEvidenceCode.ENTITY_MISMATCH
    plan, _ = _sensitive(transaction)
    for change in plan.changes:
        if change.key.startswith("ct") and change.key.endswith("_name"):
            channel = int(change.key.removeprefix("ct").removesuffix("_name"))
            if evidence.ct_names.get(channel) != change.new_value:
                return TransactionEvidenceCode.ENTITY_MISMATCH
    if evidence.current_sensor_count != transaction.topology.ct_count:
        return TransactionEvidenceCode.SENSOR_COUNT_MISMATCH
    return None
