"""Derive CircuitSetup board topology from configuration and native evidence."""

from __future__ import annotations

import re
from collections.abc import Iterable
from dataclasses import replace
from typing import TYPE_CHECKING

from .config_document import ESPHomeConfigDocument
from .models import (
    ChannelAddress,
    ConnectionType,
    MeterTopology,
    Phase,
    TopologyEvidence,
    TopologyEvidenceSource,
    VoltageReferenceTopology,
)

if TYPE_CHECKING:
    from .meter_configuration import MeterConfigurationRequest

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


def _expected_group_keys(topology: MeterTopology) -> tuple[str, ...]:
    from .entity_binding import group_key

    return tuple(
        group_key(board, group)
        for board in range(topology.board_count)
        for group in range(2)
    )


def voltage_reference_topology_from_legacy(
    topology: MeterTopology,
) -> VoltageReferenceTopology:
    """Infer references from legacy project metadata only."""
    groups = _expected_group_keys(topology)
    if topology.voltage_layout == "standard":
        references: tuple[tuple[str, tuple[str, ...]], ...] = (("main", groups),)
    elif topology.voltage_layout == "two_voltages":
        references = (
            ("main", groups[::2]),
            ("secondary", groups[1::2]),
        )
    else:
        raise TopologyParseError(
            f"unknown legacy voltage layout: {topology.voltage_layout!r}"
        )
    return VoltageReferenceTopology(references, "legacy")


def voltage_reference_fingerprint_for_meter(topology: MeterTopology) -> str:
    """Return the normalized identity for a legacy-only meter topology."""
    try:
        return voltage_reference_topology_from_legacy(topology).fingerprint
    except TopologyParseError:
        return f"legacy:{topology.voltage_layout}"


def _validated_voltage_reference_topology(
    topology: MeterTopology,
    references: tuple[tuple[str, tuple[str, ...]], ...],
) -> VoltageReferenceTopology:
    expected = set(_expected_group_keys(topology))
    assigned = [group for _, groups in references for group in groups]
    if (
        not references
        or len(assigned) != len(expected)
        or len(set(assigned)) != len(assigned)
        or set(assigned) != expected
    ):
        raise TopologyParseError("voltage-reference groups must be assigned exactly once")
    try:
        return VoltageReferenceTopology(references, "helper")
    except ValueError as error:
        raise TopologyParseError("invalid helper voltage-reference topology") from error


def voltage_reference_topology_from_configuration(
    topology: MeterTopology,
    configuration: MeterConfigurationRequest,
) -> VoltageReferenceTopology:
    """Use helper-managed reference assignments after structural validation."""
    return _validated_voltage_reference_topology(
        topology,
        tuple(
            (reference.reference_id, tuple(reference.group_keys))
            for reference in configuration.meter.voltage_references
        ),
    )


def _managed_voltage_reference_assignments(
    document: ESPHomeConfigDocument, topology: MeterTopology
) -> tuple[tuple[str, tuple[str, ...]], ...] | None:
    block = document.managed_blocks.get("voltage_references")
    if block is None:
        return None
    entries: list[tuple[str, tuple[str, ...] | None]] = []
    in_section = False
    for raw_line in block.content.splitlines():
        line = raw_line.split("#", 1)[0].rstrip()
        if line.strip() == "voltage_references:":
            in_section = True
            continue
        if not in_section or not line.strip():
            continue
        match = re.fullmatch(r"\s{2}([A-Za-z][A-Za-z0-9_-]{0,63}):\s*(.*)", line)
        if match is None:
            if line and not line.startswith(" "):
                break
            continue
        reference_id, value = match.groups()
        groups: tuple[str, ...] | None = None
        if value.startswith("[") and value.endswith("]"):
            values = tuple(item.strip().strip("'\"") for item in value[1:-1].split(",") if item.strip())
            groups = values or None
        entries.append((reference_id, groups))
    if not entries or len(entries) > 2:
        return None
    expected = _expected_group_keys(topology)
    if any(groups is None for _, groups in entries):
        if len(entries) == 1:
            return ((entries[0][0], expected),)
        return tuple(
            (reference_id, expected[index::2])
            for index, (reference_id, _) in enumerate(entries)
        )
    return tuple((reference_id, groups or ()) for reference_id, groups in entries)


def voltage_reference_topology_from_config(
    document: ESPHomeConfigDocument,
    topology: MeterTopology,
    configuration: MeterConfigurationRequest | None = None,
) -> VoltageReferenceTopology:
    """Prefer verified helper semantics; otherwise use legacy project evidence."""
    if configuration is not None:
        try:
            return voltage_reference_topology_from_configuration(topology, configuration)
        except TopologyParseError:
            pass
    managed = _managed_voltage_reference_assignments(document, topology)
    if managed is not None:
        try:
            return _validated_voltage_reference_topology(topology, managed)
        except TopologyParseError:
            pass
    return voltage_reference_topology_from_legacy(topology)


# Short alias for callers that treat board and voltage topology uniformly.
voltage_topology_from_config = voltage_reference_topology_from_config


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
        raw_index = match.group("index")
        if raw_index not in {"1", "2", "3", "4", "5", "6"}:
            raise TopologyParseError(
                "add-on package filename must use official index 1..6"
            )
        index = int(raw_index)
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

    if (
        project_metadata is not None
        and native_metadata is not None
        and project_metadata[0] == native_metadata[0]
        and project_metadata != native_metadata
    ):
        raise TopologyMismatchError(
            f"config project metadata {project_metadata} disagrees with "
            f"native project metadata {native_metadata}"
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
