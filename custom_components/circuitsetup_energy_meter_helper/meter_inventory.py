"""Firmware-backed complete meter configuration inventory."""

from __future__ import annotations

import json
import re
from base64 import urlsafe_b64decode
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, replace
from hashlib import sha256
from typing import Literal, cast

from .config_document import ESPHomeConfigDocument
from .config_mutator import package_options_from_document
from .ct_catalog import CTPresetCatalog
from .ct_inventory import CTInventory
from .meter_configuration import (
    ChannelSettings,
    CircuitAggregate,
    CircuitRole,
    ElectricalSystem,
    EnergyMode,
    LineFrequencyHz,
    MeasurementMethod,
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
    addon_count_from_packages,
    channel_address,
    voltage_reference_topology_from_config,
    voltage_reference_topology_from_configuration,
    voltage_reference_topology_from_legacy,
)
from .voltage_transformer_catalog import VoltageTransformerCatalog

_GENERIC_TOTAL_ID = re.compile(
    r"^\s*(?:-\s*)?id:\s*(?:!extend\s+)?[\"']?"
    r"(?P<id>totalAmps|totalWatts|totalEnergyDaily)[\"']?\s*$"
)
_LEGACY_TOTAL_ID = re.compile(
    r"^total(?P<label>[A-Za-z0-9_]{0,48}?)(?P<kind>Watts|Amps)$"
)
_AGGREGATE_METADATA_PREFIX = "# csemh-aggregate: "
_AGGREGATE_METADATA_KEYS = {
    "aggregate_id", "name", "role", "channels", "measurement_method",
    "parent_id", "energy_mode", "expose_power", "expose_current", "order",
}

ConfigurationSemanticSource = Literal["helper_managed", "legacy_inferred"]


class VoltageReferenceMismatchError(ValueError):
    """Hash-bound stored voltage references disagree with owned YAML evidence."""


