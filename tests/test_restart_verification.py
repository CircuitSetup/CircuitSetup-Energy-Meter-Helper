"""Restart persistence verification and reviewed calibrated-source handoff."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import replace
from hashlib import sha256
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    CalibrationEngine as ProductionCalibrationEngine,
)
from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    CalibrationState,
    RestartDisconnectTimeoutError,
    RestartVerificationError,
)
from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
    ConfigMutationError,
    CTChangeRequest,
    _review_diff,
    build_calibrated_gain_mutation,
)
from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionManager,
    ConfigTransactionState,
    ReconnectEvidence,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ConfigChangedError,
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.entity_binding import bind_meter
from custom_components.circuitsetup_energy_meter_helper.entity_catalog import (
    EntityCatalog,
)
from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    RestoreEvidence,
)
from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
    expected_meter_entity_evidence,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    MeterConfigurationRequest,
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
    VerifiedOffsetGroup,
    VerifiedPowerOffsetGroup,
)
from custom_components.circuitsetup_energy_meter_helper.topology import (
    voltage_reference_fingerprint_for_meter,
    voltage_reference_topology_from_config,
    voltage_reference_topology_from_configuration,
)
from tests.test_calibration_engine_current import native_meter
from tests.test_calibration_engine_voltage import (
    FakeCalibrationSession,
    gain_evidence,
    sample_window,
)
from tests.test_config_transaction import Builder, Job, Persistence, Verifier
from tests.test_entity_binding import (
    ButtonInfo,
    substitutions,
    synthetic_entities,
    topology,
)
from tests.test_store import _configuration as stored_configuration

GainTable = tuple[tuple[int, int], tuple[int, int], tuple[int, int]]


class CalibrationEngine(ProductionCalibrationEngine):
    """Supply the exact snapshot used by the test's server-owned origin."""

    def __init__(self, sessions: SessionManager, persist: Any, **kwargs: Any) -> None:
        snapshot = getattr(sessions, "_test_calibration_snapshot", None)
        if snapshot is not None and "calibration_snapshot_reader" not in kwargs:

            async def read_snapshot(mac: str, target_topology: object) -> object:
                del mac, target_topology
                return snapshot

            kwargs["calibration_snapshot_reader"] = read_snapshot
        super().__init__(sessions, persist, **kwargs)


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
    offsets: dict[str, GainTable] | None = None,
    power_offsets: dict[str, GainTable] | None = None,
    snapshot: ESPHomeConfigSnapshot | None = None,
) -> ESPHomeConfigSnapshot:
    if snapshot is None:
        content = f"esphome:\n  project:\n    name: {binding.topology.project_name}\n"
        snapshot = ESPHomeConfigSnapshot(
            "meter.yaml", content, sha256(content.encode()).hexdigest()
        )
    sessions._test_calibration_snapshot = snapshot
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
        for stage, tables in ((1, offsets or {}), (2, power_offsets or {})):
            for instance_id, table in tables.items():
                pending = sessions.record_offset_calibration_group(
                    lease,
                    pending.operation_id,
                    pending.revision,
                    session,
                    binding,
                    instance_id,
                    stage,
                    table,
                )
    finally:
        lease.release()
    return snapshot


def _category_restore(
    instance_id: str,
    *,
    gains: GainTable | None = None,
    offsets: GainTable | None = None,
    power_offsets: GainTable | None = None,
) -> RestoreEvidence:
    return RestoreEvidence(
        2,
        instance_id,
        gains,
        "flash",
        gains is not None,
        "positive_loaded_line" if gains is not None else "offset_tables",
        False,
        (f"[CALIBRATION][{instance_id}] verified",),
        offsets,
        power_offsets,
        offsets is not None,
        power_offsets is not None,
    )


def test_offset_only_restart_verifies_selected_board_once() -> None:
    async def run() -> None:
        offsets = {
            "addon1_1": ((-12, 31), (-13, 32), (-14, 33)),
            "addon1_2": ((-21, 41), (-22, 42), (-23, 43)),
        }
        session = RestartSession(
            {
                instance_id: _category_restore(instance_id, offsets=table)
                for instance_id, table in offsets.items()
            },
            addons=1,
        )
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(1), substitutions(1)
        )
        sessions = SessionManager()
        await _prime_origin(sessions, session, binding, {}, offsets=offsets)
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        result = await CalibrationEngine(
            sessions, _ignore_marker, persist_verified=persist
        ).async_verify_after_restart(
            "aabbccddeeff", session, binding, substitutions=substitutions(1)
        )

        assert [event[0] for event in session.events].count("restart") == 1
        restore_request = session.events[-1][1]
        assert restore_request["expected_categories"] == {
            instance_id: {"offset"} for instance_id in offsets
        }
        assert restore_request["operation_sequence"] > 0
        assert result.record.groups == ()
        assert {
            group.instance_id: group.phase_offsets
            for group in result.record.offset_groups
        } == offsets
        assert saved == [result.record]

    asyncio.run(run())


def test_mixed_restart_requires_each_exact_requested_category() -> None:
    async def run() -> None:
        gains = {"meter_main1": ((7301, 28001), (7301, 28002), (7301, 28003))}
        offsets = {"meter_main1": ((-12, 31), (-13, 32), (-14, 33))}
        power_offsets = {"addon1_2": ((101, -201), (102, -202), (103, -203))}
        session = RestartSession(
            {
                "meter_main1": _category_restore(
                    "meter_main1",
                    gains=gains["meter_main1"],
                    offsets=offsets["meter_main1"],
                ),
                "addon1_2": _category_restore(
                    "addon1_2", power_offsets=power_offsets["addon1_2"]
                ),
            }
        )
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(1), substitutions(1)
        )
        sessions = SessionManager()
        await _prime_origin(
            sessions,
            session,
            binding,
            gains,
            offsets=offsets,
            power_offsets=power_offsets,
        )

        result = await CalibrationEngine(
            sessions, _ignore_marker, persist_verified=_ignore_verified
        ).async_verify_after_restart(
            "aabbccddeeff", session, binding, substitutions=substitutions(1)
        )

        assert session.events[-1][1]["expected_categories"] == {
            "meter_main1": {"gain", "offset"},
            "addon1_2": {"power_offset"},
        }
        assert result.record.groups[0].phase_gains == gains["meter_main1"]
        assert result.record.offset_groups[0].phase_offsets == offsets["meter_main1"]
        assert (
            result.record.power_offset_groups[0].phase_power_offsets
            == power_offsets["addon1_2"]
        )
        assert not result.record.source_handoff_available
        assert result.record.source_authority is CalibrationSourceAuthority.SAVED_FLASH

    asyncio.run(run())


