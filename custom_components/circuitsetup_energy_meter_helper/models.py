"""Typed, safe persistence models for the helper."""

from __future__ import annotations

import re
from dataclasses import dataclass
from dataclasses import field as dataclass_field
from enum import StrEnum
from math import isfinite
from typing import Literal

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

    def __post_init__(self) -> None:
        if not 0 <= self.addon_count <= 6:
            raise ValueError("addon_count must be between 0 and 6")
        if self.connection_type not in _CONNECTION_TYPES - {"unknown"}:
            raise ValueError("unsupported connection_type")

    @property
    def ct_count(self) -> int:
        """Return six CT channels for every installed board."""
        return 6 * (self.addon_count + 1)


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
        if not isfinite(self.reporting_multiplier) or self.reporting_multiplier <= 0:
            raise ValueError("reporting_multiplier must be finite and positive")
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
    ct_selections: tuple[StoredCTSelection, ...] = ()
    interrupted_session: StoredInterruptedSession | None = None

    def __post_init__(self) -> None:
        object.__setattr__(self, "mac", canonical_mac(self.mac))
        _safe_line(self.setup_intent, "setup_intent")
        if self.config_filename is not None:
            _safe_line(self.config_filename, "config_filename")
