"""Production websocket workflow adapter over the existing backend owners."""

from __future__ import annotations

import asyncio
import re
from collections import Counter
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field, replace
from hashlib import sha256
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

from .calibration_engine import (
    CalibrationTimingPolicy,
    CalibrationEngine,
    OffsetCalibrationResult,
    OffsetCalibrationState,
)
from .config_document import ESPHomeConfigDocument
from .config_mutator import (
    CTChangeRequest,
    package_options_from_document,
)
from .config_transaction import ConfigTransactionManager, ReconnectEvidence
from .ct_catalog import REPORTING_MULTIPLIERS, CTPresetCatalog
from .ct_inventory import CTInventory
from .device_builder import (
    DeviceBuilderClient,
    ESPHomeConfigSnapshot,
    _wait_for_owned_cleanup,
)
from .entity_binding import (
    MeterBinding,
    OffsetControlStatus,
    bind_meter,
    bind_native_meter,
)
from .entity_catalog import EntityCatalog
from .esphome_api import ESPHomeApiSession
from .meter_config_mutator import (
    build_meter_configuration_mutation,
    expected_meter_entity_evidence,
)
from .meter_configuration import MeterConfigurationRequest
from .meter_inventory import MeterConfigurationInventory
from .models import MeterTopology, StoredCTSelection, canonical_mac
from .offset_readiness import (
    OffsetReadinessResult,
    OffsetReadinessStage,
    async_check_offset_readiness,
)
from .preflight import PreflightResult, async_preflight
from .provisioning import (
    DiscoveredDevice,
    ProvisioningCoordinator,
    device_builder_status,
)
from .session_manager import CalibrationBusyError, SessionManager
from .state_tracker import SensorSampleWindow
from .store import CalibrationSourceAuthority, HelperStore, StoredMeterConfiguration
from .topology import (
    topology_from_config,
    topology_from_native,
    verified_voltage_reference_fingerprint,
)
from .voltage_transformer_catalog import VoltageTransformerCatalog

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


def _instance_id_for_channel(channel: int) -> str:
    board = (channel - 1) // 6
    group = ((channel - 1) % 6) // 3 + 1
    return f"meter_main{group}" if board == 0 else f"addon{board}_{group}"


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
    inventory: MeterConfigurationInventory
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
    entity_role_counts: dict[str, int]
    calibration_sources: dict[str, str] = field(default_factory=dict)
    offset_capability: dict[str, str | None] = field(default_factory=dict)
    offset_disposition: str = "not_started"
    offset_boards: tuple[dict[str, Any], ...] = ()
    has_pending_calibration: bool = False


@dataclass(slots=True)
class _SessionHandle:
    session_id: str
    device_id: str
    mac: str
    topology: MeterTopology
    configuration: str | None
    substitutions: dict[str, str]
    binding: MeterBinding
    preflight: PreflightResult
    calibration_sources: dict[str, str]
    expires_at: float
    safety_acknowledged: bool = False
    state: str = "safety_required"
    revision: int = 0
    active_task: asyncio.Task[Any] | None = None
    revoked: bool = False
    offset_results: dict[tuple[int, int], OffsetCalibrationResult] = field(
        default_factory=dict
    )
    offset_active: tuple[int, int] | None = None
    offset_skipped: bool = False
    calibrated_current_channels: set[int] = field(default_factory=set)
    pending_reporting_multipliers: dict[int, float] = field(default_factory=dict)
    meter_configuration: StoredMeterConfiguration | None = None
    timing_policy: CalibrationTimingPolicy = field(
        default_factory=lambda: CalibrationTimingPolicy(5, 3)
    )

    def status(self) -> SessionStatus:
        capability = getattr(self.binding, "offset_capability", None)
        boards: tuple[dict[str, Any], ...] = tuple(
            {
                "board_index": board_index,
                "stages": tuple(
                    {
                        "stage": stage,
                        "state": self._offset_stage_state(board_index, stage),
                    }
                    for stage in (1, 2)
                ),
            }
            for board_index in range(self.topology.board_count)
        )
        stage_states = tuple(
            stage["state"] for board in boards for stage in board["stages"]
        )
        if self.offset_skipped:
            disposition = "partial" if self.offset_results else "skipped"
        elif any(state in {"partial", "indeterminate"} for state in stage_states):
            disposition = "partial"
        elif stage_states and all(state == "completed" for state in stage_states):
            disposition = "completed"
        elif self.offset_active is not None or self.offset_results:
            disposition = "in_progress"
        else:
            disposition = "not_started"
        return SessionStatus(
            self.session_id,
            self.device_id,
            self.state,
            self.safety_acknowledged,
            self.preflight,
            {
                "references": sum(len(group.references) for group in self.binding.groups),
                "buttons": sum(len(group.buttons) for group in self.binding.groups),
                "voltage_sensors": sum(len(group.voltage_sensors) for group in self.binding.groups),
                "current_sensors": sum(len(group.current_sensors) for group in self.binding.groups),
            },
            dict(self.calibration_sources),
            {
                "status": (
                    capability.status.value
                    if capability is not None
                    else OffsetControlStatus.UNAVAILABLE.value
                ),
                "repair_reason": (
                    capability.repair_reason if capability is not None else None
                ),
            },
            disposition,
            boards,
        )

    def _offset_stage_state(self, board_index: int, stage: int) -> str:
        if self.offset_active == (board_index, stage):
            return "in_progress"
        result = self.offset_results.get((board_index, stage))
        if result is not None:
            if (
                result.state
                is OffsetCalibrationState.APPLIED_PENDING_RESTART_VERIFICATION
            ):
                return "completed"
            return result.state.value
        return "skipped" if self.offset_skipped else "not_started"

    def scrub(self) -> None:
        self.substitutions.clear()
        self.calibrated_current_channels.clear()
        self.pending_reporting_multipliers.clear()


