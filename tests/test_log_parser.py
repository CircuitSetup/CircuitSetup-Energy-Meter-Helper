"""Tests for exact ATM90E32 calibration log evidence."""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    CalibrationLogLine,
    LogEvidenceError,
    parse_calibration_sources,
    parse_gain_run,
    parse_restore,
)

FIXTURES = Path(__file__).parent / "fixtures" / "logs"


def test_detects_current_flash_and_configuration_calibration_sources() -> None:
    sources = parse_calibration_sources(
        (
            "[CALIBRATION][meter_main1] Gain calibration loaded and verified successfully.",
            "[CALIBRATION][meter_main2] No stored gain calibrations found. Using config file values.",
        ),
        {"meter_main1", "meter_main2", "addon1_1"},
    )

    assert sources == {
        "addon1_1": "unknown",
        "meter_main1": "flash",
        "meter_main2": "configuration",
    }


def log_lines(
    fixture: str,
    *,
    generation: int = 3,
    sequence: int = 8,
    start: float = 11.0,
) -> list[CalibrationLogLine]:
    return [
        CalibrationLogLine(generation, sequence, start + index, line)
        for index, line in enumerate(
            (FIXTURES / fixture).read_text(encoding="utf-8").splitlines()
        )
    ]


def test_parses_exact_gain_phase_rows_and_success() -> None:
    evidence = parse_gain_run(
        log_lines("gain_success.log"),
        connection_generation=3,
        operation_sequence=8,
        target_instance_id="meter_main1",
        button_name="3. Run Main Meter 1 Gain Cal",
        dispatched_after=10.0,
    )

    phase_b = evidence.phases[1]
    assert phase_b.phase == "B"
    assert phase_b.measured_voltage == 120.10
    assert phase_b.measured_current == 12.0810
    assert phase_b.reference_voltage == 0.0
    assert phase_b.reference_current == 12.4300
    assert (phase_b.old_voltage_gain, phase_b.new_voltage_gain) == (7305, 7305)
    assert (phase_b.old_current_gain, phase_b.new_current_gain) == (27518, 28312)
    assert evidence.flash_saved
    assert evidence.immediate_apply_acceptable


def test_parses_save_failure_and_register_mismatch() -> None:
    failure = parse_gain_run(
        log_lines("gain_save_failure.log"),
        connection_generation=3,
        operation_sequence=8,
        target_instance_id="meter_main1",
        button_name="3. Run Main Meter 1 Gain Cal",
        dispatched_after=10.0,
    )
    mismatch = parse_gain_run(
        log_lines("gain_register_mismatch.log"),
        connection_generation=3,
        operation_sequence=8,
        target_instance_id="meter_main1",
        button_name="3. Run Main Meter 1 Gain Cal",
        dispatched_after=10.0,
    )

    assert not failure.flash_saved
    assert not failure.immediate_apply_acceptable
    assert mismatch.register_mismatch_phases == ("B",)
    assert not mismatch.immediate_apply_acceptable


