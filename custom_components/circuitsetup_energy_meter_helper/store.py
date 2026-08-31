"""Versioned storage for safe CircuitSetup helper metadata."""

from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass, replace
from enum import StrEnum
from typing import Any, cast

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .ct_catalog import REPORTING_MULTIPLIERS
from .meter_configuration import (
    AggregateTotalSource,
    AutomaticTotalSettings,
    BoardTotalSettings,
    ChannelSettings,
    ChannelTotalSource,
    CircuitAggregate,
    CircuitRole,
    DefaultTotalsSettings,
    ElectricalSystem,
    EnergyMode,
    MeasurementMethod,
    MeterConfigurationRequest,
    MeterSettings,
    NativeTotalSource,
    TotalOrigin,
    TotalOutputSettings,
    VoltageLayout,
    VoltageReferenceConfig,
    _source_id,
    _total_outputs,
    validate_meter_configuration,
)
from .models import (
    ConnectionType,
    MeterTopology,
    PhaseOffsetTable,
    PhasePowerOffsetTable,
    StoredCTSelection,
    StoredInterruptedSession,
    StoredMeterRecord,
    StoredTopology,
    StoredTopologyEvidence,
    canonical_mac,
)
from .topology import legacy_voltage_reference_topology
from .total_graph import automatic_total_candidates, default_total_settings

STORAGE_VERSION = 1
STORAGE_MINOR_VERSION = 5
STORAGE_KEY = "circuitsetup_energy_meter_helper"


class CalibrationSourceAuthority(StrEnum):
    """The source currently used by the running ATM90E32 component."""

    SAVED_FLASH = "saved_flash"
    CONFIGURATION = "configuration"


type PhaseGainTable = tuple[tuple[int, int], tuple[int, int], tuple[int, int]]


def _validate_group_table(
    instance_id: str,
    table: PhaseGainTable | PhaseOffsetTable | PhasePowerOffsetTable,
    *,
    signed: bool,
    label: str,
) -> None:
    if re.fullmatch(r"(?:meter_main[12]|addon[1-6]_[12])", instance_id) is None:
        raise ValueError("instance_id is not a supported ATM90E32 group")
    if (
        type(table) is not tuple
        or len(table) != 3
        or any(type(phase) is not tuple or len(phase) != 2 for phase in table)
        or any(type(value) is not int for phase in table for value in phase)
    ):
        raise ValueError(
            "verified gains require three phases of two non-boolean integers"
            if label == "gains"
            else f"verified {label} require three signed phase pairs"
        )
    if signed:
        if any(not -32_768 <= value <= 32_767 for phase in table for value in phase):
            raise ValueError(f"verified {label} must be signed 16-bit values")
    elif any(not 1 <= value <= 65_535 for phase in table for value in phase):
        raise ValueError("verified gains must be 16-bit positive values")


@dataclass(frozen=True, slots=True)
class VerifiedGainGroup:
    """One exactly verified post-restart ATM90E32 gain table."""

    instance_id: str
    phase_gains: PhaseGainTable

    def __post_init__(self) -> None:
        _validate_group_table(
            self.instance_id, self.phase_gains, signed=False, label="gains"
        )


@dataclass(frozen=True, slots=True)
class VerifiedOffsetGroup:
    """One exactly verified voltage/current offset table."""

    instance_id: str
    phase_offsets: PhaseOffsetTable

    def __post_init__(self) -> None:
        _validate_group_table(
            self.instance_id, self.phase_offsets, signed=True, label="offsets"
        )


@dataclass(frozen=True, slots=True)
class VerifiedPowerOffsetGroup:
    """One exactly verified active/reactive power-offset table."""

    instance_id: str
    phase_power_offsets: PhasePowerOffsetTable

    def __post_init__(self) -> None:
        _validate_group_table(
            self.instance_id,
            self.phase_power_offsets,
            signed=True,
            label="power offsets",
        )


@dataclass(frozen=True, slots=True)
class VerifiedCalibrationRecord:
    """Compact final calibration record persisted only after restart verification."""

    mac: str
    config_filename: str | None
    config_sha256: str | None
    topology_addon_count: int
    topology_project_name: str
    topology_connection_type: str
    topology_voltage_layout: str
    connection_generation: int
    groups: tuple[VerifiedGainGroup, ...]
    verification_id: str
    topology_voltage_fingerprint: str | None = None
    offset_groups: tuple[VerifiedOffsetGroup, ...] = ()
    power_offset_groups: tuple[VerifiedPowerOffsetGroup, ...] = ()
    source_authority: CalibrationSourceAuthority = (
        CalibrationSourceAuthority.SAVED_FLASH
    )
    source_handoff_available: bool = True
    source_handoff_transaction_id: str | None = None
    source_handoff_firmware_installed: bool = False

    def __post_init__(self) -> None:
        object.__setattr__(self, "mac", canonical_mac(self.mac))
        if (self.config_filename is None) != (self.config_sha256 is None):
            raise ValueError("configuration filename and hash must be present together")
        if self.config_filename is not None and (
            not self.config_filename
            or "\n" in self.config_filename
            or "\r" in self.config_filename
        ):
            raise ValueError("configuration filename must be a non-empty single line")
        if (
            self.config_sha256 is not None
            and re.fullmatch(r"[0-9a-f]{64}", self.config_sha256) is None
        ):
            raise ValueError("configuration hash must be SHA-256")
        if not 0 <= self.topology_addon_count <= 6:
            raise ValueError("topology add-on count is invalid")
        if (
            not self.topology_project_name
            or "\n" in self.topology_project_name
            or "\r" in self.topology_project_name
        ):
            raise ValueError("topology project name must be a non-empty single line")
        if not self.topology_connection_type or not self.topology_voltage_layout:
            raise ValueError("topology connection and voltage layout are required")
        if self.topology_voltage_fingerprint is None:
            try:
                fingerprint = legacy_voltage_reference_topology(
                    self.topology_addon_count + 1, self.topology_voltage_layout
                ).fingerprint
            except ValueError:
                fingerprint = f"legacy:{self.topology_voltage_layout}"
            object.__setattr__(self, "topology_voltage_fingerprint", fingerprint)
        elif re.fullmatch(
            r"(?:v1:[0-9a-f]{64}|legacy:[a-z0-9_-]{1,64})",
            self.topology_voltage_fingerprint,
        ) is None:
            raise ValueError("topology voltage fingerprint is invalid")
        if self.connection_generation < 1 or not (
            self.groups or self.offset_groups or self.power_offset_groups
        ):
            raise ValueError("verified calibration requires a generation and groups")
        if re.fullmatch(r"[0-9a-f]{32}", self.verification_id) is None:
            raise ValueError("verification ID must be a server-generated identifier")
        if type(self.source_handoff_available) is not bool:
            raise ValueError("source handoff state must be boolean")
        if type(self.source_handoff_firmware_installed) is not bool:
            raise ValueError("source handoff firmware state must be boolean")
        if self.source_handoff_available and (
            self.config_filename is None or not self.groups
        ):
            raise ValueError("source handoff requires configuration identity")
        if self.source_handoff_available and self.source_handoff_firmware_installed:
            raise ValueError("available source handoff cannot already be installed")
        if (
            self.source_handoff_firmware_installed
            and self.source_handoff_transaction_id is None
        ):
            raise ValueError("installed handoff requires a transaction")
        if (
            self.source_authority is CalibrationSourceAuthority.CONFIGURATION
            and not self.source_handoff_firmware_installed
        ):
            raise ValueError("configuration authority requires install verification")
        if (
            self.source_handoff_transaction_id is not None
            and re.fullmatch(r"[0-9a-f]{32}", self.source_handoff_transaction_id)
            is None
        ):
            raise ValueError("source handoff transaction ID is invalid")
        for groups in (self.groups, self.offset_groups, self.power_offset_groups):
            instance_ids = tuple(group.instance_id for group in groups)
            if len(instance_ids) != len(set(instance_ids)):
                raise ValueError("verified calibration groups must be unique")

    @property
    def source_status(self) -> str:
        """Explain why changing YAML alone does not change the active gains."""
        if self.source_authority is CalibrationSourceAuthority.CONFIGURATION:
            return "Configuration calibration is authoritative."
        return (
            "Saved flash calibration remains authoritative until it is explicitly "
            "cleared."
        )

    @property
    def has_offset_calibration(self) -> bool:
        """Return whether YAML gain handoff would omit verified calibration."""
        return bool(self.offset_groups or self.power_offset_groups)


