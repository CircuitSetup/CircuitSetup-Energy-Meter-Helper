"""Confirmed Device Builder configuration and OTA install transactions."""

from __future__ import annotations

import asyncio
import logging
import re
from collections.abc import AsyncIterator, Awaitable, Callable, Coroutine, Mapping
from contextlib import asynccontextmanager
from dataclasses import dataclass, field, replace
from enum import StrEnum
from hashlib import sha256
from time import monotonic
from typing import Any, Protocol
from uuid import uuid4

from .config_document import ESPHomeConfigDocument
from .config_mutator import (
    ConfigMutationError,
    CTChangeRequest,
    build_calibrated_gain_mutation,
    package_options_from_document,
)
from .ct_catalog import CTPresetCatalog
from .ct_inventory import CTInventory
from .device_builder import (
    ConfigChangedError,
    ESPHomeConfigSnapshot,
    JobProgress,
    JobProgressStage,
    JobResult,
)
from .meter_config_mutator import expected_meter_entity_evidence
from .meter_configuration import ChannelSettings, MeterConfigurationRequest
from .models import (
    ConfigMutationPlan,
    MeterTopology,
    StoredCTSelection,
    StoredMeterRecord,
    StoredTopology,
    StoredTopologyEvidence,
    SubstitutionChange,
    canonical_mac,
)
from .session_manager import ConfigLease, SessionManager
from .store import StoredMeterConfiguration, VerifiedCalibrationRecord
from .topology import (
    verified_voltage_reference_fingerprint,
    voltage_reference_fingerprint_for_meter,
    voltage_reference_topology_from_config,
)

MAX_VISIBLE_DIFF_BYTES = 32_768
MAX_VISIBLE_DIFF_LINES = 512
MAX_EVIDENCE_BYTES = 2_048
MAX_EVIDENCE_LINES = 32
MAX_UPLOAD_PROGRESS_BYTES = 2_048
MAX_UPLOAD_PROGRESS_LINES = 32
DEFAULT_CONFIRMATION_TTL = 15 * 60.0
MAX_CONFIRMATION_TTL = 60 * 60.0
_LOGGER = logging.getLogger(__name__)


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


_RETRYABLE_INSTALL_EVIDENCE = {
    TransactionEvidenceCode.RECONNECT_UNAVAILABLE,
    TransactionEvidenceCode.ENTITY_MISMATCH,
    TransactionEvidenceCode.SENSOR_COUNT_MISMATCH,
}
_RECONNECT_ATTEMPTS = 3


class RollbackFailedError(RuntimeError):
    """The original configuration could not be safely restored."""


