"""Versioned storage for safe CircuitSetup helper metadata."""

from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .models import (
    StoredCTSelection,
    StoredInterruptedSession,
    StoredMeterRecord,
    StoredTopology,
    canonical_mac,
)

STORAGE_VERSION = 1
STORAGE_MINOR_VERSION = 1
STORAGE_KEY = "circuitsetup_energy_meter_helper"


class CalibrationSourceAuthority(StrEnum):
    """The source currently used by the running ATM90E32 component."""

    SAVED_FLASH = "saved_flash"
    CONFIGURATION = "configuration"


type PhaseGainTable = tuple[tuple[int, int], tuple[int, int], tuple[int, int]]


@dataclass(frozen=True, slots=True)
class VerifiedGainGroup:
    """One exactly verified post-restart ATM90E32 gain table."""

    instance_id: str
    phase_gains: PhaseGainTable

    def __post_init__(self) -> None:
        if (
            re.fullmatch(r"(?:meter_main[12]|addon[1-6]_[12])", self.instance_id)
            is None
        ):
            raise ValueError("instance_id is not a supported ATM90E32 group")
        if (
            type(self.phase_gains) is not tuple
            or len(self.phase_gains) != 3
            or any(
                type(phase) is not tuple or len(phase) != 2
                for phase in self.phase_gains
            )
            or any(
                type(value) is not int for phase in self.phase_gains for value in phase
            )
        ):
            raise ValueError(
                "verified gains require three phases of two non-boolean integers"
            )
        if any(
            not 1 <= value <= 65_535 for phase in self.phase_gains for value in phase
        ):
            raise ValueError("verified gains must be 16-bit positive values")


@dataclass(frozen=True, slots=True)
class VerifiedCalibrationRecord:
    """Compact final calibration record persisted only after restart verification."""

    mac: str
    config_filename: str | None
    config_sha256: str | None
    topology_addon_count: int
    topology_project_name: str
    topology_connection_type: str
    topology_voltage_layout: str
    connection_generation: int
    groups: tuple[VerifiedGainGroup, ...]
    verification_id: str
    source_authority: CalibrationSourceAuthority = (
        CalibrationSourceAuthority.SAVED_FLASH
    )
    source_handoff_available: bool = True
    source_handoff_transaction_id: str | None = None
    source_handoff_firmware_installed: bool = False

    def __post_init__(self) -> None:
        object.__setattr__(self, "mac", canonical_mac(self.mac))
        if (self.config_filename is None) != (self.config_sha256 is None):
            raise ValueError("configuration filename and hash must be present together")
        if self.config_filename is not None and (
            not self.config_filename
            or "\n" in self.config_filename
            or "\r" in self.config_filename
        ):
            raise ValueError("configuration filename must be a non-empty single line")
        if self.config_sha256 is not None and re.fullmatch(
            r"[0-9a-f]{64}", self.config_sha256
        ) is None:
            raise ValueError("configuration hash must be SHA-256")
        if not 0 <= self.topology_addon_count <= 6:
            raise ValueError("topology add-on count is invalid")
        if (
            not self.topology_project_name
            or "\n" in self.topology_project_name
            or "\r" in self.topology_project_name
        ):
            raise ValueError("topology project name must be a non-empty single line")
        if not self.topology_connection_type or not self.topology_voltage_layout:
            raise ValueError("topology connection and voltage layout are required")
        if self.connection_generation < 1 or not self.groups:
            raise ValueError("verified calibration requires a generation and groups")
        if re.fullmatch(r"[0-9a-f]{32}", self.verification_id) is None:
            raise ValueError("verification ID must be a server-generated identifier")
        if type(self.source_handoff_available) is not bool:
            raise ValueError("source handoff state must be boolean")
        if type(self.source_handoff_firmware_installed) is not bool:
            raise ValueError("source handoff firmware state must be boolean")
        if self.source_handoff_available and self.config_filename is None:
            raise ValueError("source handoff requires configuration identity")
        if self.source_handoff_available and self.source_handoff_firmware_installed:
            raise ValueError("available source handoff cannot already be installed")
        if (
            self.source_handoff_firmware_installed
            and self.source_handoff_transaction_id is None
        ):
            raise ValueError("installed handoff requires a transaction")
        if (
            self.source_authority is CalibrationSourceAuthority.CONFIGURATION
            and not self.source_handoff_firmware_installed
        ):
            raise ValueError("configuration authority requires install verification")
        if (
            self.source_handoff_transaction_id is not None
            and re.fullmatch(r"[0-9a-f]{32}", self.source_handoff_transaction_id)
            is None
        ):
            raise ValueError("source handoff transaction ID is invalid")
        instance_ids = tuple(group.instance_id for group in self.groups)
        if len(instance_ids) != len(set(instance_ids)):
            raise ValueError("verified calibration groups must be unique")

    @property
    def source_status(self) -> str:
        """Explain why changing YAML alone does not change the active gains."""
        if self.source_authority is CalibrationSourceAuthority.CONFIGURATION:
            return "Configuration calibration is authoritative."
        return (
            "Saved flash calibration remains authoritative until it is explicitly "
            "cleared."
        )


