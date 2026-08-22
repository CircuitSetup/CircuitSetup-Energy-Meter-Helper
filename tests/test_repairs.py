"""The eight Task 21 repair signals have one actionable issue lifecycle."""

import asyncio

import pytest

from custom_components.circuitsetup_energy_meter_helper import repairs
from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionState,
    TransactionEvidenceCode,
    TransactionStatus,
)
from custom_components.circuitsetup_energy_meter_helper.entity_binding import (
    EntityBindingMissing,
)
from custom_components.circuitsetup_energy_meter_helper.preflight import (
    PreflightCode,
    PreflightIssue,
    PreflightResult,
)
from custom_components.circuitsetup_energy_meter_helper.websocket_api import ApiFailure
from custom_components.circuitsetup_energy_meter_helper.workflow import SessionStatus


def test_reconcile_creates_only_plan_issues_and_removes_resolved(monkeypatch) -> None:
    """Unknown failures never grow the repair registry and resolved signals close."""
    created: list[str] = []
    deleted: list[str] = []
    monkeypatch.setattr(
        repairs.issue_registry,
        "async_create_issue",
        lambda _hass, _domain, issue_id, **_kwargs: created.append(issue_id),
    )
    monkeypatch.setattr(
        repairs.issue_registry,
        "async_delete_issue",
        lambda _hass, _domain, issue_id: deleted.append(issue_id),
    )

    asyncio.run(
        repairs.async_reconcile_issues(
            object(), "entry", "compile_ct_config",
            {"DEVICE_NOT_ADOPTED", "COMPILE_FAILED", "UNRELATED"},
        )
    )

    assert created == ["compile_install_interrupted_entry"]
    assert "compile_install_interrupted_entry" not in deleted


def test_reconcile_normalizes_live_lowercase_evidence(monkeypatch) -> None:
    """Transaction evidence is lower-case while the release plan names are upper-case."""
    created: list[str] = []
    monkeypatch.setattr(repairs.issue_registry, "async_create_issue", lambda _h, _d, issue_id, **_k: created.append(issue_id))
    monkeypatch.setattr(repairs.issue_registry, "async_delete_issue", lambda *_: None)

    asyncio.run(repairs.async_reconcile_issues(object(), "entry", "compile_ct_config", {"compile_failed", "upload_failed"}))

    assert created == ["compile_install_interrupted_entry"]


def test_unrelated_success_does_not_clear_scoped_issue(monkeypatch) -> None:
    created: list[str] = []
    deleted: list[str] = []
    monkeypatch.setattr(repairs.issue_registry, "async_create_issue", lambda _h, _d, issue_id, **_k: created.append(issue_id))
    monkeypatch.setattr(repairs.issue_registry, "async_delete_issue", lambda _h, _d, issue_id: deleted.append(issue_id))

    asyncio.run(repairs.async_reconcile_issues(object(), "entry", "compile_ct_config", {"compile_failed"}))
    asyncio.run(repairs.async_reconcile_issues(object(), "entry", "get_topology", set()))
    assert created == ["compile_install_interrupted_entry"]
    assert "compile_install_interrupted_entry" not in deleted
    asyncio.run(repairs.async_reconcile_issues(object(), "entry", "compile_ct_config", set()))
    assert "compile_install_interrupted_entry" in deleted


def test_unmapped_error_never_clears_operation_owned_issue(monkeypatch) -> None:
    deleted: list[str] = []
    monkeypatch.setattr(repairs.issue_registry, "async_create_issue", lambda *_a, **_k: None)
    monkeypatch.setattr(
        repairs.issue_registry,
        "async_delete_issue",
        lambda _h, _d, issue_id: deleted.append(issue_id),
    )

    asyncio.run(
        repairs.async_reconcile_issues(
            object(), "entry", "compile_ct_config", set(), authoritative=False
        )
    )

    assert deleted == []


def test_cancellation_is_recognized_as_interruption_evidence() -> None:
    assert repairs.signals_from_result(asyncio.CancelledError()) == {"CANCELLED"}


@pytest.mark.parametrize(
    ("operation", "signal", "issue"),
    [
        ("get_ct_inventory", "DEVICE_BUILDER_UNAVAILABLE", "device_builder_unavailable"),
        ("get_topology", "TOPOLOGY_PROJECT_PACKAGE_MISMATCH", "topology_project_package_mismatch"),
        ("start_session", "TOPOLOGY_RUNTIME_MISMATCH", "runtime_entity_count_mismatch"),
        ("start_session", "CALIBRATION_PACKAGE_MISSING", "calibration_package_missing"),
        ("calibrate_current", "REFERENCE_ZERO_NOT_SUPPORTED", "reference_zero_not_supported"),
        ("get_ct_inventory", "CT_PRESET_METADATA_DIVERGED", "ct_preset_metadata_diverged"),
        ("compile_ct_config", "COMPILE_FAILED", "compile_install_interrupted"),
        ("install_ct_config", "CANCELLED", "compile_install_interrupted"),
        ("restart_and_verify", "RESTORE_GAIN_MISMATCH", "restore_verification_failed"),
    ],
)
def test_each_plan_issue_has_an_entry_scoped_create_and_clear(monkeypatch, operation: str, signal: str, issue: str) -> None:
    calls: list[tuple[str, str]] = []
    monkeypatch.setattr(repairs.issue_registry, "async_create_issue", lambda _h, _d, issue_id, **_k: calls.append(("create", issue_id)))
    monkeypatch.setattr(repairs.issue_registry, "async_delete_issue", lambda _h, _d, issue_id: calls.append(("delete", issue_id)))
    asyncio.run(repairs.async_reconcile_issues(object(), "entry", operation, {signal}))
    asyncio.run(repairs.async_reconcile_issues(object(), "entry", operation, set()))
    scoped = f"{issue}_entry"
    assert ("create", scoped) in calls
    assert ("delete", scoped) in calls


def test_real_frozen_statuses_and_wrapped_errors_emit_repair_signals() -> None:
    transaction = TransactionStatus(
        "transaction",
        ConfigTransactionState.FAILED,
        "a" * 64,
        (),
        "",
        False,
        (TransactionEvidenceCode.COMPILE_FAILED,),
    )
    session = SessionStatus(
        "session",
        "device",
        "ready",
        False,
        PreflightResult(
            (
                PreflightIssue(PreflightCode.COUNT_MISMATCH, "topology", "mismatch"),
                PreflightIssue(
                    PreflightCode.INVALID_RANGE,
                    "main_1.voltage_reference",
                    "zero excluded",
                ),
            )
        ),
        {},
    )

    assert "COMPILE_FAILED" in repairs.signals_from_result(transaction)
    assert {
        "TOPOLOGY_RUNTIME_MISMATCH",
        "CALIBRATION_PACKAGE_MISSING",
        "REFERENCE_ZERO_NOT_SUPPORTED",
    } <= repairs.signals_from_result(session)
    assert repairs.signals_from_result(ApiFailure("config_rollback_failed", "safe")) == {
        "CONFIG_ROLLBACK_FAILED"
    }
    assert repairs.signals_from_result(
        EntityBindingMissing("main_1.restore_gain")
    ) == {"CALIBRATION_PACKAGE_MISSING"}


def test_every_builder_dependent_operation_evaluates_builder_repair() -> None:
    for operation in (
        "adopt_device",
        "get_ct_inventory",
        "preview_ct_config",
        "apply_ct_config",
        "compile_ct_config",
        "install_ct_config",
        "rollback_ct_config",
        "start_session",
    ):
        assert "device_builder_unavailable" in repairs._OPERATION_ISSUES[operation]
