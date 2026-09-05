"""Tests for line-preserving, reviewable CT substitution changes."""

import json
from base64 import urlsafe_b64decode, urlsafe_b64encode
from dataclasses import replace
from hashlib import sha256
from types import SimpleNamespace

import pytest

from custom_components.circuitsetup_energy_meter_helper import (
    config_mutator,
    meter_config_mutator,
)
from custom_components.circuitsetup_energy_meter_helper.config_blocks import (
    replace_managed_block,
)
from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
    ConfigMutationError,
    CTChangeRequest,
    build_ct_mutation,
)
from custom_components.circuitsetup_energy_meter_helper.ct_catalog import (
    CTPresetCatalog,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
    build_meter_configuration_mutation,
    expected_meter_entity_evidence,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    ChannelTotalSource,
    CircuitAggregate,
    CircuitRole,
    ElectricalSystem,
    EnergyMode,
    MeasurementMethod,
    MeterConfigurationRequest,
    NativeTotalSource,
    TotalOrigin,
    TotalOutputSettings,
    VoltageLayout,
    VoltageReferenceConfig,
)
from custom_components.circuitsetup_energy_meter_helper.meter_inventory import (
    MeterConfigurationInventory,
    VoltageReferenceMismatchError,
)
from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology
from custom_components.circuitsetup_energy_meter_helper.store import (
    StoredMeterConfiguration,
)
from custom_components.circuitsetup_energy_meter_helper.topology import (
    voltage_reference_topology_from_config,
    voltage_reference_topology_from_configuration,
)
from custom_components.circuitsetup_energy_meter_helper.total_graph import (
    default_total_settings,
)
from custom_components.circuitsetup_energy_meter_helper.voltage_transformer_catalog import (
    VoltageTransformerCatalog,
)


def _topology() -> MeterTopology:
    return MeterTopology.from_addon_count(
        0,
        connection_type="wifi",
        voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter",
        evidence=(),
    )


def _snapshot(*, missing: str | None = None, quote: str = '"') -> ESPHomeConfigSnapshot:
    substitutions = []
    for channel in range(1, 7):
        if missing != f"ct{channel}_name":
            substitutions.append(f"  ct{channel}_name: {quote}CT {channel}{quote}")
        if missing != f"current_cal_ct{channel}":
            substitutions.append(f"  current_cal_ct{channel}: {quote}11143{quote}")
    content = (
        "api:\n  encryption:\n    key: top-secret\nsubstitutions:\n"
        + "\n".join(substitutions)
        + "\nsensor:\n  - platform: uptime\n    name: Uptime\nlogger:\n  level: DEBUG\n"
    )
    return ESPHomeConfigSnapshot(
        "meter.yaml", content, sha256(content.encode()).hexdigest()
    )


def _contract_snapshot(*, generic_totals: bool = False) -> ESPHomeConfigSnapshot:
    """Return the smallest contract-2 source with optional official totals."""
    snapshot = _snapshot()
    content = snapshot.content.replace(
        "substitutions:\n", 'substitutions:\n  csemh_config_contract: "2"\n'
    )
    if generic_totals:
        content = content.replace(
            "logger:\n",
            "  - platform: template\n"
            "    id: totalWatts\n"
            "  - platform: total_daily_energy\n"
            "    id: totalEnergyDaily\n"
            "    name: Daily Energy\n"
            "    power_id: totalWatts\n"
            "    unit_of_measurement: kWh\n"
            "logger:\n",
        )
    return ESPHomeConfigSnapshot(
        snapshot.configuration, content, sha256(content.encode()).hexdigest()
    )


def _indentless_contract_snapshot() -> ESPHomeConfigSnapshot:
    """Return the official root-sequence spelling without changing other sections."""
    snapshot = _contract_snapshot(generic_totals=True)
    prefix, sensor = snapshot.content.split("sensor:\n", 1)
    sensor, suffix = sensor.split("logger:\n", 1)
    sensor = "\n".join(
        line.removeprefix("  ") for line in sensor.split("\n")
    )
    content = prefix + "sensor:\n" + sensor + "logger:\n" + suffix
    return replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())


def _default_totals_snapshot() -> ESPHomeConfigSnapshot:
    snapshot = _contract_snapshot()
    content = snapshot.content.replace(
        "sensor:\n",
        "packages:\n"
        "  remote:\n"
        "    files:\n"
        "      - Software/ESPHome/meter_sensors/6chan_main_sensor.yaml\n"
        "sensor:\n"
        "  - platform: total_daily_energy\n"
        "    id: totalEnergyDaily\n"
        "    name: Daily Energy\n"
        "    power_id: totalWattsMain\n"
        "    unit_of_measurement: kWh\n",
    )
    return replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())


def _package_snapshot() -> ESPHomeConfigSnapshot:
    content = """substitutions:
  ct1_name: CT 1
  current_cal_ct1: 11143
  ct2_name: CT 2
  current_cal_ct2: 11143
  ct3_name: CT 3
  current_cal_ct3: 11143
  ct4_name: CT 4
  current_cal_ct4: 11143
  ct5_name: CT 5
  current_cal_ct5: 11143
  ct6_name: CT 6
  current_cal_ct6: 11143
  ct7_name: CT 7
  current_cal_ct7: 11143
  ct8_name: CT 8
  current_cal_ct8: 11143
  ct9_name: CT 9
  current_cal_ct9: 11143
  ct10_name: CT 10
  current_cal_ct10: 11143
  ct11_name: CT 11
  current_cal_ct11: 11143
  ct12_name: CT 12
  current_cal_ct12: 11143
packages:
  circuitsetup_meter:
    files:
      #- Software/ESPHome/power_quality/6chan_main_power_quality.yaml # keep this note
      #- Software/ESPHome/power_quality/6chan_addon1_power_quality.yaml
      - Software/ESPHome/status_fields/6chan_main_status.yaml
      #- Software/ESPHome/status_fields/6chan_addon1_status.yaml
sensor:
  - platform: uptime
    name: Uptime
api:
  encryption:
    key: top-secret
"""
    return ESPHomeConfigSnapshot(
        "meter.yaml", content, sha256(content.encode()).hexdigest()
    )


def _two_board_topology() -> MeterTopology:
    return MeterTopology.from_addon_count(
        1,
        connection_type="wifi",
        voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter-1-addon",
        evidence=(),
    )


def _topology_for_addons(addon_count: int) -> MeterTopology:
    return MeterTopology.from_addon_count(
        addon_count,
        connection_type="wifi",
        voltage_layout="standard",
        project_name=(
            "circuitsetup.6c-energy-meter"
            if addon_count == 0
            else f"circuitsetup.6c-energy-meter-{addon_count}-addon"
            f"{'s' if addon_count != 1 else ''}"
        ),
        evidence=(),
    )


def _contract_snapshot_for(topology: MeterTopology) -> ESPHomeConfigSnapshot:
    snapshot = _contract_snapshot()
    extra = "".join(
        f"  ct{channel}_name: CT {channel}\n"
        f"  current_cal_ct{channel}: 11143\n"
        for channel in range(7, topology.ct_count + 1)
    )
    content = snapshot.content.replace("sensor:\n", extra + "sensor:\n", 1)
    return replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())


def _inventory(
    snapshot: ESPHomeConfigSnapshot,
    topology: MeterTopology,
    *,
    stored: StoredMeterConfiguration | None = None,
) -> MeterConfigurationInventory:
    return MeterConfigurationInventory.from_document(
        snapshot.configuration,
        ESPHomeConfigDocument.parse(snapshot.content),
        topology,
        CTPresetCatalog.load(),
        VoltageTransformerCatalog.load(),
        snapshot.sha256,
        stored_configuration=stored,
    )


@pytest.mark.parametrize("addons", (0, 1))
def test_public_total_evidence_uses_native_firmware_names(addons: int) -> None:
    from tests.test_meter_configuration import request, topology

    configuration = request(addons=addons)
    evidence = expected_meter_entity_evidence(configuration, topology(addons))
    names = {name for _, name in evidence.aggregate_sensor_entities}
    assert "Kitchen meter Total Watts Main" in names
    assert "Kitchen meter Total Amps Main" in names
    assert "Kitchen meter Total kWh" in names
    if addons:
        assert "Kitchen meter Total Watts Add-on1" in names
        assert "Kitchen meter Total Watts" in names
        assert "Kitchen meter Main Board total Energy" in names
        assert len(names) == 9
    else:
        assert len(names) == 3


def test_native_evidence_uses_supported_source_name_overrides() -> None:
    from tests.test_meter_configuration import request, topology

    document = ESPHomeConfigDocument.parse('sensor:\n  - id: !extend totalWattsMain\n    internal: false\n    name: "${friendly_name} Custom watts"\n')
    evidence = expected_meter_entity_evidence(request(), topology(), document=document)
    names = {name for _, name in evidence.aggregate_sensor_entities}
    assert "Kitchen meter Custom watts" in names
    assert "Kitchen meter Total Watts Main" not in names


@pytest.mark.parametrize("item_indent", (0, 2))
@pytest.mark.parametrize("nested", ("filters:\n- multiply: 0.001", "# scaling: preserve this comment"))
def test_unchanged_meter_preview_preserves_nested_sensor_content(
    item_indent: int, nested: str,
) -> None:
    snapshot = _indentless_contract_snapshot() if item_indent == 0 else _contract_snapshot(generic_totals=True)
    field_indent = " " * (item_indent + 2)
    content = snapshot.content.replace(
        f"{field_indent}unit_of_measurement: kWh\n",
        "".join(f"{field_indent}{line}\n" for line in nested.splitlines())
        + f"{field_indent}unit_of_measurement: kWh\n",
    )
    snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    current = _inventory(snapshot, _topology())

    preview = build_meter_configuration_mutation(snapshot, current.topology, current, current.configuration)

    assert preview.proposed_content == content
    assert preview.source_sha256 == snapshot.sha256


@pytest.mark.parametrize("invalid_field", ("name: Duplicate name", "invalid-key: value"))
def test_meter_preview_still_rejects_invalid_direct_sensor_fields(invalid_field: str) -> None:
    snapshot = _indentless_contract_snapshot()
    content = snapshot.content.replace(
        "  unit_of_measurement: kWh\n",
        f"  filters:\n  - multiply: 0.001\n  {invalid_field}\n  unit_of_measurement: kWh\n",
    )
    snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    current = _inventory(snapshot, _topology())

    with pytest.raises(ConfigMutationError, match="native sensor names are not safely writable"):
        build_meter_configuration_mutation(snapshot, current.topology, current, current.configuration)


@pytest.mark.parametrize("visible_current", (False, True))
def test_unresolved_source_native_evidence_excludes_hidden_and_unknown_totals(
    visible_current: bool,
) -> None:
    snapshot = _contract_snapshot()
    overrides = "  - id: !extend totalWattsMain\n    internal: true\n"
    if visible_current:
        overrides += "  - id: !extend totalAmpsMain\n    internal: false\n"
    content = snapshot.content.replace("logger:\n", overrides + "logger:\n")
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )
    current = _inventory(snapshot, _topology())
    assert not current.native_visibility_resolved
    assert not current.capabilities.native_totals_writable
    evidence = expected_meter_entity_evidence(
        current.configuration,
        current.topology,
        document=ESPHomeConfigDocument.parse(content),
        previous=current.configuration,
    )
    assert evidence.native_sensor_entities == (
        frozenset({("energy_meter_total_amps_main", "Energy meter Total Amps Main")})
        if visible_current
        else frozenset()
    )


def test_review_totals_uses_human_sources_and_dependency_reasons() -> None:
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        AggregateTotalSource,
        NativeTotalSource,
    )
    from tests.test_meter_configuration import topology as make_topology
    topology = make_topology(1)
    snapshot = _contract_snapshot_for(topology)
    current = _owned_inventory(snapshot, topology)
    child = CircuitAggregate("child", "East wing", CircuitRole.CUSTOM,
        (NativeTotalSource("native_total", "board-main"),), MeasurementMethod.DIRECT,
        EnergyMode.NONE, TotalOutputSettings(False, False, False))
    parent = CircuitAggregate("parent", "Whole building", CircuitRole.CUSTOM,
        (AggregateTotalSource("aggregate", "child"), NativeTotalSource("native_total", "board-addon-1")),
        MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, TotalOutputSettings(True, False, True))
    requested = replace(current.configuration, aggregates=(child, parent),
        default_totals=replace(current.configuration.default_totals,
            overall=TotalOutputSettings(True, False, True)))
    review = build_meter_configuration_mutation(snapshot, topology, current, requested).redacted_diff
    assert "Default meter totals" in review
    assert "Overall meter total: Amps exposed -> hidden" in review
    assert "Advanced total hierarchy" in review
    assert "East wing + Add-on 1 total" in review
    assert "Watts hidden; retained internally for Whole building" in review
    assert "csemh_" not in review.split("Exact generated total changes")[0]
    installed = replace(snapshot, content=build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content)
    installed = replace(installed, sha256=sha256(installed.content.encode()).hexdigest())
    reloaded = _owned_inventory(installed, topology)
    second = replace(reloaded.configuration, aggregates=tuple(replace(item, name="Updated building") if item.aggregate_id == "parent" else item for item in reloaded.configuration.aggregates))
    assert "external custom kWh" not in build_meter_configuration_mutation(installed, topology, reloaded, second).redacted_diff


def test_adoption_review_projects_actual_native_override_and_metadata_without_payload() -> None:
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        TotalsChangeIntent,
    )

    snapshot, topology, current = _native_total_setup(0)
    requested = replace(current.configuration, totals_change_intent=TotalsChangeIntent(True),
        default_totals=replace(current.configuration.default_totals, overall=TotalOutputSettings(False, True, True)))
    mutation = build_meter_configuration_mutation(snapshot, topology, current, requested)
    assert "Exact generated total changes" in mutation.redacted_diff
    assert "+ id: !extend totalWattsMain; internal: true" in mutation.redacted_diff
    assert "Managed totals metadata: added" in mutation.redacted_diff
    assert "csemh-native-totals:" not in mutation.redacted_diff
    assert "top-secret" not in mutation.redacted_diff


def test_technical_total_review_uses_preserved_source_not_firmware_defaults() -> None:
    snapshot, topology, current = _native_total_setup(1)
    content = snapshot.content.replace("logger:\n", "  - id: !extend totalWattsAddOn1\n    internal: false\nlogger:\n")
    snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    current = _owned_inventory(snapshot, topology)
    settings = current.configuration.default_totals
    requested = replace(current.configuration, default_totals=replace(settings, boards=(
        settings.boards[0], replace(settings.boards[1], outputs=TotalOutputSettings(True, False, False)))))
    mutation = build_meter_configuration_mutation(snapshot, topology, current, requested)
    technical = mutation.redacted_diff.split("Exact generated total changes")[-1]
    assert "No total sensor definition changes" in technical
    assert "+ id: !extend totalWattsAddOn1" not in technical
    assert "Managed totals metadata: unchanged" in technical


def test_technical_total_review_lists_helper_additions_and_removals_without_arbitrary_source() -> None:
    snapshot, topology, current = _native_total_setup(0)
    aggregate = CircuitAggregate("branch", "Branch", CircuitRole.BRANCH, (ChannelTotalSource("channel", 1),),
        MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, TotalOutputSettings(False, False, True))
    requested = replace(current.configuration, aggregates=(aggregate,))
    mutation = build_meter_configuration_mutation(snapshot, topology, current, requested)
    assert "+ id: csemh_branch_power; platform: template; internal: true" in mutation.redacted_diff
    assert "+ id: csemh_branch_energy; platform: total_daily_energy; power_id: csemh_branch_power" in mutation.redacted_diff
    content = mutation.proposed_content.replace("    lambda:", "    # arbitrary-source-canary\n    lambda:")
    installed = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    # Preserve valid stored intent; source comments/lambdas must never be exposed.
    stored = StoredMeterConfiguration(installed.sha256, requested.meter, requested.channels, requested.default_totals,
        requested.automatic_totals, requested.aggregates, requested.power_quality, requested.status_fields)
    current = _owned_inventory(installed, topology, stored=stored)
    changed = build_meter_configuration_mutation(installed, topology, current, replace(current.configuration,
        aggregates=(replace(aggregate, sources=(ChannelTotalSource("channel", 2),)),)))
    technical = changed.redacted_diff.split("Exact generated total changes")[-1]
    assert "other definition fields changed (not displayed)" in technical
    assert "No total sensor definition changes" not in technical
    assert "lambda:" not in technical and "arbitrary-source-canary" not in technical
    removed = build_meter_configuration_mutation(installed, topology, current, replace(current.configuration, aggregates=()))
    assert "- id: csemh_branch_power; platform: template; internal: true" in removed.redacted_diff
    assert "arbitrary-source-canary" not in removed.redacted_diff
    assert "lambda:" not in removed.redacted_diff


def test_technical_total_review_distinguishes_metadata_only_from_no_block_changes() -> None:
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        AutomaticTotalSettings,
    )

    snapshot, topology, current = _native_total_setup(0)
    requested = replace(current.configuration,
        channels=tuple(replace(channel, role=CircuitRole.GRID) if channel.channel <= 2 else channel
            for channel in current.configuration.channels),
        automatic_totals=(AutomaticTotalSettings("grid-ct1-ct2", False, TotalOutputSettings(True, False, True)),))
    mutation = build_meter_configuration_mutation(snapshot, topology, current, requested)
    technical = mutation.redacted_diff.split("Exact generated total changes")[-1]
    assert "No total sensor definition changes" in technical
    assert "Managed totals metadata: added" in technical
    assert "csemh-automatic-totals:" in mutation.proposed_content
    assert "csemh-automatic-totals:" not in mutation.redacted_diff


def _owned_inventory(snapshot, topology, *, stored=None):
    """Real hash-bound current record for renderer tests, not source adoption tests."""
    if stored is None:
        configuration = _inventory(snapshot, topology).configuration
        stored = StoredMeterConfiguration(snapshot.sha256, configuration.meter, configuration.channels,
            configuration.default_totals, configuration.automatic_totals, configuration.aggregates,
            configuration.power_quality, configuration.status_fields)
    return _inventory(snapshot, topology, stored=stored)


