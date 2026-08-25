"""Tests for authoritative and provisional meter topology detection."""

from dataclasses import replace

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    default_meter_configuration,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    ChannelAddress,
    MeterTopology,
    SetupState,
    TopologyEvidenceSource,
    VoltageReferenceTopology,
)
from custom_components.circuitsetup_energy_meter_helper.provisioning import (
    ProvisioningSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.topology import (
    TopologyMismatchError,
    TopologyParseError,
    addon_count_from_dashboard_import,
    addon_count_from_packages,
    addon_count_from_project,
    channel_address,
    connection_type_from_project,
    cross_check_runtime,
    topology_from_config,
    topology_from_native,
    voltage_layout_from_project,
    voltage_reference_topology_from_config,
    voltage_reference_topology_from_configuration,
    voltage_reference_topology_from_legacy,
)


@pytest.mark.parametrize(
    ("name", "count", "connection", "layout"),
    (
        ("circuitsetup.6c-energy-meter", 0, "wifi", "standard"),
        ("circuitsetup.6c-energy-meter-ethernet", 0, "ethernet_lilygo", "standard"),
        ("circuitsetup.6c-energy-meter-1-addon", 1, "wifi", "standard"),
        (
            "circuitsetup.6c-energy-meter-2-addons-ethernet",
            2,
            "ethernet_lilygo",
            "standard",
        ),
        (
            "circuitsetup.6c-energy-meter-3-addons-2-voltages",
            3,
            "wifi",
            "two_voltages",
        ),
        (
            "circuitsetup.6c-energy-meter-6-addons-ethernet-waveshare",
            6,
            "ethernet_waveshare",
            "standard",
        ),
        (
            "circuitsetup.6c-energy-meter-ethernet-2-addons",
            2,
            "ethernet_lilygo",
            "standard",
        ),
    ),
)
def test_task4_project_variants(
    name: str, count: int, connection: str, layout: str
) -> None:
    assert addon_count_from_project(name) == count
    assert connection_type_from_project(name) == connection
    assert voltage_layout_from_project(name) == layout


@pytest.mark.parametrize(
    "name",
    (
        "",
        "other.meter",
        "circuitsetup.unknown",
        "circuitsetup.6c-energy-metering",
        "circuitsetup.6c-energy-meter-unknown",
        "circuitsetup.6c-energy-meter-7-addons",
    ),
)
def test_unknown_project_is_not_zero_addons(name: str) -> None:
    with pytest.raises(TopologyParseError):
        addon_count_from_project(name)


@pytest.mark.parametrize("addon_count", range(7))
def test_topology_derives_every_supported_count(addon_count: int) -> None:
    topology = MeterTopology.from_addon_count(
        addon_count,
        connection_type="wifi",
        voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter",
        evidence=(),
    )

    assert topology.board_count == addon_count + 1
    assert topology.ct_count == 6 * (addon_count + 1)
    assert topology.group_count == 2 * (addon_count + 1)


@pytest.mark.parametrize("addon_count", (-1, 7))
def test_topology_rejects_unsupported_counts(addon_count: int) -> None:
    with pytest.raises(ValueError):
        MeterTopology.from_addon_count(
            addon_count,
            connection_type="wifi",
            voltage_layout="standard",
            project_name="circuitsetup.6c-energy-meter",
            evidence=(),
        )


def test_channel_address_maps_board_group_and_phase() -> None:
    topology = MeterTopology.from_addon_count(
        6,
        connection_type="wifi",
        voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter-6-addons",
        evidence=(),
    )

    assert channel_address(1, topology) == ChannelAddress(1, 0, 0, "A")
    assert channel_address(6, topology) == ChannelAddress(6, 0, 1, "C")
    assert channel_address(7, topology) == ChannelAddress(7, 1, 0, "A")
    assert channel_address(42, topology) == ChannelAddress(42, 6, 1, "C")
    with pytest.raises(ValueError):
        channel_address(43, topology)


def test_package_count_requires_contiguous_unique_indices() -> None:
    main = "Software/ESPHome/meter_sensors/6chan_main_sensor.yaml"
    addon = "Software/ESPHome/meter_sensors/6chan_addon{}.yaml"

    assert addon_count_from_packages((main,)) == 0
    assert addon_count_from_packages((main, addon.format(1), addon.format(2))) == 2
    assert addon_count_from_packages(("unrelated.yaml",)) is None
    with pytest.raises(TopologyParseError, match="contiguous"):
        addon_count_from_packages((main, addon.format(1), addon.format(3)))
    with pytest.raises(TopologyParseError, match="duplicate"):
        addon_count_from_packages((main, addon.format(1), addon.format(1)))


@pytest.mark.parametrize("filename", ("6chan_addon0.yaml", "6chan_addon01.yaml", "6chan_addon7.yaml", "6chan_addon10.yaml"))
def test_package_count_rejects_noncanonical_indices(filename: str) -> None:
    with pytest.raises(TopologyParseError, match="official index 1..6"):
        addon_count_from_packages((f"Software/ESPHome/meter_sensors/{filename}",))


@pytest.mark.parametrize(
    ("url", "count"),
    (
        ("github://owner/repo/6chan_energy_meter_main_board.yaml@main", 0),
        ("github://owner/repo/6chan_energy_meter_2-addons_ethernet.yaml@main", 2),
        ("github://owner/repo/6-channel-energy-meter-6-addons.yaml@main", 6),
        ("github://owner/repo/custom.yaml@main", None),
    ),
)
def test_dashboard_import_is_lower_confidence_evidence(
    url: str, count: int | None
) -> None:
    assert addon_count_from_dashboard_import(url) == count


@pytest.mark.parametrize("addon_count", range(7))
def test_authoritative_config_for_every_addon_count(addon_count: int) -> None:
    suffix = "" if addon_count == 0 else f"-{addon_count}-addons"
    files = ["      - Software/ESPHome/meter_sensors/6chan_main_sensor.yaml"]
    files.extend(
        f"      - Software/ESPHome/meter_sensors/6chan_addon{index}.yaml"
        for index in range(1, addon_count + 1)
    )
    content = (
        "esphome:\n"
        "  project:\n"
        f"    name: circuitsetup.6c-energy-meter{suffix}\n"
        "packages:\n"
        "  meter:\n"
        "    files:\n"
        + "\n".join(files)
        + "\n"
        "dashboard_import:\n"
        f"  package_import_url: github://owner/repo/6chan_energy_meter{suffix}.yaml@main\n"
    )

    topology = topology_from_config(ESPHomeConfigDocument.parse(content))

    assert topology.addon_count == addon_count
    assert tuple(item.source for item in topology.evidence) == (
        TopologyEvidenceSource.CONFIG_PROJECT,
        TopologyEvidenceSource.CONFIG_PACKAGES,
        TopologyEvidenceSource.DASHBOARD_IMPORT,
    )


def test_config_evidence_must_agree() -> None:
    content = """esphome:
  project:
    name: circuitsetup.6c-energy-meter-2-addons
packages:
  meter:
    files:
      - Software/ESPHome/meter_sensors/6chan_main_sensor.yaml
      - Software/ESPHome/meter_sensors/6chan_addon1.yaml
"""

    with pytest.raises(TopologyMismatchError, match="project.*2.*packages.*1"):
        topology_from_config(ESPHomeConfigDocument.parse(content))


def test_native_project_is_cross_checked_against_config() -> None:
    document = ESPHomeConfigDocument.parse(
        "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter-1-addon\n"
    )

    with pytest.raises(TopologyMismatchError, match="native project=2"):
        topology_from_config(
            document,
            native_project_name="circuitsetup.6c-energy-meter-2-addons",
        )


@pytest.mark.parametrize(
    ("config_project", "native_project"),
    (
        (
            "circuitsetup.6c-energy-meter-2-addons",
            "circuitsetup.6c-energy-meter-2-addons-ethernet-waveshare",
        ),
        (
            "circuitsetup.6c-energy-meter-2-addons",
            "circuitsetup.6c-energy-meter-2-addons-2-voltages",
        ),
    ),
)
def test_native_project_rejects_semantic_variant_conflict(
    config_project: str, native_project: str
) -> None:
    document = ESPHomeConfigDocument.parse(
        f"esphome:\n  project:\n    name: {config_project}\n"
    )

    with pytest.raises(TopologyMismatchError, match="config project.*native project"):
        topology_from_config(document, native_project_name=native_project)


def test_native_project_accepts_equivalent_suffix_ordering() -> None:
    document = ESPHomeConfigDocument.parse(
        "esphome:\n"
        "  project:\n"
        "    name: circuitsetup.6c-energy-meter-2-addons-ethernet\n"
    )

    topology = topology_from_config(
        document,
        native_project_name="circuitsetup.6c-energy-meter-ethernet-2-addons",
    )

    assert topology.connection_type == "ethernet_lilygo"
    assert topology.evidence[-1].source is TopologyEvidenceSource.NATIVE_PROJECT


def test_dashboard_import_alone_is_not_authoritative() -> None:
    document = ESPHomeConfigDocument.parse(
        "dashboard_import:\n"
        "  package_import_url: github://owner/repo/6chan_energy_meter_2-addons.yaml\n"
    )

    with pytest.raises(TopologyParseError, match="no authoritative"):
        topology_from_config(document)


def test_runtime_counts_are_actionable_and_retained_as_evidence() -> None:
    topology = MeterTopology.from_addon_count(
        1,
        connection_type="wifi",
        voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter-1-addon",
        evidence=(),
    )

    checked = cross_check_runtime(topology, 12, 4, "meter.yaml")
    assert checked.evidence[-1].source is TopologyEvidenceSource.NATIVE_ENTITY_COUNTS

    with pytest.raises(TopologyMismatchError) as error:
        cross_check_runtime(topology, 11, 3, "meter.yaml")
    message = str(error.value)
    assert "meter.yaml" in message
    assert "current sensors expected 12, actual 11" in message
    assert "run-gain buttons expected 4, actual 3" in message


def test_native_only_topology_remains_provisional() -> None:
    topology = topology_from_native("circuitsetup.6c-energy-meter-3-addons-ethernet")
    snapshot = ProvisioningSnapshot(
        SetupState.TOPOLOGY_REVIEW,
        (),
        configuration_authoritative=False,
    )

    assert topology.addon_count == 3
    assert topology.evidence[0].source is TopologyEvidenceSource.NATIVE_PROJECT
    assert not hasattr(topology, "configuration_authoritative")
    assert not snapshot.configuration_authoritative


def test_standard_legacy_project_maps_every_group_to_one_reference() -> None:
    meter = topology_from_native("circuitsetup.6c-energy-meter-1-addon")
    voltage = voltage_reference_topology_from_legacy(meter)

    assert isinstance(voltage, VoltageReferenceTopology)
    assert voltage.reference_ids == ("main",)
    assert voltage.groups_for("main") == (
        "main_1", "main_2", "addon1_1", "addon1_2"
    )


def test_two_voltage_legacy_project_is_multi_reference_evidence() -> None:
    meter = topology_from_native("circuitsetup.6c-energy-meter-1-addon-2-voltages")
    voltage = voltage_reference_topology_from_legacy(meter)

    assert voltage.reference_ids == ("main", "secondary")
    assert set(voltage.groups_for("main")) | set(voltage.groups_for("secondary")) == {
        "main_1", "main_2", "addon1_1", "addon1_2"
    }


def test_helper_configuration_overrides_legacy_layout_when_structurally_valid() -> None:
    meter = topology_from_native("circuitsetup.6c-energy-meter-1-addon-2-voltages")
    request = default_meter_configuration(
        meter, {"power_quality": (False, False), "status_fields": (True, False)}
    )

    voltage = voltage_reference_topology_from_configuration(meter, request)

    assert voltage.reference_ids == ("main",)
    assert voltage.source == "helper"


def test_managed_voltage_block_requires_matching_trusted_fingerprint() -> None:
    document = ESPHomeConfigDocument.parse(
        "esphome:\n"
        "  project:\n"
        "    name: circuitsetup.6c-energy-meter-2-voltages\n"
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "voltage_references:\n"
        "  main: 120\n"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    meter = topology_from_config(document)

    injected = voltage_reference_topology_from_config(document, meter)
    trusted = voltage_reference_topology_from_configuration(
        meter,
        default_meter_configuration(
            meter, {"power_quality": (False,), "status_fields": (True,)}
        ),
    )
    voltage = voltage_reference_topology_from_config(
        document, meter, trusted_fingerprint=trusted.fingerprint
    )

    assert injected.source == "legacy"
    assert injected.reference_ids == ("main", "secondary")
    assert voltage.source == "helper"
    assert voltage.reference_ids == ("main",)


@pytest.mark.parametrize(
    "assignments",
    (
        "  main: [main_1]\n  secondary: 120\n",
        "  main: [main_1]\n",
        "  main: [main_1, main_2]\n  secondary: [main_2]\n",
        "  main: [main_1, main_2, addon1_1]\n",
        "  main: [main_1]\n  main: [main_2]\n",
    ),
    ids=("mixed", "missing", "duplicate-group", "extra", "duplicate-reference"),
)
def test_trusted_managed_voltage_block_rejects_noncanonical_coverage(
    assignments: str,
) -> None:
    document = ESPHomeConfigDocument.parse(
        "esphome:\n"
        "  project:\n"
        "    name: circuitsetup.6c-energy-meter-2-voltages\n"
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "voltage_references:\n"
        f"{assignments}"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    meter = topology_from_config(document)

    with pytest.raises(TopologyParseError):
        voltage_reference_topology_from_config(
            document, meter, trusted_fingerprint="v1:" + "0" * 64
        )


@pytest.mark.parametrize(
    "groups",
    (
        "main_1,,main_2",
        ",main_1,main_2",
        "main_1,main_2,",
        "main_1,   ,main_2",
    ),
    ids=("double-comma", "leading-comma", "trailing-comma", "blank-element"),
)
def test_trusted_managed_voltage_block_rejects_empty_list_elements(
    groups: str,
) -> None:
    document = ESPHomeConfigDocument.parse(
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "voltage_references:\n"
        f"  main: [{groups}]\n"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    meter = topology_from_native("circuitsetup.6c-energy-meter")
    trusted = VoltageReferenceTopology(
        (("main", ("main_1", "main_2")),), "helper"
    )

    with pytest.raises(TopologyParseError):
        voltage_reference_topology_from_config(
            document, meter, trusted_fingerprint=trusted.fingerprint
        )


def test_trusted_managed_voltage_block_accepts_whitespace_around_list_elements() -> None:
    document = ESPHomeConfigDocument.parse(
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "voltage_references:\n"
        "  main: [ main_1 , main_2 ]\n"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    meter = topology_from_native("circuitsetup.6c-energy-meter")
    trusted = VoltageReferenceTopology(
        (("main", ("main_1", "main_2")),), "helper"
    )

    assert voltage_reference_topology_from_config(
        document, meter, trusted_fingerprint=trusted.fingerprint
    ).fingerprint == trusted.fingerprint


@pytest.mark.parametrize(
    ("addon_count", "reference_count"),
    ((1, 3), (3, 8)),
)
def test_trusted_managed_voltage_block_accepts_bounded_reference_counts(
    addon_count: int, reference_count: int
) -> None:
    groups = tuple(
        f"{'main' if board == 0 else f'addon{board}'}_{group}"
        for board in range(addon_count + 1)
        for group in (1, 2)
    )
    references = tuple(
        (f"ref{index}", groups[index::reference_count])
        for index in range(reference_count)
    )
    assignments = "".join(
        f"  {reference_id}: [{', '.join(reference_groups)}]\n"
        for reference_id, reference_groups in references
    )
    document = ESPHomeConfigDocument.parse(
        "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter"
        f"-{addon_count}-addons\n"
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "voltage_references:\n"
        f"{assignments}"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    meter = topology_from_config(document)
    trusted = VoltageReferenceTopology(references, "helper")

    voltage = voltage_reference_topology_from_config(
        document, meter, trusted_fingerprint=trusted.fingerprint
    )

    assert len(voltage.references) == reference_count
    assert meter.board_count == addon_count + 1


@pytest.mark.parametrize(
    ("project_suffix", "references"),
    (
        (
            "-1-addon",
            (
                ("ref0", ("main_1", "addon1_2")),
                ("ref1", ("main_2",)),
                ("ref2", ("addon1_1",)),
            ),
        ),
        (
            "-3-addons",
            (
                ("ref0", ("main_1",)),
                ("ref1", ("main_2",)),
                ("ref2", ("addon1_1",)),
                ("ref3", ("addon1_2",)),
                ("ref4", ("addon2_1",)),
                ("ref5", ("addon2_2",)),
                ("ref6", ("addon3_1",)),
                ("ref7", ("addon3_2",)),
            ),
        ),
    ),
    ids=("three", "eight"),
)
def test_trusted_scalar_voltage_block_uses_canonical_round_robin_coverage(
    project_suffix: str,
    references: tuple[tuple[str, tuple[str, ...]], ...],
) -> None:
    document = ESPHomeConfigDocument.parse(
        "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter"
        f"{project_suffix}\n"
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "voltage_references:\n"
        + "".join(f"  {reference_id}: 120\n" for reference_id, _ in references)
        + "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    meter = topology_from_config(document)
    trusted = VoltageReferenceTopology(references, "helper")

    voltage = voltage_reference_topology_from_config(
        document, meter, trusted_fingerprint=trusted.fingerprint
    )

    assert voltage.references == references


@pytest.mark.parametrize("reference_count", (0, 9), ids=("zero", "nine"))
def test_trusted_managed_voltage_block_rejects_counts_outside_one_to_eight(
    reference_count: int,
) -> None:
    document = ESPHomeConfigDocument.parse(
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "voltage_references:\n"
        + "".join(f"  ref{index}: 120\n" for index in range(reference_count))
        + "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    meter = topology_from_native("circuitsetup.6c-energy-meter-4-addons")

    with pytest.raises(TopologyParseError, match="invalid managed"):
        voltage_reference_topology_from_config(
            document, meter, trusted_fingerprint="v1:" + "0" * 64
        )


def test_trusted_managed_voltage_block_rejects_more_references_than_groups() -> None:
    document = ESPHomeConfigDocument.parse(
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "voltage_references:\n"
        "  first: 120\n"
        "  second: 120\n"
        "  third: 120\n"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    meter = topology_from_native("circuitsetup.6c-energy-meter")

    with pytest.raises(TopologyParseError, match="invalid managed"):
        voltage_reference_topology_from_config(
            document, meter, trusted_fingerprint="v1:" + "0" * 64
        )


@pytest.mark.parametrize("profile", ("three_phase", "custom"))
def test_electrical_profile_does_not_change_managed_topology_board_count(
    profile: str,
) -> None:
    document = ESPHomeConfigDocument.parse(
        "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter-1-addon\n"
        f"substitutions:\n  electrical_system: {profile}\n"
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "voltage_references:\n"
        "  phase_a: [main_1]\n"
        "  phase_b: [main_2]\n"
        "  phase_c: [addon1_1, addon1_2]\n"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    meter = topology_from_config(document)
    trusted = VoltageReferenceTopology(
        (
            ("phase_a", ("main_1",)),
            ("phase_b", ("main_2",)),
            ("phase_c", ("addon1_1", "addon1_2")),
        ),
        "helper",
    )

    voltage_reference_topology_from_config(
        document, meter, trusted_fingerprint=trusted.fingerprint
    )

    assert meter.board_count == 2


@pytest.mark.parametrize(
    "body",
    (
        "preamble: unsafe\nvoltage_references:\n  main: 120\n",
        "voltage_references:\nvoltage_references:\n  main: 120\n",
        "  voltage_references:\n  main: 120\n",
        "voltage_references: # ambiguous\n  main: 120\n",
    ),
    ids=("preamble", "duplicate-header", "indented-header", "inline-header-comment"),
)
def test_trusted_managed_voltage_block_rejects_ambiguous_envelope(body: str) -> None:
    document = ESPHomeConfigDocument.parse(
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        f"{body}"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    meter = topology_from_native("circuitsetup.6c-energy-meter")
    trusted = VoltageReferenceTopology(
        (("main", ("main_1", "main_2")),), "helper"
    )

    with pytest.raises(TopologyParseError):
        voltage_reference_topology_from_config(
            document, meter, trusted_fingerprint=trusted.fingerprint
        )


def test_trusted_managed_voltage_block_allows_comments_and_blanks_around_header() -> None:
    document = ESPHomeConfigDocument.parse(
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "\n"
        "# mapping follows\n"
        "voltage_references:\n"
        "\n"
        "  # primary reference\n"
        "  main: 120\n"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    meter = topology_from_native("circuitsetup.6c-energy-meter")
    trusted = VoltageReferenceTopology(
        (("main", ("main_1", "main_2")),), "helper"
    )

    assert voltage_reference_topology_from_config(
        document, meter, trusted_fingerprint=trusted.fingerprint
    ).fingerprint == trusted.fingerprint


@pytest.mark.parametrize(
    "reference_id",
    ("bad id", "1bad", "_bad", "bad.id", "x" * 65),
)
def test_helper_configuration_rejects_noncanonical_reference_id(
    reference_id: str,
) -> None:
    meter = topology_from_native("circuitsetup.6c-energy-meter")
    request = default_meter_configuration(
        meter, {"power_quality": (False,), "status_fields": (True,)}
    )
    reference = request.meter.voltage_references[0]
    object.__setattr__(
        request.meter,
        "voltage_references",
        (replace(reference, reference_id=reference_id),),
    )

    with pytest.raises(TopologyParseError, match="invalid helper"):
        voltage_reference_topology_from_configuration(meter, request)


def test_helper_configuration_must_cover_each_group_once() -> None:
    meter = topology_from_native("circuitsetup.6c-energy-meter")
    request = default_meter_configuration(
        meter, {"power_quality": (False,), "status_fields": (True,)}
    )
    reference = request.meter.voltage_references[0]
    object.__setattr__(request.meter, "voltage_references", (reference.__class__(
        reference.reference_id,
        reference.label,
        reference.phase_label,
        reference.nominal_voltage_v,
        reference.transformer_model_id,
        reference.gain_voltage,
        ("main_1", "main_1"),
    ),))

    with pytest.raises(ValueError, match="assigned exactly once"):
        voltage_reference_topology_from_configuration(meter, request)


def test_unknown_project_suffix_still_fails_closed_for_board_count() -> None:
    with pytest.raises(TopologyParseError):
        topology_from_native("circuitsetup.6c-energy-meter-1-addons-custom")


def test_voltage_reference_fingerprint_is_ordered_and_has_no_board_revision() -> None:
    meter = topology_from_native("circuitsetup.6c-energy-meter")
    request = default_meter_configuration(
        meter, {"power_quality": (False,), "status_fields": (True,)}
    )
    voltage = voltage_reference_topology_from_configuration(meter, request)

    assert voltage.fingerprint == voltage.fingerprint
    assert "board_revision" not in VoltageReferenceTopology.__slots__
