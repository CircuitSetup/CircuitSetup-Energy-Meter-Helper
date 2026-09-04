"""Stock YAML authority is distinct from captured values and register readback."""

import asyncio
from dataclasses import replace
from hashlib import sha256
from types import SimpleNamespace

import pytest
import yaml

from custom_components.circuitsetup_energy_meter_helper import config_mutator
from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    LogEvidenceError,
)
from tests.test_esphome_api import FakeClient, make_session
from tests.test_offset_recovery import MAC, OLD, _snapshot, _topology, observed


@pytest.mark.parametrize("known", (True, False))
def test_final_plan_uses_captured_table_and_known_other_stage_or_blocks(known):
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        CapturedOffsetResult,
        OffsetRecovery,
        OffsetRecoveryRecord,
        SavedOffsetObservation,
    )

    source = _snapshot()
    snapshots = (
        (observed(), replace(observed(), offset_stage=2)) if known else (observed(),)
    )
    record = OffsetRecoveryRecord(
        MAC,
        source,
        _topology(),
        tuple(SavedOffsetObservation(source.sha256, s) for s in snapshots),
        results=(
            CapturedOffsetResult(
                "meter_main1", 1, ZERO, 1, "a" * 32, source.sha256, False
            ),
        ),
    )
    if not known:
        with pytest.raises(ValueError, match="known"):
            OffsetRecovery.build_finalization_plan(record, source)
        return
    plan = OffsetRecovery.build_finalization_plan(record, source)
    parsed = yaml.load(plan.proposed_content, Loader=yaml.BaseLoader)
    chip = next(item for item in parsed["sensor"] if item.get("id") == "meter_main1")
    assert chip["enable_offset_calibration"] == "false"
    assert chip["phase_a"] == {
        "offset_voltage": "0",
        "offset_current": "0",
        "offset_active_power": "-12",
        "offset_reactive_power": "31",
    }
    assert not record.results[0].register_verified


ZERO = ((0, 0), (0, 0), (0, 0))
SELECTED = (
    "Power & Voltage/Current offset calibration is disabled. Using config file values."
)


@pytest.mark.parametrize("table", (ZERO, ((-32768, 32767), (-1, 0), (1, -2))))
def test_final_yaml_disables_both_stages_preserves_values_and_can_reenable(table):
    first = config_mutator.build_offset_table_mutation(
        _snapshot(),
        _topology(),
        {"meter_main2": OLD},
        {},
        enable_calibration=frozenset({"meter_main2"}),
    )
    source = replace(
        _snapshot(),
        content=first.proposed_content,
        sha256=sha256(first.proposed_content.encode()).hexdigest(),
    )
    final = config_mutator.build_offset_table_mutation(
        source,
        _topology(),
        {"meter_main1": table},
        {"meter_main1": OLD},
        enable_calibration={"meter_main1": False},
    )
    parsed = yaml.load(final.proposed_content, Loader=yaml.BaseLoader)
    chips = {item["id"]: item for item in parsed["sensor"] if "id" in item}
    assert chips["meter_main1"]["enable_offset_calibration"] == "false"
    assert chips["meter_main2"]["enable_offset_calibration"] == "true"
    for phase, (voltage, current), (active, reactive) in zip(
        "abc", table, OLD, strict=True
    ):
        assert chips["meter_main1"][f"phase_{phase}"] == {
            "offset_voltage": str(voltage),
            "offset_current": str(current),
            "offset_active_power": str(active),
            "offset_reactive_power": str(reactive),
        }
    assert parsed["substitutions"]["current_cal_ct1"] == "11143"
    assert "top-secret" not in final.redacted_diff
    final_source = replace(
        source,
        content=final.proposed_content,
        sha256=sha256(final.proposed_content.encode()).hexdigest(),
    )
    assert (
        config_mutator.build_offset_table_mutation(
            final_source, _topology(), {}, {"meter_main2": OLD}
        ).proposed_content.count("enable_offset_calibration: false")
        == 1
    )
    again = config_mutator.build_offset_table_mutation(
        final_source,
        _topology(),
        {"meter_main1": ZERO},
        {},
        enable_calibration=frozenset({"meter_main1"}),
    )
    assert "enable_offset_calibration: false" not in again.proposed_content


async def finalization_case(
    tmp_path, *, store=None, review_final=True, strict_power=False
):
    from tests.test_stock_offset_preparation import preparation

    sessions, recovery, builder, manager, preview, prepared = await preparation(
        tmp_path
    )
    if store is not None:
        manager._persistence = store
    await manager.async_confirm_write(preview.transaction_id, "admin")
    await manager.async_compile(preview.transaction_id)
    await manager.async_confirm_install(preview.transaction_id, "admin")
    source = await builder.async_get_config("meter.yaml")
    lease = await sessions.async_acquire_calibration(MAC)
    try:
        for instance in ("meter_main1", "meter_main2"):
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
        if strict_power:
            from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
                CapturedOffsetResult,
            )

            record = replace(
                record,
                results=(
                    *record.results,
                    CapturedOffsetResult(
                        "meter_main1",
                        2,
                        OLD,
                        2,
                        prepared.operation_id,
                        source.sha256,
                        True,
                    ),
                ),
            )
            await recovery._save(lease, record)
        if not review_final:
            return sessions, recovery, builder, manager, record, prepared
        plan = recovery.build_finalization_plan(record, source)
        final = await recovery.async_review_finalization(
            lease, record, source, plan, "a" * 32, 2
        )
    finally:
        lease.release()
    review = await manager.async_preview(
        MAC, _topology(), plan, source, offset_finalization=final
    )
    return sessions, recovery, builder, manager, review, final


