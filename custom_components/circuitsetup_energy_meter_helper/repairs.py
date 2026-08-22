"""The eight supported repair issues and their Home Assistant lifecycle."""

from __future__ import annotations

from collections.abc import Iterable

from homeassistant.components.repairs import RepairsFlow
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import issue_registry

from .const import DOMAIN

ISSUES = {
    "device_builder_unavailable": {"DEVICE_NOT_ADOPTED"},
    "topology_project_package_mismatch": {"TOPOLOGY_PROJECT_PACKAGE_MISMATCH"},
    "runtime_entity_count_mismatch": {"TOPOLOGY_RUNTIME_MISMATCH"},
    "calibration_package_missing": {"CALIBRATION_PACKAGE_MISSING"},
    "reference_zero_not_supported": {"REFERENCE_ZERO_NOT_SUPPORTED"},
    "ct_preset_metadata_diverged": {"CT_PRESET_METADATA_DIVERGED"},
    "compile_install_interrupted": {"COMPILE_FAILED", "UPLOAD_FAILED"},
    "restore_verification_failed": {"CONFIG_ROLLBACK_FAILED", "RESTORE_GAIN_MISMATCH"},
}


class _RepairFlow(RepairsFlow):
    async def async_step_init(self, user_input: None = None) -> FlowResult:
        """Direct users to the panel, which owns the safe repair operations."""
        return self.async_abort(reason="see_panel")


async def async_create_fix_flow(
    hass: HomeAssistant, issue_id: str, data: dict[str, str] | None
) -> RepairsFlow:
    """Offer a standard repairs-flow entry point for every allowed issue."""
    del hass, data
    if issue_id not in ISSUES:
        raise ValueError("unsupported repair issue")
    return _RepairFlow()


async def async_reconcile_issues(
    hass: HomeAssistant, signals: Iterable[str]
) -> None:
    """Create current plan issues and delete resolved ones; unknown signals stay private."""
    active = set(signals)
    for issue_id, codes in ISSUES.items():
        if active.intersection(codes):
            issue_registry.async_create_issue(
                hass,
                DOMAIN,
                issue_id,
                is_fixable=True,
                severity=issue_registry.IssueSeverity.WARNING,
                translation_key=issue_id,
            )
        else:
            issue_registry.async_delete_issue(hass, DOMAIN, issue_id)