@pytest.mark.parametrize(
    ("evidence", "match"),
    (
        ({}, "missing"),
        (
            {
                "meter_main1": _category_restore(
                    "meter_main1", offsets=((-12, 31), (-13, 32), (-14, 34))
                )
            },
            "exact",
        ),
        (
            {
                "meter_main1": _category_restore(
                    "meter_main1",
                    offsets=((-12, 31), (-13, 32), (-14, 33)),
                    power_offsets=((1, 2), (3, 4), (5, 6)),
                )
            },
            "unexpected",
        ),
        ({"meter_main1": _category_restore("meter_main1")}, "verified"),
    ),
)
def test_offset_restart_rejects_missing_mismatch_extra_or_fallback(
    evidence: dict[str, RestoreEvidence], match: str
) -> None:
    async def run() -> None:
        offsets = {"meter_main1": ((-12, 31), (-13, 32), (-14, 33))}
        session = RestartSession(evidence, addons=0)
        binding = bind_meter(
            EntityCatalog(session.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        await _prime_origin(sessions, session, binding, {}, offsets=offsets)
        saved: list[VerifiedCalibrationRecord] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        with pytest.raises(RestartVerificationError, match=match):
            await CalibrationEngine(
                sessions, _ignore_marker, persist_verified=persist
            ).async_verify_after_restart(
                "aabbccddeeff", session, binding, substitutions=substitutions(0)
            )
        assert saved == []

    asyncio.run(run())


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
        markers: list[object] = []

        async def persist(record: VerifiedCalibrationRecord) -> None:
            saved.append(record)

        async def persist_marker(mac: str, marker: object) -> None:
            assert mac == "aabbccddeeff"
            markers.append(marker)

        sessions = SessionManager()
        snapshot = await _prime_origin(sessions, session, original, expected)
        assert sessions.pending_calibration("AA:BB:CC:DD:EE:FF") is not None
        engine = CalibrationEngine(
            sessions,
            persist_marker,
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
        assert markers == []
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


def test_atomic_final_save_failure_preserves_origin_for_retry() -> (
    None
):
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
        attempted: list[VerifiedCalibrationRecord] = []

        async def unexpected_marker_clear(mac: str, marker: object) -> None:
            del mac, marker
            raise AssertionError("final persistence must not clear separately")

        async def persist(record: VerifiedCalibrationRecord) -> None:
            attempted.append(record)
            raise OSError("final store unavailable")

        engine = CalibrationEngine(
            sessions, unexpected_marker_clear, persist_verified=persist
        )
        with pytest.raises(OSError, match="final store unavailable"):
            await engine.async_verify_after_restart(
                "aabbccddeeff", session, binding, substitutions=substitutions(0)
            )

        pending = sessions.pending_calibration("aabbccddeeff")
        assert len(attempted) == 1
        assert pending is not None
        assert pending.claimed_revision is None
        assert [event[0] for event in session.events].count("restart") == 1

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
            restart_restore_timeout=0.05,
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
        snapshot = ESPHomeConfigSnapshot(
            "meter.yaml",
            "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter\n",
            sha256(
                b"esphome:\n  project:\n    name: circuitsetup.6c-energy-meter\n"
            ).hexdigest(),
        )

        async def authoritative_snapshot(
            mac: str, target_topology: object
        ) -> ESPHomeConfigSnapshot:
            del mac, target_topology
            return snapshot

        engine = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=_ignore_verified,
            calibration_snapshot_reader=authoritative_snapshot,
        )
        with pytest.raises(RestartVerificationError, match="origin"):
            await engine.async_verify_after_restart(
                "aabbccddeeff", session, binding, substitutions=substitutions(0)
            )
        assert session.events == []

        await _prime_origin(sessions, session, binding, all_expected, snapshot=snapshot)
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
            measured_currents=(10.0 * 27518 / 28000, 10.0, 10.0),
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
            FakeCalibrationSession(evidence, after=sample_window(10.0, 10.0, 10.0)),
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


def test_runtime_only_calibration_records_native_origin_without_yaml() -> None:
    async def run() -> None:
        markers: list[object] = []

        async def persist_marker(mac: str, marker: object) -> None:
            del mac
            markers.append(marker)

        evidence = gain_evidence(
            "meter_main1",
            measured_currents=(10.0 * 27518 / 28000, 10.0, 10.0),
            reference_currents=(10.0, 0.0, 0.0),
            current_changes=(True, False, False),
        )
        session = FakeCalibrationSession(
            evidence, after=sample_window(10.0, 10.0, 10.0)
        )
        sessions = SessionManager()
        engine = CalibrationEngine(sessions, persist_marker)

        result = await engine.async_calibrate_current(
            "aabbccddeeff", session, native_meter(), 1, 10.0, 1.0, 1.0
        )

        pending = sessions.pending_calibration("aabbccddeeff")
        assert result.state is CalibrationState.APPLIED_PENDING_RESTART_VERIFICATION
        assert pending is not None
        assert pending.config_filename is None
        assert pending.config_sha256 is None
        assert markers

    asyncio.run(run())


def test_runtime_only_verified_record_disables_configuration_handoff() -> None:
    record = VerifiedCalibrationRecord(
        mac="aabbccddeeff",
        config_filename=None,
        config_sha256=None,
        topology_addon_count=0,
        topology_project_name="circuitsetup.6c-energy-meter",
        topology_connection_type="wifi",
        topology_voltage_layout="standard",
        connection_generation=2,
        groups=(VerifiedGainGroup("meter_main1", ((7305, 27518),) * 3),),
        verification_id="a" * 32,
        source_handoff_available=False,
    )

    assert record.config_filename is None
    assert record.config_sha256 is None
    assert not record.source_handoff_available


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


def test_verified_offsets_render_one_exact_extend_block_with_redacted_values() -> None:
    snapshot = _snapshot()
    record = replace(
        _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003))),
        offset_groups=(
            VerifiedOffsetGroup(
                "meter_main1", ((-32768, 0), (-13, 32), (14, 32767))
            ),
        ),
        power_offset_groups=(
            VerifiedPowerOffsetGroup(
                "meter_main1", ((-101, 201), (-102, 202), (103, -203))
            ),
        ),
    )

    plan = build_calibrated_gain_mutation(snapshot, topology(0), record)

    assert "# CircuitSetup Energy Meter Helper: calibrated offsets v1" in plan.proposed_content
    assert "  - id: !extend meter_main1\n" in plan.proposed_content
    assert "      offset_voltage: -32768\n      offset_current: 0\n" in plan.proposed_content
    assert "      offset_active_power: -101\n      offset_reactive_power: 201\n" in plan.proposed_content
    assert "offset_voltage: -32768" in plan.redacted_diff
    assert "logger:" not in plan.redacted_diff


