"""CircuitSetup Energy Meter Helper integration."""

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import CONF_ESPHOME_ENTRY_ID, DOMAIN
from .esphome_api import ESPHomeApiSession
from .provisioning import ProvisioningCoordinator


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the helper config entry."""
    coordinator = ProvisioningCoordinator(hass)
    await coordinator.async_start()
    runtime: dict[str, Any] = {"provisioning": coordinator}
    if esphome_entry_id := getattr(entry, "data", {}).get(CONF_ESPHOME_ENTRY_ID):
        runtime["esphome_api"] = ESPHomeApiSession(hass, esphome_entry_id)
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = runtime
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the helper config entry."""
    domain_data = hass.data[DOMAIN]
    data = domain_data.get(entry.entry_id)
    if data is not None:
        try:
            if api_session := data.get("esphome_api"):
                await api_session.async_shutdown()
        finally:
            await data["provisioning"].async_stop()
        if domain_data.get(entry.entry_id) is data:
            domain_data.pop(entry.entry_id)
    return True
