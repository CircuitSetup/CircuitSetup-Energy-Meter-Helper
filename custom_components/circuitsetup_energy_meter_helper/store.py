"""Versioned storage for safe CircuitSetup helper metadata."""

from __future__ import annotations

from dataclasses import asdict
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .models import StoredMeterRecord

STORAGE_VERSION = 1
STORAGE_KEY = "circuitsetup_energy_meter_helper"


def migrate_storage(version: int, data: dict[str, Any]) -> dict[str, Any]:
    """Accept the known schema and fail closed for unknown future data."""
    if version > STORAGE_VERSION:
        raise ValueError(f"Storage version {version} is newer than supported")
    if version != STORAGE_VERSION:
        raise ValueError(f"Storage version {version} cannot be migrated")
    return data


class HelperStore:
    """Persist typed meter metadata without credentials or configuration content."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)

    async def async_load(self) -> dict[str, Any]:
        """Load the known storage schema."""
        return (await self._store.async_load()) or {"meters": {}}

    async def async_save_meter(self, record: StoredMeterRecord) -> None:
        """Save one typed record keyed by MAC address."""
        data = await self.async_load()
        meters = data.setdefault("meters", {})
        meters[record.mac] = asdict(record)
        await self._store.async_save(data)
