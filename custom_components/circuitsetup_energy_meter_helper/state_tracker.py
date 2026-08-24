"""Generation-local native state evidence and acknowledgements."""

from __future__ import annotations

import asyncio
import math
from collections import defaultdict, deque
from dataclasses import dataclass, replace
from statistics import fmean
from typing import Any

type StateCacheKey = tuple[type[Any], int, int]


class StateTrackingError(RuntimeError):
    """Native state cannot safely be used as calibration evidence."""


class StateUnavailableError(StateTrackingError):
    """An entity state is missing or stale."""


class StateDisconnectedError(ConnectionError):
    """The native connection ended while state evidence was pending."""


class FreshWindowError(StateTrackingError):
    """A complete finite fresh sensor window is unavailable."""


@dataclass(frozen=True, slots=True)
class CachedState:
    state: Any
    received_at: float
    stale: bool = False


@dataclass(frozen=True, slots=True)
class SensorSampleWindow:
    values: tuple[float, ...]
    received_at: tuple[float, ...]
    mean: float
    minimum: float
    maximum: float
    range_percent: float


@dataclass(frozen=True, slots=True)
class AbsoluteSensorSampleWindow:
    values: tuple[float, ...]
    received_at: tuple[float, ...]
    connection_generation: int
    mean: float
    minimum: float
    maximum: float
    absolute_peak: float
    absolute_spread: float


@dataclass(slots=True)
class _NumberWaiter:
    state_type: type[Any] | None
    target: float
    tolerance: float
    dispatched_after: float
    future: asyncio.Future[float]


