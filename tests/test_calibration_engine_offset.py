"""Board-level voltage/current and power offset calibration tests."""

from __future__ import annotations

import asyncio
from dataclasses import replace
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    CalibrationEngine,
    CalibrationError,
)
from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    LogEvidenceError,
    OffsetRunEvidence,
    PhaseOffsetEvidence,
    PhasePowerOffsetEvidence,
    PowerOffsetRunEvidence,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    StoredInterruptedSession,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    CalibrationBusyError,
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.state_tracker import (
    AbsoluteSensorSampleWindow,
)
from tests.test_preflight import binding, binding_with_offset_controls

MAC = "aabbccddeeff"
OFFSET_TABLES = (
    ((-12, 31), (-13, 32), (-14, 33)),
    ((-21, 41), (-22, 42), (-23, 43)),
)
POWER_TABLES = (
    ((101, -201), (102, -202), (103, -203)),
    ((111, -211), (112, -212), (113, -213)),
)


def _window(
    values: tuple[float, float, float], generation: int = 1
) -> AbsoluteSensorSampleWindow:
    minimum = min(values)
    maximum = max(values)
    return AbsoluteSensorSampleWindow(
        values,
        (1.0, 2.0, 3.0),
        generation,
        sum(values) / 3,
        minimum,
        maximum,
        max(abs(minimum), abs(maximum)),
        maximum - minimum,
    )


def _offset_evidence(
    kwargs: dict[str, Any], table: tuple[tuple[int, int], ...]
) -> OffsetRunEvidence:
    return OffsetRunEvidence(
        kwargs["connection_generation"],
        kwargs["operation_sequence"],
        kwargs["target_instance_id"],
        tuple(
            PhaseOffsetEvidence(phase, *values)
            for phase, values in zip("ABC", table, strict=True)
        ),  # type: ignore[arg-type]
        True,
        True,
        (),
    )


def _power_evidence(
    kwargs: dict[str, Any], table: tuple[tuple[int, int], ...]
) -> PowerOffsetRunEvidence:
    return PowerOffsetRunEvidence(
        kwargs["connection_generation"],
        kwargs["operation_sequence"],
        kwargs["target_instance_id"],
        tuple(
            PhasePowerOffsetEvidence(phase, *values)
            for phase, values in zip("ABC", table, strict=True)
        ),  # type: ignore[arg-type]
        True,
        True,
        (),
    )


class CountingSessionManager(SessionManager):
    def __init__(self) -> None:
        super().__init__()
        self.acquire_count = 0

    async def async_acquire_calibration(self, mac: str) -> Any:
        self.acquire_count += 1
        return await super().async_acquire_calibration(mac)


class FakeOffsetSession:
    def __init__(
        self,
        meter: Any,
        stage: int,
        outcomes: dict[str, tuple[tuple[int, int], ...] | BaseException] | None = None,
        *,
        window_generation: int = 1,
        window_overrides: dict[int, tuple[float, float, float]] | None = None,
    ) -> None:
        self.connected = True
        self.connection_generation = 1
        self.stage = stage
        self.outcomes = outcomes or {}
        self.window_generation = window_generation
        self.window_overrides = window_overrides or {}
        self.events: list[tuple[Any, ...]] = []
        self.pending_waiter: asyncio.Future[Any] | None = None
        self.voltage_keys = {
            entity.descriptor.key
            for group in meter.groups
            for entity in group.voltage_sensors
        }
        self.sessions: SessionManager | None = None

    async def async_wait_for_absolute_sensor_window(
        self, key: int, **kwargs: Any
    ) -> AbsoluteSensorSampleWindow:
        self.events.append(("readiness", key, kwargs))
        values = (
            (120.0, 120.0, 120.0)
            if self.stage == 2 and key in self.voltage_keys
            else (0.0, 0.0, 0.0)
        )
        values = self.window_overrides.get(key, values)
        return _window(values, self.window_generation)

    async def async_set_number(
        self,
        key: int,
        state: float,
        *,
        device_id: int = 0,
        tolerance: float = 1e-6,
        timeout: float = 10.0,
    ) -> object:
        del tolerance, timeout
        self._assert_locked()
        self.events.append(("number", key, state, device_id))
        return object()

    def expect_offset_run(self, **kwargs: Any) -> asyncio.Future[OffsetRunEvidence]:
        self.events.append(("expect_offset", kwargs))
        return self._future(kwargs, power=False)

    def expect_power_offset_run(
        self, **kwargs: Any
    ) -> asyncio.Future[PowerOffsetRunEvidence]:
        self.events.append(("expect_power_offset", kwargs))
        return self._future(kwargs, power=True)

    def _future(self, kwargs: dict[str, Any], *, power: bool) -> Any:
        future = asyncio.get_running_loop().create_future()
        outcome = self.outcomes.get(kwargs["target_instance_id"])
        if isinstance(outcome, BaseException):
            future.set_exception(outcome)
        elif outcome is None:
            self.pending_waiter = future
        elif power:
            future.set_result(_power_evidence(kwargs, outcome))
        else:
            future.set_result(_offset_evidence(kwargs, outcome))
        return future

    async def async_press_button(self, key: int, *, device_id: int = 0) -> None:
        self._assert_locked()
        self.events.append(("button", key, device_id))

    def _assert_locked(self) -> None:
        if self.sessions is not None:
            assert self.sessions.is_config_locked(MAC)
            assert self.sessions.is_calibration_locked(MAC)