def test_explicit_adoption_materializes_enabled_automatic_totals_without_other_changes() -> None:
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        TotalsChangeIntent,
    )

    snapshot, topology, current = _native_total_setup(0)
    content = snapshot.content.replace("logger:\n", "".join(f"  - id: !extend {sensor_id}\n    internal: false\n" for sensor_id in ("totalWattsMain", "totalAmpsMain", "totalEnergyDaily")) + "logger:\n")
    snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    configuration = replace(current.configuration, channels=tuple(replace(channel, role=CircuitRole.GRID) if channel.channel <= 2 else channel for channel in current.configuration.channels))
    stored = StoredMeterConfiguration(snapshot.sha256, configuration.meter, configuration.channels,
        configuration.default_totals, (), (), configuration.power_quality, configuration.status_fields, totals_managed=False)
    current = _inventory(snapshot, topology, stored=stored)
    requested = replace(current.configuration, totals_change_intent=TotalsChangeIntent(True))
    mutation = build_meter_configuration_mutation(snapshot, topology, current, requested)
    assert "Suggested circuit totals" in mutation.redacted_diff
    assert "+ Mains: CT 1 + CT 2; Watts exposed; Amps hidden; kWh exposed; bidirectional; two_ct_sum" in mutation.redacted_diff
    disabled = replace(requested, channels=tuple(replace(channel, role=CircuitRole.BRANCH) for channel in requested.channels))
    assert "Suggested circuit totals" not in build_meter_configuration_mutation(snapshot, topology, current, disabled).redacted_diff
    assert "id: csemh_auto_mains_import_energy" in mutation.proposed_content


def test_noop_is_byte_identical_and_surgical_edit_only_changes_requested_keys() -> None:
    """Existing source spans, quotes, and unrelated content are left untouched."""
    snapshot = _snapshot()
    noop = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(1, "CT 1", "sct_006_20a_25ma"),),
    )
    assert noop.changes == ()
    assert noop.proposed_content == snapshot.content

    plan = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(2, "Kitchen: mains", "sct_013_030_30a_1v", 2),),
    )
    assert [change.key for change in plan.changes] == [
        "ct2_name",
        "current_cal_ct2",
    ]
    assert 'ct2_name: "Kitchen: mains"' in plan.proposed_content
    assert 'current_cal_ct2: "4325"' in plan.proposed_content
    assert "top-secret" in plan.proposed_content
    assert "top-secret" not in plan.redacted_diff
    assert "top-secret" not in repr(plan)
    assert plan.source_sha256 == snapshot.sha256


def test_generalized_mutation_keeps_ct_wrapper_output_compatible() -> None:
    """The legacy CT entry point and generalized request produce the same mutation."""
    snapshot = _snapshot()
    topology = _topology()
    document = ESPHomeConfigDocument.parse(snapshot.content)
    current = MeterConfigurationInventory.from_document(
        "plan", document, topology, CTPresetCatalog.load(), VoltageTransformerCatalog.load(), snapshot.sha256
    )
    requested = replace(
        current.configuration,
        channels=tuple(
            replace(channel, name="Kitchen") if channel.channel == 2 else channel
            for channel in current.configuration.channels
        ),
    )

    generalized = build_meter_configuration_mutation(
        snapshot, topology, current, requested
    )
    legacy = build_ct_mutation(
        snapshot, topology, (CTChangeRequest(2, "Kitchen", "sct_006_20a_25ma"),)
    )

    assert generalized == legacy


def test_full_meter_preview_diff_groups_redacted_semantic_changes() -> None:
    snapshot = _contract_snapshot()
    content = snapshot.content.replace(
        "sensor:\n",
        """packages:
  circuitsetup_meter:
    files:
      #- Software/ESPHome/power_quality/6chan_main_power_quality.yaml
      - Software/ESPHome/status_fields/6chan_main_status.yaml
sensor:
""",
    )
    snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            friendly_name="Kitchen meter",
            voltage_references=(
                replace(current.configuration.meter.voltage_references[0], label="Service"),
            ),
        ),
        channels=tuple(
            replace(channel, name="Kitchen mains") if channel.channel == 1 else channel
            for channel in current.configuration.channels
        ),
        aggregates=(
            CircuitAggregate("load", "Kitchen load", CircuitRole.BRANCH, (ChannelTotalSource("channel", 1),), MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, TotalOutputSettings(True, False, EnergyMode.CONSUMPTION is not EnergyMode.NONE)),
        ),
        power_quality=tuple(not value for value in current.configuration.power_quality),
        status_fields=tuple(not value for value in current.configuration.status_fields),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    assert [line for line in plan.redacted_diff.splitlines() if not line.startswith(("+", "-", "~"))] == [
        "Meter", "Voltage reference", "Channel", "Advanced total hierarchy", "Package", "Exact generated total changes",
    ]
    assert "+ friendly_name: Kitchen meter" in plan.redacted_diff
    assert "+ ct1_name: Kitchen mains" in plan.redacted_diff
    assert "+ power_quality_main: enabled" in plan.redacted_diff
    assert '+        name: "${friendly_name} Service Voltage"' in plan.redacted_diff
    assert "+ Kitchen load:" in plan.redacted_diff
    assert "current_cal" not in plan.redacted_diff
    assert "gain_voltage" not in plan.redacted_diff


def test_friendly_name_only_diff_does_not_invent_voltage_block_changes() -> None:
    snapshot = _contract_snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        meter=replace(current.configuration.meter, friendly_name="Kitchen meter"),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    assert "Meter\n" in plan.redacted_diff
    assert "Voltage reference" not in plan.redacted_diff
    assert "calibration gain updated" not in plan.redacted_diff


def test_managed_voltage_diff_has_exact_removed_added_lines_and_one_gain_marker() -> None:
    snapshot = _contract_snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    first_request = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_references=(
                replace(
                    current.configuration.meter.voltage_references[0],
                    label="Old service",
                ),
            ),
        ),
    )
    first = build_meter_configuration_mutation(snapshot, topology, current, first_request)
    installed = replace(
        snapshot,
        content=first.proposed_content,
        sha256=sha256(first.proposed_content.encode()).hexdigest(),
    )
    installed_current = _inventory(installed, topology)
    requested = replace(
        installed_current.configuration,
        meter=replace(
            installed_current.configuration.meter,
            voltage_references=(
                replace(
                    installed_current.configuration.meter.voltage_references[0],
                    label="New service",
                    gain_voltage=7306,
                ),
            ),
        ),
    )

    plan = build_meter_configuration_mutation(
        installed, topology, installed_current, requested
    )

    assert '-        name: "${friendly_name} Old service Voltage"' in plan.redacted_diff
    assert '+        name: "${friendly_name} New service Voltage"' in plan.redacted_diff
    assert plan.redacted_diff.count("calibration gain updated") == 1
    assert "7305" not in plan.redacted_diff
    assert "7306" not in plan.redacted_diff


def test_generalized_mutation_requires_authoritative_inventory_capability() -> None:
    """A real provisional inventory cannot mutate even when the snapshot looks final."""
    snapshot = _snapshot()
    topology = _topology()
    current = MeterConfigurationInventory.from_document(
        "plan",
        ESPHomeConfigDocument.parse(snapshot.content),
        topology,
        CTPresetCatalog.load(),
        VoltageTransformerCatalog.load(),
        snapshot.sha256,
        configuration_authoritative=False,
    )

    with pytest.raises(ConfigMutationError, match="authoritative"):
        build_meter_configuration_mutation(
            snapshot, topology, current, current.configuration
        )


@pytest.mark.parametrize(
    ("old_frequency", "expected_frequency"),
    (("'60Hz'", "'50Hz'"), ("60Hz", '"50Hz"')),
)
def test_generalized_mutation_renders_electrical_settings_and_references(
    old_frequency: str, expected_frequency: str
) -> None:
    """Electrical edits remain in the owned block and preserve scalar quoting."""
    snapshot = _snapshot()
    content = snapshot.content.replace(
        "substitutions:\n",
        "substitutions:\n"
        "  friendly_name: Old Meter\n"
        "  update_time: 10s\n"
        f"  electric_freq: {old_frequency}\n",
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )
    current = _inventory(snapshot, _topology())
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            friendly_name="Kitchen: meter",
            electrical_system=ElectricalSystem.SINGLE_PHASE_230,
            line_frequency_hz=50,
            update_interval_s=5,
                voltage_layout=VoltageLayout.STANDARD,
                voltage_references=(
                    replace(
                        current.configuration.meter.voltage_references[0],
                        gain_voltage=7305,
                        nominal_voltage_v=230.0,
                    ),
                ),
        ),
    )

    plan = build_meter_configuration_mutation(
        snapshot, _topology(), current, requested
    )

    assert 'friendly_name: "Kitchen: meter"' in plan.proposed_content
    assert "update_time: 5s" in plan.proposed_content
    assert f"electric_freq: {expected_frequency}" in plan.proposed_content
    block = plan.proposed_content.split(
        "# CircuitSetup Energy Meter Helper: voltage references v1\n", 1
    )[1].split("# End CircuitSetup Energy Meter Helper", 1)[0]
    assert block.count("gain_voltage: 7305") == 6
    assert block.count("\n    frequency:") == 1
    assert block.count("disabled_by_default: false") == 2
    assert 'name: "${friendly_name} Main Voltage"' in block
    assert 'name: "${friendly_name} Main Frequency"' in block
    assert block.count("entity_category: diagnostic") == 3
    assert block.count("disabled_by_default: true") == 3
    assert "board_revision" not in plan.proposed_content

    stored = StoredMeterConfiguration(sha256(plan.proposed_content.encode()).hexdigest(), requested.meter, requested.channels, requested.default_totals, requested.automatic_totals, requested.aggregates, requested.power_quality,
    requested.status_fields,)
    rehydrated_snapshot = replace(
        snapshot,
        content=plan.proposed_content,
        sha256=stored.config_sha256,
    )
    rehydrated = _inventory(rehydrated_snapshot, _topology(), stored=stored)
    assert rehydrated.configuration.meter.voltage_references == requested.meter.voltage_references
    assert "stored_semantics_stale" not in rehydrated.warnings


def test_generalized_mutation_uses_one_representative_per_reference() -> None:
    """Each reference exposes its canonical lowest group only."""
    snapshot = _package_snapshot()
    topology = _two_board_topology()
    current = _inventory(snapshot, topology)
    first = current.configuration.meter.voltage_references[0]
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_layout=VoltageLayout.MULTI_REFERENCE,
            voltage_references=(
                replace(
                    first,
                    reference_id="main",
                    gain_voltage=7305,
                    group_keys=("main_1", "addon1_2"),
                ),
                VoltageReferenceConfig(
                    "secondary", "Secondary", "B", 230.0, "custom", 8002,
                    ("main_2", "addon1_1"),
                ),
            ),
        ),
        channels=tuple(
            replace(channel, voltage_reference_id="secondary")
            if channel.channel in (*range(4, 10),)
            else channel
            for channel in current.configuration.channels
        ),
        multi_reference_preparation_acknowledged=True,
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    block = plan.proposed_content.split(
        "# CircuitSetup Energy Meter Helper: voltage references v1\n", 1
    )[1].split("# End CircuitSetup Energy Meter Helper", 1)[0]
    for meter_id, gain in (
        ("meter_main1", 7305),
        ("meter_main2", 8002),
        ("addon1_1", 8002),
        ("addon1_2", 7305),
    ):
        group = block.split(f"id: !extend {meter_id}\n", 1)[1].split(
            "\n  - id:", 1
        )[0]
        assert group.count(f"gain_voltage: {gain}") == 3
    for meter_id in ("meter_main1", "meter_main2"):
        group = block.split(f"id: !extend {meter_id}\n", 1)[1].split(
            "\n  - id:", 1
        )[0]
        assert "voltage:\n        name:" in group
        assert "frequency:\n      name:" in group
        assert group.count("disabled_by_default: false") == 2
    assert 'name: "${friendly_name} Main Voltage"' in block
    assert 'name: "${friendly_name} Secondary Frequency"' in block
    expected = voltage_reference_topology_from_configuration(topology, requested)
    assert voltage_reference_topology_from_config(
        ESPHomeConfigDocument.parse(plan.proposed_content),
        topology,
        trusted_fingerprint=expected.fingerprint,
    ).fingerprint == expected.fingerprint
    assert block.count("\n    frequency:") == 2

    stored = StoredMeterConfiguration(sha256(plan.proposed_content.encode()).hexdigest(), requested.meter, requested.channels, requested.default_totals, requested.automatic_totals, requested.aggregates, requested.power_quality,
    requested.status_fields,)
    rehydrated = _inventory(
        replace(snapshot, content=plan.proposed_content, sha256=stored.config_sha256),
        topology,
        stored=stored,
    )
    assert rehydrated.configuration.meter.voltage_references == requested.meter.voltage_references
    assert rehydrated.voltage_topology.fingerprint == expected.fingerprint


def test_group_transfer_updates_channel_reference_metadata_without_fake_yaml() -> None:
    snapshot = _contract_snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    first = current.configuration.meter.voltage_references[0]
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_layout=VoltageLayout.MULTI_REFERENCE,
            voltage_references=(
                replace(first, group_keys=("main_1",)),
                VoltageReferenceConfig(
                    "secondary", "Secondary", "B", 120.0, "default", 1,
                    ("main_2",),
                ),
            ),
        ),
        channels=tuple(
            replace(channel, voltage_reference_id="secondary")
            if channel.channel >= 4
            else channel
            for channel in current.configuration.channels
        ),
        multi_reference_preparation_acknowledged=True,
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    assert "voltage_reference_id" not in plan.proposed_content
    assert "Channel" in plan.redacted_diff
    assert '"voltage_reference_id": "secondary"' in plan.redacted_diff


def test_voltage_reference_preview_never_echoes_owned_block_content() -> None:
    """The review summary stays useful without exposing user-owned YAML values."""
    snapshot = _snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    initial_request = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_references=(
                replace(
                    current.configuration.meter.voltage_references[0],
                    label="Initial service",
                ),
            ),
        ),
    )
    first = build_meter_configuration_mutation(snapshot, topology, current, initial_request)
    secret_content = first.proposed_content.replace(
        'name: "${friendly_name} Main Voltage"', "name: super-secret-token"
    )
    secret_snapshot = replace(
        snapshot,
        content=secret_content,
        sha256=sha256(secret_content.encode()).hexdigest(),
    )
    secret_current = _inventory(secret_snapshot, topology)
    requested = replace(
        secret_current.configuration,
        meter=replace(
            secret_current.configuration.meter,
            voltage_references=(
                replace(
                    secret_current.configuration.meter.voltage_references[0], gain_voltage=7306
                ),
            ),
        ),
    )

    plan = build_meter_configuration_mutation(
        secret_snapshot, topology, secret_current, requested
    )

    assert "Voltage reference" in plan.redacted_diff
    assert "7306" not in plan.redacted_diff
    assert "super-secret-token" not in plan.redacted_diff


def test_managed_voltage_reference_gains_fail_closed_but_ignore_outside_spoofs() -> None:
    """Only the exact owned sensor block can retain hash-bound voltage gains."""
    snapshot = _snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_references=(
                replace(current.configuration.meter.voltage_references[0], gain_voltage=7305),
            ),
        ),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    malformed = plan.proposed_content.replace(
        "gain_voltage: 7305", "gain_voltage: 111", 1
    )
    malformed_stored = StoredMeterConfiguration(sha256(malformed.encode()).hexdigest(), requested.meter, requested.channels, requested.default_totals, requested.automatic_totals, requested.aggregates, requested.power_quality,
    requested.status_fields,)
    malformed_inventory = _inventory(
        replace(snapshot, content=malformed, sha256=malformed_stored.config_sha256),
        topology,
        stored=malformed_stored,
    )
    assert "stored_semantics_stale" in malformed_inventory.warnings

    metadata = "  # csemh-voltage-references: main=[main_1,main_2]\n"
    ambiguous = plan.proposed_content.replace(metadata, metadata * 2)
    ambiguous_stored = replace(
        malformed_stored,
        config_sha256=sha256(ambiguous.encode()).hexdigest(),
    )
    assert "stored_semantics_stale" in _inventory(
        replace(snapshot, content=ambiguous, sha256=ambiguous_stored.config_sha256),
        topology,
        stored=ambiguous_stored,
    ).warnings

    missing_metadata = plan.proposed_content.replace(metadata, "")
    missing_metadata_stored = replace(
        malformed_stored,
        config_sha256=sha256(missing_metadata.encode()).hexdigest(),
    )
    assert "stored_semantics_stale" in _inventory(
        replace(
            snapshot,
            content=missing_metadata,
            sha256=missing_metadata_stored.config_sha256,
        ),
        topology,
        stored=missing_metadata_stored,
    ).warnings

    spoofed = plan.proposed_content.replace(
        "sensor:\n", "# csemh-voltage-references: attacker=[main_1,main_2]\nsensor:\n"
    )
    spoofed_stored = replace(
        malformed_stored,
        config_sha256=sha256(spoofed.encode()).hexdigest(),
    )
    spoofed_inventory = _inventory(
        replace(snapshot, content=spoofed, sha256=spoofed_stored.config_sha256),
        topology,
        stored=spoofed_stored,
    )
    assert spoofed_inventory.configuration.meter.voltage_references == requested.meter.voltage_references
    assert "stored_semantics_stale" not in spoofed_inventory.warnings


def test_authoritative_inventory_emits_voltage_reference_mismatch_for_owned_yaml() -> None:
    """An external owned reference mapping drift is actionable without a fake hash."""

    snapshot = _snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_references=(
                replace(current.configuration.meter.voltage_references[0], gain_voltage=7305),
            ),
        ),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    mismatched = plan.proposed_content.replace(
        "main=[main_1,main_2]", "other=[main_1,main_2]", 1
    )
    stored = StoredMeterConfiguration(sha256(plan.proposed_content.encode()).hexdigest(), requested.meter, requested.channels, requested.default_totals, requested.automatic_totals, requested.aggregates, requested.power_quality,
    requested.status_fields,)

    with pytest.raises(VoltageReferenceMismatchError):
        _inventory(
            replace(
                snapshot,
                content=mismatched,
                sha256=sha256(mismatched.encode()).hexdigest(),
            ),
            topology,
            stored=stored,
        )


def test_authoritative_inventory_emits_voltage_reference_mismatch_for_external_gain_drift() -> None:
    """A changed owned gain cannot be hidden behind the normal stale hash path."""

    snapshot = _snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_references=(
                replace(current.configuration.meter.voltage_references[0], gain_voltage=7305),
            ),
        ),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    changed = plan.proposed_content.replace("gain_voltage: 7305", "gain_voltage: 7306", 1)
    stored = StoredMeterConfiguration(sha256(plan.proposed_content.encode()).hexdigest(), requested.meter, requested.channels, requested.default_totals, requested.automatic_totals, requested.aggregates, requested.power_quality,
    requested.status_fields,)

    with pytest.raises(VoltageReferenceMismatchError):
        _inventory(
            replace(
                snapshot,
                content=changed,
                sha256=sha256(changed.encode()).hexdigest(),
            ),
            topology,
            stored=stored,
        )


