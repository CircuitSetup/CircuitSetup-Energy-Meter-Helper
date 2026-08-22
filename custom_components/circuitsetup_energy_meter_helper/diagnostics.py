"""Allowlisted diagnostics shared by Home Assistant and the guided panel."""

from __future__ import annotations

import json
from collections.abc import Mapping
from os.path import basename
from pathlib import Path
from types import MappingProxyType
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_MANIFEST = json.loads(Path(__file__).with_name("manifest.json").read_text("utf-8"))


def _text(value: object, fallback: str | None = None) -> str | None:
    return value if isinstance(value, str) and value else fallback


def _frozen(value: Any) -> Any:
    if isinstance(value, Mapping):
        return MappingProxyType({str(key): _frozen(item) for key, item in value.items()})
    if isinstance(value, tuple | list):
        return tuple(_frozen(item) for item in value)
    return value


def _public(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {key: _public(item) for key, item in value.items()}
    if isinstance(value, tuple | list):
        return [_public(item) for item in value]
    return value


def build_diagnostics_snapshot(
    *, entry: object, runtime: Mapping[str, Any], integration_version: str,
    home_assistant_version: str = "unknown",
) -> Mapping[str, Any]:
    """Build the single public support shape without traversing runtime handles."""
    provisioning = runtime.get("provisioning")
    status = getattr(provisioning, "snapshot", None)
    meters = []
    for device in getattr(status, "devices", ()):
        mac = _text(getattr(device, "mac", None), "") or ""
        meters.append(
            {
                "mac_suffix": mac[-4:] if len(mac) >= 4 else "unknown",
                "project_name": _text(getattr(device, "project_name", None), "unknown"),
                "project_version": _text(getattr(device, "project_version", None)),
                "configuration": basename(_text(getattr(device, "configuration", None), "") or "") or None,
            }
        )
    return _public(_frozen(
        {
            "integration_version": integration_version,
            "home_assistant_version": home_assistant_version,
            "config_entry_version": int(getattr(entry, "version", 1)),
            "setup_state": _text(getattr(status, "state", None), "unknown"),
            "meter_count": len(meters),
            "meters": tuple(meters),
            "topology": None,
            "entity_role_counts": {},
            "ct_presets": [],
            "last_transaction": None,
            "last_session": None,
            "error_codes": [],
        }
    ))


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, config_entry: ConfigEntry
) -> Mapping[str, Any]:
    """Return exactly the same immutable snapshot used by the websocket seam."""
    runtime = hass.data.get(DOMAIN, {}).get(config_entry.entry_id, {})
    return build_diagnostics_snapshot(
        entry=config_entry,
        runtime=runtime if isinstance(runtime, Mapping) else {},
        integration_version=_text(_MANIFEST.get("version"), "unknown") or "unknown",
        home_assistant_version=_text(getattr(hass.config, "version", None), "unknown") or "unknown",
    )
