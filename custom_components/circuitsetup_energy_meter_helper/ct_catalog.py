"""Versioned CircuitSetup CT preset catalog."""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from functools import cache
from importlib import resources
from typing import Any

CATALOG_SOURCE_REPOSITORY = "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter"
CATALOG_SOURCE_REF = "1e5e15368bb829aa2aac271a59e57d900eaa5025"
CATALOG_SCHEMA_VERSION = 1


@dataclass(frozen=True, slots=True)
class CTPreset:
    """One official physical current-transformer preset."""

    model_id: str
    label: str
    rated_current_a: float
    secondary: str
    default_gain_ct: int | None
    requires_burden_jumper_cut: bool
    notes: str


def _require_gain(gain: object) -> int:
    if not isinstance(gain, int) or isinstance(gain, bool) or not 1 <= gain <= 65535:
        raise ValueError("gain must be an ATM90E32 uint16 value")
    return gain


def raw_gain_for_preset(preset: CTPreset, multiplier: float) -> int:
    """Convert a physical default gain to its raw ESPHome value."""
    if preset.default_gain_ct is None:
        raise ValueError("custom preset requires an explicit gain")
    if not math.isfinite(multiplier) or multiplier <= 0:
        raise ValueError("multiplier must be finite and positive")
    result = int(
        (Decimal(preset.default_gain_ct) / Decimal(str(multiplier))).quantize(
            Decimal(1), rounding=ROUND_HALF_UP
        )
    )
    return _require_gain(result)


def round_half_up(value: float) -> int:
    """Round a gain calculation without banker's-rounding surprises."""
    if not math.isfinite(value):
        raise ValueError("gain must be finite")
    return int(Decimal(str(value)).quantize(Decimal(1), rounding=ROUND_HALF_UP))


def custom_preset(
    label: str, gain: int, *, burden_output_acknowledged: bool
) -> CTPreset:
    """Construct the explicit, non-catalog Custom option."""
    if not label or not label.strip() or "\n" in label or "\r" in label:
        raise ValueError("custom label must be a non-empty single line")
    if not burden_output_acknowledged:
        raise ValueError("custom burden/output acknowledgement is required")
    _require_gain(gain)
    return CTPreset("custom", label, 0, "custom", None, False, "")


@dataclass(frozen=True, slots=True)
class CTPresetCatalog:
    """The package-bundled schema-v1 catalog, indexed by model and gain."""

    presets: tuple[CTPreset, ...]
    source_repository: str = CATALOG_SOURCE_REPOSITORY
    source_ref: str = CATALOG_SOURCE_REF
    schema_version: int = CATALOG_SCHEMA_VERSION

    @classmethod
    @cache
    def load(cls) -> CTPresetCatalog:
        """Load packaged data, independent of Home Assistant's working directory."""
        raw = (
            resources.files(__package__)
            .joinpath("data", "ct_presets.json")
            .read_text(encoding="utf-8")
        )
        data: dict[str, Any] = json.loads(raw)
        if data.get("schema_version") != CATALOG_SCHEMA_VERSION:
            raise ValueError("unsupported CT preset catalog schema")
        presets = tuple(CTPreset(**entry) for entry in data.get("presets", ()))
        if len(presets) != 9 or len({preset.model_id for preset in presets}) != len(
            presets
        ):
            raise ValueError("invalid CT preset catalog")
        for preset in presets:
            if preset.default_gain_ct is None:
                raise ValueError("official CT presets require a default gain")
            _require_gain(preset.default_gain_ct)
        return cls(presets)

    def by_model_id(self, model_id: str) -> CTPreset | None:
        """Return the one documented model with this ID, if present."""
        return next(
            (preset for preset in self.presets if preset.model_id == model_id), None
        )

    def by_default_gain(self, gain: int) -> tuple[CTPreset, ...]:
        """Return all documented physical presets with this gain."""
        return tuple(
            preset for preset in self.presets if preset.default_gain_ct == gain
        )

    def infer_model(self, raw_gain: int, multiplier: float) -> str | None:
        """Infer only unambiguous physical gains from the live configuration."""
        _require_gain(raw_gain)
        if not math.isfinite(multiplier) or multiplier <= 0:
            raise ValueError("multiplier must be finite and positive")
        matches = self.by_default_gain(round_half_up(raw_gain * multiplier))
        return matches[0].model_id if len(matches) == 1 else None
