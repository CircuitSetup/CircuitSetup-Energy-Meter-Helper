"""Redacted Home Assistant websocket surface for setup and calibration."""

from __future__ import annotations

import asyncio
import inspect
import json
import math
import re
from collections import deque
from collections.abc import Callable, Mapping
from dataclasses import fields, is_dataclass
from enum import Enum
from functools import wraps
from typing import Any, Protocol

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.components.websocket_api import ActiveConnection
from homeassistant.core import HomeAssistant

from .config_mutator import ConfigMutationError
from .config_transaction import RollbackFailedError
from .const import CONF_ESPHOME_ENTRY_ID, DOMAIN
from .ct_catalog import REPORTING_MULTIPLIERS
from .device_builder import ConfigChangedError, _wait_for_owned_cleanup
from .diagnostics import DiagnosticsTracker
from .esphome_api import sanitize_control_text
from .meter_configuration import (
    ChannelSettings,
    CircuitAggregate,
    CircuitRole,
    ElectricalSystem,
    EnergyMode,
    MeasurementMethod,
    MeterConfigurationRequest,
    MeterSettings,
    VoltageLayout,
    VoltageReferenceConfig,
)
from .models import InstallerIntent, SubstitutionChange
from .offset_readiness import OffsetReadinessStage
from .provisioning import ProvisioningCoordinator
from .repairs import async_reconcile_issues, signals_from_result
from .session_manager import CalibrationBusyError, SessionManager
from .store import HelperStore
from .topology import topology_from_native
from .workflow import WorkflowCapabilityUnavailable, WorkflowHandleError

_PREFIX = f"{DOMAIN}/"
READ_COMMANDS = (
    f"{_PREFIX}setup_status",
    f"{_PREFIX}list_meters",
    f"{_PREFIX}get_topology",
    f"{_PREFIX}get_ct_inventory",
    f"{_PREFIX}get_meter_configuration",
    f"{_PREFIX}get_active_work",
    f"{_PREFIX}get_session",
    f"{_PREFIX}get_diagnostics_summary",
)
MUTATION_COMMANDS = (
    f"{_PREFIX}set_installer_intent",
    f"{_PREFIX}rescan",
    f"{_PREFIX}adopt_device",
    f"{_PREFIX}preview_ct_config",
    f"{_PREFIX}preview_meter_configuration",
    f"{_PREFIX}set_ha_labels",
    f"{_PREFIX}apply_ct_config",
    f"{_PREFIX}compile_ct_config",
    f"{_PREFIX}install_ct_config",
    f"{_PREFIX}abandon_ct_config",
    f"{_PREFIX}rollback_ct_config",
    f"{_PREFIX}start_session",
    f"{_PREFIX}acknowledge_safety",
    f"{_PREFIX}check_stability",
    f"{_PREFIX}check_offset_readiness",
    f"{_PREFIX}calibrate_offset",
    f"{_PREFIX}skip_offset_calibration",
    f"{_PREFIX}calibrate_voltage",
    f"{_PREFIX}calibrate_current",
    f"{_PREFIX}restart_and_verify",
    f"{_PREFIX}complete_calibration_without_changes",
    f"{_PREFIX}preview_calibrated_gains",
    f"{_PREFIX}clear_calibration_flash",
    f"{_PREFIX}cancel_session",
)
SUBSCRIPTION_COMMANDS = (
    f"{_PREFIX}subscribe_setup",
    f"{_PREFIX}subscribe_config_transaction",
    f"{_PREFIX}subscribe_session",
)
ALL_COMMANDS = (*READ_COMMANDS, *MUTATION_COMMANDS, *SUBSCRIPTION_COMMANDS)
_TRANSACTION_STATUS_COMMANDS = frozenset(
    f"{_PREFIX}{operation}"
    for operation in (
        "preview_ct_config",
        "preview_meter_configuration",
        "preview_calibrated_gains",
        "apply_ct_config",
        "compile_ct_config",
        "install_ct_config",
        "abandon_ct_config",
        "rollback_ct_config",
        "subscribe_config_transaction",
    )
)
_OWNERSHIP_CREATION_OPERATIONS = frozenset(
    (
        "adopt_device",
        "preview_ct_config",
        "preview_calibrated_gains",
        "start_session",
    )
)

_ROUTER = "_websocket_router"
_MAX_ITEMS = 100
_MAX_DEPTH = 8
_MAX_STRING_BYTES = 32_768
_MAX_PAYLOAD_BYTES = 64 * 1024
_MAX_PENDING_EVENTS = 32
_FORBIDDEN_KEY = re.compile(
    r"(?:^|_)(?:api_?key|content|credential|encryption(?:_key)?|logs?|noise_?psk|"
    r"output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|"
    r"secret|ssid|summary|token|yaml)(?:$|_)",
    re.IGNORECASE,
)
_ALLOWED_CHANGE_PATH = re.compile(
    r"(?:meter|voltage_reference|channel|aggregate|package)\.[a-z0-9_.-]+"
)
_LEGACY_CHANGE_PATHS = {
    "calibrated_voltage_gains": "meter.calibrated_voltage_gains",
    "friendly_name": "meter.friendly_name",
    "update_time": "meter.update_interval_s",
    "electric_freq": "meter.line_frequency_hz",
}
_LEGACY_CHANGE_PATTERNS = (
    (re.compile(r"ct([1-9]|[1-3][0-9]|4[0-2])_name"), "channel", "name"),
    (
        re.compile(r"current_cal_ct([1-9]|[1-3][0-9]|4[0-2])"),
        "channel",
        "current_gain",
    ),
    (re.compile(r"voltage_cal([12])"), "voltage_reference", "gain_voltage"),
    (
        re.compile(r"(power_quality|status_fields)_(main|addon[1-6])"),
        "package",
        None,
    ),
)
_FORBIDDEN_VALUE = re.compile(
    r"(?:api[_ -]?key|credential|encryption[_ -]?key|noise[_ -]?psk|password|"
    r"secret|token)(?:\s*[:=]|\b)",
    re.IGNORECASE,
)
_SHA256 = vol.All(str, vol.Match(r"^[0-9a-f]{64}$"))
_SERVER_ID = vol.All(str, vol.Match(r"^[0-9a-f]{32}$"))
_ID = vol.All(str, vol.Length(min=1, max=128))


class CapabilityUnavailable(RuntimeError):
    """The selected entry does not currently own the requested backend capability."""


class StaleConfirmation(RuntimeError):
    """A server-issued handle no longer owns the requested operation."""


class ResourceNotFound(RuntimeError):
    """The requested device/session handle is not owned by this entry."""


