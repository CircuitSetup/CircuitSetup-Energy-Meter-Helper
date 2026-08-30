"""Tests for persisted helper state."""

import asyncio
from copy import deepcopy
from dataclasses import replace

import pytest

from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    ChannelTotalSource,
    ChannelSettings,
    CircuitAggregate,
    CircuitRole,
    ElectricalSystem,
    EnergyMode,
    MeasurementMethod,
    MeterSettings,
    VoltageLayout,
    VoltageReferenceConfig,
    TotalOrigin,
    TotalOutputSettings,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    MeterTopology,
    StoredCTSelection,
    StoredInterruptedSession,
    StoredMeterRecord,
    StoredTopology,
    StoredTopologyEvidence,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    LegacyParentLink,
    STORAGE_MINOR_VERSION,
    STORAGE_VERSION,
    HelperStore,
    MeterConfigurationRead,
    StoredMeterConfiguration,
    VerifiedCalibrationRecord,
    VerifiedGainGroup,
    _HelperStorage,
    _deserialize_meter_configuration_payload,
    migrate_storage,
    serialize_meter_record,
)
from custom_components.circuitsetup_energy_meter_helper.topology import (
    legacy_voltage_reference_topology,
)
from custom_components.circuitsetup_energy_meter_helper.total_graph import default_total_settings

MAC = "aabbccddeeff"
CONFIG_HASH = "a" * 64
PROPOSED_HASH = "b" * 64


V14_PARENT_FIXTURE = {
    "config_sha256": "a" * 64,
    "meter": {"friendly_name": "Kitchen meter", "electrical_system": "split_phase_120_240", "line_frequency_hz": 60, "update_interval_s": 5, "voltage_layout": "standard", "voltage_references": [{"reference_id": "main", "label": "Main", "phase_label": "A", "nominal_voltage_v": 120.0, "transformer_model_id": "vt", "gain_voltage": 1, "group_keys": ["main_1", "main_2"]}]},
    "channels": [{"channel": channel, "enabled": True, "name": f"CT {channel}", "model_id": "ct", "reporting_multiplier": 1.0, "role": "grid" if channel < 3 else "branch", "voltage_reference_id": "main", "custom_gain_ct": None, "custom_label": None} for channel in range(1, 7)],
    "aggregates": [
        {"aggregate_id": "child", "name": "Child", "role": "branch", "channels": [1], "measurement_method": "direct", "parent_id": "parent", "energy_mode": "none", "expose_power": True, "expose_current": False},
        {"aggregate_id": "parent", "name": "Parent", "role": "branch", "channels": [2], "measurement_method": "direct", "parent_id": None, "energy_mode": "consumption", "expose_power": True, "expose_current": True},
    ],
    "power_quality": [False], "status_fields": [True],
}


def _meter_topology() -> MeterTopology:
    return MeterTopology(0, 1, 6, 2, "wifi", "standard", "meter", ())


def test_v14_parent_metadata_does_not_change_runtime_formula() -> None:
    """Changing legacy parent metadata into a source would alter installed readings."""
    configuration = _deserialize_meter_configuration_payload(V14_PARENT_FIXTURE, _meter_topology())

    child, parent = configuration.aggregates
    assert child.sources == (ChannelTotalSource("channel", 1),)
    assert parent.sources == (ChannelTotalSource("channel", 2),)
    assert configuration.totals_migration is not None
    assert configuration.totals_migration.legacy_parent_links == (LegacyParentLink("child", "parent"),)
    assert configuration.totals_migration.parent_review_required is True
    assert configuration.automatic_totals[0].candidate_id == "grid-ct1-ct2"
    assert configuration.automatic_totals[0].enabled is False
    assert configuration.totals_migration.native_visibility_confirmation_required is True


def _topology() -> StoredTopology:
    return StoredTopology(
        0, 1, 6, 2, "wifi", "standard", "circuitsetup.6c-energy-meter"
    )


