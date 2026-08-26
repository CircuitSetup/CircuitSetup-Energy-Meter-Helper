import type { BoardPackageOptions, MeterConfigurationRequest, MeterTopology } from "./types";

export interface ConfigurationImpact {
  enabled_channel_count: number;
  numeric_entity_count: number;
  text_entity_count: number;
  energy_entity_count: number;
  approximate_publications_per_second: number;
}

export function configurationImpact(configuration: MeterConfigurationRequest, topology: MeterTopology, packageOptions: BoardPackageOptions = configuration): ConfigurationImpact {
  let numeric = configuration.meter.voltage_references.length * 2;
  let text = 0; let energy = 0; let enabled = 0;
  for (const channel of configuration.channels) if (channel.enabled) {
    const board = Math.floor((channel.channel - 1) / 6);
    if (board >= topology.board_count) throw new Error("configuration topology is invalid");
    enabled += 1;
    numeric += 2 + (packageOptions.power_quality[board] ? 4 : 0);
    text += Number(packageOptions.status_fields[board]);
  }
  for (const aggregate of configuration.aggregates) {
    numeric += Number(aggregate.expose_power) + Number(aggregate.expose_current);
    if (aggregate.energy_mode === "bidirectional") { numeric += 4; energy += 2; }
    else if (aggregate.energy_mode !== "none") { numeric += 1; energy += 1; }
  }
  return { enabled_channel_count: enabled, numeric_entity_count: numeric, text_entity_count: text, energy_entity_count: energy, approximate_publications_per_second: (numeric + text) / configuration.meter.update_interval_s };
}
