"""Offset calibration workflow state and ownership tests."""

from __future__ import annotations

import asyncio
from hashlib import sha256
from types import SimpleNamespace
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    OffsetCalibrationResult,
    OffsetCalibrationState,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.entity_binding import (
    OffsetControlStatus,
)
from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
    expected_meter_entity_evidence,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    MeterConfigurationRequest,
)
from custom_components.circuitsetup_energy_meter_helper.meter_inventory import (
    MeterConfigurationInventory,
)
from custom_components.circuitsetup_energy_meter_helper.offset_readiness import (
    DEFAULT_OFFSET_READINESS_THRESHOLDS,
    OffsetReadinessResult,
)
from custom_components.circuitsetup_energy_meter_helper.preflight import PreflightResult
from custom_components.circuitsetup_energy_meter_helper.provisioning import (
    DiscoveredDevice,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    CalibrationBusyError,
    PendingCalibrationOrigin,
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    MeterConfigurationRead,
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


def test_meter_configuration_plan_uses_canonical_store_identity_and_ct_wrapper() -> (
    None
):
    """A foreign device or CT-only handle would bypass the server-owned plan boundary."""
    content = (
        "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter\n"
        "substitutions:\n"
        "  friendly_name: Garage Meter\n"
        "  update_time: 10s\n"
        "  electric_freq: 60Hz\n"
        "  csemh_config_contract: 2\n"
        "  voltage_cal1: 7305\n"
        + "".join(
            f"  ct{channel}_name: CT {channel}\n"
            f"  current_cal_ct{channel}: {27518 + channel}\n"
            for channel in range(1, 7)
        )
    )
    digest = sha256(content.encode()).hexdigest()
    calls: list[str] = []

    class Builder:
        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            return ESPHomeConfigSnapshot(configuration, content, digest)

        async def async_close(self) -> None:
            return None

    class Store:
        async def async_save_interrupted_session(self, *_args: Any) -> None:
            return None

        async def async_finalize_verified_calibration(self, *_args: Any) -> None:
            return None

        async def async_get_ct_selections(self, mac: str) -> tuple[object, ...]:
            calls.append(mac)
            return ()

        async def async_get_meter_configuration_read(
            self, mac: str
        ) -> MeterConfigurationRead:
            calls.append(mac)
            return MeterConfigurationRead(None, True)

    class Hass:
        def __init__(self) -> None:
            self.config_entries = SimpleNamespace(async_get_entry=self._entry)

        @staticmethod
        def _entry(device_id: str) -> object | None:
            if device_id != "meter":
                return None
            return SimpleNamespace(unique_id="aa:bb:cc:dd:ee:ff")

        async def async_add_executor_job(self, target: Any, *args: Any) -> Any:
            return target(*args)

    class Transactions:
        def __init__(self) -> None:
            self.calls: list[tuple[tuple[Any, ...], dict[str, Any]]] = []

        async def async_preview(
            self, *args: Any, **kwargs: Any
        ) -> dict[str, str]:
            self.calls.append((args, kwargs))
            return {"transaction_id": str(len(self.calls))}

    async def run() -> None:
        provisioning = SimpleNamespace(
            snapshot=SimpleNamespace(
                devices=(
                    DiscoveredDevice(
                        "meter",
                        "Garage Meter",
                        "circuitsetup.6c-energy-meter",
                        configuration="meter.yaml",
                    ),
                )
            )
        )
        workflow = EntryWorkflow(
            Hass(), provisioning, SessionManager(), Store(), "meter", None, Builder()
        )

        with pytest.raises(WorkflowHandleError, match="owned"):
            await workflow.async_get_meter_configuration("other")

        result = await workflow.async_get_meter_configuration("meter")
        assert workflow._plans[result["plan_id"]].inventory.plan_id == result["plan_id"]
        wrapper = await workflow.async_get_ct_inventory("meter")

        assert isinstance(
            workflow._plans[wrapper["plan_id"]].inventory, MeterConfigurationInventory
        )
        assert workflow._plans[wrapper["plan_id"]].inventory.plan_id == wrapper["plan_id"]
        assert result["source_sha256"] == digest
        assert result["configuration"].meter.friendly_name == "Garage Meter"
        assert wrapper["channels"] == result["channels"]
        assert "stored_semantics_stale" in result["warnings"]
        assert calls == ["aabbccddeeff"] * 3

        transactions = Transactions()
        workflow.transactions = transactions  # type: ignore[assignment]
        full = await workflow.async_get_meter_configuration("meter")
        full_plan = workflow._plans[full["plan_id"]]
        preview = await workflow.async_preview_meter_configuration(
            "meter",
            full["plan_id"],
            full["source_sha256"],
            full["configuration"],
        )
        expected = expected_meter_entity_evidence(
            full["configuration"], full_plan.topology
        )
        assert preview == {"transaction_id": "1"}
        assert transactions.calls[0][1]["meter_configuration"].ct_selections
        assert transactions.calls[0][1]["expected_entity_ids"] == expected.object_ids
        assert transactions.calls[0][1]["expected_sensor_names"] == expected.sensor_names
        assert full_plan.snapshot.content == "" and full["plan_id"] not in workflow._plans
        with pytest.raises(WorkflowHandleError, match="stale"):
            await workflow.async_preview_meter_configuration(
                "meter",
                full["plan_id"],
                full["source_sha256"],
                full["configuration"],
            )

        stale = await workflow.async_get_meter_configuration("meter")
        with pytest.raises(WorkflowHandleError, match="stale"):
            await workflow.async_preview_meter_configuration(
                "meter", stale["plan_id"], "0" * 64, stale["configuration"]
            )
        foreign = await workflow.async_get_meter_configuration("meter")
        with pytest.raises(WorkflowHandleError, match="stale"):
            await workflow.async_preview_meter_configuration(
                "other",
                foreign["plan_id"],
                foreign["source_sha256"],
                foreign["configuration"],
            )

        ct_wrapper = await workflow.async_get_ct_inventory("meter")
        wrapper_plan = workflow._plans[ct_wrapper["plan_id"]]
        wrapper_preview = await workflow.async_preview_ct_config(
            "meter",
            ct_wrapper["plan_id"],
            ct_wrapper["source_sha256"],
            (
                {
                    "channel": 1,
                    "name": "Kitchen",
                    "model_id": "sct_006_20a_25ma",
                },
            ),
        )
        wrapper_configuration = transactions.calls[1][1]["meter_configuration"]
        assert wrapper_preview == {"transaction_id": "2"}
        assert wrapper_configuration.channels[0].name == "Kitchen"
        assert all(
            channel.name == f"CT {channel.channel}"
            for channel in wrapper_configuration.channels[1:]
        )
        assert len(wrapper_configuration.ct_selections) == 6
        assert (
            wrapper_plan.snapshot.content == ""
            and ct_wrapper["plan_id"] not in workflow._plans
        )
        equivalent = await workflow.async_get_meter_configuration("meter")
        await workflow.async_preview_meter_configuration(
            "meter",
            equivalent["plan_id"],
            equivalent["source_sha256"],
            MeterConfigurationRequest(
                wrapper_configuration.meter,
                wrapper_configuration.channels,
                wrapper_configuration.aggregates,
                wrapper_configuration.power_quality,
                wrapper_configuration.status_fields,
            ),
        )
        assert transactions.calls[2][1]["meter_configuration"] == wrapper_configuration
        await workflow.async_close()

    asyncio.run(run())


def test_calibrated_handoff_delegates_owned_full_ct_context() -> None:
    """The session boundary forwards calibrated channels and package choices intact."""

    class Transactions:
        def __init__(self) -> None:
            self.calls: list[tuple[tuple[Any, ...], dict[str, Any]]] = []

        async def async_preview_calibrated_gains(
            self, *args: Any, **kwargs: Any
        ) -> dict[str, str]:
            self.calls.append((args, kwargs))
            return {"transaction_id": "handoff"}

    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        handle.state = "verified"
        handle.calibrated_current_channels.add(1)
        handle.pending_reporting_multipliers[1] = 2.0
        transactions = Transactions()
        workflow.transactions = transactions  # type: ignore[assignment]

        result = await workflow.async_preview_calibrated_gains(
            handle.session_id,
            "a" * 32,
            (
                {
                    "channel": 1,
                    "name": "Kitchen",
                    "model_id": "ct",
                    "reporting_multiplier": 2.0,
                },
            ),
            {"power_quality": (False,), "status_fields": (True,)},
        )

        args, kwargs = transactions.calls[0]
        assert result == {"transaction_id": "handoff"}
        assert args[:3] == (MAC, handle.topology, "a" * 32)
        assert args[3][0].channel == 1 and args[4] == frozenset({1})
        assert kwargs == {"package_options": {"power_quality": (False,), "status_fields": (True,)}}
        await workflow.async_close()

    asyncio.run(run())


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
            async_finalize_verified_calibration=save,
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


def adoption_workflow(
    *,
    listing: dict[str, list[dict[str, str]]],
    previous_entry_id: str | None = "old-meter",
    import_error: bool = False,
    device_name: str | None = "new-meter",
) -> tuple[EntryWorkflow, Any]:
    """Build a trusted-discovery adoption workflow with local fakes."""

    class Builder:
        def __init__(self) -> None:
            self.listing = listing
            self.list_calls = 0
            self.imports: list[dict[str, str]] = []

        async def async_list_devices(self) -> dict[str, list[dict[str, str]]]:
            self.list_calls += 1
            return self.listing

        async def async_import_device(self, payload: dict[str, str]) -> str:
            self.imports.append(payload)
            if import_error:
                raise RuntimeError("import failed")
            return "new-meter.yaml"

    entries = {
        "new-meter": SimpleNamespace(
            title="New meter",
            unique_id="aabbccddeeff",
            data={} if device_name is None else {"device_name": device_name},
            runtime_data=SimpleNamespace(
                device_info=SimpleNamespace(
                    package_import_url="github://circuitsetup/package.yaml",
                    project_name="circuitsetup.6c-energy-meter",
                )
            ),
        ),
        "old-meter": SimpleNamespace(unique_id="112233445566"),
    }
    builder = Builder()
    workflow = EntryWorkflow(
        SimpleNamespace(
            config_entries=SimpleNamespace(async_get_entry=entries.get),
        ),
        SimpleNamespace(
            snapshot=SimpleNamespace(
                devices=(
                    DiscoveredDevice(
                        "new-meter", "New meter", "circuitsetup.6c-energy-meter"
                    ),
                )
            )
        ),
        SessionManager(),
        SimpleNamespace(
            async_save_interrupted_session=lambda *_args: None,
            async_save_verified_calibration=lambda *_args: None,
            async_finalize_verified_calibration=lambda *_args: None,
        ),
        previous_entry_id,
        None,
        builder,
    )
    return workflow, builder


def _adoption_session(state: str) -> _SessionHandle:
    return _SessionHandle(
        "adoption-session",
        "old-meter",
        "112233445566",
        topology_from_native("circuitsetup.6c-energy-meter"),
        None,
        {},
        SimpleNamespace(),
        PreflightResult(()),
        {},
        float("inf"),
        state=state,
    )


def test_adopt_imports_current_compatible_discovery_once() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={"configured": [], "importable": []})

        first = await workflow.async_adopt_device("new-meter")
        builder.listing = {
            "configured": [{"name": "new-meter", "configuration": "new-meter.yaml"}],
            "importable": [],
        }
        second = await workflow.async_adopt_device("new-meter")

        assert first == {"device_id": "new-meter", "configuration": "new-meter.yaml"}
        assert second == first
        assert builder.imports == [{
            "name": "new-meter",
            "friendly_name": "New meter",
            "package_import_url": "github://circuitsetup/package.yaml",
        }]

    asyncio.run(run())


