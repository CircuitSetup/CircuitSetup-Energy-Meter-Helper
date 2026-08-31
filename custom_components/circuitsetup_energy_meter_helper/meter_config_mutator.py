"""Generalized meter configuration mutation entry point."""

from __future__ import annotations

import json
import re
from base64 import urlsafe_b64encode
from dataclasses import asdict, dataclass, replace
from difflib import unified_diff

from .config_blocks import (
    render_aggregates,
    render_voltage_references,
    replace_managed_block,
)
from .config_document import ESPHomeConfigDocument, ManagedBlock
from .config_mutator import (
    ConfigMutationError,
    ConfigSnapshot,
    CTChangeRequest,
    _apply_changes,
    _build_ct_mutation,
    _canonical_meter_id,
    _redacted_diff,
)
from .ct_inventory import _esphome_object_id
from .meter_configuration import (
    AggregateTotalSource,
    CircuitAggregate,
    EnergyMode,
    MeasurementMethod,
    MeterConfigurationRequest,
    TotalOutputSettings,
    VoltageReferenceConfig,
    validate_meter_configuration,
)
from .meter_inventory import (
    MeterConfigurationInventory,
    _custom_native_total_ids,
    _legacy_replacement_sources,
    _managed_sensor_items,
    _native_totals_metadata,
    _plain_sensor_scalar,
    _replacement_metadata,
    _root_sensor_items,
    _source_daily_energy_items,
    _source_native_visibility,
    _total_sensor_name,
)
from .models import ConfigMutationPlan, MeterTopology, SubstitutionChange
from .store import (
    VerifiedCalibrationRecord,
    _serialize_outputs,
    _serialize_total_source,
)
from .total_graph import (
    NativeVisibilityOverride,
    PlannedTotalNode,
    TotalRenderPlan,
    _desired_native_outputs,
    automatic_total_candidates,
    native_total_sources,
    plan_total_graph,
    planned_sensor_ids,
    resolve_automatic_totals,
)


class SourceOwnedTotalEditError(ValueError):
    """An existing sensor relationship cannot be replaced without changing identity."""


@dataclass(frozen=True, slots=True)
class ExpectedMeterEntityEvidence:
    """Visible meter entities derived from validated server-side semantics."""

    sensor_entities: frozenset[tuple[str, str]]
    aggregate_sensor_entities: frozenset[tuple[str, str]]
    native_sensor_entities: frozenset[tuple[str, str]]
    source_owned_sensor_entities: frozenset[tuple[str, str]]


def expected_meter_entity_evidence(
    requested: MeterConfigurationRequest,
    topology: MeterTopology,
    *,
    document: ESPHomeConfigDocument | None = None,
    previous: MeterConfigurationRequest | None = None,
    native_visibility_resolved: bool | None = None,
) -> ExpectedMeterEntityEvidence:
    """Derive reconnect evidence from rendered non-internal ESPHome entity names."""
    validate_meter_configuration(requested, topology)
    replacements = ""
    if document is not None:
        requested, replacements = _select_render_totals(
            requested, topology, document, previous
        )
    friendly_name = requested.meter.friendly_name
    voltage_names = [
        f"{friendly_name} {reference.label} {suffix}"
        for reference in requested.meter.voltage_references
        for suffix in ("Voltage", "Frequency")
    ]
    aggregate_names: list[str] = []
    native_names: dict[str, str] = {}
    native_outputs, _ = _native_total_accounting(requested, topology, document, native_visibility_resolved)
    for source in native_total_sources(topology):
        outputs = native_outputs[source.source_id]
        suffix = (
            " Main"
            if source.source_id == "board-main" or topology.board_count == 1
            else f" Add-on{source.source_id.rsplit('-', 1)[1]}"
            if source.source_id != "overall"
            else ""
        )
        if outputs.watts:
            native_names[source.power_id] = f"{friendly_name} Total Watts{suffix}"
        if outputs.amps:
            native_names[source.current_id] = f"{friendly_name} Total Amps{suffix}"
        if outputs.kwh:
            if source.existing_energy_id is not None:
                native_names[source.existing_energy_id] = f"{friendly_name} Total kWh"
            else:
                aggregate_names.append(f"{friendly_name} {source.label} Energy")
    if document is not None and (span := document.writable_sensor_span) is not None:
        # Read the supported local scalar grammar; explicit names must not become invented defaults.
        try:
            items = _managed_sensor_items(
                document.content[span.start : span.end], document.sensor_item_indent
            )
        except ValueError as error:
            raise ValueError("native sensor names are not safely writable") from error
        for item in sorted(
            items, key=lambda item: item.get("id", "").startswith("!extend ")
        ):
            sensor_id = _plain_sensor_scalar(
                item.get("id", "").removeprefix("!extend ")
            )
            if sensor_id in native_names and "name" in item:
                native_names[sensor_id] = _total_sensor_name(
                    item["name"], friendly_name
                )
    aggregate_names.extend(native_names.values())
    external_names, _ = _source_owned_total_evidence(
        requested, topology, document, replacements
    )
    aggregate_names.extend(external_names)
    for node in plan_total_graph(requested, topology).ordered_nodes:
        aggregate = node.aggregate
        prefix = f"{friendly_name} {aggregate.name}"
        if aggregate.outputs.watts:
            aggregate_names.append(f"{prefix} Power")
        if aggregate.outputs.amps:
            aggregate_names.append(f"{prefix} Current")
        if aggregate.outputs.kwh and aggregate.energy_mode in (
            EnergyMode.CONSUMPTION,
            EnergyMode.GENERATION,
        ):
            aggregate_names.append(f"{prefix} Energy")
        elif aggregate.energy_mode is EnergyMode.BIDIRECTIONAL:
            aggregate_names.extend(
                (
                    *(
                        (f"{prefix} Return to Grid Power", f"{prefix} Import Power")
                        if aggregate.outputs.watts
                        else ()
                    ),
                    *(
                        (f"{prefix} Return to Grid Energy", f"{prefix} Import Energy")
                        if aggregate.outputs.kwh
                        else ()
                    ),
                )
            )
    names = (*voltage_names, *aggregate_names)
    object_ids = tuple(_esphome_object_id(name) for name in names)
    if len(set(object_ids)) != len(object_ids):
        raise ValueError("ESPHome object-ID collision for meter entities")
    return ExpectedMeterEntityEvidence(
        frozenset(zip(object_ids, names, strict=True)),
        frozenset((_esphome_object_id(name), name) for name in aggregate_names),
        frozenset((_esphome_object_id(name), name) for name in native_names.values()),
        frozenset((_esphome_object_id(name), name) for name in external_names),
    )


