"""Tests for the pinned ESPHome Device Builder websocket client."""

import asyncio
from hashlib import sha256

import pytest

from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ConfigChangedError,
    DeviceBuilderClient,
    ESPHomeConfigSnapshot,
    JobProgressStage,
    RollbackError,
)


class FakeWebSocket:
    """Small in-memory websocket used to drive the protocol."""

    def __init__(self, server_info: dict) -> None:
        self.sent: list[dict] = []
        self._received: asyncio.Queue[dict | None] = asyncio.Queue()
        self._received.put_nowait(server_info)
        if server_info.get("requires_auth"):
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

        class RetryWebSocket(FakeWebSocket):
            async def close(self) -> None:
                nonlocal attempts
                attempts += 1
                if attempts == 1:
                    close_started.set()
                    await close_release.wait()
                    raise RuntimeError("transport close failed")
                await super().close()

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
        assert any(
            isinstance(error, asyncio.CancelledError)
            for error in caught.value.exceptions
        )
        assert any(isinstance(error, RuntimeError) for error in caught.value.exceptions)
        assert client.connected
        await client.async_disconnect()
        assert attempts == 2
        assert not client.connected

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

        with pytest.raises(ConfigChangedError):
            await task
        assert all(message["command"] != "devices/update_config" for message in ws.sent)
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