def test_adopt_reuses_existing_builder_configuration() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={
            "configured": [{"name": "new-meter", "configuration": "existing.yaml"}],
            "importable": [],
        })

        assert await workflow.async_adopt_device("new-meter") == {
            "device_id": "new-meter",
            "configuration": "existing.yaml",
        }
        assert builder.imports == []

    asyncio.run(run())


def test_adopt_rejects_missing_device_name_before_builder_lookup() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(
            listing={
                "configured": [
                    {"name": "unrelated", "configuration": "unrelated.yaml"}
                ],
                "importable": [],
            },
            device_name=None,
        )

        with pytest.raises(WorkflowCapabilityUnavailable, match="metadata"):
            await workflow.async_adopt_device("new-meter")

        assert builder.list_calls == 0
        assert builder.imports == []

    asyncio.run(run())


def test_adopt_rejects_device_outside_current_compatible_snapshot() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={"configured": [], "importable": []})

        with pytest.raises(WorkflowHandleError, match="available"):
            await workflow.async_adopt_device("unrelated-meter")
        assert builder.imports == []

    asyncio.run(run())


def test_adopt_propagates_import_failure_without_rebinding() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(
            listing={"configured": [], "importable": []}, import_error=True
        )

        with pytest.raises(RuntimeError, match="import failed"):
            await workflow.async_adopt_device("new-meter")

        assert workflow._esphome_entry_id == "old-meter"
        assert len(builder.imports) == 1

    asyncio.run(run())


