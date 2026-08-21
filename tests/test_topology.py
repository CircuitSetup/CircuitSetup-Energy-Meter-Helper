"""Tests for authoritative and provisional meter topology detection."""

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    ChannelAddress,
    MeterTopology,
    SetupState,
    TopologyEvidenceSource,
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
    with pytest.raises(TopologyParseError, match="1..6"):
        addon_count_from_packages((main, addon.format(7)))


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
