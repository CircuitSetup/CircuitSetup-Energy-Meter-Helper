"""Adversarial tests for configuration/install transactions."""

import asyncio
from collections.abc import Callable
from dataclasses import dataclass, replace
from hashlib import sha256

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionManager,
    ConfigTransactionState,
    ReconnectEvidence,
    RollbackFailedError,
    TransactionEvidenceCode,
    TransactionStatus,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ConfigChangedError,
    ESPHomeConfigSnapshot,
    JobProgress,
    JobProgressStage,
)
from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
    expected_meter_entity_evidence,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    ChannelSettings,
    CircuitAggregate,
    CircuitRole,
    ElectricalSystem,
    EnergyMode,
    MeasurementMethod,
    MeterConfigurationRequest,
    MeterSettings,
    VoltageLayout,
    VoltageReferenceConfig,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    ConfigMutationPlan,
    MeterTopology,
    StoredCTSelection,
    SubstitutionChange,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    StoredMeterConfiguration,
)


@dataclass
class Job:
    success: bool
    summary: str = ""
    output_tail: tuple[str, ...] = ()
    code: int | None = None
    error_count: int | None = None
    warning_count: int | None = None


class Builder:
    def __init__(
        self,
        *,
        validation: tuple[Job | BaseException, ...] | None = None,
        compile: Job | BaseException | None = None,
        upload: Job | BaseException | None = None,
        restore_error: BaseException | None = None,
        remote_content: str = "prior",
    ) -> None:
        self.validation = list(validation or (Job(True),))
        self.compile = compile if compile is not None else Job(True)
        self.upload = upload if upload is not None else Job(True)
        self.restore_error = restore_error
        self.remote_content = remote_content
        self.calls: list[str] = []
        self.restored_content: str | None = None
        self.pauses: dict[str, asyncio.Event] = {}
        self.started: dict[str, asyncio.Event] = {}

    def pause(self, operation: str) -> asyncio.Event:
        self.pauses[operation] = asyncio.Event()
        self.started[operation] = asyncio.Event()
        return self.pauses[operation]

    async def _enter(self, operation: str) -> None:
        self.calls.append(operation)
        if operation in self.started:
            self.started[operation].set()
            await self.pauses[operation].wait()

    async def async_update_config(
        self, snapshot: ESPHomeConfigSnapshot, proposed: str
    ) -> None:
        del snapshot
        await self._enter("write")
        self.remote_content = proposed

    async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
        await self._enter("read")
        return ESPHomeConfigSnapshot(
            configuration,
            self.remote_content,
            sha256(self.remote_content.encode()).hexdigest(),
        )

    async def async_validate(self, configuration: str) -> Job:
        del configuration
        await self._enter("validate")
        result = (
            self.validation.pop(0) if len(self.validation) > 1 else self.validation[0]
        )
        if isinstance(result, BaseException):
            raise result
        return result

    async def async_compile(
        self,
        configuration: str,
        progress: Callable[[JobProgress], None] | None = None,
    ) -> Job:
        del configuration
        if progress is not None:
            progress(JobProgress(JobProgressStage.TRANSFER, 65))
        await self._enter("compile")
        if isinstance(self.compile, BaseException):
            raise self.compile
        return self.compile

    async def async_upload(
        self,
        configuration: str,
        progress: Callable[[JobProgress], None] | None = None,
    ) -> Job:
        del configuration
        if progress is not None:
            for percentage in range(101):
                progress(JobProgress(JobProgressStage.UPLOADING, percentage))
        await self._enter("upload")
        if isinstance(self.upload, BaseException):
            raise self.upload
        return self.upload

    async def async_restore_content(
        self,
        configuration: str,
        content: str,
        expected_current_sha256: str | None = None,
    ) -> None:
        del configuration
        await self._enter("restore")
        if (
            expected_current_sha256 is not None
            and sha256(self.remote_content.encode()).hexdigest()
            != expected_current_sha256
            and self.remote_content != content
        ):
            raise ConfigChangedError(
                expected_current_sha256,
                sha256(self.remote_content.encode()).hexdigest(),
            )
        self.restored_content = content
        self.remote_content = content
        if self.restore_error is not None:
            raise self.restore_error


class UncertainUpdateBuilder(Builder):
    """Commit a selected remote outcome, then lose or withhold the response."""

    def __init__(self, outcome: str, *, block: bool = False) -> None:
        super().__init__()
        self.outcome = outcome
        if block:
            self.pause("write")

    async def async_update_config(
        self, snapshot: ESPHomeConfigSnapshot, proposed: str
    ) -> None:
        self.calls.append("write")
        self.remote_content = {
            "source": snapshot.content,
            "proposed": proposed,
            "foreign": "foreign concurrent content",
        }[self.outcome]
        if "write" in self.started:
            self.started["write"].set()
            await self.pauses["write"].wait()
        raise ConnectionError("response lost after remote outcome")


class Persistence:
    def __init__(
        self,
        error: BaseException | None = None,
        selections: tuple[StoredCTSelection, ...] = (),
    ) -> None:
        self.saved: list[object] = []
        self.error = error
        self.selections = selections
        self.meter_configuration: object | None = None

    async def async_get_meter_configuration(self, _mac: str) -> object | None:
        return self.meter_configuration

    async def async_get_ct_selections(self, _mac: str) -> tuple[StoredCTSelection, ...]:
        return self.selections

    async def async_save_verified_ct_selections(
        self, mac: str, selections: tuple[StoredCTSelection, ...]
    ) -> None:
        if self.error is not None:
            raise self.error
        self.selections = selections
        self.saved.append((mac, selections))

    async def async_save_verified_ct_selections_and_mark_verified_calibration_installed(
        self,
        mac: str,
        _expected_source_sha256: str,
        _proposed_sha256: str,
        _record: object,
        selections: tuple[StoredCTSelection, ...],
        verification_id: str,
        transaction_id: str,
    ) -> bool:
        if self.error is not None:
            raise self.error
        self.selections = selections
        self.saved.append((mac, selections, verification_id, transaction_id))
        return True

    async def async_save_verified_meter_configuration(
        self,
        mac: str,
        expected_source_sha256: str,
        configuration: StoredMeterConfiguration,
        _record: object,
    ) -> None:
        if self.error is not None:
            raise self.error
        self.meter_configuration = configuration
        self.selections = configuration.ct_selections
        self.saved.append((mac, configuration))

    async def async_save_verified_meter_configuration_and_mark_verified_calibration_installed(
        self,
        mac: str,
        expected_source_sha256: str,
        configuration: StoredMeterConfiguration,
        verification_id: str,
        transaction_id: str,
        _record: object,
    ) -> bool:
        if self.error is not None:
            raise self.error
        self.meter_configuration = configuration
        self.selections = configuration.ct_selections
        self.saved.append((mac, configuration, verification_id, transaction_id))
        return True


class Verifier:
    def __init__(
        self,
        evidence: ReconnectEvidence
        | BaseException
        | list[ReconnectEvidence | BaseException],
    ) -> None:
        self.evidence = evidence
        self.calls = 0

    async def async_verify(self, mac: str) -> ReconnectEvidence:
        del mac
        self.calls += 1
        evidence = (
            self.evidence.pop(0)
            if isinstance(self.evidence, list) and len(self.evidence) > 1
            else self.evidence[-1]
            if isinstance(self.evidence, list)
            else self.evidence
        )
        if isinstance(evidence, BaseException):
            raise evidence
        return evidence


def _topology(addons: int = 0) -> MeterTopology:
    return MeterTopology.from_addon_count(
        addons,
        connection_type="wifi",
        voltage_layout="standard",
        project_name=(
            "circuitsetup.6c-energy-meter"
            if not addons
            else f"circuitsetup.6c-energy-meter-{addons}-addon"
        ),
        evidence=(),
    )


