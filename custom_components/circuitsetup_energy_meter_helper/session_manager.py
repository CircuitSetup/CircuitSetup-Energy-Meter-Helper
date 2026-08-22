"""Ownership-safe per-meter configuration transaction locking."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any


def canonical_mac(mac: str) -> str:
    return mac.lower()


@dataclass(slots=True)
class ConfigLease:
    mac: str
    lock: asyncio.Lock
    released: bool = False

    def release(self) -> None:
        if not self.released and self.lock.locked():
            self.lock.release()
        self.released = True


class CalibrationBusyError(RuntimeError):
    """The meter already has configuration or calibration work in flight."""


@dataclass(slots=True)
class DeviceLocks:
    config: asyncio.Lock
    calibration: asyncio.Lock


@dataclass(slots=True)
class CalibrationLease:
    mac: str
    locks: DeviceLocks
    task: asyncio.Task[Any] | None
    on_release: Callable[[str], None]
    released: bool = False

    def release(self) -> None:
        if self.released:
            return
        if self.locks.calibration.locked():
            self.locks.calibration.release()
        if self.locks.config.locked():
            self.locks.config.release()
        self.released = True
        self.on_release(self.mac)


class SessionManager:
    def __init__(self, *, unload_timeout: float = 30.0) -> None:
        self._device_locks: dict[str, DeviceLocks] = {}
        self._calibration_leases: dict[str, CalibrationLease] = {}
        self._config_transactions: dict[str, Any] = {}
        self._closed = False
        self._unload_timeout = unload_timeout

    async def async_acquire_config(self, mac: str) -> ConfigLease:
        if self._closed:
            raise RuntimeError("session manager is unloading")
        mac = canonical_mac(mac)
        lock = self._locks(mac).config
        await lock.acquire()
        if self._closed:
            lock.release()
            raise RuntimeError("session manager is unloading")
        return ConfigLease(mac, lock)

    async def async_acquire_calibration(self, mac: str) -> CalibrationLease:
        """Acquire config then calibration without waiting behind same-meter work."""
        if self._closed:
            raise RuntimeError("session manager is unloading")
        mac = canonical_mac(mac)
        locks = self._locks(mac)
        if locks.config.locked() or locks.calibration.locked():
            raise CalibrationBusyError(f"{mac} is busy")
        await locks.config.acquire()
        try:
            if self._closed:
                raise RuntimeError("session manager is unloading")
            if locks.calibration.locked():
                raise CalibrationBusyError(f"{mac} is busy")
            await locks.calibration.acquire()
        except BaseException:
            locks.config.release()
            raise
        lease = CalibrationLease(
            mac, locks, asyncio.current_task(), self._remove_calibration_lease
        )
        self._calibration_leases[mac] = lease
        return lease

    def _register_transaction(self, transaction_id: str, transaction: Any) -> None:
        if self._closed:
            raise RuntimeError("session manager is unloading")
        self._config_transactions[transaction_id] = transaction

    def _get_transaction(self, transaction_id: str) -> Any | None:
        return self._config_transactions.get(transaction_id)

    def _remove_transaction(self, transaction_id: str) -> None:
        self._config_transactions.pop(transaction_id, None)

    def is_config_locked(self, mac: str) -> bool:
        locks = self._device_locks.get(canonical_mac(mac))
        return locks.config.locked() if locks else False

    def is_calibration_locked(self, mac: str) -> bool:
        locks = self._device_locks.get(canonical_mac(mac))
        return locks.calibration.locked() if locks else False

    async def async_unload(self) -> None:
        self._closed = True
        pending: set[asyncio.Task[Any]] = set()
        transactions = tuple(self._config_transactions.values())
        tasks = tuple(
            {
                task
                for transaction in transactions
                for task in tuple(getattr(transaction, "active_tasks", ()))
                if not task.done()
            }
        )
        calibration_tasks = tuple(
            lease.task
            for lease in self._calibration_leases.values()
            if lease.task is not None and not lease.task.done()
        )
        for transaction in transactions:
            if tasks and getattr(transaction, "active_tasks", ()):
                mark_unresolved = getattr(transaction, "mark_unresolved", None)
                if mark_unresolved:
                    mark_unresolved()
        all_tasks = tuple({*tasks, *calibration_tasks})
        current = asyncio.current_task()
        for task in all_tasks:
            if task is current:
                continue
            task.cancel()
        waited_tasks = tuple(task for task in all_tasks if task is not current)
        if waited_tasks:
            _, pending = await asyncio.wait(waited_tasks, timeout=self._unload_timeout)
            for task in pending:
                task.cancel()
        for transaction in transactions:
            lease = getattr(transaction, "lease", None)
            if lease:
                lease.release()
            scrub = getattr(transaction, "scrub", None)
            if scrub:
                scrub()
        pending_leases: dict[str, CalibrationLease] = {}
        for lease in tuple(self._calibration_leases.values()):
            task = lease.task
            if task is not None and task in pending and not lease.released:
                pending_leases[lease.mac] = lease

                def release_when_done(
                    _task: asyncio.Task[Any],
                    item: CalibrationLease = lease,
                ) -> None:
                    item.release()

                task.add_done_callback(release_when_done)
            else:
                lease.release()
        self._config_transactions.clear()
        self._calibration_leases = pending_leases
        self._device_locks = {mac: lease.locks for mac, lease in pending_leases.items()}

    def _locks(self, mac: str) -> DeviceLocks:
        return self._device_locks.setdefault(
            mac, DeviceLocks(asyncio.Lock(), asyncio.Lock())
        )

    def _remove_calibration_lease(self, mac: str) -> None:
        self._calibration_leases.pop(mac, None)
        if self._closed:
            self._device_locks.pop(mac, None)
