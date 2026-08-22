"""Tests for persisted helper state."""

import asyncio
from copy import deepcopy

import pytest

from custom_components.circuitsetup_energy_meter_helper.models import (
    StoredCTSelection,
    StoredMeterRecord,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    STORAGE_VERSION,
    HelperStore,
    _HelperStorage,
    serialize_meter_record,
)


class _CopyingStorage:
    """Model Home Assistant storage returning independent loaded documents."""

    def __init__(self) -> None:
        self.data: dict[str, object] = {"meters": {}}

    async def async_load(self) -> dict[str, object]:
        snapshot = deepcopy(self.data)
        await asyncio.sleep(0)
        return snapshot

    async def async_save(self, data: dict[str, object]) -> None:
        await asyncio.sleep(0)
        self.data = deepcopy(data)


def test_stored_ct_selection_has_only_safe_metadata() -> None:
    """Selections retain calibration metadata without secrets or YAML."""
    selection = StoredCTSelection(
        channel=1,
        model_id="split-core-100a",
        display_label="Main feed",
        raw_gain_ct=27518,
        reporting_multiplier=1.0,
        config_sha256="a" * 64,
    )

    assert selection.config_sha256 == "a" * 64


def test_migrate_storage_rejects_unknown_newer_version() -> None:
    """Future data is never silently treated as the current schema."""
    with pytest.raises(ValueError, match="newer"):
        asyncio.run(
            _HelperStorage._async_migrate_func(None, STORAGE_VERSION + 1, 1, {})
        )


def test_store_migration_rejects_unknown_newer_minor_version() -> None:
    """The live Home Assistant migration hook fails closed on newer minor data."""
    with pytest.raises(ValueError, match="newer"):
        asyncio.run(_HelperStorage._async_migrate_func(None, STORAGE_VERSION, 2, {}))


def test_store_rejects_untyped_topology_payload() -> None:
    """Arbitrary credentials or complete YAML cannot enter persisted records."""
    record = StoredMeterRecord(
        mac="00:11:22:33:44:55",
        setup_intent="setup_later",
        config_filename=None,
        topology={"api_encryption_key": "secret", "yaml": "api:\n  password: x"},
    )

    with pytest.raises(TypeError, match="StoredTopology"):
        serialize_meter_record(record)


def test_concurrent_verified_updates_cannot_overwrite_another_meter() -> None:
    """The store-wide update lock makes the full load/modify/save atomic."""

    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        selection = StoredCTSelection(
            1, "split-core-100a", "Main", 27518, 1.0, "a" * 64
        )

        await asyncio.gather(
            store.async_save_verified_ct_selections("aa", (selection,)),
            store.async_save_verified_ct_selections("bb", (selection,)),
        )

        assert set(backend.data["meters"]) == {"aa", "bb"}  # type: ignore[arg-type]

    asyncio.run(run())
