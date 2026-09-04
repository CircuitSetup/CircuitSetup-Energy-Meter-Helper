"""Tests for exact ATM90E32 calibration log evidence."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

import pytest

from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    CalibrationLogLine,
    LogEvidenceError,
    OffsetRunEvidence,
    OffsetTableSnapshot,
    PowerOffsetRunEvidence,
    parse_calibration_sources,
    parse_gain_run,
    parse_offset_clear,
    parse_offset_run,
    parse_offset_table_snapshot,
    parse_power_offset_run,
    parse_restore,
)

FIXTURES = Path(__file__).parent / "fixtures" / "logs"


@pytest.mark.parametrize("stage,kind", ((1, "offset"), (2, "power offset")))
def test_detects_saved_offsets_separately_from_gain_and_other_stage(
    stage: int, kind: str
) -> None:
    assert parse_calibration_sources(
        (
            f"[CALIBRATION][meter_main1] Restored {kind} calibration from memory",
            f"[CALIBRATION][meter_main2] {kind.capitalize()} mismatch: using flash values (config differs)",
            "[CALIBRATION][addon1_1] Gain calibration loaded and verified successfully.",
            "[CALIBRATION][addon1_2] Restored power offset calibration from memory"
            if stage == 1
            else "[CALIBRATION][addon1_2] Restored offset calibration from memory",
        ),
        {"meter_main1", "meter_main2", "addon1_1", "addon1_2"},
        offset_stage=stage,
    ) == {
        "addon1_1": "unknown",
        "addon1_2": "unknown",
        "meter_main1": "flash",
        "meter_main2": "flash",
    }


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


def test_detects_firmware_power_offset_configuration_fallback() -> None:
    assert parse_calibration_sources(
        (
            (
                "[W][atm90e32:1071] [CALIBRATION][meter_main1] "
                "No stored power offset calibrations found. Using default values."
            ),
        ),
        {"meter_main1"},
        offset_stage=2,
    ) == {"meter_main1": "configuration"}


def test_detects_verified_gain_config_fallback_as_configuration() -> None:
    sources = parse_calibration_sources(
        (
            "[CALIBRATION][meter_main1] Gain calibration restore failed verification; config values verified.",
        ),
        {"meter_main1"},
    )

    assert sources == {"meter_main1": "configuration"}


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


def test_parses_combined_gain_save_and_verification_terminal() -> None:
    lines = [
        CalibrationLogLine(
            item.connection_generation,
            item.operation_sequence,
            item.arrived_at,
            item.line.replace(
                "Gain calibration saved to memory.",
                "Gain calibration saved to memory. Gain calibration completed and verified.",
            ),
        )
        for item in log_lines("gain_success.log")
        if "Gain calibration completed and verified." not in item.line
    ]

    evidence = parse_gain_run(
        lines,
        connection_generation=3,
        operation_sequence=8,
        target_instance_id="meter_main1",
        button_name="3. Run Main Meter 1 Gain Cal",
        dispatched_after=10.0,
    )

    assert evidence.flash_saved and evidence.immediate_apply_acceptable


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


def test_parses_verified_gain_rollback_without_save_result() -> None:
    lines = [
        item
        for item in log_lines("gain_success.log")
        if "Gain calibration saved to memory." not in item.line
    ]
    lines.extend(
        (
            CalibrationLogLine(
                3,
                8,
                20.0,
                "[E] [CALIBRATION][meter_main1] Mismatch detected for Phase B!",
            ),
            CalibrationLogLine(
                3,
                8,
                21.0,
                "[E] [CALIBRATION][meter_main1] Gain calibration failed; previous values restored.",
            ),
        )
    )

    evidence = parse_gain_run(
        lines,
        connection_generation=3,
        operation_sequence=8,
        target_instance_id="meter_main1",
        button_name="3. Run Main Meter 1 Gain Cal",
        dispatched_after=10.0,
    )

    assert not evidence.flash_saved
    assert evidence.register_mismatch_phases == ("B",)
    assert not evidence.immediate_apply_acceptable


def test_rejects_gain_rollback_readback_failure() -> None:
    lines = [
        item
        for item in log_lines("gain_success.log")
        if "Gain calibration saved to memory." not in item.line
    ]
    lines.append(
        CalibrationLogLine(
            3,
            8,
            20.0,
            "[E] [CALIBRATION][meter_main1] Gain calibration failed; rollback readback verification failed.",
        )
    )

    with pytest.raises(LogEvidenceError, match="rollback readback"):
        parse_gain_run(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="3. Run Main Meter 1 Gain Cal",
            dispatched_after=10.0,
        )


def test_parses_both_completed_gain_runs_from_one_meter_board() -> None:
    raw_lines = (
        "[I][atm90e32.button:015] 3. Run Addon1 7-9 Gain Cal",
        "[I][atm90e32:663] [CALIBRATION][addon1_1] ===== Gain Calibration =====",
        "[I][atm90e32:733] [CALIBRATION][addon1_1] | A | 122.32 | 0.0010 | 122.40 | 0.0000 | 7569 -> 7573 | 11143 -> 11143 |",
        "[I][atm90e32:733] [CALIBRATION][addon1_1] | B | 122.29 | 0.0010 | 122.40 | 0.0000 | 7571 -> 7577 | 11143 -> 11143 |",
        "[I][atm90e32:733] [CALIBRATION][addon1_1] | C | 122.31 | 0.1380 | 122.40 | 0.0000 | 7572 -> 7577 | 11143 -> 11143 |",
        "[I][atm90e32:752] [CALIBRATION][addon1_1] Gain calibration saved to memory.",
        "[I][atm90e32.button:015] 3. Run Addon1 10-12 Gain Cal",
        "[I][atm90e32:663] [CALIBRATION][addon1_2] ===== Gain Calibration =====",
        "[I][atm90e32:733] [CALIBRATION][addon1_2] | A | 122.34 | 1.2670 | 122.40 | 0.0000 | 7577 -> 7580 | 11143 -> 11143 |",
        "[I][atm90e32:733] [CALIBRATION][addon1_2] | B | 122.33 | 0.0030 | 122.40 | 0.0000 | 7577 -> 7581 | 11143 -> 11143 |",
        "[I][atm90e32:733] [CALIBRATION][addon1_2] | C | 122.34 | 0.0010 | 122.40 | 0.0000 | 7565 -> 7568 | 11143 -> 11143 |",
        "[I][atm90e32:752] [CALIBRATION][addon1_2] Gain calibration saved to memory.",
    )
    lines = [
        CalibrationLogLine(3, 8, 11.0 + index, line)
        for index, line in enumerate(raw_lines)
    ]

    evidence = tuple(
        parse_gain_run(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id=instance_id,
            button_name=button_name,
            dispatched_after=10.0,
        )
        for instance_id, button_name in (
            ("addon1_1", "3. Run Addon1 7-9 Gain Cal"),
            ("addon1_2", "3. Run Addon1 10-12 Gain Cal"),
        )
    )

    assert tuple(item.instance_id for item in evidence) == ("addon1_1", "addon1_2")
    assert all(item.immediate_apply_acceptable for item in evidence)


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

    untagged_after_terminal = log_lines("gain_success.log")
    untagged_after_terminal.append(
        CalibrationLogLine(
            3,
            8,
            untagged_after_terminal[-1].arrived_at + 1,
            "[I] [CALIBRATION] ===== Gain Calibration =====",
        )
    )
    with pytest.raises(LogEvidenceError, match="target instance"):
        parse_gain_run(
            untagged_after_terminal,
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


def test_parses_exact_signed_offset_tables_and_verified_terminals() -> None:
    offset = parse_offset_run(
        log_lines("offset_success.log"),
        connection_generation=3,
        operation_sequence=8,
        target_instance_id="meter_main1",
        button_name="1. Run Main Meter 1 Offset Cal",
        dispatched_after=10.0,
    )
    power = parse_power_offset_run(
        log_lines("power_offset_success.log"),
        connection_generation=3,
        operation_sequence=8,
        target_instance_id="meter_main1",
        button_name="2. Run Main Meter 1 Power Offset Cal",
        dispatched_after=10.0,
    )

    assert [
        (row.phase, row.voltage_offset, row.current_offset) for row in offset.phases
    ] == [("A", -12, 31), ("B", -32768, 32767), ("C", 14, -33)]
    assert [
        (row.phase, row.active_power_offset, row.reactive_power_offset)
        for row in power.phases
    ] == [("A", -101, 201), ("B", -32768, 32767), ("C", 103, -203)]
    assert offset.flash_saved and offset.register_verified
    assert power.flash_saved and power.register_verified


def test_parses_esphome_colon_after_offset_button_prefix() -> None:
    lines = log_lines("offset_success.log")
    lines[0] = CalibrationLogLine(
        lines[0].connection_generation,
        lines[0].operation_sequence,
        lines[0].arrived_at,
        lines[0].line.replace("] 1.", "]: 1.", 1),
    )

    evidence = parse_offset_run(
        lines,
        connection_generation=3,
        operation_sequence=8,
        target_instance_id="meter_main1",
        button_name="1. Run Main Meter 1 Offset Cal",
        dispatched_after=10.0,
    )

    assert evidence.instance_id == "meter_main1"


@pytest.mark.parametrize(
    ("stage", "header", "columns", "comparison", "rows"),
    (
        (
            1,
            "Offset mismatch: using flash values",
            "offset_voltage | offset_current",
            "| | config | flash | config | flash |",
            (
                "| A | -1 | 0 | 1 | 0 |",
                "| B | -1 | 0 | 1 | 0 |",
                "| C | -1 | 0 | 1 | 0 |",
            ),
        ),
        (
            2,
            "Power offset mismatch: using flash values",
            "offset_active_power | offset_reactive_power",
            "| | config | flash | config | flash |",
            (
                "| A | -1 | 0 | 1 | 0 |",
                "| B | -1 | 0 | 1 | 0 |",
                "| C | -1 | 0 | 1 | 0 |",
            ),
        ),
    ),
)
def test_offset_snapshot_rejects_ambiguous_tags_only_on_signed_comparison_rows(
    stage: int,
    header: str,
    columns: str,
    comparison: str,
    rows: tuple[str, str, str],
) -> None:
    source = (header, f"| Phase | {columns} |", comparison, *rows)
    lines = [
        CalibrationLogLine(
            3,
            4,
            11.0 + index,
            f"[W][atm90e32] [CALIBRATION][meter_main1]"
            f"{' [CALIBRATION][other]' if index > 2 else ''} {line}",
        )
        for index, line in enumerate(source)
    ]
    with pytest.raises(
        LogEvidenceError, match="unassignable or duplicate instance tag"
    ):
        parse_offset_table_snapshot(
            lines,
            connection_generation=3,
            operation_sequence=4,
            expected_instance_ids={"meter_main1"},
            started_after=10.0,
            offset_stage=stage,
        )


@pytest.mark.parametrize(
    ("fixture", "parser", "button", "guidance"),
    (
        (
            "offset_success.log",
            parse_offset_run,
            "1. Run Main Meter 1 Offset Cal",
            "Use offset_voltage: & offset_current: under each phase_x: in your config file to save these values",
        ),
        (
            "power_offset_success.log",
            parse_power_offset_run,
            "2. Run Main Meter 1 Power Offset Cal",
            "Use offset_active_power: & offset_reactive_power: under each phase_x: in your config file to save these values",
        ),
    ),
)
def test_offset_runs_distinguish_button_guidance_from_another_press(
    fixture: str,
    parser: Callable[..., OffsetRunEvidence | PowerOffsetRunEvidence],
    button: str,
    guidance: str,
) -> None:
    lines = log_lines(fixture)
    lines[0] = CalibrationLogLine(3, 8, 11.0, f"[I][atm90e32.button:037]: {button}")
    lines[1:1] = [
        CalibrationLogLine(
            3,
            8,
            11.1,
            "[I][atm90e32.button:038]: [CALIBRATION] **NOTE: CTs and ACVs must be 0 during this process. USB power only**",
        ),
        CalibrationLogLine(
            3, 8, 11.2, f"[I][atm90e32.button:039]: [CALIBRATION] {guidance}"
        ),
    ]
    arguments = {
        "connection_generation": 3,
        "operation_sequence": 8,
        "target_instance_id": "meter_main1",
        "button_name": button,
        "dispatched_after": 10.0,
    }

    evidence = parser(lines, **arguments)
    assert evidence.flash_saved and evidence.register_verified

    lines.insert(
        3,
        CalibrationLogLine(
            3, 8, 11.3, "[I][atm90e32.button:051]: z1. Clear Main Meter 2 Offset Cal"
        ),
    )
    with pytest.raises(LogEvidenceError, match="wrong button"):
        parser(lines, **arguments)


def test_parses_combined_offset_save_and_verification_terminals() -> None:
    for fixture, parser, button, name in (
        (
            "offset_success.log",
            parse_offset_run,
            "1. Run Main Meter 1 Offset Cal",
            "Offset",
        ),
        (
            "power_offset_success.log",
            parse_power_offset_run,
            "2. Run Main Meter 1 Power Offset Cal",
            "Power offset",
        ),
    ):
        saved = f"{name} calibration saved to memory."
        completed = f"{name} calibration completed and verified."
        lines = [
            CalibrationLogLine(
                item.connection_generation,
                item.operation_sequence,
                item.arrived_at,
                item.line.replace(saved, f"{saved} {completed}"),
            )
            for item in log_lines(fixture)
            if completed not in item.line
        ]

        evidence = parser(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name=button,
            dispatched_after=10.0,
        )

        assert evidence.flash_saved and evidence.register_verified


@pytest.mark.parametrize(
    ("parser", "fixture", "button", "completed"),
    (
        (
            parse_offset_run,
            "offset_success.log",
            "1. Run Main Meter 1 Offset Cal",
            "Offset calibration completed and verified.",
        ),
        (
            parse_power_offset_run,
            "power_offset_success.log",
            "2. Run Main Meter 1 Power Offset Cal",
            "Power offset calibration completed and verified.",
        ),
    ),
)
def test_stock_offset_save_is_not_claimed_as_register_verification(
    parser,
    fixture: str,
    button: str,
    completed: str,
) -> None:
    lines = [item for item in log_lines(fixture) if completed not in item.line]
    kwargs = {
        "connection_generation": 3,
        "operation_sequence": 8,
        "target_instance_id": "meter_main1",
        "button_name": button,
        "dispatched_after": 10.0,
    }
    with pytest.raises(LogEvidenceError, match="terminal"):
        parser(lines, **kwargs)
    evidence = parser(lines, **kwargs, allow_unverified=True)
    assert evidence.flash_saved
    assert not evidence.register_verified
    assert tuple(phase.phase for phase in evidence.phases) == ("A", "B", "C")


@pytest.mark.parametrize(
    "tail",
    (
        "Offset calibration completed and verified. unexpected",
        "Failed to save offset calibration to memory!",
        "Offset calibration failed; rollback readback verification failed.",
        "SPI read mismatch: expected 0x55AA, got 0x0000",
    ),
)
def test_stock_offset_compatibility_does_not_hide_late_failures(tail: str) -> None:
    lines = [
        item
        for item in log_lines("offset_success.log")
        if "Offset calibration completed and verified." not in item.line
    ]
    lines.append(CalibrationLogLine(3, 8, 100.0, f"[CALIBRATION][meter_main1] {tail}"))
    with pytest.raises(LogEvidenceError):
        parse_offset_run(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="1. Run Main Meter 1 Offset Cal",
            dispatched_after=10.0,
            allow_unverified=True,
        )


@pytest.mark.parametrize(
    ("generation", "sequence", "start"),
    [(2, 8, 11.0), (3, 7, 11.0), (3, 8, 0.0)],
)
def test_offset_run_rejects_stale_or_wrong_correlation(
    generation: int, sequence: int, start: float
) -> None:
    with pytest.raises(LogEvidenceError, match="button"):
        parse_offset_run(
            log_lines(
                "offset_success.log",
                generation=generation,
                sequence=sequence,
                start=start,
            ),
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="1. Run Main Meter 1 Offset Cal",
            dispatched_after=10.0,
        )


@pytest.mark.parametrize(
    ("transform", "message"),
    [
        (lambda line: line.replace("Main Meter 1", "Main Meter 2"), "button"),
        (
            lambda line: line.replace("[meter_main1]", "[meter_main2]"),
            "instance",
        ),
        (
            lambda line: line.replace("[CALIBRATION][meter_main1]", "[CALIBRATION]"),
            "instance tag",
        ),
    ],
)
def test_offset_run_rejects_wrong_button_instance_or_untagged_evidence(
    transform: Callable[[str], str], message: str
) -> None:
    lines = [
        CalibrationLogLine(
            item.connection_generation,
            item.operation_sequence,
            item.arrived_at,
            transform(item.line),
        )
        for item in log_lines("offset_success.log")
    ]
    with pytest.raises(LogEvidenceError, match=message):
        parse_offset_run(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="1. Run Main Meter 1 Offset Cal",
            dispatched_after=10.0,
        )


def test_offset_run_rejects_interleaved_instance() -> None:
    lines = log_lines("offset_success.log")
    lines.insert(
        3,
        CalibrationLogLine(
            3,
            8,
            13.5,
            "[I][atm90e32:820] [CALIBRATION][addon1_1] |   A   | -1 | 2 |",
        ),
    )
    with pytest.raises(LogEvidenceError, match="interleaved"):
        parse_offset_run(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="1. Run Main Meter 1 Offset Cal",
            dispatched_after=10.0,
        )


@pytest.mark.parametrize(
    ("old", "new", "message"),
    [
        (
            "|   B   |     -32768      |      32767      |",
            "",
            "phases A, B, and C",
        ),
        (
            "|   B   |     -32768      |      32767      |",
            "|   A   |     -32768      |      32767      |",
            "duplicate.*phase A",
        ),
        ("-32768", "-32769", "signed 16-bit"),
        ("32767", "32768", "signed 16-bit"),
    ],
)
def test_offset_run_rejects_missing_duplicate_or_out_of_range_rows(
    old: str, new: str, message: str
) -> None:
    lines = [
        CalibrationLogLine(
            item.connection_generation,
            item.operation_sequence,
            item.arrived_at,
            item.line.replace(old, new),
        )
        for item in log_lines("offset_success.log")
    ]
    with pytest.raises(LogEvidenceError, match=message):
        parse_offset_run(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="1. Run Main Meter 1 Offset Cal",
            dispatched_after=10.0,
        )


@pytest.mark.parametrize(
    ("fixture", "parser", "button", "message"),
    [
        (
            "offset_save_failure.log",
            parse_offset_run,
            "1. Run Main Meter 1 Offset Cal",
            "save failure",
        ),
        (
            "power_offset_register_mismatch.log",
            parse_power_offset_run,
            "2. Run Main Meter 1 Power Offset Cal",
            "register mismatch",
        ),
    ],
)
def test_offset_runs_reject_failure_terminals(
    fixture: str, parser: Callable[..., object], button: str, message: str
) -> None:
    with pytest.raises(LogEvidenceError, match=message):
        parser(
            log_lines(fixture),
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name=button,
            dispatched_after=10.0,
        )


@pytest.mark.parametrize(
    ("parser", "fixture", "button", "completed", "rollback_failed"),
    (
        (
            parse_offset_run,
            "offset_success.log",
            "1. Run Main Meter 1 Offset Cal",
            "Offset calibration completed and verified.",
            "Offset calibration failed; rollback readback verification failed.",
        ),
        (
            parse_power_offset_run,
            "power_offset_success.log",
            "2. Run Main Meter 1 Power Offset Cal",
            "Power offset calibration completed and verified.",
            "Power offset calibration failed; rollback readback verification failed.",
        ),
    ),
)
def test_offset_runs_reject_distinct_rollback_readback_failure_terminal(
    parser: Callable[..., object],
    fixture: str,
    button: str,
    completed: str,
    rollback_failed: str,
) -> None:
    lines = [
        CalibrationLogLine(
            item.connection_generation,
            item.operation_sequence,
            item.arrived_at,
            item.line.replace(completed, rollback_failed),
        )
        for item in log_lines(fixture)
    ]

    with pytest.raises(LogEvidenceError, match="rollback readback"):
        parser(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name=button,
            dispatched_after=10.0,
        )


def test_offset_run_rejects_duplicate_or_contradictory_terminals() -> None:
    for terminal in (
        "[I][atm90e32:834] [CALIBRATION][meter_main1] Offset calibration completed and verified.",
        "[E][atm90e32:831] [CALIBRATION][meter_main1] Offset calibration failed; previous values restored.",
    ):
        lines = log_lines("offset_success.log")
        lines.append(CalibrationLogLine(3, 8, 30.0, terminal))
        with pytest.raises(LogEvidenceError, match="terminal"):
            parse_offset_run(
                lines,
                connection_generation=3,
                operation_sequence=8,
                target_instance_id="meter_main1",
                button_name="1. Run Main Meter 1 Offset Cal",
                dispatched_after=10.0,
            )


def test_offset_run_rejects_inexact_success_terminal() -> None:
    lines = [
        CalibrationLogLine(
            item.connection_generation,
            item.operation_sequence,
            item.arrived_at,
            item.line.replace(
                "Offset calibration completed and verified.",
                "Offset calibration completed and verified. unexpected",
            ),
        )
        for item in log_lines("offset_success.log")
    ]
    with pytest.raises(LogEvidenceError, match="terminal"):
        parse_offset_run(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="1. Run Main Meter 1 Offset Cal",
            dispatched_after=10.0,
        )


def test_offset_run_rejects_prefixed_success_terminal_payload() -> None:
    lines = [
        CalibrationLogLine(
            item.connection_generation,
            item.operation_sequence,
            item.arrived_at,
            item.line.replace(
                "Offset calibration completed and verified.",
                "unexpected Offset calibration completed and verified.",
            ),
        )
        for item in log_lines("offset_success.log")
    ]
    with pytest.raises(LogEvidenceError, match="terminal"):
        parse_offset_run(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="1. Run Main Meter 1 Offset Cal",
            dispatched_after=10.0,
        )


def test_offset_run_rejects_same_instance_power_offset_terminal() -> None:
    lines = log_lines("offset_success.log")
    lines.insert(
        -1,
        CalibrationLogLine(
            3,
            8,
            17.5,
            "[I][atm90e32:787] [CALIBRATION][meter_main1] Power offset calibration saved to memory.",
        ),
    )
    lines.insert(
        -1,
        CalibrationLogLine(
            3,
            8,
            17.6,
            "[I][atm90e32:879] [CALIBRATION][meter_main1] Power offset calibration completed and verified.",
        ),
    )

    with pytest.raises(LogEvidenceError, match="interleaved.*categor"):
        parse_offset_run(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="1. Run Main Meter 1 Offset Cal",
            dispatched_after=10.0,
        )


def test_offset_run_rejects_save_before_phase_table() -> None:
    source = log_lines("offset_success.log")
    reordered = [*source[:3], source[6], *source[3:6], source[7]]
    lines = [
        CalibrationLogLine(3, 8, 11.0 + index, item.line)
        for index, item in enumerate(reordered)
    ]

    with pytest.raises(LogEvidenceError, match="order"):
        parse_offset_run(
            lines,
            connection_generation=3,
            operation_sequence=8,
            target_instance_id="meter_main1",
            button_name="1. Run Main Meter 1 Offset Cal",
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
    assert positive.phase_offsets == ((-12, 31), (-13, 32), (-14, 33))
    assert positive.phase_power_offsets == ((101, -201), (102, -202), (103, -203))
    assert positive.offset_register_verified
    assert positive.power_offset_register_verified
    assert mismatch.phase_gains == ((7310, 28001), (7311, 28002), (7312, 28003))
    assert mismatch.source == "flash"
    assert mismatch.register_verified
    assert mismatch.verification_basis == "verified_config_flash_table"
    assert mismatch.config_differs_from_flash
    assert mismatch.phase_offsets == ((-12, 31), (-13, 32), (-14, 33))
    assert mismatch.phase_power_offsets == ((101, -201), (102, -202), (103, -203))
    assert mismatch.offset_config_differs_from_flash
    assert mismatch.power_offset_config_differs_from_flash


@pytest.mark.parametrize(
    ("old", "new", "message"),
    [
        ("Offset calibration restore verified.", "", "offset restore"),
        (
            "Power offset calibration restore verified.",
            "Power offset restore failed verification; using config values.",
            "power offset restore failed",
        ),
        ("        -12", "     -32769", "signed 16-bit"),
        (
            "Offset calibration restore verified.",
            "Offset calibration restore verified. unexpected",
            "offset restore",
        ),
    ],
)
def test_restore_rejects_missing_failure_or_out_of_range_offset_evidence(
    old: str, new: str, message: str
) -> None:
    lines = [
        CalibrationLogLine(
            item.connection_generation,
            item.operation_sequence,
            item.arrived_at,
            item.line.replace(old, new),
        )
        for item in log_lines("restore_positive.log", sequence=0)
    ]
    with pytest.raises(LogEvidenceError, match=message):
        parse_restore(
            lines,
            connection_generation=3,
            expected_instance_ids={"meter_main1"},
            started_after=10.0,
            operation_sequence=0,
            expected_categories={"meter_main1": {"gain", "offset", "power_offset"}},
        )


def test_gain_only_restore_ignores_unrequested_offset_config_fallback() -> None:
    lines = log_lines("restore_positive.log", sequence=0)
    lines = [
        item
        for item in lines
        if "offset calibration from memory" not in item.line.casefold()
        and "offset_active_power" not in item.line
        and "offset_voltage" not in item.line
        and not ("[atm90e32:378]" in item.line or "[atm90e32:389]" in item.line)
    ]
    lines.extend(
        (
            CalibrationLogLine(
                3,
                0,
                30.0,
                "[W][atm90e32:1015] [CALIBRATION][meter_main1] No stored offset calibrations found. Using default values.",
            ),
            CalibrationLogLine(
                3,
                0,
                31.0,
                "[W][atm90e32:1071] [CALIBRATION][meter_main1] No stored power offsets found. Using default values.",
            ),
        )
    )

    restored = parse_restore(
        lines,
        connection_generation=3,
        expected_instance_ids={"meter_main1"},
        started_after=10.0,
    )["meter_main1"]

    assert restored.phase_gains == ((7305, 27518), (7305, 28312), (7305, 27518))
    assert restored.phase_offsets is None
    assert restored.phase_power_offsets is None


def test_offset_restore_rejects_terminal_and_table_from_different_sequences() -> None:
    lines = [
        CalibrationLogLine(
            item.connection_generation,
            1 if "Offset calibration restore verified." in item.line else 2,
            item.arrived_at,
            item.line,
        )
        for item in log_lines("restore_positive.log", sequence=0)
    ]

    with pytest.raises(LogEvidenceError, match="offset restore"):
        parse_restore(
            lines,
            connection_generation=3,
            expected_instance_ids={"meter_main1"},
            started_after=10.0,
            operation_sequence=1,
            expected_categories={"meter_main1": {"offset"}},
        )


def test_stock_offset_restore_table_requires_explicit_unverified_opt_in() -> None:
    lines = [
        item
        for item in log_lines("restore_positive.log", sequence=0)
        if "Offset calibration restore verified." not in item.line
    ]
    arguments = {
        "connection_generation": 3,
        "expected_instance_ids": {"meter_main1"},
        "started_after": 10.0,
        "operation_sequence": 0,
        "expected_categories": {"meter_main1": {"offset"}},
    }

    with pytest.raises(LogEvidenceError, match="offset restore verification"):
        parse_restore(lines, **arguments)

    evidence = parse_restore(lines, **arguments, allow_unverified_offset_tables=True)[
        "meter_main1"
    ]
    assert evidence.phase_offsets == ((-12, 31), (-13, 32), (-14, 33))
    assert not evidence.offset_register_verified


def test_stock_offset_snapshot_uses_flash_mismatch_values_and_preserves_zeroes() -> (
    None
):
    source = (
        "[W][atm90e32:311] [CALIBRATION][addon1_2] Offset mismatch: using flash values",
        "[W][atm90e32:314] [CALIBRATION][addon1_2] | Phase | offset_voltage | offset_current |",
        "[W][atm90e32:315] [CALIBRATION][addon1_2] | | config | flash | config | flash |",
        "[W][atm90e32:319] [CALIBRATION][addon1_2] | A | -10 | 0 | 30 | 0 |",
        "[W][atm90e32:319] [CALIBRATION][addon1_2] | B | -10 | 0 | 30 | 0 |",
        "[W][atm90e32:319] [CALIBRATION][addon1_2] | C | -10 | 0 | 30 | 0 |",
    )
    lines = [
        CalibrationLogLine(
            3,
            4,
            11.0 + index,
            line,
        )
        for index, line in enumerate(source)
    ]

    snapshot = parse_offset_table_snapshot(
        lines,
        connection_generation=3,
        operation_sequence=4,
        expected_instance_ids={"addon1_2"},
        started_after=10.0,
        offset_stage=1,
    )["addon1_2"]

    assert snapshot == OffsetTableSnapshot(
        3,
        "addon1_2",
        1,
        ((0, 0), (0, 0), (0, 0)),
        "mismatch",
        False,
        True,
    )


def test_offset_snapshot_keeps_silence_unavailable_and_rejects_delayed_spi_failure() -> (
    None
):
    assert parse_offset_table_snapshot(
        (),
        connection_generation=3,
        operation_sequence=4,
        expected_instance_ids={"meter_main1"},
        started_after=10.0,
        offset_stage=1,
    ) == {"meter_main1": None}

    lines = log_lines("restore_positive.log", sequence=4)
    lines.append(
        CalibrationLogLine(
            3, 4, 99.0, "[W][atm90e32] SPI read mismatch: expected 0x55AA, got 0x0000"
        )
    )
    with pytest.raises(LogEvidenceError, match="SPI read mismatch"):
        parse_offset_table_snapshot(
            lines,
            connection_generation=3,
            operation_sequence=4,
            expected_instance_ids={"meter_main1"},
            started_after=10.0,
            offset_stage=1,
        )


def test_offset_snapshot_rejects_duplicate_tags_and_unassignable_readback_failure() -> (
    None
):
    duplicated = [
        CalibrationLogLine(
            item.connection_generation,
            item.operation_sequence,
            item.arrived_at,
            item.line.replace(
                "[CALIBRATION][meter_main1]",
                "[CALIBRATION][meter_main1] [CALIBRATION][other]",
            ),
        )
        for item in log_lines("restore_positive.log", sequence=4)
    ]
    arguments = {
        "connection_generation": 3,
        "operation_sequence": 4,
        "expected_instance_ids": {"meter_main1"},
        "started_after": 10.0,
        "offset_stage": 1,
    }
    with pytest.raises(
        LogEvidenceError, match="unassignable or duplicate instance tag"
    ):
        parse_offset_table_snapshot(duplicated, **arguments)

    unassignable_failure = log_lines("restore_positive.log", sequence=4)
    unassignable_failure.append(
        CalibrationLogLine(
            3,
            4,
            99.0,
            "[E][atm90e32] Offset readback failed for Phase A: offset_voltage 1/0",
        )
    )
    with pytest.raises(LogEvidenceError, match="unassignable"):
        parse_offset_table_snapshot(unassignable_failure, **arguments)


@pytest.mark.parametrize(
    ("stage", "failure"),
    (
        (1, "Offset calibration restore and config fallback both failed verification."),
        (
            2,
            "Power offset calibration restore failed verification; config values verified.",
        ),
    ),
)
def test_stock_snapshot_and_opt_in_restore_reject_actual_enhanced_failures(
    stage: int, failure: str
) -> None:
    lines = log_lines("restore_positive.log", sequence=4)
    lines.append(
        CalibrationLogLine(
            3, 4, 99.0, f"[E][atm90e32] [CALIBRATION][meter_main1] {failure}"
        )
    )
    with pytest.raises(LogEvidenceError, match="restore failed"):
        parse_offset_table_snapshot(
            lines,
            connection_generation=3,
            operation_sequence=4,
            expected_instance_ids={"meter_main1"},
            started_after=10.0,
            offset_stage=stage,
        )
    category = "power_offset" if stage == 2 else "offset"
    with pytest.raises(LogEvidenceError, match="restore failed"):
        parse_restore(
            lines,
            connection_generation=3,
            expected_instance_ids={"meter_main1"},
            started_after=10.0,
            operation_sequence=4,
            expected_categories={"meter_main1": {category}},
            allow_unverified_offset_tables=True,
        )


def test_offset_clear_parser_is_stage_isolated_and_marks_no_stored_as_noop() -> None:
    rows = (
        "[I][atm90e32.button:051] z1. Clear Main Meter 1 Offset Cal",
        "[I][atm90e32:1176] [CALIBRATION][meter_main1] No stored offset calibrations to clear. Current values:",
        "[I][atm90e32:1178] [CALIBRATION][meter_main1] | Phase | offset_voltage | offset_current |",
        "[I][atm90e32:1181] [CALIBRATION][meter_main1] | A | 0 | 0 |",
        "[I][atm90e32:1181] [CALIBRATION][meter_main1] | B | 0 | 0 |",
        "[I][atm90e32:1181] [CALIBRATION][meter_main1] | C | 0 | 0 |",
    )
    lines = [
        CalibrationLogLine(3, 9, 11.0 + index, line) for index, line in enumerate(rows)
    ]

    evidence = parse_offset_clear(
        lines,
        connection_generation=3,
        operation_sequence=9,
        target_instance_id="meter_main1",
        button_name="z1. Clear Main Meter 1 Offset Cal",
        dispatched_after=10.0,
        offset_stage=1,
    )
    assert evidence.no_stored and not evidence.cleared
    assert evidence.phase_values == ((0, 0), (0, 0), (0, 0))

    wrong_stage = [
        CalibrationLogLine(
            item.connection_generation,
            item.operation_sequence,
            item.arrived_at,
            item.line.replace(
                "offset_voltage | offset_current",
                "offset_active_power | offset_reactive_power",
            ),
        )
        for item in lines
    ]
    with pytest.raises(LogEvidenceError, match="another offset stage"):
        parse_offset_clear(
            wrong_stage,
            connection_generation=3,
            operation_sequence=9,
            target_instance_id="meter_main1",
            button_name="z1. Clear Main Meter 1 Offset Cal",
            dispatched_after=10.0,
            offset_stage=1,
        )


@pytest.mark.parametrize(
    "diagnostic",
    (
        "Failed to clear stored offsets!",
        "Failed to save offset calibration to memory!",
        "Offset readback failed for Phase A: expected 0x0000, got 0x0001",
        "Offset calibration failed; rollback readback verification failed.",
        "SPI read mismatch: expected 0x55AA, got 0x0000",
    ),
)
def test_offset_clear_parser_requires_one_clean_clear_terminal(diagnostic: str) -> None:
    rows = (
        "[I][atm90e32.button:051] z1. Clear Main Meter 1 Offset Cal",
        "[I][atm90e32:1188] [CALIBRATION][meter_main1] Clearing stored offset calibrations and restoring config-defined values",
        "[I][atm90e32:1190] [CALIBRATION][meter_main1] | Phase | offset_voltage | offset_current |",
        "[I][atm90e32:1200] [CALIBRATION][meter_main1] | A | 0 | 0 |",
        "[I][atm90e32:1200] [CALIBRATION][meter_main1] | B | 0 | 0 |",
        "[I][atm90e32:1200] [CALIBRATION][meter_main1] | C | 0 | 0 |",
        "[I][atm90e32:1219] [CALIBRATION][meter_main1] Offsets cleared.",
    )
    lines = [
        CalibrationLogLine(3, 9, 11.0 + index, line) for index, line in enumerate(rows)
    ]

    clean = parse_offset_clear(
        lines,
        connection_generation=3,
        operation_sequence=9,
        target_instance_id="meter_main1",
        button_name="z1. Clear Main Meter 1 Offset Cal",
        dispatched_after=10.0,
        offset_stage=1,
    )
    assert clean.cleared and not clean.no_stored

    lines.append(
        CalibrationLogLine(
            3, 9, 99.0, f"[E][atm90e32] [CALIBRATION][meter_main1] {diagnostic}"
        )
    )
    with pytest.raises(LogEvidenceError):
        parse_offset_clear(
            lines,
            connection_generation=3,
            operation_sequence=9,
            target_instance_id="meter_main1",
            button_name="z1. Clear Main Meter 1 Offset Cal",
            dispatched_after=10.0,
            offset_stage=1,
        )


def test_power_clear_rejects_actual_readback_and_clear_requires_ordered_isolated_evidence() -> (
    None
):
    power_rows = (
        "[I][atm90e32.button:052] z2. Clear Main Meter 1 Power Offset Cal",
        "[I][atm90e32:1238] [CALIBRATION][meter_main1] Clearing stored power offsets and restoring config-defined values",
        "[I][atm90e32:1240] [CALIBRATION][meter_main1] | Phase | offset_active_power | offset_reactive_power |",
        "[I][atm90e32:1250] [CALIBRATION][meter_main1] | A | 0 | 0 |",
        "[I][atm90e32:1250] [CALIBRATION][meter_main1] | B | 0 | 0 |",
        "[I][atm90e32:1250] [CALIBRATION][meter_main1] | C | 0 | 0 |",
        "[I][atm90e32:1269] [CALIBRATION][meter_main1] Power offsets cleared.",
    )
    power_lines = [
        CalibrationLogLine(3, 9, 11.0 + index, line)
        for index, line in enumerate(power_rows)
    ]
    power_lines.append(
        CalibrationLogLine(
            3,
            9,
            99.0,
            "[E][atm90e32] [CALIBRATION][meter_main1] Power offset readback failed for Phase A: offset_active_power 1/0",
        )
    )
    with pytest.raises(LogEvidenceError, match="readback"):
        parse_offset_clear(
            power_lines,
            connection_generation=3,
            operation_sequence=9,
            target_instance_id="meter_main1",
            button_name="z2. Clear Main Meter 1 Power Offset Cal",
            dispatched_after=10.0,
            offset_stage=2,
        )

    rows = (
        "[I][atm90e32.button:051] z1. Clear Main Meter 1 Offset Cal",
        "[I][atm90e32:1188] [CALIBRATION][meter_main1] Clearing stored offset calibrations and restoring config-defined values",
        "[I][atm90e32:1219] [CALIBRATION][meter_main1] Offsets cleared.",
        "[I][atm90e32:1190] [CALIBRATION][meter_main1] | Phase | offset_voltage | offset_current |",
        "[I][atm90e32:1200] [CALIBRATION][meter_main1] | A | 0 | 0 |",
        "[I][atm90e32:1200] [CALIBRATION][meter_main1] | B | 0 | 0 |",
        "[I][atm90e32:1200] [CALIBRATION][meter_main1] | C | 0 | 0 |",
    )
    unordered = [
        CalibrationLogLine(3, 9, 11.0 + index, line) for index, line in enumerate(rows)
    ]
    with pytest.raises(LogEvidenceError, match="order"):
        parse_offset_clear(
            unordered,
            connection_generation=3,
            operation_sequence=9,
            target_instance_id="meter_main1",
            button_name="z1. Clear Main Meter 1 Offset Cal",
            dispatched_after=10.0,
            offset_stage=1,
        )
    interleaved = (
        unordered[:2]
        + [
            CalibrationLogLine(
                3,
                9,
                12.5,
                "[I][atm90e32] [CALIBRATION][meter_main1] Power offset calibration saved to memory.",
            )
        ]
        + unordered[2:]
    )
    with pytest.raises(LogEvidenceError):
        parse_offset_clear(
            interleaved,
            connection_generation=3,
            operation_sequence=9,
            target_instance_id="meter_main1",
            button_name="z1. Clear Main Meter 1 Offset Cal",
            dispatched_after=10.0,
            offset_stage=1,
        )


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
    with pytest.raises(LogEvidenceError, match="unexpected restore instance"):
        parse_restore(
            log_lines("restore_positive.log", sequence=0),
            connection_generation=3,
            expected_instance_ids={"addon2_1"},
            started_after=10.0,
        )


@pytest.mark.parametrize(
    ("terminal", "message"),
    (
        (
            "Gain calibration restore failed verification; config values verified.",
            "fell back to config",
        ),
        (
            "Gain calibration restore failed; config readback verification failed.",
            "verification failed",
        ),
    ),
)
def test_restore_rejects_new_gain_fallback_terminals(
    terminal: str, message: str
) -> None:
    lines = [
        CalibrationLogLine(
            3,
            0,
            11.0,
            f"[E] [CALIBRATION][meter_main1] {terminal}",
        )
    ]

    with pytest.raises(LogEvidenceError, match=message):
        parse_restore(
            lines,
            connection_generation=3,
            expected_instance_ids={"meter_main1"},
            started_after=10.0,
        )


@pytest.mark.parametrize(
    "contradiction",
    (
        "[E][atm90e32:1000] Offset calibration restore failed verification; using config values.",
        "[E][atm90e32:1000] [CALIBRATION][meter_main1] [CALIBRATION][meter_main1] Offset calibration restore failed verification; using config values.",
        "[E][atm90e32:1000] [CALIBRATION][meter main1] Offset calibration restore failed verification; using config values.",
        "[E][atm90e32:1000] [CALIBRATION][meter_main2] Offset calibration restore failed verification; using config values.",
    ),
    ids=("untagged-terminal", "duplicate-tag", "malformed-tag", "wrong-tag"),
)
def test_restore_rejects_contradictory_evidence_without_one_expected_instance_tag(
    contradiction: str,
) -> None:
    lines = log_lines("restore_positive.log", sequence=0)
    lines.append(CalibrationLogLine(3, 0, 99.0, contradiction))

    with pytest.raises(LogEvidenceError, match="instance"):
        parse_restore(
            lines,
            connection_generation=3,
            expected_instance_ids={"meter_main1"},
            started_after=10.0,
            operation_sequence=0,
            expected_categories={"meter_main1": {"gain", "offset", "power_offset"}},
        )
