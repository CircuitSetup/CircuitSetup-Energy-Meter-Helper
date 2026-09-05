"""Effective voltage-gain inheritance and compact owned overrides."""

from __future__ import annotations

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology
from custom_components.circuitsetup_energy_meter_helper.voltage_gains import (
    apply_voltage_gain_changes,
    effective_voltage_gains,
)


def _topology(addons: int = 0) -> MeterTopology:
    return MeterTopology.from_addon_count(
        addons,
        connection_type="wifi",
        voltage_layout="standard",
        project_name=(
            "circuitsetup.6c-energy-meter"
            + (f"-{addons}-addon" if addons else "")
        ),
        evidence=(),
    )


def _stock(*, sensor_indent: int = 2) -> str:
    sensor = "sensor:\n" if sensor_indent == 2 else "sensor:\n- platform: template\n"
    return (
        "esphome:\n"
        "  project:\n"
        "    name: circuitsetup.6c-energy-meter\n"
        "substitutions:\n"
        "  voltage_cal1: '7305'\n"
        "  voltage_cal2: '7310'\n"
        + sensor
    )


def _legacy_block(first: tuple[int, int, int], second: tuple[int, int, int]) -> str:
    items = []
    for instance, gains in (("meter_main1", first), ("meter_main2", second)):
        items.append(f"  - id: !extend {instance}\n")
        for phase, gain in zip("abc", gains, strict=True):
            items.extend(
                (
                    f"    phase_{phase}:\n",
                    f"      gain_voltage: {gain}\n",
                    "      voltage:\n",
                    "        disabled_by_default: true\n",
                )
            )
    return (
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        + "".join(items)
        + "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
    )


def _calibration_block(body: str) -> str:
    return (
        "# CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
        + body
        + "# End CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
    )


def _effective(content: str, addons: int = 0) -> dict[str, tuple[int, int, int]]:
    return effective_voltage_gains(ESPHomeConfigDocument.parse(content), _topology(addons))


def test_reads_stock_substitutions_and_sparse_calibration_exceptions() -> None:
    content = _stock() + _calibration_block(
        "  - id: !extend meter_main1\n"
        "    phase_b:\n"
        "      gain_voltage: 7402\n"
    )

    assert _effective(content) == {
        "meter_main1": (7305, 7402, 7305),
        "meter_main2": (7310, 7310, 7310),
    }


def test_calibration_precedence_masks_legacy_reference_gain() -> None:
    content = _stock() + _legacy_block((7401, 7402, 7403), (7501, 7502, 7503))
    content += _calibration_block(
        "  - id: !extend meter_main1\n"
        "    phase_b:\n"
        "      gain_voltage: 7602\n"
    )

    assert _effective(content)["meter_main1"] == (7401, 7602, 7403)


def test_owned_gain_blocks_follow_source_order() -> None:
    content = _stock() + _calibration_block(
        "  - id: !extend meter_main1\n"
        "    phase_b:\n"
        "      gain_voltage: 7602\n"
    )
    content += _legacy_block((7401, 7402, 7403), (7501, 7502, 7503))

    assert _effective(content)["meter_main1"] == (7401, 7402, 7403)


def test_empty_write_migrates_legacy_gains_without_changing_effective_values() -> None:
    before = _stock() + _legacy_block((7401, 7305, 7403), (7310, 7502, 7310))

    after = apply_voltage_gain_changes(before, _topology(), {})

    assert _effective(after) == _effective(before)
    assert "gain_voltage:" not in ESPHomeConfigDocument.parse(after).managed_blocks[
        "voltage_references"
    ].content
    assert "phase_b:\n      gain_voltage: 7502" in after
    assert "phase_a:\n      gain_voltage: 7305" not in after


def test_full_uniform_write_updates_scalar_and_removes_masking_owned_gains() -> None:
    before = _stock() + _legacy_block((7401, 7402, 7403), (7310, 7310, 7310))

    after = apply_voltage_gain_changes(
        before, _topology(), {"meter_main1": (7320, 7320, 7320)}
    )

    assert "voltage_cal1: '7320'" in after
    assert _effective(after)["meter_main1"] == (7320, 7320, 7320)
    assert "gain_voltage:" not in ESPHomeConfigDocument.parse(after).managed_blocks[
        "voltage_references"
    ].content


def test_partial_write_preserves_untouched_sparse_calibration() -> None:
    content = _stock() + _calibration_block(
        "  - id: !extend meter_main2\n"
        "    phase_c:\n"
        "      gain_voltage: 7555\n"
    )

    after = apply_voltage_gain_changes(
        content, _topology(), {"meter_main1": (7305, 7444, 7305)}
    )

    assert _effective(after) == {
        "meter_main1": (7305, 7444, 7305),
        "meter_main2": (7310, 7310, 7555),
    }
    assert after.count("gain_voltage:") == 2


