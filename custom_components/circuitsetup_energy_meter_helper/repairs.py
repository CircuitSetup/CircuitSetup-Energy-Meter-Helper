"""The eight supported repair issues and their scoped lifecycle."""

from __future__ import annotations

import asyncio
from collections.abc import Iterable, Mapping
from dataclasses import fields, is_dataclass
from enum import Enum

from homeassistant.components.repairs import RepairsFlow
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import issue_registry

from .const import DOMAIN

ISSUES = {
    "meter_configuration_invalid": {"METER_CONFIGURATION_INVALID"},
    "legacy_totals_unmanaged": {"LEGACY_TOTALS_UNMANAGED"},
    "voltage_reference_mismatch": {"VOLTAGE_REFERENCE_MISMATCH"},
    "aggregate_entity_mismatch": {"AGGREGATE_ENTITY_MISMATCH"},
    "device_builder_unavailable": {"DEVICE_BUILDER_UNAVAILABLE"},
    "topology_project_package_mismatch": {"TOPOLOGY_PROJECT_PACKAGE_MISMATCH"},
    "runtime_entity_count_mismatch": {"TOPOLOGY_RUNTIME_MISMATCH"},
    "calibration_package_missing": {"CALIBRATION_PACKAGE_MISSING"},
    "reference_zero_not_supported": {"REFERENCE_ZERO_NOT_SUPPORTED"},
    "ct_preset_metadata_diverged": {"CT_PRESET_METADATA_DIVERGED"},
    "compile_install_interrupted": {"CANCELLED", "COMPILE_FAILED", "UPLOAD_FAILED"},
    "restore_verification_failed": {"CONFIG_ROLLBACK_FAILED", "RESTORE_GAIN_MISMATCH"},
}
_OPERATION_ISSUES = {
    "get_meter_configuration": {
        "legacy_totals_unmanaged",
        "voltage_reference_mismatch",
    },
    "preview_meter_configuration": {
        "meter_configuration_invalid",
        "legacy_totals_unmanaged",
        "voltage_reference_mismatch",
        "aggregate_entity_mismatch",
    },
    "adopt_device": {"device_builder_unavailable"},
    "get_topology": {"topology_project_package_mismatch"},
    "get_ct_inventory": {"device_builder_unavailable", "topology_project_package_mismatch", "ct_preset_metadata_diverged"},
    "preview_ct_config": {"device_builder_unavailable", "topology_project_package_mismatch", "ct_preset_metadata_diverged"},
    "apply_ct_config": {"device_builder_unavailable"},
    "start_session": {"device_builder_unavailable", "topology_project_package_mismatch", "runtime_entity_count_mismatch", "calibration_package_missing", "reference_zero_not_supported"},
    "calibrate_voltage": {"reference_zero_not_supported"},
    "calibrate_current": {"reference_zero_not_supported"},
    "compile_ct_config": {"device_builder_unavailable", "compile_install_interrupted"},
    "install_ct_config": {
        "device_builder_unavailable",
        "compile_install_interrupted",
        "aggregate_entity_mismatch",
    },
    "rollback_ct_config": {"device_builder_unavailable", "restore_verification_failed"},
    "restart_and_verify": {"restore_verification_failed"},
}


class _RepairFlow(RepairsFlow):
    async def async_step_init(self, user_input: None = None) -> FlowResult:
        return self.async_abort(reason="see_panel")


def _base_issue_id(issue_id: str) -> str | None:
    return next((base for base in ISSUES if issue_id == base or issue_id.startswith(f"{base}_")), None)


async def async_create_fix_flow(hass: HomeAssistant, issue_id: str, data: dict[str, str] | None) -> RepairsFlow:
    del hass, data
    if _base_issue_id(issue_id) is None:
        raise ValueError("unsupported repair issue")
    return _RepairFlow()


def scoped_issue_id(issue_id: str, entry_id: str) -> str:
    return f"{issue_id}_{entry_id}"


async def async_reconcile_issues(
    hass: HomeAssistant,
    entry_id: str,
    operation: str,
    signals: Iterable[str],
    *,
    authoritative: bool = True,
) -> None:
    """Evaluate only issues belonging to this operation; other failures persist."""
    candidates = _OPERATION_ISSUES.get(operation, set())
    active = {signal.upper() for signal in signals if isinstance(signal, str)}
    for issue_id in candidates:
        scoped_id = scoped_issue_id(issue_id, entry_id)
        if active.intersection(ISSUES[issue_id]):
            issue_registry.async_create_issue(hass, DOMAIN, scoped_id, is_fixable=True, severity=issue_registry.IssueSeverity.WARNING, translation_key=issue_id)
        elif authoritative and (
            issue_id != "aggregate_entity_mismatch" or "VERIFIED" in active
        ) and operation != "preview_meter_configuration":
            issue_registry.async_delete_issue(hass, DOMAIN, scoped_id)


