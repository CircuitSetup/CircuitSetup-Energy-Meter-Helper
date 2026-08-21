"""Tests for the pinned ESPHome Device Builder websocket client."""

import asyncio

import pytest

from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ConfigChangedError,
    DeviceBuilderClient,
    ESPHomeConfigSnapshot,
    RollbackError,
)


class FakeWebSocket:
    """Small in-memory websocket used to drive the protocol."""

    def __init__(self, server_info: dict) -> None:
        self.sent: list[dict] = []
        self._received: asyncio.Queue[dict | None] = asyncio.Queue()
        self._received.put_nowait(server_info)

    async def send_json(self, message: dict) -> None:
        self.sent.append(message)

    async def receive_json(self) -> dict | None:
        return await self._received.get()

    async def send_result(self, message_id: str, result: dict) -> None:
        await self._received.put({"message_id": message_id, "result": result})

    async def send_event(self, message_id: str, event: str, data: object) -> None:
        await self._received.put({"message_id": message_id, "event": event, "data": data})

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
        await ws.send_event("2", "result", {"success": True, "code": 0})
        result = await compile_task
        assert result.success
        assert result.output_tail == ("a", "b")
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


def test_rollback_failure_is_separate() -> None:
    """A rollback validation failure is distinguishable from its initiating error."""

    async def run() -> None:
        client, ws = await connected_client()
        task = asyncio.create_task(client.async_restore_content("meter.yaml", "api: {}"))
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
