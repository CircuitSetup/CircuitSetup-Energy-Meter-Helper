"""Tests for the isolated secondary ESPHome API connection."""

from __future__ import annotations

import asyncio
import sys
from collections.abc import Callable, Coroutine
from dataclasses import dataclass
from enum import IntEnum
from time import monotonic
from types import ModuleType, SimpleNamespace
from typing import Any

import pytest

try:
    from aioesphomeapi import (
        InvalidEncryptionKeyAPIError,
        LogLevel,
        RequiresEncryptionAPIError,
    )
except ModuleNotFoundError:

    class LogLevel(IntEnum):
        LOG_LEVEL_NONE = 0
        LOG_LEVEL_DEBUG = 5

    class InvalidEncryptionKeyAPIError(RuntimeError):
        pass

    class RequiresEncryptionAPIError(RuntimeError):
        pass

    aioesphomeapi = ModuleType("aioesphomeapi")
    aioesphomeapi.LogLevel = LogLevel  # type: ignore[attr-defined]
    sys.modules["aioesphomeapi"] = aioesphomeapi

from custom_components.circuitsetup_energy_meter_helper.esphome_api import (
    ESPHomeApiRepairRequired,
    ESPHomeApiSession,
    ESPHomeIdentityError,
    ESPHomeSecurityError,
)


@dataclass(slots=True)
class NumberState:
    key: int
    state: float
    device_id: int = 0


@dataclass(slots=True)
class SensorState:
    key: int
    state: float
    device_id: int = 0


@dataclass(slots=True)
class FakeEntry:
    entry_id: str = "meter"
    unique_id: str = "AA:BB:CC:DD:EE:FF"
    data: dict[str, Any] | None = None
    runtime_data: object | None = None

    def __post_init__(self) -> None:
        if self.data is None:
            self.data = {
                "host": "meter.local",
                "port": 6053,
                "password": "do-not-retain",
                "noise_psk": "also-do-not-retain",
            }
        if self.runtime_data is None:
            self.runtime_data = object()


class FakeConfigEntries:
    def __init__(self, entry: FakeEntry | None) -> None:
        self.entry = entry

    def async_get_entry(self, entry_id: str) -> FakeEntry | None:
        if self.entry is not None and self.entry.entry_id == entry_id:
            return self.entry
        return None

    def async_entries(self, domain: str) -> list[FakeEntry]:
        del domain
        return []


class FakeHass:
    def __init__(self, entry: FakeEntry | None = None) -> None:
        self.config_entries = FakeConfigEntries(entry or FakeEntry())
        self.config = SimpleNamespace(time_zone="America/New_York")
        self.data: dict[str, object] = {}

    def async_create_task(
        self, coroutine: Coroutine[Any, Any, Any]
    ) -> asyncio.Task[Any]:
        return asyncio.create_task(coroutine)

    def verify_event_loop_thread(self, name: str) -> None:
        del name


class FakeClient:
    def __init__(
        self,
        mac: str = "aa-bb-cc-dd-ee-ff",
        *,
        connect_error: Exception | None = None,
        acknowledge_numbers: bool = True,
    ) -> None:
        self.mac = mac
        self.connect_error = connect_error
        self.acknowledge_numbers = acknowledge_numbers
        self.events: list[str] = []
        self.on_stop: Callable[[bool], Coroutine[Any, Any, None]] | None = None
        self.on_state: Callable[[object], None] | None = None
        self.on_log: Callable[[object], None] | None = None
        self.log_unsubscribed = 0
        self.disconnects = 0
        self.log_levels: list[object] = []

    async def connect(
        self,
        on_stop: Callable[[bool], Coroutine[Any, Any, None]],
        *,
        login: bool,
    ) -> None:
        self.events.append(f"connect:{login}")
        self.on_stop = on_stop
        if self.connect_error is not None:
            raise self.connect_error

    async def device_info_and_list_entities(
        self,
    ) -> tuple[object, list[object], list[object]]:
        self.events.append("list")
        return SimpleNamespace(mac_address=self.mac), [SimpleNamespace(key=7)], []

    def subscribe_states(self, callback: Callable[[object], None]) -> None:
        self.events.append("states")
        self.on_state = callback

    def subscribe_logs(
        self, callback: Callable[[object], None], log_level: object
    ) -> Callable[[], None]:
        self.events.append("logs")
        self.on_log = callback
        self.log_levels.append(log_level)

        def unsubscribe() -> None:
            self.log_unsubscribed += 1

        return unsubscribe

    def number_command(self, key: int, state: float, device_id: int = 0) -> None:
        self.events.append(f"number:{device_id}:{key}:{state}")
        if self.acknowledge_numbers:
            assert self.on_state is not None
            self.on_state(NumberState(key, state, device_id))

    def button_command(self, key: int, device_id: int = 0) -> None:
        self.events.append(f"button:{device_id}:{key}")

    async def disconnect(self, force: bool = False) -> None:
        self.events.append(f"disconnect:{force}")
        self.disconnects += 1


