"""Generalized meter configuration mutation entry point."""

from __future__ import annotations

import json
from dataclasses import dataclass, replace

from .config_blocks import (
    render_aggregates,
    render_voltage_references,
    replace_managed_block,
)
from .config_document import ESPHomeConfigDocument
from .config_mutator import (
    ConfigMutationError,
    ConfigSnapshot,
    CTChangeRequest,
    _apply_changes,
    _build_ct_mutation,
    _canonical_meter_id,
)
from .ct_inventory import _esphome_object_id
from .meter_configuration import (
    CircuitAggregate,
    EnergyMode,
    MeasurementMethod,
    MeterConfigurationRequest,
    VoltageReferenceConfig,
    validate_meter_configuration,
)
from .meter_inventory import MeterConfigurationInventory
from .models import ConfigMutationPlan, MeterTopology, SubstitutionChange
from .store import VerifiedCalibrationRecord


@dataclass(frozen=True, slots=True)
class ExpectedMeterEntityEvidence:
    """Visible meter entities derived from validated server-side semantics."""

    sensor_entities: frozenset[tuple[str, str]]
    aggregate_sensor_entities: frozenset[tuple[str, str]]


def expected_meter_entity_evidence(
    requested: MeterConfigurationRequest, topology: MeterTopology
) -> ExpectedMeterEntityEvidence:
    """Derive reconnect evidence from rendered non-internal ESPHome entity names."""
    validate_meter_configuration(requested, topology)
    friendly_name = requested.meter.friendly_name
    voltage_names = [
        f"{friendly_name} {reference.label} {suffix}"
        for reference in requested.meter.voltage_references
        for suffix in ("Voltage", "Frequency")
    ]
    aggregate_names: list[str] = []
    for aggregate in requested.aggregates:
        prefix = f"{friendly_name} {aggregate.name}"
        if aggregate.expose_power:
            aggregate_names.append(f"{prefix} Power")
        if aggregate.expose_current:
            aggregate_names.append(f"{prefix} Current")
        if aggregate.energy_mode in (EnergyMode.CONSUMPTION, EnergyMode.GENERATION):
            aggregate_names.append(f"{prefix} Energy")
        elif aggregate.energy_mode is EnergyMode.BIDIRECTIONAL:
            aggregate_names.extend(
                (
                    f"{prefix} Import Power",
                    f"{prefix} Export Power",
                    f"{prefix} Import Energy",
                    f"{prefix} Export Energy",
                )
            )
    names = (*voltage_names, *aggregate_names)
    object_ids = tuple(_esphome_object_id(name) for name in names)
    if len(set(object_ids)) != len(object_ids):
        raise ValueError("ESPHome object-ID collision for meter entities")
    return ExpectedMeterEntityEvidence(
        frozenset(zip(object_ids, names, strict=True)),
        frozenset(
            (_esphome_object_id(name), name) for name in aggregate_names
        ),
    )