def _record(config_sha256: str = CONFIG_HASH) -> StoredMeterRecord:
    return StoredMeterRecord(
        MAC, "setup_later", "meter.yaml", _topology(), config_sha256=config_sha256
    )


def _configuration() -> StoredMeterConfiguration:
    meter = MeterSettings(
        "Kitchen meter",
        ElectricalSystem.SPLIT_PHASE_120_240,
        60,
        5,
        VoltageLayout.STANDARD,
        (
            VoltageReferenceConfig(
                "main", "Main", "A", 120.0, "vt", 1, ("main_1", "main_2")
            ),
        ),
    )
    channels = tuple(
        ChannelSettings(i, True, f"CT {i}", "ct", 1.0, CircuitRole.BRANCH, "main")
        for i in range(1, 7)
    )
    aggregate = CircuitAggregate(
        "grid",
        "Grid",
        CircuitRole.GRID,
        (ChannelTotalSource("channel", 1), ChannelTotalSource("channel", 2)),
        MeasurementMethod.TWO_CT_SUM,
        EnergyMode.CONSUMPTION,
        TotalOutputSettings(True, False, True),
        TotalOrigin.MIGRATED,
    )
    return StoredMeterConfiguration(
        CONFIG_HASH, meter, channels, default_total_settings(_meter_topology()), (),
        (aggregate,), (False,), (True,)
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


def test_verified_meter_configuration_compare_and_swap_updates_record_and_metadata() -> (
    None
):
    """Verified reconnect advances the record digest and all configuration metadata."""

    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        await store.async_save_meter(_record())
        proposed = replace(_configuration(), config_sha256=PROPOSED_HASH)

        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, proposed
        )

        raw = backend.data["meters"][MAC]  # type: ignore[index]
        assert raw["config_sha256"] == PROPOSED_HASH  # type: ignore[index]
        assert raw["meter_configuration"]["config_sha256"] == PROPOSED_HASH  # type: ignore[index]
        assert await store.async_get_meter_configuration(MAC) == proposed
        with pytest.raises(ValueError, match="current meter record"):
            await store.async_save_verified_meter_configuration(
                MAC, CONFIG_HASH, proposed
            )

    asyncio.run(run())


def test_verified_meter_configuration_creates_initial_record_after_reconnect() -> None:
    """The first verified configuration creates B only from trusted record A."""

    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        proposed = replace(_configuration(), config_sha256=PROPOSED_HASH)

        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, proposed, _record()
        )

        raw = backend.data["meters"][MAC]  # type: ignore[index]
        assert raw["config_sha256"] == PROPOSED_HASH  # type: ignore[index]
        assert raw["meter_configuration"]["config_sha256"] == PROPOSED_HASH  # type: ignore[index]
        assert await store.async_get_meter_configuration(MAC) == proposed
        with pytest.raises(ValueError, match="current meter record"):
            await store.async_save_verified_meter_configuration(
                MAC, CONFIG_HASH, proposed, _record()
            )

    asyncio.run(run())


def test_verified_meter_configuration_allows_changed_roles_at_same_source_hash() -> None:
    """Role edits are durable when the underlying YAML source is unchanged."""

    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        configuration = _configuration()
        changed = replace(
            configuration,
            channels=tuple(
                replace(
                    channel,
                    role=(
                        CircuitRole.GRID
                        if channel.channel <= 2
                        else CircuitRole.SOLAR
                        if channel.channel <= 4
                        else CircuitRole.BRANCH
                    ),
                )
                for channel in configuration.channels
            ),
        )
        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, configuration
        )

        await store.async_save_verified_meter_configuration(MAC, CONFIG_HASH, changed)

        assert await store.async_get_meter_configuration(MAC) == changed
        with pytest.raises(ValueError, match="replay"):
            await store.async_save_verified_meter_configuration(MAC, CONFIG_HASH, changed)

    asyncio.run(run())