def make_session(
    clients: list[FakeClient],
    *,
    entry: FakeEntry | None = None,
    hass: FakeHass | None = None,
    max_log_lines: int = 200,
    max_log_bytes: int = 64 * 1024,
) -> ESPHomeApiSession:
    hass = hass or FakeHass(entry)

    async def get_zeroconf(_: object) -> object:
        return "zeroconf"

    def create_client(
        received_hass: object,
        received_entry: FakeEntry,
        zeroconf: object,
        *,
        noise_psk: str | None,
    ) -> FakeClient:
        assert received_hass is hass
        assert received_entry is hass.config_entries.entry
        assert zeroconf == "zeroconf"
        assert noise_psk == "also-do-not-retain"
        return clients.pop(0)

    return ESPHomeApiSession(
        hass,
        "meter",
        client_factory=create_client,
        zeroconf_factory=get_zeroconf,
        max_log_lines=max_log_lines,
        max_log_bytes=max_log_bytes,
    )


def test_connect_uses_loaded_entry_and_subscribes_before_ready() -> None:
    async def run() -> None:
        client = FakeClient()
        session = make_session([client])

        await session.async_connect()

        assert session.connection_generation == 1
        assert session.entities == (SimpleNamespace(key=7),)
        assert client.events == ["connect:True", "list", "states", "logs"]
        assert "do-not-retain" not in repr(session)
        assert "also-do-not-retain" not in repr(session)

    asyncio.run(run())


def test_wrong_mac_disconnects_without_becoming_ready() -> None:
    async def run() -> None:
        client = FakeClient("11:22:33:44:55:66")
        session = make_session([client])

        with pytest.raises(ESPHomeIdentityError, match="different ESPHome device"):
            await session.async_connect()

        assert session.connection_generation == 0
        assert client.disconnects == 1

    asyncio.run(run())


@pytest.mark.parametrize(
    "error",
    (
        RequiresEncryptionAPIError("encryption required"),
        InvalidEncryptionKeyAPIError("invalid key"),
    ),
)
def test_encryption_mismatch_fails_closed(error: Exception) -> None:
    async def run() -> None:
        session = make_session([FakeClient(connect_error=error)])

        with pytest.raises(ESPHomeSecurityError, match="ESPHome API encryption"):
            await session.async_connect()

        assert "invalid key" not in repr(session)

    asyncio.run(run())


def test_reconnect_clears_stale_keys_and_states_and_increments_generation() -> None:
    async def run() -> None:
        first = FakeClient()
        second = FakeClient()
        session = make_session([first, second])
        await session.async_connect()
        assert first.on_state is not None
        first.on_state(SensorState(3, 12.0))
        session.key_resolutions["voltage_a"] = (0, 3)

        await session.async_reconnect()

        assert session.connection_generation == 2
        assert session.key_resolutions == {}
        assert session.state_cache == {}
        assert first.disconnects == 1
        assert second.events[:4] == ["connect:True", "list", "states", "logs"]

        assert second.on_stop is not None
        await second.on_stop(False)
        assert not session.connected
        assert session.state_cache == {}

    asyncio.run(run())


