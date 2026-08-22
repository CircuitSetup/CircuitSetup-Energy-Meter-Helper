"""Indexes for native ESPHome EntityInfo metadata."""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass, field
from typing import Any

type RawEntityKey = tuple[str, int, int]


class EntityCatalogError(ValueError):
    """Native entity metadata cannot form an unambiguous catalog."""


@dataclass(frozen=True, slots=True)
class EntityDescriptor:
    """The stable metadata used to bind one native API entity."""

    info: Any = field(repr=False, compare=False)
    kind: str
    object_id: str
    name: str
    unit: str
    device_id: int
    key: int
    disabled_by_default: bool

    @property
    def raw_key(self) -> RawEntityKey:
        return (self.kind, self.device_id, self.key)


class EntityCatalog:
    """A generation-scoped view over native ESPHome entities."""

    def __init__(self, entities: Iterable[Any], connection_generation: int) -> None:
        if connection_generation < 1:
            raise EntityCatalogError("connection generation must be positive")
        self.connection_generation = connection_generation
        descriptors: list[EntityDescriptor] = []
        raw_keys: set[RawEntityKey] = set()
        self._by_kind: dict[str, list[EntityDescriptor]] = defaultdict(list)
        self._by_object: dict[tuple[str, str], list[EntityDescriptor]] = defaultdict(
            list
        )
        self._by_name_unit: dict[tuple[str, str, str], list[EntityDescriptor]] = (
            defaultdict(list)
        )
        self._by_name: dict[str, list[EntityDescriptor]] = defaultdict(list)
        self._by_unit: dict[str, list[EntityDescriptor]] = defaultdict(list)
        self._by_device: dict[int, list[EntityDescriptor]] = defaultdict(list)

        for info in entities:
            kind = type(info).__name__.removesuffix("Info").casefold()
            object_id = getattr(info, "object_id", "")
            if not isinstance(object_id, str) or not object_id:
                raise EntityCatalogError("native entity object ID must be non-empty")
            descriptor = EntityDescriptor(
                info,
                kind,
                object_id,
                str(getattr(info, "name", "")),
                str(getattr(info, "unit_of_measurement", "")),
                int(getattr(info, "device_id", 0)),
                int(info.key),
                bool(getattr(info, "disabled_by_default", False)),
            )
            if descriptor.raw_key in raw_keys:
                raise EntityCatalogError("duplicate native entity key")
            raw_keys.add(descriptor.raw_key)
            descriptors.append(descriptor)
            self._by_kind[kind].append(descriptor)
            self._by_object[(kind, object_id)].append(descriptor)
            self._by_name_unit[(kind, descriptor.name, descriptor.unit)].append(
                descriptor
            )
            self._by_name[descriptor.name].append(descriptor)
            self._by_unit[descriptor.unit].append(descriptor)
            self._by_device[descriptor.device_id].append(descriptor)
        self.entities = tuple(descriptors)

    def by_kind(self, kind: str) -> tuple[EntityDescriptor, ...]:
        return tuple(self._by_kind.get(kind, ()))

    def by_object_id(self, kind: str, object_id: str) -> tuple[EntityDescriptor, ...]:
        return tuple(self._by_object.get((kind, object_id), ()))

    def by_name_unit(
        self, kind: str, name: str, unit: str
    ) -> tuple[EntityDescriptor, ...]:
        return tuple(self._by_name_unit.get((kind, name, unit), ()))

    def by_name(self, name: str) -> tuple[EntityDescriptor, ...]:
        return tuple(self._by_name.get(name, ()))

    def by_unit(self, unit: str) -> tuple[EntityDescriptor, ...]:
        return tuple(self._by_unit.get(unit, ()))

    def by_device_id(self, device_id: int) -> tuple[EntityDescriptor, ...]:
        return tuple(self._by_device.get(device_id, ()))
