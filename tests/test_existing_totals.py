"""Regressions for supported totals in existing user-authored meter YAML."""

import asyncio
import json
from base64 import urlsafe_b64encode
from dataclasses import replace

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_blocks import (
    replace_managed_block,
)
from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.entity_estimator import (
    estimate_configuration_impact,
    summarize_configuration_totals,
)
from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
    _select_render_totals,
    expected_meter_entity_evidence,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    AggregateTotalSource,
    ElectricalSystem,
    TotalsChangeIntent,
)
from tests.test_meter_inventory import (
    _document,
    _explicit_native_definitions,
    _helper_mains_total,
    _inventory,
)
from tests.test_workflow import _persisted_totals_workflow


def _substituted_native_source(quote: str = "") -> str:
    native = _explicit_native_definitions(5)
    for sensor_id, label in (("totalWatts", "totalWatts"), ("totalAmps", "totalAmps"), ("totalEnergyDaily", "daily energy")):
        native = native.replace(
            f"name: Native {label}\n",
            f"name: {quote}${{friendly_name}} {sensor_id}{quote}\n",
        )
    return _document(addon_count=5, contract=True) + "sensor:\n" + native


@pytest.mark.parametrize("quote", ("", "'", '"'))
def test_native_visibility_resolves_friendly_name_without_rewriting_source(quote: str) -> None:
    source = _substituted_native_source(quote)
    inventory = _inventory(source)
    assert inventory.native_visibility_resolved
    assert inventory.configuration.default_totals.overall.watts
    assert inventory.configuration.default_totals.overall.amps
    assert inventory.configuration.default_totals.overall.kwh


def test_legacy_adoption_preview_resolves_preserved_native_names() -> None:
    """Replacing the old hidden-total block must resolve the definitions beneath it."""
    source = _substituted_native_source()
    legacy = _helper_mains_total().removeprefix("sensor:\n")
    legacy = legacy.replace(
        "  - id: !extend totalEnergyDaily\n",
        "  - id: !extend totalWatts\n    internal: true\n"
        "  - id: !extend totalAmps\n    internal: true\n"
        "  - id: !extend totalEnergyDaily\n",
    )
    source = source.replace("sensor:\n", "sensor:\n" + legacy)

    async def run() -> None:
        topology = _inventory(source).topology
        workflow, plan, _, builder, _ = await _persisted_totals_workflow(source, topology=topology)
        requested = replace(
            plan.inventory.configuration,
            meter=replace(plan.inventory.configuration.meter, electrical_system=ElectricalSystem.SPLIT_PHASE_120_240),
            totals_change_intent=TotalsChangeIntent(adopt_managed_totals=True),
        )
        result = await workflow._async_preview_meter_configuration(plan, requested)
        assert result.state.value == "previewed"
        transaction = workflow.transactions._transaction(result.transaction_id)
        proposed = transaction.plan.proposed_content
        assert replace_managed_block(proposed, "aggregates", "").endswith(
            replace_managed_block(source, "aggregates", "").split("sensor:\n", 1)[1]
        )
        assert builder.remote_content == source

    asyncio.run(run())


def _existing_custom_totals(*, energy_ids: bool = False) -> str:
    """Four-board source shape: custom native-looking House IDs and ID-less kWh."""
    source = _document(addon_count=3) + "sensor:\n"
    for suffix in ("Main", "AddOn1", "AddOn2", "AddOn3"):
        for kind in ("Watts", "Amps"):
            source += f"  - id: !extend total{kind}{suffix}\n    internal: true\n"
    for label, name, channels in (("", "House Total", (1, 2)), ("Charger", "Total Charger", (5, 6)), ("AC1", "Total AC1", (7, 8)), ("AC2", "Total AC2", (11, 12))):
        for kind, unit, device in (("Watts", "W", "power"), ("Amps", "A", "current")) if not label else (("Watts", "W", "power"),):
            expression = " + ".join(f"id(ct{channel}{kind}).state" for channel in channels)
            source += (
                f"  - platform: template\n    id: total{label}{kind}\n"
                f"    name: {name} {kind}\n    lambda: return {expression} ;\n"
                f"    unit_of_measurement: {unit}\n    device_class: {device}\n"
                "    state_class: measurement\n"
            )
        source += "  - platform: total_daily_energy\n"
        if energy_ids:
            source += f"    id: existing_{label or 'house'}_energy\n"
        source += (
            f"    name: {name} kWh\n    power_id: total{label}Watts\n"
            "    filters:\n    - multiply: 0.001\n"
            "    unit_of_measurement: kWh\n    device_class: energy\n"
            "    state_class: total_increasing\n"
        )
    return source


