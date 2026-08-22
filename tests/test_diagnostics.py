"""Diagnostics must expose support evidence without exposing configuration data."""

import json
from types import SimpleNamespace

from custom_components.circuitsetup_energy_meter_helper.diagnostics import (
    build_diagnostics_snapshot,
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
        "config_entry_version": 1,
        "setup_state": "ready",
        "meter_count": 1,
        "meters": [
            {
                "entry_id": "meter",
                "mac_suffix": "eeff",
                "project_name": "circuitsetup.6c-energy-meter",
                "project_version": "1.2.3",
                "configuration": "meter.yaml",
            },
        ],
    }


def test_snapshot_is_json_serializable_for_home_assistant_diagnostics() -> None:
    """The public diagnostics result cannot contain MappingProxyType internals."""
    snapshot = build_diagnostics_snapshot(
        entry=SimpleNamespace(version=1), runtime={}, integration_version="0.1.0"
    )
    assert json.loads(json.dumps(snapshot))["integration_version"] == "0.1.0"
