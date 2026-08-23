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
_BUTTON_RE = re.compile(
    r"\[[^\]]*atm90e32\.button[^\]]*\]\s*(?P<button>.+?)\s*$"
)
_OFFSET_ROW_RE = re.compile(
    r"\|\s*(?P<phase>[ABC])\s*\|\s*(?P<voltage>[+-]?\d+)\s*\|\s*"
    r"(?P<current>[+-]?\d+)\s*\|\s*$"
)
_POWER_OFFSET_ROW_RE = re.compile(
    r"\|\s*(?P<phase>[ABC])\s*\|\s*(?P<active>[+-]?\d+)\s*\|\s*"
    r"(?P<reactive>[+-]?\d+)\s*\|\s*$"
)
_OFFSET_COMPARE_ROW_RE = re.compile(
    r"\|\s*(?P<phase>[ABC])\s*\|\s*(?P<config_voltage>[+-]?\d+)\s*\|\s*"
    r"(?P<flash_voltage>[+-]?\d+)\s*\|\s*(?P<config_current>[+-]?\d+)\s*\|\s*"
    r"(?P<flash_current>[+-]?\d+)\s*\|\s*$"
)
_POWER_OFFSET_COMPARE_ROW_RE = re.compile(
    r"\|\s*(?P<phase>[ABC])\s*\|\s*(?P<config_active>[+-]?\d+)\s*\|\s*"
    r"(?P<flash_active>[+-]?\d+)\s*\|\s*(?P<config_reactive>[+-]?\d+)\s*\|\s*"
    r"(?P<flash_reactive>[+-]?\d+)\s*\|\s*$"
)
_SIGNED_ROW_LIKE_RE = re.compile(r"\|\s*[A-Za-z]\s*\|\s*[+-]?\d+")
_OFFSET_READBACK_RE = re.compile(r"Offset readback failed for Phase (?P<phase>[ABC]):")
_POWER_OFFSET_READBACK_RE = re.compile(
    r"Power offset readback failed for Phase (?P<phase>[ABC]):"
)


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
class PhaseOffsetEvidence:
    phase: Phase
    voltage_offset: int
    current_offset: int


@dataclass(frozen=True, slots=True)
class OffsetRunEvidence:
    connection_generation: int
    operation_sequence: int
    instance_id: str
    phases: tuple[PhaseOffsetEvidence, PhaseOffsetEvidence, PhaseOffsetEvidence]
    flash_saved: bool
    register_verified: bool
    matching_lines: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class PhasePowerOffsetEvidence:
    phase: Phase
    active_power_offset: int
    reactive_power_offset: int


@dataclass(frozen=True, slots=True)
class PowerOffsetRunEvidence:
    connection_generation: int
    operation_sequence: int
    instance_id: str
    phases: tuple[
        PhasePowerOffsetEvidence,
        PhasePowerOffsetEvidence,
        PhasePowerOffsetEvidence,
    ]
    flash_saved: bool
    register_verified: bool
    matching_lines: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class RestoreEvidence:
    connection_generation: int
    instance_id: str
    phase_gains: tuple[tuple[int, int], tuple[int, int], tuple[int, int]] | None
    source: Literal["flash", "config", "unknown"]
    register_verified: bool
    verification_basis: Literal[
        "positive_loaded_line", "verified_config_flash_table", "offset_tables"
    ]
    config_differs_from_flash: bool
    matching_lines: tuple[str, ...]
    phase_offsets: tuple[tuple[int, int], tuple[int, int], tuple[int, int]] | None = (
        None
    )
    phase_power_offsets: (
        tuple[tuple[int, int], tuple[int, int], tuple[int, int]] | None
    ) = None
    offset_register_verified: bool = False
    power_offset_register_verified: bool = False
    offset_config_differs_from_flash: bool = False
    power_offset_config_differs_from_flash: bool = False