def test_offset_rendering_keeps_unselected_stages_and_is_idempotent() -> None:
    block = (
        "# CircuitSetup Energy Meter Helper: calibrated offsets v1\n"
        "  - id: !extend meter_main1\n"
        "    phase_a:\n"
        "      offset_voltage: -1\n"
        "      offset_current: 2\n"
        "      offset_active_power: -101\n"
        "      offset_reactive_power: 201\n"
        "    phase_b:\n"
        "      offset_voltage: -3\n"
        "      offset_current: 4\n"
        "      offset_active_power: -102\n"
        "      offset_reactive_power: 202\n"
        "    phase_c:\n"
        "      offset_voltage: -5\n"
        "      offset_current: 6\n"
        "      offset_active_power: -103\n"
        "      offset_reactive_power: 203\n"
        "  - id: !extend meter_main2\n"
        "    phase_a:\n"
        "      offset_voltage: 7\n"
        "      offset_current: 8\n"
        "    phase_b:\n"
        "      offset_voltage: 9\n"
        "      offset_current: 10\n"
        "    phase_c:\n"
        "      offset_voltage: 11\n"
        "      offset_current: 12\n"
        "# End CircuitSetup Energy Meter Helper: calibrated offsets v1\n"
    )
    snapshot = _snapshot(_snapshot().content + "sensor:\n" + block)
    record = replace(
        _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003))),
        offset_groups=(
            VerifiedOffsetGroup("meter_main1", ((-12, 31), (-13, 32), (-14, 33))),
        ),
    )

    plan = build_calibrated_gain_mutation(snapshot, topology(0), record)

    assert "offset_voltage: -12" in plan.proposed_content
    assert "offset_active_power: -101" in plan.proposed_content
    assert "  - id: !extend meter_main2\n" in plan.proposed_content
    repeated = ESPHomeConfigSnapshot(
        snapshot.configuration,
        plan.proposed_content,
        sha256(plan.proposed_content.encode()).hexdigest(),
    )
    assert build_calibrated_gain_mutation(
        repeated, topology(0), replace(record, config_sha256=repeated.sha256)
    ).proposed_content == plan.proposed_content


def test_offset_rendering_resolves_addon_ids_and_preserves_crlf() -> None:
    source = _snapshot().content.replace("\n", "\r\n")
    snapshot = ESPHomeConfigSnapshot(
        "meter.yaml", source, sha256(source.encode()).hexdigest()
    )
    target = topology(1)
    record = replace(
        _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003))),
        topology_addon_count=1,
        topology_project_name=target.project_name,
        topology_connection_type=target.connection_type,
        topology_voltage_layout=target.voltage_layout,
        topology_voltage_fingerprint=voltage_reference_fingerprint_for_meter(target),
        power_offset_groups=(
            VerifiedPowerOffsetGroup(
                "addon1_2", ((-101, 201), (-102, 202), (-103, 203))
            ),
        ),
    )

    plan = build_calibrated_gain_mutation(snapshot, target, record)

    assert "  - id: !extend addon1_2\r\n" in plan.proposed_content
    assert "      offset_active_power: -101\r\n" in plan.proposed_content
    assert "\n" not in plan.proposed_content.replace("\r\n", "")


@pytest.mark.parametrize(
    "body",
    (
        (
            "    phase_a:\n      offset_voltage: 1\n      offset_current: 2\n"
            "    phase_b:\n      offset_voltage: 1\n      offset_current: 2\n"
            "    phase_c:\n      offset_voltage: 1\n      offset_current: 2\n"
            "    phase_c:\n      offset_voltage: 1\n      offset_current: 2\n"
        ),
        (
            "    phase_a:\n      offset_voltage: 32768\n      offset_current: 2\n"
            "    phase_b:\n      offset_voltage: 1\n      offset_current: 2\n"
            "    phase_c:\n      offset_voltage: 1\n      offset_current: 2\n"
        ),
    ),
)
def test_offset_rendering_rejects_malformed_owned_blocks(body: str) -> None:
    block = (
        "# CircuitSetup Energy Meter Helper: calibrated offsets v1\n"
        "  - id: !extend meter_main1\n"
        + body
        + "# End CircuitSetup Energy Meter Helper: calibrated offsets v1\n"
    )
    snapshot = _snapshot(_snapshot().content + "sensor:\n" + block)
    record = replace(
        _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003))),
        offset_groups=(
            VerifiedOffsetGroup("meter_main1", ((-12, 31), (-13, 32), (-14, 33))),
        ),
    )

    with pytest.raises(ConfigMutationError, match="managed offsets"):
        build_calibrated_gain_mutation(snapshot, topology(0), record)


def test_offset_rendering_rejects_source_owned_target_override() -> None:
    source = _snapshot().content + (
        "sensor:\n"
        "  - {id: !extend meter_main1, phase_a: {offset_voltage: -1, offset_current: 2}}\n"
    )
    snapshot = _snapshot(source)
    record = replace(
        _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003))),
        offset_groups=(
            VerifiedOffsetGroup("meter_main1", ((-12, 31), (-13, 32), (-14, 33))),
        ),
    )

    with pytest.raises(ConfigMutationError, match="existing offset overrides"):
        build_calibrated_gain_mutation(snapshot, topology(0), record)


