"""Firmware-backed complete meter configuration inventory."""

from __future__ import annotations

import json
import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, replace
from hashlib import sha256
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
from .models import (
    VOLTAGE_REFERENCE_GROUP_RE,
    MeterTopology,
    StoredCTSelection,
    VoltageReferenceTopology,
)
from .store import StoredMeterConfiguration
from .topology import (
    TopologyFingerprintMismatch,
    channel_address,
    voltage_reference_topology_from_config,
    voltage_reference_topology_from_configuration,
    voltage_reference_topology_from_legacy,
)
from .voltage_transformer_catalog import VoltageTransformerCatalog

_GENERIC_TOTAL_ID = re.compile(
    r"^\s*(?:-\s*)?id:\s*[\"']?(?:totalAmps|totalWatts|totalEnergyDaily)[\"']?\s*$"
)


class VoltageReferenceMismatchError(ValueError):
    """Hash-bound stored voltage references disagree with owned YAML evidence."""


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

    plan_id: str
    source_sha256: str
    topology: MeterTopology
    configuration: MeterConfigurationRequest
    capabilities: MeterConfigurationCapabilities
    voltage_transformer_catalog: VoltageTransformerCatalog
    ct_catalog: CTPresetCatalog
    warnings: tuple[str, ...]
    ct_inventory: CTInventory
    voltage_topology: VoltageReferenceTopology

    @classmethod
    def from_document(
        cls,
        plan_id: str,
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
        actual_sha256 = sha256(document.content.encode()).hexdigest()
        ct_inventory = CTInventory.from_document(
            document,
            topology,
            ct_catalog,
            actual_sha256,
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
            and config_sha256 == actual_sha256
            and stored_configuration.config_sha256 == actual_sha256
            else None
        )
        configuration = _legacy_request(document, topology, ct_inventory)
        voltage_topology = voltage_reference_topology_from_legacy(topology)
        stale = stored_semantics_stale or (
            stored_configuration is not None and matching is None
        )
        if (
            stored_configuration is not None
            and matching is None
            and "voltage_references" in document.managed_blocks
        ):
            try:
                _validate_managed_voltage_reference_gains(
                    stored_configuration, document, topology, report_gain_mismatch=True
                )
            except VoltageReferenceMismatchError:
                raise
            except (TypeError, ValueError):
                pass
        if matching is not None:
            try:
                configuration = _stored_request(
                    matching, document, topology, ct_inventory
                )
                validate_meter_configuration(
                    configuration,
                    topology,
                    require_multi_reference_acknowledgement=False,
                )
                voltage_topology = voltage_reference_topology_from_configuration(
                    topology, configuration
                )
            except VoltageReferenceMismatchError:
                raise
            except (TypeError, ValueError):
                configuration = _legacy_request(document, topology, ct_inventory)
                voltage_topology = voltage_reference_topology_from_legacy(topology)
                stale = True
        warnings = list(capabilities.reason_codes)
        if configuration.meter.electrical_system is ElectricalSystem.CUSTOM:
            warnings.append("electrical_profile_requires_confirmation")
        if _has_generic_total(document) and not capabilities.managed_totals:
            warnings.append("legacy_generic_totals_unmanaged")
        if stale:
            warnings.append("stored_semantics_stale")
        if configuration.meter.update_interval_s in (30, 60):
            warnings.append("slow_interval_extends_calibration")
        return cls(
            plan_id=plan_id,
            source_sha256=actual_sha256,
            topology=topology,
            configuration=configuration,
            capabilities=capabilities,
            voltage_transformer_catalog=voltage_transformer_catalog,
            ct_catalog=ct_catalog,
            warnings=tuple(warnings),
            ct_inventory=ct_inventory,
            voltage_topology=voltage_topology,
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
                custom_label=stored_channel.custom_label,
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
        stored.multi_reference_preparation_acknowledged,
    )


def _stored_voltage_references(
    stored: StoredMeterConfiguration,
    document: ESPHomeConfigDocument,
    topology: MeterTopology,
) -> tuple[VoltageReferenceConfig, ...]:
    block = document.managed_blocks.get("voltage_references")
    if block is not None:
        _validate_managed_voltage_reference_gains(stored, document, topology)
        return stored.meter.voltage_references
    references: list[VoltageReferenceConfig] = []
    for reference in stored.meter.voltage_references:
        groups = tuple(
            group
            for group in reference.group_keys
            if VOLTAGE_REFERENCE_GROUP_RE.fullmatch(group) is not None
        )
        if len(groups) != len(reference.group_keys):
            raise ValueError("stored voltage reference has ambiguous calibration")
        gains = {
            _gain(document, f"voltage_cal{group[-1]}", reference.gain_voltage)
            for group in groups
        }
        if len(gains) != 1:
            raise ValueError("stored voltage reference has ambiguous calibration")
        references.append(
            replace(reference, gain_voltage=gains.pop())
        )
    return tuple(references)


def _validate_managed_voltage_reference_gains(
    stored: StoredMeterConfiguration,
    document: ESPHomeConfigDocument,
    topology: MeterTopology,
    *,
    report_gain_mismatch: bool = False,
) -> None:
    """Accept stored gains only when their hash-bound owned block still has them."""
    block = document.managed_blocks["voltage_references"]
    sensor = document.writable_sensor_span
    if sensor is None or not (
        sensor.start <= block.span.start and block.span.end <= sensor.end
    ):
        raise ValueError("managed voltage references are not safely owned")
    expected = voltage_reference_topology_from_configuration(topology, stored)
    try:
        actual = voltage_reference_topology_from_config(
            document, topology, trusted_fingerprint=expected.fingerprint
        )
    except TopologyFingerprintMismatch as error:
        raise VoltageReferenceMismatchError(
            "managed voltage references disagree with stored configuration"
        ) from error
    if actual.fingerprint != expected.fingerprint:
        raise ValueError("managed voltage references are not verified")
    lines = block.content.replace("\r\n", "\n").splitlines()
    items = _managed_voltage_items(lines, document.sensor_item_indent)
    for reference in stored.meter.voltage_references:
        representative = min(reference.group_keys, key=_managed_group_order)
        for group in reference.group_keys:
            meter_id = _managed_meter_id(group, document)
            item = items.pop(meter_id, None)
            if item is None:
                raise ValueError("managed voltage reference gains are ambiguous")
            _validate_managed_voltage_item(
                item, reference, group == representative, report_gain_mismatch
            )
    if items:
        raise ValueError("managed voltage reference gains are ambiguous")


def _managed_voltage_items(
    lines: list[str], item_indent: int | None
) -> dict[str, list[str]]:
    """Return exact direct meter items from the helper-owned sensor block."""
    if item_indent == 0:
        lines = [f"  {line}" if line else line for line in lines]
    headers: list[tuple[str, int]] = []
    for index, line in enumerate(lines):
        code = _managed_code(line)
        if not code.strip():
            continue
        if _ambiguous_managed_yaml(code):
            raise ValueError("managed voltage references are ambiguous")
        if code.startswith("  - "):
            match = re.fullmatch(r"  - id: !extend (?P<id>[^\s]+)", code)
            if match is None:
                raise ValueError("managed voltage reference item is invalid")
            headers.append((match["id"], index))
        elif not headers or len(code) - len(code.lstrip(" ")) <= 2:
            raise ValueError("managed voltage reference item is invalid")
    items: dict[str, list[str]] = {}
    for item_index, (meter_id, start) in enumerate(headers):
        end = headers[item_index + 1][1] if item_index + 1 < len(headers) else len(lines)
        if meter_id in items:
            raise ValueError("managed voltage reference gains are ambiguous")
        items[meter_id] = lines[start + 1 : end]
    return items


def _validate_managed_voltage_item(
    lines: list[str],
    reference: VoltageReferenceConfig,
    representative: bool,
    report_gain_mismatch: bool,
) -> None:
    expected_keys = {"phase_a", "phase_b", "phase_c"}
    if representative:
        expected_keys.add("frequency")
    entries = _managed_mappings(lines, 4)
    if set(entries) != expected_keys or any(value for value, _ in entries.values()):
        raise ValueError("managed voltage reference item is invalid")
    for phase in "abc":
        _validate_managed_voltage_phase(
            entries[f"phase_{phase}"][1],
            reference,
            not representative or phase == "a",
            representative and phase == "a",
            report_gain_mismatch,
        )
    if representative:
        _validate_managed_fields(
            entries["frequency"][1],
            6,
            {
                "name": json.dumps(
                    f"${{friendly_name}} {reference.label} Frequency"
                ),
                "disabled_by_default": "false",
            },
        )


def _validate_managed_voltage_phase(
    lines: list[str],
    reference: VoltageReferenceConfig,
    voltage_expected: bool,
    visible_voltage: bool,
    report_gain_mismatch: bool,
) -> None:
    expected_keys = {"gain_voltage"}
    if voltage_expected:
        expected_keys.add("voltage")
    entries = _managed_mappings(lines, 6)
    if (
        set(entries) != expected_keys
        or not _managed_body_is_empty(entries["gain_voltage"][1])
    ):
        raise ValueError("managed voltage reference gain is invalid")
    if entries["gain_voltage"][0] != str(reference.gain_voltage):
        if report_gain_mismatch:
            raise VoltageReferenceMismatchError(
                "managed voltage references disagree with stored configuration"
            )
        raise ValueError("managed voltage reference gain is invalid")
    if voltage_expected:
        expected_fields = (
            {
                "name": json.dumps(
                    f"${{friendly_name}} {reference.label} Voltage"
                ),
                "disabled_by_default": "false",
            }
            if visible_voltage
            else {
                "entity_category": "diagnostic",
                "disabled_by_default": "true",
            }
        )
        _validate_managed_fields(entries["voltage"][1], 8, expected_fields)


def _validate_managed_fields(
    lines: list[str], indent: int, expected: dict[str, str]
) -> None:
    entries = _managed_mappings(lines, indent)
    if (
        set(entries) != set(expected)
        or any(
            entries[key][0] != value or not _managed_body_is_empty(entries[key][1])
            for key, value in expected.items()
        )
    ):
        raise ValueError("managed voltage reference fields are invalid")


def _managed_mappings(lines: list[str], indent: int) -> dict[str, tuple[str, list[str]]]:
    entries: dict[str, tuple[str, list[str]]] = {}
    index = 0
    while index < len(lines):
        line = lines[index]
        code = _managed_code(line)
        if not code.strip():
            index += 1
            continue
        if _ambiguous_managed_yaml(code):
            raise ValueError("managed voltage references are ambiguous")
        if len(code) - len(code.lstrip(" ")) != indent:
            raise ValueError("managed voltage reference structure is invalid")
        match = re.fullmatch(
            rf" {' ' * (indent - 1)}(?P<key>[a-z][a-z0-9_]*):(?P<value>.*)", code
        )
        if match is None or match["key"] in entries:
            raise ValueError("managed voltage reference structure is invalid")
        end = index + 1
        while end < len(lines):
            candidate = lines[end]
            candidate_code = _managed_code(candidate)
            if candidate_code.strip() and (
                len(candidate_code) - len(candidate_code.lstrip(" "))
            ) <= indent:
                break
            end += 1
        entries[match["key"]] = (match["value"].strip(), lines[index + 1 : end])
        index = end
    return entries


def _managed_body_is_empty(lines: list[str]) -> bool:
    return not any(_managed_code(line).strip() for line in lines)


def _managed_code(line: str) -> str:
    quote: str | None = None
    index = 0
    while index < len(line):
        character = line[index]
        if quote is not None:
            if quote == '"' and character == "\\":
                index += 2
                continue
            if character == quote:
                if quote == "'" and line[index + 1 : index + 2] == "'":
                    index += 2
                    continue
                quote = None
        elif character in {"'", '"'}:
            quote = character
        elif character == "#" and (index == 0 or line[index - 1].isspace()):
            return line[:index].rstrip()
        index += 1
    return line.rstrip()


def _ambiguous_managed_yaml(line: str) -> bool:
    stripped = line.lstrip()
    lexical = re.sub(r'"(?:[^"\\]|\\.)*"|\'(?:[^\']|\'\')*\'', '""', stripped)
    if lexical.startswith("- id: !extend "):
        return False
    return (
        re.search(r"(?:^|[\s\-\[\{,])(?:\?|<<:|[&*!][^\s]+)", lexical)
        is not None
    )


def _managed_group_order(group: str) -> tuple[int, int]:
    board, number = group.rsplit("_", 1)
    return (0 if board == "main" else int(board.removeprefix("addon")), int(number))


def _managed_meter_id(group: str, document: ESPHomeConfigDocument) -> str:
    board, group_number = group.rsplit("_", 1)
    meter_key = (
        f"main_meter_id{group_number}"
        if board == "main"
        else f"{board}_id{group_number}"
    )
    if meter_key in document.substitutions:
        return f"${{{meter_key}}}"
    if board == "main":
        return f"meter_main{group_number}"
    return f"{board}_{group_number}"


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
    )
    validate_meter_configuration(
        request, topology, require_multi_reference_acknowledgement=False
    )
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