def parse_calibration_sources(
    lines: tuple[str, ...], expected_instance_ids: set[str]
) -> dict[str, Literal["flash", "configuration", "unknown"]]:
    """Detect the currently active gain source from ATM90E32 status logs."""
    sources: dict[str, Literal["flash", "configuration", "unknown"]] = {
        instance_id: "unknown" for instance_id in expected_instance_ids
    }
    for line in lines:
        instance_id = _instance(line)
        if instance_id not in sources:
            continue
        if any(
            term in line
            for term in (
                "Gain calibration loaded and verified successfully.",
                "Gain mismatch: using flash values",
                "Restoring saved gain calibrations to registers",
            )
        ):
            sources[instance_id] = "flash"
        elif "No stored gain calibrations found" in line or (
            "Gain calibration is disabled" in line
        ):
            sources[instance_id] = "configuration"
    return dict(sorted(sources.items()))


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


def parse_offset_run(
    lines: list[CalibrationLogLine] | tuple[CalibrationLogLine, ...],
    *,
    connection_generation: int,
    operation_sequence: int,
    target_instance_id: str,
    button_name: str,
    dispatched_after: float,
) -> OffsetRunEvidence:
    """Parse one strictly correlated voltage/current offset operation."""
    rows, matching = _parse_offset_operation(
        lines,
        connection_generation=connection_generation,
        operation_sequence=operation_sequence,
        target_instance_id=target_instance_id,
        button_name=button_name,
        dispatched_after=dispatched_after,
        power=False,
    )
    phases = cast(
        tuple[PhaseOffsetEvidence, PhaseOffsetEvidence, PhaseOffsetEvidence],
        tuple(
            PhaseOffsetEvidence(phase, values[0], values[1])
            for phase, values in rows
        ),
    )
    return OffsetRunEvidence(
        connection_generation,
        operation_sequence,
        target_instance_id,
        phases,
        True,
        True,
        matching,
    )


def parse_power_offset_run(
    lines: list[CalibrationLogLine] | tuple[CalibrationLogLine, ...],
    *,
    connection_generation: int,
    operation_sequence: int,
    target_instance_id: str,
    button_name: str,
    dispatched_after: float,
) -> PowerOffsetRunEvidence:
    """Parse one strictly correlated active/reactive power-offset operation."""
    rows, matching = _parse_offset_operation(
        lines,
        connection_generation=connection_generation,
        operation_sequence=operation_sequence,
        target_instance_id=target_instance_id,
        button_name=button_name,
        dispatched_after=dispatched_after,
        power=True,
    )
    phases = cast(
        tuple[
            PhasePowerOffsetEvidence,
            PhasePowerOffsetEvidence,
            PhasePowerOffsetEvidence,
        ],
        tuple(
            PhasePowerOffsetEvidence(phase, values[0], values[1])
            for phase, values in rows
        ),
    )
    return PowerOffsetRunEvidence(
        connection_generation,
        operation_sequence,
        target_instance_id,
        phases,
        True,
        True,
        matching,
    )


