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
    CircuitRole,
)
from custom_components.circuitsetup_energy_meter_helper.meter_inventory import (
    MeterConfigurationInventory,
)
from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology
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


def _inventory(
    snapshot: ESPHomeConfigSnapshot, topology: MeterTopology
) -> MeterConfigurationInventory:
    return MeterConfigurationInventory.from_document(
        snapshot.configuration,
        ESPHomeConfigDocument.parse(snapshot.content),
        topology,
        CTPresetCatalog.load(),
        VoltageTransformerCatalog.load(),
        snapshot.sha256,
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


@pytest.mark.parametrize("power_quality", ((False, False), (True, False)))
def test_generalized_task15_rejects_unsupported_channel_state_changes(
    power_quality: tuple[bool, bool],
) -> None:
    """An unsupported semantic request must fail even if its YAML would be a no-op."""
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

    with pytest.raises(ConfigMutationError, match="semantic"):
        build_meter_configuration_mutation(snapshot, topology, current, requested)


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
    assert "-       power:" in plan.redacted_diff
    assert "+       reactive_power:" in plan.redacted_diff


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
    assert "-     phase_b: # CT2" in plan.redacted_diff
    assert "+   - id: !extend meter_main1" in plan.redacted_diff


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
    assert "+           - multiply: 2" in legacy_plan.redacted_diff
    assert "current_cal_ct2" in legacy_plan.redacted_diff
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
        """  - {"id": !extend meter_main1, "phase_b": {"reactive_power": {"filters": [{throttle: 5s}]}}}
""",
        """  - id: !extend meter_main1
    phase_b:
      - apparent_power:
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
