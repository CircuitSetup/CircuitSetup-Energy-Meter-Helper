"""Tests for the pinned ESPHome Device Builder websocket client."""

import asyncio
from hashlib import sha256

import pytest
from awesomeversion import AwesomeVersion

from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ConfigChangedError,
    DeviceBuilderClient,
    ESPHomeConfigSnapshot,
    JobProgressStage,
    JobResult,
    RollbackError,
)


class FakeWebSocket:
    """Small in-memory websocket used to drive the protocol."""

    def __init__(self, server_info: object) -> None:
        self.sent: list[dict] = []
        self.closed = False
        self._received: asyncio.Queue[dict | None] = asyncio.Queue()
        self._received.put_nowait(server_info)
        if isinstance(server_info, dict) and server_info.get("requires_auth"):
            self._received.put_nowait({"message_id": "0", "result": {}})

    async def send_json(self, message: dict) -> None:
        self.sent.append(message)

    async def receive_json(self) -> dict | None:
        return await self._received.get()

    async def send_result(self, message_id: str, result: dict) -> None:
        await self._received.put({"message_id": message_id, "result": result})

    async def send_event(self, message_id: str, event: str, data: object) -> None:
        await self._received.put(
            {"message_id": message_id, "event": event, "data": data}
        )

    async def close(self) -> None:
        self.closed = True
        await self._received.put(None)


async def connected_client(
    requires_auth: bool = False, token: str | None = None
) -> tuple[DeviceBuilderClient, FakeWebSocket]:
    ws = FakeWebSocket({"server_version": "1.0", "requires_auth": requires_auth})
    client = DeviceBuilderClient("http://builder", token=token, connect=lambda _: ws)
    await client.async_connect()
    return client, ws


def test_trusted_server_skips_auth() -> None:
    """Trusted Supervisor ingress needs no bearer token."""

    async def run() -> None:
        client, ws = await connected_client()
        assert ws.sent == []
        await client.async_disconnect()

    asyncio.run(run())


def test_server_version_is_parsed_and_replaced_on_reconnect() -> None:
    async def run() -> None:
        websockets = [
            FakeWebSocket({"server_version": "2026.9.0", "requires_auth": False}),
            FakeWebSocket({"server_version": "2026.10.1", "requires_auth": False}),
        ]
        client = DeviceBuilderClient(
            "http://builder", connect=lambda _: websockets.pop(0)
        )
        await client.async_connect()
        assert client.server_version == AwesomeVersion("2026.9.0")
        await client.async_disconnect()
        await client.async_connect()
        assert client.server_version == AwesomeVersion("2026.10.1")
        await client.async_disconnect()

    asyncio.run(run())


@pytest.mark.parametrize("server_info", ({}, {"server_version": "not-a-version"}))
def test_malformed_or_missing_server_version_uses_connection_error(
    server_info: dict[str, object],
) -> None:
    async def run() -> None:
        client = DeviceBuilderClient(
            "http://builder", connect=lambda _: FakeWebSocket(server_info)
        )
        with pytest.raises(ConnectionError):
            await client.async_connect()

    asyncio.run(run())


def test_failed_reconnect_preserves_last_observed_server_version() -> None:
    async def run() -> None:
        websockets = [
            FakeWebSocket({"server_version": "2026.9.0", "requires_auth": False}),
            FakeWebSocket({"server_version": "not-a-version", "requires_auth": False}),
        ]
        client = DeviceBuilderClient(
            "http://builder", connect=lambda _: websockets.pop(0)
        )
        await client.async_connect()
        await client.async_disconnect()
        with pytest.raises(ConnectionError):
            await client.async_connect()
        assert client.server_version == AwesomeVersion("2026.9.0")

    asyncio.run(run())


def test_failed_auth_does_not_publish_version_and_closes_failed_transport() -> None:
    async def run() -> None:
        ws = FakeWebSocket({"server_version": "2026.9.0", "requires_auth": True})
        client = DeviceBuilderClient(
            "http://builder", token=None, connect=lambda _: ws
        )
        with pytest.raises(ConnectionError):
            await client.async_connect()
        assert client.server_version is None
        assert not client.connected
        assert ws.closed

    asyncio.run(run())


