"""Private durable stock offset recovery boundaries."""

import asyncio
import json
from dataclasses import replace
from hashlib import sha256
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest

from custom_components.circuitsetup_energy_meter_helper.log_parser import (
    OffsetTableSnapshot,
)
from custom_components.circuitsetup_energy_meter_helper.session_manager import (
    SessionManager,
)
from tests.test_config_mutator import _snapshot as base_snapshot
from tests.test_config_mutator import _topology

MAC = "aabbccddeeff"
OLD = ((-12, 31), (-13, 32), (-14, 33))
ZERO = ((0, 0), (0, 0), (0, 0))


def _snapshot(addons: int = 0) -> Any:
    snapshot = base_snapshot()
    pins = ((5, 4), (0, 16), (27, 17), (2, 21), (13, 22), (14, 25), (15, 26))
    hardware = "".join(
        f"  - platform: atm90e32\n    id: ${{{'main_meter_id' + str(group + 1) if board == 0 else f'addon{board}_id{group + 1}'}}}\n    cs_pin: {pin}\n"
        for board in range(addons + 1)
        for group, pin in enumerate(pins[board])
    )
    ids = "".join(
        f"  {'main_meter_id' + str(group + 1) if board == 0 else f'addon{board}_id{group + 1}'}: {'meter_main' + str(group + 1) if board == 0 else f'addon{board}_{group + 1}'}\n"
        for board in range(addons + 1)
        for group in range(2)
    )
    content = (
        "esphome:\n  project:\n    name: circuitsetup.6c-energy-meter\n    version: '1'\n"
        + snapshot.content.replace(
            "substitutions:\n",
            "substitutions:\n  main_meter_name1: Main Meter 1\n  main_meter_name2: Main Meter 2\n" + ids,
        ).replace("logger:\n", hardware + "logger:\n", 1)
    )
    return replace(
        snapshot, content=content, sha256=sha256(content.encode()).hexdigest()
    )


def hass_at(path: Path) -> Any:
    async def executor(function: Any, *args: Any) -> Any:
        return await asyncio.to_thread(function, *args)

    return SimpleNamespace(
        config=SimpleNamespace(path=lambda *parts: str(path.joinpath(*parts))),
        async_add_executor_job=executor,
    )


def observed(instance: str = "meter_main1", generation: int = 1) -> OffsetTableSnapshot:
    return OffsetTableSnapshot(generation, instance, 1, OLD, "restored", False, False)


def test_first_configuration_snapshot_is_source_bound_and_not_flash_evidence() -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        FIRST_CALIBRATION_CONFIGURATION,
        source_offset_snapshots,
    )

    snapshots = source_offset_snapshots(
        _snapshot(), _topology(), {"meter_main1", "meter_main2"}, 4
    )

    assert len(snapshots) == 4
    assert {
        (item.instance_id, item.offset_stage) for item in snapshots
    } == {
        (instance, stage)
        for instance in ("meter_main1", "meter_main2")
        for stage in (1, 2)
    }
    assert all(
        item.reported_state == FIRST_CALIBRATION_CONFIGURATION
        and item.phase_values == ((0, 0), (0, 0), (0, 0))
        and not item.register_verified
        for item in snapshots
    )


def test_source_offset_cs_pins_use_official_defaults_and_literal_override() -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_cs_pins,
    )

    source = _snapshot()
    pins = source_offset_cs_pins(
        source, _topology(), {"meter_main1", "meter_main2"}
    )
    assert pins == {"meter_main1": 5, "meter_main2": 4}

    content = source.content.replace("    cs_pin: 5\n", "    cs_pin: GPIO33\n", 1)
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())
    assert source_offset_cs_pins(source, _topology(), {"meter_main1"}) == {
        "meter_main1": 33
    }


def test_source_offset_cs_pins_cover_official_addon_defaults() -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_cs_pins,
    )
    from tests.test_config_mutator import _topology_for_addons

    source = _snapshot(addons=2)
    content = source.content.replace(
        "circuitsetup.6c-energy-meter", "circuitsetup.6c-energy-meter-2-addons", 1
    )
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())
    assert source_offset_cs_pins(
        source,
        _topology_for_addons(2),
        {"meter_main1", "meter_main2", "addon1_1", "addon1_2", "addon2_1", "addon2_2"},
    ) == {
        "meter_main1": 5,
        "meter_main2": 4,
        "addon1_1": 0,
        "addon1_2": 16,
        "addon2_1": 27,
        "addon2_2": 17,
    }


