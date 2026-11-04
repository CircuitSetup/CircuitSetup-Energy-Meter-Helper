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
    parse_gain_run,
    parse_offset_table_snapshot,
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
    # Only the API button dispatch is supplied here; all result lines come from C++.
    lines = ("[D][atm90e32.button] 3. Run Main Meter 1 Gain Cal", *_raw(root, filename))
    return parse_gain_run(
        _correlated(lines),
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


@pytest.mark.parametrize("stage", (1, 2))
def test_real_firmware_gain_clear_preserves_reported_offset_tables(
    firmware_logs: Path, stage: int
) -> None:
    lines = _raw(firmware_logs, "gain_clear.log")
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