@pytest.mark.parametrize(
    "server_info",
    (None, [], {"server_version": 2026}, {"server_version": True},
     {"server_version": None}, {"server_version": []}),
)
def test_server_info_boundary_rejects_non_mapping_or_non_string_version(
    server_info: object,
) -> None:
    async def run() -> None:
        ws = FakeWebSocket(server_info)  # type: ignore[arg-type]
        client = DeviceBuilderClient("http://builder", connect=lambda _: ws)
        with pytest.raises(ConnectionError):
            await client.async_connect()
        assert not client.connected
        assert ws.closed

    asyncio.run(run())


def test_overlapping_connect_is_rejected_without_disturbing_owner() -> None:
    async def run() -> None:
        first = FakeWebSocket({"server_version": "2026.9.0", "requires_auth": False})
        second = FakeWebSocket({"server_version": "2026.10.0", "requires_auth": False})
        sockets = iter((first, second))
        client = DeviceBuilderClient("http://builder", connect=lambda _: next(sockets))
        await client.async_connect()
        with pytest.raises(ConnectionError, match="already connected"):
            await client.async_connect()
        assert client.server_version == AwesomeVersion("2026.9.0")
        assert not second.closed
        await client.async_disconnect()

    asyncio.run(run())


def test_missing_auth_flag_requires_opaque_token() -> None:
    """Only an explicit false ServerInfo flag permits trusted ingress."""

    async def run() -> None:
        ws = FakeWebSocket({"server_version": "1.0"})
        client = DeviceBuilderClient("http://builder", connect=lambda _: ws)
        with pytest.raises(ConnectionError):
            await client.async_connect()
        token_client = DeviceBuilderClient(
            "http://builder",
            token="opaque",
            connect=lambda _: FakeWebSocket(
                {"server_version": "1.0", "requires_auth": True}
            ),
        )
        await token_client.async_connect()
        await token_client.async_disconnect()

    asyncio.run(run())


def test_opaque_token_auth_and_repr_are_redacted() -> None:
    """Only opaque backend tokens authenticate and never appear in repr."""

    async def run() -> None:
        client, ws = await connected_client(True, "secret-token")
        assert ws.sent[0]["command"] == "auth"
        assert ws.sent[0]["args"] == {"token": "secret-token"}
        assert "secret-token" not in repr(client)
        await client.async_disconnect()

    asyncio.run(run())


def test_command_result_is_correlated() -> None:
    """Concurrent requests resolve by message ID, not arrival order."""

    async def run() -> None:
        client, ws = await connected_client()
        first = asyncio.create_task(client.async_command("devices/list", {}))
        second = asyncio.create_task(client.async_command("devices/list", {"x": 1}))
        await asyncio.sleep(0)
        await ws.send_result("2", {"second": True})
        await ws.send_result("1", {"first": True})
        assert await first == {"first": True}
        assert await second == {"second": True}
        await client.async_disconnect()

    asyncio.run(run())


def test_disconnect_fails_pending_request() -> None:
    """Connection loss fails waiting callers rather than hanging."""

    async def run() -> None:
        client, ws = await connected_client()
        request = asyncio.create_task(client.async_command("devices/list", {}))
        await asyncio.sleep(0)
        await ws.close()
        with pytest.raises(ConnectionError):
            await request

    asyncio.run(run())


