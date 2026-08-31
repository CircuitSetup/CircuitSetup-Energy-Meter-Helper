"""Tests for firmware configuration capability discovery."""

import json
from base64 import urlsafe_b64encode
from copy import deepcopy
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
    AutomaticTotalSettings,
    ChannelTotalSource,
    CircuitAggregate,
    CircuitRole,
    EnergyMode,
    MeasurementMethod,
    TotalOrigin,
    TotalOutputSettings,
)
from custom_components.circuitsetup_energy_meter_helper.meter_inventory import (
    MeterConfigurationCapabilities,
    MeterConfigurationInventory,
    _detected_aggregates,
    meter_configuration_capabilities,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    LegacyParentLink,
    StoredMeterConfiguration,
    _deserialize_meter_configuration_payload,
    _serialize_meter_configuration,
)
from custom_components.circuitsetup_energy_meter_helper.topology import (
    topology_from_config,
)
from custom_components.circuitsetup_energy_meter_helper.voltage_transformer_catalog import (
    VoltageTransformerCatalog,
)
from tests.test_store import (
    V14_ADDON_FIXTURE,
    V14_AUTO_FIXTURE,
    V14_PARENT_FIXTURE,
    V14_STALE_FIXTURE,
)


def test_capability_model_has_exact_frozen_slots_contract() -> None:
    assert tuple(field.name for field in fields(MeterConfigurationCapabilities)) == (
        "configuration_authoritative",
        "native_totals_readable",
        "native_totals_writable",
        "managed_automatic_totals",
        "managed_advanced_totals",
        "multi_reference",
        "semantic_source",
        "reason_codes",
    )
    assert hasattr(MeterConfigurationCapabilities, "__slots__")
    assert not hasattr(
        MeterConfigurationCapabilities(True, True, True, True, True, True, "helper_managed", ()), "__dict__"
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
    stored_semantics_stale: bool = False,
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
        stored_semantics_stale=stored_semantics_stale,
    )


def _aggregate(
    aggregate_id: str,
    name: str,
    role: CircuitRole,
    channels: tuple[int, ...],
    method: MeasurementMethod,
    energy_mode: EnergyMode,
    watts: bool = True,
    amps: bool = False,
) -> CircuitAggregate:
    """Build strict expected aggregate values without legacy production aliases."""
    return CircuitAggregate(
        aggregate_id,
        name,
        role,
        tuple(ChannelTotalSource("channel", channel) for channel in channels),
        method,
        energy_mode,
        TotalOutputSettings(watts, amps, energy_mode is not EnergyMode.NONE),
        TotalOrigin.MIGRATED,
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


def test_totals_intent_is_checked_against_pending_links_and_authority() -> None:
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        AggregateTotalSource,
        LegacyParentDecision,
        TotalsChangeIntent,
    )
    inventory = _inventory(_document(contract=True))
    caps = replace(inventory.capabilities, native_totals_writable=True, managed_automatic_totals=True, managed_advanced_totals=True)
    inventory = replace(inventory, capabilities=caps, legacy_parent_links=(LegacyParentLink("child", "parent"), LegacyParentLink("other", "parent")))
    child = _aggregate("child", "Child", CircuitRole.CUSTOM, (1,), MeasurementMethod.DIRECT, EnergyMode.NONE)
    parent = replace(child, aggregate_id="parent", name="Parent", sources=(AggregateTotalSource("aggregate", "child"),))
    draft = replace(inventory.configuration, aggregates=(child, parent), totals_change_intent=TotalsChangeIntent(False, (LegacyParentDecision("child", "parent", True),)))
    inventory.validate_totals_change(draft)
    assert len(inventory.legacy_parent_links) == 2
    with pytest.raises(ValueError, match="legacy"):
        inventory.validate_totals_change(replace(draft, totals_change_intent=TotalsChangeIntent()))
    for decision in (LegacyParentDecision("missing", "parent", False), LegacyParentDecision("child", "altered", False), LegacyParentDecision("child", "parent", False)):
        with pytest.raises(ValueError, match="legacy"):
            inventory.validate_totals_change(replace(draft, totals_change_intent=TotalsChangeIntent(False, (decision,))))
    with pytest.raises(ValueError, match="legacy"):
        inventory.validate_totals_change(replace(draft, aggregates=(child,)))
    runtime = _inventory(_document(contract=True), authoritative=False)
    with pytest.raises(ValueError, match="authoritative"):
        runtime.validate_totals_change(replace(runtime.configuration, totals_change_intent=TotalsChangeIntent(True)))
    with pytest.raises(ValueError, match="managed"):
        runtime.validate_totals_change(replace(runtime.configuration, default_totals=replace(runtime.configuration.default_totals, overall=TotalOutputSettings(False, False, False))))


