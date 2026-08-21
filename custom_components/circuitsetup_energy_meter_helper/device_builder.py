"""Minimal client for the pinned ESPHome Device Builder websocket protocol."""

from __future__ import annotations

import asyncio
import inspect
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from hashlib import sha256
from typing import Any, Protocol


class WebSocket(Protocol):
    """The small JSON websocket surface used by Device Builder."""

    async def send_json(self, message: dict[str, Any]) -> None: ...

    async def receive_json(self) -> dict[str, Any] | None: ...

    async def close(self) -> None: ...


@dataclass(frozen=True, slots=True)
class ESPHomeConfigSnapshot:
    """One configuration read, with its source hash."""

    configuration: str
    content: str
    sha256: str


@dataclass(frozen=True, slots=True)
class JobResult:
    """The bounded terminal result of a validation, compile, or upload job."""

    success: bool
    code: int | None
    summary: str
    output_tail: tuple[str, ...]
    job_id: str | None = None


class ConfigChangedError(RuntimeError):
    """The configuration changed after it was inspected."""

    def __init__(self, expected: str, actual: str) -> None:
        super().__init__("Device Builder configuration changed before update")
        self.expected = expected
        self.actual = actual


class RollbackError(RuntimeError):
    """The original configuration could not be restored and validated."""


class DeviceBuilderClient:
    """One authenticated websocket with correlation and bounded job output."""

    def __init__(
        self,
        base_url: str,
        *,
        token: str | None = None,
        connect: Callable[[str], WebSocket | Awaitable[WebSocket]],
        output_tail_size: int = 100,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._token = token
        self._connect = connect
        self._output_tail_size = output_tail_size
        self._ws: WebSocket | None = None
        self._listener: asyncio.Task[None] | None = None
        self._pending: dict[str, asyncio.Future[dict[str, Any]]] = {}
        self._stream_handlers: dict[str, Callable[[dict[str, Any]], None]] = {}
        self._next_message_id = 0

    def __repr__(self) -> str:
        return f"DeviceBuilderClient(base_url={self._base_url!r}, connected={self._ws is not None})"

    async def async_connect(self) -> None:
        """Connect to `/ws` and perform opaque-token auth only if requested."""
        connection = self._connect(f"{self._base_url}/ws")
        self._ws = await connection if inspect.isawaitable(connection) else connection
        server_info = await self._ws.receive_json()
        if not server_info or server_info.get("type") != "server_info":
            raise ConnectionError("Device Builder did not provide server info")
        if server_info.get("requires_auth"):
            if not self._token:
                raise ConnectionError("Device Builder requires an issued bearer token")
            await self._ws.send_json(
                {"command": "auth", "message_id": "0", "args": {"token": self._token}}
            )
        self._listener = asyncio.create_task(self._listen())

    async def async_disconnect(self) -> None:
        """Close the websocket and fail all outstanding callers."""
        listener, self._listener = self._listener, None
        if listener is not None:
            listener.cancel()
        if self._ws is not None:
            await self._ws.close()
            self._ws = None
        self._fail_pending()

    async def async_command(self, command: str, args: dict[str, Any]) -> dict[str, Any]:
        """Send one pinned protocol command and await its matching envelope."""
        if self._ws is None:
            raise ConnectionError("Device Builder is disconnected")
        self._next_message_id += 1
        message_id = str(self._next_message_id)
        future: asyncio.Future[dict[str, Any]] = asyncio.get_running_loop().create_future()
        self._pending[message_id] = future
        await self._ws.send_json(
            {"command": command, "message_id": message_id, "args": args}
        )
        try:
            return await future
        finally:
            self._pending.pop(message_id, None)

    async def async_list_devices(self) -> dict[str, Any]:
        return await self.async_command("devices/list", {})

    async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
        result = await self.async_command(
            "devices/get_config", {"configuration": configuration}
        )
        content = result["content"]
        return ESPHomeConfigSnapshot(
            result.get("configuration", configuration), content, sha256(content.encode()).hexdigest()
        )

    async def async_update_config(
        self, snapshot: ESPHomeConfigSnapshot, proposed_content: str
    ) -> None:
        latest = await self.async_get_config(snapshot.configuration)
        if latest.sha256 != snapshot.sha256:
            raise ConfigChangedError(snapshot.sha256, latest.sha256)
        await self.async_command(
            "devices/update_config",
            {"configuration": snapshot.configuration, "content": proposed_content},
        )

    async def async_import_device(self, import_data: dict[str, Any]) -> str:
        result = await self.async_command("devices/import", import_data)
        return result["configuration"]

    async def async_validate(self, configuration: str) -> JobResult:
        return self._job_result(
            await self.async_command("devices/validate", {"configuration": configuration})
        )

    async def async_compile(self, configuration: str) -> JobResult:
        result = await self.async_command("firmware/compile", {"configuration": configuration})
        return await self._async_follow_job(result)

    async def async_upload(self, configuration: str) -> JobResult:
        result = await self.async_command(
            "firmware/upload", {"configuration": configuration, "port": "OTA"}
        )
        return await self._async_follow_job(result)

    async def async_restore_content(self, configuration: str, content: str) -> None:
        """Restore exact content and raise a distinct error if validation fails."""
        current = await self.async_get_config(configuration)
        await self.async_command(
            "devices/update_config", {"configuration": current.configuration, "content": content}
        )
        validation = await self.async_validate(configuration)
        if not validation.success:
            raise RollbackError("Device Builder rollback validation failed")

    async def _async_follow_job(self, result: dict[str, Any]) -> JobResult:
        job_id = result["job_id"]
        terminal = await self.async_command("firmware/follow_job", {"job_id": job_id})
        return self._job_result(terminal, job_id)

    def _job_result(self, result: dict[str, Any], job_id: str | None = None) -> JobResult:
        output = result.get("output", ())
        if isinstance(output, str):
            output = (output,)
        return JobResult(
            bool(result.get("success")),
            result.get("code"),
            result.get("summary", ""),
            tuple(str(line) for line in output[-self._output_tail_size :]),
            job_id,
        )

    async def _listen(self) -> None:
        assert self._ws is not None
        try:
            while message := await self._ws.receive_json():
                message_id = message.get("message_id")
                if (
                    message["type"] == "event"
                    and isinstance(message_id, str)
                    and message_id in self._stream_handlers
                ):
                    self._stream_handlers[message_id](message)
                    continue
                if not isinstance(message_id, str):
                    continue
                future = self._pending.get(message_id)
                if future is None or future.done():
                    continue
                if message["type"] == "error":
                    future.set_exception(ConnectionError("Device Builder command failed"))
                else:
                    future.set_result(message.get("result", {}))
        finally:
            self._ws = None
            self._fail_pending()

    def _fail_pending(self) -> None:
        for future in self._pending.values():
            if not future.done():
                future.set_exception(ConnectionError("Device Builder disconnected"))
