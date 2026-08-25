"""Pure, topology-bounded meter and circuit configuration models."""

from __future__ import annotations

import math
import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from enum import StrEnum
from typing import Literal

from .entity_binding import group_key
from .models import MeterTopology

LineFrequencyHz = Literal[50, 60]
UpdateIntervalSeconds = Literal[1, 2, 5, 10, 30, 60]


class ElectricalSystem(StrEnum):
    SPLIT_PHASE_120_240 = "split_phase_120_240"
    SINGLE_PHASE_230 = "single_phase_230"
    THREE_PHASE = "three_phase"
    CUSTOM = "custom"


class VoltageLayout(StrEnum):
    STANDARD = "standard"
    MULTI_REFERENCE = "multi_reference"
    CUSTOM = "custom"


class CircuitRole(StrEnum):
    GRID = "grid"
    SOLAR = "solar"
    GENERATOR = "generator"
    SUBPANEL = "subpanel"
    BRANCH = "branch"
    TWO_POLE = "two_pole"
    CUSTOM = "custom"
    UNUSED = "unused"


class MeasurementMethod(StrEnum):
    DIRECT = "direct"
    TWO_CT_SUM = "two_ct_sum"
    ONE_CT_DOUBLE_POWER = "one_ct_double_power"
    BOTH_CONDUCTORS_ONE_CT = "both_conductors_one_ct"


class EnergyMode(StrEnum):
    NONE = "none"
    CONSUMPTION = "consumption"
    BIDIRECTIONAL = "bidirectional"
    GENERATION = "generation"


@dataclass(frozen=True, slots=True)
class VoltageReferenceConfig:
    reference_id: str
    label: str
    phase_label: str
    nominal_voltage_v: float
    transformer_model_id: str
    gain_voltage: int
    group_keys: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class MeterSettings:
    friendly_name: str
    electrical_system: ElectricalSystem
    line_frequency_hz: LineFrequencyHz
    update_interval_s: UpdateIntervalSeconds
    voltage_layout: VoltageLayout
    voltage_references: tuple[VoltageReferenceConfig, ...]


@dataclass(frozen=True, slots=True)
class ChannelSettings:
    channel: int
    enabled: bool
    name: str
    model_id: str
    reporting_multiplier: float
    role: CircuitRole
    voltage_reference_id: str
    custom_gain_ct: int | None = None
    custom_label: str | None = None
    burden_output_acknowledged: bool = False


@dataclass(frozen=True, slots=True)
class CircuitAggregate:
    aggregate_id: str
    name: str
    role: CircuitRole
    channels: tuple[int, ...]
    measurement_method: MeasurementMethod
    parent_id: str | None
    energy_mode: EnergyMode
    expose_power: bool = True
    expose_current: bool = False


@dataclass(frozen=True, slots=True)
class MeterConfigurationRequest:
    meter: MeterSettings
    channels: tuple[ChannelSettings, ...]
    aggregates: tuple[CircuitAggregate, ...]
    power_quality: tuple[bool, ...]
    status_fields: tuple[bool, ...]
    multi_reference_preparation_acknowledged: bool = False


PROFILE_DEFAULTS = {
    ElectricalSystem.SPLIT_PHASE_120_240: (60, 120.0),
    ElectricalSystem.SINGLE_PHASE_230: (50, 230.0),
}
_SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_CONTROL = re.compile(r"[\x00-\x1f\x7f-\x9f]")


def _text(value: object, field: str, *, max_length: int = 64) -> None:
    if not isinstance(value, str) or not 1 <= len(value) <= max_length or _CONTROL.search(value):
        raise ValueError(f"{field} must be 1-{max_length} safe characters")


def _finite(value: object, field: str) -> None:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f"{field} must be finite")


def _bools(values: object, field: str, count: int) -> None:
    if not isinstance(values, tuple) or len(values) != count or any(type(v) is not bool for v in values):
        raise ValueError(f"{field} requires one boolean per board")


