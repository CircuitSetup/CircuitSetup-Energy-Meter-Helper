"""Pinned firmware total hierarchy contract."""

import importlib.util
import os
import shutil
from pathlib import Path

import pytest
from test_firmware_contract import _contract_fixture

ROOT = Path(__file__).parents[1]
SCRIPT = ROOT / "scripts/verify_firmware_contract.py"

spec = importlib.util.spec_from_file_location("firmware_contract", SCRIPT)
assert spec is not None and spec.loader is not None
firmware_contract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(firmware_contract)


def _firmware_root(tmp_path: Path) -> Path:
    configured = os.environ.get("FIRMWARE_ROOT")
    if configured:
        return Path(configured)
    _helper_root, firmware_root = _contract_fixture(tmp_path)
    return firmware_root


def _firmware_copy(tmp_path: Path, firmware_root: Path) -> Path:
    copied = tmp_path / "firmware"
    shutil.copytree(firmware_root / "Software", copied / "Software")
    return copied


def test_uses_synthetic_firmware_when_no_pinned_path_is_configured(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Unit CI must exercise the contract without a gitignored firmware tree."""
    monkeypatch.delenv("FIRMWARE_ROOT", raising=False)

    firmware_root = _firmware_root(tmp_path)

    assert (firmware_root / "Software/ESPHome/6chan_energy_meter_1-addon.yaml").is_file()


def test_main_board_native_totals(tmp_path: Path) -> None:
    """Removing a native board total or changing its CTs breaks discovery."""
    contract = firmware_contract.inspect_firmware_totals(_firmware_root(tmp_path))

    main = contract.boards[0]
    assert main.power_id == "totalWattsMain"
    assert main.current_id == "totalAmpsMain"
    assert main.power_channels == (1, 2, 3, 4, 5, 6)
    assert main.current_channels == (1, 2, 3, 4, 5, 6)


def test_one_addon_root_uses_board_totals(tmp_path: Path) -> None:
    """A root total must aggregate the two board totals, not raw CTs."""
    firmware_root = _firmware_root(tmp_path)
    contract = firmware_contract.inspect_top_level_totals(
        firmware_root / "Software/ESPHome/6chan_energy_meter_1-addon.yaml"
    )

    assert contract.root_power_sources == ("totalWattsMain", "totalWattsAddOn1")
    assert contract.root_current_sources == ("totalAmpsMain", "totalAmpsAddOn1")
    assert contract.energy_power_id == "totalWatts"


@pytest.mark.parametrize(
    ("path", "old", "new", "inspector"),
    (
        (
            "Software/ESPHome/meter_sensors/6chan_main_sensor.yaml",
            "    id: totalWattsMain\n",
            "    id: missingTotalWattsMain\n",
            "boards",
        ),
        (
            "Software/ESPHome/6chan_energy_meter_1-addon.yaml",
            "lambda: return id(totalWattsMain).state + id(totalWattsAddOn1).state ;",
            "lambda: return id(ct1Watts).state + id(ct7Watts).state ;",
            "root",
        ),
        (
            "Software/ESPHome/6chan_energy_meter_1-addon.yaml",
            "power_id: totalWatts\n",
            "power_id: totalWattsMain\n",
            "root",
        ),
        (
            "Software/ESPHome/6chan_energy_meter_1-addon.yaml",
            "lambda: return id(totalWattsMain).state + id(totalWattsAddOn1).state ;",
            "lambda: return id(totalWattsMain).state ;",
            "root",
        ),
    ),
    ids=("missing-board-total", "raw-ct-root", "wrong-energy-power", "missing-addon-source"),
)
def test_rejects_total_hierarchy_contract_drift(
    tmp_path: Path, path: str, old: str, new: str, inspector: str
) -> None:
    """Contract drift cannot be mistaken for a supported meter topology."""
    firmware_root = _firmware_copy(tmp_path, _firmware_root(tmp_path / "source"))
    target = firmware_root / path
    target.write_text(target.read_text(encoding="utf-8").replace(old, new, 1), encoding="utf-8")

    with pytest.raises(SystemExit):
        if inspector == "boards":
            firmware_contract.inspect_firmware_totals(firmware_root)
        else:
            firmware_contract.inspect_top_level_totals(target)
