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


def test_extracts_indented_dashboard_import_url() -> None:
    content = """dashboard_import:
  package_import_url:
    github://owner/repo/device.yaml@master
  import_full_config: true
"""

    doc = ESPHomeConfigDocument.parse(content)

    assert doc.dashboard_import == "github://owner/repo/device.yaml@master"
    assert doc.dashboard_import_span is not None
    assert doc.dashboard_import_span.line == 3


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


def test_extracts_bounded_meter_substitutions_and_managed_blocks() -> None:
    content = fixture("meter_configuration.yaml").replace("\n", "\r\n")
    doc = ESPHomeConfigDocument.parse(content)

    assert {
        key: doc.substitutions[key].value
        for key in (
            "friendly_name",
            "update_time",
            "electric_freq",
            "csemh_config_contract",
        )
    } == {
        "friendly_name": "Garage Meter",
        "update_time": "10s",
        "electric_freq": "60Hz",
        "csemh_config_contract": "2",
    }
    friendly = doc.substitutions["friendly_name"]
    assert content[friendly.span.start : friendly.span.end] == '"Garage Meter"'
    assert tuple(doc.managed_blocks) == (
        "voltage_references",
        "phase_overrides",
        "aggregates",
    )
    block = doc.managed_blocks["voltage_references"]
    assert content[block.span.start : block.span.end] == block.content
    assert block.content.startswith(
        "# CircuitSetup Energy Meter Helper: voltage references v1\r\n"
    )
    assert block.content.endswith(
        "# End CircuitSetup Energy Meter Helper: voltage references v1"
    )


def test_friendly_name_only_comes_from_substitutions() -> None:
    doc = ESPHomeConfigDocument.parse(
        "esphome:\n  name: unrelated-device-name\nsubstitutions:\n  update_time: 5s\n"
    )

    assert "friendly_name" not in doc.substitutions
    assert doc.substitutions["update_time"].value == "5s"


@pytest.mark.parametrize("key", ("friendly_name", "update_time", "electric_freq", "csemh_config_contract"))
def test_rejects_duplicate_meter_substitutions(key: str) -> None:
    value = {
        "friendly_name": "Meter",
        "update_time": "2s",
        "electric_freq": "60Hz",
        "csemh_config_contract": "2",
    }[key]
    content = f"substitutions:\n  {key}: {value}\n  {key}: {value}\n"

    with pytest.raises(ESPHomeConfigParseError, match="line 3"):
        ESPHomeConfigDocument.parse(content)


@pytest.mark.parametrize("value", ("!secret meter", "&meter value", "*meter"))
def test_rejects_unsafe_meter_substitution_values(value: str) -> None:
    content = f"substitutions:\n  friendly_name: {value}\n"

    with pytest.raises(ESPHomeConfigParseError, match="line 2"):
        ESPHomeConfigDocument.parse(content)


@pytest.mark.parametrize(
    "key, value",
    (
        ("friendly_name", "x" * 65),
        ("friendly_name", '"bad\\u0000name"'),
        ("update_time", "7s"),
        ("electric_freq", "55Hz"),
        ("csemh_config_contract", "3"),
    ),
)
def test_rejects_unbounded_or_unsupported_meter_values(key: str, value: str) -> None:
    with pytest.raises(ESPHomeConfigParseError, match="line 2"):
        ESPHomeConfigDocument.parse(f"substitutions:\n  {key}: {value}\n")


@pytest.mark.parametrize(
    "content, line",
    (
        (
            "# End CircuitSetup Energy Meter Helper: aggregates v1\n",
            1,
        ),
        (
            (
                "# CircuitSetup Energy Meter Helper: aggregates v1\n"
                "# CircuitSetup Energy Meter Helper: aggregates v1\n"
            ),
            2,
        ),
        (
            (
                "# CircuitSetup Energy Meter Helper: aggregates v1\n"
                "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
                "# CircuitSetup Energy Meter Helper: aggregates v1\n"
            ),
            3,
        ),
        (
            (
                "# CircuitSetup Energy Meter Helper: aggregates v1\n"
                "# CircuitSetup Energy Meter Helper: phase overrides v1\n"
            ),
            2,
        ),
        ("# CircuitSetup Energy Meter Helper: aggregates v1\n", 1),
        (
            (
                "# CircuitSetup Energy Meter Helper: aggregates v1\n"
                "# End CircuitSetup Energy Meter Helper: phase overrides v1\n"
            ),
            2,
        ),
    ),
)
def test_rejects_malformed_managed_blocks(
    content: str, line: int
) -> None:
    with pytest.raises(ESPHomeConfigParseError, match=rf"line {line}"):
        ESPHomeConfigDocument.parse(content)