def _source(content: str = "prior") -> ESPHomeConfigSnapshot:
    return ESPHomeConfigSnapshot(
        "meter.yaml", content, sha256(content.encode()).hexdigest()
    )


def _plan(
    content: str = "prior", *, diff: str = "+ ct1_name: Kitchen"
) -> ConfigMutationPlan:
    return ConfigMutationPlan(
        "meter.yaml",
        sha256(content.encode()).hexdigest(),
        (SubstitutionChange("ct1_name", "CT 1", "Kitchen"),),
        diff,
        "api:\n  encryption_key: top-secret\nsubstitutions:\n  ct1_name: Kitchen\n",
    )


def _managed_entity_plan() -> ConfigMutationPlan:
    plan = _plan()
    return replace(
        plan,
        proposed_content=(
            plan.proposed_content
            + "sensor:\n"
            + "# CircuitSetup Energy Meter Helper: voltage references v1\n"
            + "# End CircuitSetup Energy Meter Helper: voltage references v1\n"
            + "# CircuitSetup Energy Meter Helper: aggregates v1\n"
            + "# End CircuitSetup Energy Meter Helper: aggregates v1\n"
        ),
    )


def _selection() -> StoredCTSelection:
    return StoredCTSelection(1, "split-core-100a", "Kitchen", 27518, 1.0, "0" * 64)


def _meter_configuration(plan: ConfigMutationPlan) -> StoredMeterConfiguration:
    config_sha256 = sha256(plan.proposed_content.encode()).hexdigest()
    meter = MeterSettings(
        "Energy meter",
        ElectricalSystem.SPLIT_PHASE_120_240,
        60,
        5,
        VoltageLayout.STANDARD,
        (VoltageReferenceConfig("main", "Main", "A", 120.0, "vt", 1, ("main_1", "main_2")),),
    )
    channels = tuple(
        ChannelSettings(
            channel, True, f"CT {channel}", "ct", 1.0, CircuitRole.BRANCH, "main"
        )
        for channel in range(1, 7)
    )
    aggregate = CircuitAggregate(
        "grid",
        "Grid",
        CircuitRole.GRID,
        (1, 2),
        MeasurementMethod.TWO_CT_SUM,
        None,
        EnergyMode.CONSUMPTION,
    )
    return StoredMeterConfiguration(
        config_sha256,
        meter,
        channels,
        (aggregate,),
        (False,),
        (False,),
        tuple(
            StoredCTSelection(channel, "ct", None, 27518, 1.0, config_sha256)
            for channel in range(1, 7)
        ),
    )


def _evidence(mac: str = "aabbccddeeff") -> ReconnectEvidence:
    return ReconnectEvidence(
        mac,
        _topology(),
        {
            channel: "Kitchen" if channel == 1 else f"CT {channel}"
            for channel in range(1, 7)
        },
        6,
    )


def _manager(
    builder: Builder,
    persistence: Persistence,
    *,
    evidence: ReconnectEvidence | BaseException | None = None,
    sessions: SessionManager | None = None,
    reconciliation_timeout: float = 30,
    reconnect_timeout: float = 0.01,
) -> ConfigTransactionManager:
    return ConfigTransactionManager(
        builder,
        Verifier(evidence or _evidence()),
        persistence,
        sessions or SessionManager(),
        reconciliation_timeout=reconciliation_timeout,
        reconnect_timeout=reconnect_timeout,
        reconnect_backoff_initial=0.001,
    )


async def _preview(
    manager: ConfigTransactionManager,
    *,
    mac: str = "aabbccddeeff",
    content: str = "prior",
) -> TransactionStatus:
    return await manager.async_preview(
        mac, _topology(), _plan(content), _source(content), (_selection(),)
    )


def test_preview_binds_source_and_exposes_only_bounded_safe_dto() -> None:
    async def run() -> None:
        manager = _manager(Builder(), Persistence())
        status = await manager.async_preview(
            "AABBCCDDEEFF",
            _topology(),
            _plan(
                "prior top-secret",
                diff=" api_encryption_key: raw-diff-secret\n+ ct1_name: Kitchen",
            ),
            _source("prior top-secret"),
        )
        assert isinstance(status, TransactionStatus)
        assert not hasattr(status, "plan") and not hasattr(status, "prior_content")
        assert "top-secret" not in repr(status)
        assert "raw-diff-secret" not in status.redacted_diff
        assert len(status.redacted_diff.encode()) <= 32_768

        bad = ESPHomeConfigSnapshot("meter.yaml", "different", _source().sha256)
        with pytest.raises(ValueError, match="source snapshot"):
            await manager.async_preview("aabbccddeeff", _topology(), _plan(), bad)

    asyncio.run(run())


def test_preview_preserves_unchanged_hash_bound_ct_selections() -> None:
    """A later CT edit must retain a previously installed CT multiplier."""

    async def run() -> None:
        source = _source()
        existing = StoredCTSelection(1, "custom", "Mains", 13_759, 2.0, source.sha256)
        update = StoredCTSelection(2, "custom", "Kitchen", 27_518, 1.0, source.sha256)
        persistence = Persistence(selections=(existing,))
        manager = _manager(Builder(), persistence)

        preview = await manager.async_preview(
            "aabbccddeeff", _topology(), _plan(), source, (update,)
        )

        transaction = manager._transaction(preview.transaction_id)
        assert [selection.channel for selection in transaction.selections] == [1, 2]
        assert transaction.selections[0].reporting_multiplier == 2.0

    asyncio.run(run())


def test_abandon_preview_releases_and_scrubs_pending_transaction() -> None:
    """Build Back must remove the consumed preview before another plan is issued."""

    async def run() -> None:
        manager = _manager(Builder(), Persistence())
        preview = await _preview(manager)

        abandoned = await manager.async_abandon(preview.transaction_id)

        assert abandoned.state is ConfigTransactionState.FAILED
        assert TransactionEvidenceCode.CANCELLED in abandoned.evidence
        assert manager.active_status("aabbccddeeff") is None
        with pytest.raises(KeyError):
            manager.status(preview.transaction_id)

    asyncio.run(run())


def test_write_and_compile_are_distinct_confirmed_phases() -> None:
    """Apply stops at validated and the standalone compile owns compilation."""

    async def run() -> None:
        builder = Builder()
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)

        written = await manager.async_confirm_write(preview.transaction_id, "admin")
        assert written.state is ConfigTransactionState.VALIDATED
        assert builder.calls == ["write", "validate"]

        compiled = await manager.async_compile(preview.transaction_id)
        assert compiled.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert builder.calls == ["write", "validate", "compile"]

    asyncio.run(run())


@pytest.mark.parametrize("with_aggregate", (True, False))
def test_full_meter_configuration_persists_only_after_verified_reconnect(
    with_aggregate: bool,
) -> None:
    """Full meter metadata is not durable until the flashed device proves it."""

    async def run() -> None:
        plan = _managed_entity_plan()
        configuration = _meter_configuration(plan)
        if not with_aggregate:
            configuration = replace(configuration, aggregates=())
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            _topology(),
        )
        evidence = ReconnectEvidence(
            "aabbccddeeff",
            _topology(),
            {channel.channel: channel.name for channel in configuration.channels},
            6,
            expected.sensor_entities,
        )
        persistence = Persistence()
        manager = _manager(Builder(), persistence, evidence=evidence)
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=frozenset(),
            expected_aggregate_sensor_entities=frozenset(),
        )

        assert persistence.meter_configuration is None
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.VERIFIED
        assert status.full_meter_configuration_verified
        assert persistence.meter_configuration == configuration
        assert persistence.selections == configuration.ct_selections

    asyncio.run(run())


