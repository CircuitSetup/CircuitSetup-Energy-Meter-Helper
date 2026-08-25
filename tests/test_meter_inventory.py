"""Tests for firmware configuration capability discovery."""

from dataclasses import fields, replace
from hashlib import sha256

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.ct_catalog import (
    CTPresetCatalog,
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
        "reason_codes",
    )
    assert hasattr(MeterConfigurationCapabilities, "__slots__")
    assert not hasattr(
        MeterConfigurationCapabilities(True, True, True, ()), "__dict__"
    )
    assert not hasattr(MeterConfigurationCapabilities, "status_thresholds")


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
        document,
        topology_from_config(document),
        CTPresetCatalog.load(),
        VoltageTransformerCatalog.load(),
        sha256(content.encode()).hexdigest(),
        stored_configuration=stored,
        configuration_authoritative=authoritative,
    )


def test_legacy_inventory_keeps_yaml_ct_values_and_requires_electrical_confirmation() -> (
    None
):
    """Changing legacy names into inferred circuit roles must fail this contract."""
    inventory = _inventory(_document(generic_totals=True))

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
        CircuitRole.CUSTOM
    }
    assert inventory.configuration.meter.electrical_system.value == "custom"
    assert inventory.voltage_topology.references == (("main", ("main_1", "main_2")),)
    assert inventory.configuration.aggregates == ()
    assert inventory.configuration.power_quality == (True,)
    assert inventory.configuration.status_fields == (True,)
    assert {
        "electrical_profile_requires_confirmation",
        "legacy_generic_totals_unmanaged",
        "config_contract_upgrade_required",
    } <= set(inventory.warnings)


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
    assert inventory.configuration.aggregates == (aggregate,)
    assert inventory.configuration.meter.voltage_references == voltage_references
    assert inventory.voltage_topology.references == (
        ("grid", ("main_1",)),
        ("loads", ("main_2",)),
    )
    assert "electrical_profile_requires_confirmation" not in inventory.warnings


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
        CircuitRole.CUSTOM
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
        CircuitRole.CUSTOM
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
        CircuitRole.CUSTOM
    }
    assert "stored_semantics_stale" in inventory.warnings


def test_inventory_rejects_malformed_active_ct_configuration() -> None:
    """Ignoring a missing active CT gain would create an unsafe partial plan."""
    content = _document().replace("  current_cal_ct6: 27524\n", "")

    with pytest.raises(ValueError, match="missing active substitution"):
        _inventory(content)


def test_inventory_exposes_capability_reason_codes_without_threshold_capabilities() -> (
    None
):
    """Dropping capability reasons would let the UI offer unavailable writes."""
    inventory = _inventory(_document(contract=True), authoritative=False)

    assert inventory.capabilities.reason_codes == ("configuration_not_authoritative",)
    assert "configuration_not_authoritative" in inventory.warnings
    assert not hasattr(inventory, "status_thresholds")


def test_generic_total_warning_ignores_comments_but_detects_active_ids() -> None:
    """Treating comments as generic totals would report a warning for inactive YAML."""
    inactive = _inventory(
        _document(contract=True)
        + "# id: totalWatts\n"
        + "note: preserved # id: totalAmps\n"
    )
    active = _inventory(_document(contract=True, generic_totals=True))

    assert "legacy_generic_totals_unmanaged" not in inactive.warnings
    assert "legacy_generic_totals_unmanaged" in active.warnings