def test_source_offset_cs_pins_require_hardware_definitions() -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_cs_pins,
    )

    source = _snapshot()
    content = (
        "esphome:\n  name: meter\n  project:\n"
        "    name: circuitsetup.6c-energy-meter\n    version: '1.8'\n"
    )
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())

    with pytest.raises(ValueError, match="chip identities"):
        source_offset_cs_pins(source, _topology(), {"meter_main1", "meter_main2"})


def test_source_offset_cs_pins_rejects_official_packages_without_sensor_coverage() -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_cs_pins,
    )

    source = _snapshot()
    content = """esphome:
  project:
    name: circuitsetup.6c-energy-meter
    version: '1'
packages:
  remote_package:
    url: https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter
    ref: master
    files:
      - Software/ESPHome/6chan_common.yaml
      - Software/ESPHome/calibration/6chan_main_calibration.yaml
      - Software/ESPHome/calibration/6chan_main_offset_calibrations.yaml
"""
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())

    with pytest.raises(ValueError, match="chip identities"):
        source_offset_cs_pins(source, _topology(), {"meter_main1", "meter_main2"})


@pytest.mark.parametrize("sensor_file", ("6chan_main_sensor.yaml",))
def test_source_offset_cs_pins_requires_real_official_sensor_package_coverage(
    sensor_file: str,
) -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_cs_pins,
    )

    source = _snapshot()
    content = """esphome:
  project:
    name: circuitsetup.6c-energy-meter
    version: '1'
packages:
  remote_package:
    url: https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter
    ref: master
    files:
      - Software/ESPHome/meter_sensors/SENSOR_FILE
""".replace("SENSOR_FILE", sensor_file)
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())

    assert source_offset_cs_pins(
        source, _topology(), {"meter_main1", "meter_main2"}
    ) == {"meter_main1": 5, "meter_main2": 4}


def test_source_offset_cs_pins_rejects_noncanonical_sensor_package_path() -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_cs_pins,
    )

    source = _snapshot()
    content = """esphome:
  project:
    name: circuitsetup.6c-energy-meter
    version: '1'
packages:
  remote_package:
    url: https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter
    ref: master
    files:
      - Software/ESPHome/meter_sensors/main.yaml
"""
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())

    with pytest.raises(ValueError, match="chip identities"):
        source_offset_cs_pins(source, _topology(), {"meter_main1", "meter_main2"})


@pytest.mark.parametrize(
    "suffix",
    (
        "  - platform: atm90e32\n    id: meter_main1\n",
        "  - id: !extend meter_main1\n    cs_pin: !include pin.yaml\n",
        "  - platform: atm90e32\n    id: meter_main1\n    cs_pin: 4\n",
    ),
)
def test_source_offset_cs_pins_reject_ambiguous_or_unsupported_overrides(
    suffix: str,
) -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_cs_pins,
    )

    source = _snapshot()
    content = source.content.replace("logger:\n", suffix + "logger:\n", 1)
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())
    with pytest.raises(ValueError, match="offset chip"):
        source_offset_cs_pins(source, _topology(), {"meter_main1"})


def test_first_configuration_snapshot_reads_helper_owned_tables() -> None:
    from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
        build_offset_table_mutation,
    )
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_snapshots,
    )

    source = _snapshot()
    power = ((7, 8), (9, 10), (11, 12))
    plan = build_offset_table_mutation(
        source,
        _topology(),
        {"meter_main1": OLD},
        {"meter_main1": power},
        enable_calibration=frozenset(("meter_main1",)),
    )
    configured = replace(
        source,
        content=plan.proposed_content,
        sha256=sha256(plan.proposed_content.encode()).hexdigest(),
    )
    snapshots = source_offset_snapshots(configured, _topology(), {"meter_main1"}, 4)

    assert snapshots[0].phase_values == OLD
    assert snapshots[1].phase_values == power


