"""Strict semantic binding for CircuitSetup calibration entities."""

from __future__ import annotations

import re
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
    def __init__(self, role: str) -> None:
        self.role = role
        super().__init__(f"missing required entity for {role}")


class EntityBindingAmbiguity(EntityBindingError):
    def __init__(
        self,
        role: str,
        candidates: tuple[EntityDescriptor, ...],
        reason: str = "ambiguous candidates",
    ) -> None:
        self.role = role
        self.manual_options = tuple(
            ManualMappingOption(
                role,
                candidate.object_id,
                f"{candidate.name} — {candidate.kind} ({candidate.unit or 'no unit'})",
            )
            for candidate in candidates
        )
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
            if len(candidates) != 1:
                raise EntityBindingAmbiguity(spec.role, candidates)
            candidate = candidates[0]
            if candidate.raw_key in used:
                raise EntityBindingAmbiguity(
                    spec.role, candidates, "candidate is already bound"
                )
            used.add(candidate.raw_key)
            return BoundEntity(spec.role, candidate, source)
        raise EntityBindingMissing(spec.role)

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
    searchable = re.sub(r"[^a-z0-9]", "", raw)
    for term in pattern_terms:
        if channel := re.fullmatch(r"ct(\d+)", term.casefold()):
            if re.search(rf"ct{int(channel.group(1))}(?!\d)", raw) is None:
                return False
        elif re.sub(r"[^a-z0-9]", "", term.casefold()) not in searchable:
            return False
    return True


def _required_substitution(substitutions: Mapping[str, str], key: str) -> str:
    value = substitutions.get(key)
    if not value:
        raise EntityBindingError(f"missing required substitution {key}")
    return value
