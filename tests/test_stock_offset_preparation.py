"""Stock preparation uses the real reviewed transaction and durable recovery."""

import asyncio
import json
from dataclasses import replace
from hashlib import sha256
from pathlib import Path
from types import SimpleNamespace
from typing import Any
from uuid import uuid4

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


def _native_workflow(tmp_path: Path, addons: int = 0) -> tuple[Any, Any, Any, Any, Any]:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        OffsetRecovery,
    )
    from tests.test_workflow import _workflow

    workflow, handle, sessions, _ = _workflow()
    workflow._sessions.clear()
    handle.session_id = "b" * 32
    workflow._sessions[handle.session_id] = handle
    handle.binding = binding_with_offset_controls(addons)
    handle.topology = handle.binding.topology
    source = _snapshot(addons)
    if addons:
        content = source.content.replace(
            "name: circuitsetup.6c-energy-meter\n",
            "name: circuitsetup.6c-energy-meter-1-addon\n",
            1,
        )
        source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())
    handle.configuration, handle.configuration_sha256 = source.configuration, source.sha256
    session = StockSession(handle.binding)
    session.sessions = sessions
    session.snapshot_unknown = True
    workflow._api = session
    workflow._builder = Builder(remote_content=source.content)
    recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
    workflow.transactions = None
    handle.timing_policy = None  # type: ignore[assignment]
    workflow._calibration._evidence_timeout = 0.05
    return workflow, handle, session, recovery, sessions


def test_native_first_use_rechecks_newly_reported_saved_values(tmp_path: Path) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.workflow import (
            WorkflowCapabilityUnavailable,
        )
        from tests.test_offset_recovery import observed

        workflow, handle, session, recovery, sessions = _native_workflow(tmp_path)
        preview = await workflow.async_preview_offset_preparation(
            handle.session_id,
            0,
            1,
            backup_acknowledged=True,
        )
        session.snapshot_overrides[("meter_main1", 1)] = observed("meter_main1")
        with pytest.raises(WorkflowCapabilityUnavailable):
            await workflow.async_resume_offset_calibration(
                handle.session_id,
                preview["operation_id"],
                0,
                1,
                preparation_acknowledged=True,
            )
        assert not session.button_names
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record is not None
            assert any(
                item.snapshot.instance_id == "meter_main1"
                and item.snapshot.phase_values == observed().phase_values
                for item in record.observations
            )
        finally:
            lease.release()

    asyncio.run(run())


def test_native_run_blocks_only_stage_with_config_offsets(tmp_path: Path) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.workflow import (
            WorkflowHandleError,
        )
        from tests.test_offset_recovery import OLD

        workflow, handle, session, _recovery, _sessions = _native_workflow(tmp_path)
        builder = workflow._builder
        source = await builder.async_get_config("meter.yaml")
        plan = build_offset_table_mutation(
            source, handle.topology, {"meter_main1": OLD}, {},
        )
        builder.remote_content = plan.proposed_content
        handle.configuration_sha256 = sha256(builder.remote_content.encode()).hexdigest()
        blocked = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True,
        )
        with pytest.raises(WorkflowHandleError, match="offset values.*removed"):
            await workflow.async_resume_offset_calibration(
                handle.session_id, blocked["operation_id"], 0, 1,
                preparation_acknowledged=True,
            )
        assert session.button_names == []

        session.stage = 2
        allowed = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 2, backup_acknowledged=True,
        )
        result = await workflow.async_resume_offset_calibration(
            handle.session_id, allowed["operation_id"], 0, 2,
            preparation_acknowledged=True,
        )
        assert result.state.value == "captured_pending_configuration"

    asyncio.run(run())


