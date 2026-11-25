"""Replay logs from ESPHome's real ATM90E32 host code through the Helper."""

import os
from pathlib import Path

import pytest

from custom_components.circuitsetup_energy_meter_helper.esphome_api import (
    sanitize_control_text,
)
from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    CalibrationLogLine,
    LogEvidenceError,
    parse_calibration_sources,
    parse_gain_clear,
    parse_gain_run,
    parse_offset_clear,
    parse_offset_run,
    parse_offset_table_snapshot,
    parse_power_offset_run,
    parse_restore,
)


@pytest.fixture
def firmware_logs() -> Path:
    directory = os.environ.get("ATM90E32_CONTRACT_LOG_DIR")
    if not directory:
        pytest.skip("requires ESPHome dev host-test transcripts")
    root = Path(directory)
    assert root.is_dir(), "ESPHome host-test transcript directory is missing"
    return root


def _raw(root: Path, filename: str) -> tuple[str, ...]:
    lines = tuple(
        sanitize_control_text(line).strip()
        for line in (root / filename).read_text(encoding="utf-8").splitlines()
    )
    assert lines, f"empty firmware transcript: {filename}"
    return lines


def _correlated(lines: tuple[str, ...]) -> tuple[CalibrationLogLine, ...]:
    return tuple(
        CalibrationLogLine(3, 8, 11.0 + index, line) for index, line in enumerate(lines)
    )


def _gain(root: Path, filename: str):
    return parse_gain_run(
        _correlated(_raw(root, filename)),
        connection_generation=3,
        operation_sequence=8,
        target_instance_id="meter_main1",
        button_name="3. Run Main Meter 1 Gain Cal",
        dispatched_after=10.0,
    )


def test_real_firmware_gain_run_reports_exact_verified_writes(
    firmware_logs: Path,
) -> None:
    evidence = _gain(firmware_logs, "gain_success.log")

    assert evidence.immediate_apply_acceptable
    assert tuple(
        (phase.new_voltage_gain, phase.new_current_gain) for phase in evidence.phases
    ) == ((1440, 800), (1444, 802), (1449, 804))


@pytest.mark.parametrize("filename", ("gain_success_dump.log", "gain_restore.log"))
def test_real_firmware_dump_reports_exact_saved_gains(
    firmware_logs: Path, filename: str
) -> None:
    evidence = parse_restore(
        _correlated(_raw(firmware_logs, filename)),
        connection_generation=3,
        expected_instance_ids={"meter_main1"},
        started_after=10.0,
    )["meter_main1"]

    assert evidence.source == "flash" and evidence.register_verified
    assert evidence.phase_gains == ((1440, 800), (1444, 802), (1449, 804))


def test_real_firmware_failed_rollback_is_rejected(firmware_logs: Path) -> None:
    with pytest.raises(LogEvidenceError, match="rollback readback"):
        _gain(firmware_logs, "gain_rollback_failure.log")


def test_real_firmware_later_dump_cannot_hide_failed_rollback(
    firmware_logs: Path,
) -> None:
    lines = _raw(firmware_logs, "gain_rollback_dump.log")

    assert parse_calibration_sources(lines, {"meter_main1"})["meter_main1"] != "flash"
    with pytest.raises(LogEvidenceError):
        parse_restore(
            _correlated(lines),
            connection_generation=3,
            expected_instance_ids={"meter_main1"},
            started_after=10.0,
        )


def test_real_firmware_failed_restore_invalidates_gain_evidence(
    firmware_logs: Path,
) -> None:
    lines = _raw(firmware_logs, "gain_restore.log") + _raw(
        firmware_logs, "gain_restore_failure.log"
    )
    assert parse_calibration_sources(lines, {"meter_main1"}) == {
        "meter_main1": "unknown"
    }
    with pytest.raises(LogEvidenceError, match="verification failed"):
        parse_restore(
            _correlated(lines),
            connection_generation=3,
            expected_instance_ids={"meter_main1"},
            started_after=10.0,
        )