def test_offset_rendering_preserves_unrelated_source_offset_overrides() -> None:
    source = _snapshot().content + (
        "sensor:\n"
        "  - id: !extend unrelated_meter # unrelated source override\n"
        "    phase_a:\n"
        "      offset_voltage: -1\n"
        "      offset_current: 2\n"
    )
    snapshot = _snapshot(source)
    record = replace(
        _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003))),
        offset_groups=(
            VerifiedOffsetGroup("meter_main1", ((-12, 31), (-13, 32), (-14, 33))),
        ),
    )

    plan = build_calibrated_gain_mutation(snapshot, topology(0), record)

    assert "id: !extend unrelated_meter # unrelated source override" in plan.proposed_content
    assert "offset_voltage: -12" in plan.proposed_content


def test_offset_rendering_preserves_unrelated_source_flow_offset_overrides() -> None:
    source = _snapshot().content + (
        "unrelated_overrides:\n"
        "  - {id: !extend unrelated_meter, phase_a: {offset_voltage: -1, offset_current: 2}}\n"
        "sensor:\n"
    )
    snapshot = _snapshot(source)
    record = replace(
        _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003))),
        offset_groups=(
            VerifiedOffsetGroup("meter_main1", ((-12, 31), (-13, 32), (-14, 33))),
        ),
    )

    plan = build_calibrated_gain_mutation(snapshot, topology(0), record)

    assert "id: !extend unrelated_meter" in plan.proposed_content
    assert "offset_voltage: -12" in plan.proposed_content


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


def test_calibrated_gain_handoff_uses_verified_helper_voltage_fingerprint() -> None:
    content = _snapshot().content.replace(
        "name: circuitsetup.6c-energy-meter\n",
        "name: circuitsetup.6c-energy-meter-2-voltages\n",
    ).replace(
        "logger:\n",
        "# CircuitSetup Energy Meter Helper: voltage references v1\n"
        "voltage_references:\n"
        "  main: 120\n"
        "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
        "logger:\n",
    )
    snapshot = _snapshot(content)
    target = replace(
        topology(0),
        voltage_layout="two_voltages",
        project_name="circuitsetup.6c-energy-meter-2-voltages",
    )
    trusted = replace(stored_configuration(), config_sha256=snapshot.sha256)
    helper_fingerprint = voltage_reference_topology_from_config(
        ESPHomeConfigDocument.parse(content),
        target,
        trusted_fingerprint=voltage_reference_topology_from_configuration(
            target, trusted
        ).fingerprint,
    ).fingerprint
    record = replace(
        _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003))),
        topology_voltage_layout="two_voltages",
        topology_project_name=target.project_name,
        topology_voltage_fingerprint=helper_fingerprint,
    )

    build_calibrated_gain_mutation(
        snapshot,
        target,
        record,
        trusted_voltage_fingerprint=helper_fingerprint,
    )
    with pytest.raises(ConfigMutationError, match="topology"):
        build_calibrated_gain_mutation(snapshot, target, record)
    build_calibrated_gain_mutation(
        snapshot,
        target,
        replace(
            record,
            topology_voltage_fingerprint=voltage_reference_fingerprint_for_meter(
                target
            ),
        ),
    )


def test_final_gain_mutation_keeps_selected_board_packages_in_same_review() -> None:
    """A calibrated handoff must not drop package choices made during setup."""
    content = _snapshot().content + """packages:
  circuitsetup_meter:
    files:
      #- Software/ESPHome/power_quality/6chan_main_power_quality.yaml
      - Software/ESPHome/status_fields/6chan_main_status.yaml
"""
    snapshot = _snapshot(content)
    record = _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003)))

    plan = build_calibrated_gain_mutation(
        snapshot,
        topology(0),
        record,
        package_options={
            "power_quality": (True,),
            "status_fields": (False,),
        },
    )

    assert "      - Software/ESPHome/power_quality/6chan_main_power_quality.yaml" in plan.proposed_content
    assert "      #- Software/ESPHome/status_fields/6chan_main_status.yaml" in plan.proposed_content


@pytest.mark.parametrize("multiplier", (1, 2))
def test_final_gain_mutation_preserves_unused_managed_phase_state(
    multiplier: int,
) -> None:
    """A gain write cannot reinterpret or discard an unrelated unused phase."""
    scaling = (
        """      current:
        filters:
          - multiply: 2
      power:
        filters:
          - multiply: 2
"""
        if multiplier == 2
        else ""
    )
    managed = (
        "# CircuitSetup Energy Meter Helper: phase overrides v1\n"
        "  - id: !extend meter_main1\n"
        "    phase_b: # CT2\n"
        + scaling
        + """      reactive_power: !remove
      apparent_power: !remove
      harmonic_power: !remove
      peak_current: !remove
      power_factor: !remove
      phase_angle: !remove
# End CircuitSetup Energy Meter Helper: phase overrides v1
"""
    )
    content = _snapshot().content.replace(
        "logger:\n",
        """packages:
  meter:
    files:
      - Software/ESPHome/power_quality/6chan_main_power_quality.yaml
sensor:
"""
        + managed
        + "logger:\n",
    )
    snapshot = _snapshot(content)
    record = _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003)))

    plan = build_calibrated_gain_mutation(snapshot, topology(0), record)

    assert managed in plan.proposed_content


def test_final_gain_preview_combines_ct_edits_without_overwriting_calibrated_current() -> None:
    content = _snapshot().content.replace(
        "substitutions:\n",
        "substitutions:\n  ct1_name: 'CT 1'\n  ct2_name: 'CT 2'\n",
    )
    snapshot = _snapshot(content)
    record = _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003)))
    plan = build_calibrated_gain_mutation(
        snapshot,
        topology(0),
        record,
        (
            CTChangeRequest(1, "Mains", "sct_013_030_30a_1v", 2),
            CTChangeRequest(2, "Solar", "sct_013_030_30a_1v", 2),
        ),
        frozenset({1}),
    )

    assert "ct1_name: 'Mains'" in plan.proposed_content
    assert "ct2_name: 'Solar'" in plan.proposed_content
    assert "current_cal_ct1: '28001'" in plan.proposed_content
    assert "current_cal_ct2: '4325'" in plan.proposed_content


