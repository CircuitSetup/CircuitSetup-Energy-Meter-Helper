"""Estimate the visible entity and update impact of a meter configuration."""

from __future__ import annotations

from dataclasses import dataclass

from .config_document import ESPHomeConfigDocument
from .meter_config_mutator import (
    _native_total_accounting,
    _select_render_totals,
    _source_owned_total_evidence,
)
from .meter_configuration import (
    EnergyMode,
    MeterConfigurationRequest,
    validate_meter_configuration,
)
from .models import MeterTopology
from .total_graph import native_total_sources, plan_total_graph


@dataclass(frozen=True, slots=True)
class ConfigurationImpact:
    """Visible entities published by the configured meter."""

    enabled_channel_count: int
    numeric_entity_count: int
    text_entity_count: int
    energy_entity_count: int
    approximate_publications_per_second: float
    public_total_entity_count: int
    internal_total_sensor_count: int


def estimate_configuration_impact(
    configuration: MeterConfigurationRequest,
    topology: MeterTopology,
    *,
    document: ESPHomeConfigDocument | None = None,
    previous: MeterConfigurationRequest | None = None,
    native_visibility_resolved: bool | None = None,
) -> ConfigurationImpact:
    """Count the non-calibration entities rendered by a validated configuration."""
    validate_meter_configuration(
        configuration, topology, require_multi_reference_acknowledgement=False
    )
    replacements = ""
    if document is not None:
        configuration, replacements = _select_render_totals(
            configuration, topology, document, previous
        )
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
    external, internal = _source_owned_total_evidence(
        configuration, topology, document, replacements
    )
    public = len(external)
    native_outputs, native_internal = _native_total_accounting(configuration, topology, document, native_visibility_resolved)
    internal += native_internal
    for source in native_total_sources(topology):
        outputs = native_outputs[source.source_id]
        public += int(outputs.watts) + int(outputs.amps) + int(outputs.kwh)
        energy += int(outputs.kwh)
    for node in plan_total_graph(configuration, topology).ordered_nodes:
        aggregate = node.aggregate
        power_count = 3 if aggregate.energy_mode is EnergyMode.BIDIRECTIONAL else 1
        energy_count = (
            (2 if aggregate.energy_mode is EnergyMode.BIDIRECTIONAL else 1)
            if node.energy_required
            else 0
        )
        public += (
            power_count * int(aggregate.outputs.watts)
            + int(aggregate.outputs.amps)
            + energy_count
        )
        internal += power_count * int(
            node.power_required and not aggregate.outputs.watts
        )
        internal += int(node.current_required and not aggregate.outputs.amps)
        energy += energy_count
    numeric += public
    return ConfigurationImpact(
        enabled,
        numeric,
        text,
        energy,
        (numeric + text) / configuration.meter.update_interval_s,
        public,
        internal,
    )
