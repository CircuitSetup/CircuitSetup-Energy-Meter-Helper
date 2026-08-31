"""Real workflow totals must retain the existing bounded JSON transport."""

from __future__ import annotations

import asyncio
import json
from dataclasses import replace
from hashlib import sha256

import pytest

from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
    build_meter_configuration_mutation,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    AggregateTotalSource,
    ChannelTotalSource,
    CircuitAggregate,
    CircuitRole,
    EnergyMode,
    MeasurementMethod,
    NativeTotalSource,
    TotalOutputSettings,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    StoredMeterConfiguration,
)
from custom_components.circuitsetup_energy_meter_helper.websocket_api import (
    sanitize_payload,
)
from custom_components.circuitsetup_energy_meter_helper.workflow import (
    WorkflowHandleError,
)
from tests.totals_browser_fixture import MAC, Fixture


async def report_response(operation: str, *, addons: int = 6, label_padding: int = 0,
    mode: EnergyMode = EnergyMode.BIDIRECTIONAL, source_count: int | None = None,
    id_padding: int = 0, max_lengths: bool = False, source_mode: str = "channel",
    label_suffix: str = "") -> tuple[Fixture, dict]:
    """Use actual preview or render/matching-store inventory, not a DTO mock."""
    fixture = Fixture()
    await fixture.initialize("main-only", addons=addons)
    inventory = await fixture.workflow.async_get_meter_configuration("meter-1")
    current = inventory["configuration"]
    count = min(fixture.topology.ct_count, source_count or (8 if operation == "preview" else 12))
    requested = replace(current,
        channels=tuple(replace(channel, name=f"CT{channel.channel}" + label_suffix + " Circuit"[:label_padding]
            + "x" * max(0, label_padding - 8)) for channel in current.channels),
        aggregates=tuple(CircuitAggregate(f"report{index}" + "x" * id_padding, f"Report {index}" + label_suffix + "x" * label_padding,
            CircuitRole.CUSTOM, tuple(ChannelTotalSource("channel", channel) for channel in range(1, count + 1)),
            MeasurementMethod.DIRECT, mode, TotalOutputSettings(True, True, mode is not EnergyMode.NONE))
            for index in range(32)))
    if max_lengths:
        requested = replace(requested,
            channels=tuple(replace(channel, name=channel.name.ljust(64, "x")) for channel in requested.channels),
            aggregates=tuple(replace(aggregate, name=aggregate.name.ljust(64, "x"),
                aggregate_id=aggregate.aggregate_id.ljust(64, "x")) for aggregate in requested.aggregates))
    if source_mode == "native":
        natives = inventory["totals"]["native_sources"]
        sources = tuple(NativeTotalSource("native_total", native.source_id)
            for native in natives if len(natives) == 1 or native.source_id != "overall")
        requested = replace(requested, aggregates=tuple(replace(aggregate, sources=sources)
            for aggregate in requested.aggregates))
    elif source_mode in ("chain", "wide-parent"):
        requested = replace(requested, aggregates=tuple(replace(aggregate,
            sources=(ChannelTotalSource("channel", index + 1 if source_mode == "wide-parent" else 1),)
                if index == 0 or source_mode == "wide-parent" and index < 31 else
                tuple(AggregateTotalSource("aggregate", child.aggregate_id) for child in
                    (requested.aggregates[:31] if source_mode == "wide-parent" else requested.aggregates[index - 1:index])))
            for index, aggregate in enumerate(requested.aggregates)))
    if operation == "preview":
        response = await fixture.workflow.async_preview_total_graph("meter-1", inventory["plan_id"],
            inventory["source_sha256"], requested)
    else:
        handle = fixture.workflow._plans[inventory["plan_id"]]
        rendered = build_meter_configuration_mutation(
            handle.snapshot,
            handle.topology, handle.inventory, requested).proposed_content
        digest = sha256(rendered.encode()).hexdigest()
        stored = StoredMeterConfiguration(digest, requested.meter, requested.channels,
            requested.default_totals, requested.automatic_totals, requested.aggregates,
            requested.power_quality, requested.status_fields, totals_managed=True)
        await fixture.store.async_save_verified_meter_configuration(MAC, inventory["source_sha256"], stored)
        fixture.builder.remote_content = rendered
        response = await fixture.workflow.async_get_meter_configuration("meter-1")
        assert response["configuration"].aggregates == requested.aggregates
        assert response["capabilities"].managed_advanced_totals
    return fixture, response


