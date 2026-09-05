"""Stock preparation uses the real reviewed transaction and durable recovery."""

import asyncio
from dataclasses import replace
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
    build_offset_table_mutation,
)
from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionManager,
    ReconnectEvidence,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from tests.test_calibration_engine_offset import FakeOffsetSession
from tests.test_config_transaction import Builder, Persistence, Verifier
from tests.test_offset_recovery import MAC, _snapshot, _topology, hass_at, observed
from tests.test_preflight import binding_with_offset_controls

ZERO = ((0, 0), (0, 0), (0, 0))


@pytest.mark.parametrize("stage", (1, 2))
def test_first_stock_preparation_reports_missing_tables_without_writes(
    tmp_path: Path, stage: int
) -> None:
    async def run() -> None:
        from unittest.mock import AsyncMock

        from custom_components.circuitsetup_energy_meter_helper.diagnostics import (
            _error_code,
        )
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from custom_components.circuitsetup_energy_meter_helper.websocket_api import (
            _send_safe_error,
        )
        from custom_components.circuitsetup_energy_meter_helper.workflow import (
            OffsetTablesUnavailable,
        )
        from tests.test_websocket_api import FakeConnection
        from tests.test_workflow import _workflow

        workflow, handle, sessions, _ = _workflow()
        handle.binding = binding_with_offset_controls(0)
        handle.configuration = "meter.yaml"
        handle.configuration_sha256 = _snapshot().sha256
        session = StockSession(handle.binding)
        session.snapshot_unknown = True
        workflow._api = session
        builder = workflow._builder = Builder(remote_content=_snapshot().content)
        recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        preview = AsyncMock()
        workflow.transactions = SimpleNamespace(async_preview=preview)

        with pytest.raises(OffsetTablesUnavailable) as raised:
            await workflow.async_preview_offset_preparation(
                handle.session_id, 0, stage, backup_acknowledged=True
            )
        connection = FakeConnection()
        _send_safe_error(connection, 1, raised.value)
        assert _error_code(raised.value) == "offset_tables_unavailable"
        assert connection.errors == [
            (1, "offset_tables_unavailable", "Complete offset tables are unavailable")
        ]
        assert not any(event[0] == "button" for event in session.events)
        assert "write" not in builder.calls
        preview.assert_not_awaited()
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            assert await recovery.async_load(lease) is None
        finally:
            lease.release()

    asyncio.run(run())


class StockSession(FakeOffsetSession):
    def __init__(
        self,
        meter: Any,
        *,
        fail_second: bool = False,
        enhanced: bool = False,
        stage: int = 1,
        no_stored: bool = False,
    ) -> None:
        super().__init__(meter, stage)
        self.connection_generation = self.window_generation = (
            meter.connection_generation
        )
        self.log_lines: list[str] = []
        self.fail_second = fail_second
        self.enhanced = enhanced
        self.no_stored = no_stored
        self.snapshot_unknown = False
        self.snapshot_overrides: dict[tuple[str, int], Any] = {}

    async def async_offset_table_snapshot(
        self, targets: set[str], *, offset_stage: int, **kwargs: Any
    ) -> dict[str, Any]:
        return {
            instance: self.snapshot_overrides[(instance, offset_stage)]
            if (instance, offset_stage) in self.snapshot_overrides
            else None
            if self.snapshot_unknown
            else replace(
                observed(instance, self.connection_generation),
                offset_stage=offset_stage,
            )
            for instance in targets
        }

    async def async_press_button(self, key: int, *, device_id: int = 0) -> None:
        await super().async_press_button(key, device_id=device_id)
        for index, control in enumerate(self.meter.offset_capability.controls):
            instance = f"meter_main{index + 1}"
            restore = (
                control.restore_offset
                if self.stage == 1
                else control.restore_power_offset
            )
            run = control.run_offset if self.stage == 1 else control.run_power_offset
            clear = key == restore.descriptor.key
            button = restore if clear else run
            if key != button.descriptor.key:
                continue
            log_start = len(self.log_lines)
            self.log_lines.append(f"[I][atm90e32.button:037] {button.descriptor.name}")
            prefix = f"[I][atm90e32:805] [CALIBRATION][{instance}] "
            self.log_lines.append(
                prefix
                + (
                    "Clearing stored offset calibrations and restoring config-defined values"
                    if clear
                    else "======================== Offset Calibration ========================"
                )
            )
            self.log_lines.append(
                prefix + "| Phase | offset_voltage | offset_current |"
            )
            self.log_lines.extend(prefix + f"| {phase} | 0 | 0 |" for phase in "ABC")
            self.log_lines.append(
                prefix
                + (
                    "Offsets cleared."
                    if clear
                    else "Offset calibration saved to memory."
                )
            )
            if not clear and self.enhanced:
                self.log_lines.append(
                    prefix + "Offset calibration completed and verified."
                )
            if not clear and index == 1 and self.fail_second:
                asyncio.get_running_loop().call_later(
                    0.01,
                    self.log_lines.append,
                    prefix + "Failed to save offset calibration to memory!",
                )
            if clear and self.no_stored:
                self.log_lines[-6] = (
                    prefix + "No stored offset calibrations to clear. Current values:"
                )
                self.log_lines.pop()
            if self.stage == 2:
                self.log_lines[log_start:] = [
                    line.replace(
                        "Clearing stored offset calibrations",
                        "Clearing stored power offsets",
                    )
                    .replace(
                        "No stored offset calibrations",
                        "No stored power offset calibrations",
                    )
                    .replace("Offset Calibration", "Power Offset Calibration")
                    .replace("offset_voltage", "offset_active_power")
                    .replace("offset_current", "offset_reactive_power")
                    .replace("Offsets cleared.", "Power offsets cleared.")
                    .replace("Offset calibration", "Power offset calibration")
                    for line in self.log_lines[log_start:]
                ]
            break