def migrate_storage(
    version: int, minor_version: int, data: dict[str, Any]
) -> dict[str, Any]:
    """Accept the known schema and fail closed for unknown future data."""
    if (
        version > STORAGE_VERSION
        or version == STORAGE_VERSION
        and minor_version > STORAGE_MINOR_VERSION
    ):
        raise ValueError("Storage version is newer than supported")
    if (version, minor_version) in {(1, 1), (1, 2)}:
        meters = data.get("meters", {})
        if isinstance(meters, dict):
            for meter in meters.values():
                if not isinstance(meter, dict) or not isinstance(
                    selections := meter.get("ct_selections"), list
                ):
                    continue
                meter["ct_selections"] = [
                    item
                    for item in selections
                    if not isinstance(item, dict)
                    or "reporting_multiplier" not in item
                    or (
                        not isinstance(item["reporting_multiplier"], bool)
                        and item["reporting_multiplier"] in REPORTING_MULTIPLIERS
                    )
                ]
        return data
    if (version, minor_version) in {(1, 3), (1, 4)}:
        return data
    if (version, minor_version) != (STORAGE_VERSION, STORAGE_MINOR_VERSION):
        raise ValueError(f"Storage version {version} cannot be migrated")
    return data


class _HelperStorage(Store[dict[str, Any]]):
    """Store whose live migration path uses the helper's strict guard."""

    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: dict[str, Any]
    ) -> dict[str, Any]:
        """Reject unsupported storage versions during Home Assistant loading."""
        return migrate_storage(old_major_version, old_minor_version, old_data)


def _serialize_topology(topology: StoredTopology) -> dict[str, Any]:
    """Serialize only known scalar topology fields."""
    if not isinstance(topology, StoredTopology):
        raise TypeError("topology must be StoredTopology")
    return {
        "addon_count": topology.addon_count,
        "board_count": topology.board_count,
        "ct_count": topology.ct_count,
        "group_count": topology.group_count,
        "connection_type": topology.connection_type,
        "voltage_layout": topology.voltage_layout,
        "project_name": topology.project_name,
        "evidence": [
            {
                "source": evidence.source,
                "addon_count": evidence.addon_count,
                "detail": evidence.detail,
            }
            for evidence in topology.evidence
        ],
    }


def _serialize_ct_selection(selection: StoredCTSelection) -> dict[str, Any]:
    """Serialize the fixed CT-selection schema."""
    if not isinstance(selection, StoredCTSelection):
        raise TypeError("ct_selections must contain StoredCTSelection")
    return {
        "channel": selection.channel,
        "model_id": selection.model_id,
        "display_label": selection.display_label,
        "raw_gain_ct": selection.raw_gain_ct,
        "reporting_multiplier": selection.reporting_multiplier,
        "config_sha256": selection.config_sha256,
    }


def _serialize_interrupted_session(
    session: StoredInterruptedSession,
) -> dict[str, Any]:
    """Serialize the fixed interrupted-session marker."""
    if not isinstance(session, StoredInterruptedSession):
        raise TypeError("interrupted_session must be StoredInterruptedSession")
    return {
        "state": session.state,
        "started_at": session.started_at,
        "changed_channels": list(session.changed_channels),
        "config_transaction_id": session.config_transaction_id,
    }


def _serialize_verified_calibration(
    record: VerifiedCalibrationRecord,
) -> dict[str, Any]:
    """Serialize only exact gains and their configuration origin."""
    if not isinstance(record, VerifiedCalibrationRecord):
        raise TypeError("record must be VerifiedCalibrationRecord")
    serialized: dict[str, Any] = {
        "verification_id": record.verification_id,
        "config_filename": record.config_filename,
        "config_sha256": record.config_sha256,
        "topology_addon_count": record.topology_addon_count,
        "topology_project_name": record.topology_project_name,
        "topology_connection_type": record.topology_connection_type,
        "topology_voltage_layout": record.topology_voltage_layout,
        "connection_generation": record.connection_generation,
        "groups": [
            {
                "instance_id": group.instance_id,
                "phase_gains": [list(phase) for phase in group.phase_gains],
            }
            for group in record.groups
        ],
        "source_authority": record.source_authority.value,
        "source_handoff_available": record.source_handoff_available,
        "source_handoff_transaction_id": record.source_handoff_transaction_id,
        "source_handoff_firmware_installed": (
            record.source_handoff_firmware_installed
        ),
    }
    if record.topology_voltage_fingerprint is not None and not record.topology_voltage_fingerprint.startswith(
        "legacy:"
    ):
        serialized["topology_voltage_fingerprint"] = record.topology_voltage_fingerprint
    if record.offset_groups:
        serialized["offset_groups"] = [
            {
                "instance_id": group.instance_id,
                "phase_offsets": [list(phase) for phase in group.phase_offsets],
            }
            for group in record.offset_groups
        ]
    if record.power_offset_groups:
        serialized["power_offset_groups"] = [
            {
                "instance_id": group.instance_id,
                "phase_power_offsets": [
                    list(phase) for phase in group.phase_power_offsets
                ],
            }
            for group in record.power_offset_groups
        ]
    return serialized


