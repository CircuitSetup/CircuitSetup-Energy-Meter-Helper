"""Private, durable recovery data; never calibration verification or public DTOs."""

from __future__ import annotations

import asyncio
import json
import re
from collections.abc import Awaitable, Callable
from dataclasses import asdict, dataclass, replace
from hashlib import sha256
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

import yaml  # type: ignore[import-untyped]
from homeassistant.core import HomeAssistant
from homeassistant.util.file import write_utf8_file_atomic
from yaml.nodes import (  # type: ignore[import-untyped]
    MappingNode,
    Node,
    ScalarNode,
    SequenceNode,
)

from .config_blocks import replace_managed_block
from .config_document import _MAX_DOCUMENT_BYTES, ESPHomeConfigDocument
from .config_mutator import (
    _gain_group_address,
    _read_calibrated_offset_entries,
    _reject_local_offset_overrides,
    build_offset_table_mutation,
)
from .device_builder import ESPHomeConfigSnapshot
from .log_parser import OffsetTableSnapshot
from .models import ConfigMutationPlan, MeterTopology, PhaseOffsetTable, canonical_mac
from .package_contract import (
    calibration_package_path,
    common_package_path,
    offset_calibration_package_path,
    package_path,
)
from .session_manager import CalibrationLease, ConfigLease, SessionManager
from .store import _configuration_hash, _exact_mapping, _validate_group_table
from .topology import (
    package_graph_owner_is_official,
    topology_from_config,
    topology_from_native,
)

_MAX_RECORD_BYTES = 2 * _MAX_DOCUMENT_BYTES
_MAX_OBSERVATIONS = 512
ZERO_OFFSETS = ((0, 0), (0, 0), (0, 0))
FIRST_CALIBRATION_CONFIGURATION: Literal["first_calibration_configuration"] = (
    "first_calibration_configuration"
)
type PreparationMode = Literal["native", "legacy"]
_DEFAULT_OFFSET_CS_PINS = ((5, 4), (0, 16), (27, 17), (2, 21), (13, 22), (14, 25), (15, 26))


def _supported_offset_package_graph(
    document: ESPHomeConfigDocument, topology: MeterTopology
) -> bool:
    """Accept only the checked-in package paths whose offset defaults are known."""
    if not document.package_references:
        return True
    if not package_graph_owner_is_official(document):
        return False
    common = common_package_path(topology.connection_type)
    if common is None:
        return False
    paths = {common}
    for board_index in range(topology.board_count):
        board = "main" if board_index == 0 else f"addon{board_index}"
        paths.update(
            {
                f"Software/ESPHome/meter_sensors/6chan_{'main_sensor' if board_index == 0 else board}.yaml",
                calibration_package_path(board_index),
                offset_calibration_package_path(board_index),
                package_path("power_quality", board_index),
                package_path("status_fields", board_index),
            }
        )
    return all(
        reference.path in paths and reference.ref == "master"
        for reference in document.package_references
    )


def source_offset_cs_pins(
    source: ESPHomeConfigSnapshot,
    topology: MeterTopology,
    instance_ids: set[str] | frozenset[str],
) -> dict[str, int]:
    """Resolve selected stock chips from authoritative source/package semantics."""
    _validate_source(source, topology)
    requested = set(instance_ids)
    default_pins: dict[str, int] = {}
    for board in range(topology.board_count):
        for group in range(2):
            instance = (
                f"meter_main{group + 1}"
                if board == 0
                else f"addon{board}_{group + 1}"
            )
            default_pins[instance] = _DEFAULT_OFFSET_CS_PINS[board][group]
    if not requested or not requested <= default_pins.keys():
        raise ValueError("selected offset chip identities are unavailable")
    document = ESPHomeConfigDocument.parse(source.content)
    if (
        document.unresolved_package_sources
        or not _supported_offset_package_graph(document, topology)
    ):
        raise ValueError("selected offset chip identities are unavailable")
    aliases: dict[str, str] = {}
    for instance in default_pins:
        board, group = _gain_group_address(instance, topology)
        meter_key = (
            f"main_meter_id{group}"
            if board == 0
            else f"addon{board}_id{group}"
        )
        for alias in (instance, meter_key):
            previous = aliases.setdefault(alias, instance)
            if previous != instance:
                raise ValueError("offset chip identity mapping is ambiguous")
        if meter_key in document.substitutions:
            alias = document.substitutions[meter_key].value
            previous = aliases.setdefault(alias, instance)
            if previous != instance:
                raise ValueError("offset chip identity mapping is ambiguous")
    explicit_pins: dict[str, int] = {}
    local_definitions = _apply_source_offset_cs_pin_overrides(
        document, aliases, explicit_pins
    )
    package_instances: set[str] = set()
    if document.package_references:
        active_package_paths = {
            reference.path
            for reference in document.package_references
            if reference.active
        }
        for board in range(topology.board_count):
            sensor_paths = (
                {"Software/ESPHome/meter_sensors/6chan_main_sensor.yaml"}
                if board == 0
                else {f"Software/ESPHome/meter_sensors/6chan_addon{board}.yaml"}
            )
            if sensor_paths & active_package_paths:
                package_instances.update(
                    (
                        f"meter_main{group + 1}"
                        if board == 0
                        else f"addon{board}_{group + 1}"
                    )
                    for group in range(2)
                )
    established = local_definitions | package_instances
    if not requested <= established or not established <= set(default_pins):
        raise ValueError("selected offset chip identities are unavailable")
    all_pins = {
        instance: default_pins[instance]
        for instance in package_instances
    }
    all_pins.update(explicit_pins)
    if not set(all_pins) >= requested:
        raise ValueError("selected offset chip identities are unavailable")
    if len(set(all_pins.values())) != len(all_pins):
        raise ValueError("offset chip CS pin mapping is ambiguous")
    return {instance: all_pins[instance] for instance in requested}


