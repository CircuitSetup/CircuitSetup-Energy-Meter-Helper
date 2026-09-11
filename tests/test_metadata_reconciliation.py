"""Ordinary installs reconcile stale metadata without relaxing calibration CAS."""

import asyncio
from copy import deepcopy
from dataclasses import replace
from hashlib import sha256

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionState,
    TransactionEvidenceCode,
    _trusted_meter_record,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    ElectricalSystem,
    TotalsChangeIntent,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    StoredMeterConfiguration,
)
from tests.test_config_transaction import _evidence
from tests.test_existing_totals import _substituted_native_source
from tests.test_meter_inventory import _inventory
from tests.test_workflow import MAC, _persisted_totals_workflow


async def _stale_workflow():
    source = _substituted_native_source()
    topology = _inventory(source).topology
    _, initial, store, _, _ = await _persisted_totals_workflow(source, topology=topology)
    current = initial.inventory.configuration
    old = StoredMeterConfiguration(
        "0" * 64,
        replace(current.meter, electrical_system=ElectricalSystem.SPLIT_PHASE_120_240),
        tuple(replace(channel, name=f"Old CT {channel.channel}") for channel in current.channels),
        current.default_totals, current.automatic_totals, current.aggregates,
        current.power_quality, current.status_fields, totals_managed=False,
    )
    record = _trusted_meter_record(MAC, topology, initial.snapshot)
    await store.async_save_meter(replace(record, config_sha256=old.config_sha256))
    await store.async_save_verified_meter_configuration(MAC, old.config_sha256, old)
    return await _persisted_totals_workflow(source, store, topology)


async def _preview(workflow, plan, verifier):
    requested = replace(
        plan.inventory.configuration,
        meter=replace(plan.inventory.configuration.meter, electrical_system=ElectricalSystem.SPLIT_PHASE_120_240),
        totals_change_intent=TotalsChangeIntent(adopt_managed_totals=True),
    )
    topology = plan.topology
    status = await workflow._async_preview_meter_configuration(plan, requested)
    transaction = workflow.transactions._transaction(status.transaction_id)
    verifier.evidence = replace(
        _evidence(), topology=topology, current_sensor_count=topology.ct_count,
        ct_names={channel.channel: channel.name for channel in requested.channels},
        sensor_entities=transaction.expected_sensor_entities,
    )
    return status, transaction.plan


def test_ordinary_install_reconciles_stale_record_after_verification():
    """A pre-existing stale record must not fail only after a successful OTA."""
    async def run():
        workflow, plan, store, builder, verifier = await _stale_workflow()
        before = deepcopy(store._store.data)
        preview, mutation = await _preview(workflow, plan, verifier)
        assert store._store.data == before
        assert builder.calls == []
        manager = workflow.transactions
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        assert store._store.data == before
        installed = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert installed.state is ConfigTransactionState.VERIFIED
        saved = await store.async_get_meter_configuration(MAC)
        assert saved.config_sha256 == sha256(mutation.proposed_content.encode()).hexdigest()
        assert saved.channels[0].name != "Old CT 1"
        assert saved.totals_managed
        assert "metadata_persisted" in installed.progress

    asyncio.run(run())


@pytest.mark.parametrize("change", ("metadata", "topology", "remove", "interrupted_session"))
def test_reconciliation_rejects_record_changes_after_preview(change):
    async def run():
        workflow, plan, store, _, verifier = await _stale_workflow()
        preview, _ = await _preview(workflow, plan, verifier)
        manager = workflow.transactions
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        raw = store._store.data["meters"][MAC]
        if change == "metadata":
            raw["meter_configuration"]["channels"][0]["name"] = "Newer edit"
        elif change == "topology":
            raw["topology"]["connection_type"] = "ethernet_lilygo"
        elif change == "remove":
            del store._store.data["meters"][MAC]
        else:
            raw["interrupted_session"] = {"newer": True}
        before = deepcopy(store._store.data)
        installed = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert installed.evidence == (TransactionEvidenceCode.PERSISTENCE_FAILED,)
        assert store._store.data == before

    asyncio.run(run())


@pytest.mark.parametrize("authority", (None, "forged", "other_meter"))
def test_stale_record_requires_exact_private_authority(authority):
    async def run():
        workflow, plan, store, _, verifier = await _stale_workflow()
        preview, _ = await _preview(workflow, plan, verifier)
        transaction = workflow.transactions._transaction(preview.transaction_id)
        fingerprint = authority
        if authority == "other_meter":
            fingerprint = await store.async_get_meter_record_fingerprint("112233445566")
        before = deepcopy(store._store.data)
        with pytest.raises(ValueError):
            await store.async_save_verified_meter_configuration(
                MAC, transaction.source_sha256, transaction.meter_configuration,
                transaction.meter_record, expected_record_fingerprint=fingerprint,
            )
        assert store._store.data == before

    asyncio.run(run())


@pytest.mark.parametrize("invalid", ("topology", "filename", "hash", "null_record"))
def test_exact_fingerprint_cannot_bypass_record_validation(invalid):
    async def run():
        workflow, plan, store, _, verifier = await _stale_workflow()
        preview, _ = await _preview(workflow, plan, verifier)
        transaction = workflow.transactions._transaction(preview.transaction_id)
        raw = store._store.data["meters"][MAC]
        if invalid == "topology":
            raw["topology"]["connection_type"] = "ethernet_lilygo"
        elif invalid == "filename":
            raw["config_filename"] = "different.yaml"
        elif invalid == "hash":
            raw["config_sha256"] = "invalid"
        else:
            store._store.data["meters"][MAC] = None
        fingerprint = await store.async_get_meter_record_fingerprint(MAC)
        before = deepcopy(store._store.data)
        with pytest.raises(ValueError):
            await store.async_save_verified_meter_configuration(
                MAC, transaction.source_sha256, transaction.meter_configuration,
                transaction.meter_record, expected_record_fingerprint=fingerprint,
            )
        assert store._store.data == before

    asyncio.run(run())


def test_gain_persistence_does_not_use_ordinary_reconciliation_authority():
    """Even a full transaction holding a baseline cannot bypass gain receipt CAS."""
    async def run():
        workflow, plan, store, _, verifier = await _stale_workflow()
        preview, mutation = await _preview(workflow, plan, verifier)
        transaction = workflow.transactions._transaction(preview.transaction_id)
        assert transaction.meter_record_fingerprint is not None
        transaction.verification_id = "a" * 32
        before = deepcopy(store._store.data)
        assert not await workflow.transactions._persist_verified_metadata(transaction, mutation)
        assert store._store.data == before

    asyncio.run(run())
