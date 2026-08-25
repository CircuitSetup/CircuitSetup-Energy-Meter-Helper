"""Firmware-backed complete meter configuration inventory."""

from __future__ import annotations

import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, replace
from typing import cast

from .config_document import ESPHomeConfigDocument
from .config_mutator import package_options_from_document
from .ct_catalog import CTPresetCatalog
from .ct_inventory import CTInventory
from .meter_configuration import (
    ChannelSettings,
    CircuitRole,
    ElectricalSystem,
    LineFrequencyHz,
    MeterConfigurationRequest,
    MeterSettings,
    UpdateIntervalSeconds,
    VoltageLayout,
    VoltageReferenceConfig,
    validate_meter_configuration,
)
from .models import MeterTopology, StoredCTSelection, VoltageReferenceTopology
from .store import StoredMeterConfiguration
from .topology import (
    channel_address,
    voltage_reference_topology_from_configuration,
    voltage_reference_topology_from_legacy,
)
from .voltage_transformer_catalog import VoltageTransformerCatalog

_GENERIC_TOTAL_ID = re.compile(
    r"^\s*(?:-\s*)?id:\s*[\"']?(?:totalAmps|totalWatts|totalEnergyDaily)[\"']?\s*$"
)


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


@dataclass(frozen=True, slots=True)
class MeterConfigurationInventory:
    """One hash-bound meter configuration snapshot, ready for a server plan handle."""

    source_sha256: str
    topology: MeterTopology
    configuration: MeterConfigurationRequest
    ct_inventory: CTInventory
    voltage_topology: VoltageReferenceTopology
    capabilities: MeterConfigurationCapabilities
    voltage_transformer_catalog: VoltageTransformerCatalog
    warnings: tuple[str, ...]

    @property
    def ct_catalog(self) -> CTPresetCatalog:
        """Expose the existing CT catalog without duplicating it in the handle."""
        return self.ct_inventory.catalog

    @classmethod
    def from_document(
        cls,
        document: ESPHomeConfigDocument,
        topology: MeterTopology,
        ct_catalog: CTPresetCatalog,
        voltage_transformer_catalog: VoltageTransformerCatalog,
        config_sha256: str,
        *,
        stored_configuration: StoredMeterConfiguration | None = None,
        stored_ct_selections: Iterable[StoredCTSelection] = (),
        reporting_multipliers: Mapping[int, float] | None = None,
        configuration_authoritative: bool = True,
        stored_semantics_stale: bool = False,
    ) -> MeterConfigurationInventory:
        """Merge current YAML with hash-bound semantics and explicit legacy defaults."""
        ct_inventory = CTInventory.from_document(
            document,
            topology,
            ct_catalog,
            config_sha256,
            stored_ct_selections,
            reporting_multipliers,
        )
        capabilities = meter_configuration_capabilities(
            configuration_authoritative=configuration_authoritative,
            config_contract=_contract(document),
        )
        matching = (
            stored_configuration
            if stored_configuration is not None
            and stored_configuration.config_sha256 == config_sha256
            else None
        )
        configuration = _legacy_request(document, topology, ct_inventory)
        voltage_topology = voltage_reference_topology_from_legacy(topology)
        stale = stored_semantics_stale or (
            stored_configuration is not None and matching is None
        )
        if matching is not None:
            try:
                configuration = _stored_request(
                    matching, document, topology, ct_inventory
                )
                validate_meter_configuration(configuration, topology)
                voltage_topology = voltage_reference_topology_from_configuration(
                    topology, configuration
                )
            except (TypeError, ValueError):
                configuration = _legacy_request(document, topology, ct_inventory)
                voltage_topology = voltage_reference_topology_from_legacy(topology)
                stale = True
        warnings = list(capabilities.reason_codes)
        if configuration.meter.electrical_system is ElectricalSystem.CUSTOM:
            warnings.append("electrical_profile_requires_confirmation")
        if _has_generic_total(document):
            warnings.append("legacy_generic_totals_unmanaged")
        if stale:
            warnings.append("stored_semantics_stale")
        return cls(
            config_sha256,
            topology,
            configuration,
            ct_inventory,
            voltage_topology,
            capabilities,
            voltage_transformer_catalog,
            tuple(warnings),
        )


def _contract(document: ESPHomeConfigDocument) -> int | None:
    scalar = document.substitutions.get("csemh_config_contract")
    return int(scalar.value) if scalar is not None else None


def _stored_request(
    stored: StoredMeterConfiguration,
    document: ESPHomeConfigDocument,
    topology: MeterTopology,
    ct_inventory: CTInventory,
) -> MeterConfigurationRequest:
    references = _stored_voltage_references(stored, document, topology)
    stored_by_channel = _stored_channels_by_number(stored.channels, topology)
    channels: list[ChannelSettings] = []
    for channel in ct_inventory.channels:
        stored_channel = stored_by_channel[channel.channel]
        channels.append(
            replace(
                stored_channel,
                name=channel.name,
                reporting_multiplier=channel.reporting_multiplier,
                custom_gain_ct=(
                    channel.raw_gain_ct if stored_channel.model_id == "custom" else None
                ),
                custom_label=(
                    channel.name if stored_channel.model_id == "custom" else None
                ),
            )
        )
    return MeterConfigurationRequest(
        replace(
            stored.meter,
            friendly_name=_value(document, "friendly_name", stored.meter.friendly_name),
            line_frequency_hz=cast(
                LineFrequencyHz,
                int(
                    _value(
                        document,
                        "electric_freq",
                        f"{stored.meter.line_frequency_hz}Hz",
                    ).removesuffix("Hz")
                ),
            ),
            update_interval_s=cast(
                UpdateIntervalSeconds,
                int(
                    _value(
                        document,
                        "update_time",
                        f"{stored.meter.update_interval_s}s",
                    ).removesuffix("s")
                ),
            ),
            voltage_references=references,
        ),
        tuple(channels),
        stored.aggregates,
        stored.power_quality,
        stored.status_fields,
        multi_reference_preparation_acknowledged=(
            len(stored.meter.voltage_references) > 1
        ),
    )


