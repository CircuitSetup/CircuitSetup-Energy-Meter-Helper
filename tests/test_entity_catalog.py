"""Tests for native ESPHome entity metadata indexing."""

from __future__ import annotations

from dataclasses import dataclass

import pytest

from custom_components.circuitsetup_energy_meter_helper.entity_catalog import (
    EntityCatalog,
    EntityCatalogError,
)


@dataclass(slots=True)
class SensorInfo:
    object_id: str
    key: int
    name: str
    unit_of_measurement: str
    device_id: int = 0
    disabled_by_default: bool = False


@dataclass(slots=True)
class NumberInfo:
    object_id: str
    key: int
    name: str
    unit_of_measurement: str
    device_id: int = 0
    disabled_by_default: bool = False


def test_indexes_native_metadata_by_every_supported_dimension() -> None:
    amps = SensorInfo("ct1amps", 11, "Panel Amps", "A", 4)
    volts = SensorInfo("main_voltage_a", 12, "Main Voltage A Calibration", "V", 4, True)
    reference = NumberInfo("panel_ref_current", 13, "Panel Ref Current", "A", 4, True)

    catalog = EntityCatalog((amps, volts, reference), connection_generation=7)

    assert catalog.connection_generation == 7
    assert catalog.by_kind("sensor") == (catalog.entities[0], catalog.entities[1])
    assert catalog.by_object_id("sensor", "ct1amps") == (catalog.entities[0],)
    assert catalog.by_name_unit("sensor", "Panel Amps", "A") == (catalog.entities[0],)
    assert catalog.by_name("Panel Amps") == (catalog.entities[0],)
    assert catalog.by_unit("A") == (catalog.entities[0], catalog.entities[2])
    assert catalog.by_device_id(4) == catalog.entities
    assert catalog.entities[1].disabled_by_default
    assert catalog.entities[0].raw_key == ("sensor", 4, 11)
    assert not hasattr(catalog.entities[0], "entity_id")


def test_rejects_duplicate_native_keys_within_kind_and_device() -> None:
    with pytest.raises(EntityCatalogError, match="duplicate native entity key"):
        EntityCatalog(
            (
                SensorInfo("one", 11, "One", "A"),
                SensorInfo("two", 11, "Two", "A"),
            ),
            connection_generation=1,
        )


def test_rejects_invalid_generation_or_metadata() -> None:
    with pytest.raises(EntityCatalogError, match="generation"):
        EntityCatalog((), connection_generation=0)
    with pytest.raises(EntityCatalogError, match="object ID"):
        EntityCatalog((SensorInfo("", 1, "No object", "A"),), connection_generation=1)
