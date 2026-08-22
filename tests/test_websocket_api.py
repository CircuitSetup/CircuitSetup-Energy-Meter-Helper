"""Secure Home Assistant websocket contract tests."""

from __future__ import annotations

import asyncio
import json
from collections.abc import Mapping
from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest
from aiohttp import ClientConnectionError
from homeassistant.components.hassio import HassIO
from homeassistant.components.hassio.const import DATA_COMPONENT
from homeassistant.const import __version__ as HA_VERSION
from homeassistant.exceptions import ConfigEntryNotReady, Unauthorized

from custom_components.circuitsetup_energy_meter_helper import (
    async_setup_entry,
    async_unload_entry,
    repairs,
)
from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionManager,
    ConfigTransactionState,
)
from custom_components.circuitsetup_energy_meter_helper.const import DOMAIN
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    ConfigMutationPlan,
    MeterTopology,
    StoredCTSelection,
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
from custom_components.circuitsetup_energy_meter_helper.state_tracker import (
    SensorSampleWindow,
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
    LazyDeviceBuilder,
    WorkflowHandleError,
    _public_sample_window,
)

_MISSING = object()


async def _native_only_workflow(
    monkeypatch: pytest.MonkeyPatch,
    *,
    preflight: Any | None = None,
) -> tuple[EntryWorkflow, Any, SessionManager]:
    from custom_components.circuitsetup_energy_meter_helper.topology import (
        topology_from_native,
    )

    topology = topology_from_native("circuitsetup.6c-energy-meter")
    entry = SimpleNamespace(
        domain="esphome",
        entry_id="meter",
        title="Meter",
        unique_id="aa:bb:cc:dd:ee:ff",
        data={"device_name": "meter"},
        runtime_data=SimpleNamespace(
            device_info=SimpleNamespace(project_name=topology.project_name)
        ),
    )
    hass = FakeHass((entry,))
    provisioning = ProvisioningCoordinator(hass)
    await provisioning.async_rescan()
    binding = SimpleNamespace(
        topology=topology,
        connection_generation=1,
        groups=(),
        channels=(),
    )
    monkeypatch.setattr(
        "custom_components.circuitsetup_energy_meter_helper.workflow.bind_meter",
        lambda *_args: binding,
    )

    async def ready_preflight(*_args: Any) -> PreflightResult:
        return PreflightResult(())

    monkeypatch.setattr(
        "custom_components.circuitsetup_energy_meter_helper.workflow.async_preflight",
        preflight or ready_preflight,
    )

    class Api:
        entities: tuple[Any, ...] = ()
        connection_generation = 1

        async def async_connect(self) -> None:
            return None

    store = HelperStore(hass)

    async def selections(_mac: str) -> tuple[StoredCTSelection, ...]:
        return (
            StoredCTSelection(1, None, None, 27_518, 2.0, "0" * 64),
        )

    store.async_get_ct_selections = selections  # type: ignore[method-assign]
    sessions = SessionManager()
    workflow = EntryWorkflow(
        hass,
        provisioning,
        sessions,
        store,
        "meter",
        Api(),  # type: ignore[arg-type]
        None,
    )
    return workflow, binding, sessions


def test_stability_browser_evidence_has_samples_and_standard_deviation() -> None:
    """The browser DTO excludes timestamps but retains every required statistic."""
    result = _public_sample_window(
        SensorSampleWindow((9.0, 10.0, 11.0), (1.0, 2.0, 3.0), 10.0, 9.0, 11.0, 20.0)
    )

    assert result == {
        "samples": (9.0, 10.0, 11.0),
        "mean": 10.0,
        "standard_deviation": pytest.approx(0.8164965809),
        "range_percent": 20.0,
    }
    assert "received_at" not in result


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
        self.loop = asyncio.get_event_loop()
        self.config = SimpleNamespace(config_dir=".", path=lambda *parts: str(Path(".").joinpath(*parts)))
        self.tasks: list[asyncio.Task[None]] = []

    def verify_event_loop_thread(self, name: str) -> None:
        del name

    async def async_add_executor_job(self, target: Any, *args: Any) -> Any:
        del target, args
        return {}

    def async_create_task(self, coroutine: Any) -> asyncio.Task[Any]:
        return asyncio.create_task(coroutine)

    def async_create_background_task(
        self, coroutine: Any, name: str, *, eager_start: bool = False
    ) -> asyncio.Task[Any]:
        del name, eager_start
        task = asyncio.create_task(coroutine)
        self.tasks.append(task)
        return task


