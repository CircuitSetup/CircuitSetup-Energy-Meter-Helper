"""Bounded diagnostics shared by Home Assistant and the guided panel."""

from __future__ import annotations

import json
from collections import deque
from collections.abc import Mapping
from dataclasses import dataclass
from os.path import basename
from pathlib import Path
from types import MappingProxyType
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import __version__ as HA_VERSION
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_MANIFEST = json.loads(Path(__file__).with_name("manifest.json").read_text("utf-8"))
_MAX_ERRORS = 16
_PUBLIC_ERROR_CODES = {
    "calibration_indeterminate",
    "cancelled",
    "capability_unavailable",
    "compile_failed",
    "config_changed",
    "config_rollback_failed",
    "config_validation_failed",
    "ct_model_ambiguous",
    "ct_name_collision",
    "device_busy",
    "device_not_adopted",
    "device_not_found",
    "invalid_request",
    "legacy_totals_unmanaged",
    "meter_configuration_invalid",
    "not_found",
    "operation_failed",
    "reference_zero_not_supported",
    "restore_gain_mismatch",
    "stale_confirmation",
    "topology_project_package_mismatch",
    "topology_runtime_mismatch",
    "upload_failed",
    "voltage_reference_mismatch",
    "aggregate_entity_mismatch",
}
_PUBLIC_WARNING_CODES = {
    "legacy_generic_totals_unmanaged": "legacy_totals_unmanaged",
}


def _value(item: object, key: str, default: Any = None) -> Any:
    return item.get(key, default) if isinstance(item, Mapping) else getattr(item, key, default)


def _text(value: object, fallback: str | None = None) -> str | None:
    return value if isinstance(value, str) and value else fallback


def _safe_strings(values: object, limit: int = 32) -> tuple[str, ...]:
    return (
        tuple(str(value) for value in values if isinstance(value, str))[:limit]
        if isinstance(values, tuple | list)
        else ()
    )


def _freeze(value: Any) -> Any:
    if isinstance(value, Mapping):
        return MappingProxyType(
            {str(key): _freeze(item) for key, item in value.items()}
        )
    if isinstance(value, tuple | list):
        return tuple(_freeze(item) for item in value)
    return value


def _error_code(error: object) -> str:
    code = getattr(error, "code", None)
    if isinstance(code, str) and code in _PUBLIC_ERROR_CODES:
        return code
    return {
        "CancelledError": "cancelled",
        "CapabilityUnavailable": "capability_unavailable",
        "WorkflowCapabilityUnavailable": "capability_unavailable",
        "ReferenceCleanupError": "reference_zero_not_supported",
        "ReferenceZeroError": "reference_zero_not_supported",
        "RestartVerificationError": "restore_gain_mismatch",
        "RollbackFailedError": "config_rollback_failed",
        "TopologyMismatchError": "topology_project_package_mismatch",
        "VoltageReferenceMismatchError": "voltage_reference_mismatch",
    }.get(type(error).__name__, "operation_failed")


def _topology(value: object) -> dict[str, Any] | None:
    value = _value(value, "topology", value)
    keys = ("addon_count", "board_count", "ct_count", "group_count", "connection_type", "voltage_layout", "project_name")
    if any(_value(value, key) is None for key in keys):
        return None
    evidence = []
    for item in _value(value, "evidence", ()):
        source, count, detail = _text(_value(item, "source")), _value(item, "addon_count"), _text(_value(item, "detail"))
        if source and isinstance(count, int) and detail:
            evidence.append({"source": source, "addon_count": count, "detail": detail})
    return {key: _value(value, key) for key in keys} | {"evidence": tuple(evidence)}


def _inventory(value: object) -> tuple[tuple[dict[str, Any], ...], tuple[dict[str, Any], ...]] | None:
    channels, catalog = _value(value, "channels"), _value(value, "catalog")
    if not isinstance(channels, tuple | list) or catalog is None:
        return None
    selected = tuple(
        {"channel": channel, "model_id": model}
        for item in channels
        if isinstance((channel := _value(item, "channel")), int)
        and (model := _text(_value(item, "selected_model_id")))
    )
    presets = tuple(
        {"model_id": model, "default_gain_ct": gain}
        for item in _value(catalog, "presets", ())
        if (model := _text(_value(item, "model_id"))) and isinstance((gain := _value(item, "default_gain_ct")), int)
    )
    return selected, presets


@dataclass(frozen=True, slots=True)
class DiagnosticsSnapshot:
    """Frozen internal DTO; callers receive a freshly projected JSON-safe copy."""

    values: Mapping[str, Any]

    def public(self) -> dict[str, Any]:
        def copy(value: Any) -> Any:
            if isinstance(value, Mapping):
                return {str(key): copy(item) for key, item in value.items()}
            if isinstance(value, tuple | list):
                return [copy(item) for item in value]
            return value

        return copy(self.values)


