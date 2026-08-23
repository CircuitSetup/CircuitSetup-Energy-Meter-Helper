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
    ESPHomeReconnectError,
    ESPHomeSecurityError,
    ESPHomeSessionDisconnectedError,
)
from custom_components.circuitsetup_energy_meter_helper.state_tracker import (
    FreshWindowError,
    StateUnavailableError,
)


@dataclass(slots=True)
class NumberState:
    key: int
    state: float
    device_id: int = 0
    missing_state: bool = False


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
        self.config = SimpleNamespace(time_zone="America/New_York", config_dir=".")
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
        unsubscribe_error: Exception | None = None,
    ) -> None:
        self.mac = mac
        self.connect_error = connect_error
        self.acknowledge_numbers = acknowledge_numbers
        self.unsubscribe_error = unsubscribe_error
        self.events: list[str] = []
        self.on_stop: Callable[[bool], Coroutine[Any, Any, None]] | None = None
        self.on_state: Callable[[object], None] | None = None
        self.on_log: Callable[[object], None] | None = None
        self.log_unsubscribed = 0
        self.disconnects = 0
        self.log_levels: list[object] = []
        self.dump_configs: list[bool | None] = []

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
        self,
        callback: Callable[[object], None],
        log_level: object,
        dump_config: bool | None = None,
    ) -> Callable[[], None]:
        self.events.append("logs")
        self.on_log = callback
        self.log_levels.append(log_level)
        self.dump_configs.append(dump_config)

        def unsubscribe() -> None:
            self.log_unsubscribed += 1
            if self.unsubscribe_error is not None:
                raise self.unsubscribe_error

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


class GatedClient(FakeClient):
    def __init__(
        self, *, gate_connect: bool = False, gate_disconnect: bool = False
    ) -> None:
        super().__init__()
        self.gate_connect = gate_connect
        self.gate_disconnect = gate_disconnect
        self.connect_started = asyncio.Event()
        self.connect_release = asyncio.Event()
        self.disconnect_started = asyncio.Event()
        self.disconnect_release = asyncio.Event()
        self.disconnect_finished = False

    async def connect(
        self,
        on_stop: Callable[[bool], Coroutine[Any, Any, None]],
        *,
        login: bool,
    ) -> None:
        await super().connect(on_stop, login=login)
        self.connect_started.set()
        if self.gate_connect:
            await self.connect_release.wait()

    async def disconnect(self, force: bool = False) -> None:
        self.disconnect_started.set()
        if self.gate_disconnect:
            await self.disconnect_release.wait()
        await super().disconnect(force)
        self.disconnect_finished = True


class StopDuringReadyClient(FakeClient):
    def __init__(
        self, stop_during: str, *, unsubscribe_error: Exception | None = None
    ) -> None:
        super().__init__(unsubscribe_error=unsubscribe_error)
        self.stop_during = stop_during

    async def device_info_and_list_entities(
        self,
    ) -> tuple[object, list[object], list[object]]:
        result = await super().device_info_and_list_entities()
        if self.stop_during == "list":
            assert self.on_stop is not None
            await self.on_stop(False)
        return result

    def subscribe_states(self, callback: Callable[[object], None]) -> None:
        super().subscribe_states(callback)
        if self.stop_during == "states":
            self._stop_synchronously()

    def subscribe_logs(
        self,
        callback: Callable[[object], None],
        log_level: object,
        dump_config: bool | None = None,
    ) -> Callable[[], None]:
        unsubscribe = super().subscribe_logs(callback, log_level, dump_config)
        if self.stop_during == "logs":
            self._stop_synchronously()
        return unsubscribe

    def _stop_synchronously(self) -> None:
        """Run the callback inline to probe the no-await subscription boundary."""
        assert self.on_stop is not None
        stopped = self.on_stop(False)
        with pytest.raises(StopIteration):
            stopped.send(None)


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


def test_connect_keeps_initial_states_emitted_during_subscription() -> None:
    class ImmediateStateClient(FakeClient):
        def subscribe_states(self, callback: Callable[[object], None]) -> None:
            super().subscribe_states(callback)
            callback(SensorState(7, 12.5))

    async def run() -> None:
        session = make_session([ImmediateStateClient()])

        await session.async_connect()

        assert next(iter(session.state_cache.values())).state.state == 12.5

    asyncio.run(run())