def _official_addon_info() -> dict[str, Any]:
    """Return the real Supervisor model shape for the official add-on."""
    return {
        "advanced": False,
        "available": True,
        "build": False,
        "description": "ESPHome Device Builder",
        "homeassistant": None,
        "icon": True,
        "logo": True,
        "name": "ESPHome Device Builder",
        "repository": "5c53de3b",
        "slug": "5c53de3b_esphome",
        "stage": "stable",
        "update_available": False,
        "url": "https://esphome.io/",
        "version_latest": "2026.8.0",
        "version": "2026.8.0",
        "detached": False,
        "state": "started",
        "arch": ["amd64"],
        "documentation": True,
        "apparmor": "default",
        "auth_api": False,
        "docker_api": False,
        "full_access": False,
        "homeassistant_api": True,
        "host_network": True,
        "host_pid": False,
        "ingress": True,
        "long_description": None,
        "rating": 6,
        "signed": True,
        "hassio_api": True,
        "hassio_role": "manager",
        "hostname": "5c53de3b-esphome",
        "dns": [],
        "protected": True,
        "boot": "auto",
        "boot_config": "auto",
        "options": {},
        "schema": [],
        "machine": [],
        "network": None,
        "network_description": None,
        "host_ipc": False,
        "host_uts": False,
        "host_dbus": False,
        "privileged": [],
        "changelog": True,
        "stdin": False,
        "gpio": False,
        "usb": True,
        "uart": True,
        "kernel_modules": False,
        "devicetree": False,
        "udev": True,
        "video": False,
        "audio": False,
        "startup": "application",
        "services": [],
        "discovery": [],
        "translations": {},
        "webui": None,
        "ingress_entry": "/api/hassio_ingress/official-entry",
        "ingress_url": None,
        "ingress_port": 6052,
        "ingress_panel": True,
        "audio_input": None,
        "audio_output": None,
        "auto_update": False,
        "ip_address": "172.30.33.2",
        "watchdog": True,
        "devices": [],
        "system_managed": False,
        "system_managed_config_entry": None,
    }


class SupervisorResponse:
    """Small aiohttp response boundary consumed by aiohasupervisor."""

    def __init__(self, data: Any, status: int = 200) -> None:
        self._data = data
        self.status = status
        self.headers = {"Content-Type": "application/json"}

    async def text(self) -> str:
        return json.dumps({"result": "ok", "data": self._data})


class BuilderTransportWebSocket:
    """Protocol transport fake; DeviceBuilderClient business methods stay real."""

    def __init__(self, content: str) -> None:
        self.content = content
        self.calls: list[str] = []
        self.received: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()
        self.received.put_nowait({"server_version": "2026.8", "requires_auth": False})

    async def send_json(self, message: dict[str, Any]) -> None:
        command = message["command"]
        message_id = message["message_id"]
        self.calls.append(command)
        if command == "devices/list":
            result: Any = {
                "configured": [{"name": "meter", "configuration": "meter.yaml"}]
            }
        elif command == "devices/get_config":
            result = self.content
        elif command == "devices/update_config":
            self.content = message["args"]["content"]
            result = {}
        elif command == "devices/validate":
            await self.received.put(
                {
                    "message_id": message_id,
                    "event": "result",
                    "data": {"success": True, "code": 0},
                }
            )
            return
        elif command == "firmware/compile":
            result = {"job_id": "compile-1"}
        elif command == "firmware/follow_job":
            await self.received.put(
                {
                    "message_id": message_id,
                    "event": "result",
                    "data": {"status": "completed", "exit_code": 0},
                }
            )
            return
        else:
            raise AssertionError(f"unexpected command {command}")
        await self.received.put({"message_id": message_id, "result": result})

    async def receive_json(self) -> dict[str, Any] | None:
        return await self.received.get()

    async def close(self) -> None:
        await self.received.put(None)


