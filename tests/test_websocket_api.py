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
)
from custom_components.circuitsetup_energy_meter_helper.const import DOMAIN
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    ConfigMutationPlan,
    MeterTopology,
    SubstitutionChange,
    TopologyEvidence,
    TopologyEvidenceSource,
)
from custom_components.circuitsetup_energy_meter_helper.websocket_api import (
    ALL_COMMANDS,
    MUTATION_COMMANDS,
    EntryWebsocketController,
)


@dataclass
class FakeEntry:
    """Minimal helper config entry."""

    entry_id: str = "helper"
    data: dict[str, str] | None = None


class FakeConfigEntries:
    def async_entries(self, domain: str) -> list[object]:
        del domain
        return []


class FakeHass:
    """Small HA surface sufficient for setup and async websocket handlers."""

    def __init__(self) -> None:
        self.data: dict[str, Any] = {}
        self.config_entries = FakeConfigEntries()
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
        base |= {"device_id": "meter", "plan_id": "plan", "source_sha256": "a" * 64}
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
        assert isinstance(runtime["websocket_controller"], EntryWebsocketController)
        assert runtime["websocket_controller"].sessions is runtime["sessions"]
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
        assert not runtime["websocket_controller"].has_subscribers

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
