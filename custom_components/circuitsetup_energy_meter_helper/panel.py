"""Home Assistant custom-panel registration for the bundled Lit application."""

from __future__ import annotations

from hashlib import sha256
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import INTEGRATION_NAME, PANEL_URL_PATH

PANEL_ELEMENT = "circuitsetup-energy-meter-helper-panel"
_BUNDLE_NAME = f"{PANEL_URL_PATH}-panel.js"
_STATIC_URL = f"/{PANEL_URL_PATH}-static"
_BUNDLE_PATH = Path(__file__).parent / "frontend" / _BUNDLE_NAME


async def async_register_panel(
    hass: HomeAssistant, entry_id: str, *, bundle_path: Path = _BUNDLE_PATH
) -> None:
    """Serve and register the one stable local bundle with content cache busting."""
    bundle = await hass.async_add_executor_job(bundle_path.read_bytes)
    version = sha256(bundle).hexdigest()[:16]
    await hass.http.async_register_static_paths(
        [StaticPathConfig(_STATIC_URL, str(bundle_path.parent), True)]
    )
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_ELEMENT,
        sidebar_title=INTEGRATION_NAME,
        sidebar_icon="mdi:meter-electric-outline",
        module_url=f"{_STATIC_URL}/{_BUNDLE_NAME}?v={version}",
        config={"entry_id": entry_id},
        require_admin=True,
        config_panel_domain="circuitsetup_energy_meter_helper",
    )


def async_unregister_panel(hass: HomeAssistant) -> None:
    """Remove the exact panel route; the immutable static handler is harmless."""
    frontend.async_remove_panel(hass, PANEL_URL_PATH)
