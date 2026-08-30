"""Fresh board-wide sensor evidence for offset calibration readiness."""

from __future__ import annotations

import asyncio
import math
from dataclasses import dataclass
from time import monotonic
from typing import Any, Literal

from .entity_binding import BoundEntity, MeterBinding
from .state_tracker import AbsoluteSensorSampleWindow

type OffsetReadinessStage = Literal[1, 2]
type SensorQuantity = Literal["voltage", "current"]


@dataclass(frozen=True, slots=True)
class OffsetReadinessThresholds:
    """Server-owned offset thresholds; callers may supply hardware-tuned values."""

    sample_count: int
    zero_voltage_peak_volts: float
    zero_voltage_spread_volts: float
    zero_current_peak_amps: float
    zero_current_spread_amps: float
    voltage_present_minimum_volts: float
    voltage_present_spread_volts: float

    def __post_init__(self) -> None:
        if self.sample_count < 3:
            raise ValueError("offset readiness requires at least three samples")
        values = (
            self.zero_voltage_peak_volts,
            self.zero_voltage_spread_volts,
            self.zero_current_peak_amps,
            self.zero_current_spread_amps,
            self.voltage_present_minimum_volts,
            self.voltage_present_spread_volts,
        )
        if not all(math.isfinite(value) and value >= 0 for value in values):
            raise ValueError("offset readiness thresholds must be finite and non-negative")
        if self.voltage_present_minimum_volts == 0:
            raise ValueError("voltage present minimum must be positive")


# Provisional baseline only; tune from hardware validation before claiming accuracy.
DEFAULT_OFFSET_READINESS_THRESHOLDS = OffsetReadinessThresholds(
    sample_count=3,
    zero_voltage_peak_volts=1.0,
    zero_voltage_spread_volts=0.5,
    zero_current_peak_amps=0.25,
    zero_current_spread_amps=0.10,
    voltage_present_minimum_volts=90.0,
    voltage_present_spread_volts=2.0,
)


@dataclass(frozen=True, slots=True)
class OffsetEntityReadinessEvidence:
    role: str
    quantity: SensorQuantity
    ready: bool
    reasons: tuple[str, ...]
    window: AbsoluteSensorSampleWindow | None


@dataclass(frozen=True, slots=True)
class OffsetReadinessResult:
    stage: OffsetReadinessStage
    ready: bool
    connection_generation: int
    entities: tuple[OffsetEntityReadinessEvidence, ...]
    reasons: tuple[str, ...]
    thresholds: OffsetReadinessThresholds
    saved_offset_sources: tuple[
        tuple[str, Literal["flash", "configuration", "unknown"]], ...
    ] = ()


async def async_check_offset_readiness(
    session: Any,
    binding: MeterBinding,
    board_index: int,
    stage: OffsetReadinessStage,
    *,
    thresholds: OffsetReadinessThresholds = DEFAULT_OFFSET_READINESS_THRESHOLDS,
    timeout: float = 10.0,
) -> OffsetReadinessResult:
    """Collect and evaluate all voltage/current phases on one two-chip board."""
    if stage not in (1, 2):
        raise ValueError("offset readiness stage must be 1 or 2")
    if board_index < 0:
        raise ValueError("board_index must be non-negative")
    start = board_index * 2
    groups = binding.groups[start : start + 2]
    if len(groups) != 2:
        raise ValueError("selected board must contain two meter groups")

    selected_items: list[tuple[BoundEntity, SensorQuantity]] = []
    for group in groups:
        selected_items.extend((entity, "voltage") for entity in group.voltage_sensors)
        selected_items.extend((entity, "current") for entity in group.current_sensors)
    selected = tuple(selected_items)
    generation = int(session.connection_generation)
    if not bool(session.connected) or binding.connection_generation != generation:
        reason = "entity binding is not on the active connection generation"
        evidence = tuple(
            OffsetEntityReadinessEvidence(
                entity.role, quantity, False, (reason,), None
            )
            for entity, quantity in selected
        )
        return OffsetReadinessResult(
            stage, False, generation, evidence, (reason,), thresholds
        )

    boundary = monotonic()
    outcomes = await asyncio.gather(
        *(
            session.async_wait_for_absolute_sensor_window(
                entity.descriptor.key,
                device_id=entity.descriptor.device_id,
                sample_count=thresholds.sample_count,
                connection_generation=generation,
                after=boundary,
                timeout=timeout,
            )
            for entity, _ in selected
        ),
        return_exceptions=True,
    )
    for outcome in outcomes:
        if isinstance(outcome, BaseException) and not isinstance(outcome, Exception):
            raise outcome
    evidence = tuple(
        _evaluate_entity(entity, quantity, outcome, stage, generation, thresholds)
        for (entity, quantity), outcome in zip(selected, outcomes, strict=True)
    )
    reasons = tuple(
        f"{item.role}: {reason}"
        for item in evidence
        for reason in item.reasons
    )
    if not bool(session.connected) or int(session.connection_generation) != generation:
        reasons += ("connection generation changed while collecting readiness",)
    return OffsetReadinessResult(
        stage,
        not reasons,
        generation,
        evidence,
        reasons,
        thresholds,
    )


def _evaluate_entity(
    entity: BoundEntity,
    quantity: SensorQuantity,
    outcome: AbsoluteSensorSampleWindow | BaseException,
    stage: OffsetReadinessStage,
    generation: int,
    thresholds: OffsetReadinessThresholds,
) -> OffsetEntityReadinessEvidence:
    if isinstance(outcome, BaseException):
        detail = str(outcome) or type(outcome).__name__
        return OffsetEntityReadinessEvidence(
            entity.role, quantity, False, (f"fresh window unavailable: {detail}",), None
        )
    window = outcome
    reasons: list[str] = []
    if window.connection_generation != generation:
        reasons.append("window is from another connection generation")
    elif len(window.values) != thresholds.sample_count:
        reasons.append("window has insufficient samples")
    elif not all(
        math.isfinite(value)
        for value in (
            *window.values,
            *window.received_at,
            window.mean,
            window.minimum,
            window.maximum,
            window.absolute_peak,
            window.absolute_spread,
        )
    ):
        reasons.append("window contains non-finite data")
    elif quantity == "current":
        if window.absolute_peak > thresholds.zero_current_peak_amps:
            reasons.append("absolute peak exceeds zero_current_peak_amps")
        if window.absolute_spread > thresholds.zero_current_spread_amps:
            reasons.append("absolute spread exceeds zero_current_spread_amps")
    elif stage == 1:
        if window.absolute_peak > thresholds.zero_voltage_peak_volts:
            reasons.append("absolute peak exceeds zero_voltage_peak_volts")
        if window.absolute_spread > thresholds.zero_voltage_spread_volts:
            reasons.append("absolute spread exceeds zero_voltage_spread_volts")
    else:
        if window.minimum < thresholds.voltage_present_minimum_volts:
            reasons.append("minimum is below voltage_present_minimum_volts")
        if window.absolute_spread > thresholds.voltage_present_spread_volts:
            reasons.append("absolute spread exceeds voltage_present_spread_volts")
    return OffsetEntityReadinessEvidence(
        entity.role, quantity, not reasons, tuple(reasons), window
    )