class DiagnosticsTracker:
    """Controller-owned, allowlisted state captured from real public DTOs."""

    def __init__(self) -> None:
        self.topology: dict[str, Any] | None = None
        self.ct_models: tuple[dict[str, Any], ...] = ()
        self.ct_presets: tuple[dict[str, Any], ...] = ()
        self.entity_role_counts: dict[str, int] = {}
        self.last_transaction: dict[str, Any] | None = None
        self.last_session: dict[str, Any] | None = None
        self.errors: deque[str] = deque(maxlen=_MAX_ERRORS)

    def record_result(self, operation: str, result: object) -> None:
        del operation
        for warning in _safe_strings(_value(result, "warnings", ())):
            warning = _PUBLIC_WARNING_CODES.get(warning, warning)
            if warning in _PUBLIC_ERROR_CODES:
                self.errors.append(warning)
        if _value(result, "aggregate_entity_mismatch") is True:
            self.errors.append("aggregate_entity_mismatch")
        if topology := _topology(result):
            self.topology = topology
        if inventory := _inventory(result):
            self.ct_models, self.ct_presets = inventory
        if _value(result, "state") is not None and _value(result, "rollback_available") is not None:
            self.last_transaction = {
                "state": str(_value(result, "state")),
                "rollback_available": bool(_value(result, "rollback_available")),
                "evidence": _safe_strings(_value(result, "evidence", ())),
                "progress": _safe_strings(_value(result, "progress", ())),
            }
        if _value(result, "preflight") is not None:
            preflight = _value(result, "preflight")
            counts = _value(result, "entity_role_counts", {})
            if isinstance(counts, Mapping):
                self.entity_role_counts = {str(key): value for key, value in counts.items() if isinstance(value, int) and value >= 0}
            self.last_session = {
                "state": str(_value(result, "state", "unknown")),
                "safety_acknowledged": bool(_value(result, "safety_acknowledged")),
                "preflight_codes": tuple(str(_value(issue, "code")) for issue in _value(preflight, "issues", ()) if _value(issue, "code") is not None),
            }

    def record_error(self, error: object) -> None:
        self.errors.append(_error_code(error))


def capture_diagnostics_snapshot(
    *,
    entry: object,
    runtime: Mapping[str, Any],
    integration_version: str,
    home_assistant_version: str = HA_VERSION,
) -> DiagnosticsSnapshot:
    """Capture one deeply immutable allowlisted support snapshot."""
    tracker = runtime.get("diagnostics")
    tracker = tracker if isinstance(tracker, DiagnosticsTracker) else DiagnosticsTracker()
    provisioning = runtime.get("provisioning")
    status = getattr(provisioning, "snapshot", None)
    meters = tuple(
        {
            "mac_suffix": (_text(getattr(device, "mac", None), "") or "")[-4:]
            or "unknown",
            "project_name": _text(
                getattr(device, "project_name", None), "unknown"
            ),
            "project_version": _text(getattr(device, "project_version", None)),
            "configuration": basename(
                _text(getattr(device, "configuration", None), "") or ""
            )
            or None,
        }
        for device in getattr(status, "devices", ())
    )
    return DiagnosticsSnapshot(
        _freeze(
            {
                "integration_version": integration_version,
                "home_assistant_version": home_assistant_version,
                "config_entry_version": int(getattr(entry, "version", 1)),
                "setup_state": _text(getattr(status, "state", None), "unknown"),
                "meter_count": len(meters),
                "meters": meters,
                "topology": tracker.topology,
                "entity_role_counts": tracker.entity_role_counts,
                "ct_models": tracker.ct_models,
                "ct_presets": tracker.ct_presets,
                "last_transaction": tracker.last_transaction,
                "last_session": tracker.last_session,
                "error_codes": tuple(tracker.errors),
            }
        )
    )


def build_diagnostics_snapshot(
    *, entry: object, runtime: Mapping[str, Any], integration_version: str,
    home_assistant_version: str = HA_VERSION,
) -> dict[str, Any]:
    """Project one immutable, allowlisted support snapshot without private traversal."""
    return capture_diagnostics_snapshot(
        entry=entry,
        runtime=runtime,
        integration_version=integration_version,
        home_assistant_version=home_assistant_version,
    ).public()


async def async_get_config_entry_diagnostics(hass: HomeAssistant, config_entry: ConfigEntry) -> dict[str, Any]:
    """Return the same frozen source snapshot used by the websocket provider."""
    runtime = hass.data.get(DOMAIN, {}).get(config_entry.entry_id, {})
    return build_diagnostics_snapshot(entry=config_entry, runtime=runtime if isinstance(runtime, Mapping) else {}, integration_version=_text(_MANIFEST.get("version"), "unknown") or "unknown")
