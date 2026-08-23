"""Cross-repository release contract checks."""

import json
import re
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).parents[1]
SCRIPT = ROOT / "scripts" / "verify_firmware_contract.py"
REPRESENTATIVES = (
    "main_board",
    "1-addon",
    "2-addons",
    "3-addons",
    "4-addons",
    "5-addons",
    "6-addons",
    "6-addons_ethernet",
    "6-addons_ethernet_waveshare",
    "3-addons_2-voltages",
)


def _calibration_package(prefix: str, first_channel: int) -> str:
    id_prefix = "main_meter" if prefix == "main" else prefix
    groups = []
    for group in (1, 2):
        channels = range(first_channel + (group - 1) * 3, first_channel + group * 3)
        groups.append(
            f"""  - platform: atm90e32
    id: ${{{id_prefix}_id{group}}}
    run_offset_calibration:
      name: "1. Run ${{{id_prefix}_name{group}}} Offset Cal"
      disabled_by_default: true
    clear_offset_calibration:
      name: "z1. Clear ${{{id_prefix}_name{group}}} Offset Cal"
      disabled_by_default: true
    run_power_offset_calibration:
      name: "2. Run ${{{id_prefix}_name{group}}} Power Offset Cal"
      disabled_by_default: true
    clear_power_offset_calibration:
      name: "z2. Clear ${{{id_prefix}_name{group}}} Power Offset Cal"
      disabled_by_default: true
    run_gain_calibration:
      name: "3. Run ${{{id_prefix}_name{group}}} Gain Cal"
      disabled_by_default: true
    clear_gain_calibration:
      name: "z3. Clear ${{{id_prefix}_name{group}}} Gain Cal"
      disabled_by_default: true
"""
        )
        current = "".join(
            f"""      phase_{phase}:
        name: ${{ct{channel}_name}} Ref Current
        min_value: 0.0
        max_value: 200.0
        step: 0.1
        disabled_by_default: true
"""
            for phase, channel in zip("abc", channels, strict=True)
        )
        groups.append(
            f"""  - platform: atm90e32
    id: ${{{id_prefix}_id{group}}}
    reference_voltage:
      phase_a:
        name: Ref V {group}
        min_value: 0.0
        max_value: 260.0
        step: 0.1
        disabled_by_default: true
    reference_current:
{current}"""
        )
    return "button:\n" + "".join(groups[::2]) + "number:\n" + "".join(groups[1::2])


def _contract_fixture(
    tmp_path: Path, *, api_ready: bool = True
) -> tuple[Path, Path]:
    helper_root = tmp_path / "helper"
    firmware_root = tmp_path / "firmware"
    helper_data = (
        helper_root / "custom_components/circuitsetup_energy_meter_helper/data"
    )
    firmware_data = firmware_root / "Software/ESPHome"
    helper_data.mkdir(parents=True)
    firmware_data.mkdir(parents=True)
    catalog = json.dumps({"schema_version": 1, "presets": []})
    (helper_data / "ct_presets.json").write_text(catalog, encoding="utf-8")
    (firmware_data / "ct_presets.json").write_text(catalog, encoding="utf-8")

    calibration = firmware_data / "calibration"
    sensors = firmware_data / "meter_sensors"
    tests = firmware_data / "tests"
    if api_ready:
        calibration.mkdir()
        sensors.mkdir()
        tests.mkdir()
        for board in range(7):
            prefix = "main" if board == 0 else f"addon{board}"
            (calibration / f"6chan_{prefix}_calibration.yaml").write_text(
                _calibration_package(prefix, board * 6 + 1), encoding="utf-8"
            )
            sensor = "main_sensor" if board == 0 else prefix
            (sensors / f"6chan_{sensor}.yaml").write_text("sensor: []\n", encoding="utf-8")

    variants = ["main_board", "main_ethernet", "main_ethernet_waveshare"]
    variants += [
        f"{count}-addon{'s' if count > 1 else ''}{suffix}"
        for count in range(1, 7)
        for suffix in ("", "_ethernet", "_ethernet_waveshare")
    ]
    variants.append("3-addons_2-voltages")
    for variant in variants:
        project_suffix = variant.replace("_", "-")
        if project_suffix == "main-board":
            project_suffix = ""
        elif project_suffix.startswith("main-"):
            project_suffix = project_suffix.removeprefix("main-")
        project = "circuitsetup.6c-energy-meter"
        if project_suffix:
            project += f"-{project_suffix}"
        source = f'esphome:\n  project:\n    name: {project}\n    version: "1.8"\n'
        if api_ready:
            match = re.search(r"(\d+)-addons?", variant)
            addon_count = int(match.group(1)) if match else 0
            channel_count = 6 * (addon_count + 1)
            source += "substitutions:\n" + "".join(
                f"  ct{channel}_name: CT{channel}\n"
                f"  current_cal_ct{channel}: '27518'\n"
                for channel in range(1, channel_count + 1)
            )
            source += "packages:\n  meter_sensors:\n"
            source += "    - Software/ESPHome/meter_sensors/6chan_main_sensor.yaml\n"
            source += "".join(
                f"    - Software/ESPHome/meter_sensors/6chan_addon{board}.yaml\n"
                for board in range(1, addon_count + 1)
            )
            source += "  calibration:\n"
            source += "    - Software/ESPHome/calibration/6chan_main_calibration.yaml\n"
            source += "".join(
                f"    - Software/ESPHome/calibration/6chan_addon{board}_calibration.yaml\n"
                for board in range(1, addon_count + 1)
            )
        (firmware_data / f"6chan_energy_meter_{variant}.yaml").write_text(source, encoding="utf-8")
    if api_ready:
        matrix = [f"Software/ESPHome/6chan_energy_meter_{variant}.yaml" for variant in REPRESENTATIVES]
        (tests / "compile_matrix.py").write_text(
            "import json\nprint(json.dumps({'configurations': " + repr(sorted(matrix)) + "}))\n",
            encoding="utf-8",
        )
    return helper_root, firmware_root


