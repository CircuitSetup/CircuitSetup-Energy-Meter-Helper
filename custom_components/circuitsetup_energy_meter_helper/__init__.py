"""CircuitSetup Energy Meter Helper integration lifecycle."""

from __future__ import annotations

import asyncio
from typing import Any

from aiohasupervisor import SupervisorError
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady

from .config_transaction import ConfigTransactionManager
from .const import CONF_ESPHOME_ENTRY_ID, DATA_PANEL_REBIND_ENTRY_ID, DOMAIN
from .ct_catalog import CTPresetCatalog
from .device_builder import _wait_for_owned_cleanup
from .diagnostics import async_get_config_entry_diagnostics
from .esphome_api import ESPHomeApiSession
from .offset_recovery import OffsetRecovery
from .panel import async_register_panel, async_unregister_panel
from .provisioning import ProvisioningCoordinator
from .session_manager import SessionManager
from .store import HelperStore
from .websocket_api import (
    EntryWebsocketController,
    async_register_entry,
    async_unregister_entry,
)
from .workflow import EntryWorkflow, LazyDeviceBuilder, create_device_builder


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the helper config entry and unwind every pre-publish owner on failure."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if entry.entry_id in domain_data:
        return True
    coordinator: ProvisioningCoordinator | None = None
    sessions: SessionManager | None = None
    api_session: ESPHomeApiSession | None = None
    device_builder: LazyDeviceBuilder | None = None
    workflow: EntryWorkflow | None = None
    controller: EntryWebsocketController | None = None
    registered = False
    panel_registered = False
    try:
        await asyncio.to_thread(CTPresetCatalog.load)

        async def current_device_builder_listing() -> dict[str, Any] | None:
            return (
                await device_builder.async_list_devices()
                if device_builder is not None
                else None
            )

        coordinator = ProvisioningCoordinator(
            hass, listing_reader=current_device_builder_listing
        )
        device_builder = await create_device_builder(hass)
        await coordinator.async_start()
        sessions = SessionManager()
        store = HelperStore(hass)
        offset_recovery = OffsetRecovery(hass, sessions)
        esphome_entry_id = getattr(entry, "data", {}).get(CONF_ESPHOME_ENTRY_ID)
        api_session = (
            ESPHomeApiSession(hass, esphome_entry_id) if esphome_entry_id else None
        )
        workflow = EntryWorkflow(
            hass,
            coordinator,
            sessions,
            store,
            esphome_entry_id,
            api_session,
            device_builder,
            offset_recovery=offset_recovery,
        )
        transactions = (
            ConfigTransactionManager(
                device_builder,
                workflow,
                store,
                sessions,
                offset_recovery=offset_recovery,
            )
            if device_builder is not None and api_session is not None
            else None
        )
        workflow.transactions = transactions
        controller = EntryWebsocketController(
            coordinator, sessions, store, esphome_entry_id=esphome_entry_id
        )
        controller.set_diagnostics_provider(
            lambda: async_get_config_entry_diagnostics(hass, entry)
        )
        controller.workflow = workflow
        controller.transactions = transactions
        runtime: dict[str, Any] = {
            "provisioning": coordinator,
            "sessions": sessions,
            "store": store,
            "workflow": workflow,
            "transactions": transactions,
            "device_builder": device_builder,
            "websocket_controller": controller,
            "diagnostics": controller.diagnostics,
        }
        if api_session is not None:
            runtime["esphome_api"] = api_session
        async_register_entry(hass, entry.entry_id, controller)
        registered = True
        if (
            getattr(hass, "http", None) is not None
            and domain_data.get(DATA_PANEL_REBIND_ENTRY_ID) != entry.entry_id
        ):
            await async_register_panel(hass, entry.entry_id)
            panel_registered = True
        domain_data[entry.entry_id] = runtime
        return True
    except BaseException as error:
        cleanup = asyncio.create_task(
            _async_cleanup_partial_setup(
                hass,
                entry.entry_id,
                coordinator,
                sessions,
                api_session,
                device_builder,
                workflow,
                controller,
                registered,
                panel_registered,
            )
        )
        try:
            cleanup_cancelled = await _wait_for_owned_cleanup(cleanup)
        except BaseException as cleanup_error:  # noqa: BLE001 - preserve root cause
            raise BaseExceptionGroup(
                "integration setup and cleanup failed", [error, cleanup_error]
            ) from error
        if cleanup_cancelled:
            raise asyncio.CancelledError
        if isinstance(error, SupervisorError):
            raise ConfigEntryNotReady(
                "ESPHome Device Builder discovery is temporarily unavailable"
            ) from error
        raise