def build_meter_configuration_mutation(
    snapshot: ConfigSnapshot,
    topology: MeterTopology,
    current: MeterConfigurationInventory,
    requested: MeterConfigurationRequest,
    *,
    calibrated: VerifiedCalibrationRecord | None = None,
) -> ConfigMutationPlan:
    """Build the supported CT/package subset of a generalized configuration edit."""
    if not current.capabilities.configuration_authoritative:
        raise ConfigMutationError("meter configuration inventory is not authoritative")
    if current.source_sha256 != snapshot.sha256 or current.topology != topology:
        raise ConfigMutationError("meter configuration inventory does not match snapshot")
    try:
        validate_meter_configuration(requested, topology)
        expected_meter_entity_evidence(requested, topology)
    except ValueError as error:
        raise ConfigMutationError(str(error)) from error
    previous = current.configuration
    if (
        len(requested.meter.voltage_references) > 1
        and not current.capabilities.multi_reference
    ):
        raise ConfigMutationError("multi-reference capability is unavailable")
    if requested.aggregates and not current.capabilities.managed_totals:
        raise ConfigMutationError("managed totals capability is unavailable")
    if (
        replace(
            previous,
            meter=requested.meter,
            channels=requested.channels,
            aggregates=requested.aggregates,
            power_quality=requested.power_quality,
            status_fields=requested.status_fields,
            multi_reference_preparation_acknowledged=(
                requested.multi_reference_preparation_acknowledged
            ),
        )
        != requested
        or any(
            replace(
                old,
                name=new.name,
                model_id=new.model_id,
                reporting_multiplier=new.reporting_multiplier,
                enabled=new.enabled,
                role=new.role,
                custom_gain_ct=new.custom_gain_ct,
                custom_label=new.custom_label,
                burden_output_acknowledged=new.burden_output_acknowledged,
            )
            != new
            for old, new in zip(previous.channels, requested.channels, strict=True)
        )
    ):
        raise ConfigMutationError("meter semantic block rendering is not available")
    ct_changes = tuple(
        CTChangeRequest(
            new.channel,
            new.name,
            new.model_id,
            new.reporting_multiplier,
            new.custom_gain_ct,
            new.custom_label,
            new.burden_output_acknowledged,
        )
        for old, new in zip(previous.channels, requested.channels, strict=True)
        if (
            new.name,
            new.model_id,
            new.reporting_multiplier,
            new.custom_gain_ct,
            new.custom_label,
            new.burden_output_acknowledged,
        )
        != (
            old.name,
            old.model_id,
            old.reporting_multiplier,
            old.custom_gain_ct,
            old.custom_label,
            old.burden_output_acknowledged,
        )
    )
    package_options: dict[str, tuple[bool, ...]] | None = {
        "power_quality": requested.power_quality,
        "status_fields": requested.status_fields,
    }
    if package_options == {
        "power_quality": previous.power_quality,
        "status_fields": previous.status_fields,
    }:
        package_options = None
    plan = _build_ct_mutation(
        snapshot,
        topology,
        ct_changes,
        package_options=package_options,
        phase_channels={
            channel.channel: (channel.enabled, channel.reporting_multiplier)
            for channel in requested.channels
        },
    )
    content = plan.proposed_content
    changes: list[SubstitutionChange] = []
    if requested.meter != previous.meter:
        substitutions = {
            "friendly_name": requested.meter.friendly_name,
            "update_time": f"{requested.meter.update_interval_s}s",
            "electric_freq": f"{requested.meter.line_frequency_hz}Hz",
        }
        document = ESPHomeConfigDocument.parse(content)
        changes = [
            SubstitutionChange(key, scalar.value if scalar else None, value)
            for key, value in substitutions.items()
            if (scalar := document.substitutions.get(key)) is None
            or scalar.value != value
        ]
        content = _apply_changes(document, changes, substitutions)
        content = replace_managed_block(
            content,
            "voltage_references",
            _render_voltage_references(
                requested.meter.voltage_references, topology, document
            ),
        )
    if requested.aggregates != previous.aggregates:
        content = replace_managed_block(
            content,
            "aggregates",
            _render_aggregates(requested.aggregates, topology)
            if requested.aggregates
            else "",
        )
    review_diff = _grouped_review_diff(previous, requested)
    return ConfigMutationPlan(
        plan.configuration,
        plan.source_sha256,
        (*plan.changes, *changes),
        review_diff,
        content,
    )


def _grouped_review_diff(
    previous: MeterConfigurationRequest, requested: MeterConfigurationRequest
) -> str:
    """Return semantic, line-oriented review data without YAML secrets or gains."""
    groups: list[tuple[str, list[str]]] = []

    def lines(old: dict[str, object], new: dict[str, object]) -> list[str]:
        keys = tuple(dict.fromkeys((*old, *new)))
        return [
            f"- {key}: {json.dumps(old[key], ensure_ascii=False, sort_keys=True)}"
            for key in keys
            if old.get(key) != new.get(key) and key in old
        ] + [
            f"+ {key}: {json.dumps(new[key], ensure_ascii=False, sort_keys=True)}"
            for key in keys
            if old.get(key) != new.get(key) and key in new
        ]

    meter_lines = lines(_meter_review_value(previous), _meter_review_value(requested))
    if meter_lines:
        groups.append(("Meter", meter_lines))
    reference_lines = lines(
        _reference_review_value(previous), _reference_review_value(requested)
    )
    previous_gains = {
        reference.reference_id: reference.gain_voltage
        for reference in previous.meter.voltage_references
    }
    gain_updates = [
        reference.reference_id
        for reference in requested.meter.voltage_references
        if previous_gains.get(reference.reference_id) != reference.gain_voltage
    ]
    if gain_updates:
        reference_lines.extend(
            f"~ {reference}: calibration gain updated" for reference in gain_updates
        )
    if reference_lines:
        groups.append(("Voltage reference", reference_lines))
    channel_lines = lines(
        _channel_review_value(previous), _channel_review_value(requested)
    )
    custom_gain_updates = [
        channel.channel
        for channel, old in zip(
            requested.channels, previous.channels, strict=True
        )
        if channel.custom_gain_ct != old.custom_gain_ct
    ]
    channel_lines.extend(
        f"~ CT{channel}: calibration gain updated" for channel in custom_gain_updates
    )
    if channel_lines:
        groups.append(("Channel", channel_lines))
    aggregate_lines = lines(
        _aggregate_review_value(previous), _aggregate_review_value(requested)
    )
    if aggregate_lines:
        groups.append(("Aggregate", aggregate_lines))
    package_lines = lines(
        _package_review_value(previous), _package_review_value(requested)
    )
    if package_lines:
        groups.append(("Package", package_lines))
    return "\n".join("\n".join((name, *lines)) for name, lines in groups)