def test_calibration_handoff_saves_full_metadata_and_install_marker_together() -> None:
    """A full transaction cannot persist config first and calibration second."""

    class AtomicPersistence(Persistence):
        def __init__(self) -> None:
            super().__init__()
            self.combined: list[tuple[str, StoredMeterConfiguration, str, str]] = []

        async def async_revalidate_verified_calibration(
            self, _mac: str, _verification_id: str, _transaction_id: str
        ) -> bool:
            return True

        async def async_get_verified_calibration(self, _mac: str) -> None:
            return None

        async def async_save_verified_meter_configuration_and_mark_verified_calibration_installed(
            self,
            mac: str,
            expected_source_sha256: str,
            configuration: StoredMeterConfiguration,
            verification_id: str,
            transaction_id: str,
            _record: object,
        ) -> bool:
            self.combined.append((mac, configuration, verification_id, transaction_id))
            return True

        async def async_mark_verified_calibration_installed(
            self, *_args: object
        ) -> bool:
            raise AssertionError("full handoff must use the combined persistence call")

    async def run() -> None:
        plan = _plan()
        configuration = _meter_configuration(plan)
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            _topology(),
        )
        persistence = AtomicPersistence()
        manager = _manager(
            Builder(),
            persistence,
            evidence=ReconnectEvidence(
                "aabbccddeeff",
                _topology(),
                {channel.channel: channel.name for channel in configuration.channels},
                6,
                expected.sensor_entities,
            ),
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=expected.sensor_entities,
        )
        manager._transaction(preview.transaction_id).verification_id = "a" * 32

        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")

        assert status.state is ConfigTransactionState.VERIFIED
        assert len(persistence.combined) == 1 and not persistence.saved

    asyncio.run(run())


def test_missing_full_reconnect_entity_retains_rollbackable_retry_without_persisting() -> (
    None
):
    """Transient reconnect failure stays bounded, private, and rollbackable."""

    async def run() -> None:
        plan = _managed_entity_plan()
        configuration = _meter_configuration(plan)
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            _topology(),
        )
        persistence = Persistence()
        non_aggregate = next(
            iter(expected.sensor_entities - expected.aggregate_sensor_entities)
        )
        manager = _manager(
            Builder(),
            persistence,
            evidence=ReconnectEvidence(
                "aabbccddeeff",
                _topology(),
                {channel.channel: channel.name for channel in configuration.channels},
                6,
                expected.sensor_entities - {non_aggregate},
            ),
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=expected.sensor_entities,
        )
        internal = manager._transaction(preview.transaction_id)

        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")

        assert status.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert TransactionEvidenceCode.ENTITY_MISMATCH in status.evidence
        assert not status.aggregate_entity_mismatch
        assert persistence.meter_configuration is None
        assert internal.plan is not None and internal.prior_content is not None
        assert internal.meter_configuration is not None
        assert internal.expected_sensor_entities
        assert status.rollback_available
        assert manager.sessions.is_config_locked("aabbccddeeff")
        assert "top-secret" not in repr(status) and "top-secret" not in repr(internal)

        rolled_back = await manager.async_rollback(preview.transaction_id)
        assert rolled_back.state is ConfigTransactionState.ROLLED_BACK

    asyncio.run(run())


def test_legacy_yaml_does_not_require_unmanaged_entity_names_after_install() -> None:
    """CT-only changes must not invent helper-managed voltage or aggregate entities."""

    async def run() -> None:
        plan = _plan()
        configuration = _meter_configuration(plan)
        persistence = Persistence()
        manager = _manager(
            Builder(),
            persistence,
            evidence=ReconnectEvidence(
                "aabbccddeeff",
                _topology(),
                {channel.channel: channel.name for channel in configuration.channels},
                6,
            ),
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
        )

        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")

        assert status.state is ConfigTransactionState.VERIFIED
        assert persistence.meter_configuration == configuration

    asyncio.run(run())


def test_verified_reconnect_marks_only_missing_aggregate_entities() -> None:
    """Aggregate repair evidence comes from the verified post-install entity inventory."""

    async def run() -> None:
        plan = _managed_entity_plan()
        configuration = _meter_configuration(plan)
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            _topology(),
        )
        assert expected.aggregate_sensor_entities
        observed = expected.sensor_entities - expected.aggregate_sensor_entities
        mismatch = ReconnectEvidence(
            "aabbccddeeff",
            _topology(),
            {channel.channel: channel.name for channel in configuration.channels},
            6,
            observed,
        )
        verifier = Verifier(
            [
                mismatch,
                mismatch,
                mismatch,
                mismatch,
                ReconnectEvidence(
                    "aabbccddeeff",
                    _topology(),
                    {
                        channel.channel: channel.name
                        for channel in configuration.channels
                    },
                    6,
                    expected.sensor_entities,
                ),
            ]
        )
        manager = ConfigTransactionManager(
            Builder(),
            verifier,
            Persistence(),
            SessionManager(),
            reconnect_timeout=1,
            reconnect_backoff_initial=0.001,
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=frozenset(),
            expected_aggregate_sensor_entities=frozenset(),
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")

        assert status.state is ConfigTransactionState.VERIFIED
        assert verifier.calls == 5
        assert not status.aggregate_entity_mismatch

    asyncio.run(run())


def test_full_reconnect_requires_exact_sensor_object_id_name_pairs() -> None:
    """A different sensor or a non-sensor cannot satisfy a required object ID."""

    async def run() -> None:
        plan = _managed_entity_plan()
        configuration = _meter_configuration(plan)
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            _topology(),
        )
        pairs = tuple(expected.sensor_entities)
        swapped = frozenset(
            (object_id, pairs[(index + 1) % len(pairs)][1])
            for index, (object_id, _name) in enumerate(pairs)
        )
        manager = _manager(
            Builder(),
            Persistence(),
            evidence=ReconnectEvidence(
                "aabbccddeeff",
                _topology(),
                {channel.channel: channel.name for channel in configuration.channels},
                6,
                swapped,
            ),
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=expected.sensor_entities,
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)

        assert (
            await manager.async_confirm_install(preview.transaction_id, "admin")
        ).state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED

    asyncio.run(run())


def test_full_reconnect_rejects_duplicate_required_sensor_object_id() -> None:
    """Duplicate native sensor IDs cannot satisfy a one-to-one reconnect proof."""

    async def run() -> None:
        plan = _managed_entity_plan()
        configuration = _meter_configuration(plan)
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            _topology(),
        )
        duplicate = next(iter(expected.sensor_entities))[0]
        manager = _manager(
            Builder(),
            Persistence(),
            evidence=ReconnectEvidence(
                "aabbccddeeff",
                _topology(),
                {channel.channel: channel.name for channel in configuration.channels},
                6,
                expected.sensor_entities,
                frozenset({duplicate}),
            ),
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=expected.sensor_entities,
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)

        assert (
            await manager.async_confirm_install(preview.transaction_id, "admin")
        ).state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED

    asyncio.run(run())


