import type { MeterConfigurationRequest } from "./types";

export interface ConfigurationImpact {
  numeric_entities: number;
  text_entities: number;
  approximate_publications_per_second: number;
}

export function configurationImpact(configuration: MeterConfigurationRequest): ConfigurationImpact {
  let numeric = configuration.meter.voltage_references.length * 2;
  let text = 0;
  for (const channel of configuration.channels) if (channel.enabled) {
    numeric += 2 + (configuration.power_quality[Math.floor((channel.channel - 1) / 6)] ? 4 : 0);
    text += Number(configuration.status_fields[Math.floor((channel.channel - 1) / 6)]);
  }
  for (const aggregate of configuration.aggregates) {
    numeric += Number(aggregate.expose_power) + Number(aggregate.expose_current);
    numeric += aggregate.energy_mode === "bidirectional" ? 4 : aggregate.energy_mode === "none" ? 0 : 1;
  }
  return { numeric_entities: numeric, text_entities: text, approximate_publications_per_second: (numeric + text) / configuration.meter.update_interval_s };
}
