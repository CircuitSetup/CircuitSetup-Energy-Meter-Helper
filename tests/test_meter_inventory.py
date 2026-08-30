"""Tests for firmware configuration capability discovery."""

import json
from base64 import urlsafe_b64encode
from dataclasses import fields, replace
from hashlib import sha256
from types import SimpleNamespace

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.ct_catalog import (
    CTPresetCatalog,
)
from custom_components.circuitsetup_energy_meter_helper.diagnostics import (
    DiagnosticsTracker,
    capture_diagnostics_snapshot,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    CircuitAggregate,
    CircuitRole,
    EnergyMode,
    MeasurementMethod,
)
from custom_components.circuitsetup_energy_meter_helper.meter_inventory import (
    MeterConfigurationCapabilities,
    MeterConfigurationInventory,
    meter_configuration_capabilities,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    StoredMeterConfiguration,
)
from custom_components.circuitsetup_energy_meter_helper.topology import (
    topology_from_config,
)
from custom_components.circuitsetup_energy_meter_helper.voltage_transformer_catalog import (
    VoltageTransformerCatalog,
)


def test_capability_model_has_exact_frozen_slots_contract() -> None:
    assert tuple(field.name for field in fields(MeterConfigurationCapabilities)) == (
        "configuration_authoritative",
        "managed_totals",
        "multi_reference",
        "semantic_source",
        "reason_codes",
    )
    assert hasattr(MeterConfigurationCapabilities, "__slots__")
    assert not hasattr(
        MeterConfigurationCapabilities(True, True, True, "helper_managed", ()), "__dict__"
    )


@pytest.mark.parametrize(
    ("authoritative", "contract", "expected"),
    (
        (False, 2, (False, False, ("configuration_not_authoritative",))),
        (False, None, (False, False, ("configuration_not_authoritative",))),
        (True, 2, (True, True, ())),
        (True, 1, (False, True, ("config_contract_upgrade_required",))),
        (True, None, (False, True, ("config_contract_upgrade_required",))),
    ),
)
def test_capabilities_follow_contract_truth_table(
    authoritative: bool,
    contract: int | None,
    expected: tuple[bool, bool, tuple[str, ...]],
) -> None:
    value = meter_configuration_capabilities(
        configuration_authoritative=authoritative, config_contract=contract
    )
    assert (value.managed_totals, value.multi_reference, value.reason_codes) == expected
    assert value.configuration_authoritative is authoritative


@pytest.mark.parametrize(
    ("authoritative", "contract"),
    ((1, 2), (True, True), (False, 2.0), (False, "2"), ("true", None)),
)
def test_capability_inputs_require_exact_bool_and_int_types(
    authoritative: object, contract: object
) -> None:
    with pytest.raises(TypeError):
        meter_configuration_capabilities(
            configuration_authoritative=authoritative, config_contract=contract
        )


def _document(
    *,
    contract: bool = False,
    generic_totals: bool = False,
    addon_count: int = 0,
    two_voltages: bool = False,
    voltage_cal1: int = 7305,
    voltage_cal2: int | None = None,
) -> str:
    addon_suffix = f"-{addon_count}-addon{'s' if addon_count != 1 else ''}" if addon_count else ""
    voltage_suffix = "-2-voltages" if two_voltages else ""
    packages = (
        "  files:\n"
        "    - Software/ESPHome/meter_sensors/6chan_main_sensor.yaml\n"
        "    - Software/ESPHome/power_quality/6chan_main_power_quality.yaml\n"
        "    - Software/ESPHome/status_fields/6chan_main_status.yaml\n"
        + "".join(
            f"    - Software/ESPHome/meter_sensors/6chan_addon{index}.yaml\n"
            for index in range(1, addon_count + 1)
        )
    )
    substitutions = "".join(
        f"  ct{channel}_name: {'Grid' if channel == 1 else f'Load {channel}'}\n"
        f"  current_cal_ct{channel}: {27518 + channel}\n"
        for channel in range(1, 6 * (addon_count + 1) + 1)
    )
    return (
        "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter"
        f"{addon_suffix}{voltage_suffix}\n"
        "packages:\n"
        f"{packages}"
        "substitutions:\n"
        "  friendly_name: Garage Meter\n"
        "  update_time: 10s\n"
        "  electric_freq: 60Hz\n"
        + ("  csemh_config_contract: '2'\n" if contract else "")
        + f"  voltage_cal1: {voltage_cal1}\n"
        + (f"  voltage_cal2: {voltage_cal2}\n" if voltage_cal2 else "")
        + substitutions
        + ("sensor:\n  - id: totalWatts\n" if generic_totals else "")
    )