async def _async_cleanup_partial_setup(
    hass: HomeAssistant,
    entry_id: str,
    coordinator: ProvisioningCoordinator | None,
    sessions: SessionManager | None,
    api_session: ESPHomeApiSession | None,
    device_builder: LazyDeviceBuilder | None,
    workflow: EntryWorkflow | None,
    controller: EntryWebsocketController | None,
    registered: bool,
    panel_registered: bool,
) -> None:
    errors: list[BaseException] = []
    if panel_registered:
        try:
            async_unregister_panel(hass)
        except BaseException as error:  # noqa: BLE001 - finish setup unwind
            errors.append(error)
    if registered:
        try:
            async_unregister_entry(hass, entry_id)
        except BaseException as error:  # noqa: BLE001 - finish setup unwind
            errors.append(error)
    if controller is not None:
        try:
            await controller.async_close()
        except BaseException as error:  # noqa: BLE001 - finish setup unwind
            errors.append(error)
    else:
        if workflow is not None:
            try:
                await workflow.async_close()
            except BaseException as error:  # noqa: BLE001 - finish setup unwind
                errors.append(error)
        elif device_builder is not None:
            try:
                await device_builder.async_close()
            except BaseException as error:  # noqa: BLE001 - finish setup unwind
                errors.append(error)
        if sessions is not None:
            try:
                await sessions.async_unload()
            except BaseException as error:  # noqa: BLE001 - finish setup unwind
                errors.append(error)
    if api_session is not None:
        try:
            await api_session.async_shutdown()
        except BaseException as error:  # noqa: BLE001 - finish setup unwind
            errors.append(error)
    if coordinator is not None:
        try:
            await coordinator.async_stop()
        except BaseException as error:  # noqa: BLE001 - finish setup unwind
            errors.append(error)
    if errors:
        raise BaseExceptionGroup("integration setup cleanup failed", errors)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the helper entry while retaining retryable cleanup ownership."""
    domain_data = hass.data.get(DOMAIN, {})
    data = domain_data.get(entry.entry_id)
    if data is None:
        try:
            async_unregister_entry(hass, entry.entry_id)
        except BaseException as error:
            raise BaseExceptionGroup("integration unload failed", [error]) from error
        return True
    task = data.get("_unload_task")
    if not isinstance(task, asyncio.Task) or (
        task.done() and (task.cancelled() or task.exception() is not None)
    ):
        if isinstance(task, asyncio.Task) and task.done() and not task.cancelled():
            task.exception()
        task = asyncio.create_task(_async_unload_owned(hass, entry.entry_id, data))
        data["_unload_task"] = task
    caller_cancelled = await _wait_for_owned_cleanup(task)
    data.clear()
    if domain_data.get(entry.entry_id) is data:
        domain_data.pop(entry.entry_id)
    if caller_cancelled:
        raise asyncio.CancelledError
    return True


async def _async_unload_owned(
    hass: HomeAssistant, entry_id: str, data: dict[str, Any]
) -> None:
    errors: list[BaseException] = []
    if (
        getattr(hass, "http", None) is not None
        and hass.data.get(DOMAIN, {}).get(DATA_PANEL_REBIND_ENTRY_ID) != entry_id
    ):
        try:
            async_unregister_panel(hass)
        except BaseException as error:  # noqa: BLE001 - finish teardown
            errors.append(error)
    try:
        async_unregister_entry(hass, entry_id)
    except BaseException as error:  # noqa: BLE001 - finish teardown
        errors.append(error)
    if controller := data.get("websocket_controller"):
        try:
            await controller.async_close()
        except BaseException as error:  # noqa: BLE001 - finish teardown
            errors.append(error)
    if api_session := data.get("esphome_api"):
        try:
            await api_session.async_shutdown()
        except BaseException as error:  # noqa: BLE001 - finish teardown
            errors.append(error)
    provisioning = data.get("provisioning")
    if provisioning is not None:
        try:
            await provisioning.async_stop()
        except BaseException as error:  # noqa: BLE001 - finish teardown
            errors.append(error)
    if errors:
        raise BaseExceptionGroup("integration unload failed", errors)
