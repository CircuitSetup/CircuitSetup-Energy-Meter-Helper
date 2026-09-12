from __future__ import annotations

from hashlib import sha256
from types import SimpleNamespace
from typing import ClassVar

import pytest

from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
    _apply_package_options,
    build_calibration_preparation_mutation,
    package_capabilities_from_document,
    package_graph_owner_is_official,
)
from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionManager,
    ConfigTransactionState,
    ReconnectEvidence,
)
from custom_components.circuitsetup_energy_meter_helper.device_builder import (
    ESPHomeConfigSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.models import (
    ConfigMutationPlan,
    MeterTopology,
    SubstitutionChange,
)
from custom_components.circuitsetup_energy_meter_helper.provisioning import (
    DiscoveredDevice,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from custom_components.circuitsetup_energy_meter_helper.topology import (
    _official_package_graph,
)
from custom_components.circuitsetup_energy_meter_helper.workflow import EntryWorkflow


def test_unresolved_local_package_does_not_inherit_official_authority() -> None:
    content = _official_comments_stripped_config().replace(
        "packages:\n", "packages:\n  local_custom: !include custom.yaml\n"
    )
    document = ESPHomeConfigDocument.parse(content)
    assert not package_graph_owner_is_official(document)
    assert not _official_package_graph(document)
    assert all(
        capability.state == "cannot_safely_manage"
        for capability in package_capabilities_from_document(document, _main_topology())
    )
    with pytest.raises(ValueError, match="unresolved"):
        _apply_package_options(
            content, _main_topology(),
            {"power_quality": (True,), "status_fields": (True,)},
        )


def _official_comments_stripped_config() -> str:
    return """esphome:
  project:
    name: circuitsetup.6c-energy-meter
    version: \"1.8\"
packages:
  remote_package:
    url: https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter
    ref: master
    refresh: 1d
    files:
      - Software/ESPHome/6chan_common.yaml
      - Software/ESPHome/meter_sensors/6chan_main_sensor.yaml
      - Software/ESPHome/status_fields/6chan_main_status.yaml
      - Software/ESPHome/calibration/6chan_main_calibration.yaml
"""


def _main_topology() -> MeterTopology:
    return MeterTopology.from_addon_count(
        0,
        connection_type="wifi",
        voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter",
        evidence=(),
    )


def test_comments_stripped_official_package_can_prepare_power_quality() -> None:
    """Deleting the optional comment must not strand the reviewed enable action."""
    content = _official_comments_stripped_config()

    proposed, changes = _apply_package_options(
        content,
        _main_topology(),
        {"power_quality": (True,), "status_fields": (True,)},
    )

    assert proposed.count(
        "Software/ESPHome/power_quality/6chan_main_power_quality.yaml"
    ) == 1
    assert (
        "      - Software/ESPHome/power_quality/6chan_main_power_quality.yaml\n"
        in proposed
    )
    assert [change.key for change in changes] == ["power_quality_main"]


@pytest.mark.parametrize("line_ending", ("\n", "\r\n"))
def test_package_preparation_preserves_line_endings_without_final_newline(
    line_ending: str,
) -> None:
    content = line_ending.join(
        (
            "packages:",
            "  meter:",
            "    url: https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter",
            "    ref: master",
            "    files:",
            "      #- Software/ESPHome/power_quality/6chan_main_power_quality.yaml",
            "      - Software/ESPHome/status_fields/6chan_main_status.yaml",
        )
    )

    proposed, _ = _apply_package_options(
        content,
        _main_topology(),
        {"power_quality": (True,), "status_fields": (True,)},
    )

    assert line_ending + "      - Software/ESPHome/power_quality" in proposed
    assert not proposed.endswith(("\n", "\r"))
    if line_ending == "\r\n":
        assert "\n" not in proposed.replace("\r\n", "")


def test_sequence_package_source_fields_after_files_still_insert_inside_files() -> None:
    content = """packages:
  - files:
      #- Software/ESPHome/power_quality/6chan_main_power_quality.yaml
    url: https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter
    ref: master"""

    proposed, _ = _apply_package_options(
        content,
        _main_topology(),
        {"power_quality": (True,), "status_fields": (False,)},
    )

    assert proposed.index("      - Software/ESPHome/power_quality") < proposed.index(
        "    url:"
    )


def test_calibration_preparation_inserts_only_the_reviewed_official_control_package() -> None:
    content = _official_comments_stripped_config().replace(
        "      - Software/ESPHome/calibration/6chan_main_calibration.yaml\n", ""
    ).replace(
        "esphome:\n",
        "substitutions:\n"
        "  offset_calibration: true\n"
        "  gain_calibration: true\n\n"
        "esphome:\n",
    )
    snapshot = ESPHomeConfigSnapshot(
        "meter.yaml", content, sha256(content.encode()).hexdigest()
    )

    plan = build_calibration_preparation_mutation(snapshot, _main_topology())

    assert [change.key for change in plan.changes] == ["package.main.calibration"]
    assert plan.proposed_content.count(
        "Software/ESPHome/calibration/6chan_main_calibration.yaml"
    ) == 1
    assert "static_offset" not in plan.proposed_content


def test_calibration_preparation_enables_only_literal_known_flags() -> None:
    content = _official_comments_stripped_config().replace(
        "esphome:\n",
        "substitutions:\n"
        "  offset_calibration: \"false\"\n"
        "  gain_calibration: false\n\n"
        "esphome:\n",
    ).replace(
        "      - Software/ESPHome/calibration/6chan_main_calibration.yaml\n", ""
    )
    snapshot = ESPHomeConfigSnapshot(
        "meter.yaml", content, sha256(content.encode()).hexdigest()
    )

    plan = build_calibration_preparation_mutation(snapshot, _main_topology())

    assert [change.key for change in plan.changes] == [
        "offset_calibration",
        "gain_calibration",
        "package.main.calibration",
    ]
    assert 'offset_calibration: "true"' in plan.proposed_content
    assert "gain_calibration: true" in plan.proposed_content
    assert "static_offset" not in plan.proposed_content


def test_calibration_preparation_rejects_dynamic_known_flags() -> None:
    content = _official_comments_stripped_config().replace(
        "esphome:\n",
        "substitutions:\n"
        "  offset_calibration: ${calibration_mode}\n"
        "  gain_calibration: \"true\"\n\n"
        "esphome:\n",
    )
    snapshot = ESPHomeConfigSnapshot(
        "meter.yaml", content, sha256(content.encode()).hexdigest()
    )

    with pytest.raises(ValueError, match="calibration"):
        build_calibration_preparation_mutation(snapshot, _main_topology())


class _PreviewBuilder:
    async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
        raise AssertionError(f"unexpected config read: {configuration}")


class _PreviewPersistence:
    async def async_get_ct_selections(self, _mac: str) -> tuple[object, ...]:
        return ()


def _admitted_transaction_workflow() -> tuple[
    EntryWorkflow,
    ConfigTransactionManager,
    SessionManager,
    DiscoveredDevice,
    str,
    str,
]:
    original = _official_comments_stripped_config().replace(
        "circuitsetup.6c-energy-meter", "legacy.custom-meter", 1
    )
    proposed = original.replace("ref: master", "ref: reviewed", 1)
    source_sha256 = sha256(original.encode()).hexdigest()
    device = DiscoveredDevice(
        "legacy-meter",
        "Legacy meter",
        "legacy.custom-meter",
        configuration="legacy.yaml",
    )
    helper = SimpleNamespace(
        domain="circuitsetup_energy_meter_helper",
        entry_id="helper",
        data={
            "inspection_admission": {
                "device_id": device.entry_id,
                "mac": "aabbccddeeff",
                "configuration": device.configuration,
                "source_sha256": source_sha256,
                "physical_chip_count": 2,
            }
        },
    )
    entry = SimpleNamespace(
        domain="esphome",
        entry_id=device.entry_id,
        unique_id="aabbccddeeff",
        runtime_data=SimpleNamespace(
            device_info=SimpleNamespace(project_name=device.project_name)
        ),
    )
    entries = {entry.entry_id: entry, helper.entry_id: helper}
    hass = SimpleNamespace(
        config_entries=SimpleNamespace(
            async_get_entry=entries.get,
            async_entries=lambda domain: [
                item for item in entries.values() if item.domain == domain
            ],
            async_update_entry=lambda entry, **kwargs: entry.data.update(kwargs["data"]),
        )
    )
    provisioning = SimpleNamespace(
        snapshot=SimpleNamespace(devices=(device,)),
    )
    store = SimpleNamespace(
        async_save_interrupted_session=lambda *_args: None,
        async_finalize_verified_calibration=lambda *_args: None,
    )
    sessions = SessionManager()
    manager = ConfigTransactionManager(
        _PreviewBuilder(),
        object(),
        _PreviewPersistence(),
        sessions,
    )
    workflow = EntryWorkflow(
        hass,
        provisioning,
        sessions,
        store,
        device.entry_id,
        None,
        None,
    )
    workflow.transactions = manager
    return workflow, manager, sessions, device, original, proposed


def test_admitted_custom_source_uses_only_active_transaction_proposed_hash() -> None:
    workflow, manager, sessions, device, original, proposed = (
        _admitted_transaction_workflow()
    )
    status = None

    async def run() -> None:
        nonlocal status
        source = ESPHomeConfigSnapshot(
            device.configuration, original, sha256(original.encode()).hexdigest()
        )
        plan = ConfigMutationPlan(
            device.configuration,
            source.sha256,
            (SubstitutionChange("reviewed", None, "true"),),
            "+ reviewed change",
            proposed,
        )
        status = await manager.async_preview(
            "aabbccddeeff", _main_topology(), plan, source
        )
        transaction = sessions._get_transaction(status.transaction_id)
        transaction.state = ConfigTransactionState.RECONNECTING
        transaction.write_started = True
        result = workflow._topology_from_document(
            ESPHomeConfigDocument.parse(proposed),
            device,
            sha256(proposed.encode()).hexdigest(),
            device.configuration,
        )
        assert result.project_name == "legacy.custom-meter"

    import asyncio

    asyncio.run(run())


def test_admitted_custom_source_rejects_external_or_rolled_back_content() -> None:
    workflow, manager, sessions, device, original, proposed = (
        _admitted_transaction_workflow()
    )
    external = proposed.replace("ref: reviewed", "ref: external", 1)

    async def run() -> None:
        source = ESPHomeConfigSnapshot(
            device.configuration, original, sha256(original.encode()).hexdigest()
        )
        plan = ConfigMutationPlan(
            device.configuration,
            source.sha256,
            (SubstitutionChange("reviewed", None, "true"),),
            "+ reviewed change",
            proposed,
        )
        status = await manager.async_preview(
            "aabbccddeeff", _main_topology(), plan, source
        )
        transaction = sessions._get_transaction(status.transaction_id)
        transaction.state = ConfigTransactionState.RECONNECTING
        transaction.write_started = True
        with pytest.raises((ValueError, KeyError)):
            workflow._topology_from_document(
                ESPHomeConfigDocument.parse(external),
                device,
                sha256(external.encode()).hexdigest(),
                device.configuration,
            )
        transaction.state = ConfigTransactionState.ROLLED_BACK
        with pytest.raises((ValueError, KeyError)):
            workflow._topology_from_document(
                ESPHomeConfigDocument.parse(proposed),
                device,
                sha256(proposed.encode()).hexdigest(),
                device.configuration,
            )

    import asyncio

    asyncio.run(run())


def test_verified_transaction_verifier_uses_authorized_custom_source() -> None:
    """The real install verifier may inspect only the live transaction content."""
    workflow, _unused_manager, _unused_sessions, device, original, proposed = (
        _admitted_transaction_workflow()
    )
    source_sha256 = sha256(original.encode()).hexdigest()
    proposed_sha256 = sha256(proposed.encode()).hexdigest()

    class Builder:
        def __init__(self) -> None:
            self.remote_content = original

        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            return ESPHomeConfigSnapshot(
                configuration,
                self.remote_content,
                sha256(self.remote_content.encode()).hexdigest(),
            )

        async def async_update_config(
            self, snapshot: ESPHomeConfigSnapshot, content: str
        ) -> None:
            assert snapshot.sha256 == source_sha256
            self.remote_content = content

        async def async_validate(self, _configuration: str) -> SimpleNamespace:
            return SimpleNamespace(success=True)

        async def async_compile(self, _configuration: str, _progress: object = None) -> SimpleNamespace:
            return SimpleNamespace(success=True)

        async def async_upload(self, _configuration: str, _progress: object = None) -> SimpleNamespace:
            return SimpleNamespace(success=True)

    class Persistence:
        async def async_revoke_installed_calibration(
            self, _mac: str, *, expected_record_fingerprint: str | None = None
        ) -> str | None:
            return expected_record_fingerprint

        async def async_get_ct_selections(self, _mac: str) -> tuple[object, ...]:
            return ()

        async def async_save_verified_ct_selections(
            self, _mac: str, _selections: tuple[object, ...]
        ) -> None:
            return None

    async def run() -> None:
        builder = Builder()
        persistence = Persistence()
        sessions = SessionManager()
        topology = workflow._topology_from_document(
            ESPHomeConfigDocument.parse(original),
            device,
            source_sha256,
            device.configuration or "",
        )

        class Verifier:
            async def async_verify(self, mac: str) -> ReconnectEvidence:
                live = await builder.async_get_config(device.configuration or "")
                verified_topology = workflow._topology_from_document(
                    ESPHomeConfigDocument.parse(live.content),
                    device,
                    live.sha256,
                    live.configuration,
                )
                return ReconnectEvidence(
                    mac,
                    verified_topology,
                    {channel: f"CT {channel}" for channel in range(1, 7)},
                    6,
                )

        manager = ConfigTransactionManager(builder, Verifier(), persistence, sessions)
        workflow.transactions = manager
        plan = ConfigMutationPlan(
            device.configuration,
            source_sha256,
            (SubstitutionChange("reviewed", None, "true"),),
            "+ reviewed change",
            proposed,
        )
        status = await manager.async_preview(
            "aabbccddeeff", topology, plan,
            ESPHomeConfigSnapshot(device.configuration or "", original, source_sha256),
        )
        manager.subscribe(
            status.transaction_id,
            lambda update: workflow._advance_inspection_admission(
                device.entry_id, source_sha256, proposed_sha256
            )
            if update.state is ConfigTransactionState.VERIFIED
            else None,
        )
        assert (await manager.async_confirm_write(status.transaction_id, "admin")).state is ConfigTransactionState.VALIDATED
        assert (await manager.async_compile(status.transaction_id)).state is ConfigTransactionState.INSTALL_CONFIRMATION_REQUIRED
        verified = await manager.async_confirm_install(status.transaction_id, "admin")
        assert verified.state is ConfigTransactionState.VERIFIED
        assert workflow._inspection_admission(device.entry_id)["source_sha256"] == proposed_sha256  # type: ignore[index]

    import asyncio

    asyncio.run(run())


def test_calibration_preparation_is_reviewable_before_a_session_exists() -> None:
    content = _official_comments_stripped_config().replace(
        "esphome:\n",
        "substitutions:\n"
        "  offset_calibration: false\n"
        "  gain_calibration: false\n\n"
        "esphome:\n",
    ).replace(
        "      - Software/ESPHome/calibration/6chan_main_calibration.yaml\n", ""
    )
    device = DiscoveredDevice(
        "meter", "Meter", "circuitsetup.6c-energy-meter", configuration="meter.yaml"
    )
    entry = SimpleNamespace(
        domain="esphome",
        entry_id=device.entry_id,
        unique_id="aabbccddeeff",
        runtime_data=SimpleNamespace(
            device_info=SimpleNamespace(project_name=device.project_name)
        ),
    )
    hass = SimpleNamespace(
        config_entries=SimpleNamespace(async_get_entry=lambda _device_id: entry)
    )

    class Builder:
        def __init__(self) -> None:
            self.remote_content = content
            self.updated = False

        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            return ESPHomeConfigSnapshot(
                configuration,
                self.remote_content,
                sha256(self.remote_content.encode()).hexdigest(),
            )

        async def async_update_config(
            self, _snapshot: ESPHomeConfigSnapshot, _proposed: str
        ) -> None:
            self.updated = True

    class Persistence:
        async def async_get_ct_selections(self, _mac: str) -> tuple[object, ...]:
            return ()

    async def run() -> None:
        sessions = SessionManager()
        builder = Builder()
        manager = ConfigTransactionManager(
            builder,
            object(),
            Persistence(),
            sessions,
        )
        workflow = EntryWorkflow(
            hass,
            SimpleNamespace(snapshot=SimpleNamespace(devices=(device,))),
            sessions,
            SimpleNamespace(
                async_save_interrupted_session=lambda *_args: None,
                async_finalize_verified_calibration=lambda *_args: None,
            ),
            device.entry_id,
            None,
            builder,
        )
        workflow.transactions = manager

        status = await workflow.async_prepare_calibration(device.entry_id)
        assert status.state is ConfigTransactionState.PREVIEWED
        assert not builder.updated

    import asyncio

    asyncio.run(run())


def test_prepared_package_enable_is_idempotent_and_provenance_bound() -> None:
    """A repeated review cannot duplicate an include or rewrite unrelated files."""
    content = _official_comments_stripped_config().replace(
        "      - Software/ESPHome/status_fields/6chan_main_status.yaml\n",
        "      #- Software/ESPHome/power_quality/6chan_main_power_quality.yaml # reviewed\n"
        "      - Software/ESPHome/status_fields/6chan_main_status.yaml\n",
    )
    document = ESPHomeConfigDocument.parse(content)
    reference = next(
        item
        for item in document.package_references
        if "power_quality" in item.path
    )
    assert not reference.active
    assert reference.repository == (
        "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter"
    )
    assert reference.ref == "master"
    assert reference.files_span is not None

    prepared, changes = _apply_package_options(
        content,
        _main_topology(),
        {"power_quality": (True,), "status_fields": (True,)},
    )
    repeated, repeated_changes = _apply_package_options(
        prepared,
        _main_topology(),
        {"power_quality": (True,), "status_fields": (True,)},
    )

    assert prepared == repeated
    assert [change.key for change in changes] == ["power_quality_main"]
    assert repeated_changes == []
    assert prepared.count("power_quality/6chan_main_power_quality.yaml") == 1


def test_commented_official_package_is_available_to_prepare() -> None:
    """A reviewed official include can be enabled without duplicating it."""
    content = _official_comments_stripped_config().replace(
        "      - Software/ESPHome/status_fields/6chan_main_status.yaml\n",
        "      #- Software/ESPHome/power_quality/6chan_main_power_quality.yaml\n"
        "      - Software/ESPHome/status_fields/6chan_main_status.yaml\n",
    )

    capability = package_capabilities_from_document(
        ESPHomeConfigDocument.parse(content), _main_topology()
    )[0]

    assert capability.state == "available_to_prepare"
    assert capability.reason_code == "official_source_ready"


def test_unrecognized_package_source_is_read_only() -> None:
    """A matching basename in another repository must never become writable."""
    content = _official_comments_stripped_config().replace(
        "https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter",
        "https://github.com/example/not-the-meter",
    )

    capability = package_capabilities_from_document(
        ESPHomeConfigDocument.parse(content), _main_topology()
    )[0]
    assert capability.state == "cannot_safely_manage"
    assert capability.reason_code == "unsupported_package_source"
    with pytest.raises(ValueError, match="cannot be safely prepared"):
        _apply_package_options(
            content,
            _main_topology(),
            {"power_quality": (True,), "status_fields": (True,)},
        )


def test_package_toggle_requires_a_writable_source_ref_even_when_the_path_exists() -> None:
    content = _official_comments_stripped_config().replace("    ref: master\n", "")

    with pytest.raises(ValueError, match="cannot be safely managed"):
        _apply_package_options(
            content,
            _main_topology(),
            {"power_quality": (False,), "status_fields": (True,)},
        )


def test_multiple_package_sources_are_read_only() -> None:
    """A missing package cannot be assigned to one of several sources."""
    content = _official_comments_stripped_config().replace(
        "packages:\n",
        "packages:\n"
        "  second_source:\n"
        "    url: https://github.com/example/another-meter\n"
        "    ref: main\n"
        "    files:\n"
        "      - Software/ESPHome/6chan_common.yaml\n",
    )

    capability = package_capabilities_from_document(
        ESPHomeConfigDocument.parse(content), _main_topology()
    )[0]

    assert capability.state == "cannot_safely_manage"
    assert capability.reason_code == "ambiguous_package_source"


def test_inspection_requires_physical_chip_corroboration_for_custom_project() -> None:
    """A renamed project is admitted only with package and live chip evidence."""
    from custom_components.circuitsetup_energy_meter_helper.topology import (
        TopologyEvidenceSource,
        topology_from_inspection,
    )

    document = ESPHomeConfigDocument.parse(_official_comments_stripped_config().replace(
        "circuitsetup.6c-energy-meter", "legacy.custom-meter", 1
    ))

    topology = topology_from_inspection(
        document,
        native_project_name="legacy.custom-meter",
        physical_chip_count=2,
    )

    assert topology.project_name == "legacy.custom-meter"
    assert topology.addon_count == 0
    assert any(
        evidence.source is TopologyEvidenceSource.NATIVE_ENTITY_COUNTS
        for evidence in topology.evidence
    )


def test_explicit_inspection_uses_secondary_api_and_reuses_adoption_boundary(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Inspection must not borrow the bound API session or guess a source file."""
    content = _official_comments_stripped_config().replace(
        "circuitsetup.6c-energy-meter", "legacy.custom-meter", 1
    )
    digest = sha256(content.encode()).hexdigest()
    target = SimpleNamespace(
        domain="esphome",
        entry_id="legacy-meter",
        title="Legacy meter",
        unique_id="aabbccddeeff",
        data={"device_name": "legacy-meter"},
        runtime_data=SimpleNamespace(
            device_info=SimpleNamespace(project_name="legacy.custom-meter")
        ),
    )
    helper = SimpleNamespace(
        domain="circuitsetup_energy_meter_helper",
        entry_id="helper",
        data={},
    )
    entries = {target.entry_id: target, helper.entry_id: helper}
    updates: list[dict[str, object]] = []

    class Builder:
        async def async_list_devices(self) -> dict[str, list[dict[str, str]]]:
            return {
                "configured": [
                    {"name": "legacy-meter", "configuration": "legacy.yaml"}
                ],
                "importable": [],
            }

        async def async_get_config(self, configuration: str) -> ESPHomeConfigSnapshot:
            return ESPHomeConfigSnapshot(configuration, content, digest)

    class SecondarySession:
        instances: ClassVar[list[SecondarySession]] = []

        def __init__(self, _hass: object, device_id: str) -> None:
            self.device_id = device_id
            self.checks: list[int] = []
            self.connected = False
            self.shutdown = False
            self.instances.append(self)

        async def async_connect(self) -> None:
            self.connected = True

        async def async_check_meter_communication(self, expected_chips: int) -> None:
            self.checks.append(expected_chips)

        async def async_shutdown(self) -> None:
            self.shutdown = True

    monkeypatch.setattr(
        "custom_components.circuitsetup_energy_meter_helper.workflow.ESPHomeApiSession",
        SecondarySession,
    )
    config_entries = SimpleNamespace(
        async_get_entry=entries.get,
        async_entries=lambda domain: [
            entry for entry in entries.values() if entry.domain == domain
        ],
        async_update_entry=lambda entry, **kwargs: updates.append(kwargs),
    )
    hass = SimpleNamespace(config_entries=config_entries)
    provisioning = SimpleNamespace(snapshot=SimpleNamespace(devices=()))
    store = SimpleNamespace(
        async_save_interrupted_session=lambda *_args: None,
        async_finalize_verified_calibration=lambda *_args: None,
    )
    workflow = EntryWorkflow(
        hass,
        provisioning,
        SessionManager(),
        store,
        None,
        object(),
        Builder(),
    )

    async def run() -> None:
        result = await workflow.async_inspect_existing_meter("legacy-meter")
        assert result["device"].entry_id == "legacy-meter"
        assert result["topology"].addon_count == 0
        assert SecondarySession.instances[0].checks == [2]
        assert SecondarySession.instances[0].shutdown
        assert workflow._api is not None

        adopted = await workflow.async_adopt_device("legacy-meter")
        assert adopted == {
            "device_id": "legacy-meter",
            "configuration": "legacy.yaml",
        }
        assert updates and updates[-1]["data"]
        helper.data = updates[-1]["data"]  # type: ignore[assignment]
        reloaded = EntryWorkflow(
            hass,
            provisioning,
            SessionManager(),
            store,
            "legacy-meter",
            None,
            Builder(),
        )
        topology_result = await reloaded.async_get_topology("legacy-meter")
        assert topology_result["topology"].project_name == "legacy.custom-meter"

    import asyncio

    asyncio.run(run())
