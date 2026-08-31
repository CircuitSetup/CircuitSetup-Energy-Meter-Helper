"""Private durable stock offset recovery boundaries."""

import asyncio
import json
from dataclasses import replace
from hashlib import sha256
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    OffsetTableSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from tests.test_config_mutator import _snapshot as base_snapshot
from tests.test_config_mutator import _topology

MAC = "aabbccddeeff"
OLD = ((-12, 31), (-13, 32), (-14, 33))


def _snapshot() -> Any:
    snapshot = base_snapshot()
    content = (
        "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter\n    version: '1'\n"
        + snapshot.content.replace(
            "substitutions:\n",
            "substitutions:\n  main_meter_name1: Main Meter 1\n  main_meter_name2: Main Meter 2\n",
        )
    )
    return replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )


def hass_at(path: Path) -> Any:
    async def executor(function: Any, *args: Any) -> Any:
        return await asyncio.to_thread(function, *args)

    return SimpleNamespace(
        config=SimpleNamespace(path=lambda *parts: str(path.joinpath(*parts))),
        async_add_executor_job=executor,
    )


def observed(instance: str = "meter_main1", generation: int = 1) -> OffsetTableSnapshot:
    return OffsetTableSnapshot(generation, instance, 1, OLD, "restored", False, False)


def test_backup_is_private_durable_and_reloaded_without_replacing_original(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )

        sessions = SessionManager()
        recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_backup(
                lease, _snapshot(), _topology(), (observed(),)
            )
            assert record.original.content == _snapshot().content
            assert record.observations[0].snapshot.phase_values == OLD
            assert "top-secret" not in repr(record)
            reloaded = await OffsetRecovery(hass_at(tmp_path), sessions).async_load(
                lease
            )
            assert reloaded == record
        finally:
            lease.release()

    asyncio.run(run())


