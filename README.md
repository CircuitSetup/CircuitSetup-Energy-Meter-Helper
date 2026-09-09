# CircuitSetup Energy Meter Helper

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

This selection controls configuration, compilation, and OTA uploads. Initial USB
installation still uses the prebuilt binaries from
[CircuitSetup ESPWebInstaller](https://circuitsetup.github.io/ESPWebInstaller/).

