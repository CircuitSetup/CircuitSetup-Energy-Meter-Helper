"""Production websocket workflow adapter over the existing backend owners."""

from __future__ import annotations

import asyncio
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from time import monotonic
from typing import Any
from uuid import uuid4

from homeassistant.core import HomeAssistant

from .calibration_engine import CalibrationEngine
from .config_document import ESPHomeConfigDocument
from .config_mutator import CTChangeRequest, build_ct_mutation
from .config_transaction import ConfigTransactionManager, ReconnectEvidence
from .ct_catalog import CTPresetCatalog
from .ct_inventory import CTInventory
from .device_builder import DeviceBuilderClient, ESPHomeConfigSnapshot
from .entity_binding import MeterBinding, bind_meter
from .entity_catalog import EntityCatalog
from .esphome_api import ESPHomeApiSession
from .models import MeterTopology, StoredCTSelection, canonical_mac
from .preflight import PreflightResult, async_preflight
from .provisioning import DiscoveredDevice, ProvisioningCoordinator
from .session_manager import CalibrationBusyError, SessionManager
from .store import HelperStore
from .topology import topology_from_config, topology_from_native

DEFAULT_HANDLE_TTL = 15 * 60.0
MAX_HANDLE_TTL = 60 * 60.0


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
        self._connected = False
        self._lock = asyncio.Lock()

    async def _ready(self) -> DeviceBuilderClient:
        if not self._connected:
            async with self._lock:
                if not self._connected:
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
                    self._connected = True
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
        self._connected = False
        await self._client.async_disconnect()


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
        self._subscribers: dict[str, set[Callable[[SessionStatus], None]]] = {}
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
        self._sessions[session_id] = handle
        self._prune_sessions()
        return handle.status()

    async def async_acknowledge_safety(
        self, session_id: str, acknowledged: bool
    ) -> SessionStatus:
        handle = self._session(session_id)
        if not handle.preflight.ok or not acknowledged:
            raise WorkflowHandleError("session is not ready for safety confirmation")
        handle.safety_acknowledged = True
        handle.state = "ready"
        self._refresh(handle)
        return self._publish(handle)

    async def async_check_stability(
        self, session_id: str, target: str, target_id: str
    ) -> dict[str, Any]:
        handle = self._ready_session(session_id)
        api = self._require_api()
        entities: tuple[Any, ...]
        if target == "voltage":
            group = next(
                (item for item in handle.binding.groups if item.key == target_id), None
            )
            if group is None:
                raise WorkflowHandleError("unknown voltage target")
            entities = group.voltage_sensors
        else:
            try:
                channel = int(target_id)
                entities = (handle.binding.channels[channel - 1].current_sensor,)
            except ValueError, IndexError:
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
        handle.state = "stable" if stable else "unstable"
        self._refresh(handle)
        self._publish(handle)
        return {
            "target": target,
            "target_id": target_id,
            "stable": stable,
            "windows": windows,
        }

    async def async_calibrate_voltage(
        self,
        session_id: str,
        group_key: str,
        reference: float,
        confirm_iteration: bool,
    ) -> Any:
        handle = self._ready_session(session_id)
        iteration = self._sessions_owner.next_calibration_iteration(
            handle.mac, f"voltage:{group_key}"
        )
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
        handle.state = str(result.state)
        self._refresh(handle)
        self._publish(handle)
        return result

    async def async_calibrate_current(
        self,
        session_id: str,
        channel: int,
        reference: float,
        confirm_iteration: bool,
    ) -> Any:
        handle = self._ready_session(session_id)
        inventory = await self._inventory_for_handle(handle)
        multiplier = inventory.channels[channel - 1].reporting_multiplier
        iteration = self._sessions_owner.next_calibration_iteration(
            handle.mac, f"current:{channel}"
        )
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
        handle.state = str(result.state)
        self._refresh(handle)
        self._publish(handle)
        return result

    async def async_restart_and_verify(self, session_id: str) -> Any:
        handle = self._ready_session(session_id)
        result = await self._calibration.async_verify_after_restart(
            handle.mac,
            self._require_api(),
            handle.binding,
            substitutions=handle.substitutions,
        )
        handle.binding = result.binding
        handle.state = "verified"
        self._refresh(handle)
        self._publish(handle)
        return result.record

    async def async_cancel_session(self, session_id: str) -> SessionStatus:
        handle = self._session(session_id)
        handle.state = "cancelled"
        status = self._publish(handle)
        self._sessions_owner.abandon_calibration(handle.mac)
        self._sessions.pop(session_id, None)
        self._subscribers.pop(session_id, None)
        handle.scrub()
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
        self._closed = True
        errors: list[BaseException] = []
        plans = tuple(self._plans.values())
        sessions = tuple(self._sessions.values())
        self._plans.clear()
        self._sessions.clear()
        self._subscribers.clear()
        builder, self._builder = self._builder, None
        self.transactions = None
        self._api = None
        for plan in plans:
            try:
                plan.scrub()
            except BaseException as error:  # noqa: BLE001 - scrub every handle
                errors.append(error)
        for session in sessions:
            try:
                self._sessions_owner.abandon_calibration(session.mac)
            except BaseException as error:  # noqa: BLE001 - scrub every handle
                errors.append(error)
            try:
                session.scrub()
            except BaseException as error:  # noqa: BLE001 - scrub every handle
                errors.append(error)
        if builder is not None:
            try:
                await builder.async_close()
            except BaseException as error:  # noqa: BLE001 - report after local scrub
                errors.append(error)
        if errors:
            raise BaseExceptionGroup("workflow cleanup failed", errors)

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
        if self._closed:
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
        if handle is None or self._clock() >= handle.expires_at:
            if handle is not None:
                self._sessions.pop(session_id, None)
                self._subscribers.pop(session_id, None)
                try:
                    self._sessions_owner.abandon_calibration(handle.mac)
                except CalibrationBusyError:
                    pass
                handle.scrub()
            raise WorkflowHandleError("session is stale")
        return handle

    def _ready_session(self, session_id: str) -> _SessionHandle:
        handle = self._session(session_id)
        if not handle.safety_acknowledged or not handle.preflight.ok:
            raise WorkflowHandleError("session safety confirmation is absent")
        return handle

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

    def _prune_sessions(self) -> None:
        for session_id in tuple(self._sessions):
            try:
                self._session(session_id)
            except WorkflowHandleError:
                pass


def create_device_builder(hass: HomeAssistant) -> LazyDeviceBuilder | None:
    """Derive Device Builder access from Home Assistant's ESPHome dashboard owner."""
    manager = hass.data.get("esphome_dashboard_manager")
    dashboard = manager.async_get() if manager is not None else None
    url = getattr(dashboard, "url", None)
    if not isinstance(url, str) or not url:
        return None

    async def connect(websocket_url: str) -> Any:
        from homeassistant.helpers.aiohttp_client import async_get_clientsession

        return await async_get_clientsession(hass).ws_connect(websocket_url)

    return LazyDeviceBuilder(DeviceBuilderClient(url, connect=connect))