@dataclass(frozen=True, slots=True)
class MeterConfigurationCapabilities:
    """The configuration writes supported by an authoritative firmware contract."""

    configuration_authoritative: bool
    managed_totals: bool
    multi_reference: bool
    semantic_source: ConfigurationSemanticSource
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
            False,
            False,
            False,
            "legacy_inferred",
            ("configuration_not_authoritative",),
        )
    if config_contract == 2:
        return MeterConfigurationCapabilities(True, True, True, "legacy_inferred", ())
    return MeterConfigurationCapabilities(
        True, False, True, "legacy_inferred", ("config_contract_upgrade_required",)
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
        semantic_source: ConfigurationSemanticSource = "legacy_inferred"
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
                semantic_source = "helper_managed"
                voltage_topology = voltage_reference_topology_from_configuration(
                    topology, configuration
                )
            except VoltageReferenceMismatchError:
                raise
            except (TypeError, ValueError):
                configuration = _legacy_request(document, topology, ct_inventory)
                voltage_topology = voltage_reference_topology_from_legacy(topology)
                stale = True
        aggregates, aggregate_warnings = _detected_aggregates(
            document, configuration.channels, configuration.aggregates
        )
        configuration = replace(configuration, aggregates=aggregates)
        try:
            validate_meter_configuration(
                configuration,
                topology,
                require_multi_reference_acknowledgement=False,
            )
        except (TypeError, ValueError):
            if not configuration.aggregates:
                raise
            configuration = replace(configuration, aggregates=())
            validate_meter_configuration(
                configuration,
                topology,
                require_multi_reference_acknowledgement=False,
            )
            aggregate_warnings = tuple(
                dict.fromkeys((*aggregate_warnings, "aggregate_semantics_unreadable"))
            )
        capabilities = replace(capabilities, semantic_source=semantic_source)
        warnings = [*capabilities.reason_codes, *aggregate_warnings]
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
            CircuitRole.BRANCH,
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
                int(_value(document, "update_time", "10s").removesuffix("s")),
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


def _detected_aggregates(
    document: ESPHomeConfigDocument,
    channels: tuple[ChannelSettings, ...],
    stored: tuple[CircuitAggregate, ...],
) -> tuple[tuple[CircuitAggregate, ...], tuple[str, ...]]:
    block = document.managed_blocks.get("aggregates")
    detected: tuple[CircuitAggregate, ...] = ()
    warnings: tuple[str, ...] = ()
    if block is not None:
        try:
            decoded = _decode_aggregate_block(document, channels)
            metadata = _aggregate_metadata(block.content)
            if metadata is not None:
                if not _metadata_matches_rendered(metadata, decoded):
                    raise ValueError("aggregate metadata does not match rendered sensors")
                detected = metadata
            elif stored:
                detected = stored
            else:
                detected = decoded
                warnings = (("aggregate_semantics_inferred",) if decoded else ())
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            return (), ("aggregate_semantics_unreadable",)
    elif stored:
        detected = stored

    total_ids = _generic_total_ids(document)
    enabled = tuple(channel.channel for channel in channels if channel.enabled)
    default_groups = _default_total_groups(document, channels)
    if (total_ids or default_groups) and not enabled:
        return (), ("builtin_total_semantics_unreadable",)
    energy_power_ids = _default_daily_energy_power_ids(document)
    legacy, parent_links = _legacy_aggregates(
        document, channels, default_groups, energy_power_ids
    )
    defaults: list[CircuitAggregate] = []
    expose_power = "totalWatts" in total_ids
    expose_current = "totalAmps" in total_ids
    energy_mode = (
        EnergyMode.CONSUMPTION
        if "totalWatts" in energy_power_ids
        else EnergyMode.NONE
    )
    if expose_power or expose_current or energy_mode is not EnergyMode.NONE:
        defaults.append(
            CircuitAggregate(
                "meter-total",
                "Meter total",
                CircuitRole.CUSTOM,
                enabled,
                MeasurementMethod.DIRECT,
                None,
                energy_mode,
                expose_power,
                expose_current,
            )
        )
    defaults.extend(
        CircuitAggregate(
            f"{group_id}-total",
            f"{label} total",
            CircuitRole.CUSTOM,
            group_channels,
            MeasurementMethod.DIRECT,
            None,
            (
                EnergyMode.CONSUMPTION
                if power_id in energy_power_ids
                else EnergyMode.NONE
            ),
            False,
            False,
        )
        for group_id, label, group_channels, power_id in default_groups
    )
    existing_ids = {aggregate.aggregate_id for aggregate in detected}
    inferred = (*legacy, *(
        aggregate for aggregate in defaults
        if aggregate.aggregate_id not in {item.aggregate_id for item in legacy}
    ))
    added = tuple(aggregate for aggregate in inferred if aggregate.aggregate_id not in existing_ids)
    if added:
        warnings = tuple(dict.fromkeys((*warnings, "builtin_total_semantics_inferred")))
    aggregates = tuple(
        replace(aggregate, parent_id=parent_links[aggregate.aggregate_id])
        if aggregate.parent_id is None and aggregate.aggregate_id in parent_links
        else aggregate
        for aggregate in (*detected, *added)
    )
    return aggregates, warnings


def _aggregate_metadata(content: str) -> tuple[CircuitAggregate, ...] | None:
    payloads = [
        line.strip()[len(_AGGREGATE_METADATA_PREFIX) :]
        for line in content.replace("\r\n", "\n").splitlines()
        if line.strip().startswith(_AGGREGATE_METADATA_PREFIX)
    ]
    if not payloads:
        return None
    aggregates: list[tuple[int, CircuitAggregate]] = []
    for payload in payloads:
        data = json.loads(
            urlsafe_b64decode(payload + "=" * (-len(payload) % 4)).decode()
        )
        if not isinstance(data, dict) or set(data) != _AGGREGATE_METADATA_KEYS:
            raise ValueError("aggregate metadata has unexpected fields")
        if any(
            type(data[key]) is not str
            for key in (
                "aggregate_id",
                "name",
                "role",
                "measurement_method",
                "energy_mode",
            )
        ):
            raise TypeError("aggregate metadata text fields are invalid")
        if data["parent_id"] is not None and type(data["parent_id"]) is not str:
            raise TypeError("aggregate metadata parent is invalid")
        channels = data["channels"]
        if not isinstance(channels, list) or any(type(item) is not int for item in channels):
            raise TypeError("aggregate metadata channels are invalid")
        if type(data["expose_power"]) is not bool or type(data["expose_current"]) is not bool:
            raise TypeError("aggregate metadata exposure flags are invalid")
        if type(data["order"]) is not int or data["order"] < 0:
            raise TypeError("aggregate metadata order is invalid")
        aggregates.append(
            (
                data["order"],
                CircuitAggregate(
                    data["aggregate_id"],
                    data["name"],
                    CircuitRole(data["role"]),
                    tuple(channels),
                    MeasurementMethod(data["measurement_method"]),
                    data["parent_id"],
                    EnergyMode(data["energy_mode"]),
                    data["expose_power"],
                    data["expose_current"],
                ),
            )
        )
    if {order for order, _aggregate in aggregates} != set(range(len(aggregates))):
        raise ValueError("aggregate metadata order is incomplete")
    return tuple(aggregate for _order, aggregate in sorted(aggregates))


def _decode_aggregate_block(
    document: ESPHomeConfigDocument, channels: tuple[ChannelSettings, ...]
) -> tuple[CircuitAggregate, ...]:
    block = document.managed_blocks["aggregates"]
    items = _managed_sensor_items(block.content, document.sensor_item_indent)
    channel_roles = {channel.channel: channel.role for channel in channels}
    aggregates: list[CircuitAggregate] = []
    for item in items:
        sensor_id = item.get("id", "")
        if not sensor_id.startswith("csemh_") or not sensor_id.endswith("_power"):
            continue
        base = sensor_id[6:-6]
        if base.endswith(("_import", "_export")):
            continue
        if not re.fullmatch(r"[a-z0-9_]+", base):
            raise ValueError("aggregate sensor ID is invalid")
        if item.get("platform") != "template" or item.get("unit_of_measurement") != "W" or item.get("device_class") != "power" or item.get("update_interval") != "${update_time}":
            raise ValueError("aggregate power sensor is invalid")
        aggregate_channels, method, clamped = _aggregate_expression(item.get("lambda", ""))
        roles = {channel_roles.get(channel) for channel in aggregate_channels}
        role = roles.pop() if len(roles) == 1 else CircuitRole.CUSTOM
        if role is None or role is CircuitRole.UNUSED:
            role = CircuitRole.CUSTOM
        prefix = f"csemh_{base}_"
        related = {candidate.get("id", ""): candidate for candidate in items if candidate.get("id", "").startswith(prefix)}
        name = _aggregate_name(item, related)
        bidirectional = all(
            f"{prefix}{suffix}" in related
            for suffix in ("import_power", "import_energy", "export_power", "export_energy")
        )
        has_energy = f"{prefix}energy" in related
        energy_mode = (
            EnergyMode.BIDIRECTIONAL
            if bidirectional
            else EnergyMode.GENERATION
            if has_energy and role is CircuitRole.SOLAR
            else EnergyMode.CONSUMPTION
            if has_energy or clamped
            else EnergyMode.NONE
        )
        aggregates.append(
            CircuitAggregate(
                base.replace("_", "-"),
                name,
                role,
                aggregate_channels,
                method,
                None,
                energy_mode,
                item.get("internal") != "true",
                f"{prefix}current" in related
                and related[f"{prefix}current"].get("internal") != "true",
            )
        )
    return tuple(aggregates)


def _managed_sensor_items(content: str, item_indent: int | None) -> list[dict[str, str]]:
    indent = 2 if item_indent is None else item_indent
    lines = content.replace("\r\n", "\n").splitlines()
    prefix = " " * indent + "- "
    starts = [index for index, line in enumerate(lines) if line.startswith(prefix)]
    items: list[dict[str, str]] = []
    for position, start in enumerate(starts):
        end = starts[position + 1] if position + 1 < len(starts) else len(lines)
        fields: dict[str, str] = {}
        for line in lines[start:end]:
            candidate = line[len(prefix) :] if line.startswith(prefix) else line[indent + 2 :] if line.startswith(" " * (indent + 2)) and not line.startswith(" " * (indent + 4)) else ""
            if not candidate or ":" not in candidate:
                continue
            key, value = candidate.split(":", 1)
            if not re.fullmatch(r"[a-z][a-z0-9_]*", key) or key in fields:
                raise ValueError("aggregate sensor item is invalid")
            fields[key] = value.strip()
        items.append(fields)
    return items


def _aggregate_expression(value: str) -> tuple[tuple[int, ...], MeasurementMethod, bool]:
    if not value.startswith("return ") or not value.endswith(";"):
        raise ValueError("aggregate lambda is invalid")
    expression = value[7:-1]
    clamp_prefix = "std::max(0.0f, "
    clamped = expression.startswith(clamp_prefix) and expression.endswith(")")
    if clamped:
        expression = expression[len(clamp_prefix) : -1]
    doubled = expression.endswith(" * 2.0")
    if doubled:
        expression = expression[:-6]
    matches = re.findall(r"id\(ct([1-9][0-9]*)Watts\)\.state", expression)
    expected = " + ".join(f"id(ct{channel}Watts).state" for channel in matches)
    if not matches or expression != expected:
        raise ValueError("aggregate lambda is not a supported CT sum")
    channels = tuple(int(channel) for channel in matches)
    method = (
        MeasurementMethod.ONE_CT_DOUBLE_POWER
        if doubled
        else MeasurementMethod.TWO_CT_SUM
        if len(channels) == 2
        else MeasurementMethod.DIRECT
    )
    return channels, method, clamped


def _aggregate_name(item: dict[str, str], related: Mapping[str, dict[str, str]]) -> str:
    values = [item.get("name"), *(candidate.get("name") for candidate in related.values())]
    suffixes = (
        " Return to Grid Power",
        " Import Power",
        " Current",
        " Energy",
        " Power",
    )
    for value in values:
        if not value:
            continue
        decoded = json.loads(value)
        if not isinstance(decoded, str) or not decoded.startswith("${friendly_name} "):
            continue
        for suffix in suffixes:
            if decoded.endswith(suffix):
                return decoded[len("${friendly_name} ") : -len(suffix)]
    raise ValueError("aggregate name is unavailable")


def _metadata_matches_rendered(
    metadata: tuple[CircuitAggregate, ...], rendered: tuple[CircuitAggregate, ...]
) -> bool:
    by_id = {aggregate.aggregate_id: aggregate for aggregate in rendered}
    if len(by_id) != len(metadata):
        return False
    for aggregate in metadata:
        actual = by_id.get(aggregate.aggregate_id.replace("_", "-"))
        if actual is None or (
            aggregate.name,
            aggregate.channels,
            aggregate.expose_power,
            aggregate.expose_current,
        ) != (
            actual.name,
            actual.channels,
            actual.expose_power,
            actual.expose_current,
        ):
            return False
        if aggregate.measurement_method != actual.measurement_method and {
            aggregate.measurement_method, actual.measurement_method
        } != {MeasurementMethod.DIRECT, MeasurementMethod.BOTH_CONDUCTORS_ONE_CT}:
            return False
        if aggregate.energy_mode != actual.energy_mode and {
            aggregate.energy_mode, actual.energy_mode
        } != {EnergyMode.CONSUMPTION, EnergyMode.GENERATION}:
            return False
    return True


def _generic_total_ids(document: ESPHomeConfigDocument) -> frozenset[str]:
    return frozenset(
        match["id"]
        for line in document.code_lines
        if (match := _GENERIC_TOTAL_ID.fullmatch(line.rstrip())) is not None
    )


def _default_total_groups(
    document: ESPHomeConfigDocument, channels: tuple[ChannelSettings, ...]
) -> tuple[tuple[str, str, tuple[int, ...], str], ...]:
    addon_count = addon_count_from_packages(document.package_files)
    if addon_count is None:
        return ()
    enabled = {channel.channel for channel in channels if channel.enabled}
    groups = []
    for board in range(addon_count + 1):
        suffix = "Main" if board == 0 else f"AddOn{board}"
        group_channels = tuple(
            channel for channel in range(board * 6 + 1, board * 6 + 7)
            if channel in enabled
        )
        if group_channels:
            groups.append(
                (
                    "main" if board == 0 else f"addon{board}",
                    "Main" if board == 0 else f"Add-on {board}",
                    group_channels,
                    f"totalWatts{suffix}",
                )
            )
    return tuple(groups)


def _default_daily_energy_power_ids(
    document: ESPHomeConfigDocument,
) -> frozenset[str]:
    matches = [
        _plain_sensor_scalar(item.get("power_id", ""))
        for item in _root_sensor_items(document)
        if _plain_sensor_scalar(item.get("platform", "")) == "total_daily_energy"
        and _plain_sensor_scalar(item.get("id", "")) == "totalEnergyDaily"
        and _plain_sensor_scalar(item.get("unit_of_measurement", "")) == "kWh"
    ]
    return frozenset(matches) if len(matches) == 1 and matches[0] else frozenset()


def _root_sensor_items(
    document: ESPHomeConfigDocument,
) -> tuple[dict[str, str], ...]:
    lines = document.code_lines
    roots = [
        index
        for index, line in enumerate(lines)
        if re.fullmatch(r"sensor\s*:\s*", line)
    ]
    items: list[dict[str, str]] = []
    for root in roots:
        end = next(
            (
                index
                for index in range(root + 1, len(lines))
                if re.match(r"^[A-Za-z_][A-Za-z0-9_-]*\s*:", lines[index])
            ),
            len(lines),
        )
        candidates = [
            (index, match)
            for index in range(root + 1, end)
            if (match := re.fullmatch(
                r"(?P<indent> *)-\s+(?P<key>[a-z][a-z0-9_]*):\s*(?P<value>.*)",
                lines[index],
            )) is not None
        ]
        if not candidates:
            continue
        item_indent = min(len(match["indent"]) for _index, match in candidates)
        starts = [
            (index, match)
            for index, match in candidates
            if len(match["indent"]) == item_indent
        ]
        for position, (start, match) in enumerate(starts):
            stop = starts[position + 1][0] if position + 1 < len(starts) else end
            fields = {match["key"]: match["value"].strip()}
            for line in lines[start + 1 : stop]:
                field = re.fullmatch(
                    rf" {{{item_indent + 2}}}(?P<key>[a-z][a-z0-9_]*):\s*(?P<value>.*)",
                    line,
                )
                if field is None:
                    continue
                if field["key"] in fields:
                    fields = {}
                    break
                fields[field["key"]] = field["value"].strip()
            if fields:
                items.append(fields)
    return tuple(items)


def _legacy_template_total_ids(document: ESPHomeConfigDocument) -> tuple[str, ...]:
    """Return root template W/A totals safe to replace with managed equivalents."""
    items = _legacy_template_total_items(document)
    addon_count = addon_count_from_packages(document.package_files)
    official = (
        {
            f"total{kind}{'Main' if board == 0 else f'AddOn{board}'}"
            for board in range(addon_count + 1)
            for kind in ("Watts", "Amps")
        }
        if addon_count is not None
        else set()
    )

    def supported(sensor_id: str) -> bool:
        match = _LEGACY_TOTAL_ID.fullmatch(sensor_id)
        if match is None:
            return False
        references = _sum_references(items[sensor_id].get("lambda", "")) or ()
        kind = match["kind"]
        return bool(references) and all(
            re.fullmatch(rf"ct[1-9][0-9]*{kind}", reference)
            or reference in official and kind in reference
            for reference in references
        )

    return tuple(sensor_id for sensor_id in items if supported(sensor_id))


def _legacy_template_total_items(
    document: ESPHomeConfigDocument,
) -> dict[str, dict[str, str]]:
    items: dict[str, dict[str, str]] = {}
    ambiguous: set[str] = set()
    for item in _root_sensor_items(document):
        sensor_id = _plain_sensor_scalar(item.get("id", ""))
        match = _LEGACY_TOTAL_ID.fullmatch(sensor_id)
        if match is None:
            continue
        kind = match["kind"]
        if (
            _plain_sensor_scalar(item.get("platform", "")) != "template"
            or _plain_sensor_scalar(item.get("unit_of_measurement", ""))
            != ("W" if kind == "Watts" else "A")
            or _plain_sensor_scalar(item.get("device_class", ""))
            != ("power" if kind == "Watts" else "current")
            or _sum_references(item.get("lambda", "")) is None
        ):
            continue
        if sensor_id in items:
            ambiguous.add(sensor_id)
        else:
            items[sensor_id] = item
    for sensor_id in ambiguous:
        items.pop(sensor_id, None)
    return items


def _legacy_aggregates(
    document: ESPHomeConfigDocument,
    channels: tuple[ChannelSettings, ...],
    default_groups: tuple[tuple[str, str, tuple[int, ...], str], ...],
    energy_power_ids: frozenset[str],
) -> tuple[tuple[CircuitAggregate, ...], dict[str, str]]:
    items = _legacy_template_total_items(document)
    if not items:
        return (), {}
    defaults: dict[str, tuple[tuple[int, ...], str]] = {}
    for group_id, _label, group_channels, power_id in default_groups:
        defaults[power_id] = (group_channels, f"{group_id}-total")
        defaults[power_id.replace("Watts", "Amps")] = (
            group_channels,
            f"{group_id}-total",
        )
    enabled = {channel.channel for channel in channels if channel.enabled}

    grouped: dict[str, dict[str, tuple[str, dict[str, str]]]] = {}
    for sensor_id, item in items.items():
        match = _LEGACY_TOTAL_ID.fullmatch(sensor_id)
        assert match is not None
        grouped.setdefault(match["label"], {})[match["kind"]] = (sensor_id, item)
    aggregate_ids = [_legacy_aggregate_id(label) for label in grouped]
    ambiguous_ids = {
        aggregate_id
        for aggregate_id in aggregate_ids
        if aggregate_ids.count(aggregate_id) > 1
    }
    aggregates: list[CircuitAggregate] = []
    parents_by_child: dict[str, set[str]] = {}
    for label, outputs in grouped.items():
        if _legacy_aggregate_id(label) in ambiguous_ids:
            continue
        channels_by_output: list[tuple[int, ...]] = []
        dependencies_by_output: list[set[str]] = []
        for kind, (_sensor_id, item) in outputs.items():
            references = _sum_references(item.get("lambda", "")) or ()
            members: list[tuple[int, ...]] = []
            dependencies: set[str] = set()
            for reference in references:
                direct = re.fullmatch(
                    rf"ct(?P<channel>[1-9][0-9]*){kind}", reference
                )
                if direct is not None and int(direct["channel"]) in enabled:
                    members.append((int(direct["channel"]),))
                elif reference in defaults and kind in reference:
                    members.append(defaults[reference][0])
                    dependencies.add(defaults[reference][1])
                else:
                    members = []
                    break
            if not members:
                break
            channels_by_output.append(
                tuple(dict.fromkeys(channel for member in members for channel in member))
            )
            dependencies_by_output.append(dependencies)
        if len(channels_by_output) != len(outputs):
            continue
        first = channels_by_output[0]
        if any(value != first for value in channels_by_output[1:]):
            continue
        aggregate_id = _legacy_aggregate_id(label)
        power = outputs.get("Watts")
        current = outputs.get("Amps")
        aggregates.append(
            CircuitAggregate(
                aggregate_id,
                _legacy_aggregate_name(label, outputs),
                CircuitRole.CUSTOM,
                first,
                MeasurementMethod.TWO_CT_SUM
                if len(first) == 2
                else MeasurementMethod.DIRECT,
                None,
                EnergyMode.CONSUMPTION
                if power is not None and power[0] in energy_power_ids
                else EnergyMode.NONE,
                power is not None
                and _plain_sensor_scalar(power[1].get("internal", "")) != "true",
                current is not None
                and _plain_sensor_scalar(current[1].get("internal", "")) != "true",
            )
        )
        if dependencies_by_output and all(
            dependencies == dependencies_by_output[0]
            for dependencies in dependencies_by_output[1:]
        ):
            for child in dependencies_by_output[0]:
                if child != aggregate_id:
                    parents_by_child.setdefault(child, set()).add(aggregate_id)
    parent_links = {
        child: next(iter(parents))
        for child, parents in parents_by_child.items()
        if len(parents) == 1
    }
    return tuple(aggregates), parent_links


def _sum_references(value: str) -> tuple[str, ...] | None:
    match = re.fullmatch(r"\s*return\s+(?P<expression>.+?)\s*;\s*", value)
    if match is None:
        return None
    terms = re.split(r"\s*\+\s*", match["expression"])
    references = tuple(
        reference["id"]
        for term in terms
        if (reference := re.fullmatch(r"id\((?P<id>[A-Za-z0-9_]+)\)\.state", term))
        is not None
    )
    return references if references and len(references) == len(terms) else None


def _legacy_aggregate_id(label: str) -> str:
    if not label:
        return "meter-total"
    value = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "-", f"total{label}")
    return re.sub(r"[-_]+", "-", value).lower()


def _legacy_aggregate_name(
    label: str, outputs: Mapping[str, tuple[str, dict[str, str]]]
) -> str:
    for kind in ("Watts", "Amps"):
        output = outputs.get(kind)
        if output is None or not (value := output[1].get("name", "").strip()):
            continue
        try:
            name = (
                json.loads(value)
                if value.startswith('"')
                else value[1:-1].replace("''", "'")
                if value.startswith("'") and value.endswith("'")
                else value
            )
        except json.JSONDecodeError:
            continue
        if not isinstance(name, str):
            continue
        for prefix in ("${friendly_name} ", "${disp_name} "):
            name = name.removeprefix(prefix)
        for suffix in (f" {kind}", " Power", " Current"):
            if name.endswith(suffix):
                candidate = name.removesuffix(suffix).strip()
                if candidate and len(candidate) <= 64:
                    return candidate
    if not label:
        return "Meter total"
    words = re.sub(
        r"(?<=[a-z0-9])(?=[A-Z])", " ", f"Total{label}"
    ).replace("_", " ")
    return words


def _plain_sensor_scalar(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    return value if re.fullmatch(r"[A-Za-z0-9_]+", value) else ""


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
