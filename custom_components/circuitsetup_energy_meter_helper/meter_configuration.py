"""Pure, topology-bounded meter and circuit configuration models."""

from __future__ import annotations

import math
import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from enum import StrEnum
from typing import Literal

from .entity_binding import group_key
from .models import VOLTAGE_REFERENCE_ID_RE, MeterTopology

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


class TotalOrigin(StrEnum):
    ADVANCED = "advanced"
    MIGRATED = "migrated"


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
class TotalOutputSettings:
    watts: bool
    amps: bool
    kwh: bool


@dataclass(frozen=True, slots=True)
class BoardTotalSettings:
    board_index: int
    outputs: TotalOutputSettings


@dataclass(frozen=True, slots=True)
class DefaultTotalsSettings:
    overall: TotalOutputSettings
    boards: tuple[BoardTotalSettings, ...]


@dataclass(frozen=True, slots=True)
class ChannelTotalSource:
    kind: Literal["channel"]
    channel: int


@dataclass(frozen=True, slots=True)
class NativeTotalSource:
    kind: Literal["native_total"]
    source_id: str


@dataclass(frozen=True, slots=True)
class AggregateTotalSource:
    kind: Literal["aggregate"]
    aggregate_id: str


TotalSource = ChannelTotalSource | NativeTotalSource | AggregateTotalSource


@dataclass(frozen=True, slots=True)
class AutomaticTotalSettings:
    candidate_id: str
    enabled: bool
    outputs: TotalOutputSettings


@dataclass(frozen=True, slots=True)
class CircuitAggregate:
    aggregate_id: str
    name: str
    role: CircuitRole
    sources: tuple[TotalSource, ...]
    measurement_method: MeasurementMethod
    energy_mode: EnergyMode
    outputs: TotalOutputSettings
    origin: TotalOrigin = TotalOrigin.ADVANCED


@dataclass(frozen=True, slots=True)
class LegacyParentDecision:
    child_id: str
    proposed_parent_id: str
    accepted: bool


@dataclass(frozen=True, slots=True)
class TotalsChangeIntent:
    adopt_managed_totals: bool = False
    legacy_parent_decisions: tuple[LegacyParentDecision, ...] = ()


@dataclass(frozen=True, slots=True)
class MeterConfigurationRequest:
    meter: MeterSettings
    channels: tuple[ChannelSettings, ...]
    default_totals: DefaultTotalsSettings
    automatic_totals: tuple[AutomaticTotalSettings, ...]
    aggregates: tuple[CircuitAggregate, ...]
    power_quality: tuple[bool, ...]
    status_fields: tuple[bool, ...]
    multi_reference_preparation_acknowledged: bool = False
    totals_change_intent: TotalsChangeIntent = TotalsChangeIntent()


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


def _total_outputs(value: object, field: str) -> None:
    if not isinstance(value, TotalOutputSettings) or any(
        type(output) is not bool for output in (value.watts, value.amps, value.kwh)
    ):
        raise ValueError(f"{field} must contain strict booleans")


def _source_id(value: object, field: str) -> None:
    _text(value, field)
    if not isinstance(value, str) or not _SLUG.fullmatch(value):
        raise ValueError(f"{field} must be a safe slug")


