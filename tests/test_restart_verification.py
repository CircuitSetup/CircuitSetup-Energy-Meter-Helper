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
from tests.test_calibration_engine_current import native_meter
from tests.test_calibration_engine_voltage import FakeCalibrationSession, gain_evidence
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
        reconnect_failures: int = 0,
    ) -> None:
        self.connection_generation = 1
        self.entities = tuple(_entities(addons))
        self.connected = True
        self.log_lines: tuple[str, ...] = ()
        self.evidence = evidence
        self.addons = addons
        self.disconnects = disconnects
        self.reconnect_failures = reconnect_failures
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
        if self.reconnect_failures:
            self.reconnect_failures -= 1
            raise ConnectionError("device still booting")
        self.connection_generation = 2
        self.entities = tuple(_entities(self.addons, key_offset=1_000))
        self.connected = True

    async def async_wait_for_restore(self, **kwargs: Any) -> dict[str, RestoreEvidence]:
        self.events.append(("restore", kwargs))
        return self.evidence


class LogFallbackRestartSession:
    """Production-shaped session: restore evidence is available only in logs."""

    def __init__(self, restore_lines: tuple[str, ...]) -> None:
        self.connection_generation = 1
        self.entities = tuple(_entities(0))
        self.connected = True
        self.log_lines: tuple[str, ...] = ()
        self.restore_lines = restore_lines
        self.events: list[tuple[Any, ...]] = []
        self._disconnect: asyncio.Future[None] | None = None

    def expect_disconnect(self) -> asyncio.Future[None]:
        self._disconnect = asyncio.get_running_loop().create_future()
        return self._disconnect

    async def async_press_button(self, key: int, *, device_id: int = 0) -> None:
        del key, device_id
        assert self._disconnect is not None
        self.connected = False
        self.entities = ()
        self._disconnect.set_result(None)

    async def async_reconnect(self, *, dump_config: bool = False) -> None:
        self.events.append(("reconnect", dump_config))
        self.connection_generation = 2
        self.entities = tuple(_entities(0, key_offset=1_000))
        self.connected = True
        self.log_lines = self.restore_lines


def _restore_log(instance_id: str, gains: GainTable) -> tuple[str, ...]:
    lines = [
        f"[I] [CALIBRATION][{instance_id}] ============ Restoring saved gain calibrations to registers ============",
        f"[I] [CALIBRATION][{instance_id}] | Phase | voltage_gain | current_gain |",
    ]
    lines.extend(
        f"[I] [CALIBRATION][{instance_id}] |   {phase}   | {voltage} | {current} |"
        for phase, (voltage, current) in zip("ABC", gains, strict=True)
    )
    lines.append(
        f"[I] [CALIBRATION][{instance_id}] Gain calibration loaded and verified successfully."
    )
    return tuple(lines)


async def _ignore_marker(mac: str, marker: object) -> None:
    del mac, marker


def _prime_origin(
    sessions: SessionManager,
    expected: dict[str, GainTable],
    *,
    addons: int,
    snapshot: ESPHomeConfigSnapshot | None = None,
) -> ESPHomeConfigSnapshot:
    snapshot = snapshot or _snapshot()
    sessions.start_calibration_origin(
        "aabbccddeeff", topology(addons), snapshot.configuration, snapshot.sha256
    )
    for instance_id, gains in expected.items():
        sessions.record_calibration_group(
            "aabbccddeeff", topology(addons), instance_id, gains
        )
    return snapshot


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

        sessions = SessionManager()
        snapshot = _prime_origin(sessions, expected, addons=1)
        engine = CalibrationEngine(sessions, _ignore_marker, persist_verified=persist)
        result = await engine.async_verify_after_restart(
            "aabbccddeeff",
            session,
            original,
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
        assert result.record.config_sha256 == snapshot.sha256
        assert result.record.topology_addon_count == 1
        assert sessions.pending_calibration("aabbccddeeff") is None
        assert result.record.source_status == (
            "Saved flash calibration remains authoritative until it is explicitly cleared."
        )
        assert saved == [result.record]
        event_count = len(session.events)
        with pytest.raises(RestartVerificationError, match="origin"):
            await engine.async_verify_after_restart(
                "aabbccddeeff",
                session,
                result.binding,
                substitutions=substitutions(1),
            )
        assert len(session.events) == event_count

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

        sessions = SessionManager()
        _prime_origin(sessions, expected, addons=0)
        engine = CalibrationEngine(sessions, _ignore_marker, persist_verified=persist)
        with pytest.raises(RestartVerificationError, match=match):
            await engine.async_verify_after_restart(
                "aabbccddeeff",
                session,
                binding,
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

        sessions = SessionManager()
        _prime_origin(sessions, expected, addons=0)
        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=persist,
            restart_disconnect_timeout=0.01,
        )
        with pytest.raises(RestartDisconnectTimeoutError, match="20-second"):
            await engine.async_verify_after_restart(
                "aabbccddeeff",
                session,
                binding,
                substitutions=substitutions(0),
            )
        assert not any(event[0] == "reconnect" for event in session.events)
        assert saved == []

    asyncio.run(run())


def test_restart_retries_transient_boot_failure_within_one_restore_deadline() -> None:
    async def run() -> None:
        expected = {"meter_main1": ((1, 2), (3, 4), (5, 6))}
        session = RestartSession(
            {"meter_main1": _restore("meter_main1", expected["meter_main1"])},
            addons=0,
            reconnect_failures=1,
        )
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        _prime_origin(sessions, expected, addons=0)
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=persist,
            restart_backoff_initial=0.001,
        )
        await engine.async_verify_after_restart(
            "aabbccddeeff", session, binding, substitutions=substitutions(0)
        )
        assert [event for event in session.events if event[0] == "reconnect"] == [
            ("reconnect", True),
            ("reconnect", True),
        ]
        assert len(saved) == 1

    asyncio.run(run())


