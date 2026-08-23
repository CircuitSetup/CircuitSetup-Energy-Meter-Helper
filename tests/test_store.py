"""Tests for persisted helper state."""

import asyncio
from copy import deepcopy

import pytest

from custom_components.circuitsetup_energy_meter_helper.models import (
    StoredCTSelection,
    StoredMeterRecord,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    STORAGE_MINOR_VERSION,
    STORAGE_VERSION,
    HelperStore,
    _HelperStorage,
    migrate_storage,
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
        asyncio.run(
            _HelperStorage._async_migrate_func(
                None, STORAGE_VERSION, STORAGE_MINOR_VERSION + 1, {}
            )
        )


def test_storage_1_1_migrates_to_1_2_without_rewriting_gain_only_records() -> None:
    legacy = {
        "meters": {
            "aabbccddeeff": {
                "verified_calibration": {
                    "groups": [
                        {
                            "instance_id": "meter_main1",
                            "phase_gains": [[7305, 27518]] * 3,
                        }
                    ]
                }
            }
        }
    }

    migrated = migrate_storage(1, 1, deepcopy(legacy))

    assert STORAGE_MINOR_VERSION == 2
    assert migrated == legacy
    assert (
        "offset_groups"
        not in migrated["meters"]["aabbccddeeff"]["verified_calibration"]
    )


def test_offset_only_verified_record_round_trips_signed_tables() -> None:
    from custom_components.circuitsetup_energy_meter_helper.store import (
        VerifiedCalibrationRecord,
        VerifiedOffsetGroup,
        VerifiedPowerOffsetGroup,
        _deserialize_verified_calibration,
        _serialize_verified_calibration,
    )

    record = VerifiedCalibrationRecord(
        mac="aabbccddeeff",
        config_filename=None,
        config_sha256=None,
        topology_addon_count=0,
        topology_project_name="circuitsetup.6c-energy-meter",
        topology_connection_type="wifi",
        topology_voltage_layout="single",
        connection_generation=2,
        groups=(),
        offset_groups=(
            VerifiedOffsetGroup("meter_main1", ((-32768, 32767), (-13, 32), (-14, 33))),
        ),
        power_offset_groups=(
            VerifiedPowerOffsetGroup(
                "meter_main1", ((101, -201), (102, -202), (103, -203))
            ),
        ),
        verification_id="a" * 32,
        source_handoff_available=False,
    )

    raw = _serialize_verified_calibration(record)

    assert _deserialize_verified_calibration(record.mac, raw) == record


def test_gain_only_1_1_record_deserializes_with_absent_offset_fields() -> None:
    from custom_components.circuitsetup_energy_meter_helper.store import (
        _deserialize_verified_calibration,
    )

    raw = {
        "verification_id": "a" * 32,
        "config_filename": "meter.yaml",
        "config_sha256": "b" * 64,
        "topology_addon_count": 0,
        "topology_project_name": "circuitsetup.6c-energy-meter",
        "topology_connection_type": "wifi",
        "topology_voltage_layout": "single",
        "connection_generation": 2,
        "groups": [
            {
                "instance_id": "meter_main1",
                "phase_gains": [[7305, 27518], [7305, 28312], [7305, 27518]],
            }
        ],
        "source_authority": "saved_flash",
        "source_handoff_available": True,
        "source_handoff_transaction_id": None,
    }

    record = _deserialize_verified_calibration("aabbccddeeff", raw)

    assert record.offset_groups == ()
    assert record.power_offset_groups == ()


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
            store.async_save_verified_ct_selections("00:11:22:33:44:55", (selection,)),
            store.async_save_verified_ct_selections("AA-BB-CC-DD-EE-FF", (selection,)),
        )

        assert set(backend.data["meters"]) == {  # type: ignore[arg-type]
            "001122334455",
            "aabbccddeeff",
        }

        for malformed in ("00112233445", "00:11-22:33:44:55"):
            with pytest.raises(ValueError, match="MAC"):
                await store.async_save_verified_ct_selections(malformed, (selection,))

    asyncio.run(run())


def test_load_normalizes_legacy_aliases_and_rejects_colliding_identity_keys() -> None:
    async def run() -> None:
        backend = _CopyingStorage()
        backend.data = {"meters": {"AA:BB:CC:DD:EE:FF": {}}}
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()

        assert set((await store.async_load())["meters"]) == {"aabbccddeeff"}

        backend.data = {"meters": {"AA:BB:CC:DD:EE:FF": {}, "aabbccddeeff": {}}}
        with pytest.raises(ValueError, match="aliases collide"):
            await store.async_load()

    asyncio.run(run())
