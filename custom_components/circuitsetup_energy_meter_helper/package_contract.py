"""The small official package contract shared by rendering and estimates."""

from __future__ import annotations

import re
from dataclasses import dataclass

OFFICIAL_PACKAGE_REPOSITORY = (
    "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter"
)
CALIBRATION_PACKAGE_DIRECTORY = "calibration"
PACKAGE_CAPABILITY_STATES = frozenset(
    {"already_present", "available_to_prepare", "cannot_safely_manage"}
)
PACKAGE_CAPABILITY_REASON_CODES = frozenset(
    {
        "official_package_present",
        "official_source_ready",
        "unsupported_package_source",
        "ambiguous_package_source",
        "package_source_unavailable",
        "duplicate_package_reference",
    }
)
CALIBRATION_CAPABILITY_REASON_CODES = frozenset(
    {
        "calibration_package_present",
        "calibration_source_ready",
        "calibration_flag_unavailable",
        "calibration_flag_invalid",
        "unsupported_package_source",
        "ambiguous_package_source",
        "package_source_unavailable",
        "duplicate_package_reference",
    }
)
_STATIC_PACKAGE_REF_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]*$")


def is_static_package_ref(value: str | None) -> bool:
    """Return whether a package ref is a literal, bounded git ref."""
    return isinstance(value, str) and _STATIC_PACKAGE_REF_RE.fullmatch(value) is not None


@dataclass(frozen=True, slots=True)
class PackageContract:
    """One optional official package and the entities it contributes."""

    directory: str
    suffix: str
    phase_metrics: tuple[str, ...]
    scalable_phase_metrics: tuple[str, ...]
    legacy_phase_metrics: tuple[str, ...]
    phase_metric_count: int
    board_metrics: tuple[tuple[int, tuple[str, ...]], ...]
    metrics_are_numeric: bool
    ha_disabled_entity_counts: tuple[tuple[int, int], ...]

    def path(self, board_index: int) -> str:
        board = "main" if board_index == 0 else f"addon{board_index}"
        return f"Software/ESPHome/{self.directory}/6chan_{board}_{self.suffix}.yaml"

    def numeric_phase_metric_count(self) -> int:
        return len(self.phase_metrics) if self.metrics_are_numeric else 0

    def board_metric_names(self, board_index: int) -> tuple[str, ...]:
        """Return board-level metrics actually present on one board package."""
        return dict(self.board_metrics).get(board_index, ())

    def ha_disabled_entity_count(self, board_index: int) -> int | None:
        """Return the package's expected disabled-by-default entity count."""
        counts = dict(self.ha_disabled_entity_counts)
        return counts.get(board_index, counts.get(1) if board_index > 0 else None)


@dataclass(frozen=True, slots=True)
class PackageCapability:
    """Safe UI state for one optional package on one installed board."""

    feature: str
    board_index: int
    state: str
    reason_code: str

    def __post_init__(self) -> None:
        if self.feature not in SUPPORTED_PACKAGE_CONTRACTS:
            raise ValueError("unsupported package feature")
        if not 0 <= self.board_index <= 6:
            raise ValueError("board_index must be between 0 and 6")
        if self.state not in PACKAGE_CAPABILITY_STATES:
            raise ValueError("invalid package capability state")
        if self.reason_code not in PACKAGE_CAPABILITY_REASON_CODES:
            raise ValueError("invalid package capability reason")


@dataclass(frozen=True, slots=True)
class CalibrationPreparationCapability:
    """Safe source-level status for the reviewed calibration preparation."""

    state: str
    reason_code: str

    def __post_init__(self) -> None:
        if self.state not in PACKAGE_CAPABILITY_STATES:
            raise ValueError("invalid calibration capability state")
        if self.reason_code not in CALIBRATION_CAPABILITY_REASON_CODES:
            raise ValueError("invalid calibration capability reason")


SUPPORTED_PACKAGE_CONTRACTS = {
    "power_quality": PackageContract(
        directory="power_quality",
        suffix="power_quality",
        phase_metrics=("reactive_power", "apparent_power", "power_factor"),
        scalable_phase_metrics=("reactive_power", "apparent_power"),
        legacy_phase_metrics=("harmonic_power", "peak_current", "phase_angle"),
        phase_metric_count=6,
        board_metrics=(),
        metrics_are_numeric=True,
        ha_disabled_entity_counts=(),
    ),
    "status_fields": PackageContract(
        directory="status_fields",
        suffix="status",
        phase_metrics=("phase_status",),
        scalable_phase_metrics=(),
        legacy_phase_metrics=(),
        phase_metric_count=2,
        board_metrics=((0, ("frequency_status",)),),
        metrics_are_numeric=False,
        ha_disabled_entity_counts=((0, 7), (1, 6)),
    ),
}


def package_path(feature: str, board_index: int) -> str:
    """Return the exact official package path for one board."""
    try:
        return SUPPORTED_PACKAGE_CONTRACTS[feature].path(board_index)
    except KeyError as error:
        raise ValueError(f"unsupported package feature: {feature}") from error


def calibration_package_path(board_index: int) -> str:
    """Return the reviewed official calibration-controls package path."""
    if not 0 <= board_index <= 6:
        raise ValueError("board_index must be between 0 and 6")
    board = "main" if board_index == 0 else f"addon{board_index}"
    return (
        f"Software/ESPHome/{CALIBRATION_PACKAGE_DIRECTORY}/"
        f"6chan_{board}_calibration.yaml"
    )