def _apply_source_offset_cs_pin_overrides(
    document: ESPHomeConfigDocument,
    aliases: dict[str, str],
    pins: dict[str, int],
) -> set[str]:
    """Read only direct, literal top-level sensor overrides."""
    try:
        root = yaml.compose(document.content)
    except yaml.YAMLError as error:
        raise ValueError("selected offset chip identities are unavailable") from error
    if not isinstance(root, MappingNode):
        raise ValueError("selected offset chip identities are unavailable")  # noqa: TRY004
    sensors = [value for key, value in root.value if isinstance(key, ScalarNode) and key.value == "sensor"]
    if not sensors:
        return set()
    if (
        len(sensors) != 1
        or document.writable_sensor_span is None
        or not isinstance(sensors[0], SequenceNode)
    ):
        raise ValueError("selected offset chip identities are unavailable")
    overrides: set[str] = set()
    local_definitions: set[str] = set()
    for item in sensors[0].value:
        if not isinstance(item, MappingNode):
            raise ValueError("selected offset chip identities are unavailable")  # noqa: TRY004
        values: dict[str, Node] = {}
        keys: set[str] = set()
        for key, value in item.value:
            if not isinstance(key, ScalarNode) or key.value in keys:
                raise ValueError("selected offset chip identities are unavailable")
            keys.add(key.value)
            values[key.value] = value
        if "<<" in keys:
            raise ValueError("selected offset chip identities are unavailable")
        id_node = values.get("id")
        if id_node is not None and not isinstance(id_node, ScalarNode):
            raise ValueError("selected offset chip identities are unavailable")
        if id_node is not None and id_node.tag not in {
            "tag:yaml.org,2002:str",
            "!extend",
        }:
            raise ValueError("selected offset chip identities are unavailable")
        platform = _literal_node_value(values.get("platform"))
        if "platform" in keys and platform is None:
            raise ValueError("selected offset chip identities are unavailable")
        has_cs_pin = "cs_pin" in keys
        instance = _source_offset_instance(id_node, document, aliases)
        is_atm90e32 = platform == "atm90e32" or platform is None and instance is not None
        if platform == "atm90e32" or has_cs_pin:
            is_atm90e32 = True
        if not is_atm90e32:
            continue
        if instance is None or platform not in (None, "atm90e32"):
            raise ValueError("selected offset chip identities are unavailable")
        if not has_cs_pin:
            if platform is None and id_node is not None and id_node.tag != "!extend":
                raise ValueError("selected offset chip identities are unavailable")
            if platform == "atm90e32" and id_node is not None and id_node.tag != "!extend":
                raise ValueError("selected offset chip identities are unavailable")
            continue
        if platform is None and (id_node is None or id_node.tag != "!extend"):
            raise ValueError("selected offset chip identities are unavailable")
        if instance in overrides:
            raise ValueError("offset chip identity is duplicated")
        cs_pin_node = values["cs_pin"]
        if not isinstance(cs_pin_node, ScalarNode):
            raise ValueError("selected offset chip identities are unavailable")  # noqa: TRY004
        pin = _source_offset_cs_pin(cs_pin_node)
        pins[instance] = pin
        overrides.add(instance)
        if platform == "atm90e32" and id_node is not None and id_node.tag != "!extend":
            local_definitions.add(instance)
    return local_definitions


def _source_offset_instance(
    node: ScalarNode | None,
    document: ESPHomeConfigDocument,
    aliases: dict[str, str],
) -> str | None:
    if node is None:
        return None
    value = node.value.strip()
    seen: set[str] = set()
    for _ in range(4):
        if value in seen:
            return None
        seen.add(value)
        if value.startswith("${") and value.endswith("}"):
            key = value[2:-1]
            substitution = document.substitutions.get(key)
            if substitution is None:
                return aliases.get(key)
            value = substitution.value.strip()
            continue
        return aliases.get(value)
    return None