@pytest.mark.parametrize("purpose", ("offset_preparation", "offset_finalization"))
def test_offset_preview_rejects_ordinary_metadata_authority_before_work(
    tmp_path, monkeypatch, purpose
):
    from copy import deepcopy

    from tests.test_stock_offset_preparation import preparation

    async def run():
        store = await current_store()
        if purpose == "offset_preparation":
            sessions, recovery, builder, manager, _, binding = await preparation(
                tmp_path, review=False
            )
            manager._persistence = store
        else:
            sessions, recovery, builder, manager, _, _ = await finalization_case(
                tmp_path, store=store, review_final=False
            )
        source = await builder.async_get_config("meter.yaml")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            if purpose == "offset_preparation":
                plan = recovery.build_preparation_plan(record, source, 1, binding.targets)
            else:
                plan = recovery.build_finalization_plan(record, source)
                binding = await recovery.async_review_finalization(
                    lease, record, source, plan, "a" * 32, 2
                )
        finally:
            lease.release()
        configuration = rehashed_configuration(
            await store.async_get_meter_configuration(MAC),
            sha256(plan.proposed_content.encode()).hexdigest(),
        )
        fingerprint_reads = []
        get_fingerprint = store.async_get_meter_record_fingerprint

        async def fingerprint(mac):
            fingerprint_reads.append(mac)
            return await get_fingerprint(mac)

        monkeypatch.setattr(store, "async_get_meter_record_fingerprint", fingerprint)
        before_store = deepcopy(store._store.data)
        before_builder = list(builder.calls)
        before_transactions = sessions._transactions()
        with pytest.raises(ValueError, match="ordinary"):
            await manager.async_preview(
                MAC, _topology(), plan, source,
                meter_configuration=configuration,
                reconcile_stale_metadata=True,
                **{purpose: binding},
            )
        assert fingerprint_reads == []
        assert builder.calls == before_builder
        assert sessions._transactions() == before_transactions
        assert store._store.data == before_store

        preview = await manager.async_preview(
            MAC, _topology(), plan, source, **{purpose: binding}
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        installed = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert installed.state.value == "verified"
        assert fingerprint_reads == []

    asyncio.run(run())


def test_final_receipt_requires_normal_install_and_retains_original_and_candidates(
    tmp_path,
):
    async def run():
        sessions, recovery, builder, manager, review, final = await finalization_case(
            tmp_path
        )
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_load(lease)
            assert record.finalization == final
            assert not record.final_installed
            assert not recovery.is_finalization_ready(record)
            assert not recovery.is_action_ready(record)
        finally:
            lease.release()
        await manager.async_confirm_write(review.transaction_id, "admin")
        await manager.async_compile(review.transaction_id)
        status = await manager.async_confirm_install(review.transaction_id, "admin")
        assert status.state.value == "verified"
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_require_finalization(
                lease, final, installed=True
            )
            assert record.original == _snapshot()
            assert len(record.results) == 2
            assert not any(result.register_verified for result in record.results)
            assert record.final_installed and not record.configuration_selected
        finally:
            lease.release()
        assert builder.calls.count("upload") == 2

    asyncio.run(run())


@pytest.mark.parametrize("failure", (None, "persistence", "revision"))
def test_gain_only_restart_retains_strict_offsets_under_original_claim(failure):
    from custom_components.circuitsetup_energy_meter_helper.session_manager import (
        SessionManager,
    )
    from tests.test_restart_verification import (
        CalibrationEngine,
        EntityCatalog,
        RestartSession,
        _ignore_marker,
        _prime_origin,
        _restore,
        bind_meter,
        substitutions,
        topology,
    )

    async def run():
        gains = ((7301, 28001), (7301, 28002), (7301, 28003))
        api = RestartSession({"meter_main1": _restore("meter_main1", gains)}, addons=0)
        binding = bind_meter(
            EntityCatalog(api.entities, 1), topology(0), substitutions(0)
        )
        sessions = SessionManager()
        await _prime_origin(
            sessions,
            api,
            binding,
            {"meter_main1": gains},
            offsets={"meter_main1": OLD},
            power_offsets={"meter_main2": OLD},
        )
        before = sessions.pending_calibration(MAC)
        persisted = []

        async def persist(record):
            assert sessions.pending_calibration(MAC).claimed_revision == before.revision
            if failure == "persistence":
                raise OSError("storage unavailable")
            if failure == "revision":
                current = sessions.pending_calibration(MAC)
                sessions._pending_calibrations[MAC] = replace(
                    current, revision=current.revision + 1
                )
            persisted.append(record)

        engine = CalibrationEngine(sessions, _ignore_marker, persist_verified=persist)
        if failure:
            with pytest.raises((OSError, RuntimeError)):
                await engine.async_verify_gains_after_restart(
                    MAC, api, binding, substitutions=substitutions(0)
                )
            after = sessions.pending_calibration(MAC)
            assert after.gain_groups == before.gain_groups
            assert after.offset_groups == before.offset_groups
            assert after.power_offset_groups == before.power_offset_groups
        else:
            result = await engine.async_verify_gains_after_restart(
                MAC, api, binding, substitutions=substitutions(0)
            )
            assert result.record.groups[0].phase_gains == gains
            assert not result.record.has_offset_calibration
            assert result.record.source_handoff_available
            after = sessions.pending_calibration(MAC)
            assert not after.gain_groups and after.offset_groups == before.offset_groups
            assert after.power_offset_groups == before.power_offset_groups
            assert after.operation_id == before.operation_id
            assert (
                after.revision == before.revision + 1 and after.claimed_revision is None
            )
            assert api.events[-1][1]["expected_categories"] == {"meter_main1": {"gain"}}
        assert sum(event[0] == "restart" for event in api.events) == 1

    asyncio.run(run())


@pytest.mark.parametrize(
    "failure",
    (
        None,
        "stale_metadata",
        "selection",
        "revision",
        "source",
        "unresolved",
        "post_selection_generation",
    ),
)
def test_mixed_gain_final_plan_uses_real_reservation_without_claiming_flash_clear(
    tmp_path, failure
):
    from tests.test_restart_verification import (
        CalibrationEngine,
        EntityCatalog,
        RestartSession,
        _ignore_marker,
        _prime_origin,
        _restore,
        bind_meter,
        substitutions,
    )

    async def run():
        store = await current_store()
        original_metadata = await store.async_get_meter_configuration(MAC)
        if failure == "stale_metadata":
            store._store.data["meters"][MAC]["config_sha256"] = "f" * 64
        from copy import deepcopy

        original_raw = deepcopy(store._store.data["meters"][MAC])
        sessions, recovery, builder, manager, record, _ = await finalization_case(
            tmp_path, store=store, review_final=False, strict_power=True
        )
        source = await builder.async_get_config("meter.yaml")
        prepared_metadata = await store.async_get_meter_configuration(MAC)
        if failure == "stale_metadata":
            assert prepared_metadata is None
            assert store._store.data["meters"][MAC] == original_raw
        else:
            assert prepared_metadata == rehashed_configuration(
                original_metadata, source.sha256
            )
        gains = ((7301, 28001), (7301, 28002), (7301, 28003))
        api = RestartSession({"meter_main1": _restore("meter_main1", gains)}, addons=0)
        binding = bind_meter(
            EntityCatalog(api.entities, 1), _topology(), substitutions(0)
        )
        power_offsets = {"meter_main1": OLD}
        await _prime_origin(
            sessions,
            api,
            binding,
            {"meter_main1": gains},
            power_offsets=power_offsets,
            snapshot=source,
        )
        from tests.test_workflow import _workflow

        workflow, handle, _, _ = _workflow()
        workflow._sessions.clear()
        handle.session_id = "c" * 32
        workflow._sessions[handle.session_id] = handle
        workflow._sessions_owner = sessions
        workflow._store, workflow._api, workflow._builder = store, api, builder
        workflow._offset_recovery, workflow.transactions = recovery, manager
        workflow._calibration = CalibrationEngine(
            sessions,
            _ignore_marker,
            persist_verified=store.async_save_verified_calibration,
        )
        handle.binding, handle.topology = binding, _topology()
        handle.substitutions = substitutions(0)
        handle.configuration, handle.configuration_sha256 = "meter.yaml", source.sha256
        handle.stock_offset_pending = True
        verified_record = await workflow.async_restart_and_verify_gains(
            handle.session_id
        )
        assert handle.stock_offset_pending and handle.state != "verified"
        with pytest.raises(KeyError, match="stock"):
            await workflow.async_restart_and_verify(handle.session_id)
        assert len(record.results) == 3

        async def snapshots(targets, *, offset_stage):
            return {
                instance: replace(
                    observed(instance, api.connection_generation),
                    offset_stage=offset_stage,
                )
                for instance in targets
            }

        api.async_offset_table_snapshot = snapshots
        reviewed = await workflow.async_preview_offset_finalization(
            handle.session_id, verification_id=verified_record.verification_id
        )
        review = reviewed["transaction"]
        if failure == "unresolved":
            lease = await sessions.async_acquire_calibration(MAC)
            try:
                pending = sessions.pending_calibration(MAC)
                sessions.record_offset_calibration_group(
                    lease,
                    pending.operation_id,
                    pending.revision,
                    api,
                    handle.binding,
                    "meter_main2",
                    2,
                    ZERO,
                )
                power_offsets["meter_main2"] = ZERO
            finally:
                lease.release()
        assert (
            sessions._get_transaction(review.transaction_id).meter_configuration is None
        ) == (failure == "stale_metadata")
        from tests.test_config_transaction import ReconnectEvidence, Verifier

        transaction = sessions._get_transaction(review.transaction_id)
        manager._verifier = Verifier(
            ReconnectEvidence(
                MAC,
                _topology(),
                {i: f"CT {i}" for i in range(1, 7)},
                6,
                transaction.expected_sensor_entities,
            )
        )
        assert not await store.async_claim_verified_calibration(
            MAC, verified_record.verification_id, "d" * 32
        )
        if failure == "source":
            builder.remote_content += "\n# changed before write\n"
            with pytest.raises(ValueError):
                await manager.async_confirm_write(review.transaction_id, "admin")
            assert await store.async_claim_verified_calibration(
                MAC, verified_record.verification_id, "d" * 32
            )
            return
        await manager.async_confirm_write(review.transaction_id, "admin")
        await manager.async_compile(review.transaction_id)
        installed = await manager.async_confirm_install(review.transaction_id, "admin")
        if failure == "stale_metadata":
            assert installed.state.value == "failed"
            assert store._store.data["meters"][MAC]["config_sha256"] == "f" * 64
            assert (
                store._store.data["meters"][MAC]["meter_configuration"]
                == original_raw["meter_configuration"]
            )
            assert not (
                await store.async_get_verified_calibration(MAC)
            ).source_handoff_firmware_installed
            assert sessions.pending_calibration(MAC).power_offset_groups
            return
        assert installed.state.value == "verified"
        rendered = yaml.load(builder.remote_content, Loader=yaml.BaseLoader)
        assert rendered["substitutions"]["current_cal_ct1"] == "28001"
        assert builder.remote_content.count("enable_offset_calibration: false") == 2
        saved = await store.async_get_verified_calibration(MAC)
        assert saved.source_authority.value == "saved_flash"
        assert saved.source_handoff_firmware_installed
        assert not saved.source_handoff_available and not saved.has_offset_calibration
        assert (
            sessions.pending_calibration(MAC).expected_phase_power_offsets
            == power_offsets
        )
        final_metadata = await store.async_get_meter_configuration(MAC)
        assert (
            final_metadata.config_sha256
            == sha256(builder.remote_content.encode()).hexdigest()
        )
        assert final_metadata.aggregates == original_metadata.aggregates
        native = make_session([SelectionClient()])
        await native.async_connect()
        native._state_tracker.connect(api.connection_generation)
        api.async_offset_configuration_selection = (
            native.async_offset_configuration_selection
        )
        before_pending = sessions.pending_calibration(MAC)
        if failure == "post_selection_generation":
            reconcile = recovery.async_reconcile_finalization

            async def changed_epoch(*args, **kwargs):
                result = await reconcile(*args, **kwargs)
                api.connection_generation += 1
                return result

            recovery.async_reconcile_finalization = changed_epoch
        if failure in ("selection", "revision", "post_selection_generation"):
            select = api.async_offset_configuration_selection

            async def rejected(targets, **kwargs):
                if failure == "selection":
                    raise LogEvidenceError("selection absent")
                current = sessions.pending_calibration(MAC)
                sessions._pending_calibrations[MAC] = replace(
                    current, revision=current.revision + 1
                )
                return await select(targets, **kwargs)

            if failure != "post_selection_generation":
                api.async_offset_configuration_selection = rejected
            with pytest.raises((KeyError, RuntimeError)):
                await workflow.async_reconcile_offset_finalization(
                    handle.session_id, reviewed["operation_id"], timeout=0.01
                )
            assert (
                sessions.pending_calibration(MAC).power_offset_groups
                == before_pending.power_offset_groups
            )
            assert handle.stock_offset_pending
            lease = await sessions.async_acquire_calibration(MAC)
            try:
                retained = await recovery.async_load(lease)
                assert not retained.configuration_selected
            finally:
                lease.release()
                await native.async_shutdown()
            return
        selected = await workflow.async_reconcile_offset_finalization(
            handle.session_id, reviewed["operation_id"], timeout=0.01
        )
        assert selected["configuration_selected"] and not selected["register_verified"]
        if failure == "unresolved":
            assert sessions.pending_calibration(MAC).expected_phase_power_offsets == {
                "meter_main2": ZERO
            }
            assert handle.stock_offset_pending
            await workflow.async_get_offset_finalization(handle.session_id)
            assert handle.stock_offset_pending
            with pytest.raises(KeyError, match="unresolved"):
                await workflow.async_begin_offset_cycle(
                    handle.session_id, backup_acknowledged=True, timeout=0.01
                )
        else:
            assert sessions.pending_calibration(MAC) is None
            assert not handle.stock_offset_pending
        assert (
            await store.async_get_verified_calibration(MAC)
        ).source_authority.value == "saved_flash"
        await native.async_shutdown()

    asyncio.run(run())


@pytest.mark.parametrize("failure", (None, "revision", "unselected", "unverified"))
def test_final_offset_consume_is_exact_and_preserves_unresolved_groups(
    tmp_path, failure
):
    from tests.test_restart_verification import (
        EntityCatalog,
        RestartSession,
        _prime_origin,
        bind_meter,
        substitutions,
    )

    async def run():
        sessions, recovery, builder, manager, review, final = await finalization_case(
            tmp_path
        )
        await manager.async_confirm_write(review.transaction_id, "admin")
        await manager.async_compile(review.transaction_id)
        await manager.async_confirm_install(review.transaction_id, "admin")
        api = make_session([SelectionClient()])
        await api.async_connect()
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_reconcile_finalization(
                lease,
                final,
                api,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
                timeout=0.01,
            )
        finally:
            lease.release()
        # Prior strict run proof is retained independently; stock tables stay unverified.
        record = replace(
            record,
            results=(
                replace(record.results[0], register_verified=failure != "unverified"),
                record.results[1],
            ),
        )
        native = RestartSession({}, addons=0)
        binding = bind_meter(
            EntityCatalog(native.entities, 1), _topology(), substitutions(0)
        )
        source = await builder.async_get_config("meter.yaml")
        await _prime_origin(
            sessions,
            native,
            binding,
            {},
            offsets={"meter_main1": ZERO},
            power_offsets={"meter_main2": OLD},
            snapshot=source,
        )
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            pending = sessions.claim_calibration_origin(lease, native, binding)
            if failure in ("revision", "unselected"):
                with pytest.raises(ValueError):
                    sessions.consume_finalized_offsets(
                        lease,
                        pending.operation_id,
                        pending.revision + int(failure == "revision"),
                        replace(record, configuration_selected=False)
                        if failure == "unselected"
                        else record,
                        source,
                    )
                assert sessions.pending_calibration(MAC) == pending
            else:
                sessions.consume_finalized_offsets(
                    lease, pending.operation_id, pending.revision, record, source
                )
                after = sessions.pending_calibration(MAC)
                assert after.expected_phase_offsets == (
                    {"meter_main1": ZERO} if failure == "unverified" else {}
                )
                assert after.expected_phase_power_offsets == {"meter_main2": OLD}
                assert after.claimed_revision is None
        finally:
            lease.release()
            await api.async_shutdown()

    asyncio.run(run())


class SelectionClient(FakeClient):
    def subscribe_logs(self, callback, *args, **kwargs):
        unsubscribe = super().subscribe_logs(callback, *args, **kwargs)
        if kwargs.get("dump_config"):
            for instance in ("meter_main1", "meter_main2"):
                callback(
                    SimpleNamespace(message=f"[CALIBRATION][{instance}] {SELECTED}")
                )
        return unsubscribe


def test_final_selection_and_explicit_new_cycle_archive_preserve_truth(tmp_path):
    async def run():
        sessions, recovery, builder, manager, review, final = await finalization_case(
            tmp_path
        )
        await manager.async_confirm_write(review.transaction_id, "admin")
        await manager.async_compile(review.transaction_id)
        await manager.async_confirm_install(review.transaction_id, "admin")
        api = make_session([SelectionClient()])
        await api.async_connect()
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            selected = await recovery.async_reconcile_finalization(
                lease,
                final,
                api,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
                timeout=0.01,
            )
            assert selected.configuration_selected
            assert not any(item.register_verified for item in selected.results)
            with pytest.raises(ValueError, match="acknowledgement"):
                await recovery.async_begin_new_cycle(
                    lease,
                    api,
                    source_reader=lambda: builder.async_get_config("meter.yaml"),
                    backup_acknowledged=False,
                    timeout=0.01,
                )
            current = await recovery.async_begin_new_cycle(
                lease,
                api,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
                backup_acknowledged=True,
                timeout=0.01,
            )
            assert not current.results and current.preparation is None
            assert current.original.content == builder.remote_content
            assert len(current.observations) == 4
            assert {item.snapshot.reported_state for item in current.observations} == {
                "configuration"
            }
            assert await recovery.async_load_archive(lease) == selected
            assert not recovery.is_action_ready(current)
        finally:
            lease.release()
            await api.async_shutdown()

    asyncio.run(run())


def test_workflow_final_review_install_selection_reload_and_explicit_next_cycle(
    tmp_path,
):
    from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
        ConfigTransactionManager,
        ReconnectEvidence,
    )
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        OffsetRecovery,
    )
    from tests.test_config_transaction import Builder, Persistence, Verifier
    from tests.test_offset_recovery import hass_at
    from tests.test_preflight import binding_with_offset_controls
    from tests.test_stock_offset_preparation import StockSession
    from tests.test_workflow import _workflow

    async def run():
        workflow, handle, sessions, _ = _workflow()
        workflow._sessions.clear()
        handle.session_id = "b" * 32
        workflow._sessions[handle.session_id] = handle
        handle.binding = binding_with_offset_controls(0)
        handle.configuration, handle.configuration_sha256 = (
            "meter.yaml",
            _snapshot().sha256,
        )
        stock = StockSession(handle.binding, fail_second=True)
        stock.sessions = sessions
        native = make_session([SelectionClient()])
        await native.async_connect()
        stock.async_offset_configuration_selection = (
            native.async_offset_configuration_selection
        )
        stock.hold_connection_generation = native.hold_connection_generation
        workflow._api = stock
        builder = workflow._builder = Builder(remote_content=_snapshot().content)
        workflow._offset_recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        workflow.transactions = ConfigTransactionManager(
            builder,
            Verifier(
                ReconnectEvidence(
                    MAC, handle.topology, {i: f"CT {i}" for i in range(1, 7)}, 6
                )
            ),
            Persistence(),
            sessions,
            offset_recovery=workflow._offset_recovery,
        )
        handle.timing_policy = SimpleNamespace(
            evidence_timeout_s=0.025, sensor_window_timeout_s=0.025
        )

        async def install(review):
            transaction_id = review["transaction"].transaction_id
            await workflow.transactions.async_confirm_write(transaction_id, "admin")
            await workflow.transactions.async_compile(transaction_id)
            assert (
                await workflow.transactions.async_confirm_install(
                    transaction_id, "admin"
                )
            ).state.value == "verified"

        review = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True
        )
        await install(review)
        assert (
            await workflow.async_resume_offset_calibration(
                handle.session_id,
                review["operation_id"],
                0,
                1,
                preparation_acknowledged=True,
            )
        ).state.value == "partial"
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            partial = await workflow._offset_recovery.async_load(lease)
            assert partial.preparation.targets == ("meter_main1", "meter_main2")
            assert tuple(item.instance_id for item in partial.results) == (
                "meter_main1",
            )
        finally:
            lease.release()
        with pytest.raises((KeyError, RuntimeError)):
            await workflow.async_preview_offset_finalization(handle.session_id)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            retained = await workflow._offset_recovery.async_load(lease)
            assert retained.finalization is None
            assert retained.results == partial.results
            assert retained.attempted == partial.attempted
            assert await workflow._offset_recovery.async_load_archive(lease) is None
        finally:
            lease.release()
        assert handle.stock_offset_pending
        stock.fail_second = False
        stock.snapshot_overrides[("meter_main1", 1)] = None
        review = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True
        )
        assert review["targets"] == ("meter_main2",)
        await install(review)
        assert (
            await workflow.async_resume_offset_calibration(
                handle.session_id,
                review["operation_id"],
                0,
                1,
                preparation_acknowledged=True,
            )
        ).state.value == "captured_pending_configuration"
        before = list(stock.events)
        final = await workflow.async_preview_offset_finalization(handle.session_id)
        assert stock.events == before
        assert "top-secret" not in repr(final)
        await install(final)
        pending = await workflow.async_get_offset_finalization(handle.session_id)
        assert pending["installed"] and not pending["configuration_selected"]
        selected = await workflow.async_reconcile_offset_finalization(
            handle.session_id, final["operation_id"], timeout=0.01
        )
        assert selected["configuration_selected"] and not selected["register_verified"]
        assert not handle.stock_offset_pending
        assert stock.events == before
        with pytest.raises(KeyError, match="stock"):
            await workflow.async_calibrate_offset(
                handle.session_id, 0, 1, preparation_acknowledged=True
            )
        await workflow.async_begin_offset_cycle(
            handle.session_id, backup_acknowledged=True, timeout=0.01
        )
        assert not handle.offset_results
        assert handle.stock_offset_pending
        stock.snapshot_unknown = True
        stock.snapshot_overrides.clear()
        next_review = await workflow.async_preview_offset_preparation(
            handle.session_id, 0, 1, backup_acknowledged=True
        )
        assert next_review["targets"] == ("meter_main1", "meter_main2")
        assert (
            "enable_offset_calibration: true"
            in sessions._get_transaction(
                next_review["transaction"].transaction_id
            ).plan.proposed_content
        )
        assert stock.events == before
        await native.async_shutdown()

    asyncio.run(run())