def test_custom_template_totals_have_an_explicit_unmanaged_capability_reason() -> None:
    content = _document(contract=True) + (
        "sensor:\n  - platform: template\n    id: totalGarageWatts\n"
        "    name: Garage Power\n    unit_of_measurement: W\n    device_class: power\n"
        "    lambda: return id(ct1Watts).state + id(ct2Watts).state;\n"
    )
    inventory = _inventory(content)
    assert "legacy_custom_totals_unmanaged" in inventory.capabilities.reason_codes
    assert "legacy_custom_totals_unmanaged" in inventory.warnings


def test_unmanaged_native_visibility_is_source_confirmed_before_adoption() -> None:
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        TotalsChangeIntent,
    )
    content = _document(contract=True) + "sensor:\n" + _explicit_native_definitions() + "  - id: !extend totalWattsMain\n    internal: true\n"
    inventory = _inventory(content)
    assert not inventory.configuration.default_totals.overall.watts
    inventory.validate_totals_change(replace(inventory.configuration, totals_change_intent=TotalsChangeIntent(True)))
    unresolved = _inventory(_document(contract=True))
    assert "native_visibility_unconfirmed" in unresolved.capabilities.reason_codes
    with pytest.raises(ValueError, match="visibility"):
        unresolved.validate_totals_change(replace(unresolved.configuration, totals_change_intent=TotalsChangeIntent(True)))


def test_ambiguous_native_sensor_fields_leave_inventory_read_only() -> None:
    content = _document(contract=True) + "sensor:\n" + _explicit_native_definitions().replace(
        "    name: Native totalWattsMain\n", "    name: Native totalWattsMain\n    name: Duplicate\n"
    )
    inventory = _inventory(content)
    assert not inventory.native_visibility_resolved
    assert not inventory.capabilities.native_totals_writable


def test_unmanaged_and_runtime_totals_require_explicit_adoption() -> None:
    unmanaged = _inventory(_document(contract=True))
    runtime = _inventory(_document(contract=True), authoritative=False)
    for inventory in (unmanaged, runtime):
        assert inventory.capabilities.native_totals_readable
        assert not inventory.capabilities.native_totals_writable
        assert not inventory.capabilities.managed_automatic_totals
        assert not inventory.capabilities.managed_advanced_totals
    assert "totals_adoption_required" in unmanaged.capabilities.reason_codes
    assert "configuration_not_authoritative" in runtime.capabilities.reason_codes


def test_inventory_without_stored_configuration_is_legacy_inferred() -> None:
    assert _inventory(_document()).capabilities.semantic_source == "legacy_inferred"


def _migrated_for_source(content: str, fixture: dict) -> StoredMeterConfiguration:
    raw = deepcopy(fixture)
    raw["config_sha256"] = sha256(content.encode()).hexdigest()
    for reference in raw["meter"]["voltage_references"]:
        reference["gain_voltage"] = 7305
    topology = topology_from_config(ESPHomeConfigDocument.parse(content))
    return _deserialize_meter_configuration_payload(raw, topology)


def _explicit_native_definitions(addon_count: int = 0) -> str:
    ids = ["totalWatts", "totalAmps"] if addon_count else []
    ids.extend(("totalWattsMain", "totalAmpsMain"))
    for board in range(1, addon_count + 1):
        ids.extend((f"totalWattsAddOn{board}", f"totalAmpsAddOn{board}"))
    return (
        "".join(
            f"  - platform: template\n    id: {sensor_id}\n    name: Native {sensor_id}\n"
            for sensor_id in ids
        )
        + "  - platform: total_daily_energy\n    id: totalEnergyDaily\n    name: Native daily energy\n"
    )


