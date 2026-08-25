import math
from dataclasses import replace

import pytest

from custom_components.circuitsetup_energy_meter_helper.entity_binding import group_key
from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
    expected_meter_entity_evidence,
)
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
        for i in range(1, 6 * (addons + 1) + 1)
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


def test_expected_reconnect_entities_use_rendered_names_and_skip_internal_power() -> None:
    value = request()
    object.__setattr__(
        value,
        "aggregates",
        (
            CircuitAggregate(
                "grid",
                "Grid feed",
                CircuitRole.GRID,
                (1, 2),
                MeasurementMethod.DIRECT,
                None,
                EnergyMode.CONSUMPTION,
                expose_power=False,
                expose_current=True,
            ),
        ),
    )

    evidence = expected_meter_entity_evidence(value, topology())

    assert evidence.sensor_names == frozenset(
        {
            "Kitchen meter Main Voltage",
            "Kitchen meter Main Frequency",
            "Kitchen meter Grid feed Current",
            "Kitchen meter Grid feed Energy",
        }
    )
    assert evidence.object_ids == frozenset(
        {
            "kitchen_meter_main_voltage",
            "kitchen_meter_main_frequency",
            "kitchen_meter_grid_feed_current",
            "kitchen_meter_grid_feed_energy",
        }
    )


def test_expected_reconnect_entities_reject_native_object_id_collision() -> None:
    value = request()
    object.__setattr__(
        value,
        "aggregates",
        (
            CircuitAggregate(
                "first",
                "Grid!",
                CircuitRole.GRID,
                (1, 2),
                MeasurementMethod.DIRECT,
                None,
                EnergyMode.NONE,
            ),
            CircuitAggregate(
                "second",
                "Grid?",
                CircuitRole.SOLAR,
                (3, 4),
                MeasurementMethod.DIRECT,
                None,
                EnergyMode.NONE,
            ),
        ),
    )

    with pytest.raises(ValueError, match="object-ID collision"):
        expected_meter_entity_evidence(value, topology())


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
    for model in (VoltageReferenceConfig, MeterSettings, ChannelSettings, CircuitAggregate, MeterConfigurationRequest):
        fields = model.__slots__
        assert "board_revision" not in fields
        assert not any("harmonic" in field or "peak_current" in field for field in fields)
    assert math.isfinite(1.0)


@pytest.mark.parametrize("interval", [0, 3, 4, 6, 15, 61, 1.0, 5.0, True, False])
def test_invalid_update_intervals(interval: object) -> None:
    value = request()
    object.__setattr__(value.meter, "update_interval_s", interval)
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())


@pytest.mark.parametrize("frequency", [0, 49, 51, 61, 50.0, 60.0, True, False])
def test_invalid_line_frequencies(frequency: object) -> None:
    value = request()
    object.__setattr__(value.meter, "line_frequency_hz", frequency)
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())


@pytest.mark.parametrize("groups", [("main_1",), ("main_1", "main_1"), ("g1", "g2")])
def test_group_assignment_must_be_exact_and_canonical(groups: tuple[str, ...]) -> None:
    value = request()
    object.__setattr__(value.meter, "voltage_references", (replace(value.meter.voltage_references[0], group_keys=groups),))
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())


def test_reference_and_role_rules() -> None:
    value = request()
    object.__setattr__(value, "channels", (replace(value.channels[0], voltage_reference_id="missing"),) + value.channels[1:])
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())
    disabled = replace(value.channels[0], enabled=False, role=CircuitRole.UNUSED, voltage_reference_id="main")
    object.__setattr__(value, "channels", (disabled,) + value.channels[1:])
    validate_meter_configuration(value, topology())
    object.__setattr__(value, "channels", (replace(disabled, role=CircuitRole.BRANCH),) + value.channels[1:])
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())
    object.__setattr__(value, "channels", (replace(value.channels[0], enabled=True, role=CircuitRole.UNUSED),) + value.channels[1:])
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())


def _with_aggregate(value: MeterConfigurationRequest, aggregate: CircuitAggregate) -> MeterConfigurationRequest:
    object.__setattr__(value, "aggregates", (aggregate,))
    return value


@pytest.mark.parametrize("method,channels", [
    (MeasurementMethod.TWO_CT_SUM, (1,)),
    (MeasurementMethod.TWO_CT_SUM, (1, 2, 3)),
    (MeasurementMethod.ONE_CT_DOUBLE_POWER, (1, 2)),
    (MeasurementMethod.BOTH_CONDUCTORS_ONE_CT, (1, 2)),
])
def test_special_aggregate_cardinalities(method: MeasurementMethod, channels: tuple[int, ...]) -> None:
    value = request()
    aggregate = CircuitAggregate("grid", "Grid", CircuitRole.GRID, channels, method, None, EnergyMode.CONSUMPTION)
    with pytest.raises(ValueError):
        validate_meter_configuration(_with_aggregate(value, aggregate), topology())