@pytest.mark.parametrize(
    "boundary",
    ("write", "compile", "after_compile", "upload", "receipt", "after_receipt"),
)
def test_finalization_source_fences_revoke_changed_sources(
    tmp_path, monkeypatch, boundary
):
    async def run():
        sessions, recovery, builder, manager, review, _final = await finalization_case(
            tmp_path
        )
        if boundary != "write":
            await manager.async_confirm_write(review.transaction_id, "admin")
        if boundary in ("upload", "receipt", "after_receipt"):
            await manager.async_compile(review.transaction_id)
        if boundary == "after_receipt":
            original = recovery._save

            async def save(lease, record):
                await original(lease, record)
                if record.final_installed and not record.final_cancelled:
                    builder.remote_content += "\n# source drift during receipt\n"

            monkeypatch.setattr(recovery, "_save", save)
        elif boundary in ("after_compile", "receipt"):
            operation = "compile" if boundary == "after_compile" else "upload"
            release = builder.pause(operation)

            async def drift():
                await builder.started[operation].wait()
                builder.remote_content += "\n# source drift\n"
                release.set()

            emitter = asyncio.create_task(drift())
        else:
            builder.remote_content += "\n# source drift\n"
        try:
            if boundary == "write":
                await manager.async_confirm_write(review.transaction_id, "admin")
            elif boundary in ("compile", "after_compile"):
                await manager.async_compile(review.transaction_id)
            else:
                status = await manager.async_confirm_install(
                    review.transaction_id, "admin"
                )
                assert status.state.value == "failed"
        except ValueError:
            pass
        if boundary in ("after_compile", "receipt"):
            await emitter
        await sessions.async_unload()
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from custom_components.circuitsetup_energy_meter_helper.session_manager import (
            SessionManager,
        )
        from tests.test_offset_recovery import hass_at

        owner = SessionManager()
        fresh = OffsetRecovery(hass_at(tmp_path), owner)
        lease = await owner.async_acquire_calibration(MAC)
        try:
            record = await fresh.async_load(lease)
            assert not record.configuration_selected
            assert not recovery.is_finalization_ready(record)
        finally:
            lease.release()

    asyncio.run(run())