def test_first_configuration_snapshot_accepts_the_reviewed_offset_package_fixture() -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_snapshots,
    )

    source = _snapshot()
    content = source.content + """
packages:
  remote_package:
    url: https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter
    ref: master
    files:
      - Software/ESPHome/calibration/6chan_main_calibration.yaml
      - Software/ESPHome/calibration/6chan_main_offset_calibrations.yaml
"""
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())

    snapshots = source_offset_snapshots(source, _topology(), {"meter_main1"}, 4)

    assert all(item.phase_values == ((0, 0), (0, 0), (0, 0)) for item in snapshots)


@pytest.mark.parametrize(
    ("project", "connection", "common"),
    (
        (
            "circuitsetup.6c-energy-meter",
            "wifi",
            "6chan_common.yaml",
        ),
        (
            "circuitsetup.6c-energy-meter-ethernet",
            "ethernet_lilygo",
            "6chan_common_ethernet.yaml",
        ),
        (
            "circuitsetup.6c-energy-meter-ethernet-waveshare",
            "ethernet_waveshare",
            "6chan_common_ethernet_waveshare.yaml",
        ),
    ),
)
def test_first_configuration_snapshot_accepts_each_known_official_common_fixture(
    project: str, connection: str, common: str
) -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_snapshots,
    )

    source = _snapshot()
    content = source.content.replace(
        "circuitsetup.6c-energy-meter", project, 1
    ) + f"""
packages:
  remote_package:
    url: https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter
    ref: master
    files:
      - Software/ESPHome/{common}
"""
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())
    topology = replace(
        _topology(), project_name=project, connection_type=connection
    )

    snapshots = source_offset_snapshots(source, topology, {"meter_main1"}, 4)

    assert all(item.phase_values == ((0, 0), (0, 0), (0, 0)) for item in snapshots)


@pytest.mark.parametrize(
    ("package_file", "package_ref"),
    (
        ("Software/ESPHome/custom_offsets.yaml", "master"),
        ("Software/ESPHome/calibration/6chan_main_calibration.yaml", "unreviewed"),
    ),
)
def test_first_configuration_snapshot_rejects_unknown_official_offset_package(
    package_file: str,
    package_ref: str,
) -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_snapshots,
    )

    source = _snapshot()
    content = source.content + f"""
packages:
  remote_package:
    url: https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter
    ref: {package_ref}
    files:
      - {package_file}
"""
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())

    with pytest.raises(ValueError, match="provenance"):
        source_offset_snapshots(source, _topology(), {"meter_main1"}, 4)


@pytest.mark.parametrize(
    "suffix",
    (
        "packages:\n  custom: !include custom.yaml\n",
        "  - id: !extend meter_main1\n    phase_a:\n      offset_voltage: 12\n",
        "  - id: !extend meter_main1\n    phase_a: !include offsets.yaml\n",
    ),
)
def test_first_configuration_snapshot_rejects_unresolved_or_local_offsets(
    suffix: str,
) -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_snapshots,
    )

    source = _snapshot()
    content = (
        source.content + suffix
        if suffix.startswith("packages:")
        else source.content.replace("logger:\n", suffix + "logger:\n")
    )
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())

    with pytest.raises(ValueError):
        source_offset_snapshots(source, _topology(), {"meter_main1"}, 4)


def test_first_configuration_snapshot_rejects_sensor_include() -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        source_offset_snapshots,
    )

    source = _snapshot()
    content = source.content.replace(
        "sensor:\n  - platform: uptime\n    name: Uptime\n",
        "sensor: !include sensors.yaml\n",
    )
    source = replace(source, content=content, sha256=sha256(content.encode()).hexdigest())

    with pytest.raises(ValueError, match="unresolved"):
        source_offset_snapshots(source, _topology(), {"meter_main1"}, 4)