def test_wait_for_sensor_states_accepts_zero_state_after_connect() -> None:
    async def run() -> None:
        client = FakeClient()
        session = make_session([client])
        await session.async_connect()

        waiting = asyncio.create_task(
            session.async_wait_for_sensor_states(frozenset({(0, 7)}), timeout=1)
        )
        await asyncio.sleep(0)
        assert not waiting.done()
        assert client.on_state is not None
        client.on_state(SensorState(7, 0.0))

        await waiting

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
        assert (await waiter).values == (10.0, 12.0)
        assert client.events[-2:] == ["number:2:4:123.5", "button:2:9"]

    asyncio.run(run())


def test_absolute_sensor_window_accepts_zero_on_the_requested_generation() -> None:
    async def run() -> None:
        client = FakeClient()
        session = make_session([client])
        await session.async_connect()
        boundary = monotonic()
        waiter = asyncio.create_task(
            session.async_wait_for_absolute_sensor_window(
                5,
                sample_count=3,
                connection_generation=1,
                after=boundary,
                timeout=0.5,
            )
        )
        await asyncio.sleep(0)
        assert client.on_state is not None
        for value in (0.0, -0.1, 0.1):
            client.on_state(SensorState(5, value))

        window = await waiter

        assert window.connection_generation == 1
        assert window.mean == 0.0
        assert window.absolute_peak == 0.1
        assert window.absolute_spread == 0.2

    asyncio.run(run())


def test_absolute_sensor_window_rejects_another_connection_generation() -> None:
    async def run() -> None:
        session = make_session([FakeClient()])
        await session.async_connect()

        with pytest.raises(FreshWindowError, match="generation"):
            await session.async_wait_for_absolute_sensor_window(
                5,
                sample_count=3,
                connection_generation=2,
                timeout=0.5,
            )

    asyncio.run(run())


def test_number_ack_uses_shared_tracker_and_rejects_unavailable_state() -> None:
    async def run() -> None:
        client = FakeClient(acknowledge_numbers=False)
        session = make_session([client])
        await session.async_connect()
        pending = asyncio.create_task(session.async_set_number(4, 0.0, timeout=0.5))
        await asyncio.sleep(0)
        assert client.on_state is not None

        client.on_state(NumberState(4, 0.0, missing_state=True))

        with pytest.raises(StateUnavailableError, match="unavailable"):
            await pending

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


def test_log_buffer_retains_exact_offset_button_dispatch_lines() -> None:
    async def run() -> None:
        client = FakeClient()
        session = make_session([client])
        await session.async_connect()
        assert client.on_log is not None

        client.on_log(
            SimpleNamespace(
                message=(
                    b"[I][atm90e32.button:037] 1. Run Main Meter 1 Offset Cal\n"
                    b"[I][atm90e32.button:060] 2. Run Main Meter 1 Power Offset Cal\n"
                )
            )
        )

        assert session.log_lines[-2:] == (
            "[I][atm90e32.button:037] 1. Run Main Meter 1 Offset Cal",
            "[I][atm90e32.button:060] 2. Run Main Meter 1 Power Offset Cal",
        )

    asyncio.run(run())


def test_requests_dump_config_and_reports_current_calibration_sources() -> None:
    async def run() -> None:
        client = FakeClient()
        session = make_session([client])
        await session.async_connect()

        pending = asyncio.create_task(
            session.async_calibration_sources({"meter_main1", "meter_main2"})
        )
        await asyncio.sleep(0)
        assert client.dump_configs[-1] is True
        assert client.on_log is not None
        client.on_log(
            SimpleNamespace(
                message=(
                    b"[CALIBRATION][meter_main1] Gain calibration loaded and verified successfully.\n"
                    b"[CALIBRATION][meter_main2] No stored gain calibrations found. Using config file values.\n"
                )
            )
        )

        assert await pending == {
            "meter_main1": "flash",
            "meter_main2": "configuration",
        }

    asyncio.run(run())


