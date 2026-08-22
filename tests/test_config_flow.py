"""Tests for the initial helper configuration flow."""

import asyncio
from dataclasses import dataclass

from homeassistant.data_entry_flow import FlowResultType

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

    result = asyncio.run(
        flow.async_step_user({CONF_ESPHOME_ENTRY_ID: SETUP_LATER})
    )

    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["data"] == {CONF_ESPHOME_ENTRY_ID: None}