def test_stored_meter_configuration_rejects_custom_selection_raw_gain_mismatch() -> (
    None
):
    """A nested custom selection cannot contradict the owning channel gain."""
    configuration = _configuration()
    channels = (
        replace(
            configuration.channels[0],
            model_id="custom",
            custom_gain_ct=24001,
            custom_label="Custom feed",
        ),
        *configuration.channels[1:],
    )
    selections = tuple(
        StoredCTSelection(
            channel.channel,
            channel.model_id,
            channel.custom_label,
            24002 if channel.channel == 1 else 27518,
            channel.reporting_multiplier,
            CONFIG_HASH,
        )
        for channel in channels
    )

    with pytest.raises(ValueError, match="ct_selections"):
        StoredMeterConfiguration(
            CONFIG_HASH,
            configuration.meter,
            channels,
            configuration.default_totals,
            configuration.automatic_totals,
            configuration.aggregates,
            configuration.power_quality,
            configuration.status_fields,
            selections,
        )


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

    for invalid in (True, 0.5, 3.0, 16.0):
        with pytest.raises(ValueError, match="1, 2, 4, or 8"):
            StoredCTSelection(1, None, None, 27518, invalid, "a" * 64)


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


def test_storage_1_1_migrates_without_rewriting_gain_only_records() -> None:
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

    assert STORAGE_MINOR_VERSION == 5
    assert migrated == legacy
    assert (
        "offset_groups"
        not in migrated["meters"]["aabbccddeeff"]["verified_calibration"]
    )


def test_storage_1_2_drops_unsupported_legacy_ct_multipliers() -> None:
    selection = {
        "channel": 1,
        "model_id": "custom",
        "display_label": "Main",
        "raw_gain_ct": 27518,
        "config_sha256": "a" * 64,
    }
    legacy = {
        "meters": {
            "aabbccddeeff": {
                "ct_selections": [
                    {**selection, "reporting_multiplier": 2.0},
                    {**selection, "channel": 2, "reporting_multiplier": 3.0},
                ]
            }
        }
    }

    migrated = migrate_storage(1, 2, deepcopy(legacy))

    assert migrated["meters"]["aabbccddeeff"]["ct_selections"] == [
        {**selection, "reporting_multiplier": 2.0}
    ]


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


@pytest.mark.parametrize("layout", ["standard", "two_voltages"])
def test_legacy_voltage_identity_is_normalized_and_reserialized(
    layout: str,
) -> None:
    from custom_components.circuitsetup_energy_meter_helper.store import (
        _deserialize_verified_calibration,
        _serialize_verified_calibration,
    )

    raw = {
        "verification_id": "a" * 32,
        "config_filename": "meter.yaml",
        "config_sha256": "b" * 64,
        "topology_addon_count": 1,
        "topology_project_name": "circuitsetup.6c-energy-meter-1-addon",
        "topology_connection_type": "wifi",
        "topology_voltage_layout": layout,
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
        "source_handoff_firmware_installed": False,
    }

    record = _deserialize_verified_calibration("aabbccddeeff", raw)
    expected = legacy_voltage_reference_topology(2, layout).fingerprint

    assert record.topology_voltage_fingerprint == expected
    assert _serialize_verified_calibration(record)["topology_voltage_fingerprint"] == expected
    assert _deserialize_verified_calibration(
        record.mac, _serialize_verified_calibration(record)
    ) == record


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


