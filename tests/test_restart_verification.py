"""Restart persistence verification and reviewed calibrated-source handoff."""

from __future__ import annotations

import asyncio
from hashlib import sha256
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    CalibrationEngine,
    RestartDisconnectTimeoutError,
    RestartVerificationError,
)
from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
    ConfigMutationError,
    build_calibrated_gain_mutation,
)
from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionManager,
    ConfigTransactionState,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.entity_binding import bind_meter
from custom_components.circuitsetup_energy_meter_helper.entity_catalog import (
    EntityCatalog,
)
from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    RestoreEvidence,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    CalibrationSourceAuthority,
    HelperStore,
    VerifiedCalibrationRecord,
    VerifiedGainGroup,
)
from tests.test_config_transaction import Builder, Persistence, Verifier
from tests.test_entity_binding import (
    ButtonInfo,
    substitutions,
    synthetic_entities,
    topology,
)

GainTable = tuple[tuple[int, int], tuple[int, int], tuple[int, int]]


def _restore(instance_id: str, gains: GainTable) -> RestoreEvidence:
    return RestoreEvidence(
        2,
        instance_id,
        gains,
        "flash",
        True,
        "positive_loaded_line",
        False,
        (f"[CALIBRATION][{instance_id}] verified",),
    )


def _entities(addons: int, *, key_offset: int = 0) -> list[object]:
    entities = synthetic_entities(addons, key_offset=key_offset)
    entities.append(ButtonInfo("restart", key_offset + 10_000, "Restart"))
    return entities


class RestartSession:
    def __init__(
        self,
        evidence: dict[str, RestoreEvidence],
        *,
        addons: int = 1,
        disconnects: bool = True,
    ) -> None:
        self.connection_generation = 1
        self.entities = tuple(_entities(addons))
        self.connected = True
        self.log_lines: tuple[str, ...] = ()
        self.evidence = evidence
        self.addons = addons
        self.disconnects = disconnects
        self.events: list[tuple[Any, ...]] = []
        self._disconnect: asyncio.Future[None] | None = None

    def expect_disconnect(self) -> asyncio.Future[None]:
        self.events.append(("disconnect_armed",))
        self._disconnect = asyncio.get_running_loop().create_future()
        return self._disconnect

    async def async_press_button(self, key: int, *, device_id: int = 0) -> None:
        assert self._disconnect is not None
        self.events.append(("restart", key, device_id))
        if self.disconnects:
            self.connected = False
            self.entities = ()
            self._disconnect.set_result(None)

    async def async_reconnect(self, *, dump_config: bool = False) -> None:
        self.events.append(("reconnect", dump_config))
        self.connection_generation = 2
        self.entities = tuple(_entities(self.addons, key_offset=1_000))
        self.connected = True

    async def async_wait_for_restore(self, **kwargs: Any) -> dict[str, RestoreEvidence]:
        self.events.append(("restore", kwargs))
        return self.evidence


async def _ignore_marker(mac: str, marker: object) -> None:
    del mac, marker


def test_restart_arms_disconnect_rebinds_and_persists_exact_changed_set() -> None:
    async def run() -> None:
        expected = {
            "meter_main1": ((7301, 28001), (7301, 28002), (7301, 28003)),
            "addon1_2": ((7312, 28010), (7312, 28011), (7312, 28012)),
        }
        session = RestartSession(
            {
                instance: _restore(instance, gains)
                for instance, gains in expected.items()
            }
        )
        original = bind_meter(
            EntityCatalog(session.entities, 1), topology(1), substitutions(1)
        )
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        engine = CalibrationEngine(
            SessionManager(), _ignore_marker, persist_verified=persist
        )
        result = await engine.async_verify_after_restart(
            "aabbccddeeff",
            session,
            original,
            expected,
            config_filename="meter.yaml",
            config_sha256="a" * 64,
            substitutions=substitutions(1),
        )

        assert [event[0] for event in session.events] == [
            "disconnect_armed",
            "restart",
            "reconnect",
            "restore",
        ]
        assert session.events[2] == ("reconnect", True)
        assert session.events[3][1]["expected_instance_ids"] == set(expected)
        assert result.binding.connection_generation == 2
        assert result.binding.groups[0].run_gain.descriptor.key >= 1_000
        assert result.record.groups == tuple(
            VerifiedGainGroup(instance, gains) for instance, gains in expected.items()
        )
        assert result.record.source_authority is CalibrationSourceAuthority.SAVED_FLASH
        assert result.record.source_status == (
            "Saved flash calibration remains authoritative until it is explicitly cleared."
        )
        assert saved == [result.record]

    asyncio.run(run())


