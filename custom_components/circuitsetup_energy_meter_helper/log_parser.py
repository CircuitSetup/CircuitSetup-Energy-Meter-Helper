"""Exact ATM90E32 gain and restore log evidence parsing."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Literal, cast

from .models import Phase

_INSTANCE_RE = re.compile(r"\[CALIBRATION\]\[(?P<instance>[^\]\s]+)\]")
_GAIN_ROW_RE = re.compile(
    r"\|\s*(?P<phase>[ABC])\s*\|\s*"
    r"(?P<measured_voltage>[+-]?\d+(?:\.\d+)?)\s*\|\s*"
    r"(?P<measured_current>[+-]?\d+(?:\.\d+)?)\s*\|\s*"
    r"(?P<reference_voltage>[+-]?\d+(?:\.\d+)?)\s*\|\s*"
    r"(?P<reference_current>[+-]?\d+(?:\.\d+)?)\s*\|\s*"
    r"(?P<old_voltage_gain>\d+)\s*(?:→|->)\s*(?P<new_voltage_gain>\d+)\s*\|\s*"
    r"(?P<old_current_gain>\d+)\s*(?:→|->)\s*(?P<new_current_gain>\d+)\s*\|"
)
_RESTORE_ROW_RE = re.compile(
    r"\|\s*(?P<phase>[ABC])\s*\|\s*(?P<voltage_gain>\d+)\s*\|\s*"
    r"(?P<current_gain>\d+)\s*\|"
)
_COMPARE_ROW_RE = re.compile(
    r"\|\s*(?P<phase>[ABC])\s*\|\s*(?P<config_voltage>\d+)\s*\|\s*"
    r"(?P<flash_voltage>\d+)\s*\|\s*(?P<config_current>\d+)\s*\|\s*"
    r"(?P<flash_current>\d+)\s*\|"
)
_MISMATCH_RE = re.compile(r"Mismatch detected for Phase (?P<phase>[ABC])!")


class LogEvidenceError(ValueError):
    """A correlated ATM90E32 evidence block is absent or contradictory."""


@dataclass(frozen=True, slots=True)
class CalibrationLogLine:
    connection_generation: int
    operation_sequence: int
    arrived_at: float
    line: str


@dataclass(frozen=True, slots=True)
class PhaseGainEvidence:
    phase: Phase
    measured_voltage: float
    measured_current: float
    reference_voltage: float
    reference_current: float
    old_voltage_gain: int
    new_voltage_gain: int
    old_current_gain: int
    new_current_gain: int


@dataclass(frozen=True, slots=True)
class GainRunEvidence:
    connection_generation: int
    operation_sequence: int
    instance_id: str
    phases: tuple[PhaseGainEvidence, PhaseGainEvidence, PhaseGainEvidence]
    flash_saved: bool
    register_mismatch_phases: tuple[Phase, ...]
    calibration_disabled: bool
    matching_lines: tuple[str, ...]

    @property
    def immediate_apply_acceptable(self) -> bool:
        return (
            self.flash_saved
            and not self.register_mismatch_phases
            and not self.calibration_disabled
        )


@dataclass(frozen=True, slots=True)
class RestoreEvidence:
    connection_generation: int
    instance_id: str
    phase_gains: tuple[tuple[int, int], tuple[int, int], tuple[int, int]]
    source: Literal["flash", "config", "unknown"]
    register_verified: bool
    verification_basis: Literal["positive_loaded_line", "verified_config_flash_table"]
    config_differs_from_flash: bool
    matching_lines: tuple[str, ...]


def parse_gain_run(
    lines: list[CalibrationLogLine] | tuple[CalibrationLogLine, ...],
    *,
    connection_generation: int,
    operation_sequence: int,
    target_instance_id: str,
    button_name: str,
    dispatched_after: float,
) -> GainRunEvidence:
    """Parse one post-dispatch, generation-local gain operation."""
    matching = sorted(
        (
            item
            for item in lines
            if item.connection_generation == connection_generation
            and item.operation_sequence == operation_sequence
            and item.arrived_at > dispatched_after
        ),
        key=lambda item: item.arrived_at,
    )
    button_index = next(
        (index for index, item in enumerate(matching) if button_name in item.line), None
    )
    if button_index is None:
        raise LogEvidenceError("matching Run Gain button line is missing")

    def is_header(item: CalibrationLogLine) -> bool:
        return "Gain Calibration" in item.line and "====" in item.line

    def is_evidence(item: CalibrationLogLine) -> bool:
        return (
            is_header(item)
            or _GAIN_ROW_RE.search(item.line) is not None
            or "gain calibration saved to memory" in item.line.casefold()
            or "failed to save gain calibration to memory" in item.line.casefold()
            or "Mismatch detected for Phase" in item.line
        )

    for item in matching[button_index + 1 :]:
        instance = _instance(item.line)
        if instance is not None and instance != target_instance_id:
            raise LogEvidenceError("interleaved ATM90E32 instance in operation window")
        if is_evidence(item) and instance != target_instance_id:
            raise LogEvidenceError("gain evidence is missing the target instance tag")
    header_indices = [
        index
        for index in range(button_index + 1, len(matching))
        if is_header(matching[index])
    ]
    if not header_indices:
        raise LogEvidenceError("matching gain calibration header is missing")
    if len(header_indices) != 1:
        raise LogEvidenceError("gain operation has duplicate headers")
    header_index = header_indices[0]
    if _instance(matching[header_index].line) != target_instance_id:
        raise LogEvidenceError("interleaved ATM90E32 instance in operation window")
    if any(is_evidence(item) for item in matching[button_index + 1 : header_index]):
        raise LogEvidenceError("gain evidence appeared before the target header")

    block = matching[button_index:]
    calibration_disabled = any(
        "Gain calibration is disabled" in item.line for item in block
    )
    phase_rows: dict[Phase, PhaseGainEvidence] = {}
    save_results: list[bool] = []
    mismatches: list[Phase] = []
    terminal_seen = False
    for item in matching[header_index:]:
        row = _GAIN_ROW_RE.search(item.line)
        if row:
            if terminal_seen:
                raise LogEvidenceError("gain row appeared after the save result")
            phase = cast(Phase, row.group("phase"))
            if phase in phase_rows:
                raise LogEvidenceError(f"duplicate gain row for phase {phase}")
            values = tuple(
                float(row.group(name))
                for name in (
                    "measured_voltage",
                    "measured_current",
                    "reference_voltage",
                    "reference_current",
                )
            )
            if not all(math.isfinite(value) for value in values):
                raise LogEvidenceError("gain row contains a non-finite value")
            measured_voltage, measured_current, reference_voltage, reference_current = (
                values
            )
            phase_rows[phase] = PhaseGainEvidence(
                phase,
                measured_voltage,
                measured_current,
                reference_voltage,
                reference_current,
                int(row.group("old_voltage_gain")),
                int(row.group("new_voltage_gain")),
                int(row.group("old_current_gain")),
                int(row.group("new_current_gain")),
            )
        if "Gain calibration saved to memory." in item.line:
            save_results.append(True)
            terminal_seen = True
        elif "Failed to save gain calibration to memory!" in item.line:
            save_results.append(False)
            terminal_seen = True
        if mismatch := _MISMATCH_RE.search(item.line):
            mismatches.append(cast(Phase, mismatch.group("phase")))
    if set(phase_rows) != {"A", "B", "C"}:
        raise LogEvidenceError("gain evidence must contain exactly phases A, B, and C")
    if not save_results:
        raise LogEvidenceError("gain save result is missing")
    if len(save_results) != 1:
        raise LogEvidenceError("gain save result is duplicate or contradictory")
    phases = cast(
        tuple[PhaseGainEvidence, PhaseGainEvidence, PhaseGainEvidence],
        tuple(phase_rows[phase] for phase in ("A", "B", "C")),
    )
    return GainRunEvidence(
        connection_generation,
        operation_sequence,
        target_instance_id,
        phases,
        save_results[0],
        tuple(dict.fromkeys(mismatches)),
        calibration_disabled,
        tuple(item.line for item in block),
    )


def parse_restore(
    lines: list[CalibrationLogLine] | tuple[CalibrationLogLine, ...],
    *,
    connection_generation: int,
    expected_instance_ids: set[str],
    started_after: float,
) -> dict[str, RestoreEvidence]:
    """Parse verified flash restore evidence for every expected instance."""
    matching = sorted(
        (
            item
            for item in lines
            if item.connection_generation == connection_generation
            and item.arrived_at > started_after
        ),
        key=lambda item: item.arrived_at,
    )
    evidence: dict[str, RestoreEvidence] = {}
    restore_terms = (
        "Restoring saved gain calibrations to registers",
        "Gain calibration loaded and verified successfully.",
        "Gain mismatch: using flash values",
        "No stored gain calibrations found",
        "Gain calibration is disabled",
        "Gain verification failed!",
    )
    observed_instance_ids = {
        instance_id
        for item in matching
        if any(term in item.line for term in restore_terms)
        if (instance_id := _instance(item.line)) is not None
    }
    for instance_id in expected_instance_ids | observed_instance_ids:
        instance_lines = [
            item for item in matching if _instance(item.line) == instance_id
        ]
        if any("Gain verification failed!" in item.line for item in instance_lines):
            raise LogEvidenceError(f"{instance_id}: gain verification failed")
        if any(
            "No stored gain calibrations found" in item.line
            or "Gain calibration is disabled" in item.line
            for item in instance_lines
        ):
            raise LogEvidenceError(f"{instance_id}: restore fell back to config")

        positive = any(
            "Gain calibration loaded and verified successfully." in item.line
            for item in instance_lines
        )
        restore_block = _gain_table(
            instance_lines, "Restoring saved gain calibrations to registers"
        )
        compare_block = _gain_table(instance_lines, "Gain mismatch: using flash values")
        restored_rows = (
            _phase_pairs(restore_block, _RESTORE_ROW_RE)
            if restore_block is not None
            else None
        )
        compared_rows = (
            _comparison_rows(compare_block) if compare_block is not None else None
        )
        if positive and restored_rows is not None:
            phase_gains = restored_rows
            basis: Literal["positive_loaded_line", "verified_config_flash_table"] = (
                "positive_loaded_line"
            )
            differs = False
        elif compared_rows is not None and any(
            "Gain mismatch: using flash values" in item.line for item in instance_lines
        ):
            phase_gains, differs = compared_rows
            basis = "verified_config_flash_table"
        else:
            raise LogEvidenceError(f"missing restore evidence for {instance_id}")
        evidence[instance_id] = RestoreEvidence(
            connection_generation,
            instance_id,
            phase_gains,
            "flash",
            True,
            basis,
            differs,
            tuple(item.line for item in instance_lines),
        )
    return evidence


def _instance(line: str) -> str | None:
    match = _INSTANCE_RE.search(line)
    return match.group("instance") if match else None


def _gain_table(
    lines: list[CalibrationLogLine], header: str
) -> list[CalibrationLogLine] | None:
    headers = [index for index, item in enumerate(lines) if header in item.line]
    if not headers:
        return None
    if len(headers) != 1:
        raise LogEvidenceError(f"duplicate gain table header: {header}")
    block: list[CalibrationLogLine] = []
    for item in lines[headers[0] + 1 :]:
        if "====" in item.line:
            break
        block.append(item)
    normalized = [re.sub(r"\s+", "", item.line) for item in block]
    if not any("|Phase|voltage_gain|current_gain|" in line for line in normalized):
        raise LogEvidenceError(f"gain table columns are missing: {header}")
    if "mismatch" in header.casefold() and not any(
        "|config|flash|config|flash|" in line for line in normalized
    ):
        raise LogEvidenceError(f"gain comparison columns are missing: {header}")
    return block


def _phase_pairs(
    lines: list[CalibrationLogLine], pattern: re.Pattern[str]
) -> tuple[tuple[int, int], tuple[int, int], tuple[int, int]] | None:
    rows: dict[str, tuple[int, int]] = {}
    for item in lines:
        if match := pattern.search(item.line):
            phase = match.group("phase")
            if phase in rows:
                raise LogEvidenceError(f"duplicate restore row for phase {phase}")
            rows[phase] = (
                int(match.group("voltage_gain")),
                int(match.group("current_gain")),
            )
    if set(rows) != {"A", "B", "C"}:
        return None
    return cast(
        tuple[tuple[int, int], tuple[int, int], tuple[int, int]],
        tuple(rows[phase] for phase in ("A", "B", "C")),
    )


def _comparison_rows(
    lines: list[CalibrationLogLine],
) -> tuple[tuple[tuple[int, int], tuple[int, int], tuple[int, int]], bool] | None:
    rows: dict[str, tuple[int, int]] = {}
    differs = False
    for item in lines:
        if match := _COMPARE_ROW_RE.search(item.line):
            phase = match.group("phase")
            if phase in rows:
                raise LogEvidenceError(f"duplicate restore row for phase {phase}")
            config = (
                int(match.group("config_voltage")),
                int(match.group("config_current")),
            )
            flash = (
                int(match.group("flash_voltage")),
                int(match.group("flash_current")),
            )
            rows[phase] = flash
            differs = differs or config != flash
    if set(rows) != {"A", "B", "C"}:
        return None
    return (
        cast(
            tuple[tuple[int, int], tuple[int, int], tuple[int, int]],
            tuple(rows[phase] for phase in ("A", "B", "C")),
        ),
        differs,
    )