def test_final_verified_save_failure_preserves_durable_interruption_marker() -> None:
    async def run() -> None:
        class FailingStorage(_CopyingStorage):
            async def async_save(self, data: dict[str, object]) -> None:
                del data
                raise OSError("store unavailable")

        mac = "aabbccddeeff"
        marker = StoredInterruptedSession("indeterminate", "2026-08-23T00:00:00Z", (1,), None)
        backend = FailingStorage()
        backend.data = {
            "meters": {
                mac: {
                    "interrupted_session": {
                        "state": marker.state,
                        "started_at": marker.started_at,
                        "changed_channels": [1],
                        "config_transaction_id": None,
                    }
                }
            }
        }
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        record = VerifiedCalibrationRecord(
            mac=mac,
            config_filename="meter.yaml",
            config_sha256="a" * 64,
            topology_addon_count=0,
            topology_project_name="circuitsetup.6c-energy-meter",
            topology_connection_type="wifi",
            topology_voltage_layout="single",
            connection_generation=2,
            groups=(VerifiedGainGroup("meter_main1", ((7305, 27518),) * 3),),
            verification_id="b" * 32,
        )

        with pytest.raises(OSError, match="store unavailable"):
            await store.async_finalize_verified_calibration(record)

        durable = backend.data["meters"][mac]  # type: ignore[index]
        assert durable["interrupted_session"] is not None
        assert "verified_calibration" not in durable

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


def test_verified_meter_configuration_round_trips_without_operation_acknowledgement() -> (
    None
):
    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        configuration = _configuration()

        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, configuration
        )

        assert (
            await store.async_get_meter_configuration("AA:BB:CC:DD:EE:FF")
            == configuration
        )
        raw = backend.data["meters"][MAC]["meter_configuration"]  # type: ignore[index]
        assert set(raw) == {  # type: ignore[arg-type]
            "config_sha256",
            "meter",
            "channels",
            "default_totals",
            "automatic_totals",
            "aggregates",
            "power_quality",
            "status_fields",
            "ct_selections",
            "multi_reference_preparation_acknowledged",
            "totals_migration",
        }
        assert raw["multi_reference_preparation_acknowledged"] is False  # type: ignore[index]

    asyncio.run(run())


def test_calibrated_install_persists_full_meter_metadata_atomically() -> None:
    """A failed handoff must not leave CT/configuration metadata half persisted."""

    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        configuration = replace(_configuration(), config_sha256=PROPOSED_HASH)
        calibration = VerifiedCalibrationRecord(
            MAC,
            "meter.yaml",
            CONFIG_HASH,
            0,
            "circuitsetup.6c-energy-meter",
            "wifi",
            "standard",
            1,
            (VerifiedGainGroup("meter_main1", ((7305, 27518),) * 3),),
            "b" * 32,
        )
        transaction_id = "c" * 32

        await store.async_save_meter(_record())
        await store.async_save_verified_calibration(calibration)
        assert not await store.async_save_verified_meter_configuration_and_mark_verified_calibration_installed(
            MAC,
            CONFIG_HASH,
            configuration,
            calibration.verification_id,
            transaction_id,
        )
        assert await store.async_get_meter_configuration(MAC) is None
        assert await store.async_claim_verified_calibration(
            MAC, calibration.verification_id, transaction_id
        )

        assert await store.async_save_verified_meter_configuration_and_mark_verified_calibration_installed(
            MAC,
            CONFIG_HASH,
            configuration,
            calibration.verification_id,
            transaction_id,
        )
        installed = await store.async_get_verified_calibration(MAC)
        assert await store.async_get_meter_configuration(MAC) == configuration
        assert backend.data["meters"][MAC]["config_sha256"] == PROPOSED_HASH  # type: ignore[index]
        assert installed is not None and installed.source_handoff_firmware_installed

    asyncio.run(run())


