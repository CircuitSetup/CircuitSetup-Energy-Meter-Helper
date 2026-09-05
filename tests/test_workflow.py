"""Offset calibration workflow state and ownership tests."""

from __future__ import annotations

import asyncio
from dataclasses import replace
from hashlib import sha256
from types import SimpleNamespace
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.calibration_engine import (
    OffsetCalibrationResult,
    OffsetCalibrationState,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.entity_binding import (
    OffsetControlStatus,
)
from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
    expected_meter_entity_evidence,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    CircuitRole,
    MeterConfigurationRequest,
    VoltageLayout,
)
from custom_components.circuitsetup_energy_meter_helper.meter_inventory import (
    MeterConfigurationInventory,
)
from custom_components.circuitsetup_energy_meter_helper.offset_readiness import (
    DEFAULT_OFFSET_READINESS_THRESHOLDS,
    OffsetReadinessResult,
)
from custom_components.circuitsetup_energy_meter_helper.preflight import PreflightResult
from custom_components.circuitsetup_energy_meter_helper.provisioning import (
    DiscoveredDevice,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    CalibrationBusyError,
    PendingCalibrationOrigin,
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    MeterConfigurationRead,
    StoredMeterConfiguration,
)
from custom_components.circuitsetup_energy_meter_helper.topology import (
    topology_from_native,
)
from custom_components.circuitsetup_energy_meter_helper.workflow import (
    EntryWorkflow,
    WorkflowCapabilityUnavailable,
    WorkflowHandleError,
    _SessionHandle,
)

MAC = "aabbccddeeff"
OFFSET_TABLE = ((1, 2), (3, 4), (5, 6))
POWER_OFFSET_TABLE = ((7, 8), (9, 10), (11, 12))


async def _persisted_totals_workflow(
    content: str, store: Any = None, topology: Any = None
) -> tuple[Any, ...]:
    from custom_components.circuitsetup_energy_meter_helper.config_document import (
        ESPHomeConfigDocument,
    )
    from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
        ConfigTransactionManager,
    )
    from custom_components.circuitsetup_energy_meter_helper.store import HelperStore
    from custom_components.circuitsetup_energy_meter_helper.workflow import _PlanHandle
    from tests.test_config_mutator import _inventory, _topology
    from tests.test_config_transaction import Builder, Verifier, _evidence
    from tests.test_store import _CopyingStorage

    if store is None:
        store = object.__new__(HelperStore)
        store._store = _CopyingStorage()
        store._update_lock = asyncio.Lock()
    snapshot = ESPHomeConfigSnapshot(
        "meter.yaml", content, sha256(content.encode()).hexdigest()
    )
    inventory = _inventory(
        snapshot, topology or _topology(), stored=await store.async_get_meter_configuration(MAC)
    )
    builder = Builder(remote_content=content)
    evidence = expected_meter_entity_evidence(
        inventory.configuration,
        inventory.topology,
        document=ESPHomeConfigDocument.parse(content),
        previous=inventory.configuration,
    )
    verifier = Verifier(
        replace(
            _evidence(),
            ct_names={
                item.channel: item.name for item in inventory.configuration.channels
            },
            sensor_entities=evidence.sensor_entities,
        )
    )
    manager = ConfigTransactionManager(
        builder,
        verifier,
        store,
        SessionManager(),
        reconnect_timeout=0.01,
        reconnect_backoff_initial=0.001,
    )
    workflow = object.__new__(EntryWorkflow)
    plan = _PlanHandle(
        "plan", "meter", MAC, inventory.topology, snapshot, inventory, 100
    )
    workflow._plans = {"plan": plan}
    workflow.transactions = manager
    workflow._clock = lambda: 0
    return workflow, plan, store, builder, verifier


async def _install_totals_preview(
    workflow: Any, plan: Any, requested: Any, verifier: Any
) -> Any:
    from custom_components.circuitsetup_energy_meter_helper.config_document import (
        ESPHomeConfigDocument,
    )
    from tests.test_config_transaction import _evidence

    topology = plan.topology
    content = plan.snapshot.content
    previous = plan.inventory.configuration
    status = await workflow._async_preview_meter_configuration(plan, requested)
    expected = expected_meter_entity_evidence(
        requested,
        topology,
        document=ESPHomeConfigDocument.parse(content),
        previous=previous,
        native_visibility_resolved=plan.inventory.native_visibility_resolved,
    )
    verifier.evidence = replace(
        _evidence(),
        ct_names={item.channel: item.name for item in requested.channels},
        sensor_entities=expected.sensor_entities,
    )
    manager = workflow.transactions
    await manager.async_confirm_write(status.transaction_id, "admin")
    await manager.async_compile(status.transaction_id)
    return await manager.async_confirm_install(status.transaction_id, "admin")


@pytest.mark.parametrize("addons", (0, 1))
@pytest.mark.parametrize("visible", (False, True))
@pytest.mark.parametrize("rollback", (False, True))
def test_migrated_native_additive_override_commit_reload(addons: int, visible: bool, rollback: bool) -> None:
    from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
        ConfigTransactionState,
    )
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        TotalOutputSettings,
    )
    from custom_components.circuitsetup_energy_meter_helper.store import (
        LegacyParentLink,
        TotalsMigrationRecord,
    )
    from custom_components.circuitsetup_energy_meter_helper.total_graph import (
        native_total_sources,
    )
    from tests.test_config_mutator import _native_total_setup
    from tests.test_config_transaction import _evidence
    from tests.test_store import _record

    async def run() -> None:
        snapshot, topology, _ = _native_total_setup(addons)
        overrides = "".join(f"  - id: !extend {sensor_id}\n    internal: {str(visible).lower()}\n"
            for definition in native_total_sources(topology)
            for sensor_id in (definition.power_id, definition.current_id, definition.existing_energy_id)
            if sensor_id is not None)
        content = snapshot.content.replace("sensor:\n", "sensor:\n" + overrides)
        workflow, plan, store, _, _ = await _persisted_totals_workflow(content, topology=topology)
        current = plan.inventory.configuration
        pending = TotalsMigrationRecord(True, (LegacyParentLink("old-child", "old-parent"),), True)
        stored = StoredMeterConfiguration(plan.snapshot.sha256, current.meter, current.channels,
            current.default_totals, (), (), current.power_quality, current.status_fields, totals_migration=pending)
        await store.async_save_meter(replace(_record(plan.snapshot.sha256), topology=replace(
            _record().topology, addon_count=addons, board_count=topology.board_count,
            ct_count=topology.ct_count, group_count=topology.group_count, project_name=topology.project_name)))
        await store.async_save_verified_meter_configuration(MAC, plan.snapshot.sha256, stored)
        workflow, plan, _, builder, verifier = await _persisted_totals_workflow(content, store, topology)
        assert plan.inventory.capabilities.native_totals_writable
        assert await store.async_get_meter_configuration(MAC) == stored
        assert builder.calls == []
        requested = replace(plan.inventory.configuration, default_totals=replace(current.default_totals,
            overall=TotalOutputSettings(visible, not visible, not visible)))
        status = await workflow._async_preview_meter_configuration(plan, requested)
        transaction = workflow.transactions._transaction(status.transaction_id)
        verifier.evidence = replace(_evidence(), topology=topology, current_sensor_count=topology.ct_count,
            ct_names={channel.channel: channel.name for channel in requested.channels},
            sensor_entities=transaction.expected_sensor_entities)
        manager = workflow.transactions
        await manager.async_confirm_write(status.transaction_id, "admin")
        if rollback:
            from tests.test_config_transaction import Job
            builder.compile = Job(False)
        await manager.async_compile(status.transaction_id)
        if rollback:
            assert await store.async_get_meter_configuration(MAC) == stored
            await manager.async_rollback(status.transaction_id)
            assert builder.remote_content == content
            assert await store.async_get_meter_configuration(MAC) == stored
            return
        installed = await manager.async_confirm_install(status.transaction_id, "admin")
        assert installed.state is ConfigTransactionState.VERIFIED
        saved = await store.async_get_meter_configuration(MAC)
        assert saved.totals_migration == replace(pending, native_visibility_confirmation_required=False)
        assert saved.default_totals == requested.default_totals
        assert overrides in builder.remote_content
        _, loaded, _, loaded_builder, _ = await _persisted_totals_workflow(builder.remote_content, store, topology)
        assert loaded.inventory.configuration.default_totals == requested.default_totals
        assert loaded.inventory.capabilities.native_totals_writable
        assert loaded.inventory.native_visibility_resolved
        assert loaded_builder.calls == []
        assert await store.async_get_meter_configuration(MAC) == saved

    asyncio.run(run())


