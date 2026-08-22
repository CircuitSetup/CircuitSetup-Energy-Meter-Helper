"""CircuitSetup Energy Meter Helper integration."""

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

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


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the helper config entry."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if entry.entry_id in domain_data:
        return True
    coordinator = ProvisioningCoordinator(hass)
    await coordinator.async_start()
    sessions = SessionManager()
    store = HelperStore(hass)
    controller = EntryWebsocketController(coordinator, sessions, store)
    runtime: dict[str, Any] = {
        "provisioning": coordinator,
        "sessions": sessions,
        "store": store,
        "websocket_controller": controller,
    }
    if esphome_entry_id := getattr(entry, "data", {}).get(CONF_ESPHOME_ENTRY_ID):
        runtime["esphome_api"] = ESPHomeApiSession(hass, esphome_entry_id)
    domain_data[entry.entry_id] = runtime
    async_register_entry(hass, entry.entry_id, controller)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the helper config entry."""
    domain_data = hass.data.get(DOMAIN, {})
    data = domain_data.get(entry.entry_id)
    if data is not None:
        async_unregister_entry(hass, entry.entry_id)
        try:
            try:
                await data["websocket_controller"].async_close()
            finally:
                if api_session := data.get("esphome_api"):
                    await api_session.async_shutdown()
        finally:
            await data["provisioning"].async_stop()
        if domain_data.get(entry.entry_id) is data:
            domain_data.pop(entry.entry_id)
    return True