def _literal_node_value(node: ScalarNode | None) -> str | None:
    if node is None or node.tag not in {"tag:yaml.org,2002:str", "tag:yaml.org,2002:int"}:
        return None
    return node.value.strip()


def _source_offset_cs_pin(node: ScalarNode) -> int:
    value = _literal_node_value(node)
    if value is None:
        raise ValueError("selected offset chip identities are unavailable")
    match = re.fullmatch(r"(?:GPIO)?(\d{1,2})", value, re.IGNORECASE)
    if match is None:
        raise ValueError("selected offset chip identities are unavailable")
    pin = int(match.group(1))
    if not 0 <= pin <= 63:
        raise ValueError("selected offset chip identities are unavailable")
    return pin


def source_offset_snapshots(
    source: ESPHomeConfigSnapshot,
    topology: MeterTopology,
    instance_ids: set[str],
    connection_generation: int,
    *,
    stages: tuple[Literal[1, 2], ...] = (1, 2),
    reported_state: Literal[
        "configuration", "first_calibration_configuration"
    ] = FIRST_CALIBRATION_CONFIGURATION,
    require_complete: bool = False,
) -> tuple[OffsetTableSnapshot, ...]:
    """Project known configuration offsets without treating flash as evidence."""
    if reported_state not in ("configuration", FIRST_CALIBRATION_CONFIGURATION):
        raise ValueError("configuration offset provenance is invalid")
    _validate_source(source, topology)
    document = ESPHomeConfigDocument.parse(source.content)
    if (
        document.unresolved_package_sources
        or not _supported_offset_package_graph(document, topology)
    ):
        raise ValueError("configuration offset provenance is unavailable")
    source_without_managed_offsets = source.content
    if "calibrated_offsets" in document.managed_blocks:
        source_without_managed_offsets = replace_managed_block(
            source_without_managed_offsets, "calibrated_offsets", ""
        )
    _reject_local_offset_overrides(
        source_without_managed_offsets,
        topology,
        instance_ids,
        document.substitutions,
    )
    entries = _read_calibrated_offset_entries(document, topology)
    snapshots: list[OffsetTableSnapshot] = []
    for instance_id in sorted(instance_ids):
        configured = entries.get(instance_id, {})
        for stage in stages:
            field = "rms" if stage == 1 else "power"
            if require_complete and field not in configured:
                raise ValueError("configuration offset table is incomplete")
            # Stock ATM90E32 uses zero when a configuration offset is absent.
            snapshots.append(
                OffsetTableSnapshot(
                    connection_generation,
                    instance_id,
                    stage,
                    configured.get(field, ZERO_OFFSETS),
                    reported_state,
                    False,
                    False,
                )
            )
    return tuple(snapshots)


@dataclass(frozen=True, slots=True)
class StockOffsetPreparation:
    """Exact internal purpose binding. Its presence alone never authorizes Run."""

    operation_id: str
    revision: int
    transaction_id: str | None
    session_id: str
    source_sha256: str
    proposed_sha256: str
    stage: Literal[1, 2]
    targets: tuple[str, ...]
    generation: int
    mode: PreparationMode = "legacy"
    clear_targets: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True, repr=False)
class SavedOffsetObservation:
    source_sha256: str
    snapshot: OffsetTableSnapshot


@dataclass(frozen=True, slots=True, repr=False)
class StockOffsetFinalization:
    """Private final review, bound to the exact immutable candidate revision."""

    operation_id: str
    revision: int
    transaction_id: str
    session_id: str
    original_sha256: str
    evidence_sha256: str
    source_sha256: str
    proposed_sha256: str
    targets: tuple[str, ...]
    generation: int
    verification_id: str | None = None


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
    finalization: StockOffsetFinalization | None = None
    final_installed: bool = False
    final_cancelled: bool = False
    configuration_selected: bool = False


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
        or snapshot.reported_state not in (
            "restored",
            "mismatch",
            "configuration",
            FIRST_CALIBRATION_CONFIGURATION,
        )
        or type(snapshot.register_verified) is not bool
        or type(snapshot.config_differs_from_flash) is not bool
        or snapshot.config_differs_from_flash != (snapshot.reported_state == "mismatch")
        or snapshot.reported_state in ("configuration", FIRST_CALIBRATION_CONFIGURATION)
        and snapshot.register_verified
    ):
        raise ValueError(
            "configuration observation cannot claim register verification"
            if snapshot.reported_state == "configuration" and snapshot.register_verified
            else "invalid recovery observation"
        )
    _gain_group_address(snapshot.instance_id, topology)
    _validate_group_table(
        snapshot.instance_id, snapshot.phase_values, signed=True, label="offsets"
    )