class DeviceBuilder(Protocol):
    async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot: ...

    async def async_update_config(
        self, snapshot: ESPHomeConfigSnapshot, proposed_content: str
    ) -> None: ...

    async def async_validate(self, configuration: str) -> JobResult: ...

    async def async_compile(
        self,
        configuration: str,
        progress: Callable[[JobProgress], None] | None = None,
    ) -> JobResult: ...

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
    async def async_get_meter_configuration(
        self, mac: str
    ) -> StoredMeterConfiguration | None: ...

    async def async_get_ct_selections(
        self, mac: str
    ) -> tuple[StoredCTSelection, ...]: ...

    async def async_save_verified_ct_selections(
        self, mac: str, selections: tuple[StoredCTSelection, ...]
    ) -> None: ...

    async def async_save_verified_ct_selections_and_mark_verified_calibration_installed(
        self,
        mac: str,
        expected_source_sha256: str,
        proposed_sha256: str,
        record: StoredMeterRecord,
        selections: tuple[StoredCTSelection, ...],
        verification_id: str,
        transaction_id: str,
    ) -> bool: ...

    async def async_save_verified_meter_configuration(
        self,
        mac: str,
        expected_source_sha256: str,
        configuration: StoredMeterConfiguration,
        record: StoredMeterRecord,
    ) -> None: ...

    async def async_save_verified_meter_configuration_and_mark_verified_calibration_installed(
        self,
        mac: str,
        expected_source_sha256: str,
        configuration: StoredMeterConfiguration,
        verification_id: str,
        transaction_id: str,
        record: StoredMeterRecord,
    ) -> bool: ...

    async def async_get_verified_calibration(
        self, mac: str
    ) -> VerifiedCalibrationRecord | None: ...

    async def async_claim_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool: ...

    async def async_revalidate_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool: ...

    async def async_release_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool: ...

    async def async_mark_verified_calibration_installed(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool: ...


@dataclass(frozen=True, slots=True)
class ReconnectEvidence:
    """Minimal native-API verification result injected until Task 14."""

    mac: str
    topology: MeterTopology
    ct_names: Mapping[int, str]
    current_sensor_count: int
    sensor_entities: frozenset[tuple[str, str]] = frozenset()
    duplicate_sensor_object_ids: frozenset[str] = frozenset()


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
    aggregate_entity_mismatch: bool = False
    full_meter_configuration_verified: bool = False


@dataclass(slots=True)
class _ConfigTransaction:
    """Sensitive in-memory transaction data; never return this object."""

    transaction_id: str
    expires_at: float
    mac: str
    topology: MeterTopology
    source_sha256: str
    changes: tuple[SubstitutionChange, ...]
    redacted_diff: str
    plan: ConfigMutationPlan | None = field(repr=False)
    prior_content: str | None = field(repr=False)
    meter_configuration: StoredMeterConfiguration | None = field(
        default=None, repr=False
    )
    expected_sensor_entities: frozenset[tuple[str, str]] = field(
        default_factory=frozenset, repr=False
    )
    expected_aggregate_sensor_entities: frozenset[tuple[str, str]] = field(
        default_factory=frozenset, repr=False
    )
    meter_record: StoredMeterRecord | None = field(default=None, repr=False)
    _legacy_ct_selections: tuple[StoredCTSelection, ...] = field(
        default=(), repr=False
    )
    verification_id: str | None = field(default=None, repr=False)
    state: ConfigTransactionState = ConfigTransactionState.PREVIEWED
    rollback_available: bool = False
    evidence: list[TransactionEvidenceCode] = field(default_factory=list)
    progress: list[TransactionProgress] = field(default_factory=list)
    validation_detail: ValidationDetail | None = None
    upload_progress: list[JobProgress] = field(default_factory=list)
    aggregate_entity_mismatch: bool = False
    lease: ConfigLease | None = field(default=None, repr=False)
    operation_lock: asyncio.Lock = field(default_factory=asyncio.Lock, repr=False)
    active_tasks: set[asyncio.Task[object]] = field(default_factory=set, repr=False)
    reservation_release: Callable[[], Awaitable[bool]] | None = field(
        default=None, repr=False
    )
    reservation_claimed: bool = field(default=False, repr=False)
    write_started: bool = field(default=False, repr=False)
    persistence_commit_started: bool = field(default=False, repr=False)
    expiry_cleanup_started: bool = field(default=False, repr=False)
    closed: bool = field(default=False, repr=False)

    async def async_release_reservation(self) -> None:
        """Drain an exact pre-write release even if this caller is cancelled."""
        if (
            not self.reservation_claimed
            or self.write_started
            or self.reservation_release is None
        ):
            return
        cleanup: asyncio.Future[bool] = asyncio.ensure_future(
            self.reservation_release()
        )
        cancelled = False
        while not cleanup.done():
            try:
                await asyncio.shield(cleanup)
            except asyncio.CancelledError:
                cancelled = True
        cleanup.result()
        self.reservation_claimed = False
        if cancelled:
            raise asyncio.CancelledError

    def scrub(self) -> None:
        """Erase full YAML and selections when this transaction no longer owns work."""
        self.plan = None
        self.prior_content = None
        self.meter_configuration = None
        self.expected_sensor_entities = frozenset()
        self.expected_aggregate_sensor_entities = frozenset()
        self.meter_record = None
        self._legacy_ct_selections = ()
        self.closed = True

    @property
    def selections(self) -> tuple[StoredCTSelection, ...]:
        """Compatibility reader; full transactions source this from configuration."""
        if self.meter_configuration is not None:
            return self.meter_configuration.ct_selections
        return self._legacy_ct_selections

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
        confirmation_ttl: float = DEFAULT_CONFIRMATION_TTL,
        clock: Callable[[], float] = monotonic,
    ) -> None:
        if not 1.0 <= confirmation_ttl <= MAX_CONFIRMATION_TTL:
            raise ValueError("confirmation TTL must be between 1 and 3600 seconds")
        self._device_builder = device_builder
        self._verifier = verifier
        self._persistence = persistence
        self.sessions = sessions
        self._reconciliation_timeout = reconciliation_timeout
        self._confirmation_ttl = confirmation_ttl
        self._clock = clock
        self._subscribers: dict[str, set[Callable[[TransactionStatus], None]]] = {}

    def assert_confirmation(
        self, transaction_id: str, device_id: str, source_sha256: str
    ) -> None:
        """Require the exact live device/hash-bound server transaction."""
        transaction = self._transaction(transaction_id)
        try:
            canonical_device_id = canonical_mac(device_id)
        except ValueError:
            raise KeyError("stale configuration transaction") from None
        if (
            transaction.mac != canonical_device_id
            or transaction.source_sha256 != source_sha256
            or transaction.closed
        ):
            raise KeyError("stale configuration transaction")

    def active_status(self, mac: str) -> TransactionStatus | None:
        """Return the newest live safe transaction status for one meter."""
        mac = canonical_mac(mac)
        for candidate in reversed(self.sessions._transactions()):
            if not isinstance(candidate, _ConfigTransaction) or candidate.mac != mac:
                continue
            try:
                transaction = self._transaction(candidate.transaction_id)
            except KeyError:
                continue
            return _status(transaction)
        return None

    def subscribe(
        self,
        transaction_id: str,
        callback: Callable[[TransactionStatus], None],
    ) -> Callable[[], None]:
        """Subscribe to safe DTO updates without retaining transaction history."""
        self._transaction(transaction_id)
        subscribers = self._subscribers.setdefault(transaction_id, set())
        subscribers.add(callback)

        def unsubscribe() -> None:
            subscribers.discard(callback)
            if not subscribers:
                self._subscribers.pop(transaction_id, None)

        return unsubscribe

    def publish_status(self, status: TransactionStatus) -> None:
        """Publish one already-bounded public status to current subscribers."""
        for callback in tuple(self._subscribers.get(status.transaction_id, ())):
            try:
                callback(status)
            except Exception:  # noqa: BLE001, S110 - subscriber isolation
                pass

    def clear_subscribers(self) -> None:
        """Drop websocket callbacks during provider unload."""
        self._subscribers.clear()

    async def async_preview(
        self,
        mac: str,
        topology: MeterTopology,
        plan: ConfigMutationPlan,
        source_snapshot: ESPHomeConfigSnapshot,
        selections: tuple[StoredCTSelection, ...] = (),
        *,
        meter_configuration: StoredMeterConfiguration | None = None,
        expected_sensor_entities: frozenset[tuple[str, str]] = frozenset(),
        expected_aggregate_sensor_entities: frozenset[tuple[str, str]] = frozenset(),
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
        _validate_expected_sensor_entities(expected_sensor_entities)
        _validate_expected_sensor_entities(expected_aggregate_sensor_entities)
        if not expected_aggregate_sensor_entities <= expected_sensor_entities:
            raise ValueError("aggregate sensor entities are invalid")
        mac = canonical_mac(mac)
        if meter_configuration is not None:
            if not isinstance(meter_configuration, StoredMeterConfiguration):
                raise TypeError("meter configuration must be StoredMeterConfiguration")
            proposed_sha256 = sha256(plan.proposed_content.encode()).hexdigest()
            if meter_configuration.config_sha256 != proposed_sha256:
                raise ValueError("meter configuration does not match mutation plan")
            expected = expected_meter_entity_evidence(
                MeterConfigurationRequest(
                    meter_configuration.meter,
                    meter_configuration.channels,
                    meter_configuration.aggregates,
                    meter_configuration.power_quality,
                    meter_configuration.status_fields,
                    meter_configuration.multi_reference_preparation_acknowledged,
                ),
                topology,
            )
            expected_sensor_entities = expected.sensor_entities
            expected_aggregate_sensor_entities = expected.aggregate_sensor_entities
            selections = ()
        else:
            merged = {
                selection.channel: selection
                for selection in await self._persistence.async_get_ct_selections(mac)
                if selection.config_sha256 == source_snapshot.sha256
            }
            merged.update({selection.channel: selection for selection in selections})
            selections = tuple(merged[channel] for channel in sorted(merged))
        transaction = _ConfigTransaction(
            uuid4().hex,
            self._clock() + self._confirmation_ttl,
            mac,
            topology,
            plan.source_sha256,
            plan.changes,
            _safe_diff(plan.redacted_diff),
            plan,
            source_snapshot.content,
            meter_configuration,
            expected_sensor_entities,
            expected_aggregate_sensor_entities,
            _legacy_ct_selections=selections,
            meter_record=_trusted_meter_record(mac, topology, source_snapshot),
        )
        self.sessions._register_transaction(transaction.transaction_id, transaction)
        return _status(transaction)

    async def async_preview_calibrated_gains(
        self,
        mac: str,
        topology: MeterTopology,
        verification_id: str,
        requested_channels: tuple[CTChangeRequest, ...] = (),
        calibrated_current_channels: frozenset[int] = frozenset(),
        *,
        package_options: Mapping[str, Any] | None = None,
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
            if verified.has_offset_calibration:
                raise ConfigMutationError(
                    "YAML handoff is unavailable; offset calibration remains saved "
                    "in flash"
                )
            if (
                not verified.source_handoff_available
                or verified.config_filename is None
                or verified.config_sha256 is None
            ):
                raise ConfigMutationError("verified calibration has already been used")
            snapshot = await self._device_builder.async_get_config(
                verified.config_filename
            )
            document = ESPHomeConfigDocument.parse(snapshot.content)
            stored_configuration = await self._persistence.async_get_meter_configuration(
                mac
            )
            trusted_voltage_fingerprint = verified_voltage_reference_fingerprint(
                document,
                topology,
                stored_configuration,
            )
            try:
                current_voltage_fingerprint = voltage_reference_topology_from_config(
                    document,
                    topology,
                    trusted_fingerprint=trusted_voltage_fingerprint,
                ).fingerprint
            except ValueError as error:
                if trusted_voltage_fingerprint is not None:
                    raise ConfigMutationError(
                        "verified calibration topology does not match target"
                    ) from error
                current_voltage_fingerprint = voltage_reference_fingerprint_for_meter(
                    topology
                )
            if (
                verified.topology_addon_count != topology.addon_count
                or verified.topology_project_name != topology.project_name
                or verified.topology_connection_type != topology.connection_type
                or verified.topology_voltage_fingerprint
                != current_voltage_fingerprint
            ):
                raise ConfigMutationError(
                    "verified calibration topology does not match target"
                )
            plan = build_calibrated_gain_mutation(
                snapshot,
                topology,
                verified,
                requested_channels,
                calibrated_current_channels,
                package_options=package_options,
                trusted_voltage_fingerprint=trusted_voltage_fingerprint,
            )
            selections: tuple[StoredCTSelection, ...] = ()
            meter_configuration: StoredMeterConfiguration | None = None
            expected_sensor_entities: frozenset[tuple[str, str]] = frozenset()
            expected_aggregate_sensor_entities: frozenset[tuple[str, str]] = (
                frozenset()
            )
            has_stored_configuration = (
                stored_configuration is not None
                and stored_configuration.config_sha256 == snapshot.sha256
            )
            channels: tuple[ChannelSettings, ...] = (
                _channels_with_requests(stored_configuration.channels, requested_channels)
                if has_stored_configuration and stored_configuration is not None
                else ()
            )
            selection_channels: tuple[ChannelSettings | CTChangeRequest, ...] = (
                channels if channels else requested_channels
            )
            if selection_channels:
                proposed_sha256 = sha256(plan.proposed_content.encode()).hexdigest()
                try:
                    selections = _selections_from_document(
                        plan.proposed_content,
                        topology,
                        proposed_sha256,
                        selection_channels,
                    )
                except ValueError:
                    if requested_channels:
                        raise
                else:
                    if has_stored_configuration and stored_configuration is not None:
                        options = package_options_from_document(
                            ESPHomeConfigDocument.parse(plan.proposed_content), topology
                        )
                        request = MeterConfigurationRequest(
                            stored_configuration.meter,
                            channels,
                            stored_configuration.aggregates,
                            options["power_quality"],
                            options["status_fields"],
                        )
                        meter_configuration = StoredMeterConfiguration(
                            proposed_sha256,
                            request.meter,
                            request.channels,
                            request.aggregates,
                            request.power_quality,
                            request.status_fields,
                            selections,
                            request.multi_reference_preparation_acknowledged,
                        )
                        expected = expected_meter_entity_evidence(request, topology)
                        expected_sensor_entities = expected.sensor_entities
                        expected_aggregate_sensor_entities = (
                            expected.aggregate_sensor_entities
                        )
            status = await self.async_preview(
                mac,
                topology,
                plan,
                snapshot,
                selections,
                meter_configuration=meter_configuration,
                expected_sensor_entities=expected_sensor_entities,
                expected_aggregate_sensor_entities=expected_aggregate_sensor_entities,
            )
            transaction = self._transaction(status.transaction_id)
            transaction.verification_id = verification_id
            transaction.reservation_release = lambda: (
                self._persistence.async_release_verified_calibration(
                    mac, verification_id, transaction.transaction_id
                )
            )
            async with _operation(transaction):
                if not await self._claim_verified_calibration(transaction):
                    self._finish(transaction, ConfigTransactionState.FAILED)
                    raise ConfigMutationError(
                        "verified calibration has already been used"
                    )
            return status
        except BaseException as error:
            if transaction is not None and not transaction.closed:
                cleanup_error: BaseException | None = None
                try:
                    await transaction.async_release_reservation()
                except BaseException as release_error:  # noqa: BLE001 - preserve cause
                    cleanup_error = release_error
                if not transaction.reservation_claimed:
                    self._finish(transaction, ConfigTransactionState.FAILED)
                if cleanup_error is not None and cleanup_error is not error:
                    error.add_note(
                        "exact reservation release reconciliation also failed with "
                        f"{type(cleanup_error).__name__}"
                    )
            raise
        finally:
            lease.release()

    def status(self, transaction_id: str) -> TransactionStatus:
        """Return only the safe DTO for a live transaction."""
        return _status(self._transaction(transaction_id))

    async def async_abandon(self, transaction_id: str) -> TransactionStatus:
        """Abandon one unconfirmed preview and scrub all retained configuration."""
        transaction = self._transaction(transaction_id)
        async with _operation(transaction):
            if transaction.state is not ConfigTransactionState.PREVIEWED:
                raise RuntimeError("only an unconfirmed preview can be abandoned")
            await transaction.async_release_reservation()
            return self._finish(
                transaction,
                ConfigTransactionState.FAILED,
                TransactionEvidenceCode.CANCELLED,
            )

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
                try:
                    await transaction.async_release_reservation()
                finally:
                    if not transaction.reservation_claimed:
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
                try:
                    await transaction.async_release_reservation()
                finally:
                    if not transaction.reservation_claimed:
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
            transaction.write_started = True
            try:
                await self._device_builder.async_update_config(
                    snapshot, plan.proposed_content
                )
            except ConfigChangedError as error:
                transaction.write_started = False
                try:
                    await transaction.async_release_reservation()
                except BaseException as cleanup_error:  # noqa: BLE001 - preserve conflict
                    error.add_note(
                        "exact reservation release also failed with "
                        f"{type(cleanup_error).__name__}"
                    )
                if not transaction.reservation_claimed:
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
            self.publish_status(_status(transaction))
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
            self._refresh_deadline(transaction)
            self.publish_status(_status(transaction))
            return _status(transaction)

    async def _claim_verified_calibration(
        self, transaction: _ConfigTransaction
    ) -> bool:
        """Own a claim through its atomic result and preserve caller cancellation."""
        if transaction.verification_id is None:
            raise RuntimeError("verified calibration ID is absent")
        transaction.reservation_claimed = True
        claim = asyncio.create_task(
            self._persistence.async_claim_verified_calibration(
                transaction.mac,
                transaction.verification_id,
                transaction.transaction_id,
            )
        )
        cancelled = False
        while not claim.done():
            try:
                await asyncio.shield(claim)
            except asyncio.CancelledError:
                cancelled = True
        try:
            claimed = claim.result()
        except BaseException as error:
            if cancelled and not isinstance(error, asyncio.CancelledError):
                cancellation = asyncio.CancelledError()
                cancellation.add_note(
                    f"claim completion also failed with {type(error).__name__}"
                )
                raise cancellation from error
            raise
        transaction.reservation_claimed = claimed
        if cancelled:
            raise asyncio.CancelledError
        return claimed

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

    def _retain_write_recovery(
        self,
        transaction: _ConfigTransaction,
    ) -> TransactionStatus:
        if transaction.closed:
            return _status(transaction)
        transaction.state = ConfigTransactionState.FAILED
        transaction.rollback_available = (
            transaction.plan is not None and transaction.prior_content is not None
        )
        self._refresh_deadline(transaction)
        _evidence(transaction, TransactionEvidenceCode.WRITE_RECOVERY_REQUIRED)
        status = _status(transaction)
        self.publish_status(status)
        return status

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
        transaction.upload_progress.clear()
        self.publish_status(_status(transaction))
        try:
            result = await self._device_builder.async_compile(
                plan.configuration,
                lambda update: self._publish_upload_progress(transaction, update),
            )
        except asyncio.CancelledError:
            await self._rollback_after_cancellation(transaction)
            raise
        except Exception:  # noqa: BLE001 - external job boundary
            result = None
        if result is None or not result.success:
            transaction.state = ConfigTransactionState.FAILED
            transaction.rollback_available = True
            _evidence(transaction, TransactionEvidenceCode.COMPILE_FAILED)
            status = _status(transaction)
            self.publish_status(status)
            return status
        transaction.upload_progress.clear()
        transaction.state = ConfigTransactionState.COMPILED
        _progress(transaction, TransactionProgress.FIRMWARE_COMPILED)
        transaction.state = ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        self._refresh_deadline(transaction)
        self.publish_status(_status(transaction))
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
            if transaction.verification_id is not None:
                verified = await self._persistence.async_get_verified_calibration(
                    transaction.mac
                )
                if (
                    verified is not None
                    and verified.verification_id == transaction.verification_id
                    and verified.has_offset_calibration
                ):
                    raise RuntimeError(
                        "YAML handoff is unavailable; offset calibration remains "
                        "saved in flash"
                    )
            transaction.upload_progress.clear()
            transaction.evidence[:] = [
                code
                for code in transaction.evidence
                if code not in _RETRYABLE_INSTALL_EVIDENCE
            ]
            transaction.aggregate_entity_mismatch = False
            transaction.state = ConfigTransactionState.INSTALLING
            self.publish_status(_status(transaction))
            plan, _ = _sensitive(transaction)
            try:
                result = await self._device_builder.async_upload(
                    plan.configuration,
                    lambda update: self._publish_upload_progress(transaction, update),
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
            self.publish_status(_status(transaction))
            error: TransactionEvidenceCode | None = None
            for _attempt in range(_RECONNECT_ATTEMPTS):
                transaction.aggregate_entity_mismatch = False
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
                    error = TransactionEvidenceCode.RECONNECT_UNAVAILABLE
                else:
                    error = _verify_reconnect(transaction, verification)
                if error is None or error not in _RETRYABLE_INSTALL_EVIDENCE:
                    break
            if error is not None:
                if error in _RETRYABLE_INSTALL_EVIDENCE:
                    return self._retain_install_retry(transaction, error)
                return self._finish(transaction, ConfigTransactionState.FAILED, error)
            _progress(transaction, TransactionProgress.DEVICE_VERIFIED)
            self.publish_status(_status(transaction))
            try:
                installed, cancelled = await self._drain_persistence_commit(
                    transaction,
                    self._persist_verified_metadata(transaction, plan)
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
            if not installed:
                status = self._finish(
                    transaction,
                    ConfigTransactionState.FAILED,
                    TransactionEvidenceCode.PERSISTENCE_FAILED,
                )
                if cancelled:
                    raise asyncio.CancelledError
                return status
            _progress(transaction, TransactionProgress.METADATA_PERSISTED)
            status = self._finish(transaction, ConfigTransactionState.VERIFIED)
            if cancelled:
                raise asyncio.CancelledError
            return status

    async def _persist_verified_metadata(
        self, transaction: _ConfigTransaction, plan: ConfigMutationPlan
    ) -> bool:
        """Commit only post-reconnect metadata, including its exact source CAS."""
        if transaction.meter_configuration is not None:
            if transaction.verification_id is None:
                await self._persistence.async_save_verified_meter_configuration(
                    transaction.mac,
                    transaction.source_sha256,
                    transaction.meter_configuration,
                    _meter_record(transaction),
                )
                return True
            return await self._persistence.async_save_verified_meter_configuration_and_mark_verified_calibration_installed(
                transaction.mac,
                transaction.source_sha256,
                transaction.meter_configuration,
                transaction.verification_id,
                transaction.transaction_id,
                _meter_record(transaction),
            )
        selections = tuple(
            replace(
                selection,
                config_sha256=sha256(plan.proposed_content.encode()).hexdigest(),
            )
            for selection in transaction.selections
        )
        if transaction.verification_id is None:
            await self._persistence.async_save_verified_ct_selections(
                transaction.mac, selections
            )
            return True
        return await self._persistence.async_save_verified_ct_selections_and_mark_verified_calibration_installed(
            transaction.mac,
            transaction.source_sha256,
            sha256(plan.proposed_content.encode()).hexdigest(),
            _meter_record(transaction),
            selections,
            transaction.verification_id,
            transaction.transaction_id,
        )

    async def _drain_persistence_commit(
        self, transaction: _ConfigTransaction, commit: Coroutine[Any, Any, bool]
    ) -> tuple[bool, bool]:
        """Drain a started durable commit before reconciling caller cancellation."""
        transaction.persistence_commit_started = True
        task: asyncio.Task[bool] = asyncio.create_task(commit)
        cancelled = False
        while not task.done():
            try:
                await asyncio.shield(task)
            except asyncio.CancelledError:
                cancelled = True
        try:
            return task.result(), cancelled
        except BaseException as error:
            if cancelled:
                cancellation = asyncio.CancelledError()
                cancellation.add_note(
                    "persistence completion also failed with "
                    f"{type(error).__name__}"
                )
                raise cancellation from error
            raise

    def _publish_upload_progress(
        self, transaction: _ConfigTransaction, progress: JobProgress
    ) -> None:
        _upload_progress(transaction, progress)
        self.publish_status(_status(transaction))

    def _retain_install_retry(
        self,
        transaction: _ConfigTransaction,
        code: TransactionEvidenceCode,
    ) -> TransactionStatus:
        transaction.state = ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        transaction.rollback_available = True
        self._refresh_deadline(transaction)
        _evidence(transaction, code)
        status = _status(transaction)
        self.publish_status(status)
        return status

    async def async_rollback(self, transaction_id: str) -> TransactionStatus:
        """Consume the one available rollback and restore through Device Builder once."""
        transaction = self._transaction(transaction_id)
        async with _operation(transaction):
            if transaction.state not in {
                ConfigTransactionState.FAILED,
                ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED,
            } or not transaction.rollback_available:
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
        if TransactionProgress.CONFIG_RESTORED not in transaction.progress:
            try:
                # DeviceBuilder.async_restore_content owns restore plus exactly one validation.
                async with asyncio.timeout(self._reconciliation_timeout):
                    await self._device_builder.async_restore_content(
                        plan.configuration,
                        prior_content,
                        expected_current_sha256=expected_current_sha256,
                    )
            except asyncio.CancelledError:
                _evidence(transaction, TransactionEvidenceCode.CANCELLED)
                self._retain_write_recovery(transaction)
                raise
            except (TimeoutError, ConfigChangedError):
                return self._retain_write_recovery(transaction)
            except Exception as error:
                _evidence(transaction, TransactionEvidenceCode.ROLLBACK_FAILED)
                self._retain_write_recovery(transaction)
                raise RollbackFailedError("configuration rollback failed") from error
            _progress(transaction, TransactionProgress.CONFIG_RESTORED)
            self.publish_status(_status(transaction))
        transaction.write_started = False
        try:
            await transaction.async_release_reservation()
        except asyncio.CancelledError:
            if not transaction.reservation_claimed:
                self._finish(transaction, ConfigTransactionState.ROLLED_BACK)
            else:
                self._retain_write_recovery(transaction)
            raise
        except Exception as error:
            _evidence(transaction, TransactionEvidenceCode.ROLLBACK_FAILED)
            self._retain_write_recovery(transaction)
            raise RollbackFailedError("configuration rollback cleanup failed") from error
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
        if self._clock() >= transaction.expires_at:
            self._expire(transaction)
            raise KeyError("expired configuration transaction")
        return transaction

    def _refresh_deadline(self, transaction: _ConfigTransaction) -> None:
        transaction.expires_at = self._clock() + self._confirmation_ttl

    def _expire(self, transaction: _ConfigTransaction) -> None:
        """Refuse an expired handle and recover any uncompiled remote write."""
        if (
            transaction.closed
            or transaction.expiry_cleanup_started
            or transaction.persistence_commit_started
        ):
            return
        recover_write = transaction.write_started and transaction.state not in {
            ConfigTransactionState.COMPILED,
            ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED,
            ConfigTransactionState.INSTALLING,
            ConfigTransactionState.RECONNECTING,
            ConfigTransactionState.VERIFIED,
        }
        transaction.state = ConfigTransactionState.FAILED
        if recover_write:
            transaction.rollback_available = True
            self._refresh_deadline(transaction)
            self.publish_status(_status(transaction))

            async def recover_then_settle() -> None:
                try:
                    async with _operation(transaction):
                        await self._rollback_locked(transaction)
                except RollbackFailedError, asyncio.CancelledError:
                    pass

            transaction.expiry_cleanup_started = True
            cleanup = asyncio.create_task(recover_then_settle())
            transaction.active_tasks.add(cleanup)
            cleanup.add_done_callback(transaction.active_tasks.discard)
            return
        self.publish_status(_status(transaction))
        if transaction.reservation_claimed and not transaction.write_started:
            _release(transaction)

            async def release_then_scrub() -> None:
                try:
                    await transaction.async_release_reservation()
                except BaseException:
                    _LOGGER.exception("configuration reservation release failed")
                    raise
                finally:
                    transaction.scrub()
                    self.sessions._remove_transaction(transaction.transaction_id)
                    self._subscribers.pop(transaction.transaction_id, None)

            transaction.expiry_cleanup_started = True
            cleanup = asyncio.create_task(release_then_scrub())
            transaction.active_tasks.add(cleanup)
            return
        _release(transaction)
        transaction.scrub()
        self.sessions._remove_transaction(transaction.transaction_id)
        self._subscribers.pop(transaction.transaction_id, None)

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
        self.publish_status(status)
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


def _channels_with_requests(
    channels: tuple[ChannelSettings, ...], requests: tuple[CTChangeRequest, ...]
) -> tuple[ChannelSettings, ...]:
    requested = {request.channel: request for request in requests}
    return tuple(
        replace(
            channel,
            name=change.name,
            model_id=change.model_id,
            reporting_multiplier=change.reporting_multiplier,
            custom_gain_ct=change.custom_gain_ct,
            custom_label=change.custom_label,
            burden_output_acknowledged=change.burden_output_acknowledged,
        )
        if (change := requested.get(channel.channel)) is not None
        else channel
        for channel in channels
    )


def _selections_from_document(
    content: str,
    topology: MeterTopology,
    config_sha256: str,
    channels: tuple[ChannelSettings | CTChangeRequest, ...],
) -> tuple[StoredCTSelection, ...]:
    inventory = CTInventory.from_document(
        ESPHomeConfigDocument.parse(content),
        topology,
        CTPresetCatalog.load(),
        config_sha256,
        reporting_multipliers={
            channel.channel: channel.reporting_multiplier for channel in channels
        },
    )
    by_channel = {item.channel: item for item in inventory.channels}
    return tuple(
        StoredCTSelection(
            channel.channel,
            channel.model_id,
            channel.custom_label,
            by_channel[channel.channel].raw_gain_ct,
            channel.reporting_multiplier,
            config_sha256,
        )
        for channel in channels
    )


def _sensitive(
    transaction: _ConfigTransaction,
) -> tuple[ConfigMutationPlan, str]:
    if transaction.plan is None or transaction.prior_content is None:
        raise RuntimeError("configuration transaction has been cleaned up")
    return transaction.plan, transaction.prior_content


def _trusted_meter_record(
    mac: str, topology: MeterTopology, snapshot: ESPHomeConfigSnapshot
) -> StoredMeterRecord:
    """Bind initial persistence to server-owned source identity and topology."""
    return StoredMeterRecord(
        mac,
        "meter_configuration",
        snapshot.configuration,
        StoredTopology(
            topology.addon_count,
            topology.board_count,
            topology.ct_count,
            topology.group_count,
            topology.connection_type,
            topology.voltage_layout,
            topology.project_name,
            tuple(
                StoredTopologyEvidence(
                    evidence.source.value, evidence.addon_count, evidence.detail
                )
                for evidence in topology.evidence
            ),
        ),
        snapshot.sha256,
    )


def _meter_record(transaction: _ConfigTransaction) -> StoredMeterRecord:
    if transaction.meter_record is None:
        raise RuntimeError("trusted meter record is absent")
    return transaction.meter_record


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
        transaction.aggregate_entity_mismatch,
        transaction.meter_configuration is not None
        and transaction.state is ConfigTransactionState.VERIFIED,
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
            visible = encoded.decode("utf-8", "ignore")
            if visible.strip().casefold() == "failed config":
                error_records = min(999, error_records + 1)
                continue
            match = _DIAGNOSTIC_RECORD.match(visible)
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


def _validate_expected_sensor_entities(
    sensor_entities: frozenset[tuple[str, str]],
) -> None:
    """Require bounded, one-to-one native sensor object-ID/name evidence."""
    if type(sensor_entities) is not frozenset or len(sensor_entities) > 128:
        raise ValueError("expected sensor entities are invalid")
    object_ids: set[str] = set()
    for pair in sensor_entities:
        if type(pair) is not tuple or len(pair) != 2:
            raise ValueError("expected sensor entities are invalid")
        object_id, _name = pair
        if (
            object_id in object_ids
            or any(
                type(value) is not str
                or not value
                or len(value.encode()) > 120
                or any(ord(character) < 32 for character in value)
                for value in pair
            )
        ):
            raise ValueError("expected sensor entities are invalid")
        object_ids.add(object_id)


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
    try:
        evidence_mac = canonical_mac(evidence.mac)
    except ValueError:
        return TransactionEvidenceCode.IDENTITY_MISMATCH
    if evidence_mac != transaction.mac:
        return TransactionEvidenceCode.IDENTITY_MISMATCH
    if evidence.topology != transaction.topology:
        return TransactionEvidenceCode.TOPOLOGY_MISMATCH
    expected_channels = set(range(1, transaction.topology.ct_count + 1))
    if set(evidence.ct_names) != expected_channels:
        return TransactionEvidenceCode.ENTITY_MISMATCH
    if transaction.meter_configuration is not None:
        if any(
            evidence.ct_names.get(channel.channel) != channel.name
            for channel in transaction.meter_configuration.channels
        ):
            return TransactionEvidenceCode.ENTITY_MISMATCH
    else:
        plan, _ = _sensitive(transaction)
        for change in plan.changes:
            if change.key.startswith("ct") and change.key.endswith("_name"):
                channel = int(change.key.removeprefix("ct").removesuffix("_name"))
                if evidence.ct_names.get(channel) != change.new_value:
                    return TransactionEvidenceCode.ENTITY_MISMATCH
    sensor_evidence_invalid = (
        type(evidence.sensor_entities) is not frozenset
        or type(evidence.duplicate_sensor_object_ids) is not frozenset
        or any(
            type(object_id) is not str or not object_id
            for object_id in evidence.duplicate_sensor_object_ids
        )
        or {
            object_id for object_id, _name in transaction.expected_sensor_entities
        }
        & evidence.duplicate_sensor_object_ids
        or not transaction.expected_sensor_entities.issubset(
            evidence.sensor_entities
        )
    )
    if sensor_evidence_invalid:
        transaction.aggregate_entity_mismatch = _aggregate_entity_evidence_missing(
            transaction, evidence
        )
        return TransactionEvidenceCode.ENTITY_MISMATCH
    if evidence.current_sensor_count != transaction.topology.ct_count:
        return TransactionEvidenceCode.SENSOR_COUNT_MISMATCH
    return None


def _aggregate_entity_evidence_missing(
    transaction: _ConfigTransaction, evidence: ReconnectEvidence
) -> bool:
    """Mark only a missing or duplicate aggregate entity from verified inventory."""
    expected = transaction.expected_aggregate_sensor_entities
    if (
        type(evidence.sensor_entities) is not frozenset
        or type(evidence.duplicate_sensor_object_ids) is not frozenset
    ):
        return False
    return bool(expected) and (
        not expected.issubset(evidence.sensor_entities)
        or bool(
            {object_id for object_id, _name in expected}
            & evidence.duplicate_sensor_object_ids
        )
    )
