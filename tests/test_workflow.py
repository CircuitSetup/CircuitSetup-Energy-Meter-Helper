"""Offset calibration workflow state and ownership tests."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    OffsetCalibrationResult,
    OffsetCalibrationState,
)
from custom_components.circuitsetup_energy_meter_helper.entity_binding import (
    OffsetControlStatus,
)
from custom_components.circuitsetup_energy_meter_helper.offset_readiness import (
    DEFAULT_OFFSET_READINESS_THRESHOLDS,
    OffsetReadinessResult,
)
from custom_components.circuitsetup_energy_meter_helper.preflight import PreflightResult
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    PendingCalibrationOrigin,
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.topology import (
    topology_from_native,
)
from custom_components.circuitsetup_energy_meter_helper.workflow import (
    EntryWorkflow,
    WorkflowCapabilityUnavailable,
    WorkflowHandleError,
    _SessionHandle,
)

MAC = "aabbccddeeff"
OFFSET_TABLE = ((1, 2), (3, 4), (5, 6))
POWER_OFFSET_TABLE = ((7, 8), (9, 10), (11, 12))


def _workflow(
    capability: OffsetControlStatus = OffsetControlStatus.AVAILABLE,
    *,
    repair_reason: str | None = None,
) -> tuple[EntryWorkflow, _SessionHandle, SessionManager, Any]:
    topology = topology_from_native("circuitsetup.6c-energy-meter")
    groups = tuple(
        SimpleNamespace(
            key=f"main_{index}",
            references=(),
            buttons=(),
            voltage_sensors=(),
            current_sensors=(),
        )
        for index in (1, 2)
    )
    binding = SimpleNamespace(
        topology=topology,
        connection_generation=1,
        groups=groups,
        channels=(),
        offset_capability=SimpleNamespace(
            status=capability,
            repair_reason=repair_reason,
        ),
    )
    api = SimpleNamespace(connected=True, connection_generation=1)
    sessions = SessionManager()

    async def save(*_args: Any) -> None:
        return None

    workflow = EntryWorkflow(
        SimpleNamespace(),
        SimpleNamespace(),
        sessions,
        SimpleNamespace(
            async_save_interrupted_session=save,
            async_save_verified_calibration=save,
        ),
        None,
        api,
        None,
    )
    handle = _SessionHandle(
        "session",
        "meter",
        MAC,
        topology,
        None,
        {},
        binding,
        PreflightResult(()),
        {},
        float("inf"),
        safety_acknowledged=True,
        state="ready",
    )
    workflow._sessions[handle.session_id] = handle
    return workflow, handle, sessions, api


def _pending(
    handle: _SessionHandle,
    *,
    gains: tuple[tuple[str, tuple[int, int, int]], ...] = (),
    offsets: tuple[tuple[str, Any], ...] = (),
    power_offsets: tuple[tuple[str, Any], ...] = (),
) -> PendingCalibrationOrigin:
    return PendingCalibrationOrigin(
        "operation",
        1,
        MAC,
        id(handle),
        handle.topology,
        None,
        None,
        gains,
        offsets,
        power_offsets,
    )


def test_offset_status_starts_with_capability_board_stages_and_no_pending() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()

        status = await workflow.async_get_session(handle.session_id)

        assert status.offset_capability == {
            "status": "available",
            "repair_reason": None,
        }
        assert status.offset_disposition == "not_started"
        assert status.offset_boards == (
            {
                "board_index": 0,
                "stages": (
                    {"stage": 1, "state": "not_started"},
                    {"stage": 2, "state": "not_started"},
                ),
            },
        )
        assert not status.has_pending_calibration
        await workflow.async_close()

    asyncio.run(run())


def test_gain_only_binding_without_offset_capability_reports_unavailable() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        del handle.binding.offset_capability

        status = await workflow.async_get_session(handle.session_id)

        assert status.offset_capability == {
            "status": "unavailable",
            "repair_reason": None,
        }
        with pytest.raises(WorkflowCapabilityUnavailable):
            await workflow.async_check_offset_readiness(handle.session_id, 0, 1)
        with pytest.raises(WorkflowCapabilityUnavailable):
            await workflow.async_calibrate_offset(handle.session_id, 0, 1)
        assert (
            await workflow.async_skip_offset_calibration(handle.session_id)
        ).offset_disposition == "skipped"
        await workflow.async_close()

    asyncio.run(run())


def test_offset_readiness_uses_owned_binding_and_rejects_stale_generation(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        workflow, handle, _sessions, api = _workflow()
        calls: list[tuple[Any, ...]] = []

        async def readiness(
            session: Any, binding: Any, board_index: int, stage: int
        ) -> OffsetReadinessResult:
            calls.append((session, binding, board_index, stage))
            return OffsetReadinessResult(
                stage, True, 1, (), (), DEFAULT_OFFSET_READINESS_THRESHOLDS
            )

        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.workflow.async_check_offset_readiness",
            readiness,
        )
        result = await workflow.async_check_offset_readiness(handle.session_id, 0, 1)
        assert result.ready
        assert calls == [(api, handle.binding, 0, 1)]

        async def stale(*_args: Any) -> OffsetReadinessResult:
            return OffsetReadinessResult(
                1, True, 0, (), (), DEFAULT_OFFSET_READINESS_THRESHOLDS
            )

        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.workflow.async_check_offset_readiness",
            stale,
        )
        with pytest.raises(WorkflowHandleError, match="stale"):
            await workflow.async_check_offset_readiness(handle.session_id, 0, 1)
        await workflow.async_close()

    asyncio.run(run())


def test_one_offset_call_maps_one_board_stage_and_status_retains_result() -> None:
    async def run() -> None:
        workflow, handle, sessions, api = _workflow()
        calls: list[tuple[Any, ...]] = []

        class Calibration:
            async def async_calibrate_offset_board(
                self, *args: Any, **kwargs: Any
            ) -> OffsetCalibrationResult:
                calls.append((*args, kwargs))
                sessions._pending_calibrations[MAC] = _pending(
                    handle, offsets=(("meter_main1", OFFSET_TABLE),)
                )
                return OffsetCalibrationResult(
                    OffsetCalibrationState.APPLIED_PENDING_RESTART_VERIFICATION,
                    0,
                    1,
                    (("meter_main1", OFFSET_TABLE),),
                    (),
                    False,
                )

        workflow._calibration = Calibration()  # type: ignore[assignment]

        result = await workflow.async_calibrate_offset(handle.session_id, 0, 1)
        status = await workflow.async_get_session(handle.session_id)

        assert result.expected_tables == (("meter_main1", OFFSET_TABLE),)
        assert calls == [(MAC, api, handle.binding, 0, 1, {"confirm_retry": False})]
        assert status.offset_disposition == "in_progress"
        assert status.offset_boards[0]["stages"] == (
            {"stage": 1, "state": "completed"},
            {"stage": 2, "state": "not_started"},
        )
        assert status.has_pending_calibration
        await workflow.async_close()

    asyncio.run(run())


def test_offset_disposition_completes_only_after_both_board_stages() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        for stage, table in ((1, OFFSET_TABLE), (2, POWER_OFFSET_TABLE)):
            handle.offset_results[(0, stage)] = OffsetCalibrationResult(
                OffsetCalibrationState.APPLIED_PENDING_RESTART_VERIFICATION,
                0,
                stage,
                (("meter_main1", table),),
                (),
                False,
            )

        status = await workflow.async_get_session(handle.session_id)

        assert status.offset_disposition == "completed"
        assert tuple(stage["state"] for stage in status.offset_boards[0]["stages"]) == (
            "completed",
            "completed",
        )
        await workflow.async_close()

    asyncio.run(run())


def test_skip_before_mutation_publishes_once_and_never_calls_engine() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        events: list[Any] = []
        workflow.subscribe_session(handle.session_id, events.append)

        status = await workflow.async_skip_offset_calibration(handle.session_id)

        assert status.offset_disposition == "skipped"
        assert status.offset_boards[0]["stages"] == (
            {"stage": 1, "state": "skipped"},
            {"stage": 2, "state": "skipped"},
        )
        assert not status.has_pending_calibration
        assert events == [status]
        with pytest.raises(WorkflowHandleError, match="already finalized"):
            await workflow.async_skip_offset_calibration(handle.session_id)
        assert events == [status]
        await workflow.async_close()

    asyncio.run(run())


def test_skip_after_offset_mutation_is_partial_and_preserves_pending_values() -> None:
    async def run() -> None:
        workflow, handle, sessions, _api = _workflow()
        handle.offset_results[(0, 1)] = OffsetCalibrationResult(
            OffsetCalibrationState.PARTIAL,
            0,
            1,
            (("meter_main1", OFFSET_TABLE),),
            ("main_2",),
            True,
            "second chip failed",
        )
        pending = _pending(handle, offsets=(("meter_main1", OFFSET_TABLE),))
        sessions._pending_calibrations[MAC] = pending

        status = await workflow.async_skip_offset_calibration(handle.session_id)

        assert status.offset_disposition == "partial"
        assert status.offset_boards[0]["stages"] == (
            {"stage": 1, "state": "partial"},
            {"stage": 2, "state": "skipped"},
        )
        assert status.has_pending_calibration
        assert sessions.pending_calibration(MAC) == pending
        assert handle.state == "applied_pending_restart_verification"
        await workflow.async_close()

    asyncio.run(run())


@pytest.mark.parametrize(
    ("capability", "repair_reason"),
    [
        (OffsetControlStatus.UNAVAILABLE, None),
        (OffsetControlStatus.INVALID, "duplicate run control"),
    ],
)
def test_unavailable_or_invalid_offset_is_skip_only(
    capability: OffsetControlStatus,
    repair_reason: str | None,
) -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow(
            capability, repair_reason=repair_reason
        )
        status = await workflow.async_get_session(handle.session_id)
        assert status.offset_capability == {
            "status": capability.value,
            "repair_reason": repair_reason,
        }
        with pytest.raises(WorkflowCapabilityUnavailable):
            await workflow.async_check_offset_readiness(handle.session_id, 0, 1)
        with pytest.raises(WorkflowCapabilityUnavailable):
            await workflow.async_calibrate_offset(handle.session_id, 0, 1)
        assert (
            await workflow.async_skip_offset_calibration(handle.session_id)
        ).offset_disposition == "skipped"
        await workflow.async_close()

    asyncio.run(run())


def test_has_pending_calibration_includes_gain_only_pending_state() -> None:
    async def run() -> None:
        workflow, handle, sessions, _api = _workflow()
        sessions._pending_calibrations[MAC] = _pending(
            handle, gains=(("meter_main1", (100, 200, 300)),)
        )

        status = await workflow.async_get_session(handle.session_id)

        assert status.has_pending_calibration
        assert status.offset_disposition == "not_started"
        await workflow.async_close()

    asyncio.run(run())