@pytest.mark.parametrize(
    ("evidence", "match"),
    (
        ({"meter_main1": _restore("meter_main1", ((1, 2), (3, 4), (5, 7)))}, "exact"),
        ({}, "missing"),
        (
            {
                "meter_main1": _restore("meter_main1", ((1, 2), (3, 4), (5, 6))),
                "meter_main2": _restore("meter_main2", ((1, 2), (3, 4), (5, 6))),
            },
            "unexpected",
        ),
        (
            {
                "meter_main1": RestoreEvidence(
                    2,
                    "meter_main1",
                    ((1, 2), (3, 4), (5, 6)),
                    "config",
                    False,
                    "positive_loaded_line",
                    False,
                    ("No stored gain calibrations found",),
                )
            },
            "flash",
        ),
        (
            {
                "meter_main1": RestoreEvidence(
                    2,
                    "meter_main1",
                    ((1, 2), (3, 4), (5, 6)),
                    "flash",
                    True,
                    "positive_loaded_line",
                    False,
                    ("[E] SPI communication failed",),
                )
            },
            "SPI",
        ),
    ),
)
def test_restart_refuses_incomplete_fallback_spi_or_unexpected_evidence(
    evidence: dict[str, RestoreEvidence], match: str
) -> None:
    async def run() -> None:
        expected = {"meter_main1": ((1, 2), (3, 4), (5, 6))}
        session = RestartSession(evidence, addons=0)
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        engine = CalibrationEngine(
            SessionManager(), _ignore_marker, persist_verified=persist
        )
        with pytest.raises(RestartVerificationError, match=match):
            await engine.async_verify_after_restart(
                "aabbccddeeff",
                session,
                binding,
                expected,
                config_filename="meter.yaml",
                config_sha256="b" * 64,
                substitutions=substitutions(0),
            )
        assert saved == []

    asyncio.run(run())


def test_restart_disconnect_timeout_is_typed_and_never_reconnects_or_persists() -> None:
    async def run() -> None:
        expected = {"meter_main1": ((1, 2), (3, 4), (5, 6))}
        session = RestartSession({}, addons=0, disconnects=False)
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        engine = CalibrationEngine(
            SessionManager(),
            _ignore_marker,
            persist_verified=persist,
            restart_disconnect_timeout=0.01,
        )
        with pytest.raises(RestartDisconnectTimeoutError, match="20-second"):
            await engine.async_verify_after_restart(
                "aabbccddeeff",
                session,
                binding,
                expected,
                config_filename="meter.yaml",
                config_sha256="c" * 64,
                substitutions=substitutions(0),
            )
        assert not any(event[0] == "reconnect" for event in session.events)
        assert saved == []

    asyncio.run(run())


def _snapshot(content: str | None = None) -> ESPHomeConfigSnapshot:
    content = content or (
        "substitutions:\n"
        "  voltage_cal1: '7305'\n"
        "  voltage_cal2: '7305'\n"
        + "".join(f"  current_cal_ct{i}: '27518'\n" for i in range(1, 7))
        + "logger:\n  level: DEBUG\n"
    )
    return ESPHomeConfigSnapshot(
        "meter.yaml", content, sha256(content.encode()).hexdigest()
    )


def _record(
    snapshot: ESPHomeConfigSnapshot, gains: GainTable
) -> VerifiedCalibrationRecord:
    return VerifiedCalibrationRecord(
        "aabbccddeeff",
        snapshot.configuration,
        snapshot.sha256,
        2,
        (VerifiedGainGroup("meter_main1", gains),),
    )


def test_uniform_gains_build_surgical_hash_bound_source_mutation() -> None:
    snapshot = _snapshot()
    record = _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003)))
    plan = build_calibrated_gain_mutation(snapshot, topology(0), record)

    assert [change.key for change in plan.changes] == [
        "current_cal_ct1",
        "current_cal_ct2",
        "current_cal_ct3",
        "voltage_cal1",
    ]
    assert "current_cal_ct1: '28001'" in plan.proposed_content
    assert "voltage_cal1: '7301'" in plan.proposed_content
    assert "logger:\n  level: DEBUG\n" in plan.proposed_content
    assert record.source_authority is CalibrationSourceAuthority.SAVED_FLASH


