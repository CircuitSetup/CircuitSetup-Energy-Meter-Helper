"""Secure Home Assistant websocket contract tests."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from hashlib import sha256
from types import SimpleNamespace
from typing import Any

import pytest
from homeassistant.exceptions import Unauthorized

from custom_components.circuitsetup_energy_meter_helper import (
    async_setup_entry,
    async_unload_entry,
)
from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionManager,
    ConfigTransactionState,
)
from custom_components.circuitsetup_energy_meter_helper.const import DOMAIN
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    DeviceBuilderClient,
    ESPHomeConfigSnapshot,
    JobResult,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    ConfigMutationPlan,
    MeterTopology,
    SubstitutionChange,
    TopologyEvidence,
    TopologyEvidenceSource,
)
from custom_components.circuitsetup_energy_meter_helper.preflight import PreflightResult
from custom_components.circuitsetup_energy_meter_helper.provisioning import (
    ProvisioningCoordinator,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.store import HelperStore
from custom_components.circuitsetup_energy_meter_helper.websocket_api import (
    ALL_COMMANDS,
    MUTATION_COMMANDS,
    EntryWebsocketController,
    sanitize_payload,
)
from custom_components.circuitsetup_energy_meter_helper.workflow import (
    EntryWorkflow,
    WorkflowHandleError,
)


@dataclass
class FakeEntry:
    """Minimal helper config entry."""

    entry_id: str = "helper"
    data: dict[str, str] | None = None


class FakeConfigEntries:
    def __init__(self, entries: tuple[object, ...] = ()) -> None:
        self.entries = entries

    def async_entries(self, domain: str) -> list[object]:
        return [
            entry for entry in self.entries if getattr(entry, "domain", None) == domain
        ]

    def async_get_entry(self, entry_id: str) -> object | None:
        return next(
            (
                entry
                for entry in self.entries
                if getattr(entry, "entry_id", None) == entry_id
            ),
            None,
        )


class FakeHass:
    """Small HA surface sufficient for setup and async websocket handlers."""

    def __init__(self, entries: tuple[object, ...] = ()) -> None:
        self.data: dict[str, Any] = {}
        self.config_entries = FakeConfigEntries(entries)
        self.config = SimpleNamespace(config_dir=".")
        self.tasks: list[asyncio.Task[None]] = []

    def verify_event_loop_thread(self, name: str) -> None:
        del name

    def async_create_task(self, coroutine: Any) -> asyncio.Task[Any]:
        return asyncio.create_task(coroutine)

    def async_create_background_task(
        self, coroutine: Any, name: str, *, eager_start: bool = False
    ) -> asyncio.Task[Any]:
        del name, eager_start
        task = asyncio.create_task(coroutine)
        self.tasks.append(task)
        return task


class FakeConnection:
    def __init__(self, *, admin: bool = True) -> None:
        self.user = SimpleNamespace(id="admin", is_admin=admin)
        self.subscriptions: dict[int, Any] = {}
        self.results: list[tuple[int, Any]] = []
        self.errors: list[tuple[int, str, str]] = []
        self.events: list[tuple[int, Any]] = []

    def send_result(self, msg_id: int, result: Any = None) -> None:
        self.results.append((msg_id, result))

    def send_error(self, msg_id: int, code: str, message: str) -> None:
        self.errors.append((msg_id, code, message))

    def send_event(self, msg_id: int, event: Any = None) -> None:
        self.events.append((msg_id, event))


def _message(command: str, msg_id: int = 1) -> dict[str, Any]:
    base: dict[str, Any] = {"id": msg_id, "type": command, "entry_id": "helper"}
    suffix = command.rsplit("/", 1)[-1]
    if suffix == "set_installer_intent":
        base |= {"addon_count": 1, "connection_type": "wifi"}
    elif suffix in {"get_topology", "get_ct_inventory", "adopt_device"}:
        base["device_id"] = "meter"
    elif suffix == "preview_ct_config":
        base |= {
            "device_id": "meter",
            "plan_id": "plan",
            "source_sha256": "a" * 64,
            "changes": [
                {
                    "channel": 1,
                    "name": "Kitchen",
                    "model_id": "sct_013_000_100a_50ma",
                }
            ],
        }
    elif suffix in {
        "apply_ct_config",
        "compile_ct_config",
        "install_ct_config",
        "rollback_ct_config",
        "subscribe_config_transaction",
    }:
        base |= {
            "device_id": "meter",
            "transaction_id": "transaction",
            "source_sha256": "a" * 64,
        }
    elif suffix == "start_session":
        base["device_id"] = "meter"
    elif suffix == "acknowledge_safety":
        base |= {"session_id": "session", "acknowledged": True}
    elif suffix == "check_stability":
        base |= {"session_id": "session", "target": "voltage", "target_id": "main_1"}
    elif suffix == "calibrate_voltage":
        base |= {"session_id": "session", "group_key": "main_1", "reference": 120.0}
    elif suffix == "calibrate_current":
        base |= {"session_id": "session", "channel": 1, "reference": 5.0}
    elif suffix in {
        "get_session",
        "restart_and_verify",
        "cancel_session",
        "subscribe_session",
    }:
        base["session_id"] = "session"
    return base


def _assert_browser_safe(value: Any) -> None:
    serialized = repr(value).casefold()
    for forbidden in (
        "wifi-secret",
        "native-key",
        "browser-token",
        "api_encryption_key",
        "password",
        "proposed_content",
        "raw_logs",
    ):
        assert forbidden not in serialized


async def _invoke(
    hass: FakeHass, connection: FakeConnection, msg: dict[str, Any]
) -> None:
    handler, schema = hass.data["websocket_api"][msg["type"]]
    handler(hass, connection, schema(msg) if schema else msg)
    if hass.tasks:
        await asyncio.gather(*hass.tasks)
        hass.tasks.clear()


def test_setup_registers_exact_commands_and_live_owners_then_unloads() -> None:
    """Production setup must own one live router/session owner and remove callbacks."""

    async def run() -> None:
        hass = FakeHass()
        entry = FakeEntry(data={})

        assert await async_setup_entry(hass, entry)
        assert set(hass.data["websocket_api"]) == set(ALL_COMMANDS)
        runtime = hass.data[DOMAIN][entry.entry_id]
        controller = runtime["websocket_controller"]
        assert isinstance(controller, EntryWebsocketController)
        assert controller.sessions is runtime["sessions"]
        assert controller.workflow is runtime["workflow"]
        assert await async_setup_entry(hass, entry)
        assert hass.data[DOMAIN][entry.entry_id] is runtime

        connection = FakeConnection()
        await _invoke(hass, connection, _message(f"{DOMAIN}/setup_status"))
        assert connection.results == [
            (
                1,
                {
                    "configuration_authoritative": False,
                    "devices": [],
                    "state": "no_device",
                },
            )
        ]

        assert await async_unload_entry(hass, entry)
        assert await async_unload_entry(hass, entry)
        assert entry.entry_id not in hass.data[DOMAIN]
        assert not controller.has_subscribers

    asyncio.run(run())


def test_production_setup_builds_real_owners_and_delegates_config_phases(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Configured setup wires real owners; tests replace only the external transport."""

    content = """esphome:
  project:
    name: circuitsetup.6c-energy-meter
substitutions:
  ct1_name: CT 1
  current_cal_ct1: '27518'
  ct2_name: CT 2
  current_cal_ct2: '27518'
  ct3_name: CT 3
  current_cal_ct3: '27518'
  ct4_name: CT 4
  current_cal_ct4: '27518'
  ct5_name: CT 5
  current_cal_ct5: '27518'
  ct6_name: CT 6
  current_cal_ct6: '27518'
"""
    digest = sha256(content.encode()).hexdigest()
    calls: list[str] = []

    async def connect(client: DeviceBuilderClient) -> None:
        del client
        calls.append("connect")

    async def list_devices(client: DeviceBuilderClient) -> dict[str, Any]:
        del client
        return {"configured": [{"name": "meter", "configuration": "meter.yaml"}]}

    async def get_config(
        client: DeviceBuilderClient, configuration: str
    ) -> ESPHomeConfigSnapshot:
        del client
        return ESPHomeConfigSnapshot(configuration, content, digest)

    async def update(
        client: DeviceBuilderClient,
        snapshot: ESPHomeConfigSnapshot,
        proposed: str,
    ) -> None:
        del client, snapshot, proposed
        calls.append("write")

    async def validate(client: DeviceBuilderClient, configuration: str) -> JobResult:
        del client, configuration
        calls.append("validate")
        return JobResult(True, 0, "", ())

    async def compile_config(
        client: DeviceBuilderClient, configuration: str
    ) -> JobResult:
        del client, configuration
        calls.append("compile")
        return JobResult(True, 0, "", ())

    monkeypatch.setattr(DeviceBuilderClient, "async_connect", connect)
    monkeypatch.setattr(DeviceBuilderClient, "async_list_devices", list_devices)
    monkeypatch.setattr(DeviceBuilderClient, "async_get_config", get_config)
    monkeypatch.setattr(DeviceBuilderClient, "async_update_config", update)
    monkeypatch.setattr(DeviceBuilderClient, "async_validate", validate)
    monkeypatch.setattr(DeviceBuilderClient, "async_compile", compile_config)

    async def run() -> None:
        device_info = SimpleNamespace(project_name="circuitsetup.6c-energy-meter")
        esphome_entry = SimpleNamespace(
            domain="esphome",
            entry_id="meter",
            title="Meter",
            unique_id="aa:bb:cc:dd:ee:ff",
            data={"device_name": "meter"},
            runtime_data=SimpleNamespace(device_info=device_info),
        )
        hass = FakeHass((esphome_entry,))
        hass.data["esphome_dashboard_manager"] = SimpleNamespace(
            async_get=lambda: SimpleNamespace(url="http://device-builder")
        )
        entry = FakeEntry(data={"esphome_entry_id": "meter"})

        assert await async_setup_entry(hass, entry)
        runtime = hass.data[DOMAIN]["helper"]
        controller = runtime["websocket_controller"]
        assert controller.workflow is runtime["workflow"]
        assert controller.transactions is runtime["transactions"]
        assert controller.workflow is not None and controller.transactions is not None

        inventory = await controller.async_call(
            f"{DOMAIN}/get_ct_inventory", {"device_id": "meter"}, None
        )
        assert inventory["source_sha256"] == digest
        preview = await controller.async_call(
            f"{DOMAIN}/preview_ct_config",
            {
                "device_id": "meter",
                "plan_id": inventory["plan_id"],
                "source_sha256": digest,
                "changes": (
                    {
                        "channel": 1,
                        "name": "Kitchen",
                        "model_id": "sct_013_000_100a_50ma",
                    },
                ),
            },
            "admin",
        )
        applied = await controller.async_call(
            f"{DOMAIN}/apply_ct_config",
            {
                "device_id": "meter",
                "transaction_id": preview.transaction_id,
                "source_sha256": digest,
            },
            "admin",
        )
        assert applied.state is ConfigTransactionState.VALIDATED
        compiled = await controller.async_call(
            f"{DOMAIN}/compile_ct_config",
            {
                "device_id": "meter",
                "transaction_id": preview.transaction_id,
                "source_sha256": digest,
            },
            "admin",
        )
        assert compiled.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert calls == ["connect", "write", "validate", "compile"]

        await async_unload_entry(hass, entry)

    asyncio.run(run())