def _native_total_accounting(
    requested: MeterConfigurationRequest,
    topology: MeterTopology,
    document: ESPHomeConfigDocument | None,
    native_visibility_resolved: bool | None,
) -> tuple[dict[str, TotalOutputSettings], int]:
    """Share source-aware publications across estimates and reconnect evidence.

    Inventory callers pass visibility resolution, not ownership or record existence.
    Standalone render plans are authoritative; unqualified source documents require
    partial source proof or validated native render metadata.
    """
    sources = native_total_sources(topology)
    if (
        document is None
        or (not _custom_native_total_ids(document, topology) and (
            native_visibility_resolved is True
            or (native_visibility_resolved is None and _native_totals_metadata(document) is not None)
        ))
    ):
        outputs = {
            source.source_id: _desired_native_outputs(requested, source)
            for source in sources
        }
        internal = sum(
            int(not outputs[source.source_id].watts)
            + int(not outputs[source.source_id].amps)
            + int(
                source.existing_energy_id is not None
                and not outputs[source.source_id].kwh
            )
            for source in sources
        )
        return outputs, internal
    visibility = _source_native_visibility(document, topology)
    return {
        source.source_id: TotalOutputSettings(
            visibility.get(source.power_id) is True,
            visibility.get(source.current_id) is True,
            source.existing_energy_id is not None
            and visibility.get(source.existing_energy_id) is True,
        )
        for source in sources
    }, sum(value is False for value in visibility.values())


def _source_owned_total_items(
    requested: MeterConfigurationRequest,
    topology: MeterTopology,
    document: ESPHomeConfigDocument | None,
    replacements: str,
) -> dict[str, dict[str, str]]:
    """Effective supported source-owned items, shared by counts and Summary."""
    if document is None:
        return {}
    sensor_ids = {
        sensor_id
        for ids in _legacy_replacement_sources(
            document, topology, requested.channels
        ).values()
        for sensor_id in ids
    }
    items = _root_sensor_items(document)
    effective: dict[str, dict[str, str]] = {}
    for item in sorted(
        items, key=lambda item: item.get("id", "").startswith("!extend ")
    ):
        sensor_id = _plain_sensor_scalar(item.get("id", "").removeprefix("!extend "))
        if sensor_id in sensor_ids:
            effective.setdefault(sensor_id, {}).update(item)
    for item in _managed_sensor_items(replacements, 2) if replacements else ():
        sensor_id = _plain_sensor_scalar(item.get("id", "").removeprefix("!extend "))
        if sensor_id in effective:
            effective[sensor_id]["internal"] = "true"
    effective.update({f"daily:{power_id}": item
        for power_id, item in _source_daily_energy_items(document).items() if power_id in sensor_ids})
    return effective


