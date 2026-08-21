"""Per-meter configuration transaction ownership and locking."""

from __future__ import annotations

import asyncio
from typing import Any


class SessionManager:
    """Own config locks and transaction lookup; calibration belongs to Task 17."""

    def __init__(self) -> None:
        self._config_locks: dict[str, asyncio.Lock] = {}
        self._config_transactions: dict[str, Any] = {}

    async def async_acquire_config(self, mac: str) -> None:
        """Acquire this meter's exclusive lock until the transaction cleans up."""
        lock = self._config_locks.setdefault(mac, asyncio.Lock())
        await lock.acquire()

    def release_config(self, mac: str) -> None:
        """Release one retained lock after every terminal transaction path."""
        lock = self._config_locks.get(mac)
        if lock is not None and lock.locked():
            lock.release()

    def register_transaction(self, transaction_id: str, transaction: Any) -> None:
        self._config_transactions[transaction_id] = transaction

    def get_transaction(self, transaction_id: str) -> Any | None:
        return self._config_transactions.get(transaction_id)

    def is_config_locked(self, mac: str) -> bool:
        lock = self._config_locks.get(mac)
        return lock.locked() if lock is not None else False

    async def async_unload(self) -> None:
        """Release retained locks and discard only in-memory transaction content."""
        for lock in self._config_locks.values():
            if lock.locked():
                lock.release()
        self._config_locks.clear()
        self._config_transactions.clear()