def _deserialize_verified_calibration(
    mac: str, raw: object
) -> VerifiedCalibrationRecord:
    """Reject malformed cached calibration metadata before it can be reused."""
    mac = canonical_mac(mac)
    if not isinstance(raw, dict):
        raise TypeError("stored verified calibration must be a mapping")
    raw_groups = raw.get("groups")
    if not isinstance(raw_groups, list):
        raise TypeError("stored verified calibration groups must be a list")
    groups: list[VerifiedGainGroup] = []
    for item in raw_groups:
        if not isinstance(item, dict):
            raise TypeError("stored verified calibration group must be a mapping")
        instance_id = item.get("instance_id")
        phase_gains = item.get("phase_gains")
        if not isinstance(instance_id, str) or not isinstance(phase_gains, list):
            raise TypeError("stored verified calibration group fields are invalid")
        if len(phase_gains) != 3 or any(
            not isinstance(phase, list) or len(phase) != 2 for phase in phase_gains
        ):
            raise ValueError("stored verified calibration gains have an invalid shape")
        groups.append(
            VerifiedGainGroup(
                instance_id,
                (
                    (phase_gains[0][0], phase_gains[0][1]),
                    (phase_gains[1][0], phase_gains[1][1]),
                    (phase_gains[2][0], phase_gains[2][1]),
                ),
            )
        )
    offset_groups = cast(
        list[VerifiedOffsetGroup],
        _deserialize_offset_groups(raw.get("offset_groups", []), power=False),
    )
    power_offset_groups = cast(
        list[VerifiedPowerOffsetGroup],
        _deserialize_offset_groups(raw.get("power_offset_groups", []), power=True),
    )
    try:
        raw_authority = raw.get("source_authority")
        if not isinstance(raw_authority, str):
            raise TypeError("stored source authority must be a string")
        authority = CalibrationSourceAuthority(raw_authority)
        return VerifiedCalibrationRecord(
            mac=mac,
            config_filename=raw["config_filename"],
            config_sha256=raw["config_sha256"],
            topology_addon_count=raw["topology_addon_count"],
            topology_project_name=raw["topology_project_name"],
            topology_connection_type=raw["topology_connection_type"],
            topology_voltage_layout=raw["topology_voltage_layout"],
            connection_generation=raw["connection_generation"],
            groups=tuple(groups),
            verification_id=raw["verification_id"],
            topology_voltage_fingerprint=raw.get("topology_voltage_fingerprint"),
            offset_groups=tuple(offset_groups),
            power_offset_groups=tuple(power_offset_groups),
            source_authority=authority,
            source_handoff_available=raw["source_handoff_available"],
            source_handoff_transaction_id=raw.get("source_handoff_transaction_id"),
            source_handoff_firmware_installed=raw.get(
                "source_handoff_firmware_installed", False
            ),
        )
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError("stored verified calibration is invalid") from error


def _deserialize_offset_groups(
    raw_groups: object, *, power: bool
) -> list[VerifiedOffsetGroup | VerifiedPowerOffsetGroup]:
    if not isinstance(raw_groups, list):
        raise TypeError("stored verified offset groups must be a list")
    groups: list[VerifiedOffsetGroup | VerifiedPowerOffsetGroup] = []
    field = "phase_power_offsets" if power else "phase_offsets"
    group_type = VerifiedPowerOffsetGroup if power else VerifiedOffsetGroup
    for item in raw_groups:
        if not isinstance(item, dict):
            raise TypeError("stored verified offset group must be a mapping")
        instance_id = item.get("instance_id")
        table = item.get(field)
        if (
            not isinstance(instance_id, str)
            or not isinstance(table, list)
            or len(table) != 3
            or any(not isinstance(phase, list) or len(phase) != 2 for phase in table)
        ):
            raise ValueError("stored verified offset group is invalid")
        group = group_type(
            instance_id,
            (
                (table[0][0], table[0][1]),
                (table[1][0], table[1][1]),
                (table[2][0], table[2][1]),
            ),
        )
        groups.append(group)
    return groups


def serialize_meter_record(record: StoredMeterRecord) -> dict[str, Any]:
    """Serialize a record without accepting arbitrary nested payloads."""
    if not isinstance(record, StoredMeterRecord):
        raise TypeError("record must be StoredMeterRecord")
    return {
        "mac": record.mac,
        "setup_intent": record.setup_intent,
        "config_filename": record.config_filename,
        "config_sha256": record.config_sha256,
        "topology": (
            _serialize_topology(record.topology)
            if record.topology is not None
            else None
        ),
        "ct_selections": [
            _serialize_ct_selection(selection) for selection in record.ct_selections
        ],
        "interrupted_session": (
            _serialize_interrupted_session(record.interrupted_session)
            if record.interrupted_session is not None
            else None
        ),
    }


@dataclass(frozen=True, slots=True)
class LegacyParentLink:
    """One non-functional legacy relationship requiring an explicit review."""

    child_id: str
    proposed_parent_id: str

    def __post_init__(self) -> None:
        _source_id(self.child_id, "legacy child_id")
        _source_id(self.proposed_parent_id, "legacy proposed_parent_id")


@dataclass(frozen=True, slots=True)
class TotalsMigrationRecord:
    """Pending review data retained across storage and inventory reads."""

    parent_review_required: bool
    legacy_parent_links: tuple[LegacyParentLink, ...]
    native_visibility_confirmation_required: bool = False

    def __post_init__(self) -> None:
        if type(self.parent_review_required) is not bool or type(self.native_visibility_confirmation_required) is not bool or (
            type(self.legacy_parent_links) is not tuple
            or any(not isinstance(link, LegacyParentLink) for link in self.legacy_parent_links)
        ):
            raise TypeError("totals migration record is invalid")


@dataclass(frozen=True, slots=True)
class StoredMeterConfiguration:
    """Verified configuration semantics bound to one configuration digest."""

    config_sha256: str
    meter: MeterSettings
    channels: tuple[ChannelSettings, ...]
    default_totals: DefaultTotalsSettings
    automatic_totals: tuple[AutomaticTotalSettings, ...]
    aggregates: tuple[CircuitAggregate, ...]
    power_quality: tuple[bool, ...]
    status_fields: tuple[bool, ...]
    ct_selections: tuple[StoredCTSelection, ...] = ()
    multi_reference_preparation_acknowledged: bool = False
    totals_migration: TotalsMigrationRecord | None = None
    totals_managed: bool = True

    def __post_init__(self) -> None:
        if re.fullmatch(r"[0-9a-f]{64}", self.config_sha256) is None:
            raise ValueError("config_sha256 must be a SHA-256 digest")
        if not isinstance(self.meter, MeterSettings):
            raise TypeError("meter must be MeterSettings")
        if type(self.channels) is not tuple or any(
            not isinstance(item, ChannelSettings) for item in self.channels
        ):
            raise TypeError("channels must be a tuple of ChannelSettings")
        if type(self.aggregates) is not tuple or any(
            not isinstance(item, CircuitAggregate) for item in self.aggregates
        ):
            raise TypeError("aggregates must be a tuple of CircuitAggregate")
        if not isinstance(self.default_totals, DefaultTotalsSettings):
            raise TypeError("default_totals must be DefaultTotalsSettings")
        if type(self.automatic_totals) is not tuple or any(
            not isinstance(item, AutomaticTotalSettings) for item in self.automatic_totals
        ):
            raise TypeError("automatic_totals must be a tuple of AutomaticTotalSettings")
        candidate_ids: set[str] = set()
        for setting in self.automatic_totals:
            _source_id(setting.candidate_id, "automatic candidate_id")
            _total_outputs(setting.outputs, "automatic total output")
            if type(setting.enabled) is not bool or setting.candidate_id in candidate_ids:
                raise ValueError("automatic totals must have unique IDs and boolean enabled")
            candidate_ids.add(setting.candidate_id)
        for field, value in (
            ("power_quality", self.power_quality),
            ("status_fields", self.status_fields),
        ):
            if type(value) is not tuple or any(
                type(item) is not bool for item in value
            ):
                raise TypeError(f"{field} must be a tuple of booleans")
        if type(self.ct_selections) is not tuple or any(
            not isinstance(item, StoredCTSelection) for item in self.ct_selections
        ):
            raise TypeError("ct_selections must be a tuple of StoredCTSelection")
        if type(self.multi_reference_preparation_acknowledged) is not bool:
            raise TypeError("multi-reference acknowledgement must be boolean")
        if type(self.totals_managed) is not bool:
            raise TypeError("totals ownership must be boolean")
        if self.totals_migration is not None and not isinstance(
            self.totals_migration, TotalsMigrationRecord
        ):
            raise TypeError("totals_migration must be TotalsMigrationRecord or None")
        channels = {channel.channel: channel for channel in self.channels}
        if self.ct_selections and (
            len(self.ct_selections) != len(channels)
            or {selection.channel for selection in self.ct_selections} != set(channels)
            or any(
                selection.config_sha256 != self.config_sha256
                or selection.model_id != channels[selection.channel].model_id
                or selection.display_label != channels[selection.channel].custom_label
                or selection.reporting_multiplier
                != channels[selection.channel].reporting_multiplier
                or channels[selection.channel].model_id == "custom"
                and selection.raw_gain_ct
                != channels[selection.channel].custom_gain_ct
                for selection in self.ct_selections
            )
        ):
            raise ValueError("ct_selections do not match meter configuration")