def test_native_review_replaces_stale_unstarted_preview(tmp_path: Path) -> None:
    async def run() -> None:
        workflow, handle, _session, recovery, sessions = _native_workflow(tmp_path)
        first = await workflow.async_preview_offset_preparation(
            handle.session_id,
            0,
            1,
            backup_acknowledged=True,
        )
        source = await workflow._builder.async_get_config("meter.yaml")
        changed = replace(
            source,
            content=source.content + "\n# unrelated source edit\n",
            sha256=sha256((source.content + "\n# unrelated source edit\n").encode()).hexdigest(),
        )
        workflow._builder.remote_content = changed.content
        handle.configuration_sha256 = changed.sha256
        replacement = await workflow.async_preview_offset_preparation(
            handle.session_id,
            0,
            1,
            backup_acknowledged=True,
        )
        assert replacement["mode"] == "native"
        assert replacement["operation_id"] != first["operation_id"]
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record is not None
            assert record.original.sha256 == changed.sha256
            assert record.preparation is not None
            assert record.preparation.operation_id == replacement["operation_id"]
        finally:
            lease.release()

    asyncio.run(run())


def test_native_first_use_across_main_and_addon_uses_real_instance_ids(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        workflow, handle, session, _recovery, _sessions = _native_workflow(tmp_path, 1)

        for board, stage in ((0, 1), (1, 1), (0, 2), (1, 2)):
            session.stage = stage
            preview = await workflow.async_preview_offset_preparation(
                handle.session_id,
                board,
                stage,
                backup_acknowledged=True,
            )
            result = await workflow.async_resume_offset_calibration(
                handle.session_id,
                preview["operation_id"],
                board,
                stage,
                preparation_acknowledged=True,
            )
            assert result.state.value == "captured_pending_configuration"

        assert [name for name in session.button_names if "restore" in name] == []
        assert session.button_names == [
            "main_1.run_offset",
            "main_2.run_offset",
            "addon1_1.run_offset",
            "addon1_2.run_offset",
            "main_1.run_power_offset",
            "main_2.run_power_offset",
            "addon1_1.run_power_offset",
            "addon1_2.run_power_offset",
        ]

    asyncio.run(run())


def test_native_main_run_does_not_require_unselected_addon_mapping(tmp_path: Path) -> None:
    async def run() -> None:
        workflow, handle, session, _recovery, _sessions = _native_workflow(tmp_path, 1)
        builder = workflow._builder
        for group, pin in ((1, 0), (2, 16)):
            builder.remote_content = builder.remote_content.replace(
                "  - platform: atm90e32\n"
                f"    id: ${{addon1_id{group}}}\n    cs_pin: {pin}\n",
                "",
            )
        handle.configuration_sha256 = sha256(builder.remote_content.encode()).hexdigest()
        preview = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True,
        )
        result = await workflow.async_resume_offset_calibration(
            handle.session_id, preview["operation_id"], 0, 1,
            preparation_acknowledged=True,
        )
        assert result.state.value == "captured_pending_configuration"
        assert session.button_names == ["main_1.run_offset", "main_2.run_offset"]

    asyncio.run(run())


def test_native_stock_preparation_review_has_no_transaction_or_install(tmp_path: Path) -> None:
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
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = source.configuration, source.sha256
        session = StockSession(handle.binding)
        session.snapshot_unknown = True
        workflow._api = session
        builder = workflow._builder = Builder(remote_content=source.content)
        recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = None
        handle.timing_policy = None  # type: ignore[assignment]
        workflow._calibration._evidence_timeout = 0.05

        preview = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True,
        )

        assert preview["mode"] == "native"
        assert preview["transaction"] is None
        assert "write" not in builder.calls
        assert "compile" not in builder.calls
        assert "upload" not in builder.calls
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record is not None and record.preparation is not None
            assert record.preparation.mode == "native"
            assert record.preparation.transaction_id is None
            assert record.preparation.proposed_sha256 == source.sha256
            assert recovery.is_action_ready(record)
        finally:
            lease.release()

    asyncio.run(run())


