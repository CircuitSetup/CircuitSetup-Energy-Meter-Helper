"""Redacted Home Assistant websocket surface for setup and calibration."""

from __future__ import annotations

import inspect
import json
import math
import re
from collections.abc import Callable, Mapping
from dataclasses import fields, is_dataclass
from enum import Enum
from typing import Any, Protocol

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.components.websocket_api import ActiveConnection
from homeassistant.core import HomeAssistant

from .config_transaction import RollbackFailedError
from .const import DOMAIN
from .device_builder import ConfigChangedError
from .models import InstallerIntent
from .provisioning import ProvisioningCoordinator
from .session_manager import CalibrationBusyError, SessionManager
from .store import HelperStore
from .topology import topology_from_native

_PREFIX = f"{DOMAIN}/"
READ_COMMANDS = (
    f"{_PREFIX}setup_status",
    f"{_PREFIX}list_meters",
    f"{_PREFIX}get_topology",
    f"{_PREFIX}get_ct_inventory",
    f"{_PREFIX}get_session",
    f"{_PREFIX}get_diagnostics_summary",
)
MUTATION_COMMANDS = (
    f"{_PREFIX}set_installer_intent",
    f"{_PREFIX}rescan",
    f"{_PREFIX}adopt_device",
    f"{_PREFIX}preview_ct_config",
    f"{_PREFIX}apply_ct_config",
    f"{_PREFIX}compile_ct_config",
    f"{_PREFIX}install_ct_config",
    f"{_PREFIX}rollback_ct_config",
    f"{_PREFIX}start_session",
    f"{_PREFIX}acknowledge_safety",
    f"{_PREFIX}check_stability",
    f"{_PREFIX}calibrate_voltage",
    f"{_PREFIX}calibrate_current",
    f"{_PREFIX}restart_and_verify",
    f"{_PREFIX}cancel_session",
)
SUBSCRIPTION_COMMANDS = (
    f"{_PREFIX}subscribe_setup",
    f"{_PREFIX}subscribe_config_transaction",
    f"{_PREFIX}subscribe_session",
)
ALL_COMMANDS = (*READ_COMMANDS, *MUTATION_COMMANDS, *SUBSCRIPTION_COMMANDS)

_ROUTER = "_websocket_router"
_MAX_ITEMS = 100
_MAX_DEPTH = 8
_MAX_STRING_BYTES = 32_768
_MAX_PAYLOAD_BYTES = 64 * 1024
_FORBIDDEN_KEY = re.compile(
    r"(?:^|_)(?:api_?key|content|credential|encryption(?:_key)?|logs?|noise_?psk|"
    r"output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|"
    r"secret|ssid|summary|token|yaml)(?:$|_)",
    re.IGNORECASE,
)
_FORBIDDEN_VALUE = re.compile(
    r"(?:api[_ -]?key|credential|encryption[_ -]?key|noise[_ -]?psk|password|"
    r"secret|token)(?:\s*[:=]|\b)",
    re.IGNORECASE,
)
_SHA256 = vol.All(str, vol.Match(r"^[0-9a-f]{64}$"))
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


