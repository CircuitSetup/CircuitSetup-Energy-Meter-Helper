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
            if tuple(entity.descriptor.name for entity in group.entities) != expected_names or any(
                entity.source is not ResolutionSource.OBJECT_ID
                or len(
                    catalog.by_name_unit(
                        entity.descriptor.kind,
                        entity.descriptor.name,
                        entity.descriptor.unit,
                    )
                )
                != 1
                for entity in group.entities
            ):
                raise EntityBindingError("native entity metadata differs from firmware contract")
    return MeterBinding(
        binding.topology,
        binding.connection_generation,
        binding.groups,
        binding.channels,
        native=True,
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
                voltage_name = (
                    "Voltage 1"
                    if board_index == 0 and group_index == 0 and phase == "a"
                    else f"{group_name} Voltage {phase.upper()} Calibration"
                )
                voltage_id = (
                    "ic1volts"
                    if board_index == 0 and group_index == 0 and phase == "a"
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

    return MeterBinding(
        topology,
        catalog.connection_generation,
        tuple(groups),
        tuple(channels),
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
