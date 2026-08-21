"""Installer guidance and compatible ESPHome device discovery."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.config_entries import SIGNAL_CONFIG_ENTRY_CHANGED, ConfigEntryChange
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .models import SetupState

ESP_WEB_INSTALLER_URL = "https://circuitsetup.github.io/ESPWebInstaller/"
ADDON_JUMPER_PINS = (
    (0, 16),
    (27, 17),
    (2, 21),
    (13, 22),
    (14, 25),
    (15, 26),
)
BASE_PROJECT = "circuitsetup.6c-energy-meter"


@dataclass(slots=True, frozen=True)
class DiscoveredDevice:
    """A compatible ESPHome device, before Device Builder adoption."""

    entry_id: str
    title: str
    project_name: str
    importable: bool = False
    configuration: str | None = None


@dataclass(slots=True, frozen=True)
class ProvisioningSnapshot:
    """Current discovery state sent to panel subscribers."""

    state: SetupState
    devices: tuple[DiscoveredDevice, ...]
    configuration_authoritative: bool = False


def _project_name(entry: Any) -> str | None:
    """Read the runtime ESPHome project identity without name-based guessing."""
    runtime_data = getattr(entry, "runtime_data", None)
    device_info = getattr(runtime_data, "device_info", None)
    return getattr(device_info, "project_name", None)


class ProvisioningCoordinator:
    """Guide installation, then discover compatible ESPHome config entries."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass
        self._subscribers: set[Callable[[ProvisioningSnapshot], None]] = set()
        self._refresh_task: asyncio.Task[None] | None = None
        self._unsub_config_entries: Callable[[], None] | None = None
        self.snapshot = ProvisioningSnapshot(SetupState.NO_DEVICE, ())

    async def async_start(self) -> None:
        """Subscribe to ESPHome entry lifecycle changes and publish the initial scan."""
        self._unsub_config_entries = async_dispatcher_connect(
            self._hass, SIGNAL_CONFIG_ENTRY_CHANGED, self._async_entry_changed
        )
        await self.async_rescan()

    async def async_stop(self) -> None:
        """Unsubscribe and cancel a pending debounced refresh."""
        if self._unsub_config_entries is not None:
            self._unsub_config_entries()
            self._unsub_config_entries = None
        if self._refresh_task is not None:
            self._refresh_task.cancel()
            self._refresh_task = None

    def subscribe(
        self, callback: Callable[[ProvisioningSnapshot], None]
    ) -> Callable[[], None]:
        """Subscribe to new discovery snapshots."""
        self._subscribers.add(callback)
        return lambda: self._subscribers.discard(callback)

    async def async_begin_discovery(self) -> ProvisioningSnapshot:
        """Enter discovery waiting state without claiming installer completion."""
        self.snapshot = ProvisioningSnapshot(SetupState.WAITING_FOR_DISCOVERY, ())
        self._publish()
        return self.snapshot

    async def async_rescan(self) -> ProvisioningSnapshot:
        """Report compatible ESPHome devices; this never polls USB."""
        devices = tuple(
            DiscoveredDevice(entry.entry_id, entry.title, project_name)
            for entry in self._hass.config_entries.async_entries("esphome")
            if (project_name := _project_name(entry))
            and project_name.startswith(BASE_PROJECT)
        )
        state = (
            SetupState.DEVICE_DISCOVERED
            if devices
            else (
                SetupState.WAITING_FOR_DISCOVERY
                if self.snapshot.state == SetupState.WAITING_FOR_DISCOVERY
                else SetupState.NO_DEVICE
            )
        )
        self.snapshot = ProvisioningSnapshot(state, devices)
        self._publish()
        return self.snapshot

    @callback
    def _async_entry_changed(
        self, change: ConfigEntryChange, entry: Any
    ) -> None:
        """Debounce ESPHome add, update, reload, and remove notifications."""
        if entry.domain != "esphome":
            return
        del change
        if self._refresh_task is None or self._refresh_task.done():
            self._refresh_task = self._hass.async_create_task(
                self._async_debounced_rescan()
            )

    async def _async_debounced_rescan(self) -> None:
        """Collapse same-loop lifecycle bursts into one scan."""
        await asyncio.sleep(0)
        await self.async_rescan()

    @callback
    def _publish(self) -> None:
        """Deliver the latest immutable snapshot to registered subscribers."""
        for subscriber in self._subscribers:
            subscriber(self.snapshot)
