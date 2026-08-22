"""Isolated native-API session for one loaded ESPHome config entry."""

from __future__ import annotations

import asyncio
import re
from collections import defaultdict, deque
from collections.abc import Awaitable, Callable
from contextlib import suppress
from time import monotonic
from typing import Any

from homeassistant.core import HomeAssistant

_ANSI = re.compile(r"\x1b(?:[@-_][0-?]*[ -/]*[@-~])")
_CONTROL = re.compile(r"[\x00-\x1f\x7f-\x9f]")
_SECRET = re.compile(r"(?i)\b(password|noise(?:_psk)?|api[_ -]?key)\s*[:=]\s*\S+")
_CALIBRATION_TERMS = (
    "calibrat",
    "gain",
    "register",
    "restore",
    "voltage",
    "current",
)
_SECURITY_ERRORS = {
    "EncryptionHelloAPIError",
    "EncryptionPlaintextAPIError",
    "InvalidEncryptionKeyAPIError",
    "RequiresEncryptionAPIError",
}

type ClientFactory = Callable[..., Any]
type ZeroconfFactory = Callable[[HomeAssistant], Awaitable[Any]]
type StateKey = tuple[type[Any], int, int]
type EntityKey = tuple[int, int]


class ESPHomeApiRepairRequired(RuntimeError):
    """The selected ESPHome entry cannot safely supply a secondary client."""


class ESPHomeIdentityError(RuntimeError):
    """The endpoint answered with a different device identity."""


class ESPHomeSecurityError(RuntimeError):
    """The selected entry's API security does not match the endpoint."""


def _canonical_mac(value: str) -> str:
    return "".join(character for character in value.casefold() if character.isalnum())


