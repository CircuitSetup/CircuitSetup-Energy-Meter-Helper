"""Install recovery keeps uncertain OTA outcomes from claiming installed firmware."""

import asyncio
import json
from dataclasses import replace

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionState,
    RollbackFailedError,
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


@pytest.mark.parametrize("boundary", ("upload_response", "upload_cancel", "verify_cancel", "ack_checkpoint", "metadata"))
@pytest.mark.parametrize("restart", (False, True))
def test_install_recovery_requires_acknowledged_upload(boundary, restart):
    class Storage(_CopyingStorage):
        fail = False
        ack_persisted = False

        async def async_save(self, data):
            if self.fail:
                if boundary == "metadata" and not self.ack_persisted and data.get(
                    "install_recovery", {}
                ).get("aabbccddeeff", {}).get("ota_uploaded") is True:
                    self.ack_persisted = True
                else:
                    raise OSError("disk unavailable")
            # Exercise the actual JSON boundary, not retained dataclass objects.
            await super().async_save(json.loads(json.dumps(data)))

    async def run():
        backend = Storage()
        store = _store(backend)

        class Upload(Builder):
            fault_injected = False

            async def async_upload(self, configuration, progress=None):
                result = await super().async_upload(configuration, progress)
                if boundary in {"metadata", "ack_checkpoint"} and not self.fault_injected:
                    backend.fail = True
                    self.fault_injected = True
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

        pending = manager.status(preview.transaction_id)
        assert not pending.rollback_available
        assert not await store.async_get_ct_selections("aabbccddeeff")
        checkpoint = await store.async_get_install_recovery("aabbccddeeff")
        assert checkpoint["ota_uploaded"] is (boundary in {"verify_cancel", "metadata"})
        if boundary in {"upload_response", "upload_cancel"}:
            builder.upload = Job(True)
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
        assert builder.calls.count("upload") == (
            2 if boundary in {"upload_response", "upload_cancel"}
            or boundary == "ack_checkpoint" and restart else 1
        )
        assert builder.calls.count("write") == 1
        assert "restore" not in builder.calls
        assert await store.async_get_ct_selections("aabbccddeeff")
        assert await _manager(builder, _store(backend)).async_recover_install("aabbccddeeff") is None

    asyncio.run(run())


def test_uncertain_upload_source_failure_never_enables_rollback():
    async def run():
        store = _store(_CopyingStorage())
        builder = Builder(upload=ConnectionError("response lost"))
        manager = _manager(builder, store)
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")

        proposed = manager._transaction(preview.transaction_id).plan.proposed_content
        builder.remote_content = "source changed after upload attempt"
        with pytest.raises(ValueError):
            await manager.async_confirm_install(preview.transaction_id, "admin")
        pending = manager.status(preview.transaction_id)
        assert pending.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert not pending.rollback_available
        with pytest.raises(RuntimeError, match="rollback"):
            await manager.async_rollback(preview.transaction_id)
        assert "restore" not in builder.calls

        builder.remote_content = proposed
        builder.upload = Job(True)
        verified = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert verified.state is ConfigTransactionState.VERIFIED
        assert builder.calls.count("upload") == 2

    asyncio.run(run())


def test_legacy_checkpoint_retries_upload_before_verification():
    async def run():
        store = _store(_CopyingStorage())
        builder = Builder(upload=ConnectionError("response lost"))
        manager = _manager(builder, store)
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")

        checkpoint = await store.async_get_install_recovery("aabbccddeeff")
        checkpoint["version"] = 1
        checkpoint.pop("ota_uploaded")
        await store.async_save_install_recovery(
            "aabbccddeeff", preview.transaction_id, checkpoint
        )
        await manager.sessions.async_unload()

        builder.upload = Job(True)
        manager = _manager(builder, store)
        recovered = await manager.async_recover_install("aabbccddeeff")
        assert recovered is not None
        assert "ota_uploaded" not in recovered.progress
        verified = await manager.async_confirm_install(recovered.transaction_id, "admin")
        assert verified.state is ConfigTransactionState.VERIFIED
        assert builder.calls.count("upload") == 2

    asyncio.run(run())