class ApiFailure(RuntimeError):
    """One stable typed failure safe to send without provider text."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.safe_message = message


class TransactionOwner(Protocol):
    """Existing transaction manager surface used by confirmed websocket writes."""

    def assert_confirmation(
        self, transaction_id: str, device_id: str, source_sha256: str
    ) -> None: ...

    async def async_confirm_write(
        self, transaction_id: str, confirmed_by_admin_user_id: str
    ) -> Any: ...

    async def async_compile(self, transaction_id: str) -> Any: ...

    async def async_confirm_install(
        self, transaction_id: str, confirmed_by_admin_user_id: str
    ) -> Any: ...

    async def async_rollback(self, transaction_id: str) -> Any: ...

    async def async_abandon(self, transaction_id: str) -> Any: ...


class WorkflowOwner(Protocol):
    """Higher-level owner of live topology, CT, and calibration handles."""

    async def async_get_topology(self, device_id: str) -> Any: ...

    async def async_get_ct_inventory(self, device_id: str) -> Any: ...

    async def async_get_active_work(self, device_id: str) -> Any: ...

    async def async_get_session(self, session_id: str) -> Any: ...

    async def async_adopt_device(self, device_id: str) -> Any: ...

    async def async_preview_ct_config(
        self,
        device_id: str,
        plan_id: str,
        source_sha256: str,
        changes: tuple[Mapping[str, Any], ...],
        package_options: Mapping[str, Any] | None = None,
    ) -> Any: ...

    async def async_get_meter_configuration(self, device_id: str) -> Any: ...

    async def async_preview_meter_configuration(
        self,
        device_id: str,
        plan_id: str,
        source_sha256: str,
        requested: MeterConfigurationRequest,
    ) -> Any: ...

    async def async_set_ha_labels(
        self, device_id: str, plan_id: str, source_sha256: str, changes: tuple[Mapping[str, Any], ...]
    ) -> Any: ...

    async def async_start_session(self, device_id: str) -> Any: ...

    async def async_acknowledge_safety(
        self, session_id: str, acknowledged: bool
    ) -> Any: ...

    async def async_check_stability(
        self, session_id: str, target: str, target_id: str
    ) -> Any: ...

    async def async_check_offset_readiness(
        self, session_id: str, board_index: int, stage: OffsetReadinessStage
    ) -> Any: ...

    async def async_calibrate_offset(
        self,
        session_id: str,
        board_index: int,
        stage: OffsetReadinessStage,
        preparation_acknowledged: bool,
        confirm_retry: bool = False,
    ) -> Any: ...

    async def async_skip_offset_calibration(self, session_id: str) -> Any: ...

    async def async_calibrate_voltage(
        self,
        session_id: str,
        reference_id: str,
        reference_voltage: float,
        confirm_iteration: bool,
    ) -> Any: ...

    async def async_calibrate_current(
        self,
        session_id: str,
        references: tuple[Mapping[str, Any], ...],
        confirm_iteration: bool,
        pending_multipliers: tuple[Mapping[str, Any], ...] = (),
    ) -> Any: ...

    async def async_restart_and_verify(self, session_id: str) -> Any: ...

    async def async_complete_calibration_without_changes(
        self, session_id: str
    ) -> Any: ...

    async def async_preview_calibrated_gains(
        self,
        session_id: str,
        verification_id: str,
        changes: tuple[Mapping[str, Any], ...] = (),
        package_options: Mapping[str, Any] | None = None,
    ) -> Any: ...

    async def async_clear_calibration_flash(
        self, session_id: str, verification_id: str, transaction_id: str
    ) -> Any: ...

    async def async_cancel_session(self, session_id: str) -> Any: ...

    def subscribe_session(
        self, session_id: str, callback: Callable[[Any], None]
    ) -> Unsubscribe: ...

    async def async_close(self) -> None: ...


type DiagnosticsProvider = Callable[[], Any]
type Unsubscribe = Callable[[], None]


class EntryWebsocketController:
    """Delegate browser requests to the entry's existing backend owners."""

    def __init__(
        self,
        provisioning: ProvisioningCoordinator,
        sessions: SessionManager,
        store: HelperStore,
        *,
        diagnostics_provider: DiagnosticsProvider | None = None,
        esphome_entry_id: str | None = None,
    ) -> None:
        self.provisioning = provisioning
        self.sessions = sessions
        self.store = store
        self.esphome_entry_id = esphome_entry_id
        self.transactions: TransactionOwner | None = None
        self.workflow: WorkflowOwner | None = None
        self._diagnostics_provider = diagnostics_provider
        self.diagnostics = DiagnosticsTracker()
        self._subscriptions: set[Unsubscribe] = set()
        self._closed = False
        self._closing = False
        self._close_task: asyncio.Task[None] | None = None

    @property
    def has_subscribers(self) -> bool:
        return bool(self._subscriptions)

    def set_diagnostics_provider(self, provider: DiagnosticsProvider | None) -> None:
        """Install Task 21's future enrichment seam without changing the command."""
        self._diagnostics_provider = provider

    async def async_call(
        self, command: str, msg: Mapping[str, Any], user_id: str | None
    ) -> Any:
        """Route one validated command without retaining a second workflow state."""
        if self._closed or self._closing:
            raise CapabilityUnavailable
        operation = command.removeprefix(_PREFIX)
        if operation == "setup_status":
            result: dict[str, Any] = _dataclass_mapping(self.provisioning.snapshot)
            result["bound_device_id"] = self.esphome_entry_id
            if self.provisioning.installer_intent is not None:
                result["installer_intent"] = {
                    key: value
                    for key, value in _dataclass_mapping(
                        self.provisioning.installer_intent
                    ).items()
                    if value is not None
                }
            return result
        if operation == "list_meters":
            return self.provisioning.snapshot.devices
        workflow = self.workflow
        if operation == "get_topology" and workflow is not None:
            return await workflow.async_get_topology(msg["device_id"])
        if operation == "get_topology":
            device = next(
                (
                    item
                    for item in self.provisioning.snapshot.devices
                    if item.entry_id == msg["device_id"]
                ),
                None,
            )
            if device is None:
                raise ResourceNotFound
            return {
                "configuration_authoritative": False,
                "topology": topology_from_native(device.project_name),
            }
        if operation == "get_ct_inventory" and workflow is not None:
            return await workflow.async_get_ct_inventory(msg["device_id"])
        if operation == "get_meter_configuration" and workflow is not None:
            return await workflow.async_get_meter_configuration(msg["device_id"])
        if operation == "get_active_work" and workflow is not None:
            return await workflow.async_get_active_work(msg["device_id"])
        if operation == "get_session" and workflow is not None:
            return await workflow.async_get_session(msg["session_id"])
        if operation == "set_installer_intent":
            await self.provisioning.async_set_installer_intent(
                InstallerIntent(
                    msg["addon_count"],
                    msg["connection_type"],
                    msg.get("firmware_product_id"),
                    msg.get("esphome_version"),
                    tuple(msg["power_quality"])
                    if "power_quality" in msg
                    else None,
                    tuple(msg["status_fields"])
                    if "status_fields" in msg
                    else None,
                    msg.get("electrical_system"),
                    msg.get("line_frequency_hz"),
                )
            )
            return await self.async_call(f"{_PREFIX}setup_status", msg, user_id)
        if operation == "rescan":
            return await self.provisioning.async_rescan()
        if operation == "get_diagnostics_summary":
            provider = self._diagnostics_provider
            if provider is None:
                return {
                    "setup_state": self.provisioning.snapshot.state,
                    "meter_count": len(self.provisioning.snapshot.devices),
                }
            result = provider()
            return await result if inspect.isawaitable(result) else result
        if operation == "adopt_device" and workflow is not None:
            return await workflow.async_adopt_device(msg["device_id"])
        if operation == "preview_ct_config" and workflow is not None:
            return await workflow.async_preview_ct_config(
                msg["device_id"],
                msg["plan_id"],
                msg["source_sha256"],
                tuple(msg["changes"]),
                msg.get("package_options"),
            )
        if operation == "preview_meter_configuration" and workflow is not None:
            try:
                return await workflow.async_preview_meter_configuration(
                    msg["device_id"],
                    msg["plan_id"],
                    msg["source_sha256"],
                    _meter_configuration_request(msg["configuration"]),
                )
            except ConfigMutationError as error:
                raise ApiFailure(
                    "meter_configuration_invalid", "The meter configuration is invalid"
                ) from error
        if operation == "set_ha_labels" and workflow is not None:
            return await workflow.async_set_ha_labels(
                msg["device_id"], msg["plan_id"], msg["source_sha256"], tuple(msg["changes"])
            )
        if operation in {
            "apply_ct_config",
            "compile_ct_config",
            "install_ct_config",
            "abandon_ct_config",
            "rollback_ct_config",
        }:
            return await self._async_transaction(operation, msg, user_id)
        if operation == "start_session" and workflow is not None:
            return await workflow.async_start_session(msg["device_id"])
        if operation == "acknowledge_safety" and workflow is not None:
            return await workflow.async_acknowledge_safety(
                msg["session_id"], msg["acknowledged"]
            )
        if operation == "check_stability" and workflow is not None:
            target = msg["target"]
            if target == "voltage":
                if "target_id" not in msg or "target_ids" in msg:
                    raise ValueError("voltage stability requires one reference")
            else:
                if "target_ids" in msg or "target_id" not in msg:
                    raise ValueError("current stability requires one channel")
            return await workflow.async_check_stability(
                msg["session_id"], target, msg["target_id"]
            )
        if operation == "check_offset_readiness" and workflow is not None:
            return await workflow.async_check_offset_readiness(
                msg["session_id"], msg["board_index"], msg["stage"]
            )
        if operation == "calibrate_offset" and workflow is not None:
            return await workflow.async_calibrate_offset(
                msg["session_id"],
                msg["board_index"],
                msg["stage"],
                msg["preparation_acknowledged"],
                msg["confirm_retry"],
            )
        if operation == "skip_offset_calibration" and workflow is not None:
            return await workflow.async_skip_offset_calibration(msg["session_id"])
        if operation == "calibrate_voltage" and workflow is not None:
            return await workflow.async_calibrate_voltage(
                msg["session_id"],
                msg["reference_id"],
                msg["reference_voltage"],
                msg["confirm_iteration"],
            )
        if operation == "calibrate_current" and workflow is not None:
            pending_multipliers = tuple(msg.get("pending_multipliers", ()))
            if pending_multipliers:
                return await workflow.async_calibrate_current(
                    msg["session_id"],
                    tuple(msg["references"]),
                    msg["confirm_iteration"],
                    pending_multipliers,
                )
            return await workflow.async_calibrate_current(
                msg["session_id"],
                tuple(msg["references"]),
                msg["confirm_iteration"],
            )
        if operation == "restart_and_verify" and workflow is not None:
            return await workflow.async_restart_and_verify(msg["session_id"])
        if operation == "complete_calibration_without_changes" and workflow is not None:
            return await workflow.async_complete_calibration_without_changes(
                msg["session_id"]
            )
        if operation == "preview_calibrated_gains" and workflow is not None:
            changes = tuple(msg.get("changes", ()))
            return await workflow.async_preview_calibrated_gains(
                msg["session_id"],
                msg["verification_id"],
                changes,
                msg.get("package_options"),
            )
        if operation == "clear_calibration_flash" and workflow is not None:
            return await workflow.async_clear_calibration_flash(
                msg["session_id"], msg["verification_id"], msg["transaction_id"]
            )
        if operation == "cancel_session" and workflow is not None:
            return await workflow.async_cancel_session(msg["session_id"])
        raise CapabilityUnavailable

    async def _async_transaction(
        self, operation: str, msg: Mapping[str, Any], user_id: str | None
    ) -> Any:
        owner = self.transactions
        if owner is None:
            raise CapabilityUnavailable
        try:
            device_id = self._transaction_device_id(owner, msg["device_id"])
            owner.assert_confirmation(
                msg["transaction_id"], device_id, msg["source_sha256"]
            )
            if operation == "apply_ct_config":
                result = await owner.async_confirm_write(
                    msg["transaction_id"], _admin_user_id(user_id)
                )
            elif operation == "compile_ct_config":
                result = await owner.async_compile(msg["transaction_id"])
            elif operation == "install_ct_config":
                result = await owner.async_confirm_install(
                    msg["transaction_id"], _admin_user_id(user_id)
                )
            elif operation == "abandon_ct_config":
                result = await owner.async_abandon(msg["transaction_id"])
            else:
                result = await owner.async_rollback(msg["transaction_id"])
        except ConfigChangedError as error:
            raise ApiFailure(
                "config_changed", "The configuration changed; create a new preview"
            ) from error
        except RollbackFailedError as error:
            raise ApiFailure(
                "config_rollback_failed", "Configuration rollback requires attention"
            ) from error
        except (KeyError, RuntimeError) as error:
            raise StaleConfirmation from error
        return result

    async def async_snapshot(self, command: str, msg: Mapping[str, Any]) -> Any:
        operation = command.removeprefix(_PREFIX)
        if operation == "subscribe_setup":
            return self.provisioning.snapshot
        owner = self.transactions
        if operation == "subscribe_config_transaction" and owner is not None:
            owner.assert_confirmation(
                msg["transaction_id"],
                self._transaction_device_id(owner, msg["device_id"]),
                msg["source_sha256"],
            )
            status = getattr(owner, "status", None)
            if status is not None:
                return status(msg["transaction_id"])
        workflow = self.workflow
        if operation == "subscribe_session" and workflow is not None:
            return await workflow.async_get_session(msg["session_id"])
        raise CapabilityUnavailable

    def subscribe(
        self,
        command: str,
        msg: Mapping[str, Any],
        callback: Callable[[Any], None],
    ) -> Unsubscribe:
        """Attach only to an existing bounded backend event source."""
        operation = command.removeprefix(_PREFIX)
        if operation == "subscribe_setup":
            unsubscribe = self.provisioning.subscribe(callback)
        elif operation == "subscribe_config_transaction" and self.transactions:
            self.transactions.assert_confirmation(
                msg["transaction_id"],
                self._transaction_device_id(self.transactions, msg["device_id"]),
                msg["source_sha256"],
            )
            subscribe = getattr(self.transactions, "subscribe", None)
            if subscribe is None:
                raise CapabilityUnavailable
            unsubscribe = subscribe(msg["transaction_id"], callback)
        elif operation == "subscribe_session" and self.workflow is not None:
            unsubscribe = self.workflow.subscribe_session(msg["session_id"], callback)
        else:
            raise CapabilityUnavailable

        def tracked_unsubscribe() -> None:
            if tracked_unsubscribe not in self._subscriptions:
                return
            unsubscribe()
            self._subscriptions.discard(tracked_unsubscribe)

        self._subscriptions.add(tracked_unsubscribe)
        return tracked_unsubscribe

    def _transaction_device_id(self, owner: TransactionOwner, device_id: str) -> str:
        workflow = self.workflow
        resolver = getattr(workflow, "transaction_device_identity", None)
        if (
            workflow is not None
            and getattr(workflow, "transactions", None) is owner
            and resolver
        ):
            return resolver(device_id)
        return device_id

    async def async_close(self) -> None:
        """Remove providers/callbacks and scrub owner handles exactly once."""
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
        subscriptions = tuple(self._subscriptions)
        self._diagnostics_provider = None
        transactions = self.transactions
        workflow = self.workflow
        for unsubscribe in subscriptions:
            try:
                unsubscribe()
            except BaseException as error:  # noqa: BLE001 - complete all teardown
                errors.append(error)
            else:
                self._subscriptions.discard(unsubscribe)
        if transactions is not None:
            clear_subscribers = getattr(transactions, "clear_subscribers", None)
            if clear_subscribers is not None:
                try:
                    clear_subscribers()
                except BaseException as error:  # noqa: BLE001 - complete all teardown
                    errors.append(error)
        if workflow is not None:
            try:
                await workflow.async_close()
            except BaseException as error:  # noqa: BLE001 - complete all teardown
                errors.append(error)
        try:
            await self.sessions.async_unload()
        except BaseException as error:  # noqa: BLE001 - scrub before reporting
            errors.append(error)
        if errors:
            raise BaseExceptionGroup("websocket controller cleanup failed", errors)
        self.transactions = None
        self.workflow = None
        self._closed = True