def signals_from_result(result: object) -> set[str]:
    """Extract only allowlisted codes from frozen public results and exceptions."""
    if isinstance(result, BaseException):
        if isinstance(result, BaseExceptionGroup):
            return set().union(*(signals_from_result(item) for item in result.exceptions))
        if isinstance(result, asyncio.CancelledError):
            return {"CANCELLED"}
        names = {type(result).__name__}
        code = getattr(result, "code", None)
        if code == "config_rollback_failed":
            return {"CONFIG_ROLLBACK_FAILED"}
        if code == "meter_configuration_invalid" or type(result).__name__ == "ConfigMutationError":
            return {"METER_CONFIGURATION_INVALID"}
        if "VoltageReferenceMismatchError" in names:
            return {"VOLTAGE_REFERENCE_MISMATCH"}
        if names & {"WorkflowCapabilityUnavailable", "CapabilityUnavailable"}:
            return {"DEVICE_BUILDER_UNAVAILABLE"}
        if "TopologyMismatchError" in names:
            return {"TOPOLOGY_PROJECT_PACKAGE_MISMATCH", "TOPOLOGY_RUNTIME_MISMATCH"}
        if "EntityBindingMissing" in names:
            role = str(getattr(result, "role", ""))
            if any(
                suffix in role
                for suffix in (
                    ".reference_current",
                    ".voltage_reference",
                    ".run_gain",
                    ".restore_gain",
                )
            ):
                return {"CALIBRATION_PACKAGE_MISSING"}
            return {"TOPOLOGY_RUNTIME_MISMATCH"}
        if names & {"EntityBindingError", "EntityBindingAmbiguity"}:
            return {"TOPOLOGY_RUNTIME_MISMATCH"}
        if names & {"ReferenceZeroError", "ReferenceCleanupError"}:
            return {"REFERENCE_ZERO_NOT_SUPPORTED"}
        if names & {"RollbackFailedError", "RestartVerificationError"}:
            return {"CONFIG_ROLLBACK_FAILED", "RESTORE_GAIN_MISMATCH"}
        return set()
    if is_dataclass(result):
        result = {field.name: getattr(result, field.name) for field in fields(result)}
    if not isinstance(result, Mapping):
        return set()
    values: set[str] = set()
    state = result.get("state")
    if isinstance(state, Enum):
        state = state.value
    if state == "verified":
        values.add("VERIFIED")
    if result.get("aggregate_entity_mismatch") is True:
        values.add("aggregate_entity_mismatch")
    for key in ("evidence", "issues", "warnings"):
        raw = result.get(key, ())
        if isinstance(raw, tuple | list):
            for item in raw:
                if isinstance(item, Enum):
                    values.add(str(item.value))
                elif isinstance(item, str):
                    values.add(item)
                elif is_dataclass(item):
                    code = getattr(item, "code", None)
                    values.add(str(code.value if isinstance(code, Enum) else code)) if code is not None else None
                elif isinstance(item, Mapping) and isinstance(item.get("code"), str):
                    values.add(item["code"])
    preflight = result.get("preflight")
    if is_dataclass(preflight):
        preflight = {
            field.name: getattr(preflight, field.name) for field in fields(preflight)
        }
    if isinstance(preflight, Mapping):
        for item in preflight.get("issues", ()):
            code = getattr(item, "code", None)
            if isinstance(code, Enum):
                values.add(str(code.value))
            elif isinstance(code, str):
                values.add(code)
    if any(value in {"sensor_count_mismatch", "entity_mismatch", "topology_mismatch"} for value in values):
        values.add("TOPOLOGY_RUNTIME_MISMATCH")
    if "count_mismatch" in values:
        values.add("CALIBRATION_PACKAGE_MISSING")
        values.add("TOPOLOGY_RUNTIME_MISMATCH")
    if "invalid_range" in values or "zero_ack" in values:
        values.add("REFERENCE_ZERO_NOT_SUPPORTED")
    if "rollback_failed" in values:
        values.add("CONFIG_ROLLBACK_FAILED")
    values = {
        {
            "legacy_generic_totals_unmanaged": "LEGACY_TOTALS_UNMANAGED",
            "legacy_totals_unmanaged": "LEGACY_TOTALS_UNMANAGED",
            "voltage_reference_mismatch": "VOLTAGE_REFERENCE_MISMATCH",
            "aggregate_entity_mismatch": "AGGREGATE_ENTITY_MISMATCH",
            "meter_configuration_invalid": "METER_CONFIGURATION_INVALID",
        }.get(value, value)
        for value in values
    }
    channels = result.get("channels", ())
    if isinstance(channels, tuple | list) and any(
        bool(getattr(channel, "stored_selection_present", False))
        and not bool(getattr(channel, "selection_verified_against_config", False))
        for channel in channels
    ):
        values.add("CT_PRESET_METADATA_DIVERGED")
    return {value.upper() for value in values}