def _has_unfinished_preparation(record: OffsetRecoveryRecord) -> bool:
    preparation = record.preparation
    if preparation is None:
        return False
    completed = {(item.instance_id, item.stage) for item in record.results}
    return any(
        (instance, preparation.stage) not in completed
        for instance in preparation.targets
    )


def _final_evidence_hash(record: OffsetRecoveryRecord) -> str:
    return sha256(
        json.dumps(
            {
                "original": asdict(record.original),
                "topology": _topology_identity(record.topology),
                "observations": [asdict(item) for item in record.observations],
                "results": [asdict(item) for item in record.results],
            },
            sort_keys=True,
            separators=(",", ":"),
        ).encode()
    ).hexdigest()


def _offset_observation_tables(
    observations: tuple[SavedOffsetObservation, ...],
    *,
    source_sha256: str | None = None,
    allowed_sources: set[str] | None = None,
) -> dict[tuple[str, int], PhaseOffsetTable]:
    tables: dict[tuple[str, int], PhaseOffsetTable] = {}
    for item in observations:
        if source_sha256 is not None and item.source_sha256 != source_sha256:
            continue
        if allowed_sources is not None and item.source_sha256 not in allowed_sources:
            continue
        key = (item.snapshot.instance_id, item.snapshot.offset_stage)
        if item.snapshot.reported_state in ("configuration", FIRST_CALIBRATION_CONFIGURATION):
            tables.setdefault(key, item.snapshot.phase_values)
        else:
            tables[key] = item.snapshot.phase_values
    return tables


