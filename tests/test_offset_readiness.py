"""Tests for board-wide offset calibration readiness."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from types import SimpleNamespace
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.entity_binding import (
    BoundEntity,
    ResolutionSource,
)
from custom_components.circuitsetup_energy_meter_helper.entity_catalog import (
    EntityDescriptor,
)
from custom_components.circuitsetup_energy_meter_helper.offset_readiness import (
    OffsetReadinessThresholds,
    async_check_offset_readiness,
)
from custom_components.circuitsetup_energy_meter_helper.state_tracker import (
    AbsoluteSensorSampleWindow,
)

THRESHOLDS = OffsetReadinessThresholds(
    sample_count=3,
    zero_voltage_peak_volts=0.5,
    zero_voltage_spread_volts=0.2,
    zero_current_peak_amps=0.1,
    zero_current_spread_amps=0.05,
    voltage_present_minimum_volts=100.0,
    voltage_present_spread_volts=1.0,
)


def _window(
    values: tuple[float, float, float], *, generation: int = 7
) -> AbsoluteSensorSampleWindow:
    minimum = min(values)
    maximum = max(values)
    return AbsoluteSensorSampleWindow(
        values,
        (10.1, 10.2, 10.3),
        generation,
        sum(values) / 3,
        minimum,
        maximum,
        max(abs(minimum), abs(maximum)),
        maximum - minimum,
    )


def _entity(role: str, key: int) -> BoundEntity:
    return BoundEntity(
        role,
        EntityDescriptor(
            SimpleNamespace(),
            "sensor",
            role.replace(".", "_"),
            role,
            "A" if "current" in role else "V",
            0,
            key,
            False,
        ),
        ResolutionSource.OBJECT_ID,
    )


def _binding() -> Any:
    groups = []
    key = 1
    for group_index in range(2):
        voltage = tuple(
            _entity(f"main_{group_index + 1}.voltage_{phase}", key + index)
            for index, phase in enumerate("abc")
        )
        key += 3
        current = tuple(
            _entity(f"ct{group_index * 3 + index + 1}.current_sensor", key + index)
            for index in range(3)
        )
        key += 3
        groups.append(SimpleNamespace(voltage_sensors=voltage, current_sensors=current))
    return SimpleNamespace(connection_generation=7, groups=tuple(groups))


@dataclass(slots=True)
class FakeSession:
    windows: dict[int, AbsoluteSensorSampleWindow | BaseException]
    connected: bool = True
    connection_generation: int = 7
    calls: list[dict[str, Any]] = field(default_factory=list)

    async def async_wait_for_absolute_sensor_window(
        self, key: int, **kwargs: Any
    ) -> AbsoluteSensorSampleWindow:
        self.calls.append({"key": key, **kwargs})
        result = self.windows[key]
        if isinstance(result, BaseException):
            raise result
        return result


def test_stage_one_accepts_exact_zero_on_every_phase_and_returns_thresholds() -> None:
    async def run() -> None:
        session = FakeSession({key: _window((0.0, 0.0, 0.0)) for key in range(1, 13)})

        result = await async_check_offset_readiness(
            session, _binding(), 0, 1, thresholds=THRESHOLDS, timeout=0.5
        )

        assert result.ready
        assert result.reasons == ()
        assert len(result.entities) == 12
        assert all(evidence.ready for evidence in result.entities)
        assert result.thresholds == THRESHOLDS
        assert {call["sample_count"] for call in session.calls} == {3}
        assert {call["connection_generation"] for call in session.calls} == {7}
        assert len({call["after"] for call in session.calls}) == 1

    asyncio.run(run())


def test_stage_one_reports_voltage_peak_and_current_spread_failures() -> None:
    async def run() -> None:
        windows = {key: _window((0.0, 0.0, 0.0)) for key in range(1, 13)}
        windows[1] = _window((0.4, 0.5, 0.6))
        windows[4] = _window((-0.06, 0.0, 0.06))

        result = await async_check_offset_readiness(
            FakeSession(windows), _binding(), 0, 1, thresholds=THRESHOLDS
        )

        assert not result.ready
        assert result.entities[0].reasons == (
            "absolute peak exceeds zero_voltage_peak_volts",
        )
        assert result.entities[3].reasons == (
            "absolute spread exceeds zero_current_spread_amps",
        )
        assert result.reasons == (
            "main_1.voltage_a: absolute peak exceeds zero_voltage_peak_volts",
            "ct1.current_sensor: absolute spread exceeds zero_current_spread_amps",
        )

    asyncio.run(run())


def test_stage_two_accepts_stable_present_voltage_and_zero_current() -> None:
    async def run() -> None:
        binding = _binding()
        voltage_keys = {
            entity.descriptor.key
            for group in binding.groups
            for entity in group.voltage_sensors
        }
        windows = {
            key: _window((119.8, 120.0, 120.2))
            if key in voltage_keys
            else _window((-0.01, 0.0, 0.01))
            for key in range(1, 13)
        }

        result = await async_check_offset_readiness(
            FakeSession(windows), binding, 0, 2, thresholds=THRESHOLDS
        )

        assert result.ready
        assert result.thresholds.voltage_present_minimum_volts == 100.0
        assert result.thresholds.voltage_present_spread_volts == 1.0

    asyncio.run(run())


def test_stage_two_reports_absent_unstable_voltage_and_nonzero_current() -> None:
    async def run() -> None:
        binding = _binding()
        voltage_keys = {
            entity.descriptor.key
            for group in binding.groups
            for entity in group.voltage_sensors
        }
        windows = {
            key: _window((120.0, 120.0, 120.0))
            if key in voltage_keys
            else _window((0.0, 0.0, 0.0))
            for key in range(1, 13)
        }
        windows[1] = _window((99.0, 99.0, 99.0))
        windows[2] = _window((119.0, 120.0, 121.0))
        windows[4] = _window((0.11, 0.11, 0.11))

        result = await async_check_offset_readiness(
            FakeSession(windows), binding, 0, 2, thresholds=THRESHOLDS
        )

        assert not result.ready
        assert result.entities[0].reasons == (
            "minimum is below voltage_present_minimum_volts",
        )
        assert result.entities[1].reasons == (
            "absolute spread exceeds voltage_present_spread_volts",
        )
        assert result.entities[3].reasons == (
            "absolute peak exceeds zero_current_peak_amps",
        )

    asyncio.run(run())


def test_readiness_rejects_window_from_another_generation() -> None:
    async def run() -> None:
        windows = {key: _window((0.0, 0.0, 0.0)) for key in range(1, 13)}
        windows[7] = _window((0.0, 0.0, 0.0), generation=6)

        result = await async_check_offset_readiness(
            FakeSession(windows), _binding(), 0, 1, thresholds=THRESHOLDS
        )

        assert not result.ready
        assert result.entities[6].reasons == (
            "window is from another connection generation",
        )
        assert result.reasons == (
            "main_2.voltage_a: window is from another connection generation",
        )

    asyncio.run(run())


def test_readiness_does_not_swallow_session_cancellation() -> None:
    async def run() -> None:
        windows: dict[int, AbsoluteSensorSampleWindow | BaseException] = {
            key: _window((0.0, 0.0, 0.0)) for key in range(1, 13)
        }
        windows[1] = asyncio.CancelledError()

        with pytest.raises(asyncio.CancelledError):
            await async_check_offset_readiness(
                FakeSession(windows), _binding(), 0, 1, thresholds=THRESHOLDS
            )

    asyncio.run(run())