def _inventory(
    content: str,
    *,
    stored: StoredMeterConfiguration | None = None,
    authoritative: bool = True,
) -> MeterConfigurationInventory:
    document = ESPHomeConfigDocument.parse(content)
    return MeterConfigurationInventory.from_document(
        "a" * 32,
        document,
        topology_from_config(document),
        CTPresetCatalog.load(),
        VoltageTransformerCatalog.load(),
        sha256(content.encode()).hexdigest(),
        stored_configuration=stored,
        configuration_authoritative=authoritative,
    )


def _helper_mains_total() -> str:
    return (
        "sensor:\n"
        "# CircuitSetup Energy Meter Helper: aggregates v1\n"
        "  - id: !extend totalEnergyDaily\n"
        "    internal: true\n"
        "  - platform: template\n"
        "    id: csemh_mains1_power\n"
        '    name: "${friendly_name} Mains Power"\n'
        "    lambda: return std::max(0.0f, id(ct1Watts).state + id(ct2Watts).state);\n"
        "    unit_of_measurement: W\n"
        "    device_class: power\n"
        "    update_interval: ${update_time}\n"
        "  - platform: total_daily_energy\n"
        "    id: csemh_mains1_energy\n"
        '    name: "${friendly_name} Mains Energy"\n'
        "    power_id: csemh_mains1_power\n"
        "    filters:\n"
        "      - multiply: 0.001\n"
        "    unit_of_measurement: kWh\n"
        "    device_class: energy\n"
        "    state_class: total_increasing\n"
        "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
    )


def test_inventory_has_server_plan_and_catalog_fields() -> None:
    inventory = _inventory(_document())

    field_names = tuple(field.name for field in fields(MeterConfigurationInventory))
    assert field_names[:8] == (
        "plan_id",
        "source_sha256",
        "topology",
        "configuration",
        "capabilities",
        "voltage_transformer_catalog",
        "ct_catalog",
        "warnings",
    )
    assert inventory.plan_id == "a" * 32
    assert inventory.ct_catalog is inventory.ct_inventory.catalog
    assert inventory.automatic_candidates == ()
    assert inventory.automatic_totals == ()
    assert inventory.stale_automatic_total_settings == ()


def test_inventory_without_stored_configuration_is_legacy_inferred() -> None:
    assert _inventory(_document()).capabilities.semantic_source == "legacy_inferred"


def test_helper_owned_total_is_recovered_when_matching_storage_is_empty() -> None:
    """An empty store record must not hide an aggregate present in owned YAML."""
    content = _document(contract=True) + _helper_mains_total()
    baseline = _inventory(content).configuration
    channels = tuple(
        replace(
            channel,
            role=CircuitRole.GRID if channel.channel in (1, 2) else CircuitRole.BRANCH,
        )
        for channel in baseline.channels
    )
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        baseline.meter,
        channels,
        (),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert inventory.configuration.aggregates[:1] == (
        CircuitAggregate(
            "mains1",
            "Mains",
            CircuitRole.GRID,
            (1, 2),
            MeasurementMethod.TWO_CT_SUM,
            None,
            EnergyMode.CONSUMPTION,
        ),
    )
    assert inventory.configuration.aggregates[1].aggregate_id == "main-total"
    assert "aggregate_semantics_inferred" in inventory.warnings


