from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology
from custom_components.circuitsetup_energy_meter_helper.meter_configuration import TotalOutputSettings
from custom_components.circuitsetup_energy_meter_helper.total_graph import (
    default_total_settings,
    native_total_sources,
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