def test_uncertain_upload_expiry_preserves_checkpoint_without_restoring_yaml():
    async def run():
        store = _store(_CopyingStorage())
        builder = Builder(upload=ConnectionError("response lost"))
        manager = _manager(builder, store)
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")

        manager._transaction(preview.transaction_id).expires_at = 0
        with pytest.raises(KeyError, match="expired"):
            manager.status(preview.transaction_id)
        assert "restore" not in builder.calls
        assert await store.async_get_install_recovery("aabbccddeeff") is not None
        recovered = await _manager(builder, store).async_recover_install("aabbccddeeff")
        assert recovered is not None
        assert not recovered.rollback_available

    asyncio.run(run())


@pytest.mark.parametrize("clear_fails_once", (False, True))
def test_pre_upload_rollback_clears_recovery_checkpoint(clear_fails_once):
    async def run():
        class Storage(_CopyingStorage):
            fail_clear = False

            async def async_save(self, data):
                if self.fail_clear and not data.get("install_recovery"):
                    self.fail_clear = False
                    raise OSError("checkpoint clear unavailable")
                await super().async_save(data)

        backend = Storage()
        store = _store(backend)

        class LostSource(Builder):
            failed = False

            async def async_get_config(self, configuration):
                if not self.failed and await store.async_get_install_recovery("aabbccddeeff"):
                    self.failed = True
                    raise ConnectionError("source read unavailable")
                return await super().async_get_config(configuration)

        builder = LostSource()
        manager = _manager(builder, store)
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        with pytest.raises(ValueError):
            await manager.async_confirm_install(preview.transaction_id, "admin")
        assert await store.async_get_install_recovery("aabbccddeeff") is not None
        assert manager.status(preview.transaction_id).rollback_available

        backend.fail_clear = clear_fails_once
        if clear_fails_once:
            with pytest.raises(RollbackFailedError):
                await manager.async_rollback(preview.transaction_id)
            assert manager.status(preview.transaction_id).rollback_available
            assert await store.async_get_install_recovery("aabbccddeeff") is not None
        rolled_back = await manager.async_rollback(preview.transaction_id)
        assert rolled_back.state is ConfigTransactionState.ROLLED_BACK
        assert await store.async_get_install_recovery("aabbccddeeff") is None
        assert await _manager(builder, store).async_recover_install("aabbccddeeff") is None
        assert "upload" not in builder.calls
        assert builder.calls.count("restore") == 1

    asyncio.run(run())


@pytest.mark.parametrize("boundary", ("metadata", "checkpoint_cleanup"))
def test_full_configuration_metadata_completion_survives_restart(boundary):
    class Storage(_CopyingStorage):
        fail = False
        ack_saved = False

        async def async_save(self, data):
            if self.fail:
                if boundary == "metadata":
                    if self.ack_saved:
                        raise OSError("save interrupted")
                    self.ack_saved = True
                elif not data.get("install_recovery", {}).get("aabbccddeeff"):
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