def test_adopt_rejects_rebinding_while_previous_session_is_active() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={"configured": [], "importable": []})
        workflow._sessions["active"] = _adoption_session("ready")

        with pytest.raises(CalibrationBusyError, match="112233445566"):
            await workflow.async_adopt_device("new-meter")
        assert builder.imports == []

    asyncio.run(run())


def test_adopt_rejects_rebinding_while_previous_transaction_is_active() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={"configured": [], "importable": []})
        workflow.transactions = SimpleNamespace(active_status=lambda mac: {"mac": mac})

        with pytest.raises(CalibrationBusyError, match="112233445566"):
            await workflow.async_adopt_device("new-meter")
        assert builder.imports == []

    asyncio.run(run())


@pytest.mark.parametrize("state", ("verified", "cancelled"))
def test_adopt_allows_rebinding_after_previous_session_is_finalized(state: str) -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={"configured": [], "importable": []})
        workflow._sessions["finalized"] = _adoption_session(state)

        assert await workflow.async_adopt_device("new-meter") == {
            "device_id": "new-meter",
            "configuration": "new-meter.yaml",
        }
        assert len(builder.imports) == 1

    asyncio.run(run())


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
            await workflow.async_calibrate_offset(handle.session_id, 0, 1, True)
        assert (
            await workflow.async_skip_offset_calibration(handle.session_id)
        ).offset_disposition == "skipped"
        await workflow.async_close()

    asyncio.run(run())


