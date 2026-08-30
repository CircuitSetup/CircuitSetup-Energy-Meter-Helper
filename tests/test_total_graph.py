from dataclasses import replace

from test_firmware_total_contract import _firmware_root, firmware_contract
from test_meter_configuration import request

from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    AutomaticTotalSettings,
    ChannelTotalSource,
    CircuitAggregate,
    CircuitRole,
    EnergyMode,
    MeasurementMethod,
    TotalOutputSettings,
)
from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology
from custom_components.circuitsetup_energy_meter_helper.total_graph import (
    AutomaticTotalCandidate,
    automatic_total_candidates,
    default_total_settings,
    native_total_sources,
    resolve_automatic_totals,
    stale_automatic_total_settings,
)


def topology(addons: int) -> MeterTopology:
    return MeterTopology.from_addon_count(
        addons, connection_type="wifi", voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter", evidence=(),
    )


def test_catalog_covers_all_topologies() -> None:
    for addons in range(7):
        catalog = native_total_sources(topology(addons))
        assert len(catalog) == (1 if addons == 0 else addons + 2)
        assert catalog[-1].source_id == "overall"
        assert catalog[-1].leaf_channels == tuple(range(1, 6 * (addons + 1) + 1))


def test_main_only_catalog_deduplicates_board_and_overall() -> None:
    overall = native_total_sources(topology(0))[0]
    assert overall.power_id == "totalWattsMain"
    assert overall.current_id == "totalAmpsMain"
    assert overall.existing_energy_id == "totalEnergyDaily"
    assert overall.leaf_channels == tuple(range(1, 7))


def test_addon_catalog_maps_native_ids_and_leaf_channels() -> None:
    catalog = native_total_sources(topology(2))
    addon = next(item for item in catalog if item.source_id == "board-addon-2")
    overall = next(item for item in catalog if item.source_id == "overall")
    assert addon.power_id == "totalWattsAddOn2"
    assert addon.leaf_channels == tuple(range(13, 19))
    assert overall.leaf_channels == tuple(range(1, 19))


def test_upstream_visibility_defaults() -> None:
    assert native_total_sources(topology(0))[0].upstream_defaults == TotalOutputSettings(True, True, True)
    catalog = native_total_sources(topology(1))
    assert catalog[-1].upstream_defaults == TotalOutputSettings(True, True, True)
    assert catalog[0].upstream_defaults == TotalOutputSettings(False, False, False)
    assert default_total_settings(topology(1)).boards[0].outputs == TotalOutputSettings(False, False, False)


def test_catalog_matches_pinned_firmware_inspector_for_every_topology(tmp_path) -> None:
    """The runtime catalog must stay aligned with the firmware source contract."""
    firmware_root = _firmware_root(tmp_path)
    boards = firmware_contract.inspect_firmware_totals(firmware_root).boards
    for addons in range(7):
        catalog = native_total_sources(topology(addons))
        for definition in catalog:
            if definition.source_id == "overall":
                if addons == 0:
                    expected_power, expected_current = "totalWattsMain", "totalAmpsMain"
                else:
                    root = firmware_contract.inspect_top_level_totals(
                        firmware_root / "Software/ESPHome" / f"6chan_energy_meter_{addons}-addon{'s' if addons > 1 else ''}.yaml"
                    )
                    expected_power, expected_current = root.root_power_id, root.root_current_id
                    assert root.root_power_sources == tuple(item.power_id for item in catalog[:-1])
                    assert root.root_current_sources == tuple(item.current_id for item in catalog[:-1])
                    assert definition.existing_energy_id == root.energy_id
                    assert root.energy_power_id == definition.power_id
            else:
                board = boards[0 if definition.source_id == "board-main" else int(definition.source_id.rsplit("-", 1)[1])]
                expected_power, expected_current = board.power_id, board.current_id
                assert definition.leaf_channels == board.power_channels == board.current_channels
                assert definition.existing_energy_id is None
            assert (definition.power_id, definition.current_id) == (expected_power, expected_current)
        assert default_total_settings(topology(addons)).overall == catalog[-1].upstream_defaults
        assert tuple(board.outputs for board in default_total_settings(topology(addons)).boards) == tuple(
            item.upstream_defaults for item in catalog[:-1]
        )