def test_unrelated_external_drift_only_marks_stored_semantics_stale() -> None:
    """Hash drift outside owned voltage references does not fabricate a mismatch."""

    snapshot = _snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_references=(
                replace(current.configuration.meter.voltage_references[0], gain_voltage=7305),
            ),
        ),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    changed = plan.proposed_content.replace("logger:\n  level: DEBUG", "logger:\n  level: INFO")
    stored = StoredMeterConfiguration(sha256(plan.proposed_content.encode()).hexdigest(), requested.meter, requested.channels, requested.default_totals, requested.automatic_totals, requested.aggregates, requested.power_quality,
    requested.status_fields,)

    inventory = _inventory(
        replace(
            snapshot,
            content=changed,
            sha256=sha256(changed.encode()).hexdigest(),
        ),
        topology,
        stored=stored,
    )

    assert "stored_semantics_stale" in inventory.warnings


@pytest.mark.parametrize(
    "mutation",
    (
        lambda content: content.replace(
            "    phase_a:\n      gain_voltage: 7305",
            "    phase_a:\n      gain_voltage: 111\n      gain_voltage: 7305",
            1,
        ),
        lambda content: content.replace(
            "      gain_voltage: 7305\n      voltage:",
            "      gain_voltage: 7305\n      gain_voltage: 111\n      voltage:",
            1,
        ),
        lambda content: content.replace(
            "      gain_voltage: 7305\n", "      gain_voltage: 7305#tampered\n", 1
        ),
        lambda content: content.replace(
            "    phase_b:\n",
            "    phase_a:\n      gain_voltage: 7305\n    phase_b:\n",
            1,
        ),
        lambda content: content.replace(
            "      voltage:\n",
            "      voltage:\n        gain_voltage: 111\n",
            1,
        ),
        lambda content: content.replace(
            "      voltage:\n",
            "      current: [*defaults]\n      voltage:\n",
            1,
        ),
        lambda content: content.replace(
            "  # csemh-voltage-references: main=[main_1,main_2]\n",
            "  # csemh-voltage-references: main=[main_1,main_2]\n  bogus: true\n",
            1,
        ),
        lambda content: content.replace(
            "  - id: !extend meter_main1\n",
            "  - id: !extend meter_main1\n    gain_voltage: 111\n",
            1,
        ),
        lambda content: content.replace(
            "    phase_b:\n", "    current: false\n    phase_b:\n", 1
        ),
        lambda content: content.replace(
            "    frequency:\n",
            "    frequency:\n      name: duplicate\n    frequency:\n",
            1,
        ),
        lambda content: content.replace(
            "        disabled_by_default: false\n",
            "        disabled_by_default: false\n        disabled_by_default: false\n",
            1,
        ),
        lambda content: content.replace(
            "    phase_b:\n",
            "    'phase_a':\n      gain_voltage: 111\n    phase_b:\n",
            1,
        ),
        lambda content: content.replace(
            "    phase_b:\n",
            '    "phase_a":\n      gain_voltage: 111\n    phase_b:\n',
            1,
        ),
    ),
)
def test_managed_voltage_reference_gains_reject_duplicate_or_nested_yaml(
    mutation: object,
) -> None:
    """Stored gains cannot be retained when YAML has ambiguous effective keys."""
    snapshot = _snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_references=(
                replace(current.configuration.meter.voltage_references[0], gain_voltage=7305),
            ),
        ),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    assert callable(mutation)
    tampered = mutation(plan.proposed_content)
    stored = StoredMeterConfiguration(sha256(tampered.encode()).hexdigest(), requested.meter, requested.channels, requested.default_totals, requested.automatic_totals, requested.aggregates, requested.power_quality,
    requested.status_fields,)

    assert "stored_semantics_stale" in _inventory(
        replace(snapshot, content=tampered, sha256=stored.config_sha256),
        topology,
        stored=stored,
    ).warnings


def test_inventory_requires_caller_digest_to_match_document_before_stored_state() -> None:
    """A stale caller digest cannot authenticate tampered YAML or stored semantics."""
    snapshot = _snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_references=(
                replace(current.configuration.meter.voltage_references[0], gain_voltage=7305),
            ),
        ),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    stored = StoredMeterConfiguration(sha256(plan.proposed_content.encode()).hexdigest(), requested.meter, requested.channels, requested.default_totals, requested.automatic_totals, requested.aggregates, requested.power_quality,
    requested.status_fields,)
    tampered = plan.proposed_content.replace("key: top-secret", "key: tampered")

    inventory = _inventory(
        replace(snapshot, content=tampered, sha256=stored.config_sha256),
        topology,
        stored=stored,
    )

    assert "stored_semantics_stale" in inventory.warnings
    assert inventory.configuration.meter.voltage_references != requested.meter.voltage_references


def test_managed_voltage_reference_gains_allow_harmless_comments() -> None:
    """Comments do not alter the exact helper-owned structure."""
    snapshot = _snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_references=(
                replace(current.configuration.meter.voltage_references[0], gain_voltage=7305),
            ),
        ),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    compatible = plan.proposed_content.replace(
        "    phase_a:\n",
        "    phase_a: # CT1\n",
        1,
    ).replace(
        "      gain_voltage: 7305\n",
        "      gain_voltage: 7305 # calibrated\n",
        1,
    ).replace(
        "        disabled_by_default: false\n",
        "        disabled_by_default: false # generated\n",
        1,
    )
    stored = StoredMeterConfiguration(sha256(compatible.encode()).hexdigest(), requested.meter, requested.channels, requested.default_totals, requested.automatic_totals, requested.aggregates, requested.power_quality,
    requested.status_fields,)

    inventory = _inventory(
        replace(snapshot, content=compatible, sha256=stored.config_sha256),
        topology,
        stored=stored,
    )

    assert inventory.configuration.meter.voltage_references == requested.meter.voltage_references
    assert "stored_semantics_stale" not in inventory.warnings


def test_reporting_preview_never_echoes_owned_block_content() -> None:
    """The shared phase preview summary cannot reveal earlier YAML content."""
    before = (
        "# CircuitSetup Energy Meter Helper: phase overrides v1\n"
        "  name: super-secret-token\n"
        "# End CircuitSetup Energy Meter Helper: phase overrides v1\n"
    )
    after = before.replace("super-secret-token", "updated")

    assert config_mutator._reporting_multiplier_diff(before, after) == (
        "managed phase overrides updated"
    )


def test_generalized_mutation_requires_multi_reference_acknowledgement() -> None:
    """A multi-reference edit is never treated as proof of physical preparation."""
    snapshot = _package_snapshot()
    topology = _two_board_topology()
    current = _inventory(snapshot, topology)
    first = current.configuration.meter.voltage_references[0]
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_layout=VoltageLayout.MULTI_REFERENCE,
            voltage_references=(
                replace(first, group_keys=("main_1", "main_2")),
                VoltageReferenceConfig(
                    "secondary", "Secondary", "B", 230.0, "custom", 8002,
                    ("addon1_1", "addon1_2"),
                ),
            ),
        ),
        channels=tuple(
            replace(channel, voltage_reference_id="secondary")
            if channel.channel >= 7
            else channel
            for channel in current.configuration.channels
        ),
    )

    with pytest.raises(ConfigMutationError, match="acknowledgement"):
        build_meter_configuration_mutation(snapshot, topology, current, requested)
    with pytest.raises(ConfigMutationError, match="capability"):
        build_meter_configuration_mutation(
            snapshot,
            topology,
            replace(current, capabilities=replace(current.capabilities, multi_reference=False)),
            replace(requested, multi_reference_preparation_acknowledged=True),
        )


def test_legacy_wrapper_repairs_invalid_inventory_with_multiplier_and_packages() -> None:
    """Current collisions must not prevent the requested CT repair from being applied."""
    snapshot = _package_snapshot()
    content = snapshot.content.replace("ct2_name: CT 2", "ct2_name: CT 1")
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    plan = build_ct_mutation(
        snapshot,
        _two_board_topology(),
        (CTChangeRequest(2, "Kitchen", "sct_006_20a_25ma", 2),),
        package_options={
            "power_quality": (True, False),
            "status_fields": (False, True),
        },
    )

    assert "ct2_name: Kitchen" in plan.proposed_content
    assert "multiply: 2" in plan.proposed_content
    assert "      - Software/ESPHome/power_quality/6chan_main_power_quality.yaml" in plan.proposed_content
    assert "      - Software/ESPHome/status_fields/6chan_addon1_status.yaml" in plan.proposed_content


@pytest.mark.parametrize(
    "requests",
    ((), (CTChangeRequest(2, "Kitchen", "sct_006_20a_25ma"),)),
)
def test_legacy_wrapper_rejects_invalid_untouched_inventory(
    requests: tuple[CTChangeRequest, ...],
) -> None:
    """Repair mode does not bless an invalid channel omitted by the request."""
    with pytest.raises(ValueError, match="missing active substitution"):
        build_ct_mutation(
            _snapshot(missing="current_cal_ct3"),
            _topology(),
            requests,
        )