def _marker_writer(events: list[tuple[Any, ...]]) -> tuple[list[Any], Any]:
    markers: list[StoredInterruptedSession | None] = []

    async def persist(mac: str, marker: StoredInterruptedSession | None) -> None:
        markers.append(marker)
        events.append(("marker", mac, marker.state if marker else None))

    return markers, persist


def _button_keys(meter: Any, stage: int, board_index: int = 1) -> tuple[int, ...]:
    controls = meter.offset_capability.controls[board_index * 2 : board_index * 2 + 2]
    return tuple(
        (item.run_offset if stage == 1 else item.run_power_offset).descriptor.key
        for item in controls
    )


def _clear_keys(meter: Any) -> set[int]:
    return {
        entity.descriptor.key
        for controls in meter.offset_capability.controls
        for entity in (controls.restore_offset, controls.restore_power_offset)
    }


@pytest.mark.parametrize(
    ("stage", "tables", "property_name"),
    (
        (1, OFFSET_TABLES, "expected_phase_offsets"),
        (2, POWER_TABLES, "expected_phase_power_offsets"),
    ),
)
def test_board_offset_calibrates_both_chips_in_order_under_one_lease(
    stage: int,
    tables: tuple[tuple[tuple[int, int], ...], ...],
    property_name: str,
) -> None:
    async def run() -> None:
        meter = binding_with_offset_controls(1)
        outcomes = dict(zip(("addon1_1", "addon1_2"), tables, strict=True))
        session = FakeOffsetSession(meter, stage, outcomes)
        sessions = CountingSessionManager()
        session.sessions = sessions
        markers, persist = _marker_writer(session.events)
        engine = CalibrationEngine(sessions, persist)

        result = await engine.async_calibrate_offset_board(
            MAC, session, meter, 1, stage
        )

        assert result.state.value == "applied_pending_restart_verification"
        assert result.board_index == 1
        assert result.stage == stage
        assert result.expected_tables == (
            ("addon1_1", tables[0]),
            ("addon1_2", tables[1]),
        )
        assert result.unfinished_group_keys == ()
        assert sessions.acquire_count == 1
        assert [event[1] for event in session.events if event[0] == "button"] == list(
            _button_keys(meter, stage)
        )
        names = [event[0] for event in session.events]
        waiter_name = "expect_offset" if stage == 1 else "expect_power_offset"
        waiter_indexes = [
            index for index, name in enumerate(names) if name == waiter_name
        ]
        button_indexes = [index for index, name in enumerate(names) if name == "button"]
        assert all(
            waiter < button
            for waiter, button in zip(waiter_indexes, button_indexes, strict=True)
        )
        assert max(
            index for index, name in enumerate(names) if name == "readiness"
        ) < names.index("marker")
        assert names.index("marker") < names.index("number") < names.index("button")
        assert markers[0] is not None
        assert markers[0].changed_channels == (7, 8, 9, 10, 11, 12)
        assert len([event for event in session.events if event[0] == "readiness"]) == 12
        pressed = {event[1] for event in session.events if event[0] == "button"}
        assert not pressed.intersection(_clear_keys(meter))
        pending = sessions.pending_calibration(MAC)
        assert pending is not None
        assert getattr(pending, property_name) == {
            "addon1_1": tables[0],
            "addon1_2": tables[1],
        }
        assert not sessions.is_calibration_locked(MAC)

    asyncio.run(run())