@pytest.mark.parametrize("cancel_count", (1, 3))
def test_disconnect_drains_actual_websocket_close_through_repeated_cancellation(
    cancel_count: int,
) -> None:
    """Caller cancellation cannot cancel the transport close or publish early state."""

    async def run() -> None:
        close_started = asyncio.Event()
        close_release = asyncio.Event()
        close_cancellations = 0

        class GatedWebSocket(FakeWebSocket):
            async def close(self) -> None:
                nonlocal close_cancellations
                close_started.set()
                try:
                    await close_release.wait()
                except asyncio.CancelledError:
                    close_cancellations += 1
                    raise
                await super().close()

        ws = GatedWebSocket({"server_version": "1.0", "requires_auth": False})
        client = DeviceBuilderClient("http://builder", connect=lambda _: ws)
        await client.async_connect()
        closing = asyncio.create_task(client.async_disconnect())
        await close_started.wait()
        for _ in range(cancel_count):
            closing.cancel()
            await asyncio.sleep(0)
        assert client.connected
        assert not closing.done()
        close_release.set()
        with pytest.raises(asyncio.CancelledError):
            await closing
        assert close_cancellations == 0
        assert not client.connected
        await client.async_disconnect()

    asyncio.run(run())


@pytest.mark.parametrize("cancel_count", (1, 3))
def test_disconnect_reports_cancel_and_close_failure_then_retries(
    cancel_count: int,
) -> None:
    """A failed owned close reports cancellation too and retains the transport."""

    async def run() -> None:
        close_started = asyncio.Event()
        close_release = asyncio.Event()
        attempts = 0
        unhandled: list[dict[str, object]] = []
        loop = asyncio.get_running_loop()
        previous_handler = loop.get_exception_handler()
        loop.set_exception_handler(lambda _loop, context: unhandled.append(context))

        class RetryWebSocket(FakeWebSocket):
            async def close(self) -> None:
                nonlocal attempts
                attempts += 1
                if attempts == 1:
                    close_started.set()
                    await close_release.wait()
                    raise RuntimeError("transport close failed")
                await super().close()

        try:
            ws = RetryWebSocket({"server_version": "1.0", "requires_auth": False})
            client = DeviceBuilderClient("http://builder", connect=lambda _: ws)
            await client.async_connect()
            closing = asyncio.create_task(client.async_disconnect())
            await close_started.wait()
            for _ in range(cancel_count):
                closing.cancel()
                await asyncio.sleep(0)
            close_release.set()
            with pytest.raises(BaseExceptionGroup) as caught:
                await closing
            assert (
                sum(
                    isinstance(error, asyncio.CancelledError)
                    for error in caught.value.exceptions
                )
                == 1
            )
            assert (
                sum(
                    isinstance(error, RuntimeError) for error in caught.value.exceptions
                )
                == 1
            )
            assert client.connected
            await asyncio.sleep(0)
            assert unhandled == []
            await client.async_disconnect()
            assert attempts == 2
            assert not client.connected
        finally:
            loop.set_exception_handler(previous_handler)

    asyncio.run(run())


def test_config_commands_and_hash_precondition() -> None:
    """Config updates re-read their source and reject changed content."""

    async def run() -> None:
        client, ws = await connected_client()
        snapshot = ESPHomeConfigSnapshot("meter.yaml", "api: {}", "old")
        update = asyncio.create_task(client.async_update_config(snapshot, "new: value"))
        await asyncio.sleep(0)
        await ws.send_result("1", "changed")
        with pytest.raises(ConfigChangedError):
            await update
        assert "new: value" not in repr(client)
        await client.async_disconnect()

    asyncio.run(run())


def test_compile_follows_singular_job_with_bounded_tail() -> None:
    """Compile follows the returned job and retains only a bounded output tail."""

    async def run() -> None:
        client, ws = await connected_client()
        compile_task = asyncio.create_task(client.async_compile("meter.yaml"))
        await asyncio.sleep(0)
        await ws.send_result("1", {"job_id": "job-1"})
        await asyncio.sleep(0)
        await asyncio.sleep(0)
        assert ws.sent[1]["command"] == "firmware/follow_job"
        await ws.send_event("2", "output", "a")
        await ws.send_event("2", "output", "b")
        await ws.send_event("2", "result", {"status": "completed", "exit_code": 0})
        result = await compile_task
        assert result.success
        assert result.output_tail == ("a", "b")
        await client.async_disconnect()

    asyncio.run(run())


