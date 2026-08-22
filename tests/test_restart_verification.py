"""Restart persistence verification and reviewed calibrated-source handoff."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
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
    CalibrationBusyError,
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
        self.connection_lock = asyncio.Lock()

    @asynccontextmanager
    async def hold_connection_generation(self, generation: int) -> AsyncIterator[None]:
        async with self.connection_lock:
            if not self.connected or self.connection_generation != generation:
                raise RestartVerificationError("ESPHome session disconnected")
            yield

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
        self.connection_lock = asyncio.Lock()

    @asynccontextmanager
    async def hold_connection_generation(self, generation: int) -> AsyncIterator[None]:
        async with self.connection_lock:
            if not self.connected or self.connection_generation != generation:
                raise RestartVerificationError("ESPHome session disconnected")
            yield

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


class DelayedFragmentRestartSession(LogFallbackRestartSession):
    def __init__(self, restore_lines: tuple[str, ...], fragment: str) -> None:
        super().__init__(restore_lines)
        self.fragment = fragment
        self.emitter: asyncio.Task[None] | None = None

    async def async_reconnect(self, *, dump_config: bool = False) -> None:
        await super().async_reconnect(dump_config=dump_config)

        async def emit() -> None:
            await asyncio.sleep(0.005)
            self.log_lines = (*self.log_lines, self.fragment)

        self.emitter = asyncio.create_task(emit())


class DelayedDisconnectRestartSession(LogFallbackRestartSession):
    def __init__(self, restore_lines: tuple[str, ...]) -> None:
        super().__init__(restore_lines)
        self.stop_task: asyncio.Task[None] | None = None

    async def async_reconnect(self, *, dump_config: bool = False) -> None:
        await super().async_reconnect(dump_config=dump_config)

        async def stop() -> None:
            await asyncio.sleep(0.005)
            self.connected = False
            self.entities = ()

        self.stop_task = asyncio.create_task(stop())


class PersistenceDisconnectRestartSession(RestartSession):
    def __init__(self, evidence: dict[str, RestoreEvidence]) -> None:
        super().__init__(evidence, addons=0)
        self.stop_task: asyncio.Task[None] | None = None

    def request_stop(self) -> None:
        async def stop() -> None:
            async with self.connection_lock:
                self.connected = False
                self.entities = ()

        self.stop_task = asyncio.create_task(stop())


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


async def _prime_origin(
    sessions: SessionManager,
    session: object,
    binding: object,
    expected: dict[str, GainTable],
    *,
    snapshot: ESPHomeConfigSnapshot | None = None,
) -> ESPHomeConfigSnapshot:
    snapshot = snapshot or _snapshot()
    lease = await sessions.async_acquire_calibration("aabbccddeeff")
    try:
        pending = sessions._begin_calibration_origin(lease, session, binding, snapshot)
        for instance_id, gains in expected.items():
            pending = sessions.record_calibration_group(
                lease,
                pending.operation_id,
                pending.revision,
                session,
                binding,
                instance_id,
                gains,
            )
    finally:
        lease.release()
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
        snapshot = await _prime_origin(sessions, session, original, expected)
        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=persist,
        )
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


def test_restart_claim_blocks_group_revision_during_persistence() -> None:
    async def run() -> None:
        expected = {"meter_main1": ((7301, 1), (7301, 2), (7301, 3))}
        session = RestartSession(
            {"meter_main1": _restore("meter_main1", expected["meter_main1"])},
            addons=0,
        )
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        await _prime_origin(sessions, session, binding, expected)
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            pending = sessions.pending_calibration("aabbccddeeff")
            assert pending is not None
            lease = sessions._calibration_leases["aabbccddeeff"]
            with pytest.raises(CalibrationBusyError, match="claimed"):
                sessions.record_calibration_group(
                    lease,
                    pending.operation_id,
                    pending.revision,
                    session,
                    binding,
                    "meter_main2",
                    ((7999, 7), (7999, 8), (7999, 9)),
                )
            saved.append(record)

        engine = CalibrationEngine(sessions, _ignore_marker, persist_verified=persist)
        result = await engine.async_verify_after_restart(
            "aabbccddeeff", session, binding, substitutions=substitutions(0)
        )
        assert [group.instance_id for group in result.record.groups] == ["meter_main1"]
        assert saved == [result.record]
        assert sessions.pending_calibration("aabbccddeeff") is None

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
        await _prime_origin(sessions, session, binding, expected)
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
        await _prime_origin(sessions, session, binding, expected)
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
        await _prime_origin(sessions, session, binding, expected)
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
        await _prime_origin(sessions, session, binding, expected)
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
        await _prime_origin(sessions, session, binding, expected)
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

        await _prime_origin(sessions, session, binding, all_expected)
        with pytest.raises(RestartVerificationError, match="missing"):
            await engine.async_verify_after_restart(
                "aabbccddeeff", session, binding, substitutions=substitutions(0)
            )
        pending = sessions.pending_calibration("aabbccddeeff")
        assert pending is not None
        assert pending.claimed_revision is None

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
        await _prime_origin(sessions, session, binding, expected)
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=persist,
            restart_restore_timeout=0.02,
        )
        with pytest.raises(RestartVerificationError, match="unexpected"):
            await engine.async_verify_after_restart(
                "aabbccddeeff", session, binding, substitutions=substitutions(0)
            )
        assert saved == []

    asyncio.run(run())


def test_real_log_fallback_rejects_unexpected_phase_row_fragment() -> None:
    async def run() -> None:
        expected = {"meter_main1": ((7305, 1), (7305, 2), (7305, 3))}
        session = LogFallbackRestartSession(
            _restore_log("meter_main1", expected["meter_main1"])
            + ("[I] [CALIBRATION][meter_main2] | A | 9999 | 9999 |",)
        )
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        await _prime_origin(sessions, session, binding, expected)
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=persist,
            restart_restore_timeout=0.02,
        )
        with pytest.raises(RestartVerificationError, match="unexpected"):
            await engine.async_verify_after_restart(
                "aabbccddeeff", session, binding, substitutions=substitutions(0)
            )
        assert saved == []

    asyncio.run(run())


def test_real_log_fallback_retains_late_fragment_through_bounded_window() -> None:
    async def run() -> None:
        expected = {"meter_main1": ((7305, 1), (7305, 2), (7305, 3))}
        session = DelayedFragmentRestartSession(
            _restore_log("meter_main1", expected["meter_main1"]),
            "[I] [CALIBRATION][meter_main2] | A | 9999 | 9999 |",
        )
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        await _prime_origin(sessions, session, binding, expected)
        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=_ignore_verified,
            restart_restore_timeout=0.02,
        )
        try:
            with pytest.raises(RestartVerificationError, match="unexpected"):
                await engine.async_verify_after_restart(
                    "aabbccddeeff", session, binding, substitutions=substitutions(0)
                )
        finally:
            if session.emitter is not None:
                await session.emitter

    asyncio.run(run())


def test_restart_disconnect_during_restore_window_never_persists_stale_binding() -> (
    None
):
    async def run() -> None:
        expected = {"meter_main1": ((7305, 1), (7305, 2), (7305, 3))}
        session = DelayedDisconnectRestartSession(
            _restore_log("meter_main1", expected["meter_main1"])
        )
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        await _prime_origin(sessions, session, binding, expected)
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=persist,
            restart_restore_timeout=0.02,
        )
        try:
            with pytest.raises(RestartVerificationError, match="disconnect"):
                await engine.async_verify_after_restart(
                    "aabbccddeeff", session, binding, substitutions=substitutions(0)
                )
        finally:
            if session.stop_task is not None:
                await session.stop_task
        assert saved == []
        pending = sessions.pending_calibration("aabbccddeeff")
        assert pending is not None
        assert pending.claimed_revision is None

    asyncio.run(run())


def test_restart_persistence_is_linearized_before_concurrent_disconnect() -> None:
    async def run() -> None:
        expected = {"meter_main1": ((7305, 1), (7305, 2), (7305, 3))}
        session = PersistenceDisconnectRestartSession(
            {"meter_main1": _restore("meter_main1", expected["meter_main1"])}
        )
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        await _prime_origin(sessions, session, binding, expected)
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            session.request_stop()
            await asyncio.sleep(0)
            saved.append(record)

        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=persist,
            restart_restore_timeout=0.01,
        )
        result = await engine.async_verify_after_restart(
            "aabbccddeeff", session, binding, substitutions=substitutions(0)
        )
        assert session.connected
        assert result.binding.connection_generation == 2
        assert saved == [result.record]
        assert session.stop_task is not None
        await session.stop_task
        assert not session.connected

    asyncio.run(run())


async def _ignore_verified(record: VerifiedCalibrationRecord) -> None:
    del record


def test_successful_task17_gain_updates_server_owned_pending_table() -> None:
    async def run() -> None:
        sessions = SessionManager()
        snapshot = _snapshot()

        async def authoritative_snapshot(
            mac: str, target_topology: object
        ) -> ESPHomeConfigSnapshot:
            del target_topology
            assert mac == "aabbccddeeff"
            return snapshot

        evidence = gain_evidence(
            "meter_main1",
            reference_currents=(10.0, 0.0, 0.0),
            current_changes=(True, False, False),
        )
        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            calibration_snapshot_reader=authoritative_snapshot,
        )
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


def test_task17_requires_authoritative_reader_before_any_mutation() -> None:
    async def run() -> None:
        markers: list[object] = []

        async def persist_marker(mac: str, marker: object) -> None:
            del mac
            markers.append(marker)

        evidence = gain_evidence(
            "meter_main1",
            reference_currents=(10.0, 0.0, 0.0),
            current_changes=(True, False, False),
        )
        session = FakeCalibrationSession(evidence)
        engine = CalibrationEngine(SessionManager(), persist_marker)
        with pytest.raises(ValueError, match="authoritative.*reader.*required"):
            await engine.async_calibrate_current(
                "aabbccddeeff", session, native_meter(), 1, 10.0, 1.0, 1.0
            )
        assert markers == []
        assert session.events == []

    asyncio.run(run())


@pytest.mark.parametrize(
    ("configuration", "invalid_hash", "match"),
    (
        ("forged.yaml", True, "hash"),
        ("forged\n.yaml", False, "filename"),
        ("../../victim.yaml", False, "filename"),
        ("folder/meter.yaml", False, "filename"),
        (r"C:\meter.yaml", False, "filename"),
        ("/meter.yaml", False, "filename"),
        ("meter.yml", False, "filename"),
        ("METER.yaml", False, "filename"),
        ("meter.yaml@main", False, "filename"),
        ("meter\x00.yaml", False, "filename"),
    ),
)
def test_task17_rejects_forged_origin_before_any_calibration_mutation(
    configuration: str, invalid_hash: bool, match: str
) -> None:
    async def run() -> None:
        sessions = SessionManager()
        source = _snapshot()
        forged = ESPHomeConfigSnapshot(
            configuration,
            source.content,
            "a" * 64 if invalid_hash else source.sha256,
        )

        async def authoritative_snapshot(
            mac: str, target_topology: object
        ) -> ESPHomeConfigSnapshot:
            del mac, target_topology
            return forged

        evidence = gain_evidence(
            "meter_main1",
            reference_currents=(10.0, 0.0, 0.0),
            current_changes=(True, False, False),
        )
        session = FakeCalibrationSession(evidence)
        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            calibration_snapshot_reader=authoritative_snapshot,
        )
        with pytest.raises(ValueError, match=f"authoritative.*{match}"):
            await engine.async_calibrate_current(
                "aabbccddeeff", session, native_meter(), 1, 10.0, 1.0, 1.0
            )
        assert session.events == []
        assert sessions.pending_calibration("aabbccddeeff") is None

    asyncio.run(run())


def _snapshot(content: str | None = None) -> ESPHomeConfigSnapshot:
    content = content or (
        "esphome:\n"
        "  project:\n"
        "    name: circuitsetup.6c-energy-meter\n"
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
        self.claimed: dict[str, str] = {}

    async def async_get_verified_calibration(
        self, mac: str
    ) -> VerifiedCalibrationRecord | None:
        return self.records.get(mac)

    async def async_claim_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        record = self.records.get(mac)
        if (
            record is None
            or record.verification_id != verification_id
            or verification_id in self.claimed
        ):
            return False
        self.claimed[verification_id] = transaction_id
        return True

    async def async_revalidate_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        record = self.records.get(mac)
        return (
            record is not None
            and record.verification_id == verification_id
            and self.claimed.get(verification_id) == transaction_id
        )

    async def async_release_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        record = self.records.get(mac)
        if (
            record is None
            or record.verification_id != verification_id
            or self.claimed.get(verification_id) != transaction_id
        ):
            return False
        self.claimed.pop(verification_id)
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
        assert persistence.claimed == {}

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


def test_confirm_refuses_preview_superseded_by_new_verified_record() -> None:
    async def run() -> None:
        source = _snapshot()
        old = _record(source, ((7301, 1),) * 3, verification_id="1" * 32)
        persistence = CalibrationPersistence((old,))
        builder = Builder(remote_content=source.content)
        sessions = SessionManager()
        manager = ConfigTransactionManager(
            builder,
            Verifier(RuntimeError()),
            persistence,
            sessions,
        )
        preview = await manager.async_preview_calibrated_gains(
            old.mac, topology(0), old.verification_id
        )
        assert preview.state is ConfigTransactionState.PREVIEWED

        newer = _record(source, ((7999, 9),) * 3, verification_id="2" * 32)
        persistence.records[old.mac] = newer
        with pytest.raises(ConfigMutationError, match="superseded"):
            await manager.async_confirm_write(preview.transaction_id, "admin-user")

        assert "write" not in builder.calls
        assert "7301" not in builder.remote_content
        assert not sessions.is_config_locked(old.mac)
        assert not sessions.is_calibration_locked(old.mac)

    asyncio.run(run())


def test_cancelled_preview_releases_durable_exact_reservation_for_retry() -> None:
    async def run() -> None:
        source = _snapshot()
        record = _record(source, ((7301, 1),) * 3)

        class BlockingClaimPersistence(CalibrationPersistence):
            def __init__(self) -> None:
                super().__init__((record,))
                self.started = asyncio.Event()
                self.finish = asyncio.Event()

            async def async_claim_verified_calibration(
                self, mac: str, verification_id: str, transaction_id: str
            ) -> bool:
                claimed = await super().async_claim_verified_calibration(
                    mac, verification_id, transaction_id
                )
                self.started.set()
                await self.finish.wait()
                return claimed

        persistence = BlockingClaimPersistence()
        manager = ConfigTransactionManager(
            Builder(remote_content=source.content),
            Verifier(RuntimeError()),
            persistence,
            SessionManager(),
        )
        preview = asyncio.create_task(
            manager.async_preview_calibrated_gains(
                record.mac, topology(0), record.verification_id
            )
        )
        await persistence.started.wait()
        preview.cancel()
        persistence.finish.set()
        with pytest.raises(asyncio.CancelledError):
            await preview
        assert persistence.claimed == {}
        assert manager.sessions._config_transactions == {}

        retry = await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )
        assert retry.state is ConfigTransactionState.PREVIEWED

    asyncio.run(run())


def test_unload_releases_unwritten_exact_reservation_before_scrubbing() -> None:
    async def run() -> None:
        source = _snapshot()
        record = _record(source, ((7301, 1),) * 3)
        persistence = CalibrationPersistence((record,))
        sessions = SessionManager()
        manager = ConfigTransactionManager(
            Builder(remote_content=source.content),
            Verifier(RuntimeError()),
            persistence,
            sessions,
        )
        await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )
        assert persistence.claimed

        await sessions.async_unload()

        assert persistence.claimed == {}
        assert sessions._config_transactions == {}

    asyncio.run(run())


def test_cancelled_source_revalidation_releases_config_ownership() -> None:
    async def run() -> None:
        source = _snapshot()
        record = _record(source, ((7301, 1),) * 3)

        class BlockingPersistence(CalibrationPersistence):
            def __init__(self) -> None:
                super().__init__((record,))
                self.started = asyncio.Event()

            async def async_revalidate_verified_calibration(
                self, mac: str, verification_id: str, transaction_id: str
            ) -> bool:
                del mac, verification_id, transaction_id
                self.started.set()
                await asyncio.Event().wait()
                return False

        persistence = BlockingPersistence()
        builder = Builder(remote_content=source.content)
        sessions = SessionManager()
        manager = ConfigTransactionManager(
            builder, Verifier(RuntimeError()), persistence, sessions
        )
        preview = await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )
        confirmation = asyncio.create_task(
            manager.async_confirm_write(preview.transaction_id, "admin-user")
        )
        await persistence.started.wait()
        confirmation.cancel()
        with pytest.raises(asyncio.CancelledError):
            await confirmation
        assert "write" not in builder.calls
        assert persistence.claimed == {}
        assert not sessions.is_config_locked(record.mac)
        assert not sessions.is_calibration_locked(record.mac)
        retry = await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )
        assert retry.state is ConfigTransactionState.PREVIEWED

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
            "source_handoff_transaction_id": None,
        }
        assert "content" not in repr(saved)
        assert await store.async_get_verified_calibration(record.mac) == record
        assert await store.async_claim_verified_calibration(
            record.mac, record.verification_id, "3" * 32
        )
        assert await store.async_revalidate_verified_calibration(
            record.mac, record.verification_id, "3" * 32
        )
        assert not await store.async_release_verified_calibration(
            record.mac, record.verification_id, "4" * 32
        )
        assert await store.async_release_verified_calibration(
            record.mac, record.verification_id, "3" * 32
        )
        assert not await store.async_revalidate_verified_calibration(
            record.mac, record.verification_id, "3" * 32
        )
        assert await store.async_claim_verified_calibration(
            record.mac, record.verification_id, "4" * 32
        )
        assert not await store.async_claim_verified_calibration(
            record.mac, record.verification_id, "5" * 32
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