def test_native_first_calibration_runs_both_stages_without_clear_or_install(
    tmp_path: Path,
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
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = source.configuration, source.sha256
        session = StockSession(handle.binding)
        session.sessions = sessions
        session.snapshot_unknown = True
        workflow._api = session
        builder = workflow._builder = Builder(remote_content=source.content)
        recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = None

        handle.timing_policy = None  # type: ignore[assignment]
        workflow._calibration._evidence_timeout = 0.05

        stage_one = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True,
        )
        result_one = await workflow.async_resume_offset_calibration(
            handle.session_id, stage_one["operation_id"], 0, 1,
            preparation_acknowledged=True,
        )
        assert result_one.state == "captured_pending_configuration"
        assert not result_one.error

        session.stage = 2
        stage_two = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 2, backup_acknowledged=True,
        )
        result_two = await workflow.async_resume_offset_calibration(
            handle.session_id, stage_two["operation_id"], 0, 2,
            preparation_acknowledged=True,
        )
        assert result_two.state == "captured_pending_configuration"
        assert not result_two.error
        clear_keys = {
            control.restore_offset.descriptor.key
            for control in handle.binding.offset_capability.controls
        } | {
            control.restore_power_offset.descriptor.key
            for control in handle.binding.offset_capability.controls
        }
        run_keys = {
            control.run_offset.descriptor.key
            for control in handle.binding.offset_capability.controls
        } | {
            control.run_power_offset.descriptor.key
            for control in handle.binding.offset_capability.controls
        }
        button_keys = [event[1] for event in session.events if event[0] == "button"]
        assert not set(button_keys) & clear_keys
        assert set(button_keys) == run_keys
        assert "write" not in builder.calls
        assert "compile" not in builder.calls
        assert "upload" not in builder.calls
        assert "restart" not in builder.calls
        assert stage_one["transaction"] is None and stage_two["transaction"] is None
        assert stage_one["mode"] == stage_two["mode"] == "native"
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record is not None
            assert len(record.results) == 4
            assert all(item.phase_values == ZERO for item in record.results)
        finally:
            lease.release()

    asyncio.run(run())


def test_native_mixed_first_and_saved_offsets_only_clears_saved_chip(
    tmp_path: Path,
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
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = source.configuration, source.sha256
        session = StockSession(handle.binding)
        session.sessions = sessions
        session.snapshot_overrides.update(
            {("meter_main1", stage): None for stage in (1, 2)}
        )
        workflow._api = session
        builder = workflow._builder = Builder(remote_content=source.content)
        recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = None
        handle.timing_policy = None  # type: ignore[assignment]
        workflow._calibration._evidence_timeout = 0.05

        review = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True,
        )
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record is not None and record.preparation is not None
            assert record.preparation.clear_targets == ("meter_main2",)
        finally:
            lease.release()
        result = await workflow.async_resume_offset_calibration(
            handle.session_id, review["operation_id"], 0, 1,
            preparation_acknowledged=True,
        )
        assert result.state == "captured_pending_configuration"
        button_keys = [event[1] for event in session.events if event[0] == "button"]
        assert button_keys == [
            handle.binding.offset_capability.controls[0].run_offset.descriptor.key,
            handle.binding.offset_capability.controls[1].restore_offset.descriptor.key,
            handle.binding.offset_capability.controls[1].run_offset.descriptor.key,
        ]
        assert "write" not in builder.calls
        assert "compile" not in builder.calls
        assert "upload" not in builder.calls

    asyncio.run(run())