def _run_contract(helper_root: Path, firmware_root: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), str(helper_root), str(firmware_root)],
        capture_output=True,
        check=False,
        text=True,
    )


def test_accepts_the_complete_api_ready_firmware_contract(tmp_path: Path) -> None:
    """A complete matching 1.8 firmware matrix is release-compatible."""
    helper_root, firmware_root = _contract_fixture(tmp_path)

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "Verified 22 API-ready firmware configurations."


def test_rejects_project_metadata_without_runtime_calibration_contract(
    tmp_path: Path,
) -> None:
    helper_root, firmware_root = _contract_fixture(tmp_path, api_ready=False)

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "package" in result.stderr


def test_rejects_calibration_reference_that_cannot_be_zeroed(tmp_path: Path) -> None:
    helper_root, firmware_root = _contract_fixture(tmp_path)
    package = (
        firmware_root
        / "Software/ESPHome/calibration/6chan_addon6_calibration.yaml"
    )
    package.write_text(
        package.read_text(encoding="utf-8").replace(
            "min_value: 0.0", "min_value: 1.0", 1
        ),
        encoding="utf-8",
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "not API-ready" in result.stderr


@pytest.mark.parametrize(
    ("old", "new", "message"),
    (
        (
            "    run_power_offset_calibration:\n"
            "      name: \"2. Run ${addon6_name1} Power Offset Cal\"\n"
            "      disabled_by_default: true\n",
            "    run_power_offset_calibration:\n"
            "      name: \"2. Run ${addon6_name1} Power Offset Cal\"\n",
            "calibration buttons",
        ),
        (
            'name: "3. Run ${addon6_name1} Gain Cal"',
            'name: "Run ${addon6_name1} Gain Cal"',
            "calibration buttons",
        ),
        (
            "    clear_gain_calibration:\n",
            "    spare_calibration:\n"
            "      name: \"Spare\"\n"
            "    clear_gain_calibration:\n",
            "calibration buttons",
        ),
        ("id: ${addon6_id1}", "id: ${wrong_id}", "calibration group IDs"),
    ),
)
def test_rejects_calibration_button_contract_drift(
    tmp_path: Path, old: str, new: str, message: str
) -> None:
    """Every calibration action must stay opt-in in Home Assistant."""
    helper_root, firmware_root = _contract_fixture(tmp_path)
    package = firmware_root / "Software/ESPHome/calibration/6chan_addon6_calibration.yaml"
    package.write_text(
        package.read_text(encoding="utf-8").replace(
            old,
            new,
            1,
        ),
        encoding="utf-8",
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert message in result.stderr


def test_rejects_incomplete_generated_compile_matrix(tmp_path: Path) -> None:
    helper_root, firmware_root = _contract_fixture(tmp_path)
    matrix = firmware_root / "Software/ESPHome/tests/compile_matrix.py"
    matrix.write_text(
        "import json\nprint(json.dumps({'configurations': []}))\n",
        encoding="utf-8",
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "compile matrix differs" in result.stderr


def test_rejects_catalog_or_configuration_drift(tmp_path: Path) -> None:
    """A catalog change or missing official variant blocks release."""
    helper_root, firmware_root = _contract_fixture(tmp_path)
    firmware_catalog = firmware_root / "Software/ESPHome/ct_presets.json"
    firmware_catalog.write_text(
        json.dumps({"schema_version": 1, "presets": [{"id": "drift"}]}),
        encoding="utf-8",
    )

    catalog_result = _run_contract(helper_root, firmware_root)

    assert catalog_result.returncode != 0
    assert "CT preset catalogs differ" in catalog_result.stderr

    firmware_catalog.write_text(
        json.dumps({"schema_version": 1, "presets": []}), encoding="utf-8"
    )
    (firmware_root / "Software/ESPHome/6chan_energy_meter_6-addons.yaml").unlink()

    matrix_result = _run_contract(helper_root, firmware_root)

    assert matrix_result.returncode != 0
    assert "firmware configuration set differs" in matrix_result.stderr


def test_rejects_an_unknown_catalog_schema(tmp_path: Path) -> None:
    """Matching catalogs are still incompatible when their schema is unknown."""
    helper_root, firmware_root = _contract_fixture(tmp_path)
    catalog = json.dumps({"schema_version": 2, "presets": []})
    (
        helper_root
        / "custom_components/circuitsetup_energy_meter_helper/data/ct_presets.json"
    ).write_text(catalog, encoding="utf-8")
    (firmware_root / "Software/ESPHome/ct_presets.json").write_text(
        catalog, encoding="utf-8"
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "unsupported CT preset schema" in result.stderr


@pytest.mark.parametrize(
    ("old", "new", "message"),
    (
        (
            "circuitsetup.6c-energy-meter-1-addon",
            "circuitsetup.6c-energy-meter-2-addons",
            "project name does not match filename",
        ),
        ('version: "1.8"', 'version: "1.7"', "project version is not 1.8"),
    ),
)
def test_rejects_project_metadata_drift(
    tmp_path: Path, old: str, new: str, message: str
) -> None:
    """Every official filename must advertise its matching API-ready project."""
    helper_root, firmware_root = _contract_fixture(tmp_path)
    config = firmware_root / "Software/ESPHome/6chan_energy_meter_1-addon.yaml"
    config.write_text(config.read_text(encoding="utf-8").replace(old, new), encoding="utf-8")

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert message in result.stderr
