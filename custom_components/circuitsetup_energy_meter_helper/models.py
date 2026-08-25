"""Typed, safe persistence models for the helper."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from dataclasses import field as dataclass_field
from enum import StrEnum
from hashlib import sha256
from typing import Literal

from .ct_catalog import REPORTING_MULTIPLIERS

_CONNECTION_TYPES = {
    "wifi",
    "ethernet_lilygo",
    "ethernet_waveshare",
    "unknown",
}
_EVIDENCE_SOURCES = {
    "config_project",
    "config_packages",
    "dashboard_import",
    "native_project",
    "native_entity_counts",
}

ConnectionType = Literal["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]
Phase = Literal["A", "B", "C"]
type PhaseOffsetTable = tuple[tuple[int, int], tuple[int, int], tuple[int, int]]
type PhasePowerOffsetTable = tuple[tuple[int, int], tuple[int, int], tuple[int, int]]

_MAC = re.compile(
    r"(?:[0-9a-fA-F]{12}|[0-9a-fA-F]{2}(?::[0-9a-fA-F]{2}){5}|"
    r"[0-9a-fA-F]{2}(?:-[0-9a-fA-F]{2}){5})"
)
_FIRMWARE_PRODUCT_ID = re.compile(r"^[a-z0-9][a-z0-9_-]{0,127}$")
_ESPHOME_VERSION = re.compile(
    r"^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$"
)
_FIRMWARE_CONTROL = re.compile(r"[\x00-\x1f\x7f-\x9f]")
_FIRMWARE_MAX_LENGTH = 160


def canonical_mac(value: str) -> str:
    """Return one compact device identity without accepting malformed aliases."""
    if not isinstance(value, str) or _MAC.fullmatch(value) is None:
        raise ValueError("MAC must be 12 hexadecimal digits or six octets")
    return value.replace(":", "").replace("-", "").casefold()


class SetupState(StrEnum):
    """The user-visible state of meter setup."""

    NO_DEVICE = "no_device"
    INSTALLER_GUIDE = "installer_guide"
    WAITING_FOR_DISCOVERY = "waiting_for_discovery"
    DEVICE_DISCOVERED = "device_discovered"
    WAITING_FOR_ADOPTION = "waiting_for_adoption"
    READING_CONFIG = "reading_config"
    TOPOLOGY_REVIEW = "topology_review"
    CT_CONFIGURATION = "ct_configuration"
    CONFIG_REVIEW = "config_review"
    CONFIG_WRITING = "config_writing"
    CONFIG_VALIDATING = "config_validating"
    CONFIG_COMPILING = "config_compiling"
    WAITING_FOR_INSTALL_CONFIRMATION = "waiting_for_install_confirmation"
    CONFIG_INSTALLING = "config_installing"
    WAITING_FOR_RECONNECT = "waiting_for_reconnect"
    READY_FOR_CALIBRATION = "ready_for_calibration"
    FAILED = "failed"


@dataclass(slots=True, frozen=True)
class InstallerIntent:
    """The firmware variant the user plans to install."""

    addon_count: int
    connection_type: ConnectionType
    firmware_product_id: str | None = None
    esphome_version: str | None = None
    power_quality: tuple[bool, ...] | None = None
    status_fields: tuple[bool, ...] | None = None

    def __post_init__(self) -> None:
        if not 0 <= self.addon_count <= 6:
            raise ValueError("addon_count must be between 0 and 6")
        if self.connection_type not in _CONNECTION_TYPES - {"unknown"}:
            raise ValueError("unsupported connection_type")
        validate_installer_firmware(
            self.firmware_product_id,
            self.esphome_version,
        )
        board_count = self.addon_count + 1
        defaults = {
            "power_quality": (False,) * board_count,
            "status_fields": (True,) + (False,) * self.addon_count,
        }
        for field_name, default in defaults.items():
            values = getattr(self, field_name)
            if values is None:
                object.__setattr__(self, field_name, default)
            elif len(values) != board_count or any(
                type(value) is not bool for value in values
            ):
                raise ValueError(
                    "package options require one state per installed board"
                )

    @property
    def ct_count(self) -> int:
        """Return six CT channels for every installed board."""
        return 6 * (self.addon_count + 1)


def validate_installer_firmware(
    firmware_product_id: str | None, esphome_version: str | None
) -> None:
    """Accept only a complete pair of safe firmware catalog identifiers."""
    if (firmware_product_id is None) != (esphome_version is None):
        raise ValueError("firmware product and ESPHome version must be paired")
    if firmware_product_id is None:
        return
    if (
        not isinstance(firmware_product_id, str)
        or len(firmware_product_id) > _FIRMWARE_MAX_LENGTH
        or _FIRMWARE_CONTROL.search(firmware_product_id)
        or _FIRMWARE_PRODUCT_ID.fullmatch(firmware_product_id) is None
    ):
        raise ValueError("invalid firmware_product_id")
    if (
        not isinstance(esphome_version, str)
        or len(esphome_version) > _FIRMWARE_MAX_LENGTH
        or _FIRMWARE_CONTROL.search(esphome_version)
        or _ESPHOME_VERSION.fullmatch(esphome_version) is None
    ):
        raise ValueError("invalid esphome_version")


def _safe_line(value: str, field: str, limit: int = 256) -> None:
    """Reject multiline payloads from metadata fields."""
    if not value or len(value) > limit or "\n" in value or "\r" in value:
        raise ValueError(f"{field} must be a non-empty single-line value")


class TopologyEvidenceSource(StrEnum):
    """Source of one topology count."""

    CONFIG_PROJECT = "config_project"
    CONFIG_PACKAGES = "config_packages"
    DASHBOARD_IMPORT = "dashboard_import"
    NATIVE_PROJECT = "native_project"
    NATIVE_ENTITY_COUNTS = "native_entity_counts"


@dataclass(slots=True, frozen=True)
class TopologyEvidence:
    """One retained input to a topology decision."""

    source: TopologyEvidenceSource
    addon_count: int
    detail: str

    def __post_init__(self) -> None:
        if not 0 <= self.addon_count <= 6:
            raise ValueError("addon_count must be between 0 and 6")
        _safe_line(self.detail, "detail")


@dataclass(slots=True, frozen=True)
class MeterTopology:
    """Immutable physical layout derived from an add-on count."""

    addon_count: int
    board_count: int
    ct_count: int
    group_count: int
    connection_type: ConnectionType
    voltage_layout: str
    project_name: str
    evidence: tuple[TopologyEvidence, ...]

    def __post_init__(self) -> None:
        if not 0 <= self.addon_count <= 6:
            raise ValueError("addon_count must be between 0 and 6")
        if (self.board_count, self.ct_count, self.group_count) != (
            self.addon_count + 1,
            6 * (self.addon_count + 1),
            2 * (self.addon_count + 1),
        ):
            raise ValueError("topology counts do not match addon_count")
        if self.connection_type not in _CONNECTION_TYPES:
            raise ValueError("invalid connection_type")
        _safe_line(self.voltage_layout, "voltage_layout")
        _safe_line(self.project_name, "project_name")

    @classmethod
    def from_addon_count(
        cls,
        addon_count: int,
        *,
        connection_type: ConnectionType,
        voltage_layout: str,
        project_name: str,
        evidence: tuple[TopologyEvidence, ...],
    ) -> MeterTopology:
        """Derive every fixed count from the number of add-on boards."""
        board_count = addon_count + 1
        return cls(
            addon_count,
            board_count,
            6 * board_count,
            2 * board_count,
            connection_type,
            voltage_layout,
            project_name,
            evidence,
        )


@dataclass(slots=True, frozen=True)
class VoltageReferenceTopology:
    """Validated voltage-reference assignments independent of board counts."""

    references: tuple[tuple[str, tuple[str, ...]], ...]
    source: Literal["helper", "legacy"]

    @classmethod
    def from_legacy(cls, board_count: int, voltage_layout: str) -> VoltageReferenceTopology:
        """Build the compatibility topology encoded by old project suffixes."""
        if not 1 <= board_count <= 7:
            raise ValueError("board_count must be between 1 and 7")
        groups = tuple(
            f"{('main' if board == 0 else f'addon{board}')}_{group}"
            for board in range(board_count)
            for group in (1, 2)
        )
        if voltage_layout == "standard":
            references: tuple[tuple[str, tuple[str, ...]], ...] = (("main", groups),)
        elif voltage_layout == "two_voltages":
            references = (("main", groups[::2]), ("secondary", groups[1::2]))
        else:
            raise ValueError(f"unknown legacy voltage layout: {voltage_layout!r}")
        return cls(references, "legacy")

    def __post_init__(self) -> None:
        if not self.references or self.source not in {"helper", "legacy"}:
            raise ValueError("voltage-reference topology is invalid")
        reference_ids: set[str] = set()
        groups: list[str] = []
        for reference_id, group_keys in self.references:
            if (
                not isinstance(reference_id, str)
                or not reference_id
                or reference_id in reference_ids
                or not isinstance(group_keys, tuple)
                or not group_keys
            ):
                raise ValueError("voltage-reference topology is invalid")
            reference_ids.add(reference_id)
            for group_key_value in group_keys:
                if not isinstance(group_key_value, str) or re.fullmatch(
                    r"(?:main|addon[1-6])_[12]", group_key_value
                ) is None:
                    raise ValueError("voltage-reference topology is invalid")
                groups.append(group_key_value)
        if len(groups) != len(set(groups)):
            raise ValueError("voltage-reference groups must be unique")

    @property
    def reference_ids(self) -> tuple[str, ...]:
        return tuple(reference_id for reference_id, _ in self.references)

    def groups_for(self, reference_id: str) -> tuple[str, ...]:
        for current_id, groups in self.references:
            if current_id == reference_id:
                return groups
        raise KeyError(reference_id)

    @property
    def fingerprint(self) -> str:
        """Return a deterministic identity for ordered IDs and assignments."""
        canonical = json.dumps(self.references, separators=(",", ":"))
        return f"v1:{sha256(canonical.encode()).hexdigest()}"


@dataclass(slots=True, frozen=True)
class ChannelAddress:
    """Board, local group, and phase for one global CT channel."""

    channel: int
    board_index: int
    group_index: int
    phase: Phase


@dataclass(slots=True, frozen=True)
class SubstitutionChange:
    """One safe, visible CT substitution change."""

    key: str
    old_value: str | None
    new_value: str


@dataclass(slots=True, frozen=True)
class ConfigMutationPlan:
    """Backend-only proposed content plus its safe review summary."""

    configuration: str
    source_sha256: str
    changes: tuple[SubstitutionChange, ...]
    redacted_diff: str
    proposed_content: str = dataclass_field(repr=False)


@dataclass(slots=True, frozen=True)
class StoredCTSelection:
    """One CT selection, bound to the configuration that supplied its gain."""

    channel: int
    model_id: str | None
    display_label: str | None
    raw_gain_ct: int
    reporting_multiplier: float
    config_sha256: str

    def __post_init__(self) -> None:
        if self.channel < 1 or not 1 <= self.raw_gain_ct <= 65535:
            raise ValueError("channel and raw_gain_ct must be positive")
        if (
            isinstance(self.reporting_multiplier, bool)
            or self.reporting_multiplier not in REPORTING_MULTIPLIERS
        ):
            raise ValueError("reporting_multiplier must be 1, 2, 4, or 8")
        _safe_line(self.config_sha256, "config_sha256", 64)
        for field, value in (
            ("model_id", self.model_id),
            ("display_label", self.display_label),
        ):
            if value is not None:
                _safe_line(value, field)


@dataclass(slots=True, frozen=True)
class StoredTopologyEvidence:
    """A bounded source for the stored topology decision."""

    source: str
    addon_count: int
    detail: str

    def __post_init__(self) -> None:
        if self.source not in _EVIDENCE_SOURCES or not 0 <= self.addon_count <= 6:
            raise ValueError("invalid topology evidence")
        _safe_line(self.detail, "detail")


@dataclass(slots=True, frozen=True)
class StoredTopology:
    """The fixed topology fields needed before configuration parsing exists."""

    addon_count: int
    board_count: int
    ct_count: int
    group_count: int
    connection_type: str
    voltage_layout: str
    project_name: str
    evidence: tuple[StoredTopologyEvidence, ...] = ()

    def __post_init__(self) -> None:
        if not 0 <= self.addon_count <= 6:
            raise ValueError("addon_count must be between 0 and 6")
        if (self.board_count, self.ct_count, self.group_count) != (
            self.addon_count + 1,
            6 * (self.addon_count + 1),
            2 * (self.addon_count + 1),
        ):
            raise ValueError("topology counts do not match addon_count")
        if self.connection_type not in _CONNECTION_TYPES:
            raise ValueError("invalid connection_type")
        _safe_line(self.voltage_layout, "voltage_layout")
        _safe_line(self.project_name, "project_name")


@dataclass(slots=True, frozen=True)
class StoredInterruptedSession:
    """Minimal recovery marker, without calibration data or device credentials."""

    state: str
    started_at: str
    changed_channels: tuple[int, ...]
    config_transaction_id: str | None = None

    def __post_init__(self) -> None:
        _safe_line(self.state, "state")
        _safe_line(self.started_at, "started_at")
        if any(channel < 1 for channel in self.changed_channels):
            raise ValueError("changed_channels must be positive")
        if self.config_transaction_id is not None:
            _safe_line(self.config_transaction_id, "config_transaction_id")


@dataclass(slots=True, frozen=True)
class StoredMeterRecord:
    """Safe metadata for one meter, keyed by its MAC address."""

    mac: str
    setup_intent: str
    config_filename: str | None
    topology: StoredTopology | None
    config_sha256: str | None = None
    ct_selections: tuple[StoredCTSelection, ...] = ()
    interrupted_session: StoredInterruptedSession | None = None

    def __post_init__(self) -> None:
        object.__setattr__(self, "mac", canonical_mac(self.mac))
        _safe_line(self.setup_intent, "setup_intent")
        if self.config_filename is not None:
            _safe_line(self.config_filename, "config_filename")
        if (
            self.config_sha256 is not None
            and re.fullmatch(r"[0-9a-f]{64}", self.config_sha256) is None
        ):
            raise ValueError("config_sha256 must be a SHA-256 digest")