def test_legacy_calibrated_install_commits_selections_and_marker_in_one_save() -> (
    None
):
    """A save failure cannot leave legacy CT metadata ahead of its marker."""

    class FailingStorage(_CopyingStorage):
        fail_save = False

        async def async_save(self, data: dict[str, object]) -> None:
            if self.fail_save:
                raise OSError("store unavailable")
            await super().async_save(data)

    async def run() -> None:
        backend = FailingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        calibration = VerifiedCalibrationRecord(
            MAC,
            "meter.yaml",
            CONFIG_HASH,
            0,
            "circuitsetup.6c-energy-meter",
            "wifi",
            "standard",
            1,
            (VerifiedGainGroup("meter_main1", ((7305, 27518),) * 3),),
            "b" * 32,
        )
        transaction_id = "c" * 32
        selections = (
            StoredCTSelection(1, "ct", "Kitchen", 27518, 1.0, PROPOSED_HASH),
        )
        await store.async_save_meter(_record())
        await store.async_save_verified_calibration(calibration)
        assert await store.async_claim_verified_calibration(
            MAC, calibration.verification_id, transaction_id
        )

        backend.fail_save = True
        with pytest.raises(OSError, match="unavailable"):
            await store.async_save_verified_ct_selections_and_mark_verified_calibration_installed(
                MAC,
                CONFIG_HASH,
                PROPOSED_HASH,
                _record(),
                selections,
                calibration.verification_id,
                transaction_id,
            )
        raw = backend.data["meters"][MAC]  # type: ignore[index]
        assert raw["config_sha256"] == CONFIG_HASH  # type: ignore[index]
        assert raw["ct_selections"] == []  # type: ignore[index]
        stored = await store.async_get_verified_calibration(MAC)
        assert stored is not None and not stored.source_handoff_firmware_installed

        backend.fail_save = False
        assert await store.async_save_verified_ct_selections_and_mark_verified_calibration_installed(
            MAC,
            CONFIG_HASH,
            PROPOSED_HASH,
            _record(),
            selections,
            calibration.verification_id,
            transaction_id,
        )
        raw = backend.data["meters"][MAC]  # type: ignore[index]
        assert raw["config_sha256"] == PROPOSED_HASH  # type: ignore[index]
        assert raw["ct_selections"][0]["config_sha256"] == PROPOSED_HASH  # type: ignore[index]
        assert "meter_configuration" not in raw  # type: ignore[operator]
        stored = await store.async_get_verified_calibration(MAC)
        assert stored is not None and stored.source_handoff_firmware_installed

    asyncio.run(run())


def test_old_meter_configuration_payload_without_nested_ct_selections_loads() -> None:
    """Nested CT metadata is additive, so existing verified records remain readable."""

    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, _configuration()
        )
        raw = backend.data["meters"][MAC]["meter_configuration"]  # type: ignore[index]
        del raw["ct_selections"]  # type: ignore[index]
        del raw["multi_reference_preparation_acknowledged"]  # type: ignore[index]
        for channel in raw["channels"]:  # type: ignore[index]
            del channel["burden_output_acknowledged"]

        loaded = await store.async_get_meter_configuration(MAC)
        assert loaded == _configuration() and loaded.ct_selections == ()

    asyncio.run(run())


def test_verified_meter_configuration_owns_its_ct_selections_atomically() -> None:
    """A verified full configuration is the single source for CT metadata."""

    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        selections = tuple(
                StoredCTSelection(
                    channel,
                    "ct",
                    None,
                27_518,
                1.0,
                CONFIG_HASH,
            )
            for channel in range(1, 7)
        )
        configuration = replace(_configuration(), ct_selections=selections)

        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, configuration
        )

        assert await store.async_get_meter_configuration(MAC) == configuration
        assert await store.async_get_ct_selections(MAC) == selections
        raw = backend.data["meters"][MAC]["meter_configuration"]  # type: ignore[index]
        assert raw["ct_selections"][0]["raw_gain_ct"] == 27_518  # type: ignore[index]

    asyncio.run(run())


def test_nested_ct_selection_rejects_every_channel_semantic_contradiction() -> None:
    """Corrupt nested selections cannot override their owning channel settings."""
    configuration = _configuration()
    selections = tuple(
        StoredCTSelection(channel.channel, "ct", None, 27_518, 1.0, CONFIG_HASH)
        for channel in configuration.channels
    )
    valid = replace(configuration, ct_selections=selections)

    for corrupt in (
        replace(selections[0], model_id="other"),
        replace(selections[0], display_label="different"),
        replace(selections[0], reporting_multiplier=2.0),
        replace(selections[0], channel=2),
    ):
        with pytest.raises(ValueError, match="ct_selections"):
            replace(valid, ct_selections=(corrupt, *selections[1:]))


