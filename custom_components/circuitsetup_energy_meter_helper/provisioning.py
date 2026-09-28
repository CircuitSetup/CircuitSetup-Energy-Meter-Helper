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
from .topology import is_supported_project

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
class ExistingDeviceCandidate:
    """A safe identity-only candidate for the explicit inspection action."""

    entry_id: str
    title: str
    project_name: str | None
    project_version: str | None = None
    compatibility: tuple[str, ...] = ()


@dataclass(slots=True, frozen=True)
class DeviceBuilderStatus:
    """Current cached Device Builder state for one ESPHome entry."""

    importable: bool | None
    configuration: str | None
    import_data: dict[str, str] | None = None
    friendly_name: str | None = None


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
    project_name = getattr(device_info, "project_name", None)
    return (
        project_name
        if isinstance(project_name, str) and project_name.strip()
        else None
    )


def _project_version(entry: Any) -> str | None:
    """Read ESPHome's approved runtime project version metadata."""
    runtime_data = getattr(entry, "runtime_data", None)
    device_info = getattr(runtime_data, "device_info", None)
    version = getattr(device_info, "project_version", None)
    return version if isinstance(version, str) else None


def _runtime_name(entry: Any) -> str | None:
    """Read ESPHome's current friendly name when the runtime provides one."""
    name = getattr(
        getattr(getattr(entry, "runtime_data", None), "device_info", None),
        "name",
        None,
    )
    return name if isinstance(name, str) and name.strip() else None


def _mac_key(value: Any) -> str | None:
    """Normalize a MAC address for identity matching."""
    if not isinstance(value, str):
        return None
    compact = value.replace(":", "").replace("-", "")
    return (
        compact.lower()
        if len(compact) == 12 and set(compact.lower()) <= set("0123456789abcdef")
        else None
    )


def _friendly_name(item: Mapping[str, Any]) -> str | None:
    value = item.get("friendly_name")
    return value.strip() if isinstance(value, str) and value.strip() else None


def device_builder_status(
    entry: Any, listing: Mapping[str, Any] | None, *, strict: bool = False
) -> DeviceBuilderStatus:
    """Match one ESPHome entry to the current Device Builder listing."""
    if listing is None:
        return DeviceBuilderStatus(None, None)
    configured_name = getattr(entry, "data", {}).get("device_name")
    entry_data = getattr(entry, "data", {})
    entry_mac = _mac_key(getattr(entry, "unique_id", None))
    entry_host = entry_data.get("host")
    configuration_name = (
        f"{configured_name}.yaml"
        if isinstance(configured_name, str) and configured_name.strip()
        else None
    )
    names = tuple(
        dict.fromkeys(
            name
            for name in (configured_name, _runtime_name(entry))
            if isinstance(name, str) and name.strip()
        )
    )
    if strict and not (names or entry_mac or isinstance(entry_host, str)):
        return DeviceBuilderStatus(None, None)

    def item_macs(item: Mapping[str, Any]) -> tuple[str, ...]:
        return tuple(
            mac
            for key in ("mac_address", "ethernet_mac", "bluetooth_mac")
            if (mac := _mac_key(item.get(key))) is not None
        )

    has_mac_match = bool(entry_mac) and any(
        entry_mac in item_macs(item)
        for section in ("configured", "importable")
        for item in listing.get(section, ())
        if isinstance(item, Mapping)
    )

    def matches(items: Any) -> list[Mapping[str, Any]]:
        candidates = [item for item in items if isinstance(item, Mapping)]
        if entry_mac:
            mac_matches = [item for item in candidates if entry_mac in item_macs(item)]
            if has_mac_match:
                return mac_matches
            candidates = [item for item in candidates if not item_macs(item)]

        matched: list[Mapping[str, Any]] = []
        for item in candidates:
            if not names and not entry_mac and not isinstance(entry_host, str):
                matched.append(item)
                continue
            if item.get("name") in names or item.get("configuration") == configuration_name:
                matched.append(item)
                continue
            if isinstance(entry_host, str) and entry_host in {
                item.get("ip"),
                item.get("address"),
            }:
                matched.append(item)
        return matched

    configured = [
        item
        for item in matches(listing.get("configured", ()))
        if isinstance(item.get("configuration"), str)
        and bool(item["configuration"].strip())
    ]
    if len(configured) == 1:
        return DeviceBuilderStatus(
            False,
            str(configured[0]["configuration"]),
            friendly_name=_friendly_name(configured[0]),
        )
    if len(configured) > 1:
        return DeviceBuilderStatus(None, None)
    importable = matches(listing.get("importable", ()))
    import_data = None
    if len(importable) == 1:
        candidate = {
            key: value
            for key in ("name", "friendly_name", "project_name", "package_import_url")
            if isinstance((value := importable[0].get(key)), str)
        }
        if {"name", "package_import_url"} <= candidate.keys():
            import_data = candidate
    return DeviceBuilderStatus(
        bool(importable),
        None,
        import_data,
        friendly_name=_friendly_name(importable[0]) if len(importable) == 1 else None,
    )


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
            and is_supported_project(project_name)
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

    async def async_list_existing_meters(
        self, exclude_device_id: str | None = None, after_entry_id: str | None = None
    ) -> tuple[ExistingDeviceCandidate, ...]:
        """List a bounded page of ESPHome identities in stable entry-ID order."""
        return tuple(
            existing_device_candidate(entry)
            for entry in sorted(
                self._hass.config_entries.async_entries("esphome"),
                key=lambda item: str(getattr(item, "entry_id", "")),
            )
            if getattr(entry, "entry_id", None) != exclude_device_id
            and (after_entry_id is None or entry.entry_id > after_entry_id)
        )[:32]

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
            status.friendly_name or _runtime_name(entry) or entry.title,
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


def existing_device_candidate(entry: Any) -> ExistingDeviceCandidate:
    """Return bounded identity and non-authoritative compatibility hints."""
    project_name = _project_name(entry)
    if project_name is None:
        compatibility = ("project_label_missing",)
    elif is_supported_project(project_name):
        compatibility = ("official_project",)
    else:
        compatibility = ("custom_or_older_project",)
    return ExistingDeviceCandidate(
        str(getattr(entry, "entry_id", "")),
        _runtime_name(entry) or str(getattr(entry, "title", "")),
        project_name,
        _project_version(entry),
        compatibility,
    )
