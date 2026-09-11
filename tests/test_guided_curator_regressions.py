"""Curator reproductions for reviewed-install recovery gaps."""

import asyncio
from dataclasses import replace

import pytest
import test_guided_configuration_install as guided_tests

from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionState,
    TransactionFailure,
    TransactionFailureReason,
    TransactionFailureStage,
    _job_failure,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ConfigChangedError,
    JobResult,
)
from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    MeterCommunicationError,
)


@pytest.mark.parametrize(
    ("line", "reason", "context"),
    [
        (
            "Secret 'meter_api_key' not defined",
            "required_secret",
            (("secret_name", "meter_api_key"),),
        ),
        (
            "[phase_angle] is an invalid option for [sensor.atm90e32]. Please check the indentation.",
            "unsupported_component_option",
            (("component", "sensor.atm90e32"), ("field", "phase_angle")),
        ),
        (
            "Software/ESPHome/power_quality/6chan_main_power_quality.yaml does not exist in repository",
            "missing_package",
            (("package", "power_quality"),),
        ),
        ("duplicate managed block", "conflicting_managed_override", ()),
        ("Secret 'private_value' not defined", "validation_rejected", ()),
        (
            "password=private_value; package include secret credential",
            "validation_rejected",
            (),
        ),
    ],
)
def test_diagnostics_use_known_error_shapes_without_echoing_provider_text(
    line: str, reason: str, context: tuple[tuple[str, str], ...]
) -> None:
    failure = _job_failure(
        TransactionFailureStage.VALIDATING,
        JobResult(False, 1, "", (line,)),
        TransactionFailureReason.VALIDATION_REJECTED,
        "api:\n  key: !secret meter_api_key\n",
    )
    assert failure.reason_code == reason
    assert failure.context == context
    assert "private_value" not in repr(failure)


def test_diagnostic_context_rejects_unknown_fields() -> None:
    with pytest.raises(ValueError):
        TransactionFailure(
            TransactionFailureStage.VALIDATING,
            TransactionFailureReason.UNKNOWN,
            (("password", "looks_like_an_identifier"),),
        )


def _builder() -> guided_tests.ReviewedFailureBuilder:
    return guided_tests.ReviewedFailureBuilder(
        JobResult(
            True, 0, "", (), "compile-1", None, None, "review-1", "i" * 64, "a" * 64
        ),
        JobResult(
            True, 0, "", (), "upload-1", None, None, "review-1", "i" * 64, "a" * 64
        ),
    )


def test_curator_reload_does_not_expire_a_running_guided_build() -> None:
    async def run() -> None:
        entered = asyncio.Event()
        resume = asyncio.Event()
        builder = _builder()
        original_compile = builder.async_compile_review

        async def held_compile(*args: object, **kwargs: object) -> JobResult:
            entered.set()
            await resume.wait()
            return await original_compile(*args, **kwargs)

        builder.async_compile_review = held_compile
        manager, preview = await guided_tests._guided_preview(builder)
        await manager.async_guided_install(preview.transaction_id, "admin")
        transaction = manager._transaction(preview.transaction_id)
        task = transaction.guided_task
        assert task is not None
        await entered.wait()
        manager._clock = lambda: transaction.expires_at + 1
        try:
            recovered = manager.status(preview.transaction_id)
            assert recovered.state is ConfigTransactionState.VALIDATED
        finally:
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)

    asyncio.run(run())


def test_verification_recovery_outlives_the_consumed_review() -> None:
    async def run() -> None:
        builder = _builder()
        entered, resume = asyncio.Event(), asyncio.Event()
        original = builder.async_compile_review

        async def held_compile(*args: object, **kwargs: object) -> JobResult:
            entered.set()
            await resume.wait()
            return await original(*args, **kwargs)

        builder.async_compile_review = held_compile
        manager, preview = await guided_tests._guided_preview(builder)
        evidence = manager._verifier.evidence
        manager._verifier.evidence = MeterCommunicationError((5,))
        await manager.async_guided_install(preview.transaction_id, "admin")
        transaction = manager._transaction(preview.transaction_id)
        task = transaction.guided_task
        assert task is not None
        await entered.wait()
        now = transaction.expires_at + 1
        manager._clock = lambda: now
        resume.set()
        assert (
            await task
        ).state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert manager.status(preview.transaction_id).guided_running is False
        assert transaction.expires_at > now
        assert (
            await manager.async_guided_install(preview.transaction_id, "admin")
        ).state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        manager._verifier.evidence = evidence
        assert (
            await manager.async_recheck_verification(preview.transaction_id)
        ).state is ConfigTransactionState.VERIFIED
        assert builder.calls.count("upload_review") == 1

    asyncio.run(run())