def test_restart_reconnect_exhaustion_is_typed_and_preserves_no_record() -> None:
    async def run() -> None:
        expected = {"meter_main1": ((1, 2), (3, 4), (5, 6))}
        session = RestartSession({}, addons=0, reconnect_failures=10_000)
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        _prime_origin(sessions, expected, addons=0)
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=persist,
            restart_restore_timeout=0.01,
            restart_backoff_initial=0.001,
        )
        with pytest.raises(RestartVerificationError, match="reconnect"):
            await engine.async_verify_after_restart(
                "aabbccddeeff", session, binding, substitutions=substitutions(0)
            )
        assert len([event for event in session.events if event[0] == "reconnect"]) > 1
        assert saved == []

    asyncio.run(run())


def test_restart_reconnect_cancellation_propagates_and_preserves_origin() -> None:
    async def run() -> None:
        expected = {"meter_main1": ((1, 2), (3, 4), (5, 6))}
        session = RestartSession({}, addons=0, reconnect_failures=10_000)
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        _prime_origin(sessions, expected, addons=0)
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=persist,
            restart_restore_timeout=1.0,
            restart_backoff_initial=0.2,
        )
        operation = asyncio.create_task(
            engine.async_verify_after_restart(
                "aabbccddeeff", session, binding, substitutions=substitutions(0)
            )
        )
        while not any(event[0] == "reconnect" for event in session.events):
            await asyncio.sleep(0)
        operation.cancel()
        with pytest.raises(asyncio.CancelledError):
            await operation
        assert saved == []
        assert sessions.pending_calibration("aabbccddeeff") is not None

    asyncio.run(run())


def test_restart_requires_and_consumes_server_owned_complete_origin() -> None:
    async def run() -> None:
        all_expected = {
            "meter_main1": ((1, 2), (3, 4), (5, 6)),
            "meter_main2": ((7, 8), (9, 10), (11, 12)),
        }
        one_group = {
            "meter_main1": _restore("meter_main1", all_expected["meter_main1"])
        }
        session = RestartSession(one_group, addons=0)
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        engine = CalibrationEngine(
            sessions, _ignore_marker, persist_verified=_ignore_verified
        )
        with pytest.raises(RestartVerificationError, match="origin"):
            await engine.async_verify_after_restart(
                "aabbccddeeff", session, binding, substitutions=substitutions(0)
            )
        assert session.events == []

        _prime_origin(sessions, all_expected, addons=0)
        with pytest.raises(RestartVerificationError, match="missing"):
            await engine.async_verify_after_restart(
                "aabbccddeeff", session, binding, substitutions=substitutions(0)
            )
        assert sessions.pending_calibration("aabbccddeeff") is not None

    asyncio.run(run())


def test_real_log_fallback_rejects_complete_unexpected_restore_block() -> None:
    async def run() -> None:
        expected = {"meter_main1": ((7305, 1), (7305, 2), (7305, 3))}
        unexpected = ((7305, 4), (7305, 5), (7305, 6))
        session = LogFallbackRestartSession(
            _restore_log("meter_main1", expected["meter_main1"])
            + _restore_log("meter_main2", unexpected)
        )
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        _prime_origin(sessions, expected, addons=0)
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        engine = CalibrationEngine(sessions, _ignore_marker, persist_verified=persist)
        with pytest.raises(RestartVerificationError, match="unexpected"):
            await engine.async_verify_after_restart(
                "aabbccddeeff", session, binding, substitutions=substitutions(0)
            )
        assert saved == []

    asyncio.run(run())


