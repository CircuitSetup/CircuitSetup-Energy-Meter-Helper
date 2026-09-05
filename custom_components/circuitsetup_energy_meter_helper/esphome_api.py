"""Isolated native-API session for one loaded ESPHome config entry."""

from __future__ import annotations

import asyncio
import re
from collections import deque
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager, suppress
from math import isfinite
from time import monotonic
from typing import Any, Literal

from homeassistant.core import HomeAssistant

from .log_parser import (
    CalibrationLogLine,
    MeterCommunicationError,
    MeterCommunicationParser,
    OffsetTableSnapshot,
    parse_calibration_sources,
    parse_offset_configuration_selection,
    parse_offset_table_snapshot,
)
from .models import canonical_mac
from .state_tracker import (
    AbsoluteSensorSampleWindow,
    SensorSampleWindow,
    StateDisconnectedError,
    StateTracker,
)

_ANSI_CSI = re.compile(r"(?:\x1b\[|\x9b)[0-?]*[ -/]*[@-~]")
_ANSI_OSC = re.compile(r"(?:\x1b\]|\x9d).*?(?:\x07|\x1b\\|\x9c)", re.DOTALL)
_CONTROL = re.compile(r"[\x00-\x1f\x7f-\x9f]")
_SECRET = re.compile(
    r"(?i)\b(password|noise(?:_psk)?|api[_ -]?key|encryption[_ -]?key|token|secret)"
    r"\s*[:=]\s*"
    r"(?:\"[^\"]*\"|'[^']*'|[^\r\n]*)"
)
_CALIBRATION_TERMS = (
    "calibrat",
    "gain",
    "offset",
    "register",
    "restore",
    "voltage",
    "current",
    "spi read mismatch",
)
_MAX_OFFSET_SNAPSHOT_LINES = 4096
_MAX_OFFSET_SNAPSHOT_BYTES = 512 * 1024
_SECURITY_ERRORS = {
    "EncryptionHelloAPIError",
    "EncryptionPlaintextAPIError",
    "InvalidEncryptionKeyAPIError",
    "RequiresEncryptionAPIError",
}

type ClientFactory = Callable[..., Any]
type ZeroconfFactory = Callable[[HomeAssistant], Awaitable[Any]]
type EntityKey = tuple[int, int]


def sanitize_control_text(value: str, *, preserve_line_breaks: bool = False) -> str:
    """Remove terminal escape sequences and C0/C1 controls from untrusted text."""
    value = _strip_terminal_sequences(value)
    if preserve_line_breaks:
        value = value.replace("\r\n", "\n").replace("\r", "\n")
        return "\n".join(_CONTROL.sub("", line) for line in value.split("\n"))
    return _CONTROL.sub("", value)


def _strip_terminal_sequences(value: str) -> str:
    return _ANSI_CSI.sub("", _ANSI_OSC.sub("", value))


class ESPHomeApiRepairRequired(RuntimeError):
    """The selected ESPHome entry cannot safely supply a secondary client."""


class ESPHomeIdentityError(RuntimeError):
    """The endpoint answered with a different device identity."""


class ESPHomeSecurityError(RuntimeError):
    """The selected entry's API security does not match the endpoint."""


class ESPHomeSessionDisconnectedError(ConnectionError):
    """The transport disconnected while a session operation was pending."""