def _source_owned_total_evidence(
    requested: MeterConfigurationRequest,
    topology: MeterTopology,
    document: ESPHomeConfigDocument | None,
    replacements: str,
) -> tuple[list[str], int]:
    """Count supported surviving source totals using their actual entity names."""
    effective = _source_owned_total_items(requested, topology, document, replacements)
    names = []
    internal = 0
    for item in effective.values():
        if item.get("internal") == "true":
            internal += 1
        elif item.get("internal", "false") == "false" and item.get("name"):
            names.append(
                _total_sensor_name(item["name"], requested.meter.friendly_name)
            )
        else:
            raise ValueError("source-owned total visibility cannot be resolved safely")
    return names, internal


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
        current.validate_totals_change(requested)
        expected_meter_entity_evidence(requested, topology,
            document=ESPHomeConfigDocument.parse(snapshot.content), previous=current.configuration,
            native_visibility_resolved=current.native_visibility_resolved)
    except SourceOwnedTotalEditError:
        raise
    except ValueError as error:
        raise ConfigMutationError(str(error)) from error
    previous = current.configuration
    source_document = ESPHomeConfigDocument.parse(snapshot.content)
    voltage_references_changed = (
        requested.meter.voltage_references != previous.meter.voltage_references
    )
    aggregates_changed = requested.aggregates != previous.aggregates
    totals_changed = (
        aggregates_changed or requested.default_totals != previous.default_totals
        or requested.automatic_totals != previous.automatic_totals
        or automatic_total_candidates(requested) != automatic_total_candidates(previous)
        or requested.totals_change_intent.adopt_managed_totals
    )
    managed_totals_upgrade_required = (
        aggregates_changed and "config_contract_upgrade_required" in current.capabilities.reason_codes
    )
    if (
        len(requested.meter.voltage_references) > 1
        and not current.capabilities.multi_reference
    ):
        raise ConfigMutationError("multi-reference capability is unavailable")
    if (
        replace(
            previous,
            meter=requested.meter,
            channels=requested.channels,
            aggregates=requested.aggregates,
            default_totals=requested.default_totals,
            automatic_totals=requested.automatic_totals,
            totals_change_intent=requested.totals_change_intent,
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
                voltage_reference_id=new.voltage_reference_id,
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
        if voltage_references_changed:
            content = replace_managed_block(
                content,
                "voltage_references",
                _render_voltage_references(
                    requested.meter.voltage_references, topology, document
                ),
            )
    if totals_changed:
        if managed_totals_upgrade_required:
            document = ESPHomeConfigDocument.parse(content)
            scalar = document.substitutions.get("csemh_config_contract")
            contract_change = SubstitutionChange(
                "csemh_config_contract", scalar.value if scalar else None, "2"
            )
            changes.append(contract_change)
            content = _apply_changes(
                document, [contract_change], {"csemh_config_contract": "2"}
            )
        document = ESPHomeConfigDocument.parse(content)
        rendered_request, replacements = _select_render_totals(requested, topology, document, previous)
        content = replace_managed_block(
            content,
            "aggregates",
            _render_native_totals(rendered_request, topology, document)
            + replacements
            + _render_aggregates(plan_total_graph(rendered_request, topology), rendered_request.aggregates, rendered_request),
        )
    rendered_diff = "\n".join(
        part for part in (plan.redacted_diff, _redacted_diff(changes)) if part
    )
    rendered_blocks: dict[str, list[str]] = {}
    proposed_document = ESPHomeConfigDocument.parse(content)
    if voltage_references_changed:
        previous_gains = {
            reference.reference_id: reference.gain_voltage
            for reference in previous.meter.voltage_references
        }
        rendered_blocks["Voltage reference"] = _managed_block_diff(
            source_document.managed_blocks.get("voltage_references"),
            proposed_document.managed_blocks.get("voltage_references"),
            gain_changed=any(
                previous_gains.get(reference.reference_id) != reference.gain_voltage
                for reference in requested.meter.voltage_references
            ),
        )
    total_notes: list[str] = []
    if totals_changed:
        selected, replacements = _select_render_totals(
            requested, topology, source_document, previous
        )
        if replacements:
            external = _legacy_replacement_sources(
                source_document, topology, requested.channels
            )
            total_notes.extend(
                f"~ {item.name}: replaces supported custom Watts/Amps"
                for item in selected.aggregates
                if item.aggregate_id in external
            )
        native_energy = {
            source.existing_energy_id: source.power_id
            for source in native_total_sources(topology)
            if source.existing_energy_id
        }
        external_document = ESPHomeConfigDocument.parse(
            replace_managed_block(source_document.content, "aggregates", "")
        )
        if any(
            _plain_sensor_scalar(item.get("platform", "")) == "total_daily_energy"
            and native_energy.get(_plain_sensor_scalar(item.get("id", "")))
            != _plain_sensor_scalar(item.get("power_id", ""))
            for item in _root_sensor_items(external_document)
        ):
            total_notes.append(
                "~ Existing external custom kWh preserved; unverified and excluded from computed counts"
            )
    review_diff = _grouped_review_diff(
        previous, requested, topology, rendered_diff, rendered_blocks, total_notes,
        source_document=source_document,
    )
    if totals_changed:
        review_diff += "\n" + _technical_total_diff(
            source_document, proposed_document, previous, requested, topology
        )
    return ConfigMutationPlan(
        plan.configuration,
        plan.source_sha256,
        (*plan.changes, *changes),
        review_diff,
        content,
    )


def _technical_total_diff(
    before: ESPHomeConfigDocument,
    after: ESPHomeConfigDocument,
    previous: MeterConfigurationRequest,
    requested: MeterConfigurationRequest,
    topology: MeterTopology,
) -> str:
    """Project actual managed records, never raw source or metadata payloads."""
    native_ids = {
        sensor_id
        for source in native_total_sources(topology)
        for sensor_id in (source.power_id, source.current_id, source.existing_energy_id)
        if sensor_id is not None
    }
    allowed_ids = native_ids | {
        f"csemh_{source.source_id.replace('-', '_')}_energy"
        for source in native_total_sources(topology)
    } | {
        sensor_id
        for configuration in (previous, requested)
        for node in plan_total_graph(configuration, topology).ordered_nodes
        for sensor_id in planned_sensor_ids(node)
    }

    def project(document: ESPHomeConfigDocument) -> tuple[dict[str, dict[str, str]], tuple[str, ...]]:
        block = document.managed_blocks.get("aggregates")
        content = block.content if block else ""
        records = {}
        for item in _managed_sensor_items(content, document.sensor_item_indent):
            raw_id = item.get("id", "")
            extended = raw_id.startswith("!extend ")
            sensor_id = _plain_sensor_scalar(raw_id.removeprefix("!extend "))
            if sensor_id not in allowed_ids or (extended and sensor_id not in native_ids):
                continue
            fields = [f"id: {'!extend ' if extended else ''}{sensor_id}"]
            platform = _plain_sensor_scalar(item.get("platform", ""))
            if platform in {"template", "total_daily_energy"}:
                fields.append(f"platform: {platform}")
            if item.get("internal") in {"true", "false"}:
                fields.append(f"internal: {item['internal']}")
            power_id = _plain_sensor_scalar(item.get("power_id", ""))
            if power_id in allowed_ids:
                fields.append(f"power_id: {power_id}")
            records["; ".join(fields)] = item
        # Compare encoded metadata internally, but expose only its change status.
        metadata = tuple(
            line.strip() for line in content.splitlines()
            if re.match(r"\s*# csemh-(?:native-totals|automatic-totals|aggregate|replaced-totals):", line)
        )
        return records, metadata

    old_records, old_metadata = project(before)
    new_records, new_metadata = project(after)
    changes = [f"- {record}" for record in old_records if record not in new_records]
    changes += [f"+ {record}" for record in new_records if record not in old_records]
    changes += [f"~ {record}; other definition fields changed (not displayed)"
        for record in new_records if record in old_records and new_records[record] != old_records[record]]
    status = (
        "unchanged" if old_metadata == new_metadata else
        "added" if not old_metadata else "removed" if not new_metadata else "updated"
    )
    return "\n".join([
        "Exact generated total changes",
        *(changes or ["~ No total sensor definition changes"]),
        f"~ Managed totals metadata: {status}",
    ])


def _grouped_review_diff(
    previous: MeterConfigurationRequest,
    requested: MeterConfigurationRequest,
    topology: MeterTopology,
    rendered_diff: str = "",
    rendered_blocks: dict[str, list[str]] | None = None,
    total_notes: list[str] | None = None,
    *, source_document: ESPHomeConfigDocument | None = None,
) -> str:
    """Return semantic, line-oriented review data without YAML secrets or gains."""
    rendered: dict[str, list[str]] = {
        "Meter": [], "Voltage reference": [], "Channel": [],
        "Aggregate": [], "Package": [],
    }
    for group, lines_ in (rendered_blocks or {}).items():
        rendered[group].extend(lines_)
    for line in rendered_diff.splitlines():
        value = line[2:] if line.startswith(("+ ", "- ", "~ ")) else line
        if "current_cal" in value or "gain_voltage" in value:
            continue
        if value.startswith(("friendly_name:", "update_time:", "electric_freq:")):
            group = "Meter"
        elif value.startswith(("package.", "power_quality_", "status_fields_", "csemh_config_contract:")):
            group = "Package"
        elif "calibrated voltage gains" in value:
            group = "Voltage reference"
        else:
            group = "Channel"
        rendered[group].append(line if line.startswith(("+", "-", "~")) else f"~ {line}")
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
    meter_lines = [*rendered["Meter"], *meter_lines]
    if meter_lines:
        groups.append(("Meter", meter_lines))
    reference_lines = lines(
        _reference_review_value(previous), _reference_review_value(requested)
    )
    reference_lines = [*rendered["Voltage reference"], *reference_lines]
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
    channel_lines = [*rendered["Channel"], *channel_lines]
    if channel_lines:
        groups.append(("Channel", channel_lines))
    total_groups = _total_review_groups(previous, requested, topology, source_document)
    if total_notes:
        if total_groups and total_groups[-1][0] == "Advanced total hierarchy":
            total_groups[-1][1].extend(total_notes)
        else:
            total_groups.append(("Advanced total hierarchy", total_notes))
    groups.extend(total_groups)
    package_lines = lines(
        _package_review_value(previous), _package_review_value(requested)
    )
    package_lines = [*rendered["Package"], *package_lines]
    if package_lines:
        groups.append(("Package", package_lines))
    return "\n".join(
        "\n".join((name, *dict.fromkeys(lines))) for name, lines in groups
    )


_SENSITIVE_REVIEW_VALUE = re.compile(
    r"(?:api[_ -]?key|credential|encryption[_ -]?key|noise[_ -]?psk|password|secret|token)",
    re.IGNORECASE,
)


def _managed_block_diff(
    previous: ManagedBlock | None,
    proposed: ManagedBlock | None,
    *,
    gain_changed: bool = False,
) -> list[str]:
    """Return exact safe +/- managed YAML lines without block markers or gains."""
    old = _managed_block_lines(previous)
    new = _managed_block_lines(proposed)
    old = [line for line in old if "gain_voltage:" not in line]
    new = [line for line in new if "gain_voltage:" not in line]
    changed = [
        line
        for line in unified_diff(old, new, n=0, lineterm="")
        if line.startswith(("+", "-")) and not line.startswith(("+++", "---"))
    ]
    if gain_changed:
        changed.append("~ calibration gain updated")
    return changed


def _managed_block_lines(block: ManagedBlock | None) -> list[str]:
    if block is None:
        return []
    lines: list[str] = []
    for line in block.content.splitlines():
        if line.lstrip().startswith(
            ("# CircuitSetup Energy Meter Helper", "# End CircuitSetup Energy Meter Helper")
        ):
            continue
        if _SENSITIVE_REVIEW_VALUE.search(line):
            key, separator, _value = line.partition(":")
            line = f"{key}{separator} <redacted>" if separator else "<redacted>"
        lines.append(line)
    return lines


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


def _total_review_groups(
    previous: MeterConfigurationRequest,
    requested: MeterConfigurationRequest,
    topology: MeterTopology,
    source_document: ESPHomeConfigDocument | None = None,
) -> list[tuple[str, list[str]]]:
    """Use planner labels in the primary review, not renderer implementation IDs."""
    native_lines = []
    for source in native_total_sources(topology):
        old, new = (
            _desired_native_outputs(config, source) for config in (previous, requested)
        )
        for field, label in (("watts", "Watts"), ("amps", "Amps"), ("kwh", "kWh")):
            if getattr(old, field) != getattr(new, field):
                native_lines.append(
                    f"~ {source.label}: {label} {'exposed' if getattr(old, field) else 'hidden'} -> {'exposed' if getattr(new, field) else 'hidden'}"
                )
    if requested.totals_change_intent.adopt_managed_totals:
        native_lines.append("~ Explicitly adopt managed totals")
    groups = [("Default meter totals", native_lines)] if native_lines else []
    plans = [plan_total_graph(config, topology) for config in (previous, requested)]
    old_nodes, new_nodes = (
        {node.aggregate.aggregate_id: node for node in plan.ordered_nodes}
        for plan in plans
    )
    advanced_ids = {
        item.aggregate_id
        for config in (previous, requested)
        for item in config.aggregates
    }
    if source_document is not None:
        existing_ids = {
            _plain_sensor_scalar(item.get("id", ""))
            for item in _root_sensor_items(source_document)
        }
        old_nodes = {
            identifier: node for identifier, node in old_nodes.items()
            if identifier in advanced_ids or node.power_id in existing_ids or node.current_id in existing_ids
        }
    for title, advanced in (
        ("Suggested circuit totals", False),
        ("Advanced total hierarchy", True),
    ):
        changes: list[str] = []
        for identifier in dict.fromkeys((*old_nodes, *new_nodes)):
            if (identifier in advanced_ids) != advanced:
                continue
            old_node, new_node = old_nodes.get(identifier), new_nodes.get(identifier)
            if old_node == new_node:
                continue
            for sign, node in (("-", old_node), ("+", new_node)):
                if node is None:
                    continue
                aggregate = node.aggregate
                sources = " + ".join(source.label for source in node.sources)
                outputs = "; ".join(
                    f"{label} {'exposed' if enabled else 'hidden'}"
                    for label, enabled in (
                        ("Watts", aggregate.outputs.watts),
                        ("Amps", aggregate.outputs.amps),
                        ("kWh", aggregate.outputs.kwh),
                    )
                )
                changes.append(
                    f"{sign} {aggregate.name}: {sources}; {outputs}; {aggregate.energy_mode.value}; {aggregate.measurement_method.value}"
                )
        if not advanced:
            old_settings = {
                item.candidate.candidate_id: item
                for item in resolve_automatic_totals(
                    automatic_total_candidates(previous), previous.automatic_totals
                )
            }
            for item in resolve_automatic_totals(
                automatic_total_candidates(requested), requested.automatic_totals
            ):
                if item != old_settings.get(item.candidate.candidate_id):
                    changes.append(
                        f"~ {item.candidate.name}: {'enabled' if item.enabled else 'disabled'}"
                    )
        if advanced and changes:
            for node in plans[1].ordered_nodes:
                if (
                    node.aggregate.aggregate_id not in advanced_ids
                    or node.aggregate.outputs.watts
                    or not node.power_required
                ):
                    continue
                parents = [
                    parent.aggregate.name
                    for parent in plans[1].ordered_nodes
                    if any(
                        source.power_id == node.power_id for source in parent.sources
                    )
                ]
                if parents:
                    changes.append(
                        f"~ {node.aggregate.name}: Watts hidden; retained internally for {', '.join(parents)}"
                    )
        if advanced:
            for decision in requested.totals_change_intent.legacy_parent_decisions:
                names = {
                    item.aggregate_id: item.name
                    for config in (previous, requested)
                    for item in config.aggregates
                }
                changes.append(
                    f"~ {names.get(decision.child_id, 'Removed total')} -> {names.get(decision.proposed_parent_id, 'Removed total')}: legacy link {'accepted' if decision.accepted else 'rejected'}"
                )
        if changes:
            groups.append((title, changes))
    return groups


def _package_review_value(
    configuration: MeterConfigurationRequest,
) -> dict[str, object]:
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


def _select_render_totals(
    requested: MeterConfigurationRequest, topology: MeterTopology,
    document: ESPHomeConfigDocument, previous: MeterConfigurationRequest | None,
) -> tuple[MeterConfigurationRequest, str]:
    """Select explicit custom replacements; unchanged detected rows remain external."""
    sources = _legacy_replacement_sources(document, topology, requested.channels)
    selected = set(_replacement_metadata(document, sources))
    changed: set[str] = set()
    old = {} if previous is None else {item.aggregate_id: item for item in previous.aggregates}
    if previous is not None:
        changed.update(item.aggregate_id for item in requested.aggregates
            if item.aggregate_id in sources and item != old.get(item.aggregate_id))
        changed.update(source.aggregate_id for item in requested.aggregates if item != old.get(item.aggregate_id)
            for source in item.sources if isinstance(source, AggregateTotalSource) and source.aggregate_id in sources and source.aggregate_id not in selected)
    protected = _custom_native_total_ids(document, topology) | {
        _plain_sensor_scalar(item.get("power_id", "")) for item in _root_sensor_items(document)
        if _plain_sensor_scalar(item.get("platform", "")) == "total_daily_energy"
    }
    if any(protected.intersection(sources[identifier]) for identifier in changed):
        raise SourceOwnedTotalEditError("Existing source-owned energy or custom native totals must be edited in ESPHome Device Builder to preserve their entity identities")
    selected.update(changed)
    configuration = replace(requested, aggregates=tuple(item for item in requested.aggregates
        if item.aggregate_id not in sources or item.aggregate_id in selected))
    if not selected:
        return configuration, ""
    metadata = urlsafe_b64encode(json.dumps(sorted(selected), separators=(",", ":")).encode()).decode().rstrip("=")
    body = f"  # csemh-replaced-totals: {metadata}\n" + "".join(
        f"  - id: !extend {sensor_id}\n    internal: true\n"
        for aggregate_id in sorted(selected) for sensor_id in sources[aggregate_id]
    )
    return configuration, body


def _render_aggregates(
    plan: TotalRenderPlan,
    aggregates: tuple[CircuitAggregate, ...] = (),
    configuration: MeterConfigurationRequest | None = None,
) -> str:
    entries = {}
    original_order = {aggregate.aggregate_id: order for order, aggregate in enumerate(aggregates)}
    automatic_index = len(aggregates)
    for index, node in enumerate(plan.ordered_nodes):
        aggregate = node.aggregate
        order = original_order.get(aggregate.aggregate_id, automatic_index)
        if aggregate.aggregate_id not in original_order:
            automatic_index += 1
        metadata = urlsafe_b64encode(json.dumps(
            {
                "aggregate_id": aggregate.aggregate_id,
                "name": aggregate.name,
                "role": aggregate.role.value,
                "sources": [_serialize_total_source(source) for source in aggregate.sources],
                "measurement_method": aggregate.measurement_method.value,
                "energy_mode": aggregate.energy_mode.value,
                "outputs": _serialize_outputs(aggregate.outputs),
                "origin": aggregate.origin.value,
                "order": order,
            },
            separators=(",", ":"),
            sort_keys=True,
        ).encode()).decode().rstrip("=")
        entries[f"{index:08d}"] = (
            f"  # csemh-aggregate: {metadata}\n" + _aggregate_entry(node)
        )
    body = render_aggregates(entries)
    if configuration is not None:
        candidates = automatic_total_candidates(configuration)
        if candidates:
            roles = {str(source.channel): candidate.role.value for candidate in candidates for source in candidate.sources}
            settings = [{"candidate_id": resolved.candidate.candidate_id, "enabled": resolved.enabled, "outputs": _serialize_outputs(resolved.outputs)}
                for resolved in resolve_automatic_totals(candidates, configuration.automatic_totals)]
            metadata = urlsafe_b64encode(json.dumps({"roles": roles, "settings": settings}, separators=(",", ":"), sort_keys=True).encode()).decode().rstrip("=")
            body = f"  # csemh-automatic-totals: {metadata}\n" + body
    return body


def _render_native_totals(
    requested: MeterConfigurationRequest,
    topology: MeterTopology,
    document: ESPHomeConfigDocument,
) -> str:
    """Reconcile native visibility against preserved source and add board energy."""
    if _custom_native_total_ids(document, topology):
        raise SourceOwnedTotalEditError("Custom native totals must be edited in ESPHome Device Builder before adopting default meter totals")
    plan = plan_total_graph(requested, topology)
    definitions = native_total_sources(topology)
    upstream = {
        sensor_id: not public
        for source in definitions
        for sensor_id, public in (
            (source.power_id, source.upstream_defaults.watts),
            (source.current_id, source.upstream_defaults.amps),
            (source.existing_energy_id, source.upstream_defaults.kwh),
        )
        if sensor_id is not None
    }
    desired = {**upstream, **{item.sensor_id: item.internal for item in plan.native_visibility}}
    # The old helper block is replaced, so it cannot supply the preserved base.
    base = ESPHomeConfigDocument.parse(replace_managed_block(document.content, "aggregates", ""))
    span = base.writable_sensor_span
    if span is None:
        raise ConfigMutationError("native total visibility is not safely writable")
    native_definitions: dict[str, bool] = {}
    overrides: dict[str, bool] = {}
    try:
        start_line = span.line - 1
        line_count = len(base.content[span.start:span.end].splitlines())
        items = _managed_sensor_items(
            "\n".join(base.code_lines[start_line:start_line + line_count]),
            base.sensor_item_indent,
        )
        for item in items:
            raw_id = item.get("id", "")
            sensor_id = _plain_sensor_scalar(raw_id.removeprefix("!extend "))
            if sensor_id not in upstream:
                continue
            visibility = overrides if raw_id.startswith("!extend ") else native_definitions
            internal = item.get("internal")
            if sensor_id in visibility or internal not in {None, "true", "false"}:
                raise ValueError("unresolved native visibility")
            if internal is not None:
                visibility[sensor_id] = internal == "true"
            elif visibility is native_definitions:
                _total_sensor_name(item.get("name", ""), requested.meter.friendly_name)
                visibility[sensor_id] = False
    except ValueError as error:
        raise ConfigMutationError("native total visibility is unresolved") from error
    effective = {**upstream, **native_definitions, **overrides}
    plan = replace(plan, native_visibility=tuple(
        NativeVisibilityOverride(sensor_id, internal)
        for sensor_id, internal in desired.items()
        if internal != effective[sensor_id]
    ))
    board_energy = {
        f"csemh_{source.source_id.replace('-', '_')}_energy": source
        for source in definitions
        if source.existing_energy_id is None and _desired_native_outputs(requested, source).kwh
    }
    source_ids = {
        _plain_sensor_scalar(item["id"].removeprefix("!extend "))
        for item in items
        if "id" in item
    }
    if board_energy and "" in source_ids:
        raise ConfigMutationError("unmanaged sensor ID ownership is unresolved")
    conflicts = board_energy.keys() & source_ids
    if conflicts:
        raise ConfigMutationError(f"unmanaged sensor conflicts with board energy ID: {', '.join(sorted(conflicts))}")
    body = _render_native_total_overrides(plan) + "".join(
        _daily_energy(
            energy_id,
            f"${{friendly_name}} {source.label} Energy",
            source.power_id,
        )
        for energy_id, source in board_energy.items()
    )
    if not body:
        return ""
    metadata = urlsafe_b64encode(json.dumps(asdict(requested.default_totals), separators=(",", ":"), sort_keys=True).encode()).decode().rstrip("=")
    return f"  # csemh-native-totals: {metadata}\n" + body


def _render_native_total_overrides(plan: TotalRenderPlan) -> str:
    return "".join(
        f"  - id: !extend {item.sensor_id}\n    internal: {str(item.internal).lower()}\n"
        for item in plan.native_visibility
    )


def _aggregate_entry(node: PlannedTotalNode) -> str:
    aggregate = node.aggregate
    identifier = f"csemh_{aggregate.aggregate_id.replace('-', '_')}"
    power_id = f"{identifier}_power"
    power_expression = _sum_state(tuple(source.power_id for source in node.sources))
    if aggregate.measurement_method is MeasurementMethod.ONE_CT_DOUBLE_POWER:
        power_expression += " * 2.0"
    power_internal = not aggregate.outputs.watts
    lines = _template_sensor(
        power_id,
        f"${{friendly_name}} {aggregate.name} Power",
        _energy_power_expression(aggregate, power_expression),
        "W",
        "power",
        internal=power_internal,
    ) if node.power_required else ""
    lines += _template_sensor(
        f"{identifier}_current",
        f"${{friendly_name}} {aggregate.name} Current",
        _sum_state(tuple(source.current_id for source in node.sources)),
        "A",
        "current",
        internal=not aggregate.outputs.amps,
    ) if node.current_required else ""
    if node.energy_required and aggregate.energy_mode in (EnergyMode.CONSUMPTION, EnergyMode.GENERATION):
        lines += _daily_energy(
            f"{identifier}_energy",
            f"${{friendly_name}} {aggregate.name} Energy",
            power_id,
        )
    elif node.power_required and aggregate.energy_mode is EnergyMode.BIDIRECTIONAL:
        import_power_id, export_power_id = (
            f"{identifier}_import_power",
            f"{identifier}_export_power",
        )
        lines += _template_sensor(
            export_power_id,
            f"${{friendly_name}} {aggregate.name} Return to Grid Power",
            f"std::max(0.0f, -id({power_id}).state)",
            "W",
            "power",
            internal=power_internal,
        )
        lines += _daily_energy(
            f"{identifier}_export_energy",
            f"${{friendly_name}} {aggregate.name} Return to Grid Energy",
            export_power_id,
        ) if node.energy_required else ""
        lines += _template_sensor(
            import_power_id,
            f"${{friendly_name}} {aggregate.name} Import Power",
            f"std::max(0.0f, id({power_id}).state)",
            "W",
            "power",
            internal=power_internal,
        )
        lines += _daily_energy(
            f"{identifier}_import_energy",
            f"${{friendly_name}} {aggregate.name} Import Energy",
            import_power_id,
        ) if node.energy_required else ""
    return lines


def _sum_state(ids: tuple[str, ...]) -> str:
    return " + ".join(f"id({entity_id}).state" for entity_id in ids)


def _energy_power_expression(aggregate: CircuitAggregate, expression: str) -> str:
    if aggregate.energy_mode in (EnergyMode.CONSUMPTION, EnergyMode.GENERATION):
        return f"std::max(0.0f, {expression})"
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
