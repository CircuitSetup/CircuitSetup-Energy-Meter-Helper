"""Minimal client for the pinned ESPHome Device Builder websocket protocol."""

from __future__ import annotations

import asyncio
import inspect
import re
from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass
from enum import StrEnum
from hashlib import sha256
from typing import Any, Protocol
from urllib.parse import urlsplit

from awesomeversion import AwesomeVersion


async def _wait_for_owned_cleanup[T](task: asyncio.Task[T]) -> bool:
    """Finish owned cleanup before reporting repeated caller cancellation."""
    caller_cancelled = False
    while not task.done():
        try:
            await asyncio.wait((task,))
        except asyncio.CancelledError:
            if task.done():
                break
            caller_cancelled = True
        except BaseException as error:
            if caller_cancelled:
                raise BaseExceptionGroup(
                    "owned cleanup failed after caller cancellation",
                    [asyncio.CancelledError(), error],
                ) from error
            raise
    try:
        task.result()
    except BaseException as error:
        if caller_cancelled:
            raise BaseExceptionGroup(
                "owned cleanup failed after caller cancellation",
                [asyncio.CancelledError(), error],
            ) from error
        raise
    return caller_cancelled


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
        self._disconnect_task: asyncio.Task[None] | None = None
        self._server_version: AwesomeVersion | None = None
        self._connect_lock = asyncio.Lock()
        self._ready = False
        self._lifecycle_generation = 0

    def __repr__(self) -> str:
        parsed = urlsplit(self._base_url)
        hostname = parsed.hostname
        if parsed.scheme and hostname:
            host = f"[{hostname}]" if ":" in hostname else hostname
            origin = f"{parsed.scheme}://{host}"
            if parsed.port is not None:
                origin += f":{parsed.port}"
        else:
            origin = "<configured>"
        return f"DeviceBuilderClient(origin={origin!r}, connected={self.connected})"

    @property
    def connected(self) -> bool:
        """Return whether the authoritative transport is currently attached."""
        return self._ready

    @property
    def server_version(self) -> AwesomeVersion | None:
        """Return the last successfully parsed Device Builder version."""
        return self._server_version

    async def async_connect(self) -> None:
        """Connect to `/ws` and perform opaque-token auth only if requested."""
        async with self._connect_lock:
            if self._ws is not None or self._listener is not None:
                raise ConnectionError("Device Builder is already connected")
            await self._async_connect(self._lifecycle_generation)

    async def _async_connect(self, generation: int) -> None:
        connection = self._connect(f"{self._base_url}/ws")
        websocket = await connection if inspect.isawaitable(connection) else connection
        listener: asyncio.Task[None] | None = None
        try:
            self._ensure_connect_owner(generation)
            server_info = await websocket.receive_json()
            self._ensure_connect_owner(generation)
            if not isinstance(server_info, Mapping) or "server_version" not in server_info:
                raise ConnectionError("Device Builder did not provide server info")
            version_value = server_info["server_version"]
            if type(version_value) is not str:
                raise ConnectionError("Device Builder returned an invalid server version")
            try:
                server_version = AwesomeVersion(version_value)
            except (TypeError, ValueError) as error:
                raise ConnectionError(
                    "Device Builder returned an invalid server version"
                ) from error
            if not server_version.valid:
                raise ConnectionError("Device Builder returned an invalid server version")
            listener = asyncio.create_task(self._listen(websocket))
            self._ws = websocket
            self._listener = listener
            if server_info.get("requires_auth") is not False:
                if not self._token:
                    raise ConnectionError("Device Builder requires an issued bearer token")
                future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
                self._pending["0"] = future
                await websocket.send_json(
                    {"command": "auth", "message_id": "0", "args": {"token": self._token}}
                )
                try:
                    await future
                finally:
                    self._pending.pop("0", None)
            self._ensure_connect_owner(generation)
            self._server_version = server_version
            self._ready = True
        except BaseException as error:
            cleanup = asyncio.create_task(
                self._async_connect_cleanup(websocket, listener)
            )
            try:
                caller_cancelled = await _wait_for_owned_cleanup(cleanup)
            except BaseException as cleanup_error:
                if isinstance(error, asyncio.CancelledError):
                    raise BaseExceptionGroup(
                        "connection cleanup failed after cancellation",
                        [error, cleanup_error],
                    ) from cleanup_error
                error.add_note(f"connection cleanup failed: {cleanup_error}")
                raise error from cleanup_error
            if caller_cancelled:
                raise asyncio.CancelledError
            raise

    def _ensure_connect_owner(self, generation: int) -> None:
        if generation != self._lifecycle_generation:
            raise ConnectionError("Device Builder connection was invalidated")

    async def _async_connect_cleanup(
        self, websocket: WebSocket, listener: asyncio.Task[None] | None
    ) -> None:
        """Finish failed-connect ownership before publishing cancellation."""
        if self._ws is websocket:
            self._ready = False
            self._ws = None
            self._listener = None
            self._fail_pending()
        if listener is not None and not listener.done():
            listener.cancel()
            await asyncio.gather(listener, return_exceptions=True)
        await websocket.close()

    async def async_disconnect(self) -> None:
        """Close the websocket and fail all outstanding callers."""
        self._lifecycle_generation += 1
        task = self._disconnect_task
        if task is None or (
            task.done() and (task.cancelled() or task.exception() is not None)
        ):
            if task is not None and task.done() and not task.cancelled():
                task.exception()
            task = self._disconnect_task = asyncio.create_task(
                self._async_disconnect_owned()
            )
        caller_cancelled = await _wait_for_owned_cleanup(task)
        if self._disconnect_task is task:
            self._disconnect_task = None
        if caller_cancelled:
            raise asyncio.CancelledError

    async def _async_disconnect_owned(self) -> None:
        """Settle the actual transport before publishing disconnected state."""
        websocket = self._ws
        listener = self._listener
        if websocket is None:
            self._ready = False
            if listener is not None and not listener.done():
                listener.cancel()
                await asyncio.gather(listener, return_exceptions=True)
            self._listener = None
            self._fail_pending()
            return
        await websocket.close()
        if listener is not None and not listener.done():
            listener.cancel()
            await asyncio.gather(listener, return_exceptions=True)
        if self._listener is listener:
            self._listener = None
        if self._ws is websocket:
            self._ready = False
            self._ws = None
        self._fail_pending()

    async def async_command(self, command: str, args: dict[str, Any]) -> Any:
        """Send one pinned protocol command and await its matching envelope."""
        websocket = self._ws
        if not self._ready or websocket is None:
            raise ConnectionError("Device Builder is disconnected")
        self._next_message_id += 1
        message_id = str(self._next_message_id)
        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
        self._pending[message_id] = future
        await websocket.send_json(
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
        websocket = self._ws
        if not self._ready or websocket is None:
            raise ConnectionError("Device Builder is disconnected")
        self._next_message_id += 1
        message_id = str(self._next_message_id)
        future: asyncio.Future[dict[str, Any]] = (
            asyncio.get_running_loop().create_future()
        )
        output: list[str] = []
        ninja_total = 0
        last_percentages: dict[JobProgressStage, int] = {}
        last_stage: JobProgressStage | None = None

        def handle(event: dict[str, Any]) -> None:
            nonlocal ninja_total, last_stage
            if event["event"] == "output":
                line = str(event.get("data", ""))
                output.append(line)
                del output[: -self._output_tail_size]
                if progress is not None:
                    update = _job_progress(line)
                    if match := _NINJA_PROGRESS_RE.match(line):
                        done, total = int(match.group(1)), int(match.group(2))
                        if done <= total and total >= 100 and total >= ninja_total:
                            ninja_total = total
                            update = JobProgress(JobProgressStage.TRANSFER, done * 100 // total)
                    if update is not None:
                        previous = last_percentages.get(update.stage)
                        if update.percentage is None:
                            if previous is not None or update.stage is last_stage:
                                return
                        elif previous is not None and update.percentage <= previous:
                            return
                        else:
                            last_percentages[update.stage] = update.percentage
                        last_stage = update.stage
                        progress(update)
            elif event["event"] == "result" and not future.done():
                data = event.get("data", {})
                future.set_result(data if isinstance(data, dict) else {})

        self._stream_handlers[message_id] = handle
        self._stream_futures[message_id] = future
        await websocket.send_json(
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

    async def async_compile(
        self,
        configuration: str,
        progress: Callable[[JobProgress], None] | None = None,
    ) -> JobResult:
        result = await self.async_command(
            "firmware/compile", {"configuration": configuration}
        )
        return await self._async_follow_job(result, progress)

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
            restored_sha256 = sha256(content.encode()).hexdigest()
            if expected_current_sha256 is None:
                expected_current_sha256 = (
                    await self.async_get_config(configuration)
                ).sha256
            try:
                await self.async_update_config(
                    ESPHomeConfigSnapshot(configuration, "", expected_current_sha256),
                    content,
                )
            except ConfigChangedError:
                if (await self.async_get_config(configuration)).sha256 != restored_sha256:
                    raise
            validation = await self.async_validate(configuration)
            if not validation.success:
                raise RollbackError("Device Builder rollback validation failed")
            restored = await self.async_get_config(configuration)
            if restored.sha256 != restored_sha256:
                raise RollbackError("Device Builder rollback verification failed")
        except (ConfigChangedError, RollbackError):
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

    async def _listen(self, websocket: WebSocket) -> None:
        try:
            while message := await websocket.receive_json():
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
            if self._ws is websocket:
                self._ready = False
                self._ws = None
                if self._listener is asyncio.current_task():
                    self._listener = None
                self._fail_pending()

    def _fail_pending(self) -> None:
        for future in self._pending.values():
            if not future.done():
                future.set_exception(ConnectionError("Device Builder disconnected"))
        for future in self._stream_futures.values():
            if not future.done():
                future.set_exception(ConnectionError("Device Builder disconnected"))


_PROGRESS_PERCENT_RES = (
    re.compile(r"^\s*\[\s*(\d{1,3})\s*%\s*\]"),
    re.compile(r"\(\s*(\d{1,3})\s*%\s*\)"),
    re.compile(r"Writing at\b.*?(\d{1,3})(?:\.\d+)?\s*%"),
    re.compile(r"^\s*Uploading:.*?\b(\d{1,3})\s*%"),
)
_NINJA_PROGRESS_RE = re.compile(
    r"^(?:\x1b\[[0-9;]*[A-Za-z])*\s*\[\s*(\d+)\s*/\s*(\d+)\s*\] "
)


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
    percentage = next(
        (int(match.group(1)) for pattern in _PROGRESS_PERCENT_RES if (match := pattern.search(line))),
        None,
    )
    if percentage is not None and not 0 <= percentage <= 100:
        percentage = None
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