def test_divergent_voltage_gains_return_exact_extend_snippet_and_never_auto_write() -> (
    None
):
    snapshot = _snapshot()
    record = _record(snapshot, ((7301, 28001), (7302, 28002), (7303, 28003)))
    expected = (
        "substitutions:\n"
        "  current_cal_ct1: 28001\n"
        "  current_cal_ct2: 28002\n"
        "  current_cal_ct3: 28003\n"
        "sensor:\n"
        "  - id: !extend meter_main1\n"
        "    phase_a:\n"
        "      gain_voltage: 7301\n"
        "    phase_b:\n"
        "      gain_voltage: 7302\n"
        "    phase_c:\n"
        "      gain_voltage: 7303\n"
    )

    with pytest.raises(ConfigMutationError, match="manual review") as error:
        build_calibrated_gain_mutation(snapshot, topology(0), record)
    assert error.value.snippet == expected


def test_shared_voltage_substitution_requires_every_mapped_gain_to_match() -> None:
    base = _snapshot()
    snapshot = _snapshot(
        base.content.replace(
            "logger:",
            "  current_cal_ct7: '27518'\n"
            "  current_cal_ct8: '27518'\n"
            "  current_cal_ct9: '27518'\n"
            "logger:",
        )
    )
    matching = VerifiedCalibrationRecord(
        "aabbccddeeff",
        snapshot.configuration,
        snapshot.sha256,
        2,
        (
            VerifiedGainGroup(
                "meter_main1", ((7301, 28001), (7301, 28002), (7301, 28003))
            ),
            VerifiedGainGroup(
                "addon1_1", ((7301, 28007), (7301, 28008), (7301, 28009))
            ),
        ),
    )
    plan = build_calibrated_gain_mutation(snapshot, topology(1), matching)
    assert [change.key for change in plan.changes].count("voltage_cal1") == 1

    divergent = VerifiedCalibrationRecord(
        matching.mac,
        matching.config_filename,
        matching.config_sha256,
        matching.connection_generation,
        (
            matching.groups[0],
            VerifiedGainGroup(
                "addon1_1", ((7302, 28007), (7302, 28008), (7302, 28009))
            ),
        ),
    )
    with pytest.raises(ConfigMutationError) as error:
        build_calibrated_gain_mutation(snapshot, topology(1), divergent)
    assert "- id: !extend meter_main1" in error.value.snippet
    assert "- id: !extend addon1_1" in error.value.snippet


def test_transaction_rereads_and_refuses_changed_calibration_origin() -> None:
    async def run() -> None:
        origin = _snapshot()
        changed = origin.content.replace("level: DEBUG", "level: INFO")
        manager = ConfigTransactionManager(
            Builder(remote_content=changed),
            Verifier(RuntimeError()),
            Persistence(),
            SessionManager(),
        )
        with pytest.raises(ConfigMutationError, match="re-read"):
            await manager.async_preview_calibrated_gains(
                "aabbccddeeff", topology(0), _record(origin, ((7301, 1),) * 3)
            )
        assert manager.sessions._config_transactions == {}

        current = _snapshot()
        manager2 = ConfigTransactionManager(
            Builder(remote_content=current.content),
            Verifier(RuntimeError()),
            Persistence(),
            SessionManager(),
        )
        status = await manager2.async_preview_calibrated_gains(
            "aabbccddeeff", topology(0), _record(current, ((7301, 1),) * 3)
        )
        assert status.state is ConfigTransactionState.PREVIEWED

    asyncio.run(run())


def test_store_writes_only_compact_verified_calibration_schema() -> None:
    async def run() -> None:
        snapshot = _snapshot()
        record = _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003)))
        store = object.__new__(HelperStore)
        store._update_lock = asyncio.Lock()
        from tests.test_store import _CopyingStorage

        storage = _CopyingStorage()
        store._store = storage
        await store.async_save_verified_calibration(record)
        saved = storage.data["meters"][record.mac]["verified_calibration"]
        assert saved == {
            "config_filename": "meter.yaml",
            "config_sha256": snapshot.sha256,
            "connection_generation": 2,
            "groups": [
                {
                    "instance_id": "meter_main1",
                    "phase_gains": [[7301, 28001], [7301, 28002], [7301, 28003]],
                }
            ],
            "source_authority": "saved_flash",
        }
        assert "content" not in repr(saved)

    asyncio.run(run())
