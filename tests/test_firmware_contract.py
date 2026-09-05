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


def _sensor_totals(board: int) -> str:
    first = board * 6 + 1
    suffix = "Main" if board == 0 else f"AddOn{board}"
    amps = " + ".join(f"id(ct{channel}Amps).state" for channel in range(first, first + 6))
    watts = " + ".join(f"id(ct{channel}Watts).state" for channel in range(first, first + 6))
    return (
        "sensor:\n"
        "  - platform: template\n"
        f"    id: totalAmps{suffix}\n"
        f"    lambda: return {amps} ;\n"
        "  - platform: template\n"
        f"    id: totalWatts{suffix}\n"
        f"    lambda: return {watts} ;\n"
    )


def _root_totals(addon_count: int) -> str:
    suffixes = ["Main"] + [f"AddOn{board}" for board in range(1, addon_count + 1)]
    amps = " + ".join(f"id(totalAmps{suffix}).state" for suffix in suffixes)
    watts = " + ".join(f"id(totalWatts{suffix}).state" for suffix in suffixes)
    power_id = "totalWatts" if addon_count else "totalWattsMain"
    totals = ""
    if addon_count:
        totals = (
            "sensor:\n"
            "- platform: template\n"
            "  id: totalAmps\n"
            f"  lambda: return {amps} ;\n"
            "- platform: template\n"
            "  id: totalWatts\n"
            f"  lambda: return {watts} ;\n"
        )
    return (
        totals
        + "sensor:\n"
        + "- platform: total_daily_energy\n"
        + "  id: totalEnergyDaily\n"
        + f"  power_id: {power_id}\n"
    )


def _sensor_package(prefix: str, *, main: bool = False) -> str:
    instances = []
    for instance in (1, 2):
        phases = []
        for phase in "abc":
            public = main and instance == 1 and phase == "a"
            voltage = (
                "        name: Voltage 1\n"
                "        id: ic1Volts\n"
                "        accuracy_decimals: 1\n"
            ) if public else (
                f'        name: "{prefix}{instance} Voltage {phase.upper()} Calibration"\n'
                f"        id: {'meter_main' if main else prefix + '_'}"
                f"{instance}_voltage_{phase}_calibration\n"
                "        entity_category: diagnostic\n"
                "        disabled_by_default: true\n"
            )
            phases.append(
                f"    phase_{phase}:\n"
                "      voltage:\n"
                f"{voltage}"
                f"      gain_voltage: ${{voltage_cal{instance}}}\n"
            )
        instances.append("  - platform: atm90e32\n" + "".join(phases))
    return "sensor:\n" + "".join(instances)