@pytest.mark.parametrize("outcome", ("confirmed", "double_io", "late_cancel"))
def test_new_owner_needs_identical_source_review_install_even_for_surviving_receipt(
    tmp_path, monkeypatch, outcome
):
    from threading import Event

    from custom_components.circuitsetup_energy_meter_helper import offset_recovery
    from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
        ConfigTransactionManager,
    )
    from tests.test_config_transaction import Persistence
    from tests.test_offset_recovery import hass_at

    async def run():
        sessions, _recovery, builder, manager, review, final = await finalization_case(
            tmp_path
        )
        await manager.async_confirm_write(review.transaction_id, "admin")
        await manager.async_compile(review.transaction_id)
        real = offset_recovery.write_utf8_file_atomic
        started, release = Event(), Event()

        def write(path, data, **kwargs):
            if b'"final_installed":true' in data:
                if outcome == "double_io":
                    real(path, data, **kwargs)
                    raise OSError("uncertain readback")
                if outcome == "late_cancel" and b'"final_cancelled":false' in data:
                    started.set()
                    release.wait(3)
            if outcome == "double_io" and b'"final_cancelled":true' in data:
                raise OSError("revocation unavailable")
            real(path, data, **kwargs)

        monkeypatch.setattr(offset_recovery, "write_utf8_file_atomic", write)
        if outcome == "late_cancel":
            task = asyncio.create_task(
                manager.async_confirm_install(review.transaction_id, "admin")
            )
            assert await asyncio.to_thread(started.wait, 2)
            task.cancel()
            await asyncio.sleep(0.01)
            assert not task.done() and sessions.is_config_locked(MAC)
            release.set()
            with pytest.raises(asyncio.CancelledError):
                await task
        else:
            result = await manager.async_confirm_install(review.transaction_id, "admin")
            assert result.state.value == (
                "verified" if outcome == "confirmed" else "failed"
            )
        monkeypatch.setattr(offset_recovery, "write_utf8_file_atomic", real)
        fresh = offset_recovery.OffsetRecovery(hass_at(tmp_path), sessions)
        source = await builder.async_get_config("meter.yaml")
        api = make_session([SelectionClient()])
        await api.async_connect()
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await fresh.async_load(lease)
            assert not fresh.is_finalization_ready(record)
            with pytest.raises(ValueError):
                await fresh.async_reconcile_finalization(
                    lease,
                    final,
                    api,
                    source_reader=lambda: builder.async_get_config("meter.yaml"),
                    timeout=0.01,
                )
            plan = fresh.build_finalization_plan(record, source)
            assert plan.proposed_content == source.content
            replacement = await fresh.async_review_finalization(
                lease, record, source, plan, "e" * 32, 1
            )
        finally:
            lease.release()
        manager = ConfigTransactionManager(
            builder, manager._verifier, Persistence(), sessions, offset_recovery=fresh
        )
        review = await manager.async_preview(
            MAC, _topology(), plan, source, offset_finalization=replacement
        )
        await manager.async_confirm_write(review.transaction_id, "admin")
        await manager.async_compile(review.transaction_id)
        assert (
            await manager.async_confirm_install(review.transaction_id, "admin")
        ).state.value == "verified"
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            assert (
                await fresh.async_reconcile_finalization(
                    lease,
                    replacement,
                    api,
                    source_reader=lambda: builder.async_get_config("meter.yaml"),
                    timeout=0.01,
                )
            ).configuration_selected
        finally:
            lease.release()
            await api.async_shutdown()

    asyncio.run(run())


