"""Use Home Assistant's real save wrapper to verify revocation durability."""

from __future__ import annotations

import asyncio
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest
from homeassistant.core import CoreState
from homeassistant.util.file import WriteError
from homeassistant.util.json import load_json

from custom_components.circuitsetup_energy_meter_helper.store import HelperStore


def test_verified_save_requires_the_exact_disk_envelope(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        async def executor(function: Any, *args: Any) -> Any:
            return await asyncio.to_thread(function, *args)

        hass = SimpleNamespace(
            data={}, state=CoreState.running,
            config=SimpleNamespace(
                config_dir=str(tmp_path),
                path=lambda *parts: str(tmp_path.joinpath(*parts)),
            ),
            async_add_executor_job=executor,
            bus=SimpleNamespace(async_listen_once=lambda *_args: lambda: None),
        )
        backend = HelperStore(hass)._store
        prior = {"meters": {"aabbccddeeff": {"receipt": True}}}
        revoked = {"meters": {"aabbccddeeff": {"receipt": False}}}
        assert backend._atomic_writes
        await backend.async_save_verified(prior)
        original = load_json(backend.path)

        async def failed_write(_data: dict[str, Any]) -> None:
            raise WriteError("disk full")

        with monkeypatch.context() as patch:
            patch.setattr(backend, "_async_write_data", failed_write)
            with pytest.raises(OSError, match="durable"):
                await backend.async_save_verified(revoked)
        assert load_json(backend.path) == original

        # Store caches a deferred write during stopping; a cache read is not proof.
        hass.state = CoreState.stopping
        with pytest.raises(OSError, match="durable"):
            await backend.async_save_verified(revoked)
        assert load_json(backend.path) == original
        hass.state = CoreState.running
        await backend.async_save_verified(revoked)
        assert load_json(backend.path) == {
            "version": backend.version,
            "minor_version": backend.minor_version,
            "key": backend.key,
            "data": revoked,
        }

    asyncio.run(run())