def test_malformed_owned_total_metadata_fails_closed() -> None:
    """Untrusted metadata must not make inventory parsing fail."""
    data = {
        "aggregate_id": [],
        "name": "Mains",
        "role": "grid",
        "channels": [1, 2],
        "measurement_method": "two_ct_sum",
        "parent_id": None,
        "energy_mode": "consumption",
        "expose_power": True,
        "expose_current": False,
        "order": 0,
    }
    metadata = urlsafe_b64encode(
        json.dumps(data, separators=(",", ":"), sort_keys=True).encode()
    ).decode().rstrip("=")
    block = _helper_mains_total().replace(
        "# CircuitSetup Energy Meter Helper: aggregates v1\n",
        "# CircuitSetup Energy Meter Helper: aggregates v1\n"
        f"  # csemh-aggregate: {metadata}\n",
    )

    inventory = _inventory(_document(contract=True) + block)

    assert inventory.configuration.aggregates == ()
    assert "aggregate_semantics_unreadable" in inventory.warnings


def test_builtin_meter_totals_require_power_id_before_enabling_energy() -> None:
    """An ambiguous daily-energy ID must not be attached without its power source."""
    content = _document(contract=True).replace(
        "    - Software/ESPHome/meter_sensors/6chan_main_sensor.yaml\n", ""
    ) + (
        "sensor:\n"
        "  - id: totalAmps\n"
        "  - id: totalWatts\n"
        "  - id: totalEnergyDaily\n"
    )

    inventory = _inventory(content)

    assert inventory.configuration.aggregates == (
        CircuitAggregate(
            "meter-total",
            "Meter total",
            CircuitRole.CUSTOM,
            (1, 2, 3, 4, 5, 6),
            MeasurementMethod.DIRECT,
            None,
            EnergyMode.NONE,
            True,
            True,
        ),
    )
    assert "builtin_total_semantics_inferred" in inventory.warnings


def test_default_main_totals_are_detected_with_independent_energy() -> None:
    """Package totals and the root kWh sensor become one editable Main total."""
    content = _document(contract=True) + (
        "sensor:\n"
        "  - platform: total_daily_energy\n"
        "    id: totalEnergyDaily\n"
        "    power_id: totalWattsMain\n"
        "    unit_of_measurement: kWh\n"
    )

    inventory = _inventory(content)

    assert inventory.configuration.aggregates == (
        CircuitAggregate(
            "main-total",
            "Main total",
            CircuitRole.CUSTOM,
            (1, 2, 3, 4, 5, 6),
            MeasurementMethod.DIRECT,
            None,
            EnergyMode.CONSUMPTION,
            False,
            False,
        ),
    )


def test_default_totals_are_grouped_by_board_and_kwh_power_id() -> None:
    """A daily-energy item belongs only to the board power total it references."""
    content = _document(contract=True, addon_count=1) + (
        "sensor:\n"
        "  - platform: total_daily_energy\n"
        "    id: totalEnergyDaily\n"
        "    power_id: totalWattsAddOn1\n"
        "    unit_of_measurement: kWh\n"
        "  - platform: total_daily_energy\n"
        "    id: unrelatedEnergyDaily\n"
        "    power_id: customWatts\n"
        "    unit_of_measurement: kWh\n"
    )

    inventory = _inventory(content)

    assert inventory.configuration.aggregates == (
        CircuitAggregate(
            "main-total", "Main total", CircuitRole.CUSTOM,
            (1, 2, 3, 4, 5, 6), MeasurementMethod.DIRECT,
            None, EnergyMode.NONE, False, False,
        ),
        CircuitAggregate(
            "addon1-total", "Add-on 1 total", CircuitRole.CUSTOM,
            (7, 8, 9, 10, 11, 12), MeasurementMethod.DIRECT,
            None, EnergyMode.CONSUMPTION, False, False,
        ),
    )


def test_helper_and_official_totals_populate_together_with_global_visibility() -> None:
    """Only explicitly hidden outputs disappear when owned and official totals coexist."""
    content = _document(contract=True, addon_count=1) + _helper_mains_total() + (
        "  - id: totalAmps\n"
        "  - id: totalWatts\n"
        "  - platform: total_daily_energy\n"
        "    id: totalEnergyDaily\n"
        "    power_id: totalWatts\n"
        "    unit_of_measurement: kWh\n"
    )

    aggregates = {
        aggregate.aggregate_id: aggregate
        for aggregate in _inventory(content).configuration.aggregates
    }

    assert set(aggregates) == {"mains1", "meter-total", "main-total", "addon1-total"}
    assert aggregates["meter-total"] == CircuitAggregate(
        "meter-total", "Meter total", CircuitRole.CUSTOM,
        tuple(range(1, 13)), MeasurementMethod.DIRECT,
        None, EnergyMode.NONE, True, True,
    )
    for aggregate_id in ("main-total", "addon1-total"):
        assert aggregates[aggregate_id].expose_power is False
        assert aggregates[aggregate_id].expose_current is False
        assert aggregates[aggregate_id].energy_mode is EnergyMode.NONE


