"""Confirmed Device Builder configuration and OTA install transactions."""

from __future__ import annotations

import asyncio
from collections.abc import Mapping
from dataclasses import dataclass, field, replace
from enum import StrEnum
from hashlib import sha256
from typing import Protocol
from uuid import uuid4

from .device_builder import ESPHomeConfigSnapshot, JobResult
from .models import (
    ConfigMutationPlan,
    MeterTopology,
    StoredCTSelection,
    SubstitutionChange,
)
from .session_manager import ConfigLease, SessionManager, canonical_mac


class ConfigTransactionState(StrEnum):
    """The only legal visible configuration transaction states."""

    PREVIEWED = "previewed"
    WRITE_CONFIRMED = "write_confirmed"
    WRITTEN = "written"
    VALIDATED = "validated"
    COMPILED = "compiled"
    INSTALL_CONFIRMATION_REQUIRED = "install_confirmation_required"
    INSTALLING = "installing"
    RECONNECTING = "reconnecting"
    VERIFIED = "verified"
    ROLLED_BACK = "rolled_back"
    FAILED = "failed"


class RollbackFailedError(RuntimeError):
    """The original configuration could not be safely restored."""


class DeviceBuilder(Protocol):
    async def async_update_config(
        self, snapshot: ESPHomeConfigSnapshot, proposed_content: str
    ) -> None: ...

    async def async_validate(self, configuration: str) -> JobResult: ...

    async def async_compile(self, configuration: str) -> JobResult: ...

    async def async_upload(self, configuration: str) -> JobResult: ...

    async def async_restore_content(self, configuration: str, content: str) -> None: ...


class VerifiedPersistence(Protocol):
    async def async_save_verified_ct_selections(
        self, mac: str, selections: tuple[StoredCTSelection, ...]
    ) -> None: ...


@dataclass(frozen=True, slots=True)
class ReconnectEvidence:
    """Minimal native-API verification result injected until Task 14."""

    mac: str
    topology: MeterTopology
    ct_names: Mapping[int, str]
    current_sensor_count: int


class ReconnectVerifier(Protocol):
    async def async_verify(self, mac: str) -> ReconnectEvidence: ...


@dataclass(frozen=True, slots=True)
class TransactionPreview:
    """Websocket-safe transaction review data."""

    transaction_id: str
    state: ConfigTransactionState
    source_sha256: str
    changes: tuple[SubstitutionChange, ...]
    redacted_diff: str


@dataclass(slots=True)
class ConfigTransaction:
    """In-memory state; prior and proposed YAML are deliberately not repr-visible."""

    transaction_id: str
    mac: str
    topology: MeterTopology
    plan: ConfigMutationPlan = field(repr=False)
    prior_content: str = field(repr=False)
    selections: tuple[StoredCTSelection, ...] = ()
    state: ConfigTransactionState = ConfigTransactionState.PREVIEWED
    validation_summary: str = ""
    output_tail: tuple[str, ...] = ()
    rollback_available: bool = False
    lease: ConfigLease | None = field(default=None, repr=False)
    operation_lock: asyncio.Lock = field(default_factory=asyncio.Lock, repr=False)
    active_task: asyncio.Task[object] | None = field(default=None, repr=False)