class ESPHomeApiSession:
    """A credential-free owner for a short-lived secondary ESPHome client."""

    def __init__(
        self,
        hass: HomeAssistant,
        esphome_entry_id: str,
        *,
        client_factory: ClientFactory | None = None,
        zeroconf_factory: ZeroconfFactory | None = None,
        max_log_lines: int = 200,
        max_log_bytes: int = 64 * 1024,
    ) -> None:
        if max_log_lines < 1 or max_log_bytes < 1:
            raise ValueError("log limits must be positive")
        self._hass = hass
        self.esphome_entry_id = esphome_entry_id
        self._client_factory = client_factory
        self._zeroconf_factory = zeroconf_factory
        self._max_log_lines = max_log_lines
        self._max_log_bytes = max_log_bytes
        self._client: Any | None = None
        self._unsubscribe_logs: Callable[[], None] | None = None
        self._log_lines: deque[str] = deque()
        self._log_bytes = 0
        self._state_cache: dict[StateKey, Any] = {}
        self._state_history: dict[EntityKey, deque[tuple[float, Any]]] = defaultdict(
            lambda: deque(maxlen=100)
        )
        self._state_event = asyncio.Event()
        self._number_waiters: dict[
            EntityKey, list[tuple[float, float, asyncio.Future[Any]]]
        ] = defaultdict(list)
        self.key_resolutions: dict[str, EntityKey] = {}
        self.entities: tuple[Any, ...] = ()
        self.connection_generation = 0
        self.connected = False
        self._closed = False

    @property
    def state_cache(self) -> dict[StateKey, Any]:
        """Return a snapshot of states received on the current connection."""
        return dict(self._state_cache)

    @property
    def log_lines(self) -> tuple[str, ...]:
        """Return the bounded, sanitized calibration log window."""
        return tuple(self._log_lines)

    async def async_connect(self) -> None:
        """Connect, verify identity, and subscribe before becoming ready."""
        if self._closed:
            raise ESPHomeApiRepairRequired("The ESPHome API session is closed")
        if self.connected:
            return
        client, expected_mac = await self._async_create_client()
        self._client = client
        self._clear_connection_state()

        async def on_stop(expected_disconnect: bool) -> None:
            await self._async_on_stop(client, expected_disconnect)

        try:
            await client.connect(on_stop, login=True)
        except Exception as error:
            await self._disconnect_failed_client(client)
            if type(error).__name__ in _SECURITY_ERRORS:
                raise ESPHomeSecurityError(
                    "ESPHome API encryption does not match the selected entry; "
                    "repair that ESPHome entry and retry"
                ) from None
            raise

        try:
            device_info, entities, _ = await client.device_info_and_list_entities()
            if _canonical_mac(device_info.mac_address) != expected_mac:
                raise ESPHomeIdentityError(
                    "The endpoint is a different ESPHome device; repair its host "
                    "in the existing ESPHome entry"
                )
            client.subscribe_states(lambda state: self._on_state(client, state))
            self._unsubscribe_logs = client.subscribe_logs(
                lambda message: self._on_log(client, message),
                self._log_level("LOG_LEVEL_DEBUG"),
            )
        except Exception:
            await self._disconnect_failed_client(client)
            raise

        self.entities = tuple(entities)
        self.connection_generation += 1
        self.connected = True

    async def _async_create_client(self) -> tuple[Any, str]:
        entry = self._hass.config_entries.async_get_entry(self.esphome_entry_id)
        if entry is None or getattr(entry, "runtime_data", None) is None:
            raise ESPHomeApiRepairRequired(
                "Please select a loaded ESPHome config entry and retry"
            )
        unique_id = getattr(entry, "unique_id", None)
        if not isinstance(unique_id, str) or not _canonical_mac(unique_id):
            raise ESPHomeApiRepairRequired(
                "The selected ESPHome entry has no usable device identity"
            )

        client_factory = self._client_factory
        zeroconf_factory = self._zeroconf_factory
        if client_factory is None or zeroconf_factory is None:
            try:
                from homeassistant.components import zeroconf
                from homeassistant.components.esphome.const import CONF_NOISE_PSK
                from homeassistant.components.esphome.manager import (
                    async_create_api_client,
                )
            except AttributeError, ImportError:
                raise ESPHomeApiRepairRequired(
                    "Home Assistant's compatible ESPHome API helper is unavailable"
                ) from None
            client_factory = async_create_api_client
            zeroconf_factory = zeroconf.async_get_instance
            noise_key = CONF_NOISE_PSK
        else:
            noise_key = "noise_psk"

        zeroconf_instance = await zeroconf_factory(self._hass)
        client = client_factory(
            self._hass,
            entry,
            zeroconf_instance,
            noise_psk=entry.data.get(noise_key),
        )
        return client, _canonical_mac(unique_id)

    async def async_set_number(
        self,
        key: int,
        state: float,
        *,
        device_id: int = 0,
        tolerance: float = 1e-6,
        timeout: float = 10.0,
    ) -> Any:
        """Set a number and wait for a new matching NumberState."""
        client = self._ready_client()
        future = asyncio.get_running_loop().create_future()
        entity_key = (device_id, key)
        waiter = (state, tolerance, future)
        self._number_waiters[entity_key].append(waiter)
        try:
            client.number_command(key, state, device_id)
            return await asyncio.wait_for(future, timeout)
        finally:
            waiters = self._number_waiters.get(entity_key)
            if waiters is not None:
                with suppress(ValueError):
                    waiters.remove(waiter)
                if not waiters:
                    self._number_waiters.pop(entity_key, None)

    async def async_press_button(self, key: int, *, device_id: int = 0) -> None:
        """Press one ESPHome button on the ready connection."""
        self._ready_client().button_command(key, device_id)

    async def async_wait_for_sensor_window(
        self,
        key: int,
        *,
        device_id: int = 0,
        sample_count: int,
        after: float | None = None,
        timeout: float = 10.0,
    ) -> tuple[Any, ...]:
        """Wait for fresh SensorState samples from the current connection."""
        if sample_count < 1:
            raise ValueError("sample_count must be positive")
        self._ready_client()
        boundary = monotonic() if after is None else after
        entity_key = (device_id, key)
        async with asyncio.timeout(timeout):
            while True:
                event = self._state_event
                samples = tuple(
                    state
                    for arrived, state in self._state_history[entity_key]
                    if arrived > boundary and type(state).__name__ == "SensorState"
                )
                if len(samples) >= sample_count:
                    return samples[-sample_count:]
                await event.wait()
                if self._closed or not self.connected:
                    raise asyncio.CancelledError

    async def async_reconnect(self) -> None:
        """Disconnect and create a fresh client from the current ESPHome entry."""
        if self._closed:
            raise ESPHomeApiRepairRequired("The ESPHome API session is closed")
        await self._async_disconnect()
        await self.async_connect()

    async def async_shutdown(self) -> None:
        """Cancel pending work and release the secondary connection once."""
        if self._closed:
            return
        self._closed = True
        self._cancel_waiters()
        self._wake_state_waiters()
        await self._async_disconnect()

    def _ready_client(self) -> Any:
        if not self.connected or self._client is None:
            raise ESPHomeApiRepairRequired("The ESPHome API session is not connected")
        return self._client

    def _on_state(self, client: Any, state: Any) -> None:
        if client is not self._client or not self.connected:
            return
        device_id = state.device_id
        key = state.key
        self._state_cache[(type(state), device_id, key)] = state
        self._state_history[(device_id, key)].append((monotonic(), state))
        if type(state).__name__ == "NumberState":
            for target, tolerance, future in tuple(
                self._number_waiters.get((device_id, key), ())
            ):
                if not future.done() and abs(state.state - target) <= tolerance:
                    future.set_result(state)
        self._wake_state_waiters()

    def _on_log(self, client: Any, message: Any) -> None:
        if client is not self._client or not self.connected:
            return
        raw = message.message
        text = raw.decode("utf-8", "replace") if isinstance(raw, bytes) else str(raw)
        for raw_line in text.splitlines():
            line = _CONTROL.sub("", _ANSI.sub("", raw_line)).strip()
            if not line or not any(
                term in line.casefold() for term in _CALIBRATION_TERMS
            ):
                continue
            line = _SECRET.sub(r"\1=<redacted>", line)
            encoded = line.encode("utf-8")[: self._max_log_bytes]
            line = encoded.decode("utf-8", "ignore")
            size = len(line.encode("utf-8"))
            self._log_lines.append(line)
            self._log_bytes += size
            while (
                len(self._log_lines) > self._max_log_lines
                or self._log_bytes > self._max_log_bytes
            ):
                self._log_bytes -= len(self._log_lines.popleft().encode("utf-8"))

    async def _async_on_stop(self, client: Any, expected_disconnect: bool) -> None:
        del expected_disconnect
        if client is not self._client:
            return
        self.connected = False
        self._clear_connection_state()
        self._cancel_waiters()
        self._wake_state_waiters()

    async def _async_disconnect(self) -> None:
        client = self._client
        if client is None:
            self.connected = False
            self._clear_connection_state()
            return
        self.connected = False
        if self._unsubscribe_logs is not None:
            self._unsubscribe_logs()
            self._unsubscribe_logs = None
        with suppress(Exception):
            client.subscribe_logs(lambda _: None, self._log_level("LOG_LEVEL_NONE"))
        self._cancel_waiters()
        self._wake_state_waiters()
        try:
            await asyncio.shield(client.disconnect())
        finally:
            if self._client is client:
                self._client = None
            self._clear_connection_state()

    async def _disconnect_failed_client(self, client: Any) -> None:
        with suppress(Exception):
            await asyncio.shield(client.disconnect(force=True))
        if self._client is client:
            self._client = None
        self.connected = False

    def _clear_connection_state(self) -> None:
        self._state_cache.clear()
        self._state_history.clear()
        self.key_resolutions.clear()
        self.entities = ()

    def _cancel_waiters(self) -> None:
        for waiters in self._number_waiters.values():
            for _, _, future in waiters:
                future.cancel()
        self._number_waiters.clear()

    def _wake_state_waiters(self) -> None:
        event = self._state_event
        self._state_event = asyncio.Event()
        event.set()

    @staticmethod
    def _log_level(name: str) -> object:
        try:
            from aioesphomeapi import LogLevel
        except ImportError:
            raise ESPHomeApiRepairRequired(
                "Home Assistant's compatible ESPHome API helper is unavailable"
            ) from None
        return getattr(LogLevel, name)