def test_server_plan_and_session_handles_expire_before_use_or_subscription(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Workflow checks bounded monotonic deadlines before mutation and subscribe."""

    content = """esphome:
  project:
    name: circuitsetup.6c-energy-meter
substitutions:
  ct1_name: CT 1
  current_cal_ct1: '27518'
  ct2_name: CT 2
  current_cal_ct2: '27518'
  ct3_name: CT 3
  current_cal_ct3: '27518'
  ct4_name: CT 4
  current_cal_ct4: '27518'
  ct5_name: CT 5
  current_cal_ct5: '27518'
  ct6_name: CT 6
  current_cal_ct6: '27518'
"""
    digest = sha256(content.encode()).hexdigest()
    now = 10.0

    class Builder:
        async def async_list_devices(self) -> dict[str, Any]:
            return {"configured": [{"name": "meter", "configuration": "meter.yaml"}]}

        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            return ESPHomeConfigSnapshot(configuration, content, digest)

        async def async_close(self) -> None:
            return None

    class Api:
        entities: tuple[Any, ...] = ()
        connection_generation = 1

        async def async_connect(self) -> None:
            return None

    async def run() -> None:
        nonlocal now
        device_info = SimpleNamespace(project_name="circuitsetup.6c-energy-meter")
        esphome_entry = SimpleNamespace(
            domain="esphome",
            entry_id="meter",
            title="Meter",
            unique_id="aa:bb:cc:dd:ee:ff",
            data={"device_name": "meter"},
            runtime_data=SimpleNamespace(device_info=device_info),
        )
        hass = FakeHass((esphome_entry,))
        provisioning = ProvisioningCoordinator(hass)
        await provisioning.async_rescan()
        fake_binding = SimpleNamespace(
            topology=topology_from_native("circuitsetup.6c-energy-meter"),
            connection_generation=1,
            groups=(),
            channels=(),
        )
        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.workflow.EntityCatalog",
            lambda *args: SimpleNamespace(),
        )
        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.workflow.bind_meter",
            lambda *args: fake_binding,
        )

        async def preflight(*args: Any) -> PreflightResult:
            del args
            return PreflightResult(())

        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.workflow.async_preflight",
            preflight,
        )
        workflow = EntryWorkflow(
            hass,
            provisioning,
            SessionManager(),
            HelperStore(hass),
            "meter",
            Api(),  # type: ignore[arg-type]
            Builder(),  # type: ignore[arg-type]
            handle_ttl=5,
            clock=lambda: now,
        )
        inventory = await workflow.async_get_ct_inventory("meter")
        session = await workflow.async_start_session("meter")
        now = 16.0

        with pytest.raises(WorkflowHandleError):
            await workflow.async_preview_ct_config(
                "meter",
                inventory["plan_id"],
                digest,
                (
                    {
                        "channel": 1,
                        "name": "Kitchen",
                        "model_id": "sct_013_000_100a_50ma",
                    },
                ),
            )
        with pytest.raises(WorkflowHandleError):
            workflow.subscribe_session(session.session_id, lambda event: None)
        with pytest.raises(WorkflowHandleError):
            await workflow.async_get_session(session.session_id)

        await workflow.async_close()

    from custom_components.circuitsetup_energy_meter_helper.topology import (
        topology_from_native,
    )

    asyncio.run(run())


@pytest.mark.parametrize("command", MUTATION_COMMANDS)
def test_every_write_command_uses_native_admin_refusal(command: str) -> None:
    """Removing require_admin from any mutation must expose this refusal test."""

    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        handler, schema = hass.data["websocket_api"][command]
        msg = _message(command)

        with pytest.raises(Unauthorized):
            handler(hass, FakeConnection(admin=False), schema(msg) if schema else msg)

    asyncio.run(run())


def test_success_error_snapshot_and_event_are_recursively_redacted() -> None:
    """Nested provider secrets and arbitrary exception text never cross the socket."""

    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]
        controller.set_diagnostics_provider(
            lambda: {
                "safe": "ok",
                "nested": {
                    "token": "browser-token",
                    "items": [{"name": "meter", "api_encryption_key": "native-key"}],
                },
                "text": "password: wifi-secret",
            }
        )
        connection = FakeConnection()
        await _invoke(hass, connection, _message(f"{DOMAIN}/get_diagnostics_summary"))
        assert connection.results == [
            (
                1,
                {
                    "nested": {"items": [{"name": "meter"}]},
                    "safe": "ok",
                    "text": "<redacted>",
                },
            )
        ]

        controller.set_diagnostics_provider(
            lambda: (_ for _ in ()).throw(RuntimeError("token=do-not-leak"))
        )
        await _invoke(
            hass,
            connection,
            _message(f"{DOMAIN}/get_diagnostics_summary", 2),
        )
        assert connection.errors[-1] == (
            2,
            "operation_failed",
            "The request could not be completed",
        )
        assert "do-not-leak" not in repr((connection.results, connection.errors))

        subscribe = _message(f"{DOMAIN}/subscribe_setup", 3)
        await _invoke(hass, connection, subscribe)
        assert connection.results[-1] == (3, None)
        assert connection.events[-1][1]["state"] == "no_device"
        controller.provisioning._publish()
        assert len([item for item in connection.events if item[0] == 3]) == 2
        connection.subscriptions[3]()
        controller.provisioning._publish()
        assert len([item for item in connection.events if item[0] == 3]) == 2

    asyncio.run(run())


def test_transaction_confirmation_rejects_hash_device_and_replay_before_mutation() -> (
    None
):
    """Checked transaction ownership prevents forged, stale, and replayed writes."""

    class Transactions:
        def __init__(self) -> None:
            self.calls = 0
            self.used = False

        def assert_confirmation(
            self, transaction_id: str, device_id: str, source_sha256: str
        ) -> None:
            if self.used or (transaction_id, device_id, source_sha256) != (
                "transaction",
                "meter",
                "a" * 64,
            ):
                raise KeyError("private payload must not escape")

        async def async_confirm_write(
            self, transaction_id: str, user_id: str
        ) -> dict[str, str]:
            del transaction_id, user_id
            self.calls += 1
            self.used = True
            return {"state": "validated", "source_sha256": "a" * 64}

    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]
        transactions = Transactions()
        controller.transactions = transactions
        connection = FakeConnection()

        await _invoke(hass, connection, _message(f"{DOMAIN}/apply_ct_config"))
        assert transactions.calls == 1
        assert connection.results[-1][1]["state"] == "validated"

        await _invoke(hass, connection, _message(f"{DOMAIN}/apply_ct_config", 2))
        assert transactions.calls == 1
        assert connection.errors[-1][:2] == (2, "stale_confirmation")

        forged = _message(f"{DOMAIN}/apply_ct_config", 3)
        forged["device_id"] = "other"
        await _invoke(hass, connection, forged)
        assert transactions.calls == 1
        assert connection.errors[-1][:2] == (3, "stale_confirmation")

    asyncio.run(run())


def test_real_transaction_owner_binds_confirmation_to_mac_and_source_hash() -> None:
    """The real manager, not a browser DTO, owns transaction confirmation identity."""

    async def run() -> None:
        sessions = __import__(
            "custom_components.circuitsetup_energy_meter_helper.session_manager",
            fromlist=["SessionManager"],
        ).SessionManager()
        manager = ConfigTransactionManager(
            SimpleNamespace(), SimpleNamespace(), SimpleNamespace(), sessions
        )
        content = "substitutions:\n  ct1_name: Main\n"
        digest = sha256(content.encode()).hexdigest()
        topology = MeterTopology.from_addon_count(
            0,
            connection_type="wifi",
            voltage_layout="standard",
            project_name="circuitsetup.6c-energy-meter",
            evidence=(
                TopologyEvidence(
                    TopologyEvidenceSource.CONFIG_PROJECT, 0, "base project"
                ),
            ),
        )
        status = await manager.async_preview(
            "aabbccddeeff",
            topology,
            ConfigMutationPlan(
                "meter.yaml",
                digest,
                (SubstitutionChange("ct1_name", "Main", "Kitchen"),),
                "-  ct1_name: Main\n+  ct1_name: Kitchen",
                "substitutions:\n  ct1_name: Kitchen\n",
            ),
            ESPHomeConfigSnapshot("meter.yaml", content, digest),
        )

        manager.assert_confirmation(status.transaction_id, "aabbccddeeff", digest)
        with pytest.raises(KeyError):
            manager.assert_confirmation(status.transaction_id, "112233445566", digest)
        with pytest.raises(KeyError):
            manager.assert_confirmation(status.transaction_id, "aabbccddeeff", "b" * 64)
        await sessions.async_unload()

    asyncio.run(run())


def test_every_topology_and_calibration_route_delegates_and_session_events_unsubscribe() -> (
    None
):
    """Every named route reaches the existing workflow owner with validated handles."""

    class Workflow:
        def __init__(self) -> None:
            self.calls: list[tuple[str, tuple[Any, ...]]] = []
            self.callback: Any = None

        def __getattr__(self, name: str) -> Any:
            if not name.startswith("async_"):
                raise AttributeError(name)

            async def call(*args: Any) -> dict[str, str]:
                self.calls.append((name, args))
                return {"operation": name}

            return call

        def subscribe_session(self, session_id: str, callback: Any) -> Any:
            self.calls.append(("subscribe_session", (session_id,)))
            self.callback = callback
            callback({"state": "new"})

            def unsubscribe() -> None:
                self.callback = None

            return unsubscribe

    commands = (
        "get_topology",
        "get_ct_inventory",
        "get_session",
        "adopt_device",
        "preview_ct_config",
        "start_session",
        "acknowledge_safety",
        "check_stability",
        "calibrate_voltage",
        "calibrate_current",
        "restart_and_verify",
        "cancel_session",
    )

    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        workflow = Workflow()
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]
        controller.workflow = workflow
        connection = FakeConnection()

        for msg_id, operation in enumerate(commands, 1):
            await _invoke(hass, connection, _message(f"{DOMAIN}/{operation}", msg_id))
            assert connection.results[-1][1]["operation"] == f"async_{operation}"

        await _invoke(
            hass,
            connection,
            _message(f"{DOMAIN}/subscribe_session", len(commands) + 1),
        )
        session_events = [
            event
            for event_id, event in connection.events
            if event_id == len(commands) + 1
        ]
        assert session_events == [
            {"operation": "async_get_session"},
            {"state": "new"},
        ]
        workflow.callback({"state": "live", "raw_logs": ["password=x"]})
        assert connection.events[-1][1] == {"state": "live"}
        connection.subscriptions[len(commands) + 1]()
        assert workflow.callback is None

    asyncio.run(run())


def test_every_command_boundary_redacts_success_event_and_error_payloads() -> None:
    """Every registered command shares the recursive redaction and stable-error gate."""

    unsafe = {
        "safe": "visible",
        "token": "browser-token",
        "nested": [
            {"api_encryption_key": "native-key"},
            {"blob": "esphome:\n  wifi:\n    password: wifi-secret"},
        ],
        "proposed_content": "wifi-secret",
        "raw_logs": ["password=wifi-secret"],
    }

    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]

        async def call(*args: Any) -> Any:
            del args
            return unsafe

        async def snapshot(*args: Any) -> Any:
            del args
            return unsafe

        def subscribe(*args: Any) -> Any:
            callback = args[-1]
            callback(unsafe)
            return lambda: None

        controller.async_call = call  # type: ignore[method-assign]
        controller.async_snapshot = snapshot  # type: ignore[method-assign]
        controller.subscribe = subscribe  # type: ignore[method-assign]
        connection = FakeConnection()
        for msg_id, command in enumerate(ALL_COMMANDS, 1):
            await _invoke(hass, connection, _message(command, msg_id))
        _assert_browser_safe((connection.results, connection.events))

        async def fail(*args: Any) -> Any:
            del args
            raise RuntimeError("password=wifi-secret token=browser-token")

        controller.async_call = fail  # type: ignore[method-assign]
        controller.async_snapshot = fail  # type: ignore[method-assign]
        for msg_id, command in enumerate(ALL_COMMANDS, len(ALL_COMMANDS) + 1):
            await _invoke(hass, connection, _message(command, msg_id))
        _assert_browser_safe(connection.errors)
        assert {code for _, code, _ in connection.errors} == {"operation_failed"}

    asyncio.run(run())


def test_unsafe_initial_subscription_snapshot_removes_provider_callback() -> None:
    """A rejected initial payload cannot leave a hidden live subscription behind."""

    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]
        active = True

        async def snapshot(*args: Any) -> Any:
            del args
            return {"items": ["x" * 1000] * 100}

        def subscribe(*args: Any) -> Any:
            del args

            def unsubscribe() -> None:
                nonlocal active
                active = False

            return unsubscribe

        controller.async_snapshot = snapshot  # type: ignore[method-assign]
        controller.subscribe = subscribe  # type: ignore[method-assign]
        connection = FakeConnection()
        await _invoke(hass, connection, _message(f"{DOMAIN}/subscribe_setup"))

        assert not active
        assert connection.results == []
        assert connection.errors == [(1, "invalid_request", "The request is invalid")]
        assert connection.subscriptions == {}

    asyncio.run(run())


def test_subscription_preserves_setup_race_fifo_and_blocks_late_callback() -> None:
    """Events emitted during snapshot setup remain ordered and stop after unsubscribe."""

    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]
        snapshot_gate = asyncio.Event()
        callback: Any = None

        async def snapshot(*args: Any) -> Any:
            del args
            await snapshot_gate.wait()
            return {"seq": 0}

        def subscribe(*args: Any) -> Any:
            nonlocal callback
            callback = args[-1]
            return lambda: None

        controller.async_snapshot = snapshot  # type: ignore[method-assign]
        controller.subscribe = subscribe  # type: ignore[method-assign]
        connection = FakeConnection()
        task = asyncio.create_task(
            _invoke(hass, connection, _message(f"{DOMAIN}/subscribe_setup"))
        )
        while callback is None:
            await asyncio.sleep(0)
        callback({"seq": 1})
        callback({"seq": 2})
        snapshot_gate.set()
        await task

        assert [event for _, event in connection.events] == [
            {"seq": 0},
            {"seq": 1},
            {"seq": 2},
        ]
        connection.subscriptions[1]()
        callback({"seq": 3})
        assert connection.events[-1][1] == {"seq": 2}

    asyncio.run(run())


def test_subscription_overflow_requests_resync_and_terminates() -> None:
    """A setup race beyond the bounded FIFO fails explicitly without late sends."""

    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]
        snapshot_gate = asyncio.Event()
        callback: Any = None

        async def snapshot(*args: Any) -> Any:
            del args
            await snapshot_gate.wait()
            return {"seq": 0}

        def subscribe(*args: Any) -> Any:
            nonlocal callback
            callback = args[-1]
            return lambda: None

        controller.async_snapshot = snapshot  # type: ignore[method-assign]
        controller.subscribe = subscribe  # type: ignore[method-assign]
        connection = FakeConnection()
        task = asyncio.create_task(
            _invoke(hass, connection, _message(f"{DOMAIN}/subscribe_setup"))
        )
        while callback is None:
            await asyncio.sleep(0)
        for seq in range(40):
            callback({"seq": seq})
        snapshot_gate.set()
        await task

        assert connection.results == [(1, None)]
        assert connection.events == [(1, {"error": {"code": "resync_required"}})]
        assert connection.subscriptions == {}
        callback({"seq": 41})
        assert len(connection.events) == 1

    asyncio.run(run())


def test_cleanup_failure_still_scrubs_and_unloads_all_owners() -> None:
    """A provider unsubscribe error cannot abort the remaining teardown."""

    class Workflow:
        closed = False

        async def async_close(self) -> None:
            self.closed = True

    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]
        workflow = Workflow()
        controller.workflow = workflow  # type: ignore[assignment]

        def broken_unsubscribe() -> None:
            raise RuntimeError("provider cleanup failed")

        controller._subscriptions.add(broken_unsubscribe)
        with pytest.raises(BaseExceptionGroup):
            await controller.async_close()

        assert not controller._subscriptions
        assert controller.workflow is None
        assert controller.transactions is None
        assert workflow.closed
        assert controller.sessions._closed

    asyncio.run(run())


def test_integration_unload_reports_after_provider_cleanup_and_runtime_scrub(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Integration unload attempts independent owners and is retry-safe on errors."""

    async def run() -> None:
        hass = FakeHass()
        entry = FakeEntry(data={})
        await async_setup_entry(hass, entry)
        runtime = hass.data[DOMAIN]["helper"]
        controller = runtime["websocket_controller"]
        provisioning = runtime["provisioning"]
        calls: list[str] = []

        def unregister(*args: Any) -> None:
            del args
            calls.append("router")
            raise RuntimeError("router cleanup failed")

        async def close() -> None:
            calls.append("controller")
            await controller.sessions.async_unload()
            raise RuntimeError("controller cleanup failed")

        async def stop() -> None:
            calls.append("provisioning")
            raise RuntimeError("provisioning cleanup failed")

        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.async_unregister_entry",
            unregister,
        )
        controller.async_close = close  # type: ignore[method-assign]
        provisioning.async_stop = stop  # type: ignore[method-assign]

        with pytest.raises(BaseExceptionGroup) as caught:
            await async_unload_entry(hass, entry)
        assert len(caught.value.exceptions) == 3
        assert calls == ["router", "controller", "provisioning"]
        assert controller.sessions._closed
        assert runtime == {}
        assert "helper" not in hass.data[DOMAIN]
        assert await async_unload_entry(hass, entry)

    asyncio.run(run())


def test_recursive_sanitizer_removes_ansi_c0_c1_from_keys_and_values() -> None:
    """Provider-controlled keys and values are control-free before redaction."""

    assert sanitize_payload(
        {
            "\x1b[31mlabel\x07": "\x1b[32mvalue\x00",
            "nested": {"\x9b31mpassword\x9c": "secret=hidden"},
            "osc": "\x1b]0;title\x07visible",
            "document": "esphome:\n  substitutions: safe",
        }
    ) == {
        "label": "value",
        "nested": {},
        "osc": "visible",
        "document": "<redacted>",
    }
