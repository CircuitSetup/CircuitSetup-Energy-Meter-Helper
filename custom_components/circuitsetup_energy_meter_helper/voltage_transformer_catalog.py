"""Versioned CircuitSetup voltage-transformer preset catalog."""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from functools import cache
from importlib import resources
from typing import Any

CATALOG_SOURCE_REPOSITORY = "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter"
CATALOG_SOURCE_REF = "b94637a4f084a3a4a35e3e5f48eb1586bbd972c3"
CATALOG_SCHEMA_VERSION = 1


@dataclass(frozen=True, slots=True)
class VoltageTransformerPreset:
    """One voltage-transformer preset."""

    model_id: str
    label: str
    primary_nominal_v: float
    secondary_nominal_v: float
    default_gain_voltage: int
    notes: str


def _safe_text(value: object, field: str) -> str:
    if not isinstance(value, str) or not value or any(
        ord(character) < 0x20 or ord(character) == 0x7F for character in value
    ):
        raise ValueError(f"{field} must be safe text")
    return value


def _positive_voltage(value: object, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{field} must be finite and positive")  # noqa: TRY004
    result = float(value)
    if not math.isfinite(result) or result <= 0:
        raise ValueError(f"{field} must be finite and positive")
    return result


def _gain(value: object) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or not 1 <= value <= 65535:
        raise ValueError("gain must be an ATM90E32 uint16 value")
    return value


def custom(label: str, gain: object = None) -> VoltageTransformerPreset:
    """Construct the explicit, non-catalog custom option."""
    return VoltageTransformerPreset(
        "custom", _safe_text(label, "label"), 0.0, 0.0, _gain(gain), ""
    )


@dataclass(frozen=True, slots=True)
class VoltageTransformerCatalog:
    """The package-bundled schema-v1 catalog, indexed by model."""

    presets: tuple[VoltageTransformerPreset, ...]
    source_repository: str = CATALOG_SOURCE_REPOSITORY
    source_ref: str = CATALOG_SOURCE_REF
    schema_version: int = CATALOG_SCHEMA_VERSION

    @classmethod
    @cache
    def load(cls) -> VoltageTransformerCatalog:
        raw = (
            resources.files(__package__)
            .joinpath("data", "voltage_transformers.json")
            .read_text(encoding="utf-8")
        )
        data: dict[str, Any] = json.loads(raw)
        if data.get("schema_version") != CATALOG_SCHEMA_VERSION:
            raise ValueError("unsupported voltage-transformer catalog schema")
        if data.get("source_repository") != CATALOG_SOURCE_REPOSITORY or data.get(
            "source_ref"
        ) != CATALOG_SOURCE_REF:
            raise ValueError("invalid voltage-transformer catalog source metadata")
        presets = tuple(
            VoltageTransformerPreset(
                _safe_text(entry.get("model_id"), "model_id"),
                _safe_text(entry.get("label"), "label"),
                _positive_voltage(entry.get("primary_nominal_v"), "primary_nominal_v"),
                _positive_voltage(
                    entry.get("secondary_nominal_v"), "secondary_nominal_v"
                ),
                _gain(entry.get("default_gain_voltage")),
                _safe_text(entry.get("notes"), "notes"),
            )
            for entry in data.get("presets", ())
        )
        if len({preset.model_id for preset in presets}) != len(presets):
            raise ValueError("duplicate voltage-transformer model ID")
        return cls(presets)

    def by_model_id(self, model_id: str) -> VoltageTransformerPreset | None:
        return next((preset for preset in self.presets if preset.model_id == model_id), None)

    def starting_gain(self, model_id: str) -> int | None:
        preset = self.by_model_id(model_id)
        return preset.default_gain_voltage if preset else None
