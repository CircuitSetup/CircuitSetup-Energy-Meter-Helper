"""CircuitSetup Energy Meter Helper integration."""

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .config_transaction import ConfigTransactionManager
from .const import CONF_ESPHOME_ENTRY_ID, DOMAIN
from .esphome_api import ESPHomeApiSession
from .provisioning import ProvisioningCoordinator
from .session_manager import SessionManager
from .store import HelperStore
from .websocket_api import (
    EntryWebsocketController,
    async_register_entry,
    async_unregister_entry,
)
from .workflow import EntryWorkflow, create_device_builder


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the helper config entry."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if entry.entry_id in domain_data:
        return True
    coordinator = ProvisioningCoordinator(hass)
    await coordinator.async_start()
    sessions = SessionManager()
    store = HelperStore(hass)
    esphome_entry_id = getattr(entry, "data", {}).get(CONF_ESPHOME_ENTRY_ID)
    api_session = (
        ESPHomeApiSession(hass, esphome_entry_id) if esphome_entry_id else None
    )
    device_builder = create_device_builder(hass)
    workflow = EntryWorkflow(
        hass,
        coordinator,
        sessions,
        store,
        esphome_entry_id,
        api_session,
        device_builder,
    )
    transactions = (
        ConfigTransactionManager(device_builder, workflow, store, sessions)
        if device_builder is not None and api_session is not None
        else None
    )
    workflow.transactions = transactions
    controller = EntryWebsocketController(coordinator, sessions, store)
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
    }
    if api_session is not None:
        runtime["esphome_api"] = api_session
    domain_data[entry.entry_id] = runtime
    async_register_entry(hass, entry.entry_id, controller)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the helper config entry."""
    domain_data = hass.data.get(DOMAIN, {})
    data = domain_data.get(entry.entry_id)
    if data is not None:
        errors: list[BaseException] = []
        try:
            try:
                async_unregister_entry(hass, entry.entry_id)
            except BaseException as error:  # noqa: BLE001 - finish teardown
                errors.append(error)
            try:
                if controller := data.get("websocket_controller"):
                    await controller.async_close()
            except BaseException as error:  # noqa: BLE001 - finish teardown
                errors.append(error)
            if api_session := data.get("esphome_api"):
                try:
                    await api_session.async_shutdown()
                except BaseException as error:  # noqa: BLE001 - finish teardown
                    errors.append(error)
        finally:
            try:
                await data["provisioning"].async_stop()
            except BaseException as error:  # noqa: BLE001 - scrub before reporting
                errors.append(error)
            finally:
                data.clear()
                if domain_data.get(entry.entry_id) is data:
                    domain_data.pop(entry.entry_id)
        if errors:
            raise BaseExceptionGroup("integration unload failed", errors)
    return True
