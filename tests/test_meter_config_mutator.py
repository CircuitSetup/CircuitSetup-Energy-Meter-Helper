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


def test_refuses_block_insertion_without_a_safe_sensor_section() -> None:
    """Without a top-level sensor section the caller gets a manual YAML snippet."""
    with pytest.raises(ConfigMutationError, match="sensor") as error:
        replace_managed_block("logger:\n  level: DEBUG\n", "aggregates", "  - id: total\n")

    assert error.value.snippet == "sensor:\n  # CircuitSetup Energy Meter Helper: aggregates v1\n  - id: total\n  # End CircuitSetup Energy Meter Helper: aggregates v1\n"
