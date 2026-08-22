"""Diagnostics must expose support evidence without exposing configuration data."""

from types import SimpleNamespace

import pytest
from homeassistant.const import __version__ as HA_VERSION

from custom_components.circuitsetup_energy_meter_helper.diagnostics import (
    DiagnosticsTracker,
    build_diagnostics_snapshot,
    capture_diagnostics_snapshot,
)


def test_snapshot_is_allowlisted_and_deeply_immutable() -> None:
    """A future private runtime field cannot leak through the support snapshot."""
    snapshot = build_diagnostics_snapshot(
        entry=SimpleNamespace(
            entry_id="helper",
            data={"esphome_entry_id": "meter", "password": "nope"},
            version=1,
        ),
        runtime={
            "provisioning": SimpleNamespace(
                snapshot=SimpleNamespace(
                    state="ready",
                    devices=(
                        SimpleNamespace(
                            entry_id="meter",
                            project_name="circuitsetup.6c-energy-meter",
                            project_version="1.2.3",
                            configuration="meter.yaml",
                            mac="aabbccddeeff",
                            token="nope",
                        ),
                    ),
                )
            ),
            "workflow": SimpleNamespace(
                transactions=SimpleNamespace(
                    status=lambda _: SimpleNamespace(state="verified", error="nope")
                )
            ),
            "private_yaml": "api:\n  encryption:\n    key: nope",
        },
        integration_version="0.1.0",
    )

    assert dict(snapshot) == {
        "integration_version": "0.1.0",
        "home_assistant_version": HA_VERSION,
        "config_entry_version": 1,
        "setup_state": "ready",
        "meter_count": 1,
        "meters": [
            {
                "mac_suffix": "eeff",
                "project_name": "circuitsetup.6c-energy-meter",
                "project_version": "1.2.3",
                "configuration": "meter.yaml",
            },
        ],
        "topology": None,
        "entity_role_counts": {},
        "ct_models": [],
        "ct_presets": [],
        "last_transaction": None,
        "last_session": None,
        "error_codes": [],
    }


def test_snapshot_is_json_serializable_for_home_assistant_diagnostics() -> None:
    """The public diagnostics result cannot contain MappingProxyType internals."""
    snapshot = build_diagnostics_snapshot(
        entry=SimpleNamespace(version=1), runtime={}, integration_version="0.1.0"
    )
    from homeassistant.helpers.json import ExtendedJSONEncoder

    assert ExtendedJSONEncoder().encode(snapshot)


def test_tracker_records_only_bounded_public_result_state() -> None:
    """The support snapshot is independent of its source DTOs and omits handles."""
    tracker = DiagnosticsTracker()
    topology = SimpleNamespace(
        addon_count=1, board_count=2, ct_count=12, group_count=4,
        connection_type="wifi", voltage_layout="standard", project_name="meter",
        evidence=(SimpleNamespace(source="config_project", addon_count=1, detail="meter"),),
    )
    status = SimpleNamespace(
        transaction_id="private", state="verified", rollback_available=False,
        evidence=("compile_failed",), progress=("firmware_compiled",),
    )
    session = SimpleNamespace(
        session_id="private", device_id="private", state="ready", safety_acknowledged=True,
        preflight=SimpleNamespace(issues=()), entity_role_counts={"current_sensor": 12},
    )
    tracker.record_result("get_topology", topology)
    tracker.record_result("compile_ct_config", status)
    tracker.record_result("start_session", session)
    tracker.record_error(RuntimeError("secret detail"))

    snapshot = build_diagnostics_snapshot(
        entry=SimpleNamespace(version=2), runtime={"diagnostics": tracker}, integration_version="0.1.0"
    )
    assert snapshot["topology"]["ct_count"] == 12
    assert snapshot["entity_role_counts"] == {"current_sensor": 12}
    assert snapshot["last_transaction"] == {"state": "verified", "rollback_available": False, "evidence": ["compile_failed"], "progress": ["firmware_compiled"]}
    assert snapshot["last_session"]["state"] == "ready"
    assert snapshot["error_codes"] == ["operation_failed"]
    snapshot["topology"]["ct_count"] = 0
    assert build_diagnostics_snapshot(entry=SimpleNamespace(version=2), runtime={"diagnostics": tracker}, integration_version="0.1.0")["topology"]["ct_count"] == 12


def test_captured_internal_snapshot_is_deeply_frozen_and_stable() -> None:
    """Later tracker or caller mutation cannot rewrite captured support evidence."""
    tracker = DiagnosticsTracker()
    tracker.record_result(
        "get_topology",
        SimpleNamespace(
            addon_count=0,
            board_count=1,
            ct_count=6,
            group_count=2,
            connection_type="wifi",
            voltage_layout="standard",
            project_name="circuitsetup.6c-energy-meter",
            evidence=(),
        ),
    )
    captured = capture_diagnostics_snapshot(
        entry=SimpleNamespace(version=1),
        runtime={"diagnostics": tracker},
        integration_version="0.1.0",
    )

    with pytest.raises(TypeError):
        captured.values["topology"]["ct_count"] = 0  # type: ignore[index]
    assert tracker.topology is not None
    tracker.topology["ct_count"] = 12
    public = captured.public()
    public["topology"]["ct_count"] = 42
    assert captured.public()["topology"]["ct_count"] == 6


def test_tracker_records_only_stable_bounded_error_codes() -> None:
    tracker = DiagnosticsTracker()
    tracker.record_error(SimpleNamespace(code="config_rollback_failed"))
    tracker.record_error(SimpleNamespace(code="UPPERCASE SECRET"))

    snapshot = capture_diagnostics_snapshot(
        entry=SimpleNamespace(version=1),
        runtime={"diagnostics": tracker},
        integration_version="0.1.0",
    ).public()
    assert snapshot["error_codes"] == ["config_rollback_failed", "operation_failed"]