def migrate_storage(
    version: int, minor_version: int, data: dict[str, Any]
) -> dict[str, Any]:
    """Accept the known schema and fail closed for unknown future data."""
    if (
        version > STORAGE_VERSION
        or version == STORAGE_VERSION
        and minor_version > STORAGE_MINOR_VERSION
    ):
        raise ValueError("Storage version is newer than supported")
    if (version, minor_version) != (STORAGE_VERSION, STORAGE_MINOR_VERSION):
        raise ValueError(f"Storage version {version} cannot be migrated")
    return data


class _HelperStorage(Store[dict[str, Any]]):
    """Store whose live migration path uses the helper's strict guard."""

    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: dict[str, Any]
    ) -> dict[str, Any]:
        """Reject unsupported storage versions during Home Assistant loading."""
        return migrate_storage(old_major_version, old_minor_version, old_data)


def _serialize_topology(topology: StoredTopology) -> dict[str, Any]:
    """Serialize only known scalar topology fields."""
    if not isinstance(topology, StoredTopology):
        raise TypeError("topology must be StoredTopology")
    return {
        "addon_count": topology.addon_count,
        "board_count": topology.board_count,
        "ct_count": topology.ct_count,
        "group_count": topology.group_count,
        "connection_type": topology.connection_type,
        "voltage_layout": topology.voltage_layout,
        "project_name": topology.project_name,
        "evidence": [
            {
                "source": evidence.source,
                "addon_count": evidence.addon_count,
                "detail": evidence.detail,
            }
            for evidence in topology.evidence
        ],
    }


def _serialize_ct_selection(selection: StoredCTSelection) -> dict[str, Any]:
    """Serialize the fixed CT-selection schema."""
    if not isinstance(selection, StoredCTSelection):
        raise TypeError("ct_selections must contain StoredCTSelection")
    return {
        "channel": selection.channel,
        "model_id": selection.model_id,
        "display_label": selection.display_label,
        "raw_gain_ct": selection.raw_gain_ct,
        "reporting_multiplier": selection.reporting_multiplier,
        "config_sha256": selection.config_sha256,
    }


def _serialize_interrupted_session(
    session: StoredInterruptedSession,
) -> dict[str, Any]:
    """Serialize the fixed interrupted-session marker."""
    if not isinstance(session, StoredInterruptedSession):
        raise TypeError("interrupted_session must be StoredInterruptedSession")
    return {
        "state": session.state,
        "started_at": session.started_at,
        "changed_channels": list(session.changed_channels),
        "config_transaction_id": session.config_transaction_id,
    }


def _serialize_verified_calibration(
    record: VerifiedCalibrationRecord,
) -> dict[str, Any]:
    """Serialize only exact gains and their configuration origin."""
    if not isinstance(record, VerifiedCalibrationRecord):
        raise TypeError("record must be VerifiedCalibrationRecord")
    return {
        "verification_id": record.verification_id,
        "config_filename": record.config_filename,
        "config_sha256": record.config_sha256,
        "topology_addon_count": record.topology_addon_count,
        "topology_project_name": record.topology_project_name,
        "topology_connection_type": record.topology_connection_type,
        "topology_voltage_layout": record.topology_voltage_layout,
        "connection_generation": record.connection_generation,
        "groups": [
            {
                "instance_id": group.instance_id,
                "phase_gains": [list(phase) for phase in group.phase_gains],
            }
            for group in record.groups
        ],
        "source_authority": record.source_authority.value,
        "source_handoff_available": record.source_handoff_available,
        "source_handoff_transaction_id": record.source_handoff_transaction_id,
        "source_handoff_firmware_installed": (
            record.source_handoff_firmware_installed
        ),
    }