@pytest.mark.parametrize(
    "sensors",
    (
        "",
        "sensor:\n  - id: !extend totalEnergyDaily\n    internal: true\n",
        "sensor:\n  - id: ${unknown_native_id}\n    internal: false\n",
        "text_sensor:\n" + _explicit_native_definitions(),
    ),
)
def test_v14_missing_native_evidence_cannot_confirm_package_defaults(sensors) -> None:
    # These familiar paths have no retained repository/revision provenance.
    content = _document(contract=True) + sensors
    stored = _migrated_for_source(content, V14_PARENT_FIXTURE)
    inventory = _inventory(content, stored=stored)
    assert inventory.capabilities.managed_totals is False
    assert "native_visibility_unconfirmed" in inventory.capabilities.reason_codes
    assert inventory.configuration.default_totals == stored.default_totals
    assert stored.totals_migration.native_visibility_confirmation_required is True


@pytest.mark.parametrize("addon_count", (0, 1))
def test_v14_complete_named_native_definitions_confirm_implicit_public(
    addon_count,
) -> None:
    content = (
        _document(contract=True, addon_count=addon_count)
        + "sensor:\n"
        + _explicit_native_definitions(addon_count)
    )
    stored = _migrated_for_source(
        content, V14_ADDON_FIXTURE if addon_count else V14_PARENT_FIXTURE
    )
    inventory = _inventory(content, stored=stored)
    assert inventory.capabilities.managed_totals is True
    assert inventory.configuration.default_totals.overall == TotalOutputSettings(
        True, True, True
    )
    assert all(
        board.outputs == TotalOutputSettings(True, True, False)
        for board in inventory.configuration.default_totals.boards
    )
    assert stored.totals_migration.native_visibility_confirmation_required is True


def test_v14_unnamed_native_definition_does_not_imply_public() -> None:
    content = (
        _document(contract=True)
        + "sensor:\n"
        + _explicit_native_definitions().replace(
            "    name: Native totalWattsMain\n", ""
        )
    )
    stored = _migrated_for_source(content, V14_PARENT_FIXTURE)
    inventory = _inventory(content, stored=stored)
    assert inventory.capabilities.managed_totals is False
    assert "native_visibility_unconfirmed" in inventory.capabilities.reason_codes


@pytest.mark.parametrize("addon_count", (0, 1))
@pytest.mark.parametrize("renderer", ("b346", "9666"))
@pytest.mark.parametrize("extend", (False, True))
def test_v14_matching_source_preserves_renderer_native_visibility(
    addon_count, renderer, extend
) -> None:
    root_ids = (
        ("totalWatts", "totalAmps", "totalEnergyDaily")
        if addon_count
        else ("totalEnergyDaily",)
    )
    hidden = (
        *root_ids,
        *(
            (
                "totalWattsMain",
                "totalAmpsMain",
                *(("totalWattsAddOn1", "totalAmpsAddOn1") if addon_count else ()),
            )
            if renderer == "9666"
            else ()
        ),
    )
    content = (
        _document(contract=True, addon_count=addon_count)
        + "sensor:\n"
        + "".join(
            f"  - id: {'!extend ' if extend else ''}{sensor_id}\n    internal: true\n"
            for sensor_id in hidden
        )
    )
    # Resolve the definitions that the historical renderer did not override.
    board_ids = (
        "totalWattsMain",
        "totalAmpsMain",
        *(("totalWattsAddOn1", "totalAmpsAddOn1") if addon_count else ()),
    )
    content += "".join(
        f"  - id: {sensor_id}\n    internal: {'true' if addon_count else 'false'}\n"
        for sensor_id in board_ids
        if sensor_id not in hidden
    )
    fixture = V14_ADDON_FIXTURE if addon_count else V14_PARENT_FIXTURE
    stored = _migrated_for_source(content, fixture)
    before = _serialize_meter_configuration(
        stored, topology_from_config(ESPHomeConfigDocument.parse(content))
    )
    inventory = _inventory(content, stored=stored)
    assert inventory.capabilities.semantic_source == "helper_managed"
    assert inventory.capabilities.managed_totals is True
    assert "stored_semantics_stale" not in inventory.warnings
    assert inventory.configuration.default_totals.overall == TotalOutputSettings(
        not addon_count and renderer == "b346",
        not addon_count and renderer == "b346",
        False,
    )
    assert all(
        board.outputs == TotalOutputSettings(False, False, False)
        for board in inventory.configuration.default_totals.boards
    )
    assert stored.totals_migration.native_visibility_confirmation_required is True
    assert _serialize_meter_configuration(stored, inventory.topology) == before
    assert inventory.totals_parent_review_required is (not addon_count)