@pytest.mark.parametrize(
    "requests",
    ((), (CTChangeRequest(2, "Kitchen", "sct_006_20a_25ma"),)),
)
@pytest.mark.parametrize(
    "setting, message",
    (
        ("voltage_cal1: 0", "invalid gain for voltage_cal1"),
        ("electric_freq: 55Hz", "unsupported electric_freq"),
        ("update_time: 7s", "unsupported update_time"),
        ("main_meter_id1: !secret meter_id", "unsafe non-literal"),
    ),
)
def test_repair_fallback_validates_complete_proposed_meter_configuration(
    requests: tuple[CTChangeRequest, ...], setting: str, message: str
) -> None:
    """A CT repair cannot preserve invalid complete meter settings."""
    snapshot = _snapshot()
    content = snapshot.content.replace(
        "substitutions:\n", f"substitutions:\n  {setting}\n"
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    with pytest.raises(ValueError, match=message):
        build_ct_mutation(snapshot, _topology(), requests)


@pytest.mark.parametrize(
    "requests",
    ((), (CTChangeRequest(2, "Kitchen", "sct_006_20a_25ma"),)),
)
def test_ct_mutation_rejects_invalid_untouched_package_structure(
    requests: tuple[CTChangeRequest, ...],
) -> None:
    """No-op and CT changes both preserve package structural validation."""
    snapshot = _snapshot()
    content = snapshot.content.replace(
        "logger:\n", "packages:\n  meter:\n    files: inline\nlogger:\n"
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    with pytest.raises(ValueError, match="inline package"):
        build_ct_mutation(snapshot, _topology(), requests)


def test_board_package_options_toggle_only_requested_meter_boards() -> None:
    """A wrong board index or direction would enable the wrong firmware package."""
    plan = build_ct_mutation(
        _package_snapshot(),
        _two_board_topology(),
        (),
        package_options={
            "power_quality": (True, False),
            "status_fields": (False, True),
        },
    )

    assert "      - Software/ESPHome/power_quality/6chan_main_power_quality.yaml # keep this note\n" in plan.proposed_content
    assert "      #- Software/ESPHome/power_quality/6chan_addon1_power_quality.yaml\n" in plan.proposed_content
    assert "      #- Software/ESPHome/status_fields/6chan_main_status.yaml\n" in plan.proposed_content
    assert "      - Software/ESPHome/status_fields/6chan_addon1_status.yaml\n" in plan.proposed_content
    assert [change.key for change in plan.changes] == [
        "power_quality_main",
        "status_fields_main",
        "status_fields_addon1",
    ]
    assert "top-secret" not in plan.redacted_diff


def test_board_package_options_reflect_active_lines_in_the_current_config() -> None:
    """Ignoring active package lines would show stale defaults for existing meters."""
    options = config_mutator.package_options_from_document(
        ESPHomeConfigDocument.parse(_package_snapshot().content),
        _two_board_topology(),
    )

    assert options == {
        "power_quality": (False, False),
        "status_fields": (True, False),
    }


def test_board_package_options_support_indentless_remote_file_lists() -> None:
    """Official configs align active list items with the ``files`` key."""
    snapshot = _package_snapshot()
    content = snapshot.content.replace(
        "      - Software/ESPHome/status_fields/6chan_main_status.yaml\n",
        "    - Software/ESPHome/status_fields/6chan_main_status.yaml\n",
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    assert config_mutator.package_options_from_document(
        ESPHomeConfigDocument.parse(content), _two_board_topology()
    )["status_fields"] == (True, False)

    plan = build_ct_mutation(
        snapshot,
        _two_board_topology(),
        (),
        package_options={
            "power_quality": (True, False),
            "status_fields": (True, False),
        },
    )

    assert (
        "    - Software/ESPHome/power_quality/6chan_main_power_quality.yaml"
        " # keep this note"
        in plan.proposed_content.splitlines()
    )


def test_package_option_indentation_comes_from_its_own_files_list() -> None:
    snapshot = _package_snapshot()
    content = snapshot.content.replace(
        "    files:\n",
        "    files:\n"
        "    - Software/ESPHome/meter_sensors/6chan_main_sensor.yaml\n",
    ).replace(
        "      - Software/ESPHome/status_fields/6chan_main_status.yaml\n",
        "      #- Software/ESPHome/status_fields/6chan_main_status.yaml\n",
    ).replace(
        "sensor:\n",
        "  unrelated:\n"
        "    files:\n"
        "      - Software/ESPHome/meter_sensors/unrelated.yaml\n"
        "sensor:\n",
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    plan = build_ct_mutation(
        snapshot,
        _two_board_topology(),
        (),
        package_options={
            "power_quality": (False, False),
            "status_fields": (False, True),
        },
    )

    assert "    - Software/ESPHome/status_fields/6chan_addon1_status.yaml" in (
        plan.proposed_content.splitlines()
    )


def test_board_package_options_require_one_state_per_installed_board() -> None:
    """A short selection must not silently leave an installed board unchanged."""
    with pytest.raises(ConfigMutationError, match="installed board"):
        build_ct_mutation(
            _package_snapshot(),
            _two_board_topology(),
            (),
            package_options={
                "power_quality": (True,),
                "status_fields": (True, False),
            },
        )


def test_reporting_multiplier_divides_gain_and_multiplies_current_and_power() -> None:
    """CT scaling must keep the ATM90E32 register and reported output in sync."""
    snapshot = _snapshot()

    plan = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(2, "CT 2", "sct_013_030_30a_1v", 2),),
    )

    assert 'current_cal_ct2: "4325"' in plan.proposed_content
    assert (
        """  - id: !extend meter_main1
    phase_b: # CT2
      current:
        filters:
          - multiply: 2
      power:
        filters:
          - multiply: 2
"""
        in plan.proposed_content
    )
    assert "- platform: uptime" in plan.proposed_content


def test_power_quality_scaling_uses_managed_phase_overrides() -> None:
    """A scaled PQ phase must scale only its supported measurements."""
    snapshot = _package_snapshot()

    plan = build_ct_mutation(
        snapshot,
        _two_board_topology(),
        (CTChangeRequest(1, "CT 1", "sct_006_20a_25ma", 4),),
        package_options={
            "power_quality": (True, False),
            "status_fields": (True, False),
        },
    )

    assert (
        """  - id: !extend meter_main1
    phase_a: # CT1
      current:
        filters:
          - multiply: 4
      power:
        filters:
          - multiply: 4
      reactive_power:
        filters:
          - multiply: 4
      apparent_power:
        filters:
          - multiply: 4
"""
        in plan.proposed_content
    )
    assert "power_factor:\n        filters:" not in plan.proposed_content
    assert "phase_angle:\n        filters:" not in plan.proposed_content


def test_generalized_meter_preview_scales_addon_power_quality_and_consumption_energy() -> None:
    """The meter workflow emits the real scaled PQ and aggregate configuration."""
    topology = _two_board_topology()
    source = _contract_snapshot_for(topology)
    content = source.content.replace(
        "sensor:\n",
        """packages:
  circuitsetup_meter:
    files:
      #- Software/ESPHome/power_quality/6chan_main_power_quality.yaml
      #- Software/ESPHome/power_quality/6chan_addon1_power_quality.yaml
      #- Software/ESPHome/status_fields/6chan_main_status.yaml
      #- Software/ESPHome/status_fields/6chan_addon1_status.yaml
sensor:
""",
    )
    snapshot = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())
    current = _owned_inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        channels=tuple(
            replace(channel, reporting_multiplier=4) if channel.channel == 7 else channel
            for channel in current.configuration.channels
        ),
        aggregates=(
            CircuitAggregate("load", "Load", CircuitRole.BRANCH, (ChannelTotalSource("channel", 7),), MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, TotalOutputSettings(True, False, EnergyMode.CONSUMPTION is not EnergyMode.NONE)),
        ),
        power_quality=(False, True),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    assert (
        """  - id: !extend addon1_1
    phase_a: # CT7
      current:
        filters:
          - multiply: 4
      power:
        filters:
          - multiply: 4
      reactive_power:
        filters:
          - multiply: 4
      apparent_power:
        filters:
          - multiply: 4
"""
        in plan.proposed_content
    )
    assert "csemh_load_energy" in plan.proposed_content


@pytest.mark.parametrize("multiplier", (1, 2))
def test_unused_channel_removes_all_power_quality_outputs(multiplier: int) -> None:
    """Unused phases retain calibration outputs but remove every PQ output."""
    snapshot = _package_snapshot()
    topology = _two_board_topology()
    current = _inventory(snapshot, topology)
    current = replace(
        current,
        configuration=replace(
            current.configuration,
            channels=tuple(
                replace(channel, enabled=False, role=CircuitRole.UNUSED)
                if channel.channel == 2
                else channel
                for channel in current.configuration.channels
            ),
        ),
    )
    requested = replace(
        current.configuration,
        channels=tuple(
            replace(channel, reporting_multiplier=multiplier)
            if channel.channel == 2
            else channel
            for channel in current.configuration.channels
        ),
        power_quality=(True, False),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    phase = plan.proposed_content.split("phase_b: # CT2", 1)[1].split(
        "# End CircuitSetup", 1
    )[0]
    assert (
        """      reactive_power: !remove
      apparent_power: !remove
      power_factor: !remove
      phase_angle: !remove
"""
        in phase
    )
    assert "\n      current: !remove" not in phase
    assert "\n      power: !remove" not in phase
    assert phase.count("multiply: 2") == (2 if multiplier == 2 else 0)


def test_unused_channel_hides_runtime_current_and_power_but_keeps_calibration() -> None:
    """An unused CT remains calibratable without public runtime entities."""
    snapshot = _package_snapshot()
    topology = _two_board_topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        channels=tuple(
            replace(channel, enabled=False, role=CircuitRole.UNUSED)
            if channel.channel == 3
            else channel
            for channel in current.configuration.channels
        ),
        power_quality=(True, False),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    phase = plan.proposed_content.split("phase_c: # CT3", 1)[1].split(
        "# End CircuitSetup", 1
    )[0]
    assert "      current:\n        internal: true" in phase
    assert "      power:\n        internal: true" in phase
    assert "current_cal_ct3" in plan.proposed_content
    assert "      current: !remove" not in phase
    assert "      power: !remove" not in phase


def test_unused_channel_hides_its_supported_status_phase_text() -> None:
    """The official status package exposes each CT status below phase_status."""
    snapshot = _package_snapshot()
    topology = _two_board_topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        channels=tuple(
            replace(channel, enabled=False, role=CircuitRole.UNUSED)
            if channel.channel == 3
            else channel
            for channel in current.configuration.channels
        ),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    assert (
        "text_sensor:\n"
        "# CircuitSetup Energy Meter Helper: status overrides v1\n"
        "  - id: !extend meter_main1\n"
        "    phase_status:\n"
        "      phase_c:\n"
        "        internal: true\n"
        "# End CircuitSetup Energy Meter Helper: status overrides v1\n"
    ) in plan.proposed_content


@pytest.mark.parametrize("newline", ("\n", "\r\n"))
@pytest.mark.parametrize("owned_comment", (False, True))
def test_removing_last_status_override_removes_its_text_sensor_section(
    newline: str,
    owned_comment: bool,
) -> None:
    snapshot = _package_snapshot()
    topology = _two_board_topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        channels=tuple(
            replace(channel, enabled=False, role=CircuitRole.UNUSED)
            if channel.channel == 3
            else channel
            for channel in current.configuration.channels
        ),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    content = plan.proposed_content.replace("\n", newline)
    if owned_comment:
        content = content.replace(
            "# CircuitSetup Energy Meter Helper: status overrides v1" + newline,
            "# CircuitSetup Energy Meter Helper: status overrides v1"
            + newline
            + "  # Owned helper block comment"
            + newline,
        )
    document = ESPHomeConfigDocument.parse(content)

    restored = config_mutator._apply_status_overrides(
        content,
        {3: (True, 1.0)},
        (True, False),
        document.substitutions,
    )

    assert "status overrides v1" not in restored
    assert f"{newline}text_sensor:{newline}" not in restored
    assert "\r\n" in restored if newline == "\r\n" else "\r\n" not in restored


@pytest.mark.parametrize("newline", ("\n", "\r\n"))
@pytest.mark.parametrize(
    ("header_suffix", "before", "after"),
    (
        ("", "  # keep-before\n", ""),
        ("", "", "  # keep-after\n"),
        ("", "  # keep-before\n", "  # keep-after\n"),
        (" # keep-inline", "", ""),
        ("", "  # inline comment\n", "# logger: this remains a comment\n"),
    ),
)
def test_status_override_removal_preserves_user_section_comments(
    newline: str,
    header_suffix: str,
    before: str,
    after: str,
) -> None:
    snapshot = _package_snapshot()
    topology = _two_board_topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        channels=tuple(
            replace(channel, enabled=False, role=CircuitRole.UNUSED)
            if channel.channel == 3
            else channel
            for channel in current.configuration.channels
        ),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    content = plan.proposed_content.replace("\n", newline)
    before = before.replace("\n", newline)
    after = after.replace("\n", newline)
    content = content.replace(
        "text_sensor:" + newline,
        "text_sensor:" + header_suffix + newline + before,
    )
    content = content.replace(
        "# End CircuitSetup Energy Meter Helper: status overrides v1" + newline,
        "# End CircuitSetup Energy Meter Helper: status overrides v1" + newline + after,
    )

    restored = config_mutator._apply_status_overrides(
        content,
        {3: (True, 1.0)},
        (True, False),
        ESPHomeConfigDocument.parse(content).substitutions,
    )

    assert "text_sensor:" in restored
    assert "text_sensor:" + header_suffix + newline in restored
    assert before in restored
    assert after in restored
    readded = config_mutator._apply_status_overrides(
        restored,
        {3: (False, 1.0)},
        (True, False),
        ESPHomeConfigDocument.parse(restored).substitutions,
    )
    assert "text_sensor:" + header_suffix + newline in readded
    assert before in readded
    assert after in readded
    ESPHomeConfigDocument.parse(readded)


@pytest.mark.parametrize(
    ("content_change", "sibling"),
    (
        (
            lambda content: content.replace(
                "text_sensor:\n",
                "text_sensor:\n  - platform: template\n    name: Keep before\n",
            ),
            "  - platform: template\n    name: Keep before\n",
        ),
        (
            lambda content: content.replace(
                "# End CircuitSetup Energy Meter Helper: status overrides v1\n",
                "# End CircuitSetup Energy Meter Helper: status overrides v1\n"
                "\n  # Keep this comment\n"
                "  - platform: template\n"
                "    name: Keep after\n"
                "  - platform: template\n"
                "    name: Keep another\n"
                "logger:\n"
                "  level: DEBUG\n",
            ),
            (
                "\n  # Keep this comment\n"
                "  - platform: template\n"
                "    name: Keep after\n"
                "  - platform: template\n"
                "    name: Keep another\n"
                "logger:\n"
                "  level: DEBUG\n"
            ),
        ),
    ),
)
def test_status_override_removal_preserves_user_text_sensor_siblings(
    content_change: object,
    sibling: str,
) -> None:
    snapshot = _package_snapshot()
    topology = _two_board_topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        channels=tuple(
            replace(channel, enabled=False, role=CircuitRole.UNUSED)
            if channel.channel == 3
            else channel
            for channel in current.configuration.channels
        ),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    assert callable(content_change)
    content = content_change(plan.proposed_content)
    document = ESPHomeConfigDocument.parse(content)

    restored = config_mutator._apply_status_overrides(
        content,
        {3: (True, 1.0)},
        (True, False),
        document.substitutions,
    )

    assert "text_sensor:" in restored
    assert sibling in restored
    assert "status overrides v1" in restored
    status = restored.split("status overrides v1", 1)[1].split(
        "# End CircuitSetup", 1
    )[0]
    assert "internal: true" not in status
    readded = config_mutator._apply_status_overrides(
        restored,
        {3: (False, 1.0)},
        (True, False),
        ESPHomeConfigDocument.parse(restored).substitutions,
    )
    status = readded.split("status overrides v1", 1)[1].split(
        "# End CircuitSetup", 1
    )[0]
    assert status.count("internal: true") == 1
    assert sibling in readded
    ESPHomeConfigDocument.parse(readded)


@pytest.mark.parametrize("power_quality", ((False, False), (True, False)))
def test_channel_state_changes_render_runtime_visibility(
    power_quality: tuple[bool, bool],
) -> None:
    """A channel role change is represented by its managed runtime visibility."""
    snapshot = _package_snapshot()
    topology = _two_board_topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        channels=(
            replace(
                current.configuration.channels[0],
                enabled=False,
                role=CircuitRole.UNUSED,
            ),
            *current.configuration.channels[1:],
        ),
        power_quality=power_quality,
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    phase = plan.proposed_content.split("phase_a: # CT1", 1)[1].split(
        "# End CircuitSetup", 1
    )[0]
    assert "      current:\n        internal: true" in phase
    assert "      power:\n        internal: true" in phase


def _aggregate_request(
    current: MeterConfigurationInventory,
    aggregate: CircuitAggregate,
) -> object:
    return replace(current.configuration, aggregates=(aggregate,))


def _assert_daily_energy(block: str, power_id: str) -> None:
    for line in (
        "  - platform: total_daily_energy",
        f"    power_id: {power_id}",
        "    filters:",
        "      - multiply: 0.001",
        "    unit_of_measurement: kWh",
        "    device_class: energy",
        "    state_class: total_increasing",
    ):
        assert line in block


def _native_total_setup(
    addons: int = 1,
) -> tuple[ESPHomeConfigSnapshot, MeterTopology, MeterConfigurationInventory]:
    topology = _topology_for_addons(addons)
    snapshot = _contract_snapshot_for(topology)
    configuration = _inventory(snapshot, topology).configuration
    stored = StoredMeterConfiguration(
        snapshot.sha256, configuration.meter, configuration.channels,
        default_total_settings(topology), (), (),
        configuration.power_quality, configuration.status_fields,
    )
    current = _inventory(snapshot, topology, stored=stored)
    assert current.capabilities.native_totals_writable
    assert current.configuration.aggregates == ()
    return snapshot, topology, current


def _native_total_body(
    requested: MeterConfigurationRequest, topology: MeterTopology, content: str,
) -> str:
    return meter_config_mutator._render_native_totals(
        requested, topology, ESPHomeConfigDocument.parse(content)
    )


def _hierarchical_request(current):
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        AggregateTotalSource,
    )
    children = tuple(CircuitAggregate(
        name, name.title(), CircuitRole.CUSTOM, (ChannelTotalSource("channel", channel),),
        MeasurementMethod.DIRECT, EnergyMode.NONE, TotalOutputSettings(False, False, False),
    ) for name, channel in (("east", 1), ("west", 2)))
    parent = CircuitAggregate(
        "a-whole", "Whole", CircuitRole.CUSTOM,
        tuple(AggregateTotalSource("aggregate", child.aggregate_id) for child in children),
        MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, TotalOutputSettings(True, True, True),
    )
    return replace(current.configuration, aggregates=(parent, *children))


def test_parent_render_preserves_hidden_dependencies_and_child_first_order() -> None:
    snapshot, topology, current = _native_total_setup(0)
    requested = _hierarchical_request(current)
    source = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    assert "lambda: return std::max(0.0f, id(csemh_east_power).state + id(csemh_west_power).state);" in source
    assert "lambda: return id(csemh_east_current).state + id(csemh_west_current).state;" in source
    assert "power_id: csemh_a_whole_power" in source
    assert "csemh_east_energy" not in source
    assert source.index("id: csemh_west_current") < source.index("id: csemh_a_whole_power")
    assert "id: csemh_east_power\n    internal: true" in source
    assert "id: csemh_east_current\n    internal: true" in source
    installed = replace(snapshot, content=source, sha256=sha256(source.encode()).hexdigest())
    recovered = _inventory(installed, topology)
    assert recovered.configuration.aggregates == requested.aggregates
    assert "aggregate_semantics_unreadable" not in recovered.warnings
    assert not recovered.capabilities.managed_advanced_totals
    for old, new in (("id(csemh_east_power).state", "id(ct1Watts).state"),
                     ("internal: true", "internal: false"),
                     ("multiply: 0.001", "multiply: 1.0")):
        content = source.replace(old, new, 1)
        tampered = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
        assert "aggregate_semantics_unreadable" in _inventory(tampered, topology).warnings


@pytest.mark.parametrize("watts,amps,kwh", ((False, False, True), (True, False, False), (False, True, False), (False, False, False)))
def test_bidirectional_render_independent_outputs(watts, amps, kwh) -> None:
    snapshot, topology, current = _native_total_setup(0)
    aggregate = CircuitAggregate("grid", "Grid", CircuitRole.GRID,
        (ChannelTotalSource("channel", 1),), MeasurementMethod.DIRECT,
        EnergyMode.BIDIRECTIONAL, TotalOutputSettings(watts, amps, kwh))
    requested = replace(current.configuration, aggregates=(aggregate,))
    source = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    for suffix in ("power", "import_power", "export_power"):
        assert (f"id: csemh_grid_{suffix}" in source) == (watts or kwh)
        if kwh and not watts:
            assert f"id: csemh_grid_{suffix}\n    internal: true" in source
    assert ("id: csemh_grid_current" in source) == amps
    for suffix in ("import_energy", "export_energy"):
        assert (f"id: csemh_grid_{suffix}" in source) == kwh
    installed = replace(snapshot, content=source, sha256=sha256(source.encode()).hexdigest())
    assert _inventory(installed, topology).configuration.aggregates == (aggregate,)


def test_parent_native_board_formulas_and_native_only_round_trip() -> None:
    snapshot, topology, current = _native_total_setup(1)
    aggregate = CircuitAggregate("whole", "Whole", CircuitRole.CUSTOM,
        (NativeTotalSource("native_total", "board-main"), NativeTotalSource("native_total", "board-addon-1")),
        MeasurementMethod.DIRECT, EnergyMode.NONE, TotalOutputSettings(True, True, False))
    requested = replace(current.configuration, aggregates=(aggregate,))
    source = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    assert "lambda: return id(totalWattsMain).state + id(totalWattsAddOn1).state;" in source
    assert "lambda: return id(totalAmpsMain).state + id(totalAmpsAddOn1).state;" in source
    installed = replace(snapshot, content=source, sha256=sha256(source.encode()).hexdigest())
    assert _inventory(installed, topology).configuration.aggregates == (aggregate,)
    defaults = current.configuration.default_totals
    requested = replace(current.configuration, default_totals=replace(defaults,
        boards=(replace(defaults.boards[0], outputs=TotalOutputSettings(False, False, True)), defaults.boards[1])))
    source = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    installed = replace(snapshot, content=source, sha256=sha256(source.encode()).hexdigest())
    recovered = _inventory(installed, topology)
    assert recovered.configuration.aggregates == ()
    assert "aggregate_semantics_unreadable" not in recovered.warnings
    assert recovered.configuration.default_totals == requested.default_totals


@pytest.mark.parametrize("enabled", (True, False))
def test_automatic_metadata_preserves_enabled_and_off_without_storage(enabled) -> None:
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        AutomaticTotalSettings,
    )
    snapshot, topology, current = _native_total_setup(0)
    requested = replace(current.configuration,
        channels=tuple(replace(channel, role=CircuitRole.GRID) if channel.channel in (1, 2) else channel for channel in current.configuration.channels),
        automatic_totals=(AutomaticTotalSettings("grid-ct1-ct2", enabled, TotalOutputSettings(False, False, True)),))
    mutation = build_meter_configuration_mutation(snapshot, topology, current, requested)
    source = mutation.proposed_content
    if enabled:
        assert '+ Mains:' in mutation.redacted_diff
    assert ("id: csemh_auto_mains_power" in source) == enabled
    installed = replace(snapshot, content=source, sha256=sha256(source.encode()).hexdigest())
    recovered = _inventory(installed, topology)
    assert recovered.configuration.aggregates == ()
    assert recovered.configuration.automatic_totals == requested.automatic_totals
    assert tuple(channel.role for channel in recovered.configuration.channels) == tuple(channel.role for channel in requested.channels)
    assert not recovered.capabilities.managed_automatic_totals
    evidence = expected_meter_entity_evidence(requested, topology)
    assert {name for _, name in evidence.aggregate_sensor_entities - evidence.native_sensor_entities} == (
        {f"{requested.meter.friendly_name} Mains Import Energy", f"{requested.meter.friendly_name} Mains Return to Grid Energy"}
        if enabled else set())
    stored = StoredMeterConfiguration(installed.sha256, requested.meter, requested.channels,
        requested.default_totals, requested.automatic_totals, (), requested.power_quality, requested.status_fields)
    assert _inventory(installed, topology, stored=stored).configuration.automatic_totals == requested.automatic_totals
    conflicting = replace(stored, automatic_totals=(replace(requested.automatic_totals[0], enabled=not enabled),))
    rejected = _inventory(installed, topology, stored=conflicting)
    assert "aggregate_semantics_unreadable" in rejected.warnings
    assert not rejected.capabilities.managed_automatic_totals
    line = next(line for line in source.splitlines() if "# csemh-automatic-totals:" in line)
    payload = line.split(": ", 1)[1]
    data = json.loads(urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    data["settings"] = []
    undeclared = source.replace(payload, urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("="))
    rejected = _inventory(replace(snapshot, content=undeclared, sha256=sha256(undeclared.encode()).hexdigest()), topology)
    assert "aggregate_semantics_unreadable" in rejected.warnings
    assert rejected.automatic_totals == ()


def test_generated_directional_ids_reject_advanced_collision() -> None:
    snapshot, topology, current = _native_total_setup(0)
    aggregates = tuple(CircuitAggregate(name, name, CircuitRole.CUSTOM,
        (ChannelTotalSource("channel", channel),), MeasurementMethod.DIRECT,
        mode, TotalOutputSettings(True, False, False))
        for name, channel, mode in (("grid", 1, EnergyMode.BIDIRECTIONAL), ("grid-import", 2, EnergyMode.NONE)))
    with pytest.raises((ValueError, ConfigMutationError), match="collision"):
        build_meter_configuration_mutation(snapshot, topology, current, replace(current.configuration, aggregates=aggregates))


@pytest.mark.parametrize("addons,power_id", ((0, "totalWattsMain"), (1, "totalWatts")))
def test_native_total_hide_watts_keeps_kwh(addons: int, power_id: str) -> None:
    snapshot, topology, current = _native_total_setup(addons)
    requested = replace(current.configuration, default_totals=replace(
        current.configuration.default_totals, overall=TotalOutputSettings(False, True, True)
    ))
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    assert f"- id: !extend {power_id}\n    internal: true" in plan.proposed_content
    assert "!extend totalEnergyDaily" not in plan.proposed_content
    assert "csemh_board_main_energy" not in plan.proposed_content


@pytest.mark.parametrize("source", (ChannelTotalSource("channel", 7), NativeTotalSource("native", "board-addon-1")))
def test_native_total_unrelated_advanced_total_does_not_hide_root(
    source: ChannelTotalSource | NativeTotalSource,
) -> None:
    snapshot, topology, current = _native_total_setup()
    requested = replace(current.configuration, aggregates=(CircuitAggregate(
        "branch", "Branch", CircuitRole.BRANCH, (source,),
        MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION,
        TotalOutputSettings(True, True, True),
    ),))
    assert _native_total_body(requested, topology, snapshot.content) == ""


@pytest.mark.parametrize("indent", ("", "  "))
def test_native_total_exposes_hidden_board_and_preserves_unmanaged_override(indent: str) -> None:
    snapshot, topology, current = _native_total_setup()
    original = "- id: !extend totalWattsAddOn1\n  internal: true\n"
    original = "".join(indent + line + "\n" for line in original.splitlines())
    content = snapshot.content.replace("sensor:\n  - platform: uptime\n    name: Uptime\n", "sensor:\n" + original)
    settings = current.configuration.default_totals
    requested = replace(current.configuration, default_totals=replace(settings, boards=(
        settings.boards[0], replace(settings.boards[1], outputs=TotalOutputSettings(True, False, False)),
    )))
    body = _native_total_body(requested, topology, content)
    assert body.split("\n", 1)[1] == "  - id: !extend totalWattsAddOn1\n    internal: false\n"
    rendered = replace_managed_block(content, "aggregates", body)
    assert original in rendered
    assert rendered.index("internal: true") < rendered.index("internal: false")
    assert replace_managed_block(rendered, "aggregates", _native_total_body(requested, topology, rendered)) == rendered


def test_native_total_explicit_hide_overrides_unmanaged_exposure() -> None:
    snapshot, topology, current = _native_total_setup()
    original = "  - id: !extend totalWattsAddOn1\n    internal: false\n"
    content = snapshot.content.replace("logger:\n", original + "logger:\n")
    requested = current.configuration
    body = _native_total_body(requested, topology, content)
    assert body.split("\n", 1)[1] == "  - id: !extend totalWattsAddOn1\n    internal: true\n"
    rendered = replace_managed_block(content, "aggregates", body)
    assert original in rendered
    assert rendered.index("internal: false") < rendered.index("internal: true")
    assert _native_total_body(requested, topology, rendered) == body
    settings = requested.default_totals
    exposed = replace(requested, default_totals=replace(settings, boards=(
        settings.boards[0], replace(settings.boards[1], outputs=TotalOutputSettings(True, False, False)),
    )))
    assert _native_total_body(exposed, topology, rendered) == ""
    assert replace_managed_block(rendered, "aggregates", "") == content


@pytest.mark.parametrize("indent", ("", "  "))
def test_native_total_existing_block_moves_after_unmanaged_siblings(indent: str) -> None:
    snapshot, topology, current = _native_total_setup()
    prefix, rest = snapshot.content.split("sensor:\n", 1)
    _, suffix = rest.split("logger:\n", 1)
    original = f"{indent}- id: !extend totalWattsAddOn1\n{indent}  internal: false\n"
    old = (
        "# CircuitSetup Energy Meter Helper: aggregates v1\n"
        f"{indent}- id: !extend totalWattsAddOn1\n{indent}  internal: true\n"
        "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
    )
    content = prefix + "sensor:\n" + old + original + "logger:\n" + suffix
    body = _native_total_body(current.configuration, topology, content)
    rendered = replace_managed_block(content, "aggregates", body)
    assert original in rendered
    assert rendered.index("internal: false") < rendered.index("internal: true")
    assert replace_managed_block(rendered, "aggregates", _native_total_body(current.configuration, topology, rendered)) == rendered


def test_native_total_replacement_excludes_old_helper_visibility() -> None:
    snapshot, topology, current = _native_total_setup()
    requested = replace(current.configuration, default_totals=replace(
        current.configuration.default_totals, overall=TotalOutputSettings(False, True, True)
    ))
    body = _native_total_body(requested, topology, snapshot.content)
    rendered = replace_managed_block(snapshot.content, "aggregates", body)
    assert _native_total_body(requested, topology, rendered) == body
    assert _native_total_body(current.configuration, topology, rendered) == ""
    assert replace_managed_block(rendered, "aggregates", "") == snapshot.content


@pytest.mark.parametrize("addons", (0, 1))
def test_native_total_upstream_defaults_need_no_override(addons: int) -> None:
    snapshot, topology, current = _native_total_setup(addons)
    assert _native_total_body(current.configuration, topology, snapshot.content) == ""
    assert build_meter_configuration_mutation(snapshot, topology, current, current.configuration).proposed_content == snapshot.content


def test_board_energy_uses_native_watts_once_in_stable_board_order() -> None:
    snapshot, topology, current = _native_total_setup()
    requested = replace(current.configuration, default_totals=replace(
        current.configuration.default_totals, boards=tuple(
            replace(board, outputs=TotalOutputSettings(False, False, True))
            for board in current.configuration.default_totals.boards
        ),
    ))
    rendered = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    assert rendered.count("id: csemh_board_main_energy\n") == 1
    assert rendered.count("id: csemh_board_addon_1_energy\n") == 1
    assert rendered.index("id: csemh_board_main_energy") < rendered.index("id: csemh_board_addon_1_energy")
    assert 'name: "${friendly_name} Main Board total Energy"' in rendered
    assert 'name: "${friendly_name} Add-on 1 total Energy"' in rendered
    _assert_daily_energy(rendered, "totalWattsMain")
    _assert_daily_energy(rendered, "totalWattsAddOn1")
    assert "!extend totalWattsMain" not in rendered
    assert "!extend totalWattsAddOn1" not in rendered


def test_board_energy_main_only_does_not_duplicate_native_energy() -> None:
    snapshot, topology, current = _native_total_setup(0)
    assert "total_daily_energy" not in _native_total_body(current.configuration, topology, snapshot.content)


@pytest.mark.parametrize("internal", ("true", "false"))
def test_native_total_compares_preserved_definition_visibility(internal: str) -> None:
    snapshot, topology, current = _native_total_setup()
    original = (
        "  - platform: template\n    id: totalWattsAddOn1\n"
        f"    name: Add-on Watts\n    internal: {internal}\n"
    )
    content = snapshot.content.replace("logger:\n", original + "logger:\n")
    body = _native_total_body(current.configuration, topology, content)
    assert (body.split("\n", 1)[1] if body else "") == ("" if internal == "true" else "  - id: !extend totalWattsAddOn1\n    internal: true\n")
    assert original in replace_managed_block(content, "aggregates", body)


def test_native_total_unresolved_visibility_is_not_guessed() -> None:
    snapshot, topology, current = _native_total_setup()
    content = snapshot.content.replace("logger:\n", "  - id: !extend totalWattsAddOn1\n    internal: ${hide_board}\nlogger:\n")
    with pytest.raises(ConfigMutationError, match="visibility"):
        _native_total_body(current.configuration, topology, content)


def test_native_total_comment_on_preserved_id_does_not_hide_its_visibility() -> None:
    snapshot, topology, current = _native_total_setup()
    original = "  - id: !extend totalWattsAddOn1 # keep this override\n    internal: false # public\n"
    content = snapshot.content.replace("logger:\n", original + "logger:\n")
    body = _native_total_body(current.configuration, topology, content)
    assert body.split("\n", 1)[1] == "  - id: !extend totalWattsAddOn1\n    internal: true\n"
    assert original in replace_managed_block(content, "aggregates", body)


@pytest.mark.parametrize("name", ("null", "false", "true"))
def test_native_total_ambiguous_definition_name_is_readonly(name: str) -> None:
    snapshot, topology, current = _native_total_setup()
    content = snapshot.content.replace("logger:\n", f"  - platform: template\n    id: totalWattsAddOn1\n    name: {name}\nlogger:\n")
    with pytest.raises(ConfigMutationError, match="visibility"):
        _native_total_body(current.configuration, topology, content)


def test_native_total_change_respects_inventory_readonly_authority() -> None:
    snapshot, topology, _ = _native_total_setup()
    current = _inventory(snapshot, topology)
    requested = replace(current.configuration, default_totals=replace(
        current.configuration.default_totals, overall=TotalOutputSettings(False, True, True)
    ))
    with pytest.raises(ConfigMutationError, match="adoption|capability"):
        build_meter_configuration_mutation(snapshot, topology, current, requested)


def test_native_total_keeps_other_managed_blocks_in_canonical_order() -> None:
    snapshot, topology, current = _native_total_setup()
    content = snapshot.content
    for name in ("voltage_references", "phase_overrides", "calibrated_voltage_gains", "status_overrides"):
        content = replace_managed_block(content, name, f"  - id: unrelated_{name}\n    internal: true\n")
    requested = replace(current.configuration, default_totals=replace(
        current.configuration.default_totals, overall=TotalOutputSettings(False, True, True)
    ))
    rendered = replace_managed_block(content, "aggregates", _native_total_body(requested, topology, content))
    names = tuple(name for name in ESPHomeConfigDocument.parse(rendered).managed_blocks if name != "status_overrides")
    assert names == ("voltage_references", "phase_overrides", "calibrated_voltage_gains", "aggregates")
    assert replace_managed_block(rendered, "aggregates", "") == content


def test_native_total_preserves_status_block_before_unmanaged_siblings() -> None:
    snapshot, topology, current = _native_total_setup()
    content = replace_managed_block(snapshot.content, "status_overrides", "  - id: unrelated_status\n    internal: true\n")
    content = content.replace("logger:\n", "  - id: !extend totalWattsAddOn1\n    internal: false\nlogger:\n")
    rendered = replace_managed_block(content, "aggregates", _native_total_body(current.configuration, topology, content))
    assert rendered.index("unrelated_status") < rendered.index("internal: false") < rendered.rindex("internal: true")
    assert replace_managed_block(rendered, "aggregates", "") == content


def test_board_energy_can_be_removed_through_hash_bound_inventory() -> None:
    snapshot, topology, current = _native_total_setup()
    settings = current.configuration.default_totals
    requested = replace(current.configuration, default_totals=replace(settings, boards=(
        settings.boards[0], replace(settings.boards[1], outputs=TotalOutputSettings(False, False, True)),
    )))
    first = build_meter_configuration_mutation(snapshot, topology, current, requested)
    digest = sha256(first.proposed_content.encode()).hexdigest()
    stored = StoredMeterConfiguration(
        digest, requested.meter, requested.channels, requested.default_totals,
        requested.automatic_totals, requested.aggregates, requested.power_quality, requested.status_fields,
    )
    configured_snapshot = replace(snapshot, content=first.proposed_content, sha256=digest)
    configured = _inventory(configured_snapshot, topology, stored=stored)
    removed = build_meter_configuration_mutation(configured_snapshot, topology, configured, current.configuration)
    assert removed.proposed_content == snapshot.content


@pytest.mark.parametrize("board,energy_id", ((0, "csemh_board_main_energy"), (1, "csemh_board_addon_1_energy")))
@pytest.mark.parametrize("id_form", ("definition", "extend", "anchor", "tag"))
def test_board_energy_rejects_unmanaged_sensor_id_ownership(
    board: int, energy_id: str, id_form: str,
) -> None:
    snapshot, topology, current = _native_total_setup()
    original = (
        f"  - id: !extend {energy_id}\n    name: User Energy\n"
        if id_form == "extend" else
        "  - platform: total_daily_energy\n    id: "
        + {
            "definition": f'"{energy_id}" # user owned',
            "anchor": f"&user_energy {energy_id}",
            "tag": f"!!str {energy_id}",
        }[id_form]
        + "\n    name: User Energy\n    power_id: ct1Watts\n"
    )
    content = snapshot.content.replace("logger:\n", original + "logger:\n")
    digest = sha256(content.encode()).hexdigest()
    configuration = current.configuration
    stored = StoredMeterConfiguration(
        digest, configuration.meter, configuration.channels, configuration.default_totals,
        configuration.automatic_totals, configuration.aggregates,
        configuration.power_quality, configuration.status_fields,
    )
    snapshot = replace(snapshot, content=content, sha256=digest)
    current = _inventory(snapshot, topology, stored=stored)
    requested = replace(configuration, default_totals=replace(
        configuration.default_totals, boards=tuple(
            replace(setting, outputs=TotalOutputSettings(False, False, True))
            if setting.board_index == board else setting
            for setting in configuration.default_totals.boards
        ),
    ))
    with pytest.raises(ConfigMutationError, match="unmanaged.*(conflict|unresolved)"):
        build_meter_configuration_mutation(snapshot, topology, current, requested)
    assert snapshot.content == content
    assert original in snapshot.content
    assert _native_total_body(configuration, topology, content) == ""
    assert build_meter_configuration_mutation(snapshot, topology, current, configuration).proposed_content == content


def test_board_energy_own_block_remains_idempotent() -> None:
    snapshot, topology, current = _native_total_setup()
    requested = replace(current.configuration, default_totals=replace(
        current.configuration.default_totals, boards=tuple(
            replace(board, outputs=TotalOutputSettings(False, False, True))
            for board in current.configuration.default_totals.boards
        ),
    ))
    first = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    body = _native_total_body(requested, topology, first)
    assert replace_managed_block(first, "aggregates", body) == first
    assert _native_total_body(current.configuration, topology, first) == ""


def test_board_energy_preserves_unrelated_resolvable_sensor_id() -> None:
    snapshot, topology, current = _native_total_setup()
    requested = replace(current.configuration, default_totals=replace(
        current.configuration.default_totals, boards=tuple(
            replace(board, outputs=TotalOutputSettings(False, False, True))
            for board in current.configuration.default_totals.boards
        ),
    ))
    original = '  - platform: template\n    id: "user_energy"\n    name: User Energy\n'
    content = snapshot.content.replace("logger:\n", original + "logger:\n")
    rendered = replace_managed_block(content, "aggregates", _native_total_body(requested, topology, content))
    assert original in rendered
    assert rendered.count("id: csemh_board_main_energy\n") == 1
    assert rendered.count("id: csemh_board_addon_1_energy\n") == 1


def test_custom_template_totals_are_internalized_before_managed_replacements() -> None:
    """Migration keeps legacy W/A entities from duplicating editable totals."""
    snapshot = _contract_snapshot()
    custom = (
        "  - platform: template\n"
        "    id: totalChargerWatts\n"
        "    name: Total Charger Watts\n"
        "    lambda: return id(ct5Watts).state + id(ct6Watts).state;\n"
        "    unit_of_measurement: W\n"
        "    device_class: power\n"
    )
    content = snapshot.content.replace("sensor:\n", "sensor:\n" + custom, 1)
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        aggregates=tuple(
            replace(aggregate, outputs=replace(aggregate.outputs, watts=False))
            if aggregate.aggregate_id == "total-charger"
            else aggregate
            for aggregate in current.configuration.aggregates
        ),
    )

    plan = build_meter_configuration_mutation(
        snapshot, topology, current, requested
    )
    block = plan.proposed_content.split("aggregates v1\n", 1)[1].split(
        "# End CircuitSetup", 1
    )[0]

    assert "- id: !extend totalChargerWatts\n    internal: true" in block
    assert "id: csemh_total_charger_power" not in block
    assert "id: csemh_total_charger_current" not in block
    tampered = "".join(line for line in plan.proposed_content.splitlines(keepends=True)
        if "# csemh-replaced-totals:" not in line).replace("  - id: !extend totalChargerWatts\n    internal: true\n", "")
    corrupted = replace(snapshot, content=tampered, sha256=sha256(tampered.encode()).hexdigest())
    assert "aggregate_semantics_unreadable" in _inventory(corrupted, topology).warnings


