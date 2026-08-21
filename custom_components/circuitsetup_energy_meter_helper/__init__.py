"""CircuitSetup Energy Meter Helper integration."""

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .provisioning import ProvisioningCoordinator


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the helper config entry."""
    coordinator = ProvisioningCoordinator(hass)
    await coordinator.async_start()
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {"provisioning": coordinator}
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the helper config entry."""
    data = hass.data[DOMAIN].pop(entry.entry_id, None)
    if data is not None:
        await data["provisioning"].async_stop()
    return True