def test_unrelated_save_reload_keeps_totals_unowned_and_native_unresolved() -> None:
    from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
        ConfigTransactionState,
    )
    from tests.test_config_mutator import _contract_snapshot

    async def run() -> None:
        workflow, plan, store, builder, verifier = await _persisted_totals_workflow(
            _contract_snapshot().content
        )
        assert not plan.inventory.native_visibility_resolved
        requested = replace(
            plan.inventory.configuration,
            meter=replace(plan.inventory.configuration.meter, update_interval_s=10),
        )
        status = await _install_totals_preview(workflow, plan, requested, verifier)
        assert status.state is ConfigTransactionState.VERIFIED
        stored = await store.async_get_meter_configuration(MAC)
        assert stored.meter.update_interval_s == 10
        assert not stored.totals_managed
        _, loaded, _, _, _ = await _persisted_totals_workflow(
            builder.remote_content, store
        )
        assert not loaded.inventory.native_visibility_resolved
        assert not loaded.inventory.capabilities.managed_advanced_totals

    asyncio.run(run())


def test_partial_unowned_native_visibility_survives_initial_preview_and_unrelated_write() -> (
    None
):
    from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
        ConfigTransactionState,
    )
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        TotalsChangeIntent,
    )
    from tests.test_config_mutator import _contract_snapshot

    class Hass:
        config_entries = SimpleNamespace(
            async_get_entry=lambda _entry: SimpleNamespace(unique_id=MAC)
        )

        async def async_add_executor_job(self, target: Any, *args: Any) -> Any:
            return target(*args)

    async def run() -> None:
        content = (
            "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter\n"
            + _contract_snapshot().content.replace(
                "logger:\n",
                "  - id: !extend totalWattsMain\n    internal: true\nlogger:\n",
            )
        )
        original, _, store, builder, verifier = await _persisted_totals_workflow(
            content
        )
        provisioning = SimpleNamespace(
            snapshot=SimpleNamespace(
                devices=(
                    DiscoveredDevice(
                        "meter",
                        "Energy meter",
                        "circuitsetup.6c-energy-meter",
                        configuration="meter.yaml",
                    ),
                )
            )
        )
        workflow = EntryWorkflow(
            Hass(), provisioning, SessionManager(), store, "meter", None, builder
        )
        workflow.transactions = original.transactions
        initial = await workflow.async_get_meter_configuration("meter")
        assert not initial["totals"]["migration"]["native_visibility_resolved"]
        assert initial["configuration_impact"].public_total_entity_count == 0
        assert initial["configuration_impact"].internal_total_sensor_count == 1
        plan = workflow._plans[initial["plan_id"]]
        preview = await workflow.async_preview_total_graph(
            "meter", plan.plan_id, plan.snapshot.sha256, plan.inventory.configuration
        )
        assert preview["configuration_impact"].public_total_entity_count == 0
        with pytest.raises(ValueError, match="visibility-confirmed"):
            plan.inventory.validate_totals_change(
                replace(
                    plan.inventory.configuration,
                    totals_change_intent=TotalsChangeIntent(True),
                )
            )
        requested = replace(
            plan.inventory.configuration,
            meter=replace(plan.inventory.configuration.meter, update_interval_s=30),
        )
        status = await workflow._async_preview_meter_configuration(plan, requested)
        verifier.evidence = replace(
            verifier.evidence, topology=plan.topology, sensor_entities=frozenset()
        )
        manager = workflow.transactions
        await manager.async_confirm_write(status.transaction_id, "admin")
        await manager.async_compile(status.transaction_id)
        installed = await manager.async_confirm_install(status.transaction_id, "admin")
        assert installed.state is ConfigTransactionState.VERIFIED, installed.evidence
        assert (
            "  - id: !extend totalWattsMain\n    internal: true\n"
            in builder.remote_content
        )
        reloaded = await workflow.async_get_meter_configuration("meter")
        assert not reloaded["totals"]["migration"]["native_visibility_resolved"]
        assert reloaded["configuration_impact"].public_total_entity_count == 0
        assert not (await store.async_get_meter_configuration(MAC)).totals_managed

    asyncio.run(run())


@pytest.mark.parametrize("accepted", (False, True))
@pytest.mark.parametrize(
    "outcome", ("success", "compile", "install", "rollback", "retry")
)
def test_explicit_adoption_and_partial_parent_review_commit_only_on_success(
    outcome: str, accepted: bool
) -> None:
    from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
        ConfigTransactionState,
    )
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        AggregateTotalSource,
        ChannelTotalSource,
        CircuitAggregate,
        EnergyMode,
        LegacyParentDecision,
        MeasurementMethod,
        TotalOutputSettings,
        TotalsChangeIntent,
    )
    from custom_components.circuitsetup_energy_meter_helper.store import (
        LegacyParentLink,
        TotalsMigrationRecord,
    )
    from tests.test_config_mutator import _contract_snapshot
    from tests.test_config_transaction import Job, _evidence
    from tests.test_store import _record

    async def run() -> None:
        content = _contract_snapshot().content.replace(
            "logger:\n",
            "".join(
                f"  - id: !extend {sensor_id}\n    internal: false\n"
                for sensor_id in ("totalWattsMain", "totalAmpsMain", "totalEnergyDaily")
            )
            + "logger:\n",
        )
        workflow, plan, store, builder, verifier = await _persisted_totals_workflow(
            content
        )
        source = plan.inventory.configuration
        pending = TotalsMigrationRecord(
            True,
            (LegacyParentLink("child", "parent"), LegacyParentLink("other", "parent")),
            True,
        )
        stored = StoredMeterConfiguration(
            plan.snapshot.sha256,
            source.meter,
            source.channels,
            source.default_totals,
            source.automatic_totals,
            source.aggregates,
            source.power_quality,
            source.status_fields,
            totals_migration=pending,
            totals_managed=False,
        )
        await store.async_save_meter(_record(plan.snapshot.sha256))
        await store.async_save_verified_meter_configuration(
            MAC, plan.snapshot.sha256, stored
        )
        workflow, plan, _, builder, verifier = await _persisted_totals_workflow(
            content, store
        )
        requested = replace(
            plan.inventory.configuration,
            totals_change_intent=TotalsChangeIntent(
                True, (LegacyParentDecision("child", "parent", accepted),)
            ),
        )
        if accepted:
            child = CircuitAggregate(
                "child",
                "Child",
                CircuitRole.CUSTOM,
                (ChannelTotalSource("channel", 1),),
                MeasurementMethod.DIRECT,
                EnergyMode.NONE,
                TotalOutputSettings(False, False, False),
            )
            parent = replace(
                child,
                aggregate_id="parent",
                name="Parent",
                sources=(AggregateTotalSource("aggregate", "child"),),
                outputs=TotalOutputSettings(True, False, False),
            )
            requested = replace(requested, aggregates=(child, parent))
        if outcome == "rollback":
            requested = replace(
                requested, meter=replace(requested.meter, update_interval_s=10)
            )
        before = await store.async_get_meter_configuration(MAC)
        status = await workflow._async_preview_meter_configuration(plan, requested)
        assert await store.async_get_meter_configuration(MAC) == before
        retained = workflow.transactions._transaction(status.transaction_id)
        assert retained.totals_change_intent == requested.totals_change_intent
        if outcome in ("compile", "rollback"):
            builder.compile = Job(False)
        if outcome == "install":
            builder.upload = Job(False)
        verifier.evidence = replace(
            _evidence(),
            ct_names={item.channel: item.name for item in requested.channels},
            sensor_entities=expected_meter_entity_evidence(
                requested, retained.topology
            ).sensor_entities,
        )
        complete_evidence = verifier.evidence
        if outcome == "retry":
            verifier.evidence = replace(complete_evidence, sensor_entities=frozenset())
        manager = workflow.transactions
        await manager.async_confirm_write(status.transaction_id, "admin")
        if outcome == "rollback":
            await manager.async_compile(status.transaction_id)
            await manager.async_rollback(status.transaction_id)
        else:
            compiled = await manager.async_compile(status.transaction_id)
            if compiled.state is not ConfigTransactionState.FAILED:
                installed = await manager.async_confirm_install(
                    status.transaction_id, "admin"
                )
                if outcome == "retry":
                    assert (
                        installed.state
                        is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
                    )
                    assert await store.async_get_meter_configuration(MAC) == before
                    assert (
                        manager._transaction(status.transaction_id).totals_change_intent
                        == requested.totals_change_intent
                    )
                    verifier.evidence = complete_evidence
                    assert (
                        await manager.async_confirm_install(
                            status.transaction_id, "admin"
                        )
                    ).state is ConfigTransactionState.VERIFIED
        loaded = await store.async_get_meter_configuration(MAC)
        if outcome in ("success", "retry"):
            assert loaded.totals_managed
            assert loaded.totals_migration == TotalsMigrationRecord(
                True, (LegacyParentLink("other", "parent"),), False
            )
            _, fresh, _, _, _ = await _persisted_totals_workflow(
                builder.remote_content, store
            )
            assert fresh.inventory.totals_managed
            assert loaded.aggregates == requested.aggregates
            assert fresh.inventory.configuration.aggregates == requested.aggregates
        else:
            assert loaded == before

    asyncio.run(run())