class StateTracker:
    """Route native callbacks without touching Home Assistant state services."""

    def __init__(self, *, history_size: int = 100) -> None:
        if history_size < 1:
            raise ValueError("history_size must be positive")
        self._history_size = history_size
        self._cache: dict[StateCacheKey, CachedState] = {}
        self._history: dict[StateCacheKey, deque[CachedState]] = defaultdict(
            lambda: deque(maxlen=self._history_size)
        )
        self._waiters: dict[tuple[int, int], list[_NumberWaiter]] = defaultdict(list)
        self._state_event = asyncio.Event()
        self.connection_generation = 0
        self.connected = False

    @property
    def state_cache(self) -> dict[StateCacheKey, CachedState]:
        return dict(self._cache)

    def connect(self, connection_generation: int) -> None:
        if connection_generation < 1:
            raise ValueError("connection generation must be positive")
        if self._waiters:
            self.disconnect()
        self._cache.clear()
        self._history.clear()
        self.connection_generation = connection_generation
        self.connected = True
        self._wake_waiters()

    def disconnect(self) -> None:
        self.connected = False
        self._cache = {
            key: replace(record, stale=True) for key, record in self._cache.items()
        }
        error = StateDisconnectedError("native state connection was lost")
        for waiters in self._waiters.values():
            for waiter in waiters:
                if not waiter.future.done():
                    waiter.future.set_exception(StateDisconnectedError(str(error)))
        self._waiters.clear()
        self._wake_waiters()

    def cancel_waiters(self) -> None:
        """Cancel pending acknowledgements during caller-owned shutdown."""
        for waiters in self._waiters.values():
            for waiter in waiters:
                waiter.future.cancel()
        self._waiters.clear()
        self._wake_waiters()

    def record(self, state: Any, *, received_at: float) -> None:
        if not self.connected:
            return
        if not math.isfinite(received_at):
            raise ValueError("received_at must be finite")
        key = (type(state), int(state.device_id), int(state.key))
        record = CachedState(state, received_at)
        self._cache[key] = record
        self._history[key].append(record)
        self._wake_waiters()
        if type(state).__name__ != "NumberState":
            return
        waiter_key = (int(state.device_id), int(state.key))
        waiters = self._waiters.get(waiter_key)
        if not waiters:
            return
        for waiter in tuple(waiters):
            if waiter.state_type is not None and waiter.state_type is not type(state):
                continue
            if waiter.future.done() or received_at <= waiter.dispatched_after:
                continue
            if bool(getattr(state, "missing_state", False)):
                waiter.future.set_exception(
                    StateUnavailableError("state is unavailable")
                )
                continue
            try:
                value = float(state.state)
            except TypeError, ValueError:
                waiter.future.set_exception(
                    StateUnavailableError("state is non-finite")
                )
                continue
            if not math.isfinite(value):
                waiter.future.set_exception(
                    StateUnavailableError("state is non-finite")
                )
            elif abs(value - waiter.target) <= waiter.tolerance:
                waiter.future.set_result(value)
        self._waiters[waiter_key] = [
            waiter for waiter in waiters if not waiter.future.done()
        ]
        if not self._waiters[waiter_key]:
            self._waiters.pop(waiter_key, None)

    def current(self, state_type: type[Any], key: int, *, device_id: int = 0) -> Any:
        record = self._cache.get((state_type, device_id, key))
        if record is None:
            raise StateUnavailableError("state is unavailable")
        if record.stale or not self.connected:
            raise StateUnavailableError("state is stale")
        if bool(getattr(record.state, "missing_state", False)):
            raise StateUnavailableError("state is unavailable")
        return record.state

    def sensor_window(
        self,
        state_type: type[Any],
        key: int,
        *,
        fresh_after: float,
        sample_count: int,
        device_id: int = 0,
    ) -> SensorSampleWindow:
        if sample_count < 1:
            raise ValueError("sample_count must be positive")
        if not math.isfinite(fresh_after):
            raise ValueError("fresh_after must be finite")
        if not self.connected:
            raise FreshWindowError("sensor samples are stale")
        records = tuple(
            record
            for record in self._history.get((state_type, device_id, key), ())
            if record.received_at > fresh_after
        )
        if len(records) < sample_count:
            raise FreshWindowError("missing fresh sensor samples")
        records = records[-sample_count:]
        if any(record.stale for record in records):
            raise FreshWindowError("sensor samples are stale")
        if any(
            bool(getattr(record.state, "missing_state", False)) for record in records
        ):
            raise FreshWindowError("sensor sample is unavailable")
        try:
            values = tuple(float(record.state.state) for record in records)
        except TypeError, ValueError:
            raise FreshWindowError("sensor sample is non-finite") from None
        if not all(math.isfinite(value) for value in values):
            raise FreshWindowError("sensor sample is non-finite")
        mean = fmean(values)
        if not math.isfinite(mean) or mean == 0.0:
            raise FreshWindowError("sensor window has zero mean")
        minimum = min(values)
        maximum = max(values)
        return SensorSampleWindow(
            values,
            tuple(record.received_at for record in records),
            mean,
            minimum,
            maximum,
            100.0 * (maximum - minimum) / abs(mean),
        )

    def absolute_sensor_window(
        self,
        state_type: type[Any],
        key: int,
        *,
        fresh_after: float,
        sample_count: int,
        connection_generation: int,
        device_id: int = 0,
    ) -> AbsoluteSensorSampleWindow:
        """Return a zero-capable absolute window on one connection generation."""
        if sample_count < 1:
            raise ValueError("sample_count must be positive")
        if not math.isfinite(fresh_after):
            raise ValueError("fresh_after must be finite")
        if connection_generation != self.connection_generation:
            raise FreshWindowError("sensor samples are from another generation")
        if not self.connected:
            raise FreshWindowError("sensor samples are stale")
        records = tuple(
            record
            for record in self._history.get((state_type, device_id, key), ())
            if record.received_at > fresh_after
        )
        if len(records) < sample_count:
            raise FreshWindowError("missing fresh sensor samples")
        records = records[-sample_count:]
        if any(record.stale for record in records):
            raise FreshWindowError("sensor samples are stale")
        if any(
            bool(getattr(record.state, "missing_state", False)) for record in records
        ):
            raise FreshWindowError("sensor sample is unavailable")
        try:
            values = tuple(float(record.state.state) for record in records)
        except TypeError, ValueError:
            raise FreshWindowError("sensor sample is non-finite") from None
        if not all(math.isfinite(value) for value in values):
            raise FreshWindowError("sensor sample is non-finite")
        minimum = min(values)
        maximum = max(values)
        return AbsoluteSensorSampleWindow(
            values,
            tuple(record.received_at for record in records),
            connection_generation,
            fmean(values),
            minimum,
            maximum,
            max(abs(minimum), abs(maximum)),
            maximum - minimum,
        )

    async def wait_sensor_states(
        self,
        key: int,
        *,
        fresh_after: float,
        sample_count: int,
        device_id: int = 0,
        timeout: float = 10.0,
    ) -> SensorSampleWindow:
        """Wait for a complete fresh sensor window on this generation."""
        async with asyncio.timeout(timeout):
            while True:
                if not self.connected:
                    raise StateDisconnectedError("native state connection was lost")
                event = self._state_event
                state_type = next(
                    (
                        state_type
                        for state_type, record_device, record_key in self._history
                        if state_type.__name__ == "SensorState"
                        and record_device == device_id
                        and record_key == key
                    ),
                    None,
                )
                if state_type is not None:
                    try:
                        return self.sensor_window(
                            state_type,
                            key,
                            fresh_after=fresh_after,
                            sample_count=sample_count,
                            device_id=device_id,
                        )
                    except FreshWindowError:
                        pass
                await event.wait()

    async def wait_absolute_sensor_states(
        self,
        key: int,
        *,
        fresh_after: float,
        sample_count: int,
        connection_generation: int,
        device_id: int = 0,
        timeout: float = 10.0,
    ) -> AbsoluteSensorSampleWindow:
        """Wait for a zero-capable fresh sensor window on one generation."""
        if sample_count < 1:
            raise ValueError("sample_count must be positive")
        async with asyncio.timeout(timeout):
            while True:
                if not self.connected:
                    raise StateDisconnectedError("native state connection was lost")
                if connection_generation != self.connection_generation:
                    raise FreshWindowError(
                        "sensor samples are from another generation"
                    )
                event = self._state_event
                state_type = next(
                    (
                        state_type
                        for state_type, record_device, record_key in self._history
                        if state_type.__name__ == "SensorState"
                        and record_device == device_id
                        and record_key == key
                    ),
                    None,
                )
                if state_type is not None:
                    try:
                        return self.absolute_sensor_window(
                            state_type,
                            key,
                            fresh_after=fresh_after,
                            sample_count=sample_count,
                            connection_generation=connection_generation,
                            device_id=device_id,
                        )
                    except FreshWindowError:
                        pass
                await event.wait()

    async def wait_current_states(
        self,
        state_type_name: str,
        keys: frozenset[tuple[int, int]],
        *,
        timeout: float = 10.0,
    ) -> None:
        """Wait until every requested current state exists on this generation."""
        async with asyncio.timeout(timeout):
            while True:
                if not self.connected:
                    raise StateDisconnectedError("native state connection was lost")
                event = self._state_event
                present = {
                    (device_id, key)
                    for state_type, device_id, key in self._cache
                    if state_type.__name__ == state_type_name
                }
                if keys <= present:
                    return
                await event.wait()

    def expect_number_state(
        self,
        state_type: type[Any] | None,
        key: int,
        *,
        target: float,
        step: float,
        dispatched_after: float,
        device_id: int = 0,
        tolerance: float | None = None,
    ) -> asyncio.Future[float]:
        if not self.connected:
            raise StateDisconnectedError("native state connection is not active")
        if not math.isfinite(target) or not math.isfinite(dispatched_after):
            raise ValueError("number target and dispatch boundary must be finite")
        if not math.isfinite(step) or step <= 0:
            raise ValueError("number step must be finite and positive")
        limit = step / 2 if tolerance is None else tolerance
        if not math.isfinite(limit) or limit < 0:
            raise ValueError("number tolerance must be finite and non-negative")
        future = asyncio.get_running_loop().create_future()
        cache_key = (device_id, key)
        waiter = _NumberWaiter(state_type, target, limit, dispatched_after, future)
        self._waiters[cache_key].append(waiter)

        def remove_waiter(_: asyncio.Future[float]) -> None:
            waiters = self._waiters.get(cache_key)
            if waiters is None:
                return
            self._waiters[cache_key] = [item for item in waiters if item is not waiter]
            if not self._waiters[cache_key]:
                self._waiters.pop(cache_key, None)

        future.add_done_callback(remove_waiter)
        return future

    def _wake_waiters(self) -> None:
        event = self._state_event
        self._state_event = asyncio.Event()
        event.set()
