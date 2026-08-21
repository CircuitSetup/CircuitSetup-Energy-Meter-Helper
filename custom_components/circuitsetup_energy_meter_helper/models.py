"""Typed, safe persistence models for the helper."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=True, frozen=True)
class StoredCTSelection:
    """One CT selection, bound to the configuration that supplied its gain."""

    channel: int
    model_id: str | None
    display_label: str | None
    raw_gain_ct: int
    reporting_multiplier: float
    config_sha256: str


@dataclass(slots=True, frozen=True)
class StoredMeterRecord:
    """Safe metadata for one meter, keyed by its MAC address."""

    mac: str
    setup_intent: str
    config_filename: str | None
    topology: dict[str, Any] | None
    ct_selections: tuple[StoredCTSelection, ...] = ()
    interrupted_session: dict[str, Any] | None = None