def test_persisted_automatic_off_survives_role_disappearance_save_and_return() -> None:
    from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
        ConfigTransactionState,
    )
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        AutomaticTotalSettings,
        TotalOutputSettings,
    )
    from tests.test_config_mutator import _contract_snapshot
    from tests.test_store import _record

    async def run() -> None:
        workflow, plan, store, _, _ = await _persisted_totals_workflow(
            _contract_snapshot().content
        )
        source = plan.inventory.configuration
        roles = tuple(
            replace(channel, role=CircuitRole.GRID) if channel.channel <= 2 else channel
            for channel in source.channels
        )
        off = AutomaticTotalSettings(
            "grid-ct1-ct2", False, TotalOutputSettings(True, False, True)
        )
        stored = StoredMeterConfiguration(
            plan.snapshot.sha256,
            source.meter,
            roles,
            source.default_totals,
            (off,),
            (),
            source.power_quality,
            source.status_fields,
        )
        await store.async_save_meter(_record(plan.snapshot.sha256))
        await store.async_save_verified_meter_configuration(
            MAC, plan.snapshot.sha256, stored
        )
        workflow, plan, _, builder, verifier = await _persisted_totals_workflow(
            plan.snapshot.content, store
        )
        requested = replace(
            plan.inventory.configuration, channels=source.channels, automatic_totals=()
        )
        status = await _install_totals_preview(workflow, plan, requested, verifier)
        assert status.state is ConfigTransactionState.VERIFIED
        assert (await store.async_get_meter_configuration(MAC)).automatic_totals == (
            off,
        )
        workflow, plan, _, builder, verifier = await _persisted_totals_workflow(
            builder.remote_content, store
        )
        assert plan.inventory.stale_automatic_total_settings == (off,)
        requested = replace(
            plan.inventory.configuration,
            meter=replace(source.meter, update_interval_s=30),
        )
        installed = await _install_totals_preview(workflow, plan, requested, verifier)
        assert installed.state is ConfigTransactionState.VERIFIED, installed.evidence
        workflow, plan, _, builder, verifier = await _persisted_totals_workflow(
            builder.remote_content, store
        )
        assert plan.inventory.stale_automatic_total_settings == (off,)
        requested = replace(
            plan.inventory.configuration, channels=roles, automatic_totals=(off,)
        )
        assert (
            await _install_totals_preview(workflow, plan, requested, verifier)
        ).state is ConfigTransactionState.VERIFIED
        _, loaded, _, _, _ = await _persisted_totals_workflow(
            builder.remote_content, store
        )
        assert not loaded.inventory.automatic_totals[0].enabled
        assert "csemh_auto_mains_power" not in builder.remote_content

    asyncio.run(run())


@pytest.mark.parametrize("owned", (False, True))
@pytest.mark.parametrize("visibility_confirmed", (False, True))
def test_calibration_replay_preserves_pending_links_stale_off_and_hidden_native(
    owned: bool, visibility_confirmed: bool,
) -> None:
    from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
        ConfigMutationError,
    )
    from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
        ConfigTransactionState,
    )
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        AutomaticTotalSettings,
        TotalOutputSettings,
    )
    from custom_components.circuitsetup_energy_meter_helper.store import (
        LegacyParentLink,
        TotalsMigrationRecord,
        VerifiedCalibrationRecord,
        VerifiedGainGroup,
    )
    from custom_components.circuitsetup_energy_meter_helper.topology import (
        voltage_reference_fingerprint_for_meter,
    )
    from tests.test_config_mutator import _contract_snapshot
    from tests.test_store import _record

    async def run() -> None:
        content = (
            _contract_snapshot()
            .content.replace(
                "substitutions:\n", "substitutions:\n  voltage_cal1: 7305\n"
            )
            .replace(
                "logger:\n",
                "".join(
                    f"  - id: !extend {sensor_id}\n    internal: true\n"
                    for sensor_id in (
                        "totalWattsMain",
                        "totalAmpsMain",
                        "totalEnergyDaily",
                    )
                )
                + "logger:\n",
            )
        )
        workflow, plan, store, builder, _verifier = await _persisted_totals_workflow(
            content if visibility_confirmed else _contract_snapshot().content.replace(
                "substitutions:\n", "substitutions:\n  voltage_cal1: 7305\n"
            )
        )
        source = plan.inventory.configuration
        off = AutomaticTotalSettings(
            "grid-ct1-ct2", False, TotalOutputSettings(True, False, True)
        )
        pending = TotalsMigrationRecord(
            True, (LegacyParentLink("child", "parent"),), True
        )
        stored = StoredMeterConfiguration(
            plan.snapshot.sha256,
            source.meter,
            source.channels,
            replace(
                source.default_totals, overall=TotalOutputSettings(True, True, False)
            ),
            (off,),
            (),
            source.power_quality,
            source.status_fields,
            totals_migration=pending,
            totals_managed=owned,
        )
        await store.async_save_meter(_record(plan.snapshot.sha256))
        await store.async_save_verified_meter_configuration(
            MAC, plan.snapshot.sha256, stored
        )
        record = VerifiedCalibrationRecord(
            mac=MAC,
            config_filename="meter.yaml",
            config_sha256=plan.snapshot.sha256,
            topology_addon_count=0,
            topology_project_name=plan.topology.project_name,
            topology_connection_type=plan.topology.connection_type,
            topology_voltage_layout=plan.topology.voltage_layout,
            topology_voltage_fingerprint=voltage_reference_fingerprint_for_meter(
                plan.topology
            ),
            connection_generation=2,
            groups=(VerifiedGainGroup("meter_main1", ((7305, 11144),) * 3),),
            verification_id="a" * 32,
        )
        await store.async_save_verified_calibration(record)
        manager = workflow.transactions
        if not visibility_confirmed:
            with pytest.raises(ConfigMutationError, match="native total visibility must be confirmed"):
                await manager.async_preview_calibrated_gains(MAC, plan.topology, record.verification_id)
            assert await store.async_get_meter_configuration(MAC) == stored
            assert await store.async_get_verified_calibration(MAC) == record
            assert builder.calls == ["read"]
            return
        status = await manager.async_preview_calibrated_gains(
            MAC, plan.topology, record.verification_id
        )
        retained = manager._transaction(status.transaction_id).meter_configuration
        assert retained.default_totals.overall == TotalOutputSettings(
            False, False, False
        )
        assert retained.automatic_totals == (off,)
        assert retained.totals_migration == pending
        assert retained.totals_managed is owned
        assert (await store.async_get_meter_configuration(MAC)) == stored
        await manager.async_confirm_write(status.transaction_id, "admin")
        await manager.async_compile(status.transaction_id)
        assert (
            await manager.async_confirm_install(status.transaction_id, "admin")
        ).state is ConfigTransactionState.VERIFIED
        loaded = await store.async_get_meter_configuration(MAC)
        assert loaded.totals_managed is owned
        assert loaded.automatic_totals == (off,)
        assert loaded.totals_migration == replace(
            pending, native_visibility_confirmation_required=False
        )
        assert loaded.default_totals.overall == TotalOutputSettings(False, False, False)
        assert "internal: true" in builder.remote_content

    asyncio.run(run())


def _total_preview_workflow() -> tuple[EntryWorkflow, Any]:
    from custom_components.circuitsetup_energy_meter_helper.workflow import _PlanHandle
    from tests.test_meter_inventory import _document, _inventory

    inventory = _inventory(_document(contract=True))
    snapshot = ESPHomeConfigSnapshot("meter.yaml", _document(contract=True), inventory.source_sha256)
    plan = _PlanHandle("plan", "meter", MAC, inventory.topology, snapshot, inventory, 100)
    workflow = object.__new__(EntryWorkflow)
    workflow._plans = {"plan": plan}
    workflow._clock = lambda: 0
    workflow.transactions = None
    return workflow, plan