def test_actual_offset_observation_precedes_configuration_observation() -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        FIRST_CALIBRATION_CONFIGURATION,
        CapturedOffsetResult,
        OffsetRecovery,
        OffsetRecoveryRecord,
        SavedOffsetObservation,
    )

    source = _snapshot()
    configured = replace(
        observed(),
        phase_values=((1, 1), (1, 1), (1, 1)),
        reported_state=FIRST_CALIBRATION_CONFIGURATION,
    )
    record = OffsetRecoveryRecord(
        MAC,
        source,
        _topology(),
        (
            SavedOffsetObservation(source.sha256, configured),
            SavedOffsetObservation(source.sha256, observed()),
        ),
        results=(
            CapturedOffsetResult(
                "meter_main1", 2, ((0, 0), (0, 0), (0, 0)), 1, "a" * 32, source.sha256, False
            ),
        ),
    )

    plan = OffsetRecovery.build_finalization_plan(record, source)
    assert "offset_voltage: -12" in plan.proposed_content
    assert "offset_voltage: 1" not in plan.proposed_content


def test_native_preparation_rejects_contradictory_first_use_history(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            FIRST_CALIBRATION_CONFIGURATION,
            OffsetRecovery,
        )

        sessions = SessionManager()
        recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_backup(
                lease,
                _snapshot(),
                _topology(),
                (
                    observed(),
                    replace(
                        observed(),
                        phase_values=((0, 0), (0, 0), (0, 0)),
                        reported_state=FIRST_CALIBRATION_CONFIGURATION,
                    ),
                ),
            )
            with pytest.raises(ValueError, match="native clear eligibility"):
                await recovery.async_prepare(
                    lease,
                    record,
                    _snapshot(),
                    None,
                    "b" * 32,
                    1,
                    ("meter_main1",),
                    1,
                    mode="native",
                )
        finally:
            lease.release()

    asyncio.run(run())


def test_configuration_observation_cannot_claim_register_readback() -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        OffsetRecoveryRecord,
        SavedOffsetObservation,
        _encode,
    )

    snapshot = replace(observed(), reported_state="configuration", register_verified=True)
    with pytest.raises(ValueError, match="configuration observation"):
        _encode(
            OffsetRecoveryRecord(
                MAC,
                _snapshot(),
                _topology(),
                (SavedOffsetObservation(_snapshot().sha256, snapshot),),
            )
        )


def test_unfinished_selected_preparation_cannot_authorize_or_rotate_recovery(tmp_path: Path) -> None:
    from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
        _final_evidence_hash,
    )
    from tests.test_esphome_api import make_session
    from tests.test_stock_offset_finalization import SelectionClient, finalization_case

    async def run() -> None:
        sessions, recovery, builder, manager, review, final = await finalization_case(
            tmp_path
        )
        await manager.async_confirm_write(review.transaction_id, "admin")
        await manager.async_compile(review.transaction_id)
        await manager.async_confirm_install(review.transaction_id, "admin")
        api = make_session([SelectionClient()])
        await api.async_connect()
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            selected = await recovery.async_reconcile_finalization(
                lease,
                final,
                api,
                source_reader=lambda: builder.async_get_config("meter.yaml"),
                timeout=0.01,
            )
            # Valid durable state representing the previously accepted partial finalization.
            partial = replace(selected, results=(selected.results[0],))
            partial = replace(
                partial,
                finalization=replace(
                    final,
                    targets=("meter_main1",),
                    evidence_sha256=_final_evidence_hash(partial),
                ),
            )
            await recovery._save(lease, partial)
            recovery._confirmed_final_receipts[MAC] = partial.finalization
            archive = recovery._path(lease).with_suffix(".previous.json")
            await recovery._write(archive, recovery._read(recovery._path(lease)))
            original_bytes, archive_bytes = (
                recovery._read(recovery._path(lease)),
                recovery._read(archive),
            )
            with pytest.raises(ValueError):
                await recovery.async_begin_new_cycle(
                    lease,
                    api,
                    source_reader=lambda: builder.async_get_config("meter.yaml"),
                    backup_acknowledged=True,
                    timeout=0.01,
                )
            assert not recovery.is_finalization_ready(partial)
            assert recovery._read(recovery._path(lease)) == original_bytes
            assert recovery._read(archive) == archive_bytes
            with pytest.raises(ValueError):
                await recovery.async_load_archive(lease)
        finally:
            lease.release()
            await api.async_shutdown()

    asyncio.run(run())


