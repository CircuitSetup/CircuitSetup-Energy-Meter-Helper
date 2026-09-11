"""Tests for the initial helper configuration flow."""

import asyncio
from dataclasses import dataclass
from types import SimpleNamespace

import pytest
from aiohasupervisor import SupervisorError
from homeassistant.data_entry_flow import FlowResultType
import voluptuous as vol

from custom_components.circuitsetup_energy_meter_helper import config_flow
from custom_components.circuitsetup_energy_meter_helper.config_flow import ConfigFlow
from custom_components.circuitsetup_energy_meter_helper.const import (
    CONF_ESPHOME_ENTRY_ID,
    SETUP_LATER,
)


@dataclass
class FakeEntry:
    """The part of an ESPHome entry used by the first setup form."""

    entry_id: str
    title: str


class FakeConfigEntries:
    """Minimal config-entry lookup for the form test."""

    def __init__(self, entry: FakeEntry) -> None:
        self._entry = entry

    def async_entries(
        self, domain: str, include_ignore: bool = False
    ) -> list[FakeEntry]:
        """Return only the ESPHome entry requested by the form."""
        del include_ignore
        return [self._entry] if domain == "esphome" else []


class FakeHass:
    """Minimal Home Assistant surface used by this first form."""

    def __init__(self, entry: FakeEntry) -> None:
        self.config_entries = FakeConfigEntries(entry)
        self.data = {}


def test_user_flow_lists_esphome_entries() -> None:
    """The helper starts with a device-or-later choice."""
    entry = FakeEntry("meter-entry", "Meter")
    flow = ConfigFlow()
    flow.hass = FakeHass(entry)  # type: ignore[assignment]

    result = asyncio.run(flow.async_step_user())

    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "user"
    assert result["data_schema"]({"esphome_entry_id": entry.entry_id}) == {
        "esphome_entry_id": entry.entry_id
    }


def test_user_flow_allows_setup_later() -> None:
    """The user can create the single helper entry before choosing a meter."""
    flow = ConfigFlow()
    flow.hass = FakeHass(FakeEntry("meter-entry", "Meter"))  # type: ignore[assignment]

    result = asyncio.run(flow.async_step_user({CONF_ESPHOME_ENTRY_ID: SETUP_LATER}))

    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "no_device_builder"
    assert result["description_placeholders"] == {
        "installation_url": "https://esphome.io/install/"
    }
    result = asyncio.run(
        flow.async_step_no_device_builder({"continue_without_builder": True})
    )
    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["data"] == {CONF_ESPHOME_ENTRY_ID: None}


def test_missing_builder_setup_retries_discovery_after_install(monkeypatch):
    """The installation screen rechecks apps without losing the chosen meter."""
    installed = {}

    async def discover(hass):
        return installed

    monkeypatch.setattr(config_flow, "async_installed_device_builders", discover)

    async def run():
        flow = ConfigFlow()
        flow.hass = FakeHass(FakeEntry("meter-entry", "Meter"))
        result = await flow.async_step_user({CONF_ESPHOME_ENTRY_ID: "meter-entry"})
        assert result["step_id"] == "no_device_builder"
        result = await flow.async_step_no_device_builder({})
        assert result["step_id"] == "no_device_builder"
        installed["5c53de3b_esphome-dev"] = SimpleNamespace(
            name="ESPHome Device Builder (dev)", version="2026.9.0-dev", state="started"
        )
        result = await flow.async_step_no_device_builder({})
        assert result["type"] == FlowResultType.CREATE_ENTRY
        assert result["data"] == {CONF_ESPHOME_ENTRY_ID: "meter-entry"}

    asyncio.run(run())


@pytest.mark.parametrize("multiple", [False, True])
def test_setup_selects_builder_only_when_multiple_installed(monkeypatch, multiple):
    """Setup saves an explicit channel only when a choice is needed."""

    async def discover(hass):
        installed = {
            "5c53de3b_esphome-dev": SimpleNamespace(
                name="ESPHome Device Builder (dev)",
                version="2026.9.0-dev",
                state="started",
            )
        }
        if multiple:
            installed["5c53de3b_esphome"] = SimpleNamespace(
                name="ESPHome Device Builder", version="2026.8.0", state="started"
            )
        return installed

    monkeypatch.setattr(
        config_flow, "async_installed_device_builders", discover, raising=False
    )

    async def run():
        flow = ConfigFlow()
        flow.hass = FakeHass(FakeEntry("meter-entry", "Meter"))
        result = await flow.async_step_user({CONF_ESPHOME_ENTRY_ID: "meter-entry"})
        if multiple:
            assert result["type"] == FlowResultType.FORM
            assert result["step_id"] == "device_builder"
            with pytest.raises(vol.Invalid):
                result["data_schema"]({"device_builder_slug": "untrusted"})
            result = await flow.async_step_device_builder(
                {"device_builder_slug": "5c53de3b_esphome-dev"}
            )
            assert result["options"] == {"device_builder_slug": "5c53de3b_esphome-dev"}
        assert result["type"] == FlowResultType.CREATE_ENTRY
        assert result["data"][CONF_ESPHOME_ENTRY_ID] == "meter-entry"

    asyncio.run(run())


@pytest.mark.parametrize("mode", ["select", "missing", "offline"])
def test_options_builder_choice_and_discovery_failures(monkeypatch, mode):
    """Options persist an installed choice, reject stale choices, and allow retry."""

    async def discover(hass):
        if mode == "offline":
            raise SupervisorError("offline")
        return (
            {}
            if mode == "missing"
            else {
                "5c53de3b_esphome-dev": SimpleNamespace(
                    name="ESPHome Device Builder (dev)",
                    version="2026.9.0-dev",
                    state="stopped",
                )
            }
        )

    monkeypatch.setattr(
        config_flow, "async_installed_device_builders", discover, raising=False
    )

    async def run():
        entry = SimpleNamespace(
            options={"device_builder_slug": "5c53de3b_esphome", "unrelated": True}
        )
        flow = ConfigFlow.async_get_options_flow(entry)
        flow.hass = FakeHass(FakeEntry("meter-entry", "Meter"))
        flow.hass.config_entries.async_get_known_entry = lambda _: entry
        flow.handler = "helper"
        result = await flow.async_step_init()
        if mode == "missing":
            assert result["type"] == FlowResultType.ABORT
            assert result["reason"] == "no_device_builder"
            assert result["description_placeholders"] == {
                "installation_url": "https://esphome.io/install/"
            }
        elif mode == "offline":
            assert result["type"] == FlowResultType.FORM
            assert result["errors"] == {"base": "cannot_connect"}
        else:
            assert result["type"] == FlowResultType.FORM
            result = await flow.async_step_init({"device_builder_slug": "untrusted"})
            assert result["errors"] == {"base": "device_builder_not_installed"}
            result = await flow.async_step_init(
                {"device_builder_slug": "5c53de3b_esphome-dev"}
            )
            assert result["type"] == FlowResultType.CREATE_ENTRY
            assert result["data"] == {
                "device_builder_slug": "5c53de3b_esphome-dev",
                "unrelated": True,
            }
            assert flow.automatic_reload

    asyncio.run(run())
