"""Dynamic calibration preflight and reference cleanup safety."""

from __future__ import annotations

import asyncio
import math
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from enum import StrEnum
from typing import Any, cast

from .entity_binding import BoundEntity, MeterBinding


class PreflightCode(StrEnum):
    COUNT_MISMATCH = "count_mismatch"
    INVALID_KIND = "invalid_kind"
    INVALID_UNIT = "invalid_unit"
    INVALID_RANGE = "invalid_range"
    INVALID_STEP = "invalid_step"
    UNAVAILABLE = "unavailable"
    ZERO_ACK = "zero_ack"
    DEVICE_BUSY = "device_busy"


@dataclass(frozen=True, slots=True)
class PreflightIssue:
    code: PreflightCode
    role: str
    detail: str


@dataclass(frozen=True, slots=True)
class PreflightResult:
    issues: tuple[PreflightIssue, ...]
    zeroed_roles: tuple[str, ...] = ()

    @property
    def ok(self) -> bool:
        return not self.issues


class ReferenceZeroError(RuntimeError):
    def __init__(self, failures: tuple[BaseException, ...]) -> None:
        self.failures = failures
        super().__init__(f"failed to zero {len(failures)} references")


class ReferenceCleanupError(RuntimeError):
    def __init__(self, failures: tuple[BaseException, ...]) -> None:
        self.failures = failures
        super().__init__(f"reference cleanup failed {len(failures)} times")


async def async_preflight(
    session: Any, binding: MeterBinding, device_lock: asyncio.Lock
) -> PreflightResult:
    """Validate all dynamic roles, then zero and acknowledge every reference."""
    if device_lock.locked():
        return PreflightResult(
            (PreflightIssue(PreflightCode.DEVICE_BUSY, "device", "device is busy"),)
        )
    await device_lock.acquire()
    try:
        issues = _validate_binding(binding)
        issues.extend(_validate_state_availability(session, binding))
        if issues:
            return PreflightResult(tuple(issues))
        zeroed: list[str] = []
        for entity in _references(binding):
            step = float(entity.descriptor.info.step)
            try:
                await session.async_set_number(
                    entity.descriptor.key,
                    0.0,
                    device_id=entity.descriptor.device_id,
                    tolerance=step / 2,
                )
            except Exception as error:  # noqa: BLE001 - attempt every reference
                issues.append(
                    PreflightIssue(
                        PreflightCode.ZERO_ACK,
                        entity.role,
                        f"zero acknowledgement failed: {type(error).__name__}",
                    )
                )
            else:
                zeroed.append(entity.role)
        return PreflightResult(tuple(issues), tuple(zeroed))
    finally:
        device_lock.release()


def _validate_binding(binding: MeterBinding) -> list[PreflightIssue]:
    issues: list[PreflightIssue] = []
    if (
        len(binding.groups) != binding.topology.group_count
        or len(binding.channels) != binding.topology.ct_count
        or any(
            len(group.references) != 4
            or len(group.buttons) != 2
            or len(group.voltage_sensors) != 3
            or len(group.current_sensors) != 3
            for group in binding.groups
        )
    ):
        issues.append(
            PreflightIssue(
                PreflightCode.COUNT_MISMATCH,
                "topology",
                "binding role counts do not match topology",
            )
        )

    expected: list[tuple[BoundEntity, str, str]] = []
    for group in binding.groups:
        expected.append((group.voltage_reference, "number", "V"))
        expected.extend((entity, "number", "A") for entity in group.current_references)
        expected.extend((entity, "button", "") for entity in group.buttons)
        expected.extend((entity, "sensor", "V") for entity in group.voltage_sensors)
        expected.extend((entity, "sensor", "A") for entity in group.current_sensors)
    for entity, kind, unit in expected:
        descriptor = entity.descriptor
        if descriptor.kind != kind:
            issues.append(
                PreflightIssue(
                    PreflightCode.INVALID_KIND,
                    entity.role,
                    f"expected {kind}, got {descriptor.kind}",
                )
            )
        if descriptor.unit != unit:
            issues.append(
                PreflightIssue(
                    PreflightCode.INVALID_UNIT,
                    entity.role,
                    f"expected {unit or 'no unit'}, got {descriptor.unit or 'no unit'}",
                )
            )
        if not bool(getattr(descriptor.info, "available", True)):
            issues.append(
                PreflightIssue(
                    PreflightCode.UNAVAILABLE, entity.role, "entity is unavailable"
                )
            )
        if kind != "number":
            continue
        minimum = _finite_attr(descriptor.info, "min_value")
        maximum = _finite_attr(descriptor.info, "max_value")
        step = _finite_attr(descriptor.info, "step")
        if minimum is None or maximum is None or not minimum <= 0.0 <= maximum:
            issues.append(
                PreflightIssue(
                    PreflightCode.INVALID_RANGE,
                    entity.role,
                    "number range must include zero",
                )
            )
        if step is None or step <= 0:
            issues.append(
                PreflightIssue(
                    PreflightCode.INVALID_STEP,
                    entity.role,
                    "number step must be finite and positive",
                )
            )
    return issues


