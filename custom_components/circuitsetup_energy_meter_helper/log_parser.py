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
_BUTTON_RE = re.compile(r"\[[^\]]*atm90e32\.button[^\]]*\]\s*:?\s*(?P<button>.+?)\s*$")
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
_GAIN_SAVED = "Gain calibration saved to memory."
_GAIN_SAVE_FAILED = "Failed to save gain calibration to memory!"
_GAIN_COMPLETED = "Gain calibration completed and verified."
_GAIN_SAVED_AND_COMPLETED = f"{_GAIN_SAVED} {_GAIN_COMPLETED}"
_GAIN_FAILED = "Gain calibration failed; previous values restored."
_GAIN_ROLLBACK_FAILED = (
    "Gain calibration failed; rollback readback verification failed."
)
_GAIN_RUN_TERMINALS = (
    _GAIN_SAVED,
    _GAIN_SAVE_FAILED,
    _GAIN_COMPLETED,
    _GAIN_SAVED_AND_COMPLETED,
    _GAIN_FAILED,
    _GAIN_ROLLBACK_FAILED,
)
_GAIN_CONFIG_FALLBACK = (
    "Gain calibration restore failed verification; config values verified."
)
_GAIN_CONFIG_FALLBACK_FAILED = (
    "Gain calibration restore failed; config readback verification failed."
)


class LogEvidenceError(ValueError):
    """A correlated ATM90E32 evidence block is absent or contradictory."""


class MeterCommunicationError(RuntimeError):
    """Fresh ATM90E32 SPI failure evidence, without arbitrary device log text."""

    def __init__(self, cs_pins: tuple[int, ...]) -> None:
        if (
            len(cs_pins) > 14
            or any(type(pin) is not int or not 0 <= pin <= 63 for pin in cs_pins)
            or len(set(cs_pins)) != len(cs_pins)
        ):
            raise ValueError("invalid meter CS pins")
        self.cs_pins = tuple(sorted(cs_pins))
        super().__init__("Meter chip SPI communication failed")


class MeterCommunicationParser:
    """Consume one dump-config stream; retain only bounded chip/pin evidence."""

    def __init__(self) -> None:
        self.checked_cs_pins: set[int] = set()
        self.failed_cs_pins: set[int] = set()
        self.failed = False
        self._active = False
        self._pin: int | None = None

    def feed(self, line: str) -> None:
        payload = re.sub(r"^(?:\[[^\]]*\])+\s*:?\s*", "", line).strip()
        if payload.casefold() == "atm90e32:":
            self._active, self._pin = True, None
            return
        tagged_meter = re.search(r"\[atm90e32(?::\d+)?\]", line, re.IGNORECASE) is not None
        if line.startswith("[") and not tagged_meter:
            return
        if payload.casefold().startswith("cs pin:") and (self._active or tagged_meter):
            match = re.fullmatch(r"CS Pin:\s*(?:GPIO)?(\d{1,2})(?:\s+.*)?", payload, re.IGNORECASE)
            self._active = True
            self._pin = int(match[1]) if match and int(match[1]) <= 63 else None
        elif re.fullmatch(r"Communication(?: with ATM90E32)? failed[.!]?", payload, re.IGNORECASE):
            if self._active or tagged_meter:
                self.failed = True
                if self._pin is not None:
                    self.failed_cs_pins.add(self._pin)
        elif self._active and payload.casefold().startswith("update interval:"):
            if self._pin is not None:
                self.checked_cs_pins.add(self._pin)
            self._active, self._pin = False, None


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


@dataclass(frozen=True, slots=True)
class OffsetTableSnapshot:
    """Safe, per-stage projection of a fresh reported offset table."""

    connection_generation: int
    instance_id: str
    offset_stage: Literal[1, 2]
    phase_values: tuple[tuple[int, int], tuple[int, int], tuple[int, int]]
    reported_state: Literal["restored", "mismatch", "configuration"]
    register_verified: bool
    config_differs_from_flash: bool


