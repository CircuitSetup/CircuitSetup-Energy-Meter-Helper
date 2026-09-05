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
    ChannelTotalSource,
    CircuitRole,
    ElectricalSystem,
    MeasurementMethod,
    NativeTotalSource,
    TotalOutputSettings,
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


@pytest.mark.parametrize("edit", ("outputs", "members", "remove", "disable_member", "parent"))
def test_existing_total_edits_survive_verified_save_and_second_preview(edit: str) -> None:
    """Exercise the real transaction and Store; only Builder/device IO are fake."""
    from tests.test_config_transaction import _evidence

    async def run() -> None:
        source = _existing_custom_totals()
        topology = _inventory(source).topology
        workflow, plan, store, builder, verifier = await _persisted_totals_workflow(source, topology=topology)
        original = plan.inventory.configuration
        house, charger, ac1, ac2 = original.aggregates
        channels = original.channels
        aggregates = original.aggregates
        if edit == "outputs":
            aggregates = (replace(house, outputs=TotalOutputSettings(False, True, False)), charger, ac1, ac2)
        elif edit == "members":
            aggregates = (replace(house, sources=(ChannelTotalSource("channel", 3), ChannelTotalSource("channel", 4))), charger, ac1, ac2)
        elif edit in {"remove", "disable_member"}:
            aggregates = (house, ac1, ac2)
            if edit == "disable_member":
                channels = tuple(replace(item, enabled=False, role=CircuitRole.UNUSED) if item.channel == 5 else item for item in channels)
        else:
            aggregates = (*aggregates, replace(charger, aggregate_id="parent", name="Parent",
                measurement_method=MeasurementMethod.DIRECT,
                sources=(AggregateTotalSource("aggregate", "total-charger"),)))
        requested = replace(original, channels=channels, aggregates=aggregates,
            meter=replace(original.meter, electrical_system=ElectricalSystem.SPLIT_PHASE_120_240),
            totals_change_intent=TotalsChangeIntent(adopt_managed_totals=True))
        preview = await workflow._async_preview_meter_configuration(plan, requested)
        manager = workflow.transactions
        transaction = manager._transaction(preview.transaction_id)
        verifier.evidence = replace(_evidence(), topology=topology, current_sensor_count=topology.ct_count,
            ct_names={item.channel: item.name for item in requested.channels},
            sensor_entities=transaction.expected_sensor_entities)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        installed = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert installed.state.value == "verified", installed
        workflow, loaded, _, _, _ = await _persisted_totals_workflow(builder.remote_content, store, topology)
        assert loaded.inventory.totals_managed
        assert loaded.inventory.capabilities.managed_advanced_totals
        assert not loaded.inventory.capabilities.native_totals_writable
        assert {item.aggregate_id: item for item in loaded.inventory.configuration.aggregates} == {
            item.aggregate_id: item for item in requested.aggregates}
        refreshed = loaded.inventory.configuration
        second = replace(refreshed, aggregates=tuple(replace(item, name="Second edit") if item.aggregate_id == "total-ac2" else item for item in refreshed.aggregates))
        assert (await workflow._async_preview_meter_configuration(loaded, second)).state.value == "previewed"

    asyncio.run(run())


def test_custom_native_subset_cannot_be_used_as_whole_meter_source() -> None:
    inventory = _inventory(_existing_custom_totals())
    previous = inventory.configuration
    requested = replace(previous, aggregates=(*previous.aggregates, replace(previous.aggregates[0],
        aggregate_id="whole", name="Whole", sources=(NativeTotalSource("native_total", "overall"),))))
    with pytest.raises(ValueError, match="custom formula"):
        _select_render_totals(requested, inventory.topology, ESPHomeConfigDocument.parse(_existing_custom_totals()), previous)


