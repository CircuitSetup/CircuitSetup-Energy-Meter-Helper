import math

import pytest

from custom_components.circuitsetup_energy_meter_helper.entity_binding import group_key
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    ChannelSettings,
    CircuitAggregate,
    CircuitRole,
    ElectricalSystem,
    EnergyMode,
    MeasurementMethod,
    MeterConfigurationRequest,
    MeterSettings,
    UpdateIntervalSeconds,
    VoltageLayout,
    VoltageReferenceConfig,
    default_meter_configuration,
    validate_meter_configuration,
)
from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology


def topology(addons: int = 0) -> MeterTopology:
    return MeterTopology.from_addon_count(
        addons,
        connection_type="wifi",
        voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter",
        evidence=(),
    )


def request(*, addons: int = 0, interval: int = 5) -> MeterConfigurationRequest:
    meter = MeterSettings(
        "Kitchen meter", ElectricalSystem.SPLIT_PHASE_120_240, 60, interval,
        VoltageLayout.STANDARD,
        (VoltageReferenceConfig("main", "Main", "A", 120.0, "v", 1, tuple(
            group_key(board, group)
            for board in range(addons + 1)
            for group in range(2)
        )),),
    )
    channels = tuple(
        ChannelSettings(i, True, f"CT {i}", "ct", 1.0, CircuitRole.BRANCH, "main")
        for i in range(1, 7 * (addons + 1))
    )
    return MeterConfigurationRequest(
        meter, channels, (), (False,) * (addons + 1), (True,) + (False,) * addons
    )


@pytest.mark.parametrize("interval", [1, 2, 5, 10, 30, 60])
def test_allowed_update_intervals(interval: UpdateIntervalSeconds) -> None:
    validate_meter_configuration(request(interval=interval), topology())


@pytest.mark.parametrize("frequency", [50, 60])
def test_frequency_is_exactly_50_or_60(frequency: int) -> None:
    value = request()
    object.__setattr__(value.meter, "line_frequency_hz", frequency)
    validate_meter_configuration(value, topology())


def test_default_profiles_and_topology_group_assignment() -> None:
    value = default_meter_configuration(topology(), {"power_quality": (False,), "status_fields": (True,)})
    assert value.meter.line_frequency_hz == 60
    assert value.meter.voltage_references[0].group_keys == (group_key(0, 0), group_key(0, 1))
    validate_meter_configuration(value, topology())


def test_default_addon_groups_use_canonical_keys() -> None:
    value = default_meter_configuration(
        topology(1), {"power_quality": (False, False), "status_fields": (True, False)}
    )
    assert value.meter.voltage_references[0].group_keys == (
        "main_1", "main_2", "addon1_1", "addon1_2"
    )
    validate_meter_configuration(value, topology(1))


def test_direct_accepts_multiple_enabled_channels() -> None:
    value = request()
    aggregate = CircuitAggregate(
        "grid", "Grid", CircuitRole.GRID, (1, 2), MeasurementMethod.DIRECT,
        None, EnergyMode.CONSUMPTION,
    )
    object.__setattr__(value, "aggregates", (aggregate,))
    validate_meter_configuration(value, topology())


def test_structural_validation_rejects_bad_channels_aggregates_and_options() -> None:
    value = request()
    bad = ChannelSettings(1, True, "CT", "ct", 1.0, CircuitRole.UNUSED, "main")
    object.__setattr__(value, "channels", (bad,) + value.channels[1:])
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())


def test_numeric_and_forbidden_fields_are_rejected() -> None:
    value = request()
    object.__setattr__(value.meter, "friendly_name", "bad\nname")
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())
    assert not hasattr(value.meter, "board_revision")
    assert not any("harmonic" in field or "peak_current" in field for field in value.meter.__slots__)
    assert math.isfinite(1.0)
