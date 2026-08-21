"""Derive CircuitSetup board topology from configuration and native evidence."""

from __future__ import annotations

import re
from collections.abc import Iterable
from dataclasses import replace

from .config_document import ESPHomeConfigDocument
from .models import (
    ChannelAddress,
    ConnectionType,
    MeterTopology,
    Phase,
    TopologyEvidence,
    TopologyEvidenceSource,
)

BASE_PROJECT = "circuitsetup.6c-energy-meter"
_ADDON_SEGMENT_RE = re.compile(r"-(?P<count>[1-6])-addons?(?=-|$)")
_ADDON_PACKAGE_RE = re.compile(
    r"(?:^|/)meter_sensors/6chan_addon(?P<index>\d+)\.yaml$"
)
_MAIN_PACKAGE_RE = re.compile(
    r"(?:^|/)meter_sensors/(?:6chan_main_sensor|main)\.yaml$"
)
_VALID_REMAINDERS = {
    "",
    "-ethernet",
    "-ethernet-waveshare",
    "-2-voltages",
    "-ethernet-2-voltages",
    "-2-voltages-ethernet",
    "-ethernet-waveshare-2-voltages",
    "-2-voltages-ethernet-waveshare",
}


class TopologyParseError(ValueError):
    """Topology metadata is absent, unknown, or structurally invalid."""


class TopologyMismatchError(ValueError):
    """Independent topology evidence disagrees."""


def _project_metadata(name: str) -> tuple[int, ConnectionType, str]:
    if not name.startswith(BASE_PROJECT):
        raise TopologyParseError(f"unknown CircuitSetup project: {name!r}")
    suffix = name[len(BASE_PROJECT) :]
    if suffix and not suffix.startswith("-"):
        raise TopologyParseError(f"unknown CircuitSetup project: {name!r}")
    matches = list(_ADDON_SEGMENT_RE.finditer(suffix))
    if len(matches) > 1:
        raise TopologyParseError(f"multiple add-on segments in project: {name!r}")
    addon_count = int(matches[0].group("count")) if matches else 0
    remainder = (
        suffix[: matches[0].start()] + suffix[matches[0].end() :]
        if matches
        else suffix
    )
    if remainder not in _VALID_REMAINDERS:
        raise TopologyParseError(f"unknown CircuitSetup project variant: {name!r}")
    connection_type: ConnectionType
    if "ethernet-waveshare" in remainder:
        connection_type = "ethernet_waveshare"
    elif "ethernet" in remainder:
        connection_type = "ethernet_lilygo"
    else:
        connection_type = "wifi"
    voltage_layout = "two_voltages" if "2-voltages" in remainder else "standard"
    return addon_count, connection_type, voltage_layout


def addon_count_from_project(name: str) -> int:
    """Return the declared add-on count for an exact known project variant."""
    return _project_metadata(name)[0]


def connection_type_from_project(name: str) -> ConnectionType:
    """Return connection hardware independently of the add-on segment."""
    return _project_metadata(name)[1]


def voltage_layout_from_project(name: str) -> str:
    """Return the standard or special two-voltage layout."""
    return _project_metadata(name)[2]


def addon_count_from_packages(package_files: Iterable[str]) -> int | None:
    """Count unique contiguous add-on sensor packages."""
    indices: set[int] = set()
    main_count = 0
    for path in package_files:
        if _MAIN_PACKAGE_RE.search(path):
            main_count += 1
            if main_count > 1:
                raise TopologyParseError("duplicate main meter package")
            continue
        match = _ADDON_PACKAGE_RE.search(path)
        if match is None:
            continue
        index = int(match.group("index"))
        if not 1 <= index <= 6:
            raise TopologyParseError("add-on package index must be in 1..6")
        if index in indices:
            raise TopologyParseError(f"duplicate add-on package index {index}")
        indices.add(index)
    if not indices:
        return 0 if main_count else None
    expected = set(range(1, max(indices) + 1))
    if indices != expected:
        raise TopologyParseError("add-on package indices must be contiguous from 1")
    return len(indices)


def addon_count_from_dashboard_import(url: str | None) -> int | None:
    """Parse a known top-level meter filename as corroborating evidence."""
    if not url:
        return None
    filename = url.split("@", 1)[0].rsplit("/", 1)[-1]
    if not filename.endswith(".yaml"):
        return None
    stem = filename.removesuffix(".yaml").replace("_", "-")
    for prefix in ("6chan-energy-meter", "6-channel-energy-meter"):
        if not stem.startswith(prefix):
            continue
        suffix = stem[len(prefix) :]
        if suffix.startswith("-main-board"):
            suffix = suffix.removeprefix("-main-board")
        try:
            return addon_count_from_project(BASE_PROJECT + suffix)
        except TopologyParseError:
            return None
    return None


