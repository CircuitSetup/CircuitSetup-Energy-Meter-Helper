"""Verify the helper against a checked-out meter firmware repository."""

import json
import re
import subprocess
import sys
from pathlib import Path

PREFIX = "6chan_energy_meter_"
PROJECT_PREFIX = "circuitsetup.6c-energy-meter"
DASHBOARD_IMPORT_PREFIX = (
    "github://CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter/Software/ESPHome/"
)
COMMON_PACKAGE_PATTERN = re.compile(
    r"^\s*-\s+Software/ESPHome/(6chan_common(?:_ethernet(?:_waveshare)?)?\.yaml)$",
    re.MULTILINE,
)
VARIANTS = (
    {"main_board", "main_ethernet", "main_ethernet_waveshare"}
    | {
        f"{count}-addon{'s' if count > 1 else ''}{suffix}"
        for count in range(1, 7)
        for suffix in ("", "_ethernet", "_ethernet_waveshare")
    }
    | {"3-addons_2-voltages"}
)
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
    return PROJECT_PREFIX + (f"-{variant}" if variant else "")


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


def _has_component(source: str, name: str) -> bool:
    return (
        re.search(rf"^{re.escape(name)}:\s*(?:#.*)?$", source, re.MULTILINE) is not None
    )


def _dashboard_import_url(source: str) -> str | None:
    dashboard = re.search(
        r"(?m)^(?P<indent>[ \t]*)dashboard_import:\s*(?:#.*)?\r?$",
        source,
    )
    if dashboard is None:
        return None
    child_indent = None
    for line in source[dashboard.end() :].splitlines():
        indent = line[: len(line) - len(line.lstrip(" \t"))]
        content = line[len(indent) :]
        if not content:
            continue
        if len(indent) <= len(dashboard["indent"]):
            return None
        if content.startswith("#"):
            continue
        if child_indent is None:
            child_indent = indent
        if indent != child_indent:
            continue
        import_url = re.fullmatch(
            r"""package_import_url:[ \t]*(?P<value>"[^"\r\n]*"|'[^'\r\n]*'|[^#\r\n]*?)[ \t]*(?:#.*)?""",
            content,
        )
        if import_url is not None:
            value = import_url["value"].strip()
            return value[1:-1] if value[:1] in {"'", '"'} else value
    return None


def _resolves_logger(source: str, firmware_dir: Path) -> bool:
    if _has_component(source, "logger"):
        return True
    for package in COMMON_PACKAGE_PATTERN.findall(source):
        path = firmware_dir / package
        if path.is_file() and _has_component(
            path.read_text(encoding="utf-8"), "logger"
        ):
            return True
    return False


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
    id_prefix = "main_meter" if prefix == "main" else prefix
    button_section = re.search(r"(?ms)^button:\n(.*?)(?=^number:|\Z)", source)
    button_blocks = (
        re.findall(r"(?ms)^  - platform: atm90e32\n(.*?)(?=^  - platform:|\Z)", button_section.group(1))
        if button_section
        else []
    )
    if len(button_blocks) != 2:
        raise SystemExit(f"{path.name}: calibration buttons are incomplete")
    expected_controls = (
        ("run_offset_calibration", "1. Run {name} Offset Cal"),
        ("clear_offset_calibration", "z1. Clear {name} Offset Cal"),
        ("run_power_offset_calibration", "2. Run {name} Power Offset Cal"),
        ("clear_power_offset_calibration", "z2. Clear {name} Power Offset Cal"),
        ("run_gain_calibration", "3. Run {name} Gain Cal"),
        ("clear_gain_calibration", "z3. Clear {name} Gain Cal"),
    )
    for group, block in enumerate(button_blocks, start=1):
        if not re.search(
            rf"^    id: \$\{{{re.escape(id_prefix)}_id{group}\}}$", block, re.MULTILINE
        ):
            raise SystemExit(f"{path.name}: calibration group IDs are incomplete")
        controls = re.findall(
            r"(?ms)^    ([^:\s]+):\n"
            r"(.*?)(?=^    [^:\s]+:|\Z)",
            block,
        )
        if len(controls) != len(expected_controls) or {key for key, _ in controls} != {
            key for key, _ in expected_controls
        }:
            raise SystemExit(f"{path.name}: calibration buttons are incomplete")
        expected_name = f"${{{id_prefix}_name{group}}}"
        for key, name_template in expected_controls:
            body = dict(controls)[key]
            expected_name_line = f'      name: "{name_template.format(name=expected_name)}"'
            if (
                expected_name_line not in body
                or len(re.findall(r"^      name:", body, re.MULTILINE)) != 1
                or len(
                    re.findall(
                        r"^      disabled_by_default:", body, re.MULTILINE
                    )
                )
                != 1
                or body.count("disabled_by_default: true") != 1
            ):
                raise SystemExit(f"{path.name}: calibration buttons are incomplete")
    ids = re.findall(
        rf"^    id: \$\{{{re.escape(id_prefix)}_id([12])\}}$", source, re.MULTILINE
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
        raise SystemExit(
            "firmware compile matrix differs from required representatives"
        )


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
        if not project or not project.group(1).startswith(PROJECT_PREFIX):
            raise SystemExit(
                f"{filename}: project name does not use helper discovery prefix"
            )
        if project.group(1) != _project_for(filename):
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
        if any(
            not (firmware_dir / "meter_sensors" / name).is_file() for name in sensors
        ):
            raise SystemExit(f"{filename}: referenced sensor package is missing")
        if any(
            not (firmware_dir / "calibration" / name).is_file() for name in calibrations
        ):
            raise SystemExit(f"{filename}: referenced calibration package is missing")
        channels = list(range(1, 6 * (addon_count + 1) + 1))
        if (
            _indices(source, "ct", "_name") != channels
            or _indices(source, "current_cal_ct") != channels
        ):
            raise SystemExit(f"{filename}: CT substitutions are not contiguous")
        if not _has_component(source, "dashboard_import"):
            raise SystemExit(f"{filename}: firmware must define dashboard_import")
        if (
            _dashboard_import_url(source)
            != f"{DASHBOARD_IMPORT_PREFIX}{filename}@master"
        ):
            raise SystemExit(f"{filename}: dashboard import does not match filename")
        if not _has_component(source, "api"):
            raise SystemExit(f"{filename}: firmware must define api")
        if not _resolves_logger(source, firmware_dir):
            raise SystemExit(f"{filename}: firmware must define logger")
        if "_ethernet" not in filename:
            if not _has_component(source, "wifi"):
                raise SystemExit(f"{filename}: Wi-Fi firmware must define wifi")
            if not _has_component(source, "improv_serial"):
                raise SystemExit(
                    f"{filename}: Wi-Fi firmware must define improv_serial"
                )

    calibration_files = {
        path.name
        for path in (firmware_dir / "calibration").glob("6chan_*_calibration.yaml")
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
