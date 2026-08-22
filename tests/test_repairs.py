"""The eight Task 21 repair signals have one actionable issue lifecycle."""

import asyncio

from custom_components.circuitsetup_energy_meter_helper import repairs


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
            object(),
            {"DEVICE_NOT_ADOPTED", "COMPILE_FAILED", "UNRELATED"},
        )
    )

    assert created == ["device_builder_unavailable", "compile_install_interrupted"]
    assert set(deleted) == set(repairs.ISSUES) - set(created)


def test_reconcile_normalizes_live_lowercase_evidence(monkeypatch) -> None:
    """Transaction evidence is lower-case while the release plan names are upper-case."""
    created: list[str] = []
    monkeypatch.setattr(repairs.issue_registry, "async_create_issue", lambda _h, _d, issue_id, **_k: created.append(issue_id))
    monkeypatch.setattr(repairs.issue_registry, "async_delete_issue", lambda *_: None)

    asyncio.run(repairs.async_reconcile_issues(object(), {"compile_failed", "upload_failed"}))

    assert created == ["compile_install_interrupted"]