def _deserialize_verified_calibration(
    mac: str, raw: object
) -> VerifiedCalibrationRecord:
    """Reject malformed cached calibration metadata before it can be reused."""
    mac = canonical_mac(mac)
    if not isinstance(raw, dict):
        raise TypeError("stored verified calibration must be a mapping")
    raw_groups = raw.get("groups")
    if not isinstance(raw_groups, list):
        raise TypeError("stored verified calibration groups must be a list")
    groups: list[VerifiedGainGroup] = []
    for item in raw_groups:
        if not isinstance(item, dict):
            raise TypeError("stored verified calibration group must be a mapping")
        instance_id = item.get("instance_id")
        phase_gains = item.get("phase_gains")
        if not isinstance(instance_id, str) or not isinstance(phase_gains, list):
            raise TypeError("stored verified calibration group fields are invalid")
        if len(phase_gains) != 3 or any(
            not isinstance(phase, list) or len(phase) != 2 for phase in phase_gains
        ):
            raise ValueError("stored verified calibration gains have an invalid shape")
        groups.append(
            VerifiedGainGroup(
                instance_id,
                (
                    (phase_gains[0][0], phase_gains[0][1]),
                    (phase_gains[1][0], phase_gains[1][1]),
                    (phase_gains[2][0], phase_gains[2][1]),
                ),
            )
        )
    try:
        raw_authority = raw.get("source_authority")
        if not isinstance(raw_authority, str):
            raise TypeError("stored source authority must be a string")
        authority = CalibrationSourceAuthority(raw_authority)
        return VerifiedCalibrationRecord(
            mac=mac,
            config_filename=raw["config_filename"],
            config_sha256=raw["config_sha256"],
            topology_addon_count=raw["topology_addon_count"],
            topology_project_name=raw["topology_project_name"],
            topology_connection_type=raw["topology_connection_type"],
            topology_voltage_layout=raw["topology_voltage_layout"],
            connection_generation=raw["connection_generation"],
            groups=tuple(groups),
            verification_id=raw["verification_id"],
            source_authority=authority,
            source_handoff_available=raw["source_handoff_available"],
            source_handoff_transaction_id=raw.get("source_handoff_transaction_id"),
            source_handoff_firmware_installed=raw.get(
                "source_handoff_firmware_installed", False
            ),
        )
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError("stored verified calibration is invalid") from error


def serialize_meter_record(record: StoredMeterRecord) -> dict[str, Any]:
    """Serialize a record without accepting arbitrary nested payloads."""
    if not isinstance(record, StoredMeterRecord):
        raise TypeError("record must be StoredMeterRecord")
    return {
        "mac": record.mac,
        "setup_intent": record.setup_intent,
        "config_filename": record.config_filename,
        "topology": (
            _serialize_topology(record.topology)
            if record.topology is not None
            else None
        ),
        "ct_selections": [
            _serialize_ct_selection(selection) for selection in record.ct_selections
        ],
        "interrupted_session": (
            _serialize_interrupted_session(record.interrupted_session)
            if record.interrupted_session is not None
            else None
        ),
    }


