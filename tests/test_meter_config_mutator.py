"""Tests for exact helper-managed meter configuration blocks."""

from itertools import permutations

import pytest
import yaml

from custom_components.circuitsetup_energy_meter_helper.config_blocks import (
    render_aggregates,
    render_phase_overrides,
    render_voltage_references,
    replace_managed_block,
)
from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
    ESPHomeConfigParseError,
)
from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
    ConfigMutationError,
)


def _content(newline: str = "\n") -> str:
    return newline.join(
        (
            "substitutions:",
            "  friendly_name: Meter",
            "sensor:",
            "  # retain this comment exactly",
            "  - platform: uptime",
            "    name: Uptime",
            "logger:",
            "  level: DEBUG",
            "",
        )
    )


def test_inserts_absent_block_at_start_of_sensor_section() -> None:
    """A missing block stays ahead of user-owned sensor content."""
    content = _content()

    actual = replace_managed_block(
        content, "voltage_references", "  - id: !extend meter_main1\n"
    )

    assert actual == content.replace(
        "  # retain this comment exactly\n",
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "  - id: !extend meter_main1\n"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
        "  # retain this comment exactly\n",
    )


def test_status_blocks_keep_their_existing_sensor_end_placement() -> None:
    """The separate status path is not folded into the helper cluster."""
    content = _content()

    actual = replace_managed_block(content, "status_overrides", "  - id: status\n")

    assert actual == content.replace(
        "logger:\n",
        "# CircuitSetup Energy Meter Helper: status overrides v1\n"
        "  - id: status\n"
        "# End CircuitSetup Energy Meter Helper: status overrides v1\n"
        "logger:\n",
    )


@pytest.mark.parametrize("sensor_key", ("sensor", '"sensor"', "sensor "))
def test_insertion_uses_parser_owned_sensor_bounds(sensor_key: str) -> None:
    """Quoted and spaced root keys must not hide the following root section."""
    content = (
        f"{sensor_key}:\n"
        "  - platform: uptime\n"
        "\n"
        "# retain this root comment\n"
        '"logger":\n'
        "  level: DEBUG\n"
    )

    actual = replace_managed_block(
        content, "voltage_references", "  - id: !extend meter_main1\n"
    )

    assert actual.index("voltage references v1") < actual.index('"logger":')
    assert "\n\n# retain this root comment\n" in actual


@pytest.mark.parametrize("newline", ("\n", "\r\n"))
def test_no_final_newline_aggregate_round_trip_is_exact(newline: str) -> None:
    """Header insertion leaves newline-less Contract-2 sources byte-exact on removal."""
    content = "sensor:" + newline + "  - platform: uptime"

    added = replace_managed_block(content, "aggregates", "  - id: total\n")

    assert "csemh-owned-eof-separator" not in added
    assert added.index("aggregates v1") < added.index("- platform: uptime")
    assert replace_managed_block(added, "aggregates", "") == content


def test_former_eof_separator_is_an_ordinary_user_comment() -> None:
    """Old ownership-looking comments have no mutation semantics."""
    content = (
        "sensor:\n"
        "  # csemh-owned-eof-separator: aggregates-v1: copied\n"
        "  - platform: uptime\n"
    )

    added = replace_managed_block(content, "aggregates", "  - id: total\n")

    assert replace_managed_block(added, "aggregates", "") == content


def test_empty_newline_less_sensor_fails_with_a_manual_snippet() -> None:
    """An empty final sensor header cannot be changed reversibly without metadata."""
    with pytest.raises(ConfigMutationError, match="document root") as error:
        replace_managed_block("sensor:", "aggregates", "  - id: total\n")

    assert error.value.snippet is not None


@pytest.mark.parametrize("newline", ("\n", "\r\n"))
@pytest.mark.parametrize(
    ("predecessor", "successor"),
    (
        ("voltage_references", "phase_overrides"),
        ("voltage_references", "aggregates"),
        ("phase_overrides", "aggregates"),
    ),
)
def test_new_block_after_newline_less_legacy_marker_fails_safely(
    newline: str, predecessor: str, successor: str
) -> None:
    """A new marker never glues itself to an unowned legacy EOF marker."""
    start, end = {
        name: (
            f"# CircuitSetup Energy Meter Helper: {name.replace('_', ' ')} v1",
            f"# End CircuitSetup Energy Meter Helper: {name.replace('_', ' ')} v1",
        )
        for name in ("voltage_references", "phase_overrides")
    }[predecessor]
    content = newline.join(("sensor:", start, "  - id: legacy", end))

    with pytest.raises(ConfigMutationError, match="document root") as error:
        replace_managed_block(content, successor, "  - id: new\n")

    assert error.value.snippet is not None
    assert content.endswith(end)