def test_backup_is_private_durable_and_reloaded_without_replacing_original(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )

        sessions = SessionManager()
        recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            record = await recovery.async_backup(
                lease, _snapshot(), _topology(), (observed(),)
            )
            assert record.original.content == _snapshot().content
            assert record.observations[0].snapshot.phase_values == OLD
            assert "top-secret" not in repr(record)
            reloaded = await OffsetRecovery(hass_at(tmp_path), sessions).async_load(
                lease
            )
            assert reloaded == record
        finally:
            lease.release()

    asyncio.run(run())


@pytest.mark.parametrize("failure", ("write", "readback"))
def test_backup_failure_never_returns_a_durable_record(
    tmp_path: Path, monkeypatch: Any, failure: str
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper import offset_recovery

        def broken(
            path: str, data: bytes | str, private: bool = False, mode: str = "w"
        ) -> None:
            if failure == "write":
                raise OSError("secret-bearing storage error")
            assert private and mode == "wb"
            real(path, b"{}", private=private, mode=mode)

        real = offset_recovery.write_utf8_file_atomic
        monkeypatch.setattr(offset_recovery, "write_utf8_file_atomic", broken)
        sessions = SessionManager()
        recovery = offset_recovery.OffsetRecovery(hass_at(tmp_path), sessions)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            with pytest.raises(
                ValueError, match="recovery persistence failed"
            ) as caught:
                await recovery.async_backup(
                    lease, _snapshot(), _topology(), (observed(),)
                )
            assert "secret-bearing" not in str(caught.value)
            if failure == "readback":
                assert recovery._path(lease).read_bytes() == b"{}"
        finally:
            lease.release()

    asyncio.run(run())


def test_cancelled_backup_drains_disk_boundary_before_releasing_ownership(
    tmp_path: Path, monkeypatch: Any
) -> None:
    async def run() -> None:
        from threading import Event

        from custom_components.circuitsetup_energy_meter_helper import offset_recovery

        started, release = Event(), Event()
        real = offset_recovery.write_utf8_file_atomic

        def blocked(*args: Any, **kwargs: Any) -> None:
            started.set()
            release.wait(5)
            real(*args, **kwargs)

        monkeypatch.setattr(offset_recovery, "write_utf8_file_atomic", blocked)
        sessions = SessionManager()
        recovery = offset_recovery.OffsetRecovery(hass_at(tmp_path), sessions)

        async def backup() -> None:
            lease = await sessions.async_acquire_calibration(MAC)
            try:
                await recovery.async_backup(
                    lease, _snapshot(), _topology(), (observed(),)
                )
                pytest.fail("cancelled backup authorized a subsequent action")
            finally:
                lease.release()

        task = asyncio.create_task(backup())
        await asyncio.to_thread(started.wait, 2)
        task.cancel()
        await asyncio.sleep(0.01)
        assert sessions.is_config_locked(MAC) and not task.done()
        release.set()
        with pytest.raises(asyncio.CancelledError):
            await task
        assert not sessions.is_config_locked(MAC)

    asyncio.run(run())


def test_raw_offset_plan_preserves_other_stage_and_unselected_chip() -> None:
    from custom_components.circuitsetup_energy_meter_helper import config_mutator

    first = config_mutator.build_offset_table_mutation(
        _snapshot(),
        _topology(),
        {"meter_main2": OLD},
        {"meter_main1": OLD},
    )
    source = replace(
        _snapshot(),
        content=first.proposed_content,
        sha256=sha256(first.proposed_content.encode()).hexdigest(),
    )
    plan = config_mutator.build_offset_table_mutation(
        source,
        _topology(),
        {"meter_main1": ((0, 0), (0, 0), (0, 0))},
        {},
        enable_calibration=frozenset(("meter_main1",)),
    )
    assert "offset_voltage: -12" in plan.proposed_content
    assert "offset_active_power: -12" in plan.proposed_content
    assert "offset_voltage: 0" in plan.proposed_content
    assert (
        "  - id: !extend meter_main1\n    enable_offset_calibration: true\n"
        in plan.proposed_content
    )
    again = replace(
        source,
        content=plan.proposed_content,
        sha256=sha256(plan.proposed_content.encode()).hexdigest(),
    )
    assert (
        config_mutator.build_offset_table_mutation(
            again, _topology(), {}, {"meter_main2": OLD}
        ).proposed_content.count("enable_offset_calibration: true")
        == 1
    )
    assert (
        "top-secret" in plan.proposed_content and "top-secret" not in plan.redacted_diff
    )
    assert 'current_cal_ct1: "11143"' in plan.proposed_content


@pytest.mark.parametrize("stage", (1, 2))
def test_candidate_plan_preserves_both_families_and_marks_only_target_enabled(
    stage: int,
) -> None:
    import yaml

    from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
        build_offset_table_mutation,
    )

    source = _snapshot()
    configured = build_offset_table_mutation(
        source,
        _topology(),
        {"meter_main1": OLD},
        {"meter_main1": ((0, 0), (-32768, 32767), (-1, 1))},
        enable_calibration=frozenset({"meter_main1"}),
    )
    source = replace(
        source,
        content=configured.proposed_content,
        sha256=sha256(configured.proposed_content.encode()).hexdigest(),
    )
    main_power = ((0, 0), (-32768, 32767), (-1, 1))
    plan = build_offset_table_mutation(
        source,
        _topology(),
        {"meter_main1": OLD, "meter_main2": ZERO} if stage == 1 else {"meter_main1": OLD},
        {"meter_main1": main_power, "meter_main2": ZERO} if stage == 2 else {"meter_main1": main_power},
        enable_calibration={"meter_main1": False, "meter_main2": True},
    )
    parsed = yaml.load(plan.proposed_content, Loader=yaml.BaseLoader)
    chips = {item["id"]: item for item in parsed["sensor"] if "id" in item}
    assert chips["meter_main1"]["phase_a"]["offset_voltage"] == "-12"
    assert chips["meter_main1"]["phase_c"]["offset_current"] == "33"
    assert chips["meter_main1"]["phase_b"]["offset_active_power"] == "-32768"
    assert chips["meter_main1"]["phase_b"]["offset_reactive_power"] == "32767"
    first, second = (
        ("offset_voltage", "offset_current")
        if stage == 1
        else ("offset_active_power", "offset_reactive_power")
    )
    for phase in ("phase_a", "phase_b", "phase_c"):
        assert chips["meter_main2"][phase] == {first: "0", second: "0"}
    assert chips["meter_main2"]["enable_offset_calibration"] == "true"
    assert chips["meter_main1"]["enable_offset_calibration"] == "false"
    assert parsed["substitutions"]["current_cal_ct1"] == "11143"
    assert "top-secret" not in plan.redacted_diff