class ConfigTransactionManager:
    """Serialize confirmed config write, build, OTA, reconnect, and persistence."""

    def __init__(
        self,
        device_builder: DeviceBuilder,
        verifier: ReconnectVerifier,
        persistence: VerifiedPersistence,
        sessions: SessionManager,
    ) -> None:
        self._device_builder = device_builder
        self._verifier = verifier
        self._persistence = persistence
        self.sessions = sessions

    async def async_preview(
        self,
        mac: str,
        topology: MeterTopology,
        plan: ConfigMutationPlan,
        source_snapshot: ESPHomeConfigSnapshot,
        selections: tuple[StoredCTSelection, ...] = (),
    ) -> TransactionPreview:
        """Retain full content only in memory and return a safe review surface."""
        transaction_id = uuid4().hex
        if (
            source_snapshot.configuration != plan.configuration
            or source_snapshot.sha256 != plan.source_sha256
            or sha256(source_snapshot.content.encode()).hexdigest()
            != source_snapshot.sha256
        ):
            raise ValueError("source snapshot does not match mutation plan")
        transaction = ConfigTransaction(
            transaction_id,
            canonical_mac(mac),
            topology,
            plan,
            source_snapshot.content,
            selections,
        )
        self.sessions.register_transaction(transaction_id, transaction)
        return self._preview(transaction)

    async def async_confirm_write(
        self, transaction_id: str, confirmed_by_admin_user_id: str
    ) -> ConfigTransaction:
        """Write and validate after the first explicit administrator confirmation."""
        _require_confirmation(confirmed_by_admin_user_id)
        transaction = self._transaction(transaction_id)
        if transaction.state is not ConfigTransactionState.PREVIEWED:
            raise RuntimeError("write confirmation is not legal in the current state")
        transaction.lease = await self.sessions.async_acquire_config(transaction.mac)
        try:
            transaction.state = ConfigTransactionState.WRITE_CONFIRMED
            snapshot = ESPHomeConfigSnapshot(
                transaction.plan.configuration,
                transaction.prior_content,
                transaction.plan.source_sha256,
            )
            await self._device_builder.async_update_config(
                snapshot, transaction.plan.proposed_content
            )
            transaction.state = ConfigTransactionState.WRITTEN
            validation = await self._device_builder.async_validate(
                transaction.plan.configuration
            )
            transaction.output_tail = _tail(validation.output_tail)
            if not validation.success:
                transaction.validation_summary = _redact(validation.summary)
                await self._rollback_locked(transaction)
                return transaction
            transaction.state = ConfigTransactionState.VALIDATED
            return await self.async_compile(transaction_id)
        except Exception:
            if transaction.state is not ConfigTransactionState.ROLLED_BACK:
                transaction.state = ConfigTransactionState.FAILED
                _release(transaction)
            raise

    async def async_compile(self, transaction_id: str) -> ConfigTransaction:
        """Compile a valid edit, retaining the lock until install or rollback cleanup."""
        transaction = self._transaction(transaction_id)
        if transaction.state is not ConfigTransactionState.VALIDATED:
            raise RuntimeError("compile is not legal in the current state")
        result = await self._device_builder.async_compile(
            transaction.plan.configuration
        )
        transaction.output_tail = _tail(result.output_tail)
        if not result.success:
            transaction.validation_summary = _redact(result.summary)
            transaction.rollback_available = True
            transaction.state = ConfigTransactionState.FAILED
            return transaction
        transaction.state = ConfigTransactionState.COMPILED
        transaction.state = ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        return transaction

    async def async_confirm_install(
        self, transaction_id: str, confirmed_by_admin_user_id: str
    ) -> ConfigTransaction:
        """Run the separate OTA-only install confirmation and reconnect verification."""
        _require_confirmation(confirmed_by_admin_user_id)
        transaction = self._transaction(transaction_id)
        if (
            transaction.state
            is not ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        ):
            raise RuntimeError("install confirmation is not legal in the current state")
        try:
            transaction.state = ConfigTransactionState.INSTALLING
            result = await self._device_builder.async_upload(
                transaction.plan.configuration
            )
            transaction.output_tail = _tail(result.output_tail)
            if not result.success:
                raise ConnectionError(_redact(result.summary) or "OTA upload failed")
            transaction.state = ConfigTransactionState.RECONNECTING
            evidence = await self._verifier.async_verify(transaction.mac)
            _verify_reconnect(transaction, evidence)
            selections = tuple(
                replace(
                    selection,
                    config_sha256=sha256(
                        transaction.plan.proposed_content.encode()
                    ).hexdigest(),
                )
                for selection in transaction.selections
            )
            await self._persistence.async_save_verified_ct_selections(
                transaction.mac, selections
            )
            transaction.state = ConfigTransactionState.VERIFIED
            return transaction
        except (ConnectionError, OSError, RuntimeError, ValueError) as error:
            transaction.validation_summary = _redact(str(error))
            transaction.state = ConfigTransactionState.FAILED
            return transaction
        finally:
            if transaction.state in {
                ConfigTransactionState.VERIFIED,
                ConfigTransactionState.FAILED,
            }:
                _release(transaction)

    async def async_rollback(self, transaction_id: str) -> ConfigTransaction:
        """Restore a locally valid edited configuration before any OTA uncertainty."""
        transaction = self._transaction(transaction_id)
        if not transaction.rollback_available:
            raise RuntimeError("rollback is not available in the current state")
        await self._rollback_locked(transaction)
        return transaction

    async def _rollback_locked(self, transaction: ConfigTransaction) -> None:
        try:
            await self._device_builder.async_restore_content(
                transaction.plan.configuration, transaction.prior_content
            )
            restored = await self._device_builder.async_validate(
                transaction.plan.configuration
            )
            if not restored.success:
                raise RollbackFailedError("restored configuration did not validate")
            transaction.state = ConfigTransactionState.ROLLED_BACK
        except RollbackFailedError:
            transaction.state = ConfigTransactionState.FAILED
            raise
        except Exception as error:
            transaction.state = ConfigTransactionState.FAILED
            raise RollbackFailedError("configuration rollback failed") from error
        finally:
            _release(transaction)

    def _transaction(self, transaction_id: str) -> ConfigTransaction:
        transaction = self.sessions.get_transaction(transaction_id)
        if not isinstance(transaction, ConfigTransaction):
            raise KeyError("unknown configuration transaction")
        return transaction

    @staticmethod
    def _preview(transaction: ConfigTransaction) -> TransactionPreview:
        return TransactionPreview(
            transaction.transaction_id,
            transaction.state,
            transaction.plan.source_sha256,
            transaction.plan.changes,
            transaction.plan.redacted_diff,
        )


def _require_confirmation(user_id: str) -> None:
    if not user_id:
        raise PermissionError("administrator confirmation is required")


def _release(transaction: ConfigTransaction) -> None:
    if transaction.lease is not None:
        transaction.lease.release()


def _tail(output: tuple[str, ...], limit: int = 100) -> tuple[str, ...]:
    return tuple(_redact(line) for line in output[-limit:])


def _redact(value: str) -> str:
    return (
        "[redacted]"
        if any(word in value.lower() for word in ("key", "token", "password"))
        else value
    )


def _verify_reconnect(
    transaction: ConfigTransaction, evidence: ReconnectEvidence
) -> None:
    if evidence.mac.lower() != transaction.mac.lower():
        raise ConnectionError("reconnected device MAC does not match")
    if evidence.topology != transaction.topology:
        raise ConnectionError("reconnected device topology does not match")
    if evidence.current_sensor_count != transaction.topology.ct_count:
        raise ConnectionError("reconnected current sensor count does not match")
    for change in transaction.plan.changes:
        if change.key.startswith("ct") and change.key.endswith("_name"):
            channel = int(change.key.removeprefix("ct").removesuffix("_name"))
            if evidence.ct_names.get(channel) != change.new_value:
                raise ConnectionError("reconnected CT entity names do not match")