@pytest.mark.parametrize("failure", ("write", "readback"))
def test_backup_failure_never_returns_a_durable_record(
    tmp_path: Path, monkeypatch: Any, failure: str
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper import offset_recovery

        def broken(
            path: str, data: bytes | str, private: bool = False, mode: str = "w"
        ) -> None:
            if failure == "write":
                raise OSError("secret-bearing storage error")
            assert private and mode == "wb"
            real(path, b"{}", private=private, mode=mode)

        real = offset_recovery.write_utf8_file_atomic
        monkeypatch.setattr(offset_recovery, "write_utf8_file_atomic", broken)
        sessions = SessionManager()
        recovery = offset_recovery.OffsetRecovery(hass_at(tmp_path), sessions)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            with pytest.raises(
                ValueError, match="recovery persistence failed"
            ) as caught:
                await recovery.async_backup(
                    lease, _snapshot(), _topology(), (observed(),)
                )
            assert "secret-bearing" not in str(caught.value)
            if failure == "readback":
                assert recovery._path(lease).read_bytes() == b"{}"
        finally:
            lease.release()

    asyncio.run(run())


def test_cancelled_backup_drains_disk_boundary_before_releasing_ownership(
    tmp_path: Path, monkeypatch: Any
) -> None:
    async def run() -> None:
        from threading import Event

        from custom_components.circuitsetup_energy_meter_helper import offset_recovery

        started, release = Event(), Event()
        real = offset_recovery.write_utf8_file_atomic

        def blocked(*args: Any, **kwargs: Any) -> None:
            started.set()
            release.wait(5)
            real(*args, **kwargs)

        monkeypatch.setattr(offset_recovery, "write_utf8_file_atomic", blocked)
        sessions = SessionManager()
        recovery = offset_recovery.OffsetRecovery(hass_at(tmp_path), sessions)

        async def backup() -> None:
            lease = await sessions.async_acquire_calibration(MAC)
            try:
                await recovery.async_backup(
                    lease, _snapshot(), _topology(), (observed(),)
                )
                pytest.fail("cancelled backup authorized a subsequent action")
            finally:
                lease.release()

        task = asyncio.create_task(backup())
        await asyncio.to_thread(started.wait, 2)
        task.cancel()
        await asyncio.sleep(0.01)
        assert sessions.is_config_locked(MAC) and not task.done()
        release.set()
        with pytest.raises(asyncio.CancelledError):
            await task
        assert not sessions.is_config_locked(MAC)

    asyncio.run(run())


def test_raw_offset_plan_preserves_other_stage_and_unselected_chip() -> None:
    from custom_components.circuitsetup_energy_meter_helper import config_mutator

    first = config_mutator.build_offset_table_mutation(
        _snapshot(),
        _topology(),
        {"meter_main2": OLD},
        {"meter_main1": OLD},
    )
    source = replace(
        _snapshot(),
        content=first.proposed_content,
        sha256=sha256(first.proposed_content.encode()).hexdigest(),
    )
    plan = config_mutator.build_offset_table_mutation(
        source,
        _topology(),
        {"meter_main1": ((0, 0), (0, 0), (0, 0))},
        {},
        enable_calibration=frozenset(("meter_main1",)),
    )
    assert "offset_voltage: -12" in plan.proposed_content
    assert "offset_active_power: -12" in plan.proposed_content
    assert "offset_voltage: 0" in plan.proposed_content
    assert (
        "  - id: !extend meter_main1\n    enable_offset_calibration: true\n"
        in plan.proposed_content
    )
    again = replace(
        source,
        content=plan.proposed_content,
        sha256=sha256(plan.proposed_content.encode()).hexdigest(),
    )
    assert (
        config_mutator.build_offset_table_mutation(
            again, _topology(), {}, {"meter_main2": OLD}
        ).proposed_content.count("enable_offset_calibration: true")
        == 1
    )
    assert (
        "top-secret" in plan.proposed_content and "top-secret" not in plan.redacted_diff
    )
    assert 'current_cal_ct1: "11143"' in plan.proposed_content


@pytest.mark.parametrize("stage", (1, 2))
def test_owner_candidate_plan_preserves_both_families_and_rejects_completed_targets(
    tmp_path: Path,
    stage: int,
) -> None:
    import yaml

    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        CapturedOffsetResult,
        OffsetRecovery,
        OffsetRecoveryRecord,
        SavedOffsetObservation,
    )

    source = _snapshot()
    record = OffsetRecoveryRecord(
        MAC,
        source,
        _topology(),
        (SavedOffsetObservation(source.sha256, observed()),),
        results=(
            CapturedOffsetResult(
                "meter_main1", 1, OLD, 2, "a" * 32, source.sha256, True
            ),
            CapturedOffsetResult(
                "meter_main1",
                2,
                ((0, 0), (-32768, 32767), (-1, 1)),
                2,
                "b" * 32,
                source.sha256,
                False,
            ),
        ),
    )
    recovery = OffsetRecovery(hass_at(tmp_path), SessionManager())
    plan = recovery.build_preparation_plan(record, source, stage, ("meter_main2",))
    parsed = yaml.load(plan.proposed_content, Loader=yaml.BaseLoader)
    chips = {item["id"]: item for item in parsed["sensor"] if "id" in item}
    assert chips["meter_main1"]["phase_a"]["offset_voltage"] == "-12"
    assert chips["meter_main1"]["phase_c"]["offset_current"] == "33"
    assert chips["meter_main1"]["phase_b"]["offset_active_power"] == "-32768"
    assert chips["meter_main1"]["phase_b"]["offset_reactive_power"] == "32767"
    first, second = (
        ("offset_voltage", "offset_current")
        if stage == 1
        else ("offset_active_power", "offset_reactive_power")
    )
    for phase in ("phase_a", "phase_b", "phase_c"):
        assert chips["meter_main2"][phase] == {first: "0", second: "0"}
    assert chips["meter_main2"]["enable_offset_calibration"] == "true"
    assert "enable_offset_calibration" not in chips["meter_main1"]
    assert parsed["substitutions"]["current_cal_ct1"] == "11143"
    assert "top-secret" not in plan.redacted_diff
    with pytest.raises(ValueError, match="complete"):
        recovery.build_preparation_plan(record, source, stage, ("meter_main1",))


