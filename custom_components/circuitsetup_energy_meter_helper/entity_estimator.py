"""Estimate the visible entity and update impact of a meter configuration."""

from __future__ import annotations

from dataclasses import dataclass

from .meter_configuration import (
    EnergyMode,
    MeterConfigurationRequest,
    validate_meter_configuration,
)
from .models import MeterTopology


@dataclass(frozen=True, slots=True)
class ConfigurationImpact:
    """Visible entities published by the configured meter."""

    enabled_channel_count: int
    numeric_entity_count: int
    text_entity_count: int
    energy_entity_count: int
    approximate_publications_per_second: float


def estimate_configuration_impact(
    configuration: MeterConfigurationRequest, topology: MeterTopology
) -> ConfigurationImpact:
    """Count the non-calibration entities rendered by a validated configuration."""
    validate_meter_configuration(configuration, topology)
    numeric = len(configuration.meter.voltage_references) * 2
    text = energy = enabled = 0
    for channel in configuration.channels:
        if not channel.enabled:
            continue
        enabled += 1
        numeric += 2 + (
            4 if configuration.power_quality[(channel.channel - 1) // 6] else 0
        )
        text += int(configuration.status_fields[(channel.channel - 1) // 6])
    for aggregate in configuration.aggregates:
        numeric += int(aggregate.expose_power) + int(aggregate.expose_current)
        if aggregate.energy_mode in (EnergyMode.CONSUMPTION, EnergyMode.GENERATION):
            numeric += 1
            energy += 1
        elif aggregate.energy_mode is EnergyMode.BIDIRECTIONAL:
            numeric += 4  # import/export clamp power plus their daily energy entities
            energy += 2
    return ConfigurationImpact(
        enabled,
        numeric,
        text,
        energy,
        (numeric + text) / configuration.meter.update_interval_s,
    )
