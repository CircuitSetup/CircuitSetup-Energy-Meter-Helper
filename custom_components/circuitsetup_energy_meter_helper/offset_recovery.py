"""Private, durable recovery data; never calibration verification or public DTOs."""

from __future__ import annotations

import asyncio
import json
import re
from dataclasses import asdict, dataclass, replace
from hashlib import sha256
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

from homeassistant.core import HomeAssistant
from homeassistant.util.file import write_utf8_file_atomic

from .config_document import _MAX_DOCUMENT_BYTES, ESPHomeConfigDocument
from .config_mutator import _gain_group_address, build_offset_table_mutation
from .device_builder import ESPHomeConfigSnapshot
from .log_parser import OffsetTableSnapshot
from .models import ConfigMutationPlan, MeterTopology, PhaseOffsetTable, canonical_mac
from .session_manager import CalibrationLease, ConfigLease, SessionManager
from .store import _configuration_hash, _exact_mapping, _validate_group_table
from .topology import topology_from_config, topology_from_native

_MAX_RECORD_BYTES = 2 * _MAX_DOCUMENT_BYTES
_MAX_OBSERVATIONS = 512
ZERO_OFFSETS = ((0, 0), (0, 0), (0, 0))


@dataclass(frozen=True, slots=True)
class StockOffsetPreparation:
    """Exact internal purpose binding. Its presence alone never authorizes Run."""

    operation_id: str
    revision: int
    transaction_id: str
    session_id: str
    source_sha256: str
    proposed_sha256: str
    stage: Literal[1, 2]
    targets: tuple[str, ...]
    generation: int


@dataclass(frozen=True, slots=True, repr=False)
class SavedOffsetObservation:
    source_sha256: str
    snapshot: OffsetTableSnapshot


@dataclass(frozen=True, slots=True, repr=False)
class CapturedOffsetResult:
    instance_id: str
    stage: Literal[1, 2]
    phase_values: PhaseOffsetTable
    generation: int
    operation_id: str
    source_sha256: str
    register_verified: bool


@dataclass(frozen=True, slots=True, repr=False)
class OffsetRecoveryRecord:
    mac: str
    original: ESPHomeConfigSnapshot
    topology: MeterTopology
    observations: tuple[SavedOffsetObservation, ...]
    revision: int = 0
    preparation: StockOffsetPreparation | None = None
    installed: bool = False
    cancelled: bool = False
    attempted: tuple[str, ...] = ()
    results: tuple[CapturedOffsetResult, ...] = ()


def _hash(value: object) -> str:
    result = _configuration_hash({"config_sha256": value})
    if result is None:
        raise ValueError("invalid recovery digest")
    return result


def _topology_identity(topology: MeterTopology) -> tuple[object, ...]:
    return (
        topology.addon_count,
        topology.project_name,
        topology.connection_type,
        topology.voltage_layout,
    )


def _validate_source(snapshot: ESPHomeConfigSnapshot, topology: MeterTopology) -> None:
    from .calibration_engine import _CONFIGURATION_ID

    if (
        not isinstance(snapshot.configuration, str)
        or _CONFIGURATION_ID.fullmatch(snapshot.configuration) is None
        or not isinstance(snapshot.content, str)
        or sha256(snapshot.content.encode()).hexdigest() != _hash(snapshot.sha256)
        or getattr(snapshot, "configuration_authoritative", True) is not True
    ):
        raise ValueError("invalid recovery source")
    document = ESPHomeConfigDocument.parse(snapshot.content)
    actual = topology_from_config(document, native_project_name=topology.project_name)
    if _topology_identity(actual) != _topology_identity(topology):
        raise ValueError("recovery topology changed")


def _validate_observation(
    item: SavedOffsetObservation, topology: MeterTopology
) -> None:
    _hash(item.source_sha256)
    snapshot = item.snapshot
    if (
        type(snapshot.connection_generation) is not int
        or snapshot.connection_generation < 1
        or type(snapshot.offset_stage) is not int
        or snapshot.offset_stage not in (1, 2)
        or snapshot.reported_state not in ("restored", "mismatch")
        or type(snapshot.register_verified) is not bool
        or type(snapshot.config_differs_from_flash) is not bool
        or snapshot.config_differs_from_flash != (snapshot.reported_state == "mismatch")
    ):
        raise ValueError("invalid recovery observation")
    _gain_group_address(snapshot.instance_id, topology)
    _validate_group_table(
        snapshot.instance_id, snapshot.phase_values, signed=True, label="offsets"
    )