def test_missing_saved_gain_evidence_remains_unknown_for_workflow_reconciliation() -> None:
    """Dump-config does not repeat boot-only ATM90E32 flash-source evidence."""

    async def run() -> None:
        client = FakeClient()
        session = make_session([client])
        await session.async_connect()

        pending = asyncio.create_task(
            session.async_calibration_sources(
                {"meter_main1", "meter_main2"}, timeout=0.01
            )
        )
        await asyncio.sleep(0)
        assert client.on_log is not None
        client.on_log(
            SimpleNamespace(
                message=b"[CALIBRATION][meter_main1] Gain calibration loaded and verified successfully.\n"
            )
        )

        assert await pending == {
            "meter_main1": "flash",
            "meter_main2": "unknown",
        }

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


def test_concurrent_connects_share_one_client_and_generation() -> None:
    async def run() -> None:
        first = GatedClient(gate_connect=True)
        unused = FakeClient()
        session = make_session([first, unused])

        one = asyncio.create_task(session.async_connect())
        await first.connect_started.wait()
        two = asyncio.create_task(session.async_connect())
        await asyncio.sleep(0)
        first.connect_release.set()
        await asyncio.gather(one, two)
        await session.async_shutdown()

        assert session.connection_generation == 1
        assert first.disconnects == 1
        assert unused.events == []

    asyncio.run(run())


def test_unexpected_disconnect_fails_number_and_sensor_waiters_with_session_error() -> (
    None
):
    async def run() -> None:
        client = FakeClient(acknowledge_numbers=False)
        session = make_session([client])
        await session.async_connect()
        number = asyncio.create_task(session.async_set_number(1, 2.0, timeout=30))
        sensor = asyncio.create_task(
            session.async_wait_for_sensor_window(2, sample_count=1, timeout=30)
        )
        await asyncio.sleep(0)
        assert client.on_stop is not None

        await client.on_stop(False)
        outcomes = await asyncio.gather(number, sensor, return_exceptions=True)

        assert all(
            isinstance(outcome, ESPHomeSessionDisconnectedError) for outcome in outcomes
        )

    asyncio.run(run())


def test_generation_guard_linearizes_verified_persistence_before_stop() -> None:
    async def run() -> None:
        client = FakeClient()
        session = make_session([client])
        await session.async_connect()
        assert client.on_stop is not None

        async with session.hold_connection_generation(1):
            stop = asyncio.create_task(client.on_stop(False))
            await asyncio.sleep(0)
            assert session.connected
            assert not stop.done()

        await stop
        assert not session.connected
        assert session.entities == ()

    asyncio.run(run())


def test_cancelled_shutdown_retains_cleanup_for_the_next_caller() -> None:
    async def run() -> None:
        client = GatedClient(gate_disconnect=True)
        session = make_session([client])
        await session.async_connect()

        first = asyncio.create_task(session.async_shutdown())
        await client.disconnect_started.wait()
        first.cancel()
        with pytest.raises(asyncio.CancelledError):
            await first

        second = asyncio.create_task(session.async_shutdown())
        await asyncio.sleep(0)
        assert not second.done()
        assert not client.disconnect_finished
        client.disconnect_release.set()
        await second

        assert client.disconnect_finished
        assert client.disconnects == 1

    asyncio.run(run())


def test_shutdown_waits_for_reconnect_and_leaves_no_live_client() -> None:
    async def run() -> None:
        first = FakeClient()
        second = GatedClient(gate_connect=True)
        session = make_session([first, second])
        await session.async_connect()

        reconnect = asyncio.create_task(session.async_reconnect())
        await second.connect_started.wait()
        shutdown = asyncio.create_task(session.async_shutdown())
        await asyncio.sleep(0)
        assert not shutdown.done()
        second.connect_release.set()
        await asyncio.gather(reconnect, shutdown)

        assert not session.connected
        assert first.disconnects == 1
        assert second.disconnects == 1
        assert session.connection_generation == 2

    asyncio.run(run())


def test_cancelled_connect_still_disconnects_created_client() -> None:
    async def run() -> None:
        client = GatedClient(gate_connect=True)
        session = make_session([client])
        connecting = asyncio.create_task(session.async_connect())
        await client.connect_started.wait()

        connecting.cancel()
        with pytest.raises(asyncio.CancelledError):
            await connecting

        assert client.disconnects == 1
        assert not session.connected

    asyncio.run(run())


