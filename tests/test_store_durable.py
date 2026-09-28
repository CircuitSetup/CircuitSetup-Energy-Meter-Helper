"""Use Home Assistant's real save wrapper to verify revocation durability."""

from __future__ import annotations

import asyncio
from dataclasses import replace
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


def test_calibrated_metadata_save_rejects_swallowed_failure_and_retries(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The calibrated metadata receipt requires disk evidence before success."""
    from custom_components.circuitsetup_energy_meter_helper.models import (
        StoredCTSelection,
    )
    from custom_components.circuitsetup_energy_meter_helper.store import (
        VerifiedCalibrationRecord,
        VerifiedGainGroup,
    )
    from tests.test_store import (
        CONFIG_HASH,
        MAC,
        PROPOSED_HASH,
        _configuration,
        _record,
    )

    async def run() -> None:
        async def executor(function: Any, *args: Any) -> Any:
            return await asyncio.to_thread(function, *args)

        hass = SimpleNamespace(
            data={}, state=CoreState.running, loop=asyncio.get_running_loop(),
            config=SimpleNamespace(
                config_dir=str(tmp_path),
                path=lambda *parts: str(tmp_path.joinpath(*parts)),
            ),
            async_add_executor_job=executor,
            bus=SimpleNamespace(async_listen_once=lambda *_args: lambda: None),
        )
        store = HelperStore(hass)
        await store._store.async_save_verified({"meters": {}})
        async def failed_write(_data: dict[str, Any]) -> None:
            raise WriteError("disk full")

        await store.async_save_meter(_record())
        before_ct = load_json(store._store.path)
        selections = (StoredCTSelection(1, "ct", "Garage", 27518, 1.0, CONFIG_HASH),)
        with monkeypatch.context() as patch:
            patch.setattr(store._store, "_async_write_data", failed_write)
            with pytest.raises(OSError, match="durable"):
                await store.async_save_verified_ct_selections(MAC, selections)
        assert load_json(store._store.path) == before_ct

        with monkeypatch.context() as patch:
            patch.setattr(store._store, "_async_write_data", failed_write)
            with pytest.raises(OSError, match="durable"):
                assert await store.async_advance_offset_configuration_source(
                    MAC, CONFIG_HASH, PROPOSED_HASH, _record()
                )
        assert load_json(store._store.path) == before_ct

        record = VerifiedCalibrationRecord(
            MAC, "meter.yaml", CONFIG_HASH, 0,
            "circuitsetup.6c-energy-meter", "wifi", "standard", 1,
            (VerifiedGainGroup("meter_main1", ((7305, 27518),) * 3),), "b" * 32,
        )
        transaction_id = "c" * 32
        await store.async_save_meter(_record())
        await store.async_save_verified_calibration(record)
        assert await store.async_claim_verified_calibration(
            MAC, record.verification_id, transaction_id
        )
        proposed = replace(_configuration(), config_sha256=PROPOSED_HASH)
        before_receipt = load_json(store._store.path)
        with monkeypatch.context() as patch:
            patch.setattr(store._store, "_async_write_data", failed_write)
            with pytest.raises(OSError, match="durable"):
                await store.async_save_verified_meter_configuration_and_mark_verified_calibration_installed(
                    MAC, CONFIG_HASH, proposed, record.verification_id, transaction_id
                )
        assert load_json(store._store.path) == before_receipt
        assert await store.async_save_verified_meter_configuration_and_mark_verified_calibration_installed(
            MAC, CONFIG_HASH, proposed, record.verification_id, transaction_id
        )
        installed = await store.async_get_verified_calibration(MAC)
        assert installed is not None and installed.source_handoff_firmware_installed
        with monkeypatch.context() as patch:
            patch.setattr(store._store, "_async_write_data", failed_write)
            with pytest.raises(OSError, match="durable"):
                assert await store.async_complete_verified_calibration_handoff(
                    MAC, record.verification_id, transaction_id
                )
        completed = await store.async_complete_verified_calibration_handoff(
            MAC, record.verification_id, transaction_id
        )
        assert completed
        assert (await store.async_get_verified_calibration(MAC)).source_authority.value == "configuration"

    asyncio.run(run())