def _encode(record: OffsetRecoveryRecord) -> bytes:
    if (
        canonical_mac(record.mac) != record.mac
        or type(record.revision) is not int
        or record.revision < 0
    ):
        raise ValueError("invalid recovery identity")
    _validate_source(record.original, record.topology)
    if not record.observations or len(record.observations) > _MAX_OBSERVATIONS:
        raise ValueError("invalid recovery observation count")
    for item in record.observations:
        _validate_observation(item, record.topology)
    if type(record.installed) is not bool or type(record.cancelled) is not bool:
        raise ValueError("invalid recovery state")
    preparation = record.preparation
    if preparation is not None:
        for value in (
            preparation.operation_id,
            preparation.transaction_id,
            preparation.session_id,
        ):
            if (
                not isinstance(value, str)
                or re.fullmatch(r"[0-9a-f]{32}", value) is None
            ):
                raise ValueError("invalid preparation identity")
        _hash(preparation.source_sha256)
        _hash(preparation.proposed_sha256)
        if (
            type(preparation.revision) is not int
            or not 1 <= preparation.revision <= record.revision
            or type(preparation.stage) is not int
            or preparation.stage not in (1, 2)
            or type(preparation.generation) is not int
            or preparation.generation < 1
            or not preparation.targets
            or len(preparation.targets) > 2
            or len(set(preparation.targets)) != len(preparation.targets)
        ):
            raise ValueError("invalid preparation targets")
        boards = {
            _gain_group_address(instance, record.topology)[0]
            for instance in preparation.targets
        }
        if len(boards) != 1:
            raise ValueError("preparation spans boards")
        for instance in preparation.targets:
            if not any(
                item.source_sha256 == preparation.source_sha256
                and item.snapshot.connection_generation == preparation.generation
                and item.snapshot.offset_stage == preparation.stage
                and item.snapshot.instance_id == instance
                for item in record.observations
            ):
                raise ValueError("preparation backup is absent")
    elif record.installed or record.cancelled:
        raise ValueError("preparation identity is absent")
    if (
        len(set(record.attempted)) != len(record.attempted)
        or record.attempted
        and (
            preparation is None or not set(record.attempted) <= set(preparation.targets)
        )
    ):
        raise ValueError("invalid preparation attempts")
    if len(record.results) > 28 or len(
        {(item.instance_id, item.stage) for item in record.results}
    ) != len(record.results):
        raise ValueError("invalid recovery result count")
    for result in record.results:
        _gain_group_address(result.instance_id, record.topology)
        _validate_group_table(
            result.instance_id, result.phase_values, signed=True, label="offsets"
        )
        _hash(result.source_sha256)
        if (
            type(result.stage) is not int
            or result.stage not in (1, 2)
            or type(result.generation) is not int
            or result.generation < 1
            or not isinstance(result.operation_id, str)
            or re.fullmatch(r"[0-9a-f]{32}", result.operation_id) is None
            or type(result.register_verified) is not bool
        ):
            raise ValueError("invalid recovery result evidence")
    raw = asdict(record)
    raw["schema"] = 1
    # Evidence labels are not source identity; derive the same supported topology on read.
    raw["topology"] = list(_topology_identity(record.topology))
    encoded = json.dumps(
        raw, ensure_ascii=False, separators=(",", ":"), sort_keys=True
    ).encode()
    if len(encoded) > _MAX_RECORD_BYTES:
        raise ValueError("recovery record exceeds limit")
    return encoded


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    if len(pairs) != len(dict(pairs)):
        raise ValueError("duplicate recovery fields")
    return dict(pairs)