@dataclass(frozen=True, slots=True)
class MeterConfigurationRead:
    """Safe inventory-facing result that preserves strict getter behavior."""

    configuration: StoredMeterConfiguration | None
    stale: bool


def _exact_mapping(raw: object, keys: set[str], label: str) -> dict[str, Any]:
    if (
        not isinstance(raw, dict)
        or set(raw) != keys
        or any(not isinstance(key, str) for key in raw)
    ):
        raise ValueError(f"stored meter configuration {label} is invalid")
    return raw


def _configuration_hash(raw: object) -> str | None:
    if not isinstance(raw, dict):
        return None
    value = raw.get("config_sha256")
    return (
        value
        if isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value)
        else None
    )


def _current_topology(raw_meter: object) -> MeterTopology:
    if not isinstance(raw_meter, dict):
        raise TypeError("stored meter configuration meter record is invalid")
    raw_topology = _exact_mapping(
        raw_meter.get("topology"),
        {
            "addon_count",
            "board_count",
            "ct_count",
            "group_count",
            "connection_type",
            "voltage_layout",
            "project_name",
            "evidence",
        },
        "topology",
    )
    try:
        raw_evidence = raw_topology["evidence"]
        if not isinstance(raw_evidence, list) or len(raw_evidence) > 5:
            raise TypeError("stored meter configuration topology is invalid")
        evidence = tuple(
            StoredTopologyEvidence(
                **_exact_mapping(item, {"source", "addon_count", "detail"}, "evidence")
            )
            for item in raw_evidence
        )
        topology = StoredTopology(
            addon_count=raw_topology["addon_count"],
            board_count=raw_topology["board_count"],
            ct_count=raw_topology["ct_count"],
            group_count=raw_topology["group_count"],
            connection_type=raw_topology["connection_type"],
            voltage_layout=raw_topology["voltage_layout"],
            project_name=raw_topology["project_name"],
            evidence=evidence,
        )
    except (TypeError, ValueError) as error:
        raise ValueError("stored meter configuration topology is invalid") from error
    return MeterTopology(
        topology.addon_count,
        topology.board_count,
        topology.ct_count,
        topology.group_count,
        cast(ConnectionType, topology.connection_type),
        topology.voltage_layout,
        topology.project_name,
        (),
    )


def _topology_identity(
    topology: MeterTopology,
) -> tuple[int, int, int, int, str, str, str]:
    return (
        topology.addon_count,
        topology.board_count,
        topology.ct_count,
        topology.group_count,
        topology.connection_type,
        topology.voltage_layout,
        topology.project_name,
    )


def _validate_configuration(
    configuration: StoredMeterConfiguration, topology: MeterTopology
) -> None:
    candidates = automatic_total_candidates(
        MeterConfigurationRequest(
            configuration.meter,
            configuration.channels,
            configuration.default_totals,
            (),
            configuration.aggregates,
            configuration.power_quality,
            configuration.status_fields,
        )
    )
    active_ids = {candidate.candidate_id for candidate in candidates}
    validate_meter_configuration(
        MeterConfigurationRequest(
            configuration.meter,
            configuration.channels,
            configuration.default_totals,
            tuple(setting for setting in configuration.automatic_totals if setting.candidate_id in active_ids),
            configuration.aggregates,
            configuration.power_quality,
            configuration.status_fields,
        ),
        topology,
        require_multi_reference_acknowledgement=False,
    )


def _verified_meter_record(
    mac: str,
    expected_source_sha256: str,
    configuration: StoredMeterConfiguration,
    record: StoredMeterRecord | None,
    raw_meter: object | None,
) -> dict[str, Any]:
    """Advance A to B, or create B from the trusted source record exactly once."""
    if record is None:
        if raw_meter is None:
            raise ValueError("current meter record is unavailable")
        record_topology = _current_topology(raw_meter)
    else:
        if (
            record.mac != mac
            or record.config_sha256 != expected_source_sha256
            or record.config_filename is None
            or record.topology is None
        ):
            raise ValueError("trusted meter record does not match the source")
        record_topology = _current_topology(serialize_meter_record(record))
    if raw_meter is None:
        if record is None:  # guarded above; narrow for the type checker
            raise ValueError("current meter record is unavailable")
        next_meter = serialize_meter_record(
            replace(
                record,
                config_sha256=configuration.config_sha256,
                ct_selections=configuration.ct_selections,
            )
        )
    else:
        if not isinstance(raw_meter, dict):
            raise ValueError("current meter record is unavailable")
        if _configuration_hash(raw_meter) != expected_source_sha256:
            raise ValueError("configuration does not match the current meter record")
        if _topology_identity(_current_topology(raw_meter)) != _topology_identity(
            record_topology
        ):
            raise ValueError("meter topology does not match the source")
        if (
            configuration.config_sha256 == expected_source_sha256
            and _serialize_meter_configuration(configuration, record_topology)
            == raw_meter.get("meter_configuration")
        ):
            raise ValueError("configuration replay is not permitted")
        next_meter = raw_meter
        next_meter["config_sha256"] = configuration.config_sha256
        next_meter["ct_selections"] = [
            _serialize_ct_selection(selection)
            for selection in configuration.ct_selections
        ]
    next_meter["meter_configuration"] = _serialize_meter_configuration(
        configuration, record_topology
    )
    return next_meter