def test_custom_template_totals_preserve_channels_names_and_visibility() -> None:
    """Root template sums are editable even when HA hides one output."""
    content = _document(contract=True, addon_count=1) + (
        "sensor:\n"
        "  - platform: template\n"
        "    id: totalAmps\n"
        "    name: House Total Amps\n"
        "    internal: true\n"
        "    lambda: return id(ct1Amps).state + id(ct2Amps).state ;\n"
        "    unit_of_measurement: A\n"
        "    device_class: current\n"
        "  - platform: template\n"
        "    id: totalWatts\n"
        "    name: House Total Watts\n"
        "    lambda: return id(ct1Watts).state + id(ct2Watts).state ;\n"
        "    unit_of_measurement: W\n"
        "    device_class: power\n"
        "  - platform: template\n"
        "    id: totalChargerWatts\n"
        "    name: Total Charger Watts\n"
        "    lambda: return id(ct5Watts).state + id(ct6Watts).state ;\n"
        "    unit_of_measurement: W\n"
        "    device_class: power\n"
        "  - platform: template\n"
        "    id: totalAC1Watts\n"
        "    name: Total AC1 Watts\n"
        "    internal: true\n"
        "    lambda: return id(ct7Watts).state + id(ct8Watts).state ;\n"
        "    unit_of_measurement: W\n"
        "    device_class: power\n"
    )

    aggregates = {
        aggregate.aggregate_id: aggregate
        for aggregate in _inventory(content).configuration.aggregates
    }

    assert aggregates["meter-total"] == CircuitAggregate(
        "meter-total", "House Total", CircuitRole.CUSTOM,
        (1, 2), MeasurementMethod.TWO_CT_SUM,
        None, EnergyMode.NONE, True, False,
    )
    assert aggregates["total-charger"] == CircuitAggregate(
        "total-charger", "Total Charger", CircuitRole.CUSTOM,
        (5, 6), MeasurementMethod.TWO_CT_SUM,
        None, EnergyMode.NONE, True, False,
    )
    assert aggregates["total-ac1"] == CircuitAggregate(
        "total-ac1", "Total AC1", CircuitRole.CUSTOM,
        (7, 8), MeasurementMethod.TWO_CT_SUM,
        None, EnergyMode.NONE, False, False,
    )
    for aggregate_id in ("main-total", "addon1-total"):
        assert aggregates[aggregate_id].expose_power is False
        assert aggregates[aggregate_id].expose_current is False


def test_parent_template_total_links_default_board_calculations() -> None:
    """Default board-total references become editable parent relationships."""
    content = _document(contract=True, addon_count=1) + (
        "sensor:\n"
        "  - platform: template\n"
        "    id: totalWatts\n"
        "    name: House Total Watts\n"
        "    lambda: return id(totalWattsMain).state + id(totalWattsAddOn1).state;\n"
        "    unit_of_measurement: W\n"
        "    device_class: power\n"
        "  - platform: template\n"
        "    id: totalAmps\n"
        "    name: House Total Amps\n"
        "    lambda: return id(totalAmpsMain).state + id(totalAmpsAddOn1).state;\n"
        "    unit_of_measurement: A\n"
        "    device_class: current\n"
    )

    aggregates = {
        aggregate.aggregate_id: aggregate
        for aggregate in _inventory(content).configuration.aggregates
    }

    assert aggregates["meter-total"].channels == tuple(range(1, 13))
    assert aggregates["main-total"].parent_id == "meter-total"
    assert aggregates["addon1-total"].parent_id == "meter-total"


