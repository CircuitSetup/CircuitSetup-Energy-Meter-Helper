"""Tests for dynamic three-phase voltage calibration."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable
from statistics import fmean
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    CalibrationEngine,
    CalibrationInvariantError,
    CalibrationStabilityError,
    CalibrationState,
    IterationConfirmationRequired,
)
from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    GainRunEvidence,
    PhaseGainEvidence,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    StoredInterruptedSession,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.state_tracker import (
    SensorSampleWindow,
)
from tests.test_preflight import binding


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
    voltage_changes: tuple[bool, bool, bool] = (False, False, False),
    current_changes: tuple[bool, bool, bool] = (False, False, False),
    reference_voltages: tuple[float, float, float] = (0.0, 0.0, 0.0),
    reference_currents: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> GainRunEvidence:
    phases = tuple(
        PhaseGainEvidence(
            phase,
            120.0,
            10.0,
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
        self.events.append(("window", key, device_id, sample_count))
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
        assert [event[0] for event in session.events].count("button") == 1
        assert [event[0] for event in session.events].index("expect_gain") < [
            event[0] for event in session.events
        ].index("button")
        assert not engine.sessions.is_config_locked("aa:bb:cc:dd:ee:ff")

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


def test_voltage_rejects_unstable_samples_or_changed_current_gain() -> None:
    async def run() -> None:
        meter = binding(0)
        unstable = FakeCalibrationSession(
            gain_evidence("meter_main1"),
            before=sample_window(100.0, 120.0, 140.0),
        )
        _, persist = marker_writer(unstable.events)
        engine = CalibrationEngine(SessionManager(), persist, stability_limit_percent=1)
        with pytest.raises(CalibrationStabilityError):
            await engine.async_calibrate_voltage(
                "meter", unstable, meter, "main_1", 120.0, 1.0
            )
        assert not any(event[0] == "button" for event in unstable.events)

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
                "meter", changed, meter, "main_1", 120.0, 1.0
            )
        assert [event[0] for event in changed.events].count("button") == 1

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
                "meter",
                session,
                meter,
                "main_1",
                120.0,
                1.0,
                iteration=2,
            )
        with pytest.raises(ValueError, match="three"):
            await engine.async_calibrate_voltage(
                "meter",
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