def test_real_firmware_reconnect_with_all_three_saved_tables(
    firmware_logs: Path,
) -> None:
    lines = _raw(firmware_logs, "restore_all.log")
    offset_verified = any(
        line.endswith("Offset calibration restore verified.") for line in lines
    )
    power_verified = any(
        line.endswith("Power offset calibration restore verified.") for line in lines
    )
    restored = parse_restore(
        _correlated(lines),
        connection_generation=3,
        operation_sequence=8,
        started_after=10.0,
        expected_instance_ids={"meter_main1"},
        expected_categories={"meter_main1": {"gain", "offset", "power_offset"}},
        # Upstream dev before #22281 omits offset verification in subscription dumps.
        allow_unverified_offset_tables=not (offset_verified and power_verified),
    )["meter_main1"]
    assert restored.phase_gains == ((1440, 800), (1444, 802), (1449, 804))
    assert (
        restored.phase_offsets
        == restored.phase_power_offsets
        == ((11, -21), (12, -22), (13, -23))
    )
    assert restored.offset_register_verified == offset_verified
    assert restored.power_offset_register_verified == power_verified


@pytest.mark.parametrize("stage", (1, 2))
def test_real_firmware_gain_clear_preserves_reported_offset_tables(
    firmware_logs: Path, stage: int
) -> None:
    lines = _raw(firmware_logs, "gain_clear_dump.log")
    snapshot = parse_offset_table_snapshot(
        _correlated(lines),
        connection_generation=3,
        operation_sequence=8,
        expected_instance_ids={"meter_main1"},
        started_after=10.0,
        offset_stage=stage,
    )["meter_main1"]

    assert parse_calibration_sources(lines, {"meter_main1"})["meter_main1"] != "flash"
    assert parse_calibration_sources(lines, {"meter_main1"}, offset_stage=stage) == {
        "meter_main1": "flash"
    }
    assert snapshot is not None and snapshot.reported_state == "restored"
    assert snapshot.phase_values == ((11, -21), (12, -22), (13, -23))
    # Older firmware omits restore-verification markers; either format must preserve the table.


def test_real_firmware_gain_clear_button(firmware_logs: Path) -> None:
    lines = _raw(firmware_logs, "gain_clear.log")

    def clear() -> bool:
        return parse_gain_clear(
            list(_correlated(lines)),
            target_instance_id="meter_main1",
            button_name="z3. Clear Main Meter 1 Gain Cal",
            expected_phase_gains=((7305, 27961),) * 3,
            allow_already_empty=False,
        )

    if any(
        line.endswith("Gain calibrations cleared; config values verified.")
        for line in lines
    ):
        assert clear()
    else:
        # Earlier firmware prints the replacement values before writing the chip.
        with pytest.raises(
            LogEvidenceError, match="gain clear verification is missing"
        ):
            clear()


@pytest.mark.parametrize("stage", (1, 2))
def test_real_firmware_offset_buttons(firmware_logs: Path, stage: int) -> None:
    prefix = "offset" if stage == 1 else "power_offset"
    name = "Main Meter 1 Offset Cal" if stage == 1 else "Main Meter 1 Power Offset Cal"
    correlation = {
        "connection_generation": 3,
        "operation_sequence": 8,
        "target_instance_id": "meter_main1",
        "dispatched_after": 10.0,
    }
    cleared = parse_offset_clear(
        _correlated(_raw(firmware_logs, f"{prefix}_clear.log")),
        button_name=f"z{stage}. Clear {name}",
        offset_stage=stage,
        **correlation,
    )
    assert cleared.cleared and cleared.phase_values == ((0, 0),) * 3

    lines = _correlated(_raw(firmware_logs, f"{prefix}_run.log"))
    if stage == 1:
        run = parse_offset_run(lines, button_name=f"1. Run {name}", **correlation)
        assert [(p.voltage_offset, p.current_offset) for p in run.phases] == [
            (-1, -4),
            (-2, -5),
            (-3, -6),
        ]
    else:
        run = parse_power_offset_run(lines, button_name=f"2. Run {name}", **correlation)
        assert [
            (p.active_power_offset, p.reactive_power_offset) for p in run.phases
        ] == [(-7, -10), (-8, -11), (-9, -12)]
    assert run.flash_saved and run.register_verified
