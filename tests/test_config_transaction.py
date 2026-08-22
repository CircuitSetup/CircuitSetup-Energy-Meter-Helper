"""Adversarial tests for configuration/install transactions."""

import asyncio
from dataclasses import dataclass
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


@dataclass
class Job:
    success: bool
    summary: str = ""
    output_tail: tuple[str, ...] = ()


class Builder:
    def __init__(
        self,
        *,
        validation: tuple[Job | BaseException, ...] | None = None,
        compile: Job | BaseException | None = None,
        upload: Job | BaseException | None = None,
        restore_error: BaseException | None = None,
    ) -> None:
        self.validation = list(validation or (Job(True),))
        self.compile = compile if compile is not None else Job(True)
        self.upload = upload if upload is not None else Job(True)
        self.restore_error = restore_error
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
        del snapshot, proposed
        await self._enter("write")

    async def async_validate(self, configuration: str) -> Job:
        del configuration
        await self._enter("validate")
        result = (
            self.validation.pop(0) if len(self.validation) > 1 else self.validation[0]
        )
        if isinstance(result, BaseException):
            raise result
        return result

    async def async_compile(self, configuration: str) -> Job:
        del configuration
        await self._enter("compile")
        if isinstance(self.compile, BaseException):
            raise self.compile
        return self.compile

    async def async_upload(self, configuration: str) -> Job:
        del configuration
        await self._enter("upload")
        if isinstance(self.upload, BaseException):
            raise self.upload
        return self.upload

    async def async_restore_content(self, configuration: str, content: str) -> None:
        del configuration
        await self._enter("restore")
        self.restored_content = content
        if self.restore_error is not None:
            raise self.restore_error


class Persistence:
    def __init__(self, error: BaseException | None = None) -> None:
        self.saved: list[object] = []
        self.error = error

    async def async_save_verified_ct_selections(
        self, mac: str, selections: tuple[StoredCTSelection, ...]
    ) -> None:
        if self.error is not None:
            raise self.error
        self.saved.append((mac, selections))


class Verifier:
    def __init__(self, evidence: ReconnectEvidence | BaseException) -> None:
        self.evidence = evidence

    async def async_verify(self, mac: str) -> ReconnectEvidence:
        del mac
        if isinstance(self.evidence, BaseException):
            raise self.evidence
        return self.evidence


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


def _selection() -> StoredCTSelection:
    return StoredCTSelection(1, "split-core-100a", "Kitchen", 27518, 1.0, "0" * 64)


def _evidence(mac: str = "aa") -> ReconnectEvidence:
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
) -> ConfigTransactionManager:
    return ConfigTransactionManager(
        builder,
        Verifier(evidence or _evidence()),
        persistence,
        sessions or SessionManager(),
    )


async def _preview(
    manager: ConfigTransactionManager, *, mac: str = "aa", content: str = "prior"
) -> TransactionStatus:
    return await manager.async_preview(
        mac, _topology(), _plan(content), _source(content), (_selection(),)
    )


