"""kWh switches own energy sensor existence, including hidden legacy sensors."""

from dataclasses import replace
from hashlib import sha256

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_blocks import (
    replace_managed_block,
)
from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
    _render_total_updates,
    _select_render_totals,
    build_meter_configuration_mutation,
)
from custom_components.circuitsetup_energy_meter_helper.meter_inventory import (
    _root_sensor_items,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    StoredMeterConfiguration,
)
from tests.test_config_mutator import (
    _inventory,
    _native_total_setup,
    _topology_for_addons,
)
from tests.test_existing_totals import _existing_custom_totals


@pytest.mark.parametrize("energy_ids", (False, True))
def test_existing_kwh_is_checked_when_hidden_and_removes_and_recreates_sensors(energy_ids: bool) -> None:
    content = _existing_custom_totals(energy_ids=energy_ids).replace("    state_class: total_increasing\n", "    state_class: total_increasing\n    internal: true\n")
    topology = _topology_for_addons(3)
    snapshot = ESPHomeConfigSnapshot("meter.yaml", content, sha256(content.encode()).hexdigest())
    config = _inventory(snapshot, topology).configuration
    assert all(total.outputs.kwh for total in config.aggregates)
    stored = StoredMeterConfiguration(snapshot.sha256, config.meter, config.channels, config.default_totals,
        config.automatic_totals, config.aggregates, config.power_quality, config.status_fields)
    current = _inventory(snapshot, topology, stored=stored)
    for enabled in (False, True):
        requested = replace(current.configuration, aggregates=tuple(replace(total,
            outputs=replace(total.outputs, kwh=enabled)) for total in current.configuration.aggregates))
        proposed = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
        energy = [item for item in _root_sensor_items(ESPHomeConfigDocument.parse(proposed)) if item.get("platform") == "total_daily_energy"]
        assert len(energy) == (4 if enabled else 0)
        snapshot = replace(snapshot, content=proposed, sha256=sha256(proposed.encode()).hexdigest())
        stored = replace(stored, config_sha256=snapshot.sha256, aggregates=requested.aggregates)
        current = _inventory(snapshot, topology, stored=stored)
        assert "aggregate_semantics_unreadable" not in current.warnings
        assert all(total.outputs.kwh == enabled for total in current.configuration.aggregates)


def test_default_kwh_removes_inherited_energy_instead_of_hiding_it() -> None:
    snapshot, topology, current = _native_total_setup(1)
    requested = replace(current.configuration, default_totals=replace(current.configuration.default_totals,
        overall=replace(current.configuration.default_totals.overall, kwh=False)))
    proposed = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    assert "id: !remove totalEnergyDaily" in proposed
    assert "id: !extend totalEnergyDaily\n    internal: true" not in proposed
    snapshot = replace(snapshot, content=proposed, sha256=sha256(proposed.encode()).hexdigest())
    loaded = _inventory(snapshot, topology)
    assert "aggregate_semantics_unreadable" not in loaded.warnings
    assert not loaded.configuration.default_totals.overall.kwh
    stored = StoredMeterConfiguration(snapshot.sha256, requested.meter, requested.channels,
        requested.default_totals, requested.automatic_totals, requested.aggregates,
        requested.power_quality, requested.status_fields)
    loaded = _inventory(snapshot, topology, stored=stored)
    requested = replace(loaded.configuration, default_totals=replace(loaded.configuration.default_totals,
        overall=replace(loaded.configuration.default_totals.overall, kwh=True)))
    restored = build_meter_configuration_mutation(snapshot, topology, loaded, requested).proposed_content
    assert "id: !remove totalEnergyDaily" not in restored
    snapshot = replace(snapshot, content=restored, sha256=sha256(restored.encode()).hexdigest())
    loaded = _inventory(snapshot, topology)
    assert "aggregate_semantics_unreadable" not in loaded.warnings
    assert loaded.configuration.default_totals.overall.kwh


def test_legacy_hidden_energy_metadata_recovers_presence_without_exposing_counter() -> None:
    content = _existing_custom_totals(energy_ids=True).replace("    state_class: total_increasing\n", "    state_class: total_increasing\n    internal: true\n")
    topology = _topology_for_addons(3)
    snapshot = ESPHomeConfigSnapshot("meter.yaml", content, sha256(content.encode()).hexdigest())
    config = _inventory(snapshot, topology).configuration
    old = replace(config, aggregates=tuple(replace(t, outputs=replace(t.outputs, kwh=False)) for t in config.aggregates))
    selected, replacements = _select_render_totals(old, topology, ESPHomeConfigDocument.parse(content), config)
    content = replace_managed_block(content, "aggregates", _render_total_updates(selected, topology, ESPHomeConfigDocument.parse(content), replacements, energy_presence=False))
    snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    stored = StoredMeterConfiguration(snapshot.sha256, old.meter, old.channels, old.default_totals,
        old.automatic_totals, old.aggregates, old.power_quality, old.status_fields)
    current = _inventory(snapshot, topology, stored=stored)
    assert "aggregate_semantics_unreadable" not in current.warnings
    assert all(t.outputs.kwh for t in current.configuration.aggregates)
    requested = replace(current.configuration, aggregates=tuple(replace(t, outputs=replace(t.outputs, watts=False)) for t in current.configuration.aggregates))
    proposed = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    assert "id: !extend existing_house_energy\n    name: \"House Total kWh\"\n    internal: true" in proposed
    assert len([item for item in _root_sensor_items(ESPHomeConfigDocument.parse(proposed)) if item.get("platform") == "total_daily_energy"]) == 4