class _Router:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.controllers: dict[str, EntryWebsocketController] = {}
        self.subscriptions: dict[str, set[Unsubscribe]] = {}
        # ponytail: global rebind lock, use per-entry locks if multiple helper entries are supported.
        self._rebind_lock = asyncio.Lock()
        for command in ALL_COMMANDS:
            websocket_api.async_register_command(hass, _handler(command))

    def add(self, entry_id: str, controller: EntryWebsocketController) -> None:
        existing = self.controllers.get(entry_id)
        if existing is not None and existing is not controller:
            raise RuntimeError("websocket provider already registered")
        self.controllers[entry_id] = controller

    def remove(self, entry_id: str) -> None:
        errors: list[BaseException] = []
        tracked = self.subscriptions.get(entry_id)
        subscriptions = tuple(tracked or ())
        self.controllers.pop(entry_id, None)
        for unsubscribe in subscriptions:
            try:
                unsubscribe()
            except BaseException as error:  # noqa: BLE001 - remove every callback
                errors.append(error)
            else:
                if tracked is not None:
                    tracked.discard(unsubscribe)
        if tracked is not None and not tracked:
            self.subscriptions.pop(entry_id, None)
        if errors:
            raise BaseExceptionGroup("websocket router cleanup failed", errors)

    def controller(self, entry_id: str) -> EntryWebsocketController:
        try:
            return self.controllers[entry_id]
        except KeyError:
            raise CapabilityUnavailable from None

    async def call(self, connection: ActiveConnection, msg: Mapping[str, Any]) -> None:
        operation = msg["type"].removeprefix(_PREFIX)
        if operation in _OWNERSHIP_CREATION_OPERATIONS:
            async with self._rebind_lock:
                await self._call(connection, msg, operation)
            return
        await self._call(connection, msg, operation)

    async def _call(
        self,
        connection: ActiveConnection,
        msg: Mapping[str, Any],
        operation: str,
    ) -> None:
        controller: EntryWebsocketController | None = None
        try:
            controller = self.controller(msg["entry_id"])
            result = await controller.async_call(
                msg["type"], msg, getattr(connection.user, "id", None)
            )
            controller.diagnostics.record_result(operation, result)
            await async_reconcile_issues(
                self.hass, msg["entry_id"], operation, signals_from_result(result)
            )
            connection.send_result(
                msg["id"],
                sanitize_payload(
                    result,
                    allow_transaction_change_keys=(
                        msg["type"] in _TRANSACTION_STATUS_COMMANDS
                    ),
                ),
            )
        except asyncio.CancelledError as error:
            if controller is not None:
                controller.diagnostics.record_error(error)
            await async_reconcile_issues(
                self.hass,
                msg["entry_id"],
                operation,
                signals_from_result(error),
                authoritative=False,
            )
            raise
        except Exception as error:  # noqa: BLE001 - stable websocket error boundary
            if controller is not None:
                controller.diagnostics.record_error(error)
            await async_reconcile_issues(
                self.hass,
                msg["entry_id"],
                operation,
                signals_from_result(error),
                authoritative=False,
            )
            _send_safe_error(connection, msg["id"], error)
        else:
            if operation == "adopt_device":
                try:
                    await self._async_rebind_device(
                        msg["entry_id"],
                        result["device_id"],
                    )
                except Exception as error:  # noqa: BLE001 - success was already sent
                    controller.diagnostics.record_error(error)

    async def _async_rebind_device(
        self, entry_id: str, device_id: str
    ) -> None:
        controller = self.controllers.get(entry_id)
        entry = self.hass.config_entries.async_get_entry(entry_id)
        if entry is None or controller is None or controller.esphome_entry_id == device_id:
            return
        if entry.data.get(CONF_ESPHOME_ENTRY_ID) != device_id:
            self.hass.config_entries.async_update_entry(
                entry,
                data={**entry.data, CONF_ESPHOME_ENTRY_ID: device_id},
            )
        if not await self.hass.config_entries.async_reload(entry_id):
            raise RuntimeError("helper rebind failed")
        replacement = self.controllers.get(entry_id)
        if replacement is None or replacement.esphome_entry_id != device_id:
            raise RuntimeError("helper rebind did not publish the adopted device")

    async def subscribe(
        self, connection: ActiveConnection, msg: Mapping[str, Any]
    ) -> None:
        entry_id = msg["entry_id"]
        msg_id = msg["id"]
        try:
            controller = self.controller(entry_id)
            pending: deque[Any] = deque()
            allow_transaction_change_keys = msg["type"] in _TRANSACTION_STATUS_COMMANDS
            initial_sent = False
            active = True
            overflowed = False
            provider_unsubscribe: Unsubscribe | None = None
            removed = False
            tracked = self.subscriptions.setdefault(entry_id, set())

            def remove() -> None:
                nonlocal active, removed
                active = False
                pending.clear()
                if removed:
                    return
                if provider_unsubscribe is not None:
                    provider_unsubscribe()
                removed = True
                tracked.discard(remove)
                if not tracked:
                    self.subscriptions.pop(entry_id, None)

            def forward(event: Any) -> None:
                nonlocal active, overflowed
                if not active:
                    return
                controller.diagnostics.record_result(
                    msg["type"].removeprefix(_PREFIX), event
                )
                if not initial_sent:
                    if len(pending) >= _MAX_PENDING_EVENTS:
                        overflowed = True
                        active = False
                        pending.clear()
                        return
                    pending.append(event)
                    return
                try:
                    connection.send_event(
                        msg_id,
                        sanitize_payload(
                            event,
                            allow_transaction_change_keys=allow_transaction_change_keys,
                        ),
                    )
                except Exception:  # noqa: BLE001 - never leak provider failures
                    connection.subscriptions.pop(msg_id, None)
                    try:
                        remove()
                    except BaseException:  # noqa: BLE001 - retained for unload retry
                        active = False
                    try:
                        connection.send_event(
                            msg_id,
                            {"error": {"code": "operation_failed"}},
                        )
                    except Exception:  # noqa: BLE001 - connection is already unusable
                        active = False

            try:
                provider_unsubscribe = controller.subscribe(msg["type"], msg, forward)
            except BaseException:
                if not tracked:
                    self.subscriptions.pop(entry_id, None)
                raise
            tracked.add(remove)
            try:
                snapshot = await controller.async_snapshot(msg["type"], msg)
                safe_snapshot = sanitize_payload(
                    snapshot,
                    allow_transaction_change_keys=allow_transaction_change_keys,
                )
            except BaseException as error:
                try:
                    remove()
                except BaseException as cleanup_error:  # noqa: BLE001
                    error.add_note(
                        "subscription cleanup failed with "
                        f"{type(cleanup_error).__name__}"
                    )
                raise
            connection.subscriptions[msg_id] = remove
            try:
                connection.send_result(msg_id)
                if overflowed:
                    connection.send_event(
                        msg_id, {"error": {"code": "resync_required"}}
                    )
                    connection.subscriptions.pop(msg_id, None)
                    remove()
                    return
                connection.send_event(msg_id, safe_snapshot)
                initial_sent = True
                while pending and active:
                    forward(pending.popleft())
            except BaseException:
                connection.subscriptions.pop(msg_id, None)
                remove()
                raise
        except Exception as error:  # noqa: BLE001 - stable websocket error boundary
            _send_safe_error(connection, msg_id, error)