def test_divergent_voltage_gains_render_exact_extend_block() -> None:
    snapshot = _snapshot()
    record = _record(snapshot, ((7301, 28001), (7302, 28002), (7303, 28003)))
    plan = build_calibrated_gain_mutation(snapshot, topology(0), record)
    assert "calibrated voltage gains v1" in plan.proposed_content
    assert "gain_voltage: 7301" in plan.proposed_content
    assert "gain_voltage: 7302" in plan.proposed_content
    assert "gain_voltage: 7303" in plan.proposed_content
    assert "voltage_cal1: '7301'" not in plan.proposed_content


def test_partial_voltage_gain_handoff_preserves_existing_uncalibrated_overrides() -> None:
    block = (
        "# CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
        "  - id: !extend meter_main1\n"
        "    phase_a:\n"
        "      gain_voltage: 7301\n"
        "    phase_b:\n"
        "      gain_voltage: 7302\n"
        "    phase_c:\n"
        "      gain_voltage: 7303\n"
        "  - id: !extend meter_main2\n"
        "    phase_a:\n"
        "      gain_voltage: 7401\n"
        "    phase_b:\n"
        "      gain_voltage: 7402\n"
        "    phase_c:\n"
        "      gain_voltage: 7403\n"
        "# End CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
    )
    snapshot = _snapshot(_snapshot().content + "sensor:\n" + block)
    record = _record(snapshot, ((7501, 28001), (7502, 28002), (7503, 28003)))

    plan = build_calibrated_gain_mutation(snapshot, topology(0), record)

    merged = block.replace("7301", "7501").replace("7302", "7502").replace(
        "7303", "7503"
    )
    assert merged in plan.proposed_content
    assert merged.rstrip() in plan.redacted_diff


def test_partial_uniform_voltage_gain_removes_only_its_stale_override() -> None:
    block = (
        "# CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
        "  - id: !extend meter_main1\n"
        "    phase_a:\n"
        "      gain_voltage: 7301\n"
        "    phase_b:\n"
        "      gain_voltage: 7302\n"
        "    phase_c:\n"
        "      gain_voltage: 7303\n"
        "  - id: !extend meter_main2\n"
        "    phase_a:\n"
        "      gain_voltage: 7401\n"
        "    phase_b:\n"
        "      gain_voltage: 7402\n"
        "    phase_c:\n"
        "      gain_voltage: 7403\n"
        "# End CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
    )
    snapshot = _snapshot(_snapshot().content + "sensor:\n" + block)
    record = _record(snapshot, ((7501, 28001),) * 3)

    plan = build_calibrated_gain_mutation(snapshot, topology(0), record)

    assert "!extend meter_main1" not in plan.proposed_content
    assert block[block.index("  - id: !extend meter_main2") :] in plan.proposed_content


def test_mixed_voltage_gain_handoff_replaces_only_divergent_instances() -> None:
    block = (
        "# CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
        "  - id: !extend meter_main1\n"
        "    phase_a:\n"
        "      gain_voltage: 7301\n"
        "    phase_b:\n"
        "      gain_voltage: 7302\n"
        "    phase_c:\n"
        "      gain_voltage: 7303\n"
        "  - id: !extend meter_main2\n"
        "    phase_a:\n"
        "      gain_voltage: 7401\n"
        "    phase_b:\n"
        "      gain_voltage: 7402\n"
        "    phase_c:\n"
        "      gain_voltage: 7403\n"
        "# End CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
    )
    snapshot = _snapshot(_snapshot().content + "sensor:\n" + block)
    record = replace(
        _record(snapshot, ((7501, 28001),) * 3),
        groups=(
            VerifiedGainGroup("meter_main1", ((7501, 28001),) * 3),
            VerifiedGainGroup(
                "meter_main2", ((7601, 28004), (7602, 28005), (7603, 28006))
            ),
        ),
    )

    plan = build_calibrated_gain_mutation(snapshot, topology(0), record)

    assert "!extend meter_main1" not in plan.proposed_content
    assert "!extend meter_main2" in plan.proposed_content
    assert all(f"gain_voltage: {gain}" in plan.proposed_content for gain in (7601, 7602, 7603))


def test_final_uniform_voltage_gain_removal_is_explicit_in_review() -> None:
    block = (
        "# CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
        "  - id: !extend meter_main1\n"
        "    phase_a:\n"
        "      gain_voltage: 7301\n"
        "    phase_b:\n"
        "      gain_voltage: 7302\n"
        "    phase_c:\n"
        "      gain_voltage: 7303\n"
        "# End CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
    )
    snapshot = _snapshot(_snapshot().content + "sensor:\n" + block)
    plan = build_calibrated_gain_mutation(
        snapshot, topology(0), _record(snapshot, ((7501, 28001),) * 3)
    )

    assert "calibrated voltage gains v1" not in plan.proposed_content
    assert any(change.key == "calibrated_voltage_gains" for change in plan.changes)
    assert "calibrated_voltage_gains" in plan.redacted_diff
    assert _review_diff((), block, block) == ""


def test_uniform_gain_handoff_refuses_unwritable_stale_voltage_block() -> None:
    content = _snapshot().content.replace(
        "logger:\n",
        "# CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
        "  - id: !extend meter_main1\n"
        "    phase_a:\n"
        "      gain_voltage: 7301\n"
        "# End CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
        "logger:\n",
    )
    snapshot = _snapshot(content)
    record = _record(snapshot, ((7310, 28001), (7310, 28002), (7310, 28003)))

    with pytest.raises(ConfigMutationError, match="invalid|writable"):
        build_calibrated_gain_mutation(snapshot, topology(0), record)


def test_review_diff_ignores_trailing_unrelated_changes_after_voltage_block() -> None:
    block = (
        "# CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
        "  - id: !extend meter_main1\n"
        "    phase_a:\n"
        "      gain_voltage: 7301\n"
        "# End CircuitSetup Energy Meter Helper: calibrated voltage gains v1\n"
    )

    assert _review_diff((), block + "packages: []\n", block + "packages: [x]\n") == ""


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
    partial_plan = build_calibrated_gain_mutation(snapshot, topology(1), partial)
    assert "- id: !extend meter_main1" in partial_plan.proposed_content
    assert "voltage_cal1: '7305'" in partial_plan.proposed_content

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
    divergent_plan = build_calibrated_gain_mutation(snapshot, topology(1), divergent)
    assert "gain_voltage: 7302" in divergent_plan.proposed_content