@pytest.mark.parametrize("response", ("truncated", "malformed"))
def test_native_invalid_fresh_diagnostics_block_first_use_shortcut(
    tmp_path: Path, response: str
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from custom_components.circuitsetup_energy_meter_helper.workflow import (
            OffsetDiagnosticsIncomplete,
        )
        from tests.test_workflow import _workflow

        workflow, handle, sessions, _ = _workflow()
        workflow._sessions.clear()
        handle.session_id = "b" * 32
        workflow._sessions[handle.session_id] = handle
        handle.binding = binding_with_offset_controls(0)
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = source.configuration, source.sha256
        session = StockSession(handle.binding)

        async def invalid_snapshot(*args: Any, **kwargs: Any) -> Any:
            del args, kwargs
            return {"meter_main1": None} if response == "truncated" else []

        session.async_offset_table_snapshot = invalid_snapshot
        workflow._api = session
        workflow._builder = Builder(remote_content=source.content)
        recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = None

        with pytest.raises(OffsetDiagnosticsIncomplete):
            await workflow.async_preview_offset_preparation(
                handle.session_id,
                0,
                1,
                backup_acknowledged=True,
            )
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            assert await recovery.async_load(lease) is None
        finally:
            lease.release()

    asyncio.run(run())


def test_native_stale_fresh_diagnostics_block_preparation(tmp_path: Path) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from custom_components.circuitsetup_energy_meter_helper.workflow import (
            OffsetTablesUnavailable,
        )
        from tests.test_workflow import _workflow

        workflow, handle, sessions, _ = _workflow()
        workflow._sessions.clear()
        handle.session_id = "b" * 32
        workflow._sessions[handle.session_id] = handle
        handle.binding = binding_with_offset_controls(0)
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = source.configuration, source.sha256
        session = StockSession(handle.binding)

        async def stale_snapshot(
            targets: set[str], *, offset_stage: int, **kwargs: Any
        ) -> dict[str, Any]:
            del kwargs
            return {
                instance: replace(
                    observed(instance, session.connection_generation + 1),
                    offset_stage=offset_stage,
                )
                for instance in targets
            }

        session.async_offset_table_snapshot = stale_snapshot
        workflow._api = session
        workflow._builder = Builder(remote_content=source.content)
        workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = None

        with pytest.raises(OffsetTablesUnavailable):
            await workflow.async_preview_offset_preparation(
                handle.session_id,
                0,
                1,
                backup_acknowledged=True,
            )

    asyncio.run(run())


def test_native_saved_nonzero_clear_blocks_run_and_retains_backup(tmp_path: Path) -> None:
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
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = source.configuration, source.sha256
        session = StockSession(
            handle.binding,
            clear_values={
                ("meter_main1", 1): ((1, 2), (3, 4), (5, 6)),
            },
        )
        session.sessions = sessions
        workflow._api = session
        builder = workflow._builder = Builder(remote_content=source.content)
        recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = None
        handle.timing_policy = None  # type: ignore[assignment]
        workflow._calibration._evidence_timeout = 0.05

        review = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True
        )
        result = await workflow.async_resume_offset_calibration(
            handle.session_id, review["operation_id"], 0, 1, preparation_acknowledged=True
        )

        assert result.state.value in {"partial", "indeterminate"}
        assert result.error == (
            "Native clear restored nonzero configuration offsets; calibration was not run."
        )
        assert session.button_names == ["main_1.restore_offset"]
        assert "write" not in builder.calls
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record is not None
            assert record.results == ()
            assert record.attempted == ("meter_main1",)
            assert any(
                item.snapshot.phase_values == observed().phase_values
                for item in record.observations
            )
        finally:
            lease.release()

    asyncio.run(run())


def test_native_no_stored_clear_accepts_zero_response_without_restore_table(
    tmp_path: Path,
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
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = source.configuration, source.sha256
        session = StockSession(handle.binding, no_stored=True)
        session.sessions = sessions
        workflow._api = session
        builder = workflow._builder = Builder(remote_content=source.content)
        workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = None
        handle.timing_policy = None  # type: ignore[assignment]
        workflow._calibration._evidence_timeout = 0.05

        review = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True
        )
        result = await workflow.async_resume_offset_calibration(
            handle.session_id, review["operation_id"], 0, 1, preparation_acknowledged=True
        )

        assert result.state.value == "captured_pending_configuration"
        assert session.button_names == [
            "main_1.restore_offset",
            "main_1.run_offset",
            "main_2.restore_offset",
            "main_2.run_offset",
        ]
        assert not {"write", "compile", "upload", "restart"}.intersection(builder.calls)

    asyncio.run(run())


