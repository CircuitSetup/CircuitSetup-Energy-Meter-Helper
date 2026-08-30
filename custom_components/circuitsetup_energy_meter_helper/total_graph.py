"""Authoritative native firmware total catalog."""

from __future__ import annotations

from dataclasses import dataclass

from .models import MeterTopology
from .meter_configuration import (
    BoardTotalSettings,
    DefaultTotalsSettings,
    TotalOutputSettings,
)


@dataclass(frozen=True, slots=True)
class NativeTotalDefinition:
    source_id: str
    label: str
    leaf_channels: tuple[int, ...]
    power_id: str
    current_id: str
    existing_energy_id: str | None
    upstream_defaults: TotalOutputSettings


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