@pytest.mark.parametrize("energy_ids", (False, True))
def test_existing_custom_totals_detect_energy_relationships_and_house_formula(energy_ids: bool) -> None:
    source = _existing_custom_totals(energy_ids=energy_ids)
    inventory = _inventory(source)
    assert {
        item.name: (tuple(member.channel for member in item.sources), item.outputs.watts, item.outputs.amps, item.outputs.kwh)
        for item in inventory.configuration.aggregates
    } == {
        "House Total": ((1, 2), True, True, True),
        "Total Charger": ((5, 6), True, False, True),
        "Total AC1": ((7, 8), True, False, True),
        "Total AC2": ((11, 12), True, False, True),
    }
    configuration = replace(inventory.configuration, meter=replace(
        inventory.configuration.meter, electrical_system=ElectricalSystem.SPLIT_PHASE_120_240
    ))
    document = ESPHomeConfigDocument.parse(source)
    evidence = expected_meter_entity_evidence(configuration, inventory.topology,
        document=document, previous=configuration, native_visibility_resolved=inventory.native_visibility_resolved)
    assert {name for _, name in evidence.source_owned_sensor_entities} == {
        "House Total Watts", "House Total Amps", "House Total kWh",
        "Total Charger Watts", "Total Charger kWh", "Total AC1 Watts", "Total AC1 kWh",
        "Total AC2 Watts", "Total AC2 kWh",
    }
    assert evidence.native_sensor_entities == frozenset()
    impact = estimate_configuration_impact(configuration, inventory.topology,
        document=document, previous=configuration, native_visibility_resolved=inventory.native_visibility_resolved)
    assert impact.public_total_entity_count == 9
    assert impact.energy_entity_count == 4
    summaries = summarize_configuration_totals(configuration, inventory.topology,
        document=document, previous=configuration, native_visibility_resolved=inventory.native_visibility_resolved, totals_managed=False)
    custom = {row.total_id: row for row in summaries if row.kind == "aggregate"}
    assert len(custom) == 4
    assert all("kWh" in row.public_outputs and not row.unverified_outputs for row in custom.values())


def test_unchanged_custom_totals_preview_preserves_all_original_sensors() -> None:
    source = _existing_custom_totals()

    async def run() -> None:
        workflow, plan, _, builder, _ = await _persisted_totals_workflow(source, topology=_inventory(source).topology)
        requested = replace(plan.inventory.configuration, meter=replace(
            plan.inventory.configuration.meter, electrical_system=ElectricalSystem.SPLIT_PHASE_120_240
        ))
        result = await workflow._async_preview_meter_configuration(plan, requested)
        assert result.state.value == "previewed"
        proposed = workflow.transactions._transaction(result.transaction_id).plan.proposed_content
        assert proposed.endswith(source.split("sensor:\n", 1)[1])
        assert "csemh-replaced-totals" not in proposed
        assert "csemh-aggregate:" not in proposed
        assert builder.remote_content == source

    asyncio.run(run())


@pytest.mark.parametrize("change", ("direct", "parent", "hidden_energy"))
def test_existing_energy_relationship_cannot_be_silently_replaced(change: str) -> None:
    source = _existing_custom_totals()
    if change == "hidden_energy":
        source = source.replace("name: Total Charger kWh\n", "name: Total Charger kWh\n    internal: true\n")
    inventory = _inventory(source)
    previous = inventory.configuration
    charger = next(item for item in previous.aggregates if item.aggregate_id == "total-charger")
    if change == "parent":
        changed = replace(charger, aggregate_id="parent", name="Parent", sources=(AggregateTotalSource("aggregate", charger.aggregate_id),))
        requested = replace(previous, aggregates=(*previous.aggregates, changed))
    else:
        requested = replace(previous, aggregates=tuple(replace(item, name="Renamed") if item == charger else item for item in previous.aggregates))
    with pytest.raises(ValueError, match="Device Builder"):
        _select_render_totals(requested, inventory.topology, ESPHomeConfigDocument.parse(source), previous)