def validate_meter_configuration(
    request: MeterConfigurationRequest, topology: MeterTopology
) -> None:
    """Validate a request against fixed physical topology without side effects."""
    meter = request.meter
    _text(meter.friendly_name, "friendly_name")
    if not isinstance(meter.electrical_system, ElectricalSystem):
        raise ValueError("invalid electrical_system")  # noqa: TRY004
    if meter.line_frequency_hz not in (50, 60) or type(meter.line_frequency_hz) is bool:
        raise ValueError("line_frequency_hz must be 50 or 60")
    if meter.update_interval_s not in (1, 2, 5, 10, 30, 60) or type(meter.update_interval_s) is bool:
        raise ValueError("invalid update_interval_s")
    if not isinstance(meter.voltage_layout, VoltageLayout):
        raise ValueError("invalid voltage_layout")  # noqa: TRY004
    refs = meter.voltage_references
    if not refs or len({r.reference_id for r in refs}) != len(refs):
        raise ValueError("voltage references must be uniquely identified")
    all_groups: list[str] = []
    for ref in refs:
        for field, value in (("reference_id", ref.reference_id), ("label", ref.label), ("phase_label", ref.phase_label), ("transformer_model_id", ref.transformer_model_id)):
            _text(value, field)
        _finite(ref.nominal_voltage_v, "nominal_voltage_v")
        if not 1 <= ref.nominal_voltage_v <= 600:
            raise ValueError("nominal_voltage_v must be 1-600")
        if type(ref.gain_voltage) is not int or not 1 <= ref.gain_voltage <= 65535:
            raise ValueError("gain_voltage must be 1-65535")
        if not ref.group_keys or any(not isinstance(g, str) for g in ref.group_keys):
            raise ValueError("group_keys must be non-empty strings")
        all_groups.extend(ref.group_keys)
    expected_groups = {
        group_key(board, group)
        for board in range(topology.board_count)
        for group in range(2)
    }
    if set(all_groups) != expected_groups or len(all_groups) != len(expected_groups):
        raise ValueError("topology groups must be assigned exactly once")
    if type(request.multi_reference_preparation_acknowledged) is not bool:
        raise ValueError("multi-reference acknowledgement must be boolean")
    if len(refs) > 1 and not request.multi_reference_preparation_acknowledged:
        raise ValueError("multi-reference preparation acknowledgement required")
    if len(refs) == 1 and request.multi_reference_preparation_acknowledged:
        raise ValueError("multi-reference acknowledgement is only for multiple references")

    if not isinstance(request.channels, tuple) or len(request.channels) != topology.ct_count:
        raise ValueError("one channel setting is required per topology channel")
    by_channel: dict[int, ChannelSettings] = {}
    ref_ids = {r.reference_id for r in refs}
    for channel in request.channels:
        if type(channel.channel) is not int or not 1 <= channel.channel <= topology.ct_count or channel.channel in by_channel:
            raise ValueError("channels must uniquely cover topology")
        by_channel[channel.channel] = channel
        if type(channel.enabled) is not bool or type(channel.burden_output_acknowledged) is not bool:
            raise ValueError("channel flags must be boolean")
        _text(channel.name, "channel name")
        _text(channel.model_id, "model_id")
        _finite(channel.reporting_multiplier, "reporting_multiplier")
        if channel.reporting_multiplier not in (1, 2, 4, 8):
            raise ValueError("unsupported reporting_multiplier")
        if not isinstance(channel.role, CircuitRole):
            raise ValueError("invalid circuit role")  # noqa: TRY004
        if channel.enabled and channel.role is CircuitRole.UNUSED:
            raise ValueError("used channels cannot be UNUSED")
        if not channel.enabled and channel.role is not CircuitRole.UNUSED:
            raise ValueError("unused channels must be UNUSED")
        _text(channel.voltage_reference_id, "voltage_reference_id")
        valid_reference = channel.voltage_reference_id in ref_ids
        if not valid_reference:
            raise ValueError("channel has invalid voltage reference")
        if channel.custom_gain_ct is not None and (type(channel.custom_gain_ct) is not int or not 1 <= channel.custom_gain_ct <= 65535):
            raise ValueError("custom_gain_ct must be 1-65535")
        if channel.custom_label is not None:
            _text(channel.custom_label, "custom_label")
    if set(by_channel) != set(range(1, topology.ct_count + 1)):
        raise ValueError("channels must cover topology exactly")

    aggregate_ids = {a.aggregate_id for a in request.aggregates}
    if len(aggregate_ids) != len(request.aggregates):
        raise ValueError("aggregate IDs must be unique")
    aggregate_channels: set[int] = set()
    for aggregate in request.aggregates:
        _text(aggregate.aggregate_id, "aggregate_id")
        if not _SLUG.fullmatch(aggregate.aggregate_id):
            raise ValueError("aggregate_id must be a safe slug")
        _text(aggregate.name, "aggregate name")
        if (
            not aggregate.channels
            or any(type(c) is not int for c in aggregate.channels)
            or len(set(aggregate.channels)) != len(aggregate.channels)
        ):
            raise ValueError("aggregate channels must be unique")
        if any(c not in by_channel for c in aggregate.channels) or aggregate_channels.intersection(aggregate.channels):
            raise ValueError("aggregate channels must be unique and in topology")
        aggregate_channels.update(aggregate.channels)
        if not isinstance(aggregate.measurement_method, MeasurementMethod) or not isinstance(aggregate.energy_mode, EnergyMode):
            raise ValueError("invalid aggregate method or energy mode")  # noqa: TRY004
        if not isinstance(aggregate.role, CircuitRole):
            raise ValueError("invalid aggregate role")  # noqa: TRY004
        expected = {
            MeasurementMethod.TWO_CT_SUM: 2,
            MeasurementMethod.ONE_CT_DOUBLE_POWER: 1,
            MeasurementMethod.BOTH_CONDUCTORS_ONE_CT: 1,
        }.get(aggregate.measurement_method)
        if (
            (expected is not None and len(aggregate.channels) != expected)
            or any(not by_channel[c].enabled for c in aggregate.channels)
        ):
            raise ValueError("measurement method cardinality does not match enabled channels")
        if aggregate.parent_id is not None and aggregate.parent_id not in aggregate_ids:
            raise ValueError("aggregate parent does not exist")
        if type(aggregate.expose_power) is not bool or type(aggregate.expose_current) is not bool:
            raise ValueError("aggregate exposure flags must be boolean")
    for aggregate in request.aggregates:
        seen: set[str] = set()
        current = aggregate
        while current.parent_id is not None:
            if current.aggregate_id in seen:
                raise ValueError("aggregate parent cycle")
            seen.add(current.aggregate_id)
            current = next(a for a in request.aggregates if a.aggregate_id == current.parent_id)
    _bools(request.power_quality, "power_quality", topology.board_count)
    _bools(request.status_fields, "status_fields", topology.board_count)


def default_meter_configuration(
    topology: MeterTopology, package_options: Mapping[str, Sequence[bool]]
) -> MeterConfigurationRequest:
    """Build the only implicit profile: split-phase 120/240 V."""
    if set(package_options) != {"power_quality", "status_fields"}:
        raise ValueError("package_options must match installed package options")
    options = {key: tuple(value) for key, value in package_options.items()}
    _bools(options["power_quality"], "power_quality", topology.board_count)
    _bools(options["status_fields"], "status_fields", topology.board_count)
    refs = (
        VoltageReferenceConfig(
            "main",
            "Main",
            "A",
            120.0,
            "default",
            1,
            tuple(
                group_key(board, group)
                for board in range(topology.board_count)
                for group in range(2)
            ),
        ),
    )
    channels = tuple(ChannelSettings(i, True, f"CT {i}", "default", 1.0, CircuitRole.BRANCH, "main") for i in range(1, topology.ct_count + 1))
    result = MeterConfigurationRequest(MeterSettings("Energy meter", ElectricalSystem.SPLIT_PHASE_120_240, 60, 5, VoltageLayout.STANDARD, refs), channels, (), options["power_quality"], options["status_fields"])
    validate_meter_configuration(result, topology)
    return result