@pytest.mark.parametrize("acknowledged", (None, False, 0, 1, "yes"))
def test_offset_calibration_requires_literal_physical_preparation_acknowledgement(
    acknowledged: object,
) -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()

        with pytest.raises(WorkflowHandleError, match="preparation"):
            await workflow.async_calibrate_offset(
                handle.session_id,
                0,
                1,
                preparation_acknowledged=acknowledged,  # type: ignore[arg-type]
            )

        assert handle.offset_results == {}
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

        result = await workflow.async_calibrate_offset(handle.session_id, 0, 1, True)
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


def test_noncanonical_offset_targets_cannot_bypass_partial_retry_confirmation() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        calls: list[tuple[int, int, bool]] = []

        class Calibration:
            async def async_calibrate_offset_board(
                self,
                _mac: str,
                _session: Any,
                _binding: Any,
                board_index: int,
                stage: int,
                *,
                confirm_retry: bool,
            ) -> OffsetCalibrationResult:
                calls.append((board_index, stage, confirm_retry))
                return OffsetCalibrationResult(
                    OffsetCalibrationState.PARTIAL,
                    board_index,
                    stage,
                    (("meter_main1", OFFSET_TABLE),),
                    ("main_2",),
                    True,
                )

        workflow._calibration = Calibration()  # type: ignore[assignment]
        await workflow.async_calibrate_offset(handle.session_id, 0, 1, True)

        for board_index, stage in ((False, 1), (0.0, 1), (0, True), (0, 1.0)):
            with pytest.raises(WorkflowHandleError, match="target is invalid"):
                await workflow.async_calibrate_offset(
                    handle.session_id,
                    board_index,  # type: ignore[arg-type]
                    stage,  # type: ignore[arg-type]
                    True,
                )

        assert calls == [(0, 1, False)]
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
            await workflow.async_calibrate_offset(handle.session_id, 0, 1, True)
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