class SupervisorTransport:
    """Fake only Supervisor HTTP and Device Builder websocket transports."""

    def __init__(
        self,
        websocket: BuilderTransportWebSocket,
        *,
        request_error: BaseException | None = None,
        addon_status: int = 200,
        addon_overrides: Mapping[str, Any] | None = None,
        addon_missing: str | None = None,
        session_value: Any = "issued-session",
    ) -> None:
        self.websocket = websocket
        self.request_error = request_error
        self.addon_status = addon_status
        self.addon_overrides = dict(addon_overrides or {})
        self.addon_missing = addon_missing
        self.session_value = session_value
        self.requests: list[tuple[str, str, dict[str, Any]]] = []
        self.websocket_requests: list[tuple[str, dict[str, Any]]] = []

    async def request(self, method: str, url: Any, **kwargs: Any) -> SupervisorResponse:
        self.requests.append((method, str(url), kwargs))
        if self.request_error is not None:
            raise self.request_error
        if str(url).endswith("/addons/5c53de3b_esphome/info"):
            addon = _official_addon_info()
            addon.update(self.addon_overrides)
            if self.addon_missing is not None:
                addon.pop(self.addon_missing, None)
            return SupervisorResponse(addon, self.addon_status)
        if str(url).endswith("/ingress/session"):
            return SupervisorResponse(
                {}
                if self.session_value is _MISSING
                else {"session": self.session_value}
            )
        raise AssertionError(f"unexpected Supervisor request {url}")

    async def ws_connect(self, url: str, **kwargs: Any) -> BuilderTransportWebSocket:
        self.websocket_requests.append((url, kwargs))
        return self.websocket


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
    elif suffix == "set_ha_labels":
        base |= {
            "device_id": "meter",
            "plan_id": "plan",
            "source_sha256": "a" * 64,
            "changes": [{"channel": 1, "name": "Kitchen"}],
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


def test_production_setup_builds_real_owners_and_delegates_config_phases() -> None:
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

    async def run() -> None:
        websocket = BuilderTransportWebSocket(content)
        transport = SupervisorTransport(websocket)

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
        hass.data[DATA_COMPONENT] = HassIO(
            asyncio.get_running_loop(),
            transport,  # type: ignore[arg-type]
            "supervisor",
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
        assert websocket.calls == [
            "devices/list",
            "devices/get_config",
            "devices/get_config",
            "devices/update_config",
            "devices/validate",
            "firmware/compile",
            "firmware/follow_job",
        ]
        assert [(method, url) for method, url, _ in transport.requests] == [
            ("GET", "http://supervisor/addons/5c53de3b_esphome/info"),
            ("POST", "http://supervisor/ingress/session"),
            ("POST", "http://supervisor/ingress/session"),
        ]
        assert transport.websocket_requests == [
            (
                "http://supervisor/ingress/official-entry/ws",
                {
                    "headers": {
                        "Cookie": "ingress_session=issued-session",
                        "X-Hass-Source": "core.ingress",
                        "X-Ingress-Path": "/api/hassio_ingress/official-entry",
                    },
                },
            )
        ]

        await async_unload_entry(hass, entry)

    asyncio.run(run())


def test_supervisor_operational_failure_retries_after_setup_owner_unwind(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A transport failure is retryable, while verified add-on absence is optional."""

    async def run() -> None:
        stopped = 0
        original_stop = ProvisioningCoordinator.async_stop

        async def tracked_stop(owner: ProvisioningCoordinator) -> None:
            nonlocal stopped
            stopped += 1
            await original_stop(owner)

        monkeypatch.setattr(ProvisioningCoordinator, "async_stop", tracked_stop)
        websocket = BuilderTransportWebSocket("")
        hass = FakeHass()
        hass.data[DATA_COMPONENT] = HassIO(
            asyncio.get_running_loop(),
            SupervisorTransport(
                websocket, request_error=ClientConnectionError("offline")
            ),  # type: ignore[arg-type]
            "supervisor",
        )
        entry = FakeEntry(data={})
        with pytest.raises(ConfigEntryNotReady, match="temporarily unavailable"):
            await async_setup_entry(hass, entry)
        assert stopped == 1
        assert entry.entry_id not in hass.data[DOMAIN]

        absent_hass = FakeHass()
        absent_hass.data[DATA_COMPONENT] = HassIO(
            asyncio.get_running_loop(),
            SupervisorTransport(websocket, addon_status=404),  # type: ignore[arg-type]
            "supervisor",
        )
        assert await async_setup_entry(absent_hass, entry)
        assert absent_hass.data[DOMAIN][entry.entry_id]["device_builder"] is None
        await async_unload_entry(absent_hass, entry)

    asyncio.run(run())


@pytest.mark.parametrize(
    ("addon_overrides", "addon_missing", "session_value"),
    (
        ({"slug": "unexpected"}, None, "issued-session"),
        ({"name": "Impostor Builder"}, None, "issued-session"),
        ({}, "slug", "issued-session"),
        ({"ingress": None}, None, "issued-session"),
        (
            {"ingress_entry": "/api/hassio_ingress/../nested"},
            None,
            "issued-session",
        ),
        (
            {"ingress_entry": "/api/hassio_ingress/control\x1btoken"},
            None,
            "issued-session",
        ),
        ({}, None, ""),
        ({}, None, _MISSING),
        ({}, None, "nested/session"),
        ({}, None, "control\r\nsession"),
    ),
    ids=(
        "wrong-slug",
        "wrong-name",
        "missing-slug",
        "null-ingress-with-entry",
        "path-shaped-ingress",
        "control-ingress",
        "empty-session",
        "missing-session",
        "path-shaped-session",
        "control-session",
    ),
)
def test_malformed_successful_supervisor_metadata_is_retryable_setup_failure(
    addon_overrides: Mapping[str, Any],
    addon_missing: str | None,
    session_value: Any,
) -> None:
    """Successful but contradictory Supervisor metadata fails closed and retries."""

    async def run() -> None:
        websocket = BuilderTransportWebSocket("")
        transport = SupervisorTransport(
            websocket,
            addon_overrides=addon_overrides,
            addon_missing=addon_missing,
            session_value=session_value,
        )
        hass = FakeHass()
        hass.data[DATA_COMPONENT] = HassIO(
            asyncio.get_running_loop(),
            transport,
            "supervisor",  # type: ignore[arg-type]
        )
        entry = FakeEntry(data={})

        with pytest.raises(ConfigEntryNotReady, match="temporarily unavailable"):
            await async_setup_entry(hass, entry)

        assert entry.entry_id not in hass.data[DOMAIN]
        assert "issued-session" not in repr(hass.data.get(DOMAIN, {}))

    asyncio.run(run())


@pytest.mark.parametrize(
    "addon_overrides",
    (
        {"state": "stopped"},
        {
            "ingress": False,
            "ingress_entry": None,
            "ingress_url": None,
            "ingress_port": None,
            "ingress_panel": None,
        },
    ),
)
def test_verified_official_addon_unavailable_state_is_optional_capability(
    addon_overrides: Mapping[str, Any],
) -> None:
    """Only a correctly identified stopped/non-ingress official add-on is absent."""

    async def run() -> None:
        websocket = BuilderTransportWebSocket("")
        transport = SupervisorTransport(websocket, addon_overrides=addon_overrides)
        hass = FakeHass()
        hass.data[DATA_COMPONENT] = HassIO(
            asyncio.get_running_loop(),
            transport,
            "supervisor",  # type: ignore[arg-type]
        )
        entry = FakeEntry(data={})

        assert await async_setup_entry(hass, entry)
        assert hass.data[DOMAIN][entry.entry_id]["device_builder"] is None
        assert [url for _, url, _ in transport.requests] == [
            "http://supervisor/addons/5c53de3b_esphome/info"
        ]
        await async_unload_entry(hass, entry)

    asyncio.run(run())


@pytest.mark.parametrize("cancel_count", (1, 3))
def test_setup_discovery_cancellation_unwinds_started_owners_before_publish(
    monkeypatch: pytest.MonkeyPatch, cancel_count: int
) -> None:
    """Repeated setup cancellation drains discovery then stops the coordinator."""

    async def run() -> None:
        entered = asyncio.Event()
        release = asyncio.Event()
        stopped = 0
        original_stop = ProvisioningCoordinator.async_stop

        async def discover(owner: Any) -> None:
            del owner
            entered.set()
            caller_cancelled = False
            while not release.is_set():
                try:
                    await release.wait()
                except asyncio.CancelledError:
                    caller_cancelled = True
            if caller_cancelled:
                raise asyncio.CancelledError

        async def tracked_stop(owner: ProvisioningCoordinator) -> None:
            nonlocal stopped
            stopped += 1
            await original_stop(owner)

        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.create_device_builder",
            discover,
        )
        monkeypatch.setattr(ProvisioningCoordinator, "async_stop", tracked_stop)
        hass = FakeHass()
        entry = FakeEntry(data={})
        setting_up = asyncio.create_task(async_setup_entry(hass, entry))
        await entered.wait()
        for _ in range(cancel_count):
            setting_up.cancel()
            await asyncio.sleep(0)
        assert not setting_up.done()
        assert entry.entry_id not in hass.data[DOMAIN]
        release.set()
        with pytest.raises(asyncio.CancelledError):
            await setting_up
        assert stopped == 1
        assert entry.entry_id not in hass.data[DOMAIN]

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
        with pytest.raises(WorkflowHandleError, match="already active"):
            await workflow.async_start_session("meter")
        await workflow.async_acknowledge_safety(session.session_id, True)
        with pytest.raises(WorkflowHandleError, match="current target"):
            await workflow.async_check_stability(session.session_id, "current", "0")

        old_plan_id = inventory["plan_id"]
        for _ in range(12):
            latest_inventory = await workflow.async_get_ct_inventory("meter")
        assert len(workflow._plans) == 1
        with pytest.raises(WorkflowHandleError, match="plan is stale"):
            await workflow.async_preview_ct_config("meter", old_plan_id, digest, ())
        assert latest_inventory["plan_id"] in workflow._plans
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


def test_native_only_session_starts_without_yaml_identity(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        workflow, _binding, _sessions = await _native_only_workflow(monkeypatch)

        status = await workflow.async_start_session("meter")

        handle = workflow._sessions[status.session_id]
        assert status.state == "safety_required"
        assert handle.configuration is None
        assert handle.substitutions == {}
        await workflow.async_close()

    asyncio.run(run())


def test_native_only_current_uses_persisted_reporting_multiplier(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        workflow, _binding, _sessions = await _native_only_workflow(monkeypatch)
        status = await workflow.async_start_session("meter")
        await workflow.async_acknowledge_safety(status.session_id, True)
        calls: list[tuple[tuple[Any, ...], dict[str, Any]]] = []

        class Calibration:
            async def async_calibrate_current(
                self, *args: Any, **kwargs: Any
            ) -> Any:
                calls.append((args, kwargs))
                return SimpleNamespace(state="applied_pending_restart_verification")

        workflow._calibration = Calibration()  # type: ignore[assignment]

        await workflow.async_calibrate_current(status.session_id, 1, 5.0, False)

        assert calls[0][0][5] == 2.0
        assert calls[0][1]["substitutions"] == {}
        await workflow.async_close()

    asyncio.run(run())


def test_native_only_voltage_calibration_needs_no_builder_snapshot(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        workflow, _binding, _sessions = await _native_only_workflow(monkeypatch)
        status = await workflow.async_start_session("meter")
        await workflow.async_acknowledge_safety(status.session_id, True)
        calls: list[dict[str, Any]] = []

        class Calibration:
            async def async_calibrate_voltage(
                self, *_args: Any, **kwargs: Any
            ) -> Any:
                calls.append(kwargs)
                return SimpleNamespace(state="applied_pending_restart_verification")

        workflow._calibration = Calibration()  # type: ignore[assignment]

        await workflow.async_calibrate_voltage(
            status.session_id, "main_1", 120.0, False
        )

        assert calls == [{"iteration": 1, "confirm_iteration": False, "substitutions": {}}]
        await workflow.async_close()

    asyncio.run(run())


def test_native_only_restart_verification_persists_without_source_handoff(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        workflow, binding, _sessions = await _native_only_workflow(monkeypatch)
        status = await workflow.async_start_session("meter")
        await workflow.async_acknowledge_safety(status.session_id, True)
        record = SimpleNamespace(
            config_filename=None,
            config_sha256=None,
            source_handoff_available=False,
        )

        class Calibration:
            async def async_verify_after_restart(
                self, *_args: Any, **kwargs: Any
            ) -> Any:
                assert kwargs["substitutions"] == {}
                return SimpleNamespace(record=record, binding=binding)

        workflow._calibration = Calibration()  # type: ignore[assignment]

        result = await workflow.async_restart_and_verify(status.session_id)

        assert result is record
        assert (await workflow.async_get_session(status.session_id)).state == "verified"
        await workflow.async_close()

    asyncio.run(run())


def test_session_preflight_holds_shared_config_ownership(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        entered = asyncio.Event()
        release = asyncio.Event()

        async def blocked_preflight(*_args: Any) -> PreflightResult:
            entered.set()
            await release.wait()
            return PreflightResult(())

        workflow, _binding, sessions = await _native_only_workflow(
            monkeypatch, preflight=blocked_preflight
        )
        starting = asyncio.create_task(workflow.async_start_session("meter"))
        await entered.wait()
        config = asyncio.create_task(sessions.async_acquire_config("aabbccddeeff"))
        await asyncio.sleep(0)

        assert sessions.is_config_locked("aabbccddeeff")
        assert not config.done()

        release.set()
        status = await starting
        lease = await config
        lease.release()
        await workflow.async_cancel_session(status.session_id)
        await workflow.async_close()

    asyncio.run(run())


@pytest.mark.parametrize("cancel_count", (1, 3))
def test_cancel_revokes_session_before_waiting_calibration_can_mutate(
    monkeypatch: pytest.MonkeyPatch,
    cancel_count: int,
) -> None:
    """A task paused before its mutation claim cannot resume after cancellation."""

    async def run() -> None:
        topology = topology_from_native("circuitsetup.6c-energy-meter")
        content = """esphome:\n  project:\n    name: circuitsetup.6c-energy-meter\nsubstitutions:\n  ct1_name: CT 1\n  current_cal_ct1: '27518'\n"""
        digest = sha256(content.encode()).hexdigest()

        class Builder:
            async def async_list_devices(self) -> dict[str, Any]:
                return {
                    "configured": [{"name": "meter", "configuration": "meter.yaml"}]
                }

            async def async_get_config(
                self, configuration: str
            ) -> ESPHomeConfigSnapshot:
                return ESPHomeConfigSnapshot(configuration, content, digest)

            async def async_close(self) -> None:
                return None

        class Api:
            entities: tuple[Any, ...] = ()
            connection_generation = 1

            async def async_connect(self) -> None:
                return None

        device_info = SimpleNamespace(project_name=topology.project_name)
        entry = SimpleNamespace(
            domain="esphome",
            entry_id="meter",
            title="Meter",
            unique_id="aa:bb:cc:dd:ee:ff",
            data={"device_name": "meter"},
            runtime_data=SimpleNamespace(device_info=device_info),
        )
        hass = FakeHass((entry,))
        provisioning = ProvisioningCoordinator(hass)
        await provisioning.async_rescan()
        fake_binding = SimpleNamespace(
            topology=topology,
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
        )
        session = await workflow.async_start_session("meter")
        await workflow.async_acknowledge_safety(session.session_id, True)
        entered = asyncio.Event()
        release = asyncio.Event()
        cleanup_started = asyncio.Event()
        cleanup_release = asyncio.Event()

        async def inventory(handle: Any) -> Any:
            del handle
            entered.set()
            try:
                await release.wait()
            except asyncio.CancelledError:
                cleanup_started.set()
                await cleanup_release.wait()
                raise
            return SimpleNamespace(
                channels=(SimpleNamespace(reporting_multiplier=1.0),)
            )

        mutated: list[dict[str, str]] = []

        class Calibration:
            async def async_calibrate_current(self, *args: Any, **kwargs: Any) -> Any:
                del args
                mutated.append(dict(kwargs["substitutions"]))
                return SimpleNamespace(state="done")

        workflow._inventory_for_handle = inventory  # type: ignore[method-assign]
        workflow._calibration = Calibration()  # type: ignore[assignment]
        task = asyncio.create_task(
            workflow.async_calibrate_current(session.session_id, 1, 5.0, False)
        )
        await entered.wait()
        handle = workflow._sessions[session.session_id]
        cancelling = asyncio.create_task(
            workflow.async_cancel_session(session.session_id)
        )
        await cleanup_started.wait()
        for _ in range(cancel_count):
            cancelling.cancel()
            await asyncio.sleep(0)
        assert handle.substitutions
        assert not cancelling.done()
        cleanup_release.set()
        with pytest.raises(asyncio.CancelledError):
            await cancelling
        with pytest.raises(asyncio.CancelledError):
            await task
        assert handle.state == "cancelled"
        assert handle.substitutions == {}
        assert mutated == []
        await workflow.async_close()

    from custom_components.circuitsetup_energy_meter_helper.topology import (
        topology_from_native,
    )

    asyncio.run(run())


def test_cancel_session_reports_attached_reference_cleanup_failure_after_scrub() -> (
    None
):
    """Expected task cancellation cannot hide zero-reference cleanup failures."""

    async def run() -> None:
        hass = FakeHass()
        workflow = EntryWorkflow(
            hass,
            ProvisioningCoordinator(hass),
            SessionManager(),
            HelperStore(hass),
            None,
            None,
            None,
        )
        active_started = asyncio.Event()

        async def active_operation() -> None:
            active_started.set()
            try:
                await asyncio.Future()
            except asyncio.CancelledError as error:
                error.cleanup_errors = (  # type: ignore[attr-defined]
                    RuntimeError("reference zero failed"),
                )
                raise

        active_task = asyncio.create_task(active_operation())
        await active_started.wait()

        class Handle:
            def __init__(self, task: asyncio.Task[None]) -> None:
                self.session_id = "session"
                self.mac = "aabbccddeeff"
                self.revoked = False
                self.revision = 0
                self.state = "ready"
                self.active_task: asyncio.Task[None] | None = task
                self.expires_at = float("inf")
                self.substitutions = {"secret": "value"}

            def status(self) -> Any:
                return SimpleNamespace(state=self.state)

            def scrub(self) -> None:
                self.substitutions.clear()

        handle = Handle(active_task)
        workflow._sessions[handle.session_id] = handle  # type: ignore[assignment]

        with pytest.raises(
            BaseExceptionGroup, match="calibration session cleanup failed"
        ) as caught:
            await workflow.async_cancel_session(handle.session_id)

        assert any(
            isinstance(error, RuntimeError) and str(error) == "reference zero failed"
            for error in caught.value.exceptions
        )
        assert handle.substitutions == {}
        assert workflow._sessions == {}
        assert workflow._session_cleanup_tasks == {}
        assert workflow._cleaning_macs == set()
        assert active_task.cancelled()
        await workflow.async_close()

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
                "changes": {"key": "current_cal_ct42"},
                "text": "password: wifi-secret",
            }
        )
        connection = FakeConnection()
        await _invoke(hass, connection, _message(f"{DOMAIN}/get_diagnostics_summary"))
        assert connection.results == [
            (
                1,
                {
                    "changes": {},
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


def test_cancelled_compile_reconciles_interruption_then_reraises(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]
        created: list[str] = []
        deleted: list[str] = []
        monkeypatch.setattr(
            repairs.issue_registry,
            "async_create_issue",
            lambda _h, _d, issue_id, **_kwargs: created.append(issue_id),
        )
        monkeypatch.setattr(
            repairs.issue_registry,
            "async_delete_issue",
            lambda _h, _d, issue_id: deleted.append(issue_id),
        )

        async def cancelled(*_args: Any) -> Any:
            raise asyncio.CancelledError

        controller.async_call = cancelled  # type: ignore[method-assign]
        connection = FakeConnection()

        with pytest.raises(asyncio.CancelledError):
            await _invoke(
                hass,
                connection,
                _message(f"{DOMAIN}/compile_ct_config"),
            )

        assert created == ["compile_install_interrupted_helper"]
        assert deleted == []
        assert tuple(controller.diagnostics.errors)[-1] == "cancelled"

    asyncio.run(run())


def test_setup_uses_the_home_assistant_diagnostics_snapshot_for_the_panel() -> None:
    """The Task 19 command and HA diagnostics share one allowlisted provider."""

    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        connection = FakeConnection()

        await _invoke(hass, connection, _message(f"{DOMAIN}/get_diagnostics_summary"))

        assert connection.results[-1] == (
            1,
            {
                "integration_version": "0.1.0",
                "home_assistant_version": HA_VERSION,
                "config_entry_version": 1,
                "setup_state": "no_device",
                "meter_count": 0,
                "meters": [],
                "topology": None,
                "entity_role_counts": {},
                "ct_models": [],
                "ct_presets": [],
                "last_transaction": None,
                "last_session": None,
                "error_codes": [],
            },
        )

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


def test_failed_snapshot_disables_callback_and_retains_throwing_unsubscribe() -> None:
    """Snapshot failure deactivates first and leaves teardown retry ownership."""

    async def run() -> None:
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]
        callback: Any = None
        unsubscribe_calls = 0

        async def snapshot(*args: Any) -> Any:
            del args
            raise RuntimeError("snapshot failed")

        def subscribe(*args: Any) -> Any:
            nonlocal callback
            callback = args[-1]

            def unsubscribe() -> None:
                nonlocal unsubscribe_calls
                unsubscribe_calls += 1
                raise RuntimeError("transport cleanup failed")

            return unsubscribe

        controller.async_snapshot = snapshot  # type: ignore[method-assign]
        controller.provisioning.subscribe = subscribe  # type: ignore[method-assign]
        connection = FakeConnection()
        await _invoke(hass, connection, _message(f"{DOMAIN}/subscribe_setup"))
        callback({"seq": 1})

        router = hass.data[DOMAIN]["_websocket_router"]
        assert connection.events == []
        assert router.subscriptions["helper"]
        assert controller._subscriptions
        assert unsubscribe_calls == 1
        with pytest.raises(BaseExceptionGroup):
            router.remove("helper")
        assert unsubscribe_calls == 2

    asyncio.run(run())


@pytest.mark.parametrize("cancel_count", (1, 3))
def test_lazy_builder_reconnects_after_remote_drop_and_close_is_shielded(
    cancel_count: int,
) -> None:
    """The client websocket is authoritative and disconnect settles before cancel."""

    async def run() -> None:
        connected = 0
        close_started = asyncio.Event()
        close_release = asyncio.Event()

        class Client:
            _ws: object | None = None

            @property
            def connected(self) -> bool:
                return self._ws is not None

            async def async_connect(self) -> None:
                nonlocal connected
                connected += 1
                self._ws = object()

            async def async_list_devices(self) -> dict[str, Any]:
                if self._ws is None:
                    raise ConnectionError("dropped")
                return {}

            async def async_disconnect(self) -> None:
                close_started.set()
                await close_release.wait()
                self._ws = None

        client = Client()
        lazy = LazyDeviceBuilder(client)  # type: ignore[arg-type]
        assert await lazy.async_list_devices() == {}
        client._ws = None
        assert await lazy.async_list_devices() == {}
        assert connected == 2

        closing = asyncio.create_task(lazy.async_close())
        await close_started.wait()
        for _ in range(cancel_count):
            closing.cancel()
            await asyncio.sleep(0)
        assert not closing.done()
        close_release.set()
        with pytest.raises(asyncio.CancelledError):
            await closing
        assert client._ws is None

    asyncio.run(run())


@pytest.mark.parametrize("cancel_count", (1, 3))
def test_workflow_close_retains_owner_until_builder_cleanup_settles(
    cancel_count: int,
) -> None:
    """Workflow terminal state follows actual builder cleanup, even if cancelled."""

    async def run() -> None:
        started = asyncio.Event()
        release = asyncio.Event()
        closed = 0

        class Builder:
            async def async_close(self) -> None:
                nonlocal closed
                started.set()
                await release.wait()
                closed += 1

        hass = FakeHass()
        workflow = EntryWorkflow(
            hass,
            ProvisioningCoordinator(hass),
            SessionManager(),
            HelperStore(hass),
            None,
            None,
            Builder(),  # type: ignore[arg-type]
        )
        closing = asyncio.create_task(workflow.async_close())
        await started.wait()
        for _ in range(cancel_count):
            closing.cancel()
            await asyncio.sleep(0)
        assert not workflow._closed
        assert workflow._builder is not None
        assert not closing.done()
        release.set()
        with pytest.raises(asyncio.CancelledError):
            await closing
        assert workflow._closed
        assert workflow._builder is None
        assert closed == 1
        await workflow.async_close()

    asyncio.run(run())


@pytest.mark.parametrize("cancel_count", (1, 3))
def test_controller_close_retains_workflow_until_owned_cleanup_settles(
    cancel_count: int,
) -> None:
    """Repeated caller cancellation cannot detach a still-cleaning workflow."""

    async def run() -> None:
        started = asyncio.Event()
        release = asyncio.Event()

        class Workflow:
            closed = False

            async def async_close(self) -> None:
                started.set()
                await release.wait()
                self.closed = True

        hass = FakeHass()
        sessions = SessionManager()
        controller = EntryWebsocketController(
            ProvisioningCoordinator(hass), sessions, HelperStore(hass)
        )
        workflow = Workflow()
        controller.workflow = workflow  # type: ignore[assignment]
        closing = asyncio.create_task(controller.async_close())
        await started.wait()
        for _ in range(cancel_count):
            closing.cancel()
            await asyncio.sleep(0)
        assert controller.workflow is workflow
        assert not controller._closed
        assert not closing.done()
        release.set()
        with pytest.raises(asyncio.CancelledError):
            await closing
        assert workflow.closed
        assert controller.workflow is None
        assert controller._closed
        await controller.async_close()

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
        cleanup_calls = 0

        def broken_unsubscribe() -> None:
            nonlocal cleanup_calls
            cleanup_calls += 1
            raise RuntimeError("provider cleanup failed")

        controller._subscriptions.add(broken_unsubscribe)
        with pytest.raises(BaseExceptionGroup):
            await controller.async_close()

        assert controller._subscriptions == {broken_unsubscribe}
        assert controller.workflow is workflow
        assert workflow.closed
        assert controller.sessions._closed
        with pytest.raises(BaseExceptionGroup):
            await controller.async_close()
        assert cleanup_calls == 2

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
        original_close = controller.async_close
        original_stop = provisioning.async_stop
        calls: list[str] = []

        def unregister(*args: Any) -> None:
            del args
            calls.append("router")
            if calls.count("router") == 1:
                raise RuntimeError("router cleanup failed")

        async def close() -> None:
            calls.append("controller")
            if calls.count("controller") == 1:
                await controller.sessions.async_unload()
                raise RuntimeError("controller cleanup failed")
            await original_close()

        async def stop() -> None:
            calls.append("provisioning")
            if calls.count("provisioning") == 1:
                raise RuntimeError("provisioning cleanup failed")
            await original_stop()

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
        assert hass.data[DOMAIN]["helper"] is runtime
        assert await async_unload_entry(hass, entry)
        assert runtime == {}
        assert "helper" not in hass.data[DOMAIN]
        assert calls == [
            "router",
            "controller",
            "provisioning",
            "router",
            "controller",
            "provisioning",
        ]

    asyncio.run(run())


@pytest.mark.parametrize("cancel_count", (1, 3))
def test_integration_unload_retains_runtime_until_owned_cleanup_settles(
    cancel_count: int,
) -> None:
    """Repeated unload cancellation cannot discard a still-live controller owner."""

    async def run() -> None:
        hass = FakeHass()
        entry = FakeEntry(data={})
        await async_setup_entry(hass, entry)
        runtime = hass.data[DOMAIN][entry.entry_id]
        controller = runtime["websocket_controller"]
        original_close = controller.async_close
        started = asyncio.Event()
        release = asyncio.Event()

        async def gated_close() -> None:
            started.set()
            await release.wait()
            await original_close()

        controller.async_close = gated_close  # type: ignore[method-assign]
        unloading = asyncio.create_task(async_unload_entry(hass, entry))
        await started.wait()
        for _ in range(cancel_count):
            unloading.cancel()
            await asyncio.sleep(0)
        assert hass.data[DOMAIN][entry.entry_id] is runtime
        assert not unloading.done()
        release.set()
        with pytest.raises(asyncio.CancelledError):
            await unloading
        assert entry.entry_id not in hass.data[DOMAIN]
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


def test_recursive_sanitizer_preserves_required_raw_gain_only() -> None:
    """CT inventory gain survives while raw diagnostic fields remain private."""

    assert sanitize_payload(
        {
            "raw_gain_ct": 27518,
            "raw_gain_ct_secret": "secret",
            "raw_gain_ct_debug": "secret",
            "raw": "secret",
            "raw_log": "secret",
            "raw_logs": ["secret"],
        }
    ) == {"raw_gain_ct": 27518}


def test_recursive_sanitizer_preserves_only_approved_change_keys_in_context() -> None:
    """The exact transaction DTO keeps substitution identity without exposing keys."""

    contract = json.loads(
        (
            Path(__file__).with_name("fixtures") / "task20_sanitized_change.json"
        ).read_text(encoding="utf-8")
    )
    generic = sanitize_payload(contract["raw"])
    assert generic["changes"] == [{"old_value": "27518", "new_value": "5500"}]
    assert (
        sanitize_payload(contract["raw"], allow_transaction_change_keys=True)
        == contract["sanitized"]
    )
    assert sanitize_payload(
        {"changes": {"key": "current_cal_ct42"}},
        allow_transaction_change_keys=True,
    ) == {"changes": {}}
    assert sanitize_payload(
        {"changes": [[{"key": "current_cal_ct42", "new_value": "x"}]]},
        allow_transaction_change_keys=True,
    ) == {"changes": [[{"new_value": "x"}]]}
    assert sanitize_payload(
        {"changes": [{"nested": {"key": "current_cal_ct42"}}]},
        allow_transaction_change_keys=True,
    ) == {"changes": [{"nested": {}}]}
    assert sanitize_payload(
        {"changes": [{"key": "logger", "new_value": "x"}]},
        allow_transaction_change_keys=True,
    ) == {"changes": [{"new_value": "x"}]}


def test_router_scopes_change_keys_to_transaction_results_and_events() -> None:
    """Only transaction commands expose direct approved substitution keys."""

    async def run() -> None:
        contract = json.loads(
            (
                Path(__file__).with_name("fixtures") / "task20_sanitized_change.json"
            ).read_text(encoding="utf-8")
        )
        hass = FakeHass()
        await async_setup_entry(hass, FakeEntry(data={}))
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]

        async def call(*args: Any) -> Any:
            del args
            return contract["raw"]

        async def snapshot(*args: Any) -> Any:
            del args
            return contract["raw"]

        def subscribe(*args: Any) -> Any:
            args[-1](contract["raw"])
            return lambda: None

        controller.async_call = call  # type: ignore[method-assign]
        controller.async_snapshot = snapshot  # type: ignore[method-assign]
        controller.subscribe = subscribe  # type: ignore[method-assign]
        connection = FakeConnection()

        await _invoke(
            hass,
            connection,
            _message(f"{DOMAIN}/get_diagnostics_summary", 1),
        )
        assert "key" not in connection.results[-1][1]["changes"][0]
        await _invoke(hass, connection, _message(f"{DOMAIN}/preview_ct_config", 2))
        assert connection.results[-1][1] == contract["sanitized"]

        await _invoke(hass, connection, _message(f"{DOMAIN}/subscribe_setup", 3))
        setup_events = [event for event_id, event in connection.events if event_id == 3]
        assert len(setup_events) == 2
        assert all("key" not in event["changes"][0] for event in setup_events)
        await _invoke(
            hass,
            connection,
            _message(f"{DOMAIN}/subscribe_config_transaction", 4),
        )
        transaction_events = [
            event for event_id, event in connection.events if event_id == 4
        ]
        assert len(transaction_events) == 2
        assert all(
            event["changes"][0]["key"] == "current_cal_ct42"
            for event in transaction_events
        )

    asyncio.run(run())