def test_unchanged_custom_total_is_not_copied_during_other_total_edit() -> None:
    from custom_components.circuitsetup_energy_meter_helper.entity_estimator import (
        estimate_configuration_impact,
    )

    snapshot, topology, current = _native_total_setup(0)
    custom = "  - platform: template\n    id: totalChargerWatts\n    name: Charger Power\n    lambda: return id(ct5Watts).state + id(ct6Watts).state;\n    unit_of_measurement: W\n    device_class: power\n"
    content = snapshot.content.replace("sensor:\n", "sensor:\n" + custom)
    snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    current = _owned_inventory(snapshot, topology)
    requested = replace(current.configuration, aggregates=(*current.configuration.aggregates,
        CircuitAggregate("load", "Load", CircuitRole.CUSTOM, (ChannelTotalSource("channel", 1),),
        MeasurementMethod.DIRECT, EnergyMode.NONE, TotalOutputSettings(True, False, False))))
    source = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    assert custom in source
    assert "csemh_total_charger_" not in source
    assert "!extend totalChargerWatts" not in source
    assert "csemh_load_power" in source
    evidence = expected_meter_entity_evidence(requested, topology,
        document=ESPHomeConfigDocument.parse(snapshot.content), previous=current.configuration)
    assert {name for _, name in evidence.aggregate_sensor_entities - evidence.native_sensor_entities} == {f"{requested.meter.friendly_name} Load Power", "Charger Power"}
    impact = estimate_configuration_impact(requested, topology, document=ESPHomeConfigDocument.parse(snapshot.content), previous=current.configuration, native_visibility_resolved=current.native_visibility_resolved)
    assert (impact.public_total_entity_count, impact.numeric_entity_count) == (5, 19)
    selected = replace(requested, aggregates=tuple(replace(item, name="Updated Charger") if item.aggregate_id == "total-charger" else item for item in requested.aggregates))
    replacement = build_meter_configuration_mutation(snapshot, topology, current, selected)
    evidence = expected_meter_entity_evidence(selected, topology, document=ESPHomeConfigDocument.parse(snapshot.content), previous=current.configuration)
    assert "Charger Power" not in {name for _, name in evidence.sensor_entities}
    assert "Energy meter Updated Charger Power" in {name for _, name in evidence.sensor_entities}
    impact = estimate_configuration_impact(selected, topology, document=ESPHomeConfigDocument.parse(snapshot.content), previous=current.configuration, native_visibility_resolved=current.native_visibility_resolved)
    assert (impact.public_total_entity_count, impact.numeric_entity_count) == (5, 19)
    assert "!extend totalChargerWatts\n    internal: true" in replacement.proposed_content


def test_parent_selection_replaces_custom_child_and_survives_source_reload() -> None:
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        AggregateTotalSource,
    )
    snapshot, topology, current = _native_total_setup(0)
    custom = "  - platform: template\n    id: totalChargerWatts\n    name: Charger Power\n    lambda: return id(ct5Watts).state + id(ct6Watts).state;\n    unit_of_measurement: W\n    device_class: power\n"
    content = snapshot.content.replace("sensor:\n", "sensor:\n" + custom)
    snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    current = _owned_inventory(snapshot, topology)
    parent = CircuitAggregate("parent", "Parent", CircuitRole.CUSTOM,
        (AggregateTotalSource("aggregate", "total-charger"),), MeasurementMethod.DIRECT,
        EnergyMode.NONE, TotalOutputSettings(True, False, False))
    requested = replace(current.configuration, aggregates=(*current.configuration.aggregates, parent))
    source = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    assert custom in source
    assert "!extend totalChargerWatts\n    internal: true" in source
    assert "lambda: return id(csemh_total_charger_power).state;" in source
    installed = replace(snapshot, content=source, sha256=sha256(source.encode()).hexdigest())
    recovered = _inventory(installed, topology)
    assert recovered.configuration.aggregates == requested.aggregates
    assert not recovered.capabilities.managed_advanced_totals
    assert "aggregate_semantics_unreadable" not in recovered.warnings
    tampered = "".join(line for line in source.splitlines(keepends=True)
        if "# csemh-replaced-totals:" not in line).replace("  - id: !extend totalChargerWatts\n    internal: true\n", "")
    corrupted = replace(snapshot, content=tampered, sha256=sha256(tampered.encode()).hexdigest())
    assert "aggregate_semantics_unreadable" in _inventory(corrupted, topology).warnings


