"""Local-only browser fixtures. No Home Assistant or ESPHome connection is created.

Run with the repository's test environment: python -m tests.totals_browser_fixture.
Each explicit session ID owns process-memory source/store state; restart to reset.
"""

from __future__ import annotations

import argparse
import asyncio
import re
from dataclasses import replace
from hashlib import sha256
from types import SimpleNamespace
from typing import Any

import voluptuous as vol
from aiohttp import web

from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionManager,
)
from custom_components.circuitsetup_energy_meter_helper.meter_config_mutator import (
    expected_meter_entity_evidence,
)
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    AggregateTotalSource,
    AutomaticTotalSettings,
    ChannelTotalSource,
    CircuitAggregate,
    CircuitRole,
    ElectricalSystem,
    EnergyMode,
    MeasurementMethod,
    NativeTotalSource,
    TotalOutputSettings,
)
from custom_components.circuitsetup_energy_meter_helper.models import StoredTopology
from custom_components.circuitsetup_energy_meter_helper.provisioning import (
    DiscoveredDevice,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.store import (
    HelperStore,
    LegacyParentLink,
    StoredMeterConfiguration,
    TotalsMigrationRecord,
    _deserialize_meter_configuration_payload,
)
from custom_components.circuitsetup_energy_meter_helper.total_graph import (
    native_total_sources,
)
from custom_components.circuitsetup_energy_meter_helper.websocket_api import (
    _meter_configuration_request,
    sanitize_payload,
)
from custom_components.circuitsetup_energy_meter_helper.workflow import EntryWorkflow
from tests.test_config_transaction import Builder, Job, Verifier, _evidence
from tests.test_meter_inventory import _document, _inventory
from tests.test_store import _CopyingStorage, _record

MAC = "aabbccddeeff"
SCENARIOS = (
    "main-only", "one-addon", "automatic-on", "automatic-off", "native-parent",
    "child-parent", "legacy-parent", "non-helper", "runtime-only", "stale-semantics", "summary", "source-only",
)


class Fixture:
    """Only the external device and storage are doubles; totals use production code."""

    async def initialize(self, name: str, addons: int | None = None) -> None:
        if name not in SCENARIOS or addons is not None and addons not in range(7):
            raise ValueError("Unknown fixture")
        self.name = name
        addons = addons if addons is not None else int(name in ("one-addon", "native-parent", "child-parent"))
        content = _document(contract=True, addon_count=addons)
        # Known models and unchanged channel names make every fixture immediately reviewable.
        content = re.sub(r"(current_cal_ct\d+:) \d+", r"\1 11143", content)
        content = re.sub(r"ct(\d+)_name: [^\n]+", r"ct\1_name: CT\1", content)
        initial = _inventory(content)
        native = native_total_sources(initial.topology)
        content += "sensor:\n" + "".join(
            f"  - id: !extend {sensor_id}\n    internal: {str(source.source_id != 'overall').lower()}\n"
            for source in native
            for sensor_id in (source.power_id, source.current_id, source.existing_energy_id)
            if sensor_id is not None
        )
        if name == "source-only":
            content += ('  - platform: template\n    id: totalChargerWatts\n    name: Charger Power\n'
                '    lambda: return id(ct5Watts).state + id(ct6Watts).state;\n'
                '    unit_of_measurement: W\n    device_class: "power"\n')
        initial = _inventory(content)
        config = initial.configuration
        config = replace(config, meter=replace(config.meter, electrical_system=ElectricalSystem.SPLIT_PHASE_120_240),
            channels=tuple(replace(channel, model_id="sct_006_20a_25ma", custom_gain_ct=None, custom_label=None)
                for channel in config.channels))
        if name in ("automatic-on", "automatic-off"):
            config = replace(config, channels=tuple(replace(channel, role=CircuitRole.GRID)
                if channel.channel in (1, 2) else channel for channel in config.channels))
            if name == "automatic-off":
                config = replace(config, automatic_totals=(AutomaticTotalSettings(
                    "grid-ct1-ct2", False, TotalOutputSettings(True, False, True)),))
        outputs = TotalOutputSettings(True, True, True)

        def aggregate(identifier: str, label: str, sources: tuple[Any, ...]) -> CircuitAggregate:
            return CircuitAggregate(identifier, label, CircuitRole.CUSTOM, sources,
                MeasurementMethod.DIRECT, EnergyMode.CONSUMPTION, outputs)

        if name == "native-parent":
            config = replace(config, aggregates=(aggregate("building", "Whole building", (
                NativeTotalSource("native_total", "board-main"), NativeTotalSource("native_total", "board-addon-1"))),))
        if name in ("child-parent", "legacy-parent"):
            children = (aggregate("east", "East", (ChannelTotalSource("channel", 1),)),
                aggregate("west", "West", (ChannelTotalSource("channel", 2),)))
            parent_sources = (AggregateTotalSource("aggregate", "east"), AggregateTotalSource("aggregate", "west"))
            if name == "legacy-parent":
                parent_sources = (ChannelTotalSource("channel", 3),)
            config = replace(config, aggregates=(*children, aggregate("building", "Whole building", parent_sources)))
        if name == "summary":
            config = replace(config,
                channels=tuple(replace(channel, role=CircuitRole.GRID) if channel.channel in (1, 2)
                    else channel for channel in config.channels),
                aggregates=(
                    replace(aggregate("hidden", "Hidden branch", (ChannelTotalSource("channel", 3),)),
                        outputs=TotalOutputSettings(False, False, False)),
                    aggregate("parent", "Parent report", (AggregateTotalSource("aggregate", "hidden"),)),
                    replace(aggregate("watts-only", "Watts only report", (ChannelTotalSource("channel", 4),)),
                        outputs=TotalOutputSettings(True, False, False)),
                ))
        self.store = object.__new__(HelperStore)
        self.store._store = _CopyingStorage()
        self.store._update_lock = asyncio.Lock()
        digest = sha256(content.encode()).hexdigest()
        topology = initial.topology
        await self.store.async_save_meter(replace(_record(digest), topology=StoredTopology(
            topology.addon_count, topology.board_count, topology.ct_count, topology.group_count,
            topology.connection_type, topology.voltage_layout, topology.project_name)))
        stored = StoredMeterConfiguration(digest, config.meter, config.channels, config.default_totals,
            config.automatic_totals, config.aggregates, config.power_quality, config.status_fields,
            totals_managed=name not in ("non-helper", "runtime-only"),
            totals_migration=TotalsMigrationRecord(True, (LegacyParentLink("east", "building"),
                LegacyParentLink("west", "building"))) if name == "legacy-parent" else
                TotalsMigrationRecord(True, (LegacyParentLink("watts-only", "parent"),)) if name == "summary" else None)
        if name == "legacy-parent":
            legacy = {key: value for key, value in sanitize_payload(stored).items()
                if key not in ("default_totals", "automatic_totals", "totals_managed", "totals_migration")}
            legacy["aggregates"] = [{"aggregate_id": item.aggregate_id, "name": item.name, "role": item.role.value,
                "channels": [source.channel for source in item.sources], "measurement_method": "direct",
                "energy_mode": "consumption", "expose_power": True, "expose_current": True,
                "parent_id": "building" if item.aggregate_id != "building" else None} for item in config.aggregates]
            stored = _deserialize_meter_configuration_payload(legacy, topology)
        if name != "source-only":
            await self.store.async_save_verified_meter_configuration(MAC, digest, stored)
        if name == "stale-semantics":
            # Real store decoding rejects this unsupported stored electrical profile.
            self.store._store.data["meters"][MAC]["meter_configuration"]["meter"]["electrical_system"] = "obsolete"
        self.builder = Builder(remote_content=content)
        self.verifier = Verifier(replace(_evidence(), topology=initial.topology))
        self.device = DiscoveredDevice("meter-1", "CircuitSetup meter", initial.topology.project_name,
            project_version="2026.8.0", configuration=None if name == "runtime-only" else "meter.yaml")

        class Hass:
            config_entries = SimpleNamespace(async_get_entry=lambda _entry: SimpleNamespace(unique_id=MAC))

            async def async_add_executor_job(self, target: Any, *args: Any) -> Any:
                return target(*args)

        self.workflow = EntryWorkflow(Hass(), SimpleNamespace(snapshot=SimpleNamespace(devices=(self.device,))),
            SessionManager(), self.store, "meter-1", None, self.builder, handle_ttl=3600)
        self.manager = ConfigTransactionManager(self.builder, self.verifier, self.store, SessionManager(),
            reconnect_timeout=0.01, reconnect_backoff_initial=0.001)
        self.workflow.transactions = self.manager
        self.topology = initial.topology
        self.frames: list[dict[str, Any]] = []

    async def call(self, frame: dict[str, Any]) -> Any:
        operation = frame["type"].split("/")[-1]
        self.frames.append(frame)
        if operation in ("setup_status", "subscribe_setup"):
            return {"state": "device_discovered", "devices": [self.device],
                "bound_device_id": "meter-1", "configuration_authoritative": self.name != "runtime-only"}
        if operation == "rescan":
            return {"state": "device_discovered", "devices": [self.device]}
        if operation == "get_topology":
            return {"topology": self.topology, "configuration_authoritative": self.name != "runtime-only"}
        if operation == "get_meter_configuration":
            return await self.workflow.async_get_meter_configuration("meter-1")
        if operation == "get_active_work":
            return {"session": None, "transaction": self.manager.active_status(MAC), "verified_calibration": None}
        if operation in ("preview_total_graph", "preview_meter_configuration"):
            requested = _meter_configuration_request(frame["configuration"])
            if operation == "preview_meter_configuration":
                plan = self.workflow._plan(frame["plan_id"], "meter-1", frame["source_sha256"])
                evidence = expected_meter_entity_evidence(requested, plan.topology,
                    document=ESPHomeConfigDocument.parse(plan.snapshot.content), previous=plan.inventory.configuration,
                    native_visibility_resolved=plan.inventory.native_visibility_resolved)
                self.verifier.evidence = replace(_evidence(), topology=plan.topology,
                    ct_names={channel.channel: channel.name for channel in requested.channels},
                    current_sensor_count=len(requested.channels), sensor_entities=evidence.sensor_entities)
            method = getattr(self.workflow, f"async_{operation}")
            return await method("meter-1", frame["plan_id"], frame["source_sha256"], requested)
        if operation == "apply_ct_config":
            return await self.manager.async_confirm_write(frame["transaction_id"], "fixture-user")
        if operation == "compile_ct_config":
            return await self.manager.async_compile(frame["transaction_id"])
        if operation == "install_ct_config":
            return await self.manager.async_confirm_install(frame["transaction_id"], "fixture-user")
        if operation == "rollback_ct_config":
            return await self.manager.async_rollback(frame["transaction_id"])
        if operation == "abandon_ct_config":
            return await self.manager.async_abandon(frame["transaction_id"])
        if operation == "subscribe_config_transaction":
            return self.manager.status(frame["transaction_id"])
        if operation == "unsubscribe_events":
            return None
        raise ValueError(f"Unsupported fixture operation: {operation}")


def create_app(port: int, frontend_port: int) -> web.Application:
    sessions: dict[str, Fixture] = {}
    expected_host = f"127.0.0.1:{port}"
    expected_origin = f"http://127.0.0.1:{frontend_port}"

    @web.middleware
    async def local_only(request: web.Request, handler: Any) -> web.StreamResponse:
        if request.host != expected_host or request.headers.get("Origin", expected_origin) != expected_origin:
            raise web.HTTPForbidden(text="Local fixture origin required")
        return await handler(request)

    app = web.Application(middlewares=[local_only], client_max_size=512 * 1024)

    async def fixture(request: web.Request) -> Fixture:
        session_id = request.query.get("session", "")
        name = request.query.get("fixture", "main-only")
        if re.fullmatch(r"[a-zA-Z0-9_-]{1,80}", session_id) is None or name not in SCENARIOS:
            raise web.HTTPBadRequest(text="Explicit session and known fixture required")
        if session_id not in sessions:
            if len(sessions) >= 128:
                raise web.HTTPServiceUnavailable(text="Restart fixture server to reset sessions")
            value = Fixture()
            addons = request.query.get("addons")
            await value.initialize(name, int(addons) if addons is not None else None)
            sessions[session_id] = value
        if sessions[session_id].name != name:
            raise web.HTTPBadRequest(text="Session already belongs to another fixture")
        return sessions[session_id]

    async def health(_request: web.Request) -> web.Response:
        return web.json_response({"service": "hierarchical-totals-test-fixture", "scenarios": SCENARIOS})

    async def rpc(request: web.Request) -> web.Response:
        value = await fixture(request)
        frame = await request.json()
        if frame["type"] == "fixture_state":
            active = value.manager.active_status(MAC)
            transaction = value.manager._transaction(active.transaction_id) if active else None
            return web.json_response({**sanitize_payload({"frames": value.frames, "builder_calls": value.builder.calls,
                "stored": await value.store.async_get_meter_configuration_read(MAC)}),
                # Deliberately outside the production sanitizer: only this fabricated local source is readable.
                "source_content": value.builder.remote_content,
                "proposed_content": transaction.plan.proposed_content if transaction and transaction.plan else None})
        if frame["type"] == "fixture_outcome":
            value.builder.validation = [Job(frame.get("validation", True))]
            value.builder.compile = Job(frame.get("compile", True))
            value.builder.upload = Job(frame.get("install", True))
            return web.json_response({"ok": True})
        try:
            return web.json_response(sanitize_payload(await value.call(frame)))
        except (ValueError, KeyError, vol.Invalid) as error:
            return web.json_response({"error": str(error)}, status=400)

    async def websocket(request: web.Request) -> web.WebSocketResponse:
        value = await fixture(request)
        socket = web.WebSocketResponse(max_msg_size=512 * 1024)
        await socket.prepare(request)
        await socket.send_json({"type": "auth_required"})
        async for message in socket:
            frame = message.json()
            if frame["type"] == "auth":
                await socket.send_json({"type": "auth_ok"})
                continue
            try:
                result = sanitize_payload(await value.call(frame))
                await socket.send_json({"id": frame["id"], "type": "result", "success": True, "result": result})
            except (ValueError, KeyError, RuntimeError, vol.Invalid) as error:
                await socket.send_json({"id": frame["id"], "type": "result", "success": False,
                    "error": {"code": "fixture_error", "message": str(error)}})
        return socket

    async def cleanup(_app: web.Application) -> None:
        for value in sessions.values():
            await value.manager.sessions.async_unload()

    app.router.add_get("/health", health)
    app.router.add_post("/rpc", rpc)
    app.router.add_get("/api/websocket", websocket)
    app.on_cleanup.append(cleanup)
    return app


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4174)
    parser.add_argument("--frontend-port", type=int, default=4173)
    args = parser.parse_args()
    web.run_app(create_app(args.port, args.frontend_port), host="127.0.0.1", port=args.port)