@pytest.mark.parametrize(
    "bad", ({"meter_main1": ((True, 0), (0, 0), (0, 0))}, {"addon1_1": OLD})
)
def test_raw_offset_plan_rejects_untrusted_tables(bad: Any) -> None:
    from custom_components.circuitsetup_energy_meter_helper import config_mutator

    with pytest.raises(ValueError):
        config_mutator.build_offset_table_mutation(_snapshot(), _topology(), bad, {})


def test_preparation_refuses_unowned_enable_flag_that_could_override_zero_setup() -> (
    None
):
    from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
        build_offset_table_mutation,
    )

    source = _snapshot()
    content = source.content.replace(
        "sensor:\n",
        "sensor:\n  - id: !extend meter_main1\n    enable_offset_calibration: false\n",
    )
    source = replace(
        source, content=content, sha256=sha256(content.encode()).hexdigest()
    )
    with pytest.raises(ValueError, match="overrides"):
        build_offset_table_mutation(
            source,
            _topology(),
            {"meter_main1": ((0, 0),) * 3},
            {},
            enable_calibration=frozenset(("meter_main1",)),
        )


@pytest.mark.parametrize(
    "corruption",
    (
        "schema",
        "source",
        "table",
        "stage",
        "instance",
        "generation",
        "extra",
        "duplicate",
        "oversized",
    ),
)
def test_malformed_existing_private_record_never_resets(
    tmp_path: Path, corruption: str
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )

        sessions = SessionManager()
        recovery = OffsetRecovery(hass_at(tmp_path), sessions)
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            await recovery.async_backup(lease, _snapshot(), _topology(), (observed(),))
            path = recovery._path(lease)
            raw = json.loads(path.read_bytes())
            snapshot = raw["observations"][0]["snapshot"]
            if corruption == "schema":
                raw["schema"] = True
            elif corruption == "source":
                raw["original"]["content"] += "\n# drift"
            elif corruption == "table":
                snapshot["phase_values"][0][0] = 32768
            elif corruption == "stage":
                snapshot["offset_stage"] = True
            elif corruption == "instance":
                snapshot["instance_id"] = "addon6_1"
            elif corruption == "generation":
                snapshot["connection_generation"] = False
            elif corruption == "extra":
                raw["unexpected"] = "private"
            data = json.dumps(raw).encode()
            if corruption == "duplicate":
                data = data.replace(b'"schema":', b'"schema": 1, "schema":', 1)
                assert data.count(b'"schema":') == 2
            elif corruption == "oversized":
                data = b" " * (2 * 1048576 + 1)
            path.write_bytes(data)
            with pytest.raises(ValueError):
                await recovery.async_backup(
                    lease, _snapshot(), _topology(), (observed(),)
                )
            assert path.read_bytes() == data
        finally:
            lease.release()

    asyncio.run(run())


