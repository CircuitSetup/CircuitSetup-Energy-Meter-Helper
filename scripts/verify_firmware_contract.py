"""Verify the helper against a checked-out meter firmware repository."""

import json
import re
import subprocess
import sys
from pathlib import Path

PREFIX = "6chan_energy_meter_"
VARIANTS = {"main_board", "main_ethernet", "main_ethernet_waveshare"} | {
    f"{count}-addon{'s' if count > 1 else ''}{suffix}"
    for count in range(1, 7)
    for suffix in ("", "_ethernet", "_ethernet_waveshare")
} | {"3-addons_2-voltages"}
EXPECTED_CONFIGS = {f"{PREFIX}{variant}.yaml" for variant in VARIANTS}
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
EXPECTED_MATRIX = {
    f"Software/ESPHome/{PREFIX}{variant}.yaml" for variant in REPRESENTATIVES
}


def _project_for(filename: str) -> str:
    variant = filename.removeprefix(PREFIX).removesuffix(".yaml").replace("_", "-")
    if variant == "main-board":
        variant = ""
    elif variant.startswith("main-"):
        variant = variant.removeprefix("main-")
    return "circuitsetup.6c-energy-meter" + (f"-{variant}" if variant else "")


def _addon_count(project: str) -> int:
    match = re.search(r"-(\d+)-addons?(?:-|$)", project)
    return int(match.group(1)) if match else 0


def _indices(source: str, prefix: str, suffix: str = "") -> list[int]:
    return [
        int(index)
        for index in re.findall(
            rf"^  {re.escape(prefix)}(\d+){re.escape(suffix)}:",
            source,
            re.MULTILINE,
        )
    ]


def _package_names(source: str, directory: str, suffix: str = "") -> list[str]:
    return re.findall(
        rf"^\s*- Software/ESPHome/{directory}/(6chan_(?:main|main_sensor|addon\d+){re.escape(suffix)}\.yaml)$",
        source,
        re.MULTILINE,
    )


def _verify_calibration_package(path: Path, prefix: str) -> None:
    if not path.is_file():
        raise SystemExit(f"missing calibration package: {path.name}")
    source = path.read_text(encoding="utf-8")
    if source.count("run_gain_calibration:") != 2 or source.count(
        "clear_gain_calibration:"
    ) != 2:
        raise SystemExit(f"{path.name}: calibration buttons are incomplete")
    id_prefix = "main_meter" if prefix == "main" else prefix
    ids = re.findall(
        rf"^    id: \$\{{{re.escape(id_prefix)}_id([12])\}}$",
        source,
        re.MULTILINE,
    )
    if sorted(ids) != ["1", "1", "2", "2"]:
        raise SystemExit(f"{path.name}: calibration group IDs are incomplete")
    references: list[tuple[str, str, str]] = []
    for kind, reference in re.findall(
        r"(?ms)^    reference_(voltage|current):\n(.*?)(?=^    reference_|^  - platform:|\Z)",
        source,
    ):
        references.extend(
            (kind, phase, body)
            for phase, body in re.findall(
                r"(?ms)^      phase_([abc]):\n(.*?)(?=^      phase_|\Z)", reference
            )
        )
    if [(kind, phase) for kind, phase, _ in references] != [
        ("voltage", "a"),
        ("current", "a"),
        ("current", "b"),
        ("current", "c"),
    ] * 2:
        raise SystemExit(f"{path.name}: calibration reference entities are incomplete")
    for kind, _phase, body in references:
        maximum = "260.0" if kind == "voltage" else "200.0"
        if not all(
            value in body
            for value in (
                "min_value: 0.0",
                f"max_value: {maximum}",
                "step: 0.1",
                "disabled_by_default: true",
            )
        ):
            raise SystemExit(f"{path.name}: calibration reference is not API-ready")


