"""Tests for configuration entity-impact estimates."""

from dataclasses import replace
from hashlib import sha256

import pytest

from custom_components.circuitsetup_energy_meter_helper.entity_estimator import (
    estimate_configuration_impact,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    AggregateTotalSource,
    ChannelTotalSource,
    CircuitAggregate,
    CircuitRole,
    EnergyMode,
    MeasurementMethod,
    TotalOutputSettings,
)
from tests.test_meter_configuration import request, topology


@pytest.mark.parametrize("public_current", (False, True))
def test_unresolved_native_impact_counts_only_confirmed_source_visibility(
    public_current: bool,
) -> None:
    from custom_components.circuitsetup_energy_meter_helper.config_document import (
        ESPHomeConfigDocument,
    )
    from tests.test_config_mutator import _contract_snapshot, _inventory, _topology

    snapshot = _contract_snapshot()
    overrides = "  - id: !extend totalWattsMain\n    internal: true\n"
    if public_current:
        overrides += "  - id: !extend totalAmpsMain\n    internal: false\n    name: Renamed current\n"
    content = snapshot.content.replace("logger:\n", overrides + "logger:\n")
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )
    current = _inventory(snapshot, _topology())
    assert not current.native_visibility_resolved
    impact = estimate_configuration_impact(
        current.configuration,
        current.topology,
        document=ESPHomeConfigDocument.parse(content),
        previous=current.configuration,
    )
    assert impact.public_total_entity_count == int(public_current)
    assert impact.internal_total_sensor_count == 1
    assert impact.energy_entity_count == 0


def test_hash_bound_resolved_native_settings_remain_authoritative() -> None:
    from custom_components.circuitsetup_energy_meter_helper.config_document import (
        ESPHomeConfigDocument,
    )
    from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
        expected_meter_entity_evidence,
    )
    from custom_components.circuitsetup_energy_meter_helper.store import (
        StoredMeterConfiguration,
    )
    from tests.test_config_mutator import _contract_snapshot, _inventory, _topology

    snapshot = _contract_snapshot()
    source = _inventory(snapshot, _topology()).configuration
    defaults = replace(
        source.default_totals, overall=TotalOutputSettings(False, True, False)
    )
    stored = StoredMeterConfiguration(
        snapshot.sha256,
        source.meter,
        source.channels,
        defaults,
        (),
        (),
        source.power_quality,
        source.status_fields,
    )
    current = _inventory(snapshot, _topology(), stored=stored)
    assert current.native_visibility_resolved
    document = ESPHomeConfigDocument.parse(snapshot.content)
    impact = estimate_configuration_impact(
        current.configuration,
        current.topology,
        document=document,
        previous=current.configuration,
        native_visibility_resolved=current.native_visibility_resolved,
    )
    evidence = expected_meter_entity_evidence(
        current.configuration,
        current.topology,
        document=document,
        previous=current.configuration,
        native_visibility_resolved=current.native_visibility_resolved,
    )
    assert (impact.public_total_entity_count, impact.internal_total_sensor_count) == (
        1,
        2,
    )
    assert evidence.native_sensor_entities == frozenset(
        {("energy_meter_total_amps_main", "Energy meter Total Amps Main")}
    )


def test_default_six_channel_estimate() -> None:
    impact = estimate_configuration_impact(
        replace(request(), status_fields=(True,)), topology()
    )
    assert (
        impact.enabled_channel_count,
        impact.numeric_entity_count,
        impact.text_entity_count,
        impact.energy_entity_count,
        impact.approximate_publications_per_second,
    ) == (6, 17, 6, 1, 4.6)


def test_all_42_channels_with_power_quality() -> None:
    configuration = request(addons=6)
    configuration = replace(
        configuration, power_quality=(True,) * 7, status_fields=(True,) * 7
    )
    impact = estimate_configuration_impact(configuration, topology(6))
    assert (
        impact.enabled_channel_count,
        impact.numeric_entity_count,
        impact.text_entity_count,
        impact.energy_entity_count,
    ) == (42, 278, 42, 8)


def test_unused_channels_do_not_add_entities() -> None:
    configuration = request()
    configuration = replace(
        configuration,
        channels=(
            *configuration.channels[:-1],
            replace(configuration.channels[-1], enabled=False, role=CircuitRole.UNUSED),
        ),
    )
    impact = estimate_configuration_impact(configuration, topology())
    assert (
        impact.enabled_channel_count,
        impact.numeric_entity_count,
        impact.text_entity_count,
    ) == (5, 15, 5)


def test_bidirectional_grid_counts_visible_clamps_and_energy() -> None:
    configuration = request()
    aggregate = CircuitAggregate(
        "grid",
        "Grid",
        CircuitRole.GRID,
        (ChannelTotalSource("channel", 1), ChannelTotalSource("channel", 2)),
        MeasurementMethod.DIRECT,
        EnergyMode.BIDIRECTIONAL,
        TotalOutputSettings(True, True, True),
    )
    impact = estimate_configuration_impact(
        replace(configuration, aggregates=(aggregate,)), topology()
    )
    assert (
        impact.numeric_entity_count,
        impact.text_entity_count,
        impact.energy_entity_count,
    ) == (23, 6, 3)


def test_one_ct_doubled_aggregate_counts_one_visible_power_and_energy() -> None:
    configuration = request()
    aggregate = CircuitAggregate(
        "two-pole",
        "Two pole",
        CircuitRole.TWO_POLE,
        (ChannelTotalSource("channel", 1),),
        MeasurementMethod.ONE_CT_DOUBLE_POWER,
        EnergyMode.CONSUMPTION,
        TotalOutputSettings(True, False, True),
    )
    impact = estimate_configuration_impact(
        replace(configuration, aggregates=(aggregate,)), topology()
    )
    assert (
        impact.numeric_entity_count,
        impact.text_entity_count,
        impact.energy_entity_count,
    ) == (19, 6, 2)


def test_hidden_bidirectional_dependencies_are_not_publications() -> None:
    child = CircuitAggregate("child", "East wing", CircuitRole.BRANCH,
        (ChannelTotalSource("channel", 1),), MeasurementMethod.DIRECT,
        EnergyMode.BIDIRECTIONAL, TotalOutputSettings(False, False, True))
    parent = CircuitAggregate("parent", "Whole building", CircuitRole.BRANCH,
        (AggregateTotalSource("aggregate", "child"),), MeasurementMethod.DIRECT,
        EnergyMode.NONE, TotalOutputSettings(True, False, False))
    impact = estimate_configuration_impact(replace(request(), aggregates=(child, parent)), topology())
    assert (impact.public_total_entity_count, impact.internal_total_sensor_count) == (6, 3)
    assert (impact.numeric_entity_count, impact.energy_entity_count) == (20, 3)