def test_unsubscribe_failure_does_not_skip_disconnect() -> None:
    async def run() -> None:
        client = FakeClient(unsubscribe_error=RuntimeError("unsubscribe failed"))
        session = make_session([client])
        await session.async_connect()

        await session.async_shutdown()

        assert client.log_unsubscribed == 1
        assert client.disconnects == 1

    asyncio.run(run())


def test_unload_retains_runtime_until_api_cleanup_retry_succeeds() -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper import (
            async_unload_entry,
        )

        stopped = 0
        shutdowns = 0

        class FailingSession:
            async def async_shutdown(self) -> None:
                nonlocal shutdowns
                shutdowns += 1
                if shutdowns == 1:
                    raise RuntimeError("cleanup failed")

        class Provisioning:
            async def async_stop(self) -> None:
                nonlocal stopped
                stopped += 1

        hass = FakeHass()
        entry = SimpleNamespace(entry_id="helper")
        runtime = {
            "esphome_api": FailingSession(),
            "provisioning": Provisioning(),
        }
        hass.data["circuitsetup_energy_meter_helper"] = {"helper": runtime}
        with pytest.raises(BaseExceptionGroup) as caught:
            await async_unload_entry(hass, entry)

        assert stopped == 1
        assert len(caught.value.exceptions) == 1
        assert isinstance(caught.value.exceptions[0], RuntimeError)
        assert hass.data["circuitsetup_energy_meter_helper"]["helper"] is runtime
        assert await async_unload_entry(hass, entry)
        assert shutdowns == 2
        assert stopped == 2
        assert runtime == {}
        assert "helper" not in hass.data["circuitsetup_energy_meter_helper"]

    asyncio.run(run())


def test_log_sanitizer_removes_quoted_unquoted_secrets_and_complete_osc() -> None:
    async def run() -> None:
        client = FakeClient()
        session = make_session([client])
        await session.async_connect()
        assert client.on_log is not None

        client.on_log(
            SimpleNamespace(
                message=(
                    b'Voltage calibration password="secret phrase" retained\n'
                    b"Current gain api_key=unquoted secret phrase\n"
                    b"Gain calibration encryption\x1b[31m_key='enc value'\x1b[0m\n"
                    b"Restore voltage to\x00ken=token value\n"
                    b"Current register se\x1b]0;hidden\x07cret: secret value\n"
                    b"Voltage \x1b]0;OSC private payload\x07calibration complete\n"
                )
            )
        )
        logs = "\n".join(session.log_lines)

        assert "secret phrase" not in logs
        assert "secret value" not in logs
        assert "phrase" not in logs
        assert "enc value" not in logs
        assert "token value" not in logs
        assert "OSC private payload" not in logs
        assert "calibration complete" in logs

    asyncio.run(run())


def test_legacy_non_mac_identity_requires_repair_before_client_creation() -> None:
    async def run() -> None:
        unused = FakeClient()
        session = make_session([unused], entry=FakeEntry(unique_id="meter-name"))

        with pytest.raises(ESPHomeApiRepairRequired, match="device identity"):
            await session.async_connect()

        assert unused.events == []

    asyncio.run(run())