async def _ignore_verified(record: VerifiedCalibrationRecord) -> None:
    del record


def test_successful_task17_gain_updates_server_owned_pending_table() -> None:
    async def run() -> None:
        sessions = SessionManager()
        snapshot = _snapshot()
        sessions.start_calibration_origin(
            "aabbccddeeff",
            topology(0),
            snapshot.configuration,
            snapshot.sha256,
        )
        evidence = gain_evidence(
            "meter_main1",
            reference_currents=(10.0, 0.0, 0.0),
            current_changes=(True, False, False),
        )
        engine = CalibrationEngine(sessions, _ignore_marker)
        await engine.async_calibrate_current(
            "aabbccddeeff",
            FakeCalibrationSession(evidence),
            native_meter(),
            1,
            10.0,
            1.0,
            1.0,
        )
        pending = sessions.pending_calibration("aabbccddeeff")
        assert pending is not None
        assert pending.expected_phase_gains == {
            "meter_main1": tuple(
                (phase.new_voltage_gain, phase.new_current_gain)
                for phase in evidence.phases
            )
        }

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
    snapshot: ESPHomeConfigSnapshot,
    gains: GainTable,
    *,
    verification_id: str = "1" * 32,
) -> VerifiedCalibrationRecord:
    return VerifiedCalibrationRecord(
        mac="aabbccddeeff",
        config_filename=snapshot.configuration,
        config_sha256=snapshot.sha256,
        topology_addon_count=0,
        topology_project_name=topology(0).project_name,
        topology_connection_type=topology(0).connection_type,
        topology_voltage_layout=topology(0).voltage_layout,
        connection_generation=2,
        groups=(VerifiedGainGroup("meter_main1", gains),),
        verification_id=verification_id,
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
    partial = VerifiedCalibrationRecord(
        mac="aabbccddeeff",
        config_filename=snapshot.configuration,
        config_sha256=snapshot.sha256,
        topology_addon_count=1,
        topology_project_name=topology(1).project_name,
        topology_connection_type=topology(1).connection_type,
        topology_voltage_layout=topology(1).voltage_layout,
        connection_generation=2,
        groups=(
            VerifiedGainGroup(
                "meter_main1", ((7301, 28001), (7301, 28002), (7301, 28003))
            ),
        ),
        verification_id="4" * 32,
    )
    with pytest.raises(ConfigMutationError, match="manual review") as partial_error:
        build_calibrated_gain_mutation(snapshot, topology(1), partial)
    assert "- id: !extend meter_main1" in partial_error.value.snippet
    assert "voltage_cal1" not in partial_error.value.snippet

    matching = VerifiedCalibrationRecord(
        mac="aabbccddeeff",
        config_filename=snapshot.configuration,
        config_sha256=snapshot.sha256,
        topology_addon_count=1,
        topology_project_name=topology(1).project_name,
        topology_connection_type=topology(1).connection_type,
        topology_voltage_layout=topology(1).voltage_layout,
        connection_generation=2,
        groups=(
            VerifiedGainGroup(
                "meter_main1", ((7301, 28001), (7301, 28002), (7301, 28003))
            ),
            VerifiedGainGroup(
                "addon1_1", ((7301, 28007), (7301, 28008), (7301, 28009))
            ),
        ),
        verification_id="2" * 32,
    )
    plan = build_calibrated_gain_mutation(snapshot, topology(1), matching)
    assert [change.key for change in plan.changes].count("voltage_cal1") == 1

    divergent = VerifiedCalibrationRecord(
        mac=matching.mac,
        config_filename=matching.config_filename,
        config_sha256=matching.config_sha256,
        topology_addon_count=matching.topology_addon_count,
        topology_project_name=matching.topology_project_name,
        topology_connection_type=matching.topology_connection_type,
        topology_voltage_layout=matching.topology_voltage_layout,
        connection_generation=matching.connection_generation,
        groups=(
            matching.groups[0],
            VerifiedGainGroup(
                "addon1_1", ((7302, 28007), (7302, 28008), (7302, 28009))
            ),
        ),
        verification_id="3" * 32,
    )
    with pytest.raises(ConfigMutationError) as error:
        build_calibrated_gain_mutation(snapshot, topology(1), divergent)
    assert "- id: !extend meter_main1" in error.value.snippet
    assert "- id: !extend addon1_1" in error.value.snippet


class CalibrationPersistence(Persistence):
    def __init__(self, records: tuple[VerifiedCalibrationRecord, ...]) -> None:
        super().__init__()
        self.records = {record.mac: record for record in records}
        self.claimed: set[str] = set()

    async def async_get_verified_calibration(
        self, mac: str
    ) -> VerifiedCalibrationRecord | None:
        return self.records.get(mac)

    async def async_claim_verified_calibration(
        self, mac: str, verification_id: str
    ) -> bool:
        record = self.records.get(mac)
        if (
            record is None
            or record.verification_id != verification_id
            or verification_id in self.claimed
        ):
            return False
        self.claimed.add(verification_id)
        return True


def test_transaction_rereads_and_refuses_cross_device_stale_or_changed_origin() -> None:
    async def run() -> None:
        origin = _snapshot()
        record = _record(origin, ((7301, 1),) * 3)
        changed = origin.content.replace("level: DEBUG", "level: INFO")
        persistence = CalibrationPersistence((record,))
        manager = ConfigTransactionManager(
            Builder(remote_content=changed),
            Verifier(RuntimeError()),
            persistence,
            SessionManager(),
        )
        with pytest.raises(ConfigMutationError, match="re-read"):
            await manager.async_preview_calibrated_gains(
                "aabbccddeeff", topology(0), record.verification_id
            )
        assert manager.sessions._config_transactions == {}
        assert persistence.claimed == set()

        cross_builder = Builder(remote_content=origin.content)
        cross_manager = ConfigTransactionManager(
            cross_builder,
            Verifier(RuntimeError()),
            persistence,
            SessionManager(),
        )
        with pytest.raises(ConfigMutationError, match="current verified calibration"):
            await cross_manager.async_preview_calibrated_gains(
                "112233445566", topology(0), record.verification_id
            )
        assert cross_builder.calls == []

        latest = _record(origin, ((7302, 2),) * 3, verification_id="9" * 32)
        stale_persistence = CalibrationPersistence((latest,))
        stale_builder = Builder(remote_content=origin.content)
        stale_manager = ConfigTransactionManager(
            stale_builder,
            Verifier(RuntimeError()),
            stale_persistence,
            SessionManager(),
        )
        with pytest.raises(ConfigMutationError, match="current verified calibration"):
            await stale_manager.async_preview_calibrated_gains(
                record.mac, topology(0), record.verification_id
            )
        assert stale_builder.calls == []

        current = _snapshot()
        current_record = _record(current, ((7301, 1),) * 3)
        current_persistence = CalibrationPersistence((current_record,))
        manager2 = ConfigTransactionManager(
            Builder(remote_content=current.content),
            Verifier(RuntimeError()),
            current_persistence,
            SessionManager(),
        )
        status = await manager2.async_preview_calibrated_gains(
            "aabbccddeeff", topology(0), current_record.verification_id
        )
        assert status.state is ConfigTransactionState.PREVIEWED
        with pytest.raises(ConfigMutationError, match="already been used"):
            await manager2.async_preview_calibrated_gains(
                "aabbccddeeff", topology(0), current_record.verification_id
            )

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
            "verification_id": record.verification_id,
            "config_filename": "meter.yaml",
            "config_sha256": snapshot.sha256,
            "topology_addon_count": 0,
            "topology_project_name": topology(0).project_name,
            "topology_connection_type": topology(0).connection_type,
            "topology_voltage_layout": topology(0).voltage_layout,
            "connection_generation": 2,
            "groups": [
                {
                    "instance_id": "meter_main1",
                    "phase_gains": [[7301, 28001], [7301, 28002], [7301, 28003]],
                }
            ],
            "source_authority": "saved_flash",
            "source_handoff_available": True,
        }
        assert "content" not in repr(saved)
        assert await store.async_get_verified_calibration(record.mac) == record
        assert await store.async_claim_verified_calibration(
            record.mac, record.verification_id
        )
        assert not await store.async_claim_verified_calibration(
            record.mac, record.verification_id
        )

    asyncio.run(run())


@pytest.mark.parametrize(
    "phase_gains",
    (
        ((1, 2), (3, 4)),
        ((1, 2, 3), (4, 5, 6), (7, 8, 9)),
        ((True, 2), (3, 4), (5, 6)),
        ((1.0, 2), (3, 4), (5, 6)),
        ([1, 2], [3, 4], [5, 6]),
    ),
)
def test_verified_gain_group_rejects_malformed_runtime_shape(
    phase_gains: object,
) -> None:
    with pytest.raises(ValueError, match="three phases"):
        VerifiedGainGroup("meter_main1", phase_gains)  # type: ignore[arg-type]