def _parse_offset_operation(
    lines: list[CalibrationLogLine] | tuple[CalibrationLogLine, ...],
    *,
    connection_generation: int,
    operation_sequence: int,
    target_instance_id: str,
    button_name: str,
    dispatched_after: float,
    power: bool,
) -> tuple[tuple[tuple[Phase, tuple[int, int]], ...], tuple[str, ...]]:
    kind = "power offset" if power else "offset"
    title = "Power Offset Calibration" if power else "Offset Calibration"
    columns = (
        "|Phase|offset_active_power|offset_reactive_power|"
        if power
        else "|Phase|offset_voltage|offset_current|"
    )
    row_pattern = _POWER_OFFSET_ROW_RE if power else _OFFSET_ROW_RE
    value_names = ("active", "reactive") if power else ("voltage", "current")
    saved = (
        "Power offset calibration saved to memory."
        if power
        else "Offset calibration saved to memory."
    )
    save_failed = (
        "Failed to save power offset calibration to memory!"
        if power
        else "Failed to save offset calibration to memory!"
    )
    completed = (
        "Power offset calibration completed and verified."
        if power
        else "Offset calibration completed and verified."
    )
    failed = (
        "Power offset calibration failed; previous values restored."
        if power
        else "Offset calibration failed; previous values restored."
    )
    readback_pattern = _POWER_OFFSET_READBACK_RE if power else _OFFSET_READBACK_RE

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
    button_indices = [
        index
        for index, item in enumerate(matching)
        if _button_text(item.line) == button_name
    ]
    if not button_indices:
        raise LogEvidenceError(f"matching {kind} button line is missing")
    if len(button_indices) != 1:
        raise LogEvidenceError(f"matching {kind} button line is duplicate")
    button_index = button_indices[0]
    if any(
        (found := _button_text(item.line)) is not None and found != button_name
        for item in matching
    ):
        raise LogEvidenceError(f"wrong button interleaved with {kind} operation")

    def is_header(item: CalibrationLogLine) -> bool:
        return title in item.line and "====" in item.line

    evidence_terms = (saved, save_failed, completed, failed)

    def is_evidence(item: CalibrationLogLine) -> bool:
        normalized = re.sub(r"\s+", "", item.line)
        return (
            is_header(item)
            or columns in normalized
            or row_pattern.search(item.line) is not None
            or any(item.line.endswith(term) for term in evidence_terms)
            or readback_pattern.search(item.line) is not None
        )

    if any(is_evidence(item) for item in matching[:button_index]):
        raise LogEvidenceError(f"{kind} evidence appeared before the matching button")
    for item in matching[button_index + 1 :]:
        instance = _instance(item.line)
        if instance is not None and instance != target_instance_id:
            raise LogEvidenceError("interleaved ATM90E32 instance in operation window")
        if is_evidence(item) and instance != target_instance_id:
            raise LogEvidenceError(f"{kind} evidence is missing the target instance tag")

    header_indices = [
        index
        for index in range(button_index + 1, len(matching))
        if is_header(matching[index])
    ]
    if not header_indices:
        raise LogEvidenceError(f"matching {kind} calibration header is missing")
    if len(header_indices) != 1:
        raise LogEvidenceError(f"{kind} operation has duplicate headers")
    header_index = header_indices[0]
    if any(is_evidence(item) for item in matching[button_index + 1 : header_index]):
        raise LogEvidenceError(f"{kind} evidence appeared before the target header")

    block = matching[button_index:]
    normalized = [re.sub(r"\s+", "", item.line) for item in matching[header_index:]]
    if sum(columns in line for line in normalized) != 1:
        raise LogEvidenceError(f"{kind} table columns are missing or duplicate")

    final_indices = [
        index
        for index in range(header_index, len(matching))
        if matching[index].line.endswith((completed, failed))
    ]
    if len(final_indices) != 1:
        raise LogEvidenceError(f"{kind} terminal result is missing or multiple")
    final_index = final_indices[0]

    phase_rows: dict[Phase, tuple[int, int]] = {}
    for index, item in enumerate(matching[header_index:], start=header_index):
        row = row_pattern.search(item.line)
        if row:
            if index > final_index:
                raise LogEvidenceError(f"{kind} row appeared after the terminal result")
            phase = cast(Phase, row.group("phase"))
            if phase in phase_rows:
                raise LogEvidenceError(f"duplicate {kind} row for phase {phase}")
            phase_rows[phase] = (
                _signed_16(row.group(value_names[0]), kind),
                _signed_16(row.group(value_names[1]), kind),
            )
        elif _SIGNED_ROW_LIKE_RE.search(item.line):
            raise LogEvidenceError(f"malformed or extra {kind} row")
    if set(phase_rows) != {"A", "B", "C"}:
        raise LogEvidenceError(f"{kind} evidence must contain exactly phases A, B, and C")

    save_successes = [
        item for item in matching[header_index:] if item.line.endswith(saved)
    ]
    save_failures = [
        item for item in matching[header_index:] if item.line.endswith(save_failed)
    ]
    mismatches = [
        item
        for item in matching[header_index:]
        if readback_pattern.search(item.line) is not None
    ]
    final_line = matching[final_index].line
    if final_line.endswith(failed):
        if save_failures:
            raise LogEvidenceError(f"{kind} save failure terminal")
        if mismatches:
            raise LogEvidenceError(f"{kind} register mismatch terminal")
        raise LogEvidenceError(f"{kind} failure terminal")
    if save_failures:
        raise LogEvidenceError(f"{kind} save failure contradicts success terminal")
    if mismatches:
        raise LogEvidenceError(f"{kind} register mismatch contradicts success terminal")
    if len(save_successes) != 1:
        raise LogEvidenceError(f"{kind} save result is missing or duplicate")
    if matching.index(save_successes[0]) > final_index:
        raise LogEvidenceError(f"{kind} save result followed the success terminal")

    return (
        tuple((phase, phase_rows[phase]) for phase in ("A", "B", "C")),
        tuple(item.line for item in block),
    )


