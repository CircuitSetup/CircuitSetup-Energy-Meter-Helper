"""Tests for strict CircuitSetup calibration entity binding."""

from __future__ import annotations

import re
from asyncio import run
from dataclasses import dataclass, replace
from hashlib import sha256
from types import SimpleNamespace
from typing import Any

import pytest
from aioesphomeapi import ButtonInfo as ApiButtonInfo
from aioesphomeapi import NumberInfo as ApiNumberInfo
from aioesphomeapi import SensorInfo as ApiSensorInfo
from aioesphomeapi.model import build_device_unique_id

from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.entity_binding import (
    EntityBindingAmbiguity,
    EntityBindingMissing,
    ResolutionSource,
    bind_meter,
    group_key,
)
from custom_components.circuitsetup_energy_meter_helper.entity_catalog import (
    EntityCatalog,
)
from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology
from custom_components.circuitsetup_energy_meter_helper.provisioning import (
    DiscoveredDevice,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.store import HelperStore
from custom_components.circuitsetup_energy_meter_helper.workflow import (
    EntryWorkflow,
    WorkflowHandleError,
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
    disabled_by_default: bool = True


@dataclass(slots=True)
class ButtonInfo:
    object_id: str
    key: int
    name: str
    unit_of_measurement: str = ""
    device_id: int = 0
    disabled_by_default: bool = True


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9_-]", "", value.casefold().replace(" ", "_"))


def topology(addon_count: int) -> MeterTopology:
    addon_suffix = (
        ""
        if addon_count == 0
        else f"-{addon_count}-{'addon' if addon_count == 1 else 'addons'}"
    )
    return MeterTopology.from_addon_count(
        addon_count,
        connection_type="wifi",
        voltage_layout="single",
        project_name=f"circuitsetup.6c-energy-meter{addon_suffix}",
        evidence=(),
    )


def substitutions(addon_count: int, prefix: str = "CT") -> dict[str, str]:
    values = {
        f"ct{channel}_name": f"{prefix}{channel}"
        for channel in range(1, 6 * (addon_count + 1) + 1)
    }
    values.update(
        {"main_meter_name1": "Main Meter 1", "main_meter_name2": "Main Meter 2"}
    )
    for board in range(1, addon_count + 1):
        values[f"addon{board}_name1"] = f"Add-on {board} Meter 1"
        values[f"addon{board}_name2"] = f"Add-on {board} Meter 2"
    return values


def synthetic_entities(
    addon_count: int,
    *,
    prefix: str = "CT",
    key_offset: int = 0,
) -> list[object]:
    values = substitutions(addon_count, prefix)
    entities: list[object] = []
    key = key_offset
    phases = "abc"
    for board_index in range(addon_count + 1):
        for group_index in range(2):
            group_name_key = (
                f"main_meter_name{group_index + 1}"
                if board_index == 0
                else f"addon{board_index}_name{group_index + 1}"
            )
            group_name = values[group_name_key]
            device_id = board_index + 1
            first_channel = board_index * 6 + group_index * 3 + 1

            def add(info: object) -> None:
                nonlocal key
                key += 1
                info.key = key
                entities.append(info)

            voltage_ref_name = f"{group_name} Ref V {group_index + 1}"
            add(NumberInfo(slug(voltage_ref_name), 0, voltage_ref_name, "V", device_id))
            for channel in range(first_channel, first_channel + 3):
                ct_name = values[f"ct{channel}_name"]
                ref_name = f"{ct_name} Ref Current"
                add(NumberInfo(slug(ref_name), 0, ref_name, "A", device_id))

            run_name = f"3. Run {group_name} Gain Cal"
            clear_name = f"z3. Clear {group_name} Gain Cal"
            add(ButtonInfo(slug(run_name), 0, run_name, device_id=device_id))
            add(ButtonInfo(slug(clear_name), 0, clear_name, device_id=device_id))

            for phase_index, phase in enumerate(phases):
                if board_index == 0 and group_index == 0 and phase == "a":
                    object_id = "ic1volts"
                    name = "Voltage 1"
                else:
                    object_id = (
                        f"meter_main{group_index + 1}_voltage_{phase}_calibration"
                        if board_index == 0
                        else f"addon{board_index}_{group_index + 1}_voltage_{phase}_calibration"
                    )
                    name = f"{group_name} Voltage {phase.upper()} Calibration"
                add(SensorInfo(object_id, 0, name, "V", device_id, True))

                channel = first_channel + phase_index
                ct_name = values[f"ct{channel}_name"]
                add(
                    SensorInfo(
                        f"ct{channel}amps",
                        0,
                        f"{ct_name} Amps",
                        "A",
                        device_id,
                    )
                )
    return entities


@pytest.mark.parametrize("addon_count", (0, 1, 6))
def test_binds_complete_unique_topology_for_every_supported_scale(
    addon_count: int,
) -> None:
    expected_topology = topology(addon_count)
    catalog = EntityCatalog(
        synthetic_entities(addon_count), connection_generation=addon_count + 1
    )

    binding = bind_meter(catalog, expected_topology, substitutions(addon_count))

    assert len(binding.groups) == expected_topology.group_count
    assert len(binding.channels) == expected_topology.ct_count
    assert [channel.channel for channel in binding.channels] == list(
        range(1, expected_topology.ct_count + 1)
    )
    assert all(len(group.references) == 4 for group in binding.groups)
    assert all(len(group.buttons) == 2 for group in binding.groups)
    assert all(len(group.voltage_sensors) == 3 for group in binding.groups)
    assert all(len(group.current_sensors) == 3 for group in binding.groups)
    raw_keys = [entity.descriptor.raw_key for entity in binding.entities]
    assert len(raw_keys) == len(set(raw_keys)) == 12 * expected_topology.group_count
    assert any(entity.descriptor.disabled_by_default for entity in binding.entities)
    assert binding.connection_generation == addon_count + 1


def test_group_key_is_exact_and_bounded() -> None:
    assert group_key(0, 0) == "main_1"
    assert group_key(6, 1) == "addon6_2"
    with pytest.raises(ValueError):
        group_key(-1, 0)
    with pytest.raises(ValueError):
        group_key(0, 2)


def test_resolution_order_prefers_stored_then_id_then_name_then_pattern() -> None:
    values = substitutions(0)
    entities = synthetic_entities(0)
    ct1 = next(entity for entity in entities if entity.object_id == "ct1amps")
    manual = SensorInfo("manual_ct1", 500, "Manual channel", "A", 1)
    duplicate_name = SensorInfo("duplicate_name", 501, ct1.name, "A", 1)

    stored = bind_meter(
        EntityCatalog((*entities, manual, duplicate_name), connection_generation=1),
        topology(0),
        values,
        stored_mapping={"ct1.current_sensor": "manual_ct1"},
    )
    assert stored.role("ct1.current_sensor").descriptor.object_id == "manual_ct1"
    assert stored.role("ct1.current_sensor").source == ResolutionSource.STORED

    by_id = bind_meter(
        EntityCatalog((*entities, duplicate_name), connection_generation=1),
        topology(0),
        values,
    )
    assert by_id.role("ct1.current_sensor").descriptor.object_id == "ct1amps"
    assert by_id.role("ct1.current_sensor").source == ResolutionSource.OBJECT_ID

    by_name_entities = [
        replace(entity, object_id="legacy_current") if entity is ct1 else entity
        for entity in entities
    ]
    by_name = bind_meter(
        EntityCatalog(by_name_entities, connection_generation=1), topology(0), values
    )
    assert by_name.role("ct1.current_sensor").source == ResolutionSource.NAME_UNIT

    by_pattern_entities = [
        replace(
            entity,
            object_id="legacy_ct1_amps_sensor",
            name="Legacy CT1 channel amps",
        )
        if entity is ct1
        else entity
        for entity in entities
    ]
    by_pattern = bind_meter(
        EntityCatalog(by_pattern_entities, connection_generation=1),
        topology(0),
        values,
    )
    assert by_pattern.role("ct1.current_sensor").source == ResolutionSource.PATTERN


def test_missing_and_ambiguous_roles_fail_closed_with_manual_repair_metadata() -> None:
    values = substitutions(0)
    entities = synthetic_entities(0)
    without_ct1 = [entity for entity in entities if entity.object_id != "ct1amps"]

    with pytest.raises(EntityBindingMissing, match="ct1.current_sensor"):
        bind_meter(EntityCatalog(without_ct1, 1), topology(0), values)

    ambiguous = [
        *without_ct1,
        SensorInfo("legacy_ct1_amps_one", 700, "Legacy CT1 amps one", "A", 1),
        SensorInfo("legacy_ct1_amps_two", 701, "Legacy CT1 amps two", "A", 1),
    ]
    with pytest.raises(EntityBindingAmbiguity) as error:
        bind_meter(EntityCatalog(ambiguous, 1), topology(0), values)

    assert error.value.role == "ct1.current_sensor"
    option_ids = {option.object_id for option in error.value.manual_options}
    assert {"legacy_ct1_amps_one", "legacy_ct1_amps_two"} <= option_ids
    assert len(option_ids) == len(error.value.manual_options)
    assert all(
        "sensor" in option.label and "A" in option.label
        for option in error.value.manual_options
    )
    assert error.value.manual_options[0].persisted_mapping == {
        "ct1.current_sensor": error.value.manual_options[0].object_id
    }


def test_one_native_entity_cannot_serve_two_roles_and_offers_unused_repair() -> None:
    entities = synthetic_entities(0)
    entities.append(SensorInfo("shared", 900, "Shared", "A", 1))

    with pytest.raises(EntityBindingAmbiguity, match="already bound") as error:
        bind_meter(
            EntityCatalog(entities, 1),
            topology(0),
            substitutions(0),
            stored_mapping={
                "ct1.current_sensor": "shared",
                "ct2.current_sensor": "shared",
            },
        )

    object_ids = {option.object_id for option in error.value.manual_options}
    assert "shared" not in object_ids
    assert "ct2amps" in object_ids


def test_rebind_after_rename_discards_old_generation_keys() -> None:
    old_catalog = EntityCatalog(synthetic_entities(1), connection_generation=1)
    old_binding = bind_meter(old_catalog, topology(1), substitutions(1))
    old_keys = {entity.descriptor.raw_key for entity in old_binding.entities}

    new_catalog = EntityCatalog(
        synthetic_entities(1, prefix="Renamed Panel ", key_offset=1000),
        connection_generation=2,
    )
    new_binding = old_binding.rebind(new_catalog, substitutions(1, "Renamed Panel "))
    new_keys = {entity.descriptor.raw_key for entity in new_binding.entities}

    assert new_binding.connection_generation == 2
    assert old_keys.isdisjoint(new_keys)
    assert (
        new_binding.role("ct1.current_sensor").descriptor.name == "Renamed Panel 1 Amps"
    )
    assert (
        new_binding.role("ct1.reference_current").descriptor.name
        == "Renamed Panel 1 Ref Current"
    )
    assert new_binding.semantic_mapping["ct1.reference_current"] == slug(
        "Renamed Panel 1 Ref Current"
    )


def test_channel_pattern_requires_both_ct1_token_boundaries() -> None:
    entities = synthetic_entities(6)
    ct1 = next(entity for entity in entities if entity.object_id == "ct1amps")
    entities[entities.index(ct1)] = replace(
        ct1, object_id="legacy_ct1_amp_sensor", name="Legacy CT1 amp sensor"
    )
    entities.append(
        SensorInfo("product1_amp_sensor", 5000, "Product1 amp sensor", "A", 99)
    )

    binding = bind_meter(EntityCatalog(entities, 1), topology(6), substitutions(6))

    assert binding.role("ct1.current_sensor").source == ResolutionSource.PATTERN


@pytest.mark.parametrize(
    ("board_index", "group_index", "group_label"),
    (
        (0, 0, "Main Meter 1"),
        (1, 1, "Add-on 1 Meter 2"),
    ),
)
def test_group_pattern_matches_exact_phase_for_main_and_addon(
    board_index: int, group_index: int, group_label: str
) -> None:
    entities = synthetic_entities(1)
    key = group_key(board_index, group_index)
    for phase in "abc":
        expected_object_id = (
            "ic1volts"
            if board_index == 0 and group_index == 0 and phase == "a"
            else (
                f"meter_main{group_index + 1}_voltage_{phase}_calibration"
                if board_index == 0
                else f"addon{board_index}_{group_index + 1}_voltage_{phase}_calibration"
            )
        )
        sensor = next(
            entity
            for entity in entities
            if isinstance(entity, SensorInfo) and entity.object_id == expected_object_id
        )
        entities[entities.index(sensor)] = replace(
            sensor,
            object_id=f"legacy_{key}_voltage_{phase}_input",
            name=f"Legacy {group_label} Voltage {phase.upper()} Input",
        )

    binding = bind_meter(EntityCatalog(entities, 1), topology(1), substitutions(1))

    for phase in "abc":
        entity = binding.role(f"{key}.voltage_{phase}")
        assert entity.source == ResolutionSource.PATTERN
        assert entity.descriptor.object_id == f"legacy_{key}_voltage_{phase}_input"


def test_main_group_pattern_accepts_official_name_form() -> None:
    entities = synthetic_entities(0)
    reference = next(
        entity
        for entity in entities
        if isinstance(entity, NumberInfo) and entity.name == "Main Meter 1 Ref V 1"
    )
    entities[entities.index(reference)] = replace(
        reference,
        object_id="legacy_main_reference_voltage",
        name="Legacy Main Meter 1 Ref V Input",
    )

    binding = bind_meter(EntityCatalog(entities, 1), topology(0), substitutions(0))

    assert binding.role("main_1.reference_voltage").source == ResolutionSource.PATTERN


def test_missing_heuristics_offer_unused_same_kind_unit_manual_choices() -> None:
    entities = synthetic_entities(0)
    ct1 = next(entity for entity in entities if entity.object_id == "ct1amps")
    entities[entities.index(ct1)] = replace(
        ct1, object_id="completely_custom", name="Unrelated custom input"
    )

    with pytest.raises(EntityBindingMissing) as error:
        bind_meter(EntityCatalog(entities, 1), topology(0), substitutions(0))

    options = error.value.manual_options
    assert "completely_custom" in {option.object_id for option in options}
    assert len({option.object_id for option in options}) == len(options)
    assert all("sensor" in option.label and "A" in option.label for option in options)


def test_duplicate_object_ids_are_explicitly_unrepairable() -> None:
    entities = synthetic_entities(0)
    current_sensors = [
        entity
        for entity in entities
        if isinstance(entity, SensorInfo) and entity.unit_of_measurement == "A"
    ]
    for pair_index, entity in enumerate(current_sensors):
        entities[entities.index(entity)] = replace(
            entity,
            object_id=f"duplicate_pair_{pair_index // 2}",
            name=f"Unrelated input {pair_index}",
        )

    with pytest.raises(EntityBindingMissing, match="duplicate object IDs") as error:
        bind_meter(EntityCatalog(entities, 1), topology(0), substitutions(0))

    assert error.value.manual_options == ()


class _LabelRegistry:
    def __init__(self, entities: dict[str, SimpleNamespace]) -> None:
        self.entities = entities

    def async_get_entity_id(self, domain: str, platform: str, unique_id: str) -> str | None:
        return next((entry.entity_id for entry in self.entities.values()
            if entry.domain == domain and entry.platform == platform and entry.unique_id == unique_id), None)

    def async_get(self, entity_id: str) -> SimpleNamespace | None:
        return self.entities.get(entity_id)

    def async_update_entity(self, entity_id: str, *, name: str) -> None:
        self.entities[entity_id].name = name


def _label_workflow(monkeypatch: pytest.MonkeyPatch) -> tuple[EntryWorkflow, _LabelRegistry, dict[str, int]]:
    values = substitutions(0)
    content = "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter\nsubstitutions:\n" + "".join(
        f"  {key}: '{value}'\n" for key, value in values.items()
    ) + "".join(f"  current_cal_ct{channel}: '5500'\n" for channel in range(1, 7))
    digest = sha256(content.encode()).hexdigest()
    async def no_stored_selections(_store: HelperStore, _mac: str) -> tuple[Any, ...]:
        return ()
    monkeypatch.setattr(HelperStore, "async_get_ct_selections", no_stored_selections)
    calls = {name: 0 for name in ("list", "get", "update", "validate", "compile", "upload", "restart")}

    class Builder:
        async def async_list_devices(self) -> dict[str, Any]:
            calls["list"] += 1
            return {"configured": [{"name": "meter", "configuration": "meter.yaml"}]}

        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            calls["get"] += 1
            return ESPHomeConfigSnapshot(configuration, content, digest)

        def __getattr__(self, name: str) -> Any:
            if name.startswith("async_"):
                async def unexpected(*_args: Any, **_kwargs: Any) -> None:
                    calls[next(key for key in calls if key in name)] += 1
                return unexpected
            raise AttributeError(name)

    api_entities: list[Any] = []
    for item in synthetic_entities(0):
        common = {
            "object_id": item.object_id,
            "key": item.key,
            "name": item.name,
            "device_id": item.device_id,
            "disabled_by_default": item.disabled_by_default,
        }
        if isinstance(item, SensorInfo):
            api_entities.append(ApiSensorInfo(**common, unit_of_measurement=item.unit_of_measurement))
        elif isinstance(item, NumberInfo):
            api_entities.append(ApiNumberInfo(**common, unit_of_measurement=item.unit_of_measurement))
        else:
            api_entities.append(ApiButtonInfo(**common))

    class Api:
        entities = tuple(api_entities)
        connection_generation = 1

        async def async_connect(self) -> None:
            return None

        async def async_restart(self) -> None:
            calls["restart"] += 1

    entry = SimpleNamespace(entry_id="meter", unique_id="aa:bb:cc:dd:ee:ff")
    registry_entries: dict[str, SimpleNamespace] = {}
    for item in api_entities:
        if isinstance(item, ApiSensorInfo) and item.unit_of_measurement == "A":
            entity_id = f"sensor.meter_{item.object_id}"
            registry_entries[entity_id] = SimpleNamespace(entity_id=entity_id, domain="sensor",
                platform="esphome", unique_id=build_device_unique_id("aabbccddeeff", item),
                config_entry_id="meter", name=None)
    registry = _LabelRegistry(registry_entries)
    hass = SimpleNamespace(
        data={},
        config=SimpleNamespace(config_dir="."),
        config_entries=SimpleNamespace(async_get_entry=lambda entry_id: entry if entry_id == "meter" else None),
    )
    monkeypatch.setattr("custom_components.circuitsetup_energy_meter_helper.workflow.er.async_get", lambda _hass: registry)
    provisioning = SimpleNamespace(snapshot=SimpleNamespace(devices=(
        DiscoveredDevice("meter", "Meter", "circuitsetup.6c-energy-meter", "2026.8.0", False, "meter.yaml"),
    )))
    workflow = EntryWorkflow(hass, provisioning, SessionManager(), HelperStore(hass), "meter",
        Api(), Builder())  # type: ignore[arg-type]
    run(workflow.async_get_ct_inventory("meter"))
    return workflow, registry, calls


def test_ha_labels_use_task15_current_sensor_binding_and_persist_without_builder_mutation(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    workflow, registry, calls = _label_workflow(monkeypatch)
    plan = next(iter(workflow._plans.values()))
    baseline = calls.copy()

    result = run(workflow.async_set_ha_labels("meter", plan.plan_id, plan.snapshot.sha256,
        ({"channel": 1, "name": "Kitchen mains"},)))
    unchanged = run(workflow.async_set_ha_labels("meter", plan.plan_id, plan.snapshot.sha256,
        ({"channel": 1, "name": "Kitchen mains"},)))

    target = next(entry for entry in registry.entities.values() if entry.unique_id.endswith("/sensor/CT1 Amps"))
    assert target.name == "Kitchen mains"
    assert result == {"mode": "home_assistant_labels", "results": [{"channel": 1, "state": "updated"}]}
    assert unchanged == {"mode": "home_assistant_labels", "results": [{"channel": 1, "state": "unchanged"}]}
    assert calls == baseline
    assert "entity_id" not in repr(result)


@pytest.mark.parametrize("changes", [
    ({"channel": 0, "name": "Unknown"},),
    ({"channel": 1, "name": "bad\nlabel"},),
    ({"channel": 1, "name": "Duplicate"}, {"channel": 1, "name": "Again"}),
])
def test_ha_labels_refuse_unknown_or_malformed_changes_without_partial_updates(
    monkeypatch: pytest.MonkeyPatch, changes: tuple[dict[str, Any], ...],
) -> None:
    workflow, registry, _calls = _label_workflow(monkeypatch)
    plan = next(iter(workflow._plans.values()))

    with pytest.raises(WorkflowHandleError):
        run(workflow.async_set_ha_labels("meter", plan.plan_id, plan.snapshot.sha256, changes))

    assert all(entry.name is None for entry in registry.entities.values())


def test_ha_labels_refuse_foreign_ownership_and_collisions_atomically(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    workflow, registry, _calls = _label_workflow(monkeypatch)
    plan = next(iter(workflow._plans.values()))
    ct2 = next(entry for entry in registry.entities.values() if entry.unique_id.endswith("/sensor/CT2 Amps"))
    ct2.config_entry_id = "foreign-meter"

    with pytest.raises(WorkflowHandleError, match="owned"):
        run(workflow.async_set_ha_labels("meter", plan.plan_id, plan.snapshot.sha256,
            ({"channel": 1, "name": "First"}, {"channel": 2, "name": "Second"})))
    assert all(entry.name is None for entry in registry.entities.values())

    ct2.config_entry_id = "meter"
    ct2.name = "Already used"
    with pytest.raises(WorkflowHandleError, match="conflicts"):
        run(workflow.async_set_ha_labels("meter", plan.plan_id, plan.snapshot.sha256,
            ({"channel": 1, "name": "Already used"},)))
    assert next(entry for entry in registry.entities.values() if entry.unique_id.endswith("/sensor/CT1 Amps")).name is None