def _serialize_meter_configuration(
    configuration: StoredMeterConfiguration, topology: MeterTopology
) -> dict[str, Any]:
    _validate_configuration(configuration, topology)
    return {
        "config_sha256": configuration.config_sha256,
        "meter": {
            "friendly_name": configuration.meter.friendly_name,
            "electrical_system": configuration.meter.electrical_system.value,
            "line_frequency_hz": configuration.meter.line_frequency_hz,
            "update_interval_s": configuration.meter.update_interval_s,
            "voltage_layout": configuration.meter.voltage_layout.value,
            "voltage_references": [
                {
                    "reference_id": reference.reference_id,
                    "label": reference.label,
                    "phase_label": reference.phase_label,
                    "nominal_voltage_v": reference.nominal_voltage_v,
                    "transformer_model_id": reference.transformer_model_id,
                    "gain_voltage": reference.gain_voltage,
                    "group_keys": list(reference.group_keys),
                }
                for reference in configuration.meter.voltage_references
            ],
        },
        "channels": [
            {
                "channel": channel.channel,
                "enabled": channel.enabled,
                "name": channel.name,
                "model_id": channel.model_id,
                "reporting_multiplier": channel.reporting_multiplier,
                "role": channel.role.value,
                "voltage_reference_id": channel.voltage_reference_id,
                "custom_gain_ct": channel.custom_gain_ct,
                "custom_label": channel.custom_label,
                "burden_output_acknowledged": channel.burden_output_acknowledged,
            }
            for channel in configuration.channels
        ],
        "default_totals": {
            "overall": _serialize_outputs(configuration.default_totals.overall),
            "boards": [
                {"board_index": board.board_index, "outputs": _serialize_outputs(board.outputs)}
                for board in configuration.default_totals.boards
            ],
        },
        "automatic_totals": [
            {
                "candidate_id": total.candidate_id,
                "enabled": total.enabled,
                "outputs": _serialize_outputs(total.outputs),
            }
            for total in configuration.automatic_totals
        ],
        "aggregates": [
            {
                "aggregate_id": aggregate.aggregate_id,
                "name": aggregate.name,
                "role": aggregate.role.value,
                "sources": [_serialize_total_source(source) for source in aggregate.sources],
                "measurement_method": aggregate.measurement_method.value,
                "energy_mode": aggregate.energy_mode.value,
                "outputs": _serialize_outputs(aggregate.outputs),
                "origin": aggregate.origin.value,
            }
            for aggregate in configuration.aggregates
        ],
        "power_quality": list(configuration.power_quality),
        "status_fields": list(configuration.status_fields),
        "ct_selections": [
            _serialize_ct_selection(selection)
            for selection in configuration.ct_selections
        ],
        "multi_reference_preparation_acknowledged": False,
        "totals_migration": _serialize_totals_migration(configuration.totals_migration),
        "totals_managed": configuration.totals_managed,
    }


def _serialize_outputs(outputs: TotalOutputSettings) -> dict[str, bool]:
    return {"watts": outputs.watts, "amps": outputs.amps, "kwh": outputs.kwh}


def _serialize_total_source(source: object) -> dict[str, object]:
    if isinstance(source, ChannelTotalSource):
        return {"kind": "channel", "channel": source.channel}
    if isinstance(source, NativeTotalSource):
        return {"kind": "native_total", "source_id": source.source_id}
    if isinstance(source, AggregateTotalSource):
        return {"kind": "aggregate", "aggregate_id": source.aggregate_id}
    raise TypeError("aggregate source is invalid")


def _serialize_totals_migration(
    migration: TotalsMigrationRecord | None,
) -> dict[str, object] | None:
    if migration is None:
        return None
    return {
        "parent_review_required": migration.parent_review_required,
        "legacy_parent_links": [
            {"child_id": link.child_id, "proposed_parent_id": link.proposed_parent_id}
            for link in migration.legacy_parent_links
        ],
        "native_visibility_confirmation_required": migration.native_visibility_confirmation_required,
    }


def _deserialize_meter_configuration_payload(
    raw: object, topology: MeterTopology
) -> StoredMeterConfiguration:
    if isinstance(raw, dict) and "default_totals" in raw:
        return _deserialize_v15_meter_configuration(raw, topology)
    required = {
        "config_sha256",
        "meter",
        "channels",
        "aggregates",
        "power_quality",
        "status_fields",
    }
    if (
        not isinstance(raw, dict)
        or not required <= set(raw) <= {
            *required,
            "ct_selections",
            "multi_reference_preparation_acknowledged",
        }
        or any(not isinstance(key, str) for key in raw)
    ):
        raise ValueError("stored meter configuration payload is invalid")
    data = raw
    raw_meter = _exact_mapping(
        data["meter"],
        {
            "friendly_name",
            "electrical_system",
            "line_frequency_hz",
            "update_interval_s",
            "voltage_layout",
            "voltage_references",
        },
        "meter",
    )
    if not isinstance(raw_meter["voltage_references"], list) or not 1 <= len(
        raw_meter["voltage_references"]
    ) <= min(8, topology.group_count):
        raise TypeError("stored meter configuration meter is invalid")
    references: list[VoltageReferenceConfig] = []
    for raw_reference in raw_meter["voltage_references"]:
        item = _exact_mapping(
            raw_reference,
            {
                "reference_id",
                "label",
                "phase_label",
                "nominal_voltage_v",
                "transformer_model_id",
                "gain_voltage",
                "group_keys",
            },
            "voltage reference",
        )
        if (
            not isinstance(item["group_keys"], list)
            or not 1 <= len(item["group_keys"]) <= topology.group_count
        ):
            raise TypeError("stored meter configuration voltage reference is invalid")
        references.append(
            VoltageReferenceConfig(
                item["reference_id"],
                item["label"],
                item["phase_label"],
                item["nominal_voltage_v"],
                item["transformer_model_id"],
                item["gain_voltage"],
                tuple(item["group_keys"]),
            )
        )
    if (
        not isinstance(data["channels"], list)
        or len(data["channels"]) != topology.ct_count
        or not isinstance(data["aggregates"], list)
        or len(data["aggregates"]) > 32
    ):
        raise TypeError("stored meter configuration collections are invalid")
    channels: list[ChannelSettings] = []
    for raw_channel in data["channels"]:
        channel_keys = {
            "channel",
            "enabled",
            "name",
            "model_id",
            "reporting_multiplier",
            "role",
            "voltage_reference_id",
            "custom_gain_ct",
            "custom_label",
        }
        if (
            not isinstance(raw_channel, dict)
            or set(raw_channel)
            not in (channel_keys, {*channel_keys, "burden_output_acknowledged"})
            or any(not isinstance(key, str) for key in raw_channel)
        ):
            raise ValueError("stored meter configuration channel is invalid")
        item = raw_channel
        channels.append(
            ChannelSettings(
                item["channel"],
                item["enabled"],
                item["name"],
                item["model_id"],
                item["reporting_multiplier"],
                CircuitRole(item["role"]),
                item["voltage_reference_id"],
                item["custom_gain_ct"],
                item["custom_label"],
                item.get("burden_output_acknowledged", False),
            )
        )
    aggregates: list[CircuitAggregate] = []
    parent_links: list[LegacyParentLink] = []
    for raw_aggregate in data["aggregates"]:
        item = _exact_mapping(
            raw_aggregate,
            {
                "aggregate_id",
                "name",
                "role",
                "channels",
                "measurement_method",
                "parent_id",
                "energy_mode",
                "expose_power",
                "expose_current",
            },
            "aggregate",
        )
        if (
            not isinstance(item["channels"], list)
            or len(item["channels"]) > topology.ct_count
        ):
            raise TypeError("stored meter configuration aggregate is invalid")
        if item["parent_id"] is not None:
            if type(item["parent_id"]) is not str:
                raise TypeError("stored meter configuration aggregate parent is invalid")
            parent_links.append(LegacyParentLink(item["aggregate_id"], item["parent_id"]))
        aggregates.append(
            CircuitAggregate(
                item["aggregate_id"],
                item["name"],
                CircuitRole(item["role"]),
                tuple(ChannelTotalSource("channel", channel) for channel in item["channels"]),
                MeasurementMethod(item["measurement_method"]),
                EnergyMode(item["energy_mode"]),
                TotalOutputSettings(
                    item["expose_power"], item["expose_current"],
                    item["energy_mode"] != EnergyMode.NONE.value,
                ),
                TotalOrigin.MIGRATED,
            )
        )
    if (
        not isinstance(data["power_quality"], list)
        or len(data["power_quality"]) != topology.board_count
        or not isinstance(data["status_fields"], list)
        or len(data["status_fields"]) != topology.board_count
    ):
        raise TypeError("stored meter configuration options are invalid")
    raw_selections = data.get("ct_selections", [])
    if not isinstance(raw_selections, list):
        raise TypeError("stored meter configuration selections are invalid")
    selections = tuple(
        StoredCTSelection(
            **_exact_mapping(
                item,
                {
                    "channel",
                    "model_id",
                    "display_label",
                    "raw_gain_ct",
                    "reporting_multiplier",
                    "config_sha256",
                },
                "ct selection",
            )
        )
        for item in raw_selections
    )
    try:
        meter = MeterSettings(
            raw_meter["friendly_name"],
            ElectricalSystem(raw_meter["electrical_system"]),
            raw_meter["line_frequency_hz"],
            raw_meter["update_interval_s"],
            VoltageLayout(raw_meter["voltage_layout"]),
            tuple(references),
        )
        fallback_defaults = default_total_settings(topology)
        if aggregates:
            fallback_defaults = DefaultTotalsSettings(
                TotalOutputSettings(True, True, False)
                if topology.board_count == 1
                else TotalOutputSettings(False, False, False),
                fallback_defaults.boards,
            )
        candidate_request = MeterConfigurationRequest(
            meter, tuple(channels), fallback_defaults, (), (),
            tuple(data["power_quality"]), tuple(data["status_fields"]),
        )
        candidates = automatic_total_candidates(candidate_request)
        linked_ids = {link.child_id for link in parent_links}
        candidate_by_aggregate = {candidate.aggregate_id: candidate for candidate in candidates}
        automatic: list[AutomaticTotalSettings] = []
        advanced: list[CircuitAggregate] = []
        matched: set[str] = set()
        for aggregate in aggregates:
            candidate = candidate_by_aggregate.get(aggregate.aggregate_id)
            if candidate is not None and aggregate.aggregate_id not in linked_ids and (
                aggregate.name, aggregate.role, aggregate.sources,
                aggregate.measurement_method, aggregate.energy_mode, aggregate.outputs,
            ) == (
                candidate.name, candidate.role, candidate.sources,
                candidate.measurement_method, candidate.energy_mode, candidate.recommended_outputs,
            ):
                automatic.append(AutomaticTotalSettings(candidate.candidate_id, True, aggregate.outputs))
                matched.add(candidate.candidate_id)
            else:
                advanced.append(aggregate)
        automatic.extend(
            AutomaticTotalSettings(candidate.candidate_id, False, candidate.recommended_outputs)
            for candidate in candidates if candidate.candidate_id not in matched
        )
        configuration = StoredMeterConfiguration(
            data["config_sha256"],
            meter,
            tuple(channels),
            fallback_defaults,
            tuple(automatic),
            tuple(advanced),
            tuple(data["power_quality"]),
            tuple(data["status_fields"]),
            selections,
            False,
            TotalsMigrationRecord(bool(parent_links), tuple(parent_links), True),
        )
        _validate_configuration(configuration, topology)
    except (TypeError, ValueError) as error:
        raise ValueError("stored meter configuration is invalid") from error
    return configuration