class CalibrationPersistence(Persistence):
    def __init__(self, records: tuple[VerifiedCalibrationRecord, ...]) -> None:
        super().__init__()
        self.records = {record.mac: record for record in records}
        self.claimed: dict[str, str] = {}
        self.installed: list[tuple[str, str, str]] = []

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

    async def async_mark_verified_calibration_installed(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        if self.claimed.get(verification_id) != transaction_id:
            return False
        self.installed.append((mac, verification_id, transaction_id))
        return True

    async def async_save_verified_ct_selections_and_mark_verified_calibration_installed(
        self,
        mac: str,
        _expected_source_sha256: str,
        _proposed_sha256: str,
        _record: object,
        _selections: object,
        verification_id: str,
        transaction_id: str,
    ) -> bool:
        return await self.async_mark_verified_calibration_installed(
            mac, verification_id, transaction_id
        )


def test_calibration_preview_handoffs_current_full_metadata_atomically() -> None:
    """A parsed authoritative config carries all CT metadata into one handoff save."""

    class AtomicPersistence(CalibrationPersistence):
        def __init__(self, record: VerifiedCalibrationRecord) -> None:
            super().__init__((record,))
            self.combined: list[tuple[str, object, str, str]] = []

        async def async_save_verified_meter_configuration_and_mark_verified_calibration_installed(
            self,
            mac: str,
            expected_source_sha256: str,
            configuration: object,
            verification_id: str,
            transaction_id: str,
            _record: object,
        ) -> bool:
            if self.claimed.get(verification_id) != transaction_id:
                return False
            self.combined.append((mac, configuration, verification_id, transaction_id))
            return True

        async def async_mark_verified_calibration_installed(
            self, *_args: object
        ) -> bool:
            raise AssertionError("full calibration metadata must be saved atomically")

    async def run() -> None:
        source = _snapshot(
            _snapshot().content.replace(
                "  voltage_cal1: '7305'\n",
                "  friendly_name: Kitchen meter\n"
                "  voltage_cal1: '7305'\n"
                + "".join(f"  ct{i}_name: CT {i}\n" for i in range(1, 7)),
            )
        )
        target = replace(topology(0), voltage_layout="standard")
        record = replace(
            _record(source, ((7301, 28001),) * 3),
            topology_voltage_layout=target.voltage_layout,
            topology_voltage_fingerprint=voltage_reference_fingerprint_for_meter(
                target
            ),
        )
        persistence = AtomicPersistence(record)
        persistence.meter_configuration = replace(
            stored_configuration(), config_sha256=source.sha256
        )
        manager = ConfigTransactionManager(
            Builder(remote_content=source.content),
            Verifier(RuntimeError()),
            persistence,
            SessionManager(),
        )
        preview = await manager.async_preview_calibrated_gains(
            record.mac,
            target,
            record.verification_id,
            (CTChangeRequest(1, "Kitchen", "sct_006_20a_25ma", 1.0),),
        )
        transaction = manager._transaction(preview.transaction_id)
        configuration = transaction.meter_configuration
        assert configuration is not None and len(configuration.ct_selections) == 6
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.default_totals,
                configuration.automatic_totals,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            target,
            document=ESPHomeConfigDocument.parse(transaction.plan.proposed_content),
            native_visibility_resolved=True,  # Current hash-bound resolved helper record.
        )
        manager._verifier = Verifier(
            ReconnectEvidence(
                record.mac,
                target,
                {channel.channel: channel.name for channel in configuration.channels},
                6,
                expected.sensor_entities,
            )
        )

        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")

        assert status.state is ConfigTransactionState.VERIFIED
        assert len(persistence.combined) == 1 and not persistence.installed

    asyncio.run(run())


def _with_offsets(
    record: VerifiedCalibrationRecord,
    *,
    source_handoff_available: bool = True,
    source_handoff_transaction_id: str | None = None,
) -> VerifiedCalibrationRecord:
    return replace(
        record,
        offset_groups=(
            VerifiedOffsetGroup(
                "meter_main1", ((-12, 31), (-13, 32), (-14, 33))
            ),
        ),
        source_handoff_available=source_handoff_available,
        source_handoff_transaction_id=source_handoff_transaction_id,
    )


def test_gain_preview_rejects_verified_offset_calibration() -> None:
    """Dropping offset tables from the YAML preview would lose calibration."""

    async def run() -> None:
        source = _snapshot()
        record = _with_offsets(_record(source, ((7301, 1),) * 3))
        persistence = CalibrationPersistence((record,))
        builder = Builder(remote_content=source.content)
        manager = ConfigTransactionManager(
            builder,
            Verifier(RuntimeError()),
            persistence,
            SessionManager(),
        )

        with pytest.raises(ConfigMutationError, match="offset calibration remains saved in flash"):
            await manager.async_preview_calibrated_gains(
                record.mac, topology(0), record.verification_id
            )

        assert builder.calls == []
        assert persistence.claimed == {}

    asyncio.run(run())


def test_gain_preview_ignores_unverified_helper_marker() -> None:
    async def run() -> None:
        content = _snapshot().content.replace(
            "name: circuitsetup.6c-energy-meter\n",
            "name: circuitsetup.6c-energy-meter-2-voltages\n",
        ).replace(
            "logger:\n",
            "# CircuitSetup Energy Meter Helper: voltage references v1\n"
            "voltage_references:\n"
            "  main: 120\n"
            "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
            "logger:\n",
        )
        source = _snapshot(content)
        target = replace(
            topology(0),
            voltage_layout="two_voltages",
            project_name="circuitsetup.6c-energy-meter-2-voltages",
        )
        record = replace(
            _record(source, ((7301, 1),) * 3),
            topology_voltage_layout="two_voltages",
            topology_project_name=target.project_name,
            topology_voltage_fingerprint=voltage_reference_fingerprint_for_meter(target),
        )
        persistence = CalibrationPersistence((record,))
        manager = ConfigTransactionManager(
            Builder(remote_content=source.content),
            Verifier(RuntimeError()),
            persistence,
            SessionManager(),
        )

        preview = await manager.async_preview_calibrated_gains(
            record.mac, target, record.verification_id
        )
        assert preview.state is ConfigTransactionState.PREVIEWED
        assert persistence.claimed == {record.verification_id: preview.transaction_id}

    asyncio.run(run())