def test_disconnected_recheck_remains_owned_and_releases_running_status() -> None:
    async def run() -> None:
        builder = _builder()
        manager, preview = await guided_tests._guided_preview(builder)
        evidence = manager._verifier.evidence
        manager._verifier.evidence = MeterCommunicationError((5,))
        await manager.async_guided_install(preview.transaction_id, "admin")
        transaction = manager._transaction(preview.transaction_id)
        assert transaction.guided_task is not None
        await transaction.guided_task
        entered, resume = asyncio.Event(), asyncio.Event()

        async def held_verify(mac: str) -> object:
            entered.set()
            await resume.wait()
            raise MeterCommunicationError((5,))

        original = manager._verifier.async_verify
        manager._verifier.async_verify = held_verify
        manager._reconnect_timeout = 10
        caller = asyncio.create_task(
            manager.async_recheck_verification(preview.transaction_id)
        )
        await entered.wait()
        task = transaction.verification_task
        assert task is not None
        assert manager.status(preview.transaction_id).guided_running
        caller.cancel()
        await asyncio.gather(caller, return_exceptions=True)
        assert not task.done() and task in transaction.active_tasks
        with pytest.raises(RuntimeError, match="already running"):
            await manager.async_rollback(preview.transaction_id)
        resume.set()
        await task
        assert transaction.verification_task is None
        assert task not in transaction.active_tasks
        assert not manager.status(preview.transaction_id).guided_running
        manager._verifier.async_verify = original
        manager._verifier.evidence = evidence
        assert (
            await manager.async_recheck_verification(preview.transaction_id)
        ).state is ConfigTransactionState.VERIFIED

    asyncio.run(run())


def test_curator_completed_guided_start_returns_retained_outcome() -> None:
    async def run() -> None:
        builder = _builder()
        manager, preview = await guided_tests._guided_preview(builder)
        await manager.async_guided_install(preview.transaction_id, "admin")
        task = manager._transaction(preview.transaction_id).guided_task
        assert task is not None
        assert (await task).state is ConfigTransactionState.VERIFIED
        manager.assert_confirmation(
            preview.transaction_id, "aabbccddeeff", preview.source_sha256
        )
        replay = await manager.async_guided_install(preview.transaction_id, "admin")
        assert replay.state is ConfigTransactionState.VERIFIED
        assert builder.calls.count("upload_review") == 1

    asyncio.run(run())


@pytest.mark.parametrize("failure", ["validation", "source", "artifact", "review"])
def test_guided_refuses_upload_after_failed_validation_or_binding(failure: str) -> None:
    async def run() -> None:
        builder = _builder()
        if failure == "validation":
            builder.validation = [guided_tests.transaction_tests.Job(False)]
        elif failure == "source":

            async def changed(*args: object) -> None:
                raise ConfigChangedError("a" * 64, "b" * 64)

            builder.async_update_config = changed
        elif failure == "artifact":
            builder.compile_result = replace(
                builder.compile_result, artifact_sha256="malformed"
            )
        else:
            builder.compile_result = replace(
                builder.compile_result, review_id="another-review"
            )
        manager, preview = await guided_tests._guided_preview(builder)
        await manager.async_guided_install(preview.transaction_id, "admin")
        task = manager._transaction(preview.transaction_id).guided_task
        assert task is not None
        result = await task
        assert result.state in {
            ConfigTransactionState.FAILED,
            ConfigTransactionState.ROLLED_BACK,
        }
        assert "upload_review" not in builder.calls
        if failure in {"validation", "source"}:
            assert "compile_review" not in builder.calls

    asyncio.run(run())


def test_review_expiring_while_waiting_for_calibration_never_writes() -> None:
    async def run() -> None:
        builder = _builder()
        manager, preview = await guided_tests._guided_preview(builder)
        lease = await manager.sessions.async_acquire_calibration("aabbccddeeff")
        await manager.async_guided_install(preview.transaction_id, "admin")
        transaction = manager._transaction(preview.transaction_id)
        task = transaction.guided_task
        assert task is not None
        await asyncio.sleep(0)
        duplicate = await manager.async_guided_install(preview.transaction_id, "admin")
        assert duplicate.transaction_id == preview.transaction_id
        assert transaction.guided_task is task
        now = transaction.expires_at + 1
        manager._clock = lambda: now
        lease.release()
        await task
        assert builder.calls == []

    asyncio.run(run())