def validate_meter_configuration(
    request: MeterConfigurationRequest,
    topology: MeterTopology,
    *,
    require_multi_reference_acknowledgement: bool = True,
) -> None:
    """Validate a request against fixed physical topology without side effects."""
    intent = request.totals_change_intent
    if not isinstance(intent, TotalsChangeIntent) or type(intent.adopt_managed_totals) is not bool:
        raise ValueError("totals change intent is invalid")
    if not isinstance(intent.legacy_parent_decisions, tuple):
        raise ValueError("legacy parent decisions must be a tuple")  # noqa: TRY004
    reviewed: set[str] = set()
    for decision in intent.legacy_parent_decisions:
        if not isinstance(decision, LegacyParentDecision) or type(decision.accepted) is not bool:
            raise ValueError("legacy parent decision is invalid")
        _source_id(decision.child_id, "legacy child_id")
        _source_id(decision.proposed_parent_id, "legacy proposed_parent_id")
        if decision.child_id in reviewed:
            raise ValueError("legacy parent decisions must be unique")
        reviewed.add(decision.child_id)
    meter = request.meter
    _text(meter.friendly_name, "friendly_name")
    if not isinstance(meter.electrical_system, ElectricalSystem):
        raise ValueError("invalid electrical_system")  # noqa: TRY004
    if type(meter.line_frequency_hz) is not int or meter.line_frequency_hz not in (50, 60):
        raise ValueError("line_frequency_hz must be 50 or 60")
    if type(meter.update_interval_s) is not int or meter.update_interval_s not in (1, 2, 5, 10, 30, 60):
        raise ValueError("invalid update_interval_s")
    if not isinstance(meter.voltage_layout, VoltageLayout):
        raise ValueError("invalid voltage_layout")  # noqa: TRY004
    refs = meter.voltage_references
    if not refs or len({r.reference_id for r in refs}) != len(refs):
        raise ValueError("voltage references must be uniquely identified")
    all_groups: list[str] = []
    for ref in refs:
        if VOLTAGE_REFERENCE_ID_RE.fullmatch(ref.reference_id) is None:
            raise ValueError("reference_id is invalid")
        for field, value in (("reference_id", ref.reference_id), ("label", ref.label), ("phase_label", ref.phase_label), ("transformer_model_id", ref.transformer_model_id)):
            _text(value, field)
        _finite(ref.nominal_voltage_v, "nominal_voltage_v")
        if not 1 <= ref.nominal_voltage_v <= 600:
            raise ValueError("nominal_voltage_v must be 1-600")
        profile = PROFILE_DEFAULTS.get(meter.electrical_system)
        if profile is not None and ref.nominal_voltage_v != profile[1]:
            raise ValueError("nominal_voltage_v must match electrical_system")
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
    if (
        require_multi_reference_acknowledgement
        and len(refs) > 1
        and not request.multi_reference_preparation_acknowledged
    ):
        raise ValueError("multi-reference preparation acknowledgement required")
    if len(refs) == 1 and request.multi_reference_preparation_acknowledged:
        raise ValueError("multi-reference acknowledgement is only for multiple references")

    if not isinstance(request.channels, tuple) or len(request.channels) != topology.ct_count:
        raise ValueError("one channel setting is required per topology channel")
    by_channel: dict[int, ChannelSettings] = {}
    ref_ids = {r.reference_id for r in refs}
    reference_by_group = {
        group: reference.reference_id for reference in refs for group in reference.group_keys
    }
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
        physical_group = group_key(
            (channel.channel - 1) // 6, ((channel.channel - 1) % 6) // 3
        )
        if channel.voltage_reference_id != reference_by_group[physical_group]:
            raise ValueError("channel voltage reference does not own its physical voltage group")
        if channel.custom_gain_ct is not None and (type(channel.custom_gain_ct) is not int or not 1 <= channel.custom_gain_ct <= 65535):
            raise ValueError("custom_gain_ct must be 1-65535")
        if channel.custom_label is not None:
            _text(channel.custom_label, "custom_label")
    if set(by_channel) != set(range(1, topology.ct_count + 1)):
        raise ValueError("channels must cover topology exactly")

    if not isinstance(request.default_totals, DefaultTotalsSettings):
        raise ValueError("default totals are invalid")  # noqa: TRY004
    _total_outputs(request.default_totals.overall, "overall total output")
    boards = request.default_totals.boards
    expected_boards = () if topology.board_count == 1 else tuple(range(topology.board_count))
    if (
        not isinstance(boards, tuple)
        or any(not isinstance(board, BoardTotalSettings) for board in boards)
        or any(type(board.board_index) is not int for board in boards)
        or tuple(board.board_index for board in boards) != expected_boards
    ):
        raise ValueError("default total boards must cover topology exactly")
    for board in boards:
        _total_outputs(board.outputs, "board total output")

    if not isinstance(request.automatic_totals, tuple):
        raise ValueError("automatic totals must be a tuple")  # noqa: TRY004
    candidate_ids: set[str] = set()
    for automatic in request.automatic_totals:
        if not isinstance(automatic, AutomaticTotalSettings):
            raise ValueError("automatic total is invalid")  # noqa: TRY004
        _source_id(automatic.candidate_id, "automatic candidate_id")
        if automatic.candidate_id in candidate_ids or type(automatic.enabled) is not bool:
            raise ValueError("automatic totals must have unique IDs and boolean enabled")
        candidate_ids.add(automatic.candidate_id)
        _total_outputs(automatic.outputs, "automatic total output")

    aggregate_ids = {a.aggregate_id for a in request.aggregates}
    if len(aggregate_ids) != len(request.aggregates):
        raise ValueError("aggregate IDs must be unique")
    from .total_graph import native_total_sources

    native_source_ids = {source.source_id for source in native_total_sources(topology)}
    for aggregate in request.aggregates:
        _source_id(aggregate.aggregate_id, "aggregate_id")
        _text(aggregate.name, "aggregate name")
        if not isinstance(aggregate.measurement_method, MeasurementMethod) or not isinstance(aggregate.energy_mode, EnergyMode):
            raise ValueError("invalid aggregate method or energy mode")  # noqa: TRY004
        if not isinstance(aggregate.role, CircuitRole) or not isinstance(aggregate.origin, TotalOrigin):
            raise ValueError("invalid aggregate role")  # noqa: TRY004
        _total_outputs(aggregate.outputs, "aggregate total output")
        if aggregate.outputs.kwh and aggregate.energy_mode is EnergyMode.NONE:
            raise ValueError("kwh output requires an energy mode")
        if not isinstance(aggregate.sources, tuple) or not aggregate.sources:
            raise ValueError("aggregate sources must be a non-empty tuple")
        channels = tuple(
            source.channel for source in aggregate.sources
            if isinstance(source, ChannelTotalSource)
        )
        if len(channels) != len(set(channels)):
            raise ValueError("aggregate channel sources must be unique")
        for source in aggregate.sources:
            if isinstance(source, ChannelTotalSource):
                if source.kind != "channel" or type(source.channel) is not int or source.channel not in by_channel:
                    raise ValueError("aggregate channel source is invalid")
                if not by_channel[source.channel].enabled:
                    raise ValueError("aggregate sources must use enabled channels")
            elif isinstance(source, NativeTotalSource):
                if source.kind != "native_total" or source.source_id not in native_source_ids:
                    raise ValueError("aggregate native total source is invalid")
            elif isinstance(source, AggregateTotalSource):
                if source.kind != "aggregate":
                    raise ValueError("aggregate source is invalid")
                _source_id(source.aggregate_id, "aggregate source_id")
            else:
                raise ValueError("aggregate source is invalid")  # noqa: TRY004
        expected = {
            MeasurementMethod.TWO_CT_SUM: 2,
            MeasurementMethod.ONE_CT_DOUBLE_POWER: 1,
            MeasurementMethod.BOTH_CONDUCTORS_ONE_CT: 1,
        }.get(aggregate.measurement_method)
        if expected is not None and any(
            isinstance(source, (NativeTotalSource, AggregateTotalSource))
            for source in aggregate.sources
        ):
            raise ValueError("special measurement methods require channel sources")
        if (
            (expected is not None and len(channels) != expected)
            or (expected is not None and len(channels) != len(aggregate.sources))
        ):
            raise ValueError("measurement method cardinality requires channel sources")
    _bools(request.power_quality, "power_quality", topology.board_count)
    _bools(request.status_fields, "status_fields", topology.board_count)
    from .total_graph import validate_total_graph

    validate_total_graph(request, topology)


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
    from .total_graph import default_total_settings

    default_totals = default_total_settings(topology)
    result = MeterConfigurationRequest(
        MeterSettings("Energy meter", ElectricalSystem.SPLIT_PHASE_120_240, 60, 10, VoltageLayout.STANDARD, refs),
        channels,
        default_totals,
        (),
        (),
        options["power_quality"],
        options["status_fields"],
    )
    validate_meter_configuration(result, topology)
    return result
