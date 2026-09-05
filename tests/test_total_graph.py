from dataclasses import replace

import pytest
from test_firmware_total_contract import _firmware_root, firmware_contract
from test_meter_configuration import request

from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
    AggregateTotalSource,
    AutomaticTotalSettings,
    ChannelTotalSource,
    CircuitAggregate,
    CircuitRole,
    EnergyMode,
    MeasurementMethod,
    NativeTotalSource,
    TotalOrigin,
    TotalOutputSettings,
)
from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology
from custom_components.circuitsetup_energy_meter_helper.total_graph import (
    AutomaticTotalCandidate,
    automatic_total_candidates,
    default_total_settings,
    native_total_sources,
    plan_total_graph,
    resolve_automatic_totals,
    stale_automatic_total_settings,
    validate_total_graph,
)


def topology(addons: int) -> MeterTopology:
    return MeterTopology.from_addon_count(
        addons, connection_type="wifi", voltage_layout="standard",
        project_name="circuitsetup.6c-energy-meter", evidence=(),
    )


def channel_source(channel: int) -> ChannelTotalSource:
    return ChannelTotalSource("channel", channel)


@pytest.mark.parametrize("role", (CircuitRole.GRID, CircuitRole.SOLAR, CircuitRole.SUBPANEL, CircuitRole.TWO_POLE))
def test_server_candidate_accepts_explicit_off_settings(role: CircuitRole) -> None:
    from custom_components.circuitsetup_energy_meter_helper.meter_configuration import (
        validate_meter_configuration,
    )

    original = request()
    configured = replace(original, channels=tuple(replace(channel, role=role) if channel.channel <= 2 else channel for channel in original.channels))
    candidate = automatic_total_candidates(configured)[0]
    configured = replace(configured, automatic_totals=(AutomaticTotalSettings(candidate.candidate_id, False, candidate.recommended_outputs),))
    validate_meter_configuration(configured, topology(0))
    assert not plan_total_graph(configured, topology(0)).ordered_nodes


def native_source(source_id: str) -> NativeTotalSource:
    return NativeTotalSource("native_total", source_id)


def aggregate_source(aggregate_id: str) -> AggregateTotalSource:
    return AggregateTotalSource("aggregate", aggregate_id)


def advanced(
    aggregate_id: str,
    *,
    sources: tuple[ChannelTotalSource | NativeTotalSource | AggregateTotalSource, ...],
    method: MeasurementMethod = MeasurementMethod.DIRECT,
    outputs: TotalOutputSettings = TotalOutputSettings(True, False, True),  # noqa: B008 - frozen value
) -> CircuitAggregate:
    return CircuitAggregate(
        aggregate_id, aggregate_id, CircuitRole.CUSTOM, sources, method,
        EnergyMode.CONSUMPTION, outputs,
    )


def configuration(*aggregates: CircuitAggregate, addons: int = 0):
    return replace(request(addons=addons), aggregates=aggregates)


def test_parent_uses_child_nodes_and_orders_children_first() -> None:
    child = advanced("east", sources=(channel_source(1), channel_source(2)))
    parent = advanced("whole", sources=(aggregate_source("east"), native_source("board-addon-1")))
    plan = plan_total_graph(configuration(child, parent, addons=1), topology(1))
    assert [node.aggregate.aggregate_id for node in plan.ordered_nodes] == ["east", "whole"]
    assert plan.leaf_channels["whole"] == frozenset({1, 2, *range(7, 13)})
    assert plan.ordered_nodes[1].sources[0].power_id == "csemh_east_power"


def test_graph_rejects_missing_native_and_aggregate_sources() -> None:
    missing_native = advanced("whole", sources=(native_source("missing"),))
    with pytest.raises(ValueError, match="native"):
        validate_total_graph(configuration(missing_native), topology(0))
    missing_child = advanced("whole", sources=(aggregate_source("missing"),))
    with pytest.raises(ValueError, match="aggregate"):
        validate_total_graph(configuration(missing_child), topology(0))


def test_graph_rejects_aggregate_ids_reserved_by_native_sources() -> None:
    with pytest.raises(ValueError, match="reserved"):
        validate_total_graph(configuration(advanced("overall", sources=(channel_source(1),))), topology(0))


def test_native_board_energy_id_cannot_be_used_by_advanced_total() -> None:
    # board-main is reserved before its stable energy ID could collide.
    with pytest.raises(ValueError, match="reserved"):
        plan_total_graph(configuration(advanced("board-main", sources=(channel_source(1),)), addons=1), topology(1))