@pytest.mark.parametrize("operation", ("preview", "inventory"))
def test_42_ct_32_reports_fit_actual_transport(operation: str) -> None:
    """Duplicating display graph evidence must not break previously fitting responses."""
    async def run() -> None:
        fixture, response = await report_response(operation)
        old_shape = sanitize_payload({key: value for key, value in response.items() if key != "total_details"})
        print(operation, "old-shaped bytes", len(json.dumps(old_shape, separators=(",", ":")).encode()))
        transported = sanitize_payload(response)
        assert transported == old_shape
        print(operation, "actual bytes", len(json.dumps(transported, separators=(",", ":")).encode()))
        assert transported["configuration_impact"]["public_total_entity_count"] == 195
        assert not set(fixture.builder.calls) & {"write", "compile", "upload", "restore"}

    asyncio.run(run())


@pytest.mark.parametrize(("addons", "count", "maximum", "source_mode", "suffix"), (
    (6, 28, False, "channel", ""), (6, 19, True, "channel", ""),
    (0, 6, True, "channel", ""), (1, 12, True, "channel", ""), (3, 24, True, "channel", ""),
    (6, 1, True, "chain", ""), (6, 1, True, "wide-parent", ""),
    (6, 42, True, "native", ""), (6, 42, True, "native", " – Küche"),
    (6, 42, True, "native", " – Küche Südstraße"),
))
def test_inventory_transport_preserves_bounded_long_label_and_nested_cases(
    addons: int, count: int, maximum: bool, source_mode: str, suffix: str,
) -> None:
    async def run() -> None:
        fixture, response = await report_response("inventory", addons=addons, source_count=count,
            max_lengths=maximum, source_mode=source_mode, label_suffix=suffix)
        old = sanitize_payload({key: value for key, value in response.items() if key != "total_details"})
        transported = sanitize_payload(response)
        assert transported == old
        details = sanitize_payload(await fixture.workflow.async_get_total_details(
            "meter-1", response["plan_id"], response["source_sha256"]))
        print(addons, count, source_mode, suffix, "old", len(json.dumps(old, separators=(",", ":")).encode()),
            "new", len(json.dumps(transported, separators=(",", ":")).encode()))
        print("details bytes", len(json.dumps(details, separators=(",", ":")).encode()))
        assert set(details) == {"plan_id", "source_sha256", "total_details"}
        assert details["plan_id"] == response["plan_id"]
        assert details["source_sha256"] == response["source_sha256"]
        assert len(details["total_details"]) == 32 + (1 if addons == 0 else addons + 2)
        assert transported["configuration_impact"]["public_total_entity_count"] == 195
        assert response["configuration"].aggregates[0].sources[0].kind in ("channel", "native_total")
        assert not set(fixture.builder.calls) & {"write", "compile", "upload", "restore"}

    asyncio.run(run())


@pytest.mark.parametrize("mode", tuple(EnergyMode))
def test_inventory_transport_preserves_all_energy_modes(mode: EnergyMode) -> None:
    async def run() -> None:
        _, response = await report_response("inventory", max_lengths=True, source_count=19, mode=mode)
        transported = sanitize_payload(response)
        expected = 195 if mode is EnergyMode.BIDIRECTIONAL else 67 if mode is EnergyMode.NONE else 99
        assert transported["configuration_impact"]["public_total_entity_count"] == expected

    asyncio.run(run())


@pytest.mark.parametrize("invalid", ("device", "hash", "plan", "expired", "replaced"))
def test_total_details_reject_unbound_handles_without_side_effects(invalid: str) -> None:
    async def run() -> None:
        fixture, response = await report_response("inventory")
        plan_id, digest = response["plan_id"], response["source_sha256"]
        if invalid == "expired":
            fixture.workflow._clock = lambda: float("inf")
        elif invalid == "replaced":
            await fixture.workflow.async_get_meter_configuration("meter-1")
        calls = list(fixture.builder.calls)
        stored = await fixture.store.async_get_meter_configuration(MAC)
        with pytest.raises(WorkflowHandleError):
            await fixture.workflow.async_get_total_details(
                "other" if invalid == "device" else "meter-1",
                "absent" if invalid == "plan" else plan_id,
                "0" * 64 if invalid == "hash" else digest)
        assert fixture.builder.calls == calls
        assert await fixture.store.async_get_meter_configuration(MAC) == stored

    asyncio.run(run())