@dataclass(frozen=True, slots=True)
class OffsetClearEvidence:
    """Strictly correlated native clear response; this authorizes nothing."""

    connection_generation: int
    operation_sequence: int
    instance_id: str
    offset_stage: Literal[1, 2]
    phase_values: tuple[tuple[int, int], tuple[int, int], tuple[int, int]]
    cleared: bool
    no_stored: bool
    matching_lines: tuple[str, ...]


def parse_calibration_sources(
    lines: tuple[str, ...],
    expected_instance_ids: set[str],
    *,
    offset_stage: Literal[1, 2] | None = None,
) -> dict[str, Literal["flash", "configuration", "unknown"]]:
    """Read reported calibration sources, not proof of a new run or restart."""
    if offset_stage not in (None, 1, 2):
        raise ValueError("offset stage must be 1 or 2")
    flash_terms: tuple[str, ...] = (
        "Gain calibration loaded and verified successfully.",
        "Gain mismatch: using flash values",
        "Restoring saved gain calibrations to registers",
    )
    configuration_terms: tuple[str, ...] = (
        "No stored gain calibrations found",
        "Gain calibration is disabled",
        _GAIN_CONFIG_FALLBACK,
    )
    if offset_stage is not None:
        kind = "Power offset" if offset_stage == 2 else "Offset"
        flash_terms = (
            f"Restored {kind.lower()} calibration from memory",
            f"{kind} mismatch: using flash values",
        )
        configuration_terms = (
            (
                "No stored power offsets found",
                "No stored power offset calibrations found. Using default values.",
            )
            if offset_stage == 2
            else ("No stored offset calibrations found",)
        ) + ("Power & Voltage/Current offset calibration is disabled",)
    sources: dict[str, Literal["flash", "configuration", "unknown"]] = {
        instance_id: "unknown" for instance_id in expected_instance_ids
    }
    for line in lines:
        instance_id = _instance(line)
        if instance_id not in sources:
            continue
        if any(term in line for term in flash_terms):
            sources[instance_id] = "flash"
        elif any(term in line for term in configuration_terms):
            sources[instance_id] = "configuration"
    return dict(sorted(sources.items()))


