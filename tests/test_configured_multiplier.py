"""Configured multiplier inventory and current power-quality output regression."""

from custom_components.circuitsetup_energy_meter_helper.config_blocks import (
    render_phase_overrides,
    replace_managed_block,
)
from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
    _phase_override_lines,
)
from custom_components.circuitsetup_energy_meter_helper.ct_catalog import (
    CTPresetCatalog,
)
from custom_components.circuitsetup_energy_meter_helper.ct_inventory import CTInventory
from tests.test_ct_inventory import _document, _topology


def test_yaml_multiplier_is_visible_without_saved_selection() -> None:
    body = "  - id: !extend meter_main1\n    phase_a: # CT1\n"
    body += "\n".join(_phase_override_lines(True, 2, False)) + "\n"
    document = ESPHomeConfigDocument.parse(
        replace_managed_block(_document().content + "sensor:\n", "phase_overrides", render_phase_overrides({"01": body}))
    )
    inventory = CTInventory.from_document(document, _topology(), CTPresetCatalog.load(), "a" * 64)
    assert inventory.channels[0].reporting_multiplier == 2
    assert inventory.channels[1].reporting_multiplier == 1
    for enabled in (True, False):
        lines = "\n".join(_phase_override_lines(enabled, 2, True))
        assert "harmonic_power" not in lines
        assert "peak_current" not in lines
