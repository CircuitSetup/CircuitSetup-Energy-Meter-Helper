"""Tests for dynamic one-channel current calibration and recovery."""

from __future__ import annotations

import asyncio
from dataclasses import replace
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    CalibrationEngine,
    CalibrationInvariantError,
    CalibrationState,
)
from custom_components.circuitsetup_energy_meter_helper.esphome_api import (
    ESPHomeSessionDisconnectedError,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    StoredInterruptedSession,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from tests.test_calibration_engine_voltage import (
    FakeCalibrationSession,
    gain_evidence,
    marker_writer,
    sample_window,
)
from tests.test_preflight import binding


@pytest.mark.parametrize(
    ("channel", "group_key", "phase"),
    (
        (1, "main_1", "A"),
        (6, "main_2", "C"),
        (7, "addon1_1", "A"),
        (18, "addon2_2", "C"),
        (42, "addon6_2", "C"),
    ),
)
def test_current_channel_mapping_multiplier_and_invariants(
    channel: int, group_key: str, phase: str
) -> None:
    async def run() -> None:
        meter = binding(6)
        phase_index = {"A": 0, "B": 1, "C": 2}[phase]
        changes = tuple(index == phase_index for index in range(3))
        session = FakeCalibrationSession(
            gain_evidence(
                group_key.replace("main_", "meter_main"),
                current_changes=changes,
                reference_currents=tuple(
                    5.0 if index == phase_index else 0.0 for index in range(3)
                ),
            )
        )
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)

        result = await engine.async_calibrate_current(
            "meter",
            session,
            meter,
            channel,
            trusted_current=10.0,
            reporting_multiplier=2.0,
            tolerance_percent=1.0,
        )

        reference = meter.role(f"ct{channel}.reference_current").descriptor
        assert result.group_key == group_key
        assert result.phase == phase
        assert result.changed_channels == (channel,)
        assert ("number", reference.key, 5.0, reference.device_id) in session.events
        assert [event[0] for event in session.events].count("button") == 1

    asyncio.run(run())


def test_current_rejects_non_target_or_voltage_gain_change() -> None:
    async def run() -> None:
        meter = binding(0)
        session = FakeCalibrationSession(
            gain_evidence(
                "meter_main1",
                voltage_changes=(True, False, False),
                current_changes=(True, True, False),
                reference_currents=(10.0, 0.0, 0.0),
            )
        )
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)

        with pytest.raises(CalibrationInvariantError):
            await engine.async_calibrate_current(
                "meter", session, meter, 1, 10.0, 1.0, 1.0
            )

    asyncio.run(run())


def test_outside_tolerance_never_auto_repeats_and_caps_retry() -> None:
    async def run() -> None:
        meter = binding(0)
        session = FakeCalibrationSession(
            gain_evidence(
                "meter_main1",
                current_changes=(True, False, False),
                reference_currents=(10.0, 0.0, 0.0),
            ),
            after=sample_window(8.0, 8.0, 8.0),
        )
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)

        result = await engine.async_calibrate_current(
            "meter",
            session,
            meter,
            1,
            10.0,
            1.0,
            1.0,
            iteration=3,
            confirm_iteration=True,
        )

        assert result.state is CalibrationState.RESULT_OUTSIDE_TOLERANCE
        assert not result.retry_allowed
        assert [event[0] for event in session.events].count("button") == 1

    asyncio.run(run())


def test_post_dispatch_disconnect_is_indeterminate_and_never_resends() -> None:
    async def run() -> None:
        meter = binding(0)
        sessions = SessionManager()

        class LockCheckingSession(FakeCalibrationSession):
            async def async_reconnect(self) -> None:
                assert sessions.is_config_locked("meter")
                assert sessions.is_calibration_locked("meter")
                await super().async_reconnect()

        session = LockCheckingSession(
            ESPHomeSessionDisconnectedError("lost after press")
        )
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(sessions, persist)

        result = await engine.async_calibrate_current(
            "meter", session, meter, 1, 10.0, 1.0, 1.0
        )

        assert result.state is CalibrationState.INDETERMINATE
        names = [event[0] for event in session.events]
        assert names.count("button") == 1
        assert names.count("reconnect") == 1
        assert names.count("restore") == 1
        assert names.index("button") < names.index("reconnect") < names.index("restore")

    asyncio.run(run())


