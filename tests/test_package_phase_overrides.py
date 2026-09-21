"""Structural regressions for Helper-owned phase mappings."""

import pytest
import yaml

from custom_components.circuitsetup_energy_meter_helper.config_document import (
    MANAGED_BLOCK_MARKERS,
)
from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
    _legacy_phase_override_lines,
    _phase_override_lines,
    _read_phase_channel_states,
)
from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology


@pytest.mark.parametrize("multiplier", [1, 2, 4, 8])
@pytest.mark.parametrize("power_quality", [False, True])
def test_unused_current_and_power_each_have_one_internal_flag(
    multiplier: int, power_quality: bool
) -> None:
    rendered = "phase_a:\n" + "\n".join(
        _phase_override_lines(False, multiplier, power_quality)
    ) + "\n"
    root = yaml.compose(rendered)
    phase = root.value[0][1]
    metrics = {key.value: value for key, value in phase.value}
    for name in ("current", "power"):
        pairs = metrics[name].value
        keys = [key.value for key, _ in pairs]
        assert len(keys) == len(set(keys)), (name, keys)
        values = {key.value: value.value for key, value in pairs}
        assert values.get("internal") == "true", (name, values)


def test_enabled_pq_renders_supported_metrics_only_and_scales_var_va() -> None:
    rendered = _phase_override_lines(True, 4, True)
    text = "\n".join(rendered)
    assert "reactive_power:" in text and "apparent_power:" in text
    assert "multiply: 4" in text
    assert "power_factor" not in text
    assert all(
        metric not in text
        for metric in ("harmonic_power", "peak_current", "phase_angle")
    )


def test_enabled_unity_pq_is_a_no_op() -> None:
    assert _phase_override_lines(True, 1, True) == ()


@pytest.mark.parametrize("internal", [False, True])
def test_existing_unused_pq_block_remains_readable(internal: bool) -> None:
    topology = MeterTopology.from_addon_count(
        0, connection_type="wifi", voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter", evidence=(),
    )
    start, end = MANAGED_BLOCK_MARKERS["phase_overrides"]
    body = ["  - id: !extend meter_main1", "    phase_a: # CT1"]
    if internal:
        body.extend(("      current:", "        internal: true",
                     "      power:", "        internal: true"))
    # Literal ordering emitted by the previous released renderer.
    body.extend(f"      {metric}: !remove" for metric in (
        "reactive_power", "apparent_power", "harmonic_power",
        "peak_current", "power_factor", "phase_angle",
    ))
    content = "sensor:\n" + start + "\n" + "\n".join(body) + "\n" + end + "\n"
    states = _read_phase_channel_states(content, topology, {}, (True,))
    assert not states[1].enabled
    assert states[1].multiplier == 1


def test_legacy_pq_shape_is_read_and_next_render_drops_historical_fields() -> None:
    topology = MeterTopology.from_addon_count(
        0,
        connection_type="wifi",
        voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter",
        evidence=(),
    )
    start, end = MANAGED_BLOCK_MARKERS["phase_overrides"]
    legacy = "\n".join(
        (
            "  - id: !extend ${main_meter_id1}",
            "    phase_a: # CT1",
            *_legacy_phase_override_lines(1, True),
        )
    )
    content = f"sensor:\n{start}\n{legacy}\n{end}\n"
    states = _read_phase_channel_states(
        content,
        topology,
        {"main_meter_id1": "meter_main1"},
        (True,),
    )
    assert states[1].enabled
    assert _phase_override_lines(True, 1, True) == ()
