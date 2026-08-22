"""Minimal client for the pinned ESPHome Device Builder websocket protocol."""

from __future__ import annotations

import asyncio
import inspect
import re
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from enum import StrEnum
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
    error_count: int | None = None
    warning_count: int | None = None


class JobProgressStage(StrEnum):
    """Allowlisted upload stages derived without forwarding job text."""

    CONNECTING = "connecting"
    UPLOADING = "uploading"
    WRITING = "writing"
    VERIFYING = "verifying"
    COMPLETED = "completed"
    TRANSFER = "transfer"


@dataclass(frozen=True, slots=True)
class JobProgress:
    """One text-free progress update safe for transaction subscribers."""

    stage: JobProgressStage
    percentage: int | None = None


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
        self._pending: dict[str, asyncio.Future[Any]] = {}
        self._stream_handlers: dict[str, Callable[[dict[str, Any]], None]] = {}
        self._stream_futures: dict[str, asyncio.Future[dict[str, Any]]] = {}
        self._next_message_id = 0

    def __repr__(self) -> str:
        return f"DeviceBuilderClient(base_url={self._base_url!r}, connected={self._ws is not None})"

    @property
    def connected(self) -> bool:
        """Return whether the authoritative transport is currently attached."""
        return self._ws is not None

    async def async_connect(self) -> None:
        """Connect to `/ws` and perform opaque-token auth only if requested."""
        connection = self._connect(f"{self._base_url}/ws")
        self._ws = await connection if inspect.isawaitable(connection) else connection
        server_info = await self._ws.receive_json()
        if not server_info or "server_version" not in server_info:
            raise ConnectionError("Device Builder did not provide server info")
        self._listener = asyncio.create_task(self._listen())
        if server_info.get("requires_auth") is not False:
            if not self._token:
                raise ConnectionError("Device Builder requires an issued bearer token")
            future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
            self._pending["0"] = future
            await self._ws.send_json(
                {"command": "auth", "message_id": "0", "args": {"token": self._token}}
            )
            try:
                await future
            finally:
                self._pending.pop("0", None)

    async def async_disconnect(self) -> None:
        """Close the websocket and fail all outstanding callers."""
        listener, self._listener = self._listener, None
        if listener is not None:
            listener.cancel()
        websocket = self._ws
        if websocket is None:
            self._fail_pending()
            return
        close_task = asyncio.create_task(websocket.close())
        try:
            await asyncio.shield(close_task)
        except asyncio.CancelledError:
            try:
                await close_task
            finally:
                self._ws = None
                self._fail_pending()
            raise
        finally:
            if close_task.done():
                self._ws = None
                self._fail_pending()

    async def async_command(self, command: str, args: dict[str, Any]) -> Any:
        """Send one pinned protocol command and await its matching envelope."""
        if self._ws is None:
            raise ConnectionError("Device Builder is disconnected")
        self._next_message_id += 1
        message_id = str(self._next_message_id)
        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
        self._pending[message_id] = future
        await self._ws.send_json(
            {"command": command, "message_id": message_id, "args": args}
        )
        try:
            return await future
        finally:
            self._pending.pop(message_id, None)

    async def _async_stream_command(
        self,
        command: str,
        args: dict[str, Any],
        progress: Callable[[JobProgress], None] | None = None,
    ) -> tuple[dict[str, Any], tuple[str, ...]]:
        """Run a pinned streaming command until its `result` event."""
        if self._ws is None:
            raise ConnectionError("Device Builder is disconnected")
        self._next_message_id += 1
        message_id = str(self._next_message_id)
        future: asyncio.Future[dict[str, Any]] = (
            asyncio.get_running_loop().create_future()
        )
        output: list[str] = []

        def handle(event: dict[str, Any]) -> None:
            if event["event"] == "output":
                line = str(event.get("data", ""))
                output.append(line)
                del output[: -self._output_tail_size]
                if progress is not None and (update := _job_progress(line)) is not None:
                    progress(update)
            elif event["event"] == "result" and not future.done():
                data = event.get("data", {})
                future.set_result(data if isinstance(data, dict) else {})

        self._stream_handlers[message_id] = handle
        self._stream_futures[message_id] = future
        await self._ws.send_json(
            {"command": command, "message_id": message_id, "args": args}
        )
        try:
            return await future, tuple(output)
        finally:
            self._stream_handlers.pop(message_id, None)
            self._stream_futures.pop(message_id, None)

    async def async_list_devices(self) -> dict[str, Any]:
        return await self.async_command("devices/list", {})

    async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
        result = await self.async_command(
            "devices/get_config", {"configuration": configuration}
        )
        if not isinstance(result, str):
            raise ConnectionError("Device Builder returned an invalid configuration")
        content = result
        return ESPHomeConfigSnapshot(
            configuration, content, sha256(content.encode()).hexdigest()
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
        terminal, output = await self._async_stream_command(
            "devices/validate", {"configuration": configuration}
        )
        return self._validation_result(terminal, output)

    async def async_compile(self, configuration: str) -> JobResult:
        result = await self.async_command(
            "firmware/compile", {"configuration": configuration}
        )
        return await self._async_follow_job(result)

    async def async_upload(
        self,
        configuration: str,
        progress: Callable[[JobProgress], None] | None = None,
    ) -> JobResult:
        result = await self.async_command(
            "firmware/upload", {"configuration": configuration, "port": "OTA"}
        )
        return await self._async_follow_job(result, progress)

    async def async_restore_content(
        self,
        configuration: str,
        content: str,
        expected_current_sha256: str | None = None,
    ) -> None:
        """Restore exact content and raise a distinct error if validation fails."""
        try:
            if expected_current_sha256 is None:
                expected_current_sha256 = (
                    await self.async_get_config(configuration)
                ).sha256
            await self.async_update_config(
                ESPHomeConfigSnapshot(configuration, "", expected_current_sha256),
                content,
            )
            validation = await self.async_validate(configuration)
            if not validation.success:
                raise RollbackError("Device Builder rollback validation failed")
        except ConfigChangedError, RollbackError:
            raise
        except Exception as err:
            raise RollbackError("Device Builder rollback failed") from err

    async def _async_follow_job(
        self,
        result: dict[str, Any],
        progress: Callable[[JobProgress], None] | None = None,
    ) -> JobResult:
        job_id = result["job_id"]
        terminal, output = await self._async_stream_command(
            "firmware/follow_job", {"job_id": job_id}, progress
        )
        return self._job_result(terminal, job_id, output)

    def _job_result(
        self,
        result: dict[str, Any],
        job_id: str | None = None,
        output: tuple[str, ...] = (),
    ) -> JobResult:
        output = result.get("output", output)
        if isinstance(output, str):
            output = (output,)
        return JobResult(
            result.get("status") == "completed",
            result.get("exit_code"),
            result.get("error", ""),
            tuple(str(line) for line in output[-self._output_tail_size :]),
            job_id,
        )

    def _validation_result(
        self, result: dict[str, Any], output: tuple[str, ...]
    ) -> JobResult:
        """Map the generic validation stream terminal result."""
        return JobResult(
            bool(result.get("success")),
            result.get("code"),
            result.get("summary", result.get("error", "")),
            output,
            error_count=_structured_count(result.get("error_count")),
            warning_count=_structured_count(result.get("warning_count")),
        )

    async def _listen(self) -> None:
        assert self._ws is not None
        try:
            while message := await self._ws.receive_json():
                message_id = message.get("message_id")
                if (
                    isinstance(message_id, str)
                    and "event" in message
                    and message_id in self._stream_handlers
                ):
                    self._stream_handlers[message_id](message)
                    continue
                if not isinstance(message_id, str):
                    continue
                stream_future = self._stream_futures.get(message_id)
                if (
                    "error_code" in message
                    and stream_future is not None
                    and not stream_future.done()
                ):
                    stream_future.set_exception(
                        ConnectionError("Device Builder command failed")
                    )
                    continue
                future = self._pending.get(message_id)
                if future is None or future.done():
                    continue
                if "error_code" in message:
                    future.set_exception(
                        ConnectionError("Device Builder command failed")
                    )
                elif "result" in message:
                    future.set_result(message["result"])
        finally:
            self._ws = None
            self._fail_pending()

    def _fail_pending(self) -> None:
        for future in self._pending.values():
            if not future.done():
                future.set_exception(ConnectionError("Device Builder disconnected"))
        for future in self._stream_futures.values():
            if not future.done():
                future.set_exception(ConnectionError("Device Builder disconnected"))


_PERCENT_RE = re.compile(r"(?<!\d)(100|[1-9]?\d)\s*%")


def _job_progress(line: str) -> JobProgress | None:
    """Reduce arbitrary builder output to allowlisted stage and percentage fields."""
    lowered = line.lower()
    stage = next(
        (
            value
            for marker, value in (
                ("successfully uploaded", JobProgressStage.COMPLETED),
                ("verif", JobProgressStage.VERIFYING),
                ("writing", JobProgressStage.WRITING),
                ("upload", JobProgressStage.UPLOADING),
                ("connect", JobProgressStage.CONNECTING),
            )
            if marker in lowered
        ),
        None,
    )
    match = _PERCENT_RE.search(line)
    percentage = int(match.group(1)) if match else None
    if stage is None and percentage is not None:
        stage = JobProgressStage.TRANSFER
    if stage is None:
        return None
    if stage is JobProgressStage.COMPLETED and percentage is None:
        percentage = 100
    return JobProgress(stage, percentage)


def _structured_count(value: object) -> int | None:
    """Accept only small non-boolean integer protocol counts."""
    return (
        value
        if isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 999
        else None
    )
