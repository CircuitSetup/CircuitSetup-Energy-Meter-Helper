"""Strict semantic binding for CircuitSetup calibration entities."""

from __future__ import annotations

import re
from collections import Counter
from collections.abc import Mapping
from dataclasses import dataclass
from enum import StrEnum

from .ct_inventory import _esphome_object_id
from .entity_catalog import EntityCatalog, EntityDescriptor, RawEntityKey
from .models import MeterTopology


class ResolutionSource(StrEnum):
    STORED = "stored"
    OBJECT_ID = "object_id"
    NAME_UNIT = "name_unit"
    PATTERN = "pattern"


class OffsetControlStatus(StrEnum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    INVALID = "invalid"


@dataclass(frozen=True, slots=True)
class ManualMappingOption:
    role: str
    object_id: str
    label: str

    @property
    def persisted_mapping(self) -> dict[str, str]:
        """Persist only the semantic role and native object ID."""
        return {self.role: self.object_id}


class EntityBindingError(ValueError):
    """Base class for a binding that cannot be chosen safely."""


class EntityBindingMissing(EntityBindingError):
    def __init__(
        self,
        role: str,
        manual_options: tuple[ManualMappingOption, ...] = (),
        reason: str = "missing required entity",
    ) -> None:
        self.role = role
        self.manual_options = manual_options
        super().__init__(f"{reason} for {role}")


class EntityBindingAmbiguity(EntityBindingError):
    def __init__(
        self,
        role: str,
        manual_options: tuple[ManualMappingOption, ...] = (),
        reason: str = "ambiguous candidates",
    ) -> None:
        self.role = role
        self.manual_options = manual_options
        super().__init__(f"{role}: {reason}")


@dataclass(frozen=True, slots=True)
class BoundEntity:
    role: str
    descriptor: EntityDescriptor
    source: ResolutionSource


@dataclass(frozen=True, slots=True)
class OffsetControlBinding:
    run_offset: BoundEntity
    restore_offset: BoundEntity
    run_power_offset: BoundEntity
    restore_power_offset: BoundEntity

    @property
    def entities(self) -> tuple[BoundEntity, BoundEntity, BoundEntity, BoundEntity]:
        return (
            self.run_offset,
            self.restore_offset,
            self.run_power_offset,
            self.restore_power_offset,
        )


@dataclass(frozen=True, slots=True)
class OffsetControlCapability:
    status: OffsetControlStatus
    controls: tuple[OffsetControlBinding, ...] = ()
    repair_reason: str | None = None


@dataclass(frozen=True, slots=True)
class ChannelBinding:
    channel: int
    reference_current: BoundEntity
    current_sensor: BoundEntity


@dataclass(frozen=True, slots=True)
class GroupBinding:
    key: str
    voltage_reference: BoundEntity
    current_references: tuple[BoundEntity, BoundEntity, BoundEntity]
    run_gain: BoundEntity
    restore_gain: BoundEntity
    voltage_sensors: tuple[BoundEntity, BoundEntity, BoundEntity]
    current_sensors: tuple[BoundEntity, BoundEntity, BoundEntity]

    @property
    def references(self) -> tuple[BoundEntity, ...]:
        return (self.voltage_reference, *self.current_references)

    @property
    def buttons(self) -> tuple[BoundEntity, BoundEntity]:
        return (self.run_gain, self.restore_gain)

    @property
    def entities(self) -> tuple[BoundEntity, ...]:
        return (
            *self.references,
            *self.buttons,
            *self.voltage_sensors,
            *self.current_sensors,
        )


@dataclass(frozen=True, slots=True)
class MeterBinding:
    topology: MeterTopology
    connection_generation: int
    groups: tuple[GroupBinding, ...]
    channels: tuple[ChannelBinding, ...]
    native: bool = False
    offset_capability: OffsetControlCapability = OffsetControlCapability(
        OffsetControlStatus.UNAVAILABLE
    )

    def __post_init__(self) -> None:
        if len(self.groups) != self.topology.group_count:
            raise EntityBindingError("group binding count does not match topology")
        if tuple(channel.channel for channel in self.channels) != tuple(
            range(1, self.topology.ct_count + 1)
        ):
            raise EntityBindingError("channel binding does not cover topology once")
        raw_keys = tuple(entity.descriptor.raw_key for entity in self.entities)
        if len(raw_keys) != len(set(raw_keys)):
            raise EntityBindingError("one native entity serves multiple semantic roles")
        capability = self.offset_capability
        if capability.status is OffsetControlStatus.AVAILABLE:
            if len(capability.controls) != len(self.groups):
                raise EntityBindingError("offset controls do not cover every group")
            if capability.repair_reason is not None:
                raise EntityBindingError("available offset controls cannot need repair")
        elif capability.controls:
            raise EntityBindingError("unavailable offset controls cannot be bound")
        elif (
            capability.status is OffsetControlStatus.INVALID
            and not capability.repair_reason
        ):
            raise EntityBindingError("invalid offset controls need a repair reason")

    @property
    def entities(self) -> tuple[BoundEntity, ...]:
        return tuple(entity for group in self.groups for entity in group.entities)

    @property
    def semantic_mapping(self) -> dict[str, str]:
        return {entity.role: entity.descriptor.object_id for entity in self.entities}

    def role(self, role: str) -> BoundEntity:
        for entity in self.entities:
            if entity.role == role:
                return entity
        raise KeyError(role)

    def rebind(
        self, catalog: EntityCatalog, substitutions: Mapping[str, str]
    ) -> MeterBinding:
        """Rebuild from generation-local EntityInfo keys after reconnect."""
        if self.native:
            if substitutions:
                raise EntityBindingError("native binding cannot accept substitutions")
            return bind_native_meter(catalog, self.topology)
        return bind_meter(
            catalog,
            self.topology,
            substitutions,
            stored_mapping=self.semantic_mapping,
        )


@dataclass(frozen=True, slots=True)
class _RoleSpec:
    role: str
    kind: str
    object_id: str
    name: str
    unit: str
    pattern_terms: tuple[str, ...]
    alternate_names: tuple[str, ...] = ()


def group_key(board_index: int, group_index: int) -> str:
    if not 0 <= board_index <= 6 or group_index not in (0, 1):
        raise ValueError("board and group index are outside supported topology")
    board = "main" if board_index == 0 else f"addon{board_index}"
    return f"{board}_{group_index + 1}"


def bind_native_meter(
    catalog: EntityCatalog,
    topology: MeterTopology,
) -> MeterBinding:
    """Bind the exact official runtime entity contract without configuration YAML."""
    substitutions = {
        f"ct{channel}_name": f"CT{channel}"
        for channel in range(1, topology.ct_count + 1)
    }
    substitutions.update(
        {"main_meter_name1": "Meter 1-3", "main_meter_name2": "Meter 4-6"}
    )
    for board in range(1, topology.board_count):
        substitutions[f"addon{board}_name1"] = (
            f"Addon{board} {board * 6 + 1}-{board * 6 + 3}"
        )
        substitutions[f"addon{board}_name2"] = (
            f"Addon{board} {board * 6 + 4}-{board * 6 + 6}"
        )
    binding = bind_meter(catalog, topology, substitutions)
    for board in range(topology.board_count):
        board_groups = binding.groups[board * 2 : board * 2 + 2]
        if len({entity.descriptor.device_id for group in board_groups for entity in group.entities}) != 1:
            raise EntityBindingError("native board roles span multiple API devices")
        for group_index, group in enumerate(board_groups):
            group_name = substitutions[
                f"main_meter_name{group_index + 1}"
                if board == 0
                else f"addon{board}_name{group_index + 1}"
            ]
            first_channel = board * 6 + group_index * 3 + 1
            expected_names = (
                f"{group_name} Ref V {group_index + 1}",
                *(f"CT{channel} Ref Current" for channel in range(first_channel, first_channel + 3)),
                f"3. Run {group_name} Gain Cal",
                f"z3. Clear {group_name} Gain Cal",
                *(
                    "Voltage 1"
                    if board == 0 and group_index == 0 and phase == "A"
                    else f"{group_name} Voltage {phase} Calibration"
                    for phase in "ABC"
                ),
                *(f"CT{channel} Amps" for channel in range(first_channel, first_channel + 3)),
            )
            offset_controls = (
                binding.offset_capability.controls[board * 2 + group_index].entities
                if binding.offset_capability.status is OffsetControlStatus.AVAILABLE
                else ()
            )
            offset_names = (
                (
                    f"1. Run {group_name} Offset Cal",
                    f"z1. Clear {group_name} Offset Cal",
                    f"2. Run {group_name} Power Offset Cal",
                    f"z2. Clear {group_name} Power Offset Cal",
                )
                if offset_controls
                else ()
            )
            expected_names = (
                *expected_names[:6],
                *offset_names,
                *expected_names[6:],
            )
            entities = (*group.entities[:6], *offset_controls, *group.entities[6:])
            if tuple(entity.descriptor.name for entity in entities) != expected_names or any(
                entity.source is not ResolutionSource.OBJECT_ID
                or len(
                    catalog.by_name_unit(
                        entity.descriptor.kind,
                        entity.descriptor.name,
                        entity.descriptor.unit,
                    )
                )
                != 1
                for entity in entities
            ):
                raise EntityBindingError("native entity metadata differs from firmware contract")
    return MeterBinding(
        binding.topology,
        binding.connection_generation,
        binding.groups,
        binding.channels,
        native=True,
        offset_capability=binding.offset_capability,
    )


def bind_meter(
    catalog: EntityCatalog,
    topology: MeterTopology,
    substitutions: Mapping[str, str],
    *,
    stored_mapping: Mapping[str, str] | None = None,
) -> MeterBinding:
    """Bind every required role, refusing missing, reused, or ambiguous entities."""
    stored = stored_mapping or {}
    friendly_name = substitutions.get("friendly_name")
    used: set[RawEntityKey] = set()
    groups: list[GroupBinding] = []
    channels: list[ChannelBinding] = []

    def repair_options(
        spec: _RoleSpec,
    ) -> tuple[tuple[ManualMappingOption, ...], bool]:
        compatible = tuple(
            candidate
            for candidate in catalog.by_kind(spec.kind)
            if candidate.unit == spec.unit
        )
        object_id_counts = Counter(candidate.object_id for candidate in compatible)
        options = tuple(
            ManualMappingOption(
                spec.role,
                candidate.object_id,
                f"{candidate.name} — {candidate.kind} ({candidate.unit or 'no unit'})",
            )
            for candidate in compatible
            if candidate.raw_key not in used
            and object_id_counts[candidate.object_id] == 1
        )
        return options, any(count > 1 for count in object_id_counts.values())

    def resolve(spec: _RoleSpec) -> BoundEntity:
        tiers: tuple[tuple[ResolutionSource, tuple[EntityDescriptor, ...]], ...] = (
            (
                ResolutionSource.STORED,
                _valid_unit(
                    catalog.by_object_id(spec.kind, stored.get(spec.role, "")),
                    spec.unit,
                )
                if spec.role in stored
                else (),
            ),
            (
                ResolutionSource.OBJECT_ID,
                _valid_unit(catalog.by_object_id(spec.kind, spec.object_id), spec.unit),
            ),
            (
                ResolutionSource.NAME_UNIT,
                tuple(
                    candidate
                    for name in (spec.name, *spec.alternate_names)
                    for candidate in catalog.by_name_unit(spec.kind, name, spec.unit)
                ),
            ),
            (
                ResolutionSource.PATTERN,
                tuple(
                    candidate
                    for candidate in catalog.by_kind(spec.kind)
                    if candidate.unit == spec.unit
                    and _matches_pattern(candidate, spec.pattern_terms)
                ),
            ),
        )
        for source, candidates in tiers:
            if not candidates:
                continue
            options, has_duplicate_ids = repair_options(spec)
            if len(candidates) != 1:
                reason = (
                    "duplicate object IDs cannot be persisted"
                    if has_duplicate_ids and not options
                    else "ambiguous candidates"
                )
                raise EntityBindingAmbiguity(spec.role, options, reason)
            candidate = candidates[0]
            if candidate.raw_key in used:
                raise EntityBindingAmbiguity(
                    spec.role, options, "candidate is already bound"
                )
            used.add(candidate.raw_key)
            return BoundEntity(spec.role, candidate, source)
        options, has_duplicate_ids = repair_options(spec)
        reason = (
            "duplicate object IDs cannot be persisted"
            if has_duplicate_ids and not options
            else "missing required entity"
        )
        raise EntityBindingMissing(spec.role, options, reason)

    def resolve_optional(spec: _RoleSpec) -> tuple[BoundEntity | None, str | None]:
        malformed = tuple(
            candidate
            for candidate in catalog.by_name(spec.name)
            if candidate.kind != spec.kind or candidate.unit != spec.unit
        )
        if malformed:
            return None, f"offset control {spec.role} has the wrong kind or unit"
        if len(catalog.by_name_unit(spec.kind, spec.name, spec.unit)) > 1:
            return None, f"offset control {spec.role} is ambiguous"
        tiers: tuple[tuple[ResolutionSource, tuple[EntityDescriptor, ...]], ...] = (
            (
                ResolutionSource.STORED,
                _valid_unit(
                    catalog.by_object_id(spec.kind, stored.get(spec.role, "")),
                    spec.unit,
                )
                if spec.role in stored
                else (),
            ),
            (
                ResolutionSource.OBJECT_ID,
                _valid_unit(catalog.by_object_id(spec.kind, spec.object_id), spec.unit),
            ),
            (
                ResolutionSource.NAME_UNIT,
                catalog.by_name_unit(spec.kind, spec.name, spec.unit),
            ),
            (
                ResolutionSource.PATTERN,
                tuple(
                    candidate
                    for candidate in catalog.by_kind(spec.kind)
                    if candidate.unit == spec.unit
                    and _matches_pattern(candidate, spec.pattern_terms)
                ),
            ),
        )
        for source, candidates in tiers:
            if not candidates:
                continue
            if len(candidates) != 1:
                return None, f"offset control {spec.role} is ambiguous"
            candidate = candidates[0]
            if candidate.raw_key in used:
                return None, f"offset control {spec.role} is duplicated"
            used.add(candidate.raw_key)
            return BoundEntity(spec.role, candidate, source), None
        return None, None

    for board_index in range(topology.board_count):
        for group_index in range(2):
            key = group_key(board_index, group_index)
            group_name = _required_substitution(
                substitutions,
                (
                    f"main_meter_name{group_index + 1}"
                    if board_index == 0
                    else f"addon{board_index}_name{group_index + 1}"
                ),
            )
            first_channel = board_index * 6 + group_index * 3 + 1
            voltage_reference = resolve(
                _spec(
                    f"{key}.reference_voltage",
                    "number",
                    f"{group_name} Ref V {group_index + 1}",
                    "V",
                    (key, "ref", "v"),
                )
            )
            current_references: list[BoundEntity] = []
            current_sensors: list[BoundEntity] = []
            voltage_sensors: list[BoundEntity] = []
            group_channels: list[int] = []
            for phase_index, phase in enumerate("abc"):
                channel = first_channel + phase_index
                ct_name = _required_substitution(substitutions, f"ct{channel}_name")
                current_references.append(
                    resolve(
                        _spec(
                            f"ct{channel}.reference_current",
                            "number",
                            f"{ct_name} Ref Current",
                            "A",
                            (f"ct{channel}", "ref", "current"),
                        )
                    )
                )
                primary_voltage = (
                    board_index == 0 and group_index == 0 and phase == "a"
                )
                voltage_name = (
                    "Voltage 1"
                    if primary_voltage
                    else f"{group_name} Voltage {phase.upper()} Calibration"
                )
                voltage_id = (
                    "ic1volts"
                    if primary_voltage
                    else (
                        f"meter_main{group_index + 1}_voltage_{phase}_calibration"
                        if board_index == 0
                        else f"addon{board_index}_{group_index + 1}_voltage_{phase}_calibration"
                    )
                )
                voltage_sensors.append(
                    resolve(
                        _RoleSpec(
                            f"{key}.voltage_{phase}",
                            "sensor",
                            voltage_id,
                            voltage_name,
                            "V",
                            (key, "voltage", phase),
                            (
                                (f"{friendly_name} Main Voltage",)
                                if primary_voltage and friendly_name
                                else ()
                            ),
                        )
                    )
                )
                current_sensors.append(
                    resolve(
                        _RoleSpec(
                            f"ct{channel}.current_sensor",
                            "sensor",
                            f"ct{channel}amps",
                            f"{ct_name} Amps",
                            "A",
                            (f"ct{channel}", "amp"),
                        )
                    )
                )
                group_channels.append(channel)

            run_gain = resolve(
                _spec(
                    f"{key}.run_gain",
                    "button",
                    f"3. Run {group_name} Gain Cal",
                    "",
                    (key, "run", "gain"),
                )
            )
            restore_gain = resolve(
                _spec(
                    f"{key}.restore_gain",
                    "button",
                    f"z3. Clear {group_name} Gain Cal",
                    "",
                    (key, "clear", "gain"),
                )
            )
            references_tuple = tuple(current_references)
            voltage_tuple = tuple(voltage_sensors)
            current_tuple = tuple(current_sensors)
            assert (
                len(references_tuple) == len(voltage_tuple) == len(current_tuple) == 3
            )
            group = GroupBinding(
                key,
                voltage_reference,
                references_tuple,
                run_gain,
                restore_gain,
                voltage_tuple,
                current_tuple,
            )
            groups.append(group)
            channels.extend(
                ChannelBinding(channel, reference, sensor)
                for channel, reference, sensor in zip(
                    group_channels, current_references, current_sensors, strict=True
                )
            )

    offset_controls: list[OffsetControlBinding] = []
    offset_errors: list[str] = []
    found_offset_control = False
    for group in groups:
        controls: list[BoundEntity | None] = []
        offset_group_name = _group_name_for(group.key, substitutions)
        for role, name, terms in (
            ("run_offset", f"1. Run {offset_group_name} Offset Cal", (group.key, "run", "offset")),
            ("restore_offset", f"z1. Clear {offset_group_name} Offset Cal", (group.key, "clear", "offset")),
            ("run_power_offset", f"2. Run {offset_group_name} Power Offset Cal", (group.key, "run", "power", "offset")),
            ("restore_power_offset", f"z2. Clear {offset_group_name} Power Offset Cal", (group.key, "clear", "power", "offset")),
        ):
            control, error = resolve_optional(_spec(f"{group.key}.{role}", "button", name, "", terms))
            controls.append(control)
            found_offset_control = found_offset_control or control is not None or error is not None
            if error is not None:
                offset_errors.append(error)
        if any(control is None for control in controls):
            if any(control is not None for control in controls):
                offset_errors.append(f"offset controls are partial for {group.key}")
            continue
        run_offset, restore_offset, run_power_offset, restore_power_offset = controls
        assert (
            run_offset is not None
            and restore_offset is not None
            and run_power_offset is not None
            and restore_power_offset is not None
        )
        bound_controls = OffsetControlBinding(
            run_offset, restore_offset, run_power_offset, restore_power_offset
        )
        if any(
            control.descriptor.device_id != group.run_gain.descriptor.device_id
            for control in bound_controls.entities
        ):
            offset_errors.append(f"offset controls are cross-device for {group.key}")
            continue
        offset_controls.append(bound_controls)

    if not found_offset_control:
        offset_capability = OffsetControlCapability(OffsetControlStatus.UNAVAILABLE)
    elif offset_errors or len(offset_controls) != len(groups):
        offset_capability = OffsetControlCapability(
            OffsetControlStatus.INVALID,
            repair_reason=offset_errors[0]
            if offset_errors
            else "offset controls are incomplete",
        )
    else:
        offset_capability = OffsetControlCapability(
            OffsetControlStatus.AVAILABLE, tuple(offset_controls)
        )

    return MeterBinding(
        topology,
        catalog.connection_generation,
        tuple(groups),
        tuple(channels),
        offset_capability=offset_capability,
    )


def _spec(
    role: str,
    kind: str,
    name: str,
    unit: str,
    pattern_terms: tuple[str, ...],
) -> _RoleSpec:
    return _RoleSpec(role, kind, _esphome_object_id(name), name, unit, pattern_terms)


def _valid_unit(
    candidates: tuple[EntityDescriptor, ...], unit: str
) -> tuple[EntityDescriptor, ...]:
    return tuple(candidate for candidate in candidates if candidate.unit == unit)


def _matches_pattern(
    candidate: EntityDescriptor, pattern_terms: tuple[str, ...]
) -> bool:
    raw = f"{candidate.object_id} {candidate.name}".casefold()
    raw_tokens = re.findall(r"[a-z]+|\d+", raw)
    tokens: list[str] = []
    index = 0
    while index < len(raw_tokens):
        if raw_tokens[index : index + 2] == ["add", "on"]:
            tokens.append("addon")
            index += 2
            continue
        tokens.append("amp" if raw_tokens[index] == "amps" else raw_tokens[index])
        index += 1

    def contains(expected: tuple[str, ...]) -> bool:
        return any(
            tuple(tokens[start : start + len(expected)]) == expected
            for start in range(len(tokens) - len(expected) + 1)
        )

    for term in pattern_terms:
        normalized = term.casefold()
        alternatives: tuple[tuple[str, ...], ...]
        if channel := re.fullmatch(r"ct(\d+)", normalized):
            alternatives = (("ct", str(int(channel.group(1)))),)
        elif group := re.fullmatch(r"(main|addon\d+)_(\d+)", normalized):
            board, group_number = group.groups()
            if board == "main":
                alternatives = (
                    ("main", group_number),
                    ("meter", "main", group_number),
                    ("main", "meter", group_number),
                )
            else:
                board_number = board.removeprefix("addon")
                alternatives = (
                    ("addon", board_number, group_number),
                    ("addon", board_number, "meter", group_number),
                )
        else:
            alternatives = (("amp" if normalized == "amps" else normalized,),)
        if not any(contains(alternative) for alternative in alternatives):
            return False
    return True


def _required_substitution(substitutions: Mapping[str, str], key: str) -> str:
    value = substitutions.get(key)
    if not value:
        raise EntityBindingError(f"missing required substitution {key}")
    return value


def _group_name_for(key: str, substitutions: Mapping[str, str]) -> str:
    board, group = key.rsplit("_", 1)
    return _required_substitution(
        substitutions,
        f"main_meter_name{group}" if board == "main" else f"{board}_name{group}",
    )