def _stored_voltage_references(
    stored: StoredMeterConfiguration,
    document: ESPHomeConfigDocument,
    topology: MeterTopology,
) -> tuple[VoltageReferenceConfig, ...]:
    gain_key_by_group = {
        group: f"voltage_cal{index + 1}"
        for index, (_, groups) in enumerate(
            voltage_reference_topology_from_legacy(topology).references
        )
        for group in groups
    }
    references: list[VoltageReferenceConfig] = []
    for reference in stored.meter.voltage_references:
        gain_keys = {gain_key_by_group.get(group) for group in reference.group_keys}
        if len(gain_keys) != 1:
            raise ValueError("stored voltage reference has ambiguous calibration")
        gain_key = next(iter(gain_keys))
        if gain_key is None:
            raise ValueError("stored voltage reference has ambiguous calibration")
        references.append(
            replace(reference, gain_voltage=_gain(document, gain_key, reference.gain_voltage))
        )
    return tuple(references)


def _legacy_request(
    document: ESPHomeConfigDocument, topology: MeterTopology, ct_inventory: CTInventory
) -> MeterConfigurationRequest:
    voltage_topology = voltage_reference_topology_from_legacy(topology)
    references = tuple(
        VoltageReferenceConfig(
            reference_id,
            reference_id.replace("_", " ").title(),
            chr(ord("A") + index),
            120.0,
            "custom",
            _gain(document, f"voltage_cal{index + 1}"),
            groups,
        )
        for index, (reference_id, groups) in enumerate(voltage_topology.references)
    )
    channel_settings = tuple(
        ChannelSettings(
            channel.channel,
            True,
            channel.name,
            channel.selected_model_id or "custom",
            channel.reporting_multiplier,
            CircuitRole.CUSTOM,
            _reference_for_channel(channel.channel, topology, voltage_topology),
            channel.raw_gain_ct if channel.selected_model_id is None else None,
            channel.name if channel.selected_model_id is None else None,
        )
        for channel in ct_inventory.channels
    )
    package_options = package_options_from_document(document, topology)
    request = MeterConfigurationRequest(
        MeterSettings(
            _value(document, "friendly_name", "Energy meter"),
            ElectricalSystem.CUSTOM,
            cast(
                LineFrequencyHz,
                int(_value(document, "electric_freq", "60Hz").removesuffix("Hz")),
            ),
            cast(
                UpdateIntervalSeconds,
                int(_value(document, "update_time", "5s").removesuffix("s")),
            ),
            VoltageLayout.MULTI_REFERENCE
            if len(references) > 1
            else VoltageLayout.STANDARD,
            references,
        ),
        channel_settings,
        (),
        package_options["power_quality"],
        package_options["status_fields"],
        multi_reference_preparation_acknowledged=len(references) > 1,
    )
    validate_meter_configuration(request, topology)
    return request


def _value(document: ESPHomeConfigDocument, key: str, default: str) -> str:
    scalar = document.substitutions.get(key)
    return scalar.value if scalar is not None else default


def _gain(document: ESPHomeConfigDocument, key: str, default: int = 1) -> int:
    try:
        gain = int(_value(document, key, str(default)))
    except ValueError as error:
        raise ValueError(f"invalid gain for {key}") from error
    if not 1 <= gain <= 65535:
        raise ValueError(f"invalid gain for {key}")
    return gain


def _reference_for_channel(
    channel: int, topology: MeterTopology, voltage_topology: VoltageReferenceTopology
) -> str:
    address = channel_address(channel, topology)
    prefix = "main" if address.board_index == 0 else f"addon{address.board_index}"
    group = f"{prefix}_{address.group_index + 1}"
    return next(
        reference_id
        for reference_id, groups in voltage_topology.references
        if group in groups
    )


def _stored_channels_by_number(
    channels: tuple[ChannelSettings, ...], topology: MeterTopology
) -> dict[int, ChannelSettings]:
    stored_by_channel: dict[int, ChannelSettings] = {}
    for channel in channels:
        if (
            channel.channel not in range(1, topology.ct_count + 1)
            or channel.channel in stored_by_channel
        ):
            raise ValueError("stored channels must uniquely cover topology")
        stored_by_channel[channel.channel] = channel
    if set(stored_by_channel) != set(range(1, topology.ct_count + 1)):
        raise ValueError("stored channels must uniquely cover topology")
    return stored_by_channel


def _has_generic_total(document: ESPHomeConfigDocument) -> bool:
    return any(
        _GENERIC_TOTAL_ID.fullmatch(line.split("#", 1)[0].rstrip())
        for line in document.lines
    )