def test_aggregate_invariants_and_direct_multi() -> None:
    value = request()
    valid = CircuitAggregate("grid", "Grid", CircuitRole.GRID, (1, 2), MeasurementMethod.DIRECT, None, EnergyMode.CONSUMPTION)
    validate_meter_configuration(_with_aggregate(value, valid), topology())
    for bad_id in ("Grid", "grid_value", "grid--x", ""):
        with pytest.raises(ValueError):
            validate_meter_configuration(_with_aggregate(request(), replace(valid, aggregate_id=bad_id)), topology())
    with pytest.raises(ValueError):
        validate_meter_configuration(_with_aggregate(request(), replace(valid, role="grid")), topology())
    with pytest.raises(ValueError):
        validate_meter_configuration(_with_aggregate(request(), replace(valid, channels=(1, 1))), topology())
    with pytest.raises(ValueError):
        validate_meter_configuration(_with_aggregate(request(), replace(valid, channels=(99,))), topology())
    disabled = replace(request().channels[0], enabled=False, role=CircuitRole.UNUSED)
    broken = request()
    object.__setattr__(broken, "channels", (disabled,) + broken.channels[1:])
    with pytest.raises(ValueError):
        validate_meter_configuration(_with_aggregate(broken, replace(valid, channels=(1,))), topology())
    duplicate = request()
    object.__setattr__(duplicate, "aggregates", (valid, replace(valid, name="Other")))
    with pytest.raises(ValueError):
        validate_meter_configuration(duplicate, topology())


def test_aggregates_reject_unused_channels_without_changing_ct_scaling() -> None:
    value = request()
    unused = replace(value.channels[2], enabled=False, role=CircuitRole.UNUSED)
    object.__setattr__(value, "channels", (*value.channels[:2], unused, *value.channels[3:]))
    aggregate = CircuitAggregate(
        "dryer", "Dryer", CircuitRole.TWO_POLE, (3,),
        MeasurementMethod.ONE_CT_DOUBLE_POWER, None, EnergyMode.CONSUMPTION,
    )

    with pytest.raises(ValueError, match="enabled channels"):
        validate_meter_configuration(_with_aggregate(value, aggregate), topology())
    assert unused.reporting_multiplier == 1.0


@pytest.mark.parametrize("method,channels", [
    (MeasurementMethod.TWO_CT_SUM, (1, 2)),
    (MeasurementMethod.ONE_CT_DOUBLE_POWER, (1,)),
    (MeasurementMethod.BOTH_CONDUCTORS_ONE_CT, (1,)),
])
def test_special_aggregate_cardinalities_accept_valid_enabled_channels(
    method: MeasurementMethod, channels: tuple[int, ...]
) -> None:
    aggregate = CircuitAggregate("grid", "Grid", CircuitRole.GRID, channels, method, None, EnergyMode.CONSUMPTION)
    validate_meter_configuration(_with_aggregate(request(), aggregate), topology())


def test_parent_existence_and_cycles() -> None:
    child = CircuitAggregate("child", "Child", CircuitRole.BRANCH, (1,), MeasurementMethod.DIRECT, "missing", EnergyMode.CONSUMPTION)
    with pytest.raises(ValueError):
        validate_meter_configuration(_with_aggregate(request(), child), topology())
    cycle = replace(child, parent_id="child")
    with pytest.raises(ValueError):
        validate_meter_configuration(_with_aggregate(request(), cycle), topology())


def test_board_options_and_multi_reference_acknowledgement() -> None:
    value = request(addons=1)
    for field in ("power_quality", "status_fields"):
        object.__setattr__(value, field, (True,))
        with pytest.raises(ValueError):
            validate_meter_configuration(value, topology(1))
        object.__setattr__(value, field, (True, "yes"))
        with pytest.raises(ValueError):
            validate_meter_configuration(value, topology(1))
        object.__setattr__(value, field, (False, False))
    value = request()
    first = value.meter.voltage_references[0]
    refs = (replace(first, group_keys=("main_1",)), replace(first, reference_id="alt", group_keys=("main_2",)))
    object.__setattr__(value.meter, "voltage_references", refs)
    object.__setattr__(value, "multi_reference_preparation_acknowledged", False)
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())
    validate_meter_configuration(
        value, topology(), require_multi_reference_acknowledgement=False
    )
    object.__setattr__(value, "multi_reference_preparation_acknowledged", True)
    validate_meter_configuration(value, topology())
    object.__setattr__(value, "multi_reference_preparation_acknowledged", 1)
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())


@pytest.mark.parametrize("field,value", [
    ("friendly_name", "x" * 65),
    ("friendly_name", "x\x00"),
    ("nominal_voltage_v", math.nan),
    ("nominal_voltage_v", 0),
    ("nominal_voltage_v", 601),
    ("gain_voltage", True),
    ("gain_voltage", 0),
    ("gain_voltage", 65536),
])
def test_numeric_name_and_control_bounds(field: str, value: object) -> None:
    request_value = request()
    if field == "friendly_name":
        object.__setattr__(request_value.meter, field, value)
    else:
        reference = replace(request_value.meter.voltage_references[0], **{field: value})
        object.__setattr__(request_value.meter, "voltage_references", (reference,))
    with pytest.raises(ValueError):
        validate_meter_configuration(request_value, topology())


@pytest.mark.parametrize("multiplier", [math.nan, 0, 3, True])
def test_reporting_multiplier_must_be_finite_and_allowed(multiplier: object) -> None:
    value = request()
    object.__setattr__(value, "channels", (replace(value.channels[0], reporting_multiplier=multiplier),) + value.channels[1:])
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())


@pytest.mark.parametrize("gain", [0, 65536, True])
def test_custom_gain_bounds(gain: object) -> None:
    value = request()
    object.__setattr__(value, "channels", (replace(value.channels[0], custom_gain_ct=gain),) + value.channels[1:])
    with pytest.raises(ValueError):
        validate_meter_configuration(value, topology())