def test_gain_preview_trusts_helper_marker_only_for_matching_stored_hash() -> None:
    async def run() -> None:
        content = _snapshot().content.replace(
            "name: circuitsetup.6c-energy-meter\n",
            "name: circuitsetup.6c-energy-meter-2-voltages\n",
        ).replace(
            "logger:\n",
            "# CircuitSetup Energy Meter Helper: voltage references v1\n"
            "voltage_references:\n"
            "  main: 120\n"
            "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
            "logger:\n",
        )
        source = _snapshot(content)
        target = replace(
            topology(0),
            voltage_layout="two_voltages",
            project_name="circuitsetup.6c-energy-meter-2-voltages",
        )
        trusted = replace(stored_configuration(), config_sha256=source.sha256)
        helper_fingerprint = voltage_reference_topology_from_configuration(
            target, trusted
        ).fingerprint
        record = replace(
            _record(source, ((7301, 1),) * 3),
            topology_voltage_layout="two_voltages",
            topology_project_name=target.project_name,
            topology_voltage_fingerprint=helper_fingerprint,
        )
        persistence = CalibrationPersistence((record,))
        persistence.meter_configuration = trusted
        manager = ConfigTransactionManager(
            Builder(remote_content=source.content),
            Verifier(RuntimeError()),
            persistence,
            SessionManager(),
        )

        preview = await manager.async_preview_calibrated_gains(
            record.mac, target, record.verification_id
        )
        assert preview.state is ConfigTransactionState.PREVIEWED

        stale_persistence = CalibrationPersistence((record,))
        stale_persistence.meter_configuration = replace(
            trusted, config_sha256="0" * 64
        )
        stale_manager = ConfigTransactionManager(
            Builder(remote_content=source.content),
            Verifier(RuntimeError()),
            stale_persistence,
            SessionManager(),
        )
        with pytest.raises(ConfigMutationError, match="topology"):
            await stale_manager.async_preview_calibrated_gains(
                record.mac, target, record.verification_id
            )

    asyncio.run(run())


def test_gain_handoff_install_rejects_newly_mixed_verified_record() -> None:
    """A stale gain-only preview must not install YAML after offsets are recorded."""

    async def run() -> None:
        source = _snapshot()
        record = _record(source, ((7301, 1),) * 3)
        persistence = CalibrationPersistence((record,))
        builder = Builder(remote_content=source.content)
        manager = ConfigTransactionManager(
            builder,
            Verifier(
                ReconnectEvidence(
                    record.mac,
                    topology(0),
                    {channel: f"CT {channel}" for channel in range(1, 7)},
                    6,
                )
            ),
            persistence,
            SessionManager(),
        )
        preview = await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        persistence.records[record.mac] = _with_offsets(
            record,
            source_handoff_available=False,
            source_handoff_transaction_id=preview.transaction_id,
        )

        with pytest.raises(RuntimeError, match="offset calibration remains saved in flash"):
            await manager.async_confirm_install(preview.transaction_id, "admin")

        assert "upload" not in builder.calls
        assert persistence.installed == []

    asyncio.run(run())


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
        assert manager2.active_status(current_record.mac) == status
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


def test_claim_response_error_reconciles_a_durable_reservation_before_removal() -> None:
    async def run() -> None:
        source = _snapshot()
        record = _record(source, ((7301, 1),) * 3)

        class LostClaimResponsePersistence(CalibrationPersistence):
            fail_once = True

            async def async_claim_verified_calibration(
                self, mac: str, verification_id: str, transaction_id: str
            ) -> bool:
                claimed = await super().async_claim_verified_calibration(
                    mac, verification_id, transaction_id
                )
                assert claimed
                if self.fail_once:
                    self.fail_once = False
                    raise OSError("claim outcome response lost after durable save")
                return claimed

        persistence = LostClaimResponsePersistence((record,))
        manager = ConfigTransactionManager(
            Builder(remote_content=source.content),
            Verifier(RuntimeError()),
            persistence,
            SessionManager(),
        )

        with pytest.raises(OSError, match="response lost after durable save"):
            await manager.async_preview_calibrated_gains(
                record.mac, topology(0), record.verification_id
            )

        assert persistence.claimed == {}
        assert manager.sessions._config_transactions == {}
        retry = await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )
        assert retry.state is ConfigTransactionState.PREVIEWED

    asyncio.run(run())


def test_claim_internal_cancellation_reconciles_unknown_durable_completion() -> None:
    async def run() -> None:
        source = _snapshot()
        record = _record(source, ((7301, 1),) * 3)

        class CancelledClaimResponsePersistence(CalibrationPersistence):
            fail_once = True

            async def async_claim_verified_calibration(
                self, mac: str, verification_id: str, transaction_id: str
            ) -> bool:
                claimed = await super().async_claim_verified_calibration(
                    mac, verification_id, transaction_id
                )
                assert claimed
                if self.fail_once:
                    self.fail_once = False
                    raise asyncio.CancelledError
                return claimed

        persistence = CancelledClaimResponsePersistence((record,))
        manager = ConfigTransactionManager(
            Builder(remote_content=source.content),
            Verifier(RuntimeError()),
            persistence,
            SessionManager(),
        )

        with pytest.raises(asyncio.CancelledError):
            await manager.async_preview_calibrated_gains(
                record.mac, topology(0), record.verification_id
            )

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


def test_expired_reservation_cleanup_remains_owned_until_unload_drains_it() -> None:
    """Expiry cannot detach durable release after removing the transaction map entry."""

    async def run() -> None:
        now = 10.0
        source = _snapshot()
        record = _record(source, ((7301, 1),) * 3)

        class BlockingPersistence(CalibrationPersistence):
            def __init__(self) -> None:
                super().__init__((record,))
                self.release_started = asyncio.Event()
                self.release_allowed = asyncio.Event()
                self.release_finished = False

            async def async_release_verified_calibration(
                self, mac: str, verification_id: str, transaction_id: str
            ) -> bool:
                self.release_started.set()
                await self.release_allowed.wait()
                released = await super().async_release_verified_calibration(
                    mac, verification_id, transaction_id
                )
                self.release_finished = True
                return released

        persistence = BlockingPersistence()
        sessions = SessionManager()
        manager = ConfigTransactionManager(
            Builder(remote_content=source.content),
            Verifier(RuntimeError()),
            persistence,
            sessions,
            confirmation_ttl=5.0,
            clock=lambda: now,
        )
        preview = await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )
        now = 16.0
        with pytest.raises(KeyError, match="expired"):
            manager.status(preview.transaction_id)
        await persistence.release_started.wait()

        unload = asyncio.create_task(sessions.async_unload())
        await asyncio.sleep(0)
        try:
            assert not unload.done()
        finally:
            persistence.release_allowed.set()
        await unload
        assert persistence.release_finished
        assert persistence.claimed == {}
        assert sessions._config_transactions == {}

    asyncio.run(run())