def test_replaced_candidate_table_cannot_reuse_an_exact_final_review(tmp_path):
    import json

    async def run():
        (
            sessions,
            recovery,
            _builder,
            _manager,
            _review,
            _final,
        ) = await finalization_case(tmp_path)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            path = recovery._path(lease)
            payload = json.loads(path.read_bytes())
            payload["results"][0]["phase_values"][0][0] = 12
            path.write_text(json.dumps(payload), encoding="utf-8")
            with pytest.raises(ValueError, match="invalid"):
                await recovery.async_load(lease)
        finally:
            lease.release()

    asyncio.run(run())


async def current_store():
    from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
        _trusted_meter_record,
    )
    from custom_components.circuitsetup_energy_meter_helper.store import HelperStore
    from tests.test_store import _configuration, _CopyingStorage

    store = object.__new__(HelperStore)
    store._update_lock = asyncio.Lock()
    store._store = _CopyingStorage()
    source = _snapshot()
    await store.async_save_meter(_trusted_meter_record(MAC, _topology(), source))
    from custom_components.circuitsetup_energy_meter_helper.models import (
        StoredCTSelection,
    )

    configuration = replace(
        _configuration(),
        config_sha256=source.sha256,
        ct_selections=tuple(
            StoredCTSelection(i, "ct", None, 11143, 1.0, source.sha256)
            for i in range(1, 7)
        ),
    )
    await store.async_save_verified_meter_configuration(
        MAC, source.sha256, configuration
    )
    return store