def test_total_graph_preview_is_repeatable_read_only_and_recomputes_roles() -> None:
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        AutomaticTotalSettings,
        TotalOutputSettings,
    )

    async def run() -> None:
        workflow, plan = _total_preview_workflow()
        original = plan.inventory.configuration
        draft = replace(original, channels=tuple(
            replace(channel, role=CircuitRole.GRID) if channel.channel in (1, 2) else channel
            for channel in original.channels
        ))
        preview = await workflow.async_preview_total_graph("meter", "plan", plan.snapshot.sha256, draft)
        assert preview["automatic_candidates"][0].candidate_id == "grid-ct1-ct2"
        assert preview["graph"]["leaf_channels"]["auto-mains"] == [1, 2]
        assert preview["configuration_impact"].public_total_entity_count == 5
        assert preview == await workflow.async_preview_total_graph("meter", "plan", plan.snapshot.sha256, draft)
        disabled = replace(draft, automatic_totals=(AutomaticTotalSettings("grid-ct1-ct2", False, TotalOutputSettings(True, False, True)),))
        await workflow.async_preview_total_graph("meter", "plan", plan.snapshot.sha256, disabled)
        gone = replace(disabled, channels=original.channels)
        result = await workflow.async_preview_total_graph("meter", "plan", plan.snapshot.sha256, gone)
        assert result["automatic_totals"] == ()
        assert result["configuration_impact"].public_total_entity_count == 0
        assert result["stale_automatic_total_settings"] == disabled.automatic_totals
        restored = await workflow.async_preview_total_graph("meter", "plan", plan.snapshot.sha256, disabled)
        assert not restored["automatic_totals"][0].enabled
        assert plan.inventory.configuration == original
        assert workflow._plans["plan"] is plan
        assert plan.snapshot.content
        other_workflow, other_plan = _total_preview_workflow()
        with pytest.raises(ValueError, match="candidate"):
            await other_workflow.async_preview_total_graph("meter", "plan", other_plan.snapshot.sha256, gone)
        with pytest.raises(ValueError, match="candidate"):
            plan.inventory.validate_totals_change(gone)
        unknown = replace(draft, automatic_totals=(AutomaticTotalSettings("invented", True, TotalOutputSettings(True, False, True)),))
        with pytest.raises(ValueError, match="candidate"):
            await workflow.async_preview_total_graph("meter", "plan", plan.snapshot.sha256, unknown)
        plan.scrub()
        assert not plan.issued_total_candidate_ids

    asyncio.run(run())


def test_bound_details_expose_source_aware_summary_without_writes() -> None:
    from custom_components.circuitsetup_energy_meter_helper.websocket_api import (
        sanitize_payload,
    )
    from tests.totals_browser_fixture import Fixture

    async def run() -> None:
        fixture = Fixture()
        await fixture.initialize("summary")
        before = await fixture.store.async_get_meter_configuration(MAC)
        response = await fixture.workflow.async_get_meter_configuration("meter-1")
        calls = list(fixture.builder.calls)
        details = await fixture.workflow.async_get_total_details("meter-1", response["plan_id"], response["source_sha256"])
        assert fixture.builder.calls == calls
        assert "total_details" not in response
        rows = {row.total_id: row for row in details["total_details"]}
        assert set(rows) == {"overall", "auto-mains", "hidden", "parent", "watts-only"}
        assert rows["auto-mains"].public_outputs == ("Net Watts", "Import Watts", "Return-to-grid Watts", "Import kWh", "Return-to-grid kWh")
        assert rows["hidden"].public_outputs == ()
        assert rows["hidden"].internal_outputs == ("Watts", "Amps")
        assert rows["watts-only"].public_outputs == ("Watts",)
        assert rows["parent"].ownership == "helper_managed"
        assert response["configuration_impact"].energy_entity_count == 4
        preview = await fixture.workflow.async_preview_total_graph("meter-1", response["plan_id"],
            response["source_sha256"], response["configuration"])
        assert sanitize_payload(preview)["configuration_impact"] == sanitize_payload(response["configuration_impact"])
        transported = sanitize_payload(details)
        assert len(transported["total_details"]) == 5
        assert transported["total_details"][0]["kind"] == "native_total"
        assert transported["total_details"][0]["public_outputs"] == ["Watts", "Amps", "kWh"]
        assert fixture.builder.remote_content
        assert not set(fixture.builder.calls) & {"write", "compile", "upload", "restore"}
        assert await fixture.store.async_get_meter_configuration(MAC) == before

    asyncio.run(run())


def test_source_owned_summary_does_not_relabel_watts_or_invent_helper_energy() -> None:
    from tests.totals_browser_fixture import Fixture

    async def run() -> None:
        fixture = Fixture()
        await fixture.initialize("source-only")
        response = await fixture.workflow.async_get_meter_configuration("meter-1")
        details = await fixture.workflow.async_get_total_details("meter-1", response["plan_id"], response["source_sha256"])
        row = next(row for row in details["total_details"] if row.kind == "aggregate")
        assert row.ownership == "source_owned"
        assert row.public_outputs == ("Watts",)
        assert row.internal_outputs == ()
        assert response["configuration_impact"].energy_entity_count == 1
        assert not set(fixture.builder.calls) & {"write", "compile", "upload"}
        assert await fixture.store.async_get_meter_configuration(MAC) is None

    asyncio.run(run())


@pytest.mark.parametrize("invalid", ("device", "hash", "expired"))
def test_total_graph_preview_rejects_unbound_handles(invalid: str) -> None:
    async def run() -> None:
        workflow, plan = _total_preview_workflow()
        if invalid == "expired":
            workflow._clock = lambda: 100
        with pytest.raises(WorkflowHandleError):
            await workflow.async_preview_total_graph(
                "other" if invalid == "device" else "meter", "plan",
                "f" * 64 if invalid == "hash" else plan.snapshot.sha256,
                plan.inventory.configuration,
            )
    asyncio.run(run())


