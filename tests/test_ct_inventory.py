"""Tests for topology-bounded CT channel inventory."""

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.ct_catalog import (
    CTPresetCatalog,
)
from custom_components.circuitsetup_energy_meter_helper.ct_inventory import (
    CTInventory,
    _esphome_object_id,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    MeterTopology,
    StoredCTSelection,
)


def _topology() -> MeterTopology:
    return MeterTopology.from_addon_count(
        0,
        connection_type="wifi",
        voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter",
        evidence=(),
    )


def _document(
    *,
    first_name: str = "Kitchen",
    second_name: str = "CT 2",
    missing: str | None = None,
) -> ESPHomeConfigDocument:
    substitutions = []
    for channel in range(1, 7):
        if missing != f"ct{channel}_name":
            substitutions.append(
                f"  ct{channel}_name: {first_name if channel == 1 else second_name if channel == 2 else f'CT {channel}'}"
            )
        if missing != f"current_cal_ct{channel}":
            substitutions.append(f"  current_cal_ct{channel}: 11143")
    return ESPHomeConfigDocument.parse(
        "substitutions:\n" + "\n".join(substitutions) + "\n"
    )


def test_inventory_requires_every_active_name_and_gain_and_verifies_storage() -> None:
    """Config hash, raw gain, and multiplier must all match before restoring a model."""
    stored = StoredCTSelection(
        channel=1,
        model_id="sct_006_20a_25ma",
        display_label="Kitchen mains",
        raw_gain_ct=11143,
        reporting_multiplier=1,
        config_sha256="a" * 64,
    )
    inventory = CTInventory.from_document(
        _document(), _topology(), CTPresetCatalog.load(), "a" * 64, (stored,)
    )

    first = inventory.channels[0]
    assert first.address.board_index == 0 and first.address.group_index == 0
    assert first.selected_model_id == "sct_006_20a_25ma"
    assert first.selection_verified_against_config
    assert first.display_label == "Kitchen mains"
    assert len(inventory.channels) == 6

    diverged = CTInventory.from_document(
        _document(), _topology(), CTPresetCatalog.load(), "b" * 64, (stored,)
    ).channels[0]
    assert diverged.selected_model_id is None
    assert not diverged.selection_verified_against_config
    assert diverged.display_label == "Kitchen mains"

    with pytest.raises(ValueError, match="missing active substitution"):
        CTInventory.from_document(
            _document(missing="current_cal_ct6"),
            _topology(),
            CTPresetCatalog.load(),
            "a" * 64,
        )
    with pytest.raises(ValueError, match="outside topology"):
        CTInventory.from_document(
            ESPHomeConfigDocument.parse(_document().content + "  ct7_name: Extra\n"),
            _topology(),
            CTPresetCatalog.load(),
            "a" * 64,
        )


def test_inventory_rejects_esphome_object_id_collisions_and_warns_for_unscaled_range() -> (
    None
):
    """Names only normalize for collision checks and high-range presets only warn."""
    with pytest.raises(ValueError, match="object-ID collision"):
        CTInventory.from_document(
            _document(first_name="Main!feed", second_name="Main?feed"),
            _topology(),
            CTPresetCatalog.load(),
            "a" * 64,
        )
    with pytest.raises(ValueError, match="object-ID collision"):
        CTInventory.from_document(
            _document(first_name="Mø", second_name="MØ"),
            _topology(),
            CTPresetCatalog.load(),
            "a" * 64,
        )

    inventory = CTInventory.from_document(
        _document(), _topology(), CTPresetCatalog.load(), "a" * 64
    )
    warnings = inventory.warnings_for("sct_024_200a_50ma", 1)
    assert len(warnings) == 1 and "65.535" in warnings[0]


@pytest.mark.parametrize(
    ("name", "expected"),
    (
        ("Kitchen Meter", "kitchen_meter"),
        ("Main-Meter!", "main-meter_"),
        ("Mø", "m_"),
        ("Meter 😀", "meter__"),
        ("MÆ! 2", "m___2"),
        ("  CT  1  ", "__ct__1__"),
    ),
)
def test_object_id_matches_esphome_native_codepoint_sanitizer(
    name: str, expected: str
) -> None:
    """Use the native entity-name sanitizer, one replacement per codepoint."""
    assert _esphome_object_id(name) == expected
