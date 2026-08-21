"""Tests for persisted helper state."""

import pytest

from custom_components.circuitsetup_energy_meter_helper.models import StoredCTSelection
from custom_components.circuitsetup_energy_meter_helper.store import (
    STORAGE_VERSION,
    migrate_storage,
)


def test_stored_ct_selection_has_only_safe_metadata() -> None:
    """Selections retain calibration metadata without secrets or YAML."""
    selection = StoredCTSelection(
        channel=1,
        model_id="split-core-100a",
        display_label="Main feed",
        raw_gain_ct=27518,
        reporting_multiplier=1.0,
        config_sha256="a" * 64,
    )

    assert selection.config_sha256 == "a" * 64


def test_migrate_storage_rejects_unknown_newer_version() -> None:
    """Future data is never silently treated as the current schema."""
    with pytest.raises(ValueError, match="newer"):
        migrate_storage(STORAGE_VERSION + 1, {})
