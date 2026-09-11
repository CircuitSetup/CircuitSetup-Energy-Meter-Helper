"""An accepted OTA job survives a lost Builder response without another upload."""

import asyncio

import pytest
import test_guided_configuration_install as guided
from test_guided_curator_regressions import _builder

from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionState,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import JobResult


@pytest.mark.parametrize("completed", (True, False))
def test_lost_upload_response_retains_binding_until_exact_job_is_terminal(completed: bool) -> None:
    async def run() -> None:
        builder = _builder()
        terminal = False
        queries = []

        async def upload(*args, **kwargs):
            builder.calls.append("upload_review")
            raise ConnectionError("follow connection lost after upload admission")

        async def reconcile(review_id, compile_job_id, artifact_sha256):
            queries.append((review_id, compile_job_id, artifact_sha256))
            if not terminal:
                return None
            return JobResult(completed, 0 if completed else 1, "", (), "upload-1",
                review_id="review-1", inputs_sha256="i" * 64, artifact_sha256="a" * 64)

        builder.async_upload_review = upload
        builder.async_reconcile_review_upload = reconcile
        manager, preview = await guided._guided_preview(builder)
        await manager.async_guided_install(preview.transaction_id, "admin")
        live = manager._transaction(preview.transaction_id)
        await live.guided_task
        status = manager.status(preview.transaction_id)
        assert status.failure.reason_code == "upload_outcome_unknown"
        assert not status.rollback_available
        assert manager.sessions.is_config_locked("aabbccddeeff")
        clock = manager._clock
        manager._clock = lambda: live.expires_at + 1
        manager.assert_confirmation(preview.transaction_id, "aabbccddeeff", preview.source_sha256)
        assert manager.status(preview.transaction_id).failure.reason_code == "upload_outcome_unknown"
        manager._clock = clock
        await manager.async_guided_install(preview.transaction_id, "admin")
        await manager.async_recheck_verification(preview.transaction_id)
        assert manager.status(preview.transaction_id).failure.reason_code == "upload_outcome_unknown"
        assert builder.releases == []
        terminal = True
        status = await manager.async_recheck_verification(preview.transaction_id)
        assert status.state is (ConfigTransactionState.VERIFIED if completed else ConfigTransactionState.FAILED)
        assert queries == [("review-1", "compile-1", "a" * 64)] * 2
        assert builder.calls.count("upload_review") == 1
        assert not manager.sessions.is_config_locked("aabbccddeeff")

    asyncio.run(run())