@pytest.mark.parametrize("newline", ("\n", "\r\n"))
def test_new_block_after_terminated_legacy_marker_is_valid(newline: str) -> None:
    """An existing line boundary keeps legacy blocks writable without normalization."""
    content = newline.join(
        (
            "sensor:",
            "# CircuitSetup Energy Meter Helper: voltage references v1",
            "  - id: legacy",
            "# End CircuitSetup Energy Meter Helper: voltage references v1",
            "",
        )
    )

    actual = replace_managed_block(content, "phase_overrides", "  - id: phase\n")

    assert (
        "v1" + newline + "# CircuitSetup Energy Meter Helper: phase overrides v1"
    ) in actual


@pytest.mark.parametrize("newline", ("\n", "\r\n"))
@pytest.mark.parametrize("final_newline", (False, True))
def test_indentless_sensor_sequence_uses_indentless_helper_items(
    newline: str, final_newline: bool
) -> None:
    """Official root-level sensor sequences retain their one unambiguous style."""
    content = (
        "sensor:"
        + newline
        + "- platform: uptime"
        + newline
        + "  name: Uptime"
        + newline
        + "logger:"
        + newline
        + "  level: DEBUG"
        + (newline if final_newline else "")
    )

    document = ESPHomeConfigDocument.parse(content)
    actual = replace_managed_block(content, "aggregates", "  - id: total\n    name: Total\n")

    assert document.sensor_item_indent == 0
    assert "\n- id: total" in actual
    assert "\n  - id: total" not in actual
    assert yaml.safe_load(actual)["sensor"][0]["id"] == "total"
    assert replace_managed_block(actual, "aggregates", "") == content


@pytest.mark.parametrize(
    "content",
    (
        "sensor:\n- platform: uptime\n  - platform: template\n",
        "sensor:\n- platform: uptime\n? logger\n: {}\n",
        "sensor:\n- !tag platform: uptime\n",
    ),
)
def test_indentless_sensor_sequence_rejects_mixed_or_ambiguous_forms(content: str) -> None:
    """Only a plain, single-style sensor list is writable."""
    assert ESPHomeConfigDocument.parse(content).writable_sensor_span is None