def test_ignores_marker_like_text_outside_exact_column_zero_comments() -> None:
    doc = ESPHomeConfigDocument.parse(
        "substitutions:\n"
        '  friendly_name: "# CircuitSetup Energy Meter Helper: aggregates v1"\n'
        "  literal: |\n"
        "    # CircuitSetup Energy Meter Helper: aggregates v1\n"
        "  # CircuitSetup Energy Meter Helper: aggregates v1\n"
        "  note: value # End CircuitSetup Energy Meter Helper: aggregates v1\n"
    )

    assert doc.managed_blocks == {}


@pytest.mark.parametrize(
    "content",
    (
        'opaque: "unterminated\nsubstitutions:\n  friendly_name: Spoofed\n',
        "opaque: 'unterminated\nsubstitutions:\n  friendly_name: Spoofed\n",
        'opaque: "escaped \\"\nsubstitutions:\n  friendly_name: Spoofed\n',
        (
            'opaque: "unterminated\n'
            "# CircuitSetup Energy Meter Helper: aggregates v1\n"
        ),
    ),
)
def test_rejects_multiline_quoted_scalars_before_structural_scanning(
    content: str,
) -> None:
    with pytest.raises(ESPHomeConfigParseError, match="line 1"):
        ESPHomeConfigDocument.parse(content)


def test_normalizes_quoted_structural_keys() -> None:
    doc = ESPHomeConfigDocument.parse(
        '"substitutions":\n'
        '  "friendly_name": Meter\n'
        '  "update_time": 10s\n'
        '  "electric\\u005ffreq": 60Hz\n'
        '  \'csemh_config_contract\': 2\n'
        '  "ct\\u0031_name": Main CT\n'
    )

    assert {
        key: doc.substitutions[key].value
        for key in (
            "friendly_name",
            "update_time",
            "electric_freq",
            "csemh_config_contract",
            "ct1_name",
        )
    } == {
        "friendly_name": "Meter",
        "update_time": "10s",
        "electric_freq": "60Hz",
        "csemh_config_contract": "2",
        "ct1_name": "Main CT",
    }


@pytest.mark.parametrize(
    "content, line",
    (
        (
            'substitutions:\n  friendly_name: Meter\n  "friendly_name": Meter\n',
            3,
        ),
        ('"substitutions":\nsubstitutions:\n', 2),
    ),
)
def test_rejects_mixed_quoted_structural_key_duplicates(
    content: str, line: int
) -> None:
    with pytest.raises(ESPHomeConfigParseError, match=rf"line {line}"):
        ESPHomeConfigDocument.parse(content)


@pytest.mark.parametrize("separator", ("\x85", "\u2028"))
def test_rejects_all_python_splitline_separators_before_materializing(
    separator: str,
) -> None:
    with pytest.raises(ESPHomeConfigParseError, match="line 1"):
        ESPHomeConfigDocument.parse(separator * 10_001)


def test_rejects_raw_unpaired_surrogates() -> None:
    with pytest.raises(ESPHomeConfigParseError, match="line 1"):
        ESPHomeConfigDocument.parse("substitutions:\n  friendly_name: \ud800\n")


def test_rejects_decoded_unpaired_surrogates() -> None:
    with pytest.raises(ESPHomeConfigParseError, match="line 2"):
        ESPHomeConfigDocument.parse('substitutions:\n  friendly_name: "\\ud800"\n')


@pytest.mark.parametrize(
    "prefix",
    (
        "{quote}unterminated",
        "- {quote}unterminated",
        "opaque: [{quote}unterminated",
        "opaque: !str {quote}unterminated",
        "opaque: &opaque {quote}unterminated",
    ),
)
@pytest.mark.parametrize("quote", ("\"", "'"))
@pytest.mark.parametrize(
    "suffix",
    (
        "substitutions:\n  friendly_name: Spoofed\n",
        "# CircuitSetup Energy Meter Helper: aggregates v1\n",
    ),
)
def test_rejects_multiline_quotes_from_all_scalar_contexts(
    prefix: str, quote: str, suffix: str
) -> None:
    with pytest.raises(ESPHomeConfigParseError, match="line 1"):
        ESPHomeConfigDocument.parse(prefix.format(quote=quote) + "\n" + suffix)