def test_global_daily_energy_is_detected_in_a_later_root_sensor_section() -> None:
    """ESPHome accepts repeated root sensor sections in existing meter files."""
    content = _document(contract=True) + (
        "sensor:\n"
        "  - id: unrelatedPower\n"
        "binary_sensor:\n"
        "  - platform: template\n"
        "    id: online\n"
        "sensor:\n"
        "- id: totalWatts\n"
        "- platform: total_daily_energy\n"
        "  id: totalEnergyDaily\n"
        "  power_id: totalWatts\n"
        "  filters:\n"
        "  - multiply: 0.001\n"
        "  unit_of_measurement: kWh\n"
    )

    aggregates = {
        aggregate.aggregate_id: aggregate
        for aggregate in _inventory(content).configuration.aggregates
    }

    assert aggregates["meter-total"].energy_mode is EnergyMode.CONSUMPTION


@pytest.mark.parametrize("interval", (1, 2, 5, 10, 30, 60))
def test_inventory_warns_only_for_installed_slow_calibration_intervals(
    interval: int,
) -> None:
    content = _document(contract=True).replace(
        "  update_time: 10s\n", f"  update_time: {interval}s\n"
    )
    baseline = _inventory(content).configuration
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        replace(baseline.meter, update_interval_s=interval),
        baseline.channels,
        baseline.aggregates,
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert inventory.capabilities.semantic_source == "helper_managed"

    assert ("slow_interval_extends_calibration" in inventory.warnings) is (
        interval in (30, 60)
    )


def test_invalid_stored_configuration_falls_back_to_legacy_inferred() -> None:
    content = _document()
    baseline = _inventory(content).configuration
    invalid = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        baseline.meter,
        baseline.channels[:-1],
        baseline.aggregates,
        baseline.power_quality,
        baseline.status_fields,
    )
    inventory = _inventory(content, stored=invalid)
    assert inventory.capabilities.semantic_source == "legacy_inferred"


@pytest.mark.parametrize("interval", (1, 10, 30, 60))
def test_legacy_inventory_warns_from_installed_snapshot_interval(
    interval: int,
) -> None:
    inventory = _inventory(
        _document().replace("  update_time: 10s\n", f"  update_time: {interval}s\n")
    )

    assert ("slow_interval_extends_calibration" in inventory.warnings) is (
        interval in (30, 60)
    )


def test_legacy_inventory_keeps_yaml_ct_values_and_requires_electrical_confirmation() -> (
    None
):
    """Changing legacy names into inferred circuit roles must fail this contract."""
    content = _document(generic_totals=True).replace(
        "    - Software/ESPHome/meter_sensors/6chan_main_sensor.yaml\n", ""
    )
    inventory = _inventory(content)

    assert [channel.name for channel in inventory.ct_inventory.channels] == [
        "Grid",
        "Load 2",
        "Load 3",
        "Load 4",
        "Load 5",
        "Load 6",
    ]
    assert [channel.raw_gain_ct for channel in inventory.ct_inventory.channels] == [
        27519,
        27520,
        27521,
        27522,
        27523,
        27524,
    ]
    assert all(channel.enabled for channel in inventory.configuration.channels)
    assert {channel.role for channel in inventory.configuration.channels} == {
        CircuitRole.BRANCH
    }
    assert inventory.configuration.meter.electrical_system.value == "custom"
    assert inventory.configuration.meter.line_frequency_hz == 60
    assert inventory.configuration.meter.update_interval_s == 10
    assert inventory.voltage_topology.references == (("main", ("main_1", "main_2")),)
    assert inventory.configuration.aggregates == (
        CircuitAggregate(
            "meter-total", "Meter total", CircuitRole.CUSTOM,
            (1, 2, 3, 4, 5, 6), MeasurementMethod.DIRECT,
            None, EnergyMode.NONE, True, False,
        ),
    )
    assert inventory.configuration.power_quality == (True,)
    assert inventory.configuration.status_fields == (True,)
    assert {
        "electrical_profile_requires_confirmation",
        "legacy_generic_totals_unmanaged",
        "config_contract_upgrade_required",
    } <= set(inventory.warnings)