def parse_offset_configuration_selection(
    lines: list[CalibrationLogLine] | tuple[CalibrationLogLine, ...],
    *,
    connection_generation: int,
    expected_instance_ids: set[str],
) -> dict[str, int]:
    """Prove native YAML selection, never register readback or erased preferences.

    Exact dump producer shared by stock ESPHome 2026.8.1 and optional ATM90E32.
    The caller must collect the entire fresh bounded dump on one live client.
    """
    selected = "Power & Voltage/Current offset calibration is disabled. Using config file values."
    observed: dict[str, int] = {}
    for item in lines:
        if item.connection_generation != connection_generation:
            raise LogEvidenceError("offset selection generation changed")
        line = item.line
        lower = line.lower()
        if "spi read mismatch" in lower or (
            ("atm90e32" in lower or "[CALIBRATION]" in line)
            and ("failed" in lower or "failure" in lower)
        ):
            raise LogEvidenceError(
                "offset configuration selection observed device failure"
            )
        if "offset" not in lower:
            continue
        tags = tuple(_INSTANCE_RE.finditer(line))
        if len(tags) != 1 or line.count("[CALIBRATION][") != 1:
            raise LogEvidenceError("offset configuration selection has ambiguous tags")
        instance = tags[0]["instance"]
        if instance not in expected_instance_ids:
            continue
        payload = line[tags[0].end() :].strip()
        if payload != selected or instance in observed:
            raise LogEvidenceError("offset configuration selection is contradictory")
        observed[instance] = connection_generation
    if not expected_instance_ids or set(observed) != expected_instance_ids:
        raise LogEvidenceError("exact offset configuration selection is absent")
    return observed


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
            or any(item.line.endswith(term) for term in _GAIN_RUN_TERMINALS)
            or "Mismatch detected for Phase" in item.line
        )

    terminal_seen = False
    operation_end = len(matching)
    for index, item in enumerate(matching[button_index + 1 :], start=button_index + 1):
        instance = _instance(item.line)
        if terminal_seen and "3. Run " in item.line and " Gain Cal" in item.line:
            operation_end = index
            break
        if instance is not None and instance != target_instance_id:
            raise LogEvidenceError("interleaved ATM90E32 instance in operation window")
        if is_evidence(item) and instance != target_instance_id:
            raise LogEvidenceError("gain evidence is missing the target instance tag")
        if instance == target_instance_id and any(
            item.line.endswith(term) for term in _GAIN_RUN_TERMINALS
        ):
            terminal_seen = True
    matching = matching[:operation_end]
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
    final_results: list[str] = []
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
        payload = _calibration_payload(item.line)
        if payload == _GAIN_SAVED_AND_COMPLETED:
            save_results.append(True)
            final_results.append(_GAIN_COMPLETED)
            terminal_seen = True
        elif payload == _GAIN_SAVED:
            save_results.append(True)
            terminal_seen = True
        elif payload == _GAIN_SAVE_FAILED:
            save_results.append(False)
            terminal_seen = True
        elif payload in (_GAIN_COMPLETED, _GAIN_FAILED, _GAIN_ROLLBACK_FAILED):
            final_results.append(payload)
            terminal_seen = True
        if mismatch := _MISMATCH_RE.search(item.line):
            mismatches.append(cast(Phase, mismatch.group("phase")))
    if set(phase_rows) != {"A", "B", "C"}:
        raise LogEvidenceError("gain evidence must contain exactly phases A, B, and C")
    if len(final_results) > 1:
        raise LogEvidenceError("gain terminal result is duplicate or contradictory")
    if final_results == [_GAIN_ROLLBACK_FAILED]:
        raise LogEvidenceError("gain rollback readback failure terminal")
    if final_results == [_GAIN_FAILED]:
        if save_results == [True]:
            raise LogEvidenceError("gain result contradicts verified rollback")
        if not save_results:
            save_results.append(False)
    elif final_results == [_GAIN_COMPLETED] and save_results != [True]:
        raise LogEvidenceError("gain completion requires a successful save result")
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
    allow_unverified: bool = False,
) -> OffsetRunEvidence:
    """Parse one strictly correlated voltage/current offset operation."""
    rows, matching, register_verified = _parse_offset_operation(
        lines,
        connection_generation=connection_generation,
        operation_sequence=operation_sequence,
        target_instance_id=target_instance_id,
        button_name=button_name,
        dispatched_after=dispatched_after,
        power=False,
        allow_unverified=allow_unverified,
    )
    phases = cast(
        tuple[PhaseOffsetEvidence, PhaseOffsetEvidence, PhaseOffsetEvidence],
        tuple(
            PhaseOffsetEvidence(phase, values[0], values[1]) for phase, values in rows
        ),
    )
    return OffsetRunEvidence(
        connection_generation,
        operation_sequence,
        target_instance_id,
        phases,
        True,
        register_verified,
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
    allow_unverified: bool = False,
) -> PowerOffsetRunEvidence:
    """Parse one strictly correlated active/reactive power-offset operation."""
    rows, matching, register_verified = _parse_offset_operation(
        lines,
        connection_generation=connection_generation,
        operation_sequence=operation_sequence,
        target_instance_id=target_instance_id,
        button_name=button_name,
        dispatched_after=dispatched_after,
        power=True,
        allow_unverified=allow_unverified,
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
        register_verified,
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
    allow_unverified: bool,
) -> tuple[tuple[tuple[Phase, tuple[int, int]], ...], tuple[str, ...], bool]:
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
    saved_and_completed = f"{saved} {completed}"
    failed = (
        "Power offset calibration failed; previous values restored."
        if power
        else "Offset calibration failed; previous values restored."
    )
    rollback_failed = (
        "Power offset calibration failed; rollback readback verification failed."
        if power
        else "Offset calibration failed; rollback readback verification failed."
    )
    readback_pattern = _POWER_OFFSET_READBACK_RE if power else _OFFSET_READBACK_RE
    selected_category = "power_offset" if power else "offset"

    matching = sorted(
        (
            item
            for item in lines
            if item.connection_generation == connection_generation
            and item.operation_sequence == operation_sequence
            and item.arrived_at > dispatched_after
            # The button component also emits operator guidance, not button presses.
            and not (
                (button := _BUTTON_RE.search(item.line)) is not None
                and button["button"].startswith(
                    ("[CALIBRATION] **NOTE:", "[CALIBRATION] Use ")
                )
            )
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
    if any("SPI read mismatch" in item.line for item in matching):
        raise LogEvidenceError(f"{kind} operation observed SPI read mismatch")

    def is_header(item: CalibrationLogLine) -> bool:
        return title in item.line and "====" in item.line

    evidence_terms = (saved, save_failed, completed, failed, rollback_failed)

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
        category = _offset_log_category(item.line)
        if category is not None and instance != target_instance_id:
            raise LogEvidenceError(
                f"{kind} evidence is missing the target instance tag"
            )
        if category is not None and category != selected_category:
            raise LogEvidenceError("interleaved offset calibration category")
        if is_evidence(item) and instance != target_instance_id:
            raise LogEvidenceError(
                f"{kind} evidence is missing the target instance tag"
            )

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
    column_indices = [
        index
        for index in range(header_index, len(matching))
        if columns in re.sub(r"\s+", "", matching[index].line)
    ]
    if len(column_indices) != 1:
        raise LogEvidenceError(f"{kind} table columns are missing or duplicate")
    column_index = column_indices[0]

    final_indices = [
        index
        for index in range(header_index, len(matching))
        if _calibration_payload(matching[index].line)
        in (completed, saved_and_completed, failed, rollback_failed)
    ]
    register_verified = bool(final_indices)
    if not final_indices and allow_unverified:
        # Stock firmware reports the save, not register readback. Never turn a
        # malformed enhanced terminal into a legacy success.
        if any(completed in item.line for item in matching[header_index:]):
            raise LogEvidenceError(f"{kind} terminal result is malformed")
        final_indices = [
            index
            for index in range(header_index, len(matching))
            if _calibration_payload(matching[index].line) == saved
        ]
    if len(final_indices) != 1:
        raise LogEvidenceError(f"{kind} terminal result is missing or multiple")
    final_index = final_indices[0]

    phase_rows: dict[Phase, tuple[int, int]] = {}
    phase_indices: dict[Phase, int] = {}
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
            phase_indices[phase] = index
        elif _SIGNED_ROW_LIKE_RE.search(item.line):
            raise LogEvidenceError(f"malformed or extra {kind} row")
    if set(phase_rows) != {"A", "B", "C"}:
        raise LogEvidenceError(
            f"{kind} evidence must contain exactly phases A, B, and C"
        )

    save_success_indices = [
        index
        for index in range(header_index, len(matching))
        if _calibration_payload(matching[index].line) in (saved, saved_and_completed)
    ]
    save_failures = [
        item
        for item in matching[header_index:]
        if _calibration_payload(item.line) == save_failed
    ]
    mismatches = [
        item
        for item in matching[header_index:]
        if readback_pattern.search(item.line) is not None
    ]
    final_payload = _calibration_payload(matching[final_index].line)
    if final_payload == rollback_failed:
        raise LogEvidenceError(f"{kind} rollback readback failure terminal")
    if final_payload == failed:
        if save_failures:
            raise LogEvidenceError(f"{kind} save failure terminal")
        if mismatches:
            raise LogEvidenceError(f"{kind} register mismatch terminal")
        raise LogEvidenceError(f"{kind} failure terminal")
    if save_failures:
        raise LogEvidenceError(f"{kind} save failure contradicts success terminal")
    if mismatches:
        raise LogEvidenceError(f"{kind} register mismatch contradicts success terminal")
    if len(save_success_indices) != 1:
        raise LogEvidenceError(f"{kind} save result is missing or duplicate")
    event_indices = [
        header_index,
        column_index,
        *(phase_indices[phase] for phase in ("A", "B", "C")),
    ]
    event_indices.extend(
        (final_index,)
        if save_success_indices[0] == final_index
        else (save_success_indices[0], final_index)
    )
    if event_indices != sorted(event_indices) or len(set(event_indices)) != len(
        event_indices
    ):
        raise LogEvidenceError(f"{kind} evidence is out of firmware order")

    return (
        tuple((phase, phase_rows[phase]) for phase in ("A", "B", "C")),
        tuple(item.line for item in block),
        register_verified,
    )


def parse_restore(
    lines: list[CalibrationLogLine] | tuple[CalibrationLogLine, ...],
    *,
    connection_generation: int,
    expected_instance_ids: set[str],
    started_after: float,
    operation_sequence: int | None = None,
    expected_categories: dict[str, set[Literal["gain", "offset", "power_offset"]]]
    | None = None,
    allow_unverified_offset_tables: bool = False,
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
    offset_requested = any(
        categories & {"offset", "power_offset"}
        for categories in expected_categories.values()
    )
    if offset_requested and operation_sequence is None:
        raise ValueError("offset restore operation sequence is required")

    matching = sorted(
        (
            item
            for item in lines
            if item.connection_generation == connection_generation
            and (
                operation_sequence is None
                or item.operation_sequence == operation_sequence
            )
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
        _GAIN_CONFIG_FALLBACK,
        _GAIN_CONFIG_FALLBACK_FAILED,
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

    def is_restore_evidence(item: CalibrationLogLine) -> bool:
        return (
            any(term in item.line for term in restore_terms)
            or _RESTORE_ROW_RE.search(item.line) is not None
            or _COMPARE_ROW_RE.search(item.line) is not None
            or _OFFSET_ROW_RE.search(item.line) is not None
            or _POWER_OFFSET_ROW_RE.search(item.line) is not None
            or _OFFSET_COMPARE_ROW_RE.search(item.line) is not None
            or _POWER_OFFSET_COMPARE_ROW_RE.search(item.line) is not None
            or "|Phase|voltage_gain|current_gain|" in re.sub(r"\s+", "", item.line)
        )

    for item in matching:
        if not is_restore_evidence(item):
            continue
        tags = tuple(_INSTANCE_RE.finditer(item.line))
        if len(tags) != 1 or item.line.count("[CALIBRATION][") != 1:
            raise LogEvidenceError(
                "restore evidence must contain exactly one instance tag"
            )
        if tags[0].group("instance") not in expected_instance_ids:
            raise LogEvidenceError(
                f"unexpected restore instance {tags[0].group('instance')}"
            )

    observed_instance_ids = {
        instance_id
        for item in matching
        if is_restore_evidence(item)
        if (instance_id := _instance(item.line)) is not None
    }
    for instance_id in expected_instance_ids | observed_instance_ids:
        instance_lines = [
            item for item in matching if _instance(item.line) == instance_id
        ]
        categories = expected_categories.get(instance_id, {"gain"})
        gain_expected = "gain" in categories
        if gain_expected and any(
            "Gain verification failed!" in item.line
            or _GAIN_CONFIG_FALLBACK_FAILED in item.line
            for item in instance_lines
        ):
            raise LogEvidenceError(f"{instance_id}: gain verification failed")
        if gain_expected and any(
            "No stored gain calibrations found" in item.line
            or "Gain calibration is disabled" in item.line
            or _GAIN_CONFIG_FALLBACK in item.line
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
            allow_unverified=allow_unverified_offset_tables,
        )
        phase_power_offsets, power_verified, power_differs = _restore_offset_category(
            instance_lines,
            expected="power_offset" in categories,
            power=True,
            instance_id=instance_id,
            allow_unverified=allow_unverified_offset_tables,
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


def parse_offset_table_snapshot(
    lines: list[CalibrationLogLine] | tuple[CalibrationLogLine, ...],
    *,
    connection_generation: int,
    operation_sequence: int,
    expected_instance_ids: set[str],
    started_after: float,
    offset_stage: Literal[1, 2],
) -> dict[str, OffsetTableSnapshot | None]:
    """Read one fresh offset stage without mistaking missing evidence for zero."""
    if offset_stage not in (1, 2):
        raise ValueError("offset stage must be 1 or 2")
    power = offset_stage == 2
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
    fallback = (
        "No stored power offsets found"
        if power
        else "No stored offset calibrations found"
    )
    failure_terms = (
        (
            "Power offset restore failed verification",
            "Power offset calibration restore failed verification",
            "Power offset calibration restore and config fallback both failed verification",
            "Power offset readback failed",
        )
        if power
        else (
            "Offset calibration restore failed verification",
            "Offset calibration restore and config fallback both failed verification",
            "Offset readback failed",
        )
    )
    matching = sorted(
        (
            item
            for item in lines
            if item.connection_generation == connection_generation
            and item.operation_sequence == operation_sequence
            and item.arrived_at > started_after
        ),
        key=lambda item: item.arrived_at,
    )
    if any("SPI read mismatch" in item.line for item in matching):
        raise LogEvidenceError(f"{kind} snapshot observed SPI read mismatch")
    row_pattern = _POWER_OFFSET_ROW_RE if power else _OFFSET_ROW_RE
    comparison_row_pattern = (
        _POWER_OFFSET_COMPARE_ROW_RE if power else _OFFSET_COMPARE_ROW_RE
    )
    verified_term = (
        "Power offset calibration restore verified."
        if power
        else "Offset calibration restore verified."
    )
    for item in matching:
        normalized = re.sub(r"\s+", "", item.line)
        relevant = (
            positive_header in item.line
            or mismatch_header in item.line
            or columns in normalized
            or row_pattern.search(item.line) is not None
            or comparison_row_pattern.search(item.line) is not None
            or verified_term in item.line
            or fallback in item.line
            or any(term in item.line for term in failure_terms)
        )
        if not relevant:
            continue
        tags = tuple(_INSTANCE_RE.finditer(item.line))
        if len(tags) != 1 or item.line.count("[CALIBRATION][") != 1:
            raise LogEvidenceError(
                f"{kind} snapshot evidence has an unassignable or duplicate instance tag"
            )

    snapshots: dict[str, OffsetTableSnapshot | None] = {}
    for instance_id in expected_instance_ids:
        instance_lines = [
            item for item in matching if _instance(item.line) == instance_id
        ]
        has_table_evidence = any(
            positive_header in item.line
            or mismatch_header in item.line
            or columns in re.sub(r"\s+", "", item.line)
            for item in instance_lines
        )
        has_fallback = any(fallback in item.line for item in instance_lines)
        if not has_table_evidence:
            if any(
                any(term in item.line for term in failure_terms)
                for item in instance_lines
            ):
                raise LogEvidenceError(f"{instance_id}: {kind} snapshot restore failed")
            # A stock dump can omit this table entirely. A reported fallback is
            # still unavailable here, never a manufactured all-zero table.
            snapshots[instance_id] = None
            continue
        if has_fallback:
            raise LogEvidenceError(f"{instance_id}: {kind} snapshot is contradictory")
        rows, verified, differs = _restore_offset_category(
            instance_lines,
            expected=True,
            power=power,
            instance_id=instance_id,
            allow_unverified=True,
        )
        if rows is None:
            raise LogEvidenceError(f"{instance_id}: {kind} snapshot table is missing")
        snapshots[instance_id] = OffsetTableSnapshot(
            connection_generation,
            instance_id,
            offset_stage,
            rows,
            "mismatch"
            if any(mismatch_header in item.line for item in instance_lines)
            else "restored",
            verified,
            differs,
        )
    return snapshots


def parse_offset_clear(
    lines: list[CalibrationLogLine] | tuple[CalibrationLogLine, ...],
    *,
    connection_generation: int,
    operation_sequence: int,
    target_instance_id: str,
    button_name: str,
    dispatched_after: float,
    offset_stage: Literal[1, 2],
) -> OffsetClearEvidence:
    """Parse one exact selected-stage clear response without dispatching it."""
    if offset_stage not in (1, 2):
        raise ValueError("offset stage must be 1 or 2")
    power = offset_stage == 2
    kind = "power offset" if power else "offset"
    clearing = (
        "Clearing stored power offsets and restoring config-defined values"
        if power
        else "Clearing stored offset calibrations and restoring config-defined values"
    )
    no_stored = (
        "No stored power offsets to clear. Current values:"
        if power
        else "No stored offset calibrations to clear. Current values:"
    )
    columns = (
        "|Phase|offset_active_power|offset_reactive_power|"
        if power
        else "|Phase|offset_voltage|offset_current|"
    )
    names = ("active", "reactive") if power else ("voltage", "current")
    row_pattern = _POWER_OFFSET_ROW_RE if power else _OFFSET_ROW_RE
    terminal = "Power offsets cleared." if power else "Offsets cleared."
    failed = (
        "Failed to clear stored power offsets!"
        if power
        else "Failed to clear stored offsets!"
    )
    other_markers = (
        (
            "Clearing stored offset calibrations",
            "No stored offset calibrations to clear",
            "Offsets cleared.",
        )
        if power
        else (
            "Clearing stored power offsets",
            "No stored power offsets to clear",
            "Power offsets cleared.",
        )
    )
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
    buttons = [
        index
        for index, item in enumerate(matching)
        if _button_text(item.line) == button_name
    ]
    if len(buttons) != 1:
        raise LogEvidenceError(f"matching {kind} clear button is missing or duplicate")
    button_index = buttons[0]
    if any(
        (found := _button_text(item.line)) is not None and found != button_name
        for item in matching
    ):
        raise LogEvidenceError(f"wrong button interleaved with {kind} clear")
    window = matching[button_index:]
    if any("SPI read mismatch" in item.line for item in window):
        raise LogEvidenceError(f"{kind} clear observed SPI read mismatch")
    if any(
        term in (_calibration_payload(item.line) or "")
        for item in window
        for term in (
            "calibration saved to memory.",
            "Failed to save",
            f"{'Power offset' if power else 'Offset'} readback failed",
            "rollback readback verification failed",
        )
    ):
        raise LogEvidenceError(f"{kind} clear observed save or readback failure")
    for item in window[1:]:
        instance = _instance(item.line)
        payload = _calibration_payload(item.line) or ""
        if instance is not None and instance != target_instance_id:
            raise LogEvidenceError("interleaved ATM90E32 instance in clear response")
        if any(marker in payload for marker in other_markers):
            raise LogEvidenceError(
                "interleaved clear response for another offset stage"
            )
        category = _offset_log_category(item.line)
        if category is not None and category != ("power_offset" if power else "offset"):
            raise LogEvidenceError("interleaved evidence for another offset stage")
        if (
            clearing in payload
            or no_stored in payload
            or columns in re.sub(r"\s+", "", item.line)
            or row_pattern.search(item.line) is not None
            or terminal in payload
            or failed in payload
        ) and instance != target_instance_id:
            raise LogEvidenceError(
                f"{kind} clear evidence is missing the target instance tag"
            )

    branch_indices = [
        index
        for index, item in enumerate(window)
        if _calibration_payload(item.line) in (clearing, no_stored)
    ]
    if len(branch_indices) != 1:
        raise LogEvidenceError(f"{kind} clear branch is missing or duplicate")
    branch_index = branch_indices[0]
    branch = _calibration_payload(window[branch_index].line)
    assert branch in (clearing, no_stored)
    column_indices = [
        index
        for index, item in enumerate(window)
        if columns in re.sub(r"\s+", "", item.line)
    ]
    if len(column_indices) != 1:
        raise LogEvidenceError(f"{kind} clear table columns are missing or duplicate")
    column_index = column_indices[0]
    if column_index <= branch_index:
        raise LogEvidenceError(f"{kind} clear evidence is out of order")
    table = _signed_table(window[branch_index:], branch, columns, comparison=False)
    if table is None:
        raise LogEvidenceError(f"{kind} clear table is missing")
    values = _signed_phase_pairs(table, row_pattern, names, f"{kind} clear")
    terminals = [
        item
        for item in window[branch_index:]
        if _calibration_payload(item.line) == terminal
    ]
    failures = [
        item
        for item in window[branch_index:]
        if _calibration_payload(item.line) == failed
    ]
    row_indices = [
        index for index, item in enumerate(window) if row_pattern.search(item.line)
    ]
    if any(index <= column_index for index in row_indices):
        raise LogEvidenceError(f"{kind} clear evidence is out of order")
    if (
        any(
            terminal in (_calibration_payload(item.line) or "")
            for item in window[branch_index:]
        )
        and not terminals
    ):
        raise LogEvidenceError(f"{kind} clear terminal is malformed")
    if failures:
        raise LogEvidenceError(f"{kind} clear failed")
    if branch == no_stored:
        if terminals:
            raise LogEvidenceError(f"{kind} no-stored response has a clear terminal")
        return OffsetClearEvidence(
            connection_generation,
            operation_sequence,
            target_instance_id,
            offset_stage,
            values,
            False,
            True,
            tuple(item.line for item in window),
        )
    if len(terminals) != 1:
        raise LogEvidenceError(f"{kind} clear terminal is missing or duplicate")
    terminal_index = window.index(terminals[0])
    if terminal_index <= column_index or any(
        index >= terminal_index for index in row_indices
    ):
        raise LogEvidenceError(f"{kind} clear evidence is out of order")
    return OffsetClearEvidence(
        connection_generation,
        operation_sequence,
        target_instance_id,
        offset_stage,
        values,
        True,
        False,
        tuple(item.line for item in window),
    )


def _instance(line: str) -> str | None:
    match = _INSTANCE_RE.search(line)
    return match.group("instance") if match else None


def _calibration_payload(line: str) -> str | None:
    match = _INSTANCE_RE.search(line)
    return line[match.end() :].strip() if match else None


def _offset_log_category(
    line: str,
) -> Literal["offset", "power_offset"] | None:
    payload = _calibration_payload(line) or line
    normalized = re.sub(r"\s+", "", payload)
    if (
        "Power Offset Calibration" in payload
        or "offset_active_power" in normalized
        or "Power offset calibration" in payload
        or "Power offset readback" in payload
        or "Power offset mismatch" in payload
        or "power offset calibration" in payload
    ):
        return "power_offset"
    if (
        "Offset Calibration" in payload
        or "offset_voltage" in normalized
        or "Offset calibration" in payload
        or "Offset readback" in payload
        or "Offset mismatch" in payload
    ):
        return "offset"
    return None


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
    allow_unverified: bool = False,
) -> tuple[tuple[tuple[int, int], tuple[int, int], tuple[int, int]] | None, bool, bool]:
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
        (
            "Power offset restore failed verification",
            "Power offset calibration restore failed verification",
            "Power offset calibration restore and config fallback both failed verification",
            "Power offset readback failed",
        )
        if power
        else (
            "Offset calibration restore failed verification",
            "Offset calibration restore and config fallback both failed verification",
            "Offset readback failed",
        )
    )
    disabled = "Power & Voltage/Current offset calibration is disabled"
    payloads = [_calibration_payload(item.line) for item in lines]
    category_observed = any(
        positive_header in item.line
        or mismatch_header in item.line
        or verified_term in item.line
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

    verified = [payload for payload in payloads if payload == verified_term]
    malformed_verified = any(
        payload is not None and verified_term in payload and payload != verified_term
        for payload in payloads
    )
    if malformed_verified:
        raise LogEvidenceError(
            f"{instance_id}: {kind} restore verification is malformed"
        )
    if len(verified) != 1 and not (allow_unverified and not verified):
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
        pattern = _POWER_OFFSET_COMPARE_ROW_RE if power else _OFFSET_COMPARE_ROW_RE
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
    return rows, len(verified) == 1, differs


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
        raise LogEvidenceError(
            f"signed table columns are missing or duplicate: {header}"
        )
    if (
        comparison
        and sum("|config|flash|config|flash|" in line for line in normalized) != 1
    ):
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
                raise LogEvidenceError(
                    f"duplicate {context} restore row for phase {phase}"
                )
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
                raise LogEvidenceError(
                    f"duplicate {context} restore row for phase {phase}"
                )
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