def test_directional_ids_only_conflict_when_the_sensor_is_emitted() -> None:
    grid = replace(advanced("grid", sources=(channel_source(1),)), energy_mode=EnergyMode.BIDIRECTIONAL)
    child = advanced("grid-import", sources=(channel_source(2),))
    with pytest.raises(ValueError, match="collision"):
        plan_total_graph(configuration(grid, child), topology(0))
    hidden = replace(grid, outputs=TotalOutputSettings(False, False, False))
    assert len(plan_total_graph(configuration(hidden, child), topology(0)).ordered_nodes) == 2


@pytest.mark.parametrize(
    "aggregates",
    (
        (advanced("a", sources=(aggregate_source("a"),)),),
        (
            advanced("a", sources=(aggregate_source("b"),)),
            advanced("b", sources=(aggregate_source("a"),)),
        ),
    ),
)
def test_graph_rejects_cycles(aggregates: tuple[CircuitAggregate, ...]) -> None:
    with pytest.raises(ValueError, match="cycle"):
        validate_total_graph(configuration(*aggregates), topology(0))


def test_graph_rejects_child_fanout_and_ancestor_overlaps() -> None:
    child = advanced("child", sources=(channel_source(1),))
    one = advanced("one", sources=(aggregate_source("child"),))
    two = advanced("two", sources=(aggregate_source("child"),))
    with pytest.raises(ValueError, match="one parent"):
        validate_total_graph(configuration(child, one, two), topology(0))
    overlap = advanced("whole", sources=(native_source("overall"), channel_source(1)))
    with pytest.raises(ValueError, match="mixed"):
        validate_total_graph(configuration(overlap), topology(0))
    child_overlap = advanced("whole", sources=(aggregate_source("child"), channel_source(1)))
    with pytest.raises(ValueError, match="mixed"):
        validate_total_graph(configuration(child, child_overlap), topology(0))


def test_graph_rejects_overlapping_children_but_allows_independent_roots() -> None:
    east = advanced("east", sources=(channel_source(1), channel_source(2)))
    west = advanced("west", sources=(channel_source(2), channel_source(3)))
    parent = advanced("whole", sources=(aggregate_source("east"), aggregate_source("west")))
    with pytest.raises(ValueError, match="overlap"):
        validate_total_graph(configuration(east, west, parent), topology(0))
    plan = plan_total_graph(configuration(east, west), topology(0))
    assert plan.independent_overlap_warnings == (("east", "west", frozenset({2})),)


def test_graph_allows_nested_only_parent_and_rejects_mixed_or_special_nested() -> None:
    child = advanced("child", sources=(channel_source(1),))
    parent = advanced("whole", sources=(aggregate_source("child"), native_source("board-addon-1")))
    validate_total_graph(configuration(child, parent, addons=1), topology(1))
    mixed = advanced("mixed", sources=(channel_source(1), aggregate_source("child")))
    with pytest.raises(ValueError, match="mixed"):
        validate_total_graph(configuration(child, mixed), topology(0))
    special = advanced("special", sources=(aggregate_source("child"),), method=MeasurementMethod.TWO_CT_SUM)
    with pytest.raises(ValueError, match="direct"):
        validate_total_graph(configuration(child, special), topology(0))


def test_graph_rejects_native_and_child_overlap_without_direct_channels() -> None:
    child = advanced("child", sources=(channel_source(1),))
    parent = advanced("whole", sources=(native_source("overall"), aggregate_source("child")))
    with pytest.raises(ValueError, match="overlap"):
        validate_total_graph(configuration(child, parent), topology(0))


def test_disabled_or_unknown_automatic_settings_are_rejected_and_hidden_watts_still_required() -> None:
    baseline = request()
    grid = replace(
        baseline,
        channels=tuple(replace(channel, role=CircuitRole.GRID) if channel.channel in (1, 2) else channel for channel in baseline.channels),
        automatic_totals=(AutomaticTotalSettings("grid-ct1-ct2", False, TotalOutputSettings(True, False, True)),),
    )
    parent = advanced("whole", sources=(aggregate_source("auto-mains"),))
    with pytest.raises(ValueError, match="disabled"):
        validate_total_graph(replace(grid, aggregates=(parent,)), topology(0))
    with pytest.raises(ValueError, match="automatic"):
        validate_total_graph(replace(baseline, automatic_totals=(AutomaticTotalSettings("missing", True, TotalOutputSettings(True, False, True)),)), topology(0))
    hidden = advanced("hidden", sources=(channel_source(1),), outputs=TotalOutputSettings(False, False, True))
    plan = plan_total_graph(configuration(hidden), topology(0))
    assert plan.ordered_nodes[0].power_required is True
    with pytest.raises(TypeError):
        plan.leaf_channels["hidden"] = frozenset()