class ESPHomeReconnectError(ConnectionError):
    """A transient native-API reconnect candidate could not become ready."""


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
        self._state_tracker = StateTracker(history_size=100)
        self.key_resolutions: dict[str, EntityKey] = {}
        self.entities: tuple[Any, ...] = ()
        self._closed = False
        self._disconnect_waiters: set[asyncio.Future[None]] = set()
        self._lifecycle_lock = asyncio.Lock()
        self._connection_state_lock = asyncio.Lock()
        self._cleanup_task: asyncio.Task[None] | None = None

    @property
    def state_cache(self) -> dict[tuple[type[Any], int, int], Any]:
        """Return a snapshot of states received on the current connection."""
        return self._state_tracker.state_cache if self.connected else {}

    @property
    def connection_generation(self) -> int:
        return self._state_tracker.connection_generation

    @property
    def connected(self) -> bool:
        return self._state_tracker.connected

    @property
    def log_lines(self) -> tuple[str, ...]:
        """Return the bounded, sanitized calibration log window."""
        return tuple(self._log_lines)

    def expect_disconnect(self) -> asyncio.Future[None]:
        """Register a one-shot disconnect future before a restart command."""
        if not self.connected:
            raise ESPHomeApiRepairRequired("The ESPHome API session is not connected")
        waiter = asyncio.get_running_loop().create_future()
        self._disconnect_waiters.add(waiter)
        waiter.add_done_callback(self._disconnect_waiters.discard)
        return waiter

    async def async_connect(self) -> None:
        """Connect, verify identity, and subscribe before becoming ready."""
        async with self._lifecycle_lock:
            await self._async_connect_locked()

    async def _async_connect_locked(self, *, dump_config: bool = False) -> None:
        if self._closed:
            raise ESPHomeApiRepairRequired("The ESPHome API session is closed")
        if self.connected:
            return
        client, expected_mac = await self._async_create_client()
        self._client = client
        self._clear_connection_state()
        attempt_stopped = False
        initial_states: list[tuple[Any, float]] = []

        async def on_stop(expected_disconnect: bool) -> None:
            nonlocal attempt_stopped
            attempt_stopped = True
            await self._async_on_stop(client, expected_disconnect)

        def ensure_attempt_is_live() -> None:
            if attempt_stopped or client is not self._client:
                raise ESPHomeSessionDisconnectedError(
                    "The ESPHome API connection stopped before it became ready"
                )

        try:
            await client.connect(on_stop, login=True)
            ensure_attempt_is_live()
        except BaseException as error:
            await self._disconnect_failed_client(client)
            if (
                isinstance(error, Exception)
                and type(error).__name__ in _SECURITY_ERRORS
            ):
                raise ESPHomeSecurityError(
                    "ESPHome API encryption does not match the selected entry; "
                    "repair that ESPHome entry and retry"
                ) from None
            raise

        try:
            device_info, entities, _ = await client.device_info_and_list_entities()
            ensure_attempt_is_live()
            try:
                actual_mac = canonical_mac(device_info.mac_address)
            except AttributeError, ValueError:
                actual_mac = ""
            if actual_mac != expected_mac:
                raise ESPHomeIdentityError(
                    "The endpoint is a different ESPHome device; repair its host "
                    "in the existing ESPHome entry"
                )
            client.subscribe_states(
                lambda state: (
                    self._on_state(client, state)
                    if self.connected
                    else initial_states.append((state, monotonic()))
                )
            )
            ensure_attempt_is_live()

            self._subscribe_normal_logs(client, dump_config=dump_config)
            ensure_attempt_is_live()
        except BaseException:
            await self._disconnect_failed_client(client)
            raise

        async with self._connection_state_lock:
            ensure_attempt_is_live()
            self.entities = tuple(entities)
            self._state_tracker.connect(self.connection_generation + 1)
            for state, received_at in initial_states:
                self._state_tracker.record(state, received_at=received_at)

    @asynccontextmanager
    async def hold_connection_generation(self, generation: int) -> AsyncIterator[None]:
        """Serialize a verified result with stop/reconnect state transitions."""
        async with self._connection_state_lock:
            if not self.connected or self.connection_generation != generation:
                raise ESPHomeSessionDisconnectedError(
                    "The ESPHome API connection generation changed"
                )
            yield

    async def _async_create_client(self) -> tuple[Any, str]:
        entry = self._hass.config_entries.async_get_entry(self.esphome_entry_id)
        if entry is None or getattr(entry, "runtime_data", None) is None:
            raise ESPHomeApiRepairRequired(
                "Please select a loaded ESPHome config entry and retry"
            )
        unique_id = getattr(entry, "unique_id", None)
        try:
            expected_mac = (
                canonical_mac(unique_id) if isinstance(unique_id, str) else ""
            )
        except ValueError:
            expected_mac = ""
        if not expected_mac:
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
        return client, expected_mac

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
        dispatched_after = monotonic()
        future = self._state_tracker.expect_number_state(
            None,
            key,
            target=state,
            step=1.0,
            tolerance=tolerance,
            dispatched_after=dispatched_after,
            device_id=device_id,
        )
        try:
            client.number_command(key, state, device_id)
            await asyncio.wait_for(future, timeout)
        except StateDisconnectedError as error:
            raise ESPHomeSessionDisconnectedError(str(error)) from error
        for (
            state_type,
            record_device,
            record_key,
        ), record in self._state_tracker.state_cache.items():
            if (
                state_type.__name__ == "NumberState"
                and record_device == device_id
                and record_key == key
            ):
                return record.state
        raise ESPHomeApiRepairRequired("The number acknowledgement became unavailable")

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
    ) -> SensorSampleWindow:
        """Wait for fresh SensorState samples from the current connection."""
        if sample_count < 1:
            raise ValueError("sample_count must be positive")
        self._ready_client()
        boundary = monotonic() if after is None else after
        try:
            return await self._state_tracker.wait_sensor_states(
                key,
                device_id=device_id,
                fresh_after=boundary,
                sample_count=sample_count,
                timeout=timeout,
            )
        except StateDisconnectedError as error:
            if self._closed:
                raise asyncio.CancelledError from None
            raise ESPHomeSessionDisconnectedError(str(error)) from error

    async def async_wait_for_absolute_sensor_window(
        self,
        key: int,
        *,
        device_id: int = 0,
        sample_count: int,
        connection_generation: int,
        after: float | None = None,
        timeout: float = 10.0,
    ) -> AbsoluteSensorSampleWindow:
        """Wait for a zero-capable window from one connection generation."""
        self._ready_client()
        boundary = monotonic() if after is None else after
        try:
            return await self._state_tracker.wait_absolute_sensor_states(
                key,
                device_id=device_id,
                fresh_after=boundary,
                sample_count=sample_count,
                connection_generation=connection_generation,
                timeout=timeout,
            )
        except StateDisconnectedError as error:
            if self._closed:
                raise asyncio.CancelledError from None
            raise ESPHomeSessionDisconnectedError(str(error)) from error

    async def async_wait_for_sensor_states(
        self,
        keys: frozenset[EntityKey],
        *,
        timeout: float = 10.0,
    ) -> None:
        """Give ESPHome's initial sensor-state burst time to populate the cache."""
        self._ready_client()
        try:
            await self._state_tracker.wait_current_states(
                "SensorState", keys, timeout=timeout
            )
        except TimeoutError:
            return
        except StateDisconnectedError as error:
            raise ESPHomeSessionDisconnectedError(str(error)) from error

    async def async_calibration_sources(
        self,
        expected_instance_ids: set[str],
        *,
        timeout: float = 5.0,
        offset_stage: Literal[1, 2] | None = None,
    ) -> dict[str, Literal["flash", "configuration", "unknown"]]:
        """Request current ATM90E32 dump-config source evidence."""
        async with self._lifecycle_lock:
            client = self._ready_client()
            sources = parse_calibration_sources(
                (), expected_instance_ids, offset_stage=offset_stage
            )

            def on_log(message: Any) -> None:
                self._on_log(client, message)
                if client is not self._client or not self.connected:
                    return
                raw = message.message
                text = (
                    raw.decode("utf-8", "replace")
                    if isinstance(raw, bytes)
                    else str(raw)
                )
                # Consume fresh messages directly: a full dump can exceed the log ring.
                observed = parse_calibration_sources(
                    tuple(_strip_terminal_sequences(text).splitlines()),
                    expected_instance_ids,
                    offset_stage=offset_stage,
                )
                sources.update(
                    (key, value)
                    for key, value in observed.items()
                    if value != "unknown"
                )

            self._clear_log_subscription()
            self._unsubscribe_logs = client.subscribe_logs(
                on_log,
                self._log_level("LOG_LEVEL_DEBUG"),
                dump_config=True,
            )
            deadline = monotonic() + timeout
            while monotonic() < deadline:
                if self._ready_client() is not client:
                    raise ESPHomeSessionDisconnectedError(
                        "connection changed during status dump"
                    )
                if all(source != "unknown" for source in sources.values()):
                    return dict(sources)
                await asyncio.sleep(min(0.05, max(0.0, deadline - monotonic())))
            if self._ready_client() is not client:
                raise ESPHomeSessionDisconnectedError(
                    "connection changed during status dump"
                )
            return dict(sources)

    async def async_offset_table_snapshot(
        self,
        expected_instance_ids: set[str],
        *,
        offset_stage: Literal[1, 2],
        timeout: float = 5.0,
    ) -> dict[str, OffsetTableSnapshot | None]:
        """Capture one bounded fresh dump without depending on the public log ring."""
        if offset_stage not in (1, 2):
            raise ValueError("offset stage must be 1 or 2")
        generation, captured = await self._async_offset_dump(timeout)
        return parse_offset_table_snapshot(
            captured,
            connection_generation=generation,
            operation_sequence=0,
            expected_instance_ids=expected_instance_ids,
            started_after=0.0,
            offset_stage=offset_stage,
        )

    async def async_offset_configuration_selection(
        self, expected_instance_ids: set[str], *, timeout: float = 5.0
    ) -> dict[str, int]:
        """Fresh native per-chip selection proof; not register verification."""
        generation, captured = await self._async_offset_dump(timeout)
        return parse_offset_configuration_selection(
            captured,
            connection_generation=generation,
            expected_instance_ids=expected_instance_ids,
        )

    async def _async_offset_dump(
        self, timeout: float
    ) -> tuple[int, list[CalibrationLogLine]]:
        """Shared bounded raw dump for saved tables and final YAML selection."""
        async with self._lifecycle_lock:
            client = self._ready_client()
            generation = self.connection_generation
            captured: list[CalibrationLogLine] = []
            captured_bytes = 0
            overflowed = False
            capturing = True

            def on_log(message: Any) -> None:
                nonlocal captured_bytes, capturing, overflowed
                self._on_log(client, message)
                if not capturing or client is not self._client or not self.connected:
                    return
                raw = message.message
                text = (
                    raw.decode("utf-8", "replace")
                    if isinstance(raw, bytes)
                    else str(raw)
                )
                for raw_line in _strip_terminal_sequences(text).splitlines():
                    line = sanitize_control_text(raw_line).strip()
                    if not line:
                        continue
                    size = len(line.encode("utf-8"))
                    if (
                        len(captured) >= _MAX_OFFSET_SNAPSHOT_LINES
                        or captured_bytes + size > _MAX_OFFSET_SNAPSHOT_BYTES
                    ):
                        overflowed = True
                        capturing = False
                        return
                    captured.append(
                        CalibrationLogLine(generation, 0, monotonic(), line)
                    )
                    captured_bytes += size

            self._clear_log_subscription()
            unsubscribe = client.subscribe_logs(
                on_log,
                self._log_level("LOG_LEVEL_DEBUG"),
                dump_config=True,
            )
            self._unsubscribe_logs = unsubscribe
            deadline = monotonic() + timeout
            try:
                while monotonic() < deadline:
                    if (
                        client is not self._client
                        or not self.connected
                        or self.connection_generation != generation
                    ):
                        raise ESPHomeSessionDisconnectedError(
                            "connection generation changed during offset table snapshot"
                        )
                    if overflowed:
                        raise ESPHomeApiRepairRequired(
                            "bounded offset table snapshot exceeded its capture limit"
                        )
                    await asyncio.sleep(min(0.05, max(0.0, deadline - monotonic())))
                if (
                    client is not self._client
                    or not self.connected
                    or self.connection_generation != generation
                ):
                    raise ESPHomeSessionDisconnectedError(
                        "connection generation changed during offset table snapshot"
                    )
                if overflowed:
                    raise ESPHomeApiRepairRequired(
                        "bounded offset table snapshot exceeded its capture limit"
                    )
                return generation, captured
            finally:
                capturing = False
                if self._unsubscribe_logs is unsubscribe:
                    self._clear_log_subscription()
                else:
                    with suppress(Exception):
                        unsubscribe()
                if (
                    client is self._client
                    and self.connected
                    and self.connection_generation == generation
                ):
                    self._subscribe_normal_logs(client)

    async def async_check_meter_communication(
        self, expected_chips: int, *, timeout: float = 30.0
    ) -> None:
        """Verify every chip from a fresh config dump, not a cached boot log."""
        if type(expected_chips) is not int or not 1 <= expected_chips <= 14:
            raise ValueError("invalid expected meter chip count")
        if not isfinite(timeout) or timeout <= 0:
            raise ValueError("meter communication timeout must be positive")
        async with self._lifecycle_lock:
            client = self._ready_client()
            parser = MeterCommunicationParser()

            def callback(message: Any) -> None:
                self._on_log(client, message)
                if client is not self._client or not self.connected:
                    return
                raw = message.message
                text = raw.decode("utf-8", "replace") if isinstance(raw, bytes) else str(raw)
                for line in text.splitlines():
                    parser.feed(sanitize_control_text(line))

            self._clear_log_subscription()
            try:
                self._unsubscribe_logs = client.subscribe_logs(
                    callback, self._log_level("LOG_LEVEL_DEBUG"), dump_config=True
                )
                deadline = monotonic() + timeout
                while len(parser.checked_cs_pins) < expected_chips:
                    self._ready_client()
                    remaining = deadline - monotonic()
                    if remaining <= 0:
                        break
                    await asyncio.sleep(min(0.05, remaining))
                if parser.failed:
                    raise MeterCommunicationError(tuple(sorted(parser.failed_cs_pins)))
                self._ready_client()
                if len(parser.checked_cs_pins) != expected_chips:
                    raise TimeoutError("Meter chip communication evidence is incomplete")
            finally:
                self._clear_log_subscription()
                if client is self._client and client is not None and self.connected:
                    self._unsubscribe_logs = client.subscribe_logs(
                        lambda message: self._on_log(client, message),
                        self._log_level("LOG_LEVEL_DEBUG"),
                    )

    async def async_reconnect(self, *, dump_config: bool = False) -> None:
        """Disconnect and create a fresh client from the current ESPHome entry."""
        async with self._lifecycle_lock:
            if self._closed:
                raise ESPHomeApiRepairRequired("The ESPHome API session is closed")
            try:
                await self._async_disconnect(shutdown=False)
                await self._async_connect_locked(dump_config=dump_config)
            except asyncio.CancelledError:
                raise
            except (
                ESPHomeApiRepairRequired,
                ESPHomeIdentityError,
                ESPHomeSecurityError,
            ):
                raise
            except Exception as error:
                raise ESPHomeReconnectError(
                    "ESPHome native API reconnect failed"
                ) from error

    async def async_shutdown(self) -> None:
        """Cancel pending work and release the secondary connection once."""
        async with self._lifecycle_lock:
            self._closed = True
            self._cancel_waiters()
            if self._cleanup_task is None or (
                self._cleanup_task.done()
                and (
                    self._cleanup_task.cancelled()
                    or self._cleanup_task.exception() is not None
                )
            ):
                self._cleanup_task = asyncio.create_task(
                    self._async_disconnect(shutdown=True)
                )
            cleanup_task = self._cleanup_task
        await asyncio.shield(cleanup_task)

    def _ready_client(self) -> Any:
        if not self.connected or self._client is None:
            raise ESPHomeApiRepairRequired("The ESPHome API session is not connected")
        return self._client

    def _on_state(self, client: Any, state: Any) -> None:
        if client is not self._client or not self.connected:
            return
        self._state_tracker.record(state, received_at=monotonic())

    def _on_log(self, client: Any, message: Any) -> None:
        if client is not self._client or not self.connected:
            return
        raw = message.message
        text = raw.decode("utf-8", "replace") if isinstance(raw, bytes) else str(raw)
        text = _strip_terminal_sequences(text)
        for raw_line in text.splitlines():
            line = sanitize_control_text(raw_line).strip()
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

    def _subscribe_normal_logs(self, client: Any, *, dump_config: bool = False) -> None:
        """Restore the session's ordinary bounded-log subscriber."""
        self._clear_log_subscription()

        def callback(message: Any) -> None:
            self._on_log(client, message)

        if dump_config:
            self._unsubscribe_logs = client.subscribe_logs(
                callback,
                self._log_level("LOG_LEVEL_DEBUG"),
                dump_config=True,
            )
        else:
            self._unsubscribe_logs = client.subscribe_logs(
                callback,
                self._log_level("LOG_LEVEL_DEBUG"),
            )

    async def _async_on_stop(self, client: Any, expected_disconnect: bool) -> None:
        async with self._connection_state_lock:
            if client is not self._client:
                return
            self._state_tracker.disconnect()
            self._resolve_disconnect_waiters()
            self._clear_connection_state()

    async def _async_disconnect(self, *, shutdown: bool) -> None:
        client = self._client
        if client is None:
            async with self._connection_state_lock:
                self._state_tracker.disconnect()
                self._clear_connection_state()
            return
        async with self._connection_state_lock:
            self._state_tracker.disconnect()
            self._clear_connection_state()
        self._clear_log_subscription()
        with suppress(Exception):
            client.subscribe_logs(lambda _: None, self._log_level("LOG_LEVEL_NONE"))
        if shutdown:
            self._cancel_waiters()
        try:
            disconnect_task = asyncio.create_task(client.disconnect())
            caller_cancelled = await self._wait_for_owned_cleanup(disconnect_task)
        except BaseException:
            async with self._connection_state_lock:
                self._clear_connection_state()
            raise
        else:
            async with self._connection_state_lock:
                if self._client is client:
                    self._client = None
                self._clear_connection_state()
        if caller_cancelled:
            raise asyncio.CancelledError

    async def _disconnect_failed_client(self, client: Any) -> None:
        self._clear_log_subscription()

        async def disconnect() -> None:
            with suppress(Exception):
                await client.disconnect(force=True)

        cleanup = asyncio.create_task(disconnect())
        caller_cancelled = False
        try:
            caller_cancelled = await self._wait_for_owned_cleanup(cleanup)
        finally:
            async with self._connection_state_lock:
                if self._client is client:
                    self._client = None
                self._state_tracker.disconnect()
        if caller_cancelled:
            raise asyncio.CancelledError

    def _clear_log_subscription(self) -> None:
        unsubscribe, self._unsubscribe_logs = self._unsubscribe_logs, None
        if unsubscribe is not None:
            with suppress(Exception):
                unsubscribe()

    @staticmethod
    async def _wait_for_owned_cleanup(task: asyncio.Task[None]) -> bool:
        """Finish owned cleanup before reporting repeated caller cancellation."""
        caller_cancelled = False
        while not task.done():
            try:
                await asyncio.shield(task)
            except asyncio.CancelledError:
                caller_cancelled = True
        task.result()
        return caller_cancelled

    def _clear_connection_state(self) -> None:
        self.key_resolutions.clear()
        self.entities = ()

    def _cancel_waiters(self) -> None:
        self._state_tracker.cancel_waiters()
        for waiter in tuple(self._disconnect_waiters):
            waiter.cancel()

    def _resolve_disconnect_waiters(self) -> None:
        for waiter in tuple(self._disconnect_waiters):
            if not waiter.done():
                waiter.set_result(None)

    @staticmethod
    def _log_level(name: str) -> object:
        try:
            from aioesphomeapi import LogLevel
        except ImportError:
            raise ESPHomeApiRepairRequired(
                "Home Assistant's compatible ESPHome API helper is unavailable"
            ) from None
        return getattr(LogLevel, name)