def test_stale_meter_configuration_plan_uses_live_source_and_legacy_semantics() -> None:
    """A foreign device or CT-only handle would bypass the server-owned plan boundary."""
    content = (
        "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter\n"
        "substitutions:\n"
        "  friendly_name: Garage Meter\n"
        "  update_time: 60s\n"
        "  electric_freq: 60Hz\n"
        "  csemh_config_contract: 2\n"
        "  voltage_cal1: 7305\n"
        + "".join(
            f"  ct{channel}_name: CT {channel}\n"
            f"  current_cal_ct{channel}: {27518 + channel}\n"
            for channel in range(1, 7)
        )
        + "sensor:\n  - platform: uptime\n    name: Uptime\n"
    )
    digest = sha256(content.encode()).hexdigest()
    calls: list[str] = []

    class Builder:
        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            return ESPHomeConfigSnapshot(configuration, content, digest)

        async def async_close(self) -> None:
            return None

    class Store:
        def __init__(self) -> None:
            self.configuration: StoredMeterConfiguration | None = None
            self.stale = False

        async def async_save_interrupted_session(self, *_args: Any) -> None:
            return None

        async def async_finalize_verified_calibration(self, *_args: Any) -> None:
            return None

        async def async_get_ct_selections(self, mac: str) -> tuple[object, ...]:
            calls.append(mac)
            return ()

        async def async_get_meter_configuration_read(
            self, mac: str
        ) -> MeterConfigurationRead:
            calls.append(mac)
            return MeterConfigurationRead(self.configuration, self.stale)

    class Hass:
        def __init__(self) -> None:
            self.config_entries = SimpleNamespace(async_get_entry=self._entry)

        @staticmethod
        def _entry(device_id: str) -> object | None:
            if device_id != "meter":
                return None
            return SimpleNamespace(unique_id="aa:bb:cc:dd:ee:ff")

        async def async_add_executor_job(self, target: Any, *args: Any) -> Any:
            return target(*args)

    class Transactions:
        def __init__(self) -> None:
            self.calls: list[tuple[tuple[Any, ...], dict[str, Any]]] = []

        async def async_preview(
            self, *args: Any, **kwargs: Any
        ) -> dict[str, str]:
            self.calls.append((args, kwargs))
            return {"transaction_id": str(len(self.calls))}

    async def run() -> None:
        provisioning = SimpleNamespace(
            snapshot=SimpleNamespace(
                devices=(
                    DiscoveredDevice(
                        "meter",
                        "Garage Meter",
                        "circuitsetup.6c-energy-meter",
                        configuration="meter.yaml",
                    ),
                )
            )
        )
        store = Store()
        workflow = EntryWorkflow(
            Hass(), provisioning, SessionManager(), store, "meter", None, Builder()
        )

        with pytest.raises(WorkflowHandleError, match="owned"):
            await workflow.async_get_meter_configuration("other")

        result = await workflow.async_get_meter_configuration("meter")
        assert workflow._plans[result["plan_id"]].inventory.plan_id == result["plan_id"]
        authoritative = replace(
            result["configuration"],
            channels=(
                replace(
                    result["configuration"].channels[0],
                    role=CircuitRole.GRID,
                    burden_output_acknowledged=True,
                ),
                *result["configuration"].channels[1:],
            ),
            power_quality=(True,),
            status_fields=(True,),
        )
        store.configuration = StoredMeterConfiguration(
            digest,
            authoritative.meter,
            authoritative.channels,
            authoritative.default_totals,
            authoritative.automatic_totals,
            authoritative.aggregates,
            authoritative.power_quality,
            authoritative.status_fields,
            (),
            authoritative.multi_reference_preparation_acknowledged,
        )
        wrapper = await workflow.async_get_ct_inventory("meter")

        assert isinstance(
            workflow._plans[wrapper["plan_id"]].inventory, MeterConfigurationInventory
        )
        assert workflow._plans[wrapper["plan_id"]].inventory.plan_id == wrapper["plan_id"]
        assert result["source_sha256"] == digest
        assert result["configuration"].meter.friendly_name == "Garage Meter"
        assert result["configuration_impact"].numeric_entity_count == 14
        assert result["configuration_impact"].text_entity_count == 0
        assert "slow_interval_extends_calibration" in result["warnings"]
        assert wrapper["channels"] == result["channels"]
        assert "stored_semantics_stale" not in result["warnings"]
        assert calls == ["aabbccddeeff"] * 4
        wrapper_configuration = workflow._plans[wrapper["plan_id"]].inventory.configuration
        assert wrapper_configuration.meter == authoritative.meter
        assert wrapper_configuration.aggregates == authoritative.aggregates
        assert wrapper_configuration.power_quality == (True,)
        assert wrapper_configuration.status_fields == (True,)
        assert wrapper_configuration.channels[0].role is CircuitRole.GRID
        assert wrapper_configuration.channels[0].burden_output_acknowledged

        transactions = Transactions()
        workflow.transactions = transactions  # type: ignore[assignment]
        full = await workflow.async_get_meter_configuration("meter")
        full_plan = workflow._plans[full["plan_id"]]
        first_reference = full["configuration"].meter.voltage_references[0]
        acknowledged = replace(
            full["configuration"],
            meter=replace(
                full["configuration"].meter,
                voltage_layout=VoltageLayout.MULTI_REFERENCE,
                voltage_references=(
                    replace(first_reference, group_keys=("main_1",)),
                    replace(
                        first_reference,
                        reference_id="reference-2",
                        label="Reference 2",
                        phase_label="B",
                        group_keys=("main_2",),
                    ),
                ),
            ),
            channels=tuple(
                replace(channel, voltage_reference_id="reference-2")
                if channel.channel >= 4
                else channel
                for channel in full["configuration"].channels
            ),
            multi_reference_preparation_acknowledged=True,
        )
        preview = await workflow.async_preview_meter_configuration(
            "meter",
            full["plan_id"],
            full["source_sha256"],
            acknowledged,
        )
        expected = expected_meter_entity_evidence(
            acknowledged, full_plan.topology
        )
        assert preview == {"transaction_id": "1"}
        assert transactions.calls[0][1]["meter_configuration"].ct_selections
        assert transactions.calls[0][1]["meter_configuration"].multi_reference_preparation_acknowledged
        assert (
            transactions.calls[0][1]["expected_sensor_entities"]
            == expected.sensor_entities
        )
        assert (
            transactions.calls[0][1]["expected_aggregate_sensor_entities"]
            == expected.aggregate_sensor_entities
        )
        assert full_plan.snapshot.content == "" and full["plan_id"] not in workflow._plans
        with pytest.raises(WorkflowHandleError, match="stale"):
            await workflow.async_preview_meter_configuration(
                "meter",
                full["plan_id"],
                full["source_sha256"],
                full["configuration"],
            )

        stale = await workflow.async_get_meter_configuration("meter")
        with pytest.raises(WorkflowHandleError, match="stale"):
            await workflow.async_preview_meter_configuration(
                "meter", stale["plan_id"], "0" * 64, stale["configuration"]
            )
        foreign = await workflow.async_get_meter_configuration("meter")
        with pytest.raises(WorkflowHandleError, match="stale"):
            await workflow.async_preview_meter_configuration(
                "other",
                foreign["plan_id"],
                foreign["source_sha256"],
                foreign["configuration"],
            )

        ct_wrapper = await workflow.async_get_ct_inventory("meter")
        wrapper_plan = workflow._plans[ct_wrapper["plan_id"]]
        wrapper_preview = await workflow.async_preview_ct_config(
            "meter",
            ct_wrapper["plan_id"],
            ct_wrapper["source_sha256"],
            (
                {
                    "channel": 1,
                    "name": "Kitchen",
                    "model_id": "sct_006_20a_25ma",
                },
            ),
        )
        wrapper_configuration = transactions.calls[1][1]["meter_configuration"]
        assert wrapper_preview == {"transaction_id": "2"}
        assert wrapper_configuration.channels[0].name == "Kitchen"
        assert all(
            channel.name == f"CT {channel.channel}"
            for channel in wrapper_configuration.channels[1:]
        )
        assert len(wrapper_configuration.ct_selections) == 6
        assert (
            wrapper_plan.snapshot.content == ""
            and ct_wrapper["plan_id"] not in workflow._plans
        )
        equivalent = await workflow.async_get_meter_configuration("meter")
        await workflow.async_preview_meter_configuration(
            "meter",
            equivalent["plan_id"],
            equivalent["source_sha256"],
            MeterConfigurationRequest(
                wrapper_configuration.meter,
                wrapper_configuration.channels,
                wrapper_configuration.default_totals,
                wrapper_configuration.automatic_totals,
                wrapper_configuration.aggregates,
                wrapper_configuration.power_quality,
                wrapper_configuration.status_fields,
            ),
        )
        assert transactions.calls[2][1]["meter_configuration"] == wrapper_configuration
        plan_ids = set(workflow._plans)
        store.stale = True
        stale_result = await workflow.async_get_meter_configuration("meter")
        assert "stored_semantics_stale" in stale_result["warnings"]
        assert stale_result["capabilities"].semantic_source == "legacy_inferred"
        assert set(workflow._plans) != plan_ids
        await workflow.async_close()

    asyncio.run(run())


def test_calibrated_handoff_delegates_owned_full_ct_context() -> None:
    """The session boundary forwards calibrated channels and package choices intact."""

    class Transactions:
        def __init__(self) -> None:
            self.calls: list[tuple[tuple[Any, ...], dict[str, Any]]] = []

        async def async_preview_calibrated_gains(
            self, *args: Any, **kwargs: Any
        ) -> dict[str, str]:
            self.calls.append((args, kwargs))
            return {"transaction_id": "handoff"}

    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        handle.state = "verified"
        handle.calibrated_current_channels.add(1)
        handle.pending_reporting_multipliers[1] = 2.0
        transactions = Transactions()
        workflow.transactions = transactions  # type: ignore[assignment]

        result = await workflow.async_preview_calibrated_gains(
            handle.session_id,
            "a" * 32,
            (
                {
                    "channel": 1,
                    "name": "Kitchen",
                    "model_id": "ct",
                    "reporting_multiplier": 2.0,
                },
            ),
            {"power_quality": (False,), "status_fields": (True,)},
        )

        args, kwargs = transactions.calls[0]
        assert result == {"transaction_id": "handoff"}
        assert args[:3] == (MAC, handle.topology, "a" * 32)
        assert args[3][0].channel == 1 and args[4] == frozenset({1})
        assert kwargs == {"package_options": {"power_quality": (False,), "status_fields": (True,)}}
        await workflow.async_close()

    asyncio.run(run())


def _workflow(
    capability: OffsetControlStatus = OffsetControlStatus.AVAILABLE,
    *,
    repair_reason: str | None = None,
) -> tuple[EntryWorkflow, _SessionHandle, SessionManager, Any]:
    topology = topology_from_native("circuitsetup.6c-energy-meter")
    groups = tuple(
        SimpleNamespace(
            key=f"main_{index}",
            references=(),
            buttons=(),
            voltage_sensors=(),
            current_sensors=(),
        )
        for index in (1, 2)
    )
    binding = SimpleNamespace(
        topology=topology,
        connection_generation=1,
        groups=groups,
        channels=(),
        offset_capability=SimpleNamespace(
            status=capability,
            repair_reason=repair_reason,
        ),
    )
    api = SimpleNamespace(connected=True, connection_generation=1)
    sessions = SessionManager()

    async def save(*_args: Any) -> None:
        return None

    workflow = EntryWorkflow(
        SimpleNamespace(),
        SimpleNamespace(),
        sessions,
        SimpleNamespace(
            async_save_interrupted_session=save,
            async_save_verified_calibration=save,
            async_finalize_verified_calibration=save,
        ),
        None,
        api,
        None,
    )
    handle = _SessionHandle(
        "session",
        "meter",
        MAC,
        topology,
        None,
        {},
        binding,
        PreflightResult(()),
        {},
        float("inf"),
        safety_acknowledged=True,
        state="ready",
    )
    workflow._sessions[handle.session_id] = handle
    return workflow, handle, sessions, api