def _allowed_observation_sources(record: OffsetRecoveryRecord) -> set[str]:
    allowed = {record.original.sha256}
    if record.preparation is not None:
        allowed.add(record.preparation.source_sha256)
        if record.installed:
            allowed.add(record.preparation.proposed_sha256)
    if record.finalization is not None:
        allowed.add(record.finalization.source_sha256)
        allowed.add(record.finalization.proposed_sha256)
    return allowed


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
        for value in (preparation.operation_id, preparation.session_id):
            if (
                not isinstance(value, str)
                or re.fullmatch(r"[0-9a-f]{32}", value) is None
            ):
                raise ValueError("invalid preparation identity")
        if preparation.mode not in ("native", "legacy"):
            raise ValueError("invalid preparation mode")
        if preparation.mode == "legacy" and (
            not isinstance(preparation.transaction_id, str)
            or re.fullmatch(r"[0-9a-f]{32}", preparation.transaction_id) is None
        ):
            raise ValueError("invalid preparation identity")
        if preparation.mode == "native" and (
            preparation.transaction_id is not None
            or preparation.proposed_sha256 != preparation.source_sha256
        ):
            raise ValueError("invalid native preparation")
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
            or len(set(preparation.clear_targets)) != len(preparation.clear_targets)
            or len(preparation.clear_targets) > len(preparation.targets)
            or not set(preparation.clear_targets) <= set(preparation.targets)
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
    final = record.finalization
    if any(
        type(value) is not bool
        for value in (
            record.final_installed,
            record.final_cancelled,
            record.configuration_selected,
        )
    ):
        raise ValueError("invalid finalization state")
    if final is None:
        if (
            record.final_installed
            or record.final_cancelled
            or record.configuration_selected
        ):
            raise ValueError("finalization identity is absent")
    else:
        for value in (final.operation_id, final.transaction_id, final.session_id):
            if (
                not isinstance(value, str)
                or re.fullmatch(r"[0-9a-f]{32}", value) is None
            ):
                raise ValueError("invalid finalization identity")
        for value in (
            final.original_sha256,
            final.source_sha256,
            final.proposed_sha256,
        ):
            _hash(value)
        if (
            final.original_sha256 != record.original.sha256
            or final.evidence_sha256 != _final_evidence_hash(record)
            or type(final.revision) is not int
            or not 1 <= final.revision <= record.revision
            or type(final.generation) is not int
            or final.generation < 1
            or not final.targets
            or len(final.targets) > 14
            or len(set(final.targets)) != len(final.targets)
            or set(final.targets) != {item.instance_id for item in record.results}
            or final.verification_id is not None
            and (
                not isinstance(final.verification_id, str)
                or re.fullmatch(r"[0-9a-f]{32}", final.verification_id) is None
            )
            or record.configuration_selected
            and (not record.final_installed or record.final_cancelled)
        ):
            raise ValueError("invalid finalization binding")
    raw = asdict(record)
    raw["schema"] = 2
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
        decoded = json.loads(data, object_pairs_hook=_unique_object)
        if (
            isinstance(decoded, dict)
            and type(decoded.get("schema")) is int
            and decoded["schema"] == 1
        ):
            # Existing Task7 records remain valid; no legacy field may be replaced.
            if set(decoded) != {
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
            }:
                raise ValueError("invalid recovery fields")
            decoded.update(
                schema=2,
                finalization=None,
                final_installed=False,
                final_cancelled=False,
                configuration_selected=False,
            )
        raw = _exact_mapping(
            decoded,
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
                "finalization",
                "final_installed",
                "final_cancelled",
                "configuration_selected",
            },
            "recovery",
        )
        if type(raw["schema"]) is not int or raw["schema"] != 2:
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
        source_keys = raw["original"]
        if not isinstance(source_keys, dict):
            raise TypeError("invalid recovery source")
        if set(source_keys) == {"configuration", "content", "sha256"}:
            source = _exact_mapping(source_keys, set(source_keys), "source")
            source["configuration_authoritative"] = True
        else:
            source = _exact_mapping(
                source_keys,
                {"configuration", "configuration_authoritative", "content", "sha256"},
                "source",
            )
        original = ESPHomeConfigSnapshot(**source)
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
            legacy_keys = {
                "operation_id",
                "revision",
                "transaction_id",
                "session_id",
                "source_sha256",
                "proposed_sha256",
                "stage",
                "targets",
                "generation",
            }
            preparation_keys = legacy_keys | {"mode", "clear_targets"}
            if isinstance(preparation, dict) and set(preparation) == legacy_keys:
                preparation = _exact_mapping(
                    preparation, legacy_keys, "preparation"
                )
                preparation["mode"] = "legacy"
                preparation["clear_targets"] = []
            elif isinstance(preparation, dict) and set(preparation) == legacy_keys | {"mode"}:
                preparation = _exact_mapping(
                    preparation, legacy_keys | {"mode"}, "preparation"
                )
                preparation["clear_targets"] = []
            else:
                preparation = _exact_mapping(
                    preparation, preparation_keys, "preparation"
                )
            if not isinstance(preparation["targets"], list) or not isinstance(
                preparation["clear_targets"], list
            ):
                raise ValueError("invalid preparation targets")
            preparation["targets"] = tuple(preparation["targets"])
            preparation["clear_targets"] = tuple(preparation["clear_targets"])
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
        final = raw["finalization"]
        if final is not None:
            final = _exact_mapping(
                final,
                {
                    "operation_id",
                    "revision",
                    "transaction_id",
                    "session_id",
                    "original_sha256",
                    "evidence_sha256",
                    "source_sha256",
                    "proposed_sha256",
                    "targets",
                    "generation",
                    "verification_id",
                },
                "finalization",
            )
            if not isinstance(final["targets"], list):
                raise ValueError("invalid finalization targets")
            final["targets"] = tuple(final["targets"])
            final = StockOffsetFinalization(**final)
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
            final,
            raw["final_installed"],
            raw["final_cancelled"],
            raw["configuration_selected"],
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
        self._confirmed_final_receipts: dict[str, StockOffsetFinalization] = {}

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

    def is_action_ready(
        self, record: OffsetRecoveryRecord | None, *, generation: int | None = None
    ) -> bool:
        """Check Core-local confirmation against a freshly loaded durable receipt."""
        if (
            record is None
            or record.cancelled
            or record.preparation is None
            or record.finalization is not None
            or self._confirmed_receipts.get(record.mac) != record.preparation
        ):
            return False
        if record.preparation.mode == "native":
            return not record.installed and (
                generation is None or record.preparation.generation == generation
            )
        return record.installed

    async def _save(
        self, lease: CalibrationLease | ConfigLease, record: OffsetRecoveryRecord
    ) -> None:
        path, data = self._path(lease), _encode(record)
        if record.mac != lease.mac:
            raise ValueError("recovery meter identity changed")
        await self._write(path, data)

    async def _write(self, path: Path, data: bytes) -> None:

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
        pending = self._sessions.pending_calibration(lease.mac)
        replace_stale_preview = False
        if original is not None:
            if (
                _topology_identity(original.topology) != _topology_identity(topology)
                or source.configuration != original.original.configuration
            ):
                raise ValueError("recovery source changed")
            if original.original.sha256 != source.sha256:
                accepted_preparation_source = original.preparation is not None and (
                    source.sha256 == original.preparation.source_sha256
                    or (
                        original.installed
                        and source.sha256 == original.preparation.proposed_sha256
                    )
                )
                replace_stale_preview = (
                    not accepted_preparation_source
                    and original.preparation is not None
                    and not original.installed
                    and not original.attempted
                    and not original.results
                    and original.finalization is None
                    and not original.final_installed
                    and not original.final_cancelled
                    and not original.configuration_selected
                    and pending is None
                )
                if not accepted_preparation_source and not replace_stale_preview:
                    raise ValueError("recovery source changed")
        additions = tuple(
            SavedOffsetObservation(source.sha256, item) for item in snapshots
        )
        if not additions:
            raise ValueError("recovery requires exact saved tables")
        record = (
            OffsetRecoveryRecord(
                lease.mac,
                source,
                replace(topology, evidence=()),
                (original.observations if replace_stale_preview and original else ())
                + additions,
                revision=original.revision + 1
                if replace_stale_preview and original
                else 0,
            )
            if original is None or replace_stale_preview
            else replace(
                original,
                observations=original.observations + additions,
                revision=original.revision + 1,
            )
        )
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
                        or observed.reported_state
                        in ("configuration", FIRST_CALIBRATION_CONFIGURATION)
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

    @staticmethod
    def build_finalization_plan(
        record: OffsetRecoveryRecord,
        source: ESPHomeConfigSnapshot,
        *,
        gain_plan: ConfigMutationPlan | None = None,
    ) -> ConfigMutationPlan:
        """Select exact captured tables and known effective unchanged stages."""
        _validate_source(source, record.topology)
        if _has_unfinished_preparation(record):
            raise ValueError("unfinished offset preparation requires retry before final review")
        targets = {item.instance_id for item in record.results}
        if not targets:
            raise ValueError("captured offset results are absent")
        allowed_sources = {record.original.sha256}
        if record.preparation is not None:
            allowed_sources.add(record.preparation.source_sha256)
            if record.installed:
                allowed_sources.add(record.preparation.proposed_sha256)
        if record.finalization is not None:
            allowed_sources.add(record.finalization.source_sha256)
            allowed_sources.add(record.finalization.proposed_sha256)
        tables = _offset_observation_tables(
            record.observations, allowed_sources=allowed_sources
        )
        tables.update(
            {
                (item.instance_id, item.stage): item.phase_values
                for item in record.results
            }
        )
        if any(
            (instance, stage) not in tables for instance in targets for stage in (1, 2)
        ):
            raise ValueError("both effective offset stages must be known")
        if gain_plan is not None:
            if (
                gain_plan.configuration != source.configuration
                or gain_plan.source_sha256 != source.sha256
            ):
                raise ValueError("gain plan source changed")
            base = replace(
                source,
                content=gain_plan.proposed_content,
                sha256=sha256(gain_plan.proposed_content.encode()).hexdigest(),
            )
        else:
            base = source
        plan = build_offset_table_mutation(
            base,
            record.topology,
            {instance: tables[(instance, 1)] for instance in targets},
            {instance: tables[(instance, 2)] for instance in targets},
            enable_calibration=dict.fromkeys(targets, False),
        )
        return replace(
            plan,
            source_sha256=source.sha256,
            changes=gain_plan.changes if gain_plan is not None else (),
            redacted_diff=(gain_plan.redacted_diff + plan.redacted_diff)
            if gain_plan is not None
            else plan.redacted_diff,
        )

    async def async_review_finalization(
        self,
        lease: CalibrationLease | ConfigLease,
        record: OffsetRecoveryRecord,
        source: ESPHomeConfigSnapshot,
        plan: ConfigMutationPlan,
        session_id: str,
        generation: int,
        *,
        gain_plan: ConfigMutationPlan | None = None,
        verification_id: str | None = None,
    ) -> StockOffsetFinalization:
        if await self.async_load(lease) != record:
            raise ValueError("recovery revision changed")
        if plan != self.build_finalization_plan(record, source, gain_plan=gain_plan):
            raise ValueError("finalization plan changed")
        if (gain_plan is None) != (verification_id is None):
            raise ValueError("finalization gain reservation is absent")
        eligible = {record.original.sha256}
        if record.preparation is not None:
            eligible.add(record.preparation.source_sha256)
            if record.installed:
                eligible.add(record.preparation.proposed_sha256)
        if record.finalization is not None:
            eligible.add(record.finalization.source_sha256)
            # Re-reviewing exact final YAML is recovery intent, never action authority.
            eligible.add(record.finalization.proposed_sha256)
        if (
            source.configuration != record.original.configuration
            or source.sha256 not in eligible
        ):
            raise ValueError("finalization source changed")
        final = StockOffsetFinalization(
            uuid4().hex,
            record.revision + 1,
            uuid4().hex,
            session_id,
            record.original.sha256,
            _final_evidence_hash(record),
            source.sha256,
            sha256(plan.proposed_content.encode()).hexdigest(),
            tuple(sorted({item.instance_id for item in record.results})),
            generation,
            verification_id,
        )
        self._confirmed_receipts.pop(lease.mac, None)
        self._confirmed_final_receipts.pop(lease.mac, None)
        await self._save(
            lease,
            replace(
                record,
                revision=final.revision,
                finalization=final,
                final_installed=False,
                final_cancelled=False,
                configuration_selected=False,
            ),
        )
        return final

    def is_finalization_ready(self, record: OffsetRecoveryRecord | None) -> bool:
        return bool(
            record is not None
            and record.finalization is not None
            and record.final_installed
            and not record.final_cancelled
            and not _has_unfinished_preparation(record)
            and self._confirmed_final_receipts.get(record.mac) == record.finalization
        )

    async def async_require_finalization(
        self,
        lease: CalibrationLease | ConfigLease,
        final: StockOffsetFinalization,
        *,
        installed: bool,
    ) -> OffsetRecoveryRecord:
        record = await self.async_load(lease)
        if (
            record is None
            or record.finalization != final
            or record.final_cancelled
            or record.final_installed is not installed
            or record.revision
            != final.revision
            + int(record.final_installed)
            + int(record.configuration_selected)
            or installed
            and not self.is_finalization_ready(record)
        ):
            raise ValueError("stock offset finalization is stale or unavailable")
        return record

    async def async_mark_final_installed(
        self, lease: ConfigLease, final: StockOffsetFinalization
    ) -> None:
        record = await self.async_require_finalization(lease, final, installed=False)
        try:
            await self._save(
                lease,
                replace(record, final_installed=True, revision=record.revision + 1),
            )
        except Exception, asyncio.CancelledError:
            self._confirmed_final_receipts.pop(lease.mac, None)
            await self._save(
                lease,
                replace(record, final_cancelled=True, revision=record.revision + 1),
            )
            raise
        self._confirmed_final_receipts[lease.mac] = final

    async def async_cancel_finalization(
        self, lease: CalibrationLease | ConfigLease, final: StockOffsetFinalization
    ) -> None:
        self._path(lease)
        if self._confirmed_final_receipts.get(lease.mac) == final:
            self._confirmed_final_receipts.pop(lease.mac)
        record = await self.async_load(lease)
        if record is None or record.finalization != final:
            raise ValueError("stock offset finalization changed")
        await self._save(
            lease,
            replace(
                record,
                final_cancelled=True,
                configuration_selected=False,
                revision=record.revision + 1,
            ),
        )

    async def async_reconcile_finalization(
        self,
        lease: CalibrationLease,
        final: StockOffsetFinalization,
        api: Any,
        *,
        source_reader: Callable[[], Awaitable[ESPHomeConfigSnapshot]],
        claim_guard: Callable[[], None] = lambda: None,
        timeout: float = 5.0,
    ) -> OffsetRecoveryRecord:
        """Require normal installed receipt and fresh native selection of exact YAML."""
        record = await self.async_require_finalization(lease, final, installed=True)

        async def check_source() -> ESPHomeConfigSnapshot:
            claim_guard()
            source = await source_reader()
            _validate_source(source, record.topology)
            if (
                source.configuration != record.original.configuration
                or source.sha256 != final.proposed_sha256
            ):
                raise ValueError("final offset source changed")
            claim_guard()
            return source

        await check_source()
        generation = api.connection_generation
        selected = await api.async_offset_configuration_selection(
            set(final.targets), timeout=timeout
        )
        if selected != dict.fromkeys(final.targets, generation):
            raise ValueError("fresh offset configuration selection is absent")
        async with api.hold_connection_generation(generation):
            await check_source()
            if (
                await self.async_require_finalization(lease, final, installed=True)
                != record
            ):
                raise ValueError("final offset recovery changed")
            if record.configuration_selected:
                return record
            updated = replace(
                record, configuration_selected=True, revision=record.revision + 1
            )
            try:
                await self._save(lease, updated)
                await check_source()
                if not api.connected or api.connection_generation != generation:
                    raise ValueError("final offset connection changed")
                if (
                    await self.async_require_finalization(lease, final, installed=True)
                    != updated
                ):
                    raise ValueError("final offset recovery changed")
            except Exception, asyncio.CancelledError:
                await self.async_cancel_finalization(lease, final)
                raise
            return updated

    async def async_load_archive(
        self, lease: CalibrationLease
    ) -> OffsetRecoveryRecord | None:
        path = self._path(lease).with_suffix(".previous.json")
        try:
            data = await self._hass.async_add_executor_job(self._read, path)
        except FileNotFoundError:
            return None
        except Exception:  # noqa: BLE001 - redact private archive paths and payloads
            raise ValueError("recovery archive is unavailable") from None
        record = _decode(data)
        if (
            record.mac != lease.mac
            or not record.configuration_selected
            or record.final_cancelled
            or _has_unfinished_preparation(record)
        ):
            raise ValueError("recovery archive is not a finalized operation")
        return record

    async def async_begin_new_cycle(
        self,
        lease: CalibrationLease,
        api: Any,
        *,
        source_reader: Callable[[], Awaitable[ESPHomeConfigSnapshot]],
        backup_acknowledged: bool,
        claim_guard: Callable[[], None] = lambda: None,
        timeout: float = 5.0,
    ) -> OffsetRecoveryRecord:
        """Explicit bounded rotation: keep the active operation and one predecessor."""
        if backup_acknowledged is not True:
            raise ValueError("new cycle backup acknowledgement is absent")
        record = await self.async_load(lease)
        if (
            record is None
            or record.finalization is None
            or not record.configuration_selected
            or _has_unfinished_preparation(record)
        ):
            raise ValueError("unfinished recovery cannot start a new cycle")
        generation = api.connection_generation
        record = await self.async_reconcile_finalization(
            lease,
            record.finalization,
            api,
            source_reader=source_reader,
            claim_guard=claim_guard,
            timeout=timeout,
        )
        await self.async_load_archive(
            lease
        )  # Unknown or malformed history is never overwritten.
        source = await source_reader()
        _validate_source(source, record.topology)
        assert record.finalization is not None
        if (
            source.sha256 != record.finalization.proposed_sha256
            or source.configuration != record.original.configuration
        ):
            raise ValueError("final offset source changed")
        observations = tuple(
            SavedOffsetObservation(source.sha256, snapshot)
            for snapshot in source_offset_snapshots(
                source,
                record.topology,
                set(record.finalization.targets),
                generation,
                reported_state="configuration",
                require_complete=True,
            )
        )
        new = OffsetRecoveryRecord(lease.mac, source, record.topology, observations)
        async with api.hold_connection_generation(generation):
            claim_guard()
            await self._write(
                self._path(lease).with_suffix(".previous.json"), _encode(record)
            )
            claim_guard()
            if (
                await self.async_load(lease) != record
                or await source_reader() != source
            ):
                raise ValueError("new cycle recovery or source changed")
            try:
                await self._save(lease, new)
                claim_guard()
                if (
                    await source_reader() != source
                    or await self.async_load(lease) != new
                ):
                    raise ValueError("new cycle source or recovery changed")
                claim_guard()
            except Exception, asyncio.CancelledError:
                await self._save(lease, record)
                raise
        self._confirmed_receipts.pop(lease.mac, None)
        self._confirmed_final_receipts.pop(lease.mac, None)
        return new

    async def async_prepare(
        self,
        lease: CalibrationLease,
        record: OffsetRecoveryRecord,
        source: ESPHomeConfigSnapshot,
        plan: ConfigMutationPlan | None,
        session_id: str,
        stage: Literal[1, 2],
        targets: tuple[str, ...],
        generation: int,
        *,
        mode: PreparationMode = "native",
        clear_targets: tuple[str, ...] = (),
    ) -> StockOffsetPreparation:
        if await self.async_load(lease) != record:
            raise ValueError("recovery revision changed")
        if record.finalization is not None:
            raise ValueError("finalized offsets require an explicit new cycle")
        _validate_source(source, record.topology)
        if mode != "native" or plan is not None:
            raise ValueError("new offset preparations are native only")
        no_clear = set(targets) - set(clear_targets)
        for instance in no_clear:
            matching = tuple(
                item
                for item in record.observations
                if item.source_sha256 == source.sha256
                and item.snapshot.connection_generation == generation
                and item.snapshot.instance_id == instance
                and item.snapshot.offset_stage == stage
            )
            if not matching or any(
                item.snapshot.reported_state != FIRST_CALIBRATION_CONFIGURATION
                or item.snapshot.phase_values != ZERO_OFFSETS
                for item in matching
            ):
                raise ValueError("native clear eligibility is unproven")
        transaction_id = None
        proposed_sha256 = source.sha256
        preparation = StockOffsetPreparation(
            uuid4().hex,
            record.revision + 1,
            transaction_id,
            session_id,
            source.sha256,
            proposed_sha256,
            stage,
            targets,
            generation,
            mode,
            clear_targets,
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
        self._confirmed_receipts[lease.mac] = preparation
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
            or (installed or preparation.mode == "native")
            and not self.is_action_ready(record)
        ):
            raise ValueError("stock offset preparation is stale or unavailable")
        return record

    async def async_mark_installed(
        self, lease: ConfigLease, preparation: StockOffsetPreparation
    ) -> None:
        if preparation.mode != "legacy":
            raise ValueError("native preparation has no install receipt")
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
        record = await self.async_require(
            lease, preparation, installed=preparation.mode != "native"
        )
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
        record = await self.async_require(
            lease, preparation, installed=preparation.mode != "native"
        )
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
