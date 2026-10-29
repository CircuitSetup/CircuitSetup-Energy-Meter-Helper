# CircuitSetup Energy Meter Helper

## Installation and updates

Requires Home Assistant 2026.8.0 or newer.

### Home Assistant 2026.11 and newer

1. Open **Settings → Marketplace** and select **Add from link**.
2. Enter `https://github.com/CircuitSetup/CircuitSetup-Energy-Meter-Helper` and
   select **Add**. If prompted for a type, select **Integration**.
3. Open **CircuitSetup Energy Meter Helper** and install it. Restart Home
   Assistant if requested.
4. Complete the setup dialog. If it does not open automatically, open
   **Settings → Devices & services → Add integration** and select
   **CircuitSetup Energy Meter Helper**.

### Home Assistant 2026.8–2026.10

Add this repository in **HACS → Custom repositories**, with category
**Integration**, then download **CircuitSetup Energy Meter Helper** and restart
Home Assistant. Add the integration under **Settings → Devices & services**.

[Open this repository in HACS or the Marketplace](https://my.home-assistant.io/redirect/hacs_repository/?owner=CircuitSetup&repository=CircuitSetup-Energy-Meter-Helper&category=integration).

When upgrading to Home Assistant 2026.11, the Marketplace automatically takes
over installed HACS repositories and their update entities. You do not need to
reinstall the Helper. Find future updates under **Settings → Updates**. See
[Coming from HACS](https://rc.home-assistant.io/integrations/marketplace/#coming-from-hacs)
for the migration details.

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
## ESPHome Device Builder selection

If no supported builder is installed, setup shows installation instructions and
links to the [ESPHome installation guide](https://esphome.io/install/). Install and
start the app, then submit to retry detection, or explicitly continue without it
for calibration-only use. The integration options and unavailable-builder repair
also explain where to install it.

The Helper discovers installed official ESPHome Device Builder apps (stable,
beta, and dev). With one installed, it uses that app automatically. With multiple
installed, choose one during setup or under **Settings → Devices & services →
CircuitSetup Energy Meter Helper → Configure**. The selector shows the installed
version and state; saving a different choice reloads the Helper.

Start the selected app before saving your choice. If you install or start a
builder after the Helper has loaded, reload the Helper integration to rediscover
it. A stopped or removed selection is never
silently replaced by another channel. If an existing Helper installation has
multiple builders and no saved choice, setup waits until you select one in
Configure. Finish any active calibration or build before changing builders.

If a Device Builder connection fails during startup, the Helper retries automatically.

This selection controls configuration, compilation, and OTA uploads. Initial USB
installation still uses the prebuilt binaries from
[CircuitSetup ESPWebInstaller](https://circuitsetup.github.io/ESPWebInstaller/).