@pytest.mark.parametrize("communication_failed", [False, True])
def test_reconnect_evidence_reports_configured_ct_names(
    monkeypatch: pytest.MonkeyPatch,
    communication_failed: bool,
) -> None:
    """The API exposes the configured CT label with its sensor suffix."""
    workflow, handle, _sessions, api = _workflow()
    sensors = tuple(
        SimpleNamespace(object_id=f"ct{channel}amps", name=f"CT {channel} Amps")
        for channel in range(1, 7)
    )
    channels = tuple(
        SimpleNamespace(
            channel=channel,
            current_sensor=SimpleNamespace(descriptor=sensor),
        )
        for channel, sensor in enumerate(sensors, 1)
    )
    handle.binding = SimpleNamespace(
        rebind=lambda *_args: SimpleNamespace(channels=channels)
    )
    api.entities = sensors

    async def reconnect() -> None:
        return None

    checked: list[int] = []

    async def check_communication(expected_chips: int) -> None:
        from custom_components.circuitsetup_energy_meter_helper.log_parser import (
            MeterCommunicationError,
        )

        checked.append(expected_chips)
        if communication_failed:
            raise MeterCommunicationError((0,))

    api.async_reconnect = reconnect
    api.async_check_meter_communication = check_communication
    monkeypatch.setattr(
        "custom_components.circuitsetup_energy_meter_helper.workflow.EntityCatalog",
        lambda *_args: SimpleNamespace(by_kind=lambda kind: sensors if kind == "sensor" else ()),
    )

    if communication_failed:
        from custom_components.circuitsetup_energy_meter_helper.log_parser import (
            MeterCommunicationError,
        )

        with pytest.raises(MeterCommunicationError):
            asyncio.run(workflow.async_verify(MAC))
        assert checked == [2]
        return
    evidence = asyncio.run(workflow.async_verify(MAC))

    assert checked == [2]
    assert evidence.ct_names == {
        channel: f"CT {channel}" for channel in range(1, 7)
    }


def _pending(
    handle: _SessionHandle,
    *,
    gains: tuple[tuple[str, tuple[int, int, int]], ...] = (),
    offsets: tuple[tuple[str, Any], ...] = (),
    power_offsets: tuple[tuple[str, Any], ...] = (),
) -> PendingCalibrationOrigin:
    return PendingCalibrationOrigin(
        "operation",
        1,
        MAC,
        id(handle),
        handle.topology,
        None,
        None,
        gains,
        offsets,
        power_offsets,
    )


def adoption_workflow(
    *,
    listing: dict[str, list[dict[str, str]]],
    previous_entry_id: str | None = "old-meter",
    import_error: bool = False,
    device_name: str | None = "new-meter",
) -> tuple[EntryWorkflow, Any]:
    """Build a trusted-discovery adoption workflow with local fakes."""

    class Builder:
        def __init__(self) -> None:
            self.listing = listing
            self.list_calls = 0
            self.imports: list[dict[str, str]] = []

        async def async_list_devices(self) -> dict[str, list[dict[str, str]]]:
            self.list_calls += 1
            return self.listing

        async def async_import_device(self, payload: dict[str, str]) -> str:
            self.imports.append(payload)
            if import_error:
                raise RuntimeError("import failed")
            return "new-meter.yaml"

    entries = {
        "new-meter": SimpleNamespace(
            domain="esphome",
            title="New meter",
            unique_id="aabbccddeeff",
            data={} if device_name is None else {"device_name": device_name},
            runtime_data=SimpleNamespace(
                device_info=SimpleNamespace(
                    package_import_url="github://circuitsetup/package.yaml",
                    project_name="circuitsetup.6c-energy-meter",
                )
            ),
        ),
        "old-meter": SimpleNamespace(unique_id="112233445566"),
    }
    builder = Builder()
    workflow = EntryWorkflow(
        SimpleNamespace(
            config_entries=SimpleNamespace(async_get_entry=entries.get),
        ),
        SimpleNamespace(
            snapshot=SimpleNamespace(
                devices=(
                    DiscoveredDevice(
                        "new-meter", "New meter", "circuitsetup.6c-energy-meter"
                    ),
                )
            )
        ),
        SessionManager(),
        SimpleNamespace(
            async_save_interrupted_session=lambda *_args: None,
            async_save_verified_calibration=lambda *_args: None,
            async_finalize_verified_calibration=lambda *_args: None,
        ),
        previous_entry_id,
        None,
        builder,
    )
    return workflow, builder


def _adoption_session(state: str) -> _SessionHandle:
    return _SessionHandle(
        "adoption-session",
        "old-meter",
        "112233445566",
        topology_from_native("circuitsetup.6c-energy-meter"),
        None,
        {},
        SimpleNamespace(),
        PreflightResult(()),
        {},
        float("inf"),
        state=state,
    )


def test_adopt_imports_current_compatible_discovery_once() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={"configured": [], "importable": []})

        first = await workflow.async_adopt_device("new-meter")
        builder.listing = {
            "configured": [{"name": "new-meter", "configuration": "new-meter.yaml"}],
            "importable": [],
        }
        second = await workflow.async_adopt_device("new-meter")

        assert first == {"device_id": "new-meter", "configuration": "new-meter.yaml"}
        assert second == first
        assert builder.imports == [{
            "name": "new-meter",
            "friendly_name": "New meter",
            "package_import_url": "github://circuitsetup/package.yaml",
        }]

    asyncio.run(run())


def test_adopt_uses_builder_import_record_when_runtime_metadata_is_incomplete() -> None:
    async def run() -> None:
        import_data = {
            "name": "new-meter",
            "friendly_name": "Factory meter",
            "project_name": "circuitsetup.6c-energy-meter",
            "package_import_url": "github://circuitsetup/default-meter.yaml",
        }
        workflow, builder = adoption_workflow(
            listing={"configured": [], "importable": [import_data]}
        )
        entry = workflow._hass.config_entries.async_get_entry("new-meter")
        entry.runtime_data.device_info.package_import_url = None

        assert await workflow.async_adopt_device("new-meter") == {
            "device_id": "new-meter",
            "configuration": "new-meter.yaml",
        }
        assert builder.imports == [import_data]

    asyncio.run(run())


def test_adopt_falls_back_when_builder_import_record_is_incomplete() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(
            listing={"configured": [], "importable": [{"name": "new-meter"}]}
        )

        assert await workflow.async_adopt_device("new-meter") == {
            "device_id": "new-meter",
            "configuration": "new-meter.yaml",
        }
        assert builder.imports == [{
            "name": "new-meter",
            "friendly_name": "New meter",
            "package_import_url": "github://circuitsetup/package.yaml",
        }]

    asyncio.run(run())


def test_adopt_reuses_existing_builder_configuration() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={
            "configured": [{"name": "new-meter", "configuration": "existing.yaml"}],
            "importable": [],
        })

        assert await workflow.async_adopt_device("new-meter") == {
            "device_id": "new-meter",
            "configuration": "existing.yaml",
        }
        assert builder.imports == []

    asyncio.run(run())


def test_adopt_reuses_configured_meter_after_discovery_snapshot_changes() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={
            "configured": [{"name": "new-meter", "configuration": "existing.yaml"}],
            "importable": [],
        })
        workflow._provisioning.snapshot.devices = ()

        assert await workflow.async_adopt_device("new-meter") == {
            "device_id": "new-meter",
            "configuration": "existing.yaml",
        }
        assert builder.imports == []

    asyncio.run(run())


def test_adopt_rejects_missing_device_name_before_builder_lookup() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(
            listing={
                "configured": [
                    {"name": "unrelated", "configuration": "unrelated.yaml"}
                ],
                "importable": [],
            },
            device_name=None,
        )

        with pytest.raises(WorkflowCapabilityUnavailable, match="metadata"):
            await workflow.async_adopt_device("new-meter")

        assert builder.list_calls == 0
        assert builder.imports == []

    asyncio.run(run())