@pytest.mark.parametrize(
    "internal", ("${hide_native}", "!lambda return true;", "true # hidden")
)
def test_v14_ambiguous_visibility_does_not_authorize_totals(internal) -> None:
    content = (
        _document(contract=True)
        + "sensor:\n"
        + _explicit_native_definitions()
        + f"  - id: !extend totalWattsMain\n    internal: {internal}\n"
    )
    stored = _migrated_for_source(content, V14_PARENT_FIXTURE)
    inventory = _inventory(content, stored=stored)
    assert inventory.capabilities.managed_totals is False
    assert "native_visibility_unconfirmed" in inventory.capabilities.reason_codes
    assert stored.totals_migration.native_visibility_confirmation_required is True


def test_v14_populated_candidates_stale_settings_and_pending_links_survive_load() -> (
    None
):
    content = _document(contract=True)
    stored = _migrated_for_source(content, V14_AUTO_FIXTURE)
    stale = AutomaticTotalSettings(
        "solar-ct3-ct4", True, TotalOutputSettings(False, True, False)
    )
    stored = replace(stored, automatic_totals=(*stored.automatic_totals, stale))
    inventory = _inventory(content, stored=stored)
    assert [candidate.candidate_id for candidate in inventory.automatic_candidates] == [
        "grid-ct1-ct2"
    ]
    assert inventory.automatic_totals[0].enabled is True
    assert inventory.automatic_totals[0].outputs == TotalOutputSettings(
        True, False, True
    )
    assert inventory.stale_automatic_total_settings == (stale,)
    assert inventory.configuration.automatic_totals == stored.automatic_totals[:1]
    assert "stored_semantics_stale" not in inventory.warnings


@pytest.mark.parametrize("authoritative,resolved", ((True, True), (True, False), (False, True)))
def test_explicit_stale_flag_discards_matching_stored_totals_before_adoption(
    authoritative: bool, resolved: bool,
) -> None:
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        TotalsChangeIntent,
    )
    from custom_components.circuitsetup_energy_meter_helper.store import (
        TotalsMigrationRecord,
    )

    content = _document(contract=True)
    if resolved:
        content += "sensor:\n" + _explicit_native_definitions()
    live = _inventory(content, authoritative=authoritative)
    baseline = live.configuration
    outputs = TotalOutputSettings(False, False, False)
    stored = StoredMeterConfiguration(
        live.source_sha256,
        baseline.meter,
        tuple(replace(channel, role=CircuitRole.GRID) if channel.channel in (1, 2) else channel for channel in baseline.channels),
        replace(baseline.default_totals, overall=outputs),
        (AutomaticTotalSettings("grid-ct1-ct2", False, outputs),),
        (_aggregate("stored-only", "Stored only", CircuitRole.CUSTOM, (3,), MeasurementMethod.DIRECT, EnergyMode.NONE),),
        baseline.power_quality,
        baseline.status_fields,
        totals_migration=TotalsMigrationRecord(True, (LegacyParentLink("stored-only", "parent"),)),
    )
    inventory = _inventory(content, stored=stored, authoritative=authoritative, stored_semantics_stale=True)

    assert inventory.configuration == baseline
    assert inventory.capabilities.semantic_source == "legacy_inferred"
    assert "stored_semantics_stale" in inventory.capabilities.reason_codes
    assert not inventory.capabilities.managed_totals
    assert inventory.automatic_candidates == inventory.automatic_totals == ()
    assert inventory.stale_automatic_total_settings == inventory.legacy_parent_links == ()
    assert not inventory.totals_parent_review_required
    assert stored.channels[0].role is CircuitRole.GRID
    assert stored.default_totals.overall == outputs
    assert stored.totals_migration.parent_review_required
    adopted = replace(inventory.configuration, totals_change_intent=TotalsChangeIntent(True))
    if authoritative and resolved:
        inventory.validate_totals_change(adopted)
    else:
        with pytest.raises(ValueError, match="authoritative, visibility-confirmed"):
            inventory.validate_totals_change(adopted)