def test_cancellation_during_verified_commit_finishes_durable_metadata() -> None:
    """A cancelled waiter cannot turn a completed metadata CAS into a failure."""

    class BlockingPersistence(Persistence):
        def __init__(self) -> None:
            super().__init__()
            self.started = asyncio.Event()
            self.finish = asyncio.Event()

        async def async_save_verified_meter_configuration(
            self,
            mac: str,
            expected_source_sha256: str,
            configuration: StoredMeterConfiguration,
            record: object,
        ) -> None:
            self.started.set()
            await self.finish.wait()
            await super().async_save_verified_meter_configuration(
                mac, expected_source_sha256, configuration, record
            )

    async def run() -> None:
        plan = _plan()
        configuration = _meter_configuration(plan)
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            _topology(),
        )
        persistence = BlockingPersistence()
        manager = _manager(
            Builder(),
            persistence,
            evidence=ReconnectEvidence(
                "aabbccddeeff",
                _topology(),
                {channel.channel: channel.name for channel in configuration.channels},
                6,
                expected.sensor_entities,
            ),
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=expected.sensor_entities,
        )
        states: list[ConfigTransactionState] = []
        manager.subscribe(preview.transaction_id, lambda status: states.append(status.state))
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        install = asyncio.create_task(
            manager.async_confirm_install(preview.transaction_id, "admin")
        )
        await persistence.started.wait()
        install.cancel()
        persistence.finish.set()

        with pytest.raises(asyncio.CancelledError):
            await install
        assert persistence.meter_configuration == configuration
        assert states[-1] is ConfigTransactionState.VERIFIED
        with pytest.raises(KeyError):
            manager.status(preview.transaction_id)

        before_commit_builder = Builder()
        before_commit_builder.pause("upload")
        before_commit = Persistence()
        before_commit_manager = _manager(
            before_commit_builder,
            before_commit,
            evidence=ReconnectEvidence(
                "aabbccddeeff",
                _topology(),
                {channel.channel: channel.name for channel in configuration.channels},
                6,
                expected.sensor_entities,
            ),
        )
        before_preview = await before_commit_manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=expected.sensor_entities,
        )
        await before_commit_manager.async_confirm_write(
            before_preview.transaction_id, "admin"
        )
        await before_commit_manager.async_compile(before_preview.transaction_id)
        before_install = asyncio.create_task(
            before_commit_manager.async_confirm_install(
                before_preview.transaction_id, "admin"
            )
        )
        await before_commit_builder.started["upload"].wait()
        before_install.cancel()
        with pytest.raises(asyncio.CancelledError):
            await before_install
        assert before_commit.meter_configuration is None

    asyncio.run(run())


def test_unload_keeps_started_store_commit_owned_until_terminal_state() -> None:
    """Unload cannot publish failure or scrub while a shielded save still drains."""

    class BlockingPersistence(Persistence):
        def __init__(self) -> None:
            super().__init__()
            self.started = asyncio.Event()
            self.finish = asyncio.Event()

        async def async_save_verified_meter_configuration(
            self,
            mac: str,
            expected_source_sha256: str,
            configuration: StoredMeterConfiguration,
            record: object,
        ) -> None:
            self.started.set()
            await self.finish.wait()
            await super().async_save_verified_meter_configuration(
                mac, expected_source_sha256, configuration, record
            )

    async def run() -> None:
        plan = _plan()
        configuration = _meter_configuration(plan)
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            _topology(),
        )
        sessions = SessionManager(unload_timeout=0.001)
        persistence = BlockingPersistence()
        manager = _manager(
            Builder(),
            persistence,
            sessions=sessions,
            evidence=ReconnectEvidence(
                "aabbccddeeff",
                _topology(),
                {channel.channel: channel.name for channel in configuration.channels},
                6,
                expected.sensor_entities,
            ),
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=expected.sensor_entities,
        )
        states: list[ConfigTransactionState] = []
        manager.subscribe(preview.transaction_id, lambda status: states.append(status.state))
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        install = asyncio.create_task(
            manager.async_confirm_install(preview.transaction_id, "admin")
        )
        await persistence.started.wait()
        transaction = manager._transaction(preview.transaction_id)
        transaction.expires_at = 0
        with pytest.raises(KeyError, match="expired"):
            manager.status(preview.transaction_id)
        assert transaction.meter_configuration == configuration and not transaction.closed

        unload = asyncio.create_task(sessions.async_unload())
        await asyncio.sleep(0.01)
        assert not unload.done()
        transaction = sessions._get_transaction(preview.transaction_id)
        assert transaction is not None and not transaction.closed
        assert transaction.meter_configuration == configuration
        assert ConfigTransactionState.FAILED not in states
        assert persistence.meter_configuration is None
        persistence.finish.set()

        assert (await install).state is ConfigTransactionState.VERIFIED
        await unload
        assert persistence.meter_configuration == configuration
        assert states[-1] is ConfigTransactionState.VERIFIED
        assert sessions._get_transaction(preview.transaction_id) is None
        assert transaction.closed and transaction.meter_configuration is None

    asyncio.run(run())


def test_unload_drains_started_store_failure_before_returning() -> None:
    """A durable-save error reaches the transaction terminal state before unload ends."""

    class FailingPersistence(Persistence):
        def __init__(self) -> None:
            super().__init__()
            self.started = asyncio.Event()
            self.finish = asyncio.Event()

        async def async_save_verified_meter_configuration(
            self,
            _mac: str,
            _expected_source_sha256: str,
            _configuration: StoredMeterConfiguration,
            _record: object,
        ) -> None:
            self.started.set()
            await self.finish.wait()
            raise OSError("store unavailable")

    async def run() -> None:
        plan = _plan()
        configuration = _meter_configuration(plan)
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            _topology(),
        )
        sessions = SessionManager(unload_timeout=0.001)
        persistence = FailingPersistence()
        manager = _manager(
            Builder(),
            persistence,
            sessions=sessions,
            evidence=ReconnectEvidence(
                "aabbccddeeff",
                _topology(),
                {channel.channel: channel.name for channel in configuration.channels},
                6,
                expected.sensor_entities,
            ),
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=expected.sensor_entities,
        )
        states: list[ConfigTransactionState] = []
        manager.subscribe(preview.transaction_id, lambda status: states.append(status.state))
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        install = asyncio.create_task(
            manager.async_confirm_install(preview.transaction_id, "admin")
        )
        await persistence.started.wait()
        transaction = manager._transaction(preview.transaction_id)

        unload = asyncio.create_task(sessions.async_unload())
        await asyncio.sleep(0.01)
        assert not unload.done()
        persistence.finish.set()

        assert (await install).state is ConfigTransactionState.FAILED
        await unload
        assert states[-1] is ConfigTransactionState.FAILED
        assert persistence.meter_configuration is None
        assert sessions._get_transaction(preview.transaction_id) is None
        assert transaction.closed and transaction.meter_configuration is None

    asyncio.run(run())


