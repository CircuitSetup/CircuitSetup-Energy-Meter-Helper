"""Tests for the bundled voltage-transformer preset catalog."""

from __future__ import annotations

import json
from dataclasses import FrozenInstanceError
from enum import IntEnum

import pytest

from custom_components.circuitsetup_energy_meter_helper import (
    voltage_transformer_catalog as module,
)
from custom_components.circuitsetup_energy_meter_helper.voltage_transformer_catalog import (
    CATALOG_SCHEMA_VERSION,
    CATALOG_SOURCE_REF,
    CATALOG_SOURCE_REPOSITORY,
    VoltageTransformerCatalog,
    VoltageTransformerPreset,
    custom,
)


def test_official_catalog_has_schema_metadata_and_starting_gain() -> None:
    catalog = VoltageTransformerCatalog.load()
    preset = catalog.by_model_id("jameco_reliapro_9vac_120v")

    assert CATALOG_SCHEMA_VERSION == 1
    assert CATALOG_SOURCE_REPOSITORY == "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter"
    assert CATALOG_SOURCE_REF == "b94637a4f084a3a4a35e3e5f48eb1586bbd972c3"
    assert preset == VoltageTransformerPreset(
        "jameco_reliapro_9vac_120v",
        "Jameco Reliapro 120 V to 9 VAC",
        120.0,
        9.0,
        7305,
        "Official CircuitSetup starting value; calibrate for best accuracy.",
    )
    assert catalog.starting_gain("jameco_reliapro_9vac_120v") == 7305
    assert catalog.by_model_id("unknown") is None


def test_preset_is_immutable() -> None:
    preset = VoltageTransformerCatalog.load().by_model_id("jameco_reliapro_9vac_120v")
    assert preset is not None
    with pytest.raises(FrozenInstanceError):
        preset.model_id = "changed"  # type: ignore[misc]


def _load_data(monkeypatch: pytest.MonkeyPatch, data: object) -> None:
    class Resource:
        def joinpath(self, *_parts: str) -> Resource:
            return self

        def read_text(self, *, encoding: str) -> str:
            assert encoding == "utf-8"
            return json.dumps(data)

    monkeypatch.setattr(module.resources, "files", lambda _package: Resource())
    VoltageTransformerCatalog.load.cache_clear()


def _valid_data() -> dict[str, object]:
    return {
        "schema_version": 1,
        "source_repository": CATALOG_SOURCE_REPOSITORY,
        "source_ref": CATALOG_SOURCE_REF,
        "presets": [
            {
                "model_id": "valid",
                "label": "Valid",
                "primary_nominal_v": 120.0,
                "secondary_nominal_v": 9.0,
                "default_gain_voltage": 7305,
                "notes": "Safe note.",
            }
        ],
    }


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("primary_nominal_v", 0),
        ("secondary_nominal_v", float("nan")),
        ("default_gain_voltage", 0),
        ("default_gain_voltage", 65536),
        ("default_gain_voltage", True),
        ("model_id", "bad\nvalue"),
        ("label", "bad\x00value"),
        ("notes", "bad\rvalue"),
    ],
)
def test_catalog_rejects_invalid_preset_fields(
    monkeypatch: pytest.MonkeyPatch, field: str, value: object
) -> None:
    data = _valid_data()
    preset = dict(data["presets"][0])  # type: ignore[index]
    preset[field] = value
    data["presets"] = [preset]
    _load_data(monkeypatch, data)

    with pytest.raises(ValueError):
        VoltageTransformerCatalog.load()


def test_catalog_rejects_schema_and_duplicate_ids(monkeypatch: pytest.MonkeyPatch) -> None:
    data = _valid_data()
    data["schema_version"] = 2
    _load_data(monkeypatch, data)
    with pytest.raises(ValueError, match="schema"):
        VoltageTransformerCatalog.load()

    data = _valid_data()
    data["presets"] = [data["presets"][0], data["presets"][0]]  # type: ignore[index]
    _load_data(monkeypatch, data)
    with pytest.raises(ValueError, match="duplicate"):
        VoltageTransformerCatalog.load()