def test_failed_job_uses_pinned_terminal_fields() -> None:
    """Pinned follow-job failures map status, exit_code, and error."""

    async def run() -> None:
        client, ws = await connected_client()
        task = asyncio.create_task(client.async_compile("meter.yaml"))
        await asyncio.sleep(0)
        await ws.send_result("1", {"job_id": "job-1"})
        await asyncio.sleep(0)
        await asyncio.sleep(0)
        await ws.send_event(
            "2", "result", {"status": "failed", "exit_code": 2, "error": "bad"}
        )
        result = await task
        assert not result.success and result.code == 2 and result.summary == "bad"
        await client.async_disconnect()

    asyncio.run(run())


def test_validation_uses_generic_terminal_fields() -> None:
    """Validation streams use generic success/code rather than firmware status."""

    async def run() -> None:
        client, ws = await connected_client()
        task = asyncio.create_task(client.async_validate("meter.yaml"))
        await asyncio.sleep(0)
        await ws.send_event("1", "result", {"success": True, "code": 0})
        assert (await task).success
        failed = asyncio.create_task(client.async_validate("meter.yaml"))
        await asyncio.sleep(0)
        await ws.send_event(
            "2",
            "result",
            {
                "success": False,
                "code": 1,
                "summary": "bad",
                "error_count": 0,
                "warning_count": 2,
            },
        )
        result = await failed
        assert not result.success and result.code == 1 and result.summary == "bad"
        assert result.error_count == 0 and result.warning_count == 2
        await client.async_disconnect()

    asyncio.run(run())


def test_upload_uses_ota_and_never_install() -> None:
    """OTA is administrator-confirmed and never routed through install."""

    async def run() -> None:
        client, ws = await connected_client()
        task = asyncio.create_task(client.async_upload("meter.yaml"))
        await asyncio.sleep(0)
        assert ws.sent[0] == {
            "command": "firmware/upload",
            "message_id": "1",
            "args": {"configuration": "meter.yaml", "port": "OTA"},
        }
        await ws.send_result("1", {"job_id": "job-1"})
        await asyncio.sleep(0)
        await asyncio.sleep(0)
        await ws.send_event("2", "result", {"success": True})
        await task
        assert all(message["command"] != "firmware/install" for message in ws.sent)
        await client.async_disconnect()

    asyncio.run(run())


def test_upload_reports_only_live_structured_progress() -> None:
    """Output text is reduced to allowlisted stage/percentage data before callbacks."""

    async def run() -> None:
        client, ws = await connected_client()
        progress = []
        task = asyncio.create_task(client.async_upload("meter.yaml", progress.append))
        await asyncio.sleep(0)
        await ws.send_result("1", {"job_id": "job-1"})
        await asyncio.sleep(0)
        await asyncio.sleep(0)
        await ws.send_event(
            "2", "output", "Uploading token=top-secret password=hunter2 42%"
        )
        await asyncio.sleep(0)

        assert progress[0].stage is JobProgressStage.UPLOADING
        assert progress[0].percentage == 42
        assert "secret" not in repr(progress[0]) and "hunter2" not in repr(progress[0])
        await ws.send_event("2", "output", "token=another-secret arbitrary text")
        await asyncio.sleep(0)
        assert len(progress) == 1

        await ws.send_event("2", "result", {"status": "completed", "exit_code": 0})
        await task
        await client.async_disconnect()

    asyncio.run(run())


def test_rollback_failure_is_separate() -> None:
    """A rollback validation failure is distinguishable from its initiating error."""

    async def run() -> None:
        client, ws = await connected_client()
        task = asyncio.create_task(
            client.async_restore_content("meter.yaml", "api: {}")
        )
        await asyncio.sleep(0)
        await ws.send_result("1", "new")
        await asyncio.sleep(0)
        await ws.send_result("2", {})
        await asyncio.sleep(0)
        await ws.send_event("3", "result", {"success": False, "summary": "bad"})
        with pytest.raises(RollbackError):
            await task
        await client.async_disconnect()

    asyncio.run(run())