def test_preview_binds_source_and_exposes_only_bounded_safe_dto() -> None:
    async def run() -> None:
        manager = _manager(Builder(), Persistence())
        status = await manager.async_preview(
            "AA",
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
            await manager.async_preview("aa", _topology(), _plan(), bad)

    asyncio.run(run())


def test_confirmations_and_verified_persistence_are_separate() -> None:
    async def run() -> None:
        builder, persistence = Builder(), Persistence()
        manager = _manager(builder, persistence)
        preview = await _preview(manager)
        with pytest.raises(PermissionError):
            await manager.async_confirm_write(preview.transaction_id, "")
        status = await manager.async_confirm_write(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert not persistence.saved
        with pytest.raises(PermissionError):
            await manager.async_confirm_install(preview.transaction_id, "")
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.VERIFIED
        assert builder.calls == ["write", "validate", "compile", "upload"]
        saved = persistence.saved[0][1][0]  # type: ignore[index]
        assert (
            saved.config_sha256 == sha256(_plan().proposed_content.encode()).hexdigest()
        )
        assert not manager.sessions.is_config_locked("aa")
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
        assert not manager.sessions.is_config_locked("aa")

    asyncio.run(run())


def test_rollback_failure_is_typed_terminal_and_not_double_validated() -> None:
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
        assert not manager.sessions.is_config_locked("aa")
        with pytest.raises(KeyError):
            manager.status(preview.transaction_id)

    asyncio.run(run())


def test_compile_failure_has_one_shot_rollback_and_no_raw_output() -> None:
    async def run() -> None:
        huge = "credential-without-label-" + "x" * 1_000_000
        builder = Builder(compile=Job(False, huge, (huge,) * 200))
        manager = _manager(builder, Persistence())
        preview = await _preview(manager)
        status = await manager.async_confirm_write(preview.transaction_id, "admin")
        internal = manager.sessions._get_transaction(preview.transaction_id)
        assert (
            status.state is ConfigTransactionState.FAILED and status.rollback_available
        )
        assert status.evidence == (TransactionEvidenceCode.COMPILE_FAILED,)
        assert "credential" not in repr(status) and len(repr(status)) < 4_096
        assert "upload" not in builder.calls and manager.sessions.is_config_locked("aa")
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
        first2 = asyncio.create_task(
            manager2.async_confirm_write(preview2.transaction_id, "admin")
        )
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
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.FAILED
        assert status.evidence == (TransactionEvidenceCode.UPLOAD_FAILED,)
        assert "token" not in repr(status) and not persistence.saved
        assert not manager.sessions.is_config_locked("aa")

    asyncio.run(run())


@pytest.mark.parametrize(
    ("evidence", "code"),
    (
        (_evidence("bb"), TransactionEvidenceCode.IDENTITY_MISMATCH),
        (
            ReconnectEvidence("aa", _topology(1), _evidence().ct_names, 6),
            TransactionEvidenceCode.TOPOLOGY_MISMATCH,
        ),
        (
            ReconnectEvidence("aa", _topology(), {}, 6),
            TransactionEvidenceCode.ENTITY_MISMATCH,
        ),
        (
            ReconnectEvidence(
                "aa", _topology(), {**_evidence().ct_names, 1: "Wrong"}, 6
            ),
            TransactionEvidenceCode.ENTITY_MISMATCH,
        ),
        (
            ReconnectEvidence("aa", _topology(), _evidence().ct_names, 5),
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
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.state is ConfigTransactionState.FAILED
        assert status.evidence == (code,)
        assert not persistence.saved and not manager.sessions.is_config_locked("aa")

    asyncio.run(run())


def test_persistence_failure_is_terminal_and_releases_lease() -> None:
    async def run() -> None:
        manager = _manager(Builder(), Persistence(OSError("disk secret")))
        preview = await _preview(manager)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        status = await manager.async_confirm_install(preview.transaction_id, "admin")
        assert status.evidence == (TransactionEvidenceCode.PERSISTENCE_FAILED,)
        assert "secret" not in repr(status)
        assert not manager.sessions.is_config_locked("aa")

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
        assert not manager.sessions.is_config_locked("aa")

        builder2, persistence2 = Builder(), Persistence()
        builder2.pause("upload")
        manager2 = _manager(builder2, persistence2)
        preview2 = await _preview(manager2)
        await manager2.async_confirm_write(preview2.transaction_id, "admin")
        task2 = asyncio.create_task(
            manager2.async_confirm_install(preview2.transaction_id, "admin")
        )
        await asyncio.wait_for(builder2.started["upload"].wait(), 1)
        task2.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task2
        assert not persistence2.saved and not manager2.sessions.is_config_locked("aa")
        with pytest.raises(KeyError):
            manager2.status(preview2.transaction_id)

    asyncio.run(run())


def test_unload_cancels_tasks_and_mac_case_uses_one_lock() -> None:
    async def run() -> None:
        sessions, builder = SessionManager(), Builder()
        builder.pause("validate")
        manager = _manager(builder, Persistence(), sessions=sessions)
        first, second = (
            await _preview(manager, mac="AA"),
            await _preview(manager, mac="aa"),
        )
        task1 = asyncio.create_task(
            manager.async_confirm_write(first.transaction_id, "admin")
        )
        await asyncio.wait_for(builder.started["validate"].wait(), 1)
        task2 = asyncio.create_task(
            manager.async_confirm_write(second.transaction_id, "admin")
        )
        await asyncio.sleep(0)
        assert sessions.is_config_locked("AA") and builder.calls.count("write") == 1
        await sessions.async_unload()
        assert task1.cancelled() and task2.cancelled()
        assert not sessions.is_config_locked("aa")
        with pytest.raises(KeyError):
            manager.status(first.transaction_id)

    asyncio.run(run())


def test_stale_rollback_cannot_release_new_lease() -> None:
    async def run() -> None:
        sessions, builder = SessionManager(), Builder(compile=Job(False))
        manager = _manager(builder, Persistence(), sessions=sessions)
        first = await _preview(manager, mac="AA")
        await manager.async_confirm_write(first.transaction_id, "admin")
        builder.pause("validate")
        second = await _preview(manager, mac="aa")
        second_task = asyncio.create_task(
            manager.async_confirm_write(second.transaction_id, "admin")
        )
        await asyncio.sleep(0)
        await manager.async_rollback(first.transaction_id)
        await asyncio.wait_for(builder.started["validate"].wait(), 1)
        assert sessions.is_config_locked("aa")
        with pytest.raises(KeyError):
            await manager.async_rollback(first.transaction_id)
        assert sessions.is_config_locked("aa")
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
        assert not manager.sessions.is_config_locked("aa")

    asyncio.run(run())