def test_cancelled_unload_drains_started_store_commit_before_propagating() -> None:
    """Cancelling unload cannot orphan a started durable write or private state."""

    class BlockingPersistence(Persistence):
        def __init__(self) -> None:
            super().__init__()
            self.started = asyncio.Event()
            self.finish = asyncio.Event()

        async def async_save_verified_meter_configuration(
            self,
            mac: str,
            expected_source_sha256: str,
            configuration: StoredMeterConfiguration,
            record: object,
        ) -> None:
            self.started.set()
            await self.finish.wait()
            await super().async_save_verified_meter_configuration(
                mac, expected_source_sha256, configuration, record
            )

    async def run() -> None:
        plan = _plan()
        configuration = _meter_configuration(plan)
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            _topology(),
        )
        sessions = SessionManager(unload_timeout=0.001)
        persistence = BlockingPersistence()
        manager = _manager(
            Builder(),
            persistence,
            sessions=sessions,
            evidence=ReconnectEvidence(
                "aabbccddeeff",
                _topology(),
                {channel.channel: channel.name for channel in configuration.channels},
                6,
                expected.sensor_entities,
            ),
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=expected.sensor_entities,
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        install = asyncio.create_task(
            manager.async_confirm_install(preview.transaction_id, "admin")
        )
        await persistence.started.wait()
        transaction = manager._transaction(preview.transaction_id)

        unload = asyncio.create_task(sessions.async_unload())
        await asyncio.sleep(0.01)
        unload.cancel()
        await asyncio.sleep(0)
        assert not unload.done()
        persistence.finish.set()

        assert (await install).state is ConfigTransactionState.VERIFIED
        with pytest.raises(asyncio.CancelledError):
            await unload
        assert persistence.meter_configuration == configuration
        assert sessions._get_transaction(preview.transaction_id) is None
        assert transaction.closed and transaction.meter_configuration is None

    asyncio.run(run())


def test_expiry_release_failure_or_cancellation_always_scrubs_transaction() -> None:
    """Expiry never leaves private YAML, requested metadata, or evidence retained."""

    async def run() -> None:
        now = 0.0
        manager = ConfigTransactionManager(
            Builder(),
            Verifier(_evidence()),
            Persistence(),
            SessionManager(),
            confirmation_ttl=1.0,
            clock=lambda: now,
        )
        plan = _plan()
        configuration = _meter_configuration(plan)
        expected = expected_meter_entity_evidence(
            MeterConfigurationRequest(
                configuration.meter,
                configuration.channels,
                configuration.aggregates,
                configuration.power_quality,
                configuration.status_fields,
            ),
            _topology(),
        )
        preview = await manager.async_preview(
            "aabbccddeeff",
            _topology(),
            plan,
            _source(),
            meter_configuration=configuration,
            expected_sensor_entities=expected.sensor_entities,
        )
        transaction = manager._transaction(preview.transaction_id)
        started = asyncio.Event()
        release = asyncio.Event()
        calls = 0

        async def release_reservation() -> bool:
            nonlocal calls
            calls += 1
            started.set()
            await release.wait()
            raise OSError("release failed")

        transaction.reservation_claimed = True
        transaction.reservation_release = release_reservation
        now = 2.0
        with pytest.raises(KeyError, match="expired"):
            manager.status(preview.transaction_id)
        await started.wait()
        cleanup = next(iter(transaction.active_tasks))
        cleanup.cancel()
        await asyncio.sleep(0)
        release.set()
        with pytest.raises(OSError, match="release failed"):
            await cleanup

        assert calls == 1
        assert transaction.plan is None and transaction.prior_content is None
        assert transaction.meter_configuration is None
        assert not transaction.expected_sensor_entities
        assert manager.sessions._get_transaction(preview.transaction_id) is None

    asyncio.run(run())


def test_confirmation_expiry_refuses_and_scrubs_transaction() -> None:
    """Monotonic confirmation deadlines are checked before any mutation."""

    async def run() -> None:
        now = 100.0
        manager = ConfigTransactionManager(
            Builder(),
            Verifier(_evidence()),
            Persistence(),
            SessionManager(),
            confirmation_ttl=5.0,
            clock=lambda: now,
        )
        preview = await _preview(manager)
        now = 106.0

        with pytest.raises(KeyError):
            manager.assert_confirmation(
                preview.transaction_id, "aabbccddeeff", preview.source_sha256
            )
        with pytest.raises(KeyError):
            manager.status(preview.transaction_id)

    asyncio.run(run())


def test_compile_failure_publishes_terminal_status() -> None:
    """Subscribers observe the terminal compile failure before the call returns."""

    async def run() -> None:
        manager = _manager(Builder(compile=Job(False)), Persistence())
        preview = await _preview(manager)
        observed: list[ConfigTransactionState] = []
        manager.subscribe(
            preview.transaction_id, lambda status: observed.append(status.state)
        )

        await manager.async_confirm_write(preview.transaction_id, "admin")
        failed = await manager.async_compile(preview.transaction_id)

        assert failed.state is ConfigTransactionState.FAILED
        assert observed[-1] is ConfigTransactionState.FAILED

    asyncio.run(run())


@pytest.mark.parametrize(
    ("outcome", "state", "code", "restore_count", "retained"),
    (
        (
            "source",
            ConfigTransactionState.FAILED,
            TransactionEvidenceCode.WRITE_NOT_APPLIED,
            0,
            False,
        ),
        (
            "proposed",
            ConfigTransactionState.ROLLED_BACK,
            TransactionEvidenceCode.WRITE_FAILED,
            1,
            False,
        ),
        (
            "foreign",
            ConfigTransactionState.FAILED,
            TransactionEvidenceCode.WRITE_RECOVERY_REQUIRED,
            0,
            True,
        ),
    ),
)
def test_lost_update_response_reconciles_without_overwriting_foreign_content(
    outcome: str,
    state: ConfigTransactionState,
    code: TransactionEvidenceCode,
    restore_count: int,
    retained: bool,
) -> None:
    async def run() -> None:
        builder = UncertainUpdateBuilder(outcome)
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)

        status = await manager.async_confirm_write(preview.transaction_id, "admin")

        assert status.state is state and code in status.evidence
        assert builder.calls.count("restore") == restore_count
        assert builder.remote_content == (
            "foreign concurrent content" if outcome == "foreign" else "prior"
        )
        assert manager.sessions.is_config_locked("aabbccddeeff") is retained
        if retained:
            assert manager.status(preview.transaction_id) == status
            await manager.sessions.async_unload()
        else:
            with pytest.raises(KeyError):
                manager.status(preview.transaction_id)

    asyncio.run(run())


def test_cancellation_after_remote_write_commit_is_reconciled_before_cleanup() -> None:
    async def run() -> None:
        builder = UncertainUpdateBuilder("proposed", block=True)
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)
        task = asyncio.create_task(
            manager.async_confirm_write(preview.transaction_id, "admin")
        )
        await asyncio.wait_for(builder.started["write"].wait(), 1)

        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await asyncio.wait_for(task, 1)

        assert builder.remote_content == "prior"
        assert builder.calls == ["write", "read", "restore"]
        assert not manager.sessions.is_config_locked("aabbccddeeff")
        with pytest.raises(KeyError):
            manager.status(preview.transaction_id)

    asyncio.run(run())


def test_indeterminate_update_retains_typed_recovery_state_and_owned_lease() -> None:
    class IndeterminateBuilder(UncertainUpdateBuilder):
        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            del configuration
            self.calls.append("read")
            raise ConnectionError("cannot determine current content")

    async def run() -> None:
        builder = IndeterminateBuilder("proposed")
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)

        status = await manager.async_confirm_write(preview.transaction_id, "admin")

        assert status.evidence[-1] is TransactionEvidenceCode.WRITE_RECOVERY_REQUIRED
        assert builder.calls == ["write", "read"]
        assert manager.sessions.is_config_locked("aabbccddeeff")
        assert manager.status(preview.transaction_id) == status
        internal = manager.sessions._get_transaction(preview.transaction_id)
        assert internal.plan is not None and internal.prior_content == "prior"
        await manager.sessions.async_unload()
        assert not manager.sessions.is_config_locked("aabbccddeeff")

    asyncio.run(run())


def test_foreign_change_between_reconcile_read_and_restore_is_not_overwritten() -> None:
    class RacedBuilder(UncertainUpdateBuilder):
        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            snapshot = await super().async_get_config(configuration)
            self.remote_content = "foreign after reconciliation read"
            return snapshot

    async def run() -> None:
        builder = RacedBuilder("proposed")
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)

        status = await manager.async_confirm_write(preview.transaction_id, "admin")

        assert status.evidence[-1] is TransactionEvidenceCode.WRITE_RECOVERY_REQUIRED
        assert builder.remote_content == "foreign after reconciliation read"
        assert builder.restored_content is None
        assert manager.sessions.is_config_locked("aabbccddeeff")
        await manager.sessions.async_unload()

    asyncio.run(run())


def test_hung_reconciliation_read_times_out_to_retained_recovery() -> None:
    class HungReadBuilder(UncertainUpdateBuilder):
        def __init__(self) -> None:
            super().__init__("proposed")
            self.read_started = asyncio.Event()

        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            del configuration
            self.calls.append("read")
            self.read_started.set()
            await asyncio.Event().wait()
            raise AssertionError("unreachable")

    async def run() -> None:
        builder = HungReadBuilder()
        manager = _manager(builder, Persistence(), reconciliation_timeout=0.01)
        preview = await _preview(manager)

        status = await asyncio.wait_for(
            manager.async_confirm_write(preview.transaction_id, "admin"), 1
        )

        assert status.evidence[-1] is TransactionEvidenceCode.WRITE_RECOVERY_REQUIRED
        assert manager.sessions.is_config_locked("aabbccddeeff")
        await manager.sessions.async_unload()

    asyncio.run(run())