def rehashed_configuration(configuration, source_hash):
    return replace(
        configuration,
        config_sha256=source_hash,
        ct_selections=tuple(
            replace(item, config_sha256=source_hash)
            for item in configuration.ct_selections
        ),
    )


@pytest.mark.parametrize("stale", (False, True))
def test_real_store_pure_final_and_next_cycle_preserve_only_current_metadata(
    tmp_path, stale
):
    from copy import deepcopy

    async def run():
        store = await current_store()
        original = await store.async_get_meter_configuration(MAC)
        if stale:
            store._store.data["meters"][MAC]["config_sha256"] = "f" * 64
        before = deepcopy(store._store.data)
        sessions, recovery, builder, manager, review, final = await finalization_case(
            tmp_path, store=store
        )
        await manager.async_confirm_write(review.transaction_id, "admin")
        await manager.async_compile(review.transaction_id)
        assert (
            await manager.async_confirm_install(review.transaction_id, "admin")
        ).state.value == "verified"
        if stale:
            assert store._store.data == before
        else:
            assert await store.async_get_meter_configuration(
                MAC
            ) == rehashed_configuration(original, final.proposed_sha256)
            assert {
                item.config_sha256 for item in await store.async_get_ct_selections(MAC)
            } == {final.proposed_sha256}
        native = make_session([SelectionClient()])
        await native.async_connect()
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            await recovery.async_reconcile_finalization(
                lease,
                final,
                native,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
                timeout=0.01,
            )
            await recovery.async_begin_new_cycle(
                lease,
                native,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
                backup_acknowledged=True,
                timeout=0.01,
            )
            if stale:
                assert store._store.data == before
            else:
                assert await store.async_get_meter_configuration(
                    MAC
                ) == rehashed_configuration(original, final.proposed_sha256)
        finally:
            lease.release()
            await native.async_shutdown()

    asyncio.run(run())


@pytest.mark.parametrize("invalid", (None, "stale", "malformed", "topology", "missing"))
def test_offset_source_only_store_advance_preserves_semantics_or_leaves_unknown_untouched(
    invalid,
):
    from copy import deepcopy

    from custom_components.circuitsetup_energy_meter_helper.store import HelperStore
    from tests.test_store import _configuration, _CopyingStorage, _record

    async def run():
        store = object.__new__(HelperStore)
        store._update_lock = asyncio.Lock()
        store._store = _CopyingStorage()
        record = _record(_snapshot().sha256)
        await store.async_save_meter(record)
        config = replace(_configuration(), config_sha256=record.config_sha256)
        await store.async_save_verified_meter_configuration(
            MAC, record.config_sha256, config
        )
        raw = store._store.data["meters"][MAC]
        raw["unrelated_future_field"] = {"keep": [1, 2, 3]}
        if invalid == "stale":
            raw["config_sha256"] = "d" * 64
        elif invalid == "malformed":
            raw["meter_configuration"]["channels"] = "not channels"
        elif invalid == "topology":
            raw["topology"]["connection_type"] = "ethernet"
        elif invalid == "missing":
            store._store.data["meters"].clear()
        before = deepcopy(store._store.data)
        changed = await store.async_advance_offset_configuration_source(
            MAC, record.config_sha256, "e" * 64, record
        )
        if invalid:
            assert not changed and store._store.data == before
        else:
            assert changed
            expected = deepcopy(before)
            expected["meters"][MAC]["config_sha256"] = "e" * 64
            expected["meters"][MAC]["meter_configuration"]["config_sha256"] = "e" * 64
            assert store._store.data == expected
            assert await store.async_get_meter_configuration(MAC) == replace(
                config, config_sha256="e" * 64
            )

    asyncio.run(run())


