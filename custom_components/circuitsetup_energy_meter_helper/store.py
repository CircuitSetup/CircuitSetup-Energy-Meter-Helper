"""Versioned storage for safe CircuitSetup helper metadata."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .models import (
    StoredCTSelection,
    StoredInterruptedSession,
    StoredMeterRecord,
    StoredTopology,
)

STORAGE_VERSION = 1
STORAGE_MINOR_VERSION = 1
STORAGE_KEY = "circuitsetup_energy_meter_helper"


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

    async def async_load(self) -> dict[str, Any]:
        """Load the known storage schema through the strict version guard."""
        return (await self._store.async_load()) or {"meters": {}}

    async def async_save_meter(self, record: StoredMeterRecord) -> None:
        """Save one typed record keyed by MAC address."""
        data = await self.async_load()
        meters = data.setdefault("meters", {})
        meters[record.mac] = serialize_meter_record(record)
        await self._store.async_save(data)

    async def async_save_verified_ct_selections(
        self, mac: str, selections: tuple[StoredCTSelection, ...]
    ) -> None:
        """Persist only post-reconnect CT metadata, never configuration content."""
        data = await self.async_load()
        meters = data.setdefault("meters", {})
        meter = meters.setdefault(mac, {})
        meter["ct_selections"] = [_serialize_ct_selection(item) for item in selections]
        await self._store.async_save(data)