class WorkflowOwner(Protocol):
    """Higher-level owner of live topology, CT, and calibration handles."""

    async def async_get_topology(self, device_id: str) -> Any: ...

    async def async_get_ct_inventory(self, device_id: str) -> Any: ...

    async def async_get_session(self, session_id: str) -> Any: ...

    async def async_adopt_device(self, device_id: str) -> Any: ...

    async def async_preview_ct_config(
        self, device_id: str, plan_id: str, source_sha256: str
    ) -> Any: ...

    async def async_start_session(self, device_id: str) -> Any: ...

    async def async_acknowledge_safety(
        self, session_id: str, acknowledged: bool
    ) -> Any: ...

    async def async_check_stability(
        self, session_id: str, target: str, target_id: str
    ) -> Any: ...

    async def async_calibrate_voltage(
        self,
        session_id: str,
        group_key: str,
        reference: float,
        confirm_iteration: bool,
    ) -> Any: ...

    async def async_calibrate_current(
        self,
        session_id: str,
        channel: int,
        reference: float,
        confirm_iteration: bool,
    ) -> Any: ...

    async def async_restart_and_verify(self, session_id: str) -> Any: ...

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
    ) -> None:
        self.provisioning = provisioning
        self.sessions = sessions
        self.store = store
        self.transactions: TransactionOwner | None = None
        self.workflow: WorkflowOwner | None = None
        self._diagnostics_provider = diagnostics_provider
        self._subscriptions: set[Unsubscribe] = set()
        self._closed = False

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
        if self._closed:
            raise CapabilityUnavailable
        operation = command.removeprefix(_PREFIX)
        if operation == "setup_status":
            result: dict[str, Any] = _dataclass_mapping(self.provisioning.snapshot)
            if self.provisioning.installer_intent is not None:
                result["installer_intent"] = _dataclass_mapping(
                    self.provisioning.installer_intent
                )
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
        if operation == "get_session" and workflow is not None:
            return await workflow.async_get_session(msg["session_id"])
        if operation == "set_installer_intent":
            await self.provisioning.async_set_installer_intent(
                InstallerIntent(msg["addon_count"], msg["connection_type"])
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
                msg["device_id"], msg["plan_id"], msg["source_sha256"]
            )
        if operation in {
            "apply_ct_config",
            "compile_ct_config",
            "install_ct_config",
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
            return await workflow.async_check_stability(
                msg["session_id"], msg["target"], msg["target_id"]
            )
        if operation == "calibrate_voltage" and workflow is not None:
            return await workflow.async_calibrate_voltage(
                msg["session_id"],
                msg["group_key"],
                msg["reference"],
                msg["confirm_iteration"],
            )
        if operation == "calibrate_current" and workflow is not None:
            return await workflow.async_calibrate_current(
                msg["session_id"],
                msg["channel"],
                msg["reference"],
                msg["confirm_iteration"],
            )
        if operation == "restart_and_verify" and workflow is not None:
            return await workflow.async_restart_and_verify(msg["session_id"])
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
            owner.assert_confirmation(
                msg["transaction_id"], msg["device_id"], msg["source_sha256"]
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
                msg["transaction_id"], msg["device_id"], msg["source_sha256"]
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
            self._subscriptions.discard(tracked_unsubscribe)
            unsubscribe()

        self._subscriptions.add(tracked_unsubscribe)
        return tracked_unsubscribe

    async def async_close(self) -> None:
        """Remove providers/callbacks and scrub owner handles exactly once."""
        if self._closed:
            return
        self._closed = True
        for unsubscribe in tuple(self._subscriptions):
            unsubscribe()
        self._subscriptions.clear()
        self._diagnostics_provider = None
        transactions, self.transactions = self.transactions, None
        if transactions is not None:
            clear_subscribers = getattr(transactions, "clear_subscribers", None)
            if clear_subscribers is not None:
                clear_subscribers()
        workflow, self.workflow = self.workflow, None
        if workflow is not None:
            await workflow.async_close()
        await self.sessions.async_unload()


class _Router:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.controllers: dict[str, EntryWebsocketController] = {}
        self.subscriptions: dict[str, set[Unsubscribe]] = {}
        for command in ALL_COMMANDS:
            websocket_api.async_register_command(hass, _handler(command))

    def add(self, entry_id: str, controller: EntryWebsocketController) -> None:
        existing = self.controllers.get(entry_id)
        if existing is not None and existing is not controller:
            raise RuntimeError("websocket provider already registered")
        self.controllers[entry_id] = controller

    def remove(self, entry_id: str) -> None:
        for unsubscribe in tuple(self.subscriptions.pop(entry_id, ())):
            unsubscribe()
        self.controllers.pop(entry_id, None)

    def controller(self, entry_id: str) -> EntryWebsocketController:
        try:
            return self.controllers[entry_id]
        except KeyError:
            raise CapabilityUnavailable from None

    async def call(self, connection: ActiveConnection, msg: Mapping[str, Any]) -> None:
        controller = self.controller(msg["entry_id"])
        try:
            result = await controller.async_call(
                msg["type"], msg, getattr(connection.user, "id", None)
            )
            connection.send_result(msg["id"], sanitize_payload(result))
        except Exception as error:  # noqa: BLE001 - stable websocket error boundary
            _send_safe_error(connection, msg["id"], error)

    async def subscribe(
        self, connection: ActiveConnection, msg: Mapping[str, Any]
    ) -> None:
        controller = self.controller(msg["entry_id"])
        entry_id = msg["entry_id"]
        msg_id = msg["id"]
        try:
            pending: list[Any] = []
            initial_sent = False

            def forward(event: Any) -> None:
                if not initial_sent:
                    pending[:] = (event,)
                    return
                try:
                    connection.send_event(msg_id, sanitize_payload(event))
                except Exception:  # noqa: BLE001 - never leak provider failures
                    connection.send_event(
                        msg_id,
                        {"error": {"code": "operation_failed"}},
                    )

            unsubscribe = controller.subscribe(msg["type"], msg, forward)
            try:
                snapshot = await controller.async_snapshot(msg["type"], msg)
                safe_snapshot = sanitize_payload(snapshot)
            except BaseException:
                unsubscribe()
                raise
            tracked = self.subscriptions.setdefault(entry_id, set())

            def remove() -> None:
                if unsubscribe not in tracked:
                    return
                tracked.discard(unsubscribe)
                unsubscribe()

            tracked.add(unsubscribe)
            connection.subscriptions[msg_id] = remove
            try:
                connection.send_result(msg_id)
                connection.send_event(msg_id, safe_snapshot)
                initial_sent = True
                if pending:
                    forward(pending[-1])
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
    schema = _schema(command)

    async def handle(
        hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any]
    ) -> None:
        router = hass.data[DOMAIN][_ROUTER]
        if command in SUBSCRIPTION_COMMANDS:
            await router.subscribe(connection, msg)
        else:
            await router.call(connection, msg)

    decorated = websocket_api.async_response(handle)
    if command in MUTATION_COMMANDS:
        decorated = websocket_api.require_admin(decorated)
    return websocket_api.websocket_command(schema)(decorated)


def _schema(command: str) -> dict[Any, Any]:
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
        }
    elif operation in {"get_topology", "get_ct_inventory", "adopt_device"}:
        schema[vol.Required("device_id")] = _ID
    elif operation == "preview_ct_config":
        schema |= {
            vol.Required("device_id"): _ID,
            vol.Required("plan_id"): _ID,
            vol.Required("source_sha256"): _SHA256,
        }
    elif operation in {
        "apply_ct_config",
        "compile_ct_config",
        "install_ct_config",
        "rollback_ct_config",
        "subscribe_config_transaction",
    }:
        schema |= {
            vol.Required("device_id"): _ID,
            vol.Required("transaction_id"): _ID,
            vol.Required("source_sha256"): _SHA256,
        }
    elif operation == "start_session":
        schema[vol.Required("device_id")] = _ID
    elif operation == "acknowledge_safety":
        schema |= {
            vol.Required("session_id"): _ID,
            vol.Required("acknowledged"): True,
        }
    elif operation == "check_stability":
        schema |= {
            vol.Required("session_id"): _ID,
            vol.Required("target"): vol.In(("voltage", "current")),
            vol.Required("target_id"): _ID,
        }
    elif operation == "calibrate_voltage":
        schema |= {
            vol.Required("session_id"): _ID,
            vol.Required("group_key"): _ID,
            vol.Required("reference"): vol.Coerce(float),
            vol.Optional("confirm_iteration", default=False): bool,
        }
    elif operation == "calibrate_current":
        schema |= {
            vol.Required("session_id"): _ID,
            vol.Required("channel"): vol.All(int, vol.Range(min=1, max=42)),
            vol.Required("reference"): vol.Coerce(float),
            vol.Optional("confirm_iteration", default=False): bool,
        }
    elif operation in {
        "get_session",
        "restart_and_verify",
        "cancel_session",
        "subscribe_session",
    }:
        schema[vol.Required("session_id")] = _ID
    return schema