def test_native_metadata_cannot_override_matching_stored_outputs() -> None:
    snapshot, topology, current = _native_total_setup(0)
    requested = replace(current.configuration, default_totals=replace(current.configuration.default_totals,
        overall=TotalOutputSettings(False, False, False)))
    source = build_meter_configuration_mutation(snapshot, topology, current, requested).proposed_content
    installed = replace(snapshot, content=source, sha256=sha256(source.encode()).hexdigest())
    baseline = current.configuration
    stored = StoredMeterConfiguration(installed.sha256, baseline.meter, baseline.channels,
        baseline.default_totals, (), (), baseline.power_quality, baseline.status_fields)
    recovered = _inventory(installed, topology, stored=stored)
    assert "aggregate_semantics_unreadable" in recovered.warnings
    assert not recovered.capabilities.managed_advanced_totals
    assert recovered.configuration.default_totals == baseline.default_totals


def test_custom_daily_energy_id_is_not_hidden_with_default_totals() -> None:
    """A familiar ID is not enough to take ownership of an unrelated kWh sensor."""
    snapshot = _default_totals_snapshot()
    content = snapshot.content.replace("power_id: totalWattsMain", "power_id: totalWatts")
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        aggregates=(replace(current.configuration.aggregates[0], outputs=TotalOutputSettings(False, False, False)),),
        default_totals=replace(current.configuration.default_totals,
            overall=replace(current.configuration.default_totals.overall, watts=False)),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    assert "id: !extend totalWattsMain" in plan.proposed_content
    assert "id: !extend totalEnergyDaily" not in plan.proposed_content
    assert "external custom kWh preserved; unverified and excluded from computed counts" in plan.redacted_diff


@pytest.mark.parametrize("current_channel", (2, 7))
@pytest.mark.parametrize("label", ("Custom", ""))
def test_rejected_custom_totals_stay_visible_during_unrelated_aggregate_edit(
    current_channel: int, label: str,
) -> None:
    """Unmatched W/A channels or out-of-range CTs must not be silently hidden."""
    snapshot = _contract_snapshot()
    custom = "".join(
        "  - platform: template\n"
        f"    id: total{label}{kind}\n"
        f"    name: Custom {kind}\n"
        f"    lambda: return id(ct{channel}{kind}).state;\n"
        f"    unit_of_measurement: {unit}\n"
        f"    device_class: {device_class}\n"
        for kind, channel, unit, device_class in (
            ("Watts", 1, "W", "power"),
            ("Amps", current_channel, "A", "current"),
        )
    )
    content = snapshot.content.replace("sensor:\n", "sensor:\n" + custom, 1)
    snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    assert not current.configuration.aggregates
    requested = _aggregate_request(current, CircuitAggregate("load", "Load", CircuitRole.BRANCH, (ChannelTotalSource("channel", 3),), MeasurementMethod.DIRECT, EnergyMode.NONE, TotalOutputSettings(True, False, EnergyMode.NONE is not EnergyMode.NONE)))

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    assert custom in plan.proposed_content
    assert f"!extend total{label}Watts" not in plan.proposed_content
    assert f"!extend total{label}Amps" not in plan.proposed_content
    assert "id: csemh_load_power" in plan.proposed_content


@pytest.mark.parametrize("label", ("Custom", ""))
@pytest.mark.parametrize(("expression", "filters"), (
    pytest.param(
        "id(ct1Watts).state + id(ct2Watts).state",
        "    filters:\n      - multiply: -1\n", id="sign-filter",
    ),
    pytest.param(
        "id(ct1Watts).state + id(ct2Watts).state",
        "    filters:\n      - multiply: 2\n", id="scaling-filter",
    ),
    pytest.param(
        "id(ct1Watts).state + id(ct1Watts).state", "", id="repeated-ct",
    ),
    pytest.param(
        "id(totalWattsMain).state + id(ct1Watts).state", "", id="overlapping-board",
    ),
))
def test_filtered_or_weighted_legacy_totals_remain_user_owned(
    label: str, expression: str, filters: str,
) -> None:
    """An unrelated edit must not replace calculations the aggregate model loses."""
    snapshot = _default_totals_snapshot()
    sensor_id = f"total{label}Watts"
    custom = (
        "  - platform: template\n"
        f"    id: {sensor_id}\n"
        "    name: Custom power\n"
        f"    lambda: return {expression};\n"
        "    unit_of_measurement: W\n"
        "    device_class: power\n"
        + filters
    )
    content = snapshot.content.replace("sensor:\n", "sensor:\n" + custom, 1).replace(
        "power_id: totalWattsMain", f"power_id: {sensor_id}",
    )
    snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = replace(current.configuration, aggregates=(*current.configuration.aggregates,
        CircuitAggregate("load", "Load", CircuitRole.BRANCH, (ChannelTotalSource("channel", 3),), MeasurementMethod.DIRECT, EnergyMode.NONE, TotalOutputSettings(True, False, EnergyMode.NONE is not EnergyMode.NONE)),
    ))

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    assert custom in plan.proposed_content
    assert f"!extend {sensor_id}\n" not in plan.proposed_content
    assert "!extend totalEnergyDaily\n" not in plan.proposed_content
    assert current.configuration.aggregates == ()
    assert "id: csemh_load_power" in plan.proposed_content


@pytest.mark.parametrize("with_storage", (False, True))
@pytest.mark.parametrize("source", ("board", "generic", "template"))
def test_replaced_totals_do_not_return_after_reload_or_unrelated_edit(
    source: str, with_storage: bool,
) -> None:
    """Owned internal overrides must also apply to inventory and reconnect evidence."""
    snapshot = (
        _contract_snapshot(generic_totals=True)
        if source == "generic"
        else _default_totals_snapshot()
    )
    if source == "template":
        content = snapshot.content.replace(
            "sensor:\n",
            "sensor:\n"
            "  - platform: template\n"
            "    id: totalCustomWatts\n"
            "    name: Custom Power\n"
            "    lambda: return id(ct1Watts).state + id(ct2Watts).state;\n"
            "    unit_of_measurement: W\n"
            "    device_class: power\n",
        )
        snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    elif source == "generic":
        content = snapshot.content.replace("totalWatts", "totalWattsMain").replace("    id: totalWattsMain\n", "    id: totalWattsMain\n    name: Native Power\n")
        snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        aggregates=(CircuitAggregate("total-custom" if source == "template" else "mains", "Mains", CircuitRole.GRID, (ChannelTotalSource("channel", 1), ChannelTotalSource("channel", 2),), MeasurementMethod.TWO_CT_SUM, EnergyMode.BIDIRECTIONAL, TotalOutputSettings(True, False, True)),),
        default_totals=current.configuration.default_totals if source == "template" else replace(current.configuration.default_totals, overall=TotalOutputSettings(False, False, False)),
    )
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    installed = replace(
        snapshot, content=plan.proposed_content,
        sha256=sha256(plan.proposed_content.encode()).hexdigest(),
    )
    stored = StoredMeterConfiguration(
        installed.sha256, requested.meter, requested.channels, requested.default_totals, requested.automatic_totals, requested.aggregates,
        requested.power_quality, requested.status_fields,
    ) if with_storage else None

    recovered = _inventory(installed, topology, stored=stored)

    assert recovered.configuration.aggregates == requested.aggregates
    renamed = replace(
        recovered.configuration,
        channels=tuple(
            replace(channel, name="Renamed CT") if channel.channel == 3 else channel
            for channel in recovered.configuration.channels
        ),
    )
    edited = build_meter_configuration_mutation(installed, topology, recovered, renamed)
    owned = ESPHomeConfigDocument.parse(installed.content).managed_blocks["aggregates"].content
    assert ESPHomeConfigDocument.parse(edited.proposed_content).managed_blocks["aggregates"].content == owned
    evidence = expected_meter_entity_evidence(renamed, topology)
    assert {name for _object_id, name in evidence.aggregate_sensor_entities - evidence.native_sensor_entities} == {
        f"{requested.meter.friendly_name} Mains {suffix}"
        for suffix in (
            "Power", "Import Power", "Import Energy",
            "Return to Grid Power", "Return to Grid Energy",
        )
    }
    updated = replace(requested, aggregates=(replace(requested.aggregates[0], name="Updated Mains"),))
    rewritten = build_meter_configuration_mutation(installed, topology, _owned_inventory(installed, topology, stored=stored), updated)
    assert all(
        line in rewritten.proposed_content for line in owned.splitlines()
        if "!extend total" in line
    )
    assert _inventory(replace(
        installed, content=rewritten.proposed_content,
        sha256=sha256(rewritten.proposed_content.encode()).hexdigest(),
    ), topology).configuration.aggregates == updated.aggregates