def _finite_attr(info: Any, name: str) -> float | None:
    try:
        value = float(getattr(info, name))
    except AttributeError, TypeError, ValueError:
        return None
    return value if math.isfinite(value) else None


def _validate_state_availability(
    session: Any, binding: MeterBinding
) -> list[PreflightIssue]:
    cache = getattr(session, "state_cache", None)
    if cache is None:
        return [
            PreflightIssue(
                PreflightCode.UNAVAILABLE,
                "device",
                "native state cache is unavailable",
            )
        ]
    issues: list[PreflightIssue] = []
    for entity in binding.entities:
        descriptor = entity.descriptor
        if descriptor.kind not in {"sensor", "number"}:
            continue
        state_name = f"{descriptor.kind.title()}State"
        record = next(
            (
                value
                for (state_type, device_id, key), value in cache.items()
                if state_type.__name__ == state_name
                and device_id == descriptor.device_id
                and key == descriptor.key
            ),
            None,
        )
        stale = bool(getattr(record, "stale", False))
        state = (
            getattr(record, "state", None) if hasattr(record, "received_at") else record
        )
        if record is None or stale or bool(getattr(state, "missing_state", False)):
            issues.append(
                PreflightIssue(
                    PreflightCode.UNAVAILABLE,
                    entity.role,
                    "native entity state is unavailable",
                )
            )
    return issues


def _references(binding: MeterBinding) -> tuple[BoundEntity, ...]:
    return tuple(entity for group in binding.groups for entity in group.references)


@asynccontextmanager
async def zero_reference_guard(engine: Any, session: Any) -> AsyncIterator[None]:
    """Zero before and after, preserving an operation error over cleanup errors."""
    original: BaseException | None = None
    cleanup_failures: tuple[BaseException, ...] = ()
    try:
        await engine.async_zero_all_references(session)
        try:
            yield
        except BaseException as error:  # noqa: BLE001 - preserve cancellation too
            original = error
    except BaseException as error:  # noqa: BLE001 - cleanup after failed entry
        original = error
    finally:
        cleanup_failures, cleanup_cancelled = await _drain_final_zero(engine, session)
        if cleanup_cancelled is not None:
            if original is None:
                original = cleanup_cancelled
            else:
                cleanup_failures = (*cleanup_failures, cleanup_cancelled)
    if original is not None:
        if cleanup_failures:
            cast(Any, original).cleanup_errors = cleanup_failures
            original.add_note(
                f"reference cleanup also failed {len(cleanup_failures)} times"
            )
        raise original
    if cleanup_failures:
        raise ReferenceCleanupError(cleanup_failures)


async def _drain_final_zero(
    engine: Any, session: Any
) -> tuple[tuple[BaseException, ...], asyncio.CancelledError | None]:
    task = asyncio.create_task(engine.async_zero_all_references(session))
    caller_cancelled: asyncio.CancelledError | None = None
    while not task.done():
        try:
            await asyncio.shield(task)
        except asyncio.CancelledError as error:
            caller_cancelled = caller_cancelled or error
        except BaseException:  # noqa: BLE001 - inspect the owned task below
            break
    try:
        task.result()
    except ReferenceZeroError as error:
        failures = error.failures
    except asyncio.CancelledError as error:
        caller_cancelled = caller_cancelled or error
        failures = ()
    except BaseException as error:  # noqa: BLE001 - report cleanup, preserve caller
        failures = (error,)
    else:
        failures = ()
    return failures, caller_cancelled