def test_offset_gates_controls_and_fresh_readiness_before_mutation() -> None:
    async def run() -> None:
        unavailable = binding(0)
        unavailable_session = FakeOffsetSession(unavailable, 1)
        _, persist = _marker_writer(unavailable_session.events)
        engine = CalibrationEngine(SessionManager(), persist)

        with pytest.raises(CalibrationError, match="controls"):
            await engine.async_calibrate_offset_board(
                MAC, unavailable_session, unavailable, 0, 1
            )
        assert unavailable_session.events == []

        meter = binding_with_offset_controls()
        stale = FakeOffsetSession(meter, 1, window_generation=0)
        markers, persist = _marker_writer(stale.events)
        sessions = SessionManager()
        engine = CalibrationEngine(sessions, persist)

        with pytest.raises(CalibrationError, match="readiness"):
            await engine.async_calibrate_offset_board(MAC, stale, meter, 0, 1)

        assert markers == []
        assert not any(
            event[0] in {"number", "button", "expect_offset"} for event in stale.events
        )
        assert sessions.pending_calibration(MAC) is None
        assert not sessions.is_calibration_locked(MAC)

    asyncio.run(run())


@pytest.mark.parametrize(
    ("stage", "sensor_role", "values"),
    (
        (1, "main_1.voltage_a", (1.1, 1.1, 1.1)),
        (1, "ct1.current_sensor", (0.3, 0.3, 0.3)),
        (2, "main_2.voltage_c", (0.0, 0.0, 0.0)),
        (2, "ct6.current_sensor", (0.3, 0.3, 0.3)),
    ),
)
def test_offset_rechecks_every_stage_condition_immediately_before_mutation(
    stage: int, sensor_role: str, values: tuple[float, float, float]
) -> None:
    async def run() -> None:
        meter = binding_with_offset_controls()
        key = meter.role(sensor_role).descriptor.key
        tables = OFFSET_TABLES if stage == 1 else POWER_TABLES
        session = FakeOffsetSession(
            meter,
            stage,
            dict(zip(("meter_main1", "meter_main2"), tables, strict=True)),
            window_overrides={key: values},
        )
        markers, persist = _marker_writer(session.events)
        sessions = SessionManager()
        engine = CalibrationEngine(sessions, persist)

        with pytest.raises(CalibrationError, match="readiness"):
            await engine.async_calibrate_offset_board(MAC, session, meter, 0, stage)

        assert len([event for event in session.events if event[0] == "readiness"]) == 12
        assert markers == []
        assert not any(event[0] in {"number", "button"} for event in session.events)
        assert sessions.pending_calibration(MAC) is None
        assert not sessions.is_calibration_locked(MAC)

    asyncio.run(run())


def test_second_chip_failure_is_partial_and_retry_runs_only_unfinished_chip() -> None:
    async def run() -> None:
        meter = binding_with_offset_controls()
        session = FakeOffsetSession(
            meter,
            1,
            {
                "meter_main1": OFFSET_TABLES[0],
                "meter_main2": LogEvidenceError("save failed"),
            },
        )
        sessions = CountingSessionManager()
        session.sessions = sessions
        _, persist = _marker_writer(session.events)
        engine = CalibrationEngine(sessions, persist)

        partial = await engine.async_calibrate_offset_board(MAC, session, meter, 0, 1)

        assert partial.state.value == "partial"
        assert partial.expected_tables == (("main_1", OFFSET_TABLES[0]),)
        assert partial.unfinished_group_keys == ("main_2",)
        assert partial.retry_allowed
        pending = sessions.pending_calibration(MAC)
        assert pending is not None
        assert pending.expected_phase_offsets == {"meter_main1": OFFSET_TABLES[0]}
        first_buttons = [event for event in session.events if event[0] == "button"]

        with pytest.raises(CalibrationError, match="confirmation"):
            await engine.async_calibrate_offset_board(MAC, session, meter, 0, 1)
        assert [
            event for event in session.events if event[0] == "button"
        ] == first_buttons

        session.outcomes["meter_main2"] = OFFSET_TABLES[1]
        complete = await engine.async_calibrate_offset_board(
            MAC, session, meter, 0, 1, confirm_retry=True
        )

        assert complete.state.value == "applied_pending_restart_verification"
        assert complete.expected_tables == (
            ("main_1", OFFSET_TABLES[0]),
            ("main_2", OFFSET_TABLES[1]),
        )
        all_buttons = [event[1] for event in session.events if event[0] == "button"]
        assert all_buttons == [*_button_keys(meter, 1, 0), _button_keys(meter, 1, 0)[1]]
        assert not set(all_buttons).intersection(_clear_keys(meter))
        assert sessions.acquire_count == 3

    asyncio.run(run())