def test_aggregate_preview_renders_bidirectional_grid_without_hiding_native_totals() -> None:
    """Independent native outputs stay visible when a grid total is added."""
    snapshot = _contract_snapshot(generic_totals=True)
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = _aggregate_request(
        current,
        CircuitAggregate("grid", "Grid", CircuitRole.GRID, (ChannelTotalSource("channel", 1), ChannelTotalSource("channel", 2),), MeasurementMethod.DIRECT, EnergyMode.BIDIRECTIONAL, TotalOutputSettings(True, False, EnergyMode.BIDIRECTIONAL is not EnergyMode.NONE)),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    block = plan.proposed_content.split(
        "# CircuitSetup Energy Meter Helper: aggregates v1\n", 1
    )[1].split("# End CircuitSetup", 1)[0]
    for entity_id in (
        "csemh_grid_power",
        "csemh_grid_import_power",
        "csemh_grid_export_power",
        "csemh_grid_import_energy",
        "csemh_grid_export_energy",
    ):
        assert f"id: {entity_id}" in block
    assert "lambda: return id(ct1Watts).state + id(ct2Watts).state;" in block
    assert "lambda: return std::max(0.0f, id(csemh_grid_power).state);" in block
    assert "lambda: return std::max(0.0f, -id(csemh_grid_power).state);" in block
    _assert_daily_energy(block, "csemh_grid_import_power")
    _assert_daily_energy(block, "csemh_grid_export_power")
    assert "  - platform: integration" not in block
    assert "!extend totalEnergyDaily" not in block
    ESPHomeConfigDocument.parse(plan.proposed_content)


def test_mains_and_solar_templates_split_grid_import_from_export() -> None:
    """Solar export remains a positive Home Assistant return-to-grid total."""
    snapshot = _contract_snapshot(generic_totals=True)
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        aggregates=(
            CircuitAggregate("auto-mains", "Mains", CircuitRole.GRID, (ChannelTotalSource("channel", 1), ChannelTotalSource("channel", 2),), MeasurementMethod.TWO_CT_SUM, EnergyMode.BIDIRECTIONAL, TotalOutputSettings(True, False, EnergyMode.BIDIRECTIONAL is not EnergyMode.NONE)),
            CircuitAggregate("auto-solar", "Solar", CircuitRole.SOLAR, (ChannelTotalSource("channel", 3), ChannelTotalSource("channel", 4),), MeasurementMethod.TWO_CT_SUM, EnergyMode.GENERATION, TotalOutputSettings(True, False, EnergyMode.GENERATION is not EnergyMode.NONE)),
        ),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    block = plan.proposed_content.split(
        "# CircuitSetup Energy Meter Helper: aggregates v1\n", 1
    )[1].split("# End CircuitSetup", 1)[0]
    assert "lambda: return id(ct1Watts).state + id(ct2Watts).state;" in block
    assert (
        "lambda: return std::max(0.0f, id(csemh_auto_mains_power).state);"
        in block
    )
    assert (
        "lambda: return std::max(0.0f, -id(csemh_auto_mains_power).state);"
        in block
    )
    _assert_daily_energy(block, "csemh_auto_mains_import_power")
    _assert_daily_energy(block, "csemh_auto_mains_export_power")
    assert "id: csemh_auto_mains_current" not in block
    assert 'name: "${friendly_name} Mains Import Energy"' in block
    assert 'name: "${friendly_name} Mains Return to Grid Power"' in block
    assert 'name: "${friendly_name} Mains Return to Grid Energy"' in block
    assert block.index("Mains Return to Grid Power") < block.index("Mains Import Power")
    assert block.index("Mains Return to Grid Energy") < block.index("Mains Import Power")
    assert (
        "lambda: return std::max(0.0f, "
        "id(ct3Watts).state + id(ct4Watts).state);"
        in block
    )
    _assert_daily_energy(block, "csemh_auto_solar_power")
    ESPHomeConfigDocument.parse(plan.proposed_content)


def test_indentless_contract_sensor_supports_voltage_aggregate_preview_and_readback() -> None:
    """Official root-level sensor lists retain valid relative helper indentation."""
    snapshot = _indentless_contract_snapshot()
    content = snapshot.content.replace("totalWatts", "totalWattsMain").replace("  id: totalWattsMain\n", "  id: totalWattsMain\n  name: Native Power\n")
    snapshot = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_references=(
                replace(
                    current.configuration.meter.voltage_references[0], gain_voltage=7305
                ),
            ),
        ),
        aggregates=(
            CircuitAggregate("load", "Load", CircuitRole.BRANCH, (ChannelTotalSource("channel", 1),), MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, TotalOutputSettings(True, False, EnergyMode.CONSUMPTION is not EnergyMode.NONE)),
        ),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    assert "\n- platform: total_daily_energy\n  id: csemh_load_energy" in plan.proposed_content
    assert "\n  - id: !extend totalEnergyDaily" not in plan.proposed_content
    assert "\n- id: !extend meter_main1" in plan.proposed_content
    stored = StoredMeterConfiguration(
        sha256(plan.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.default_totals, requested.automatic_totals, requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
    configured_snapshot = replace(
        snapshot, content=plan.proposed_content, sha256=stored.config_sha256
    )
    configured = _owned_inventory(configured_snapshot, topology, stored=stored)

    assert configured.configuration.meter == requested.meter
    assert configured.configuration.aggregates == requested.aggregates
    removed = build_meter_configuration_mutation(
        configured_snapshot,
        topology,
        configured,
        replace(configured.configuration, aggregates=()),
    )
    assert "aggregates v1" not in removed.proposed_content
    assert "\n- id: !extend meter_main1" in removed.proposed_content


def test_indentless_contract_sensor_supports_phase_replacement_and_removal() -> None:
    """Task-15 phase ownership is read with the sensor list's relative indent."""
    snapshot = _indentless_contract_snapshot()
    request = CTChangeRequest(1, "CT 1", "sct_006_20a_25ma", 2)

    first = build_ct_mutation(snapshot, _topology(), (request,))

    assert "\n- id: !extend meter_main1" in first.proposed_content
    configured_snapshot = replace(
        snapshot,
        content=first.proposed_content,
        sha256=sha256(first.proposed_content.encode()).hexdigest(),
    )
    updated = build_ct_mutation(
        configured_snapshot,
        _topology(),
        (CTChangeRequest(1, "CT 1", "sct_006_20a_25ma", 4),),
    )
    reset_snapshot = replace(
        configured_snapshot,
        content=updated.proposed_content,
        sha256=sha256(updated.proposed_content.encode()).hexdigest(),
    )
    reset = build_ct_mutation(
        reset_snapshot,
        _topology(),
        (CTChangeRequest(1, "CT 1", "sct_006_20a_25ma", 1),),
    )

    assert "multiply: 4" in updated.proposed_content
    assert "phase overrides v1" not in reset.proposed_content


def test_indentless_ota_sequence_does_not_block_phase_override() -> None:
    """The official OTA list spelling is outside the writable sensor section."""
    snapshot = _indentless_contract_snapshot()
    content = snapshot.content.replace(
        "sensor:\n", "ota:\n- platform: esphome\nsensor:\n", 1
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    plan = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(1, "CT 1", "sct_006_20a_25ma", 2),),
    )

    assert "phase_a: # CT1" in plan.proposed_content
    assert "multiply: 2" in plan.proposed_content


@pytest.mark.parametrize("indent", ("", "  "))
@pytest.mark.parametrize(
    "entry",
    (
        "- platform:",
        "- platform: # comment-only",
        "- platform: >",
        "- platform: |",
        "- platform: >-",
        "- platform: |+",
        "- platform: >2",
        "- platform: |2",
    ),
)
def test_aggregate_preview_rejects_non_scalar_sensor_sequence_entry(
    indent: str, entry: str
) -> None:
    """The high-level aggregate writer cannot turn unsafe items into mixed YAML."""
    source = _contract_snapshot()
    content = source.content.replace("  - platform: uptime", indent + entry)
    snapshot = replace(
        source, content=content, sha256=sha256(content.encode()).hexdigest()
    )
    current = _owned_inventory(snapshot, _topology())
    requested = _aggregate_request(
        current,
        CircuitAggregate("load", "Load", CircuitRole.BRANCH, (ChannelTotalSource("channel", 1),), MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, TotalOutputSettings(True, False, EnergyMode.CONSUMPTION is not EnergyMode.NONE)),
    )

    with pytest.raises(ConfigMutationError, match="sensor block|not safely writable"):
        build_meter_configuration_mutation(snapshot, _topology(), current, requested)


def test_aggregate_energy_signs_and_one_ct_power_multiplier_are_semantic_only() -> None:
    """Energy clamps are explicit and doubling never changes aggregate current."""
    snapshot = _contract_snapshot()
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        aggregates=(
            CircuitAggregate("load", "Load", CircuitRole.BRANCH, (ChannelTotalSource("channel", 1),), MeasurementMethod.ONE_CT_DOUBLE_POWER, EnergyMode.CONSUMPTION, TotalOutputSettings(True, True, EnergyMode.CONSUMPTION is not EnergyMode.NONE)),
            CircuitAggregate("solar", "Solar", CircuitRole.SOLAR, (ChannelTotalSource("channel", 2),), MeasurementMethod.DIRECT, EnergyMode.GENERATION, TotalOutputSettings(True, False, EnergyMode.GENERATION is not EnergyMode.NONE)),
        ),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    block = plan.proposed_content.split(
        "# CircuitSetup Energy Meter Helper: aggregates v1\n", 1
    )[1].split("# End CircuitSetup", 1)[0]

    assert "lambda: return std::max(0.0f, id(ct1Watts).state * 2.0);" in block
    assert "lambda: return id(ct1Amps).state;" in block
    assert "power_id: csemh_load_power" in block
    assert "lambda: return std::max(0.0f, id(ct2Watts).state);" in block
    assert "power_id: csemh_solar_power" in block
    _assert_daily_energy(block, "csemh_load_power")
    _assert_daily_energy(block, "csemh_solar_power")
    assert "  - platform: integration" not in block
    assert "id(ct1Amps).state * 2.0" not in block


def test_aggregate_preview_refuses_legacy_contract_and_never_invents_default_total() -> None:
    """Totals cannot implicitly adopt a legacy contract; no-op keeps source intact."""
    aggregate = CircuitAggregate("load", "Load", CircuitRole.BRANCH, (ChannelTotalSource("channel", 1),), MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, TotalOutputSettings(True, False, EnergyMode.CONSUMPTION is not EnergyMode.NONE))
    legacy = _snapshot()
    with pytest.raises(ConfigMutationError, match="adoption"):
        build_meter_configuration_mutation(
            legacy, _topology(), _inventory(legacy, _topology()),
            _aggregate_request(_inventory(legacy, _topology()), aggregate),
        )

    snapshot = _contract_snapshot()
    current = _inventory(snapshot, _topology())
    plan = build_meter_configuration_mutation(
        snapshot, _topology(), current, current.configuration
    )
    assert "aggregates v1" not in plan.proposed_content
    assert plan.proposed_content == snapshot.content

    legacy_current = _inventory(legacy, _topology())
    assert build_meter_configuration_mutation(
        legacy, _topology(), legacy_current, legacy_current.configuration
    ).proposed_content == legacy.content


@pytest.mark.parametrize("parent_energy", (EnergyMode.NONE, EnergyMode.BIDIRECTIONAL))
@pytest.mark.parametrize("parent_method, parent_channels", (
    (MeasurementMethod.BOTH_CONDUCTORS_ONE_CT, (1,)),
    (MeasurementMethod.DIRECT, (1, 2)),
))
def test_rendered_aggregate_metadata_is_lossless_without_storage(
    parent_energy: EnergyMode,
    parent_method: MeasurementMethod,
    parent_channels: tuple[int, ...],
) -> None:
    """Owned YAML must recover semantics that sensor expressions cannot encode."""
    snapshot = _contract_snapshot()
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    aggregates = (
        CircuitAggregate("parent-total", "Parent", CircuitRole.CUSTOM, tuple(ChannelTotalSource("channel", channel) for channel in parent_channels), parent_method, parent_energy, TotalOutputSettings(False, False, parent_energy is not EnergyMode.NONE)),
        CircuitAggregate("child-total", "Child", CircuitRole.SOLAR, (ChannelTotalSource("channel", 2),), MeasurementMethod.DIRECT, EnergyMode.GENERATION, TotalOutputSettings(True, False, EnergyMode.GENERATION is not EnergyMode.NONE)),
    )
    requested = replace(current.configuration, aggregates=aggregates)
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    installed = replace(
        snapshot,
        content=plan.proposed_content,
        sha256=sha256(plan.proposed_content.encode()).hexdigest(),
    )

    recovered = _inventory(installed, topology)

    assert recovered.configuration.aggregates == aggregates
    assert "aggregate_semantics_inferred" not in recovered.warnings
    for original, tampered in (
        ("id(ct2Watts).state", "id(ct3Watts).state"),
        ("multiply: 0.001", "multiply: 1.0"),
    ):
        content = installed.content.replace(original, tampered, 1)
        corrupted = replace(installed, content=content, sha256=sha256(content.encode()).hexdigest())
        assert "aggregate_semantics_unreadable" in _inventory(corrupted, topology).warnings


@pytest.mark.parametrize("with_metadata", (False, True))
@pytest.mark.parametrize("energy_mode", (EnergyMode.NONE, EnergyMode.CONSUMPTION, EnergyMode.BIDIRECTIONAL))
def test_directional_words_in_aggregate_ids_round_trip(
    with_metadata: bool, energy_mode: EnergyMode,
) -> None:
    """Import/export primary totals are distinct from generated directional sensors."""
    snapshot = _contract_snapshot()
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    aggregates = (
        CircuitAggregate("grid", "Grid", CircuitRole.BRANCH, (ChannelTotalSource("channel", 1),), MeasurementMethod.DIRECT, EnergyMode.NONE, TotalOutputSettings(not with_metadata, False, EnergyMode.NONE is not EnergyMode.NONE)),
        CircuitAggregate("grid-import", "Import circuit", CircuitRole.BRANCH, (ChannelTotalSource("channel", 2),), MeasurementMethod.DIRECT, energy_mode, TotalOutputSettings(True, False, energy_mode is not EnergyMode.NONE)),
        CircuitAggregate("grid-export", "Export circuit", CircuitRole.BRANCH, (ChannelTotalSource("channel", 3),), MeasurementMethod.DIRECT, energy_mode, TotalOutputSettings(True, False, energy_mode is not EnergyMode.NONE)),
        CircuitAggregate("mains", "Mains", CircuitRole.BRANCH, (ChannelTotalSource("channel", 4),), MeasurementMethod.DIRECT, EnergyMode.BIDIRECTIONAL, TotalOutputSettings(True, False, EnergyMode.BIDIRECTIONAL is not EnergyMode.NONE)),
    )
    requested = replace(current.configuration, aggregates=aggregates)
    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    content = "".join(
        line for line in plan.proposed_content.splitlines(keepends=True)
        if with_metadata or "# csemh-aggregate:" not in line
    )
    installed = replace(snapshot, content=content, sha256=sha256(content.encode()).hexdigest())

    recovered = _inventory(installed, topology)

    assert "aggregate_semantics_unreadable" not in recovered.warnings
    assert {item.aggregate_id: item for item in recovered.configuration.aggregates} == {
        item.aggregate_id: item if with_metadata else replace(item, origin=TotalOrigin.MIGRATED) for item in aggregates
    }


@pytest.mark.parametrize("addon_count", (0, 1, 2))
def test_native_total_restoring_defaults_removes_managed_block(addon_count: int) -> None:
    """Explicit output defaults remove an otherwise empty native total block."""
    snapshot, topology, current = _native_total_setup(addon_count)
    requested = replace(current.configuration, default_totals=replace(
        current.configuration.default_totals, overall=TotalOutputSettings(False, False, False)
    ))
    first = build_meter_configuration_mutation(snapshot, topology, current, requested)
    suffix = "Main" if addon_count == 0 else ""
    for total_id in (f"totalWatts{suffix}", f"totalAmps{suffix}", "totalEnergyDaily"):
        assert f"- id: !extend {total_id}\n    internal: true" in first.proposed_content
    stored = StoredMeterConfiguration(
        sha256(first.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.default_totals,
        requested.automatic_totals,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
    configured_snapshot = replace(
        snapshot,
        content=first.proposed_content,
        sha256=stored.config_sha256,
    )
    configured = _inventory(configured_snapshot, topology, stored=stored)
    removed = build_meter_configuration_mutation(
        configured_snapshot, topology, configured, current.configuration
    )

    assert "aggregates v1" not in removed.proposed_content
    assert "internal: true" not in removed.proposed_content
    assert removed.proposed_content == snapshot.content
    assert removed.redacted_diff.startswith("Default meter totals\n~")
    assert "Overall meter total: Watts hidden -> exposed" in removed.redacted_diff
    assert build_meter_configuration_mutation(
        snapshot, topology, current, current.configuration
    ).proposed_content == snapshot.content


def test_removing_last_aggregate_preserves_user_sensor_siblings() -> None:
    """Only the exact owned span disappears; nearby user energy remains byte-stable."""
    snapshot = _contract_snapshot()
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = _aggregate_request(
        current,
        CircuitAggregate("load", "Load", CircuitRole.BRANCH, (ChannelTotalSource("channel", 1),), MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, TotalOutputSettings(True, False, EnergyMode.CONSUMPTION is not EnergyMode.NONE)),
    )
    first = build_meter_configuration_mutation(snapshot, topology, current, requested)
    marker = "# CircuitSetup Energy Meter Helper: aggregates v1\n"
    end = "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
    decorated = first.proposed_content.replace(
        marker, "  # user comment before managed totals\n" + marker
    ).replace(
        end,
        end
        + "  # user total-daily-energy sibling\n"
        + "  - platform: total_daily_energy\n"
        + "    id: user_energy\n",
    )
    stored = StoredMeterConfiguration(
        sha256(decorated.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.default_totals, requested.automatic_totals, requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
    configured_snapshot = replace(
        snapshot, content=decorated, sha256=stored.config_sha256
    )
    configured = _owned_inventory(configured_snapshot, topology, stored=stored)
    removed = build_meter_configuration_mutation(
        configured_snapshot,
        topology,
        configured,
        replace(configured.configuration, aggregates=()),
    )

    assert "aggregates v1" not in removed.proposed_content
    assert "  # user comment before managed totals\n" in removed.proposed_content
    assert "  # user total-daily-energy sibling\n" in removed.proposed_content
    assert "    id: user_energy\n" in removed.proposed_content
    ESPHomeConfigDocument.parse(removed.proposed_content)


@pytest.mark.parametrize("newline", ("\n", "\r\n"))
def test_aggregate_removal_restores_contract_source_without_eof_newline(
    newline: str,
) -> None:
    """A contract-2 aggregate round trip preserves an EOF sensor byte-for-byte."""
    source = _contract_snapshot()
    prefix = source.content.split("sensor:\n", 1)[0].replace("\n", newline)
    content = prefix + "sensor:" + newline + "  - platform: uptime"
    snapshot = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = _aggregate_request(
        current,
        CircuitAggregate("load", "Load", CircuitRole.BRANCH, (ChannelTotalSource("channel", 1),), MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, TotalOutputSettings(True, False, EnergyMode.CONSUMPTION is not EnergyMode.NONE)),
    )
    added = build_meter_configuration_mutation(snapshot, topology, current, requested)
    stored = StoredMeterConfiguration(
        sha256(added.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.default_totals, requested.automatic_totals, requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
    configured_snapshot = replace(
        snapshot, content=added.proposed_content, sha256=stored.config_sha256
    )
    configured = _owned_inventory(configured_snapshot, topology, stored=stored)
    renamed = replace(requested, aggregates=(replace(requested.aggregates[0], name="Renamed load"),))
    updated = build_meter_configuration_mutation(configured_snapshot, topology, configured, renamed)
    assert updated.proposed_content.startswith(content + newline)
    stored = replace(stored, config_sha256=sha256(updated.proposed_content.encode()).hexdigest(), aggregates=renamed.aggregates)
    configured_snapshot = replace(snapshot, content=updated.proposed_content, sha256=stored.config_sha256)
    configured = _inventory(configured_snapshot, topology, stored=stored)

    removed = build_meter_configuration_mutation(
        configured_snapshot,
        topology,
        configured,
        replace(configured.configuration, aggregates=()),
    )

    assert removed.proposed_content == content


def test_sparse_addon_aggregates_preserve_official_total_visibility() -> None:
    """Unrelated CT totals must not hide native totals as a side effect."""
    snapshot, topology, current = _native_total_setup()
    requested = replace(
        current.configuration,
        aggregates=(
            CircuitAggregate("main", "Main", CircuitRole.BRANCH, (ChannelTotalSource("channel", 1),), MeasurementMethod.DIRECT, EnergyMode.NONE, TotalOutputSettings(True, True, False)),
            CircuitAggregate("addon", "Addon", CircuitRole.BRANCH, (ChannelTotalSource("channel", 12),), MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, TotalOutputSettings(True, True, True)),
        ),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    block = plan.proposed_content.split("aggregates v1\n", 1)[1].split(
        "# End CircuitSetup", 1
    )[0]

    assert "lambda: return id(ct1Watts).state;" in block
    assert "lambda: return std::max(0.0f, id(ct12Watts).state);" in block
    for total_id in ("totalAmps", "totalWatts", "totalEnergyDaily"):
        assert f"- id: !extend {total_id}\n    internal: true" not in block


def test_aggregate_names_are_yaml_scalars_and_repeated_preview_is_identical() -> None:
    """User labels cannot change generated YAML structure or produce duplicate totals."""
    snapshot = _contract_snapshot()
    topology = _topology()
    current = _owned_inventory(snapshot, topology)
    requested = _aggregate_request(
        current,
        CircuitAggregate("two-pole", 'Dryer: "Main" # 240V', CircuitRole.TWO_POLE, (ChannelTotalSource("channel", 1), ChannelTotalSource("channel", 2),), MeasurementMethod.TWO_CT_SUM, EnergyMode.CONSUMPTION, TotalOutputSettings(True, False, EnergyMode.CONSUMPTION is not EnergyMode.NONE)),
    )
    first = build_meter_configuration_mutation(snapshot, topology, current, requested)
    stored = StoredMeterConfiguration(
        sha256(first.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.default_totals, requested.automatic_totals, requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
    repeated_snapshot = replace(
        snapshot,
        content=first.proposed_content,
        sha256=stored.config_sha256,
    )
    repeated = build_meter_configuration_mutation(
        repeated_snapshot,
        topology,
        _owned_inventory(repeated_snapshot, topology, stored=stored),
        requested,
    )

    assert 'name: "${friendly_name} Dryer: \\"Main\\" # 240V Power"' in first.proposed_content
    assert "lambda: return std::max(0.0f, id(ct1Watts).state + id(ct2Watts).state);" in first.proposed_content
    assert repeated.proposed_content == first.proposed_content


def test_phase_overrides_are_board_specific_and_migrate_legacy_scaling() -> None:
    """A preview keeps legacy scaling while limiting PQ-only fields to its board."""
    snapshot = _package_snapshot()
    legacy = snapshot.content.replace(
        "api:\n",
        """# CircuitSetup Energy Meter Helper: phase overrides v1
  - id: !extend meter_main1
    phase_a: # CT1
      current:
        filters:
          - multiply: 2
      power:
        filters:
          - multiply: 2
# End CircuitSetup Energy Meter Helper: phase overrides v1
api:
""",
    )
    snapshot = replace(
        snapshot, content=legacy, sha256=sha256(legacy.encode()).hexdigest()
    )

    plan = build_ct_mutation(
        snapshot,
        _two_board_topology(),
        (CTChangeRequest(7, "CT 7", "sct_006_20a_25ma", 4),),
        package_options={
            "power_quality": (True, False),
            "status_fields": (True, False),
        },
    )

    main = plan.proposed_content.split("phase_a: # CT1", 1)[1].split(
        "phase_b: # CT2", 1
    )[0]
    assert "reactive_power:" in main
    addon = plan.proposed_content.split("phase_a: # CT7", 1)[1]
    assert "multiply: 4" in addon
    assert "reactive_power:" not in addon
    assert "harmonic_power: !remove" not in addon
    assert "Channel" in plan.redacted_diff


def test_valid_official_legacy_multiplier_block_migrates_without_value_changes() -> None:
    """Migration keeps every official current/power multiplier on its original CT."""
    snapshot = _snapshot()
    legacy = snapshot.content.replace(
        "logger:\n",
        """# CircuitSetup Energy Meter Helper: phase overrides v1
  - id: !extend meter_main1
    phase_a: # CT1
      current:
        filters:
          - multiply: 2
      power:
        filters:
          - multiply: 2
    phase_b: # CT2
      current:
        filters:
          - multiply: 4
      power:
        filters:
          - multiply: 4
# End CircuitSetup Energy Meter Helper: phase overrides v1
logger:
""",
    )
    snapshot = replace(
        snapshot, content=legacy, sha256=sha256(legacy.encode()).hexdigest()
    )

    plan = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(3, "CT 3", "sct_006_20a_25ma", 2),),
    )

    for channel, multiplier in ((1, 2), (2, 4), (3, 2)):
        phase = plan.proposed_content.split(f"# CT{channel}", 1)[1].split(
            "# CT", 1
        )[0]
        assert phase.count(f"multiply: {multiplier}") == 2
    assert "Channel" in plan.redacted_diff


@pytest.mark.parametrize(
    "entry",
    (
        """  - id: !extend meter_main2
    phase_a: # CT1
      current:
        filters:
          - multiply: 2
      power:
        filters:
          - multiply: 2
""",
        """  - id: !extend meter_main1
    phase_b: # CT1
      current:
        filters:
          - multiply: 2
      power:
        filters:
          - multiply: 2
""",
        """  - id: !extend meter_main1
    phase_a: # CT2
      current:
        filters:
          - multiply: 2
      power:
        filters:
          - multiply: 2
""",
        """  - id: !extend meter_main1
    phase_a: # CT1
      current:
        filters:
          - multiply: 2
      power:
        filters:
          - multiply: 2
      reactive_power: !remove
""",
        """  - id: !extend meter_main1
    phase_a: # CT1
      current:
        filters:
          - multiply: 2
""",
        """  - id: !extend meter_main1
    phase_a: # CT1
      current:
        filters:
          - multiply: 2
      power:
        filters:
          - multiply: 4
""",
        """  - id: !extend meter_main1
    phase_a: # CT1
      current:
        filters:
          - multiply: 2
      power:
        filters:
          - multiply: 2
      frequency: !remove
""",
    ),
)
def test_legacy_multiplier_migration_rejects_malformed_entries(entry: str) -> None:
    """Legacy ownership, phase comments, values, and output shape are exact."""
    snapshot = _snapshot()
    content = snapshot.content.replace(
        "logger:\n",
        "# CircuitSetup Energy Meter Helper: phase overrides v1\n"
        + entry
        + "# End CircuitSetup Energy Meter Helper: phase overrides v1\nlogger:\n",
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    with pytest.raises(ConfigMutationError, match="safely writable"):
        build_ct_mutation(
            snapshot,
            _topology(),
            (CTChangeRequest(2, "CT 2", "sct_006_20a_25ma", 2),),
        )


def test_multiplier_one_needs_no_active_phase_override() -> None:
    """The base range leaves the current power-quality package untouched."""
    plan = build_ct_mutation(
        _package_snapshot(),
        _two_board_topology(),
        (CTChangeRequest(1, "CT 1", "sct_006_20a_25ma", 1),),
        package_options={
            "power_quality": (True, False),
            "status_fields": (True, False),
        },
    )

    assert "phase_a: # CT1" not in plan.proposed_content
    assert "harmonic_power: !remove" not in plan.proposed_content
    assert "peak_current: !remove" not in plan.proposed_content


def test_reporting_multiplier_uses_configured_id_substitution_and_is_reviewable() -> None:
    """New and legacy configs both get a resolvable, safely reviewable extension."""
    snapshot = _snapshot()
    configured = snapshot.content.replace(
        "substitutions:\n", "substitutions:\n  main_meter_id1: custom_meter_1\n"
    )
    configured_snapshot = replace(
        snapshot,
        content=configured,
        sha256=sha256(configured.encode()).hexdigest(),
    )

    configured_plan = build_ct_mutation(
        configured_snapshot,
        _topology(),
        (CTChangeRequest(2, "CT 2", "sct_013_030_30a_1v", 2),),
    )
    legacy_plan = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(2, "CT 2", "sct_013_030_30a_1v", 2),),
    )

    assert "- id: !extend ${main_meter_id1}" in configured_plan.proposed_content
    assert "- id: !extend meter_main1" in legacy_plan.proposed_content
    assert "Channel" in legacy_plan.redacted_diff
    assert "current_cal_ct2" not in legacy_plan.redacted_diff
    assert "top-secret" not in legacy_plan.redacted_diff


def test_reporting_multiplier_updates_and_removes_its_managed_filters() -> None:
    """Repeated edits must not retain or duplicate obsolete output scaling."""
    first = build_ct_mutation(
        _snapshot(),
        _topology(),
        (
            CTChangeRequest(1, "CT 1", "sct_006_20a_25ma", 2),
            CTChangeRequest(2, "CT 2", "sct_013_030_30a_1v", 2),
        ),
    )
    snapshot = ESPHomeConfigSnapshot(
        "meter.yaml",
        first.proposed_content,
        sha256(first.proposed_content.encode()).hexdigest(),
    )
    updated = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(2, "CT 2", "sct_013_030_30a_1v", 4),),
    )

    assert (
        updated.proposed_content.count(
            "CircuitSetup Energy Meter Helper: phase overrides v1"
        )
        == 2
    )
    assert (
        """    phase_a: # CT1
      current:
        filters:
          - multiply: 2
      power:
        filters:
          - multiply: 2
"""
        in updated.proposed_content
    )
    assert "multiply: 4" in updated.proposed_content

    snapshot = ESPHomeConfigSnapshot(
        "meter.yaml",
        updated.proposed_content,
        sha256(updated.proposed_content.encode()).hexdigest(),
    )
    reset = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(2, "CT 2", "sct_013_030_30a_1v", 1),),
    )
    assert "phase_a: # CT1" in reset.proposed_content
    assert "phase_b: # CT2" not in reset.proposed_content
    assert "multiply: 4" not in reset.proposed_content


def test_reporting_multiplier_rejects_values_outside_supported_steps() -> None:
    """Only hardware-supported power-of-two reporting multipliers are writable."""
    with pytest.raises(ConfigMutationError, match="1, 2, 4, or 8"):
        build_ct_mutation(
            _snapshot(),
            _topology(),
            (CTChangeRequest(1, "CT 1", "sct_006_20a_25ma", 3),),
        )


def test_reporting_multiplier_refuses_conflicting_or_duplicate_filter_blocks() -> None:
    """Never silently replace a local output filter or accept ambiguous managed data."""
    snapshot = _snapshot()
    content = snapshot.content.replace(
        "logger:\n  level: DEBUG\n",
        """sensor:
  - id: !extend ${main_meter_id1}
    phase_b:
      current:
        filters:
          - throttle: 5s
logger:
  level: DEBUG
""",
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )
    with pytest.raises(ConfigMutationError, match="filters"):
        build_ct_mutation(
            snapshot,
            _topology(),
            (CTChangeRequest(2, "CT 2", "sct_006_20a_25ma", 2),),
        )

    owning_content = content.replace(
        "  - id: !extend ${main_meter_id1}\n",
        "  - platform: atm90e32\n    id: ${main_meter_id1}\n",
    )
    owning_snapshot = replace(
        snapshot,
        content=owning_content,
        sha256=sha256(owning_content.encode()).hexdigest(),
    )
    with pytest.raises(ConfigMutationError, match="filters"):
        build_ct_mutation(
            owning_snapshot,
            _topology(),
            (CTChangeRequest(2, "CT 2", "sct_006_20a_25ma", 2),),
        )

    first = build_ct_mutation(
        _snapshot(),
        _topology(),
        (CTChangeRequest(1, "CT 1", "sct_006_20a_25ma", 2),),
    )
    duplicate = first.proposed_content.replace(
        "    phase_a: # CT1\n", "    phase_a: # CT1\n    phase_a: # CT1\n"
    )
    duplicate_snapshot = ESPHomeConfigSnapshot(
        "meter.yaml", duplicate, sha256(duplicate.encode()).hexdigest()
    )
    with pytest.raises(ConfigMutationError, match="safely writable"):
        build_ct_mutation(
            duplicate_snapshot,
            _topology(),
            (CTChangeRequest(2, "CT 2", "sct_006_20a_25ma", 2),),
        )


@pytest.mark.parametrize("output", ("reactive_power", "apparent_power"))
def test_reporting_multiplier_refuses_supported_power_quality_filters(
    output: str,
) -> None:
    """Helper scaling must never merge with an external supported PQ filter."""
    snapshot = _package_snapshot()
    content = snapshot.content.replace(
        "sensor:\n",
        f"""sensor:
  - id: !extend meter_main1
    phase_b:
      {output}:
        filters:
          - throttle: 5s
""",
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    with pytest.raises(ConfigMutationError, match="filters"):
        build_ct_mutation(
            snapshot,
            _two_board_topology(),
            (CTChangeRequest(2, "CT 2", "sct_006_20a_25ma", 2),),
            package_options={
                "power_quality": (True, False),
                "status_fields": (True, False),
            },
        )


@pytest.mark.parametrize("output", ("reactive_power", "apparent_power"))
def test_unused_unscaled_phase_refuses_external_power_quality_filters(
    output: str,
) -> None:
    """A PQ removal cannot overwrite a local filter on an unused unscaled phase."""
    snapshot = _package_snapshot()
    content = snapshot.content.replace(
        "sensor:\n",
        f"""sensor:
  - id: !extend meter_main1
    phase_b:
      {output}:
        filters:
          - throttle: 5s
""",
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )
    topology = _two_board_topology()
    current = _inventory(snapshot, topology)
    current = replace(
        current,
        configuration=replace(
            current.configuration,
            channels=tuple(
                replace(channel, enabled=False, role=CircuitRole.UNUSED)
                if channel.channel == 2
                else channel
                for channel in current.configuration.channels
            ),
        ),
    )
    requested = replace(current.configuration, power_quality=(True, False))

    with pytest.raises(ConfigMutationError, match="filters"):
        build_meter_configuration_mutation(snapshot, topology, current, requested)


@pytest.mark.parametrize(
    "entry",
    (
        """  - id: !extend meter_main1
    phase_b:
      current: # local calibration
        filters: # keep local
          - throttle: 5s
""",
        """  - "id": !extend &meter "meter_main1"
    !phase "phase_b":
      &measurement "power":
        !filter "filters":
          - throttle: 5s
""",
        """  - {"id": !extend meter_main1, "phase_b": {"current": {"filters": [{throttle: 5s}]}}}
""",
        """  - id: !extend meter_main1
    phase_b:
      - power:
          filters:
            - throttle: 5s
""",
        """  - id: !extend meter_main1
    phase_b:
      harmonic_power:
        filters:
          - throttle: 5s
    phase_b:
      current:
        filters:
          - throttle: 5s
""",
        """  - id: !extend meter_main1
    phase_b: *shared_phase
""",
        """  - id: !extend meter_main1
    phase_b:
      <<: *shared_phase
""",
        """  - id: !extend meter_main1
    ? phase_b
    :
      power:
        filters:
          - throttle: 5s
""",
    ),
)
def test_reporting_multiplier_rejects_yaml_equivalent_filter_conflicts(
    entry: str,
) -> None:
    """Alternate valid YAML spellings cannot hide a managed-output filter."""
    snapshot = _snapshot()
    content = snapshot.content.replace("sensor:\n", "sensor:\n" + entry)
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    with pytest.raises((ConfigMutationError, ValueError)):
        build_ct_mutation(
            snapshot,
            _topology(),
            (CTChangeRequest(2, "CT 2", "sct_006_20a_25ma", 2),),
        )


@pytest.mark.parametrize(
    "entry",
    (
        """  - phase_b:
      current:
        filters:
          - throttle: 5s
    id: meter_main1
""",
        """  - phase_b: {current: {filters: [{throttle: 5s}]}}
    id: meter_main1
""",
        """  - "phase_b": # phase before owner
      "current": # managed output
        "filters": # local filter
          - throttle: 5s
    "id": !extend "meter_main1" # quoted owner
""",
    ),
)
def test_reporting_multiplier_rejects_filter_when_phase_precedes_id(
    entry: str,
) -> None:
    """The sequence item's first mapping remains part of its sensor item."""
    snapshot = _snapshot()
    content = snapshot.content.replace("sensor:\n", "sensor:\n" + entry)
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    with pytest.raises(ConfigMutationError, match="filters"):
        build_ct_mutation(
            snapshot,
            _topology(),
            (CTChangeRequest(2, "CT 2", "sct_006_20a_25ma", 2),),
        )


@pytest.mark.parametrize(
    "owner",
    (
        """  - id: unrelated
    id: meter_main1
""",
        """  - id: *meter_id
""",
        """  - ? id
    : meter_main1
""",
        """  - id: !secret meter_main1
""",
        """  - !secret id: meter_main1
""",
        """  - &key_anchor id: meter_main1
""",
        """  - *id: meter_main1
""",
    ),
)
def test_reporting_multiplier_rejects_ambiguous_meter_ownership(owner: str) -> None:
    """A relevant managed phase requires one directly resolvable meter ID."""
    snapshot = _snapshot()
    entry = owner + """    phase_b:
      current:
        name: CT2 Current
"""
    content = snapshot.content.replace("sensor:\n", "sensor:\n" + entry)
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    with pytest.raises((ConfigMutationError, ValueError)):
        build_ct_mutation(
            snapshot,
            _topology(),
            (CTChangeRequest(2, "CT 2", "sct_006_20a_25ma", 2),),
        )


def test_reporting_multiplier_allows_harmless_alias_outside_relevant_item() -> None:
    """An alias on a known-unrelated sensor item is not an ownership conflict."""
    snapshot = _snapshot()
    content = snapshot.content.replace(
        "sensor:\n",
        """defaults: &defaults mdi:gauge
sensor:
  - id: unrelated
    icon: *defaults
""",
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    plan = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(2, "CT 2", "sct_006_20a_25ma", 2),),
    )

    assert plan.proposed_content.count("multiply: 2") == 2


def test_reporting_multiplier_rejects_quoted_top_level_sensor_key() -> None:
    """A quoted direct sensor-item key is outside the writable allowlist."""
    snapshot = _snapshot()
    content = snapshot.content.replace(
        "sensor:\n",
        """sensor:
  - "phase_b": # phase before owner
      "current": # no local filter
        name: CT2 Current
    "id": !extend "meter_main1" # quoted owner
""",
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    with pytest.raises(ConfigMutationError, match="sensor block"):
        build_ct_mutation(
            snapshot,
            _topology(),
            (CTChangeRequest(2, "CT 2", "sct_006_20a_25ma", 2),),
        )


def test_reporting_multiplier_ignores_opaque_text_and_unmanaged_pq_filters() -> None:
    """Comments, block scalars, and harmonic/peak filters are outside this conflict."""
    snapshot = _snapshot()
    content = snapshot.content.replace(
        "sensor:\n",
        """sensor:
  # meter_main1 phase_b current filters
  - platform: template
    lambda: |-
      meter_main1:
        phase_b:
          current:
            filters:
  - id: !extend meter_main1
    phase_b:
      harmonic_power:
        filters:
          - throttle: 5s
      peak_current:
        filters:
          - throttle: 5s
""",
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )

    plan = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(2, "CT 2", "sct_006_20a_25ma", 2),),
    )

    assert plan.proposed_content.count("multiply: 2") == 2


def test_missing_keys_insert_only_in_writable_substitutions_or_refuse_with_snippet() -> (
    None
):
    """Insertion stays in one local substitutions mapping and never guesses elsewhere."""
    plan = build_ct_mutation(
        _snapshot(missing="current_cal_ct3"),
        _topology(),
        (CTChangeRequest(3, "CT 3", "sct_006_20a_25ma"),),
    )
    assert '  current_cal_ct3: "11143"\nsensor:' in plan.proposed_content
    assert plan.changes[-1].old_value is None

    missing_name = build_ct_mutation(
        _snapshot(missing="ct3_name", quote="'"),
        _topology(),
        (CTChangeRequest(3, "O'Clock", "sct_006_20a_25ma"),),
    )
    assert "  ct3_name: 'O''Clock'\nsensor:" in missing_name.proposed_content
    missing_gain = build_ct_mutation(
        _snapshot(missing="current_cal_ct3", quote="'"),
        _topology(),
        (CTChangeRequest(3, "CT 3", "sct_006_20a_25ma"),),
    )
    assert "  current_cal_ct3: '11143'\nsensor:" in missing_gain.proposed_content

    snapshot = _snapshot()
    without_substitutions = replace(
        snapshot,
        content=snapshot.content.replace("substitutions:\n", ""),
    )
    without_substitutions = replace(
        without_substitutions,
        sha256=sha256(without_substitutions.content.encode()).hexdigest(),
    )
    with pytest.raises(ConfigMutationError, match="substitutions") as error:
        build_ct_mutation(
            without_substitutions,
            _topology(),
            (CTChangeRequest(1, "Changed", "sct_006_20a_25ma"),),
        )
    assert "ct1_name" in error.value.snippet


def test_rejects_provisional_unsafe_out_of_range_and_duplicate_requests() -> None:
    """Only authoritative local substitutions can enter a CT mutation."""
    snapshot = _snapshot()
    provisional = SimpleNamespace(
        configuration=snapshot.configuration,
        content=snapshot.content,
        sha256=snapshot.sha256,
        configuration_authoritative=False,
    )
    request = CTChangeRequest(1, "Changed", "sct_006_20a_25ma")
    with pytest.raises(ConfigMutationError, match="authoritative"):
        build_ct_mutation(provisional, _topology(), (request,))
    with pytest.raises(ConfigMutationError, match="outside topology"):
        build_ct_mutation(
            snapshot, _topology(), (CTChangeRequest(7, "CT 7", "sct_006_20a_25ma"),)
        )
    with pytest.raises(ConfigMutationError, match="duplicate"):
        build_ct_mutation(snapshot, _topology(), (request, request))

    unsafe = ESPHomeConfigSnapshot(
        "meter.yaml",
        "substitutions: !include secrets.yaml\n",
        sha256(b"substitutions: !include secrets.yaml\n").hexdigest(),
    )
    with pytest.raises(ValueError, match="substitutions"):
        build_ct_mutation(unsafe, _topology(), (request,))


def test_custom_needs_its_explicit_gain_label_and_acknowledgement() -> None:
    """The Custom path validates the same physical-installation acknowledgement."""
    with pytest.raises(ValueError, match="acknowledgement"):
        build_ct_mutation(
            _snapshot(),
            _topology(),
            (
                CTChangeRequest(
                    1, "CT 1", "custom", custom_gain_ct=100, custom_label="Odd load"
                ),
            ),
        )

    plan = build_ct_mutation(
        _snapshot(),
        _topology(),
        (
            CTChangeRequest(
                1,
                "CT 1",
                "custom",
                reporting_multiplier=2,
                custom_gain_ct=100,
                custom_label="Odd load",
                burden_output_acknowledged=True,
            ),
        ),
    )
    assert [change.key for change in plan.changes] == ["current_cal_ct1"]
    assert 'current_cal_ct1: "50"' in plan.proposed_content
    assert plan.proposed_content.count("multiply: 2") == 2


def test_gain_only_review_lines_are_redacted_and_keep_one_group_heading() -> None:
    snapshot = _snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    custom = replace(
        current.configuration,
        meter=replace(
            current.configuration.meter,
            voltage_references=(
                replace(
                    current.configuration.meter.voltage_references[0],
                    gain_voltage=7305,
                ),
            ),
        ),
        channels=tuple(
            replace(
                channel,
                model_id="custom",
                custom_gain_ct=100,
                custom_label="Kitchen load",
                burden_output_acknowledged=True,
            )
            if channel.channel == 1
            else channel
            for channel in current.configuration.channels
        ),
    )
    first = build_meter_configuration_mutation(snapshot, topology, current, custom)
    stored = StoredMeterConfiguration(sha256(first.proposed_content.encode()).hexdigest(), custom.meter, custom.channels, custom.default_totals, custom.automatic_totals, custom.aggregates, custom.power_quality,
    custom.status_fields,)
    configured_snapshot = replace(
        snapshot, content=first.proposed_content, sha256=stored.config_sha256
    )
    configured = _inventory(configured_snapshot, topology, stored=stored)
    gain_only = replace(
        configured.configuration,
        channels=tuple(
            replace(channel, custom_gain_ct=200) if channel.channel == 1 else channel
            for channel in configured.configuration.channels
        ),
    )

    custom_plan = build_meter_configuration_mutation(
        configured_snapshot, topology, configured, gain_only
    )
    voltage_plan = build_meter_configuration_mutation(
        configured_snapshot,
        topology,
        configured,
        replace(
            configured.configuration,
            meter=replace(
                configured.configuration.meter,
                voltage_references=(
                    replace(
                        configured.configuration.meter.voltage_references[0],
                        gain_voltage=7306,
                    ),
                ),
            ),
        ),
    )

    assert custom_plan.redacted_diff == "Channel\n~ CT1: calibration gain updated"
    assert "100" not in custom_plan.redacted_diff
    assert "200" not in custom_plan.redacted_diff
    assert voltage_plan.redacted_diff == (
        "Voltage reference\n~ calibration gain updated"
    )
    assert "7306" not in voltage_plan.redacted_diff