@pytest.mark.parametrize("candidate_id", ("grid-ct1-ct2", "unknown"))
@pytest.mark.parametrize("enabled", (True, False))
def test_normal_totals_writes_reject_noncurrent_candidates_before_mutation(
    candidate_id: str, enabled: bool,
) -> None:
    inventory = _inventory(_document(contract=True))
    inventory = replace(inventory, capabilities=replace(
        inventory.capabilities, native_totals_writable=True,
        managed_automatic_totals=True, managed_advanced_totals=True,
    ))
    draft = replace(inventory.configuration, automatic_totals=(
        AutomaticTotalSettings(candidate_id, enabled, TotalOutputSettings(True, False, True)),
    ))
    with pytest.raises(ValueError, match="no current candidate"):
        inventory.validate_totals_change(draft)


def test_v14_stale_source_does_not_trust_totals_or_reconcile_candidates() -> None:
    content = _document(contract=True)
    topology = topology_from_config(ESPHomeConfigDocument.parse(content))
    stored = _deserialize_meter_configuration_payload(V14_STALE_FIXTURE, topology)
    inventory = _inventory(content, stored=stored)
    assert inventory.capabilities.managed_totals is False
    assert inventory.capabilities.semantic_source == "legacy_inferred"
    assert inventory.automatic_candidates == inventory.automatic_totals == ()
    assert inventory.legacy_parent_links == ()
    assert inventory.totals_parent_review_required is False
    assert not {"child", "parent"}.intersection(
        item.aggregate_id for item in inventory.configuration.aggregates
    )
    assert "stored_semantics_stale" in inventory.warnings


def test_v14_runtime_source_cannot_confirm_native_visibility() -> None:
    content = _document(contract=True)
    stored = _migrated_for_source(content, V14_PARENT_FIXTURE)
    inventory = _inventory(content, stored=stored, authoritative=False)
    assert inventory.capabilities.managed_totals is False
    assert inventory.configuration.default_totals == stored.default_totals
    assert stored.totals_migration.native_visibility_confirmation_required is True


@pytest.mark.parametrize("override_first", (False, True))
def test_v14_native_extend_overrides_literal_definition_regardless_of_order(
    override_first,
) -> None:
    definition = "  - platform: template\n    id: totalWattsMain\n    internal: true\n"
    override = "  - id: !extend totalWattsMain\n    internal: false\n"
    content = (
        _document(contract=True)
        + "sensor:\n"
        + (override + definition if override_first else definition + override)
        + "  - id: totalAmpsMain\n    internal: false\n  - id: totalEnergyDaily\n    internal: false\n"
    )
    stored = _migrated_for_source(content, V14_PARENT_FIXTURE)
    inventory = _inventory(content, stored=stored)
    assert inventory.configuration.default_totals.overall.watts is True
    assert inventory.capabilities.managed_totals is True