def test_ignores_quotes_and_markers_inside_valid_block_scalars() -> None:
    doc = ESPHomeConfigDocument.parse(
        "notes: |-\n"
        '  an unmatched " quote\n'
        "  substitutions:\n"
        "  # CircuitSetup Energy Meter Helper: aggregates v1\n"
        "substitutions:\n"
        "  friendly_name: Meter\n"
    )

    assert doc.substitutions["friendly_name"].value == "Meter"
    assert doc.managed_blocks == {}


@pytest.mark.parametrize(
    "content, line",
    (
        ("substitutions :\n  friendly_name : Meter\n  \"friendly_name\" : Meter\n", 3),
        ("? substitutions\n: {}\n", 1),
        ("!str substitutions: {}\n", 1),
        ("&saved substitutions: {}\n", 1),
        ("substitutions:\n  ? friendly_name\n  : Meter\n", 2),
        ("substitutions:\n  !str friendly_name: Meter\n", 2),
        ("substitutions:\n  &saved friendly_name: Meter\n", 2),
        ("<<: *defaults\n", 1),
        ("substitutions:\n  <<: *defaults\n", 2),
        ("substitutions:\n  !!merge '<<': *defaults\n", 2),
        ("{substitutions: {friendly_name: Meter}}\n", 1),
    ),
)
def test_rejects_yaml_equivalent_structural_key_syntax(
    content: str, line: int
) -> None:
    with pytest.raises(ESPHomeConfigParseError, match=rf"line {line}"):
        ESPHomeConfigDocument.parse(content)


def test_allows_unrelated_value_tags_outside_managed_surface() -> None:
    doc = ESPHomeConfigDocument.parse(
        "other: !include other.yaml\nsubstitutions:\n  friendly_name: Meter\n"
    )

    assert doc.substitutions["friendly_name"].value == "Meter"


@pytest.mark.parametrize(
    "content, line",
    (
        ('substitutions:\n  ct1_name: "\\ud800"\n', 2),
        ('substitutions:\n  current_cal_ct1: "\\ud800"\n', 2),
        ('substitutions:\n  main_meter_name1: "\\ud800"\n', 2),
        ('substitutions:\n  main_meter_id1: "\\ud800"\n', 2),
        ('esphome:\n  project:\n    name: "\\ud800"\n', 3),
        ('dashboard_import:\n  package_import_url: "\\ud800"\n', 2),
        ('packages:\n  - file: "\\ud800"\n', 2),
    ),
)
def test_rejects_decoded_surrogates_from_all_scalar_consumers(
    content: str, line: int
) -> None:
    with pytest.raises(ESPHomeConfigParseError, match=rf"line {line}"):
        ESPHomeConfigDocument.parse(content)


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


def test_only_direct_owned_keys_are_extracted() -> None:
    content = """substitutions:
  metadata:
    ct1_name: nested
esphome:
  project:
    metadata:
      name: circuitsetup.wrong
    name: circuitsetup.correct
dashboard_import:
  metadata:
    package_import_url: github://wrong.yaml
  package_import_url: github://correct.yaml
"""

    doc = ESPHomeConfigDocument.parse(content)

    assert doc.substitutions == {}
    assert doc.project_name == "circuitsetup.correct"
    assert doc.dashboard_import == "github://correct.yaml"


@pytest.mark.parametrize(
    ("content", "line"),
    (
        ("esphome:\n  project:\n    name: one\n  project:\n    name: two\n", 4),
        ("esphome:\n  project:\n    name: one\n    name: two\n", 4),
        (
            "dashboard_import:\n  package_import_url: one\n  package_import_url: two\n",
            3,
        ),
    ),
)
def test_rejects_duplicate_owned_project_and_import_keys(
    content: str, line: int
) -> None:
    with pytest.raises(ESPHomeConfigParseError, match=rf"line {line}"):
        ESPHomeConfigDocument.parse(content)


@pytest.mark.parametrize(
    ("content", "line"),
    (
        ("substitutions: !include substitutions.yaml\n", 1),
        ("substitutions:\n  <<: *defaults\n", 2),
    ),
)
def test_rejects_nonlocal_substitution_sources(content: str, line: int) -> None:
    with pytest.raises(ESPHomeConfigParseError, match=rf"line {line}"):
        ESPHomeConfigDocument.parse(content)
