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


def test_equivalent_mac_spellings_share_ownership_and_malformed_never_allocates() -> (
    None
):
    async def run() -> None:
        manager = SessionManager()
        lease = await manager.async_acquire_calibration("AA:BB:CC:DD:EE:FF")

        with pytest.raises(CalibrationBusyError):
            await manager.async_acquire_calibration("aa-bb-cc-dd-ee-ff")
        assert manager.is_config_locked("aabbccddeeff")
        assert tuple(manager._device_locks) == ("aabbccddeeff",)

        for malformed in (
            "aabbccddeef",
            "aabbccddeeff00",
            "aa:bb-cc:dd:ee:ff",
            "gg:bb:cc:dd:ee:ff",
            "aabb.ccdd.eeff",
        ):
            with pytest.raises(ValueError, match="MAC"):
                await manager.async_acquire_config(malformed)
        assert tuple(manager._device_locks) == ("aabbccddeeff",)
        lease.release()
        manager.record_calibration_iteration("AA-BB-CC-DD-EE-FF", "current:1", 1)
        assert manager.next_calibration_iteration("aa:bb:cc:dd:ee:ff", "current:1") == 2

    asyncio.run(run())


def test_calibration_holds_config_then_calibration_until_release() -> None:
    async def run() -> None:
        manager = SessionManager()
        calibration = await manager.async_acquire_calibration("001122334455")

        assert manager.is_config_locked("00:11:22:33:44:55")
        assert manager.is_calibration_locked("00-11-22-33-44-55")
        with pytest.raises(CalibrationBusyError):
            await manager.async_acquire_calibration("001122334455")

        waiting_config = asyncio.create_task(
            manager.async_acquire_config("00:11:22:33:44:55")
        )
        await asyncio.sleep(0)
        assert not waiting_config.done()
        calibration.release()
        config = await waiting_config
        assert manager.is_config_locked("001122334455")
        assert not manager.is_calibration_locked("001122334455")
        config.release()

    asyncio.run(run())


def test_different_macs_calibrate_in_parallel_and_unload_releases_both() -> None:
    async def run() -> None:
        manager = SessionManager()
        first, second = await asyncio.gather(
            manager.async_acquire_calibration("001122334455"),
            manager.async_acquire_calibration("aabbccddeeff"),
        )

        assert first.mac == "001122334455"
        assert second.mac == "aabbccddeeff"
        await manager.async_unload()
        assert first.released
        assert second.released
        with pytest.raises(RuntimeError, match="unloading"):
            await manager.async_acquire_calibration("112233445566")

    asyncio.run(run())


def test_unload_timeout_keeps_calibration_lock_until_owned_cleanup_finishes() -> None:
    async def run() -> None:
        manager = SessionManager(unload_timeout=0.001)
        acquired = asyncio.Event()
        finish_cleanup = asyncio.Event()
        lease_holder = []

        async def calibration() -> None:
            lease = await manager.async_acquire_calibration("001122334455")
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
        assert manager.is_config_locked("001122334455")
        assert manager.is_calibration_locked("001122334455")

        finish_cleanup.set()
        await task
        assert lease.released
        assert not manager.is_config_locked("001122334455")

    asyncio.run(run())


def test_unload_scrubs_every_transaction_before_reporting_release_failures() -> None:
    class Transaction:
        def __init__(self, fail: bool) -> None:
            self.active_tasks: set[asyncio.Task[object]] = set()
            self.lease = None
            self.prior_content: str | None = "secret yaml"
            self.fail = fail
            self.scrubbed = False

        async def async_release_reservation(self) -> None:
            if self.fail:
                raise OSError("storage unavailable")

        def scrub(self) -> None:
            self.prior_content = None
            self.scrubbed = True

    async def run() -> None:
        manager = SessionManager()
        first, second = Transaction(True), Transaction(False)
        manager._register_transaction("first", first)
        manager._register_transaction("second", second)

        with pytest.raises(ExceptionGroup, match="reservation cleanup") as error:
            await manager.async_unload()

        assert any(isinstance(item, OSError) for item in error.value.exceptions)
        assert first.scrubbed and second.scrubbed
        assert first.prior_content is None and second.prior_content is None
        assert manager._config_transactions == {}
        assert manager._pending_calibrations == {}
        assert manager._calibration_iterations == {}

    asyncio.run(run())
