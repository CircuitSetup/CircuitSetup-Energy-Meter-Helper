"""Stock offset browser scenario on the existing local-only fixture server."""

from dataclasses import replace
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace

from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionManager,
    ReconnectEvidence,
)
from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
    OffsetRecovery,
)
from custom_components.circuitsetup_energy_meter_helper.websocket_api import (
    EntryWebsocketController,
)
from tests.test_config_transaction import Persistence, Verifier
from tests.test_esphome_api import make_session
from tests.test_offset_recovery import MAC, hass_at, observed
from tests.test_preflight import binding_with_offset_controls
from tests.test_stock_offset_finalization import SelectionClient
from tests.test_stock_offset_preparation import StockSession
from tests.test_workflow import _workflow


async def attach_stock(fixture):
    """Keep normal inventory; attach actual calibration/recovery/transaction owners."""
    workflow, handle, sessions, _ = _workflow()
    workflow._sessions.clear()
    handle.session_id, handle.device_id = "b" * 32, "meter-1"
    handle.calibration_plan = "full"
    workflow._sessions[handle.session_id] = handle
    handle.binding = binding_with_offset_controls(0)
    handle.configuration, handle.configuration_sha256 = "meter.yaml", (await fixture.builder.async_get_config("meter.yaml")).sha256
    stock = StockSession(handle.binding, fail_second=True)
    stock.sessions = sessions
    native = make_session([SelectionClient()])
    await native.async_connect()
    stock.async_offset_configuration_selection = native.async_offset_configuration_selection
    stock.hold_connection_generation = native.hold_connection_generation
    fixture.stock_temp = TemporaryDirectory(prefix="csemh-task9-")
    workflow._offset_recovery = OffsetRecovery(hass_at(Path(fixture.stock_temp.name)), sessions)
    workflow._api, workflow._builder = stock, fixture.builder
    workflow.transactions = ConfigTransactionManager(fixture.builder, Verifier(ReconnectEvidence(
        MAC, handle.topology, {i: f"CT{i}" for i in range(1, 7)}, 6)), Persistence(), sessions,
        offset_recovery=workflow._offset_recovery)
    handle.timing_policy = SimpleNamespace(evidence_timeout_s=0.025, sensor_window_timeout_s=0.025)
    fixture.stock_workflow, fixture.stock_handle, fixture.stock_api = workflow, handle, stock
    fixture.manager = workflow.transactions
    # Exercise the production command dispatch, with no HA/native connection.
    fixture.stock_controller = EntryWebsocketController(SimpleNamespace(), sessions, fixture.store)
    fixture.stock_controller.workflow = workflow
    fixture.stock_controller.transactions = workflow.transactions


async def stock_call(fixture, frame):
    operation = frame["type"].split("/")[-1]
    handle, workflow = fixture.stock_handle, fixture.stock_workflow
    if operation == "get_active_work":
        return {"session": await workflow.async_get_session(handle.session_id),
            "transaction": fixture.manager.active_status(MAC), "verified_calibration": None}
    if operation == "subscribe_session":
        return await workflow.async_get_session(frame["session_id"])
    if operation == "start_session":
        return await workflow.async_get_session(handle.session_id)
    if operation in {"check_offset_readiness", "resume_offset_calibration"}:
        fixture.stock_api.stage = frame["stage"]
    result = await fixture.stock_controller.async_call(frame["type"], frame, "fixture-user")
    if operation == "resume_offset_calibration":
        fixture.stock_api.fail_second = False
        for group, values in result.expected_tables:
            instance = group.replace("main_", "meter_main")
            fixture.stock_api.snapshot_overrides[(instance, frame["stage"])] = replace(
                observed(instance, fixture.stock_api.connection_generation),
                offset_stage=frame["stage"], phase_values=values,
            )
    return result