def test_native_first_use_runs_with_run_controls_when_clear_controls_are_absent(
    tmp_path: Path,
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
        full = binding_with_offset_controls(0)
        handle.binding = replace(
            full,
            offset_capability=replace(full.offset_capability, controls=()),
        )
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = source.configuration, source.sha256
        session = StockSession(handle.binding)
        session.snapshot_unknown = True
        session.sessions = sessions
        workflow._api = session
        workflow._builder = Builder(remote_content=source.content)
        workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = None
        handle.timing_policy = None  # type: ignore[assignment]
        workflow._calibration._evidence_timeout = 0.05

        review = await workflow.async_preview_offset_preparation(
            handle.session_id,
            0,
            1,
            backup_acknowledged=True,
        )
        result = await workflow.async_resume_offset_calibration(
            handle.session_id, review["operation_id"], 0, 1, preparation_acknowledged=True
        )

        assert result.state.value == "captured_pending_configuration"
        assert session.button_names == ["main_1.run_offset", "main_2.run_offset"]

    asyncio.run(run())


def test_native_disconnect_requires_new_review_before_run(tmp_path: Path) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from custom_components.circuitsetup_energy_meter_helper.workflow import (
            WorkflowHandleError,
        )
        from tests.test_workflow import _workflow

        workflow, handle, sessions, _ = _workflow()
        workflow._sessions.clear()
        handle.session_id = "b" * 32
        workflow._sessions[handle.session_id] = handle
        handle.binding = binding_with_offset_controls(0)
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = source.configuration, source.sha256
        session = StockSession(handle.binding)
        session.sessions = sessions
        workflow._api = session
        workflow._builder = Builder(remote_content=source.content)
        recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = None

        review = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True
        )
        old_operation = review["operation_id"]
        session.connection_generation = 2
        with pytest.raises(WorkflowHandleError):
            await workflow.async_resume_offset_calibration(
                handle.session_id, old_operation, 0, 1, preparation_acknowledged=True
            )
        assert not session.button_names

        rebound = replace(binding_with_offset_controls(0), connection_generation=2)
        handle.binding = rebound
        fresh = StockSession(rebound)
        fresh.sessions = sessions
        workflow._api = fresh
        replacement = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True
        )
        assert replacement["operation_id"] != old_operation
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record is not None
            assert recovery.is_action_ready(record, generation=2)
        finally:
            lease.release()

    asyncio.run(run())


def test_preparation_preserves_completed_chip_outside_remaining_targets(tmp_path: Path) -> None:
    async def run() -> None:
        from unittest.mock import AsyncMock

        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from tests.test_workflow import _workflow

        workflow, handle, sessions, _ = _workflow()
        workflow._sessions.clear()
        handle.session_id = "b" * 32
        workflow._sessions[handle.session_id] = handle
        handle.binding = binding_with_offset_controls(0)
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = source.configuration, source.sha256
        session = workflow._api = StockSession(handle.binding)
        workflow._builder = Builder(remote_content=source.content)
        recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = SimpleNamespace(async_preview=AsyncMock(return_value=None))
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            origin = sessions._begin_calibration_origin(lease, session, handle.binding, source)
            sessions.record_offset_calibration_group(
                lease, origin.operation_id, origin.revision, session, handle.binding,
                "meter_main1", 1, observed().phase_values,
            )
        finally:
            lease.release()

        preview = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True,
        )
        assert preview["targets"] == ("meter_main2",)
        assert session.snapshot_communication_scopes[-1] == (
            ("meter_main1",), frozenset({5}),
        )
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record is not None
            assert record.results[0].instance_id == "meter_main1"
            assert record.results[0].phase_values == observed().phase_values
        finally:
            lease.release()

    asyncio.run(run())


