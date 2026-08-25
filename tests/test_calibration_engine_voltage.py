"""Tests for dynamic three-phase voltage calibration."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable
from dataclasses import replace
from hashlib import sha256
from statistics import fmean
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    CalibrationEngine as ProductionCalibrationEngine,
)
from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    CalibrationInvariantError,
    CalibrationState,
    CalibrationTimingPolicy,
    IterationConfirmationRequired,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    GainRunEvidence,
    PhaseGainEvidence,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    MeterTopology,
    StoredInterruptedSession,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.state_tracker import (
    SensorSampleWindow,
)
from tests.test_preflight import binding


async def _authoritative_snapshot(
    mac: str, topology: MeterTopology
) -> ESPHomeConfigSnapshot:
    del mac
    content = f"esphome:\n  project:\n    name: {topology.project_name}\n"
    return ESPHomeConfigSnapshot(
        "meter.yaml", content, sha256(content.encode()).hexdigest()
    )


class CalibrationEngine(ProductionCalibrationEngine):
    """Task 17 test engine with the required authoritative config boundary."""

    def __init__(self, sessions: SessionManager, persist: Any, **kwargs: Any) -> None:
        kwargs.setdefault("calibration_snapshot_reader", _authoritative_snapshot)
        super().__init__(sessions, persist, **kwargs)


@pytest.mark.parametrize(
    ("interval", "sensor_timeout", "evidence_timeout"),
    (
        (1, 35.0, 35.0),
        (2, 35.0, 35.0),
        (5, 35.0, 35.0),
        (10, 45.0, 35.0),
        (30, 125.0, 75.0),
        (60, 245.0, 135.0),
    ),
)
def test_calibration_timing_policy_uses_supported_interval_formulas(
    interval: int, sensor_timeout: float, evidence_timeout: float
) -> None:
    policy = CalibrationTimingPolicy(interval, sample_count=3)

    assert policy.sensor_window_timeout_s == sensor_timeout
    assert policy.evidence_timeout_s == evidence_timeout


@pytest.mark.parametrize("interval", (0, 3, 61, True, "30"))
def test_calibration_timing_policy_rejects_unsupported_intervals(interval: object) -> None:
    with pytest.raises(ValueError):
        CalibrationTimingPolicy(interval, sample_count=3)  # type: ignore[arg-type]


@pytest.mark.parametrize("sample_count", (0, -1, True))
def test_calibration_timing_policy_requires_positive_integer_samples(
    sample_count: object,
) -> None:
    with pytest.raises(ValueError):
        CalibrationTimingPolicy(5, sample_count=sample_count)  # type: ignore[arg-type]


def test_sensor_window_uses_installed_timing_policy() -> None:
    async def run() -> None:
        meter = binding(0)
        session = FakeCalibrationSession(gain_evidence("meter_main1"))
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)

        await engine._window(
            session,
            meter.groups[0].voltage_sensors[0],
            timing_policy=CalibrationTimingPolicy(30, 3),
        )

        assert session.events[-1] == (
            "window",
            meter.groups[0].voltage_sensors[0].descriptor.key,
            meter.groups[0].voltage_sensors[0].descriptor.device_id,
            3,
            125.0,
        )

    asyncio.run(run())


def sample_window(*values: float) -> SensorSampleWindow:
    mean = fmean(values)
    return SensorSampleWindow(
        values,
        tuple(float(index) for index in range(len(values))),
        mean,
        min(values),
        max(values),
        100.0 * (max(values) - min(values)) / abs(mean),
    )


def gain_evidence(
    instance_id: str,
    *,
    measured_voltages: tuple[float, float, float] = (120.0, 120.0, 120.0),
    measured_currents: tuple[float, float, float] = (10.0, 10.0, 10.0),
    voltage_changes: tuple[bool, bool, bool] = (False, False, False),
    current_changes: tuple[bool, bool, bool] = (False, False, False),
    reference_voltages: tuple[float, float, float] = (0.0, 0.0, 0.0),
    reference_currents: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> GainRunEvidence:
    phases = tuple(
        PhaseGainEvidence(
            phase,
            measured_voltages[index],
            measured_currents[index],
            reference_voltages[index],
            reference_currents[index],
            7305,
            7310 if voltage_changes[index] else 7305,
            27518,
            28000 if current_changes[index] else 27518,
        )
        for index, phase in enumerate(("A", "B", "C"))
    )
    return GainRunEvidence(
        1,
        1,
        instance_id,
        phases,  # type: ignore[arg-type]
        True,
        (),
        False,
        (),
    )


class FakeCalibrationSession:
    def __init__(
        self,
        evidence: GainRunEvidence | BaseException,
        *,
        before: SensorSampleWindow | None = None,
        after: SensorSampleWindow | None = None,
    ) -> None:
        self.connection_generation = 1
        self.evidence = evidence
        self.before = before or sample_window(119.9, 120.0, 120.1)
        self.after = after or sample_window(119.9, 120.0, 120.1)
        self.events: list[tuple[Any, ...]] = []
        self.window_calls = 0
        self.window_calls_by_key: dict[int, int] = {}

    async def async_set_number(
        self,
        key: int,
        state: float,
        *,
        device_id: int = 0,
        tolerance: float = 1e-6,
        timeout: float = 10.0,
    ) -> object:
        self.events.append(("number", key, state, device_id))
        return object()

    async def async_wait_for_sensor_window(
        self,
        key: int,
        *,
        device_id: int = 0,
        sample_count: int,
        after: float,
        timeout: float = 10.0,
    ) -> SensorSampleWindow:
        self.events.append(("window", key, device_id, sample_count, timeout))
        self.window_calls += 1
        self.window_calls_by_key[key] = self.window_calls_by_key.get(key, 0) + 1
        return self.before if self.window_calls_by_key[key] == 1 else self.after

    def expect_gain_run(self, **kwargs: Any) -> Awaitable[GainRunEvidence]:
        self.events.append(("expect_gain", kwargs))
        future: asyncio.Future[GainRunEvidence] = (
            asyncio.get_running_loop().create_future()
        )
        if isinstance(self.evidence, BaseException):
            future.set_exception(self.evidence)
        else:
            future.set_result(self.evidence)
        return future

    async def async_press_button(self, key: int, *, device_id: int = 0) -> None:
        self.events.append(("button", key, device_id))

    async def async_reconnect(self) -> None:
        self.events.append(("reconnect",))

    async def async_wait_for_restore(self, **kwargs: Any) -> dict[str, object]:
        self.events.append(("restore", kwargs))
        return {}


def marker_writer(
    events: list[tuple[Any, ...]],
) -> tuple[
    list[StoredInterruptedSession | None],
    Any,
]:
    markers: list[StoredInterruptedSession | None] = []

    async def persist(mac: str, marker: StoredInterruptedSession | None) -> None:
        markers.append(marker)
        events.append(("marker", mac, marker.state if marker else None))

    return markers, persist


def test_voltage_calibration_persists_before_mutation_and_preserves_currents() -> None:
    async def run() -> None:
        meter = binding(1)
        session = FakeCalibrationSession(
            gain_evidence(
                "addon1_2",
                voltage_changes=(True, True, True),
                reference_voltages=(120.0, 120.0, 120.0),
            )
        )
        markers, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)

        result = await engine.async_calibrate_voltage(
            "AA:BB:CC:DD:EE:FF",
            session,
            meter,
            "addon1_2",
            trusted_voltage=120.0,
            tolerance_percent=1.0,
        )

        assert result.state is CalibrationState.APPLIED_PENDING_RESTART_VERIFICATION
        assert result.group_key == "addon1_2"
        assert result.changed_channels == (10, 11, 12)
        names = [event[0] for event in session.events]
        assert names.index("marker") < names.index("number")
        assert names.index("marker") < names.index("button")
        assert markers[0] is not None
        assert markers[0].changed_channels == (10, 11, 12)
        assert [marker.state for marker in markers if marker is not None] == [
            "active",
            "flash_saved",
        ]
        assert [event[0] for event in session.events].count("button") == 1
        assert all(event[4] >= 30 for event in session.events if event[0] == "window")
        assert [event[0] for event in session.events].index("expect_gain") < [
            event[0] for event in session.events
        ].index("button")
        assert not engine.sessions.is_config_locked("aa:bb:cc:dd:ee:ff")

    asyncio.run(run())


def test_voltage_uses_native_gain_average_without_periodic_sensor_windows() -> None:
    async def run() -> None:
        meter = binding(0)
        session = FakeCalibrationSession(
            gain_evidence(
                "meter_main1",
                voltage_changes=(True, True, True),
                reference_voltages=(120.0, 120.0, 120.0),
            )
        )
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)

        result = await engine.async_calibrate_voltage(
            "aabbccddeeff", session, meter, "main_1", 120.0, 1.0
        )

        assert session.window_calls == 0
        assert result.before_values == (120.0, 120.0, 120.0)
        assert result.after_values == pytest.approx((120.0 * 7310 / 7305,) * 3)

    asyncio.run(run())


def test_board_voltage_arms_both_chips_before_dispatching_either_gain_run() -> None:
    class BoardSession(FakeCalibrationSession):
        def expect_gain_run(self, **kwargs: Any) -> Awaitable[GainRunEvidence]:
            self.events.append(("expect_gain", kwargs))
            future: asyncio.Future[GainRunEvidence] = (
                asyncio.get_running_loop().create_future()
            )
            future.set_result(
                replace(
                    gain_evidence(
                        kwargs["target_instance_id"],
                        voltage_changes=(True, True, True),
                        reference_voltages=(120.0, 120.0, 120.0),
                    ),
                    operation_sequence=kwargs["operation_sequence"],
                )
            )
            return future

    async def run() -> None:
        meter = binding(0)
        session = BoardSession(gain_evidence("meter_main1"))
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)

        results = await engine.async_calibrate_voltages(
            "aabbccddeeff",
            session,
            meter,
            (("main_1", 120.0, 1), ("main_2", 120.0, 1)),
            1.0,
        )

        names = [event[0] for event in session.events]
        assert len(results) == 2
        assert names.count("button") == 2
        assert max(index for index, name in enumerate(names) if name == "expect_gain") < min(
            index for index, name in enumerate(names) if name == "button"
        )

    asyncio.run(run())


def test_zero_all_references_is_sequential_per_group_and_bounded_overall() -> None:
    class SlowSession(FakeCalibrationSession):
        def __init__(self) -> None:
            super().__init__(gain_evidence("meter_main1"))
            self.active = 0
            self.peak = 0

        async def async_set_number(
            self,
            key: int,
            state: float,
            *,
            device_id: int = 0,
            tolerance: float = 1e-6,
            timeout: float = 10.0,
        ) -> object:
            self.active += 1
            self.peak = max(self.peak, self.active)
            try:
                await asyncio.sleep(0.001)
                return await super().async_set_number(
                    key,
                    state,
                    device_id=device_id,
                    tolerance=tolerance,
                    timeout=timeout,
                )
            finally:
                self.active -= 1

    async def run() -> None:
        meter = binding(6)
        session = SlowSession()
        engine = CalibrationEngine(
            SessionManager(), lambda _mac, _marker: asyncio.sleep(0)
        )

        await engine.async_zero_all_references(session, meter)

        number_keys = [event[1] for event in session.events if event[0] == "number"]
        assert len(number_keys) == 14 * 4
        assert session.peak == 2
        for group in meter.groups:
            positions = [
                number_keys.index(entity.descriptor.key) for entity in group.references
            ]
            assert positions == sorted(positions)

    asyncio.run(run())


def test_voltage_rejects_changed_current_gain() -> None:
    async def run() -> None:
        meter = binding(0)
        changed = FakeCalibrationSession(
            gain_evidence(
                "meter_main1",
                current_changes=(False, True, False),
                reference_voltages=(120.0, 120.0, 120.0),
            )
        )
        _, persist_changed = marker_writer(changed.events)
        engine = CalibrationEngine(SessionManager(), persist_changed)
        with pytest.raises(CalibrationInvariantError, match="current"):
            await engine.async_calibrate_voltage(
                "aabbccddeeff", changed, meter, "main_1", 120.0, 1.0
            )
        assert [event[0] for event in changed.events].count("button") == 1

    asyncio.run(run())


def test_native_gain_result_outside_tolerance_never_publishes_gain_group() -> None:
    async def run() -> None:
        meter = binding(0)
        sessions = SessionManager()
        session = FakeCalibrationSession(
            gain_evidence(
                "meter_main1",
                measured_voltages=(100.0, 100.0, 100.0),
                reference_voltages=(120.0, 120.0, 120.0),
            )
        )
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(sessions, persist)

        result = await engine.async_calibrate_voltage(
            "aabbccddeeff", session, meter, "main_1", 120.0, 1.0
        )
        assert result.state is CalibrationState.RESULT_OUTSIDE_TOLERANCE
        pending = sessions.pending_calibration("aabbccddeeff")
        assert pending is not None
        assert pending.gain_groups == ()

    asyncio.run(run())


def test_each_new_calibration_lease_revalidates_retained_yaml_before_mutation() -> None:
    async def run() -> None:
        meter = binding(0)
        session = FakeCalibrationSession(
            gain_evidence(
                "meter_main1",
                voltage_changes=(True, True, True),
                reference_voltages=(120.0, 120.0, 120.0),
            )
        )
        contents = [
            f"esphome:\n  project:\n    name: {meter.topology.project_name}\n# revision {i}\n"
            for i in (1, 2)
        ]
        calls = 0

        async def snapshots(mac: str, topology: MeterTopology) -> ESPHomeConfigSnapshot:
            nonlocal calls
            del mac, topology
            content = contents[min(calls, 1)]
            calls += 1
            return ESPHomeConfigSnapshot(
                "meter.yaml", content, sha256(content.encode()).hexdigest()
            )

        markers, persist = marker_writer(session.events)
        engine = CalibrationEngine(
            SessionManager(), persist, calibration_snapshot_reader=snapshots
        )
        await engine.async_calibrate_voltage(
            "aabbccddeeff", session, meter, "main_1", 120.0, 1.0
        )
        session.evidence = gain_evidence(
            "meter_main2",
            voltage_changes=(True, True, True),
            reference_voltages=(120.0, 120.0, 120.0),
        )
        event_count = len(session.events)

        with pytest.raises(ValueError, match="configuration changed"):
            await engine.async_calibrate_voltage(
                "aa:bb:cc:dd:ee:ff", session, meter, "main_2", 120.0, 1.0
            )

        assert calls == 2
        assert [marker.state for marker in markers if marker is not None] == [
            "active",
            "flash_saved",
        ]
        assert len(session.events) == event_count

    asyncio.run(run())


def test_additional_iterations_require_explicit_confirmation_and_stop_at_three() -> (
    None
):
    async def run() -> None:
        meter = binding(0)
        session = FakeCalibrationSession(gain_evidence("meter_main1"))
        _, persist = marker_writer(session.events)
        engine = CalibrationEngine(SessionManager(), persist)

        with pytest.raises(IterationConfirmationRequired):
            await engine.async_calibrate_voltage(
                "aabbccddeeff",
                session,
                meter,
                "main_1",
                120.0,
                1.0,
                iteration=2,
            )
        with pytest.raises(ValueError, match="three"):
            await engine.async_calibrate_voltage(
                "aabbccddeeff",
                session,
                meter,
                "main_1",
                120.0,
                1.0,
                iteration=4,
                confirm_iteration=True,
            )
        assert not any(event[0] == "button" for event in session.events)

    asyncio.run(run())