def _verify_compile_matrix(firmware_root: Path) -> None:
    script = firmware_root / "Software/ESPHome/tests/compile_matrix.py"
    if not script.is_file():
        raise SystemExit("firmware compile matrix generator is missing")
    result = subprocess.run(
        [sys.executable, str(script)], capture_output=True, check=False, text=True
    )
    if result.returncode != 0:
        raise SystemExit("firmware compile matrix generation failed")
    try:
        matrix = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise SystemExit("firmware compile matrix output is invalid") from error
    configurations = matrix.get("configurations") if isinstance(matrix, dict) else None
    if (
        not isinstance(configurations, list)
        or len(configurations) != len(set(configurations))
        or set(configurations) != EXPECTED_MATRIX
        or configurations != sorted(configurations)
        or any(not (firmware_root / item).is_file() for item in configurations)
    ):
        raise SystemExit("firmware compile matrix differs from required representatives")


def verify(helper_root: Path, firmware_root: Path) -> None:
    """Verify the release contract shared by helper and firmware."""
    helper_catalog = json.loads(
        (
            helper_root
            / "custom_components/circuitsetup_energy_meter_helper/data/ct_presets.json"
        ).read_text(encoding="utf-8")
    )
    firmware_dir = firmware_root / "Software/ESPHome"
    firmware_catalog = json.loads(
        (firmware_dir / "ct_presets.json").read_text(encoding="utf-8")
    )
    if helper_catalog != firmware_catalog:
        raise SystemExit("CT preset catalogs differ")
    if helper_catalog.get("schema_version") != 1:
        raise SystemExit("unsupported CT preset schema")

    configs = {path.name: path for path in firmware_dir.glob(f"{PREFIX}*.yaml")}
    if set(configs) != EXPECTED_CONFIGS:
        raise SystemExit("firmware configuration set differs from the supported matrix")
    for filename, path in configs.items():
        source = path.read_text(encoding="utf-8")
        project = re.search(r"^    name: (\S+)$", source, re.MULTILINE)
        if not project or project.group(1) != _project_for(filename):
            raise SystemExit(f"{filename}: project name does not match filename")
        if not re.search(r'^    version: ["\']1\.8["\']$', source, re.MULTILINE):
            raise SystemExit(f"{filename}: project version is not 1.8")
        addon_count = _addon_count(project.group(1))
        sensors = _package_names(source, "meter_sensors")
        calibrations = _package_names(source, "calibration", "_calibration")
        expected_sensors = ["6chan_main_sensor.yaml"] + [
            f"6chan_addon{index}.yaml" for index in range(1, addon_count + 1)
        ]
        expected_calibrations = ["6chan_main_calibration.yaml"] + [
            f"6chan_addon{index}_calibration.yaml"
            for index in range(1, addon_count + 1)
        ]
        if sensors != expected_sensors or calibrations != expected_calibrations:
            raise SystemExit(f"{filename}: package board indices are not contiguous")
        if any(not (firmware_dir / "meter_sensors" / name).is_file() for name in sensors):
            raise SystemExit(f"{filename}: referenced sensor package is missing")
        if any(
            not (firmware_dir / "calibration" / name).is_file()
            for name in calibrations
        ):
            raise SystemExit(f"{filename}: referenced calibration package is missing")
        channels = list(range(1, 6 * (addon_count + 1) + 1))
        if _indices(source, "ct", "_name") != channels or _indices(
            source, "current_cal_ct"
        ) != channels:
            raise SystemExit(f"{filename}: CT substitutions are not contiguous")

    calibration_files = {
        path.name for path in (firmware_dir / "calibration").glob("6chan_*_calibration.yaml")
    }
    expected_calibration_files = {"6chan_main_calibration.yaml"} | {
        f"6chan_addon{index}_calibration.yaml" for index in range(1, 7)
    }
    if calibration_files != expected_calibration_files:
        raise SystemExit("firmware calibration package set is incomplete")
    for board in range(7):
        prefix = "main" if board == 0 else f"addon{board}"
        _verify_calibration_package(
            firmware_dir / "calibration" / f"6chan_{prefix}_calibration.yaml",
            prefix,
        )
    _verify_compile_matrix(firmware_root)

    print("Verified 22 API-ready firmware configurations.")


if __name__ == "__main__":
    verify(Path(sys.argv[1]), Path(sys.argv[2]))