def test_diagnostics_maps_production_legacy_totals_inventory_warning() -> None:
    """The public diagnostics code follows the inventory's production spelling."""
    tracker = DiagnosticsTracker()
    tracker.record_result("get_meter_configuration", _inventory(_document(generic_totals=True)))

    assert "legacy_totals_unmanaged" in capture_diagnostics_snapshot(
        entry=SimpleNamespace(version=1),
        runtime={"diagnostics": tracker},
        integration_version="0.1.0",
    ).public()["error_codes"]


def test_matching_stored_semantics_restore_roles_reference_mapping_and_aggregates() -> (
    None
):
    """Removing hash-bound roles or aggregates must change this user-visible plan."""
    content = _document(contract=True)
    baseline = _inventory(content).configuration
    voltage_references = (
        replace(
            baseline.meter.voltage_references[0],
            reference_id="grid",
            group_keys=("main_1",),
        ),
        replace(
            baseline.meter.voltage_references[0],
            reference_id="loads",
            group_keys=("main_2",),
        ),
    )
    channels = tuple(
        replace(
            channel,
            role=CircuitRole.GRID if channel.channel == 1 else CircuitRole.BRANCH,
            voltage_reference_id="grid" if channel.channel <= 3 else "loads",
        )
        for channel in baseline.channels
    )
    aggregate = CircuitAggregate(
        "grid",
        "Grid",
        CircuitRole.GRID,
        (1,),
        MeasurementMethod.DIRECT,
        None,
        EnergyMode.BIDIRECTIONAL,
    )
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        replace(
            baseline.meter,
            electrical_system=baseline.meter.electrical_system.SPLIT_PHASE_120_240,
            voltage_layout=baseline.meter.voltage_layout.MULTI_REFERENCE,
            voltage_references=voltage_references,
        ),
        channels,
        (aggregate,),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert inventory.configuration.channels == channels
    assert aggregate in inventory.configuration.aggregates
    assert inventory.configuration.meter.voltage_references == voltage_references
    assert inventory.voltage_topology.references == (
        ("grid", ("main_1",)),
        ("loads", ("main_2",)),
    )
    assert "electrical_profile_requires_confirmation" not in inventory.warnings


@pytest.mark.parametrize("addon_count", (0, 1))
def test_matching_single_reference_restores_semantics_when_physical_gains_agree(
    addon_count: int,
) -> None:
    """One logical reference may losslessly span both physical gain groups."""
    content = _document(
        contract=True,
        addon_count=addon_count,
        voltage_cal1=7001,
        voltage_cal2=7001,
    )
    baseline = _inventory(content).configuration
    aggregate = CircuitAggregate(
        "grid",
        "Grid",
        CircuitRole.GRID,
        (1,),
        MeasurementMethod.DIRECT,
        None,
        EnergyMode.BIDIRECTIONAL,
    )
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        baseline.meter,
        tuple(
            replace(
                channel,
                role=CircuitRole.GRID
                if channel.channel == 1
                else CircuitRole.BRANCH,
            )
            for channel in baseline.channels
        ),
        (aggregate,),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert inventory.configuration.meter.voltage_references[0].gain_voltage == 7001
    assert inventory.configuration.channels[0].role is CircuitRole.GRID
    assert aggregate in inventory.configuration.aggregates
    assert not inventory.configuration.multi_reference_preparation_acknowledged
    assert "stored_semantics_stale" not in inventory.warnings


def test_single_reference_with_divergent_physical_gains_is_stale() -> None:
    """One gain field cannot preserve two different physical group gains."""
    content = _document(contract=True, voltage_cal1=7001, voltage_cal2=8002)
    baseline = _inventory(content).configuration
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        baseline.meter,
        tuple(replace(channel, role=CircuitRole.GRID) for channel in baseline.channels),
        (),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert {channel.role for channel in inventory.configuration.channels} == {
        CircuitRole.BRANCH
    }
    assert "stored_semantics_stale" in inventory.warnings


