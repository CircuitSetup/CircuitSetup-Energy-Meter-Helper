"""Tests for coordinated per-device configuration and calibration leases."""

from __future__ import annotations

import asyncio

import pytest

from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    CalibrationBusyError,
    SessionManager,
)


def test_config_blocks_calibration_with_typed_busy_error() -> None:
    async def run() -> None:
        manager = SessionManager()
        config = await manager.async_acquire_config("AA:BB:CC:DD:EE:FF")

        with pytest.raises(CalibrationBusyError, match="busy"):
            await manager.async_acquire_calibration("aa:bb:cc:dd:ee:ff")

        assert manager.is_config_locked("AA:BB:CC:DD:EE:FF")
        assert not manager.is_calibration_locked("AA:BB:CC:DD:EE:FF")
        config.release()

    asyncio.run(run())


def test_calibration_holds_config_then_calibration_until_release() -> None:
    async def run() -> None:
        manager = SessionManager()
        calibration = await manager.async_acquire_calibration("meter-one")

        assert manager.is_config_locked("METER-ONE")
        assert manager.is_calibration_locked("METER-ONE")
        with pytest.raises(CalibrationBusyError):
            await manager.async_acquire_calibration("meter-one")

        waiting_config = asyncio.create_task(manager.async_acquire_config("meter-one"))
        await asyncio.sleep(0)
        assert not waiting_config.done()
        calibration.release()
        config = await waiting_config
        assert manager.is_config_locked("meter-one")
        assert not manager.is_calibration_locked("meter-one")
        config.release()

    asyncio.run(run())


def test_different_macs_calibrate_in_parallel_and_unload_releases_both() -> None:
    async def run() -> None:
        manager = SessionManager()
        first, second = await asyncio.gather(
            manager.async_acquire_calibration("meter-one"),
            manager.async_acquire_calibration("meter-two"),
        )

        assert first.mac == "meter-one"
        assert second.mac == "meter-two"
        await manager.async_unload()
        assert first.released
        assert second.released
        with pytest.raises(RuntimeError, match="unloading"):
            await manager.async_acquire_calibration("meter-three")

    asyncio.run(run())


def test_unload_timeout_keeps_calibration_lock_until_owned_cleanup_finishes() -> None:
    async def run() -> None:
        manager = SessionManager(unload_timeout=0.001)
        acquired = asyncio.Event()
        finish_cleanup = asyncio.Event()
        lease_holder = []

        async def calibration() -> None:
            lease = await manager.async_acquire_calibration("meter")
            lease_holder.append(lease)
            acquired.set()
            try:
                await asyncio.Future()
            except asyncio.CancelledError:
                while not finish_cleanup.is_set():
                    try:
                        await asyncio.shield(finish_cleanup.wait())
                    except asyncio.CancelledError:
                        continue
            finally:
                lease.release()

        task = asyncio.create_task(calibration())
        await acquired.wait()
        await manager.async_unload()
        lease = lease_holder[0]
        assert not lease.released
        assert lease.locks.config.locked()
        assert lease.locks.calibration.locked()
        assert manager.is_config_locked("meter")
        assert manager.is_calibration_locked("meter")

        finish_cleanup.set()
        await task
        assert lease.released
        assert not manager.is_config_locked("meter")

    asyncio.run(run())