def test_hung_reconciliation_restore_times_out_to_retained_recovery() -> None:
    class HungRestoreBuilder(UncertainUpdateBuilder):
        async def async_restore_content(
            self,
            configuration: str,
            content: str,
            expected_current_sha256: str | None = None,
        ) -> None:
            del configuration, content, expected_current_sha256
            self.calls.append("restore")
            await asyncio.Event().wait()

    async def run() -> None:
        builder = HungRestoreBuilder("proposed")
        manager = _manager(builder, Persistence(), reconciliation_timeout=0.01)
        preview = await _preview(manager)

        status = await asyncio.wait_for(
            manager.async_confirm_write(preview.transaction_id, "admin"), 1
        )

        assert status.evidence[-1] is TransactionEvidenceCode.WRITE_RECOVERY_REQUIRED
        assert manager.sessions.is_config_locked("aabbccddeeff")
        await manager.sessions.async_unload()

    asyncio.run(run())


def test_unload_bounds_hung_reconciliation_then_marks_and_scrubs() -> None:
    class HungReadBuilder(UncertainUpdateBuilder):
        def __init__(self) -> None:
            super().__init__("proposed")
            self.read_started = asyncio.Event()

        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            del configuration
            self.calls.append("read")
            self.read_started.set()
            await asyncio.Event().wait()
            raise AssertionError("unreachable")

    async def run() -> None:
        sessions = SessionManager(unload_timeout=0.01)
        builder = HungReadBuilder()
        manager = _manager(
            builder,
            Persistence(),
            sessions=sessions,
            reconciliation_timeout=10,
        )
        preview = await _preview(manager)
        internal = sessions._get_transaction(preview.transaction_id)
        write = asyncio.create_task(
            manager.async_confirm_write(preview.transaction_id, "admin")
        )
        await asyncio.wait_for(builder.read_started.wait(), 1)

        await asyncio.wait_for(sessions.async_unload(), 1)

        assert not sessions.is_config_locked("aabbccddeeff")
        assert internal.evidence[-1] is TransactionEvidenceCode.WRITE_RECOVERY_REQUIRED
        assert internal.plan is None and internal.prior_content is None
        assert write.done()

    asyncio.run(run())


def test_unload_timeout_does_not_wait_for_cancellation_suppression() -> None:
    class CancellationSuppressingBuilder(UncertainUpdateBuilder):
        def __init__(self) -> None:
            super().__init__("proposed")
            self.read_started = asyncio.Event()
            self.cancel_seen = asyncio.Event()
            self.release = asyncio.Event()

        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            del configuration
            self.calls.append("read")
            self.read_started.set()
            try:
                await asyncio.Event().wait()
            except asyncio.CancelledError:
                self.cancel_seen.set()
                await self.release.wait()
            return _source("proposed")

    async def run() -> None:
        sessions = SessionManager(unload_timeout=0.01)
        builder = CancellationSuppressingBuilder()
        manager = _manager(
            builder,
            Persistence(),
            sessions=sessions,
            reconciliation_timeout=10,
        )
        preview = await _preview(manager)
        internal = sessions._get_transaction(preview.transaction_id)
        write = asyncio.create_task(
            manager.async_confirm_write(preview.transaction_id, "admin")
        )
        await asyncio.wait_for(builder.read_started.wait(), 1)

        await asyncio.wait_for(sessions.async_unload(), 1)

        assert builder.cancel_seen.is_set()
        assert not write.done()
        assert not sessions.is_config_locked("aabbccddeeff")
        assert internal.evidence[-1] is TransactionEvidenceCode.WRITE_RECOVERY_REQUIRED
        assert internal.plan is None and internal.prior_content is None
        builder.release.set()
        with pytest.raises(asyncio.CancelledError):
            await asyncio.wait_for(write, 1)

    asyncio.run(run())


def test_confirmations_and_verified_persistence_are_separate() -> None:
    async def run() -> None:
        builder, persistence = Builder(), Persistence()
        manager = _manager(builder, persistence)
        preview = await _preview(manager)
        with pytest.raises(PermissionError):
            await manager.async_confirm_write(preview.transaction_id, "")
        status = await manager.async_confirm_write(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.VALIDATED
        status = await manager.async_compile(preview.transaction_id)
        assert status.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert not persistence.saved
        with pytest.raises(PermissionError):
            await manager.async_confirm_install(preview.transaction_id, "")
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.VERIFIED
        assert not status.full_meter_configuration_verified
        assert builder.calls == ["write", "validate", "compile", "upload"]
        saved = persistence.saved[0][1][0]  # type: ignore[index]
        assert (
            saved.config_sha256 == sha256(_plan().proposed_content.encode()).hexdigest()
        )
        assert not manager.sessions.is_config_locked("aabbccddeeff")
        with pytest.raises(KeyError):
            manager.status(preview.transaction_id)

    asyncio.run(run())


@pytest.mark.parametrize(
    "validation",
    (
        Job(False, "server says credential-without-a-label"),
        ConnectionError("lost secret"),
    ),
)
def test_validation_failure_or_disconnect_restores_exact_source_once(
    validation: Job | BaseException,
) -> None:
    async def run() -> None:
        builder = Builder(validation=(validation,))
        manager = _manager(builder, Persistence())
        preview = await _preview(manager, content="exact prior bytes\n")
        status = await manager.async_confirm_write(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.ROLLED_BACK
        assert builder.calls == ["write", "validate", "restore"]
        assert builder.restored_content == "exact prior bytes\n"
        assert "secret" not in repr(status)
        assert not manager.sessions.is_config_locked("aabbccddeeff")

    asyncio.run(run())


def test_validation_detail_is_useful_bounded_and_never_contains_raw_text() -> None:
    async def run() -> None:
        summary = "0 errors; errorless; 2 warnings; token=top-secret"
        output = (
            "ERROR: one real diagnostic",
            "WARNING: one real diagnostic",
            "123 errors in arbitrary numeric text password=hunter2",
        )
        builder = Builder(validation=(Job(False, summary, output, 17),))
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)

        status = await manager.async_confirm_write(preview.transaction_id, "admin")

        assert status.validation_detail is not None
        assert status.validation_detail.code == 17
        assert status.validation_detail.reported_error_count is None
        assert status.validation_detail.reported_warning_count is None
        assert status.validation_detail.error_record_count == 1
        assert status.validation_detail.warning_record_count == 1
        assert "top-secret" not in repr(status) and "hunter2" not in repr(status)

    asyncio.run(run())


def test_validation_detail_prefers_structured_protocol_counts() -> None:
    async def run() -> None:
        builder = Builder(
            validation=(Job(False, "arbitrary errorless text", (), 17, 0, 2),)
        )
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)

        status = await manager.async_confirm_write(preview.transaction_id, "admin")

        assert status.validation_detail is not None
        assert status.validation_detail.reported_error_count == 0
        assert status.validation_detail.reported_warning_count == 2
        assert status.validation_detail.error_record_count == 0
        assert status.validation_detail.warning_record_count == 0

    asyncio.run(run())


def test_validation_detail_counts_esphome_failed_config_without_exposing_output() -> None:
    async def run() -> None:
        builder = Builder(
            validation=(
                Job(
                    False,
                    "",
                    (
                        "Failed config",
                        "sensor.atm90e32: [source meter.yaml:42]",
                        "  invalid value token=top-secret",
                    ),
                    2,
                ),
            )
        )
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)

        status = await manager.async_confirm_write(preview.transaction_id, "admin")

        assert status.validation_detail is not None
        assert status.validation_detail.code == 2
        assert status.validation_detail.error_record_count == 1
        assert "meter.yaml" not in repr(status)
        assert "top-secret" not in repr(status)

    asyncio.run(run())