@pytest.mark.parametrize(
    "data",
    [
        [],
        {"schema_version": 1, "presets": None},
        {"schema_version": 1, "presets": {}},
        {"schema_version": 1, "presets": []},
        {"schema_version": 1, "presets": [None]},
    ],
)
def test_catalog_rejects_malformed_top_level_and_rows(
    monkeypatch: pytest.MonkeyPatch, data: object
) -> None:
    _load_data(monkeypatch, data)
    with pytest.raises(ValueError):
        VoltageTransformerCatalog.load()


@pytest.mark.parametrize("schema_version", [True, 1.0, "1"])
def test_catalog_requires_exact_schema_integer(
    monkeypatch: pytest.MonkeyPatch, schema_version: object
) -> None:
    data = _valid_data()
    data["schema_version"] = schema_version
    _load_data(monkeypatch, data)
    with pytest.raises(ValueError, match="schema"):
        VoltageTransformerCatalog.load()


class GainIntEnum(IntEnum):
    VALID = 7305


def test_catalog_rejects_int_subclass_gain_and_control_categories(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    with pytest.raises(ValueError, match="gain"):
        module._gain(GainIntEnum.VALID)

    for field, value in (
        ("model_id", "  "),
        ("label", "\u0085"),
        ("notes", "note\u0085"),
    ):
        data = _valid_data()
        preset = dict(data["presets"][0])  # type: ignore[index]
        preset[field] = value
        data["presets"] = [preset]
        _load_data(monkeypatch, data)
        with pytest.raises(ValueError):
            VoltageTransformerCatalog.load()


def test_catalog_rejects_source_metadata_mutations(monkeypatch: pytest.MonkeyPatch) -> None:
    for field in ("source_repository", "source_ref"):
        data = _valid_data()
        data[field] = "unexpected"
        _load_data(monkeypatch, data)
        with pytest.raises(ValueError, match="source"):
            VoltageTransformerCatalog.load()


@pytest.mark.parametrize(
    "mutation",
    [
        lambda data: data.update(extra=True),
        lambda data: data.pop("source_ref"),
    ],
)
def test_catalog_rejects_top_level_key_drift(
    monkeypatch: pytest.MonkeyPatch, mutation: object
) -> None:
    data = _valid_data()
    mutation(data)  # type: ignore[operator]
    _load_data(monkeypatch, data)
    with pytest.raises(ValueError, match="keys"):
        VoltageTransformerCatalog.load()


@pytest.mark.parametrize(
    "mutation",
    [
        lambda preset: preset.update(extra=True),
        lambda preset: preset.pop("notes"),
    ],
)
def test_catalog_rejects_preset_key_drift(
    monkeypatch: pytest.MonkeyPatch, mutation: object
) -> None:
    data = _valid_data()
    preset = dict(data["presets"][0])  # type: ignore[index]
    mutation(preset)  # type: ignore[operator]
    data["presets"] = [preset]
    _load_data(monkeypatch, data)
    with pytest.raises(ValueError, match="keys"):
        VoltageTransformerCatalog.load()


def test_custom_requires_explicit_valid_gain() -> None:
    assert custom("Custom transformer", 123).default_gain_voltage == 123
    for gain in (None, 0, 65536, True, 1.5, GainIntEnum.VALID):
        with pytest.raises(ValueError, match="gain"):
            custom("Custom transformer", gain)
    with pytest.raises(ValueError, match="label"):
        custom("", 123)
    with pytest.raises(ValueError, match="label"):
        custom("  ", 123)
    with pytest.raises(ValueError, match="label"):
        custom("\u0085", 123)
    with pytest.raises(ValueError, match="gain"):
        custom("Custom transformer")
