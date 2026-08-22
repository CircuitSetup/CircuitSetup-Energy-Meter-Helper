"""Ownership-safe per-meter configuration transaction locking."""

from __future__ import annotations

import asyncio
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


class SessionManager:
    def __init__(self, *, unload_timeout: float = 30.0) -> None:
        self._config_locks: dict[str, asyncio.Lock] = {}
        self._config_transactions: dict[str, Any] = {}
        self._closed = False
        self._unload_timeout = unload_timeout

    async def async_acquire_config(self, mac: str) -> ConfigLease:
        if self._closed:
            raise RuntimeError("session manager is unloading")
        mac = canonical_mac(mac)
        lock = self._config_locks.setdefault(mac, asyncio.Lock())
        await lock.acquire()
        if self._closed:
            lock.release()
            raise RuntimeError("session manager is unloading")
        return ConfigLease(mac, lock)

    def _register_transaction(self, transaction_id: str, transaction: Any) -> None:
        if self._closed:
            raise RuntimeError("session manager is unloading")
        self._config_transactions[transaction_id] = transaction

    def _get_transaction(self, transaction_id: str) -> Any | None:
        return self._config_transactions.get(transaction_id)

    def _remove_transaction(self, transaction_id: str) -> None:
        self._config_transactions.pop(transaction_id, None)

    def is_config_locked(self, mac: str) -> bool:
        lock = self._config_locks.get(canonical_mac(mac))
        return lock.locked() if lock else False

    async def async_unload(self) -> None:
        self._closed = True
        transactions = tuple(self._config_transactions.values())
        tasks = tuple(
            {
                task
                for transaction in transactions
                for task in tuple(getattr(transaction, "active_tasks", ()))
                if not task.done()
            }
        )
        for transaction in transactions:
            if tasks and getattr(transaction, "active_tasks", ()):
                mark_unresolved = getattr(transaction, "mark_unresolved", None)
                if mark_unresolved:
                    mark_unresolved()
        for task in tasks:
            task.cancel()
        if tasks:
            _, pending = await asyncio.wait(tasks, timeout=self._unload_timeout)
            for task in pending:
                task.cancel()
        for transaction in transactions:
            lease = getattr(transaction, "lease", None)
            if lease:
                lease.release()
            scrub = getattr(transaction, "scrub", None)
            if scrub:
                scrub()
        self._config_transactions.clear()
        self._config_locks.clear()
