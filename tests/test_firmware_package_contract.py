"""Assert the Helper package description against checked-out firmware files."""

import os
from pathlib import Path

import pytest

from custom_components.circuitsetup_energy_meter_helper.package_contract import (
    SUPPORTED_PACKAGE_CONTRACTS,
)

FIRMWARE_ROOT_VALUE = os.environ.get("FIRMWARE_ROOT")
FIRMWARE_ROOT = Path(FIRMWARE_ROOT_VALUE) if FIRMWARE_ROOT_VALUE else Path()
FIRMWARE_DIR = FIRMWARE_ROOT / "Software" / "ESPHome"


pytestmark = pytest.mark.skipif(
    not FIRMWARE_ROOT_VALUE or not FIRMWARE_DIR.is_dir(),
    reason="FIRMWARE_ROOT must point to a checked-out firmware repository",
)


def _source(feature: str, board: int) -> str:
    return (FIRMWARE_ROOT / SUPPORTED_PACKAGE_CONTRACTS[feature].path(board)).read_text(
        encoding="utf-8"
    )


@pytest.mark.parametrize("board", range(7))
def test_power_quality_contract_has_three_metrics_per_six_channel_board(
    board: int,
) -> None:
    contract = SUPPORTED_PACKAGE_CONTRACTS["power_quality"]
    source = _source("power_quality", board)
    assert tuple(
        source.count(f"    {metric}:") for metric in contract.phase_metrics
    ) == (contract.phase_metric_count,) * len(contract.phase_metrics)
    assert not any(
        f"    {metric}:" in source for metric in contract.legacy_phase_metrics
    )


@pytest.mark.parametrize("board", range(7))
def test_status_contract_distinguishes_phase_and_board_diagnostics(board: int) -> None:
    contract = SUPPORTED_PACKAGE_CONTRACTS["status_fields"]
    source = _source("status_fields", board)
    assert source.count("    phase_status:") == contract.phase_metric_count
    for metric in contract.board_metric_names(board):
        assert source.count(f"    {metric}:") == 1
    expected_disabled = contract.ha_disabled_entity_count(board)
    assert expected_disabled is not None
    assert source.count("disabled_by_default: true") == expected_disabled
    assert contract.ha_entities_disabled_by_default
