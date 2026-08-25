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

    assert "uptime\n# CircuitSetup" in actual


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
