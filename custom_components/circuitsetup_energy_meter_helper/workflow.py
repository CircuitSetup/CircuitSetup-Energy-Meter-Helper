"""Production websocket workflow adapter over the existing backend owners."""

from __future__ import annotations

import asyncio
import re
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from http.cookies import SimpleCookie
from statistics import pstdev
from threading import RLock
from time import monotonic
from typing import Any
from uuid import uuid4

from aioesphomeapi.model import build_device_unique_id
from aiohasupervisor import SupervisorNotFoundError, SupervisorResponseError
from aiohasupervisor.models import AddonState as SupervisorAddonState
from aiohttp import hdrs
from homeassistant.components.hassio import HassIO, get_supervisor_client
from homeassistant.components.hassio.const import (
    DATA_COMPONENT,
    X_HASS_SOURCE,
    X_INGRESS_PATH,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from .calibration_engine import CalibrationEngine
from .config_document import ESPHomeConfigDocument
from .config_mutator import CTChangeRequest, build_ct_mutation
from .config_transaction import ConfigTransactionManager, ReconnectEvidence
from .ct_catalog import CTPresetCatalog
from .ct_inventory import CTInventory
from .device_builder import (
    DeviceBuilderClient,
    ESPHomeConfigSnapshot,
    _wait_for_owned_cleanup,
)
from .entity_binding import MeterBinding, bind_meter
from .entity_catalog import EntityCatalog
from .esphome_api import ESPHomeApiSession
from .models import MeterTopology, StoredCTSelection, canonical_mac
from .preflight import PreflightResult, async_preflight
from .provisioning import DiscoveredDevice, ProvisioningCoordinator
from .session_manager import CalibrationBusyError, SessionManager
from .state_tracker import SensorSampleWindow
from .store import HelperStore
from .topology import topology_from_config, topology_from_native

DEFAULT_HANDLE_TTL = 15 * 60.0
MAX_HANDLE_TTL = 60 * 60.0
MAX_PLAN_HANDLES = 8
ESPHOME_DEVICE_BUILDER_SLUG = "5c53de3b_esphome"
_INGRESS_ENTRY_PREFIX = "/api/hassio_ingress/"
_INGRESS_SESSION_COOKIE = "ingress_session"
_SUPERVISOR_TOKEN = re.compile(r"[A-Za-z0-9_-]{1,256}\Z", re.ASCII)


def _public_sample_window(window: SensorSampleWindow) -> dict[str, Any]:
    """Expose only bounded measurement evidence needed by the browser."""
    return {
        "samples": window.values,
        "mean": window.mean,
        "standard_deviation": pstdev(window.values),
        "range_percent": window.range_percent,
    }


class WorkflowCapabilityUnavailable(RuntimeError):
    """A required external runtime owner is genuinely absent."""


class WorkflowHandleError(KeyError):
    """A server-issued plan or session handle is stale, foreign, or expired."""


@dataclass(slots=True)
class _PlanHandle:
    plan_id: str
    device_id: str
    mac: str
    topology: MeterTopology
    snapshot: ESPHomeConfigSnapshot
    inventory: CTInventory
    expires_at: float

    def scrub(self) -> None:
        self.snapshot = ESPHomeConfigSnapshot("expired.yaml", "", "0" * 64)


@dataclass(frozen=True, slots=True)
class SessionStatus:
    session_id: str
    device_id: str
    state: str
    safety_acknowledged: bool
    preflight: PreflightResult


@dataclass(slots=True)
class _SessionHandle:
    session_id: str
    device_id: str
    mac: str
    topology: MeterTopology
    configuration: str
    substitutions: dict[str, str]
    binding: MeterBinding
    preflight: PreflightResult
    expires_at: float
    safety_acknowledged: bool = False
    state: str = "safety_required"
    revision: int = 0
    active_task: asyncio.Task[Any] | None = None
    revoked: bool = False

    def status(self) -> SessionStatus:
        return SessionStatus(
            self.session_id,
            self.device_id,
            self.state,
            self.safety_acknowledged,
            self.preflight,
        )

    def scrub(self) -> None:
        self.substitutions.clear()


class LazyDeviceBuilder:
    """Connect the existing pinned client only when a Device Builder call is made."""

    def __init__(self, client: DeviceBuilderClient) -> None:
        self._client = client
        self._lock = asyncio.Lock()
        self._close_task: asyncio.Task[None] | None = None
        self._closed = False
        self._closing = False

    async def _ready(self) -> DeviceBuilderClient:
        if self._closed or self._closing:
            raise WorkflowCapabilityUnavailable("Device Builder is closing")
        if not self._client.connected:
            async with self._lock:
                if not self._client.connected:
                    try:
                        await self._client.async_connect()
                    except BaseException as error:
                        try:
                            await self._client.async_disconnect()
                        except BaseException as cleanup_error:  # noqa: BLE001
                            error.add_note(
                                "Device Builder connect cleanup failed with "
                                f"{type(cleanup_error).__name__}"
                            )
                        raise
        return self._client

    async def async_list_devices(self) -> dict[str, Any]:
        return await (await self._ready()).async_list_devices()

    async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
        return await (await self._ready()).async_get_config(configuration)

    async def async_update_config(
        self, snapshot: ESPHomeConfigSnapshot, proposed_content: str
    ) -> None:
        await (await self._ready()).async_update_config(snapshot, proposed_content)

    async def async_import_device(self, import_data: dict[str, Any]) -> str:
        return await (await self._ready()).async_import_device(import_data)

    async def async_validate(self, configuration: str) -> Any:
        return await (await self._ready()).async_validate(configuration)

    async def async_compile(self, configuration: str) -> Any:
        return await (await self._ready()).async_compile(configuration)

    async def async_upload(
        self, configuration: str, progress: Callable[[Any], None] | None = None
    ) -> Any:
        return await (await self._ready()).async_upload(configuration, progress)

    async def async_restore_content(
        self,
        configuration: str,
        content: str,
        expected_current_sha256: str | None = None,
    ) -> None:
        await (await self._ready()).async_restore_content(
            configuration,
            content,
            expected_current_sha256=expected_current_sha256,
        )

    async def async_close(self) -> None:
        if self._closed:
            return
        task = self._close_task
        if task is None or (
            task.done() and (task.cancelled() or task.exception() is not None)
        ):
            if task is not None and task.done() and not task.cancelled():
                task.exception()
            self._closing = True
            task = self._close_task = asyncio.create_task(self._async_close_owned())
        caller_cancelled = await _wait_for_owned_cleanup(task)
        if caller_cancelled:
            raise asyncio.CancelledError

    async def _async_close_owned(self) -> None:
        async with self._lock:
            await self._client.async_disconnect()
            self._closed = True


class EntryWorkflow:
    """Own expiring browser handles while delegating all backend state changes."""

    def __init__(
        self,
        hass: HomeAssistant,
        provisioning: ProvisioningCoordinator,
        sessions: SessionManager,
        store: HelperStore,
        esphome_entry_id: str | None,
        api_session: ESPHomeApiSession | None,
        device_builder: LazyDeviceBuilder | None,
        *,
        handle_ttl: float = DEFAULT_HANDLE_TTL,
        clock: Callable[[], float] = monotonic,
    ) -> None:
        if not 1.0 <= handle_ttl <= MAX_HANDLE_TTL:
            raise ValueError("handle TTL must be between 1 and 3600 seconds")
        self._hass = hass
        self._provisioning = provisioning
        self._sessions_owner = sessions
        self._store = store
        self._esphome_entry_id = esphome_entry_id
        self._api = api_session
        self._builder = device_builder
        self._ttl = handle_ttl
        self._clock = clock
        self._plans: dict[str, _PlanHandle] = {}
        self._sessions: dict[str, _SessionHandle] = {}
        self._session_guards: dict[str, RLock] = {}
        self._subscribers: dict[str, set[Callable[[SessionStatus], None]]] = {}
        self._session_cleanup_tasks: dict[str, asyncio.Task[None]] = {}
        self._cleaning_macs: set[str] = set()
        self._close_task: asyncio.Task[None] | None = None
        self._closing = False
        self.transactions: ConfigTransactionManager | None = None
        self._closed = False
        self._calibration = CalibrationEngine(
            sessions,
            store.async_save_interrupted_session,
            persist_verified=store.async_save_verified_calibration,
            calibration_snapshot_reader=self._async_calibration_snapshot,
        )

    async def async_get_topology(self, device_id: str) -> MeterTopology:
        device = self._device(device_id)
        try:
            snapshot = await self._async_snapshot(device)
        except WorkflowCapabilityUnavailable:
            return topology_from_native(device.project_name)
        return topology_from_config(
            ESPHomeConfigDocument.parse(snapshot.content),
            native_project_name=device.project_name,
        )

    def transaction_device_identity(self, device_id: str) -> str:
        """Translate the browser's owned ESPHome entry handle to canonical MAC."""
        self._device(device_id)
        return self._mac(device_id)

    async def async_get_ct_inventory(self, device_id: str) -> dict[str, Any]:
        device = self._device(device_id)
        mac = self._mac(device_id)
        snapshot = await self._async_snapshot(device)
        document = ESPHomeConfigDocument.parse(snapshot.content)
        topology = topology_from_config(
            document, native_project_name=device.project_name
        )
        inventory = CTInventory.from_document(
            document, topology, CTPresetCatalog.load(), snapshot.sha256
        )
        plan_id = uuid4().hex
        self._discard_device_plans(mac)
        while len(self._plans) >= MAX_PLAN_HANDLES:
            oldest = next(iter(self._plans))
            evicted = self._plans.pop(oldest)
            evicted.scrub()
        self._plans[plan_id] = _PlanHandle(
            plan_id,
            device_id,
            mac,
            topology,
            snapshot,
            inventory,
            self._deadline(),
        )
        self._prune_plans()
        return {
            "plan_id": plan_id,
            "source_sha256": snapshot.sha256,
            "channels": inventory.channels,
            "catalog": inventory.catalog,
        }

    async def async_get_session(self, session_id: str) -> SessionStatus:
        return self._session(session_id).status()

    async def async_adopt_device(self, device_id: str) -> dict[str, str]:
        device = self._device(device_id)
        builder = self._require_builder()
        entry = self._entry(device_id)
        info = getattr(getattr(entry, "runtime_data", None), "device_info", None)
        package_url = getattr(info, "package_import_url", None)
        name = getattr(entry, "data", {}).get("device_name")
        if not isinstance(package_url, str) or not isinstance(name, str):
            raise WorkflowCapabilityUnavailable("adoption metadata is unavailable")
        configuration = await builder.async_import_device(
            {
                "name": name,
                "friendly_name": device.title,
                "package_import_url": package_url,
            }
        )
        return {"device_id": device_id, "configuration": configuration}

    async def async_preview_ct_config(
        self,
        device_id: str,
        plan_id: str,
        source_sha256: str,
        changes: tuple[Mapping[str, Any], ...],
    ) -> Any:
        plan = self._plan(plan_id, device_id, source_sha256)
        manager = self.transactions
        if manager is None:
            raise WorkflowCapabilityUnavailable("configuration writes are unavailable")
        requests = tuple(
            CTChangeRequest(
                channel=int(change["channel"]),
                name=str(change["name"]),
                model_id=str(change["model_id"]),
                reporting_multiplier=float(change.get("reporting_multiplier", 1.0)),
                custom_gain_ct=(
                    int(change["custom_gain_ct"])
                    if "custom_gain_ct" in change
                    else None
                ),
                custom_label=(
                    str(change["custom_label"]) if "custom_label" in change else None
                ),
                burden_output_acknowledged=bool(
                    change.get("burden_output_acknowledged", False)
                ),
            )
            for change in changes
        )
        mutation = build_ct_mutation(plan.snapshot, plan.topology, requests)
        updated_inventory = CTInventory.from_document(
            ESPHomeConfigDocument.parse(mutation.proposed_content),
            plan.topology,
            plan.inventory.catalog,
            plan.snapshot.sha256,
            reporting_multipliers={
                request.channel: request.reporting_multiplier for request in requests
            },
        )
        by_channel = {item.channel: item for item in updated_inventory.channels}
        selections = tuple(
            StoredCTSelection(
                request.channel,
                request.model_id,
                request.custom_label,
                by_channel[request.channel].raw_gain_ct,
                request.reporting_multiplier,
                plan.snapshot.sha256,
            )
            for request in requests
        )
        status = await manager.async_preview(
            plan.mac, plan.topology, mutation, plan.snapshot, selections
        )
        self._plans.pop(plan_id, None)
        plan.scrub()
        return status

    async def async_set_ha_labels(
        self, device_id: str, plan_id: str, source_sha256: str, changes: tuple[Mapping[str, Any], ...]
    ) -> dict[str, Any]:
        """Persist display names only; this path never opens a transaction."""
        plan = self._plan(plan_id, device_id, source_sha256)
        api = self._require_api()
        await api.async_connect()
        document = ESPHomeConfigDocument.parse(plan.snapshot.content)
        binding = bind_meter(EntityCatalog(api.entities, api.connection_generation), plan.topology,
            {key: scalar.value for key, scalar in document.substitutions.items()})
        requested: dict[int, str] = {}
        for change in changes:
            channel, name = change.get("channel"), change.get("name")
            label = name.strip() if isinstance(name, str) else ""
            if not isinstance(channel, int) or not label or len(label) > 64 or "\n" in label or "\r" in label or channel in requested:
                raise WorkflowHandleError("label changes are malformed")
            requested[channel] = label
        channels = {item.channel: item for item in binding.channels}
        if not requested.keys() <= channels.keys() or not requested.keys() <= {item.channel for item in plan.inventory.channels}:
            raise WorkflowHandleError("channel is not owned by this inventory")
        registry = er.async_get(self._hass)
        targets: list[tuple[int, str, str, Any]] = []
        if len(set(requested.values())) != len(requested):
            raise WorkflowHandleError("label conflicts with another meter entity")
        registry_entries = tuple(registry.entities.values())
        for channel, label in requested.items():
            descriptor = channels[channel].current_sensor.descriptor
            unique_id = build_device_unique_id(plan.mac, descriptor.info)
            entity_id = registry.async_get_entity_id("sensor", "esphome", unique_id)
            if entity_id is None:
                raise WorkflowHandleError("bound entity is not owned by this device")
            entry = registry.async_get(entity_id)
            if entry is None or getattr(entry, "config_entry_id", None) != device_id:
                raise WorkflowHandleError("bound entity is not owned by this device")
            if any(
                item.entity_id != entity_id
                and getattr(item, "config_entry_id", None) == device_id
                and getattr(item, "name", None) == label
                for item in registry_entries
            ):
                raise WorkflowHandleError("label conflicts with another meter entity")
            targets.append((channel, label, entity_id, entry))
        results: list[dict[str, Any]] = []
        for channel, label, entity_id, entry in targets:
            previous = getattr(entry, "name", None)
            if previous != label:
                registry.async_update_entity(entity_id, name=label)
            results.append({"channel": channel, "state": "unchanged" if previous == label else "updated"})
        return {"mode": "home_assistant_labels", "results": results}

    async def async_start_session(self, device_id: str) -> SessionStatus:
        device = self._device(device_id)
        api = self._require_api()
        await api.async_connect()
        snapshot = await self._async_snapshot(device)
        document = ESPHomeConfigDocument.parse(snapshot.content)
        topology = topology_from_config(
            document, native_project_name=device.project_name
        )
        substitutions = {
            key: scalar.value for key, scalar in document.substitutions.items()
        }
        binding = bind_meter(
            EntityCatalog(api.entities, api.connection_generation),
            topology,
            substitutions,
        )
        mac = self._mac(device_id)
        locks = self._sessions_owner._locks(mac)
        preflight = await async_preflight(api, binding, locks.calibration)
        session_id = uuid4().hex
        handle = _SessionHandle(
            session_id,
            device_id,
            mac,
            topology,
            snapshot.configuration,
            substitutions,
            binding,
            preflight,
            self._deadline(),
            state="safety_required" if preflight.ok else "preflight_failed",
        )
        with self._guard(mac):
            self._prune_device_sessions_locked(mac)
            if mac in self._cleaning_macs or any(
                item.mac == mac for item in self._sessions.values()
            ):
                handle.scrub()
                raise WorkflowHandleError(
                    "a calibration session is already active for this device"
                )
            self._sessions[session_id] = handle
        return handle.status()

    async def async_acknowledge_safety(
        self, session_id: str, acknowledged: bool
    ) -> SessionStatus:
        handle = self._session(session_id)
        with self._guard(handle.mac):
            handle = self._session_locked(session_id)
            if not handle.preflight.ok or not acknowledged:
                raise WorkflowHandleError(
                    "session is not ready for safety confirmation"
                )
            handle.safety_acknowledged = True
            handle.state = "ready"
            self._refresh(handle)
            return self._publish(handle)

    async def async_check_stability(
        self, session_id: str, target: str, target_id: str
    ) -> dict[str, Any]:
        handle, revision = self._claim_ready_session(session_id)
        api = self._require_api()
        try:
            entities: tuple[Any, ...]
            if target == "voltage":
                group = next(
                    (item for item in handle.binding.groups if item.key == target_id),
                    None,
                )
                if group is None:
                    raise WorkflowHandleError("unknown voltage target")
                entities = group.voltage_sensors
            else:
                try:
                    channel = int(target_id)
                except ValueError:
                    raise WorkflowHandleError("unknown current target") from None
                if not 1 <= channel <= handle.topology.ct_count:
                    raise WorkflowHandleError("unknown current target")
                try:
                    entities = (handle.binding.channels[channel - 1].current_sensor,)
                except IndexError:
                    raise WorkflowHandleError("unknown current target") from None
            windows = tuple(
                [
                    await api.async_wait_for_sensor_window(
                        entity.descriptor.key,
                        device_id=entity.descriptor.device_id,
                        sample_count=3,
                    )
                    for entity in entities
                ]
            )
            stable = all(window.range_percent <= 1.0 for window in windows)
            self._assert_claim(handle, revision)
            handle.state = "stable" if stable else "unstable"
            self._refresh(handle)
            self._publish(handle)
            return {
                "target": target,
                "target_id": target_id,
                "stable": stable,
                "windows": tuple(_public_sample_window(window) for window in windows),
            }
        finally:
            self._release_claim(handle, revision)

    async def async_calibrate_voltage(
        self,
        session_id: str,
        group_key: str,
        reference: float,
        confirm_iteration: bool,
    ) -> Any:
        handle, revision = self._claim_ready_session(session_id)
        try:
            iteration = self._sessions_owner.next_calibration_iteration(
                handle.mac, f"voltage:{group_key}"
            )
            self._assert_claim(handle, revision)
            result = await self._calibration.async_calibrate_voltage(
                handle.mac,
                self._require_api(),
                handle.binding,
                group_key,
                reference,
                1.0,
                iteration=iteration,
                confirm_iteration=confirm_iteration,
                substitutions=handle.substitutions,
            )
            self._assert_claim(handle, revision)
            handle.state = str(result.state)
            self._refresh(handle)
            self._publish(handle)
            return result
        finally:
            self._release_claim(handle, revision)

    async def async_calibrate_current(
        self,
        session_id: str,
        channel: int,
        reference: float,
        confirm_iteration: bool,
    ) -> Any:
        handle, revision = self._claim_ready_session(session_id)
        try:
            inventory = await self._inventory_for_handle(handle)
            if not 1 <= channel <= handle.topology.ct_count:
                raise WorkflowHandleError("unknown current channel")
            multiplier = inventory.channels[channel - 1].reporting_multiplier
            iteration = self._sessions_owner.next_calibration_iteration(
                handle.mac, f"current:{channel}"
            )
            self._assert_claim(handle, revision)
            result = await self._calibration.async_calibrate_current(
                handle.mac,
                self._require_api(),
                handle.binding,
                channel,
                reference,
                multiplier,
                1.0,
                iteration=iteration,
                confirm_iteration=confirm_iteration,
                substitutions=handle.substitutions,
            )
            self._assert_claim(handle, revision)
            handle.state = str(result.state)
            self._refresh(handle)
            self._publish(handle)
            return result
        finally:
            self._release_claim(handle, revision)

    async def async_restart_and_verify(self, session_id: str) -> Any:
        handle, revision = self._claim_ready_session(session_id)
        try:
            self._assert_claim(handle, revision)
            result = await self._calibration.async_verify_after_restart(
                handle.mac,
                self._require_api(),
                handle.binding,
                substitutions=handle.substitutions,
            )
            self._assert_claim(handle, revision)
            handle.binding = result.binding
            handle.state = "verified"
            self._refresh(handle)
            self._publish(handle)
            return result.record
        finally:
            self._release_claim(handle, revision)

    async def async_cancel_session(self, session_id: str) -> SessionStatus:
        handle = self._session(session_id)
        with self._guard(handle.mac):
            handle = self._session_locked(session_id)
            active_task = handle.active_task
            cleanup_task = self._start_session_cleanup(handle, active_task)
            handle.revoked = True
            handle.revision += 1
            handle.state = "cancelled"
            status = self._publish(handle)
            self._sessions.pop(session_id, None)
            self._subscribers.pop(session_id, None)
        try:
            caller_cancelled = await _wait_for_owned_cleanup(cleanup_task)
        finally:
            if cleanup_task.done():
                self._session_cleanup_tasks.pop(session_id, None)
        if caller_cancelled:
            raise asyncio.CancelledError
        return status

    def subscribe_session(
        self, session_id: str, callback: Callable[[SessionStatus], None]
    ) -> Callable[[], None]:
        self._session(session_id)
        subscribers = self._subscribers.setdefault(session_id, set())
        subscribers.add(callback)

        def unsubscribe() -> None:
            subscribers.discard(callback)
            if not subscribers:
                self._subscribers.pop(session_id, None)

        return unsubscribe

    async def async_verify(self, mac: str) -> ReconnectEvidence:
        api = self._require_api()
        await api.async_reconnect()
        handle = next(
            (
                item
                for item in self._sessions.values()
                if item.mac == canonical_mac(mac)
            ),
            None,
        )
        if handle is None:
            device_id = self._esphome_entry_id
            if device_id is None:
                raise WorkflowCapabilityUnavailable("device identity is unavailable")
            device = self._device(device_id)
            topology = await self.async_get_topology(device_id)
            snapshot = await self._async_snapshot(device)
            document = ESPHomeConfigDocument.parse(snapshot.content)
            substitutions = {
                key: scalar.value for key, scalar in document.substitutions.items()
            }
            binding = bind_meter(
                EntityCatalog(api.entities, api.connection_generation),
                topology,
                substitutions,
            )
        else:
            topology = handle.topology
            binding = handle.binding.rebind(
                EntityCatalog(api.entities, api.connection_generation),
                handle.substitutions,
            )
        return ReconnectEvidence(
            canonical_mac(mac),
            topology,
            {
                channel.channel: channel.current_sensor.descriptor.name
                for channel in binding.channels
            },
            len(binding.channels),
        )

    async def async_close(self) -> None:
        if self._closed:
            return
        task = self._close_task
        if task is None or (
            task.done() and (task.cancelled() or task.exception() is not None)
        ):
            if task is not None and task.done() and not task.cancelled():
                task.exception()
            self._closing = True
            task = self._close_task = asyncio.create_task(self._async_close_owned())
        caller_cancelled = await _wait_for_owned_cleanup(task)
        if caller_cancelled:
            raise asyncio.CancelledError

    async def _async_close_owned(self) -> None:
        errors: list[BaseException] = []
        plans = tuple(self._plans.values())
        sessions = tuple(self._sessions.values())
        cleanup_tasks = set(self._session_cleanup_tasks.values())
        for session in sessions:
            with self._guard(session.mac):
                session.revoked = True
                session.revision += 1
                active_task = session.active_task
                cleanup_tasks.add(self._start_session_cleanup(session, active_task))
        if cleanup_tasks:
            results = await asyncio.gather(*cleanup_tasks, return_exceptions=True)
            errors.extend(
                result
                for result in results
                if isinstance(result, BaseException)
                and not isinstance(result, asyncio.CancelledError)
            )
        self._plans.clear()
        self._sessions.clear()
        self._subscribers.clear()
        self._session_cleanup_tasks.clear()
        self._cleaning_macs.clear()
        builder = self._builder
        for plan in plans:
            try:
                plan.scrub()
            except BaseException as error:  # noqa: BLE001 - scrub every handle
                errors.append(error)
        if builder is not None:
            try:
                await builder.async_close()
            except BaseException as error:  # noqa: BLE001 - report after local scrub
                errors.append(error)
            else:
                self._builder = None
        if errors:
            raise BaseExceptionGroup("workflow cleanup failed", errors)
        self.transactions = None
        self._api = None
        self._session_guards.clear()
        self._closed = True
        self._closing = False

    async def _async_calibration_snapshot(
        self, mac: str, topology: MeterTopology
    ) -> ESPHomeConfigSnapshot:
        handle = next(
            (
                item
                for item in self._sessions.values()
                if item.mac == canonical_mac(mac) and item.topology == topology
            ),
            None,
        )
        if handle is None:
            raise WorkflowHandleError("calibration session is stale")
        return await self._require_builder().async_get_config(handle.configuration)

    async def _inventory_for_handle(self, handle: _SessionHandle) -> CTInventory:
        snapshot = await self._require_builder().async_get_config(handle.configuration)
        return CTInventory.from_document(
            ESPHomeConfigDocument.parse(snapshot.content),
            handle.topology,
            CTPresetCatalog.load(),
            snapshot.sha256,
        )

    async def _async_snapshot(self, device: DiscoveredDevice) -> ESPHomeConfigSnapshot:
        builder = self._require_builder()
        configuration = device.configuration
        if configuration is None:
            listing = await builder.async_list_devices()
            configured = listing.get("configured", ())
            entry = self._entry(device.entry_id)
            device_name = getattr(entry, "data", {}).get("device_name")
            matches = [
                item
                for item in configured
                if isinstance(item, Mapping)
                and (device_name is None or item.get("name") == device_name)
                and isinstance(item.get("configuration"), str)
            ]
            if len(matches) != 1:
                raise WorkflowCapabilityUnavailable(
                    "the Device Builder configuration is unavailable"
                )
            configuration = str(matches[0]["configuration"])
        return await builder.async_get_config(configuration)

    def _device(self, device_id: str) -> DiscoveredDevice:
        if self._closed or self._closing:
            raise WorkflowHandleError("workflow is closed")
        if self._esphome_entry_id is not None and device_id != self._esphome_entry_id:
            raise WorkflowHandleError("device is not owned by this entry")
        device = next(
            (
                item
                for item in self._provisioning.snapshot.devices
                if item.entry_id == device_id
            ),
            None,
        )
        if device is None:
            entry = self._entry(device_id)
            project_name = getattr(
                getattr(getattr(entry, "runtime_data", None), "device_info", None),
                "project_name",
                None,
            )
            if not isinstance(project_name, str):
                raise WorkflowHandleError("device is not available")
            device = DiscoveredDevice(device_id, entry.title, project_name)
        return device

    def _entry(self, device_id: str) -> Any:
        getter = getattr(self._hass.config_entries, "async_get_entry", None)
        entry = getter(device_id) if getter is not None else None
        if entry is None:
            raise WorkflowHandleError("device is not available")
        return entry

    def _mac(self, device_id: str) -> str:
        unique_id = getattr(self._entry(device_id), "unique_id", None)
        if not isinstance(unique_id, str):
            raise WorkflowHandleError("device identity is unavailable")
        try:
            return canonical_mac(unique_id)
        except ValueError:
            raise WorkflowHandleError("device identity is unavailable") from None

    def _plan(self, plan_id: str, device_id: str, source_sha256: str) -> _PlanHandle:
        plan = self._plans.get(plan_id)
        if (
            plan is None
            or self._clock() >= plan.expires_at
            or plan.device_id != device_id
            or plan.snapshot.sha256 != source_sha256
        ):
            if plan is not None:
                self._plans.pop(plan_id, None)
                plan.scrub()
            raise WorkflowHandleError("plan is stale")
        return plan

    def _session(self, session_id: str) -> _SessionHandle:
        handle = self._sessions.get(session_id)
        if handle is None:
            raise WorkflowHandleError("session is stale")
        with self._guard(handle.mac):
            return self._session_locked(session_id)

    def _session_locked(self, session_id: str) -> _SessionHandle:
        handle = self._sessions.get(session_id)
        if handle is None or handle.revoked or self._clock() >= handle.expires_at:
            if handle is not None:
                self._revoke_expired_locked(handle)
            raise WorkflowHandleError("session is stale")
        return handle

    def _claim_ready_session(self, session_id: str) -> tuple[_SessionHandle, int]:
        handle = self._session(session_id)
        task = asyncio.current_task()
        if task is None:
            raise RuntimeError("calibration operations require an asyncio task")
        with self._guard(handle.mac):
            handle = self._session_locked(session_id)
            if not handle.safety_acknowledged or not handle.preflight.ok:
                raise WorkflowHandleError("session safety confirmation is absent")
            if handle.active_task is not None:
                raise WorkflowHandleError("session already has an active operation")
            handle.revision += 1
            handle.active_task = task
            return handle, handle.revision

    def _assert_claim(self, handle: _SessionHandle, revision: int) -> None:
        with self._guard(handle.mac):
            if (
                self._sessions.get(handle.session_id) is not handle
                or handle.revoked
                or handle.revision != revision
                or handle.active_task is not asyncio.current_task()
                or self._clock() >= handle.expires_at
            ):
                raise WorkflowHandleError("session is stale")

    def _release_claim(self, handle: _SessionHandle, revision: int) -> None:
        with self._guard(handle.mac):
            if (
                handle.revision == revision
                and handle.active_task is asyncio.current_task()
            ):
                handle.active_task = None

    def _guard(self, mac: str) -> RLock:
        return self._session_guards.setdefault(mac, RLock())

    def _prune_device_sessions_locked(self, mac: str) -> None:
        for handle in tuple(self._sessions.values()):
            if handle.mac == mac and self._clock() >= handle.expires_at:
                self._revoke_expired_locked(handle)

    def _revoke_expired_locked(self, handle: _SessionHandle) -> None:
        if handle.revoked:
            return
        handle.revoked = True
        handle.revision += 1
        self._sessions.pop(handle.session_id, None)
        self._subscribers.pop(handle.session_id, None)
        task = handle.active_task
        self._start_session_cleanup(handle, task)

    def _start_session_cleanup(
        self, handle: _SessionHandle, active_task: asyncio.Task[Any] | None
    ) -> asyncio.Task[None]:
        existing = self._session_cleanup_tasks.get(handle.session_id)
        if existing is not None:
            return existing
        cleanup = asyncio.create_task(self._async_finalize_revoked(handle, active_task))
        self._session_cleanup_tasks[handle.session_id] = cleanup
        self._cleaning_macs.add(handle.mac)
        return cleanup

    async def _async_finalize_revoked(
        self, handle: _SessionHandle, active_task: asyncio.Task[Any] | None
    ) -> None:
        errors: list[BaseException] = []
        if active_task is not None and active_task is not asyncio.current_task():
            if not active_task.done():
                active_task.cancel()
            try:
                await _wait_for_owned_cleanup(active_task)
            except asyncio.CancelledError as error:
                cleanup_outcomes = getattr(error, "cleanup_errors", ())
                if cleanup_outcomes:
                    if isinstance(cleanup_outcomes, tuple) and all(
                        isinstance(item, BaseException) for item in cleanup_outcomes
                    ):
                        errors.extend(cleanup_outcomes)
                    else:
                        errors.append(
                            RuntimeError(
                                "calibration cancellation cleanup outcome was invalid"
                            )
                        )
            except BaseException as error:  # noqa: BLE001 - finish local scrub
                errors.append(error)
        try:
            self._sessions_owner.abandon_calibration(handle.mac)
        except CalibrationBusyError as error:
            errors.append(error)
        except BaseException as error:  # noqa: BLE001 - finish local scrub
            errors.append(error)
        try:
            handle.scrub()
        except BaseException as error:  # noqa: BLE001 - aggregate cleanup
            errors.append(error)
        finally:
            with self._guard(handle.mac):
                self._cleaning_macs.discard(handle.mac)
        if errors:
            raise BaseExceptionGroup("calibration session cleanup failed", errors)

    def _publish(self, handle: _SessionHandle) -> SessionStatus:
        status = handle.status()
        for callback in tuple(self._subscribers.get(handle.session_id, ())):
            try:
                callback(status)
            except Exception:  # noqa: BLE001, S110 - subscriber isolation
                pass
        return status

    def _require_builder(self) -> LazyDeviceBuilder:
        if self._builder is None:
            raise WorkflowCapabilityUnavailable("Device Builder is unavailable")
        return self._builder

    def _require_api(self) -> ESPHomeApiSession:
        if self._api is None:
            raise WorkflowCapabilityUnavailable("ESPHome API is unavailable")
        return self._api

    def _deadline(self) -> float:
        return self._clock() + self._ttl

    def _refresh(self, handle: _SessionHandle) -> None:
        handle.expires_at = self._deadline()

    def _prune_plans(self) -> None:
        for plan_id, plan in tuple(self._plans.items()):
            if self._clock() >= plan.expires_at:
                self._plans.pop(plan_id)
                plan.scrub()

    def _discard_device_plans(self, mac: str) -> None:
        for plan_id, plan in tuple(self._plans.items()):
            if plan.mac == mac:
                self._plans.pop(plan_id)
                plan.scrub()


async def create_device_builder(hass: HomeAssistant) -> LazyDeviceBuilder | None:
    """Discover the official supervised Device Builder and use trusted ingress."""
    hassio = hass.data.get(DATA_COMPONENT)
    if not isinstance(hassio, HassIO):
        return None
    supervisor = get_supervisor_client(hass)
    try:
        addon = await supervisor.addons.addon_info(ESPHOME_DEVICE_BUILDER_SLUG)
    except SupervisorNotFoundError:
        return None
    except (LookupError, TypeError, ValueError) as error:
        raise SupervisorResponseError(
            "Supervisor returned malformed Device Builder metadata"
        ) from error
    if (
        addon.slug != ESPHOME_DEVICE_BUILDER_SLUG
        or addon.name != "ESPHome Device Builder"
    ):
        raise SupervisorResponseError(
            "Supervisor returned inconsistent Device Builder identity"
        )
    if addon.available is not True:
        raise SupervisorResponseError(
            "Supervisor returned inconsistent Device Builder availability"
        )
    if addon.ingress is False:
        if addon.state not in (
            SupervisorAddonState.STARTED,
            SupervisorAddonState.STOPPED,
        ) or any(
            (
                addon.ingress_entry,
                addon.ingress_url,
                addon.ingress_port,
                addon.ingress_panel,
            )
        ):
            raise SupervisorResponseError(
                "Supervisor returned malformed Device Builder ingress metadata"
            )
        return None
    if addon.state is SupervisorAddonState.STOPPED:
        return None
    if addon.state is not SupervisorAddonState.STARTED or addon.ingress is not True:
        raise SupervisorResponseError(
            "Supervisor returned inconsistent Device Builder availability"
        )
    ingress_entry = addon.ingress_entry
    if not isinstance(ingress_entry, str) or not ingress_entry.startswith(
        _INGRESS_ENTRY_PREFIX
    ):
        raise SupervisorResponseError(
            "Supervisor returned malformed Device Builder ingress metadata"
        )
    ingress_token = ingress_entry.removeprefix(_INGRESS_ENTRY_PREFIX)
    _validate_supervisor_token(ingress_token, "Device Builder ingress")
    await _async_validated_ingress_session(supervisor)
    url = str(hassio.base_url.with_path(f"/ingress/{ingress_token}"))

    async def connect(websocket_url: str) -> Any:
        session = await _async_validated_ingress_session(supervisor)
        cookie = SimpleCookie()
        cookie[_INGRESS_SESSION_COOKIE] = session
        return await hassio.websession.ws_connect(
            websocket_url,
            headers={
                hdrs.COOKIE: cookie.output(header="", sep="").strip(),
                X_HASS_SOURCE: "core.ingress",
                X_INGRESS_PATH: ingress_entry,
            },
        )

    return LazyDeviceBuilder(DeviceBuilderClient(url, connect=connect))


def _validate_supervisor_token(value: Any, label: str) -> None:
    """Reject control, cookie, and path-shaped successful Supervisor tokens."""
    if not isinstance(value, str) or _SUPERVISOR_TOKEN.fullmatch(value) is None:
        raise SupervisorResponseError(f"Supervisor returned malformed {label} metadata")


async def _async_validated_ingress_session(supervisor: Any) -> str:
    """Issue one safe Supervisor cookie token or raise a retryable response error."""
    try:
        session = await supervisor.ingress.create_session()
    except (LookupError, TypeError, ValueError) as error:
        raise SupervisorResponseError(
            "Supervisor returned malformed ingress session metadata"
        ) from error
    _validate_supervisor_token(session, "ingress session")
    return session
