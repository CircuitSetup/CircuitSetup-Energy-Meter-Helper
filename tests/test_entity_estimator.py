"""Tests for configuration entity-impact estimates."""

from dataclasses import replace

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