def test_rollback_failure_retains_exact_source_and_retry_handle() -> None:
    async def run() -> None:
        builder = Builder(
            validation=(ConnectionError("validation disconnected"),),
            restore_error=ConnectionError("restore failed"),
        )
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)
        with pytest.raises(RollbackFailedError, match="rollback failed"):
            await manager.async_confirm_write(preview.transaction_id, "admin")
        assert builder.calls == ["write", "validate", "restore"]
        status = manager.status(preview.transaction_id)
        internal = manager.sessions._get_transaction(preview.transaction_id)
        assert status.rollback_available
        assert internal.prior_content == "prior"
        assert manager.sessions.is_config_locked("aabbccddeeff")

        builder.restore_error = None
        restored = await manager.async_rollback(preview.transaction_id)

        assert restored.state is ConfigTransactionState.ROLLED_BACK
        assert builder.remote_content == "prior"
        assert not manager.sessions.is_config_locked("aabbccddeeff")

    asyncio.run(run())


def test_expiry_owns_restore_before_scrubbing_written_configuration() -> None:
    async def run() -> None:
        now = 0.0
        builder = Builder()
        manager = ConfigTransactionManager(
            builder,
            Verifier(_evidence()),
            Persistence(),
            SessionManager(),
            confirmation_ttl=1,
            clock=lambda: now,
        )
        preview = await _preview(manager, content="exact prior bytes\n")
        await manager.async_confirm_write(preview.transaction_id, "admin")
        internal = manager.sessions._get_transaction(preview.transaction_id)
        now = 2.0

        with pytest.raises(KeyError, match="expired"):
            manager.status(preview.transaction_id)
        for _ in range(10):
            if manager.sessions._get_transaction(preview.transaction_id) is None:
                break
            await asyncio.sleep(0)

        assert builder.calls[-1] == "restore"
        assert builder.remote_content == "exact prior bytes\n"
        assert internal.prior_content is None
        assert manager.sessions._get_transaction(preview.transaction_id) is None
        assert not manager.sessions.is_config_locked("aabbccddeeff")

    asyncio.run(run())


def test_compile_failure_has_one_shot_rollback_and_no_raw_output() -> None:
    async def run() -> None:
        huge = "credential-without-label-" + "x" * 1_000_000
        builder = Builder(compile=Job(False, huge, (huge,) * 200))
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        status = await manager.async_compile(preview.transaction_id)
        internal = manager.sessions._get_transaction(preview.transaction_id)
        assert (
            status.state is ConfigTransactionState.FAILED and status.rollback_available
        )
        assert status.evidence == (TransactionEvidenceCode.COMPILE_FAILED,)
        assert "credential" not in repr(status) and len(repr(status)) < 4_096
        assert "upload" not in builder.calls and manager.sessions.is_config_locked(
            "aabbccddeeff"
        )
        assert (
            await manager.async_rollback(preview.transaction_id)
        ).state is ConfigTransactionState.ROLLED_BACK
        assert internal.plan is None
        assert internal.prior_content is None
        assert builder.calls.count("restore") == 1
        with pytest.raises(KeyError):
            await manager.async_rollback(preview.transaction_id)

    asyncio.run(run())


def test_write_and_compile_claims_are_atomic_across_awaits() -> None:
    async def run() -> None:
        builder = Builder()
        release = builder.pause("write")
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)
        first = asyncio.create_task(
            manager.async_confirm_write(preview.transaction_id, "admin")
        )
        await asyncio.wait_for(builder.started["write"].wait(), 1)
        duplicate = asyncio.create_task(
            manager.async_confirm_write(preview.transaction_id, "admin")
        )
        release.set()
        await first
        with pytest.raises(RuntimeError):
            await duplicate
        assert builder.calls.count("write") == 1

        builder2 = Builder()
        release2 = builder2.pause("compile")
        manager2 = _manager(builder2, Persistence())
        preview2 = await _preview(manager2)
        await manager2.async_confirm_write(preview2.transaction_id, "admin")
        first2 = asyncio.create_task(manager2.async_compile(preview2.transaction_id))
        await asyncio.wait_for(builder2.started["compile"].wait(), 1)
        duplicate2 = asyncio.create_task(
            manager2.async_compile(preview2.transaction_id)
        )
        release2.set()
        await first2
        with pytest.raises(RuntimeError):
            await duplicate2
        assert builder2.calls.count("compile") == 1

    asyncio.run(run())


def test_rollback_claim_is_atomic_and_replay_safe() -> None:
    async def run() -> None:
        builder = Builder(compile=Job(False))
        release = builder.pause("restore")
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        first = asyncio.create_task(manager.async_rollback(preview.transaction_id))
        await asyncio.wait_for(builder.started["restore"].wait(), 1)
        duplicate = asyncio.create_task(manager.async_rollback(preview.transaction_id))
        release.set()
        await first
        with pytest.raises((KeyError, RuntimeError)):
            await duplicate
        assert builder.calls.count("restore") == 1

    asyncio.run(run())


def test_upload_disconnect_is_terminal_and_never_persists() -> None:
    async def run() -> None:
        persistence = Persistence()
        manager = _manager(
            Builder(upload=ConnectionError("token value leaked")), persistence
        )
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.FAILED
        assert status.evidence == (TransactionEvidenceCode.UPLOAD_FAILED,)
        assert "token" not in repr(status) and not persistence.saved
        assert not manager.sessions.is_config_locked("aabbccddeeff")

    asyncio.run(run())


def test_upload_progress_is_live_structured_and_bounded() -> None:
    async def run() -> None:
        builder = Builder()
        release = builder.pause("upload")
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        install = asyncio.create_task(
            manager.async_confirm_install(preview.transaction_id, "admin")
        )
        await asyncio.wait_for(builder.started["upload"].wait(), 1)

        live = manager.status(preview.transaction_id)
        assert live.state is ConfigTransactionState.INSTALLING
        assert len(live.upload_progress) <= 32
        assert live.upload_progress[-1].percentage == 100
        assert all(
            item.stage is JobProgressStage.UPLOADING for item in live.upload_progress
        )
        assert len(repr(live.upload_progress).encode()) <= 2_048

        release.set()
        assert (await install).state is ConfigTransactionState.VERIFIED

    asyncio.run(run())


def test_compile_progress_is_live_and_structured() -> None:
    async def run() -> None:
        builder = Builder()
        release = builder.pause("compile")
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        compile_job = asyncio.create_task(manager.async_compile(preview.transaction_id))
        await asyncio.wait_for(builder.started["compile"].wait(), 1)

        live = manager.status(preview.transaction_id)
        assert live.state is ConfigTransactionState.VALIDATED
        assert live.upload_progress == (
            JobProgress(JobProgressStage.TRANSFER, 65),
        )

        release.set()
        completed = await compile_job
        assert completed.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert completed.upload_progress == ()

    asyncio.run(run())


def test_persistent_entity_mismatch_preserves_install_retry() -> None:
    async def run() -> None:
        mismatch = ReconnectEvidence(
            "aabbccddeeff", _topology(), {**_evidence().ct_names, 1: "Wrong"}, 6
        )
        verifier = Verifier(mismatch)
        sessions = SessionManager()
        manager = ConfigTransactionManager(
            Builder(),
            verifier,
            Persistence(),
            sessions,
            reconnect_timeout=0.01,
            reconnect_backoff_initial=0.001,
        )
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)

        retry = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert retry.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert retry.evidence == (TransactionEvidenceCode.ENTITY_MISMATCH,)
        assert sessions.is_config_locked("aabbccddeeff")

    asyncio.run(run())


def test_rebooting_meter_waits_and_verifies_without_second_upload(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        delays: list[float] = []

        async def wait(delay: float) -> None:
            delays.append(delay)

        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.config_transaction.asyncio.sleep",
            wait,
        )
        verifier = Verifier(
            [
                OSError("meter is rebooting"),
                OSError("meter is rebooting"),
                OSError("meter is rebooting"),
                _evidence(),
            ]
        )
        builder = Builder()
        manager = ConfigTransactionManager(
            builder, verifier, Persistence(), SessionManager()
        )
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)

        completed = await manager.async_confirm_install(preview.transaction_id, "admin")

        assert completed.state is ConfigTransactionState.VERIFIED
        assert verifier.calls == 4
        assert delays
        assert builder.calls.count("upload") == 1

    asyncio.run(run())