def test_adopt_rejects_device_outside_current_compatible_snapshot() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={"configured": [], "importable": []})

        with pytest.raises(WorkflowHandleError, match="available"):
            await workflow.async_adopt_device("unrelated-meter")
        assert builder.imports == []

    asyncio.run(run())


def test_adopt_propagates_import_failure_without_rebinding() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(
            listing={"configured": [], "importable": []}, import_error=True
        )

        with pytest.raises(RuntimeError, match="import failed"):
            await workflow.async_adopt_device("new-meter")

        assert workflow._esphome_entry_id == "old-meter"
        assert len(builder.imports) == 1

    asyncio.run(run())


def test_adopt_rejects_rebinding_while_previous_session_is_active() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={"configured": [], "importable": []})
        workflow._sessions["active"] = _adoption_session("ready")

        with pytest.raises(CalibrationBusyError, match="112233445566"):
            await workflow.async_adopt_device("new-meter")
        assert builder.imports == []

    asyncio.run(run())


def test_adopt_rejects_rebinding_while_previous_transaction_is_active() -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={"configured": [], "importable": []})
        workflow.transactions = SimpleNamespace(active_status=lambda mac: {"mac": mac})

        with pytest.raises(CalibrationBusyError, match="112233445566"):
            await workflow.async_adopt_device("new-meter")
        assert builder.imports == []

    asyncio.run(run())


@pytest.mark.parametrize("state", ("verified", "cancelled"))
def test_adopt_allows_rebinding_after_previous_session_is_finalized(state: str) -> None:
    async def run() -> None:
        workflow, builder = adoption_workflow(listing={"configured": [], "importable": []})
        workflow._sessions["finalized"] = _adoption_session(state)

        assert await workflow.async_adopt_device("new-meter") == {
            "device_id": "new-meter",
            "configuration": "new-meter.yaml",
        }
        assert len(builder.imports) == 1

    asyncio.run(run())


def test_offset_status_starts_with_capability_board_stages_and_no_pending() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()

        status = await workflow.async_get_session(handle.session_id)

        assert status.offset_capability == {
            "status": "available",
            "repair_reason": None,
        }
        assert status.offset_disposition == "not_started"
        assert status.offset_boards == (
            {
                "board_index": 0,
                "stages": (
                    {"stage": 1, "state": "not_started"},
                    {"stage": 2, "state": "not_started"},
                ),
            },
        )
        assert not status.has_pending_calibration
        await workflow.async_close()

    asyncio.run(run())


def test_session_status_exposes_plan_and_standard_skips_offset() -> None:
    """Standard calibration must retain flash offsets instead of resetting them."""
    _workflow_instance, handle, _sessions, _api = _workflow()
    handle.calibration_plan = "standard"
    handle.offset_skipped = True

    status = handle.status()

    assert status.calibration_plan == "standard"
    assert status.offset_disposition == "skipped"


def test_gain_only_binding_without_offset_capability_reports_unavailable() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        del handle.binding.offset_capability

        status = await workflow.async_get_session(handle.session_id)

        assert status.offset_capability == {
            "status": "unavailable",
            "repair_reason": None,
        }
        with pytest.raises(WorkflowCapabilityUnavailable):
            await workflow.async_check_offset_readiness(handle.session_id, 0, 1)
        with pytest.raises(WorkflowCapabilityUnavailable):
            await workflow.async_calibrate_offset(handle.session_id, 0, 1, True)
        assert (
            await workflow.async_skip_offset_calibration(handle.session_id)
        ).offset_disposition == "skipped"
        await workflow.async_close()

    asyncio.run(run())


@pytest.mark.parametrize("acknowledged", (None, False, 0, 1, "yes"))
def test_offset_calibration_requires_literal_physical_preparation_acknowledgement(
    acknowledged: object,
) -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()

        with pytest.raises(WorkflowHandleError, match="preparation"):
            await workflow.async_calibrate_offset(
                handle.session_id,
                0,
                1,
                preparation_acknowledged=acknowledged,  # type: ignore[arg-type]
            )

        assert handle.offset_results == {}
        await workflow.async_close()

    asyncio.run(run())


def test_offset_readiness_uses_owned_binding_and_rejects_stale_generation(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        workflow, handle, _sessions, api = _workflow()
        calls: list[tuple[Any, ...]] = []

        async def sources(instance_ids: set[str], **kwargs: Any) -> dict[str, str]:
            assert instance_ids == {"meter_main1", "meter_main2"}
            assert kwargs == {"offset_stage": 1}
            return {"meter_main1": "flash", "meter_main2": "unknown"}

        api.async_calibration_sources = sources

        async def readiness(
            session: Any, binding: Any, board_index: int, stage: int, **kwargs: Any
        ) -> OffsetReadinessResult:
            calls.append((session, binding, board_index, stage, kwargs))
            return OffsetReadinessResult(
                stage, True, 1, (), (), DEFAULT_OFFSET_READINESS_THRESHOLDS
            )

        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.workflow.async_check_offset_readiness",
            readiness,
        )
        result = await workflow.async_check_offset_readiness(handle.session_id, 0, 1)
        assert result.ready
        assert result.saved_offset_sources == (
            ("main_1", "flash"),
            ("main_2", "unknown"),
        )
        assert handle.offset_results == {}
        assert calls == [
            (
                api,
                handle.binding,
                0,
                1,
                {"timeout": handle.timing_policy.sensor_window_timeout_s},
            )
        ]

        async def stale(*_args: Any, **_kwargs: Any) -> OffsetReadinessResult:
            return OffsetReadinessResult(
                1, True, 0, (), (), DEFAULT_OFFSET_READINESS_THRESHOLDS
            )

        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.workflow.async_check_offset_readiness",
            stale,
        )
        with pytest.raises(WorkflowHandleError, match="stale"):
            await workflow.async_check_offset_readiness(handle.session_id, 0, 1)
        await workflow.async_close()

    asyncio.run(run())


def test_one_offset_call_maps_one_board_stage_and_status_retains_result() -> None:
    async def run() -> None:
        workflow, handle, sessions, api = _workflow()
        calls: list[tuple[Any, ...]] = []

        class Calibration:
            async def async_calibrate_offset_board(
                self, *args: Any, **kwargs: Any
            ) -> OffsetCalibrationResult:
                calls.append((*args, kwargs))
                sessions._pending_calibrations[MAC] = _pending(
                    handle, offsets=(("meter_main1", OFFSET_TABLE),)
                )
                return OffsetCalibrationResult(
                    OffsetCalibrationState.APPLIED_PENDING_RESTART_VERIFICATION,
                    0,
                    1,
                    (("meter_main1", OFFSET_TABLE),),
                    (),
                    False,
                )

        workflow._calibration = Calibration()  # type: ignore[assignment]

        result = await workflow.async_calibrate_offset(handle.session_id, 0, 1, True)
        status = await workflow.async_get_session(handle.session_id)

        assert result.expected_tables == (("meter_main1", OFFSET_TABLE),)
        assert calls == [
            (
                MAC,
                api,
                handle.binding,
                0,
                1,
                {
                    "confirm_retry": False,
                    "timing_policy": handle.timing_policy,
                },
            )
        ]
        assert status.offset_disposition == "in_progress"
        assert status.offset_boards[0]["stages"] == (
            {"stage": 1, "state": "completed"},
            {"stage": 2, "state": "not_started"},
        )
        assert status.has_pending_calibration
        await workflow.async_close()

    asyncio.run(run())


def test_noncanonical_offset_targets_cannot_bypass_partial_retry_confirmation() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        calls: list[tuple[int, int, bool]] = []

        class Calibration:
            async def async_calibrate_offset_board(
                self,
                _mac: str,
                _session: Any,
                _binding: Any,
                board_index: int,
                stage: int,
                *,
                confirm_retry: bool,
                timing_policy: Any,
            ) -> OffsetCalibrationResult:
                del timing_policy
                calls.append((board_index, stage, confirm_retry))
                return OffsetCalibrationResult(
                    OffsetCalibrationState.PARTIAL,
                    board_index,
                    stage,
                    (("meter_main1", OFFSET_TABLE),),
                    ("main_2",),
                    True,
                )

        workflow._calibration = Calibration()  # type: ignore[assignment]
        await workflow.async_calibrate_offset(handle.session_id, 0, 1, True)

        for board_index, stage in ((False, 1), (0.0, 1), (0, True), (0, 1.0)):
            with pytest.raises(WorkflowHandleError, match="target is invalid"):
                await workflow.async_calibrate_offset(
                    handle.session_id,
                    board_index,  # type: ignore[arg-type]
                    stage,  # type: ignore[arg-type]
                    True,
                )

        assert calls == [(0, 1, False)]
        await workflow.async_close()

    asyncio.run(run())