def _decode(data: bytes) -> OffsetRecoveryRecord:
    try:
        raw = _exact_mapping(
            json.loads(data, object_pairs_hook=_unique_object),
            {
                "schema",
                "mac",
                "original",
                "topology",
                "observations",
                "revision",
                "preparation",
                "installed",
                "cancelled",
                "attempted",
                "results",
            },
            "recovery",
        )
        if type(raw["schema"]) is not int or raw["schema"] != 1:
            raise ValueError("invalid recovery schema")
        identity = raw["topology"]
        if (
            not isinstance(identity, list)
            or len(identity) != 4
            or type(identity[0]) is not int
        ):
            raise ValueError("invalid recovery topology")
        topology = replace(topology_from_native(identity[1]), evidence=())
        if list(_topology_identity(topology)) != identity:
            raise ValueError("invalid recovery topology")
        original = ESPHomeConfigSnapshot(
            **_exact_mapping(
                raw["original"], {"configuration", "content", "sha256"}, "source"
            )
        )
        observations = []
        if (
            not isinstance(raw["observations"], list)
            or len(raw["observations"]) > _MAX_OBSERVATIONS
        ):
            raise ValueError("invalid recovery observations")
        for value in raw["observations"]:
            item = _exact_mapping(value, {"source_sha256", "snapshot"}, "observation")
            snapshot = _exact_mapping(
                item["snapshot"],
                {
                    "connection_generation",
                    "instance_id",
                    "offset_stage",
                    "phase_values",
                    "reported_state",
                    "register_verified",
                    "config_differs_from_flash",
                },
                "snapshot",
            )
            snapshot["phase_values"] = tuple(
                tuple(phase) for phase in snapshot["phase_values"]
            )
            observations.append(
                SavedOffsetObservation(
                    item["source_sha256"], OffsetTableSnapshot(**snapshot)
                )
            )
        preparation = raw["preparation"]
        if preparation is not None:
            preparation = _exact_mapping(
                preparation,
                {
                    "operation_id",
                    "revision",
                    "transaction_id",
                    "session_id",
                    "source_sha256",
                    "proposed_sha256",
                    "stage",
                    "targets",
                    "generation",
                },
                "preparation",
            )
            if not isinstance(preparation["targets"], list):
                raise ValueError("invalid preparation targets")
            preparation["targets"] = tuple(preparation["targets"])
            preparation = StockOffsetPreparation(**preparation)
        if (
            not isinstance(raw["attempted"], list)
            or not isinstance(raw["results"], list)
            or len(raw["results"]) > 28
        ):
            raise ValueError("invalid recovery progress")
        results = []
        for value in raw["results"]:
            result = _exact_mapping(
                value,
                {
                    "instance_id",
                    "stage",
                    "phase_values",
                    "generation",
                    "operation_id",
                    "source_sha256",
                    "register_verified",
                },
                "result",
            )
            result["phase_values"] = tuple(
                tuple(phase) for phase in result["phase_values"]
            )
            results.append(CapturedOffsetResult(**result))
        record = OffsetRecoveryRecord(
            raw["mac"],
            original,
            topology,
            tuple(observations),
            raw["revision"],
            preparation,
            raw["installed"],
            raw["cancelled"],
            tuple(raw["attempted"]),
            tuple(results),
        )
        _encode(record)
        return record
    except Exception:  # noqa: BLE001 - malformed private data must not be reflected
        raise ValueError("recovery record is invalid") from None


