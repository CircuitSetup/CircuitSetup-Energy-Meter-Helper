"""Tests for installer guidance and ESPHome discovery."""

import asyncio
from dataclasses import dataclass
from types import SimpleNamespace

import pytest
from homeassistant.config_entries import SIGNAL_CONFIG_ENTRY_CHANGED, ConfigEntryChange
from homeassistant.helpers.dispatcher import async_dispatcher_send

from custom_components.circuitsetup_energy_meter_helper import async_setup_entry
from custom_components.circuitsetup_energy_meter_helper.models import (
    InstallerIntent,
    SetupState,
)
from custom_components.circuitsetup_energy_meter_helper.provisioning import (
    DeviceBuilderStatus,
    ProvisioningCoordinator,
)


@dataclass
class FakeDeviceInfo:
    """Runtime project identity supplied by ESPHome."""

    project_name: str
    project_version: str = "2026.8.0"


@dataclass
class FakeRuntimeData:
    """ESPHome runtime data used during discovery."""

    device_info: FakeDeviceInfo


@dataclass
class FakeEntry:
    """Minimal ESPHome config entry."""

    entry_id: str
    title: str
    runtime_data: FakeRuntimeData
    domain: str = "esphome"


@dataclass
class FakeHelperEntry:
    """Minimal helper entry used through the production setup function."""

    entry_id: str = "helper"


class FakeConfigEntries:
    """Mutable ESPHome entry collection."""

    def __init__(self) -> None:
        self.entries: list[FakeEntry] = []

    def async_entries(self, domain: str) -> list[FakeEntry]:
        return [entry for entry in self.entries if entry.domain == domain]


class FakeHass:
    """Minimal Home Assistant surface used by the coordinator."""

    def __init__(self) -> None:
        self.config_entries = FakeConfigEntries()
        self.config = SimpleNamespace(config_dir=".")
        self.data: dict[str, object] = {}

    def async_create_task(self, coroutine):
        return asyncio.create_task(coroutine)

    def verify_event_loop_thread(self, name: str) -> None:
        """Match Home Assistant's dispatcher check in the focused fake."""
        del name


@pytest.mark.parametrize("addon_count", range(7))
def test_installer_intent_accepts_supported_counts(addon_count: int) -> None:
    """Every supported board count has six CT channels per board."""
    intent = InstallerIntent(addon_count=addon_count, connection_type="wifi")

    assert intent.ct_count == 6 * (addon_count + 1)


@pytest.mark.parametrize("addon_count", (-1, 7))
def test_installer_intent_rejects_unsupported_count(addon_count: int) -> None:
    """The installer only supports the documented add-on range."""
    with pytest.raises(ValueError):
        InstallerIntent(addon_count=addon_count, connection_type="wifi")


def test_installer_intent_rejects_unsupported_connection() -> None:
    """Only the documented installer connection choices are accepted."""
    with pytest.raises(ValueError):
        InstallerIntent(addon_count=0, connection_type="serial")


def test_rescan_requires_circuitsetup_runtime_project_prefix() -> None:
    """ATM90E32-like names alone never classify a device as compatible."""

    async def run() -> None:
        hass = FakeHass()
        hass.config_entries.entries.extend(
            [
                FakeEntry(
                    "other",
                    "ATM90E32 meter",
                    FakeRuntimeData(FakeDeviceInfo("other.energy-meter")),
                ),
                FakeEntry(
                    "meter",
                    "CircuitSetup meter",
                    FakeRuntimeData(
                        FakeDeviceInfo("circuitsetup.6c-energy-meter-1-addon")
                    ),
                ),
            ]
        )
        snapshot = await ProvisioningCoordinator(hass).async_rescan()

        assert [device.entry_id for device in snapshot.devices] == ["meter"]
        assert snapshot.state == SetupState.DEVICE_DISCOVERED
        assert not snapshot.configuration_authoritative
        assert snapshot.devices[0].importable is None
        assert snapshot.devices[0].project_version == "2026.8.0"

    asyncio.run(run())


def test_production_setup_reports_unavailable_device_builder_state_as_unknown() -> None:
    """The real integration setup never claims unavailability as a false value."""

    async def run() -> None:
        hass = FakeHass()
        hass.config_entries.entries.append(
            FakeEntry(
                "meter",
                "CircuitSetup meter",
                FakeRuntimeData(FakeDeviceInfo("circuitsetup.6c-energy-meter")),
            )
        )

        assert await async_setup_entry(hass, FakeHelperEntry())
        coordinator = hass.data["circuitsetup_energy_meter_helper"]["helper"][
            "provisioning"
        ]

        assert coordinator.snapshot.devices[0].importable is None
        assert coordinator.snapshot.devices[0].configuration is None
        await coordinator.async_stop()

    asyncio.run(run())


def test_rescan_reports_configured_and_importable_device_builder_state() -> None:
    """Current backend state distinguishes configured and importable meters."""

    async def run() -> None:
        hass = FakeHass()
        hass.config_entries.entries.extend(
            [
                FakeEntry(
                    "configured",
                    "Configured meter",
                    FakeRuntimeData(FakeDeviceInfo("circuitsetup.6c-energy-meter")),
                ),
                FakeEntry(
                    "importable",
                    "Importable meter",
                    FakeRuntimeData(FakeDeviceInfo("circuitsetup.6c-energy-meter")),
                ),
            ]
        )
        states = {
            "configured": DeviceBuilderStatus(False, "configured-meter.yaml"),
            "importable": DeviceBuilderStatus(True, None),
        }
        snapshot = await ProvisioningCoordinator(
            hass, status_resolver=lambda entry: states[entry.entry_id]
        ).async_rescan()

        assert snapshot.devices[0].configuration == "configured-meter.yaml"
        assert not snapshot.devices[0].importable
        assert snapshot.devices[1].configuration is None
        assert snapshot.devices[1].importable

    asyncio.run(run())


def test_entry_addition_transitions_from_waiting_to_discovered() -> None:
    """A compatible ESPHome entry completes discovery without USB polling."""

    async def run() -> None:
        hass = FakeHass()
        coordinator = ProvisioningCoordinator(hass)

        assert coordinator.snapshot.state == SetupState.NO_DEVICE
        await coordinator.async_begin_discovery()
        assert coordinator.snapshot.state == SetupState.WAITING_FOR_DISCOVERY

        hass.config_entries.entries.append(
            FakeEntry(
                "meter",
                "CircuitSetup meter",
                FakeRuntimeData(FakeDeviceInfo("circuitsetup.6c-energy-meter")),
            )
        )
        snapshot = await coordinator.async_rescan()

        assert snapshot.state == SetupState.DEVICE_DISCOVERED

    asyncio.run(run())


def test_esphome_entry_signal_refreshes_discovery() -> None:
    """The coordinator refreshes after the ESPHome entry lifecycle signal."""

    async def run() -> None:
        hass = FakeHass()
        coordinator = ProvisioningCoordinator(hass)
        await coordinator.async_start()
        await coordinator.async_begin_discovery()
        entry = FakeEntry(
            "meter",
            "CircuitSetup meter",
            FakeRuntimeData(FakeDeviceInfo("circuitsetup.6c-energy-meter")),
        )
        hass.config_entries.entries.append(entry)

        async_dispatcher_send(
            hass, SIGNAL_CONFIG_ENTRY_CHANGED, ConfigEntryChange.ADDED, entry
        )
        await asyncio.sleep(0)
        await asyncio.sleep(0)

        assert coordinator.snapshot.state == SetupState.DEVICE_DISCOVERED
        await coordinator.async_stop()

    asyncio.run(run())
