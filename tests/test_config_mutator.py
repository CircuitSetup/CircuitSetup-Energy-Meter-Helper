"""Tests for line-preserving, reviewable CT substitution changes."""

from dataclasses import replace
from hashlib import sha256
from types import SimpleNamespace

import pytest

from custom_components.circuitsetup_energy_meter_helper import config_mutator
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
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    CircuitAggregate,
    CircuitRole,
    ElectricalSystem,
    EnergyMode,
    MeasurementMethod,
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
            "  - platform: total_daily_energy\n"
            "    id: totalEnergyDaily\n"
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
    current = _inventory(snapshot, topology)
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
            CircuitAggregate(
                "load", "Kitchen load", CircuitRole.BRANCH, (1,),
                MeasurementMethod.DIRECT, None, EnergyMode.CONSUMPTION,
            ),
        ),
        power_quality=tuple(not value for value in current.configuration.power_quality),
        status_fields=tuple(not value for value in current.configuration.status_fields),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    assert [line for line in plan.redacted_diff.splitlines() if not line.startswith(("+", "-", "~"))] == [
        "Meter", "Voltage reference", "Channel", "Aggregate", "Package",
    ]
    assert "+ friendly_name: Kitchen meter" in plan.redacted_diff
    assert "+ ct1_name: Kitchen mains" in plan.redacted_diff
    assert "+ power_quality_main: enabled" in plan.redacted_diff
    assert '+        name: "${friendly_name} Service Voltage"' in plan.redacted_diff
    assert "+  - platform: template" in plan.redacted_diff
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
                replace(current.configuration.meter.voltage_references[0], gain_voltage=7305),
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

    stored = StoredMeterConfiguration(
        sha256(plan.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
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

    stored = StoredMeterConfiguration(
        sha256(plan.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
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
    malformed_stored = StoredMeterConfiguration(
        sha256(malformed.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
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
    stored = StoredMeterConfiguration(
        sha256(plan.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )

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
    stored = StoredMeterConfiguration(
        sha256(plan.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )

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
    stored = StoredMeterConfiguration(
        sha256(plan.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )

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
    stored = StoredMeterConfiguration(
        sha256(tampered.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )

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
    stored = StoredMeterConfiguration(
        sha256(plan.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
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
    stored = StoredMeterConfiguration(
        sha256(compatible.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )

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
      harmonic_power: !remove
      peak_current: !remove
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
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        channels=tuple(
            replace(channel, reporting_multiplier=4) if channel.channel == 7 else channel
            for channel in current.configuration.channels
        ),
        aggregates=(
            CircuitAggregate(
                "load", "Load", CircuitRole.BRANCH, (7,), MeasurementMethod.DIRECT,
                None, EnergyMode.CONSUMPTION,
            ),
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
      harmonic_power: !remove
      peak_current: !remove
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
      harmonic_power: !remove
      peak_current: !remove
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


def _assert_lifetime_energy(block: str, power_id: str) -> None:
    for line in (
        "  - platform: integration",
        f"    sensor: {power_id}",
        "    time_unit: h",
        "    restore: true",
        "    filters:",
        "      - multiply: 0.001",
        "    unit_of_measurement: kWh",
        "    device_class: energy",
        "    state_class: total_increasing",
    ):
        assert line in block


def test_aggregate_preview_renders_bidirectional_grid_and_hides_contract_totals() -> None:
    """Contract-2 totals are internal before deterministic grid entities appear."""
    snapshot = _contract_snapshot(generic_totals=True)
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = _aggregate_request(
        current,
        CircuitAggregate(
            "grid",
            "Grid",
            CircuitRole.GRID,
            (1, 2),
            MeasurementMethod.DIRECT,
            None,
            EnergyMode.BIDIRECTIONAL,
        ),
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
    _assert_lifetime_energy(block, "csemh_grid_import_power")
    _assert_lifetime_energy(block, "csemh_grid_export_power")
    assert "  - platform: total_daily_energy" not in block
    for total_id in ("totalEnergyDaily",):
        assert f"- id: !extend {total_id}\n    internal: true" in block
    ESPHomeConfigDocument.parse(plan.proposed_content)


def test_mains_and_solar_templates_split_grid_import_from_export() -> None:
    """Solar export remains a positive Home Assistant return-to-grid total."""
    snapshot = _contract_snapshot(generic_totals=True)
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        aggregates=(
            CircuitAggregate(
                "auto-mains", "Mains", CircuitRole.GRID, (1, 2),
                MeasurementMethod.TWO_CT_SUM, None, EnergyMode.BIDIRECTIONAL,
                expose_current=True,
            ),
            CircuitAggregate(
                "auto-solar", "Solar", CircuitRole.SOLAR, (3, 4),
                MeasurementMethod.TWO_CT_SUM, None, EnergyMode.GENERATION,
            ),
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
    _assert_lifetime_energy(block, "csemh_auto_mains_import_power")
    _assert_lifetime_energy(block, "csemh_auto_mains_export_power")
    assert 'name: "${friendly_name} Mains Import Energy"' in block
    assert 'name: "${friendly_name} Mains Export Energy"' in block
    assert (
        "lambda: return std::max(0.0f, "
        "-(id(ct3Watts).state + id(ct4Watts).state));"
        in block
    )
    _assert_lifetime_energy(block, "csemh_auto_solar_power")
    ESPHomeConfigDocument.parse(plan.proposed_content)


def test_indentless_contract_sensor_supports_voltage_aggregate_preview_and_readback() -> None:
    """Official root-level sensor lists retain valid relative helper indentation."""
    snapshot = _indentless_contract_snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
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
            CircuitAggregate(
                "load", "Load", CircuitRole.BRANCH, (1,),
                MeasurementMethod.DIRECT, None, EnergyMode.CONSUMPTION,
            ),
        ),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)

    assert "\n- id: !extend totalEnergyDaily\n  internal: true" in plan.proposed_content
    assert "\n  - id: !extend totalEnergyDaily" not in plan.proposed_content
    assert "\n- id: !extend meter_main1" in plan.proposed_content
    stored = StoredMeterConfiguration(
        sha256(plan.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
    configured_snapshot = replace(
        snapshot, content=plan.proposed_content, sha256=stored.config_sha256
    )
    configured = _inventory(configured_snapshot, topology, stored=stored)

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
    current = _inventory(snapshot, _topology())
    requested = _aggregate_request(
        current,
        CircuitAggregate(
            "load", "Load", CircuitRole.BRANCH, (1,),
            MeasurementMethod.DIRECT, None, EnergyMode.CONSUMPTION,
        ),
    )

    with pytest.raises(ConfigMutationError, match="sensor block"):
        build_meter_configuration_mutation(snapshot, _topology(), current, requested)


def test_aggregate_energy_signs_and_one_ct_power_multiplier_are_semantic_only() -> None:
    """Energy clamps are explicit and doubling never changes aggregate current."""
    snapshot = _contract_snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        aggregates=(
            CircuitAggregate(
                "load", "Load", CircuitRole.BRANCH, (1,),
                MeasurementMethod.ONE_CT_DOUBLE_POWER, None, EnergyMode.CONSUMPTION,
                expose_current=True,
            ),
            CircuitAggregate(
                "solar", "Solar", CircuitRole.SOLAR, (2,),
                MeasurementMethod.DIRECT, None, EnergyMode.GENERATION,
            ),
        ),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    block = plan.proposed_content.split(
        "# CircuitSetup Energy Meter Helper: aggregates v1\n", 1
    )[1].split("# End CircuitSetup", 1)[0]

    assert "lambda: return std::max(0.0f, id(ct1Watts).state * 2.0);" in block
    assert "lambda: return id(ct1Amps).state;" in block
    assert "sensor: csemh_load_power" in block
    assert "lambda: return std::max(0.0f, -(id(ct2Watts).state));" in block
    assert "sensor: csemh_solar_power" in block
    _assert_lifetime_energy(block, "csemh_load_power")
    _assert_lifetime_energy(block, "csemh_solar_power")
    assert "  - platform: total_daily_energy" not in block
    assert "id(ct1Amps).state * 2.0" not in block


def test_aggregate_preview_requires_contract_totals_and_never_invents_default_total() -> None:
    """Legacy sources refuse replacement totals; an empty request adds no block."""
    aggregate = CircuitAggregate(
        "load", "Load", CircuitRole.BRANCH, (1,),
        MeasurementMethod.DIRECT, None, EnergyMode.CONSUMPTION,
    )
    legacy = _snapshot()
    with pytest.raises(ConfigMutationError, match="managed totals"):
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


@pytest.mark.parametrize(
    ("addon_count", "hidden_totals"),
    (
        (0, ("totalEnergyDaily",)),
        (1, ("totalAmps", "totalWatts", "totalEnergyDaily")),
        (2, ("totalAmps", "totalWatts", "totalEnergyDaily")),
    ),
)
def test_removing_last_aggregate_restores_official_totals(
    addon_count: int, hidden_totals: tuple[str, ...]
) -> None:
    """An empty request removes the owned block rather than retaining its extends."""
    topology = _topology_for_addons(addon_count)
    snapshot = _contract_snapshot_for(topology)
    current = _inventory(snapshot, topology)
    aggregate = CircuitAggregate(
        "load", "Load", CircuitRole.BRANCH, (topology.ct_count,),
        MeasurementMethod.DIRECT, None, EnergyMode.CONSUMPTION,
    )
    requested = _aggregate_request(current, aggregate)
    first = build_meter_configuration_mutation(snapshot, topology, current, requested)
    for total_id in hidden_totals:
        assert f"- id: !extend {total_id}\n    internal: true" in first.proposed_content
    stored = StoredMeterConfiguration(
        sha256(first.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
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
    empty = replace(configured.configuration, aggregates=())
    removed = build_meter_configuration_mutation(
        configured_snapshot, topology, configured, empty
    )

    assert "aggregates v1" not in removed.proposed_content
    assert "internal: true" not in removed.proposed_content
    assert removed.proposed_content == snapshot.content
    assert removed.redacted_diff.startswith("Aggregate\n-  - id: !extend")
    assert "-  - platform: template" in removed.redacted_diff
    assert "- load:" in removed.redacted_diff

    empty_stored = StoredMeterConfiguration(
        sha256(removed.proposed_content.encode()).hexdigest(),
        empty.meter,
        empty.channels,
        empty.aggregates,
        empty.power_quality,
        empty.status_fields,
    )
    empty_snapshot = replace(
        snapshot,
        content=removed.proposed_content,
        sha256=empty_stored.config_sha256,
    )
    empty_current = _inventory(empty_snapshot, topology, stored=empty_stored)
    assert build_meter_configuration_mutation(
        empty_snapshot, topology, empty_current, empty_current.configuration
    ).proposed_content == empty_snapshot.content
    assert "csemh_load_energy" in build_meter_configuration_mutation(
        empty_snapshot, topology, empty_current, requested
    ).proposed_content


def test_removing_last_aggregate_preserves_user_sensor_siblings() -> None:
    """Only the exact owned span disappears; nearby user energy remains byte-stable."""
    snapshot = _contract_snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = _aggregate_request(
        current,
        CircuitAggregate(
            "load", "Load", CircuitRole.BRANCH, (1,),
            MeasurementMethod.DIRECT, None, EnergyMode.CONSUMPTION,
        ),
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
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
    configured_snapshot = replace(
        snapshot, content=decorated, sha256=stored.config_sha256
    )
    configured = _inventory(configured_snapshot, topology, stored=stored)
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
    current = _inventory(snapshot, topology)
    requested = _aggregate_request(
        current,
        CircuitAggregate(
            "load", "Load", CircuitRole.BRANCH, (1,),
            MeasurementMethod.DIRECT, None, EnergyMode.CONSUMPTION,
        ),
    )
    added = build_meter_configuration_mutation(snapshot, topology, current, requested)
    stored = StoredMeterConfiguration(
        sha256(added.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
        requested.power_quality,
        requested.status_fields,
    )
    configured_snapshot = replace(
        snapshot, content=added.proposed_content, sha256=stored.config_sha256
    )
    configured = _inventory(configured_snapshot, topology, stored=stored)

    removed = build_meter_configuration_mutation(
        configured_snapshot,
        topology,
        configured,
        replace(configured.configuration, aggregates=()),
    )

    assert removed.proposed_content == content


def test_sparse_addon_aggregates_hide_each_effective_official_total_once() -> None:
    """Add-on channel IDs stay explicit while each stable total gets one override."""
    snapshot = _package_snapshot()
    content = snapshot.content.replace(
        "substitutions:\n", 'substitutions:\n  csemh_config_contract: "2"\n'
    ).replace(
        "sensor:\n",
        "sensor:\n"
        "  - platform: template\n"
        "    id: totalAmps\n"
        "  - platform: template\n"
        "    id: totalWatts\n"
        "  - platform: total_daily_energy\n"
        "    id: totalEnergyDaily\n"
        ,
        1,
    )
    snapshot = replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )
    topology = _two_board_topology()
    current = _inventory(snapshot, topology)
    requested = replace(
        current.configuration,
        aggregates=(
            CircuitAggregate("main", "Main", CircuitRole.BRANCH, (1,), MeasurementMethod.DIRECT, None, EnergyMode.NONE),
            CircuitAggregate("addon", "Addon", CircuitRole.BRANCH, (12,), MeasurementMethod.DIRECT, None, EnergyMode.CONSUMPTION),
        ),
    )

    plan = build_meter_configuration_mutation(snapshot, topology, current, requested)
    block = plan.proposed_content.split("aggregates v1\n", 1)[1].split(
        "# End CircuitSetup", 1
    )[0]

    assert "lambda: return id(ct1Watts).state;" in block
    assert "lambda: return std::max(0.0f, id(ct12Watts).state);" in block
    for total_id in ("totalAmps", "totalWatts", "totalEnergyDaily"):
        assert block.count(f"- id: !extend {total_id}\n    internal: true") == 1


def test_aggregate_names_are_yaml_scalars_and_repeated_preview_is_identical() -> None:
    """User labels cannot change generated YAML structure or produce duplicate totals."""
    snapshot = _contract_snapshot()
    topology = _topology()
    current = _inventory(snapshot, topology)
    requested = _aggregate_request(
        current,
        CircuitAggregate(
            "two-pole",
            'Dryer: "Main" # 240V',
            CircuitRole.TWO_POLE,
            (1, 2),
            MeasurementMethod.TWO_CT_SUM,
            None,
            EnergyMode.CONSUMPTION,
        ),
    )
    first = build_meter_configuration_mutation(snapshot, topology, current, requested)
    stored = StoredMeterConfiguration(
        sha256(first.proposed_content.encode()).hexdigest(),
        requested.meter,
        requested.channels,
        requested.aggregates,
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
        _inventory(repeated_snapshot, topology, stored=stored),
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


def test_multiplier_one_omits_scaling_filters_but_removes_active_pq_outputs() -> None:
    """The base range leaves measurements unscaled while still pruning PQ extras."""
    plan = build_ct_mutation(
        _package_snapshot(),
        _two_board_topology(),
        (CTChangeRequest(1, "CT 1", "sct_006_20a_25ma", 1),),
        package_options={
            "power_quality": (True, False),
            "status_fields": (True, False),
        },
    )

    phase = plan.proposed_content.split("phase_a: # CT1", 1)[1].split(
        "phase_b: # CT2", 1
    )[0]
    assert "filters:" not in phase
    assert "harmonic_power: !remove" in phase
    assert "peak_current: !remove" in phase


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
    stored = StoredMeterConfiguration(
        sha256(first.proposed_content.encode()).hexdigest(),
        custom.meter,
        custom.channels,
        custom.aggregates,
        custom.power_quality,
        custom.status_fields,
    )
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