@pytest.mark.parametrize(
    "bad", ({"meter_main1": ((True, 0), (0, 0), (0, 0))}, {"addon1_1": OLD})
)
def test_raw_offset_plan_rejects_untrusted_tables(bad: Any) -> None:
    from custom_components.circuitsetup_energy_meter_helper import config_mutator

    with pytest.raises(ValueError):
        config_mutator.build_offset_table_mutation(_snapshot(), _topology(), bad, {})


def test_preparation_refuses_unowned_enable_flag_that_could_override_zero_setup() -> (
    None
):
    from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
        build_offset_table_mutation,
    )

    source = _snapshot()
    content = source.content.replace(
        "sensor:\n",
        "sensor:\n  - id: !extend meter_main1\n    enable_offset_calibration: false\n",
    )
    source = replace(
        source, content=content, sha256=sha256(content.encode()).hexdigest()
    )
    with pytest.raises(ValueError, match="overrides"):
        build_offset_table_mutation(
            source,
            _topology(),
            {"meter_main1": ((0, 0),) * 3},
            {},
            enable_calibration=frozenset(("meter_main1",)),
        )


@pytest.mark.parametrize(
    "corruption",
    (
        "schema",
        "source",
        "table",
        "stage",
        "instance",
        "generation",
        "extra",
        "duplicate",
        "oversized",
    ),
)
def test_malformed_existing_private_record_never_resets(
    tmp_path: Path, corruption: str
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )

        sessions = SessionManager()
        recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            await recovery.async_backup(lease, _snapshot(), _topology(), (observed(),))
            path = recovery._path(lease)
            raw = json.loads(path.read_bytes())
            snapshot = raw["observations"][0]["snapshot"]
            if corruption == "schema":
                raw["schema"] = True
            elif corruption == "source":
                raw["original"]["content"] += "\n# drift"
            elif corruption == "table":
                snapshot["phase_values"][0][0] = 32768
            elif corruption == "stage":
                snapshot["offset_stage"] = True
            elif corruption == "instance":
                snapshot["instance_id"] = "addon6_1"
            elif corruption == "generation":
                snapshot["connection_generation"] = False
            elif corruption == "extra":
                raw["unexpected"] = "private"
            data = json.dumps(raw).encode()
            if corruption == "duplicate":
                data = data.replace(b'"schema":', b'"schema": 1, "schema":', 1)
                assert data.count(b'"schema":') == 2
            elif corruption == "oversized":
                data = b" " * (2 * 1048576 + 1)
            path.write_bytes(data)
            with pytest.raises(ValueError):
                await recovery.async_backup(
                    lease, _snapshot(), _topology(), (observed(),)
                )
            assert path.read_bytes() == data
        finally:
            lease.release()

    asyncio.run(run())


def test_persisted_receipt_is_not_action_permission_for_a_new_core_owner(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from tests.test_stock_offset_preparation import preparation
        from tests.test_workflow import _workflow

        sessions, recovery, _, manager, preview, prepared = await preparation(tmp_path)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            # Browser reload/native reconnect retain the same concrete Core owner.
            confirmed = await recovery.async_require(lease, prepared, installed=True)
            assert confirmed.installed and not confirmed.cancelled
            data = recovery._path(lease).read_bytes()
        finally:
            lease.release()
        restarted_sessions = SessionManager()
        restarted = OffsetRecovery(hass_at(tmp_path), restarted_sessions)
        lease = await restarted_sessions.async_acquire_calibration(MAC)
        try:
            with pytest.raises(ValueError):
                await restarted.async_require(lease, prepared, installed=True)
            retained = await restarted.async_load(lease)
            assert retained == confirmed
            assert restarted._path(lease).read_bytes() == data
        finally:
            lease.release()
        workflow, handle, _, _ = _workflow()
        workflow._sessions_owner = restarted_sessions
        workflow._offset_recovery = restarted
        status = await workflow.async_get_offset_preparation(handle.session_id)
        assert status["installed"] is True
        assert status["action_ready"] is False
        assert status["cancelled"] is False
        assert handle.stock_offset_pending
        workflow._sessions_owner = sessions
        workflow._offset_recovery = recovery
        assert (await workflow.async_get_offset_preparation(handle.session_id))[
            "action_ready"
        ] is True

    asyncio.run(run())
