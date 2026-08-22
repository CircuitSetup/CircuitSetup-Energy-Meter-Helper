"""Tests for dynamic calibration preflight and zero cleanup."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, replace
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.entity_binding import (
    BoundEntity,
    ChannelBinding,
    GroupBinding,
    MeterBinding,
    ResolutionSource,
    group_key,
)
from custom_components.circuitsetup_energy_meter_helper.entity_catalog import (
    EntityDescriptor,
)
from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology
from custom_components.circuitsetup_energy_meter_helper.preflight import (
    ReferenceCleanupError,
    ReferenceZeroError,
    async_preflight,
    zero_reference_guard,
)


@dataclass(slots=True)
class Info:
    min_value: float = 0.0
    max_value: float = 1000.0
    step: float = 0.1
    available: bool = True


@dataclass(slots=True)
class SensorState:
    key: int
    device_id: int
    state: float = 1.0
    missing_state: bool = False


@dataclass(slots=True)
class NumberState(SensorState):
    pass


class FakeSession:
    def __init__(self, failures: set[int] | None = None) -> None:
        self.failures = failures or set()
        self.number_calls: list[tuple[int, float, int, float]] = []
        self.button_calls: list[int] = []
        self.state_cache: dict[tuple[type[Any], int, int], object] = {}

    async def async_set_number(
        self,
        key: int,
        state: float,
        *,
        device_id: int = 0,
        tolerance: float = 1e-6,
        timeout: float = 10.0,
    ) -> object:
        self.number_calls.append((key, state, device_id, tolerance))
        if key in self.failures:
            raise TimeoutError(f"no acknowledgement for {key}")
        return object()


def binding(addon_count: int) -> MeterBinding:
    addon_suffix = (
        ""
        if addon_count == 0
        else f"-{addon_count}-{'addon' if addon_count == 1 else 'addons'}"
    )
    topology = MeterTopology.from_addon_count(
        addon_count,
        connection_type="wifi",
        voltage_layout="standard",
        project_name=f"circuitsetup.6c-energy-meter{addon_suffix}",
        evidence=(),
    )
    key = 0

    def bound(role: str, kind: str, unit: str, device_id: int) -> BoundEntity:
        nonlocal key
        key += 1
        descriptor = EntityDescriptor(
            Info(), kind, f"entity_{key}", role, unit, device_id, key, False
        )
        return BoundEntity(role, descriptor, ResolutionSource.OBJECT_ID)

    groups: list[GroupBinding] = []
    channels: list[ChannelBinding] = []
    for board_index in range(topology.board_count):
        for group_index in range(2):
            name = group_key(board_index, group_index)
            device_id = board_index + 1
            first_channel = board_index * 6 + group_index * 3 + 1
            voltage_reference = bound(
                f"{name}.reference_voltage", "number", "V", device_id
            )
            current_references = tuple(
                bound(f"ct{channel}.reference_current", "number", "A", device_id)
                for channel in range(first_channel, first_channel + 3)
            )
            voltage_sensors = tuple(
                bound(f"{name}.voltage_{phase}", "sensor", "V", device_id)
                for phase in "abc"
            )
            current_sensors = tuple(
                bound(f"ct{channel}.current_sensor", "sensor", "A", device_id)
                for channel in range(first_channel, first_channel + 3)
            )
            group = GroupBinding(
                name,
                voltage_reference,
                current_references,
                bound(f"{name}.run_gain", "button", "", device_id),
                bound(f"{name}.restore_gain", "button", "", device_id),
                voltage_sensors,
                current_sensors,
            )
            groups.append(group)
            channels.extend(
                ChannelBinding(channel, reference, sensor)
                for channel, reference, sensor in zip(
                    range(first_channel, first_channel + 3),
                    current_references,
                    current_sensors,
                    strict=True,
                )
            )
    return MeterBinding(topology, 1, tuple(groups), tuple(channels))


def replace_entity_info(meter: MeterBinding, role: str, **changes: Any) -> MeterBinding:
    entity = meter.role(role)
    object.__setattr__(
        entity.descriptor, "info", replace(entity.descriptor.info, **changes)
    )
    return meter


def session_for(meter: MeterBinding, failures: set[int] | None = None) -> FakeSession:
    session = FakeSession(failures)
    for entity in meter.entities:
        descriptor = entity.descriptor
        if descriptor.kind not in {"sensor", "number"}:
            continue
        state_type = SensorState if descriptor.kind == "sensor" else NumberState
        state = state_type(descriptor.key, descriptor.device_id)
        session.state_cache[(state_type, descriptor.device_id, descriptor.key)] = state
    return session


def test_maximum_topology_preflight_zeros_and_acknowledges_every_reference() -> None:
    async def run() -> None:
        meter = binding(6)
        session = session_for(meter)

        result = await async_preflight(session, meter, asyncio.Lock())

        assert result.ok
        assert len(result.zeroed_roles) == 14 * 4
        assert len(session.number_calls) == 14 * 4
        assert all(value == 0.0 for _, value, _, _ in session.number_calls)
        assert session.button_calls == []
        assert [role for role in result.zeroed_roles[:4]] == [
            "main_1.reference_voltage",
            "ct1.reference_current",
            "ct2.reference_current",
            "ct3.reference_current",
        ]

    asyncio.run(run())


@pytest.mark.parametrize(
    ("role", "changes", "code"),
    (
        ("main_1.reference_voltage", {"min_value": 1.0}, "invalid_range"),
        ("ct1.reference_current", {"step": float("nan")}, "invalid_step"),
        ("main_1.voltage_a", {"available": False}, "unavailable"),
    ),
)
def test_preflight_rejects_invalid_range_step_or_availability(
    role: str, changes: dict[str, Any], code: str
) -> None:
    async def run() -> None:
        meter = replace_entity_info(binding(0), role, **changes)
        session = session_for(meter)

        result = await async_preflight(session, meter, asyncio.Lock())

        assert not result.ok
        assert code in {issue.code for issue in result.issues}
        assert session.number_calls == []

    asyncio.run(run())


def test_preflight_checks_units_and_device_lock() -> None:
    async def run() -> None:
        meter = binding(0)
        entity = meter.role("ct1.reference_current")
        object.__setattr__(entity.descriptor, "unit", "V")
        invalid = await async_preflight(session_for(meter), meter, asyncio.Lock())
        assert "invalid_unit" in {issue.code for issue in invalid.issues}

        lock = asyncio.Lock()
        await lock.acquire()
        busy_session = FakeSession()
        busy = await async_preflight(busy_session, binding(0), lock)
        assert {issue.code for issue in busy.issues} == {"device_busy"}
        assert busy_session.number_calls == []
        lock.release()

    asyncio.run(run())


def test_preflight_rejects_missing_native_sensor_state() -> None:
    async def run() -> None:
        meter = binding(0)
        session = session_for(meter)
        missing = meter.role("main_1.voltage_b").descriptor
        session.state_cache.pop((SensorState, missing.device_id, missing.key))

        result = await async_preflight(session, meter, asyncio.Lock())

        assert not result.ok
        assert any(
            issue.code == "unavailable" and issue.role == "main_1.voltage_b"
            for issue in result.issues
        )
        assert session.number_calls == []

    asyncio.run(run())


def test_preflight_accumulates_zero_ack_failures_and_continues() -> None:
    async def run() -> None:
        meter = binding(0)
        failed_keys = {
            meter.role("main_1.reference_voltage").descriptor.key,
            meter.role("ct4.reference_current").descriptor.key,
        }
        session = session_for(meter, failed_keys)

        result = await async_preflight(session, meter, asyncio.Lock())

        assert not result.ok
        assert len([issue for issue in result.issues if issue.code == "zero_ack"]) == 2
        assert len(session.number_calls) == 8

    asyncio.run(run())


def test_zero_guard_preserves_original_and_accumulates_cleanup_failures() -> None:
    class Engine:
        calls = 0

        async def async_zero_all_references(self, session: object) -> None:
            self.calls += 1
            if self.calls == 2:
                raise ReferenceZeroError((TimeoutError("ct1"), OSError("ct2")))

    async def run() -> None:
        engine = Engine()
        with pytest.raises(ValueError, match="operation failed") as error:
            async with zero_reference_guard(engine, object()):
                raise ValueError("operation failed")

        assert [str(item) for item in error.value.cleanup_errors] == ["ct1", "ct2"]
        assert engine.calls == 2

        with pytest.raises(ReferenceCleanupError) as cleanup:
            async with zero_reference_guard(Engine(), object()):
                pass
        assert len(cleanup.value.failures) == 2

    asyncio.run(run())


@pytest.mark.parametrize("cancel_count", (1, 3))
def test_zero_guard_drains_cleanup_without_unhandled_shield_exception(
    cancel_count: int,
) -> None:
    class Engine:
        def __init__(self) -> None:
            self.calls = 0
            self.cleanup_started = asyncio.Event()
            self.release_cleanup = asyncio.Event()
            self.cleanup_finished = False

        async def async_zero_all_references(self, session: object) -> None:
            self.calls += 1
            if self.calls == 1:
                return
            self.cleanup_started.set()
            await self.release_cleanup.wait()
            self.cleanup_finished = True
            raise ReferenceZeroError((TimeoutError("ct1 cleanup"),))

    async def run() -> None:
        engine = Engine()
        loop = asyncio.get_running_loop()
        unhandled: list[dict[str, object]] = []
        previous_handler = loop.get_exception_handler()
        loop.set_exception_handler(lambda _loop, context: unhandled.append(context))

        async def guarded() -> None:
            async with zero_reference_guard(engine, object()):
                pass

        try:
            task = asyncio.create_task(guarded())
            await engine.cleanup_started.wait()
            for _ in range(cancel_count):
                task.cancel()
                await asyncio.sleep(0)
                assert not task.done()
            engine.release_cleanup.set()
            with pytest.raises(asyncio.CancelledError) as cancelled:
                await task
            await asyncio.sleep(0)
            assert engine.cleanup_finished
            assert [str(item) for item in cancelled.value.cleanup_errors] == [
                "ct1 cleanup"
            ]
            assert unhandled == []
        finally:
            loop.set_exception_handler(previous_handler)

    asyncio.run(run())