def test_first_stock_preparation_uses_source_for_both_stages_without_confirmation(
    tmp_path: Path,
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
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = (
            "meter.yaml",
            source.sha256,
        )
        session = StockSession(handle.binding)
        session.sessions = sessions
        session.snapshot_unknown = True
        workflow._api = session
        workflow._builder = Builder(remote_content=source.content)
        recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = ConfigTransactionManager(
            workflow._builder,
            Verifier(
                ReconnectEvidence(
                    MAC, handle.topology, {i: f"CT {i}" for i in range(1, 7)}, 6
                )
            ),
            Persistence(),
            sessions,
            offset_recovery=recovery,
        )

        preview = await workflow.async_preview_offset_preparation(
            handle.session_id,
            0,
            1,
            backup_acknowledged=True,
        )
        assert preview["backup_available"] is True
        assert preview["mode"] == "native"
        assert preview["transaction"] is None
        assert not session.events
        assert session.configuration_selections == []
        assert session.snapshot_communication_scopes == [
            (("meter_main1", "meter_main2"), frozenset((5, 4))),
            (("meter_main1", "meter_main2"), frozenset((5, 4))),
        ]
        assert "write" not in workflow._builder.calls
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record is not None and record.preparation is not None
            assert len(record.observations) == 4
            assert {
                (item.snapshot.instance_id, item.snapshot.offset_stage)
                for item in record.observations
            } == {
                (instance, stage)
                for instance in ("meter_main1", "meter_main2")
                for stage in (1, 2)
            }
            assert all(
                item.snapshot.reported_state == "first_calibration_configuration"
                and item.snapshot.phase_values == ZERO
                and item.source_sha256 == source.sha256
                for item in record.observations
            )
        finally:
            lease.release()

    asyncio.run(run())


def test_first_baseline_reuses_unchanged_values_for_stage_two_without_install(
    tmp_path: Path,
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
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = "meter.yaml", source.sha256
        session = StockSession(handle.binding)
        session.sessions = sessions
        session.snapshot_unknown = True
        workflow._api = session
        workflow._builder = Builder(remote_content=source.content)
        recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        verifier = Verifier(
            ReconnectEvidence(
                MAC, handle.topology, {i: f"CT {i}" for i in range(1, 7)}, 6
            )
        )
        workflow.transactions = ConfigTransactionManager(
            workflow._builder,
            verifier,
            Persistence(),
            sessions,
            offset_recovery=recovery,
        )

        first = await workflow.async_preview_offset_preparation(
            handle.session_id,
            0,
            1,
            backup_acknowledged=True,
        )
        assert first["mode"] == "native"
        assert first["transaction"] is None

        second = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 2, backup_acknowledged=True
        )

        assert second["targets"] == ("meter_main1", "meter_main2")
        assert verifier.expected_instance_ids_calls == []
        assert second["mode"] == "native"
        assert second["transaction"] is None
        assert not session.events

    asyncio.run(run())


def test_first_stock_preparation_uses_fresh_parser_health_evidence(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from tests.test_esphome_api import FakeClient, make_session
        from tests.test_workflow import _workflow

        workflow, handle, sessions, _ = _workflow()
        workflow._sessions.clear()
        handle.session_id = "b" * 32
        workflow._sessions[handle.session_id] = handle
        handle.binding = binding_with_offset_controls(0)
        source = _snapshot()
        handle.configuration, handle.configuration_sha256 = "meter.yaml", source.sha256
        session = StockSession(handle.binding)
        session.snapshot_unknown = True

        async def parser_snapshot(
            targets: set[str], *, offset_stage: int, **kwargs: Any
        ) -> dict[str, Any]:
            del kwargs
            client = FakeClient()
            native = make_session([client])
            await native.async_connect()
            try:
                pending = asyncio.create_task(
                    native.async_offset_table_snapshot(
                        targets,
                        offset_stage=offset_stage,
                        timeout=0.05,
                        require_communication=True,
                        expected_chip_count=len(handle.binding.groups),
                    )
                )
                await asyncio.sleep(0)
                assert client.on_log is not None
                client.on_log(
                    SimpleNamespace(
                        message=(
                            "[I][atm90e32:805] ATM90E32:\n"
                            "[I][atm90e32:805] CS Pin: GPIO5\n"
                            "[I][atm90e32:805] Update Interval: 5s\n"
                            "[I][atm90e32:805] ATM90E32:\n"
                            "[I][atm90e32:805] CS Pin: GPIO4\n"
                            "[I][atm90e32:805] Update Interval: 5s\n"
                        )
                    )
                )
                return await pending
            finally:
                await native.async_shutdown()

        session.async_offset_table_snapshot = parser_snapshot
        workflow._api = session
        workflow._builder = Builder(remote_content=source.content)
        recovery = workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = ConfigTransactionManager(
            workflow._builder,
            Verifier(
                ReconnectEvidence(
                    MAC, handle.topology, {i: f"CT {i}" for i in range(1, 7)}, 6
                )
            ),
            Persistence(),
            sessions,
            offset_recovery=recovery,
        )

        preview = await workflow.async_preview_offset_preparation(
            handle.session_id,
            0,
            1,
            backup_acknowledged=True,
        )
        assert preview["backup_available"] is True
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record is not None
            assert len(record.observations) == 4
            assert all(item.snapshot.phase_values == ZERO for item in record.observations)
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
        clear_values: dict[tuple[str, int], Any] | None = None,
    ) -> None:
        super().__init__(meter, stage)
        self.connection_generation = self.window_generation = (
            meter.connection_generation
        )
        self.log_lines: list[str] = []
        self.button_names: list[str] = []
        self.fail_second = fail_second
        self.enhanced = enhanced
        self.no_stored = no_stored
        self.clear_values = clear_values or {}
        self.snapshot_unknown = False
        self.snapshot_overrides: dict[tuple[str, int], Any] = {}
        self.configuration_selections: list[tuple[str, ...]] = []
        self.snapshot_communication_scopes: list[tuple[tuple[str, ...], frozenset[int]]] = []

    async def async_offset_table_snapshot(
        self, targets: set[str], *, offset_stage: int, **kwargs: Any
    ) -> dict[str, Any]:
        self.snapshot_communication_scopes.append(
            (tuple(sorted(targets)), frozenset(kwargs.get("expected_cs_pins", ())))
        )
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

    async def async_offset_configuration_selection(
        self, targets: set[str], **kwargs: Any
    ) -> dict[str, int]:
        del kwargs
        self.configuration_selections.append(tuple(sorted(targets)))
        return {instance: self.connection_generation for instance in targets}

    async def async_press_button(self, key: int, *, device_id: int = 0) -> None:
        await super().async_press_button(key, device_id=device_id)
        controls = (
            self.meter.offset_capability.controls
            or self.meter.offset_capability.run_controls
        )
        for index, (group, control) in enumerate(
            zip(self.meter.groups, controls, strict=True)
        ):
            instance = group.key.replace("main_", "meter_main")
            restore = (
                control.restore_offset
                if self.stage == 1 and hasattr(control, "restore_offset")
                else control.restore_power_offset
                if self.stage == 2 and hasattr(control, "restore_power_offset")
                else None
            )
            run = control.run_offset if self.stage == 1 else control.run_power_offset
            clear = restore is not None and key == restore.descriptor.key
            button = restore if clear else run
            if key != button.descriptor.key:
                continue
            self.button_names.append(button.descriptor.name)
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
            table = self.clear_values.get((instance, self.stage), ZERO) if clear else ZERO
            self.log_lines.extend(
                prefix + f"| {phase} | {values[0]} | {values[1]} |"
                for phase, values in zip("ABC", table, strict=True)
            )
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


async def _write_historical_preparation(
    recovery: Any,
    lease: Any,
    record: Any,
    source: Any,
    plan: Any,
    session_id: str,
    stage: int,
    targets: tuple[str, ...],
    generation: int,
) -> Any:
    """Load the old on-disk preparation shape used by legacy lifecycle tests."""
    from custom_components.circuitsetup_energy_meter_helper import offset_recovery
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        StockOffsetPreparation,
    )

    prepared = StockOffsetPreparation(
        uuid4().hex,
        record.revision + 1,
        uuid4().hex,
        session_id,
        source.sha256,
        sha256(plan.proposed_content.encode()).hexdigest(),
        stage,
        targets,
        generation,
    )
    historical = replace(
        record,
        revision=prepared.revision,
        preparation=prepared,
        installed=False,
        cancelled=False,
        attempted=(),
    )
    raw = json.loads(offset_recovery._encode(historical))
    raw["preparation"].pop("mode", None)
    raw["preparation"].pop("clear_targets", None)
    await recovery._write(
        recovery._path(lease),
        json.dumps(raw, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode(),
    )
    loaded = await recovery.async_load(lease)
    assert loaded is not None and loaded.preparation is not None
    assert loaded.preparation.mode == "legacy"
    return loaded.preparation


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
        prepared = await _write_historical_preparation(
            recovery,
            lease,
            record,
            source,
            plan,
            "a" * 32,
            1,
            ("meter_main1", "meter_main2"),
            1,
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
    "reported_state", ("first_calibration_configuration", "configuration")
)
def test_prepared_run_reuses_source_bound_backup_when_stock_table_is_absent(
    tmp_path: Path, reported_state: str
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
            CalibrationEngine,
        )
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            FIRST_CALIBRATION_CONFIGURATION,
        )

        sessions, recovery, builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            before = await recovery.async_load(lease)
            assert before is not None
            before = replace(
                before,
                observations=tuple(
                    replace(
                        item,
                        snapshot=replace(
                            item.snapshot,
                            reported_state=(
                                FIRST_CALIBRATION_CONFIGURATION
                                if reported_state == FIRST_CALIBRATION_CONFIGURATION
                                else "configuration"
                            ),
                        ),
                    )
                    for item in before.observations
                ),
            )
            await recovery._save(lease, before)
        finally:
            lease.release()
        meter = replace(binding_with_offset_controls(0), connection_generation=2)
        session = StockSession(meter)
        session.sessions = sessions
        session.snapshot_unknown = True
        snapshot_calls = 0
        real_snapshot = session.async_offset_table_snapshot

        async def absent_snapshot(*args: Any, **kwargs: Any) -> Any:
            nonlocal snapshot_calls
            snapshot_calls += 1
            return await real_snapshot(*args, **kwargs)

        session.async_offset_table_snapshot = absent_snapshot
        engine = CalibrationEngine(sessions, lambda *args: asyncio.sleep(0), evidence_timeout=0.025)
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
        assert snapshot_calls == 2
        assert session.snapshot_communication_scopes == [
            (("meter_main1",), frozenset({5})),
            (("meter_main2",), frozenset({4})),
        ]
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            after = await recovery.async_load(lease)
            assert after is not None
            assert after.original == before.original
            assert after.observations == before.observations
            assert {item.instance_id for item in after.results} == set(prepared.targets)
        finally:
            lease.release()
        assert session.snapshot_unknown is True

    asyncio.run(run())