def async_register_entry(
    hass: HomeAssistant, entry_id: str, controller: EntryWebsocketController
) -> None:
    """Register one entry provider and the global command table idempotently."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    router = domain_data.get(_ROUTER)
    if not isinstance(router, _Router):
        router = domain_data[_ROUTER] = _Router(hass)
    router.add(entry_id, controller)


def async_unregister_entry(hass: HomeAssistant, entry_id: str) -> None:
    """Remove one entry and every websocket subscription that targets it."""
    router = hass.data.get(DOMAIN, {}).get(_ROUTER)
    if isinstance(router, _Router):
        router.remove(entry_id)


def _handler(command: str) -> websocket_api.WebSocketCommandHandler:
    preview_configuration = command == f"{_PREFIX}preview_meter_configuration"
    schema = _preview_meter_configuration_envelope(command) if preview_configuration else _schema(command)

    async def handle(
        hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any]
    ) -> None:
        if preview_configuration:
            nested = dict(msg)
            nested.pop("id", None)
            msg = {**_schema(command)(nested), "id": msg["id"]}
        router = hass.data[DOMAIN][_ROUTER]
        if command in SUBSCRIPTION_COMMANDS:
            await router.subscribe(connection, msg)
        else:
            await router.call(connection, msg)

    decorated = websocket_api.async_response(handle)
    if preview_configuration:
        admin_decorated = websocket_api.require_admin(decorated)

        @wraps(admin_decorated)
        def size_checked(
            hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any]
        ) -> None:
            try:
                _check_payload_size(msg)
            except ValueError as error:
                raise vol.Invalid(str(error)) from error
            admin_decorated(hass, connection, msg)

        decorated = size_checked
    elif command in MUTATION_COMMANDS:
        decorated = websocket_api.require_admin(decorated)
    return websocket_api.websocket_command(schema)(decorated)


def _preview_meter_configuration_envelope(command: str) -> Any:
    """Accept only the preview envelope before bounded, post-auth nested validation."""
    return vol.All(
        vol.Schema(
            {
                vol.Required("type"): command,
                vol.Required("entry_id"): _ID,
            },
            extra=vol.ALLOW_EXTRA,
        )
    )


def _schema(command: str) -> Any:
    operation = command.removeprefix(_PREFIX)
    schema: dict[Any, Any] = {
        vol.Required("type"): command,
        vol.Required("entry_id"): _ID,
    }
    if operation == "set_installer_intent":
        schema |= {
            vol.Required("addon_count"): vol.All(int, vol.Range(min=0, max=6)),
            vol.Required("connection_type"): vol.In(
                ("wifi", "ethernet_lilygo", "ethernet_waveshare")
            ),
            vol.Optional("firmware_product_id"): str,
            vol.Optional("esphome_version"): str,
            vol.Optional("power_quality"): vol.All(
                [bool], vol.Length(min=1, max=7)
            ),
            vol.Optional("status_fields"): vol.All(
                [bool], vol.Length(min=1, max=7)
            ),
            vol.Optional("electrical_system"): vol.In(
                (
                    "split_phase_120_240",
                    "single_phase_230",
                    "three_phase",
                    "custom",
                )
            ),
            vol.Optional("line_frequency_hz"): vol.All(_strict_integer, vol.In((50, 60))),
        }
        return vol.All(vol.Schema(schema), _validate_installer_firmware_schema)
    elif operation in {
        "get_topology",
        "get_ct_inventory",
        "get_meter_configuration",
        "adopt_device",
    }:
        schema[vol.Required("device_id")] = _ID
    elif operation == "preview_ct_config":
        schema |= {
            vol.Required("device_id"): _ID,
            vol.Required("plan_id"): _ID,
            vol.Required("source_sha256"): _SHA256,
            vol.Required("changes"): vol.All(
                [
                    {
                        vol.Required("channel"): vol.All(int, vol.Range(min=1, max=42)),
                        vol.Required("name"): vol.All(str, vol.Length(min=1, max=64)),
                        vol.Required("model_id"): _ID,
                        vol.Optional(
                            "reporting_multiplier", default=1.0
                        ): _reporting_multiplier,
                        vol.Optional("custom_gain_ct"): vol.All(
                            int, vol.Range(min=1, max=65535)
                        ),
                        vol.Optional("custom_label"): vol.All(
                            str, vol.Length(min=1, max=64)
                        ),
                        vol.Optional("burden_output_acknowledged", default=False): bool,
                    }
                ],
                vol.Length(max=42),
            ),
            vol.Optional("package_options"): {
                vol.Required("power_quality"): vol.All(
                    [bool], vol.Length(min=1, max=7)
                ),
                vol.Required("status_fields"): vol.All(
                    [bool], vol.Length(min=1, max=7)
                ),
            },
        }
        return vol.All(vol.Schema(schema), _validate_config_preview_schema)
    elif operation == "preview_meter_configuration":
        schema |= {
            vol.Required("device_id"): _ID,
            vol.Required("plan_id"): _ID,
            vol.Required("source_sha256"): _SHA256,
            vol.Required("configuration"): _METER_CONFIGURATION_SCHEMA,
        }
        return vol.All(
            vol.Schema(schema, extra=vol.PREVENT_EXTRA),
            _validate_meter_configuration_payload,
        )
    elif operation == "set_ha_labels":
        schema |= {
            vol.Required("device_id"): _ID,
            vol.Required("plan_id"): _ID,
            vol.Required("source_sha256"): _SHA256,
            vol.Required("changes"): vol.All([
                {vol.Required("channel"): vol.All(int, vol.Range(min=1, max=42)),
                 vol.Required("name"): vol.All(str, vol.Length(min=1, max=64))}
            ], vol.Length(min=1, max=42)),
        }
    elif operation in {
        "apply_ct_config",
        "compile_ct_config",
        "install_ct_config",
        "abandon_ct_config",
        "rollback_ct_config",
        "subscribe_config_transaction",
    }:
        schema |= {
            vol.Required("device_id"): _ID,
            vol.Required("transaction_id"): _ID,
            vol.Required("source_sha256"): _SHA256,
        }
    elif operation in {"get_active_work", "start_session"}:
        schema[vol.Required("device_id")] = _ID
    elif operation == "preview_calibrated_gains":
        schema |= {
            vol.Required("session_id"): _SERVER_ID,
            vol.Required("verification_id"): _SERVER_ID,
            vol.Optional("changes", default=[]): vol.All(
                [
                    {
                        vol.Required("channel"): vol.All(int, vol.Range(min=1, max=42)),
                        vol.Required("name"): vol.All(str, vol.Length(min=1, max=64)),
                        vol.Required("model_id"): _ID,
                        vol.Optional(
                            "reporting_multiplier", default=1.0
                        ): _reporting_multiplier,
                        vol.Optional("custom_gain_ct"): vol.All(int, vol.Range(min=1, max=65535)),
                        vol.Optional("custom_label"): vol.All(str, vol.Length(min=1, max=64)),
                        vol.Optional("burden_output_acknowledged", default=False): bool,
                    }
                ],
                vol.Length(max=42),
            ),
            vol.Optional("package_options"): {
                vol.Required("power_quality"): vol.All(
                    [bool], vol.Length(min=1, max=7)
                ),
                vol.Required("status_fields"): vol.All(
                    [bool], vol.Length(min=1, max=7)
                ),
            },
        }
    elif operation == "clear_calibration_flash":
        schema |= {
            vol.Required("session_id"): _SERVER_ID,
            vol.Required("verification_id"): _SERVER_ID,
            vol.Required("transaction_id"): _SERVER_ID,
        }
    elif operation == "acknowledge_safety":
        schema |= {
            vol.Required("session_id"): _ID,
            vol.Required("acknowledged"): True,
        }
    elif operation == "check_stability":
        schema |= {
            vol.Required("session_id"): _ID,
            vol.Required("target"): vol.In(("voltage", "current")),
            vol.Optional("target_id"): _ID,
            vol.Optional("target_ids"): vol.All([_ID], vol.Length(min=1, max=8)),
        }
        return vol.All(vol.Schema(schema), _validate_stability_schema)
    elif operation in {"check_offset_readiness", "calibrate_offset"}:
        schema |= {
            vol.Required("session_id"): _ID,
            vol.Required("board_index"): vol.All(
                _strict_integer, vol.Range(min=0, max=6)
            ),
            vol.Required("stage"): vol.All(_strict_integer, vol.In((1, 2))),
        }
        if operation == "calibrate_offset":
            schema[vol.Required("preparation_acknowledged")] = _literal_true
            schema[vol.Optional("confirm_retry", default=False)] = bool
    elif operation == "calibrate_voltage":
        schema |= {
            vol.Required("session_id"): _ID,
            vol.Required("reference_id"): _ID,
            vol.Required("reference_voltage"): vol.All(
                _finite_float, vol.Range(min=1, max=600)
            ),
            vol.Optional("confirm_iteration", default=False): bool,
        }
    elif operation == "calibrate_current":
        schema |= {
            vol.Required("session_id"): _ID,
            vol.Required("references"): vol.All(
                [
                    vol.Schema(
                        {
                            vol.Required("channel"): vol.All(
                                int, vol.Range(min=1, max=42)
                            ),
                            vol.Required("reference"): vol.Coerce(float),
                            vol.Required("reporting_multiplier"): _reporting_multiplier,
                        },
                        extra=vol.PREVENT_EXTRA,
                    )
                ],
                vol.Length(min=1, max=3),
            ),
            vol.Optional("confirm_iteration", default=False): bool,
            vol.Optional("pending_multipliers", default=[]): vol.All(
                [
                    vol.Schema(
                        {
                            vol.Required("channel"): vol.All(
                                int, vol.Range(min=1, max=42)
                            ),
                            vol.Required("reporting_multiplier"): _reporting_multiplier,
                        },
                        extra=vol.PREVENT_EXTRA,
                    )
                ],
                vol.Length(max=42),
            ),
        }
    elif operation in {
        "get_session",
        "skip_offset_calibration",
        "restart_and_verify",
        "complete_calibration_without_changes",
        "cancel_session",
        "subscribe_session",
    }:
        schema[vol.Required("session_id")] = _ID
    return schema


def _validate_installer_firmware_schema(value: dict[str, Any]) -> dict[str, Any]:
    """Reject incomplete or unsafe installer selections before handler mutation."""
    try:
        InstallerIntent(
            value["addon_count"],
            value["connection_type"],
            value.get("firmware_product_id"),
            value.get("esphome_version"),
            tuple(value["power_quality"]) if "power_quality" in value else None,
            tuple(value["status_fields"]) if "status_fields" in value else None,
            value.get("electrical_system"),
            value.get("line_frequency_hz"),
        )
    except ValueError as error:
        raise vol.Invalid(str(error)) from error
    return value


def _validate_config_preview_schema(value: dict[str, Any]) -> dict[str, Any]:
    if not value["changes"] and "package_options" not in value:
        raise vol.Invalid("at least one configuration change is required")
    return value


def _validate_stability_schema(value: dict[str, Any]) -> dict[str, Any]:
    if value["target"] == "voltage":
        if "target_id" not in value or "target_ids" in value:
            raise vol.Invalid("voltage stability requires one reference")
    elif "target_id" not in value or "target_ids" in value:
        raise vol.Invalid("current stability requires one channel")
    return value


def _reporting_multiplier(value: Any) -> float:
    multiplier = _finite_float(value)
    if multiplier not in REPORTING_MULTIPLIERS:
        raise vol.Invalid("reporting_multiplier must be 1, 2, 4, or 8")
    return multiplier


def _strict_integer(value: Any) -> int:
    if type(value) is not int:
        raise vol.Invalid("value must be an integer")
    return value


def _literal_true(value: Any) -> bool:
    if value is not True:
        raise vol.Invalid("value must be true")
    return True


def _finite_float(value: Any) -> float:
    if type(value) not in (int, float):
        raise vol.Invalid("value must be numeric")
    value = float(value)
    if not math.isfinite(value):
        raise vol.Invalid("value must be finite")
    return value


_METER_CONFIGURATION_SCHEMA = vol.Schema(
    {
        vol.Required("meter"): vol.Schema(
            {
                vol.Required("friendly_name"): vol.All(str, vol.Length(min=1, max=64)),
                vol.Required("electrical_system"): vol.In(
                    tuple(item.value for item in ElectricalSystem)
                ),
                vol.Required("line_frequency_hz"): vol.All(
                    _strict_integer, vol.In((50, 60))
                ),
                vol.Required("update_interval_s"): vol.All(
                    _strict_integer, vol.In((1, 2, 5, 10, 30, 60))
                ),
                vol.Required("voltage_layout"): vol.In(
                    tuple(item.value for item in VoltageLayout)
                ),
                vol.Required("voltage_references"): vol.All(
                    [
                        vol.Schema(
                            {
                                vol.Required("reference_id"): _ID,
                                vol.Required("label"): vol.All(
                                    str, vol.Length(min=1, max=64)
                                ),
                                vol.Required("phase_label"): vol.All(
                                    str, vol.Length(min=1, max=64)
                                ),
                                vol.Required("nominal_voltage_v"): vol.All(
                                    _finite_float, vol.Range(min=1, max=600)
                                ),
                                vol.Required("transformer_model_id"): _ID,
                                vol.Required("gain_voltage"): vol.All(
                                    _strict_integer, vol.Range(min=1, max=65535)
                                ),
                                vol.Required("group_keys"): vol.All(
                                    [_ID], vol.Length(min=1, max=14)
                                ),
                            },
                            extra=vol.PREVENT_EXTRA,
                        )
                    ],
                    vol.Length(min=1, max=8),
                ),
            },
            extra=vol.PREVENT_EXTRA,
        ),
        vol.Required("channels"): vol.All(
            [
                vol.Schema(
                    {
                        vol.Required("channel"): vol.All(
                            _strict_integer, vol.Range(min=1, max=42)
                        ),
                        vol.Required("enabled"): bool,
                        vol.Required("name"): vol.All(str, vol.Length(min=1, max=64)),
                        vol.Required("model_id"): _ID,
                        vol.Required("reporting_multiplier"): _reporting_multiplier,
                        vol.Required("role"): vol.In(
                            tuple(item.value for item in CircuitRole)
                        ),
                        vol.Required("voltage_reference_id"): _ID,
                        vol.Optional("custom_gain_ct"): vol.Any(
                            None,
                            vol.All(_strict_integer, vol.Range(min=1, max=65535)),
                        ),
                        vol.Optional("custom_label"): vol.Any(
                            None, vol.All(str, vol.Length(min=1, max=64))
                        ),
                        vol.Optional("burden_output_acknowledged"): bool,
                    },
                    extra=vol.PREVENT_EXTRA,
                )
            ],
            vol.Length(min=1, max=42),
        ),
        vol.Required("aggregates"): vol.All(
            [
                vol.Schema(
                    {
                        vol.Required("aggregate_id"): _ID,
                        vol.Required("name"): vol.All(str, vol.Length(min=1, max=64)),
                        vol.Required("role"): vol.In(
                            tuple(item.value for item in CircuitRole)
                        ),
                        vol.Required("channels"): vol.All(
                            [vol.All(_strict_integer, vol.Range(min=1, max=42))],
                            vol.Length(min=1, max=42),
                        ),
                        vol.Required("measurement_method"): vol.In(
                            tuple(item.value for item in MeasurementMethod)
                        ),
                        vol.Required("parent_id"): vol.Any(None, _ID),
                        vol.Required("energy_mode"): vol.In(
                            tuple(item.value for item in EnergyMode)
                        ),
                        vol.Optional("expose_power", default=True): bool,
                        vol.Optional("expose_current", default=False): bool,
                    },
                    extra=vol.PREVENT_EXTRA,
                )
            ],
            vol.Length(max=32),
        ),
        vol.Required("power_quality"): vol.All([bool], vol.Length(min=1, max=7)),
        vol.Required("status_fields"): vol.All([bool], vol.Length(min=1, max=7)),
        vol.Optional("multi_reference_preparation_acknowledged"): bool,
    },
    extra=vol.PREVENT_EXTRA,
)


def _validate_meter_configuration_payload(value: dict[str, Any]) -> dict[str, Any]:
    _check_payload_size(value)
    return value


def _meter_configuration_request(
    configuration: Mapping[str, Any],
) -> MeterConfigurationRequest:
    """Convert only the strict public schema to the existing workflow DTO."""
    meter = configuration["meter"]
    return MeterConfigurationRequest(
        MeterSettings(
            meter["friendly_name"],
            ElectricalSystem(meter["electrical_system"]),
            meter["line_frequency_hz"],
            meter["update_interval_s"],
            VoltageLayout(meter["voltage_layout"]),
            tuple(
                VoltageReferenceConfig(
                    reference["reference_id"],
                    reference["label"],
                    reference["phase_label"],
                    reference["nominal_voltage_v"],
                    reference["transformer_model_id"],
                    reference["gain_voltage"],
                    tuple(reference["group_keys"]),
                )
                for reference in meter["voltage_references"]
            ),
        ),
        tuple(
            ChannelSettings(
                channel["channel"],
                channel["enabled"],
                channel["name"],
                channel["model_id"],
                channel["reporting_multiplier"],
                CircuitRole(channel["role"]),
                channel["voltage_reference_id"],
                channel.get("custom_gain_ct"),
                channel.get("custom_label"),
                channel.get("burden_output_acknowledged", False),
            )
            for channel in configuration["channels"]
        ),
        tuple(
            CircuitAggregate(
                aggregate["aggregate_id"],
                aggregate["name"],
                CircuitRole(aggregate["role"]),
                tuple(aggregate["channels"]),
                MeasurementMethod(aggregate["measurement_method"]),
                aggregate["parent_id"],
                EnergyMode(aggregate["energy_mode"]),
                aggregate["expose_power"],
                aggregate["expose_current"],
            )
            for aggregate in configuration["aggregates"]
        ),
        tuple(configuration["power_quality"]),
        tuple(configuration["status_fields"]),
        configuration.get("multi_reference_preparation_acknowledged", False),
    )


def sanitize_payload(
    value: Any,
    *,
    allow_transaction_change_keys: bool = False,
    _depth: int = 0,
    _field: str = "",
    _allow_change_key: bool = False,
) -> Any:
    """Convert existing DTOs to bounded JSON while recursively removing secrets."""
    if _depth > _MAX_DEPTH:
        raise ValueError("payload nesting is too deep")
    if value is None or isinstance(value, bool | int):
        return value
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError("payload contains a non-finite number")
        return value
    if isinstance(value, Enum):
        return sanitize_payload(
            value.value,
            _depth=_depth + 1,
            _field=_field,
            _allow_change_key=_allow_change_key,
        )
    if isinstance(value, str):
        had_line_break = "\n" in value or "\r" in value
        value = sanitize_control_text(value)
        if _FORBIDDEN_VALUE.search(value):
            return "<redacted>"
        if had_line_break and _field != "redacted_diff":
            return "<redacted>"
        encoded = value.encode()[:_MAX_STRING_BYTES]
        return encoded.decode("utf-8", "ignore")
    if is_dataclass(value) and not isinstance(value, type):
        value = _dataclass_mapping(value)
    if isinstance(value, Mapping):
        result: dict[str, Any] = {}
        for key, item in list(value.items())[:_MAX_ITEMS]:
            if isinstance(key, str):
                key = sanitize_control_text(key)
            approved_change_key = (
                key == "key"
                and _allow_change_key
                and isinstance(item, str)
                and _ALLOWED_CHANGE_PATH.fullmatch(item) is not None
            )
            if (
                not isinstance(key, str)
                or not key
                or len(key) > 128
                or key.casefold() in {"entity_key", "raw_key"}
                or (key.casefold() == "key" and not approved_change_key)
                or (key.casefold() != "raw_gain_ct" and _FORBIDDEN_KEY.search(key))
            ):
                continue
            if key in result:
                raise ValueError("payload keys collide after sanitization")
            if (
                allow_transaction_change_keys
                and _depth == 0
                and key == "changes"
                and isinstance(item, tuple | list)
            ):
                changes = [
                    change
                    for item in list(item)[:_MAX_ITEMS]
                    if (
                        change := _sanitize_transaction_change(item, _depth + 2)
                    )
                    is not None
                ]
                result[key] = changes
            else:
                result[key] = sanitize_payload(
                    item,
                    _depth=_depth + 1,
                    _field=key,
                )
        _check_payload_size(result)
        return result
    if isinstance(value, tuple | list | set | frozenset):
        list_result = [
            sanitize_payload(item, _depth=_depth + 1, _field=_field)
            for item in list(value)[:_MAX_ITEMS]
        ]
        _check_payload_size(list_result)
        return list_result
    return "<redacted>"


def _sanitize_transaction_change(value: Any, depth: int) -> Any | None:
    """Normalize only server-created substitutions before exposing their key."""
    if isinstance(value, SubstitutionChange):
        path = _canonical_server_change_path(value.key)
        if path is None:
            return None
        return sanitize_payload(
            {"key": path, "old_value": value.old_value, "new_value": value.new_value},
            _depth=depth,
            _allow_change_key=True,
        )
    return sanitize_payload(value, _depth=depth, _allow_change_key=True)


def _canonical_server_change_path(key: str) -> str | None:
    """Map the finite legacy substitution vocabulary to safe public paths."""
    if key in _LEGACY_CHANGE_PATHS:
        return _LEGACY_CHANGE_PATHS[key]
    for pattern, namespace, field in _LEGACY_CHANGE_PATTERNS:
        match = pattern.fullmatch(key)
        if match is None:
            continue
        if namespace == "package":
            feature, board = match.groups()
            return f"package.{board}.{feature}"
        return f"{namespace}.{match.group(1)}.{field}"
    return key if _ALLOWED_CHANGE_PATH.fullmatch(key) is not None else None


def _dataclass_mapping(value: Any) -> dict[str, Any]:
    return {field.name: getattr(value, field.name) for field in fields(value)}


def _check_payload_size(value: Any) -> None:
    if (
        len(
            json.dumps(
                value, separators=(",", ":"), sort_keys=True, default=str
            ).encode()
        )
        > _MAX_PAYLOAD_BYTES
    ):
        raise ValueError("payload is too large")


def _admin_user_id(user_id: str | None) -> str:
    if not user_id:
        raise PermissionError
    return user_id


def _send_safe_error(
    connection: ActiveConnection, msg_id: int, error: Exception
) -> None:
    if isinstance(error, CapabilityUnavailable):
        code, message = "capability_unavailable", "This capability is not available"
    elif isinstance(error, ApiFailure):
        code, message = error.code, error.safe_message
    elif isinstance(error, StaleConfirmation):
        code, message = "stale_confirmation", "The confirmation is stale or invalid"
    elif isinstance(error, WorkflowHandleError):
        code, message = "stale_handle", "The selected device changed or is no longer available"
    elif isinstance(error, WorkflowCapabilityUnavailable):
        code, message = "capability_unavailable", "This capability is not available"
    elif isinstance(error, KeyError | ResourceNotFound):
        code, message = "not_found", "The requested resource was not found"
    elif isinstance(error, CalibrationBusyError):
        code, message = "device_busy", "The selected meter is busy"
    elif isinstance(error, ValueError | vol.Invalid):
        code, message = "invalid_request", "The request is invalid"
    else:
        code, message = "operation_failed", "The request could not be completed"
    connection.send_error(msg_id, code, message)