def test_restore_expected_hash_refuses_a_foreign_race() -> None:
    """Rollback's immediate precondition prevents overwriting a later edit."""

    async def run() -> None:
        client, ws = await connected_client()
        expected = sha256(b"proposed").hexdigest()
        task = asyncio.create_task(
            client.async_restore_content(
                "meter.yaml", "prior", expected_current_sha256=expected
            )
        )
        await asyncio.sleep(0)
        await ws.send_result("1", "foreign")
        await asyncio.sleep(0)
        await ws.send_result("2", "foreign")

        with pytest.raises(ConfigChangedError):
            await task
        assert all(message["command"] != "devices/update_config" for message in ws.sent)
        await client.async_disconnect()

    asyncio.run(run())


def test_restore_rejects_content_that_does_not_match_the_exact_prior_hash() -> None:
    """Validation cannot substitute for reading back the exact restored bytes."""

    async def run() -> None:
        client, _ = await connected_client()
        reads = iter(
            (
                ESPHomeConfigSnapshot("meter.yaml", "proposed", sha256(b"proposed").hexdigest()),
                ESPHomeConfigSnapshot("meter.yaml", "altered", sha256(b"altered").hexdigest()),
            )
        )

        async def read(_configuration: str) -> ESPHomeConfigSnapshot:
            return next(reads)

        async def update(*_args: object, **_kwargs: object) -> None:
            return None

        async def validate(_configuration: str) -> JobResult:
            return JobResult(True, 0, "", ())

        client.async_get_config = read
        client.async_update_config = update
        client.async_validate = validate

        with pytest.raises(RollbackError, match="verification"):
            await client.async_restore_content(
                "meter.yaml",
                "prior",
                expected_current_sha256=sha256(b"proposed").hexdigest(),
            )
        await client.async_disconnect()

    asyncio.run(run())


def test_restore_retry_accepts_content_already_written_before_response_loss() -> None:
    async def run() -> None:
        client, _ = await connected_client()

        async def changed(*_args: object, **_kwargs: object) -> None:
            raise ConfigChangedError("proposed", sha256(b"prior").hexdigest())

        async def read(configuration: str) -> ESPHomeConfigSnapshot:
            return ESPHomeConfigSnapshot(
                configuration, "prior", sha256(b"prior").hexdigest()
            )

        async def validate(_configuration: str) -> JobResult:
            return JobResult(True, 0, "", ())

        client.async_update_config = changed
        client.async_get_config = read
        client.async_validate = validate

        await client.async_restore_content(
            "meter.yaml", "prior", expected_current_sha256="proposed"
        )
        await client.async_disconnect()

    asyncio.run(run())


@pytest.mark.parametrize("stage", ("read", "write", "validate"))
def test_rollback_transport_failures_are_wrapped(stage: str) -> None:
    """Every rollback stage is separately identifiable without content leakage."""

    async def run() -> None:
        client, _ = await connected_client()
        calls: list[str] = []

        async def fail(*args, **kwargs):
            calls.append(stage)
            raise ConnectionError("transport failed")

        async def read_ok(*args, **kwargs):
            calls.append("read")
            return ESPHomeConfigSnapshot("meter.yaml", "current", "hash")

        async def write_ok(*args, **kwargs):
            calls.append("write")
            return {}

        if stage == "read":
            client.async_get_config = fail
        elif stage == "write":
            client.async_get_config = read_ok
            client.async_command = fail
        else:
            client.async_get_config = read_ok
            client.async_command = write_ok
            client.async_validate = fail
        with pytest.raises(RollbackError) as error:
            await asyncio.wait_for(
                client.async_restore_content("meter.yaml", "api: secret"), timeout=1
            )
        assert calls[-1] == stage
        assert "secret" not in str(error.value)
        await client.async_disconnect()

    asyncio.run(run())


def test_repr_never_exposes_supervisor_ingress_credentials() -> None:
    client = DeviceBuilderClient(
        "http://url-token@supervisor:8123/api/hassio_ingress/secret-session",
        token="top-secret-token",
        connect=lambda _: FakeWebSocket({}),
    )

    value = repr(client)

    assert value == "DeviceBuilderClient(origin='http://supervisor:8123', connected=False)"
    assert "url-token" not in value
    assert "secret-session" not in value
    assert "top-secret-token" not in value
