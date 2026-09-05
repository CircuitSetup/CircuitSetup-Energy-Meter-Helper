# CircuitSetup Energy Meter Helper

## Guided meter setup

The helper adapts the setup path to the meter it finds:

- **New meter:** configure the electrical system and CTs, install the configuration, then calibrate.
- **Helper-managed meter:** review its saved configuration and continue any unfinished configuration or calibration work.
- **Existing Device Builder configuration:** inspect it first. Choose **Manage with this helper** only when you want to adopt it; until then it is read-only and the helper preserves YAML it does not own.
- **Calibration-only meter:** when no editable Device Builder source is available, the helper offers calibration without configuration installation or durability claims.

Configuration authority and calibration authority are separate. Configuration is authoritative only when the helper can read and safely update the ESPHome source. Calibration can be authoritative in the meter's flash even when configuration cannot be edited.

Choose **Standard calibration** to calibrate voltage and current while retaining the current offset values. Choose **Full calibration** when offsets also need adjustment; it follows offset, voltage, then current.

Stock ESPHome offset calibration uses a private backup and a reviewed zero-offset configuration installation before an explicit calibration run. Captured results are retained for a final reviewed YAML installation; retries prepare only unfinished chips. Confirming the installed configuration does not claim register readback. Firmware with offset verification can also report verified register evidence. Installing firmware can replace flash-only calibration values, so review the summary before installing.

Offset preparation requires complete per-chip tables from a fresh diagnostic dump. Stock ESPHome 2026.8.2 omits these tables before the first offset calibration, so first-time preparation is unavailable on that firmware. Missing tables are never treated as zero, and the helper does not press Clear to discover them. Firmware with read-only offset-table reporting is required for this path; **Skip offset calibration** continues with voltage/current calibration.

Legacy migration is always opt-in. Adopting a legacy configuration marks only the helper-managed parts; unrelated YAML remains untouched.

See [Meter totals](docs/totals.md) for default, Mains, and hierarchical total behavior.