def test_wrong_generation_offset_evidence_is_indeterminate_and_not_retained() -> None:
    async def run() -> None:
        meter = binding_with_offset_controls()
        session = FakeOffsetSession(meter, 1, {"meter_main1": OFFSET_TABLES[0]})
        _, persist = _marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)
        original = session.expect_offset_run

        def wrong_generation(**kwargs: Any) -> asyncio.Future[OffsetRunEvidence]:
            future = original(**kwargs)
            if future.done() and future.exception() is None:
                future = asyncio.get_running_loop().create_future()
                future.set_result(
                    replace(original(**kwargs).result(), connection_generation=99)
                )
            return future

        session.expect_offset_run = wrong_generation  # type: ignore[method-assign]

        result = await engine.async_calibrate_offset_board(MAC, session, meter, 0, 1)

        assert result.state.value == "indeterminate"
        assert result.expected_tables == ()
        assert result.unfinished_group_keys == ("main_1", "main_2")
        pending = engine.sessions.pending_calibration(MAC)
        assert pending is not None
        assert pending.expected_phase_offsets == {}
        assert [event[0] for event in session.events].count("button") == 1
        assert not {
            event[1] for event in session.events if event[0] == "button"
        }.intersection(_clear_keys(meter))

    asyncio.run(run())


def test_offset_cancellation_keeps_marker_zeros_references_and_releases_lease() -> None:
    async def run() -> None:
        meter = binding_with_offset_controls()
        session = FakeOffsetSession(meter, 2)
        sessions = SessionManager()
        session.sessions = sessions
        markers, persist = _marker_writer(session.events)
        engine = CalibrationEngine(sessions, persist)
        task = asyncio.create_task(
            engine.async_calibrate_offset_board(MAC, session, meter, 0, 2)
        )
        while not any(event[0] == "button" for event in session.events):
            await asyncio.sleep(0)

        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

        assert markers and markers[0] is not None
        assert [event[0] for event in session.events].count("number") == 16
        assert [event[0] for event in session.events].count("button") == 1
        assert session.pending_waiter is not None and session.pending_waiter.cancelled()
        assert not sessions.is_config_locked(MAC)
        assert not sessions.is_calibration_locked(MAC)
        assert not {
            event[1] for event in session.events if event[0] == "button"
        }.intersection(_clear_keys(meter))

    asyncio.run(run())


def test_concurrent_offset_attempt_is_rejected_without_interleaving() -> None:
    async def run() -> None:
        meter = binding_with_offset_controls()
        session = FakeOffsetSession(meter, 1)
        sessions = SessionManager()
        session.sessions = sessions
        _, persist = _marker_writer(session.events)
        engine = CalibrationEngine(sessions, persist)
        first = asyncio.create_task(
            engine.async_calibrate_offset_board(MAC, session, meter, 0, 1)
        )
        while not any(event[0] == "button" for event in session.events):
            await asyncio.sleep(0)

        with pytest.raises(CalibrationBusyError):
            await engine.async_calibrate_offset_board(MAC, session, meter, 0, 1)

        assert [event[0] for event in session.events].count("button") == 1
        first.cancel()
        with pytest.raises(asyncio.CancelledError):
            await first
        assert not sessions.is_calibration_locked(MAC)

    asyncio.run(run())