def test_offset_disposition_completes_only_after_both_board_stages() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        for stage, table in ((1, OFFSET_TABLE), (2, POWER_OFFSET_TABLE)):
            handle.offset_results[(0, stage)] = OffsetCalibrationResult(
                OffsetCalibrationState.APPLIED_PENDING_RESTART_VERIFICATION,
                0,
                stage,
                (("meter_main1", table),),
                (),
                False,
            )

        status = await workflow.async_get_session(handle.session_id)

        assert status.offset_disposition == "completed"
        assert tuple(stage["state"] for stage in status.offset_boards[0]["stages"]) == (
            "completed",
            "completed",
        )
        await workflow.async_close()

    asyncio.run(run())


def test_skip_before_mutation_publishes_once_and_never_calls_engine() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        events: list[Any] = []
        workflow.subscribe_session(handle.session_id, events.append)

        status = await workflow.async_skip_offset_calibration(handle.session_id)

        assert status.offset_disposition == "skipped"
        assert status.offset_boards[0]["stages"] == (
            {"stage": 1, "state": "skipped"},
            {"stage": 2, "state": "skipped"},
        )
        assert not status.has_pending_calibration
        assert events == [status]
        with pytest.raises(WorkflowHandleError, match="already finalized"):
            await workflow.async_skip_offset_calibration(handle.session_id)
        assert events == [status]
        await workflow.async_close()

    asyncio.run(run())


def test_skip_after_offset_mutation_is_partial_and_preserves_pending_values() -> None:
    async def run() -> None:
        workflow, handle, sessions, _api = _workflow()
        handle.offset_results[(0, 1)] = OffsetCalibrationResult(
            OffsetCalibrationState.PARTIAL,
            0,
            1,
            (("meter_main1", OFFSET_TABLE),),
            ("main_2",),
            True,
            "second chip failed",
        )
        pending = _pending(handle, offsets=(("meter_main1", OFFSET_TABLE),))
        sessions._pending_calibrations[MAC] = pending

        status = await workflow.async_skip_offset_calibration(handle.session_id)

        assert status.offset_disposition == "partial"
        assert status.offset_boards[0]["stages"] == (
            {"stage": 1, "state": "partial"},
            {"stage": 2, "state": "skipped"},
        )
        assert status.has_pending_calibration
        assert sessions.pending_calibration(MAC) == pending
        assert handle.state == "applied_pending_restart_verification"
        await workflow.async_close()

    asyncio.run(run())


@pytest.mark.parametrize(
    ("capability", "repair_reason"),
    [
        (OffsetControlStatus.UNAVAILABLE, None),
        (OffsetControlStatus.INVALID, "duplicate run control"),
    ],
)
def test_unavailable_or_invalid_offset_is_skip_only(
    capability: OffsetControlStatus,
    repair_reason: str | None,
) -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow(
            capability, repair_reason=repair_reason
        )
        status = await workflow.async_get_session(handle.session_id)
        assert status.offset_capability == {
            "status": capability.value,
            "repair_reason": repair_reason,
        }
        with pytest.raises(WorkflowCapabilityUnavailable):
            await workflow.async_check_offset_readiness(handle.session_id, 0, 1)
        with pytest.raises(WorkflowCapabilityUnavailable):
            await workflow.async_calibrate_offset(handle.session_id, 0, 1, True)
        assert (
            await workflow.async_skip_offset_calibration(handle.session_id)
        ).offset_disposition == "skipped"
        await workflow.async_close()

    asyncio.run(run())


def test_has_pending_calibration_includes_gain_only_pending_state() -> None:
    async def run() -> None:
        workflow, handle, sessions, _api = _workflow()
        sessions._pending_calibrations[MAC] = _pending(
            handle, gains=(("meter_main1", (100, 200, 300)),)
        )

        status = await workflow.async_get_session(handle.session_id)

        assert status.has_pending_calibration
        assert status.offset_disposition == "not_started"
        await workflow.async_close()

    asyncio.run(run())


def test_complete_without_changes_finishes_once_without_restart_or_persistence() -> (
    None
):
    async def run() -> None:
        workflow, handle, sessions, api = _workflow()
        events: list[Any] = []

        async def forbidden(*_args: Any, **_kwargs: Any) -> None:
            raise AssertionError("no-change completion must not restart or persist")

        api.async_restart = forbidden
        workflow._calibration.async_verify_after_restart = forbidden  # type: ignore[method-assign]
        workflow._calibration._persist_verified = forbidden
        workflow.subscribe_session(handle.session_id, events.append)

        status = await workflow.async_complete_calibration_without_changes(
            handle.session_id
        )
        with pytest.raises(WorkflowHandleError, match="already finalized"):
            await workflow.async_acknowledge_safety(handle.session_id, True)
        with pytest.raises(WorkflowHandleError, match="already finalized"):
            await workflow.async_skip_offset_calibration(handle.session_id)
        with pytest.raises(WorkflowHandleError, match="already finalized"):
            await workflow.async_calibrate_voltage(
                handle.session_id,
                "main",
                120.0,
                False,
            )
        repeated = await workflow.async_complete_calibration_without_changes(
            handle.session_id
        )

        assert status.state == "verified"
        assert not status.has_pending_calibration
        assert repeated == status
        assert events == [status]
        assert sessions.pending_calibration(MAC) is None
        sessions._pending_calibrations[MAC] = _pending(
            handle, gains=(("meter_main1", (100, 200, 300)),)
        )
        with pytest.raises(WorkflowHandleError, match="restart verification"):
            await workflow.async_complete_calibration_without_changes(handle.session_id)
        sessions._pending_calibrations.clear()
        with pytest.raises(WorkflowHandleError, match="already finalized"):
            await workflow.async_restart_and_verify(handle.session_id)
        await workflow.async_close()

    asyncio.run(run())


@pytest.mark.parametrize(
    "state",
    (
        "partial",
        "indeterminate",
        "applied_pending_restart_verification",
        "result_outside_tolerance",
    ),
)
def test_complete_without_changes_rejects_mutation_or_recovery_state_without_tables(
    state: str,
) -> None:
    async def run() -> None:
        workflow, handle, sessions, _api = _workflow()
        handle.state = state
        if state == "indeterminate":
            sessions._pending_calibrations[MAC] = _pending(handle)

        with pytest.raises(WorkflowHandleError, match="restart verification"):
            await workflow.async_complete_calibration_without_changes(handle.session_id)

        assert handle.state == state
        await workflow.async_close()

    asyncio.run(run())


@pytest.mark.parametrize(
    ("gains", "offsets", "power_offsets"),
    [
        (("meter_main1", (100, 200, 300)), (), ()),
        ((), ("meter_main1", OFFSET_TABLE), ()),
        ((), (), ("meter_main1", POWER_OFFSET_TABLE)),
        (
            ("meter_main1", (100, 200, 300)),
            ("meter_main2", OFFSET_TABLE),
            ("meter_main1", POWER_OFFSET_TABLE),
        ),
    ],
    ids=("gain-only", "offset-only-partial", "power-offset-only", "mixed"),
)
def test_complete_without_changes_refuses_and_preserves_every_pending_category(
    gains: tuple[Any, ...],
    offsets: tuple[Any, ...],
    power_offsets: tuple[Any, ...],
) -> None:
    async def run() -> None:
        workflow, handle, sessions, _api = _workflow()
        pending = _pending(
            handle,
            gains=(gains,) if gains else (),
            offsets=(offsets,) if offsets else (),
            power_offsets=(power_offsets,) if power_offsets else (),
        )
        sessions._pending_calibrations[MAC] = pending
        events: list[Any] = []
        workflow.subscribe_session(handle.session_id, events.append)

        with pytest.raises(WorkflowHandleError, match="restart verification"):
            await workflow.async_complete_calibration_without_changes(handle.session_id)

        assert sessions.pending_calibration(MAC) == pending
        assert handle.state == "ready"
        assert events == []
        await workflow.async_close()

    asyncio.run(run())


def test_complete_without_changes_uses_active_operation_and_ttl_guards() -> None:
    async def run() -> None:
        workflow, handle, _sessions, _api = _workflow()
        handle.active_task = asyncio.current_task()
        with pytest.raises(WorkflowHandleError, match="active operation"):
            await workflow.async_complete_calibration_without_changes(handle.session_id)

        handle.active_task = None
        handle.expires_at = 0
        with pytest.raises(WorkflowHandleError, match="stale"):
            await workflow.async_complete_calibration_without_changes(handle.session_id)
        await workflow.async_close()

    asyncio.run(run())