class OffsetRecovery:
    """One bounded private artifact per meter, protected by existing meter leases."""

    def __init__(self, hass: HomeAssistant, sessions: SessionManager) -> None:
        self._hass = hass
        self._sessions = sessions
        self._confirmed_receipts: dict[str, StockOffsetPreparation] = {}

    def _path(self, lease: CalibrationLease | ConfigLease) -> Path:
        if isinstance(lease, CalibrationLease):
            self._sessions._require_active_calibration_lease(lease)
        elif (
            lease.released
            or lease.lock is not self._sessions._locks(lease.mac).config
            or not lease.lock.locked()
        ):
            raise ValueError("recovery requires an active meter lease")
        return Path(
            self._hass.config.path(
                ".storage", f"csemh-offset-recovery-{canonical_mac(lease.mac)}.json"
            )
        )

    @staticmethod
    def _read(path: Path) -> bytes:
        with path.open("rb") as stream:
            data = stream.read(_MAX_RECORD_BYTES + 1)
        if len(data) > _MAX_RECORD_BYTES:
            raise ValueError("recovery record exceeds limit")
        return data

    async def async_load(
        self, lease: CalibrationLease | ConfigLease
    ) -> OffsetRecoveryRecord | None:
        path = self._path(lease)
        try:
            data = await self._hass.async_add_executor_job(self._read, path)
        except FileNotFoundError:
            return None
        except Exception:  # noqa: BLE001 - redact filesystem errors
            raise ValueError("recovery record is unavailable") from None
        record = _decode(data)
        if record.mac != lease.mac:
            raise ValueError("recovery meter identity changed")
        return record

    def is_action_ready(self, record: OffsetRecoveryRecord | None) -> bool:
        """Check Core-local confirmation against a freshly loaded durable receipt."""
        return bool(
            record is not None
            and record.installed
            and not record.cancelled
            and record.preparation is not None
            and self._confirmed_receipts.get(record.mac) == record.preparation
        )

    async def _save(
        self, lease: CalibrationLease | ConfigLease, record: OffsetRecoveryRecord
    ) -> None:
        path, data = self._path(lease), _encode(record)
        if record.mac != lease.mac:
            raise ValueError("recovery meter identity changed")

        def write_and_read() -> None:
            path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            write_utf8_file_atomic(str(path), data, private=True, mode="wb")
            if self._read(path) != data:
                raise ValueError("recovery readback mismatch")

        task = asyncio.ensure_future(self._hass.async_add_executor_job(write_and_read))
        cancelled = False
        while not task.done():
            try:
                await asyncio.shield(task)
            except asyncio.CancelledError:
                cancelled = True
            except Exception:  # noqa: BLE001 - drain failure before reporting
                break
        if cancelled:
            try:
                task.result()
            except Exception:  # noqa: BLE001, S110 - cancellation remains primary, never log payloads
                pass
            raise asyncio.CancelledError
        try:
            task.result()
        except Exception:  # noqa: BLE001 - redact filesystem errors
            raise ValueError("recovery persistence failed") from None

    async def async_backup(
        self,
        lease: CalibrationLease,
        source: ESPHomeConfigSnapshot,
        topology: MeterTopology,
        snapshots: tuple[OffsetTableSnapshot, ...],
    ) -> OffsetRecoveryRecord:
        _validate_source(source, topology)
        original = await self.async_load(lease)
        if original is not None and (
            _topology_identity(original.topology) != _topology_identity(topology)
            or source.configuration != original.original.configuration
            or (
                original.original.sha256 != source.sha256
                and (
                    original.preparation is None
                    or not original.installed
                    or source.sha256 != original.preparation.proposed_sha256
                )
            )
        ):
            raise ValueError("recovery source changed")
        additions = tuple(
            SavedOffsetObservation(source.sha256, item) for item in snapshots
        )
        if not additions:
            raise ValueError("recovery requires exact saved tables")
        record = (
            OffsetRecoveryRecord(
                lease.mac, source, replace(topology, evidence=()), additions
            )
            if original is None
            else replace(
                original,
                observations=original.observations + additions,
                revision=original.revision + 1,
            )
        )
        pending = self._sessions.pending_calibration(lease.mac)
        if pending is not None:
            retained = {(item.instance_id, item.stage): item for item in record.results}
            stages: tuple[Literal[1, 2], ...] = (1, 2)
            for stage in stages:
                groups = (
                    pending.offset_groups if stage == 1 else pending.power_offset_groups
                )
                for instance, table in groups:
                    if (instance, stage) in retained:
                        if retained[(instance, stage)].phase_values != table:
                            raise ValueError("completed offset tables conflict")
                        continue
                    observed = next(
                        (
                            item
                            for item in snapshots
                            if item.instance_id == instance
                            and item.offset_stage == stage
                            and item.phase_values == table
                        ),
                        None,
                    )
                    if (
                        observed is None
                        or pending.claimed_revision is not None
                        or pending.config_sha256 != source.sha256
                        or pending.config_filename != source.configuration
                        or _topology_identity(pending.topology)
                        != _topology_identity(topology)
                    ):
                        raise ValueError(
                            "completed offsets need fresh source and table reconciliation"
                        )
                    # Existing strict runs already required positive readback. The
                    # generation here is the fresh capture, not an invented run epoch.
                    retained[(instance, stage)] = CapturedOffsetResult(
                        instance,
                        stage,
                        table,
                        observed.connection_generation,
                        pending.operation_id,
                        source.sha256,
                        True,
                    )
            record = replace(record, results=tuple(retained.values()))
        await self._save(lease, record)
        return record

    async def async_prepare(
        self,
        lease: CalibrationLease,
        record: OffsetRecoveryRecord,
        source: ESPHomeConfigSnapshot,
        plan: ConfigMutationPlan,
        session_id: str,
        stage: Literal[1, 2],
        targets: tuple[str, ...],
        generation: int,
    ) -> StockOffsetPreparation:
        if await self.async_load(lease) != record:
            raise ValueError("recovery revision changed")
        zeros = {instance: ZERO_OFFSETS for instance in targets}
        if any(
            item.stage == stage and item.instance_id in targets
            for item in record.results
        ):
            raise ValueError("offset chip is already complete")
        rms = {
            item.instance_id: item.phase_values
            for item in record.results
            if item.stage == 1
        }
        power = {
            item.instance_id: item.phase_values
            for item in record.results
            if item.stage == 2
        }
        (rms if stage == 1 else power).update(zeros)
        expected = build_offset_table_mutation(
            source,
            record.topology,
            rms,
            power,
            enable_calibration=frozenset(targets),
        )
        if plan != expected:
            raise ValueError("preparation plan changed")
        preparation = StockOffsetPreparation(
            uuid4().hex,
            record.revision + 1,
            uuid4().hex,
            session_id,
            source.sha256,
            sha256(plan.proposed_content.encode()).hexdigest(),
            stage,
            targets,
            generation,
        )
        self._confirmed_receipts.pop(lease.mac, None)
        await self._save(
            lease,
            replace(
                record,
                revision=record.revision + 1,
                preparation=preparation,
                installed=False,
                cancelled=False,
                attempted=(),
            ),
        )
        return preparation

    async def async_require(
        self,
        lease: CalibrationLease | ConfigLease,
        preparation: StockOffsetPreparation,
        *,
        installed: bool,
    ) -> OffsetRecoveryRecord:
        record = await self.async_load(lease)
        if (
            record is None
            or record.preparation != preparation
            or record.cancelled
            or record.installed is not installed
            or installed
            and not self.is_action_ready(record)
        ):
            raise ValueError("stock offset preparation is stale or unavailable")
        return record

    async def async_mark_installed(
        self, lease: ConfigLease, preparation: StockOffsetPreparation
    ) -> None:
        record = await self.async_require(lease, preparation, installed=False)
        try:
            await self._save(
                lease, replace(record, installed=True, revision=record.revision + 1)
            )
        except Exception, asyncio.CancelledError:
            # An uncertain write/readback must not leave installed authorization.
            self._confirmed_receipts.pop(lease.mac, None)
            await self._save(
                lease, replace(record, cancelled=True, revision=record.revision + 1)
            )
            raise
        self._confirmed_receipts[lease.mac] = preparation

    async def async_cancel(
        self, lease: CalibrationLease | ConfigLease, preparation: StockOffsetPreparation
    ) -> None:
        self._path(lease)
        if self._confirmed_receipts.get(lease.mac) == preparation:
            self._confirmed_receipts.pop(lease.mac)
        record = await self.async_load(lease)
        if record is None or record.preparation != preparation:
            raise ValueError("stock offset preparation changed")
        await self._save(
            lease, replace(record, cancelled=True, revision=record.revision + 1)
        )

    async def async_begin_attempt(
        self,
        lease: CalibrationLease,
        preparation: StockOffsetPreparation,
        instance_id: str,
    ) -> None:
        record = await self.async_require(lease, preparation, installed=True)
        if (
            instance_id not in preparation.targets
            or instance_id in record.attempted
            or any(
                item.instance_id == instance_id and item.stage == preparation.stage
                for item in record.results
            )
        ):
            raise ValueError(
                "offset chip is complete or already attempted; new preparation required"
            )
        await self._save(
            lease,
            replace(
                record,
                attempted=(*record.attempted, instance_id),
                revision=record.revision + 1,
            ),
        )

    async def async_capture_result(
        self,
        lease: CalibrationLease,
        preparation: StockOffsetPreparation,
        instance_id: str,
        table: PhaseOffsetTable,
        generation: int,
        register_verified: bool,
    ) -> None:
        record = await self.async_require(lease, preparation, installed=True)
        if instance_id not in record.attempted or any(
            item.instance_id == instance_id and item.stage == preparation.stage
            for item in record.results
        ):
            raise ValueError("offset result has no unique attempt")
        result = CapturedOffsetResult(
            instance_id,
            preparation.stage,
            table,
            generation,
            preparation.operation_id,
            preparation.proposed_sha256,
            register_verified,
        )
        await self._save(
            lease,
            replace(
                record, results=(*record.results, result), revision=record.revision + 1
            ),
        )
