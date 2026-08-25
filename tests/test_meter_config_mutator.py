"""Tests for exact helper-managed meter configuration blocks."""

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_blocks import (
    render_aggregates,
    render_phase_overrides,
    render_voltage_references,
    replace_managed_block,
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


def test_inserts_absent_block_at_end_of_sensor_section() -> None:
    """A missing block must not be appended after an unrelated top-level section."""
    content = _content()

    actual = replace_managed_block(
        content, "voltage_references", "  - id: !extend meter_main1\n"
    )

    assert actual == content.replace(
        "logger:\n",
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "  - id: !extend meter_main1\n"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
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


def test_insertion_adds_missing_newline_at_sensor_eof() -> None:
    """The marker must never be joined to a final sensor body line."""
    content = "sensor:\n  - platform: uptime"

    actual = replace_managed_block(
        content, "aggregates", "  - id: total\n"
    )

    assert "uptime\n# csemh-owned-eof-separator: aggregates-v1:" in actual


@pytest.mark.parametrize("newline", ("\n", "\r\n"))
@pytest.mark.parametrize("suffix", ("", "{newline}", "{newline}{newline}"))
def test_aggregate_eof_round_trip_preserves_terminal_newlines(
    newline: str, suffix: str
) -> None:
    """Only an aggregate's owned EOF separator is removed on the way back."""
    suffix = suffix.format(newline=newline)
    content = "sensor:" + newline + "  - platform: uptime" + suffix

    added = replace_managed_block(content, "aggregates", "  - id: total\n")
    restored = replace_managed_block(added, "aggregates", "")

    assert restored == content
    assert (
        "# csemh-owned-eof-separator: aggregates-v1:" in added
    ) is (suffix == "")


def test_aggregate_eof_separator_rejects_malformed_metadata() -> None:
    """A copied or malformed ownership marker must not choose bytes to delete."""
    content = (
        "sensor:\n"
        "  - platform: uptime\n"
        "# csemh-owned-eof-separator: wrong\n"
        "# CircuitSetup Energy Meter Helper: aggregates v1\n"
        "  - id: total\n"
        "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
    )

    with pytest.raises(ConfigMutationError, match="EOF separator"):
        replace_managed_block(content, "aggregates", "")


def test_aggregate_eof_separator_rejects_copied_or_nonterminal_trailers() -> None:
    """A bound terminal trailer cannot be transplanted or followed by a root key."""
    source = "sensor:\n  - platform: uptime"
    added = replace_managed_block(source, "aggregates", "  - id: total\n")

    with pytest.raises(ConfigMutationError, match="EOF separator"):
        replace_managed_block(
            added.replace(source + "\n", source + "\n\n", 1), "aggregates", ""
        )
    with pytest.raises(ConfigMutationError, match="EOF separator"):
        replace_managed_block(added + "logger:\n  level: DEBUG\n", "aggregates", "")


def test_aggregate_eof_separator_rejects_tampered_prefix_or_digest() -> None:
    """Only the exact pre-trailer bytes authorize restoration without a newline."""
    source = "sensor:\n  - platform: uptime"
    added = replace_managed_block(source, "aggregates", "  - id: total\n")
    digest_start = added.index("aggregates-v1:") + len("aggregates-v1:")
    tampered_digest = (
        added[:digest_start]
        + ("0" if added[digest_start] != "0" else "1")
        + added[digest_start + 1 :]
    )

    for content in (added.replace("uptime", "changed", 1), tampered_digest):
        with pytest.raises(ConfigMutationError, match="EOF separator"):
            replace_managed_block(content, "aggregates", "")


def test_aggregate_eof_separator_requires_its_terminal_newline() -> None:
    """A metadata-backed trailer is writable only in the exact generated form."""
    added = replace_managed_block(
        "sensor:\n  - platform: uptime", "aggregates", "  - id: total\n"
    )

    with pytest.raises(ConfigMutationError, match="EOF separator"):
        replace_managed_block(added.rstrip("\n"), "aggregates", "")


def test_other_managed_blocks_stay_before_an_aggregate_eof_trailer() -> None:
    """Later insertions never split the aggregate's inseparable EOF ownership."""
    source = "sensor:\n  - platform: uptime"
    aggregates = replace_managed_block(source, "aggregates", "  - id: total\n")
    voltage = replace_managed_block(
        aggregates, "voltage_references", "  - id: voltage\n"
    )
    phase = replace_managed_block(voltage, "phase_overrides", "  - id: phase\n")
    updated = replace_managed_block(
        phase, "voltage_references", "  - id: voltage_updated\n"
    )

    assert updated.index("voltage references v1") < updated.index("phase overrides v1")
    assert updated.index("phase overrides v1") < updated.index(
        "csemh-owned-eof-separator"
    )
    assert updated.index("csemh-owned-eof-separator") < updated.index("aggregates v1")
    removed = replace_managed_block(updated, "aggregates", "")
    expected = replace_managed_block(source, "voltage_references", "  - id: voltage_updated\n")
    expected = replace_managed_block(expected, "phase_overrides", "  - id: phase\n")
    assert removed == expected
    assert "aggregates v1" not in removed
    assert "csemh-owned-eof-separator" not in removed
    assert "voltage_updated" in removed and "phase overrides v1" in removed
    replace_managed_block(removed, "phase_overrides", "")


def test_aggregate_mid_file_and_legacy_blocks_keep_existing_separator_behavior() -> None:
    """Root boundaries and older aggregate markers are never reinterpreted as EOF data."""
    content = _content()
    added = replace_managed_block(content, "aggregates", "  - id: total\n")
    assert replace_managed_block(added, "aggregates", "") == content

    legacy = "sensor:\n  - platform: uptime\n" + (
        "# CircuitSetup Energy Meter Helper: aggregates v1\n"
        "  - id: total\n"
        "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
    )
    assert replace_managed_block(legacy, "aggregates", "") == "sensor:\n  - platform: uptime\n"


@pytest.mark.parametrize("block_name", ("voltage_references", "phase_overrides"))
def test_nonaggregate_blocks_remain_idempotent(block_name: str) -> None:
    """The EOF ownership protocol is intentionally aggregate-only."""
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
