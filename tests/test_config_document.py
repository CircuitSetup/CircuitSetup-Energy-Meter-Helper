"""Tests for line-preserving ESPHome configuration parsing."""

from pathlib import Path

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
    ESPHomeConfigParseError,
)

FIXTURES = Path(__file__).parent / "fixtures" / "device_builder"


def fixture(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def test_extracts_project_substitutions_and_mapping_packages() -> None:
    content = fixture("one_addon.yaml")
    doc = ESPHomeConfigDocument.parse(content)

    assert doc.project_name == "circuitsetup.6c-energy-meter-1-addon"
    assert doc.substitutions["ct12_name"].value == "CT12"
    assert doc.substitutions["current_cal_ct12"].value == "27518"
    assert "Software/ESPHome/meter_sensors/6chan_addon1.yaml" in doc.package_files
    assert doc.dashboard_import is not None
    assert doc.dashboard_import.endswith("6-channel-energy-meter-1-addon.yaml@master")

    scalar = doc.substitutions["ct12_name"]
    assert scalar.span.line == 4
    assert content[scalar.span.start : scalar.span.end] == '"CT12"'
    assert doc.project_name_span is not None
    assert content[doc.project_name_span.start : doc.project_name_span.end] == (
        "circuitsetup.6c-energy-meter-1-addon"
    )
    assert doc.dashboard_import_span is not None
    assert content[
        doc.dashboard_import_span.start : doc.dashboard_import_span.end
    ].startswith("github://")


def test_extracts_list_package_form() -> None:
    doc = ESPHomeConfigDocument.parse(fixture("three_addons_two_voltages.yaml"))

    assert doc.package_files == (
        "Software/ESPHome/meter_sensors/main.yaml",
        "Software/ESPHome/meter_sensors/6chan_addon1.yaml",
        "Software/ESPHome/meter_sensors/6chan_addon2.yaml",
        "Software/ESPHome/meter_sensors/6chan_addon3.yaml",
    )
    assert doc.substitutions["ct24_name"].value == "Workshop #4"


def test_normalizes_remote_paths_and_ignores_out_of_range_ct_keys() -> None:
    doc = ESPHomeConfigDocument.parse(fixture("custom_packages.yaml"))

    assert doc.package_files == (
        "Software/ESPHome/meter_sensors/main.yaml",
        "Software/ESPHome/meter_sensors/6chan_addon1.yaml",
    )
    assert set(doc.substitutions) == {"ct42_name", "current_cal_ct42"}


def test_noop_preserves_every_byte() -> None:
    content = fixture("main.yaml").replace("\n", "\r\n")
    doc = ESPHomeConfigDocument.parse(content)

    assert doc.content == content
    assert "".join(doc.lines) == content
    assert doc.substitutions["ct1_name"].value == "Main CT 1"
    assert "wifi_password" not in repr(doc)


@pytest.mark.parametrize(
    "value",
    ("&gain 27518", "*gain", "|", ">-", "!secret ct_gain", "# no value"),
)
def test_rejects_unsafe_mutable_ct_scalars_with_line_number(value: str) -> None:
    content = f"substitutions:\n  current_cal_ct1: {value}\n"

    with pytest.raises(ESPHomeConfigParseError, match="line 2") as error:
        ESPHomeConfigDocument.parse(content)

    assert error.value.line == 2


def test_rejects_duplicate_mutable_substitutions() -> None:
    content = "substitutions:\n  ct1_name: first\n  ct1_name: second\n"

    with pytest.raises(ESPHomeConfigParseError, match="line 3"):
        ESPHomeConfigDocument.parse(content)
