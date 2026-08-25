"""Generalized meter configuration mutation entry point."""

from __future__ import annotations

from .config_mutator import (
    ConfigMutationError,
    ConfigSnapshot,
    CTChangeRequest,
    _build_ct_mutation,
)
from .meter_configuration import MeterConfigurationRequest, validate_meter_configuration
from .meter_inventory import MeterConfigurationInventory
from .models import ConfigMutationPlan, MeterTopology
from .store import VerifiedCalibrationRecord


def build_meter_configuration_mutation(
    snapshot: ConfigSnapshot,
    topology: MeterTopology,
    current: MeterConfigurationInventory,
    requested: MeterConfigurationRequest,
    *,
    calibrated: VerifiedCalibrationRecord | None = None,
) -> ConfigMutationPlan:
    """Build the supported CT/package subset of a generalized configuration edit."""
    if current.source_sha256 != snapshot.sha256 or current.topology != topology:
        raise ConfigMutationError("meter configuration inventory does not match snapshot")
    try:
        validate_meter_configuration(
            requested, topology, require_multi_reference_acknowledgement=False
        )
    except ValueError as error:
        raise ConfigMutationError(str(error)) from error
    previous = current.configuration
    if (
        requested.meter != previous.meter
        or requested.aggregates != previous.aggregates
        or any(
            (new.enabled, new.role, new.voltage_reference_id)
            != (old.enabled, old.role, old.voltage_reference_id)
            for old, new in zip(previous.channels, requested.channels, strict=True)
        )
    ):
        raise ConfigMutationError("meter semantic block rendering is not available")
    changes = tuple(
        CTChangeRequest(
            new.channel,
            new.name,
            new.model_id,
            new.reporting_multiplier,
            new.custom_gain_ct,
            new.custom_label,
            new.burden_output_acknowledged,
        )
        for old, new in zip(previous.channels, requested.channels, strict=True)
        if (
            new.name,
            new.model_id,
            new.reporting_multiplier,
            new.custom_gain_ct,
            new.custom_label,
            new.burden_output_acknowledged,
        )
        != (
            old.name,
            old.model_id,
            old.reporting_multiplier,
            old.custom_gain_ct,
            old.custom_label,
            old.burden_output_acknowledged,
        )
    )
    package_options: dict[str, tuple[bool, ...]] | None = {
        "power_quality": requested.power_quality,
        "status_fields": requested.status_fields,
    }
    if package_options == {
        "power_quality": previous.power_quality,
        "status_fields": previous.status_fields,
    }:
        package_options = None
    return _build_ct_mutation(
        snapshot, topology, changes, package_options=package_options
    )