async def preparation(tmp_path: Path, *, review: bool = True) -> tuple[Any, ...]:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        OffsetRecovery,
    )

    sessions = SessionManager()
    recovery = OffsetRecovery(hass_at(tmp_path), sessions)
    source, topology = _snapshot(), _topology()
    builder = Builder(remote_content=source.content)
    lease = await sessions.async_acquire_calibration(MAC)
    try:
        record = await recovery.async_backup(
            lease, source, topology, (observed(), observed("meter_main2"))
        )
        plan = build_offset_table_mutation(
            source,
            topology,
            {"meter_main1": ZERO, "meter_main2": ZERO},
            {},
            enable_calibration=frozenset(("meter_main1", "meter_main2")),
        )
        prepared = await recovery.async_prepare(
            lease, record, source, plan, "a" * 32, 1, ("meter_main1", "meter_main2"), 1
        )
    finally:
        lease.release()
    manager = ConfigTransactionManager(
        builder,
        Verifier(
            ReconnectEvidence(MAC, topology, {i: f"CT {i}" for i in range(1, 7)}, 6)
        ),
        Persistence(),
        sessions,
        offset_recovery=recovery,
        reconnect_timeout=0.1,
        reconnect_backoff_initial=0.01,
    )
    preview = (
        await manager.async_preview(
            MAC, topology, plan, source, offset_preparation=prepared
        )
        if review else None
    )
    return sessions, recovery, builder, manager, preview, prepared


def test_only_real_successful_install_mints_preparation_receipt(tmp_path: Path) -> None:
    async def run() -> None:
        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        assert "top-secret" not in repr(preview)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        installed = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert installed.state.value == "verified"
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_require(lease, prepared, installed=True)
            assert record.original.content == _snapshot().content
            assert record.installed
        finally:
            lease.release()
        assert builder.calls.count("upload") == 1

    asyncio.run(run())


@pytest.mark.parametrize(
    "boundary", ("write", "compile", "after_compile", "upload", "receipt")
)
def test_preparation_checks_exact_source_at_each_mutation_boundary(
    tmp_path: Path, boundary: str
) -> None:
    async def run() -> None:
        sessions, _recovery, builder, manager, preview, _prepared = await preparation(
            tmp_path
        )
        if boundary != "write":
            await manager.async_confirm_write(preview.transaction_id, "admin")
        if boundary in ("upload", "receipt"):
            await manager.async_compile(preview.transaction_id)
        if boundary in ("after_compile", "receipt"):
            operation = "compile" if boundary == "after_compile" else "upload"
            release = builder.pause(operation)
            task = asyncio.create_task(
                manager.async_compile(preview.transaction_id)
                if operation == "compile"
                else manager.async_confirm_install(preview.transaction_id, "admin")
            )
            await builder.started[operation].wait()
            builder.remote_content += "\n# foreign change\n"
            release.set()
            try:
                status = await task
                assert status.state.value == "failed"
            except ValueError:
                pass
        else:
            builder.remote_content += "\n# foreign change\n"
            with pytest.raises(ValueError):
                if boundary == "write":
                    await manager.async_confirm_write(preview.transaction_id, "admin")
                elif boundary == "compile":
                    await manager.async_compile(preview.transaction_id)
                else:
                    await manager.async_confirm_install(preview.transaction_id, "admin")
        assert builder.calls.count("upload") == (1 if boundary == "receipt" else 0)
        await sessions.async_unload()

    asyncio.run(run())


def test_completed_stock_candidate_survives_reload_and_is_never_reselected(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )

        sessions, recovery, _builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            await recovery.async_begin_attempt(lease, prepared, "meter_main1")
            await recovery.async_capture_result(
                lease, prepared, "meter_main1", ZERO, 2, False
            )
            reloaded = await OffsetRecovery(hass_at(tmp_path), sessions).async_load(
                lease
            )
            assert reloaded.results[0].phase_values == ZERO
            assert not reloaded.results[0].register_verified
            assert sessions.pending_calibration(MAC) is None
            with pytest.raises(ValueError, match="complete|attempt"):
                await recovery.async_begin_attempt(lease, prepared, "meter_main1")
        finally:
            lease.release()

    asyncio.run(run())


def test_cancelled_preparation_cannot_write_or_install(tmp_path: Path) -> None:
    async def run() -> None:
        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            await recovery.async_cancel(lease, prepared)
        finally:
            lease.release()
        with pytest.raises(ValueError):
            await manager.async_confirm_write(preview.transaction_id, "admin")
        assert "write" not in builder.calls and "upload" not in builder.calls

    asyncio.run(run())


@pytest.mark.parametrize("enhanced", (False, True))
def test_prepared_run_captures_stock_without_promoting_it_and_waits_for_late_errors(
    tmp_path: Path, enhanced: bool
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
            CalibrationEngine,
        )

        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        meter = binding_with_offset_controls(0)
        meter = replace(meter, connection_generation=2)
        session = StockSession(meter, fail_second=True, enhanced=enhanced)
        session.sessions = sessions

        async def marker(*args: Any) -> None:
            pass

        engine = CalibrationEngine(sessions, marker, evidence_timeout=0.025)
        result = await engine.async_calibrate_prepared_offset_board(
            MAC,
            session,
            meter,
            0,
            prepared,
            recovery,
            source_reader=lambda: builder.async_get_config("meter.yaml"),
        )
        assert result.state.value == "partial"
        assert result.unfinished_group_keys == ("main_2",)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert len(record.results) == 1
            assert record.results[0].phase_values == ZERO
            assert record.results[0].register_verified is enhanced
            assert sessions.pending_calibration(MAC) is None
        finally:
            lease.release()
        before = tuple(session.events)
        with pytest.raises(ValueError, match="attempt"):
            await engine.async_calibrate_prepared_offset_board(
                MAC,
                session,
                meter,
                0,
                prepared,
                recovery,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
            )
        assert not any(event[0] == "button" for event in session.events[len(before) :])

    asyncio.run(run())