def _outputs(raw: object, label: str) -> TotalOutputSettings:
    item = _exact_mapping(raw, {"watts", "amps", "kwh"}, label)
    if any(type(value) is not bool for value in item.values()):
        raise TypeError(f"{label} is invalid")
    return TotalOutputSettings(**item)


def _total_source(raw: object) -> ChannelTotalSource | NativeTotalSource | AggregateTotalSource:
    if not isinstance(raw, dict) or not isinstance(raw.get("kind"), str):
        raise TypeError("aggregate source is invalid")
    if raw["kind"] == "channel":
        item = _exact_mapping(raw, {"kind", "channel"}, "aggregate source")
        return ChannelTotalSource("channel", item["channel"])
    if raw["kind"] == "native_total":
        item = _exact_mapping(raw, {"kind", "source_id"}, "aggregate source")
        return NativeTotalSource("native_total", item["source_id"])
    if raw["kind"] == "aggregate":
        item = _exact_mapping(raw, {"kind", "aggregate_id"}, "aggregate source")
        return AggregateTotalSource("aggregate", item["aggregate_id"])
    raise ValueError("aggregate source is invalid")


def _deserialize_v15_meter_configuration(
    data: dict[str, Any], topology: MeterTopology
) -> StoredMeterConfiguration:
    required = {"config_sha256", "meter", "channels", "default_totals", "automatic_totals", "aggregates", "power_quality", "status_fields", "totals_migration"}
    optional = {"ct_selections", "multi_reference_preparation_acknowledged", "totals_managed"}
    if not required <= set(data) <= required | optional or any(not isinstance(key, str) for key in data):
        raise ValueError("stored meter configuration payload is invalid")
    # Reuse the strict legacy-shaped decoder for meter/channel validation, then replace totals.
    legacy = {key: data[key] for key in ("config_sha256", "meter", "channels", "power_quality", "status_fields")}
    legacy["ct_selections"] = data.get("ct_selections", [])
    legacy["multi_reference_preparation_acknowledged"] = data.get("multi_reference_preparation_acknowledged", False)
    legacy["aggregates"] = []
    base = _deserialize_meter_configuration_payload(legacy, topology)
    totals = _exact_mapping(data["default_totals"], {"overall", "boards"}, "default totals")
    if not isinstance(totals["boards"], list):
        raise TypeError("default totals boards are invalid")
    defaults = DefaultTotalsSettings(
        _outputs(totals["overall"], "default total outputs"),
        tuple(
            BoardTotalSettings(
                _exact_mapping(item, {"board_index", "outputs"}, "default total board")["board_index"],
                _outputs(_exact_mapping(item, {"board_index", "outputs"}, "default total board")["outputs"], "default total board outputs"),
            ) for item in totals["boards"]
        ),
    )
    if not isinstance(data["automatic_totals"], list) or not isinstance(data["aggregates"], list):
        raise TypeError("stored meter configuration totals are invalid")
    automatic = tuple(
        AutomaticTotalSettings(
            _exact_mapping(item, {"candidate_id", "enabled", "outputs"}, "automatic total")["candidate_id"],
            _exact_mapping(item, {"candidate_id", "enabled", "outputs"}, "automatic total")["enabled"],
            _outputs(_exact_mapping(item, {"candidate_id", "enabled", "outputs"}, "automatic total")["outputs"], "automatic outputs"),
        ) for item in data["automatic_totals"]
    )
    aggregates: list[CircuitAggregate] = []
    for raw_aggregate in data["aggregates"]:
        item = _exact_mapping(raw_aggregate, {"aggregate_id", "name", "role", "sources", "measurement_method", "energy_mode", "outputs", "origin"}, "aggregate")
        if not isinstance(item["sources"], list):
            raise TypeError("stored meter configuration aggregate sources are invalid")
        aggregates.append(CircuitAggregate(
            item["aggregate_id"], item["name"], CircuitRole(item["role"]),
            tuple(_total_source(source) for source in item["sources"]),
            MeasurementMethod(item["measurement_method"]), EnergyMode(item["energy_mode"]),
            _outputs(item["outputs"], "aggregate outputs"), TotalOrigin(item["origin"]),
        ))
    migration = None
    if data["totals_migration"] is not None:
        raw_migration = _exact_mapping(data["totals_migration"], {"parent_review_required", "legacy_parent_links", "native_visibility_confirmation_required"}, "totals migration")
        if not isinstance(raw_migration["legacy_parent_links"], list):
            raise TypeError("totals migration links are invalid")
        migration = TotalsMigrationRecord(
            raw_migration["parent_review_required"],
            tuple(LegacyParentLink(**_exact_mapping(link, {"child_id", "proposed_parent_id"}, "legacy parent link")) for link in raw_migration["legacy_parent_links"]),
            raw_migration["native_visibility_confirmation_required"],
        )
    configuration = replace(base, default_totals=defaults, automatic_totals=automatic, aggregates=tuple(aggregates), totals_migration=migration, totals_managed=data.get("totals_managed", True))
    _validate_configuration(configuration, topology)
    return configuration