@pytest.mark.parametrize("id_prefix", ("", "!extend "))
def test_v14_duplicate_native_definitions_leave_visibility_unconfirmed(
    id_prefix,
) -> None:
    content = (
        _document(contract=True)
        + f"sensor:\n  - id: {id_prefix}totalWattsMain\n    internal: true\n  - id: {id_prefix}totalWattsMain\n    internal: false\n"
        + "  - id: totalAmpsMain\n    internal: false\n  - id: totalEnergyDaily\n    internal: false\n"
    )
    stored = _migrated_for_source(content, V14_PARENT_FIXTURE)
    inventory = _inventory(content, stored=stored)
    assert inventory.capabilities.managed_totals is False
    assert "native_visibility_unconfirmed" in inventory.capabilities.reason_codes


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
        baseline.default_totals,
        (),
        (),
        baseline.power_quality,
        baseline.status_fields,
    )

    inventory = _inventory(content, stored=stored)

    assert inventory.configuration.aggregates[:1] == (
        _aggregate(
            "mains1",
            "Mains",
            CircuitRole.GRID,
            (1, 2),
            MeasurementMethod.TWO_CT_SUM,
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


def test_literal_legacy_yaml_metadata_preserves_parent_proposals() -> None:
    metadata = {"aggregate_id": "mains1", "name": "Mains", "role": "grid", "channels": [1, 2], "measurement_method": "two_ct_sum", "parent_id": "parent", "energy_mode": "consumption", "expose_power": True, "expose_current": False, "order": 0}
    payload = urlsafe_b64encode(json.dumps(metadata).encode()).decode().rstrip("=")
    block = _helper_mains_total().replace("# CircuitSetup Energy Meter Helper: aggregates v1\n", f"# CircuitSetup Energy Meter Helper: aggregates v1\n  # csemh-aggregate: {payload}\n")
    inventory = _inventory(_document(contract=True) + block)
    assert inventory.configuration.aggregates[0] == _aggregate("mains1", "Mains", CircuitRole.GRID, (1, 2), MeasurementMethod.TWO_CT_SUM, EnergyMode.CONSUMPTION)
    assert inventory.legacy_parent_links == (LegacyParentLink("mains1", "parent"),)
    assert inventory.totals_parent_review_required is True
    assert "aggregate_semantics_unreadable" not in inventory.warnings


def test_v14_automatic_owned_yaml_is_not_reimported_as_advanced() -> None:
    block = _helper_mains_total().replace("csemh_mains1", "csemh_auto_mains").replace("std::max(0.0f, id(ct1Watts).state + id(ct2Watts).state)", "id(ct1Watts).state + id(ct2Watts).state")
    directions = "".join(
        f"  - platform: template\n    id: csemh_auto_mains_{direction}_power\n    lambda: return std::max(0.0f, {sign}id(csemh_auto_mains_power).state);\n"
        f"  - platform: total_daily_energy\n    id: csemh_auto_mains_{direction}_energy\n    power_id: csemh_auto_mains_{direction}_power\n"
        for direction, sign in (("import", ""), ("export", "-"))
    )
    block = block.replace("# End CircuitSetup Energy Meter Helper: aggregates v1", directions + "# End CircuitSetup Energy Meter Helper: aggregates v1")
    content = _document(contract=True) + block
    stored = _migrated_for_source(content, V14_AUTO_FIXTURE)
    inventory = _inventory(content, stored=stored)
    assert inventory.automatic_totals[0].enabled is True
    assert "auto-mains" not in {item.aggregate_id for item in inventory.configuration.aggregates}
    assert "aggregate_semantics_unreadable" not in inventory.warnings
    assert "main-total" in {item.aggregate_id for item in inventory.configuration.aggregates}


def test_native_total_inference_without_enabled_channels_fails_closed() -> None:
    content = _document(contract=True, generic_totals=True)
    baseline = _inventory(content).configuration
    aggregates, warnings, links = _detected_aggregates(ESPHomeConfigDocument.parse(content), tuple(replace(channel, enabled=False) for channel in baseline.channels), ())
    assert aggregates == links == ()
    assert "builtin_total_semantics_unreadable" in warnings


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
        _aggregate("meter-total", "Meter total", CircuitRole.CUSTOM, (1, 2, 3, 4, 5, 6), MeasurementMethod.DIRECT, EnergyMode.NONE, True, True),
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
        _aggregate("main-total", "Main total", CircuitRole.CUSTOM, (1, 2, 3, 4, 5, 6), MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, False, False),
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
        _aggregate("main-total", "Main total", CircuitRole.CUSTOM, (1, 2, 3, 4, 5, 6), MeasurementMethod.DIRECT, EnergyMode.NONE, False, False),
        _aggregate("addon1-total", "Add-on 1 total", CircuitRole.CUSTOM, (7, 8, 9, 10, 11, 12), MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, False, False),
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
    assert aggregates["meter-total"] == _aggregate("meter-total", "Meter total", CircuitRole.CUSTOM, tuple(range(1, 13)), MeasurementMethod.DIRECT, EnergyMode.NONE, True, True)
    for aggregate_id in ("main-total", "addon1-total"):
        assert aggregates[aggregate_id].outputs.watts is False
        assert aggregates[aggregate_id].outputs.amps is False
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

    assert aggregates["meter-total"] == _aggregate("meter-total", "House Total", CircuitRole.CUSTOM, (1, 2), MeasurementMethod.TWO_CT_SUM, EnergyMode.NONE, True, False)
    assert aggregates["total-charger"] == _aggregate("total-charger", "Total Charger", CircuitRole.CUSTOM, (5, 6), MeasurementMethod.TWO_CT_SUM, EnergyMode.NONE, True, False)
    assert aggregates["total-ac1"] == _aggregate("total-ac1", "Total AC1", CircuitRole.CUSTOM, (7, 8), MeasurementMethod.TWO_CT_SUM, EnergyMode.NONE, False, False)
    for aggregate_id in ("main-total", "addon1-total"):
        assert aggregates[aggregate_id].outputs.watts is False
        assert aggregates[aggregate_id].outputs.amps is False


def test_parent_template_total_links_default_board_calculations() -> None:
    """Old parent hints remain proposals, with unchanged flattened formulas."""
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

    assert aggregates["meter-total"].sources == tuple(ChannelTotalSource("channel", channel) for channel in range(1, 13))
    assert aggregates["main-total"].sources == tuple(ChannelTotalSource("channel", channel) for channel in range(1, 7))
    assert aggregates["addon1-total"].sources == tuple(ChannelTotalSource("channel", channel) for channel in range(7, 13))
    assert set(_inventory(content).legacy_parent_links) == {
        LegacyParentLink("main-total", "meter-total"), LegacyParentLink("addon1-total", "meter-total"),
    }


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
        baseline.default_totals, (), baseline.aggregates,
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
        baseline.default_totals, (), baseline.aggregates,
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
        _aggregate("meter-total", "Meter total", CircuitRole.CUSTOM, (1, 2, 3, 4, 5, 6), MeasurementMethod.DIRECT, EnergyMode.NONE, True, False),
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
    aggregate = _aggregate("grid", "Grid", CircuitRole.GRID, (1,), MeasurementMethod.DIRECT, EnergyMode.BIDIRECTIONAL)
    stored = StoredMeterConfiguration(
        sha256(content.encode()).hexdigest(),
        replace(
            baseline.meter,
            electrical_system=baseline.meter.electrical_system.SPLIT_PHASE_120_240,
            voltage_layout=baseline.meter.voltage_layout.MULTI_REFERENCE,
            voltage_references=voltage_references,
        ),
        channels,
        baseline.default_totals, (), (aggregate,),
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
    aggregate = _aggregate("grid", "Grid", CircuitRole.GRID, (1,), MeasurementMethod.DIRECT, EnergyMode.BIDIRECTIONAL)
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
        baseline.default_totals, (), (aggregate,),
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
        baseline.default_totals, (), (),
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
        legacy.configuration.default_totals, (), (),
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
        baseline.default_totals, (), (),
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
        baseline.default_totals, (), (),
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
        baseline.default_totals, (), (),
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
        baseline.default_totals, (), (),
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
        baseline.default_totals, (), (),
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
        baseline.default_totals, (), (),
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
        baseline.default_totals, (), (),
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
        baseline.default_totals, (), (),
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

    assert "configuration_not_authoritative" in inventory.capabilities.reason_codes
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
    assert "legacy_generic_totals_unmanaged" in active.warnings
    assert "legacy_generic_totals_unmanaged" in active.capabilities.reason_codes
