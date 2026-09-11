import asyncio
from hashlib import sha256

import test_config_transaction as transaction_tests

from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionManager,
    ConfigTransactionState,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    JobResult,
    ReviewDescriptor,
)
from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    MeterCommunicationError,
)


def test_manager_exposes_guided_install_for_ordinary_configuration() -> None:
    assert hasattr(ConfigTransactionManager, "async_guided_install")


def test_guided_install_uses_one_reviewed_compile_and_upload() -> None:
    class ReviewedBuilder(transaction_tests.Builder):
        async def async_prepare_review(
            self, configuration: str, source_sha256: str, proposed_content: str
        ) -> ReviewDescriptor:
            return ReviewDescriptor(
                "review-1",
                source_sha256,
                sha256(proposed_content.encode()).hexdigest(),
                "i" * 64,
                "2026.9.0",
                900,
            )

        async def async_compile_review(self, *args: object, **kwargs: object) -> JobResult:
            del kwargs
            self.calls.append("compile_review")
            return JobResult(True, 0, "", (), "compile-1", None, None, "review-1", "i" * 64, "a" * 64)

        async def async_upload_review(self, *args: object, **kwargs: object) -> JobResult:
            del kwargs
            self.calls.append("upload_review")
            return JobResult(True, 0, "", (), "upload-1", None, None, "review-1", "i" * 64, "a" * 64)

        async def async_release_review(self, review_id: str) -> None:
            assert review_id == "review-1"

    async def run() -> None:
        plan = transaction_tests._managed_entity_plan()
        configuration = transaction_tests._meter_configuration(plan)
        expected = transaction_tests.expected_meter_entity_evidence(
            transaction_tests.MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            transaction_tests._topology(),
        )
        builder = ReviewedBuilder()
        manager = transaction_tests._manager(
            builder,
            transaction_tests.Persistence(),
            evidence=transaction_tests.ReconnectEvidence(
                "aabbccddeeff",
                transaction_tests._topology(),
                {channel.channel: channel.name for channel in configuration.channels},
                6,
                expected.sensor_entities,
            ),
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            transaction_tests._topology(),
            plan,
            transaction_tests._source(),
            meter_configuration=configuration,
            guided=True,
        )
        returned = await manager.async_guided_install(preview.transaction_id, "admin")
        assert returned.state is ConfigTransactionState.PREVIEWED
        task = manager._transaction(preview.transaction_id).guided_task
        assert task is not None
        assert (await task).state is ConfigTransactionState.VERIFIED
        assert builder.calls == ["write", "validate", "compile_review", "upload_review"]

    asyncio.run(run())


def test_guided_verification_recheck_does_not_upload_again() -> None:
    class ReviewedBuilder(transaction_tests.Builder):
        async def async_prepare_review(self, configuration: str, source_sha256: str, proposed_content: str) -> ReviewDescriptor:
            return ReviewDescriptor("review-1", source_sha256, sha256(proposed_content.encode()).hexdigest(), "i" * 64, "2026.9.0", 900)

        async def async_compile_review(self, *args: object, **kwargs: object) -> JobResult:
            del args, kwargs
            self.calls.append("compile_review")
            return JobResult(True, 0, "", (), "compile-1", None, None, "review-1", "i" * 64, "a" * 64)

        async def async_upload_review(self, *args: object, **kwargs: object) -> JobResult:
            del args, kwargs
            self.calls.append("upload_review")
            return JobResult(True, 0, "", (), "upload-1", None, None, "review-1", "i" * 64, "a" * 64)

        async def async_release_review(self, review_id: str) -> None:
            assert review_id == "review-1"

    async def run() -> None:
        plan = transaction_tests._managed_entity_plan()
        configuration = transaction_tests._meter_configuration(plan)
        expected = transaction_tests.expected_meter_entity_evidence(
            transaction_tests.MeterConfigurationRequest(
                configuration.meter, configuration.channels, configuration.aggregates,
                configuration.power_quality, configuration.status_fields,
            ), transaction_tests._topology(),
        )
        builder = ReviewedBuilder()
        manager = transaction_tests._manager(
            builder, transaction_tests.Persistence(),
            evidence=MeterCommunicationError((5,)),
        )
        preview = await manager.async_preview(
            "aabbccddeeff", transaction_tests._topology(), plan, transaction_tests._source(),
            meter_configuration=configuration, expected_sensor_entities=expected.sensor_entities,
            guided=True,
        )
        await manager.async_guided_install(preview.transaction_id, "admin")
        task = manager._transaction(preview.transaction_id).guided_task
        assert task is not None
        retry = await task
        assert retry.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        manager._verifier.evidence = transaction_tests.ReconnectEvidence(
            "aabbccddeeff", transaction_tests._topology(),
            {channel.channel: channel.name for channel in configuration.channels},
            6, expected.sensor_entities,
        )
        verified = await manager.async_recheck_verification(preview.transaction_id)
        assert verified.state is ConfigTransactionState.VERIFIED
        assert builder.calls.count("upload_review") == 1

    asyncio.run(run())
