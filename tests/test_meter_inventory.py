"""Tests for firmware configuration capability discovery."""

from dataclasses import fields

import pytest

from custom_components.circuitsetup_energy_meter_helper.meter_inventory import (
    MeterConfigurationCapabilities,
    meter_configuration_capabilities,
)


def test_capability_model_has_exact_frozen_slots_contract() -> None:
    assert tuple(field.name for field in fields(MeterConfigurationCapabilities)) == (
        "configuration_authoritative",
        "managed_totals",
        "multi_reference",
        "reason_codes",
    )
    assert hasattr(MeterConfigurationCapabilities, "__slots__")
    assert not hasattr(
        MeterConfigurationCapabilities(True, True, True, ()), "__dict__"
    )
    assert not hasattr(MeterConfigurationCapabilities, "status_thresholds")


@pytest.mark.parametrize(
    ("authoritative", "contract", "expected"),
    (
        (False, 2, (False, False, ("configuration_not_authoritative",))),
        (False, None, (False, False, ("configuration_not_authoritative",))),
        (True, 2, (True, True, ())),
        (True, 1, (False, True, ("config_contract_upgrade_required",))),
        (True, None, (False, True, ("config_contract_upgrade_required",))),
    ),
)
def test_capabilities_follow_contract_truth_table(
    authoritative: bool,
    contract: int | None,
    expected: tuple[bool, bool, tuple[str, ...]],
) -> None:
    value = meter_configuration_capabilities(
        configuration_authoritative=authoritative, config_contract=contract
    )
    assert (value.managed_totals, value.multi_reference, value.reason_codes) == expected
    assert value.configuration_authoritative is authoritative


@pytest.mark.parametrize(
    ("authoritative", "contract"),
    ((1, 2), (True, True), (False, 2.0), (False, "2"), ("true", None)),
)
def test_capability_inputs_require_exact_bool_and_int_types(
    authoritative: object, contract: object
) -> None:
    with pytest.raises(TypeError):
        meter_configuration_capabilities(
            configuration_authoritative=authoritative, config_contract=contract
        )
