# Meter totals

The helper distinguishes three kinds of totals:

- **Default meter totals** are the native totals supplied by the official CircuitSetup firmware: per-board Watts and Amps, plus the official overall Watts, Amps, and daily energy (`kWh`) totals. Their public/internal switches do not rename their firmware IDs.
- **Mains totals** are optional automatic suggestions for a detected service/mains circuit. They are separate from the native default totals and can be turned off. Turning a suggestion off is retained across reloads.
- **Advanced totals** are named additive reports you create from CTs, native board totals, or other advanced totals. A parent formula references its selected children or native totals; it does not flatten them back into CTs.

## Choosing a total

The default overall total covers all monitored channels. Do not add that overall total to another report that also contains its downstream circuits: doing so counts those circuits twice. The editor blocks a source that overlaps anywhere in the same ancestor chain, including indirect child relationships and cycles. Reusing a source in two genuinely independent reports is allowed, with a warning because those reports must not be added together.

Automatic Mains suggestions are deliberately limited to the topology and measurement methods the helper can verify. They are convenience candidates, not a general-purpose circuit discovery feature. Use an advanced total when you need an explicit parent formula; the helper still validates the source graph before it can be installed.

## Outputs and dependencies

Each total has independent Watts, Amps, and kWh visibility choices. A hidden output is not necessarily removed: a parent or a kWh sensor may need the matching power/current sensor internally. In particular, a parent kWh sensor integrates that parent's Watts; it never sums child kWh states. The review shows public entities separately from internal dependencies.

For a bidirectional total, the helper can retain net power and create separate Import and Return-to-grid power feeds for energy. The selected power and energy visibility choices apply consistently to those derived entities. Turning off an energy output omits its energy entity; it does not repurpose another total's kWh value.

## Existing configurations

Opening an existing Device Builder configuration does not change it. Configurations the helper does not own remain read-only until you explicitly choose adoption. Supported existing helper totals keep their IDs and numerical behavior while legacy parent relationships await review; old parent metadata is not silently activated as a formula. Unsupported or unverified source-owned YAML remains preserved rather than being claimed or rewritten.

Named Total Daily Energy sensors are matched to supported template power totals through `power_id`, including sensors without an explicit `id`. Recognized kWh entities are included in source-owned summaries and counts without changing their names, filters, or energy links. A `totalWatts`/`totalAmps` formula summing only part of the meter is a custom total, not proof of the native all-channel total. Such custom-native configurations remain ineligible for default-total adoption. Edit totals with existing energy links or custom-native formulas in Device Builder; the helper will not silently replace them and change entity identities. Ordinary `${friendly_name}` sensor names are supported during native-total adoption.

Every change is previewed against the current source and follows the normal hash-bound write, validation, compile, install confirmation, rollback, and reconnect verification path. Reconnect verification is intentionally fail-closed at 1,024 expected entity/name pairs; that is an operational safety limit, not a limit on every possible ESPHome source configuration.
