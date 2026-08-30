"""Authoritative native firmware total catalog."""

from __future__ import annotations

from dataclasses import dataclass

from .meter_configuration import (
    AutomaticTotalSettings,
    BoardTotalSettings,
    ChannelTotalSource,
    CircuitRole,
    DefaultTotalsSettings,
    EnergyMode,
    MeasurementMethod,
    MeterConfigurationRequest,
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
        sources.append(NativeTotalDefinition(source_id, f"{source_id} total", tuple(range(start, start + 6)), f"totalWatts{suffix}", f"totalAmps{suffix}", None, TotalOutputSettings(False, False, False)))
    sources.append(NativeTotalDefinition("overall", "Overall meter total", tuple(range(1, topology.ct_count + 1)), "totalWatts", "totalAmps", "totalEnergyDaily", outputs))
    return tuple(sources)


def default_total_settings(topology: MeterTopology) -> DefaultTotalsSettings:
    overall = TotalOutputSettings(True, True, True)
    boards = () if topology.board_count == 1 else tuple(
        BoardTotalSettings(index, TotalOutputSettings(False, False, False))
        for index in range(topology.board_count)
    )
    return DefaultTotalsSettings(overall, boards)