@pytest.mark.parametrize("target", (None, "meter-total", "total-charger", "total-ac1", "total-ac2"))
@pytest.mark.parametrize("energy_ids", (False, True))
def test_adopt_and_edit_existing_totals_round_trip(target: str | None, energy_ids: bool) -> None:
    source = _existing_custom_totals(energy_ids=energy_ids)

    async def run() -> None:
        workflow, plan, _, builder, _ = await _persisted_totals_workflow(source, topology=_inventory(source).topology)
        requested = replace(plan.inventory.configuration,
            meter=replace(plan.inventory.configuration.meter, electrical_system=ElectricalSystem.SPLIT_PHASE_120_240),
            totals_change_intent=TotalsChangeIntent(adopt_managed_totals=True),
            aggregates=tuple(replace(item, name="Edited total") if item.aggregate_id == target else item
                for item in plan.inventory.configuration.aggregates))
        result = await workflow._async_preview_meter_configuration(plan, requested)
        transaction = workflow.transactions._transaction(result.transaction_id)
        proposed = transaction.plan.proposed_content
        recovered = _inventory(proposed)
        assert {item.aggregate_id: item for item in recovered.configuration.aggregates} == {
            item.aggregate_id: item for item in requested.aggregates}
        assert "aggregate_semantics_unreadable" not in recovered.warnings
        assert not recovered.capabilities.native_totals_writable
        assert "lambda: return id(ct1Watts).state + id(ct2Watts).state ;" in proposed
        impact = estimate_configuration_impact(requested, plan.inventory.topology,
            document=ESPHomeConfigDocument.parse(source), previous=plan.inventory.configuration,
            native_visibility_resolved=False)
        assert impact.public_total_entity_count == 9
        assert impact.energy_entity_count == 4
        assert builder.remote_content == source

    asyncio.run(run())


def test_rename_legacy_custom_ct_preserves_gain_without_new_hardware_acknowledgement() -> None:
    source = _existing_custom_totals().replace("27519", "27518")

    async def run() -> None:
        workflow, plan, _, builder, _ = await _persisted_totals_workflow(source, topology=_inventory(source).topology)
        original = plan.inventory.configuration
        assert original.channels[0].model_id == "custom"
        assert not original.channels[0].burden_output_acknowledged
        requested = replace(original, meter=replace(original.meter,
            electrical_system=ElectricalSystem.SPLIT_PHASE_120_240),
            channels=tuple(replace(item, name=f"Renamed CT{item.channel}") for item in original.channels))
        result = await workflow._async_preview_meter_configuration(plan, requested)
        proposed = ESPHomeConfigDocument.parse(workflow.transactions._transaction(result.transaction_id).plan.proposed_content)
        before = ESPHomeConfigDocument.parse(source)
        for item in original.channels:
            assert proposed.substitutions[f"current_cal_ct{item.channel}"].value == before.substitutions[f"current_cal_ct{item.channel}"].value
            assert proposed.substitutions[f"ct{item.channel}_name"].value == f"Renamed CT{item.channel}"
        assert builder.remote_content == source
        for fields in ({"custom_gain_ct": 12345}, {"reporting_multiplier": 2.0}, {"custom_label": "Different CT"}):
            workflow, plan, _, _, _ = await _persisted_totals_workflow(source, topology=_inventory(source).topology)
            changed = replace(requested, channels=(replace(requested.channels[0], **fields), *requested.channels[1:]))
            with pytest.raises(ValueError, match="acknowledgement"):
                await workflow._async_preview_meter_configuration(plan, changed)

    asyncio.run(run())


@pytest.mark.parametrize("change", ("direct", "parent", "hidden_energy"))
def test_editing_existing_energy_relationship_selects_its_power_for_replacement(change: str) -> None:
    source = _existing_custom_totals()
    if change == "hidden_energy":
        source = source.replace("name: Total Charger kWh\n", "name: Total Charger kWh\n    internal: true\n")
    inventory = _inventory(source)
    previous = inventory.configuration
    charger = next(item for item in previous.aggregates if item.aggregate_id == "total-charger")
    if change == "parent":
        changed = replace(charger, aggregate_id="parent", name="Parent", measurement_method=MeasurementMethod.DIRECT,
            sources=(AggregateTotalSource("aggregate", charger.aggregate_id),))
        requested = replace(previous, aggregates=(*previous.aggregates, changed))
    else:
        requested = replace(previous, aggregates=tuple(replace(item, name="Renamed") if item == charger else item for item in previous.aggregates))
    selected, body = _select_render_totals(requested, inventory.topology, ESPHomeConfigDocument.parse(source), previous)
    assert charger.aggregate_id in {item.aggregate_id for item in selected.aggregates}
    assert "!extend totalChargerWatts" in body


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


def test_custom_native_totals_adoption_does_not_authorize_default_visibility_changes() -> None:
    inventory = _inventory(_existing_custom_totals())
    assert len(inventory.configuration.aggregates) == 4
    assert not inventory.capabilities.native_totals_writable
    requested = replace(inventory.configuration, totals_change_intent=TotalsChangeIntent(adopt_managed_totals=True))
    inventory.validate_totals_change(requested)
    with pytest.raises(ValueError, match="native total visibility"):
        inventory.validate_totals_change(replace(requested, default_totals=replace(requested.default_totals,
            overall=replace(requested.default_totals.overall, watts=not requested.default_totals.overall.watts))))


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
