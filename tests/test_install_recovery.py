"""An uncertain OTA is recovered by verification, including after Core restart."""

import asyncio
import json
from dataclasses import replace

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionState,
)
from custom_components.circuitsetup_energy_meter_helper.store import HelperStore
from tests.test_config_transaction import (
    Builder,
    Job,
    _evidence,
    _managed_entity_plan,
    _manager,
    _meter_configuration,
    _preview,
    _source,
    _topology,
)
from tests.test_store import _CopyingStorage


def _store(backend):
    store = object.__new__(HelperStore)
    store._store = backend
    store._update_lock = asyncio.Lock()
    return store


@pytest.mark.parametrize("boundary", ("upload_response", "upload_cancel", "verify_cancel", "metadata"))
@pytest.mark.parametrize("restart", (False, True))
def test_uncertain_upload_recovers_without_reupload(boundary, restart):
    class Storage(_CopyingStorage):
        fail = False

        async def async_save(self, data):
            if self.fail:
                raise OSError("disk unavailable")
            # Exercise the actual JSON boundary, not retained dataclass objects.
            await super().async_save(json.loads(json.dumps(data)))

    async def run():
        backend = Storage()
        store = _store(backend)

        class Upload(Builder):
            async def async_upload(self, configuration, progress=None):
                result = await super().async_upload(configuration, progress)
                backend.fail = boundary == "metadata"
                return result

        builder = Upload(upload=(
            ConnectionError("acknowledgement lost") if boundary == "upload_response"
            else asyncio.CancelledError() if boundary == "upload_cancel" else None
        ))
        manager = _manager(builder, store, evidence=(
            asyncio.CancelledError() if boundary == "verify_cancel" else None
        ))
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        if boundary.endswith("cancel"):
            with pytest.raises(asyncio.CancelledError):
                await manager.async_confirm_install(preview.transaction_id, "admin")
        else:
            status = await manager.async_confirm_install(preview.transaction_id, "admin")
            assert status.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        backend.fail = False
        if restart:
            await manager.sessions.async_unload()
            manager = _manager(builder, _store(backend))
        else:
            manager._verifier = _manager(builder, store)._verifier
        status = await manager.async_recover_install("aabbccddeeff")
        assert status is not None
        assert "ota_attempted" in status.progress
        if restart:
            assert "device_verified" not in status.progress
        status = await manager.async_confirm_install(status.transaction_id, "admin")
        assert status.state is ConfigTransactionState.VERIFIED
        assert builder.calls.count("upload") == 1
        assert builder.calls.count("write") == 1
        assert "restore" not in builder.calls
        assert await store.async_get_ct_selections("aabbccddeeff")
        assert await _manager(builder, _store(backend)).async_recover_install("aabbccddeeff") is None

    asyncio.run(run())


@pytest.mark.parametrize("boundary", ("metadata", "checkpoint_cleanup"))
def test_full_configuration_metadata_completion_survives_restart(boundary):
    class Storage(_CopyingStorage):
        fail = False

        async def async_save(self, data):
            if self.fail and (
                boundary == "metadata"
                or not data.get("install_recovery", {}).get("aabbccddeeff")
            ):
                raise OSError("save interrupted")
            await super().async_save(json.loads(json.dumps(data)))

    async def run():
        backend = Storage()
        store = _store(backend)
        class Upload(Builder):
            async def async_upload(self, configuration, progress=None):
                result = await super().async_upload(configuration, progress)
                backend.fail = True
                return result
        builder = Upload()
        plan = _managed_entity_plan()
        configuration = _meter_configuration(plan)
        manager = _manager(builder, store)
        preview = await manager.async_preview(
            "aabbccddeeff", _topology(), plan, _source(),
            meter_configuration=configuration, reconcile_stale_metadata=True,
        )
        expected = manager._transaction(preview.transaction_id).expected_sensor_entities
        evidence = replace(_evidence(), ct_names={item.channel: item.name for item in configuration.channels},
                           sensor_entities=expected)
        manager._verifier = _manager(builder, store, evidence=evidence)._verifier
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        checkpoint = await store.async_get_install_recovery("aabbccddeeff")
        assert "top-secret" not in json.dumps(checkpoint)
        backend.fail = False
        await manager.sessions.async_unload()
        manager = _manager(builder, _store(backend), evidence=evidence)
        recovered = await manager.async_recover_install("aabbccddeeff")
        assert recovered is not None and not recovered.rollback_available
        status = await manager.async_confirm_install(recovered.transaction_id, "admin")
        assert status.state is ConfigTransactionState.VERIFIED
        assert status.full_meter_configuration_verified
        assert builder.calls.count("upload") == 1
        assert await store.async_get_meter_configuration("aabbccddeeff") == configuration
        assert await store.async_get_install_recovery("aabbccddeeff") is None

    asyncio.run(run())


def test_authoritative_upload_rejection_has_no_recovery():
    async def run():
        store = _store(_CopyingStorage())
        builder = Builder(upload=Job(False, code=1))
        manager = _manager(builder, store)
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.FAILED
        assert await _manager(builder, store).async_recover_install("aabbccddeeff") is None
        assert builder.calls.count("upload") == 1

    asyncio.run(run())


def test_recovery_refuses_source_drift_and_foreign_identity():
    async def run():
        store = _store(_CopyingStorage())
        builder = Builder(upload=ConnectionError())
        manager = _manager(builder, store)
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        await manager.sessions.async_unload()
        manager = _manager(builder, store)
        assert await manager.async_recover_install("112233445566") is None
        builder.remote_content = "unrelated edit"
        with pytest.raises(ValueError):
            await manager.async_recover_install("aabbccddeeff")
        assert not manager.sessions.is_config_locked("aabbccddeeff")
        assert not await store.async_get_ct_selections("aabbccddeeff")
        assert builder.calls.count("upload") == 1

    asyncio.run(run())


def test_recovered_source_failure_cannot_enable_rollback():
    async def run():
        store = _store(_CopyingStorage())
        builder = Builder(upload=ConnectionError())
        manager = _manager(builder, store)
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        await manager.sessions.async_unload()
        manager = _manager(builder, store)
        status = await manager.async_recover_install("aabbccddeeff")
        assert status is not None
        builder.remote_content = "source changed after recovery"
        with pytest.raises(ValueError):
            await manager.async_confirm_install(status.transaction_id, "admin")
        assert not manager.status(status.transaction_id).rollback_available
        with pytest.raises(RuntimeError, match="rollback"):
            await manager.async_rollback(status.transaction_id)
        await manager.async_abandon(status.transaction_id)
        assert "restore" not in builder.calls
        assert not manager.sessions.is_config_locked("aabbccddeeff")
        assert await store.async_get_install_recovery("aabbccddeeff") is None

    asyncio.run(run())


def test_checkpoint_write_failure_prevents_upload():
    class Storage(_CopyingStorage):
        async def async_save(self, data):
            if data.get("install_recovery", {}).get("aabbccddeeff"):
                raise OSError("disk unavailable")
            await super().async_save(data)

    async def run():
        builder = Builder()
        manager = _manager(builder, _store(Storage()))
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.FAILED
        assert status.evidence == ("persistence_failed",)
        assert "upload" not in builder.calls

    asyncio.run(run())