def test_retained_energy_replacement_metadata_can_still_be_read_unchanged() -> None:
    source = _existing_custom_totals()
    inventory = _inventory(source)
    metadata = urlsafe_b64encode(json.dumps(["total-charger"]).encode()).decode().rstrip("=")
    source = replace_managed_block(source, "aggregates", f"  # csemh-replaced-totals: {metadata}\n  - id: !extend totalChargerWatts\n    internal: true\n")
    selected, body = _select_render_totals(inventory.configuration, inventory.topology,
        ESPHomeConfigDocument.parse(source), None)
    assert [item.aggregate_id for item in selected.aggregates] == ["total-charger"]
    assert "!extend totalChargerWatts" in body


def test_adopting_genuine_native_totals_preserves_source_owned_energy() -> None:
    custom = _existing_custom_totals().split("  - platform: template\n    id: totalChargerWatts", 1)[1]
    custom = "  - platform: template\n    id: totalChargerWatts" + custom
    source = _substituted_native_source() + custom

    async def run() -> None:
        workflow, plan, _, builder, _ = await _persisted_totals_workflow(source, topology=_inventory(source).topology)
        requested = replace(plan.inventory.configuration, meter=replace(
            plan.inventory.configuration.meter, electrical_system=ElectricalSystem.SPLIT_PHASE_120_240
        ), totals_change_intent=TotalsChangeIntent(adopt_managed_totals=True))
        result = await workflow._async_preview_meter_configuration(plan, requested)
        assert result.state.value == "previewed"
        proposed = workflow.transactions._transaction(result.transaction_id).plan.proposed_content
        assert proposed.endswith(custom)
        assert "csemh_total_charger" not in proposed
        assert builder.remote_content == source

    asyncio.run(run())


def test_custom_native_totals_do_not_gain_adoption_authority_from_detection() -> None:
    inventory = _inventory(_existing_custom_totals())
    assert len(inventory.configuration.aggregates) == 4
    assert not inventory.capabilities.native_totals_writable
    with pytest.raises(ValueError, match="contract support"):
        inventory.validate_totals_change(replace(inventory.configuration,
            totals_change_intent=TotalsChangeIntent(adopt_managed_totals=True)))


@pytest.mark.parametrize("invalid", ("hidden", "unknown_id", "unknown_name", "duplicate", "overridden_units"))
def test_existing_energy_detection_does_not_guess_ambiguous_or_hidden_sensors(invalid: str) -> None:
    source = _existing_custom_totals(energy_ids=True)
    if invalid == "hidden":
        source += "  - id: !extend existing_Charger_energy\n    internal: true\n"
    elif invalid == "overridden_units":
        source += "  - id: !extend existing_Charger_energy\n    unit_of_measurement: Wh\n"
    elif invalid == "duplicate":
        source += "  - platform: total_daily_energy\n    name: Duplicate\n    power_id: totalChargerWatts\n"
    else:
        source = source.replace("id: existing_Charger_energy", "id: ${unknown}") if invalid == "unknown_id" else source.replace("name: Total Charger kWh", "name: ${unknown}")
    inventory = _inventory(source)
    charger = next(item for item in inventory.configuration.aggregates if item.aggregate_id == "total-charger")
    assert not charger.outputs.kwh


@pytest.mark.parametrize("name", ("${missing} Total", "${friendly_name} ${missing}", "null", "true", "!secret name"))
def test_unresolved_native_names_still_block_adoption(name: str) -> None:
    source = _substituted_native_source().replace("${friendly_name} totalWatts", name)
    inventory = _inventory(source)
    assert not inventory.native_visibility_resolved
    with pytest.raises(ValueError, match="visibility"):
        inventory.validate_totals_change(replace(
            inventory.configuration, totals_change_intent=TotalsChangeIntent(adopt_managed_totals=True)
        ))