@pytest.mark.parametrize(
    "missing", ("receipt", "generation", "snapshot_failure", "topology")
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


def test_native_prepared_run_rebinds_retained_pending_origin(tmp_path: Path) -> None:
    async def run() -> None:
        workflow, handle, session, recovery, sessions = _native_workflow(tmp_path)
        preview = await workflow.async_preview_offset_preparation(
            handle.session_id,
            0,
            1,
            backup_acknowledged=True,
        )
        source = _snapshot()
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            origin = sessions._begin_calibration_origin(
                lease, session, handle.binding, source
            )
            origin = sessions.record_calibration_group(
                lease,
                origin.operation_id,
                origin.revision,
                session,
                handle.binding,
                "meter_main1",
                ((100, 200),) * 3,
            )
        finally:
            lease.release()

        result = await workflow.async_resume_offset_calibration(
            handle.session_id,
            preview["operation_id"],
            0,
            1,
            preparation_acknowledged=True,
        )

        assert result.state.value == "captured_pending_configuration"
        pending = sessions.pending_calibration(MAC)
        assert pending is not None
        assert pending.revision == origin.revision + 1
        assert pending.gain_groups == (("meter_main1", ((100, 200),) * 3),)
        assert session.button_names == ["main_1.run_offset", "main_2.run_offset"]
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record is not None and record.preparation is not None
            assert record.preparation.mode == "native"
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
        assert preview["mode"] == "native"
        assert preview["transaction"] is None
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
            replacement = await _write_historical_preparation(
                recovery,
                lease,
                record,
                source,
                plan,
                "d" * 32,
                1,
                ("meter_main2",),
                2,
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
            fresh = await _write_historical_preparation(
                recovery,
                lease,
                retained,
                source,
                plan,
                "e" * 32,
                1,
                ("meter_main2",),
                3,
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
            prepared = await _write_historical_preparation(
                recovery,
                lease,
                record,
                source,
                plan,
                "c" * 32,
                1,
                ("meter_main2",),
                3,
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
            await _write_historical_preparation(
                recovery,
                lease,
                record,
                source,
                plan,
                "d" * 32,
                1,
                ("meter_main2",),
                1,
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
            prepared = await _write_historical_preparation(
                recovery,
                lease,
                retained,
                source,
                plan,
                "e" * 32,
                1,
                ("meter_main2",),
                2,
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
                {
                    instance: ZERO if prerequisite else observed().phase_values
                    for instance in prepared.targets
                },
                {instance: ZERO for instance in prepared.targets},
                enable_calibration=frozenset(prepared.targets),
            )
            prepared = await _write_historical_preparation(
                recovery,
                lease,
                record,
                source,
                plan,
                "e" * 32,
                2,
                prepared.targets,
                2,
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
                await _write_historical_preparation(
                    recovery,
                    lease,
                    record,
                    source,
                    plan,
                    "f" * 32,
                    1,
                    prepared.targets,
                    1,
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