def test_gain_correlation_rejects_predispatch_wrong_generation_and_interleaving() -> (
    None
):
    actual = log_lines("gain_success.log")
    noise = log_lines("gain_success.log", generation=2, sequence=8, start=20.0)
    stale = log_lines("gain_success.log", start=0.0)

    evidence = parse_gain_run(
        [*noise, *stale, *actual],
        connection_generation=3,
        operation_sequence=8,
        target_instance_id="meter_main1",
        button_name="3. Run Main Meter 1 Gain Cal",
        dispatched_after=10.0,
    )
    assert evidence.connection_generation == 3
    assert evidence.operation_sequence == 8

    interleaved = actual.copy()
    interleaved.insert(
        3,
        CalibrationLogLine(
            3,
            8,
            13.5,
            "[I] [CALIBRATION][addon1_1] |   A   | 120.0 | 1.0 | 0.0 | 0.0 | 7305 → 7305 | 1 → 1 |",
        ),
    )
    with pytest.raises(LogEvidenceError, match="interleaved"):
        parse_gain_run(
            interleaved,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="3. Run Main Meter 1 Gain Cal",
            dispatched_after=10.0,
        )

    wrong_first = actual.copy()
    wrong_first.insert(
        1,
        CalibrationLogLine(
            3,
            8,
            11.5,
            "[I] [CALIBRATION][addon1_1] ========================= Gain Calibration =========================",
        ),
    )
    with pytest.raises(LogEvidenceError, match="interleaved"):
        parse_gain_run(
            wrong_first,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="3. Run Main Meter 1 Gain Cal",
            dispatched_after=10.0,
        )

    row_before_header = actual.copy()
    row_before_header.insert(
        1,
        CalibrationLogLine(
            3,
            8,
            11.5,
            "[I] [CALIBRATION][addon1_1] |   A   | 120.0 | 1.0 | 0.0 | 0.0 | 7305 → 7305 | 1 → 1 |",
        ),
    )
    with pytest.raises(LogEvidenceError, match="interleaved"):
        parse_gain_run(
            row_before_header,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="3. Run Main Meter 1 Gain Cal",
            dispatched_after=10.0,
        )

    target_row_before_header = actual.copy()
    target_row_before_header.insert(
        1,
        CalibrationLogLine(
            3,
            8,
            11.5,
            "[I] [CALIBRATION][meter_main1] |   A   | 120.0 | 1.0 | 0.0 | 0.0 | 7305 → 7305 | 1 → 1 |",
        ),
    )
    with pytest.raises(LogEvidenceError, match="before.*header"):
        parse_gain_run(
            target_row_before_header,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="3. Run Main Meter 1 Gain Cal",
            dispatched_after=10.0,
        )


def test_gain_requires_target_tag_on_rows_and_one_terminal_save_result() -> None:
    untagged = [
        CalibrationLogLine(
            item.connection_generation,
            item.operation_sequence,
            item.arrived_at,
            item.line.replace("[CALIBRATION][meter_main1]", "[CALIBRATION]"),
        )
        if "|   " in item.line or "saved to memory" in item.line
        else item
        for item in log_lines("gain_success.log")
    ]
    with pytest.raises(LogEvidenceError, match="target instance"):
        parse_gain_run(
            untagged,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="3. Run Main Meter 1 Gain Cal",
            dispatched_after=10.0,
        )

    contradictory = log_lines("gain_save_failure.log")
    contradictory.append(
        CalibrationLogLine(
            3,
            8,
            contradictory[-1].arrived_at + 1,
            "[I] [CALIBRATION][meter_main1] Gain calibration saved to memory.",
        )
    )
    with pytest.raises(LogEvidenceError, match="save result"):
        parse_gain_run(
            contradictory,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="3. Run Main Meter 1 Gain Cal",
            dispatched_after=10.0,
        )


def test_parses_both_verified_restore_shapes() -> None:
    positive = parse_restore(
        log_lines("restore_positive.log", sequence=0),
        connection_generation=3,
        expected_instance_ids={"meter_main1"},
        started_after=10.0,
    )["meter_main1"]
    mismatch = parse_restore(
        log_lines("restore_config_flash_mismatch.log", sequence=0),
        connection_generation=3,
        expected_instance_ids={"addon1_2"},
        started_after=10.0,
    )["addon1_2"]

    assert positive.phase_gains[1] == (7305, 28312)
    assert positive.source == "flash"
    assert positive.register_verified
    assert positive.verification_basis == "positive_loaded_line"
    assert not positive.config_differs_from_flash
    assert mismatch.phase_gains == ((7310, 28001), (7311, 28002), (7312, 28003))
    assert mismatch.source == "flash"
    assert mismatch.register_verified
    assert mismatch.verification_basis == "verified_config_flash_table"
    assert mismatch.config_differs_from_flash


def test_restore_rejects_failure_or_missing_instance() -> None:
    failed = [
        CalibrationLogLine(
            3,
            0,
            11.0,
            "[E] [CALIBRATION][meter_main1] Gain verification failed! Calibration may not be applied correctly.",
        )
    ]
    with pytest.raises(LogEvidenceError, match="verification failed"):
        parse_restore(
            failed,
            connection_generation=3,
            expected_instance_ids={"meter_main1"},
            started_after=10.0,
        )
    with pytest.raises(LogEvidenceError, match="missing restore"):
        parse_restore(
            log_lines("restore_positive.log", sequence=0),
            connection_generation=3,
            expected_instance_ids={"addon2_1"},
            started_after=10.0,
        )