def sanitize_payload(value: Any, *, _depth: int = 0, _field: str = "") -> Any:
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
        return sanitize_payload(value.value, _depth=_depth + 1, _field=_field)
    if isinstance(value, str):
        if _FORBIDDEN_VALUE.search(value):
            return "<redacted>"
        if ("\n" in value or "\r" in value) and _field != "redacted_diff":
            return "<redacted>"
        encoded = value.encode()[:_MAX_STRING_BYTES]
        return encoded.decode("utf-8", "ignore")
    if is_dataclass(value) and not isinstance(value, type):
        value = _dataclass_mapping(value)
    if isinstance(value, Mapping):
        result: dict[str, Any] = {}
        for key, item in list(value.items())[:_MAX_ITEMS]:
            if (
                not isinstance(key, str)
                or len(key) > 128
                or key.casefold() in {"entity_key", "key", "raw_key"}
                or _FORBIDDEN_KEY.search(key)
            ):
                continue
            result[key] = sanitize_payload(item, _depth=_depth + 1, _field=key)
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


def _dataclass_mapping(value: Any) -> dict[str, Any]:
    return {field.name: getattr(value, field.name) for field in fields(value)}


def _check_payload_size(value: Any) -> None:
    if (
        len(json.dumps(value, separators=(",", ":"), default=str).encode())
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
    elif isinstance(error, KeyError | ResourceNotFound):
        code, message = "not_found", "The requested resource was not found"
    elif isinstance(error, CalibrationBusyError):
        code, message = "device_busy", "The selected meter is busy"
    elif isinstance(error, ValueError | vol.Invalid):
        code, message = "invalid_request", "The request is invalid"
    else:
        code, message = "operation_failed", "The request could not be completed"
    connection.send_error(msg_id, code, message)
