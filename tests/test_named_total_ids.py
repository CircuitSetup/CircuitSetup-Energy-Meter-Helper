from dataclasses import replace
from hashlib import sha256

import pytest

from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
    build_meter_configuration_mutation,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    ChannelTotalSource,
    CircuitAggregate,
    CircuitRole,
    EnergyMode,
    MeasurementMethod,
    TotalOutputSettings,
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


def test_named_total_ids_survive_reload_and_enabling_an_output():
    snapshot, topology, current = _native_total_setup(0)
    total = CircuitAggregate('custom-1', 'Pool Pump', CircuitRole.CUSTOM,
        (ChannelTotalSource('channel', 1),), MeasurementMethod.DIRECT,
        EnergyMode.CONSUMPTION, TotalOutputSettings(True, False, True))
    requested = replace(current.configuration, aggregates=(total,))
    for enable_amps in (False, True):
        requested = replace(requested, aggregates=(replace(total, outputs=replace(total.outputs, amps=enable_amps)),))
        proposed = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
        assert 'id: poolPumpWatts' in proposed
        assert 'id: poolPumpEnergy' in proposed
        assert 'power_id: poolPumpWatts' in proposed
        assert ('id: poolPumpAmps' in proposed) == enable_amps
        snapshot = replace(snapshot, content=proposed, sha256=sha256(proposed.encode()).hexdigest())
        stored = StoredMeterConfiguration(snapshot.sha256, requested.meter, requested.channels,
            requested.default_totals, requested.automatic_totals, requested.aggregates,
            requested.power_quality, requested.status_fields)
        current = _inventory(snapshot, topology, stored=stored)
        assert 'aggregate_semantics_unreadable' not in current.warnings

    renamed = replace(requested, aggregates=(replace(requested.aggregates[0], name='Swimming Pool'),))
    proposed = build_meter_configuration_mutation(snapshot, topology, current, renamed).proposed_content
    assert 'id: poolPumpWatts' in proposed
    assert 'id: swimmingPoolWatts' not in proposed


def test_colliding_names_are_rejected_before_saving():
    snapshot, topology, current = _native_total_setup(0)
    first = CircuitAggregate('first', 'Pool Pump', CircuitRole.CUSTOM,
        (ChannelTotalSource('channel', 1),), MeasurementMethod.DIRECT,
        EnergyMode.CONSUMPTION, TotalOutputSettings(True, False, False))
    requested = replace(current.configuration, aggregates=(first, replace(first, aggregate_id='second', name='Pool-Pump')))
    with pytest.raises(ValueError, match='conflicts'):
        build_meter_configuration_mutation(snapshot, topology, current, requested)


def test_new_output_on_source_total_uses_name_and_preserves_existing_ids():
    content = _existing_custom_totals(energy_ids=True)
    snapshot = ESPHomeConfigSnapshot('meter.yaml', content, sha256(content.encode()).hexdigest())
    topology = _topology_for_addons(3)
    config = _inventory(snapshot, topology).configuration
    stored = StoredMeterConfiguration(snapshot.sha256, config.meter, config.channels,
        config.default_totals, config.automatic_totals, config.aggregates, config.power_quality, config.status_fields)
    current = _inventory(snapshot, topology, stored=stored)
    requested = replace(config, aggregates=tuple(replace(total, outputs=replace(total.outputs, amps=True))
        if total.name == 'Total Charger' else total for total in config.aggregates))
    proposed = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    assert 'id: totalChargerAmps' in proposed
    assert 'id: !extend totalChargerWatts' in proposed
    snapshot = replace(snapshot, content=proposed, sha256=sha256(proposed.encode()).hexdigest())
    loaded = _inventory(snapshot, topology, stored=replace(stored, config_sha256=snapshot.sha256, aggregates=requested.aggregates))
    assert 'aggregate_semantics_unreadable' not in loaded.warnings
