"""Tests for the reviewed configuration/install transaction."""

import asyncio
from dataclasses import dataclass

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionManager,
    ConfigTransactionState,
    ReconnectEvidence,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    ConfigMutationPlan,
    MeterTopology,
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
        validation: tuple[bool, ...] = (True,),
        compile: bool = True,
        upload: bool = True,
    ) -> None:
        self.validation = list(validation)
        self.compile = compile
        self.upload = upload
        self.calls: list[str] = []

    async def async_update_config(self, snapshot: object, proposed: str) -> None:
        del snapshot, proposed
        self.calls.append("write")

    async def async_validate(self, configuration: str) -> Job:
        del configuration
        self.calls.append("validate")
        success = (
            self.validation.pop(0) if len(self.validation) > 1 else self.validation[0]
        )
        return Job(success, "key: top-secret" if not success else "")

    async def async_compile(self, configuration: str) -> Job:
        del configuration
        self.calls.append("compile")
        return Job(self.compile)

    async def async_upload(self, configuration: str) -> Job:
        del configuration
        self.calls.append("upload")
        return Job(self.upload, output_tail=("one", "two"))

    async def async_restore_content(self, configuration: str, content: str) -> None:
        del configuration, content
        self.calls.append("restore")


class Persistence:
    def __init__(self) -> None:
        self.saved: list[object] = []

    async def async_save_verified_ct_selections(
        self, mac: str, selections: tuple[object, ...]
    ) -> None:
        self.saved.append((mac, selections))


class Verifier:
    def __init__(self, evidence: ReconnectEvidence) -> None:
        self.evidence = evidence

    async def async_verify(self, mac: str) -> ReconnectEvidence:
        del mac
        return self.evidence


def _topology() -> MeterTopology:
    return MeterTopology.from_addon_count(
        0,
        connection_type="wifi",
        voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter",
        evidence=(),
    )


def _plan() -> ConfigMutationPlan:
    return ConfigMutationPlan(
        "meter.yaml",
        "a" * 64,
        (SubstitutionChange("ct1_name", "CT 1", "Kitchen"),),
        "+ ct1_name: Kitchen",
        "api:\n  encryption_key: top-secret\nsubstitutions:\n  ct1_name: Kitchen\n",
    )


def _manager(
    builder: Builder, persistence: Persistence, *, mac: str = "aa"
) -> ConfigTransactionManager:
    return ConfigTransactionManager(
        builder,
        Verifier(ReconnectEvidence(mac, _topology(), {1: "Kitchen"}, 6)),
        persistence,
        SessionManager(),
    )


def test_requires_two_confirmations_and_persists_only_after_reconnect_verification() -> (
    None
):
    """Preview is redacted; config metadata persists only after the OTA verification gate."""

    async def run() -> None:
        builder, persistence = Builder(), Persistence()
        manager = _manager(builder, persistence)
        preview = await manager.async_preview(
            "aa", _topology(), _plan(), "prior top-secret"
        )
        assert "top-secret" not in repr(preview)
        with pytest.raises(PermissionError):
            await manager.async_confirm_write(preview.transaction_id, "")
        transaction = await manager.async_confirm_write(preview.transaction_id, "admin")
        assert transaction.state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        assert not persistence.saved
        with pytest.raises(PermissionError):
            await manager.async_confirm_install(preview.transaction_id, "")
        transaction = await manager.async_confirm_install(
            preview.transaction_id, "admin"
        )
        assert transaction.state is ConfigTransactionState.VERIFIED
        assert persistence.saved and builder.calls == [
            "write",
            "validate",
            "compile",
            "upload",
        ]

    asyncio.run(run())


def test_validation_failure_restores_validates_and_releases_the_config_lock() -> None:
    """A bad write restores the exact in-memory predecessor before allowing another job."""

    async def run() -> None:
        builder, persistence = Builder(validation=(False, True)), Persistence()
        manager = _manager(builder, persistence)
        preview = await manager.async_preview("aa", _topology(), _plan(), "prior")
        transaction = await manager.async_confirm_write(preview.transaction_id, "admin")
        assert transaction.state is ConfigTransactionState.ROLLED_BACK
        assert builder.calls == ["write", "validate", "restore", "validate"]
        assert not persistence.saved
        assert not manager.sessions.is_config_locked("aa")

    asyncio.run(run())


def test_compile_failure_never_uploads_and_exposes_explicit_rollback() -> None:
    """A valid edited config remains available until the user chooses rollback."""

    async def run() -> None:
        builder, persistence = Builder(compile=False), Persistence()
        manager = _manager(builder, persistence)
        preview = await manager.async_preview("aa", _topology(), _plan(), "prior")
        transaction = await manager.async_confirm_write(preview.transaction_id, "admin")
        assert transaction.state is ConfigTransactionState.FAILED
        assert transaction.rollback_available and "upload" not in builder.calls
        transaction = await manager.async_rollback(preview.transaction_id)
        assert transaction.state is ConfigTransactionState.ROLLED_BACK
        assert not manager.sessions.is_config_locked("aa") and not persistence.saved

    asyncio.run(run())


def test_wrong_reconnect_identity_fails_without_persistence_and_unload_releases_locks() -> (
    None
):
    """Native verification rejects the wrong meter and cleanup cannot strand a device lock."""

    async def run() -> None:
        builder, persistence = Builder(), Persistence()
        manager = _manager(builder, persistence, mac="wrong")
        preview = await manager.async_preview("aa", _topology(), _plan(), "prior")
        await manager.async_confirm_write(preview.transaction_id, "admin")
        transaction = await manager.async_confirm_install(
            preview.transaction_id, "admin"
        )
        assert transaction.state is ConfigTransactionState.FAILED
        assert not persistence.saved and not manager.sessions.is_config_locked("aa")
        await manager.sessions.async_unload()
        assert manager.sessions.get_transaction(preview.transaction_id) is None

    asyncio.run(run())