@pytest.mark.parametrize(
    ("root_outputs", "power_required", "current_required"),
    (
        (TotalOutputSettings(True, False, False), True, False),
        (TotalOutputSettings(False, True, False), False, True),
        (TotalOutputSettings(False, False, True), True, False),
    ),
)
def test_root_requirements_propagate_through_all_hidden_descendants(
    root_outputs: TotalOutputSettings, power_required: bool, current_required: bool,
) -> None:
    child = advanced("child", sources=(channel_source(1),), outputs=TotalOutputSettings(False, False, False))
    parent = advanced("parent", sources=(aggregate_source("child"),), outputs=TotalOutputSettings(False, False, False))
    root = advanced("root", sources=(aggregate_source("parent"),), outputs=root_outputs)
    plan = plan_total_graph(configuration(child, parent, root), topology(0))
    assert [(node.aggregate.aggregate_id, node.power_required, node.current_required) for node in plan.ordered_nodes] == [
        ("child", power_required, current_required),
        ("parent", power_required, current_required),
        ("root", power_required, current_required),
    ]


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


def test_native_catalog_uses_human_readable_board_labels() -> None:
    catalog = native_total_sources(topology(1))
    assert catalog[0].label == "Main Board total"
    assert catalog[1].label == "Add-on 1 total"


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