def test_exact_grid_pair_produces_stable_candidate() -> None:
    configuration = replace(
        request(),
        channels=tuple(
            replace(channel, role=CircuitRole.GRID)
            if channel.channel in (1, 2)
            else channel
            for channel in request().channels
        ),
    )

    assert automatic_total_candidates(configuration) == (
        AutomaticTotalCandidate(
            candidate_id="grid-ct1-ct2",
            aggregate_id="auto-mains",
            name="Mains",
            role=CircuitRole.GRID,
            sources=(
                ChannelTotalSource("channel", 1),
                ChannelTotalSource("channel", 2),
            ),
            measurement_method=MeasurementMethod.TWO_CT_SUM,
            energy_mode=EnergyMode.BIDIRECTIONAL,
            recommended_outputs=TotalOutputSettings(True, False, True),
        ),
    )


def test_four_subpanel_channels_are_not_guessed_into_pairs() -> None:
    configuration = replace(
        request(),
        channels=tuple(
            replace(channel, role=CircuitRole.SUBPANEL)
            if channel.channel in (1, 2, 3, 4)
            else channel
            for channel in request().channels
        ),
    )

    assert automatic_total_candidates(configuration) == ()


def test_disabled_channels_and_existing_advanced_auto_id_exclude_candidate() -> None:
    baseline = request()
    roles = tuple(
        replace(channel, role=CircuitRole.GRID, enabled=channel.channel != 2)
        if channel.channel in (1, 2)
        else channel
        for channel in baseline.channels
    )
    assert automatic_total_candidates(replace(baseline, channels=roles)) == ()

    advanced = CircuitAggregate(
        "auto-mains",
        "Edited Mains",
        CircuitRole.CUSTOM,
        (ChannelTotalSource("channel", 3),),
        MeasurementMethod.DIRECT,
        EnergyMode.CONSUMPTION,
        TotalOutputSettings(True, False, True),
    )
    enabled = tuple(
        replace(channel, role=CircuitRole.GRID)
        if channel.channel in (1, 2)
        else channel
        for channel in baseline.channels
    )
    assert automatic_total_candidates(
        replace(baseline, channels=enabled, aggregates=(advanced,))
    ) == ()


def test_resolver_keeps_explicit_off_and_ignores_stale_settings() -> None:
    candidates = automatic_total_candidates(
        replace(
            request(),
            channels=tuple(
                replace(channel, role=CircuitRole.GRID)
                if channel.channel in (1, 2)
                else channel
                for channel in request().channels
            ),
        )
    )
    resolved = resolve_automatic_totals(
        candidates,
        (
            AutomaticTotalSettings(
                "grid-ct1-ct2", False, TotalOutputSettings(False, True, False)
            ),
            AutomaticTotalSettings("solar-ct3-ct4", True, TotalOutputSettings(True, False, True)),
        ),
    )

    assert len(resolved) == 1
    assert resolved[0].candidate == candidates[0]
    assert resolved[0].enabled is False
    assert resolved[0].outputs == TotalOutputSettings(False, True, False)
    assert stale_automatic_total_settings(
        candidates,
        (
            AutomaticTotalSettings("grid-ct1-ct2", False, TotalOutputSettings(False, True, False)),
            AutomaticTotalSettings("solar-ct3-ct4", True, TotalOutputSettings(True, False, True)),
        ),
    ) == (AutomaticTotalSettings("solar-ct3-ct4", True, TotalOutputSettings(True, False, True)),)


def test_candidate_id_uses_role_and_channels_not_ct_display_names() -> None:
    baseline = request()
    configuration = replace(
        baseline,
        channels=tuple(
            replace(channel, role=CircuitRole.GRID, name="Renamed service feed")
            if channel.channel in (1, 2)
            else channel
            for channel in baseline.channels
        ),
    )

    assert automatic_total_candidates(configuration)[0].candidate_id == "grid-ct1-ct2"
    assert automatic_total_candidates(
        replace(
            configuration,
            channels=tuple(
                replace(channel, role=CircuitRole.BRANCH)
                if channel.channel == 2
                else channel
                for channel in configuration.channels
            ),
        )
    ) == ()