def _ct_change_requests(
    changes: tuple[Mapping[str, Any], ...],
) -> tuple[CTChangeRequest, ...]:
    return tuple(
        CTChangeRequest(
            channel=int(change["channel"]),
            name=str(change["name"]),
            model_id=str(change["model_id"]),
            reporting_multiplier=float(change.get("reporting_multiplier", 1.0)),
            custom_gain_ct=(int(change["custom_gain_ct"]) if "custom_gain_ct" in change else None),
            custom_label=(str(change["custom_label"]) if "custom_label" in change else None),
            burden_output_acknowledged=bool(change.get("burden_output_acknowledged", False)),
        )
        for change in changes
    )


def _stored_reporting_multipliers(
    selections: tuple[StoredCTSelection, ...], config_sha256: str
) -> dict[int, float]:
    return {
        selection.channel: selection.reporting_multiplier
        for selection in selections
        if selection.config_sha256 == config_sha256
    }


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
        self._cleaning_macs: dict[str, asyncio.Task[None]] = {}
        self._close_task: asyncio.Task[None] | None = None
        self._closing = False
        self.transactions: ConfigTransactionManager | None = None
        self._closed = False
        self._calibration = CalibrationEngine(
            sessions,
            store.async_save_interrupted_session,
            persist_verified=store.async_finalize_verified_calibration,
            calibration_snapshot_reader=(
                self._async_calibration_snapshot if device_builder is not None else None
            ),
            trusted_voltage_fingerprint_reader=(
                self._async_trusted_voltage_fingerprint
                if device_builder is not None
                else None
            ),
        )

    async def async_get_topology(
        self, device_id: str
    ) -> MeterTopology | dict[str, Any]:
        device = self._device(device_id)
        try:
            snapshot = await self._async_snapshot(device)
        except WorkflowCapabilityUnavailable:
            return topology_from_native(device.project_name)
        document = ESPHomeConfigDocument.parse(snapshot.content)
        topology = topology_from_config(
            document,
            native_project_name=device.project_name,
        )
        return {
            "topology": topology,
            "package_options": package_options_from_document(document, topology),
        }

    def transaction_device_identity(self, device_id: str) -> str:
        """Translate the browser's owned ESPHome entry handle to canonical MAC."""
        self._device(device_id)
        return self._mac(device_id)

    async def async_get_meter_configuration(self, device_id: str) -> dict[str, Any]:
        return await self._async_get_meter_configuration(device_id)

    async def _async_get_meter_configuration(
        self, device_id: str
    ) -> dict[str, Any]:
        device = self._device(device_id)
        mac = self._mac(device_id)
        snapshot = await self._async_snapshot(device)
        document = ESPHomeConfigDocument.parse(snapshot.content)
        topology = topology_from_config(
            document, native_project_name=device.project_name
        )
        ct_catalog = await self._hass.async_add_executor_job(CTPresetCatalog.load)
        voltage_catalog = await self._hass.async_add_executor_job(
            VoltageTransformerCatalog.load
        )
        selections = await self._store.async_get_ct_selections(mac)
        stored_read = await self._store.async_get_meter_configuration_read(mac)
        if stored_read.stale:
            raise WorkflowHandleError("stored meter configuration is stale")
        plan_id = uuid4().hex
        inventory = MeterConfigurationInventory.from_document(
            plan_id,
            document,
            topology,
            ct_catalog,
            voltage_catalog,
            snapshot.sha256,
            stored_configuration=stored_read.configuration,
            stored_ct_selections=selections,
            reporting_multipliers=_stored_reporting_multipliers(
                selections, snapshot.sha256
            ),
            stored_semantics_stale=False,
        )
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
            "topology": inventory.topology,
            "configuration": inventory.configuration,
            "capabilities": inventory.capabilities,
            "voltage_topology": inventory.voltage_topology,
            "voltage_transformer_catalog": inventory.voltage_transformer_catalog,
            "ct_catalog": inventory.ct_catalog,
            "warnings": inventory.warnings,
            "channels": inventory.ct_inventory.channels,
            "catalog": inventory.ct_catalog,
        }

    async def async_get_ct_inventory(self, device_id: str) -> dict[str, Any]:
        """Return the legacy CT-only response backed by a complete meter plan."""
        inventory = await self._async_get_meter_configuration(device_id)
        return {
            key: inventory[key]
            for key in ("plan_id", "source_sha256", "channels", "catalog")
        }

    async def async_get_session(self, session_id: str) -> SessionStatus:
        return self._status(self._session(session_id))

    async def async_get_active_work(self, device_id: str) -> dict[str, Any]:
        """Return safe resumable work for one selected device."""
        self._device(device_id)
        mac = self._mac(device_id)
        with self._guard(mac):
            self._prune_device_sessions_locked(mac)
            session = next(
                (item.status() for item in self._sessions.values() if item.mac == mac),
                None,
            )
        return {
            "session": session,
            "transaction": (
                self.transactions.active_status(mac)
                if self.transactions is not None
                else None
            ),
            "verified_calibration": await self._store.async_get_verified_calibration(mac),
        }

    async def async_adopt_device(self, device_id: str) -> dict[str, str]:
        device = self._adoption_device(device_id)
        self._assert_rebind_idle(device_id)
        builder = self._require_builder()
        entry = self._entry(device_id)
        name = getattr(entry, "data", {}).get("device_name")
        if not isinstance(name, str):
            raise WorkflowCapabilityUnavailable("adoption metadata is unavailable")
        status = device_builder_status(entry, await builder.async_list_devices())
        if status.configuration is not None:
            return {"device_id": device_id, "configuration": status.configuration}
        info = getattr(getattr(entry, "runtime_data", None), "device_info", None)
        package_url = getattr(info, "package_import_url", None)
        if not isinstance(package_url, str):
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
        package_options: Mapping[str, Any] | None = None,
    ) -> Any:
        plan = self._plan(plan_id, device_id, source_sha256)
        requests = _ct_change_requests(changes)
        by_channel = {request.channel: request for request in requests}
        requested = replace(
            plan.inventory.configuration,
            channels=tuple(
                replace(
                    channel,
                    name=change.name,
                    model_id=change.model_id,
                    reporting_multiplier=change.reporting_multiplier,
                    custom_gain_ct=change.custom_gain_ct,
                    custom_label=change.custom_label,
                    burden_output_acknowledged=change.burden_output_acknowledged,
                )
                if (change := by_channel.get(channel.channel)) is not None
                else channel
                for channel in plan.inventory.configuration.channels
            ),
        )
        if package_options is not None:
            if set(package_options) != {"power_quality", "status_fields"}:
                raise ValueError("package options are invalid")
            options = {name: tuple(values) for name, values in package_options.items()}
            if any(
                len(values) != plan.topology.board_count
                or any(type(value) is not bool for value in values)
                for values in options.values()
            ):
                raise ValueError(
                    "package options require one state per installed board"
                )
            requested = replace(
                requested,
                power_quality=options["power_quality"],
                status_fields=options["status_fields"],
            )
        return await self._async_preview_meter_configuration(plan, requested)

    async def async_preview_meter_configuration(
        self,
        device_id: str,
        plan_id: str,
        source_sha256: str,
        requested: MeterConfigurationRequest,
    ) -> Any:
        """Preview one complete server-validated meter configuration transaction."""
        return await self._async_preview_meter_configuration(
            self._plan(plan_id, device_id, source_sha256), requested
        )

    async def _async_preview_meter_configuration(
        self, plan: _PlanHandle, requested: MeterConfigurationRequest
    ) -> Any:
        manager = self.transactions
        if manager is None:
            raise WorkflowCapabilityUnavailable("configuration writes are unavailable")
        mutation = build_meter_configuration_mutation(
            plan.snapshot, plan.topology, plan.inventory, requested
        )
        proposed_sha256 = sha256(mutation.proposed_content.encode()).hexdigest()
        updated_inventory = CTInventory.from_document(
            ESPHomeConfigDocument.parse(mutation.proposed_content),
            plan.topology,
            plan.inventory.ct_catalog,
            proposed_sha256,
            reporting_multipliers={
                channel.channel: channel.reporting_multiplier
                for channel in requested.channels
            },
        )
        by_channel = {item.channel: item for item in updated_inventory.channels}
        selections = tuple(
            StoredCTSelection(
                channel.channel,
                channel.model_id,
                channel.custom_label,
                by_channel[channel.channel].raw_gain_ct,
                channel.reporting_multiplier,
                proposed_sha256,
            )
            for channel in requested.channels
        )
        configuration = StoredMeterConfiguration(
            proposed_sha256,
            requested.meter,
            requested.channels,
            requested.aggregates,
            requested.power_quality,
            requested.status_fields,
            selections,
            requested.multi_reference_preparation_acknowledged,
        )
        expected = expected_meter_entity_evidence(requested, plan.topology)
        status = await manager.async_preview(
            plan.mac,
            plan.topology,
            mutation,
            plan.snapshot,
            meter_configuration=configuration,
            expected_sensor_entities=expected.sensor_entities,
            expected_aggregate_sensor_entities=expected.aggregate_sensor_entities,
        )
        self._plans.pop(plan.plan_id, None)
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
        if not requested.keys() <= channels.keys() or not requested.keys() <= {
            item.channel for item in plan.inventory.ct_inventory.channels
        }:
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
        configuration: str | None = None
        snapshot: ESPHomeConfigSnapshot | None = None
        substitutions: dict[str, str] = {}
        if self._builder is None:
            topology = topology_from_native(device.project_name)
            binding = bind_native_meter(
                EntityCatalog(api.entities, api.connection_generation), topology
            )
        else:
            snapshot = await self._async_snapshot(device)
            document = ESPHomeConfigDocument.parse(snapshot.content)
            topology = topology_from_config(
                document, native_project_name=device.project_name
            )
            configuration = snapshot.configuration
            substitutions = {
                key: scalar.value for key, scalar in document.substitutions.items()
            }
            binding = bind_meter(
                EntityCatalog(api.entities, api.connection_generation),
                topology,
                substitutions,
            )
        mac = self._mac(device_id)
        stored_read = await self._store.async_get_meter_configuration_read(mac)
        if stored_read.stale or (
            stored_read.configuration is not None
            and (
                snapshot is None
                or stored_read.configuration.config_sha256 != snapshot.sha256
            )
        ):
            raise WorkflowHandleError("stored meter configuration is stale")
        meter_configuration = stored_read.configuration
        cleanup = self._cleaning_macs.get(mac)
        if cleanup is not None and await _wait_for_owned_cleanup(cleanup):
            raise asyncio.CancelledError
        lease = await self._sessions_owner.async_acquire_calibration(mac)
        try:
            preflight = await async_preflight(api, binding, asyncio.Lock())
        finally:
            lease.release()
        instance_ids = {
            group.key.replace("main_", "meter_main") for group in binding.groups
        }
        source_reader = getattr(api, "async_calibration_sources", None)
        observed_sources = (
            await source_reader(instance_ids)
            if source_reader is not None
            else {instance_id: "unknown" for instance_id in instance_ids}
        )
        marker = await self._store.async_get_interrupted_session(mac)
        verified = await self._store.async_get_verified_calibration(mac)
        saved_flash_ids = (
            {_instance_id_for_channel(channel) for channel in marker.changed_channels}
            if marker is not None and marker.state == "flash_saved"
            else set()
        )
        if (
            verified is not None
            and verified.source_authority is CalibrationSourceAuthority.SAVED_FLASH
        ):
            saved_flash_ids.update(group.instance_id for group in verified.groups)
        calibration_sources = {
            instance_id: (
                source
                if source != "unknown"
                else "flash"
                if instance_id in saved_flash_ids
                else "configuration"
            )
            for instance_id, source in observed_sources.items()
        }
        session_id = uuid4().hex
        handle = _SessionHandle(
            session_id,
            device_id,
            mac,
            topology,
            configuration,
            substitutions,
            binding,
            preflight,
            calibration_sources,
            self._deadline(),
            state="safety_required" if preflight.ok else "preflight_failed",
            meter_configuration=meter_configuration,
            timing_policy=CalibrationTimingPolicy(
                (
                    meter_configuration.meter.update_interval_s
                    if meter_configuration is not None
                    else 5
                ),
                3,
            ),
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
        return self._status(handle)

    async def async_acknowledge_safety(
        self, session_id: str, acknowledged: bool
    ) -> SessionStatus:
        handle = self._session(session_id)
        with self._guard(handle.mac):
            handle = self._session_locked(session_id)
            if handle.state == "verified":
                raise WorkflowHandleError("calibration session is already finalized")
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
                groups = self._voltage_reference_groups(handle, target_id)
                entities = tuple(
                    entity for group in groups for entity in group.voltage_sensors
                )
            else:
                if not isinstance(target_id, str):
                    raise WorkflowHandleError("unknown current target")
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
            boundary = monotonic()
            windows = tuple(
                await asyncio.gather(
                    *(
                        api.async_wait_for_sensor_window(
                            entity.descriptor.key,
                            device_id=entity.descriptor.device_id,
                            sample_count=1,
                            after=boundary,
                            timeout=CalibrationTimingPolicy(
                                handle.timing_policy.update_interval_s, 1
                            ).sensor_window_timeout_s,
                        )
                        for entity in entities
                    )
                )
            )
            stable = all(window.range_percent <= 1.0 for window in windows)
            self._assert_claim(handle, revision)
            handle.state = "stable" if stable else "unstable"
            self._refresh(handle)
            self._publish(handle)
            if target == "voltage":
                return {
                    "target": target,
                    "target_id": target_id,
                    "stable": stable,
                    "windows": tuple(
                        _public_sample_window(window) for window in windows
                    ),
                }
            return {
                "target": target,
                "target_id": target_id,
                "stable": stable,
                "windows": tuple(_public_sample_window(window) for window in windows),
            }
        finally:
            self._release_claim(handle, revision)

    async def async_check_offset_readiness(
        self,
        session_id: str,
        board_index: int,
        stage: OffsetReadinessStage,
    ) -> OffsetReadinessResult:
        handle, revision = self._claim_ready_session(session_id)
        try:
            self._validate_offset_target(handle, board_index, stage)
            api = self._require_api()
            result = await async_check_offset_readiness(
                api,
                handle.binding,
                board_index,
                stage,
                timeout=handle.timing_policy.sensor_window_timeout_s,
            )
            self._assert_claim(handle, revision)
            if (
                result.stage != stage
                or result.connection_generation != handle.binding.connection_generation
                or int(api.connection_generation) != result.connection_generation
            ):
                raise WorkflowHandleError("offset readiness evidence is stale")
            self._refresh(handle)
            return result
        finally:
            self._release_claim(handle, revision)

    async def async_calibrate_offset(
        self,
        session_id: str,
        board_index: int,
        stage: OffsetReadinessStage,
        preparation_acknowledged: bool,
        confirm_retry: bool = False,
    ) -> OffsetCalibrationResult:
        if preparation_acknowledged is not True:
            raise WorkflowHandleError("physical preparation acknowledgement is absent")
        handle, revision = self._claim_ready_session(session_id)
        active = False
        try:
            self._validate_offset_target(handle, board_index, stage)
            if handle.offset_skipped:
                raise WorkflowHandleError("offset calibration is already finalized")
            handle.offset_active = (board_index, stage)
            active = True
            self._publish(handle)
            result = await self._calibration.async_calibrate_offset_board(
                handle.mac,
                self._require_api(),
                handle.binding,
                board_index,
                stage,
                confirm_retry=confirm_retry,
                timing_policy=handle.timing_policy,
            )
            self._assert_claim(handle, revision)
            handle.offset_results[(board_index, stage)] = result
            handle.state = str(result.state)
            self._refresh(handle)
            return result
        finally:
            handle.offset_active = None
            if active and (
                self._sessions.get(handle.session_id) is handle
                and not handle.revoked
                and handle.revision == revision
            ):
                self._publish(handle)
            self._release_claim(handle, revision)

    async def async_skip_offset_calibration(self, session_id: str) -> SessionStatus:
        handle, revision = self._claim_ready_session(session_id)
        try:
            if handle.offset_skipped or (
                len(handle.offset_results) == handle.topology.board_count * 2
                and all(
                    result.state
                    is OffsetCalibrationState.APPLIED_PENDING_RESTART_VERIFICATION
                    for result in handle.offset_results.values()
                )
            ):
                raise WorkflowHandleError("offset calibration is already finalized")
            self._assert_claim(handle, revision)
            handle.offset_skipped = True
            if self._has_pending_calibration(handle.mac):
                handle.state = str(
                    OffsetCalibrationState.APPLIED_PENDING_RESTART_VERIFICATION
                )
            self._refresh(handle)
            return self._publish(handle)
        finally:
            self._release_claim(handle, revision)

    async def async_calibrate_voltage(
        self,
        session_id: str,
        reference_id: str,
        reference_voltage: float,
        confirm_iteration: bool,
    ) -> Any:
        handle, revision = self._claim_ready_session(session_id)
        try:
            groups = self._voltage_reference_groups(handle, reference_id)
            calibrated = tuple(
                (
                    group.key,
                    reference_voltage,
                    self._sessions_owner.next_calibration_iteration(
                        handle.mac, f"voltage:{group.key}"
                    ),
                )
                for group in groups
            )
            self._assert_claim(handle, revision)
            results = await self._calibration.async_calibrate_voltages(
                handle.mac,
                self._require_api(),
                handle.binding,
                calibrated,
                1.0,
                confirm_iteration=confirm_iteration,
                substitutions=handle.substitutions,
                timing_policy=handle.timing_policy,
            )
            self._assert_claim(handle, revision)
            for result in results:
                if result.gain_evidence is not None and result.gain_evidence.flash_saved:
                    handle.calibration_sources[result.gain_evidence.instance_id] = "flash"
            handle.state = next(
                (
                    str(result.state)
                    for result in results
                    if str(result.state) != "applied_pending_restart_verification"
                ),
                "applied_pending_restart_verification",
            )
            self._refresh(handle)
            self._publish(handle)
            return results
        finally:
            self._release_claim(handle, revision)

    @staticmethod
    def _voltage_reference_groups(
        handle: _SessionHandle, reference_id: str
    ) -> tuple[Any, ...]:
        configuration = handle.meter_configuration
        if configuration is None:
            raise WorkflowHandleError("meter configuration is unavailable")
        references = configuration.meter.voltage_references
        groups_by_key = {group.key: group for group in handle.binding.groups}
        assigned = [key for reference in references for key in reference.group_keys]
        if not assigned or len(assigned) != len(set(assigned)):
            raise WorkflowHandleError("voltage reference group assignments are invalid")
        if set(assigned) != set(groups_by_key):
            raise WorkflowHandleError(
                "voltage reference group assignments are incomplete"
            )
        matched = [item for item in references if item.reference_id == reference_id]
        if len(matched) != 1 or not matched[0].group_keys:
            raise WorkflowHandleError("unknown voltage reference")
        try:
            return tuple(groups_by_key[key] for key in matched[0].group_keys)
        except KeyError:
            raise WorkflowHandleError(
                "voltage reference group assignments are invalid"
            ) from None

    async def async_calibrate_current(
        self,
        session_id: str,
        references: tuple[Mapping[str, Any], ...],
        confirm_iteration: bool,
        pending_multipliers: tuple[Mapping[str, Any], ...] = (),
    ) -> Any:
        handle, revision = self._claim_ready_session(session_id)
        try:
            pending: dict[int, float] = {}
            for item in pending_multipliers:
                channel = int(item["channel"])
                multiplier = float(item["reporting_multiplier"])
                if (
                    channel in pending
                    or not 1 <= channel <= handle.topology.ct_count
                    or multiplier not in REPORTING_MULTIPLIERS
                ):
                    raise WorkflowHandleError("pending reporting multipliers are invalid")
                pending[channel] = multiplier
            calibrated: list[tuple[int, float, float]] = []
            for item in references:
                channel = int(item["channel"])
                if not 1 <= channel <= handle.topology.ct_count:
                    raise WorkflowHandleError("unknown current channel")
                calibrated.append(
                    (
                        channel,
                        float(item["reference"]),
                        await self._reporting_multiplier(
                            handle,
                            channel,
                            (
                                float(item["reporting_multiplier"])
                                if item.get("reporting_multiplier") is not None
                                else None
                            ),
                            pending,
                        ),
                    )
                )
            operation = "current:" + ",".join(str(item[0]) for item in calibrated)
            iteration = self._sessions_owner.next_calibration_iteration(
                handle.mac, operation
            )
            self._assert_claim(handle, revision)
            result = await self._calibration.async_calibrate_currents(
                handle.mac,
                self._require_api(),
                handle.binding,
                tuple(calibrated),
                1.0,
                iteration=iteration,
                confirm_iteration=confirm_iteration,
                substitutions=handle.substitutions,
                timing_policy=handle.timing_policy,
            )
            self._assert_claim(handle, revision)
            if result.gain_evidence is not None and result.gain_evidence.flash_saved:
                handle.calibration_sources[result.gain_evidence.instance_id] = "flash"
                handle.calibrated_current_channels.update(result.changed_channels)
                for channel in result.changed_channels:
                    if channel in pending:
                        handle.pending_reporting_multipliers[channel] = pending[channel]
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

    async def async_complete_calibration_without_changes(
        self, session_id: str
    ) -> SessionStatus:
        handle = self._session(session_id)
        if self._sessions_owner.pending_calibration(handle.mac) is not None or (
            handle.state != "verified"
            and handle.state not in {"ready", "stable", "unstable"}
        ):
            raise WorkflowHandleError(
                "calibration changes require restart verification"
            )
        if handle.state == "verified":
            return self._status(handle)
        handle, revision = self._claim_ready_session(session_id)
        try:
            self._assert_claim(handle, revision)
            handle.state = "verified"
            self._refresh(handle)
            return self._publish(handle)
        finally:
            self._release_claim(handle, revision)

    async def async_preview_calibrated_gains(
        self,
        session_id: str,
        verification_id: str,
        changes: tuple[Mapping[str, Any], ...] = (),
        package_options: Mapping[str, Any] | None = None,
    ) -> Any:
        """Open the existing reviewed YAML transaction for a verified session."""
        handle = self._session(session_id)
        if handle.state != "verified" or self.transactions is None:
            raise WorkflowHandleError("calibration source handoff is unavailable")
        requests = _ct_change_requests(changes)
        requested_by_channel = {request.channel: request for request in requests}
        if any(
            requested_by_channel.get(channel) is None
            or requested_by_channel[channel].reporting_multiplier != multiplier
            for channel, multiplier in handle.pending_reporting_multipliers.items()
        ):
            raise WorkflowHandleError(
                "calibrated reporting multiplier is missing from final CT changes"
            )
        calibrated_channels = frozenset(handle.calibrated_current_channels)
        if requests or calibrated_channels or package_options is not None:
            args = (
                handle.mac,
                handle.topology,
                verification_id,
                requests,
                calibrated_channels,
            )
            if package_options is None:
                return await self.transactions.async_preview_calibrated_gains(*args)
            return await self.transactions.async_preview_calibrated_gains(
                *args, package_options=package_options
            )
        return await self.transactions.async_preview_calibrated_gains(
            handle.mac, handle.topology, verification_id
        )

    async def async_clear_calibration_flash(
        self, session_id: str, verification_id: str, transaction_id: str
    ) -> Any:
        """Clear only installed, gain-only groups and prove YAML is authoritative."""
        handle, revision = self._claim_ready_session(session_id, allow_verified=True)
        try:
            if handle.state != "verified":
                raise WorkflowHandleError("calibration source handoff is unavailable")
            record = await self._store.async_get_verified_calibration(handle.mac)
            if record is None or record.verification_id != verification_id:
                raise WorkflowHandleError("calibrated firmware installation is unverified")
            if record.has_offset_calibration:
                raise WorkflowHandleError(
                    "YAML handoff is unavailable; offset calibration remains saved "
                    "in flash"
                )
            if (
                record.source_handoff_transaction_id != transaction_id
                or not record.source_handoff_firmware_installed
                or record.source_handoff_available
            ):
                raise WorkflowHandleError("calibrated firmware installation is unverified")
            api = self._require_api()
            if handle.binding.connection_generation != api.connection_generation:
                handle.binding = handle.binding.rebind(
                    EntityCatalog(api.entities, api.connection_generation),
                    handle.substitutions,
                )
            groups = {
                group.key.replace("main_", "meter_main"): group
                for group in handle.binding.groups
            }
            instance_ids = {group.instance_id for group in record.groups}
            if not instance_ids.issubset(groups):
                raise WorkflowHandleError("verified calibration groups are unavailable")
            sources = await api.async_calibration_sources(instance_ids)
            for instance_id in sorted(instance_ids):
                if sources.get(instance_id) == "configuration":
                    continue
                restore = groups[instance_id].restore_gain.descriptor
                await api.async_press_button(restore.key, device_id=restore.device_id)
            sources = await api.async_calibration_sources(instance_ids)
            if any(sources.get(instance_id) != "configuration" for instance_id in instance_ids):
                raise WorkflowHandleError("flash calibration clear could not be verified")
            if not await self._store.async_complete_verified_calibration_handoff(
                handle.mac, verification_id, transaction_id
            ):
                raise WorkflowHandleError("calibration source handoff is stale")
            self._assert_claim(handle, revision)
            handle.calibration_sources.update(sources)
            self._refresh(handle)
            self._publish(handle)
            return replace(
                record, source_authority=CalibrationSourceAuthority.CONFIGURATION
            )
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
            topology_result = await self.async_get_topology(device_id)
            topology = (
                topology_result["topology"]
                if isinstance(topology_result, dict)
                else topology_result
            )
            snapshot = await self._async_snapshot(device)
            document = ESPHomeConfigDocument.parse(snapshot.content)
            substitutions = {
                key: scalar.value for key, scalar in document.substitutions.items()
            }
            catalog = EntityCatalog(api.entities, api.connection_generation)
            binding = bind_meter(catalog, topology, substitutions)
        else:
            topology = handle.topology
            catalog = EntityCatalog(api.entities, api.connection_generation)
            binding = handle.binding.rebind(catalog, handle.substitutions)
            handle.binding = binding
        sensors = catalog.by_kind("sensor")
        sensor_object_ids = Counter(entity.object_id for entity in sensors)
        duplicates = frozenset(
            object_id
            for object_id, count in sensor_object_ids.items()
            if count > 1
        )
        return ReconnectEvidence(
            canonical_mac(mac),
            topology,
            {
                channel.channel: channel.current_sensor.descriptor.name
                for channel in binding.channels
            },
            len(binding.channels),
            frozenset((entity.object_id, entity.name) for entity in sensors),
            duplicates,
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
        if handle.configuration is None:
            raise WorkflowCapabilityUnavailable(
                "calibration source handoff is unavailable"
            )
        return await self._require_builder().async_get_config(handle.configuration)

    async def _async_trusted_voltage_fingerprint(
        self,
        mac: str,
        document: ESPHomeConfigDocument,
        topology: MeterTopology,
    ) -> str | None:
        return verified_voltage_reference_fingerprint(
            document,
            topology,
            await self._store.async_get_meter_configuration(mac),
        )

    async def _reporting_multiplier(
        self,
        handle: _SessionHandle,
        channel: int,
        confirmed: float | None,
        pending: Mapping[int, float] | None = None,
    ) -> float:
        if self._builder is not None:
            authoritative = (await self._inventory_for_handle(handle)).channels[
                channel - 1
            ].reporting_multiplier
            if confirmed is not None and confirmed != authoritative:
                if pending is not None and pending.get(channel) == confirmed:
                    return confirmed
                raise WorkflowHandleError(
                    "reporting multiplier confirmation is stale"
                )
            return authoritative
        if confirmed is None:
            raise WorkflowCapabilityUnavailable(
                "reporting multiplier confirmation is required"
            )
        if (
            isinstance(confirmed, bool)
            or confirmed not in REPORTING_MULTIPLIERS
        ):
            raise WorkflowHandleError("reporting multiplier is outside supported range")
        return confirmed

    async def _inventory_for_handle(self, handle: _SessionHandle) -> CTInventory:
        if handle.configuration is None:
            raise WorkflowCapabilityUnavailable("configuration inventory is unavailable")
        snapshot = await self._require_builder().async_get_config(handle.configuration)
        selections = await self._store.async_get_ct_selections(handle.mac)
        return CTInventory.from_document(
            ESPHomeConfigDocument.parse(snapshot.content),
            handle.topology,
            CTPresetCatalog.load(),
            snapshot.sha256,
            selections,
            _stored_reporting_multipliers(selections, snapshot.sha256),
        )

    async def _async_snapshot(self, device: DiscoveredDevice) -> ESPHomeConfigSnapshot:
        builder = self._require_builder()
        configuration = device.configuration
        if configuration is None:
            listing = await builder.async_list_devices()
            entry = self._entry(device.entry_id)
            configuration = device_builder_status(entry, listing).configuration
            if configuration is None:
                raise WorkflowCapabilityUnavailable(
                    "the Device Builder configuration is unavailable"
                )
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

    def _adoption_device(self, device_id: str) -> DiscoveredDevice:
        if self._closed or self._closing:
            raise WorkflowHandleError("workflow is closed")
        device = next(
            (
                item
                for item in self._provisioning.snapshot.devices
                if item.entry_id == device_id
            ),
            None,
        )
        if device is None:
            raise WorkflowHandleError("device is not available")
        return device

    def _assert_rebind_idle(self, device_id: str) -> None:
        current = self._esphome_entry_id
        if current is None or current == device_id:
            return
        mac = self._mac(current)
        with self._guard(mac):
            self._prune_device_sessions_locked(mac)
            if any(
                handle.mac == mac and handle.state not in {"verified", "cancelled"}
                for handle in self._sessions.values()
            ):
                raise CalibrationBusyError(mac)
        if self.transactions is not None and self.transactions.active_status(mac) is not None:
            raise CalibrationBusyError(mac)

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

    def _claim_ready_session(
        self, session_id: str, *, allow_verified: bool = False
    ) -> tuple[_SessionHandle, int]:
        handle = self._session(session_id)
        task = asyncio.current_task()
        if task is None:
            raise RuntimeError("calibration operations require an asyncio task")
        with self._guard(handle.mac):
            handle = self._session_locked(session_id)
            if not handle.safety_acknowledged or not handle.preflight.ok:
                raise WorkflowHandleError("session safety confirmation is absent")
            if handle.state == "verified" and not allow_verified:
                raise WorkflowHandleError("calibration session is already finalized")
            if handle.active_task is not None:
                raise WorkflowHandleError("session already has an active operation")
            handle.revision += 1
            handle.active_task = task
            handle.expires_at = self._deadline()
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
        self._cleaning_macs[handle.mac] = cleanup
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
                if self._cleaning_macs.get(handle.mac) is asyncio.current_task():
                    self._cleaning_macs.pop(handle.mac, None)
        if errors:
            raise BaseExceptionGroup("calibration session cleanup failed", errors)

    def _publish(self, handle: _SessionHandle) -> SessionStatus:
        status = self._status(handle)
        for callback in tuple(self._subscribers.get(handle.session_id, ())):
            try:
                callback(status)
            except Exception:  # noqa: BLE001, S110 - subscriber isolation
                pass
        return status

    def _status(self, handle: _SessionHandle) -> SessionStatus:
        status = handle.status()
        if not isinstance(status, SessionStatus):
            return status
        return replace(
            status,
            has_pending_calibration=self._has_pending_calibration(handle.mac),
        )

    def _has_pending_calibration(self, mac: str) -> bool:
        pending = self._sessions_owner.pending_calibration(mac)
        return bool(
            pending
            and (
                pending.gain_groups
                or pending.offset_groups
                or pending.power_offset_groups
            )
        )

    @staticmethod
    def _validate_offset_target(
        handle: _SessionHandle,
        board_index: int,
        stage: OffsetReadinessStage,
    ) -> None:
        capability = getattr(handle.binding, "offset_capability", None)
        if (
            capability is None
            or capability.status is not OffsetControlStatus.AVAILABLE
        ):
            raise WorkflowCapabilityUnavailable("offset calibration is unavailable")
        if (
            type(board_index) is not int
            or type(stage) is not int
            or not 0 <= board_index < handle.topology.board_count
            or stage not in (1, 2)
        ):
            raise WorkflowHandleError("offset calibration target is invalid")

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