def test_legacy_and_stored_multi_reference_inventory_never_claims_preparation() -> None:
    content = _document(
        contract=True,
        two_voltages=True,
        voltage_cal1=7001,
        voltage_cal2=8002,
    )
    legacy = _inventory(content)
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        legacy.configuration.meter,
        legacy.configuration.channels,
        (),
        legacy.configuration.power_quality,
        legacy.configuration.status_fields,
    )

    restored = _inventory(content, stored=stored)

    assert not legacy.configuration.multi_reference_preparation_acknowledged
    assert not restored.configuration.multi_reference_preparation_acknowledged
    assert "stored_semantics_stale" not in restored.warnings


def test_matching_stored_channels_merge_by_channel_identity_not_tuple_order() -> None:
    """Zipping reordered storage into YAML channel order would cross-wire circuit roles."""
    content = _document(contract=True)
    baseline = _inventory(content).configuration
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        replace(
            baseline.meter,
            voltage_references=(
                replace(
                    baseline.meter.voltage_references[0],
                    reference_id="first",
                    group_keys=("main_1",),
                ),
                replace(
                    baseline.meter.voltage_references[0],
                    reference_id="second",
                    group_keys=("main_2",),
                ),
            ),
        ),
        tuple(
            replace(
                channel,
                role=CircuitRole.GRID if channel.channel == 1 else CircuitRole.BRANCH,
                voltage_reference_id="first" if channel.channel <= 3 else "second",
            )
            for channel in reversed(baseline.channels)
        ),
        (),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert inventory.configuration.channels[0].channel == 1
    assert inventory.configuration.channels[0].role is CircuitRole.GRID
    assert all(
        channel.role is CircuitRole.BRANCH
        for channel in inventory.configuration.channels[1:]
    )
    assert "stored_semantics_stale" not in inventory.warnings


def test_matching_stored_voltage_references_merge_gains_by_groups_not_tuple_order() -> (
    None
):
    """Reversing stored references must not swap physical voltage calibrations."""
    content = _document(
        contract=True,
        addon_count=1,
        two_voltages=True,
        voltage_cal1=7001,
        voltage_cal2=8002,
    )
    baseline = _inventory(content).configuration
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        replace(
            baseline.meter,
            voltage_references=tuple(reversed(baseline.meter.voltage_references)),
        ),
        baseline.channels,
        (),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert [
        (reference.reference_id, reference.gain_voltage)
        for reference in inventory.configuration.meter.voltage_references
    ] == [("secondary", 8002), ("main", 7001)]
    assert "stored_semantics_stale" not in inventory.warnings


def test_standard_helper_references_map_gains_by_group_suffix_across_addons() -> None:
    """Standard projects still use distinct physical calibrations for _1 and _2."""
    content = _document(
        contract=True,
        addon_count=1,
        voltage_cal1=7001,
        voltage_cal2=8002,
    )
    baseline = _inventory(content).configuration
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        replace(
            baseline.meter,
            voltage_references=(
                replace(
                    baseline.meter.voltage_references[0],
                    reference_id="first",
                    group_keys=("main_1", "addon1_1"),
                ),
                replace(
                    baseline.meter.voltage_references[0],
                    reference_id="second",
                    group_keys=("main_2", "addon1_2"),
                ),
            ),
        ),
        tuple(
            replace(
                channel,
                voltage_reference_id=(
                    "first" if (channel.channel - 1) % 6 < 3 else "second"
                ),
            )
            for channel in baseline.channels
        ),
        (),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert [
        (reference.reference_id, reference.gain_voltage, reference.group_keys)
        for reference in inventory.configuration.meter.voltage_references
    ] == [
        ("first", 7001, ("main_1", "addon1_1")),
        ("second", 8002, ("main_2", "addon1_2")),
    ]
    assert "stored_semantics_stale" not in inventory.warnings


def test_matching_stored_voltage_references_allow_scrambled_group_order() -> None:
    """Reordering groups within each physical reference must keep its calibration."""
    content = _document(
        contract=True,
        addon_count=1,
        two_voltages=True,
        voltage_cal1=7001,
        voltage_cal2=8002,
    )
    baseline = _inventory(content).configuration
    secondary, main = reversed(baseline.meter.voltage_references)
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        replace(
            baseline.meter,
            voltage_references=(
                replace(secondary, group_keys=("addon1_2", "main_2")),
                replace(main, group_keys=("addon1_1", "main_1")),
            ),
        ),
        baseline.channels,
        (),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert [
        (reference.reference_id, reference.gain_voltage, reference.group_keys)
        for reference in inventory.configuration.meter.voltage_references
    ] == [
        ("secondary", 8002, ("addon1_2", "main_2")),
        ("main", 7001, ("addon1_1", "main_1")),
    ]
    assert "stored_semantics_stale" not in inventory.warnings


