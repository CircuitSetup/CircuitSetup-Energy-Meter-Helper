"""Firmware-backed meter configuration capabilities."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class MeterConfigurationCapabilities:
    """The configuration writes supported by an authoritative firmware contract."""

    configuration_authoritative: bool
    managed_totals: bool
    multi_reference: bool
    reason_codes: tuple[str, ...]


def meter_configuration_capabilities(
    *, configuration_authoritative: bool, config_contract: int | None
) -> MeterConfigurationCapabilities:
    """Derive safe configuration capabilities from authoritative metadata."""
    if type(configuration_authoritative) is not bool:
        raise TypeError("configuration_authoritative must be a bool")
    if config_contract is not None and type(config_contract) is not int:
        raise TypeError("config_contract must be an int or None")
    if not configuration_authoritative:
        return MeterConfigurationCapabilities(
            False, False, False, ("configuration_not_authoritative",)
        )
    if config_contract == 2:
        return MeterConfigurationCapabilities(True, True, True, ())
    return MeterConfigurationCapabilities(
        True, False, True, ("config_contract_upgrade_required",)
    )