def test_meter_configuration_is_rejected_when_record_hash_is_missing_or_stale() -> None:
    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        configuration = _configuration()

        with pytest.raises(ValueError, match="current meter record"):
            await store.async_save_verified_meter_configuration(
                MAC, CONFIG_HASH, configuration
            )
        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, configuration
        )
        backend.data["meters"][MAC]["config_sha256"] = "b" * 64  # type: ignore[index]

        assert await store.async_get_meter_configuration(MAC) is None
        with pytest.raises(ValueError, match="current meter record"):
            await store.async_save_verified_meter_configuration(
                MAC, CONFIG_HASH, configuration
            )

    asyncio.run(run())


def test_meter_configuration_rejects_noncanonical_nested_data_and_topology() -> None:
    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        configuration = _configuration()
        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, configuration
        )
        meter = backend.data["meters"][MAC]  # type: ignore[index]
        raw = meter["meter_configuration"]  # type: ignore[index]
        original_channels = deepcopy(raw["channels"])  # type: ignore[index]

        raw["meter"]["extra"] = "not allowed"  # type: ignore[index]
        with pytest.raises(ValueError):
            await store.async_get_meter_configuration(MAC)
        del raw["meter"]["extra"]  # type: ignore[index]
        raw["channels"][0]["role"] = "not-a-role"  # type: ignore[index]
        with pytest.raises(ValueError):
            await store.async_get_meter_configuration(MAC)
        raw["channels"][0]["role"] = "branch"  # type: ignore[index]
        raw["channels"] = raw["channels"][:-1]  # type: ignore[index]
        with pytest.raises(ValueError, match="meter configuration"):
            await store.async_get_meter_configuration(MAC)
        raw["channels"] = original_channels  # type: ignore[index]
        raw["power_quality"] = [1]  # type: ignore[index]
        with pytest.raises(ValueError, match="meter configuration"):
            await store.async_get_meter_configuration(MAC)
        raw["power_quality"] = [False]  # type: ignore[index]
        meter["topology"]["ct_count"] = 12  # type: ignore[index]
        with pytest.raises(ValueError, match="meter configuration"):
            await store.async_get_meter_configuration(MAC)

    asyncio.run(run())


def test_storage_1_3_migrates_without_fabricating_meter_configuration() -> None:
    legacy = {
        "meters": {
            MAC: {
                "ct_selections": [
                    {
                        "channel": 1,
                        "model_id": "ct",
                        "display_label": "CT 1",
                        "raw_gain_ct": 1,
                        "reporting_multiplier": 1.0,
                        "config_sha256": CONFIG_HASH,
                    }
                ]
            }
        }
    }

    migrated = migrate_storage(1, 3, deepcopy(legacy))

    assert STORAGE_MINOR_VERSION == 5
    assert migrated == legacy
    assert "meter_configuration" not in migrated["meters"][MAC]


def test_concurrent_meter_configuration_saves_are_isolated_and_immutable() -> None:
    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        other_mac = "001122334455"
        other = replace(_configuration(), config_sha256="b" * 64)
        await store.async_save_meter(_record())
        await store.async_save_meter(replace(_record("b" * 64), mac=other_mac))

        await asyncio.gather(
            store.async_save_verified_meter_configuration(
                MAC, CONFIG_HASH, _configuration()
            ),
            store.async_save_verified_meter_configuration(other_mac, "b" * 64, other),
        )

        loaded = await store.async_get_meter_configuration(MAC)
        assert loaded == _configuration()
        assert await store.async_get_meter_configuration(other_mac) == other
        backend.data["meters"][MAC]["meter_configuration"]["channels"][0]["name"] = (
            "Changed"  # type: ignore[index]
        )
        assert loaded.channels[0].name == "CT 1"  # type: ignore[union-attr]

    asyncio.run(run())