def _meter_review_value(configuration: MeterConfigurationRequest) -> dict[str, object]:
    meter = configuration.meter
    return {
        "friendly_name": meter.friendly_name,
        "electrical_system": meter.electrical_system.value,
        "line_frequency_hz": meter.line_frequency_hz,
        "update_interval_s": meter.update_interval_s,
        "voltage_layout": meter.voltage_layout,
        "multi_reference_preparation_acknowledged": configuration.multi_reference_preparation_acknowledged,
    }


def _reference_review_value(configuration: MeterConfigurationRequest) -> dict[str, object]:
    return {
        reference.reference_id: {
            "label": reference.label,
            "phase_label": reference.phase_label,
            "nominal_voltage_v": reference.nominal_voltage_v,
            "transformer_model_id": reference.transformer_model_id,
            "group_keys": reference.group_keys,
        }
        for reference in configuration.meter.voltage_references
    }


def _channel_review_value(configuration: MeterConfigurationRequest) -> dict[str, object]:
    return {
        f"CT{channel.channel}": {
            "enabled": channel.enabled,
            "name": channel.name,
            "model_id": channel.model_id,
            "reporting_multiplier": channel.reporting_multiplier,
            "role": channel.role.value,
            "voltage_reference_id": channel.voltage_reference_id,
            "custom_label": channel.custom_label,
            "burden_output_acknowledged": channel.burden_output_acknowledged,
        }
        for channel in configuration.channels
    }


def _aggregate_review_value(configuration: MeterConfigurationRequest) -> dict[str, object]:
    return {
        aggregate.aggregate_id: {
            "name": aggregate.name,
            "role": aggregate.role.value,
            "channels": aggregate.channels,
            "measurement_method": aggregate.measurement_method.value,
            "parent_id": aggregate.parent_id,
            "energy_mode": aggregate.energy_mode.value,
            "expose_power": aggregate.expose_power,
            "expose_current": aggregate.expose_current,
        }
        for aggregate in configuration.aggregates
    }


def _package_review_value(configuration: MeterConfigurationRequest) -> dict[str, object]:
    return {
        "main" if board == 0 else f"addon{board}": {
            "power_quality": configuration.power_quality[board],
            "status_fields": configuration.status_fields[board],
        }
        for board in range(len(configuration.power_quality))
    }


def _render_voltage_references(
    references: tuple[VoltageReferenceConfig, ...],
    topology: MeterTopology,
    document: ESPHomeConfigDocument,
) -> str:
    ordered_groups = {
        group: index
        for index, group in enumerate(
            f"{'main' if board == 0 else f'addon{board}'}_{group}"
            for board in range(topology.board_count)
            for group in (1, 2)
        )
    }
    metadata = ";".join(
        f"{reference.reference_id}=[{','.join(reference.group_keys)}]"
        for reference in references
    )
    entries: dict[str, str] = {
        "00_metadata": f"  # csemh-voltage-references: {metadata}\n"
    }
    for reference in references:
        representative = min(
            reference.group_keys, key=ordered_groups.__getitem__
        )
        for group in reference.group_keys:
            board, group_number = group.rsplit("_", 1)
            meter_key = (
                f"main_meter_id{group_number}"
                if board == "main"
                else f"{board}_id{group_number}"
            )
            meter_id = (
                f"${{{meter_key}}}"
                if meter_key in document.substitutions
                else _canonical_meter_id(meter_key)
            )
            body = [f"  - id: !extend {meter_id}"]
            for phase in "abc":
                body.extend(
                    (f"    phase_{phase}:", f"      gain_voltage: {reference.gain_voltage}")
                )
                if group != representative or phase == "a":
                    body.extend(
                        ("      voltage:",)
                        + (
                            (
                                f"        name: {json.dumps(f'${{friendly_name}} {reference.label} Voltage')}",
                                "        disabled_by_default: false",
                            )
                            if group == representative
                            else (
                                "        entity_category: diagnostic",
                                "        disabled_by_default: true",
                            )
                        )
                    )
            if group == representative:
                body.extend(
                    (
                        "    frequency:",
                        f"      name: {json.dumps(f'${{friendly_name}} {reference.label} Frequency')}",
                        "      disabled_by_default: false",
                    )
                )
            entries[f"{ordered_groups[group] + 1:02d}"] = "\n".join(body) + "\n"
    return render_voltage_references(entries)