def parse_restore(
    lines: list[CalibrationLogLine] | tuple[CalibrationLogLine, ...],
    *,
    connection_generation: int,
    expected_instance_ids: set[str],
    started_after: float,
    expected_categories: dict[
        str, set[Literal["gain", "offset", "power_offset"]]
    ]
    | None = None,
) -> dict[str, RestoreEvidence]:
    """Parse verified flash restore evidence for every expected category."""
    if expected_categories is None:
        expected_categories = {
            instance_id: {"gain"} for instance_id in expected_instance_ids
        }
    elif set(expected_categories) != expected_instance_ids:
        raise ValueError("restore category instances must match expected instances")
    allowed_categories = {"gain", "offset", "power_offset"}
    if any(
        not categories or not categories <= allowed_categories
        for categories in expected_categories.values()
    ):
        raise ValueError("restore categories must be gain, offset, or power_offset")

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
        "Restored offset calibration from memory",
        "Restored power offset calibration from memory",
        "Offset mismatch: using flash values",
        "Power offset mismatch: using flash values",
        "Offset calibration restore verified.",
        "Power offset calibration restore verified.",
        "No stored offset calibrations found",
        "No stored power offsets found",
        "offset restore failed verification",
        "Offset calibration restore failed verification",
    )
    observed_instance_ids = {
        instance_id
        for item in matching
        if (
            any(term in item.line for term in restore_terms)
            or _RESTORE_ROW_RE.search(item.line) is not None
            or _COMPARE_ROW_RE.search(item.line) is not None
            or _OFFSET_ROW_RE.search(item.line) is not None
            or _POWER_OFFSET_ROW_RE.search(item.line) is not None
            or _OFFSET_COMPARE_ROW_RE.search(item.line) is not None
            or _POWER_OFFSET_COMPARE_ROW_RE.search(item.line) is not None
            or "|Phase|voltage_gain|current_gain|" in re.sub(r"\s+", "", item.line)
        )
        if (instance_id := _instance(item.line)) is not None
    }
    for instance_id in expected_instance_ids | observed_instance_ids:
        instance_lines = [
            item for item in matching if _instance(item.line) == instance_id
        ]
        categories = expected_categories.get(instance_id, {"gain"})
        gain_expected = "gain" in categories
        if gain_expected and any(
            "Gain verification failed!" in item.line for item in instance_lines
        ):
            raise LogEvidenceError(f"{instance_id}: gain verification failed")
        if gain_expected and any(
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
            basis: Literal[
                "positive_loaded_line",
                "verified_config_flash_table",
                "offset_tables",
            ] = "positive_loaded_line"
            differs = False
        elif compared_rows is not None and any(
            "Gain mismatch: using flash values" in item.line for item in instance_lines
        ):
            phase_gains, differs = compared_rows
            basis = "verified_config_flash_table"
        elif not gain_expected:
            phase_gains = None
            basis = "offset_tables"
            differs = False
        else:
            if instance_id not in expected_instance_ids:
                raise LogEvidenceError(
                    f"unexpected incomplete restore evidence for {instance_id}"
                )
            raise LogEvidenceError(f"missing restore evidence for {instance_id}")

        phase_offsets, offset_verified, offset_differs = _restore_offset_category(
            instance_lines,
            expected="offset" in categories,
            power=False,
            instance_id=instance_id,
        )
        phase_power_offsets, power_verified, power_differs = (
            _restore_offset_category(
                instance_lines,
                expected="power_offset" in categories,
                power=True,
                instance_id=instance_id,
            )
        )
        evidence[instance_id] = RestoreEvidence(
            connection_generation,
            instance_id,
            phase_gains,
            "flash",
            True,
            basis,
            differs,
            tuple(item.line for item in instance_lines),
            phase_offsets,
            phase_power_offsets,
            offset_verified,
            power_verified,
            offset_differs,
            power_differs,
        )
    return evidence


def _instance(line: str) -> str | None:
    match = _INSTANCE_RE.search(line)
    return match.group("instance") if match else None


def _button_text(line: str) -> str | None:
    match = _BUTTON_RE.search(line)
    return match.group("button") if match else None


def _signed_16(value: str, context: str) -> int:
    parsed = int(value)
    if not -32768 <= parsed <= 32767:
        raise LogEvidenceError(f"{context} value is outside signed 16-bit range")
    return parsed


def _restore_offset_category(
    lines: list[CalibrationLogLine],
    *,
    expected: bool,
    power: bool,
    instance_id: str,
) -> tuple[
    tuple[tuple[int, int], tuple[int, int], tuple[int, int]] | None, bool, bool
]:
    kind = "power offset" if power else "offset"
    positive_header = (
        "Restored power offset calibration from memory"
        if power
        else "Restored offset calibration from memory"
    )
    mismatch_header = (
        "Power offset mismatch: using flash values"
        if power
        else "Offset mismatch: using flash values"
    )
    columns = (
        "|Phase|offset_active_power|offset_reactive_power|"
        if power
        else "|Phase|offset_voltage|offset_current|"
    )
    verified_term = (
        "Power offset calibration restore verified."
        if power
        else "Offset calibration restore verified."
    )
    fallback_term = (
        "No stored power offsets found"
        if power
        else "No stored offset calibrations found"
    )
    failure_terms = (
        ("Power offset restore failed verification", "Power offset readback failed")
        if power
        else (
            "Offset calibration restore failed verification",
            "Offset readback failed",
        )
    )
    disabled = "Power & Voltage/Current offset calibration is disabled"
    category_observed = any(
        positive_header in item.line
        or mismatch_header in item.line
        or item.line.endswith(verified_term)
        or fallback_term in item.line
        or any(term in item.line for term in failure_terms)
        for item in lines
    )
    failed = any(any(term in item.line for term in failure_terms) for item in lines)
    fell_back = any(
        fallback_term in item.line or disabled in item.line for item in lines
    )
    if not expected and (failed or fell_back):
        return None, False, False
    if failed:
        raise LogEvidenceError(f"{instance_id}: {kind} restore failed")
    if expected and fell_back:
        raise LogEvidenceError(f"{instance_id}: {kind} restore fell back to config")
    if not expected and not category_observed:
        return None, False, False

    verified = [item for item in lines if item.line.endswith(verified_term)]
    if len(verified) != 1:
        raise LogEvidenceError(
            f"{instance_id}: {kind} restore verification is missing or duplicate"
        )
    positive_block = _signed_table(lines, positive_header, columns, comparison=False)
    mismatch_block = _signed_table(lines, mismatch_header, columns, comparison=True)
    if positive_block is not None and mismatch_block is not None:
        raise LogEvidenceError(f"{instance_id}: {kind} restore tables are ambiguous")
    if positive_block is not None:
        row_pattern = _POWER_OFFSET_ROW_RE if power else _OFFSET_ROW_RE
        pair_names = ("active", "reactive") if power else ("voltage", "current")
        rows = _signed_phase_pairs(positive_block, row_pattern, pair_names, kind)
        differs = False
    elif mismatch_block is not None:
        pattern = (
            _POWER_OFFSET_COMPARE_ROW_RE if power else _OFFSET_COMPARE_ROW_RE
        )
        comparison_names = (
            ("config_active", "flash_active", "config_reactive", "flash_reactive")
            if power
            else (
                "config_voltage",
                "flash_voltage",
                "config_current",
                "flash_current",
            )
        )
        rows, differs = _signed_comparison_rows(
            mismatch_block, pattern, comparison_names, kind
        )
    else:
        raise LogEvidenceError(f"{instance_id}: missing {kind} restore table")
    return rows, True, differs


def _signed_table(
    lines: list[CalibrationLogLine],
    header: str,
    columns: str,
    *,
    comparison: bool,
) -> list[CalibrationLogLine] | None:
    headers = [index for index, item in enumerate(lines) if header in item.line]
    if not headers:
        return None
    if len(headers) != 1:
        raise LogEvidenceError(f"duplicate signed table header: {header}")
    block: list[CalibrationLogLine] = []
    for item in lines[headers[0] + 1 :]:
        if "====" in item.line:
            break
        block.append(item)
    normalized = [re.sub(r"\s+", "", item.line) for item in block]
    if sum(columns in line for line in normalized) != 1:
        raise LogEvidenceError(f"signed table columns are missing or duplicate: {header}")
    if comparison and sum(
        "|config|flash|config|flash|" in line for line in normalized
    ) != 1:
        raise LogEvidenceError(f"signed comparison columns are missing: {header}")
    return block


def _signed_phase_pairs(
    lines: list[CalibrationLogLine],
    pattern: re.Pattern[str],
    names: tuple[str, str],
    context: str,
) -> tuple[tuple[int, int], tuple[int, int], tuple[int, int]]:
    rows: dict[str, tuple[int, int]] = {}
    for item in lines:
        if match := pattern.search(item.line):
            phase = match.group("phase")
            if phase in rows:
                raise LogEvidenceError(f"duplicate {context} restore row for phase {phase}")
            rows[phase] = (
                _signed_16(match.group(names[0]), context),
                _signed_16(match.group(names[1]), context),
            )
        elif _SIGNED_ROW_LIKE_RE.search(item.line):
            raise LogEvidenceError(f"malformed or extra {context} restore row")
    if set(rows) != {"A", "B", "C"}:
        raise LogEvidenceError(
            f"{context} restore must contain exactly phases A, B, and C"
        )
    return cast(
        tuple[tuple[int, int], tuple[int, int], tuple[int, int]],
        tuple(rows[phase] for phase in ("A", "B", "C")),
    )


def _signed_comparison_rows(
    lines: list[CalibrationLogLine],
    pattern: re.Pattern[str],
    names: tuple[str, str, str, str],
    context: str,
) -> tuple[tuple[tuple[int, int], tuple[int, int], tuple[int, int]], bool]:
    rows: dict[str, tuple[int, int]] = {}
    differs = False
    for item in lines:
        if match := pattern.search(item.line):
            phase = match.group("phase")
            if phase in rows:
                raise LogEvidenceError(f"duplicate {context} restore row for phase {phase}")
            config = (
                _signed_16(match.group(names[0]), context),
                _signed_16(match.group(names[2]), context),
            )
            flash = (
                _signed_16(match.group(names[1]), context),
                _signed_16(match.group(names[3]), context),
            )
            rows[phase] = flash
            differs = differs or config != flash
        elif _SIGNED_ROW_LIKE_RE.search(item.line):
            raise LogEvidenceError(f"malformed or extra {context} restore row")
    if set(rows) != {"A", "B", "C"}:
        raise LogEvidenceError(
            f"{context} restore must contain exactly phases A, B, and C"
        )
    return (
        cast(
            tuple[tuple[int, int], tuple[int, int], tuple[int, int]],
            tuple(rows[phase] for phase in ("A", "B", "C")),
        ),
        differs,
    )


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