@pytest.mark.parametrize(
    "missing", ("receipt", "snapshot", "generation", "snapshot_failure", "topology")
)
def test_prepared_run_never_dispatches_without_all_evidence(
    tmp_path: Path, missing: str
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
            CalibrationEngine,
        )

        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        if missing != "receipt":
            await manager.async_confirm_write(preview.transaction_id, "admin")
            await manager.async_compile(preview.transaction_id)
            await manager.async_confirm_install(preview.transaction_id, "admin")
        meter = binding_with_offset_controls(0)
        meter = replace(meter, connection_generation=2)
        session = StockSession(meter)
        session.snapshot_unknown = missing == "snapshot"
        if missing == "snapshot_failure":

            async def failed_snapshot(*args: Any, **kwargs: Any) -> Any:
                raise RuntimeError("private native logs")

            session.async_offset_table_snapshot = failed_snapshot
        if missing == "topology":
            meter = replace(binding_with_offset_controls(1), connection_generation=2)
        if missing == "generation":
            session.connection_generation = 3

        async def marker(*args: Any) -> None:
            pass

        engine = CalibrationEngine(sessions, marker, evidence_timeout=0.025)
        with pytest.raises((ValueError, RuntimeError)) as raised:
            await engine.async_calibrate_prepared_offset_board(
                MAC,
                session,
                meter,
                0,
                prepared,
                recovery,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
            )
        assert not any(event[0] == "button" for event in session.events)
        assert "private native logs" not in str(raised.value)

    asyncio.run(run())


