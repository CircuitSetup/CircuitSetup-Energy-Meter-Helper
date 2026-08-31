"""Authoritative native firmware total catalog."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, replace
from types import MappingProxyType

from .meter_configuration import (
    AggregateTotalSource,
    AutomaticTotalSettings,
    BoardTotalSettings,
    ChannelTotalSource,
    CircuitAggregate,
    CircuitRole,
    DefaultTotalsSettings,
    EnergyMode,
    MeasurementMethod,
    MeterConfigurationRequest,
    NativeTotalSource,
    TotalOutputSettings,
)
from .models import MeterTopology


@dataclass(frozen=True, slots=True)
class NativeTotalDefinition:
    source_id: str
    label: str
    leaf_channels: tuple[int, ...]
    power_id: str
    current_id: str
    existing_energy_id: str | None
    upstream_defaults: TotalOutputSettings


@dataclass(frozen=True, slots=True)
class AutomaticTotalCandidate:
    """One unambiguous server-owned suggestion derived from channel roles."""

    candidate_id: str
    aggregate_id: str
    name: str
    role: CircuitRole
    sources: tuple[ChannelTotalSource, ...]
    measurement_method: MeasurementMethod
    energy_mode: EnergyMode
    recommended_outputs: TotalOutputSettings


@dataclass(frozen=True, slots=True)
class ResolvedAutomaticTotal:
    """A candidate paired with its persisted enablement and output choices."""

    candidate: AutomaticTotalCandidate
    enabled: bool
    outputs: TotalOutputSettings


@dataclass(frozen=True, slots=True)
class ResolvedTotalSource:
    label: str
    power_id: str
    current_id: str
    leaf_channels: frozenset[int]


@dataclass(frozen=True, slots=True)
class PlannedTotalNode:
    aggregate: CircuitAggregate
    power_id: str
    current_id: str
    sources: tuple[ResolvedTotalSource, ...]
    power_required: bool
    current_required: bool
    energy_required: bool


@dataclass(frozen=True, slots=True)
class NativeVisibilityOverride:
    sensor_id: str
    internal: bool


@dataclass(frozen=True, slots=True)
class TotalRenderPlan:
    native_visibility: tuple[NativeVisibilityOverride, ...]
    ordered_nodes: tuple[PlannedTotalNode, ...]
    leaf_channels: Mapping[str, frozenset[int]]
    independent_overlap_warnings: tuple[tuple[str, str, frozenset[int]], ...]


_AUTOMATIC_ROLE_DEFINITIONS = (
    (CircuitRole.GRID, "auto-mains", "Mains", EnergyMode.BIDIRECTIONAL),
    (CircuitRole.SOLAR, "auto-solar", "Solar", EnergyMode.GENERATION),
    (CircuitRole.SUBPANEL, "auto-subpanel", "Subpanel", EnergyMode.CONSUMPTION),
    (
        CircuitRole.TWO_POLE,
        "auto-two-pole",
        "Two-pole circuit",
        EnergyMode.CONSUMPTION,
    ),
)
_AUTOMATIC_OUTPUTS = TotalOutputSettings(True, False, True)


def automatic_total_candidates(
    configuration: MeterConfigurationRequest,
) -> tuple[AutomaticTotalCandidate, ...]:
    """Return only role groups with exactly two enabled CTs, in a stable order."""
    occupied_ids = {aggregate.aggregate_id for aggregate in configuration.aggregates}
    candidates: list[AutomaticTotalCandidate] = []
    for role, aggregate_id, name, energy_mode in _AUTOMATIC_ROLE_DEFINITIONS:
        channels = tuple(
            channel.channel
            for channel in configuration.channels
            if channel.enabled and channel.role is role
        )
        if len(channels) != 2 or aggregate_id in occupied_ids:
            continue
        first, second = sorted(channels)
        candidates.append(
            AutomaticTotalCandidate(
                f"{role.value}-ct{first}-ct{second}",
                aggregate_id,
                name,
                role,
                (ChannelTotalSource("channel", first), ChannelTotalSource("channel", second)),
                MeasurementMethod.TWO_CT_SUM,
                energy_mode,
                _AUTOMATIC_OUTPUTS,
            )
        )
    return tuple(candidates)


def resolve_automatic_totals(
    candidates: tuple[AutomaticTotalCandidate, ...],
    settings: tuple[AutomaticTotalSettings, ...],
) -> tuple[ResolvedAutomaticTotal, ...]:
    """Apply persisted choices to current server candidates without changing sources."""
    settings_by_id = {setting.candidate_id: setting for setting in settings}
    return tuple(
        ResolvedAutomaticTotal(
            candidate,
            settings_by_id[candidate.candidate_id].enabled,
            settings_by_id[candidate.candidate_id].outputs,
        )
        if candidate.candidate_id in settings_by_id
        else ResolvedAutomaticTotal(candidate, True, candidate.recommended_outputs)
        for candidate in candidates
    )


def stale_automatic_total_settings(
    candidates: tuple[AutomaticTotalCandidate, ...],
    settings: tuple[AutomaticTotalSettings, ...],
) -> tuple[AutomaticTotalSettings, ...]:
    """Return persisted choices which no longer refer to a current candidate."""
    candidate_ids = {candidate.candidate_id for candidate in candidates}
    return tuple(setting for setting in settings if setting.candidate_id not in candidate_ids)


def native_total_sources(topology: MeterTopology) -> tuple[NativeTotalDefinition, ...]:
    """Return native board totals and the overall total for this topology."""
    outputs = TotalOutputSettings(True, True, True)
    sources: list[NativeTotalDefinition] = []
    if topology.board_count == 1:
        return (NativeTotalDefinition("overall", "Overall meter total", tuple(range(1, 7)), "totalWattsMain", "totalAmpsMain", "totalEnergyDaily", outputs),)
    for board in range(topology.board_count):
        start = board * 6 + 1
        source_id = "board-main" if board == 0 else f"board-addon-{board}"
        suffix = "Main" if board == 0 else f"AddOn{board}"
        label = "Main Board total" if board == 0 else f"Add-on {board} total"
        sources.append(NativeTotalDefinition(source_id, label, tuple(range(start, start + 6)), f"totalWatts{suffix}", f"totalAmps{suffix}", None, TotalOutputSettings(False, False, False)))
    sources.append(NativeTotalDefinition("overall", "Overall meter total", tuple(range(1, topology.ct_count + 1)), "totalWatts", "totalAmps", "totalEnergyDaily", outputs))
    return tuple(sources)


def default_total_settings(topology: MeterTopology) -> DefaultTotalsSettings:
    overall = TotalOutputSettings(True, True, True)
    boards = () if topology.board_count == 1 else tuple(
        BoardTotalSettings(index, TotalOutputSettings(False, False, False))
        for index in range(topology.board_count)
    )
    return DefaultTotalsSettings(overall, boards)


def _active_aggregates(
    configuration: MeterConfigurationRequest,
) -> tuple[CircuitAggregate, ...]:
    """Combine advanced totals with enabled, server-derived automatic totals."""
    candidates = automatic_total_candidates(configuration)
    candidate_by_id = {candidate.candidate_id: candidate for candidate in candidates}
    for setting in configuration.automatic_totals:
        if setting.candidate_id not in candidate_by_id:
            raise ValueError("automatic total setting has no current candidate")
    automatic = tuple(
        CircuitAggregate(
            resolved.candidate.aggregate_id,
            resolved.candidate.name,
            resolved.candidate.role,
            resolved.candidate.sources,
            resolved.candidate.measurement_method,
            resolved.candidate.energy_mode,
            resolved.outputs,
        )
        for resolved in resolve_automatic_totals(candidates, configuration.automatic_totals)
        if resolved.enabled
    )
    return (*configuration.aggregates, *automatic)


def _desired_native_outputs(
    configuration: MeterConfigurationRequest,
    source: NativeTotalDefinition,
) -> TotalOutputSettings:
    if source.source_id == "overall":
        return configuration.default_totals.overall
    board_index = 0 if source.source_id == "board-main" else int(source.source_id.rsplit("-", 1)[1])
    return configuration.default_totals.boards[board_index].outputs


def _graph_parts(
    configuration: MeterConfigurationRequest,
    topology: MeterTopology,
) -> tuple[tuple[CircuitAggregate, ...], dict[str, NativeTotalDefinition]]:
    aggregates = _active_aggregates(configuration)
    ids = [aggregate.aggregate_id for aggregate in aggregates]
    if len(ids) != len(set(ids)):
        raise ValueError("aggregate IDs must be unique")
    native = {source.source_id: source for source in native_total_sources(topology)}
    if set(ids).intersection(native):
        raise ValueError("aggregate ID is reserved by a native total source")
    return aggregates, native


def validate_total_graph(
    configuration: MeterConfigurationRequest, topology: MeterTopology
) -> None:
    """Validate topology-dependent total dependencies without mutating the request."""
    aggregates, native = _graph_parts(configuration, topology)
    aggregate_by_id = {aggregate.aggregate_id: aggregate for aggregate in aggregates}
    disabled_automatic_ids = {
        resolved.candidate.aggregate_id
        for resolved in resolve_automatic_totals(
            automatic_total_candidates(configuration), configuration.automatic_totals
        )
        if not resolved.enabled
    }
    enabled_channels = {channel.channel for channel in configuration.channels if channel.enabled}
    parents: dict[str, int] = {}
    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(aggregate_id: str) -> frozenset[int]:
        if aggregate_id in visiting:
            raise ValueError("aggregate cycle detected")
        if aggregate_id in visited:
            return leaves[aggregate_id]
        visiting.add(aggregate_id)
        aggregate = aggregate_by_id[aggregate_id]
        has_channel = any(isinstance(source, ChannelTotalSource) for source in aggregate.sources)
        has_nested = any(isinstance(source, (NativeTotalSource, AggregateTotalSource)) for source in aggregate.sources)
        if has_channel and has_nested:
            raise ValueError("mixed channel and nested total sources are not allowed")
        if has_nested and aggregate.measurement_method is not MeasurementMethod.DIRECT:
            raise ValueError("nested total sources require direct measurement")
        immediate: list[frozenset[int]] = []
        for source in aggregate.sources:
            if isinstance(source, ChannelTotalSource):
                if source.channel not in enabled_channels:
                    raise ValueError("aggregate source channel is not enabled")
                immediate.append(frozenset((source.channel,)))
            elif isinstance(source, NativeTotalSource):
                definition = native.get(source.source_id)
                if definition is None:
                    raise ValueError("aggregate native source does not exist")
                immediate.append(frozenset(definition.leaf_channels))
            else:
                child_id = source.aggregate_id
                if child_id not in aggregate_by_id:
                    if child_id in disabled_automatic_ids:
                        raise ValueError("disabled automatic total cannot be a source")
                    raise ValueError("aggregate source does not exist")
                parents[child_id] = parents.get(child_id, 0) + 1
                if parents[child_id] > 1:
                    raise ValueError("one aggregate may feed at most one parent")
                immediate.append(visit(child_id))
        combined: set[int] = set()
        for source_leaves in immediate:
            if combined.intersection(source_leaves):
                raise ValueError("aggregate sources have overlapping channels")
            combined.update(source_leaves)
        visiting.remove(aggregate_id)
        visited.add(aggregate_id)
        leaves[aggregate_id] = frozenset(combined)
        return leaves[aggregate_id]

    leaves: dict[str, frozenset[int]] = {}
    for aggregate in aggregates:
        visit(aggregate.aggregate_id)


def plan_total_graph(
    configuration: MeterConfigurationRequest, topology: MeterTopology
) -> TotalRenderPlan:
    """Produce the immutable, child-first render plan for the validated total graph."""
    validate_total_graph(configuration, topology)
    aggregates, native = _graph_parts(configuration, topology)
    aggregate_by_id = {aggregate.aggregate_id: aggregate for aggregate in aggregates}
    ordered: list[PlannedTotalNode] = []
    leaves: dict[str, frozenset[int]] = {}
    planned: dict[str, PlannedTotalNode] = {}

    def resolve(aggregate: CircuitAggregate) -> PlannedTotalNode:
        if aggregate.aggregate_id in planned:
            return planned[aggregate.aggregate_id]
        sources: list[ResolvedTotalSource] = []
        combined: set[int] = set()
        for source in aggregate.sources:
            if isinstance(source, ChannelTotalSource):
                resolved = ResolvedTotalSource(
                    f"CT {source.channel}", f"ct{source.channel}Watts",
                    f"ct{source.channel}Amps", frozenset((source.channel,)),
                )
            elif isinstance(source, NativeTotalSource):
                definition = native[source.source_id]
                resolved = ResolvedTotalSource(
                    definition.label, definition.power_id, definition.current_id,
                    frozenset(definition.leaf_channels),
                )
            else:
                child = resolve(aggregate_by_id[source.aggregate_id])
                resolved = ResolvedTotalSource(
                    child.aggregate.name, child.power_id, child.current_id,
                    leaves[child.aggregate.aggregate_id],
                )
            sources.append(resolved)
            combined.update(resolved.leaf_channels)
        node = PlannedTotalNode(
            aggregate,
            f"csemh_{aggregate.aggregate_id.replace('-', '_')}_power",
            f"csemh_{aggregate.aggregate_id.replace('-', '_')}_current",
            tuple(sources),
            aggregate.outputs.watts or aggregate.outputs.kwh,
            aggregate.outputs.amps,
            aggregate.outputs.kwh,
        )
        planned[aggregate.aggregate_id] = node
        leaves[aggregate.aggregate_id] = frozenset(combined)
        ordered.append(node)
        return node

    for aggregate in aggregates:
        resolve(aggregate)
    for node in reversed(ordered):
        node = planned[node.aggregate.aggregate_id]
        for source in node.aggregate.sources:
            if isinstance(source, AggregateTotalSource):
                child = planned[source.aggregate_id]
                planned[source.aggregate_id] = replace(
                    child,
                    power_required=child.power_required or node.power_required,
                    current_required=child.current_required or node.current_required,
                )
    ordered = [planned[node.aggregate.aggregate_id] for node in ordered]
    generated_ids = [sensor_id for node in ordered for sensor_id in planned_sensor_ids(node)]
    generated_ids.extend(
        f"csemh_{source.source_id.replace('-', '_')}_energy"
        for source in native.values()
        if source.existing_energy_id is None and _desired_native_outputs(configuration, source).kwh
    )
    native_ids = {sensor_id for source in native.values()
        for sensor_id in (source.power_id, source.current_id, source.existing_energy_id)}
    if len(generated_ids) != len(set(generated_ids)) or native_ids.intersection(generated_ids):
        raise ValueError("generated ESPHome sensor ID collision")
    parents = {
        source.aggregate_id
        for aggregate in aggregates
        for source in aggregate.sources
        if isinstance(source, AggregateTotalSource)
    }
    roots = [aggregate.aggregate_id for aggregate in aggregates if aggregate.aggregate_id not in parents]
    warnings = tuple(
        (left, right, leaves[left].intersection(leaves[right]))
        for index, left in enumerate(roots)
        for right in roots[index + 1:]
        if leaves[left].intersection(leaves[right])
    )
    overrides: list[NativeVisibilityOverride] = []
    for native_definition in native.values():
        desired = _desired_native_outputs(configuration, native_definition)
        for sensor_id, wanted, upstream in (
            (native_definition.power_id, desired.watts, native_definition.upstream_defaults.watts),
            (native_definition.current_id, desired.amps, native_definition.upstream_defaults.amps),
        ):
            if wanted != upstream:
                overrides.append(NativeVisibilityOverride(sensor_id, not wanted))
        if native_definition.existing_energy_id is not None and desired.kwh != native_definition.upstream_defaults.kwh:
            overrides.append(NativeVisibilityOverride(native_definition.existing_energy_id, not desired.kwh))
    return TotalRenderPlan(
        tuple(overrides), tuple(ordered), MappingProxyType(leaves), warnings
    )


def planned_sensor_ids(node: PlannedTotalNode) -> tuple[str, ...]:
    prefix = node.power_id.removesuffix("_power")
    ids = [node.power_id] if node.power_required else []
    if node.current_required:
        ids.append(node.current_id)
    if node.aggregate.energy_mode is EnergyMode.BIDIRECTIONAL:
        if node.power_required:
            ids.extend(f"{prefix}_{direction}_power" for direction in ("export", "import"))
        if node.energy_required:
            ids.extend(f"{prefix}_{direction}_energy" for direction in ("export", "import"))
    elif node.energy_required:
        ids.append(f"{prefix}_energy")
    return tuple(ids)
