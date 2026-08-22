"""Tests for line-preserving, reviewable CT substitution changes."""

from dataclasses import replace
from hashlib import sha256
from types import SimpleNamespace

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
    ConfigMutationError,
    CTChangeRequest,
    build_ct_mutation,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology


def _topology() -> MeterTopology:
    return MeterTopology.from_addon_count(
        0,
        connection_type="wifi",
        voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter",
        evidence=(),
    )


def _snapshot(*, missing: str | None = None, quote: str = '"') -> ESPHomeConfigSnapshot:
    substitutions = []
    for channel in range(1, 7):
        if missing != f"ct{channel}_name":
            substitutions.append(f"  ct{channel}_name: {quote}CT {channel}{quote}")
        if missing != f"current_cal_ct{channel}":
            substitutions.append(f"  current_cal_ct{channel}: {quote}11143{quote}")
    content = (
        "api:\n  encryption:\n    key: top-secret\nsubstitutions:\n"
        + "\n".join(substitutions)
        + "\nlogger:\n  level: DEBUG\n"
    )
    return ESPHomeConfigSnapshot(
        "meter.yaml", content, sha256(content.encode()).hexdigest()
    )


def test_noop_is_byte_identical_and_surgical_edit_only_changes_requested_keys() -> None:
    """Existing source spans, quotes, and unrelated content are left untouched."""
    snapshot = _snapshot()
    noop = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(1, "CT 1", "sct_006_20a_25ma"),),
    )
    assert noop.changes == ()
    assert noop.proposed_content == snapshot.content

    plan = build_ct_mutation(
        snapshot,
        _topology(),
        (CTChangeRequest(2, "Kitchen: mains", "sct_013_030_30a_1v", 2),),
    )
    assert [change.key for change in plan.changes] == [
        "ct2_name",
        "current_cal_ct2",
    ]
    assert 'ct2_name: "Kitchen: mains"' in plan.proposed_content
    assert 'current_cal_ct2: "4325"' in plan.proposed_content
    assert "top-secret" in plan.proposed_content
    assert "top-secret" not in plan.redacted_diff
    assert "top-secret" not in repr(plan)
    assert plan.source_sha256 == snapshot.sha256


def test_missing_keys_insert_only_in_writable_substitutions_or_refuse_with_snippet() -> (
    None
):
    """Insertion stays in one local substitutions mapping and never guesses elsewhere."""
    plan = build_ct_mutation(
        _snapshot(missing="current_cal_ct3"),
        _topology(),
        (CTChangeRequest(3, "CT 3", "sct_006_20a_25ma"),),
    )
    assert '  current_cal_ct3: "11143"\nlogger:' in plan.proposed_content
    assert plan.changes[-1].old_value is None

    missing_name = build_ct_mutation(
        _snapshot(missing="ct3_name", quote="'"),
        _topology(),
        (CTChangeRequest(3, "O'Clock", "sct_006_20a_25ma"),),
    )
    assert "  ct3_name: 'O''Clock'\nlogger:" in missing_name.proposed_content
    missing_gain = build_ct_mutation(
        _snapshot(missing="current_cal_ct3", quote="'"),
        _topology(),
        (CTChangeRequest(3, "CT 3", "sct_006_20a_25ma"),),
    )
    assert "  current_cal_ct3: '11143'\nlogger:" in missing_gain.proposed_content

    snapshot = _snapshot()
    without_substitutions = replace(
        snapshot,
        content=snapshot.content.replace("substitutions:\n", ""),
    )
    without_substitutions = replace(
        without_substitutions,
        sha256=sha256(without_substitutions.content.encode()).hexdigest(),
    )
    with pytest.raises(ConfigMutationError, match="substitutions") as error:
        build_ct_mutation(
            without_substitutions,
            _topology(),
            (CTChangeRequest(1, "Changed", "sct_006_20a_25ma"),),
        )
    assert "ct1_name" in error.value.snippet


def test_rejects_provisional_unsafe_out_of_range_and_duplicate_requests() -> None:
    """Only authoritative local substitutions can enter a CT mutation."""
    snapshot = _snapshot()
    provisional = SimpleNamespace(
        configuration=snapshot.configuration,
        content=snapshot.content,
        sha256=snapshot.sha256,
        configuration_authoritative=False,
    )
    request = CTChangeRequest(1, "Changed", "sct_006_20a_25ma")
    with pytest.raises(ConfigMutationError, match="authoritative"):
        build_ct_mutation(provisional, _topology(), (request,))
    with pytest.raises(ConfigMutationError, match="outside topology"):
        build_ct_mutation(
            snapshot, _topology(), (CTChangeRequest(7, "CT 7", "sct_006_20a_25ma"),)
        )
    with pytest.raises(ConfigMutationError, match="duplicate"):
        build_ct_mutation(snapshot, _topology(), (request, request))

    unsafe = ESPHomeConfigSnapshot(
        "meter.yaml",
        "substitutions: !include secrets.yaml\n",
        sha256(b"substitutions: !include secrets.yaml\n").hexdigest(),
    )
    with pytest.raises(ValueError, match="substitutions"):
        build_ct_mutation(unsafe, _topology(), (request,))


def test_custom_needs_its_explicit_gain_label_and_acknowledgement() -> None:
    """The Custom path validates the same physical-installation acknowledgement."""
    with pytest.raises(ValueError, match="acknowledgement"):
        build_ct_mutation(
            _snapshot(),
            _topology(),
            (
                CTChangeRequest(
                    1, "CT 1", "custom", custom_gain_ct=100, custom_label="Odd load"
                ),
            ),
        )

    plan = build_ct_mutation(
        _snapshot(),
        _topology(),
        (
            CTChangeRequest(
                1,
                "CT 1",
                "custom",
                custom_gain_ct=100,
                custom_label="Odd load",
                burden_output_acknowledged=True,
            ),
        ),
    )
    assert [change.key for change in plan.changes] == ["current_cal_ct1"]