@pytest.mark.parametrize("phase", ("preparation", "final"))
@pytest.mark.parametrize("failure", ("io", "cancel"))
def test_real_store_persistence_failure_never_grants_offset_receipt(
    tmp_path, phase, failure
):
    from tests.test_stock_offset_preparation import preparation

    async def run():
        store = await current_store()
        if phase == "preparation":
            sessions, recovery, _builder, manager, review, _ = await preparation(
                tmp_path
            )
            manager._persistence = store
        else:
            sessions, recovery, _builder, manager, review, _ = await finalization_case(
                tmp_path, store=store
            )
        started, release = asyncio.Event(), asyncio.Event()
        save = store._store.async_save

        async def fail(data):
            if failure == "io":
                raise OSError("private persistence failure")
            started.set()
            await release.wait()
            await save(data)

        store._store.async_save = fail
        await manager.async_confirm_write(review.transaction_id, "admin")
        await manager.async_compile(review.transaction_id)
        if failure == "cancel":
            task = asyncio.create_task(
                manager.async_confirm_install(review.transaction_id, "admin")
            )
            await started.wait()
            task.cancel()
            await asyncio.sleep(0)
            assert not task.done() and sessions.is_config_locked(MAC)
            release.set()
            with pytest.raises(asyncio.CancelledError):
                await task
        else:
            assert (
                await manager.async_confirm_install(review.transaction_id, "admin")
            ).state.value == "failed"
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            retained = await recovery.async_load(lease)
            assert (
                not recovery.is_action_ready(retained)
                if phase == "preparation"
                else not recovery.is_finalization_ready(retained)
            )
            assert not retained.configuration_selected
            assert retained.original == _snapshot()
        finally:
            lease.release()

    asyncio.run(run())


@pytest.mark.parametrize(
    "boundary",
    (
        "archive_io",
        "archive_cancel",
        "active_io",
        "active_cancel",
        "after_active_source",
        "malformed",
        "wrong_owner",
        "unfinished",
    ),
)
def test_new_cycle_archive_is_explicit_bounded_and_recoverable(
    tmp_path, monkeypatch, boundary
):
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        _encode,
    )

    async def run():
        sessions, recovery, builder, manager, review, final = await finalization_case(
            tmp_path
        )
        await manager.async_confirm_write(review.transaction_id, "admin")
        await manager.async_compile(review.transaction_id)
        await manager.async_confirm_install(review.transaction_id, "admin")
        api = make_session([SelectionClient()])
        await api.async_connect()
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            selected = await recovery.async_reconcile_finalization(
                lease,
                final,
                api,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
                timeout=0.01,
            )
            archive = recovery._path(lease).with_suffix(".previous.json")
            if boundary in ("malformed", "wrong_owner", "unfinished"):
                if boundary == "malformed":
                    data = b"{invalid private bytes"
                else:
                    data = _encode(
                        replace(selected, mac="112233445566")
                        if boundary == "wrong_owner"
                        else replace(
                            selected,
                            configuration_selected=False,
                            revision=selected.revision - 1,
                        )
                    )
                await recovery._write(archive, data)
            write = recovery._write
            triggered = False

            async def intercepted(path, data):
                nonlocal triggered
                if not triggered and (
                    ("archive" in boundary and path == archive)
                    or ("active" in boundary and path != archive)
                ):
                    triggered = True
                    if boundary == "after_active_source":
                        await write(path, data)
                        builder.remote_content += "\n# moved during new cycle\n"
                        return
                    if boundary.endswith("cancel"):
                        await write(path, data)
                        raise asyncio.CancelledError
                    raise OSError("private archive persistence failure")
                await write(path, data)

            monkeypatch.setattr(recovery, "_write", intercepted)
            with pytest.raises((ValueError, OSError, asyncio.CancelledError)):
                await recovery.async_begin_new_cycle(
                    lease,
                    api,
                    source_reader=lambda: builder.async_get_config("meter.yaml"),
                    backup_acknowledged=True,
                    timeout=0.01,
                )
            assert await recovery.async_load(lease) == selected
            if boundary in ("malformed", "wrong_owner", "unfinished"):
                assert recovery._read(archive) == data
            elif boundary.startswith("active") or boundary == "after_active_source":
                assert await recovery.async_load_archive(lease) == selected
                if boundary != "after_active_source":
                    # Archive succeeded, active replacement did not: exact retry is idempotent.
                    await recovery.async_begin_new_cycle(
                        lease,
                        api,
                        source_reader=lambda: builder.async_get_config("meter.yaml"),
                        backup_acknowledged=True,
                        timeout=0.01,
                    )
                    assert await recovery.async_load_archive(lease) == selected
        finally:
            lease.release()
            await api.async_shutdown()

    asyncio.run(run())