@pytest.mark.parametrize("solar_enabled", (None, False, True))
def test_exact_grid_pair_produces_stable_candidate(solar_enabled: bool | None) -> None:
    configuration = replace(
        request(),
        channels=tuple(
            replace(channel, role=CircuitRole.GRID)
            if channel.channel in (1, 2)
            else replace(channel, role=CircuitRole.SOLAR, enabled=solar_enabled)
            if channel.channel == 3 and solar_enabled is not None
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
            energy_mode=EnergyMode.BIDIRECTIONAL if solar_enabled else EnergyMode.CONSUMPTION,
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


@pytest.mark.parametrize(
    ("origin", "method", "automatic_totals", "expected_ids"),
    (
        (TotalOrigin.MIGRATED, MeasurementMethod.TWO_CT_SUM, (), ()),
        (TotalOrigin.ADVANCED, MeasurementMethod.TWO_CT_SUM, (), ()),
        (TotalOrigin.ADVANCED, MeasurementMethod.DIRECT, (), ()),
        (
            TotalOrigin.MIGRATED, MeasurementMethod.TWO_CT_SUM,
            (AutomaticTotalSettings("grid-ct1-ct2", True, TotalOutputSettings(True, False, True)),),
            ("grid-ct1-ct2",),
        ),
    ),
)
def test_automatic_candidate_skips_only_unconfigured_equivalent(
    origin: TotalOrigin,
    method: MeasurementMethod,
    automatic_totals: tuple[AutomaticTotalSettings, ...],
    expected_ids: tuple[str, ...],
) -> None:
    baseline = request()
    channels = tuple(
        replace(channel, role=CircuitRole.GRID)
        if channel.channel in (1, 2)
        else channel
        for channel in baseline.channels
    )
    existing = CircuitAggregate(
        "existing-mains", "Existing mains", CircuitRole.CUSTOM,
        (ChannelTotalSource("channel", 1), ChannelTotalSource("channel", 2)),
        method, EnergyMode.BIDIRECTIONAL,
        TotalOutputSettings(True, False, True), origin,
    )

    candidates = automatic_total_candidates(replace(
        baseline, channels=channels, aggregates=(existing,), automatic_totals=automatic_totals,
    ))

    assert tuple(candidate.candidate_id for candidate in candidates) == expected_ids


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


def test_named_phase_pairs_produce_disabled_two_pole_candidates() -> None:
    baseline = request()
    configuration = replace(
        baseline,
        channels=tuple(
            replace(channel, name=name)
            if (name := {
                1: "Dryer L1", 2: "Dryer L2",
                3: "Water Heater Phase A", 4: "Water Heater Phase B",
            }.get(channel.channel))
            else channel
            for channel in baseline.channels
        ),
    )

    candidates = automatic_total_candidates(configuration)

    assert [(item.candidate_id, item.aggregate_id, item.name, item.role, item.sources)
            for item in candidates] == [
        ("two-pole-ct1-ct2", "auto-two-pole-ct1-ct2", "Dryer", CircuitRole.TWO_POLE,
         (ChannelTotalSource("channel", 1), ChannelTotalSource("channel", 2))),
        ("two-pole-ct3-ct4", "auto-two-pole-ct3-ct4", "Water Heater", CircuitRole.TWO_POLE,
         (ChannelTotalSource("channel", 3), ChannelTotalSource("channel", 4))),
    ]
    assert all(
        not total.enabled
        for total in resolve_automatic_totals(candidates, configuration.automatic_totals)
    )


def test_named_two_pole_labels_prevent_unrelated_generic_pairing() -> None:
    baseline = request()
    configuration = replace(
        baseline,
        channels=tuple(
            replace(channel, role=CircuitRole.TWO_POLE, name=name)
            if (name := {1: "Dryer L1", 2: "Water Heater L2"}.get(channel.channel))
            else channel
            for channel in baseline.channels
        ),
    )

    assert automatic_total_candidates(configuration) == ()


def test_named_phase_pair_accepts_label_separators() -> None:
    baseline = request()
    configuration = replace(
        baseline,
        channels=tuple(
            replace(channel, name=name)
            if (name := {1: "Dryer_L1", 2: "Dryer-L2"}.get(channel.channel))
            else channel
            for channel in baseline.channels
        ),
    )

    assert [item.candidate_id for item in automatic_total_candidates(configuration)] == [
        "two-pole-ct1-ct2",
    ]


def test_ambiguous_named_pair_is_not_suggested() -> None:
    baseline = request()
    configuration = replace(
        baseline,
        channels=tuple(
            replace(channel, name=name)
            if (name := {1: "Dryer L1", 2: "Dryer L2", 3: "Dryer L1"}.get(channel.channel))
            else channel
            for channel in baseline.channels
        ),
    )

    assert automatic_total_candidates(configuration) == ()


def test_two_pole_pair_with_duplicate_named_leg_is_not_suggested() -> None:
    baseline = request()
    configuration = replace(
        baseline,
        channels=tuple(
            replace(channel, role=CircuitRole.TWO_POLE, name="Dryer L1")
            if channel.channel in (1, 2)
            else channel
            for channel in baseline.channels
        ),
    )

    assert automatic_total_candidates(configuration) == ()


def test_exact_named_two_pole_pair_keeps_source_based_disabled_candidate() -> None:
    baseline = request()
    configuration = replace(
        baseline,
        channels=tuple(
            replace(channel, role=CircuitRole.TWO_POLE, name=name)
            if (name := {1: "Dryer L1", 2: "Dryer L2"}.get(channel.channel))
            else channel
            for channel in baseline.channels
        ),
    )

    candidates = automatic_total_candidates(configuration)

    assert [(item.candidate_id, item.aggregate_id) for item in candidates] == [
        ("two-pole-ct1-ct2", "auto-two-pole-ct1-ct2"),
    ]
    assert candidates[0].name == "Dryer"
    assert not resolve_automatic_totals(candidates, configuration.automatic_totals)[0].enabled


def test_bare_phase_letters_do_not_create_named_pair() -> None:
    baseline = request()
    configuration = replace(
        baseline,
        channels=tuple(
            replace(channel, name=name)
            if (name := {1: "Dryer A", 2: "Dryer B"}.get(channel.channel))
            else channel
            for channel in baseline.channels
        ),
    )

    assert automatic_total_candidates(configuration) == ()


def test_named_pair_aggregate_id_survives_two_pole_role_selection() -> None:
    baseline = request()
    channels = tuple(
        replace(channel, name=name)
        if (name := {1: "Dryer L1", 2: "Dryer L2"}.get(channel.channel))
        else channel
        for channel in baseline.channels
    )
    named = automatic_total_candidates(replace(baseline, channels=channels))
    selected = automatic_total_candidates(replace(
        baseline,
        channels=tuple(
            replace(channel, role=CircuitRole.TWO_POLE)
            if channel.channel in (1, 2)
            else channel
            for channel in channels
        ),
    ))

    assert named[0].aggregate_id == selected[0].aggregate_id == "auto-two-pole-ct1-ct2"