def test_persisted_receipt_is_not_action_permission_for_a_new_core_owner(
    tmp_path: Path,
) -> None:
    async def run() -> None:
        from custom_components.circuitsetup_energy_meter_helper.offset_recovery import (
            OffsetRecovery,
        )
        from tests.test_stock_offset_preparation import preparation
        from tests.test_workflow import _workflow

        sessions, recovery, _, manager, preview, prepared = await preparation(tmp_path)
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            # Browser reload/native reconnect retain the same concrete Core owner.
            confirmed = await recovery.async_require(lease, prepared, installed=True)
            assert confirmed.installed and not confirmed.cancelled
            data = recovery._path(lease).read_bytes()
        finally:
            lease.release()
        restarted_sessions = SessionManager()
        restarted = OffsetRecovery(hass_at(tmp_path), restarted_sessions)
        lease = await restarted_sessions.async_acquire_calibration(MAC)
        try:
            with pytest.raises(ValueError):
                await restarted.async_require(lease, prepared, installed=True)
            retained = await restarted.async_load(lease)
            assert retained == confirmed
            assert restarted._path(lease).read_bytes() == data
        finally:
            lease.release()
        workflow, handle, _, _ = _workflow()
        workflow._sessions_owner = restarted_sessions
        workflow._offset_recovery = restarted
        status = await workflow.async_get_offset_preparation(handle.session_id)
        assert status["installed"] is True
        assert status["action_ready"] is False
        assert status["cancelled"] is False
        assert handle.stock_offset_pending
        workflow._sessions_owner = sessions
        workflow._offset_recovery = recovery
        assert (await workflow.async_get_offset_preparation(handle.session_id))[
            "action_ready"
        ] is True

    asyncio.run(run())


def test_legacy_preparation_record_loads_without_native_fields(tmp_path: Path) -> None:
    async def run() -> None:
        from tests.test_stock_offset_preparation import preparation

        sessions, recovery, _builder, manager, preview, prepared = await preparation(
            tmp_path
        )
        await manager.async_confirm_write(preview.transaction_id, "admin")
        await manager.async_compile(preview.transaction_id)
        await manager.async_confirm_install(preview.transaction_id, "admin")
        lease = await sessions.async_acquire_calibration(MAC)
        try:
            path = recovery._path(lease)
            raw = json.loads(path.read_bytes())
            raw["preparation"].pop("mode")
            raw["preparation"].pop("clear_targets")
            path.write_bytes(json.dumps(raw).encode())
            loaded = await recovery.async_load(lease)
            assert loaded is not None
            assert loaded.preparation == prepared
            assert loaded.preparation.mode == "legacy"
            assert loaded.preparation.clear_targets == ()
        finally:
            lease.release()

    asyncio.run(run())
