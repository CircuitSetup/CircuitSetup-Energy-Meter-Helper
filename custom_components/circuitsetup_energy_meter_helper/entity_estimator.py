"""Estimate the visible entity and update impact of a meter configuration."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .config_document import ESPHomeConfigDocument
from .meter_config_mutator import (
    _native_total_accounting,
    _select_render_totals,
    _source_owned_total_evidence,
    _source_owned_total_items,
)
from .meter_configuration import (
    EnergyMode,
    MeterConfigurationRequest,
    validate_meter_configuration,
)
from .meter_inventory import (
    _legacy_replacement_sources,
    _plain_sensor_scalar,
    _source_native_visibility,
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


@dataclass(frozen=True, slots=True)
class TotalSummary:
    """Source-aware display evidence; not a second graph or stored configuration."""

    total_id: str
    kind: Literal["native_total", "aggregate"]
    ownership: Literal["helper_managed", "source_owned"]
    public_outputs: tuple[str, ...]
    internal_outputs: tuple[str, ...]
    unverified_outputs: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class NativeTotalSummary(TotalSummary):
    """Immediate native dependencies; an empty tuple means direct physical CTs."""

    native_sources: tuple[str, ...]


def summarize_configuration_totals(
    configuration: MeterConfigurationRequest, topology: MeterTopology, *,
    document: ESPHomeConfigDocument, previous: MeterConfigurationRequest,
    native_visibility_resolved: bool, totals_managed: bool,
) -> tuple[TotalSummary, ...]:
    """Describe the same selected helper/source outputs as the authoritative estimator."""
    selected, replacements = _select_render_totals(configuration, topology, document, previous)
    graph = plan_total_graph(selected, topology)
    full_graph = plan_total_graph(configuration, topology)
    owner: Literal["helper_managed", "source_owned"] = "helper_managed" if totals_managed else "source_owned"
    native_outputs, _ = _native_total_accounting(selected, topology, document, native_visibility_resolved)
    partial = {} if native_visibility_resolved else _source_native_visibility(document, topology)
    result: list[TotalSummary] = []
    native_catalog = native_total_sources(topology)
    for native in native_catalog:
        outputs = native_outputs[native.source_id]
        metrics = (("Watts", native.power_id, outputs.watts), ("Amps", native.current_id, outputs.amps),
            ("kWh", native.existing_energy_id, outputs.kwh))
        result.append(NativeTotalSummary(native.source_id, "native_total", owner,
            tuple(label for label, _, visible in metrics if visible),
            tuple(label for label, sensor_id, visible in metrics if not visible and sensor_id is not None
                and (native_visibility_resolved or partial.get(sensor_id) is False)),
            tuple(label for label, sensor_id, _ in metrics if not native_visibility_resolved
                and sensor_id is not None and partial.get(sensor_id) is None),
            tuple(source.source_id for source in native_catalog if source.source_id != "overall")
                if native.source_id == "overall" else ()))
    external_ids = _legacy_replacement_sources(document, topology, configuration.channels)
    external = _source_owned_total_items(selected, topology, document, replacements)
    generated = {node.aggregate.aggregate_id for node in graph.ordered_nodes}
    for node in full_graph.ordered_nodes:
        aggregate = node.aggregate
        public: tuple[str, ...]
        internal: tuple[str, ...]
        unknown: tuple[str, ...] = ()
        if aggregate.aggregate_id in generated:
            power = ("Net Watts", "Import Watts", "Return-to-grid Watts") if aggregate.energy_mode is EnergyMode.BIDIRECTIONAL else ("Watts",)
            energy = ("Import kWh", "Return-to-grid kWh") if aggregate.energy_mode is EnergyMode.BIDIRECTIONAL else ("kWh",)
            public = power if aggregate.outputs.watts else ()
            public += ("Amps",) if aggregate.outputs.amps else ()
            public += energy if node.energy_required else ()
            internal = power if node.power_required and not aggregate.outputs.watts else ()
            internal += ("Amps",) if node.current_required and not aggregate.outputs.amps else ()
            node_owner = owner
        else:
            items = [external[sensor_id] for sensor_id in external_ids.get(aggregate.aggregate_id, ()) if sensor_id in external]
            items.extend(external[f"daily:{sensor_id}"] for sensor_id in external_ids.get(aggregate.aggregate_id, ()) if f"daily:{sensor_id}" in external)
            public = tuple("Watts" if _plain_sensor_scalar(item.get("device_class", "")) == "power" else "kWh" if _plain_sensor_scalar(item.get("device_class", "")) == "energy" else "Amps"
                for item in items if item.get("internal", "false") == "false" and item.get("name"))
            internal = tuple("Watts" if _plain_sensor_scalar(item.get("device_class", "")) == "power" else "Amps"
                for item in items if item.get("internal") == "true")
            unknown = ("external custom kWh",) if aggregate.energy_mode is not EnergyMode.NONE and "kWh" not in public else ()
            node_owner = "source_owned"
        result.append(TotalSummary(aggregate.aggregate_id, "aggregate", node_owner, public, internal, unknown))
    return tuple(result)


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
    energy += sum(_plain_sensor_scalar(item.get("device_class", "")) == "energy" and item.get("internal", "false") == "false"
        for item in _source_owned_total_items(configuration, topology, document, replacements).values())
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