def _deserialize_meter_configuration(
    raw: object, topology: MeterTopology
) -> StoredMeterConfiguration:
    try:
        return _deserialize_meter_configuration_payload(raw, topology)
    except (TypeError, ValueError) as error:
        raise ValueError("stored meter configuration is invalid") from error


class HelperStore:
    """Persist typed meter metadata without credentials or configuration content."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: _HelperStorage = _HelperStorage(
            hass,
            STORAGE_VERSION,
            STORAGE_KEY,
            minor_version=STORAGE_MINOR_VERSION,
        )
        self._update_lock = asyncio.Lock()

    async def async_load(self) -> dict[str, Any]:
        """Load the known storage schema through the strict version guard."""
        data = (await self._store.async_load()) or {"meters": {}}
        raw_meters = data.get("meters", {})
        if not isinstance(raw_meters, dict):
            raise TypeError("stored meters must be a mapping")
        meters: dict[str, Any] = {}
        for raw_mac, meter in raw_meters.items():
            mac = canonical_mac(raw_mac)
            if mac in meters:
                raise ValueError("stored meter aliases collide")
            if isinstance(meter, dict) and "mac" in meter:
                meter = {**meter, "mac": mac}
            meters[mac] = meter
        return {**data, "meters": meters}

    async def async_save_meter(self, record: StoredMeterRecord) -> None:
        """Save one typed record keyed by MAC address."""
        async with self._update_lock:
            data = await self.async_load()
            meters = data.setdefault("meters", {})
            serialized = serialize_meter_record(record)
            previous = meters.get(record.mac)
            if (
                _configuration_hash(previous) == record.config_sha256
                and isinstance(previous, dict)
                and _configuration_hash(previous.get("meter_configuration"))
                == record.config_sha256
            ):
                try:
                    next_topology = _current_topology(serialized)
                    if _topology_identity(
                        _current_topology(previous)
                    ) != _topology_identity(next_topology):
                        raise ValueError("meter topology identity changed")
                    _deserialize_meter_configuration(
                        previous["meter_configuration"], next_topology
                    )
                except KeyError, TypeError, ValueError:
                    pass
                else:
                    serialized["meter_configuration"] = previous["meter_configuration"]
            meters[record.mac] = serialized
            await self._store.async_save(data)

    async def async_save_verified_ct_selections(
        self, mac: str, selections: tuple[StoredCTSelection, ...]
    ) -> None:
        """Persist only post-reconnect CT metadata, never configuration content."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            meters = data.setdefault("meters", {})
            meter = meters.setdefault(mac, {})
            meter["ct_selections"] = [
                _serialize_ct_selection(item) for item in selections
            ]
            await self._store.async_save(data)

    async def async_get_ct_selections(self, mac: str) -> tuple[StoredCTSelection, ...]:
        """Load only the safe persisted model selections for one meter."""
        raw = (
            (await self.async_load())
            .get("meters", {})
            .get(canonical_mac(mac), {})
            .get("ct_selections", [])
        )
        if not isinstance(raw, list):
            raise TypeError("stored CT selections must be a list")
        try:
            return tuple(
                StoredCTSelection(**item) for item in raw if isinstance(item, dict)
            )
        except (TypeError, ValueError) as error:
            raise ValueError("stored CT selections are invalid") from error

    async def async_get_meter_configuration(
        self, mac: str
    ) -> StoredMeterConfiguration | None:
        """Load verified semantics only when their source configuration is current."""
        mac = canonical_mac(mac)
        raw_meter = (await self.async_load()).get("meters", {}).get(mac)
        if not isinstance(raw_meter, dict):
            return None
        raw_configuration = raw_meter.get("meter_configuration")
        current_hash = _configuration_hash(raw_meter)
        if (
            current_hash is None
            or _configuration_hash(raw_configuration) != current_hash
        ):
            return None
        topology = _current_topology(raw_meter)
        configuration = _deserialize_meter_configuration(raw_configuration, topology)
        return configuration

    async def async_get_meter_configuration_read(
        self, mac: str
    ) -> MeterConfigurationRead:
        """Read semantics for an inventory without surfacing malformed storage."""
        mac = canonical_mac(mac)
        raw_meter = (await self.async_load()).get("meters", {}).get(mac)
        if not isinstance(raw_meter, dict):
            return MeterConfigurationRead(None, False)
        raw_configuration = raw_meter.get("meter_configuration")
        if raw_configuration is None:
            return MeterConfigurationRead(None, False)
        current_hash = _configuration_hash(raw_meter)
        if (
            current_hash is None
            or _configuration_hash(raw_configuration) != current_hash
        ):
            return MeterConfigurationRead(None, True)
        try:
            configuration = _deserialize_meter_configuration(
                raw_configuration, _current_topology(raw_meter)
            )
        except (TypeError, ValueError):
            return MeterConfigurationRead(None, True)
        return MeterConfigurationRead(configuration, False)

    async def async_save_verified_meter_configuration(
        self,
        mac: str,
        expected_source_sha256: str,
        configuration: StoredMeterConfiguration,
        record: StoredMeterRecord | None = None,
    ) -> None:
        """Atomically advance one verified meter record and its full metadata."""
        mac = canonical_mac(mac)
        if re.fullmatch(r"[0-9a-f]{64}", expected_source_sha256) is None:
            raise ValueError("expected source hash must be SHA-256")
        if not isinstance(configuration, StoredMeterConfiguration):
            raise TypeError("configuration must be StoredMeterConfiguration")
        async with self._update_lock:
            data = await self.async_load()
            meters = data.setdefault("meters", {})
            raw_meter = meters.get(mac)
            meters[mac] = _verified_meter_record(
                mac,
                expected_source_sha256,
                configuration,
                record,
                raw_meter,
            )
            await self._store.async_save(data)

    async def async_save_verified_meter_configuration_and_mark_verified_calibration_installed(
        self,
        mac: str,
        expected_source_sha256: str,
        configuration: StoredMeterConfiguration,
        verification_id: str,
        transaction_id: str,
        record: StoredMeterRecord | None = None,
    ) -> bool:
        """Commit full metadata and its claimed calibration install in one save."""
        mac = canonical_mac(mac)
        if re.fullmatch(r"[0-9a-f]{64}", expected_source_sha256) is None:
            raise ValueError("expected source hash must be SHA-256")
        if not isinstance(configuration, StoredMeterConfiguration):
            raise TypeError("configuration must be StoredMeterConfiguration")
        async with self._update_lock:
            data = await self.async_load()
            meters = data.setdefault("meters", {})
            raw_meter = meters.get(mac)
            if (
                not isinstance(raw_meter, dict)
                or _configuration_hash(raw_meter) != expected_source_sha256
            ):
                return False
            raw_calibration = raw_meter.get("verified_calibration")
            if raw_calibration is None:
                return False
            calibration = _deserialize_verified_calibration(mac, raw_calibration)
            if (
                calibration.verification_id != verification_id
                or calibration.source_handoff_available
                or calibration.has_offset_calibration
                or calibration.source_handoff_transaction_id != transaction_id
            ):
                return False
            try:
                raw_meter = _verified_meter_record(
                    mac,
                    expected_source_sha256,
                    configuration,
                    record,
                    raw_meter,
                )
            except ValueError:
                return False
            raw_meter["verified_calibration"][
                "source_handoff_firmware_installed"
            ] = True
            meters[mac] = raw_meter
            await self._store.async_save(data)
            return True

    async def async_save_verified_ct_selections_and_mark_verified_calibration_installed(
        self,
        mac: str,
        expected_source_sha256: str,
        proposed_sha256: str,
        record: StoredMeterRecord,
        selections: tuple[StoredCTSelection, ...],
        verification_id: str,
        transaction_id: str,
    ) -> bool:
        """Atomically advance legacy CT metadata and its exact calibration claim."""
        mac = canonical_mac(mac)
        if (
            re.fullmatch(r"[0-9a-f]{64}", expected_source_sha256) is None
            or re.fullmatch(r"[0-9a-f]{64}", proposed_sha256) is None
            or type(selections) is not tuple
            or any(not isinstance(selection, StoredCTSelection) for selection in selections)
            or any(selection.config_sha256 != proposed_sha256 for selection in selections)
        ):
            raise ValueError("legacy CT metadata is invalid")
        async with self._update_lock:
            data = await self.async_load()
            raw_meter = data.setdefault("meters", {}).get(mac)
            if not isinstance(raw_meter, dict) or _configuration_hash(
                raw_meter
            ) != expected_source_sha256:
                return False
            if (
                not isinstance(record, StoredMeterRecord)
                or record.mac != mac
                or record.config_sha256 != expected_source_sha256
                or record.topology is None
                or _topology_identity(_current_topology(raw_meter))
                != _topology_identity(_current_topology(serialize_meter_record(record)))
            ):
                return False
            raw_calibration = raw_meter.get("verified_calibration")
            if raw_calibration is None:
                return False
            calibration = _deserialize_verified_calibration(mac, raw_calibration)
            if (
                calibration.verification_id != verification_id
                or calibration.source_handoff_available
                or calibration.has_offset_calibration
                or calibration.source_handoff_transaction_id != transaction_id
            ):
                return False
            raw_meter["config_sha256"] = proposed_sha256
            raw_meter["ct_selections"] = [
                _serialize_ct_selection(selection) for selection in selections
            ]
            raw_meter.pop("meter_configuration", None)
            raw_calibration["source_handoff_firmware_installed"] = True
            await self._store.async_save(data)
            return True

    async def async_save_interrupted_session(
        self, mac: str, marker: StoredInterruptedSession | None
    ) -> None:
        """Persist or clear one recovery marker without retaining calibration values."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            meter = data.setdefault("meters", {}).setdefault(mac, {})
            meter["interrupted_session"] = (
                _serialize_interrupted_session(marker) if marker is not None else None
            )
            await self._store.async_save(data)

    async def async_get_interrupted_session(
        self, mac: str
    ) -> StoredInterruptedSession | None:
        """Load the calibration recovery marker for one meter."""
        raw = (
            (await self.async_load())
            .get("meters", {})
            .get(canonical_mac(mac), {})
            .get("interrupted_session")
        )
        if raw is None:
            return None
        if not isinstance(raw, dict):
            raise TypeError("stored interrupted session is invalid")
        try:
            return StoredInterruptedSession(
                raw["state"],
                raw["started_at"],
                tuple(raw["changed_channels"]),
                raw.get("config_transaction_id"),
            )
        except (KeyError, TypeError, ValueError) as error:
            raise ValueError("stored interrupted session is invalid") from error

    async def async_save_verified_calibration(
        self, record: VerifiedCalibrationRecord
    ) -> None:
        """Persist one compact final record after all changed groups verify."""
        async with self._update_lock:
            data = await self.async_load()
            meters = data.setdefault("meters", {})
            meter = meters.setdefault(record.mac, {})
            meter["verified_calibration"] = _serialize_verified_calibration(record)
            await self._store.async_save(data)

    async def async_finalize_verified_calibration(
        self, record: VerifiedCalibrationRecord
    ) -> None:
        """Atomically clear recovery and persist the verified record."""
        async with self._update_lock:
            data = await self.async_load()
            meter = data.setdefault("meters", {}).setdefault(record.mac, {})
            meter["interrupted_session"] = None
            meter["verified_calibration"] = _serialize_verified_calibration(record)
            await self._store.async_save(data)

    async def async_get_verified_calibration(
        self, mac: str
    ) -> VerifiedCalibrationRecord | None:
        """Load the latest strict verified record for one canonical MAC."""
        mac = canonical_mac(mac)
        data = await self.async_load()
        raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
        return None if raw is None else _deserialize_verified_calibration(mac, raw)

    async def async_claim_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        """Atomically consume one record's reviewed source-handoff preview."""
        mac = canonical_mac(mac)
        if re.fullmatch(r"[0-9a-f]{32}", transaction_id) is None:
            return False
        async with self._update_lock:
            data = await self.async_load()
            raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
            if raw is None:
                return False
            record = _deserialize_verified_calibration(mac, raw)
            if (
                record.verification_id != verification_id
                or not record.source_handoff_available
                or record.has_offset_calibration
            ):
                return False
            raw["source_handoff_available"] = False
            raw["source_handoff_transaction_id"] = transaction_id
            raw["source_handoff_firmware_installed"] = False
            await self._store.async_save(data)
            return True

    async def async_revalidate_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        """Atomically require the same latest record and preview reservation."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
            if raw is None:
                return False
            record = _deserialize_verified_calibration(mac, raw)
            return (
                record.verification_id == verification_id
                and not record.source_handoff_available
                and not record.has_offset_calibration
                and record.source_handoff_transaction_id == transaction_id
            )

    async def async_release_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        """Release only the exact pre-write source-handoff reservation."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
            if raw is None:
                return False
            record = _deserialize_verified_calibration(mac, raw)
            if (
                record.verification_id != verification_id
                or record.source_handoff_available
                or record.source_handoff_transaction_id != transaction_id
            ):
                return False
            raw["source_handoff_available"] = not record.has_offset_calibration
            raw["source_handoff_transaction_id"] = None
            raw["source_handoff_firmware_installed"] = False
            await self._store.async_save(data)
            return True

    async def async_mark_verified_calibration_installed(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        """Record that the exact reviewed gains are running before flash is cleared."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
            if raw is None:
                return False
            record = _deserialize_verified_calibration(mac, raw)
            if (
                record.verification_id != verification_id
                or record.source_handoff_available
                or record.has_offset_calibration
                or record.source_handoff_transaction_id != transaction_id
            ):
                return False
            raw["source_handoff_firmware_installed"] = True
            await self._store.async_save(data)
            return True

    async def async_complete_verified_calibration_handoff(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        """Make configuration authoritative only after install and flash clear."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
            if raw is None:
                return False
            record = _deserialize_verified_calibration(mac, raw)
            if (
                record.verification_id != verification_id
                or record.source_handoff_available
                or record.has_offset_calibration
                or not record.source_handoff_firmware_installed
                or record.source_handoff_transaction_id != transaction_id
            ):
                return False
            raw["source_authority"] = CalibrationSourceAuthority.CONFIGURATION.value
            await self._store.async_save(data)
            return True
