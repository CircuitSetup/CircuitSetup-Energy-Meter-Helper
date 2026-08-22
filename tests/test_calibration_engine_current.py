"""Tests for dynamic one-channel current calibration and recovery."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, replace
from pathlib import Path
from time import monotonic
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    CalibrationInvariantError,
    CalibrationIterationLimitError,
    CalibrationRebindError,
    CalibrationState,
    IterationConfirmationRequired,
)
from custom_components.circuitsetup_energy_meter_helper.entity_binding import bind_meter
from custom_components.circuitsetup_energy_meter_helper.entity_catalog import (
    EntityCatalog,
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
    CalibrationEngine,
    FakeCalibrationSession,
    gain_evidence,
    marker_writer,
    sample_window,
)
from tests.test_entity_binding import (
    substitutions as native_substitutions,
)
from tests.test_entity_binding import (
    synthetic_entities,
)
from tests.test_entity_binding import (
    topology as native_topology,
)
from tests.test_preflight import binding


def native_meter(*, generation: int = 1, key_offset: int = 0) -> Any:
    return bind_meter(
        EntityCatalog(native_entities(key_offset=key_offset), generation),
        native_topology(0),
        native_substitutions(0),
    )


@dataclass(slots=True)
class NativeNumberInfo:
    object_id: str
    key: int
    name: str
    unit_of_measurement: str
    device_id: int = 0
    disabled_by_default: bool = True
    step: float = 0.1


NativeNumberInfo.__name__ = "NumberInfo"


def native_entities(*, key_offset: int = 0) -> list[object]:
    entities = synthetic_entities(0, key_offset=key_offset)
    return [
        NativeNumberInfo(
            entity.object_id,
            entity.key,
            entity.name,
            entity.unit_of_measurement,
            entity.device_id,
            entity.disabled_by_default,
        )
        if type(entity).__name__ == "NumberInfo"
        else entity
        for entity in entities
    ]


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
            "aabbccddeeff",
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
                "aabbccddeeff", session, meter, 1, 10.0, 1.0, 1.0
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
        sessions = SessionManager()
        sessions.record_calibration_iteration("aabbccddeeff", "current:1", 1)
        sessions.record_calibration_iteration("aabbccddeeff", "current:1", 2)
        engine = CalibrationEngine(sessions, persist)

        result = await engine.async_calibrate_current(
            "aabbccddeeff",
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
        meter = native_meter()
        sessions = SessionManager()

        class LockCheckingSession(FakeCalibrationSession):
            async def async_reconnect(self) -> None:
                assert sessions.is_config_locked("aabbccddeeff")
                assert sessions.is_calibration_locked("aabbccddeeff")
                await super().async_reconnect()
                self.connection_generation = 2
                self.entities = tuple(native_entities(key_offset=1000))

        session = LockCheckingSession(
            ESPHomeSessionDisconnectedError("lost after press")
        )
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(sessions, persist)

        result = await engine.async_calibrate_current(
            "aabbccddeeff",
            session,
            meter,
            1,
            10.0,
            1.0,
            1.0,
            substitutions=native_substitutions(0),
        )

        assert result.state is CalibrationState.INDETERMINATE
        names = [event[0] for event in session.events]
        assert names.count("button") == 1
        assert names.count("reconnect") == 1
        assert names.count("restore") == 1
        assert names.index("button") < names.index("reconnect") < names.index("restore")
        reconnect_index = names.index("reconnect")
        assert all(
            event[1] > 1000
            for event in session.events[reconnect_index + 1 :]
            if event[0] == "number"
        )

    asyncio.run(run())


def test_restart_recovery_marks_interrupted_then_reconnects_and_zeros() -> None:
    async def run() -> None:
        meter = native_meter()

        class RebindingSession(FakeCalibrationSession):
            async def async_reconnect(self) -> None:
                await super().async_reconnect()
                self.connection_generation = 2
                self.entities = tuple(native_entities(key_offset=1000))

        session = RebindingSession(gain_evidence("meter_main1"))
        markers, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)
        marker = StoredInterruptedSession("active", "2026-08-21T12:00:00Z", (1,))

        await engine.async_recover_interrupted(
            "aabbccddeeff",
            session,
            meter,
            marker,
            substitutions=native_substitutions(0),
        )

        assert markers[0] == replace(marker, state="interrupted")
        assert markers[-1] is None
        names = [event[0] for event in session.events]
        assert names[0] == "marker"
        assert names.index("reconnect") < names.index("number")
        assert "button" not in names
        assert all(event[1] > 1000 for event in session.events if event[0] == "number")

    asyncio.run(run())


@pytest.mark.parametrize(
    ("fresh_entities", "rebind_substitutions"),
    (
        (False, native_substitutions(0)),
        (True, None),
        (True, {"unrelated": "value"}),
    ),
)
def test_disconnect_refuses_absent_metadata_or_missing_rebind_substitutions(
    fresh_entities: bool,
    rebind_substitutions: dict[str, str] | None,
) -> None:
    async def run() -> None:
        meter = native_meter()

        class UnsafeReconnectSession(FakeCalibrationSession):
            async def async_reconnect(self) -> None:
                await super().async_reconnect()
                self.connection_generation = 2
                self.entities = (
                    tuple(native_entities(key_offset=1000)) if fresh_entities else ()
                )

        session = UnsafeReconnectSession(
            ESPHomeSessionDisconnectedError("lost after press")
        )
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)

        with pytest.raises(CalibrationRebindError):
            await engine.async_calibrate_current(
                "aabbccddeeff",
                session,
                meter,
                1,
                10.0,
                1.0,
                1.0,
                substitutions=rebind_substitutions,
            )

        names = [event[0] for event in session.events]
        reconnect_index = names.index("reconnect")
        assert not any(
            event[0] == "number" for event in session.events[reconnect_index + 1 :]
        )

    asyncio.run(run())


def test_interrupted_recovery_refuses_to_zero_without_fresh_metadata() -> None:
    async def run() -> None:
        meter = native_meter()

        class MissingMetadataSession(FakeCalibrationSession):
            async def async_reconnect(self) -> None:
                await super().async_reconnect()
                self.connection_generation = 2
                self.entities = ()

        session = MissingMetadataSession(gain_evidence("meter_main1"))
        markers, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)
        marker = StoredInterruptedSession("active", "2026-08-21T12:00:00Z", (1,))

        with pytest.raises(CalibrationRebindError):
            await engine.async_recover_interrupted(
                "aabbccddeeff",
                session,
                meter,
                marker,
                substitutions=native_substitutions(0),
            )

        assert markers == [replace(marker, state="interrupted")]
        assert not any(event[0] == "number" for event in session.events)

    asyncio.run(run())


@pytest.mark.parametrize("mismatch_delay", (0.25, 0.6))
def test_streaming_gain_waits_for_delayed_register_mismatch(
    mismatch_delay: float,
) -> None:
    async def run() -> None:
        meter = native_meter()
        lines = (
            (Path(__file__).parent / "fixtures" / "logs" / "gain_success.log")
            .read_text(encoding="utf-8")
            .splitlines()
        )

        class StreamingSession(FakeCalibrationSession):
            expect_gain_run = None

            def __init__(self) -> None:
                super().__init__(gain_evidence("meter_main1"))
                self.connected = True
                self.log_lines: list[str] = []

            async def async_press_button(self, key: int, *, device_id: int = 0) -> None:
                await super().async_press_button(key, device_id=device_id)

                async def stream() -> None:
                    await asyncio.sleep(0.01)
                    self.log_lines.extend(lines)
                    await asyncio.sleep(mismatch_delay)
                    self.log_lines.append(
                        "[E][atm90e32:1211] [CALIBRATION][meter_main1] "
                        "Mismatch detected for Phase A!"
                    )

                asyncio.create_task(stream())

        session = StreamingSession()
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(
            SessionManager(),
            persist,
            evidence_timeout=0.8,
        )

        with pytest.raises(CalibrationInvariantError, match="verification"):
            await engine.async_calibrate_current(
                "aabbccddeeff", session, meter, 2, 12.43, 1.0, 1.0
            )

        assert [event[0] for event in session.events].count("button") == 1

    asyncio.run(run())


def test_final_gain_snapshot_observes_boundary_mismatch() -> None:
    async def run() -> None:
        base_lines = tuple(
            (Path(__file__).parent / "fixtures" / "logs" / "gain_success.log")
            .read_text(encoding="utf-8")
            .splitlines()
        )
        mismatch = (
            "[E][atm90e32:1211] [CALIBRATION][meter_main1] "
            "Mismatch detected for Phase A!"
        )

        class BoundarySession:
            def __init__(self) -> None:
                self.connected = True
                self.failure_at = monotonic() + 0.18

            @property
            def log_lines(self) -> tuple[str, ...]:
                return (
                    (*base_lines, mismatch)
                    if monotonic() >= self.failure_at
                    else base_lines
                )

        session = BoundarySession()
        engine = CalibrationEngine(
            SessionManager(),
            lambda _mac, _marker: asyncio.sleep(0),
            evidence_timeout=0.2,
        )
        dispatched = monotonic()

        evidence = await engine._poll_gain(
            session,
            (),
            1,
            1,
            "meter_main1",
            "3. Run Main Meter 1 Gain Cal",
            dispatched,
        )

        assert evidence.register_mismatch_phases == ("A",)
        assert not evidence.immediate_apply_acceptable

    asyncio.run(run())


def test_final_gain_snapshot_observes_boundary_disconnect() -> None:
    async def run() -> None:
        lines = tuple(
            (Path(__file__).parent / "fixtures" / "logs" / "gain_success.log")
            .read_text(encoding="utf-8")
            .splitlines()
        )

        class BoundarySession:
            def __init__(self) -> None:
                self.disconnect_at = monotonic() + 0.18
                self.log_lines = lines

            @property
            def connected(self) -> bool:
                return monotonic() < self.disconnect_at

        session = BoundarySession()
        engine = CalibrationEngine(
            SessionManager(),
            lambda _mac, _marker: asyncio.sleep(0),
            evidence_timeout=0.2,
        )
        dispatched = monotonic()

        with pytest.raises(ESPHomeSessionDisconnectedError):
            await engine._poll_gain(
                session,
                (),
                1,
                1,
                "meter_main1",
                "3. Run Main Meter 1 Gain Cal",
                dispatched,
            )

    asyncio.run(run())


def test_streaming_gain_success_waits_for_complete_collection_window() -> None:
    async def run() -> None:
        meter = native_meter()
        lines = (
            (Path(__file__).parent / "fixtures" / "logs" / "gain_success.log")
            .read_text(encoding="utf-8")
            .splitlines()
        )

        class StreamingSession(FakeCalibrationSession):
            expect_gain_run = None

            def __init__(self) -> None:
                stable = sample_window(12.42, 12.43, 12.44)
                super().__init__(
                    gain_evidence("meter_main1"), before=stable, after=stable
                )
                self.connected = True
                self.log_lines: list[str] = []

            async def async_press_button(self, key: int, *, device_id: int = 0) -> None:
                await super().async_press_button(key, device_id=device_id)

                async def stream() -> None:
                    await asyncio.sleep(0.01)
                    self.log_lines.extend(lines)

                asyncio.create_task(stream())

        session = StreamingSession()
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(
            SessionManager(),
            persist,
            evidence_timeout=0.25,
        )

        started = monotonic()
        result = await engine.async_calibrate_current(
            "aabbccddeeff", session, meter, 2, 12.43, 1.0, 1.0
        )

        assert monotonic() - started >= 0.22
        assert result.state is CalibrationState.APPLIED_PENDING_RESTART_VERIFICATION
        assert result.gain_evidence is not None
        assert result.gain_evidence.immediate_apply_acceptable

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
                assert sessions.is_config_locked("aabbccddeeff")
                assert sessions.is_calibration_locked("aabbccddeeff")
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
            engine.async_calibrate_current(
                "aabbccddeeff", session, meter, 1, 10.0, 1.0, 1.0
            )
        )
        await session.pressed.wait()
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

        assert [event[0] for event in session.events].count("button") == 1
        assert [event[0] for event in session.events].count("number") == 17
        assert not sessions.is_config_locked("aabbccddeeff")
        assert not sessions.is_calibration_locked("aabbccddeeff")

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
                "aabbccddeeff", session, meter, 1, 10.0, 1.0, 1.0
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
                "aabbccddeeff", session, meter, 1, 10.0, 1.0, 1.0
            )

        assert not any(event[0] in {"number", "button"} for event in session.events)
        assert not sessions.is_config_locked("aabbccddeeff")
        assert not sessions.is_calibration_locked("aabbccddeeff")

    asyncio.run(run())


def test_iteration_cannot_be_reset_replayed_or_jump_directly() -> None:
    class SequencedSession(FakeCalibrationSession):
        def expect_gain_run(self, **kwargs: Any) -> asyncio.Future[Any]:
            self.events.append(("expect_gain", kwargs))
            future = asyncio.get_running_loop().create_future()
            future.set_result(
                replace(
                    self.evidence,
                    connection_generation=kwargs["connection_generation"],
                    operation_sequence=kwargs["operation_sequence"],
                )
            )
            return future

    async def run() -> None:
        meter = binding(0)

        reset_session = SequencedSession(
            gain_evidence("meter_main1", reference_currents=(10.0, 0.0, 0.0))
        )
        reset_markers, reset_persist = marker_writer(reset_session.events)
        reset_engine = CalibrationEngine(SessionManager(), reset_persist)
        await reset_engine.async_calibrate_current(
            "aabbccddeeff", reset_session, meter, 1, 10.0, 1.0, 1.0
        )
        reset_engine = CalibrationEngine(reset_engine.sessions, reset_persist)
        for _ in range(3):
            with pytest.raises(IterationConfirmationRequired):
                await reset_engine.async_calibrate_current(
                    "aabbccddeeff", reset_session, meter, 1, 10.0, 1.0, 1.0
                )
        assert len(reset_markers) == 1
        assert [event[0] for event in reset_session.events].count("button") == 1

        direct_session = SequencedSession(
            gain_evidence("meter_main1", reference_currents=(10.0, 0.0, 0.0))
        )
        direct_markers, direct_persist = marker_writer(direct_session.events)
        direct_engine = CalibrationEngine(SessionManager(), direct_persist)
        with pytest.raises(IterationConfirmationRequired):
            await direct_engine.async_calibrate_current(
                "aabbccddeeff",
                direct_session,
                meter,
                1,
                10.0,
                1.0,
                1.0,
                iteration=3,
                confirm_iteration=True,
            )
        assert not direct_markers

        replay_session = SequencedSession(
            gain_evidence("meter_main1", reference_currents=(10.0, 0.0, 0.0))
        )
        replay_markers, replay_persist = marker_writer(replay_session.events)
        replay_engine = CalibrationEngine(SessionManager(), replay_persist)
        await replay_engine.async_calibrate_current(
            "aabbccddeeff", replay_session, meter, 1, 10.0, 1.0, 1.0
        )
        before_missing_confirmation = len(replay_session.events)
        with pytest.raises(IterationConfirmationRequired):
            await replay_engine.async_calibrate_current(
                "aabbccddeeff",
                replay_session,
                meter,
                1,
                10.0,
                1.0,
                1.0,
                iteration=2,
            )
        assert len(replay_session.events) == before_missing_confirmation
        await replay_engine.async_calibrate_current(
            "aabbccddeeff",
            replay_session,
            meter,
            1,
            10.0,
            1.0,
            1.0,
            iteration=2,
            confirm_iteration=True,
        )
        with pytest.raises(IterationConfirmationRequired):
            await replay_engine.async_calibrate_current(
                "aabbccddeeff",
                replay_session,
                meter,
                1,
                10.0,
                1.0,
                1.0,
                iteration=2,
                confirm_iteration=True,
            )
        await replay_engine.async_calibrate_current(
            "aabbccddeeff",
            replay_session,
            meter,
            1,
            10.0,
            1.0,
            1.0,
            iteration=3,
            confirm_iteration=True,
        )
        before_refusal = len(replay_session.events)
        with pytest.raises(CalibrationIterationLimitError):
            await replay_engine.async_calibrate_current(
                "aabbccddeeff", replay_session, meter, 1, 10.0, 1.0, 1.0
            )
        assert len(replay_markers) == 3
        assert [event[0] for event in replay_session.events].count("button") == 3
        assert len(replay_session.events) == before_refusal

    asyncio.run(run())
