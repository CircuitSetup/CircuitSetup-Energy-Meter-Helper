"""Panel registration and immutable bundle cache contract."""

from __future__ import annotations

import asyncio
from hashlib import sha256
from pathlib import Path
from threading import get_ident
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
    content = b"export const panel = true;"
    bundle.write_bytes(content)
    event_loop_thread = get_ident()
    read_threads: list[int] = []
    read_bytes = Path.read_bytes

    def tracked_read_bytes(path: Path) -> bytes:
        read_threads.append(get_ident())
        return read_bytes(path)

    hass = Mock()
    hass.http.async_register_static_paths = AsyncMock()

    async def run_in_executor(target: object, *args: object) -> object:
        return await asyncio.to_thread(target, *args)  # type: ignore[arg-type]

    hass.async_add_executor_job = run_in_executor
    register = AsyncMock()
    monkeypatch.setattr(Path, "read_bytes", tracked_read_bytes)
    monkeypatch.setattr(
        "custom_components.circuitsetup_energy_meter_helper.panel.panel_custom.async_register_panel",
        register,
    )

    asyncio.run(async_register_panel(hass, "entry-1", bundle_path=bundle))

    assert len(read_threads) == 1
    assert read_threads[0] != event_loop_thread
    expected_hash = sha256(content).hexdigest()[:16]
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
