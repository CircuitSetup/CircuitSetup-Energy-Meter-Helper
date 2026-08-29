"""Tests for generation-local native state evidence."""

from __future__ import annotations

import asyncio
import math
from dataclasses import dataclass

import pytest

from custom_components.circuitsetup_energy_meter_helper.state_tracker import (
    FreshWindowError,
    StateDisconnectedError,
    StateTracker,
    StateUnavailableError,
)


@dataclass(slots=True)
class SensorState:
    key: int
    state: float
    device_id: int = 0
    missing_state: bool = False


@dataclass(slots=True)
class NumberState:
    key: int
    state: float
    device_id: int = 0
    missing_state: bool = False


def test_cache_uses_state_type_device_and_key_and_disconnect_marks_stale() -> None:
    tracker = StateTracker()
    tracker.connect(4)
    state = SensorState(11, 120.0, device_id=7)

    tracker.record(state, received_at=10.0)

    cache_key = (SensorState, 7, 11)
    assert tracker.state_cache[cache_key].state is state
    assert not tracker.state_cache[cache_key].stale
    tracker.disconnect()
    assert tracker.state_cache[cache_key].stale
    with pytest.raises(StateUnavailableError, match="stale"):
        tracker.current(SensorState, 11, device_id=7)


def test_wait_current_states_requires_usable_records() -> None:
    async def run() -> None:
        tracker = StateTracker()
        tracker.connect(1)
        keys = frozenset({(0, 3), (7, 11)})
        tracker.record(SensorState(3, 0.0, missing_state=True), received_at=1.0)
        tracker.record(
            SensorState(11, 0.0, device_id=7, missing_state=True), received_at=1.0
        )

        waiting = asyncio.create_task(tracker.wait_current_states("SensorState", keys))
        await asyncio.sleep(0)
        assert not waiting.done()

        tracker.record(SensorState(3, 1.0), received_at=2.0)
        tracker.record(SensorState(11, 1.0, device_id=7), received_at=2.0)
        await waiting

    asyncio.run(run())


def test_fresh_window_excludes_boundary_and_calculates_range_percent() -> None:
    tracker = StateTracker()
    tracker.connect(1)
    tracker.record(SensorState(3, 99.0), received_at=10.0)
    for timestamp, value in ((10.1, 100.0), (10.2, 101.0), (10.3, 99.0)):
        tracker.record(SensorState(3, value), received_at=timestamp)

    window = tracker.sensor_window(SensorState, 3, fresh_after=10.0, sample_count=3)

    assert window.values == (100.0, 101.0, 99.0)
    assert window.mean == 100.0
    assert window.range_percent == 2.0
    assert all(timestamp > 10.0 for timestamp in window.received_at)


@pytest.mark.parametrize(
    "states, message",
    (
        ((SensorState(3, 1.0),), "missing fresh"),
        (
            (SensorState(3, 1.0), SensorState(3, 2.0, missing_state=True)),
            "unavailable",
        ),
        ((SensorState(3, math.nan), SensorState(3, 1.0)), "non-finite"),
        ((SensorState(3, -1.0), SensorState(3, 1.0)), "zero mean"),
    ),
)
def test_fresh_window_rejects_invalid_evidence(
    states: tuple[SensorState, ...], message: str
) -> None:
    tracker = StateTracker()
    tracker.connect(1)
    for index, state in enumerate(states, start=1):
        tracker.record(state, received_at=float(index))

    with pytest.raises(FreshWindowError, match=message):
        tracker.sensor_window(SensorState, 3, fresh_after=0.0, sample_count=2)


def test_absolute_window_accepts_zero_and_retains_generation_and_statistics() -> None:
    tracker = StateTracker()
    tracker.connect(4)
    for timestamp, value in ((10.1, 0.0), (10.2, -0.2), (10.3, 0.1)):
        tracker.record(SensorState(3, value), received_at=timestamp)

    window = tracker.absolute_sensor_window(
        SensorState,
        3,
        fresh_after=10.0,
        sample_count=3,
        connection_generation=4,
    )

    assert window.values == (0.0, -0.2, 0.1)
    assert window.received_at == (10.1, 10.2, 10.3)
    assert window.connection_generation == 4
    assert window.mean == pytest.approx(-1.0 / 30.0)
    assert window.minimum == -0.2
    assert window.maximum == 0.1
    assert window.absolute_peak == 0.2
    assert window.absolute_spread == pytest.approx(0.3)


@pytest.mark.parametrize(
    ("states", "generation", "message"),
    (
        ((SensorState(3, 0.0), SensorState(3, 0.0)), 1, "missing fresh"),
        (
            (
                SensorState(3, 0.0),
                SensorState(3, math.inf),
                SensorState(3, 0.0),
            ),
            1,
            "non-finite",
        ),
        (
            (SensorState(3, 0.0), SensorState(3, 0.0), SensorState(3, 0.0)),
            2,
            "generation",
        ),
    ),
)
def test_absolute_window_rejects_insufficient_nonfinite_and_wrong_generation(
    states: tuple[SensorState, ...], generation: int, message: str
) -> None:
    tracker = StateTracker()
    tracker.connect(1)
    for index, state in enumerate(states, start=1):
        tracker.record(state, received_at=float(index))

    with pytest.raises(FreshWindowError, match=message):
        tracker.absolute_sensor_window(
            SensorState,
            3,
            fresh_after=0.0,
            sample_count=3,
            connection_generation=generation,
        )


def test_absolute_window_rejects_stale_samples_and_fewer_than_three_requested() -> (
    None
):
    tracker = StateTracker()
    tracker.connect(1)
    for timestamp in (1.0, 2.0, 3.0):
        tracker.record(SensorState(3, 0.0), received_at=timestamp)

    with pytest.raises(FreshWindowError, match="missing fresh"):
        tracker.absolute_sensor_window(
            SensorState,
            3,
            fresh_after=3.0,
            sample_count=3,
            connection_generation=1,
        )
    with pytest.raises(ValueError, match="at least three"):
        tracker.absolute_sensor_window(
            SensorState,
            3,
            fresh_after=0.0,
            sample_count=2,
            connection_generation=1,
        )


def test_number_ack_requires_post_dispatch_state_and_half_step_tolerance() -> None:
    async def run() -> None:
        tracker = StateTracker()
        tracker.connect(1)
        tracker.record(NumberState(5, 12.0), received_at=1.0)
        future = tracker.expect_number_state(
            NumberState,
            5,
            target=12.0,
            step=0.2,
            dispatched_after=5.0,
        )
        assert not future.done()
        tracker.record(NumberState(5, 12.0), received_at=5.0)
        assert not future.done()
        tracker.record(NumberState(5, 12.1), received_at=5.1)
        assert await future == 12.1

    asyncio.run(run())


def test_number_ack_rejects_unavailable_and_disconnect_fails_pending() -> None:
    async def run() -> None:
        tracker = StateTracker()
        tracker.connect(1)
        unavailable = tracker.expect_number_state(
            NumberState, 5, target=0.0, step=0.1, dispatched_after=1.0
        )
        tracker.record(NumberState(5, 0.0, missing_state=True), received_at=2.0)
        with pytest.raises(StateUnavailableError):
            await unavailable

        pending = tracker.expect_number_state(
            NumberState, 6, target=0.0, step=0.1, dispatched_after=2.0
        )
        tracker.disconnect()
        with pytest.raises(StateDisconnectedError):
            await pending

    asyncio.run(run())
