"""Generalized meter configuration mutation entry point."""

from __future__ import annotations

import json
from dataclasses import replace

from .config_blocks import render_voltage_references, replace_managed_block
from .config_document import ESPHomeConfigDocument
from .config_mutator import (
    ConfigMutationError,
    ConfigSnapshot,
    CTChangeRequest,
    _apply_changes,
    _build_ct_mutation,
    _canonical_meter_id,
)
from .meter_configuration import (
    MeterConfigurationRequest,
    VoltageReferenceConfig,
    validate_meter_configuration,
)
from .meter_inventory import MeterConfigurationInventory
from .models import ConfigMutationPlan, MeterTopology, SubstitutionChange
from .store import VerifiedCalibrationRecord


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
    except ValueError as error:
        raise ConfigMutationError(str(error)) from error
    previous = current.configuration
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
    if requested.meter == previous.meter:
        return plan
    substitutions = {
        "friendly_name": requested.meter.friendly_name,
        "update_time": f"{requested.meter.update_interval_s}s",
        "electric_freq": f"{requested.meter.line_frequency_hz}Hz",
    }
    document = ESPHomeConfigDocument.parse(plan.proposed_content)
    changes = [
        SubstitutionChange(key, scalar.value if scalar else None, value)
        for key, value in substitutions.items()
        if (scalar := document.substitutions.get(key)) is None or scalar.value != value
    ]
    content = _apply_changes(document, changes, substitutions)
    content = replace_managed_block(
        content,
        "voltage_references",
        _render_voltage_references(
            requested.meter.voltage_references, topology, document
        ),
    )
    voltage_diff = _voltage_reference_diff(plan.proposed_content, content)
    return ConfigMutationPlan(
        plan.configuration,
        plan.source_sha256,
        (*plan.changes, *changes),
        "\n".join(part for part in (plan.redacted_diff, voltage_diff) if part),
        content,
    )


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


def _voltage_reference_diff(before: str, after: str) -> str:
    marker = "# CircuitSetup Energy Meter Helper: voltage references v1"

    def lines(content: str) -> tuple[str, ...]:
        start = content.find(marker)
        if start < 0:
            return ()
        end = content.find(
            "# End CircuitSetup Energy Meter Helper: voltage references v1", start
        )
        return tuple(content[start:end].splitlines())

    old, new = lines(before), lines(after)
    if old == new:
        return ""
    return "\n".join(
        (*(f"- {line}" for line in old), *(f"+ {line}" for line in new))
    )