def _render_aggregates(
    aggregates: tuple[CircuitAggregate, ...], topology: MeterTopology
) -> str:
    entries = {
        f"00_{total_id}": _internal_total(total_id)
        for total_id in _official_total_ids(topology)
    }
    for aggregate in aggregates:
        entries[f"10_{aggregate.aggregate_id}"] = _aggregate_entry(aggregate)
    return render_aggregates(entries)


def _official_total_ids(topology: MeterTopology) -> tuple[str, ...]:
    return (
        ("totalEnergyDaily",)
        if topology.addon_count == 0
        else ("totalAmps", "totalWatts", "totalEnergyDaily")
    )


def _internal_total(total_id: str) -> str:
    return f"  - id: !extend {total_id}\n    internal: true\n"


def _aggregate_entry(aggregate: CircuitAggregate) -> str:
    identifier = f"csemh_{aggregate.aggregate_id.replace('-', '_')}"
    power_id = f"{identifier}_power"
    power_expression = _power_expression(aggregate)
    power_internal = not aggregate.expose_power
    lines = _template_sensor(
        power_id,
        f"${{friendly_name}} {aggregate.name} Power",
        _energy_power_expression(aggregate, power_expression),
        "W",
        "power",
        internal=power_internal,
    )
    if aggregate.expose_current:
        lines += _template_sensor(
            f"{identifier}_current",
            f"${{friendly_name}} {aggregate.name} Current",
            _current_expression(aggregate),
            "A",
            "current",
        )
    if aggregate.energy_mode is EnergyMode.CONSUMPTION:
        lines += _daily_energy(
            f"{identifier}_energy",
            f"${{friendly_name}} {aggregate.name} Energy",
            power_id,
        )
    elif aggregate.energy_mode is EnergyMode.BIDIRECTIONAL:
        import_power_id, export_power_id = (
            f"{identifier}_import_power",
            f"{identifier}_export_power",
        )
        lines += _template_sensor(
            import_power_id,
            f"${{friendly_name}} {aggregate.name} Import Power",
            f"std::max(0.0f, id({power_id}).state)",
            "W",
            "power",
        )
        lines += _template_sensor(
            export_power_id,
            f"${{friendly_name}} {aggregate.name} Export Power",
            f"std::max(0.0f, -id({power_id}).state)",
            "W",
            "power",
        )
        lines += _daily_energy(
            f"{identifier}_import_energy",
            f"${{friendly_name}} {aggregate.name} Import Energy",
            import_power_id,
        )
        lines += _daily_energy(
            f"{identifier}_export_energy",
            f"${{friendly_name}} {aggregate.name} Export Energy",
            export_power_id,
        )
    elif aggregate.energy_mode is EnergyMode.GENERATION:
        lines += _daily_energy(
            f"{identifier}_energy",
            f"${{friendly_name}} {aggregate.name} Energy",
            power_id,
        )
    return lines


def _power_expression(aggregate: CircuitAggregate) -> str:
    expression = " + ".join(f"id(ct{channel}Watts).state" for channel in aggregate.channels)
    return f"{expression} * 2.0" if aggregate.measurement_method is MeasurementMethod.ONE_CT_DOUBLE_POWER else expression


def _current_expression(aggregate: CircuitAggregate) -> str:
    return " + ".join(f"id(ct{channel}Amps).state" for channel in aggregate.channels)


def _energy_power_expression(aggregate: CircuitAggregate, expression: str) -> str:
    if aggregate.energy_mode is EnergyMode.CONSUMPTION:
        return f"std::max(0.0f, {expression})"
    if aggregate.energy_mode is EnergyMode.GENERATION:
        return f"std::max(0.0f, -{expression})"
    return expression


def _template_sensor(
    entity_id: str,
    name: str,
    expression: str,
    unit: str,
    device_class: str,
    *,
    internal: bool = False,
) -> str:
    lines = ["  - platform: template", f"    id: {entity_id}"]
    if internal:
        lines.append("    internal: true")
    else:
        lines.append(f"    name: {json.dumps(name)}")
    lines.extend(
        (
            f"    lambda: return {expression};",
            f"    unit_of_measurement: {unit}",
            f"    device_class: {device_class}",
            "    update_interval: ${update_time}",
        )
    )
    return "\n".join(lines) + "\n"


def _daily_energy(entity_id: str, name: str, power_id: str) -> str:
    return "\n".join(
        (
            "  - platform: total_daily_energy",
            f"    id: {entity_id}",
            f"    name: {json.dumps(name)}",
            f"    power_id: {power_id}",
            "    filters:",
            "      - multiply: 0.001",
            "    unit_of_measurement: kWh",
            "    device_class: energy",
            "    state_class: total_increasing",
        )
    ) + "\n"