def test_commands_register_acknowledgement_first_and_wait_for_fresh_samples() -> None:
    async def run() -> None:
        client = FakeClient()
        session = make_session([client])
        await session.async_connect()

        acknowledged = await session.async_set_number(4, 123.5, device_id=2)
        await session.async_press_button(9, device_id=2)
        boundary = monotonic()
        waiter = asyncio.create_task(
            session.async_wait_for_sensor_window(
                5, device_id=2, sample_count=2, after=boundary, timeout=0.5
            )
        )
        await asyncio.sleep(0)
        assert client.on_state is not None
        client.on_state(SensorState(5, 10.0, 2))
        client.on_state(SensorState(5, 12.0, 2))

        assert acknowledged.state == 123.5
        assert [sample.state for sample in await waiter] == [10.0, 12.0]
        assert client.events[-2:] == ["number:2:4:123.5", "button:2:9"]

    asyncio.run(run())


def test_log_buffer_filters_redacts_and_enforces_both_caps() -> None:
    async def run() -> None:
        client = FakeClient()
        session = make_session([client], max_log_lines=2, max_log_bytes=70)
        await session.async_connect()
        assert client.on_log is not None

        client.on_log(SimpleNamespace(message=b"wifi connected\n"))
        client.on_log(
            SimpleNamespace(
                message=(
                    b"\x1b[31mGain calibration started password=secret\x00\n"
                    b"Current gain register verified\n"
                    b"Restore calibration successful\n"
                )
            )
        )

        assert len(session.log_lines) <= 2
        assert sum(len(line.encode()) for line in session.log_lines) <= 70
        assert all(
            "\x1b" not in line and "\x00" not in line for line in session.log_lines
        )
        assert "secret" not in "\n".join(session.log_lines)
        assert "wifi connected" not in session.log_lines

    asyncio.run(run())


def test_shutdown_cancels_waiters_unsubscribes_logs_and_is_idempotent() -> None:
    async def run() -> None:
        client = FakeClient(acknowledge_numbers=False)
        session = make_session([client])
        await session.async_connect()
        pending = asyncio.create_task(session.async_set_number(1, 2.0, timeout=30))
        await asyncio.sleep(0)

        await session.async_shutdown()
        await session.async_shutdown()

        with pytest.raises(asyncio.CancelledError):
            await pending
        assert client.log_unsubscribed == 1
        assert client.disconnects == 1
        assert client.log_levels[-1] is LogLevel.LOG_LEVEL_NONE

    asyncio.run(run())


def test_missing_or_unloaded_esphome_entry_requires_repair() -> None:
    async def run() -> None:
        hass = FakeHass()
        hass.config_entries.entry = None
        session = make_session([FakeClient()], hass=hass)

        with pytest.raises(ESPHomeApiRepairRequired, match="select.*ESPHome"):
            await session.async_connect()

    asyncio.run(run())


def test_helper_entry_owns_session_lifecycle(monkeypatch: pytest.MonkeyPatch) -> None:
    async def run() -> None:
        import custom_components.circuitsetup_energy_meter_helper as integration
        from custom_components.circuitsetup_energy_meter_helper import (
            async_setup_entry,
            async_unload_entry,
        )

        stopped = 0

        class FakeSession:
            def __init__(self, hass: object, entry_id: str) -> None:
                assert entry_id == "meter"
                assert hass is fake_hass

            async def async_shutdown(self) -> None:
                nonlocal stopped
                stopped += 1

        fake_hass = FakeHass()
        helper_entry = SimpleNamespace(
            entry_id="helper", data={"esphome_entry_id": "meter"}
        )
        monkeypatch.setattr(integration, "ESPHomeApiSession", FakeSession)

        assert await async_setup_entry(fake_hass, helper_entry)
        runtime = fake_hass.data["circuitsetup_energy_meter_helper"]["helper"]
        assert runtime["esphome_api"].__class__ is FakeSession
        assert await async_unload_entry(fake_hass, helper_entry)
        assert stopped == 1

    asyncio.run(run())