def _contract_fixture(tmp_path: Path, *, api_ready: bool = True) -> tuple[Path, Path]:
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
        for common in (
            "6chan_common.yaml",
            "6chan_common_ethernet.yaml",
            "6chan_common_ethernet_waveshare.yaml",
        ):
            (firmware_data / common).write_text("logger:\n", encoding="utf-8")
        for board in range(7):
            prefix = "main" if board == 0 else f"addon{board}"
            (calibration / f"6chan_{prefix}_calibration.yaml").write_text(
                _calibration_package(prefix, board * 6 + 1), encoding="utf-8"
            )
            sensor = "main_sensor" if board == 0 else prefix
            (sensors / f"6chan_{sensor}.yaml").write_text(
                _sensor_package(prefix, main=board == 0) + _sensor_totals(board).removeprefix("sensor:\n"), encoding="utf-8"
            )

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
        filename = f"6chan_energy_meter_{variant}.yaml"
        source = (
            f'esphome:\n  project:\n    name: {project}\n    version: "1.8"\n'
            "dashboard_import:\n"
            "  package_import_url: github://CircuitSetup/"
            "Expandable-6-Channel-ESP32-Energy-Meter/Software/ESPHome/"
            f"{filename}@master\n"
            "  import_full_config: true\n"
            "api:\n"
        )
        source += (
            "ethernet:\n"
            if "_ethernet" in variant
            else "wifi:\n  ap:\nimprov_serial:\n"
        )
        if api_ready:
            match = re.search(r"(\d+)-addons?", variant)
            addon_count = int(match.group(1)) if match else 0
            channel_count = 6 * (addon_count + 1)
            source += "substitutions:\n  voltage_cal1: '7305'\n  voltage_cal2: '7305'\n" + "".join(
                f"  ct{channel}_name: CT{channel}\n  current_cal_ct{channel}: '27518'\n"
                for channel in range(1, channel_count + 1)
            )
            common = (
                "6chan_common_ethernet_waveshare.yaml"
                if "_ethernet_waveshare" in variant
                else "6chan_common_ethernet.yaml"
                if "_ethernet" in variant
                else "6chan_common.yaml"
            )
            source += "packages:\n  meter_sensors:\n"
            source += f"    - Software/ESPHome/{common}\n"
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
            source += _root_totals(addon_count)
        (firmware_data / f"6chan_energy_meter_{variant}.yaml").write_text(
            source, encoding="utf-8"
        )
    if api_ready:
        matrix = [
            f"Software/ESPHome/6chan_energy_meter_{variant}.yaml"
            for variant in REPRESENTATIVES
        ] + [
            "Software/ESPHome/6chan_energy_meter_main_ethernet.yaml",
            "Software/ESPHome/6chan_energy_meter_main_ethernet_waveshare.yaml",
            "Software/ESPHome/local_status_harness.generated.yaml",
        ]
        (firmware_data / "local_status_harness.generated.yaml").write_text(
            "packages:\n", encoding="utf-8"
        )
        (tests / "compile_matrix.py").write_text(
            "import json\nprint(json.dumps({'configurations': "
            + repr(sorted(matrix))
            + "}))\n",
            encoding="utf-8",
        )
    return helper_root, firmware_root


def _run_contract(
    helper_root: Path, firmware_root: Path
) -> subprocess.CompletedProcess[str]:
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


