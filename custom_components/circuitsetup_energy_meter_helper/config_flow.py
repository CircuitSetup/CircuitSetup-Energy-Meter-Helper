"""Configuration flow for CircuitSetup Energy Meter Helper."""

from typing import Any

import voluptuous as vol
from aiohasupervisor import SupervisorError
from aiohasupervisor.models.addons import InstalledAddonComplete
from homeassistant import config_entries
from homeassistant.config_entries import ConfigFlowResult
from homeassistant.core import callback

from .const import (
    CONF_DEVICE_BUILDER_SLUG,
    CONF_ESPHOME_ENTRY_ID,
    DOMAIN,
    INTEGRATION_NAME,
    SETUP_LATER,
)
from .workflow import async_installed_device_builders


def _builder_schema(
    installed: dict[str, InstalledAddonComplete], selected: str | None = None
) -> vol.Schema:
    labels = {
        slug: f"{addon.name} — {addon.version} ({addon.state})"
        for slug, addon in installed.items()
    }
    field = vol.Required(
        CONF_DEVICE_BUILDER_SLUG,
        default=selected if selected in labels else vol.UNDEFINED,
    )
    return vol.Schema({field: vol.In(labels)})


class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for the helper."""

    VERSION = 1

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        return OptionsFlow()

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
            self._data = {
                CONF_ESPHOME_ENTRY_ID: None if selected == SETUP_LATER else selected
            }
            return await self.async_step_device_builder()

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {vol.Required(CONF_ESPHOME_ENTRY_ID): vol.In(options)}
            ),
        )

    async def async_step_device_builder(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ask which installed channel to use when discovery is ambiguous."""
        try:
            installed = await async_installed_device_builders(self.hass)
        except SupervisorError:
            return self.async_show_form(
                step_id="device_builder",
                data_schema=vol.Schema({}),
                errors={"base": "cannot_connect"},
            )
        if not installed:
            return await self.async_step_no_device_builder()
        if len(installed) == 1 and not user_input:
            return self.async_create_entry(title=INTEGRATION_NAME, data=self._data)
        errors = {}
        if user_input:
            selected = user_input.get(CONF_DEVICE_BUILDER_SLUG)
            if selected in installed:
                return self.async_create_entry(
                    title=INTEGRATION_NAME,
                    data=self._data,
                    options={CONF_DEVICE_BUILDER_SLUG: selected},
                )
            errors["base"] = "device_builder_not_installed"
        return self.async_show_form(
            step_id="device_builder",
            data_schema=_builder_schema(installed),
            errors=errors,
        )

    async def async_step_no_device_builder(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show installation guidance, then retry discovery or explicitly skip."""
        if user_input is not None:
            if user_input.get("continue_without_builder") is True:
                return self.async_create_entry(title=INTEGRATION_NAME, data=self._data)
            return await self.async_step_device_builder()
        return self.async_show_form(
            step_id="no_device_builder",
            data_schema=vol.Schema(
                {vol.Optional("continue_without_builder", default=False): bool}
            ),
        )


class OptionsFlow(config_entries.OptionsFlowWithReload):
    """Choose the builder for all configuration, compile, and upload operations."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        try:
            installed = await async_installed_device_builders(self.hass)
        except SupervisorError:
            return self.async_show_form(
                step_id="init",
                data_schema=vol.Schema({}),
                errors={"base": "cannot_connect"},
            )
        if not installed:
            return self.async_abort(reason="no_device_builder")
        errors = {}
        if user_input:
            selected = user_input.get(CONF_DEVICE_BUILDER_SLUG)
            if selected in installed:
                return self.async_create_entry(
                    title="",
                    data={
                        **self.config_entry.options,
                        CONF_DEVICE_BUILDER_SLUG: selected,
                    },
                )
            errors["base"] = "device_builder_not_installed"
        return self.async_show_form(
            step_id="init",
            data_schema=_builder_schema(
                installed, self.config_entry.options.get(CONF_DEVICE_BUILDER_SLUG)
            ),
            errors=errors,
        )
