"""Installer guidance and compatible ESPHome device discovery."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass
from typing import Any

from homeassistant.config_entries import SIGNAL_CONFIG_ENTRY_CHANGED, ConfigEntryChange
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .models import InstallerIntent, SetupState
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
    project_version: str | None = None
    importable: bool | None = None
    configuration: str | None = None


@dataclass(slots=True, frozen=True)
class DeviceBuilderStatus:
    """Current cached Device Builder state for one ESPHome entry."""

    importable: bool | None
    configuration: str | None


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


def _project_version(entry: Any) -> str | None:
    """Read ESPHome's approved runtime project version metadata."""
    runtime_data = getattr(entry, "runtime_data", None)
    device_info = getattr(runtime_data, "device_info", None)
    version = getattr(device_info, "project_version", None)
    return version if isinstance(version, str) else None


def device_builder_status(
    entry: Any, listing: Mapping[str, Any] | None
) -> DeviceBuilderStatus:
    """Match one ESPHome entry to the current Device Builder listing."""
    if listing is None:
        return DeviceBuilderStatus(None, None)
    device_name = getattr(entry, "data", {}).get("device_name")

    def matches(items: Any) -> list[Mapping[str, Any]]:
        return [
            item
            for item in items
            if isinstance(item, Mapping)
            and (device_name is None or item.get("name") == device_name)
        ]

    configured = [
        item
        for item in matches(listing.get("configured", ()))
        if isinstance(item.get("configuration"), str)
    ]
    if len(configured) == 1:
        return DeviceBuilderStatus(False, str(configured[0]["configuration"]))
    if len(configured) > 1:
        return DeviceBuilderStatus(None, None)
    return DeviceBuilderStatus(bool(matches(listing.get("importable", ()))), None)


class ProvisioningCoordinator:
    """Guide installation, then discover compatible ESPHome config entries."""

    def __init__(
        self,
        hass: HomeAssistant,
        status_resolver: Callable[[Any], DeviceBuilderStatus] | None = None,
        *,
        listing_reader: Callable[
            [], Awaitable[Mapping[str, Any] | None]
        ] | None = None,
    ) -> None:
        self._hass = hass
        self._status_resolver = status_resolver
        self._listing_reader = listing_reader
        self._subscribers: set[Callable[[ProvisioningSnapshot], None]] = set()
        self._refresh_task: asyncio.Task[None] | None = None
        self._unsub_config_entries: Callable[[], None] | None = None
        self.snapshot = ProvisioningSnapshot(SetupState.NO_DEVICE, ())
        self.installer_intent: InstallerIntent | None = None

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
        self._subscribers.clear()

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

    async def async_set_installer_intent(
        self, intent: InstallerIntent
    ) -> ProvisioningSnapshot:
        """Remember the validated installer choice without claiming a flash."""
        self.installer_intent = intent
        self.snapshot = ProvisioningSnapshot(SetupState.INSTALLER_GUIDE, ())
        self._publish()
        return self.snapshot

    async def async_rescan(self) -> ProvisioningSnapshot:
        """Report compatible ESPHome devices; this never polls USB."""
        listing = await self._listing_reader() if self._listing_reader else None
        devices = tuple(
            self._device(entry, project_name, listing)
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

    def _device(
        self, entry: Any, project_name: str, listing: Mapping[str, Any] | None
    ) -> DiscoveredDevice:
        """Combine a compatible runtime identity with cached backend state."""
        status = (
            self._status_resolver(entry)
            if self._status_resolver is not None
            else device_builder_status(entry, listing)
        )
        return DiscoveredDevice(
            entry.entry_id,
            entry.title,
            project_name,
            _project_version(entry),
            status.importable,
            status.configuration,
        )

    @callback
    def _async_entry_changed(self, change: ConfigEntryChange, entry: Any) -> None:
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