def test_meter_configuration_never_persists_hardware_preparation_acknowledgement() -> (
    None
):
    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        configuration = _configuration()
        acknowledged = replace(
            configuration,
            multi_reference_preparation_acknowledged=True,
            channels=(
                replace(configuration.channels[0], burden_output_acknowledged=True),
                *configuration.channels[1:],
            ),
        )
        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, acknowledged
        )

        raw = backend.data["meters"][MAC]["meter_configuration"]  # type: ignore[index]
        assert raw["multi_reference_preparation_acknowledged"] is False  # type: ignore[index]
        assert (
            await store.async_get_meter_configuration(MAC)
        ).multi_reference_preparation_acknowledged is False  # type: ignore[union-attr]
        assert raw["channels"][0]["burden_output_acknowledged"] is True  # type: ignore[index]
        assert (await store.async_get_meter_configuration(MAC)).channels[
            0
        ].burden_output_acknowledged is True  # type: ignore[union-attr]

    asyncio.run(run())


def test_save_meter_preserves_only_matching_valid_verified_configuration() -> None:
    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        configuration = _configuration()
        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, configuration
        )

        await store.async_save_meter(_record())
        assert await store.async_get_meter_configuration(MAC) == configuration

        backend.data["meters"][MAC]["meter_configuration"]["channels"] = "invalid"  # type: ignore[index]
        await store.async_save_meter(_record())
        assert "meter_configuration" not in backend.data["meters"][MAC]  # type: ignore[index]

        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, configuration
        )
        await store.async_save_meter(
            replace(
                _record(),
                topology=StoredTopology(
                    1, 2, 12, 4, "wifi", "standard", "circuitsetup.6c-energy-meter"
                ),
            )
        )
        assert "meter_configuration" not in backend.data["meters"][MAC]  # type: ignore[index]

        await store.async_save_meter(_record("b" * 64))
        assert "meter_configuration" not in backend.data["meters"][MAC]  # type: ignore[index]

    asyncio.run(run())


def test_stale_malformed_meter_configuration_returns_none_before_deserialization() -> (
    None
):
    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, _configuration()
        )
        meter = backend.data["meters"][MAC]  # type: ignore[index]
        meter["config_sha256"] = "b" * 64  # type: ignore[index]
        meter["meter_configuration"]["channels"] = "invalid"  # type: ignore[index]

        assert await store.async_get_meter_configuration(MAC) is None

    asyncio.run(run())


def test_meter_configuration_read_reports_malformed_current_semantics_without_raising() -> (
    None
):
    """Inventory reads need a stale result while strict callers still reject bad storage."""
    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, _configuration()
        )
        backend.data["meters"][MAC]["meter_configuration"]["channels"] = "invalid"  # type: ignore[index]

        result = await store.async_get_meter_configuration_read(MAC)

        assert result == MeterConfigurationRead(None, True)
        with pytest.raises(ValueError, match="meter configuration"):
            await store.async_get_meter_configuration(MAC)

    asyncio.run(run())


def test_storage_1_3_preserves_legacy_ct_selection_bytes() -> None:
    legacy = {
        "meters": {
            MAC: {
                "ct_selections": [
                    {
                        "channel": 1,
                        "model_id": "ct",
                        "display_label": "CT 1",
                        "raw_gain_ct": 1,
                        "reporting_multiplier": 3.0,
                        "config_sha256": CONFIG_HASH,
                    }
                ]
            }
        }
    }

    before = deepcopy(legacy)
    migrated = migrate_storage(1, 3, legacy)

    assert migrated is legacy
    assert migrated == before