def test_receipt_rebind_preserves_gain_groups_and_revision_ownership(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        meter = binding_with_offset_controls(0)
        session = StockSession(meter)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            origin = sessions._begin_calibration_origin(
                lease, session, meter, _snapshot()
            )
            origin = sessions.record_calibration_group(
                lease,
                origin.operation_id,
                origin.revision,
                session,
                meter,
                "meter_main1",
                ((100, 200),) * 3,
            )
        finally:
            lease.release()
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_require(lease, prepared, installed=True)
            source = await builder.async_get_config("meter.yaml")
            updated = sessions.rebind_prepared_calibration(
                lease, session, meter, source, record
            )
            assert updated.operation_id == origin.operation_id
            assert updated.revision == origin.revision + 1
            assert updated.gain_groups == origin.gain_groups
            assert updated.config_sha256 == source.sha256
            assert not updated.offset_groups
        finally:
            lease.release()

    asyncio.run(run())


@pytest.mark.parametrize("fail_second", (False, True))
@pytest.mark.parametrize("reloaded", (False, True))
def test_workflow_previews_without_dispatch_and_resumes_only_with_physical_ack(
    tmp_path: Path,
    fail_second: bool,
    reloaded: bool,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from tests.test_workflow import _workflow

        workflow, handle, sessions, _ = _workflow()
        workflow._sessions.clear()
        handle.session_id = "b" * 32
        workflow._sessions[handle.session_id] = handle
        handle.binding = binding_with_offset_controls(0)
        handle.configuration, handle.configuration_sha256 = (
            "meter.yaml",
            _snapshot().sha256,
        )
        session = StockSession(handle.binding, fail_second=fail_second)
        session.sessions = sessions
        workflow._api = session
        workflow._builder = Builder(remote_content=_snapshot().content)
        workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = ConfigTransactionManager(
            workflow._builder,
            Verifier(
                ReconnectEvidence(
                    MAC, handle.topology, {i: f"CT {i}" for i in range(1, 7)}, 6
                )
            ),
            Persistence(),
            sessions,
            offset_recovery=workflow._offset_recovery,
        )
        preview = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True
        )
        assert preview["backup_available"] is True
        assert "top-secret" not in repr(preview)
        assert not any(event[0] == "button" for event in session.events)
        with pytest.raises((ValueError, RuntimeError, KeyError)):
            await workflow.async_resume_offset_calibration(
                handle.session_id,
                preview["operation_id"],
                0,
                1,
                preparation_acknowledged=False,
            )
        assert not any(event[0] == "button" for event in session.events)
        with pytest.raises(KeyError, match="stock"):
            await workflow.async_complete_calibration_without_changes(handle.session_id)
        transaction_id = preview["transaction"].transaction_id
        await workflow.transactions.async_confirm_write(transaction_id, "admin")
        await workflow.transactions.async_compile(transaction_id)
        installed = await workflow.transactions.async_confirm_install(
            transaction_id, "admin"
        )
        assert installed.state.value == "verified", installed
        handle.timing_policy = SimpleNamespace(
            evidence_timeout_s=0.025, sensor_window_timeout_s=0.025
        )
        result = await workflow.async_resume_offset_calibration(
            handle.session_id,
            preview["operation_id"],
            0,
            1,
            preparation_acknowledged=True,
        )
        assert result.state.value == (
            "partial" if fail_second else "captured_pending_configuration"
        )
        assert handle.stock_offset_pending
        if reloaded:
            old_handle = handle
            workflow, handle, sessions, _ = _workflow()
            handle.binding = old_handle.binding
            handle.configuration = old_handle.configuration
            handle.configuration_sha256 = old_handle.configuration_sha256
            handle.timing_policy = old_handle.timing_policy
            workflow._api = session
            workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
            assert not handle.stock_offset_pending
            await workflow.async_get_offset_preparation(handle.session_id)
            assert handle.stock_offset_pending
        session.events.clear()
        with pytest.raises(KeyError, match="stock"):
            await workflow.async_calibrate_offset(
                handle.session_id,
                0,
                1,
                preparation_acknowledged=True,
                confirm_retry=True,
            )
        assert not any(event[0] == "button" for event in session.events)

    asyncio.run(run())


@pytest.mark.parametrize("rollback", (False, True))
@pytest.mark.parametrize("reloaded", (False, True))
def test_replacement_cancel_or_rollback_retains_known_source_for_new_preparation(
    tmp_path: Path,
    rollback: bool,
    reloaded: bool,
) -> None:
    async def run() -> None:
        from hashlib import sha256

        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from tests.test_config_transaction import Job

        sessions, recovery, builder, manager, preview, first = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        source = await builder.async_get_config("meter.yaml")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            await recovery.async_begin_attempt(lease, first, "meter_main1")
            await recovery.async_capture_result(
                lease, first, "meter_main1", observed().phase_values, 2, False
            )
            record = await recovery.async_backup(
                lease, source, _topology(), (observed("meter_main2", 2),)
            )
            plan = build_offset_table_mutation(
                source,
                _topology(),
                {"meter_main1": observed().phase_values, "meter_main2": ZERO},
                {},
                enable_calibration=frozenset(("meter_main2",)),
            )
            replacement = await recovery.async_prepare(
                lease, record, source, plan, "d" * 32, 1, ("meter_main2",), 2
            )
        finally:
            lease.release()
        assert plan.proposed_content != source.content
        preview = await manager.async_preview(
            MAC, _topology(), plan, source, offset_preparation=replacement
        )
        if rollback:
            await manager.async_confirm_write(preview.transaction_id, "admin")
            builder.compile = Job(False)
            await manager.async_compile(preview.transaction_id)
            status = await manager.async_rollback(preview.transaction_id)
            assert status.state.value == "rolled_back"
            assert builder.restored_content == source.content
        else:
            await manager.async_abandon(preview.transaction_id)
            lease = await sessions.async_acquire_calibration(MAC)
            try:
                await recovery.async_cancel(lease, replacement)
            finally:
                lease.release()
        assert builder.remote_content == source.content
        assert not sessions.is_config_locked(MAC)
        if reloaded:
            sessions = SessionManager()
            recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            loaded = await recovery.async_load(lease)
            assert not recovery.is_action_ready(loaded)
            with pytest.raises(ValueError):
                await recovery.async_require(lease, first, installed=True)
            with pytest.raises(ValueError):
                await recovery.async_require(lease, replacement, installed=True)
            foreign = source.content + "\n# unrelated edit\n"
            with pytest.raises(ValueError, match="source changed"):
                await recovery.async_backup(
                    lease,
                    replace(
                        source,
                        content=foreign,
                        sha256=sha256(foreign.encode()).hexdigest(),
                    ),
                    _topology(),
                    (observed("meter_main2", 3),),
                )
            retained = await recovery.async_backup(
                lease,
                await builder.async_get_config("meter.yaml"),
                _topology(),
                (observed("meter_main2", 3),),
            )
            assert retained.original.content == _snapshot().content
            assert retained.results == record.results
            fresh = await recovery.async_prepare(
                lease, retained, source, plan, "e" * 32, 1, ("meter_main2",), 3
            )
            assert fresh.operation_id not in (
                first.operation_id,
                replacement.operation_id,
            )
            assert not recovery.is_action_ready(await recovery.async_load(lease))
        finally:
            lease.release()
        builder.compile = Job(True)
        manager = ConfigTransactionManager(
            builder,
            Verifier(
                ReconnectEvidence(
                    MAC, _topology(), {i: f"CT {i}" for i in range(1, 7)}, 6
                )
            ),
            Persistence(),
            sessions,
            offset_recovery=recovery,
        )
        preview = await manager.async_preview(
            MAC, _topology(), plan, source, offset_preparation=fresh
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            installed = await recovery.async_require(lease, fresh, installed=True)
            assert installed.results == record.results
            assert fresh.targets == ("meter_main2",)
        finally:
            lease.release()

    asyncio.run(run())


@pytest.mark.parametrize("completed_drift", (False, True))
def test_new_preparation_and_process_reload_retry_only_unfinished_chip(
    tmp_path: Path,
    completed_drift: bool,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
            CalibrationEngine,
        )
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )

        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        meter = replace(binding_with_offset_controls(0), connection_generation=2)
        session = StockSession(meter, fail_second=True)

        async def marker(*args: Any) -> None:
            pass

        engine = CalibrationEngine(sessions, marker, evidence_timeout=0.025)
        first = await engine.async_calibrate_prepared_offset_board(
            MAC,
            session,
            meter,
            0,
            prepared,
            recovery,
            source_reader=lambda: builder.async_get_config("meter.yaml"),
        )
        assert first.state.value == "partial"
        # Simulate a complete helper process reload: only disk and source survive.
        sessions = SessionManager()
        recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        source = await builder.async_get_config("meter.yaml")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_backup(
                lease, source, _topology(), (observed("meter_main2", 3),)
            )
            plan = build_offset_table_mutation(
                source,
                _topology(),
                {"meter_main1": ZERO, "meter_main2": ZERO},
                {},
                enable_calibration=frozenset(("meter_main2",)),
            )
            prepared = await recovery.async_prepare(
                lease, record, source, plan, "c" * 32, 1, ("meter_main2",), 3
            )
        finally:
            lease.release()
        manager = ConfigTransactionManager(
            builder,
            Verifier(
                ReconnectEvidence(
                    MAC, _topology(), {i: f"CT {i}" for i in range(1, 7)}, 6
                )
            ),
            Persistence(),
            sessions,
            offset_recovery=recovery,
        )
        preview = await manager.async_preview(
            MAC, _topology(), plan, source, offset_preparation=prepared
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        meter = replace(meter, connection_generation=4)
        session = StockSession(meter)
        session.snapshot_overrides[("meter_main1", 1)] = (
            observed("meter_main1", 4) if completed_drift else None
        )
        engine = CalibrationEngine(sessions, marker, evidence_timeout=0.025)
        if completed_drift:
            with pytest.raises(ValueError, match="completed"):
                await engine.async_calibrate_prepared_offset_board(
                    MAC,
                    session,
                    meter,
                    0,
                    prepared,
                    recovery,
                    source_reader=lambda: builder.async_get_config("meter.yaml"),
                )
            assert not any(event[0] == "button" for event in session.events)
            return
        result = await engine.async_calibrate_prepared_offset_board(
            MAC,
            session,
            meter,
            0,
            prepared,
            recovery,
            source_reader=lambda: builder.async_get_config("meter.yaml"),
        )
        assert result.state.value == "captured_pending_configuration"
        buttons = [event[1] for event in session.events if event[0] == "button"]
        assert buttons == [
            meter.offset_capability.controls[1].restore_offset.descriptor.key,
            meter.offset_capability.controls[1].run_offset.descriptor.key,
        ]
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record.original.content == _snapshot().content
            assert len(record.results) == 2
            assert record.results[0].generation == 2
            assert record.results[1].generation == 4
            assert sessions.pending_calibration(MAC) is None
        finally:
            lease.release()

    asyncio.run(run())


def test_cancel_during_receipt_drain_never_leaves_installed_authorization(
    tmp_path: Path, monkeypatch: Any
) -> None:
    async def run() -> None:
        from threading import Event

        from custom_components.circuitsetup_energy_meter_helper import offset_recovery

        sessions, recovery, _builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        started, release = Event(), Event()
        real = offset_recovery.write_utf8_file_atomic

        def blocked(path: str, data: bytes | str, **kwargs: Any) -> None:
            if b'"installed":true' in data:
                started.set()
                release.wait(3)
            real(path, data, **kwargs)

        monkeypatch.setattr(offset_recovery, "write_utf8_file_atomic", blocked)
        task = asyncio.create_task(
            manager.async_confirm_install(preview.transaction_id, "admin")
        )
        assert await asyncio.to_thread(started.wait, 2)
        task.cancel()
        await asyncio.sleep(0.01)
        assert not task.done() and sessions.is_config_locked(MAC)
        release.set()
        with pytest.raises(asyncio.CancelledError):
            await task
        assert not sessions.is_config_locked(MAC)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            with pytest.raises(ValueError):
                await recovery.async_require(lease, prepared, installed=True)
        finally:
            lease.release()

    asyncio.run(run())


@pytest.mark.parametrize(
    "failure",
    ("clear_failure", "generation", "lost_logs", "overflow", "source", "result_write"),
)
def test_ambiguous_clear_or_failed_result_persistence_stops_further_dispatch(
    tmp_path: Path, monkeypatch: Any, failure: str
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper import offset_recovery
        from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
            CalibrationEngine,
        )

        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        meter = replace(binding_with_offset_controls(0), connection_generation=2)
        session = StockSession(meter)
        original = session.async_press_button

        async def press(key: int, *, device_id: int = 0) -> None:
            await original(key, device_id=device_id)
            if key == meter.offset_capability.controls[0].restore_offset.descriptor.key:

                def drift() -> None:
                    if failure == "clear_failure":
                        session.log_lines.append("[E][atm90e32] SPI read mismatch")
                    elif failure == "generation":
                        session.connection_generation += 1
                    elif failure == "lost_logs":
                        session.log_lines[:] = ["unrelated new ring"]
                    elif failure == "overflow":
                        session.log_lines.append("X" * (512 * 1024 + 1))
                    elif failure == "source":
                        builder.remote_content += "\n# unrelated source edit"

                asyncio.get_running_loop().call_later(0.01, drift)

        session.async_press_button = press
        real = offset_recovery.write_utf8_file_atomic

        def write(path: str, data: bytes | str, **kwargs: Any) -> None:
            if failure == "result_write" and b'"results":[{' in data:
                raise OSError("unavailable storage")
            real(path, data, **kwargs)

        monkeypatch.setattr(offset_recovery, "write_utf8_file_atomic", write)

        async def marker(*args: Any) -> None:
            pass

        engine = CalibrationEngine(sessions, marker, evidence_timeout=0.025)
        result = await engine.async_calibrate_prepared_offset_board(
            MAC,
            session,
            meter,
            0,
            prepared,
            recovery,
            source_reader=lambda: builder.async_get_config("meter.yaml"),
        )
        assert result.state.value == "indeterminate"
        buttons = [event[1] for event in session.events if event[0] == "button"]
        want = [meter.offset_capability.controls[0].restore_offset.descriptor.key]
        if failure == "result_write":
            want.append(meter.offset_capability.controls[0].run_offset.descriptor.key)
        assert buttons == want
        assert not sessions.is_config_locked(MAC)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert not record.results
            assert record.attempted == ("meter_main1",)
        finally:
            lease.release()

    asyncio.run(run())


@pytest.mark.parametrize("drift", ("same", "changed", "malformed"))
def test_session_start_restores_stock_guard_without_status_call(
    tmp_path: Path, monkeypatch: Any, drift: str
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from custom_components.circuitsetup_energy_meter_helper.preflight import (
            PreflightResult,
        )
        from custom_components.circuitsetup_energy_meter_helper.provisioning import (
            DiscoveredDevice,
        )
        from custom_components.circuitsetup_energy_meter_helper.workflow import (
            EntryWorkflow,
        )
        from tests.test_entity_binding import synthetic_entities

        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            await recovery.async_begin_attempt(lease, prepared, "meter_main1")
            await recovery.async_capture_result(
                lease, prepared, "meter_main1", ZERO, 2, False
            )
        finally:
            lease.release()
        sessions = SessionManager()
        hass = hass_at(tmp_path)
        hass.config_entries = SimpleNamespace(
            async_get_entry=lambda _: SimpleNamespace(unique_id=MAC)
        )
        recovery = OffsetRecovery(hass, sessions)
        if drift == "changed":
            builder.remote_content += "\n# foreign source\n"

        async def none(*args: Any, **kwargs: Any) -> None:
            return None

        async def empty(*args: Any) -> tuple[Any, ...]:
            return ()

        async def stored(*args: Any) -> Any:
            return SimpleNamespace(configuration=None, stale=False)

        async def preflight(*args: Any) -> Any:
            return PreflightResult(())

        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.workflow.async_preflight",
            preflight,
        )
        api = SimpleNamespace(
            connected=True,
            connection_generation=3,
            entities=synthetic_entities(0, prefix="CT ", offset_controls=True),
            async_connect=none,
        )
        workflow = EntryWorkflow(
            hass,
            SimpleNamespace(
                snapshot=SimpleNamespace(
                    devices=(
                        DiscoveredDevice(
                            "meter",
                            "Meter",
                            _topology().project_name,
                            configuration="meter.yaml",
                        ),
                    )
                )
            ),
            sessions,
            SimpleNamespace(
                async_save_interrupted_session=none,
                async_finalize_verified_calibration=none,
                async_get_meter_configuration_read=stored,
                async_get_ct_selections=empty,
                async_get_interrupted_session=none,
                async_get_verified_calibration=none,
            ),
            "meter",
            api,
            builder,
            offset_recovery=recovery,
        )
        if drift == "malformed":
            lease = await sessions.async_acquire_calibration(MAC)
            try:
                recovery._path(lease).write_bytes(b'{"schema":1}')
            finally:
                lease.release()
            with pytest.raises(ValueError, match="invalid"):
                await workflow.async_start_session("meter")
            assert not sessions.is_config_locked(MAC)
            assert not sessions.is_calibration_locked(MAC)
            assert not workflow._sessions
            return
        status = await workflow.async_start_session("meter")
        assert status.has_pending_calibration
        handle = workflow._sessions[status.session_id]
        handle.safety_acknowledged = True
        handle.state = "ready"
        with pytest.raises(KeyError, match="stock"):
            await workflow.async_complete_calibration_without_changes(status.session_id)
        with pytest.raises(KeyError, match="stock"):
            await workflow.async_restart_and_verify(status.session_id)
        with pytest.raises(KeyError, match="stock"):
            await workflow.async_calibrate_offset(
                status.session_id,
                0,
                1,
                preparation_acknowledged=True,
                confirm_retry=True,
            )
        assert not sessions.is_config_locked(MAC)
        if drift == "same":
            assert handle.offset_results[(0, 1)].state.value == "partial"
        else:
            assert not handle.offset_results

    asyncio.run(run())


@pytest.mark.parametrize("explicit", (False, True))
def test_explicit_cancel_revokes_receipt_but_close_retains_recovery(
    tmp_path: Path, explicit: bool
) -> None:
    async def run() -> None:
        from tests.test_workflow import _workflow

        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        workflow, handle, _, _ = _workflow()
        workflow._sessions_owner = sessions
        workflow._offset_recovery = recovery
        workflow._builder = None
        workflow.transactions = manager
        handle.offset_preparation_id = prepared.operation_id
        if explicit:
            await workflow.async_cancel_session(handle.session_id)
        else:
            await workflow.async_close()
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record.cancelled is explicit
            assert record.original.content == _snapshot().content
            if explicit:
                with pytest.raises(ValueError):
                    await recovery.async_require(lease, prepared, installed=True)
                # Revocation is not loss of the exact installed source identity.
                retained = await recovery.async_backup(
                    lease,
                    await builder.async_get_config("meter.yaml"),
                    _topology(),
                    (observed("meter_main2", 2),),
                )
                assert retained.original == record.original
        finally:
            lease.release()

    asyncio.run(run())


def test_backup_retains_existing_strict_completed_offsets_for_preparation(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )

        sessions = SessionManager()
        recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        meter = binding_with_offset_controls(0)
        session = StockSession(meter)
        source = _snapshot()
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            origin = sessions._begin_calibration_origin(lease, session, meter, source)
            origin = sessions.record_offset_calibration_group(
                lease,
                origin.operation_id,
                origin.revision,
                session,
                meter,
                "meter_main1",
                1,
                observed().phase_values,
            )
            record = await recovery.async_backup(
                lease, source, _topology(), (observed(), observed("meter_main2"))
            )
            assert len(record.results) == 1
            assert record.results[0].phase_values == observed().phase_values
            assert record.results[0].register_verified
            plan = build_offset_table_mutation(
                source,
                _topology(),
                {"meter_main1": observed().phase_values, "meter_main2": ZERO},
                {},
                enable_calibration=frozenset(("meter_main2",)),
            )
            await recovery.async_prepare(
                lease, record, source, plan, "d" * 32, 1, ("meter_main2",), 1
            )
            assert sessions.pending_calibration(MAC) == origin
        finally:
            lease.release()
        # After Core restart the old installed receipt cannot authorize any button.
        builder = Builder(remote_content=source.content)
        manager = ConfigTransactionManager(
            builder,
            Verifier(
                ReconnectEvidence(
                    MAC, _topology(), {i: f"CT {i}" for i in range(1, 7)}, 6
                )
            ),
            Persistence(),
            sessions,
            offset_recovery=recovery,
        )
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            prepared = (await recovery.async_load(lease)).preparation
        finally:
            lease.release()
        preview = await manager.async_preview(
            MAC, _topology(), plan, source, offset_preparation=prepared
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        sessions = SessionManager()
        recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        meter = replace(meter, connection_generation=2)
        session = StockSession(meter)
        from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
            CalibrationEngine,
        )

        async def marker(*args: Any) -> None:
            pass

        with pytest.raises(ValueError):
            await CalibrationEngine(
                sessions, marker, evidence_timeout=0.025
            ).async_calibrate_prepared_offset_board(
                MAC,
                session,
                meter,
                0,
                prepared,
                recovery,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
            )
        assert not any(event[0] == "button" for event in session.events)
        # Repeating the reviewed preparation in this Core preserves the signed
        # strict result and reauthorizes only the still-unfinished second chip.
        source = await builder.async_get_config("meter.yaml")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            retained = await recovery.async_backup(
                lease, source, _topology(), (observed("meter_main2", 2),)
            )
            assert retained.original.content == _snapshot().content
            assert retained.results[0].phase_values == observed().phase_values
            assert retained.results[0].register_verified
            plan = build_offset_table_mutation(
                source,
                _topology(),
                {"meter_main1": observed().phase_values, "meter_main2": ZERO},
                {},
                enable_calibration=frozenset(("meter_main2",)),
            )
            prepared = await recovery.async_prepare(
                lease, retained, source, plan, "e" * 32, 1, ("meter_main2",), 2
            )
        finally:
            lease.release()
        manager = ConfigTransactionManager(
            builder,
            Verifier(
                ReconnectEvidence(
                    MAC, _topology(), {i: f"CT {i}" for i in range(1, 7)}, 6
                )
            ),
            Persistence(),
            sessions,
            offset_recovery=recovery,
        )
        preview = await manager.async_preview(
            MAC, _topology(), plan, source, offset_preparation=prepared
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        meter = replace(meter, connection_generation=3)
        session = StockSession(meter)
        result = await CalibrationEngine(
            sessions, marker, evidence_timeout=0.025
        ).async_calibrate_prepared_offset_board(
            MAC,
            session,
            meter,
            0,
            prepared,
            recovery,
            source_reader=lambda: builder.async_get_config("meter.yaml"),
        )
        assert result.state.value == "captured_pending_configuration"
        assert [event[1] for event in session.events if event[0] == "button"] == [
            meter.offset_capability.controls[1].restore_offset.descriptor.key,
            meter.offset_capability.controls[1].run_offset.descriptor.key,
        ]
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            final = await recovery.async_load(lease)
            assert len(final.results) == 2
            assert final.results[0].phase_values == observed().phase_values
            assert (
                final.results[0].register_verified
                and not final.results[1].register_verified
            )
        finally:
            lease.release()

    asyncio.run(run())


@pytest.mark.parametrize("prerequisite", (False, True))
def test_stage_two_requires_stage_one_and_only_dispatches_power_controls(
    tmp_path: Path, prerequisite: bool
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
            CalibrationEngine,
        )

        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        source = await builder.async_get_config("meter.yaml")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            if prerequisite:
                for instance in prepared.targets:
                    await recovery.async_begin_attempt(lease, prepared, instance)
                    await recovery.async_capture_result(
                        lease, prepared, instance, ZERO, 2, False
                    )
            record = await recovery.async_backup(
                lease,
                source,
                _topology(),
                tuple(
                    replace(observed(instance, 2), offset_stage=2)
                    for instance in prepared.targets
                ),
            )
            plan = build_offset_table_mutation(
                source,
                _topology(),
                {instance: ZERO for instance in prepared.targets}
                if prerequisite
                else {},
                {instance: ZERO for instance in prepared.targets},
                enable_calibration=frozenset(prepared.targets),
            )
            prepared = await recovery.async_prepare(
                lease, record, source, plan, "e" * 32, 2, prepared.targets, 2
            )
        finally:
            lease.release()
        preview = await manager.async_preview(
            MAC, _topology(), plan, source, offset_preparation=prepared
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        meter = replace(binding_with_offset_controls(0), connection_generation=3)
        session = StockSession(meter, stage=2)
        session.snapshot_overrides = {
            (instance, 1): None for instance in prepared.targets
        }

        async def marker(*args: Any) -> None:
            pass

        engine = CalibrationEngine(sessions, marker, evidence_timeout=0.025)
        if not prerequisite:
            with pytest.raises(ValueError, match="Stage 1"):
                await engine.async_calibrate_prepared_offset_board(
                    MAC,
                    session,
                    meter,
                    0,
                    prepared,
                    recovery,
                    source_reader=lambda: builder.async_get_config("meter.yaml"),
                )
            assert not any(event[0] == "button" for event in session.events)
            return
        result = await engine.async_calibrate_prepared_offset_board(
            MAC,
            session,
            meter,
            0,
            prepared,
            recovery,
            source_reader=lambda: builder.async_get_config("meter.yaml"),
        )
        assert result.state.value == "captured_pending_configuration"
        assert [event[1] for event in session.events if event[0] == "button"] == [
            button.descriptor.key
            for control in meter.offset_capability.controls
            for button in (control.restore_power_offset, control.run_power_offset)
        ]
        assert result.stage == 2

    asyncio.run(run())


def test_known_snapshot_then_no_stored_zero_clear_is_safe_noop_not_erase(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
            CalibrationEngine,
        )

        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        meter = replace(binding_with_offset_controls(0), connection_generation=2)
        session = StockSession(meter, no_stored=True)

        async def marker(*args: Any) -> None:
            pass

        result = await CalibrationEngine(
            sessions, marker, evidence_timeout=0.025
        ).async_calibrate_prepared_offset_board(
            MAC,
            session,
            meter,
            0,
            prepared,
            recovery,
            source_reader=lambda: builder.async_get_config("meter.yaml"),
        )
        assert result.state.value == "captured_pending_configuration"
        assert not any("Offsets cleared." in line for line in session.log_lines)

    asyncio.run(run())


@pytest.mark.parametrize("revocation_fails", (False, True))
def test_receipt_readback_failure_revokes_written_authorization(
    tmp_path: Path, monkeypatch: Any, revocation_fails: bool
) -> None:
    async def run() -> None:
        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        original_read = recovery._read
        from custom_components.circuitsetup_energy_meter_helper import offset_recovery

        original_write = offset_recovery.write_utf8_file_atomic
        failed = False

        def write(path: str, data: bytes, **kwargs: Any) -> None:
            if failed and revocation_fails:
                raise OSError("storage unavailable during revocation")
            original_write(path, data, **kwargs)

        def read(path: Path) -> bytes:
            nonlocal failed
            data = original_read(path)
            if b'"installed":true' in data and not failed:
                failed = True
                raise OSError("private path must not leak")
            return data

        monkeypatch.setattr(recovery, "_read", read)
        monkeypatch.setattr(offset_recovery, "write_utf8_file_atomic", write)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.state.value == "failed"
        assert not sessions.is_config_locked(MAC)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            with pytest.raises(ValueError):
                await recovery.async_require(lease, prepared, installed=True)
            assert (
                await recovery.async_load(lease)
            ).original.content == _snapshot().content
        finally:
            lease.release()
        # Both failed revocation and a successful cancellation remain unready
        # after all process-local state is lost, before even native Clear.
        monkeypatch.setattr(offset_recovery, "write_utf8_file_atomic", original_write)
        from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
            CalibrationEngine,
        )
        from tests.test_workflow import _workflow

        sessions = SessionManager()
        recovery = offset_recovery.OffsetRecovery(hass_at(tmp_path), sessions)
        meter = replace(binding_with_offset_controls(0), connection_generation=2)
        session = StockSession(meter)

        async def marker(*args: Any) -> None:
            pass

        with pytest.raises((ValueError, RuntimeError)):
            await CalibrationEngine(
                sessions, marker, evidence_timeout=0.025
            ).async_calibrate_prepared_offset_board(
                MAC,
                session,
                meter,
                0,
                prepared,
                recovery,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
            )
        assert not any(event[0] == "button" for event in session.events)
        workflow, handle, _, _ = _workflow()
        workflow._sessions_owner = sessions
        workflow._offset_recovery = recovery
        status = await workflow.async_get_offset_preparation(handle.session_id)
        assert status["action_ready"] is False
        if revocation_fails:
            assert status["installed"] is True and status["cancelled"] is False

    asyncio.run(run())


def test_busy_config_cancel_rejects_without_revoking_live_workflow(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.session_manager import (
            CalibrationBusyError,
        )
        from tests.test_workflow import _workflow

        sessions, recovery, _builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        workflow, handle, _, _ = _workflow()
        workflow._sessions_owner = sessions
        workflow._offset_recovery = recovery
        handle.offset_preparation_id = prepared.operation_id
        await manager.async_confirm_write(preview.transaction_id, "admin")
        with pytest.raises(CalibrationBusyError):
            await workflow.async_cancel_session(handle.session_id)
        assert not handle.revoked and workflow._session(handle.session_id) is handle
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        await workflow.async_cancel_session(handle.session_id)
        assert not sessions.is_config_locked(MAC)

    asyncio.run(run())


@pytest.mark.parametrize("failure", ("replaced", "exception", "cancelled"))
def test_stale_or_failed_prewrite_guard_releases_config_lease(
    tmp_path: Path, failure: str
) -> None:
    async def run() -> None:
        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        if failure == "replaced":
            lease = await sessions.async_acquire_calibration(MAC)
            try:
                record = await recovery.async_load(lease)
                source = await builder.async_get_config("meter.yaml")
                plan = build_offset_table_mutation(
                    source,
                    _topology(),
                    {instance: ZERO for instance in prepared.targets},
                    {},
                    enable_calibration=frozenset(prepared.targets),
                )
                await recovery.async_prepare(
                    lease, record, source, plan, "f" * 32, 1, prepared.targets, 1
                )
            finally:
                lease.release()
        else:

            async def unavailable(configuration: str) -> Any:
                if failure == "cancelled":
                    raise asyncio.CancelledError
                raise RuntimeError("secret source must not be reflected")

            builder.async_get_config = unavailable
        with pytest.raises(
            asyncio.CancelledError if failure == "cancelled" else ValueError
        ) as raised:
            await manager.async_confirm_write(preview.transaction_id, "admin")
        assert "secret source" not in str(raised.value)
        assert "update" not in builder.calls
        assert not sessions.is_config_locked(MAC)
        assert not sessions.is_calibration_locked(MAC)

    asyncio.run(run())
