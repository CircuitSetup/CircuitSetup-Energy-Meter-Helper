"""Ownership-safe per-meter configuration transaction locking."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from dataclasses import dataclass, replace
from typing import Any
from uuid import uuid4

from .device_builder import ESPHomeConfigSnapshot
from .entity_binding import MeterBinding
from .models import (
    MeterTopology,
    PhaseOffsetTable,
    PhasePowerOffsetTable,
    canonical_mac,
)

type PhaseGainTable = tuple[tuple[int, int], tuple[int, int], tuple[int, int]]


@dataclass(slots=True)
class ConfigLease:
    mac: str
    lock: asyncio.Lock
    released: bool = False

    def release(self) -> None:
        if not self.released and self.lock.locked():
            self.lock.release()
        self.released = True


class CalibrationBusyError(RuntimeError):
    """The meter already has configuration or calibration work in flight."""


@dataclass(slots=True)
class DeviceLocks:
    config: asyncio.Lock
    calibration: asyncio.Lock


@dataclass(slots=True)
class CalibrationLease:
    mac: str
    locks: DeviceLocks
    task: asyncio.Task[Any] | None
    on_release: Callable[[str], None]
    released: bool = False

    def release(self) -> None:
        if self.released:
            return
        if self.locks.calibration.locked():
            self.locks.calibration.release()
        if self.locks.config.locked():
            self.locks.config.release()
        self.released = True
        self.on_release(self.mac)


@dataclass(frozen=True, slots=True)
class PendingCalibrationOrigin:
    """Server-owned source identity and final tables awaiting one restart."""

    operation_id: str
    revision: int
    mac: str
    session_identity: int
    topology: MeterTopology
    config_filename: str | None
    config_sha256: str | None
    gain_groups: tuple[tuple[str, PhaseGainTable], ...]
    offset_groups: tuple[tuple[str, PhaseOffsetTable], ...] = ()
    power_offset_groups: tuple[tuple[str, PhasePowerOffsetTable], ...] = ()
    claimed_revision: int | None = None

    @property
    def expected_phase_gains(self) -> dict[str, PhaseGainTable]:
        """Return a detached table for exact evidence comparison."""
        return dict(self.gain_groups)

    @property
    def expected_phase_offsets(self) -> dict[str, PhaseOffsetTable]:
        """Return retained voltage/current offset tables."""
        return dict(self.offset_groups)

    @property
    def expected_phase_power_offsets(self) -> dict[str, PhasePowerOffsetTable]:
        """Return retained active/reactive power offset tables."""
        return dict(self.power_offset_groups)


class SessionManager:
    def __init__(self, *, unload_timeout: float = 30.0) -> None:
        self._device_locks: dict[str, DeviceLocks] = {}
        self._calibration_leases: dict[str, CalibrationLease] = {}
        self._calibration_iterations: dict[tuple[str, str], int] = {}
        self._config_transactions: dict[str, Any] = {}
        self._pending_calibrations: dict[str, PendingCalibrationOrigin] = {}
        self._closed = False
        self._unload_timeout = unload_timeout

    async def async_acquire_config(self, mac: str) -> ConfigLease:
        mac = canonical_mac(mac)
        if self._closed:
            raise RuntimeError("session manager is unloading")
        lock = self._locks(mac).config
        await lock.acquire()
        if self._closed:
            lock.release()
            raise RuntimeError("session manager is unloading")
        return ConfigLease(mac, lock)

    async def async_acquire_calibration(self, mac: str) -> CalibrationLease:
        """Acquire config then calibration without waiting behind same-meter work."""
        mac = canonical_mac(mac)
        if self._closed:
            raise RuntimeError("session manager is unloading")
        locks = self._locks(mac)
        if locks.config.locked() or locks.calibration.locked():
            raise CalibrationBusyError(f"{mac} is busy")
        await locks.config.acquire()
        try:
            if self._closed:
                raise RuntimeError("session manager is unloading")
            if locks.calibration.locked():
                raise CalibrationBusyError(f"{mac} is busy")
            await locks.calibration.acquire()
        except BaseException:
            locks.config.release()
            raise
        lease = CalibrationLease(
            mac, locks, asyncio.current_task(), self._remove_calibration_lease
        )
        self._calibration_leases[mac] = lease
        return lease

    def _register_transaction(self, transaction_id: str, transaction: Any) -> None:
        if self._closed:
            raise RuntimeError("session manager is unloading")
        self._config_transactions[transaction_id] = transaction

    def _get_transaction(self, transaction_id: str) -> Any | None:
        return self._config_transactions.get(transaction_id)

    def _remove_transaction(self, transaction_id: str) -> None:
        self._config_transactions.pop(transaction_id, None)

    def is_config_locked(self, mac: str) -> bool:
        locks = self._device_locks.get(canonical_mac(mac))
        return locks.config.locked() if locks else False

    def is_calibration_locked(self, mac: str) -> bool:
        locks = self._device_locks.get(canonical_mac(mac))
        return locks.calibration.locked() if locks else False

    def next_calibration_iteration(self, mac: str, operation: str) -> int:
        return self._calibration_iterations.get((canonical_mac(mac), operation), 0) + 1

    def record_calibration_iteration(
        self, mac: str, operation: str, iteration: int
    ) -> None:
        key = (canonical_mac(mac), operation)
        if iteration != self._calibration_iterations.get(key, 0) + 1:
            raise RuntimeError("calibration iteration progression changed")
        self._calibration_iterations[key] = iteration

    def reset_calibration_iterations(self, mac: str) -> None:
        mac = canonical_mac(mac)
        self._calibration_iterations = {
            key: value
            for key, value in self._calibration_iterations.items()
            if key[0] != mac
        }

    def abandon_calibration(self, mac: str) -> None:
        """Discard one idle browser workflow's in-memory calibration ownership."""
        mac = canonical_mac(mac)
        lease = self._calibration_leases.get(mac)
        if lease is not None and not lease.released:
            raise CalibrationBusyError("calibration operation is still active")
        self._pending_calibrations.pop(mac, None)
        self.reset_calibration_iterations(mac)

    def _begin_calibration_origin(
        self,
        lease: CalibrationLease,
        session: Any,
        binding: MeterBinding,
        snapshot: ESPHomeConfigSnapshot | None,
    ) -> PendingCalibrationOrigin:
        """Freeze an internally fetched configuration under its active lease."""
        self._require_active_calibration_lease(lease)
        if canonical_mac(lease.mac) in self._pending_calibrations:
            raise CalibrationBusyError("a calibration origin is already active")
        pending = PendingCalibrationOrigin(
            operation_id=uuid4().hex,
            revision=0,
            mac=lease.mac,
            session_identity=id(session),
            topology=binding.topology,
            config_filename=(snapshot.configuration if snapshot is not None else None),
            config_sha256=(snapshot.sha256 if snapshot is not None else None),
            gain_groups=(),
        )
        self._pending_calibrations[lease.mac] = pending
        return pending

    def record_calibration_group(
        self,
        lease: CalibrationLease,
        operation_id: str,
        revision: int,
        session: Any,
        binding: MeterBinding,
        instance_id: str,
        phase_gains: PhaseGainTable,
    ) -> PendingCalibrationOrigin:
        """Revision one final table under the exact active operation and lease."""
        self._require_active_calibration_lease(lease)
        pending = self._pending_calibrations.get(lease.mac)
        if (
            pending is None
            or pending.operation_id != operation_id
            or pending.revision != revision
        ):
            raise RuntimeError("calibration origin revision changed")
        if pending.claimed_revision is not None:
            raise CalibrationBusyError("calibration origin is claimed for restart")
        if (
            pending.session_identity != id(session)
            or pending.topology != binding.topology
        ):
            raise RuntimeError("calibration topology changed after origin capture")
        expected_ids = {
            f"meter_main{group_index}"
            if board_index == 0
            else f"addon{board_index}_{group_index}"
            for board_index in range(pending.topology.board_count)
            for group_index in (1, 2)
        }
        if instance_id not in expected_ids:
            raise RuntimeError("calibration group is outside the retained topology")
        groups = pending.expected_phase_gains
        groups[instance_id] = phase_gains
        updated = replace(
            pending,
            revision=pending.revision + 1,
            gain_groups=tuple(groups.items()),
        )
        self._pending_calibrations[lease.mac] = updated
        return updated

    def record_offset_calibration_group(
        self,
        lease: CalibrationLease,
        operation_id: str,
        revision: int,
        session: Any,
        binding: MeterBinding,
        instance_id: str,
        stage: int,
        phase_offsets: PhaseOffsetTable | PhasePowerOffsetTable,
    ) -> PendingCalibrationOrigin:
        """Retain one exact offset table under the active board operation."""
        self._require_active_calibration_lease(lease)
        pending = self._pending_calibrations.get(lease.mac)
        if (
            pending is None
            or pending.operation_id != operation_id
            or pending.revision != revision
        ):
            raise RuntimeError("calibration origin revision changed")
        if pending.claimed_revision is not None:
            raise CalibrationBusyError("calibration origin is claimed for restart")
        if (
            pending.session_identity != id(session)
            or pending.topology != binding.topology
        ):
            raise RuntimeError("calibration topology changed after origin capture")
        expected_ids = {
            f"meter_main{group_index}"
            if board_index == 0
            else f"addon{board_index}_{group_index}"
            for board_index in range(pending.topology.board_count)
            for group_index in (1, 2)
        }
        if instance_id not in expected_ids:
            raise RuntimeError("calibration group is outside the retained topology")
        if stage == 1:
            groups = pending.expected_phase_offsets
        elif stage == 2:
            groups = pending.expected_phase_power_offsets
        else:
            raise ValueError("offset calibration stage must be 1 or 2")
        if instance_id in groups:
            raise RuntimeError("offset calibration group is already complete")
        groups[instance_id] = phase_offsets
        updated = (
            replace(
                pending,
                revision=pending.revision + 1,
                offset_groups=tuple(groups.items()),
            )
            if stage == 1
            else replace(
                pending,
                revision=pending.revision + 1,
                power_offset_groups=tuple(groups.items()),
            )
        )
        self._pending_calibrations[lease.mac] = updated
        return updated

    def calibration_origin_for_update(
        self, lease: CalibrationLease, session: Any, binding: MeterBinding
    ) -> PendingCalibrationOrigin | None:
        """Return the unclaimed aggregate bound to this active operation."""
        self._require_active_calibration_lease(lease)
        pending = self._pending_calibrations.get(lease.mac)
        if pending is None:
            return None
        if pending.claimed_revision is not None:
            raise CalibrationBusyError("calibration origin is claimed for restart")
        if (
            pending.session_identity != id(session)
            or pending.topology != binding.topology
        ):
            raise RuntimeError("calibration origin belongs to another session")
        return pending

    def claim_calibration_origin(
        self, lease: CalibrationLease, session: Any, binding: MeterBinding
    ) -> PendingCalibrationOrigin:
        """Atomically freeze the exact aggregate used for restart verification."""
        pending = self.calibration_origin_for_update(lease, session, binding)
        if pending is None or not (
            pending.gain_groups or pending.offset_groups or pending.power_offset_groups
        ):
            raise RuntimeError("server-owned calibration origin is missing")
        claimed = replace(pending, claimed_revision=pending.revision)
        self._pending_calibrations[lease.mac] = claimed
        return claimed

    def release_calibration_origin_claim(
        self, lease: CalibrationLease, operation_id: str, revision: int
    ) -> None:
        """Make an exact failed verification aggregate retryable again."""
        self._require_active_calibration_lease(lease)
        pending = self._pending_calibrations.get(lease.mac)
        if (
            pending is None
            or pending.operation_id != operation_id
            or pending.revision != revision
            or pending.claimed_revision != revision
        ):
            raise RuntimeError("calibration origin claim changed")
        self._pending_calibrations[lease.mac] = replace(pending, claimed_revision=None)

    def pending_calibration(self, mac: str) -> PendingCalibrationOrigin | None:
        """Return a detached snapshot of the current server-owned aggregate."""
        return self._pending_calibrations.get(canonical_mac(mac))

    def consume_calibration_origin(
        self, lease: CalibrationLease, operation_id: str, revision: int
    ) -> None:
        """Consume exactly the aggregate that completed restart persistence."""
        self._require_active_calibration_lease(lease)
        pending = self._pending_calibrations.get(lease.mac)
        if (
            pending is None
            or pending.operation_id != operation_id
            or pending.revision != revision
            or pending.claimed_revision != revision
        ):
            raise RuntimeError("calibration origin changed before consumption")
        self._pending_calibrations.pop(lease.mac)

    def _require_active_calibration_lease(self, lease: CalibrationLease) -> None:
        active = self._calibration_leases.get(lease.mac)
        if (
            active is not lease
            or lease.released
            or lease.task is not asyncio.current_task()
            or not lease.locks.config.locked()
            or not lease.locks.calibration.locked()
        ):
            raise CalibrationBusyError("calibration operation lease is not active")

    async def async_unload(self) -> None:
        self._closed = True
        pending: set[asyncio.Task[Any]] = set()
        cleanup_errors: list[BaseException] = []
        transactions = tuple(self._config_transactions.values())
        owned_tasks = tuple(
            {
                task
                for transaction in transactions
                for task in tuple(getattr(transaction, "active_tasks", ()))
            }
        )
        tasks = tuple(task for task in owned_tasks if not task.done())
        for task in owned_tasks:
            if not task.done() or task.cancelled():
                continue
            try:
                if (task_error := task.exception()) is not None:
                    cleanup_errors.append(task_error)
            except BaseException as error:  # noqa: BLE001 - aggregate cleanup
                cleanup_errors.append(error)
        calibration_tasks = tuple(
            lease.task
            for lease in self._calibration_leases.values()
            if lease.task is not None and not lease.task.done()
        )
        for transaction in transactions:
            if tasks and getattr(transaction, "active_tasks", ()):
                mark_unresolved = getattr(transaction, "mark_unresolved", None)
                if mark_unresolved:
                    mark_unresolved()
        all_tasks = tuple({*tasks, *calibration_tasks})
        current = asyncio.current_task()
        for task in all_tasks:
            if task is current:
                continue
            task.cancel()
        waited_tasks = tuple(task for task in all_tasks if task is not current)
        if waited_tasks:
            done, pending = await asyncio.wait(
                waited_tasks, timeout=self._unload_timeout
            )
            for task in done:
                if task.cancelled():
                    continue
                try:
                    if (task_error := task.exception()) is not None:
                        cleanup_errors.append(task_error)
                except BaseException as error:  # noqa: BLE001 - aggregate cleanup
                    cleanup_errors.append(error)
            for task in pending:
                task.cancel()
        for transaction in transactions:
            try:
                release_reservation = getattr(
                    transaction, "async_release_reservation", None
                )
                if release_reservation is not None:
                    await release_reservation()
            except BaseException as error:  # noqa: BLE001 - finish local teardown
                cleanup_errors.append(error)
            finally:
                lease = getattr(transaction, "lease", None)
                if lease:
                    try:
                        lease.release()
                    except BaseException as error:  # noqa: BLE001 - scrub regardless
                        cleanup_errors.append(error)
                scrub = getattr(transaction, "scrub", None)
                if scrub:
                    try:
                        scrub()
                    except BaseException as error:  # noqa: BLE001 - clear maps regardless
                        cleanup_errors.append(error)
        pending_leases: dict[str, CalibrationLease] = {}
        for lease in tuple(self._calibration_leases.values()):
            task = lease.task
            if task is not None and task in pending and not lease.released:
                pending_leases[lease.mac] = lease

                def release_when_done(
                    _task: asyncio.Task[Any],
                    item: CalibrationLease = lease,
                ) -> None:
                    item.release()

                task.add_done_callback(release_when_done)
            else:
                lease.release()
        self._config_transactions.clear()
        self._calibration_iterations.clear()
        self._pending_calibrations.clear()
        self._calibration_leases = pending_leases
        self._device_locks = {mac: lease.locks for mac, lease in pending_leases.items()}
        if cleanup_errors:
            raise BaseExceptionGroup("reservation cleanup failed", cleanup_errors)

    def _locks(self, mac: str) -> DeviceLocks:
        return self._device_locks.setdefault(
            mac, DeviceLocks(asyncio.Lock(), asyncio.Lock())
        )

    def _remove_calibration_lease(self, mac: str) -> None:
        self._calibration_leases.pop(mac, None)
        if self._closed:
            self._device_locks.pop(mac, None)
