"""Tests for the bundled, versioned CT preset catalog."""

import subprocess
import tarfile
from importlib import resources
from io import BytesIO
from pathlib import Path

import pytest

from custom_components.circuitsetup_energy_meter_helper.ct_catalog import (
    CATALOG_SCHEMA_VERSION,
    CATALOG_SOURCE_REF,
    CATALOG_SOURCE_REPOSITORY,
    CTPreset,
    CTPresetCatalog,
    custom_preset,
    raw_gain_for_preset,
)


def test_bundled_catalog_matches_the_official_schema_v1_rows() -> None:
    """Every official preset is loaded from the package data, unchanged."""
    catalog = CTPresetCatalog.load()

    assert CATALOG_SOURCE_REPOSITORY == (
        "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter"
    )
    assert CATALOG_SOURCE_REF == "1e5e15368bb829aa2aac271a59e57d900eaa5025"
    assert CATALOG_SCHEMA_VERSION == 1
    assert [
        (preset.model_id, preset.default_gain_ct, preset.requires_burden_jumper_cut)
        for preset in catalog.presets
    ] == [
        ("sct_006_20a_25ma", 11143, False),
        ("sct_013_030_30a_1v", 8650, True),
        ("sct_013_050_50a_1v", 15420, True),
        ("sct_010_50a_16_6ma", 41334, False),
        ("sct_010_80a_26_6ma", 41660, False),
        ("sct_013_000_100a_50ma", 27518, False),
        ("sct_016_120a_40ma", 41787, False),
        ("sct_024_200a_100ma", 27518, False),
        ("sct_024_200a_50ma", 55036, False),
    ]
    catalog_path = resources.files(
        "custom_components.circuitsetup_energy_meter_helper"
    ).joinpath("data", "ct_presets.json")
    assert catalog_path.is_file()

    archive = subprocess.run(
        [
            "git",
            "-C",
            str(Path(__file__).parents[1]),
            "archive",
            "--format=tar",
            "HEAD",
        ],
        check=True,
        capture_output=True,
    ).stdout
    with tarfile.open(fileobj=BytesIO(archive)) as release:
        assert (
            "custom_components/circuitsetup_energy_meter_helper/data/ct_presets.json"
            in release.getnames()
        )


def test_gain_math_is_half_up_and_only_unique_physical_gains_infer() -> None:
    """The raw YAML gain respects its multiplier and ambiguous gains stay unknown."""
    catalog = CTPresetCatalog.load()
    odd = CTPreset("test", "Test", 1, "1mA", 3, False, "")

    assert raw_gain_for_preset(odd, 2) == 2
    assert catalog.infer_model(11143, 1) == "sct_006_20a_25ma"
    assert catalog.infer_model(27518, 1) is None
    assert catalog.infer_model(1, 1) is None


def test_custom_requires_a_bounded_gain_label_and_explicit_acknowledgement() -> None:
    """Custom choices cannot bypass the physical-installation acknowledgement."""
    with pytest.raises(ValueError, match="acknowledgement"):
        custom_preset("Custom load", 100, burden_output_acknowledged=False)
    with pytest.raises(ValueError, match="label"):
        custom_preset("", 100, burden_output_acknowledged=True)
    with pytest.raises(ValueError, match="uint16"):
        custom_preset("Custom load", 65536, burden_output_acknowledged=True)

    preset = custom_preset("Custom load", 100, burden_output_acknowledged=True)
    assert preset.model_id == "custom"
    assert preset.default_gain_ct is None
