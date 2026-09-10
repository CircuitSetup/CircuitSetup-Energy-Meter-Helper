"""The small official package contract shared by rendering and estimates."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PackageContract:
    """One optional official package and the entities it contributes."""

    key: str
    directory: str
    suffix: str
    phase_metrics: tuple[str, ...]
    scalable_phase_metrics: tuple[str, ...]
    legacy_phase_metrics: tuple[str, ...]
    phase_metric_count: int
    board_metrics: tuple[tuple[int, tuple[str, ...]], ...]
    metrics_are_numeric: bool
    ha_entities_disabled_by_default: bool
    default_main_enabled: bool
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


SUPPORTED_PACKAGE_CONTRACTS = {
    "power_quality": PackageContract(
        key="power_quality",
        directory="power_quality",
        suffix="power_quality",
        phase_metrics=("reactive_power", "apparent_power", "power_factor"),
        scalable_phase_metrics=("reactive_power", "apparent_power"),
        legacy_phase_metrics=("harmonic_power", "peak_current", "phase_angle"),
        phase_metric_count=6,
        board_metrics=(),
        metrics_are_numeric=True,
        ha_entities_disabled_by_default=False,
        default_main_enabled=False,
        ha_disabled_entity_counts=(),
    ),
    "status_fields": PackageContract(
        key="status_fields",
        directory="status_fields",
        suffix="status",
        phase_metrics=("phase_status",),
        scalable_phase_metrics=(),
        legacy_phase_metrics=(),
        phase_metric_count=2,
        board_metrics=((0, ("frequency_status",)),),
        metrics_are_numeric=False,
        ha_entities_disabled_by_default=True,
        default_main_enabled=True,
        ha_disabled_entity_counts=((0, 7), (1, 6)),
    ),
}


def package_path(feature: str, board_index: int) -> str:
    """Return the exact official package path for one board."""
    try:
        return SUPPORTED_PACKAGE_CONTRACTS[feature].path(board_index)
    except KeyError as error:
        raise ValueError(f"unsupported package feature: {feature}") from error


def default_package_options(board_count: int) -> dict[str, tuple[bool, ...]]:
    """Return the established new-install package selection defaults."""
    if not 1 <= board_count <= 7:
        raise ValueError("board_count must be between 1 and 7")
    return {
        key: tuple(
            contract.default_main_enabled if board == 0 else False
            for board in range(board_count)
        )
        for key, contract in SUPPORTED_PACKAGE_CONTRACTS.items()
    }