@pytest.mark.parametrize("boundary", ("selection", "archive", "source"))
def test_new_cycle_rejects_post_selection_generation_change(
    tmp_path, monkeypatch, boundary
):
    from custom_components.circuitsetup_energy_meter_helper.esphome_api import (
        ESPHomeSessionDisconnectedError,
    )
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        _encode,
    )

    async def run():
        sessions, recovery, builder, manager, review, final = await finalization_case(
            tmp_path
        )
        await manager.async_confirm_write(review.transaction_id, "admin")
        await manager.async_compile(review.transaction_id)
        await manager.async_confirm_install(review.transaction_id, "admin")
        api = make_session([SelectionClient()])
        await api.async_connect()
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            selected = await recovery.async_reconcile_finalization(
                lease,
                final,
                api,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
                timeout=0.01,
            )
            archive = recovery._path(lease).with_suffix(".previous.json")
            prior = replace(
                selected,
                finalization=replace(
                    final, operation_id="f" * 32, transaction_id="e" * 32
                ),
            )
            await recovery._write(archive, _encode(prior))
            active_bytes, prior_bytes = (
                recovery._read(recovery._path(lease)),
                recovery._read(archive),
            )
            reconcile, load_archive = (
                recovery.async_reconcile_finalization,
                recovery.async_load_archive,
            )
            reconciled = False

            async def after_selection(*args, **kwargs):
                nonlocal reconciled
                result = await reconcile(*args, **kwargs)
                reconciled = True
                if boundary == "selection":
                    api._state_tracker.connect(api.connection_generation + 1)
                return result

            async def after_archive(*args, **kwargs):
                result = await load_archive(*args, **kwargs)
                if boundary == "archive":
                    api._state_tracker.connect(api.connection_generation + 1)
                return result

            async def read_source():
                source = await builder.async_get_config("meter.yaml")
                if boundary == "source" and reconciled:
                    api._state_tracker.connect(api.connection_generation + 1)
                return source

            monkeypatch.setattr(
                recovery, "async_reconcile_finalization", after_selection
            )
            monkeypatch.setattr(recovery, "async_load_archive", after_archive)
            with pytest.raises(ESPHomeSessionDisconnectedError):
                await recovery.async_begin_new_cycle(
                    lease,
                    api,
                    source_reader=read_source,
                    backup_acknowledged=True,
                    timeout=0.01,
                )
            assert reconciled
            assert recovery._read(recovery._path(lease)) == active_bytes
            assert recovery._read(archive) == prior_bytes
            assert await recovery.async_load(lease) == selected
        finally:
            lease.release()
            await api.async_shutdown()

    asyncio.run(run())


def test_legacy_task7_recovery_load_does_not_rotate_or_rewrite(tmp_path):
    import json

    from tests.test_stock_offset_preparation import preparation

    async def run():
        sessions, recovery, _builder, _manager, _review, _prepared = await preparation(
            tmp_path
        )
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            current = await recovery.async_load(lease)
            path = recovery._path(lease)
            raw = json.loads(path.read_bytes())
            for key in (
                "finalization",
                "final_installed",
                "final_cancelled",
                "configuration_selected",
            ):
                raw.pop(key)
            raw["schema"] = 1
            legacy = json.dumps(raw).encode()
            path.write_bytes(legacy)
            assert await recovery.async_load(lease) == current
            assert path.read_bytes() == legacy
            assert await recovery.async_load_archive(lease) is None
        finally:
            lease.release()

    asyncio.run(run())


def test_disabled_flag_requires_both_exact_stage_tables():
    with pytest.raises(ValueError, match="both"):
        config_mutator.build_offset_table_mutation(
            _snapshot(),
            _topology(),
            {"meter_main1": ZERO},
            {},
            enable_calibration={"meter_main1": False},
        )


@pytest.mark.parametrize(
    "extra",
    (
        "",
        "[E][atm90e32:414]: Communication failed",
        "[W][atm90e32:118]: SPI read mismatch",
        "[CALIBRATION][meter_main1] Restored offset calibration from memory",
        "[CALIBRATION][meter_main1] Power offset mismatch: using flash values",
        "[CALIBRATION][meter_main1] Offset readback failed for Phase A:",
        f"[CALIBRATION][meter_main1][CALIBRATION][meter_main2] {SELECTED}",
        f"[CALIBRATION][meter_main1] {SELECTED}",
    ),
)
def test_configuration_selection_uses_full_raw_callback_window(extra):
    async def run():
        client = FakeClient()
        api = make_session([client], max_log_lines=1, max_log_bytes=120)
        await api.async_connect()
        pending = asyncio.create_task(
            api.async_offset_configuration_selection(
                {"meter_main1", "meter_main2"},
                timeout=0.03,
            )
        )
        await asyncio.sleep(0)
        for instance in ("meter_main1", "meter_main2"):
            client.on_log(
                SimpleNamespace(
                    message=f"[I][atm90e32:366]: [CALIBRATION][{instance}] {SELECTED}"
                )
            )
        await asyncio.sleep(0)
        assert not pending.done()  # Positive labels cannot end the observation window.
        if extra:
            client.on_log(SimpleNamespace(message=extra))
            with pytest.raises(LogEvidenceError):
                await pending
        else:
            assert await pending == {"meter_main1": 1, "meter_main2": 1}
        assert client.log_unsubscribed == 2
        await api.async_shutdown()

    asyncio.run(run())


@pytest.mark.parametrize("failure", ("generation", "cancel", "overflow", "client"))
def test_selection_capture_rejects_lost_epoch_cancellation_and_overflow(failure):
    from custom_components.circuitsetup_energy_meter_helper.esphome_api import (
        ESPHomeApiRepairRequired,
        ESPHomeSessionDisconnectedError,
    )

    async def run():
        client = FakeClient()
        api = make_session([client])
        await api.async_connect()
        pending = asyncio.create_task(
            api.async_offset_configuration_selection({"meter_main1"}, timeout=0.03)
        )
        await asyncio.sleep(0)
        client.on_log(SimpleNamespace(message=f"[CALIBRATION][meter_main1] {SELECTED}"))
        if failure == "generation":
            api._state_tracker.connect(api.connection_generation + 1)
        elif failure == "client":
            api._client = FakeClient()
        elif failure == "cancel":
            pending.cancel()
        else:
            client.on_log(SimpleNamespace(message="x" * (512 * 1024 + 1)))
        expected = (
            asyncio.CancelledError
            if failure == "cancel"
            else ESPHomeApiRepairRequired
            if failure == "overflow"
            else ESPHomeSessionDisconnectedError
        )
        with pytest.raises(expected):
            await pending
        await api.async_shutdown()

    asyncio.run(run())


@pytest.mark.parametrize(
    "message",
    (
        SELECTED,
        "[CALIBRATION][meter_main1] Gain calibration is disabled",
        "[CALIBRATION][meter_main1] Power & Voltage/Current offset calibration is disabled.",
        f"[CALIBRATION][meter_main1] not {SELECTED}",
    ),
)
def test_configuration_selection_rejects_missing_or_inexact_native_wording(message):
    async def run():
        client = FakeClient()
        api = make_session([client])
        await api.async_connect()
        pending = asyncio.create_task(
            api.async_offset_configuration_selection(
                {"meter_main1"},
                timeout=0.01,
            )
        )
        await asyncio.sleep(0)
        client.on_log(SimpleNamespace(message=message))
        with pytest.raises(LogEvidenceError):
            await pending
        await api.async_shutdown()

    asyncio.run(run())