def test_expired_reservation_release_error_is_owned_and_reported_on_unload() -> None:
    """A background release error remains observable until final teardown."""

    async def run() -> None:
        now = 10.0
        source = _snapshot()
        record = _record(source, ((7301, 1),) * 3)

        class FailingPersistence(CalibrationPersistence):
            async def async_release_verified_calibration(
                self, mac: str, verification_id: str, transaction_id: str
            ) -> bool:
                del mac, verification_id, transaction_id
                raise OSError("durable release failed")

        persistence = FailingPersistence((record,))
        sessions = SessionManager()
        manager = ConfigTransactionManager(
            Builder(remote_content=source.content),
            Verifier(RuntimeError()),
            persistence,
            sessions,
            confirmation_ttl=5.0,
            clock=lambda: now,
        )
        preview = await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )
        now = 16.0
        with pytest.raises(KeyError, match="expired"):
            manager.status(preview.transaction_id)
        await asyncio.sleep(0)

        with pytest.raises(BaseExceptionGroup, match="reservation cleanup"):
            await sessions.async_unload()
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


def test_proven_prewrite_config_change_releases_handoff_for_retry() -> None:
    class ChangedBuilder(Builder):
        async def async_update_config(
            self, snapshot: ESPHomeConfigSnapshot, proposed: str
        ) -> None:
            del proposed
            self.calls.append("write")
            raise ConfigChangedError(snapshot.sha256, "f" * 64)

    async def run() -> None:
        source = _snapshot()
        record = _record(source, ((7301, 1),) * 3)
        persistence = CalibrationPersistence((record,))
        manager = ConfigTransactionManager(
            ChangedBuilder(remote_content=source.content),
            Verifier(RuntimeError()),
            persistence,
            SessionManager(),
        )
        preview = await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )

        with pytest.raises(ConfigChangedError):
            await manager.async_confirm_write(preview.transaction_id, "admin-user")

        assert persistence.claimed == {}
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
            "source_handoff_firmware_installed": False,
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


def test_successful_validation_rollback_releases_handoff_for_retry() -> None:
    async def run() -> None:
        source = _snapshot()
        record = _record(source, ((7301, 1),) * 3)
        persistence = CalibrationPersistence((record,))
        builder = Builder(
            remote_content=source.content,
            validation=(Job(False, "invalid generated configuration"),),
        )
        manager = ConfigTransactionManager(
            builder,
            Verifier(RuntimeError()),
            persistence,
            SessionManager(),
        )
        preview = await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )

        result = await manager.async_confirm_write(
            preview.transaction_id, "admin-user"
        )

        assert result.state is ConfigTransactionState.ROLLED_BACK
        assert builder.remote_content == source.content
        assert persistence.claimed == {}
        retry = await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )
        assert retry.state is ConfigTransactionState.PREVIEWED

    asyncio.run(run())


def test_store_records_verified_firmware_before_flash_handoff_completion() -> None:
    """A claimed handoff cannot become configuration-authoritative before install."""

    async def run() -> None:
        snapshot = _snapshot()
        record = _record(snapshot, ((7301, 28001), (7301, 28002), (7301, 28003)))
        store = object.__new__(HelperStore)
        store._update_lock = asyncio.Lock()
        from tests.test_store import _CopyingStorage

        store._store = _CopyingStorage()
        transaction_id = "3" * 32
        await store.async_save_verified_calibration(record)
        with pytest.raises(ValueError, match="installed handoff requires a transaction"):
            replace(
                record,
                source_handoff_available=False,
                source_handoff_firmware_installed=True,
            )
        with pytest.raises(ValueError, match="configuration authority requires install"):
            replace(
                record,
                source_authority=CalibrationSourceAuthority.CONFIGURATION,
                source_handoff_available=False,
                source_handoff_transaction_id="3" * 32,
            )
        assert await store.async_claim_verified_calibration(
            record.mac, record.verification_id, transaction_id
        )

        assert not await store.async_complete_verified_calibration_handoff(
            record.mac, record.verification_id, transaction_id
        )
        assert await store.async_mark_verified_calibration_installed(
            record.mac, record.verification_id, transaction_id
        )
        assert await store.async_complete_verified_calibration_handoff(
            record.mac, record.verification_id, transaction_id
        )

        completed = await store.async_get_verified_calibration(record.mac)
        assert completed is not None
        assert completed.source_authority is CalibrationSourceAuthority.CONFIGURATION
        assert completed.source_handoff_firmware_installed
        assert not completed.source_handoff_available
        assert completed.source_handoff_transaction_id == transaction_id
        assert completed.source_status == "Configuration calibration is authoritative."

    asyncio.run(run())


def test_verified_install_marks_calibrated_firmware_before_flash_can_clear() -> None:
    """Removing the post-install marker would permit a premature flash clear."""

    async def run() -> None:
        source = _snapshot()
        record = _record(source, ((7301, 28001), (7301, 28002), (7301, 28003)))
        persistence = CalibrationPersistence((record,))
        manager = ConfigTransactionManager(
            Builder(remote_content=source.content),
            Verifier(
                ReconnectEvidence(
                    record.mac,
                    topology(0),
                    {channel: f"CT {channel}" for channel in range(1, 7)},
                    6,
                )
            ),
            persistence,
            SessionManager(),
        )
        preview = await manager.async_preview_calibrated_gains(
            record.mac, topology(0), record.verification_id
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        result = await manager.async_confirm_install(preview.transaction_id, "admin")

        assert result.state is ConfigTransactionState.VERIFIED
        assert persistence.installed == [
            (record.mac, record.verification_id, preview.transaction_id)
        ]

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
