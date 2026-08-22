"""Panel registration and immutable bundle cache contract."""

from __future__ import annotations

import asyncio
from hashlib import sha256
from pathlib import Path
from unittest.mock import AsyncMock, Mock

import pytest

from custom_components.circuitsetup_energy_meter_helper.const import PANEL_URL_PATH
from custom_components.circuitsetup_energy_meter_helper.panel import (
    PANEL_ELEMENT,
    async_register_panel,
    async_unregister_panel,
)


def test_panel_registers_admin_product_with_content_hash(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    bundle = tmp_path / "circuitsetup-energy-meter-helper-panel.js"
    bundle.write_bytes(b"export const panel = true;")
    hass = Mock()
    hass.http.async_register_static_paths = AsyncMock()
    register = AsyncMock()
    monkeypatch.setattr(
        "custom_components.circuitsetup_energy_meter_helper.panel.panel_custom.async_register_panel",
        register,
    )

    asyncio.run(async_register_panel(hass, "entry-1", bundle_path=bundle))

    expected_hash = sha256(bundle.read_bytes()).hexdigest()[:16]
    config = register.call_args.kwargs
    assert config["frontend_url_path"] == PANEL_URL_PATH
    assert config["webcomponent_name"] == PANEL_ELEMENT
    assert config["sidebar_title"] == "CircuitSetup Energy Meter Helper"
    assert config["require_admin"] is True
    assert config["module_url"].endswith(
        f"/circuitsetup-energy-meter-helper-panel.js?v={expected_hash}"
    )
    assert config["config"] == {"entry_id": "entry-1"}


def test_panel_unregisters_exact_path(monkeypatch: pytest.MonkeyPatch) -> None:
    remove = Mock()
    monkeypatch.setattr(
        "custom_components.circuitsetup_energy_meter_helper.panel.frontend.async_remove_panel",
        remove,
    )
    hass = Mock()

    async_unregister_panel(hass)

    remove.assert_called_once_with(hass, PANEL_URL_PATH)
