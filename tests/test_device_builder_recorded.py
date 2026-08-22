"""Recorded sanitized Device Builder transport contracts."""

import asyncio
import json
from pathlib import Path

from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    DeviceBuilderClient,
)


class RecordedWebSocket:
    """Replay sanitized exchanges while keeping the production client real."""

    def __init__(self, recording: dict[str, object]) -> None:
        self._exchanges = list(recording["exchanges"])
        self._received: asyncio.Queue[dict[str, object] | None] = asyncio.Queue()
        self._received.put_nowait(recording["server_info"])

    async def send_json(self, message: dict[str, object]) -> None:
        exchange = self._exchanges.pop(0)
        assert message["command"] == exchange["command"]
        message_id = message["message_id"]
        if "result" in exchange:
            await self._received.put({"message_id": message_id, "result": exchange["result"]})
        for event in exchange.get("events", []):
            await self._received.put({"message_id": message_id, **event})

    async def receive_json(self) -> dict[str, object] | None:
        return await self._received.get()

    async def close(self) -> None:
        await self._received.put(None)


def test_recorded_transport_covers_config_and_job_commands() -> None:
    """The recording catches a renamed command or unsanitized event contract."""

    async def run() -> None:
        recording = json.loads(
            (Path(__file__).parent / "fixtures/device_builder/task21_recorded_transport.json").read_text()
        )
        websocket = RecordedWebSocket(recording)
        client = DeviceBuilderClient("http://builder", connect=lambda _: websocket)
        await client.async_connect()
        assert (await client.async_list_devices())["configured"][0]["configuration"] == "meter.yaml"
        snapshot = await client.async_get_config("meter.yaml")
        await client.async_update_config(snapshot, "substitutions:\n  ct1_name: Grid\n")
        assert (await client.async_validate("meter.yaml")).success
        assert (await client.async_compile("meter.yaml")).success
        progress = []
        assert (await client.async_upload("meter.yaml", progress.append)).success
        assert progress[0].percentage == 42
        assert not websocket._exchanges
        await client.async_disconnect()

    asyncio.run(run())