def test_ambiguous_stored_voltage_reference_groups_fall_back_to_legacy_defaults() -> (
    None
):
    """A valid helper grouping without physical calibration provenance is stale."""
    content = _document(
        contract=True,
        addon_count=1,
        two_voltages=True,
        voltage_cal1=7001,
        voltage_cal2=8002,
    )
    baseline = _inventory(content).configuration
    main, secondary = baseline.meter.voltage_references
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        replace(
            baseline.meter,
            voltage_references=(
                replace(main, group_keys=("main_1", "main_2")),
                replace(secondary, group_keys=("addon1_1", "addon1_2")),
            ),
        ),
        baseline.channels,
        (),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert inventory.voltage_topology.references == (
        ("main", ("main_1", "addon1_1")),
        ("secondary", ("main_2", "addon1_2")),
    )
    assert "stored_semantics_stale" in inventory.warnings


def test_invalid_matching_stored_semantics_fall_back_to_legacy_defaults() -> None:
    """Returning an invalid hash-matching reference would publish an unusable plan."""
    content = _document(contract=True)
    baseline = _inventory(content).configuration
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        baseline.meter,
        (replace(baseline.channels[0], voltage_reference_id="missing"), *baseline.channels[1:]),
        (),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert {channel.role for channel in inventory.configuration.channels} == {
        CircuitRole.BRANCH
    }
    assert "stored_semantics_stale" in inventory.warnings


def test_duplicate_matching_stored_channels_fall_back_to_legacy_defaults() -> None:
    """A duplicate stored channel must not be silently matched by tuple position."""
    content = _document(contract=True)
    baseline = _inventory(content).configuration
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        baseline.meter,
        (baseline.channels[0], baseline.channels[0], *baseline.channels[2:]),
        (),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert {channel.role for channel in inventory.configuration.channels} == {
        CircuitRole.BRANCH
    }
    assert "stored_semantics_stale" in inventory.warnings


def test_stale_stored_semantics_are_ignored_and_reported() -> None:
    """Accepting a stored role after its source hash changed is a stale-plan bug."""
    content = _document(contract=True)
    baseline = _inventory(content).configuration
    stale = StoredMeterConfiguration(
        "f" * 64,
        baseline.meter,
        tuple(replace(channel, role=CircuitRole.GRID) for channel in baseline.channels),
        (),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stale)

    assert {channel.role for channel in inventory.configuration.channels} == {
        CircuitRole.BRANCH
    }
    assert "stored_semantics_stale" in inventory.warnings


def test_inventory_rejects_malformed_active_ct_configuration() -> None:
    """Ignoring a missing active CT gain would create an unsafe partial plan."""
    content = _document().replace("  current_cal_ct6: 27524\n", "")

    with pytest.raises(ValueError, match="missing active substitution"):
        _inventory(content)


def test_inventory_exposes_capability_reason_codes() -> None:
    """Dropping capability reasons would let the UI offer unavailable writes."""
    inventory = _inventory(_document(contract=True), authoritative=False)

    assert inventory.capabilities.reason_codes == ("configuration_not_authoritative",)
    assert "configuration_not_authoritative" in inventory.warnings


def test_generic_total_warning_ignores_comments_but_detects_active_ids() -> None:
    """Treating comments as generic totals would report a warning for inactive YAML."""
    inactive = _inventory(
        _document(contract=True)
        + "# id: totalWatts\n"
        + "note: preserved # id: totalAmps\n"
    )
    active = _inventory(_document(contract=True, generic_totals=True))

    assert "legacy_generic_totals_unmanaged" not in inactive.warnings
    assert "legacy_generic_totals_unmanaged" not in active.warnings