def test_real_home_assistant_factory_import_path_and_noise_contract(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        from homeassistant import components

        entry = FakeEntry()
        hass = FakeHass(entry)
        client = FakeClient()
        calls: list[tuple[object, object, object, str | None]] = []

        async def async_get_instance(received_hass: object) -> object:
            assert received_hass is hass
            return "real-path-zeroconf"

        def async_create_api_client(
            received_hass: object,
            received_entry: object,
            zeroconf_instance: object,
            *,
            noise_psk: str | None,
        ) -> FakeClient:
            calls.append((received_hass, received_entry, zeroconf_instance, noise_psk))
            return client

        zeroconf_module = ModuleType("homeassistant.components.zeroconf")
        zeroconf_module.async_get_instance = async_get_instance  # type: ignore[attr-defined]
        const_module = ModuleType("homeassistant.components.esphome.const")
        const_module.CONF_NOISE_PSK = "noise_psk"  # type: ignore[attr-defined]
        manager_module = ModuleType("homeassistant.components.esphome.manager")
        manager_module.async_create_api_client = async_create_api_client  # type: ignore[attr-defined]
        esphome_module = ModuleType("homeassistant.components.esphome")
        esphome_module.__path__ = []  # type: ignore[attr-defined]
        monkeypatch.setattr(components, "zeroconf", zeroconf_module, raising=False)
        monkeypatch.setattr(components, "esphome", esphome_module, raising=False)
        monkeypatch.setitem(sys.modules, zeroconf_module.__name__, zeroconf_module)
        monkeypatch.setitem(sys.modules, esphome_module.__name__, esphome_module)
        monkeypatch.setitem(sys.modules, const_module.__name__, const_module)
        monkeypatch.setitem(sys.modules, manager_module.__name__, manager_module)

        session = ESPHomeApiSession(hass, "meter")
        await session.async_connect()

        assert calls == [(hass, entry, "real-path-zeroconf", "also-do-not-retain")]
        await session.async_shutdown()

    asyncio.run(run())


@pytest.mark.parametrize("stop_during", ("list", "states", "logs"))
def test_stop_during_ready_handshake_never_marks_dead_client_connected(
    stop_during: str,
) -> None:
    async def run() -> None:
        client = StopDuringReadyClient(stop_during)
        session = make_session([client])

        with pytest.raises(ESPHomeSessionDisconnectedError):
            await session.async_connect()

        assert not session.connected
        assert session.connection_generation == 0
        assert session.entities == ()
        assert client.disconnects == 1

    asyncio.run(run())


def test_repeated_cancellation_of_reconnect_finishes_old_client_cleanup() -> None:
    async def run() -> None:
        old = GatedClient(gate_disconnect=True)
        replacement = FakeClient()
        session = make_session([old, replacement])
        await session.async_connect()

        reconnect = asyncio.create_task(session.async_reconnect())
        await old.disconnect_started.wait()
        reconnect.cancel()
        await asyncio.sleep(0)
        reconnect.cancel()
        old.disconnect_release.set()
        with pytest.raises(asyncio.CancelledError):
            await reconnect

        assert old.disconnect_finished
        assert old.disconnects == 1
        assert not session.connected
        await session.async_connect()
        assert session.connected
        assert session.connection_generation == 2
        await session.async_shutdown()

    asyncio.run(run())


@pytest.mark.parametrize("callback_raises", (False, True))
def test_failed_log_subscription_cleanup_is_idempotent_and_suppresses_callback_error(
    callback_raises: bool,
) -> None:
    async def run() -> None:
        client = StopDuringReadyClient(
            "logs",
            unsubscribe_error=(
                RuntimeError("unsubscribe failed") if callback_raises else None
            ),
        )
        session = make_session([client])

        with pytest.raises(ESPHomeSessionDisconnectedError):
            await session.async_connect()

        assert client.log_unsubscribed == 1
        assert session._unsubscribe_logs is None
        assert client.disconnects == 1
        await session.async_shutdown()
        assert client.log_unsubscribed == 1
        assert session._unsubscribe_logs is None

    asyncio.run(run())


def test_disconnect_future_is_armed_before_restart_and_reconnect_dumps_config() -> None:
    async def run() -> None:
        original = FakeClient()
        replacement = FakeClient()
        session = make_session([original, replacement])
        await session.async_connect()

        disconnected = session.expect_disconnect()
        assert original.on_stop is not None
        await original.on_stop(False)
        await disconnected
        await session.async_reconnect(dump_config=True)

        assert replacement.dump_configs == [True]
        assert session.connection_generation == 2
        await session.async_shutdown()

    asyncio.run(run())


def test_reconnect_wraps_transient_client_start_failure_for_bounded_retry() -> None:
    async def run() -> None:
        session = make_session(
            [FakeClient(), FakeClient(connect_error=RuntimeError("still booting"))]
        )
        await session.async_connect()
        with pytest.raises(ESPHomeReconnectError, match="reconnect failed"):
            await session.async_reconnect(dump_config=True)
        assert not session.connected

    asyncio.run(run())