class HelperStore:
    """Persist typed meter metadata without credentials or configuration content."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: _HelperStorage = _HelperStorage(
            hass,
            STORAGE_VERSION,
            STORAGE_KEY,
            minor_version=STORAGE_MINOR_VERSION,
        )
        self._update_lock = asyncio.Lock()

    async def async_load(self) -> dict[str, Any]:
        """Load the known storage schema through the strict version guard."""
        data = (await self._store.async_load()) or {"meters": {}}
        raw_meters = data.get("meters", {})
        if not isinstance(raw_meters, dict):
            raise TypeError("stored meters must be a mapping")
        meters: dict[str, Any] = {}
        for raw_mac, meter in raw_meters.items():
            mac = canonical_mac(raw_mac)
            if mac in meters:
                raise ValueError("stored meter aliases collide")
            if isinstance(meter, dict) and "mac" in meter:
                meter = {**meter, "mac": mac}
            meters[mac] = meter
        return {**data, "meters": meters}

    async def async_save_meter(self, record: StoredMeterRecord) -> None:
        """Save one typed record keyed by MAC address."""
        async with self._update_lock:
            data = await self.async_load()
            meters = data.setdefault("meters", {})
            meters[record.mac] = serialize_meter_record(record)
            await self._store.async_save(data)

    async def async_save_verified_ct_selections(
        self, mac: str, selections: tuple[StoredCTSelection, ...]
    ) -> None:
        """Persist only post-reconnect CT metadata, never configuration content."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            meters = data.setdefault("meters", {})
            meter = meters.setdefault(mac, {})
            meter["ct_selections"] = [
                _serialize_ct_selection(item) for item in selections
            ]
            await self._store.async_save(data)

    async def async_get_ct_selections(self, mac: str) -> tuple[StoredCTSelection, ...]:
        """Load only the safe persisted model selections for one meter."""
        raw = (await self.async_load()).get("meters", {}).get(canonical_mac(mac), {}).get("ct_selections", [])
        if not isinstance(raw, list):
            raise TypeError("stored CT selections must be a list")
        try:
            return tuple(StoredCTSelection(**item) for item in raw if isinstance(item, dict))
        except (TypeError, ValueError) as error:
            raise ValueError("stored CT selections are invalid") from error

    async def async_save_interrupted_session(
        self, mac: str, marker: StoredInterruptedSession | None
    ) -> None:
        """Persist or clear one recovery marker without retaining calibration values."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            meter = data.setdefault("meters", {}).setdefault(mac, {})
            meter["interrupted_session"] = (
                _serialize_interrupted_session(marker) if marker is not None else None
            )
            await self._store.async_save(data)

    async def async_get_interrupted_session(
        self, mac: str
    ) -> StoredInterruptedSession | None:
        """Load the calibration recovery marker for one meter."""
        raw = (
            (await self.async_load())
            .get("meters", {})
            .get(canonical_mac(mac), {})
            .get("interrupted_session")
        )
        if raw is None:
            return None
        if not isinstance(raw, dict):
            raise ValueError("stored interrupted session is invalid")
        try:
            return StoredInterruptedSession(
                raw["state"],
                raw["started_at"],
                tuple(raw["changed_channels"]),
                raw.get("config_transaction_id"),
            )
        except (KeyError, TypeError, ValueError) as error:
            raise ValueError("stored interrupted session is invalid") from error

    async def async_save_verified_calibration(
        self, record: VerifiedCalibrationRecord
    ) -> None:
        """Persist one compact final record after all changed groups verify."""
        async with self._update_lock:
            data = await self.async_load()
            meters = data.setdefault("meters", {})
            meter = meters.setdefault(record.mac, {})
            meter["verified_calibration"] = _serialize_verified_calibration(record)
            await self._store.async_save(data)

    async def async_get_verified_calibration(
        self, mac: str
    ) -> VerifiedCalibrationRecord | None:
        """Load the latest strict verified record for one canonical MAC."""
        mac = canonical_mac(mac)
        data = await self.async_load()
        raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
        return None if raw is None else _deserialize_verified_calibration(mac, raw)

    async def async_claim_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        """Atomically consume one record's reviewed source-handoff preview."""
        mac = canonical_mac(mac)
        if re.fullmatch(r"[0-9a-f]{32}", transaction_id) is None:
            return False
        async with self._update_lock:
            data = await self.async_load()
            raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
            if raw is None:
                return False
            record = _deserialize_verified_calibration(mac, raw)
            if (
                record.verification_id != verification_id
                or not record.source_handoff_available
            ):
                return False
            raw["source_handoff_available"] = False
            raw["source_handoff_transaction_id"] = transaction_id
            raw["source_handoff_firmware_installed"] = False
            await self._store.async_save(data)
            return True

    async def async_revalidate_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        """Atomically require the same latest record and preview reservation."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
            if raw is None:
                return False
            record = _deserialize_verified_calibration(mac, raw)
            return (
                record.verification_id == verification_id
                and not record.source_handoff_available
                and record.source_handoff_transaction_id == transaction_id
            )

    async def async_release_verified_calibration(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        """Release only the exact pre-write source-handoff reservation."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
            if raw is None:
                return False
            record = _deserialize_verified_calibration(mac, raw)
            if (
                record.verification_id != verification_id
                or record.source_handoff_available
                or record.source_handoff_transaction_id != transaction_id
            ):
                return False
            raw["source_handoff_available"] = True
            raw["source_handoff_transaction_id"] = None
            raw["source_handoff_firmware_installed"] = False
            await self._store.async_save(data)
            return True

    async def async_mark_verified_calibration_installed(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        """Record that the exact reviewed gains are running before flash is cleared."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
            if raw is None:
                return False
            record = _deserialize_verified_calibration(mac, raw)
            if (
                record.verification_id != verification_id
                or record.source_handoff_available
                or record.source_handoff_transaction_id != transaction_id
            ):
                return False
            raw["source_handoff_firmware_installed"] = True
            await self._store.async_save(data)
            return True

    async def async_complete_verified_calibration_handoff(
        self, mac: str, verification_id: str, transaction_id: str
    ) -> bool:
        """Make configuration authoritative only after install and flash clear."""
        mac = canonical_mac(mac)
        async with self._update_lock:
            data = await self.async_load()
            raw = data.get("meters", {}).get(mac, {}).get("verified_calibration")
            if raw is None:
                return False
            record = _deserialize_verified_calibration(mac, raw)
            if (
                record.verification_id != verification_id
                or record.source_handoff_available
                or not record.source_handoff_firmware_installed
                or record.source_handoff_transaction_id != transaction_id
            ):
                return False
            raw["source_authority"] = CalibrationSourceAuthority.CONFIGURATION.value
            await self._store.async_save(data)
            return True