def test_complete_without_changes_finishes_once_without_restart_or_persistence() -> (
    None
):
    async def run() -> None:
        workflow, handle, sessions, api = _workflow()
        events: list[Any] = []

        async def forbidden(*_args: Any, **_kwargs: Any) -> None:
            raise AssertionError("no-change completion must not restart or persist")

        api.async_restart = forbidden
        workflow._calibration.async_verify_after_restart = forbidden  # type: ignore[method-assign]
        workflow._calibration._persist_verified = forbidden
        workflow.subscribe_session(handle.session_id, events.append)

        status = await workflow.async_complete_calibration_without_changes(
            handle.session_id
        )
        with pytest.raises(WorkflowHandleError, match="already finalized"):
            await workflow.async_acknowledge_safety(handle.session_id, True)
        with pytest.raises(WorkflowHandleError, match="already finalized"):
            await workflow.async_skip_offset_calibration(handle.session_id)
        with pytest.raises(WorkflowHandleError, match="already finalized"):
            await workflow.async_calibrate_voltage(
                handle.session_id,
                (
                    {"group_key": "main_1", "reference": 120.0},
                    {"group_key": "main_2", "reference": 120.0},
                ),
                False,
            )
        repeated = await workflow.async_complete_calibration_without_changes(
            handle.session_id
        )

        assert status.state == "verified"
        assert not status.has_pending_calibration
        assert repeated == status
        assert events == [status]
        assert sessions.pending_calibration(MAC) is None
        sessions._pending_calibrations[MAC] = _pending(
            handle, gains=(("meter_main1", (100, 200, 300)),)
        )
        with pytest.raises(WorkflowHandleError, match="restart verification"):
            await workflow.async_complete_calibration_without_changes(handle.session_id)
        sessions._pending_calibrations.clear()
        with pytest.raises(WorkflowHandleError, match="already finalized"):
            await workflow.async_restart_and_verify(handle.session_id)
        await workflow.async_close()

    asyncio.run(run())


@pytest.mark.parametrize(
    "state",
    (
        "partial",
        "indeterminate",
        "applied_pending_restart_verification",
        "result_outside_tolerance",
    ),
)
def test_complete_without_changes_rejects_mutation_or_recovery_state_without_tables(
    state: str,
) -> None:
    async def run() -> None:
        workflow, handle, sessions, _api = _workflow()
        handle.state = state
        if state == "indeterminate":
            sessions._pending_calibrations[MAC] = _pending(handle)

        with pytest.raises(WorkflowHandleError, match="restart verification"):
            await workflow.async_complete_calibration_without_changes(handle.session_id)

        assert handle.state == state
        await workflow.async_close()

    asyncio.run(run())


@pytest.mark.parametrize(
    ("gains", "offsets", "power_offsets"),
    [
        (("meter_main1", (100, 200, 300)), (), ()),
        ((), ("meter_main1", OFFSET_TABLE), ()),
        ((), (), ("meter_main1", POWER_OFFSET_TABLE)),
        (
            ("meter_main1", (100, 200, 300)),
            ("meter_main2", OFFSET_TABLE),
            ("meter_main1", POWER_OFFSET_TABLE),
        ),
    ],
    ids=("gain-only", "offset-only-partial", "power-offset-only", "mixed"),
)
def test_complete_without_changes_refuses_and_preserves_every_pending_category(
    gains: tuple[Any, ...],
    offsets: tuple[Any, ...],
    power_offsets: tuple[Any, ...],
) -> None:
    async def run() -> None:
        workflow, handle, sessions, _api = _workflow()
        pending = _pending(
            handle,
            gains=(gains,) if gains else (),
            offsets=(offsets,) if offsets else (),
            power_offsets=(power_offsets,) if power_offsets else (),
        )
        sessions._pending_calibrations[MAC] = pending
        events: list[Any] = []
        workflow.subscribe_session(handle.session_id, events.append)

        with pytest.raises(WorkflowHandleError, match="restart verification"):
            await workflow.async_complete_calibration_without_changes(handle.session_id)

        assert sessions.pending_calibration(MAC) == pending
        assert handle.state == "ready"
        assert events == []
        await workflow.async_close()

    asyncio.run(run())


def test_complete_without_changes_uses_active_operation_and_ttl_guards() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        handle.active_task = asyncio.current_task()
        with pytest.raises(WorkflowHandleError, match="active operation"):
            await workflow.async_complete_calibration_without_changes(handle.session_id)

        handle.active_task = None
        handle.expires_at = 0
        with pytest.raises(WorkflowHandleError, match="stale"):
            await workflow.async_complete_calibration_without_changes(handle.session_id)
        await workflow.async_close()

    asyncio.run(run())