def topology_from_config(
    document: ESPHomeConfigDocument, *, native_project_name: str | None = None
) -> MeterTopology:
    """Reconcile authoritative config evidence and optional native identity."""
    evidence: list[TopologyEvidence] = []
    counts: list[tuple[str, int]] = []
    project_metadata: tuple[int, ConnectionType, str] | None = None
    if document.project_name is not None:
        project_metadata = _project_metadata(document.project_name)
        counts.append(("project", project_metadata[0]))
        evidence.append(
            TopologyEvidence(
                TopologyEvidenceSource.CONFIG_PROJECT,
                project_metadata[0],
                document.project_name,
            )
        )

    package_count = addon_count_from_packages(document.package_files)
    if package_count is not None:
        counts.append(("packages", package_count))
        evidence.append(
            TopologyEvidence(
                TopologyEvidenceSource.CONFIG_PACKAGES,
                package_count,
                f"contiguous add-on packages 1..{package_count}",
            )
        )

    if not counts:
        raise TopologyParseError("configuration has no authoritative topology evidence")

    dashboard_count = addon_count_from_dashboard_import(document.dashboard_import)
    if dashboard_count is not None:
        counts.append(("dashboard import", dashboard_count))
        evidence.append(
            TopologyEvidence(
                TopologyEvidenceSource.DASHBOARD_IMPORT,
                dashboard_count,
                document.dashboard_import or "dashboard import",
            )
        )

    native_metadata: tuple[int, ConnectionType, str] | None = None
    if native_project_name is not None:
        native_metadata = _project_metadata(native_project_name)
        counts.append(("native project", native_metadata[0]))
        evidence.append(
            TopologyEvidence(
                TopologyEvidenceSource.NATIVE_PROJECT,
                native_metadata[0],
                native_project_name,
            )
        )

    addon_count = counts[0][1]
    if any(count != addon_count for _, count in counts[1:]):
        detail = ", ".join(f"{source}={count}" for source, count in counts)
        raise TopologyMismatchError(f"topology evidence disagrees: {detail}")

    metadata = project_metadata or native_metadata
    return MeterTopology.from_addon_count(
        addon_count,
        connection_type=metadata[1] if metadata else "unknown",
        voltage_layout=metadata[2] if metadata else "standard",
        project_name=document.project_name or native_project_name or "unknown",
        evidence=tuple(evidence),
    )


def topology_from_native(project_name: str) -> MeterTopology:
    """Build provisional topology from native project metadata only."""
    addon_count, connection_type, voltage_layout = _project_metadata(project_name)
    return MeterTopology.from_addon_count(
        addon_count,
        connection_type=connection_type,
        voltage_layout=voltage_layout,
        project_name=project_name,
        evidence=(
            TopologyEvidence(
                TopologyEvidenceSource.NATIVE_PROJECT, addon_count, project_name
            ),
        ),
    )


def cross_check_runtime(
    topology: MeterTopology,
    current_sensor_count: int,
    run_gain_button_count: int,
    config_filename: str,
) -> MeterTopology:
    """Require native entities for every configured channel and group."""
    if (
        current_sensor_count != topology.ct_count
        or run_gain_button_count != topology.group_count
    ):
        raise TopologyMismatchError(
            f"{config_filename}: current sensors expected {topology.ct_count}, "
            f"actual {current_sensor_count}; run-gain buttons expected "
            f"{topology.group_count}, actual {run_gain_button_count}"
        )
    evidence = TopologyEvidence(
        TopologyEvidenceSource.NATIVE_ENTITY_COUNTS,
        topology.addon_count,
        f"{current_sensor_count} current sensors, "
        f"{run_gain_button_count} run-gain buttons",
    )
    return replace(topology, evidence=(*topology.evidence, evidence))


def channel_address(channel: int, topology: MeterTopology) -> ChannelAddress:
    """Map one global CT number to its board-local address."""
    if not 1 <= channel <= topology.ct_count:
        raise ValueError(f"channel must be in 1..{topology.ct_count}")
    board_index = (channel - 1) // 6
    offset = (channel - 1) % 6
    phases: tuple[Phase, ...] = ("A", "B", "C")
    return ChannelAddress(
        channel,
        board_index,
        0 if offset < 3 else 1,
        phases[offset % 3],
    )