def test_restart_recovery_marks_interrupted_then_reconnects_and_zeros() -> None:
    async def run() -> None:
        meter = binding(0)
        session = FakeCalibrationSession(gain_evidence("meter_main1"))
        markers, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)
        marker = StoredInterruptedSession("active", "2026-08-21T12:00:00Z", (1,))

        await engine.async_recover_interrupted("meter", session, meter, marker)

        assert markers[0] == replace(marker, state="interrupted")
        assert markers[-1] is None
        names = [event[0] for event in session.events]
        assert names[0] == "marker"
        assert names.index("reconnect") < names.index("number")
        assert "button" not in names

    asyncio.run(run())


def test_cancellation_runs_final_zero_under_lock_and_releases_session() -> None:
    async def run() -> None:
        meter = binding(0)
        sessions = SessionManager()

        class PendingSession(FakeCalibrationSession):
            def __init__(self) -> None:
                super().__init__(gain_evidence("meter_main1"))
                self.pressed = asyncio.Event()

            def expect_gain_run(self, **kwargs: object) -> asyncio.Future[Any]:
                self.events.append(("expect_gain", kwargs))
                return asyncio.get_running_loop().create_future()

            async def async_press_button(self, key: int, *, device_id: int = 0) -> None:
                await super().async_press_button(key, device_id=device_id)
                self.pressed.set()

            async def async_set_number(
                self,
                key: int,
                state: float,
                *,
                device_id: int = 0,
                tolerance: float = 1e-6,
                timeout: float = 10.0,
            ) -> object:
                assert sessions.is_config_locked("meter")
                assert sessions.is_calibration_locked("meter")
                return await super().async_set_number(
                    key,
                    state,
                    device_id=device_id,
                    tolerance=tolerance,
                    timeout=timeout,
                )

        session = PendingSession()
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(sessions, persist)
        task = asyncio.create_task(
            engine.async_calibrate_current("meter", session, meter, 1, 10.0, 1.0, 1.0)
        )
        await session.pressed.wait()
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

        assert [event[0] for event in session.events].count("button") == 1
        assert [event[0] for event in session.events].count("number") == 17
        assert not sessions.is_config_locked("meter")
        assert not sessions.is_calibration_locked("meter")

    asyncio.run(run())


def test_wrong_operation_correlation_fails_closed() -> None:
    async def run() -> None:
        meter = binding(0)
        evidence = replace(
            gain_evidence("meter_main1", reference_currents=(10.0, 0.0, 0.0)),
            operation_sequence=99,
        )
        session = FakeCalibrationSession(evidence)
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)

        with pytest.raises(CalibrationInvariantError, match="correlation"):
            await engine.async_calibrate_current(
                "meter", session, meter, 1, 10.0, 1.0, 1.0
            )

        assert [event[0] for event in session.events].count("button") == 1

    asyncio.run(run())


def test_marker_persistence_failure_prevents_every_mutation() -> None:
    async def run() -> None:
        meter = binding(0)
        session = FakeCalibrationSession(
            gain_evidence("meter_main1", reference_currents=(10.0, 0.0, 0.0))
        )
        sessions = SessionManager()

        async def fail_persistence(
            _mac: str, _marker: StoredInterruptedSession | None
        ) -> None:
            raise OSError("store unavailable")

        engine = CalibrationEngine(sessions, fail_persistence)
        with pytest.raises(OSError, match="store unavailable"):
            await engine.async_calibrate_current(
                "meter", session, meter, 1, 10.0, 1.0, 1.0
            )

        assert not any(event[0] in {"number", "button"} for event in session.events)
        assert not sessions.is_config_locked("meter")
        assert not sessions.is_calibration_locked("meter")

    asyncio.run(run())