def test_meter_configuration_bounds_and_evidence_errors_are_normalized() -> None:
    async def read_with(mutator: object) -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, _configuration()
        )
        meter = backend.data["meters"][MAC]  # type: ignore[index]
        mutator(meter)  # type: ignore[operator]
        with pytest.raises(ValueError, match="meter configuration"):
            await store.async_get_meter_configuration(MAC)

    async def run() -> None:
        await read_with(
            lambda meter: meter["topology"].update(
                {
                    "evidence": [
                        {"source": "config_project", "addon_count": 0, "detail": "x"}
                    ]
                    * 6
                }
            )
        )
        await read_with(
            lambda meter: meter["topology"].update(
                {
                    "evidence": [
                        {"source": "config_project", "addon_count": "0", "detail": "x"}
                    ]
                }
            )
        )
        await read_with(
            lambda meter: meter["meter_configuration"]["meter"][
                "voltage_references"
            ].extend(
                [
                    deepcopy(
                        meter["meter_configuration"]["meter"]["voltage_references"][0]
                    )
                ]
                * 2
            )
        )
        await read_with(
            lambda meter: meter["meter_configuration"]["meter"]["voltage_references"][
                0
            ]["group_keys"].append("extra")
        )
        await read_with(
            lambda meter: meter["meter_configuration"]["channels"].append(
                deepcopy(meter["meter_configuration"]["channels"][0])
            )
        )
        await read_with(
            lambda meter: meter["meter_configuration"]["aggregates"].extend(
                [deepcopy(meter["meter_configuration"]["aggregates"][0])] * 32
            )
        )
        await read_with(
            lambda meter: meter["meter_configuration"]["aggregates"][0][
                "channels"
            ].extend(range(3, 8))
        )
        await read_with(
            lambda meter: meter["meter_configuration"].update(
                {"power_quality": [False, False]}
            )
        )
        await read_with(
            lambda meter: meter["meter_configuration"].update(
                {"status_fields": [True, False]}
            )
        )

    asyncio.run(run())


def test_meter_configuration_rejects_noncanonical_voltage_reference_id() -> None:
    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        await store.async_save_meter(_record())
        configuration = _configuration()
        reference = configuration.meter.voltage_references[0]
        invalid = replace(
            configuration,
            meter=replace(
                configuration.meter,
                voltage_references=(replace(reference, reference_id="bad id"),),
            ),
            channels=tuple(
                replace(channel, voltage_reference_id="bad id")
                for channel in configuration.channels
            ),
        )

        with pytest.raises(ValueError, match="reference_id"):
            await store.async_save_verified_meter_configuration(
                MAC, CONFIG_HASH, invalid
            )

    asyncio.run(run())


@pytest.mark.parametrize(
    ("field", "value"),
    (
        ("connection_type", "ethernet_lilygo"),
        ("voltage_layout", "alternate"),
        ("project_name", "other-project"),
    ),
)
def test_save_meter_drops_configuration_when_stable_topology_identity_changes(
    field: str, value: str
) -> None:
    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        configuration = _configuration()
        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, configuration
        )

        await store.async_save_meter(
            replace(_record(), topology=replace(_topology(), **{field: value}))
        )

        assert "meter_configuration" not in backend.data["meters"][MAC]  # type: ignore[index]

    asyncio.run(run())


def test_save_meter_preserves_configuration_when_only_evidence_changes() -> None:
    async def run() -> None:
        backend = _CopyingStorage()
        store = object.__new__(HelperStore)
        store._store = backend  # type: ignore[assignment]
        store._update_lock = asyncio.Lock()
        configuration = _configuration()
        await store.async_save_meter(_record())
        await store.async_save_verified_meter_configuration(
            MAC, CONFIG_HASH, configuration
        )

        await store.async_save_meter(
            replace(
                _record(),
                topology=replace(
                    _topology(),
                    evidence=(StoredTopologyEvidence("config_project", 0, "new"),),
                ),
            )
        )

        assert await store.async_get_meter_configuration(MAC) == configuration

    asyncio.run(run())