@pytest.mark.parametrize(
    "body",
    (
        "  - id: !extend meter_main1\n    phase_a:\n      'gain_voltage': 7400\n",
        "  - id: !extend meter_main1\n    phase_a:\n      gain_voltage: 7400\n      gain_voltage: 7401\n",
        "  - id: !extend unknown_meter\n    phase_a:\n      gain_voltage: 7400\n",
        "  - id: !extend meter_main1\n    phase_d:\n      gain_voltage: 7400\n",
        "  - id: !extend meter_main1\n    phase_a:\n      gain_voltage: 0\n",
        "  - id: !extend meter_main1\n    phase_a:\n      voltage:\n        gain_voltage: 7400\n",
    ),
)
def test_rejects_malformed_owned_gain_entries(body: str) -> None:
    content = _stock() + _calibration_block(body)

    with pytest.raises(ValueError):
        _effective(content)


def test_rejects_unowned_local_gain_override() -> None:
    content = _stock() + (
        "  - id: !extend meter_main1\n"
        "    phase_a:\n"
        "      gain_voltage: 7400\n"
    )

    with pytest.raises(ValueError, match="local voltage gain"):
        _effective(content)


def test_ignores_gain_text_inside_a_block_scalar() -> None:
    content = _stock() + "lambda: |\n  gain_voltage: 9999\n"

    assert _effective(content)["meter_main1"] == (7305, 7305, 7305)


def test_rejects_unknown_meter_sensor_package_mapping() -> None:
    content = _stock() + (
        "packages:\n"
        "  custom_meter:\n"
        "    file: Software/ESPHome/meter_sensors/custom_meter.yaml\n"
    )

    with pytest.raises(ValueError, match="package"):
        _effective(content)


@pytest.mark.parametrize(
    "declaration",
    (
        "  custom: !include custom.yaml\n",
        "  custom: github://someone/fork/Software/ESPHome/meter_sensors/6chan_main_sensor.yaml@master\n",
    ),
)
def test_rejects_unknown_package_sources_before_gain_write(declaration: str) -> None:
    content = _stock() + "packages:\n" + declaration

    with pytest.raises(ValueError, match="package source"):
        apply_voltage_gain_changes(
            content, _topology(), {"meter_main1": (7400, 7400, 7400)}
        )


def test_rejects_included_packages_mapping_before_gain_write() -> None:
    content = _stock() + "packages: !include packages.yaml\n"

    with pytest.raises(ValueError, match="package source"):
        apply_voltage_gain_changes(
            content, _topology(), {"meter_main1": (7400, 7400, 7400)}
        )


def test_rejects_escaped_packages_key_with_unknown_source() -> None:
    content = _stock() + '"pack\\u0061ges":\n  custom: !include custom.yaml\n'

    with pytest.raises(ValueError, match="package source"):
        apply_voltage_gain_changes(
            content, _topology(), {"meter_main1": (7400, 7400, 7400)}
        )


@pytest.mark.parametrize(
    "declaration",
    (
        "  meter: github://CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter/Software/ESPHome/meter_sensors/6chan_main_sensor.yaml@master\n",
        """  meter:
    url: https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter
    ref: master
    files:
      - Software/ESPHome/6chan_common.yaml
      - Software/ESPHome/meter_sensors/6chan_main_sensor.yaml
""",
    ),
)
def test_accepts_supported_circuitsetup_package_sources(declaration: str) -> None:
    content = _stock() + "packages:\n" + declaration

    after = apply_voltage_gain_changes(
        content, _topology(), {"meter_main1": (7400, 7400, 7400)}
    )

    assert _effective(after)["meter_main1"] == (7400, 7400, 7400)


def test_dense_owned_gains_do_not_require_guessed_substitution_defaults() -> None:
    content = _stock().replace("  voltage_cal1: '7305'\n", "")
    content += _legacy_block((7401, 7402, 7403), (7310, 7310, 7310))

    assert _effective(content)["meter_main1"] == (7401, 7402, 7403)


def test_full_uniform_target_can_establish_a_missing_shared_scalar() -> None:
    before = _stock().replace("  voltage_cal1: '7305'\n", "")

    after = apply_voltage_gain_changes(
        before, _topology(), {"meter_main1": (7400, 7400, 7400)}
    )

    assert "voltage_cal1: '7400'" in after
    assert _effective(after)["meter_main1"] == (7400, 7400, 7400)


def test_write_is_idempotent_with_root_level_sensor_sequence() -> None:
    before = _stock(sensor_indent=0)
    first = apply_voltage_gain_changes(
        before, _topology(), {"meter_main1": (7305, 7402, 7305)}
    )

    assert apply_voltage_gain_changes(first, _topology(), {"meter_main1": (7305, 7402, 7305)}) == first
    assert _effective(first)["meter_main1"] == (7305, 7402, 7305)


def test_writer_uses_custom_meter_id_substitution_and_reader_accepts_literal_alias() -> None:
    before = _stock().replace(
        "  voltage_cal1: '7305'\n",
        "  voltage_cal1: '7305'\n  main_meter_id1: custom_meter_one\n",
    )

    written = apply_voltage_gain_changes(
        before, _topology(), {"meter_main1": (7305, 7402, 7305)}
    )

    assert "id: !extend ${main_meter_id1}" in written
    assert _effective(written)["meter_main1"] == (7305, 7402, 7305)
    literal = written.replace("${main_meter_id1}", "custom_meter_one")
    assert _effective(literal)["meter_main1"] == (7305, 7402, 7305)