def test_rejects_wrong_second_instance_phase_gain(tmp_path: Path) -> None:
    helper_root, firmware_root = _contract_fixture(tmp_path)
    package = firmware_root / "Software/ESPHome/meter_sensors/6chan_addon1.yaml"
    package.write_text(
        package.read_text(encoding="utf-8").replace(
            "    phase_b:\n"
            "      voltage:\n"
            '        name: "addon12 Voltage B Calibration"\n'
            "        id: addon1_2_voltage_b_calibration\n"
            "        entity_category: diagnostic\n"
            "        disabled_by_default: true\n"
            "      gain_voltage: ${voltage_cal2}",
            "    phase_b:\n"
            "      voltage:\n"
            '        name: "addon12 Voltage B Calibration"\n'
            "        id: addon1_2_voltage_b_calibration\n"
            "        entity_category: diagnostic\n"
            "        disabled_by_default: true\n"
            "      gain_voltage: ${voltage_cal1}",
        ),
        encoding="utf-8",
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "voltage gain inheritance" in result.stderr


@pytest.mark.parametrize("change", ("missing_id", "renamed_id", "missing_name", "empty_name"))
def test_rejects_unbindable_diagnostic_voltage_sensor(tmp_path: Path, change: str) -> None:
    helper_root, firmware_root = _contract_fixture(tmp_path)
    package = firmware_root / "Software/ESPHome/meter_sensors/6chan_addon1.yaml"
    source = package.read_text(encoding="utf-8")
    old, new = {
        "missing_id": ("        id: addon1_1_voltage_a_calibration\n", ""),
        "renamed_id": ("id: addon1_1_voltage_a_calibration", "id: renamed_voltage"),
        "missing_name": ('        name: "addon11 Voltage A Calibration"\n', ""),
        "empty_name": ('name: "addon11 Voltage A Calibration"', 'name: ""'),
    }[change]
    assert old in source
    package.write_text(source.replace(old, new, 1), encoding="utf-8")

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "voltage sensor defaults" in result.stderr


def test_rejects_missing_phase_voltage_sensor_default(tmp_path: Path) -> None:
    helper_root, firmware_root = _contract_fixture(tmp_path)
    package = firmware_root / "Software/ESPHome/meter_sensors/6chan_addon1.yaml"
    package.write_text(
        package.read_text(encoding="utf-8").replace(
            "        disabled_by_default: true\n", "", 1
        ),
        encoding="utf-8",
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "voltage sensor defaults" in result.stderr


def test_rejects_commented_phase_voltage_sensor_default(tmp_path: Path) -> None:
    helper_root, firmware_root = _contract_fixture(tmp_path)
    package = firmware_root / "Software/ESPHome/meter_sensors/6chan_addon1.yaml"
    package.write_text(
        package.read_text(encoding="utf-8").replace(
            "        disabled_by_default: true\n",
            "#        disabled_by_default: true\n",
            1,
        ),
        encoding="utf-8",
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "voltage sensor defaults" in result.stderr


def test_rejects_internal_phase_voltage_sensor(tmp_path: Path) -> None:
    helper_root, firmware_root = _contract_fixture(tmp_path)
    package = firmware_root / "Software/ESPHome/meter_sensors/6chan_addon1.yaml"
    package.write_text(
        package.read_text(encoding="utf-8").replace(
            "        disabled_by_default: true\n",
            "        disabled_by_default: true\n        internal: true\n",
            1,
        ),
        encoding="utf-8",
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "voltage sensor defaults" in result.stderr


def test_rejects_invalid_voltage_gain_substitution(tmp_path: Path) -> None:
    helper_root, firmware_root = _contract_fixture(tmp_path)
    config = firmware_root / "Software/ESPHome/6chan_energy_meter_main_board.yaml"
    config.write_text(
        config.read_text(encoding="utf-8").replace("voltage_cal2: '7305'", "voltage_cal2: '0'"),
        encoding="utf-8",
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "voltage gain substitutions" in result.stderr


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
        firmware_root / "Software/ESPHome/calibration/6chan_addon6_calibration.yaml"
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
            (
                "    run_power_offset_calibration:\n"
                "      name: \"2. Run ${addon6_name1} Power Offset Cal\"\n"
                "      disabled_by_default: true\n"
            ),
            (
                "    run_power_offset_calibration:\n"
                "      name: \"2. Run ${addon6_name1} Power Offset Cal\"\n"
            ),
            "calibration buttons",
        ),
        (
            'name: "3. Run ${addon6_name1} Gain Cal"',
            'name: "Run ${addon6_name1} Gain Cal"',
            "calibration buttons",
        ),
        (
            '      name: "1. Run ${addon6_name1} Offset Cal"\n',
            (
                '      name: "1. Run ${addon6_name1} Offset Cal"\n'
                '      name: "Duplicate"\n'
            ),
            "calibration buttons",
        ),
        (
            "      disabled_by_default: true\n",
            (
                "      disabled_by_default: true\n"
                "      disabled_by_default: false\n"
            ),
            "calibration buttons",
        ),
        (
            "    clear_gain_calibration:\n",
            (
                "    spare_calibration:\n"
                "      name: \"Spare\"\n"
                "    clear_gain_calibration:\n"
            ),
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
    config.write_text(
        config.read_text(encoding="utf-8").replace(old, new), encoding="utf-8"
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert message in result.stderr


@pytest.mark.parametrize(
    ("filename", "old", "new", "message"),
    (
        (
            "6chan_energy_meter_main_board.yaml",
            "wifi:\n",
            "",
            "Wi-Fi firmware must define wifi",
        ),
        (
            "6chan_energy_meter_main_board.yaml",
            "improv_serial:\n",
            "",
            "Wi-Fi firmware must define improv_serial",
        ),
        (
            "6chan_energy_meter_main_board.yaml",
            "api:\n",
            "",
            "firmware must define api",
        ),
        (
            "6chan_energy_meter_main_board.yaml",
            "dashboard_import:\n",
            "",
            "firmware must define dashboard_import",
        ),
        (
            "6chan_energy_meter_main_board.yaml",
            "6chan_energy_meter_main_board.yaml@master",
            "wrong.yaml@master",
            "dashboard import does not match filename",
        ),
        (
            "6chan_energy_meter_main_board.yaml",
            "circuitsetup.6c-energy-meter",
            "another.vendor-meter",
            "project name does not use helper discovery prefix",
        ),
        (
            "6chan_energy_meter_1-addon.yaml",
            "6chan_energy_meter_1-addon.yaml@master",
            "6chan_energy_meter_2-addons.yaml@master",
            "dashboard import does not match filename",
        ),
    ),
)
def test_rejects_missing_or_mismatched_provisioning_contract(
    tmp_path: Path, filename: str, old: str, new: str, message: str
) -> None:
    """Provisioning needs the runtime and topology identity advertised by source."""
    helper_root, firmware_root = _contract_fixture(tmp_path)
    config = firmware_root / "Software/ESPHome" / filename
    config.write_text(
        config.read_text(encoding="utf-8").replace(old, new), encoding="utf-8"
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert message in result.stderr


def test_rejects_source_configurations_that_do_not_resolve_logger(
    tmp_path: Path,
) -> None:
    """A source configuration must retain the shared logger package."""
    helper_root, firmware_root = _contract_fixture(tmp_path)
    common = firmware_root / "Software/ESPHome/6chan_common.yaml"
    common.write_text("\n", encoding="utf-8")

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "firmware must define logger" in result.stderr


def test_rejects_dashboard_import_url_spoofed_by_comment(tmp_path: Path) -> None:
    """The expected import URL in a comment must not satisfy the contract."""
    helper_root, firmware_root = _contract_fixture(tmp_path)
    config = firmware_root / "Software/ESPHome/6chan_energy_meter_main_board.yaml"
    expected = (
        "github://CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter/"
        "Software/ESPHome/6chan_energy_meter_main_board.yaml@master"
    )
    config.write_text(
        config.read_text(encoding="utf-8").replace(
            expected, f"wrong.yaml@master # {expected}"
        ),
        encoding="utf-8",
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "dashboard import does not match filename" in result.stderr


def test_rejects_nested_dashboard_import_url_masking_direct_url(
    tmp_path: Path,
) -> None:
    """Only dashboard_import's direct URL key establishes the import identity."""
    helper_root, firmware_root = _contract_fixture(tmp_path)
    config = firmware_root / "Software/ESPHome/6chan_energy_meter_main_board.yaml"
    expected = (
        "github://CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter/"
        "Software/ESPHome/6chan_energy_meter_main_board.yaml@master"
    )
    config.write_text(
        config.read_text(encoding="utf-8").replace(
            f"dashboard_import:\n  package_import_url: {expected}",
            "dashboard_import:\n  metadata:\n"
            f"    package_import_url: {expected}\n"
            "  package_import_url: wrong.yaml@master",
        ),
        encoding="utf-8",
    )

    result = _run_contract(helper_root, firmware_root)

    assert result.returncode != 0
    assert "dashboard import does not match filename" in result.stderr


def test_accepts_ethernet_without_improv_serial(tmp_path: Path) -> None:
    """Ethernet remains compatible without the Wi-Fi-only serial provisioner."""
    helper_root, firmware_root = _contract_fixture(tmp_path)
    config = firmware_root / "Software/ESPHome/6chan_energy_meter_1-addon_ethernet.yaml"

    assert "improv_serial:" not in config.read_text(encoding="utf-8")
    result = _run_contract(helper_root, firmware_root)

    assert result.returncode == 0, result.stderr
