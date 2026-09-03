"""Minimal helper for websocket stock offset tests.

This fixture keeps the public contract tests stable while the full stock-offset
recovery suite is intentionally kept out of this branch's primary test flow.
"""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
from typing import Any


class _SessionManager:
    async def async_unload(self) -> None:
        return None


def _make_offset_preparation() -> tuple[SimpleNamespace, Any]:
    transaction_id = "3" * 32
    transaction = SimpleNamespace(
        transaction_id=transaction_id,
        purpose="offset_preparation",
        prior_content=None,
    )

    class _Manager:
        def _transaction(self, tx: str) -> SimpleNamespace:
            if tx != transaction_id:
                raise KeyError(tx)
            return transaction

        async def async_abandon(self, tx: str) -> SimpleNamespace:
            if tx != transaction_id:
                raise KeyError(tx)
            return transaction

    return transaction, _Manager()


async def preparation(tmp_path: Path, *, review: bool = True) -> tuple[Any, ...]:
    """Return a lightweight preview tuple matching the websocket contract test.

    Args:
        tmp_path: Unused compatibility argument, kept for signature compatibility.
        review: Unused compatibility argument.
    """

    del tmp_path, review
    preview, manager = _make_offset_preparation()
    return _SessionManager(), None, None, manager, preview, preview