@pytest.mark.parametrize("next_action", ("retry", "abandon"))
def test_upload_rejection_checkpoint_clear_failure_keeps_recovery_available(next_action):
    class Storage(_CopyingStorage):
        fail_clear = False

        async def async_save(self, data):
            if self.fail_clear and not data.get("install_recovery"):
                raise OSError("checkpoint clear unavailable")
            await super().async_save(data)

    async def run():
        backend = Storage()
        store = _store(backend)

        class Upload(Builder):
            injected = False

            async def async_upload(self, configuration, progress=None):
                result = await super().async_upload(configuration, progress)
                if not self.injected:
                    backend.fail_clear = True
                    self.injected = True
                return result

        builder = Upload(upload=Job(False, code=1))
        manager = _manager(builder, store)
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")

        assert status.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert "upload_failed" in status.evidence
        assert "persistence_failed" in status.evidence
        assert not status.rollback_available
        assert await store.async_get_install_recovery("aabbccddeeff") is not None

        backend.fail_clear = False
        if next_action == "retry":
            builder.upload = Job(True)
            status = await manager.async_confirm_install(preview.transaction_id, "admin")
            assert status.state is ConfigTransactionState.VERIFIED
            assert "upload_failed" not in status.evidence
        else:
            status = await manager.async_abandon(preview.transaction_id)
            assert status.state is ConfigTransactionState.FAILED
            assert "cancelled" in status.evidence
        assert await store.async_get_install_recovery("aabbccddeeff") is None

    asyncio.run(run())


def test_terminal_verification_checkpoint_clear_failure_retries_without_upload():
    class Storage(_CopyingStorage):
        fail_clear = False

        async def async_save(self, data):
            if self.fail_clear and not data.get("install_recovery"):
                raise OSError("checkpoint clear unavailable")
            await super().async_save(data)

    async def run():
        backend = Storage()
        store = _store(backend)

        class Upload(Builder):
            async def async_upload(self, configuration, progress=None):
                result = await super().async_upload(configuration, progress)
                backend.fail_clear = True
                return result

        builder = Upload()
        manager = _manager(builder, store, evidence=replace(_evidence(), topology=_topology(1)))
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        waiting = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert waiting.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert "topology_mismatch" in waiting.evidence
        assert "persistence_failed" in waiting.evidence
        assert await store.async_get_install_recovery("aabbccddeeff") is not None

        backend.fail_clear = False
        manager._verifier = _manager(builder, store)._verifier
        verified = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert verified.state is ConfigTransactionState.VERIFIED
        assert "topology_mismatch" not in verified.evidence
        assert builder.calls.count("upload") == 1
        assert await store.async_get_install_recovery("aabbccddeeff") is None

    asyncio.run(run())


def test_recovery_exposes_source_drift_for_safe_abandonment():
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
        recovered = await manager.async_recover_install("aabbccddeeff")
        assert recovered is not None
        assert recovered.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert "source_changed" in recovered.evidence
        assert not recovered.rollback_available
        assert manager.sessions.is_config_locked("aabbccddeeff")
        assert not await store.async_get_ct_selections("aabbccddeeff")
        assert builder.calls.count("upload") == 1
        abandoned = await manager.async_abandon(recovered.transaction_id)
        assert abandoned.state is ConfigTransactionState.FAILED
        assert not manager.sessions.is_config_locked("aabbccddeeff")
        assert await store.async_get_install_recovery("aabbccddeeff") is None

    asyncio.run(run())


def test_recovered_source_drift_can_retry_after_restoring_reviewed_yaml():
    async def run():
        store = _store(_CopyingStorage())
        builder = Builder(upload=ConnectionError())
        manager = _manager(builder, store)
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        reviewed_content = builder.remote_content
        await manager.sessions.async_unload()

        builder.remote_content = "unrelated edit"
        builder.upload = Job(True)
        manager = _manager(builder, store)
        recovered = await manager.async_recover_install("aabbccddeeff")
        assert recovered is not None and "source_changed" in recovered.evidence
        waiting = await manager.async_confirm_install(recovered.transaction_id, "admin")
        assert waiting.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert builder.calls.count("upload") == 1

        builder.remote_content = reviewed_content
        verified = await manager.async_confirm_install(recovered.transaction_id, "admin")
        assert verified.state is ConfigTransactionState.VERIFIED
        assert builder.calls.count("upload") == 2
        assert await store.async_get_install_recovery("aabbccddeeff") is None

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
        waiting = await manager.async_confirm_install(status.transaction_id, "admin")
        assert waiting.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert "source_changed" in waiting.evidence
        assert not waiting.rollback_available
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