@pytest.mark.parametrize("indent", ("", "  "))
@pytest.mark.parametrize(
    "entry",
    (
        "- {platform: uptime}",
        "- [x]",
        "- !tag platform: uptime",
        "- platform: !tag uptime",
        "- *anchor",
        "- &anchor platform: uptime",
        "? platform: uptime",
        "- <<: {platform: uptime}",
        '- "platform": uptime',
        "- uptime",
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
def test_sensor_sequence_rejects_unsupported_top_level_forms(
    indent: str, entry: str
) -> None:
    """Only ordinary platform/id mapping entries define a writable sensor style."""
    content = "sensor:\n" + indent + entry + "\n"

    try:
        document = ESPHomeConfigDocument.parse(content)
    except ESPHomeConfigParseError:
        return
    assert document.writable_sensor_span is None


@pytest.mark.parametrize("indent", ("", "  "))
@pytest.mark.parametrize(
    "entry",
    ("- platform: uptime", '- platform: "uptime"', "- id: !extend meter_main1"),
)
def test_sensor_sequence_accepts_plain_scalar_mapping_entries(
    indent: str, entry: str
) -> None:
    """Ordinary scalar values and helper extensions remain writable."""
    document = ESPHomeConfigDocument.parse("sensor:\n" + indent + entry + "\n")

    assert document.writable_sensor_span is not None
    assert document.sensor_item_indent == len(indent)
@pytest.mark.parametrize(
    "order",
    tuple(permutations(("voltage_references", "phase_overrides", "aggregates"))),
)
@pytest.mark.parametrize("indentless", (False, True))
def test_new_managed_blocks_cluster_before_user_sensor_content(
    order: tuple[str, ...], indentless: bool
) -> None:
    """Any insertion order creates one canonical helper cluster at the section start."""
    content = (
        "sensor:\n# user comment\n- platform: uptime\n"
        if indentless
        else "sensor:\n  # user comment\n  - platform: uptime\n"
    )
    rendered = {
        "voltage_references": "  - id: voltage\n",
        "phase_overrides": "  - id: phase\n",
        "aggregates": "  - id: total\n",
    }
    actual = content
    for name in order:
        actual = replace_managed_block(actual, name, rendered[name])

    assert actual.index("voltage references v1") < actual.index("phase overrides v1")
    assert actual.index("phase overrides v1") < actual.index("aggregates v1")
    assert actual.index("aggregates v1") < actual.index("# user comment")
    assert ("\n- id: voltage" in actual) is indentless
    for name in reversed(order):
        actual = replace_managed_block(actual, name, "")
    assert actual == content


def test_aggregate_mid_file_and_legacy_blocks_remain_usable() -> None:
    """Existing end-of-section helper blocks are replaced and removed in place."""
    content = _content()
    added = replace_managed_block(content, "aggregates", "  - id: total\n")
    assert replace_managed_block(added, "aggregates", "") == content

    source = "sensor:\n  - platform: uptime\n"
    legacy = source + (
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "  - id: voltage\n"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )
    updated = replace_managed_block(
        legacy, "voltage_references", "  - id: voltage_updated\n"
    )
    added = replace_managed_block(updated, "aggregates", "  - id: total\n")
    assert added.index("voltage references v1") < added.index("aggregates v1")
    assert replace_managed_block(added, "aggregates", "") == updated
    assert replace_managed_block(updated, "voltage_references", "") == source


@pytest.mark.parametrize("block_name", ("voltage_references", "phase_overrides"))
def test_nonaggregate_blocks_remain_idempotent(block_name: str) -> None:
    """Nonaggregate blocks use the same structural insertion rule."""
    content = _content()
    first = replace_managed_block(content, block_name, "  - id: total\n")

    assert replace_managed_block(first, block_name, "  - id: total\n") == first
    assert "csemh-owned-eof-separator" not in first


@pytest.mark.parametrize(
    "later_root",
    (
        "? logger\n: {}\n",
        "!tag logger: {}\n",
        "&saved logger: {}\n",
        "{logger: {level: DEBUG}}\n",
    ),
)
def test_insertion_fails_closed_on_unsupported_root_key_syntax(
    later_root: str,
) -> None:
    """A valid but unsupported root spelling cannot be mistaken for sensor content."""
    with pytest.raises(ConfigMutationError, match="sensor"):
        replace_managed_block(
            "sensor:\n  - platform: uptime\n" + later_root,
            "aggregates",
            "  - id: total\n",
        )

def test_replaces_exactly_one_existing_block_without_touching_yaml() -> None:
    """The managed span, rather than matching YAML-looking text, is replaced."""
    content = _content().replace(
        "logger:\n",
        "# CircuitSetup Energy Meter Helper: phase overrides v1\n"
        "  - id: old\n"
        "# End CircuitSetup Energy Meter Helper: phase overrides v1\n"
        "logger:\n",
    )

    actual = replace_managed_block(
        content, "phase_overrides", "  - id: new\n"
    )

    assert actual == content.replace("  - id: old\n", "  - id: new\n")
    assert "  # retain this comment exactly\n" in actual


def test_removes_empty_block_and_preserves_crlf() -> None:
    """Removing a managed block keeps every remaining CRLF byte unchanged."""
    content = _content("\r\n").replace(
        "logger:\r\n",
        "# CircuitSetup Energy Meter Helper: aggregates v1\r\n"
        "  - id: total\r\n"
        "# End CircuitSetup Energy Meter Helper: aggregates v1\r\n"
        "logger:\r\n",
    )

    actual = replace_managed_block(content, "aggregates", "")

    assert actual == _content("\r\n")
    assert "\r\n" in actual and "\n" not in actual.replace("\r\n", "")


@pytest.mark.parametrize(
    "content",
    (
        _content().replace(
            "logger:\n",
            "# CircuitSetup Energy Meter Helper: aggregates v1\n"
            "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
            "# CircuitSetup Energy Meter Helper: aggregates v1\n"
            "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
            "logger:\n",
        ),
        _content().replace(
            "logger:\n",
            "# CircuitSetup Energy Meter Helper: aggregates v1\n"
            "# CircuitSetup Energy Meter Helper: phase overrides v1\n"
            "# End CircuitSetup Energy Meter Helper: phase overrides v1\n"
            "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
            "logger:\n",
        ),
    ),
)
def test_rejects_duplicate_or_overlapping_markers(content: str) -> None:
    """Ambiguous helper ownership is never guessed at."""
    with pytest.raises(ConfigMutationError, match="managed block"):
        replace_managed_block(content, "aggregates", "  - id: total\n")


@pytest.mark.parametrize("rendered", ("", "  - id: replacement\n"))
def test_replacement_and_removal_reject_sibling_outside_sensor(
    rendered: str,
) -> None:
    """A valid target does not excuse an invalid sibling managed block."""
    content = _content().replace(
        "logger:\n",
        "# CircuitSetup Energy Meter Helper: phase overrides v1\n"
        "  - id: phase\n"
        "# End CircuitSetup Energy Meter Helper: phase overrides v1\n"
        "logger:\n",
    ) + (
        "# CircuitSetup Energy Meter Helper: aggregates v1\n"
        "  - id: total\n"
        "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
    )

    with pytest.raises(ConfigMutationError, match="outside the sensor"):
        replace_managed_block(content, "phase_overrides", rendered)


@pytest.mark.parametrize("rendered", ("", "  - id: replacement\n"))
def test_replacement_and_removal_reject_misordered_siblings(rendered: str) -> None:
    """All owned blocks must retain their canonical order before any edit."""
    content = _content().replace(
        "logger:\n",
        "# CircuitSetup Energy Meter Helper: phase overrides v1\n"
        "  - id: phase\n"
        "# End CircuitSetup Energy Meter Helper: phase overrides v1\n"
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "  - id: voltage\n"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
        "logger:\n",
    )

    with pytest.raises(ConfigMutationError, match="order"):
        replace_managed_block(content, "aggregates", rendered)


def test_renderers_are_deterministic_and_keep_block_order() -> None:
    """Mapping insertion order cannot change reviewable managed output."""
    entries_a = {"beta": "  - id: beta\n", "alpha": "  - id: alpha\n"}
    entries_b = {"alpha": "  - id: alpha\n", "beta": "  - id: beta\n"}

    assert render_voltage_references(entries_a) == render_voltage_references(entries_b)
    assert render_phase_overrides(entries_a) == render_phase_overrides(entries_b)
    assert render_aggregates(entries_a) == render_aggregates(entries_b)
    content = replace_managed_block(
        replace_managed_block(
            _content(), "aggregates", render_aggregates(entries_a)
        ),
        "phase_overrides",
        render_phase_overrides(entries_a),
    )
    assert content.index("phase overrides") < content.index("aggregates")


@pytest.mark.parametrize(
    "rendered",
    (
        "logger:\n",
        "  %YAML 1.2\n",
        "  ---\n",
        "  ...\n",
        "\t- id: total\n",
        "   - id: total\n",
        "  ? explicit\n",
        "  - id: total\u2028logger:\n",
        "  # CircuitSetup Energy Meter Helper: aggregate v1\n",
    ),
)
def test_rejects_rendered_text_that_is_not_a_deterministic_sensor_body(
    rendered: str,
) -> None:
    """Raw renderer text cannot escape or ambiguously alter the owned sensor block."""
    with pytest.raises(ConfigMutationError, match="body"):
        render_aggregates({"total": rendered})
    with pytest.raises(ConfigMutationError, match="body"):
        replace_managed_block(_content(), "aggregates", rendered)


def test_renderers_allow_nested_body_lines_and_real_blank_lines() -> None:
    """Future typed renderers retain deterministic nested YAML and blank separation."""
    rendered = "  - id: total\n    name: Total\n\n  - id: daily\n"

    assert render_aggregates({"totals": rendered}) == rendered


def test_refuses_block_insertion_without_a_safe_sensor_section() -> None:
    """Without a top-level sensor section the caller gets a manual YAML snippet."""
    with pytest.raises(ConfigMutationError, match="sensor") as error:
        replace_managed_block("logger:\n  level: DEBUG\n", "aggregates", "  - id: total\n")

    assert error.value.snippet == (
        "sensor:\n"
        "# CircuitSetup Energy Meter Helper: aggregates v1\n"
        "  - id: total\n"
        "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
    )


def test_manual_snippet_is_secret_free_and_reusable_without_duplication() -> None:
    """The fallback can be pasted at document root and then managed normally."""
    content = "api:\n  password: top-secret\nlogger:\n  level: DEBUG\n"
    rendered = "  - id: total\n\n    name: Total\n"

    with pytest.raises(ConfigMutationError, match="document root") as error:
        replace_managed_block(content, "aggregates", rendered)

    snippet = error.value.snippet
    assert snippet is not None
    assert "top-secret" not in snippet
    assert snippet.count("CircuitSetup Energy Meter Helper") == 2
    pasted = content + snippet
    replaced = replace_managed_block(pasted, "aggregates", "  - id: new_total\n")
    assert replaced.count("CircuitSetup Energy Meter Helper: aggregates v1") == 2
    assert "new_total" in replaced and "id: total" not in replaced