def test_cancellation_during_reboot_wait_finishes_the_transaction(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def run() -> None:
        waiting = asyncio.Event()

        async def wait(_delay: float) -> None:
            waiting.set()
            await asyncio.Event().wait()

        monkeypatch.setattr(
            "custom_components.circuitsetup_energy_meter_helper.config_transaction.asyncio.sleep",
            wait,
        )
        manager = ConfigTransactionManager(
            Builder(),
            Verifier(OSError("meter is rebooting")),
            Persistence(),
            SessionManager(),
        )
        preview = await _preview(manager)
        statuses: list[TransactionStatus] = []
        manager.subscribe(preview.transaction_id, statuses.append)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        install = asyncio.create_task(
            manager.async_confirm_install(preview.transaction_id, "admin")
        )
        await waiting.wait()

        install.cancel()
        with pytest.raises(asyncio.CancelledError):
            await install

        assert statuses[-1].state is ConfigTransactionState.FAILED
        assert statuses[-1].evidence == (TransactionEvidenceCode.CANCELLED,)
        assert manager.active_status("aabbccddeeff") is None

    asyncio.run(run())


@pytest.mark.parametrize(
    ("reconnect_timeout", "reconnect_backoff_initial"),
    ((float("nan"), 1.0), (1.0, float("inf"))),
)
def test_reconnect_timing_must_be_finite(
    reconnect_timeout: float, reconnect_backoff_initial: float
) -> None:
    with pytest.raises(ValueError, match="reconnect timing"):
        ConfigTransactionManager(
            Builder(),
            Verifier(_evidence()),
            Persistence(),
            SessionManager(),
            reconnect_timeout=reconnect_timeout,
            reconnect_backoff_initial=reconnect_backoff_initial,
        )


@pytest.mark.parametrize(
    ("evidence", "code"),
    (
        (_evidence("bb"), TransactionEvidenceCode.IDENTITY_MISMATCH),
        (
            ReconnectEvidence("aabbccddeeff", _topology(1), _evidence().ct_names, 6),
            TransactionEvidenceCode.TOPOLOGY_MISMATCH,
        ),
        (
            ReconnectEvidence("aabbccddeeff", _topology(), {}, 6),
            TransactionEvidenceCode.ENTITY_MISMATCH,
        ),
        (
            ReconnectEvidence(
                "aabbccddeeff", _topology(), {**_evidence().ct_names, 1: "Wrong"}, 6
            ),
            TransactionEvidenceCode.ENTITY_MISMATCH,
        ),
        (
            ReconnectEvidence("aabbccddeeff", _topology(), _evidence().ct_names, 5),
            TransactionEvidenceCode.SENSOR_COUNT_MISMATCH,
        ),
    ),
)
def test_reconnect_rejects_wrong_identity_topology_entities_or_count(
    evidence: ReconnectEvidence,
    code: TransactionEvidenceCode,
) -> None:
    async def run() -> None:
        persistence = Persistence()
        manager = _manager(Builder(), persistence, evidence=evidence)
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        retryable = code in {
            TransactionEvidenceCode.ENTITY_MISMATCH,
            TransactionEvidenceCode.SENSOR_COUNT_MISMATCH,
        }
        assert status.state is (
            ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
            if retryable
            else ConfigTransactionState.FAILED
        )
        assert status.evidence == (code,)
        assert not persistence.saved
        assert manager.sessions.is_config_locked("aabbccddeeff") is retryable

    asyncio.run(run())


def test_persistence_failure_is_terminal_and_releases_lease() -> None:
    async def run() -> None:
        manager = _manager(Builder(), Persistence(OSError("disk secret")))
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.evidence == (TransactionEvidenceCode.PERSISTENCE_FAILED,)
        assert "secret" not in repr(status)
        assert not manager.sessions.is_config_locked("aabbccddeeff")

    asyncio.run(run())


def test_cancellation_after_write_restores_and_upload_cancel_cleans_up() -> None:
    async def run() -> None:
        builder = Builder()
        builder.pause("validate")
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)
        task = asyncio.create_task(
            manager.async_confirm_write(preview.transaction_id, "admin")
        )
        await asyncio.wait_for(builder.started["validate"].wait(), 1)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task
        assert builder.calls == ["write", "validate", "restore"]
        assert not manager.sessions.is_config_locked("aabbccddeeff")

        builder2, persistence2 = Builder(), Persistence()
        builder2.pause("upload")
        manager2 = _manager(builder2, persistence2)
        preview2 = await _preview(manager2)
        await manager2.async_confirm_write(preview2.transaction_id, "admin")
        await manager2.async_compile(preview2.transaction_id)
        task2 = asyncio.create_task(
            manager2.async_confirm_install(preview2.transaction_id, "admin")
        )
        await asyncio.wait_for(builder2.started["upload"].wait(), 1)
        task2.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task2
        assert not persistence2.saved and not manager2.sessions.is_config_locked(
            "aabbccddeeff"
        )
        with pytest.raises(KeyError):
            manager2.status(preview2.transaction_id)

    asyncio.run(run())


def test_unload_cancels_tasks_and_mac_case_uses_one_lock() -> None:
    async def run() -> None:
        sessions, builder = SessionManager(), Builder()
        builder.pause("validate")
        manager = _manager(builder, Persistence(), sessions=sessions)
        first, second = (
            await _preview(manager, mac="AABBCCDDEEFF"),
            await _preview(manager, mac="aabbccddeeff"),
        )
        task1 = asyncio.create_task(
            manager.async_confirm_write(first.transaction_id, "admin")
        )
        await asyncio.wait_for(builder.started["validate"].wait(), 1)
        task2 = asyncio.create_task(
            manager.async_confirm_write(second.transaction_id, "admin")
        )
        await asyncio.sleep(0)
        assert (
            sessions.is_config_locked("AABBCCDDEEFF")
            and builder.calls.count("write") == 1
        )
        await sessions.async_unload()
        assert task1.cancelled() and task2.cancelled()
        assert not sessions.is_config_locked("aabbccddeeff")
        with pytest.raises(KeyError):
            manager.status(first.transaction_id)

    asyncio.run(run())


def test_stale_rollback_cannot_release_new_lease() -> None:
    async def run() -> None:
        sessions, builder = SessionManager(), Builder(compile=Job(False))
        manager = _manager(builder, Persistence(), sessions=sessions)
        first = await _preview(manager, mac="AABBCCDDEEFF")
        await manager.async_confirm_write(first.transaction_id, "admin")
        await manager.async_compile(first.transaction_id)
        builder.pause("validate")
        second = await _preview(manager, mac="aabbccddeeff")
        second_task = asyncio.create_task(
            manager.async_confirm_write(second.transaction_id, "admin")
        )
        await asyncio.sleep(0)
        await manager.async_rollback(first.transaction_id)
        await asyncio.wait_for(builder.started["validate"].wait(), 1)
        assert sessions.is_config_locked("aabbccddeeff")
        with pytest.raises(KeyError):
            await manager.async_rollback(first.transaction_id)
        assert sessions.is_config_locked("aabbccddeeff")
        await sessions.async_unload()
        with pytest.raises(asyncio.CancelledError):
            await second_task

    asyncio.run(run())


def test_concurrent_edit_does_not_restore_foreign_content() -> None:
    class ChangedBuilder(Builder):
        async def async_update_config(
            self, snapshot: ESPHomeConfigSnapshot, proposed: str
        ) -> None:
            del snapshot, proposed
            self.calls.append("write")
            raise ConfigChangedError("expected", "actual")

    async def run() -> None:
        builder = ChangedBuilder()
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)
        with pytest.raises(ConfigChangedError):
            await manager.async_confirm_write(preview.transaction_id, "admin")
        assert builder.calls == ["write"]
        assert not manager.sessions.is_config_locked("aabbccddeeff")

    asyncio.run(run())
