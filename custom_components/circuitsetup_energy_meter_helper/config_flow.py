"""Configuration flow for CircuitSetup Energy Meter Helper."""

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.config_entries import ConfigFlowResult

from .const import CONF_ESPHOME_ENTRY_ID, DOMAIN, INTEGRATION_NAME, SETUP_LATER


class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for the helper."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Choose an existing ESPHome device or defer selection."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        entries = self.hass.config_entries.async_entries("esphome")
        options = {entry.entry_id: entry.title for entry in entries}
        options[SETUP_LATER] = "Set up later"

        if user_input is not None:
            selected = user_input[CONF_ESPHOME_ENTRY_ID]
            return self.async_create_entry(
                title=INTEGRATION_NAME,
                data={
                    CONF_ESPHOME_ENTRY_ID: (
                        None if selected == SETUP_LATER else selected
                    )
                },
            )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {vol.Required(CONF_ESPHOME_ENTRY_ID): vol.In(options)}
            ),
        )
