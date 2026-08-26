import { describe, expect, it } from "vitest";
import { configurationImpact } from "../src/configuration-impact";
import type { MeterConfigurationRequest, MeterTopology } from "../src/types";

const topology: MeterTopology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2, connection_type: "wifi", voltage_layout: "standard", project_name: "meter", evidence: [{ source: "native_project", addon_count: 0, detail: "meter" }] };

const configuration: MeterConfigurationRequest = {
  meter: { friendly_name: "Meter", electrical_system: "split_phase_120_240", line_frequency_hz: 60, update_interval_s: 5, voltage_layout: "standard", voltage_references: [{ reference_id: "main", label: "Main", phase_label: "A", nominal_voltage_v: 120, transformer_model_id: "default", gain_voltage: 1, group_keys: ["main_1", "main_2"] }] },
  channels: Array.from({ length: 6 }, (_, index) => ({ channel: index + 1, enabled: true, name: `CT ${index + 1}`, model_id: "ct", reporting_multiplier: 1, role: "branch" as const, voltage_reference_id: "main", custom_gain_ct: null, custom_label: null, burden_output_acknowledged: false })),
  aggregates: [], power_quality: [false], status_fields: [true], multi_reference_preparation_acknowledged: false,
};

describe("configurationImpact", () => {
  it("updates the visible count for unused channels and bidirectional aggregates", () => {
    const impact = configurationImpact({ ...configuration, channels: configuration.channels.map((channel, index) => index === 5 ? { ...channel, enabled: false, role: "unused" } : channel), aggregates: [{ aggregate_id: "grid", name: "Grid", role: "grid", channels: [1, 2], measurement_method: "direct", parent_id: null, energy_mode: "bidirectional", expose_power: true, expose_current: true }] }, topology, { power_quality: [true], status_fields: [true] });
    expect(impact).toEqual({ enabled_channel_count: 5, numeric_entity_count: 38, text_entity_count: 5, energy_entity_count: 2, approximate_publications_per_second: 8.6 });
  });

  it("uses pending package options instead of the installed baseline", () => {
    expect(configurationImpact(configuration, topology, { power_quality: [false], status_fields: [false] }))
      .toMatchObject({ numeric_entity_count: 14, text_entity_count: 0 });
    expect(configurationImpact(configuration, topology, { power_quality: [true], status_fields: [true] }))
      .toMatchObject({ numeric_entity_count: 38, text_entity_count: 6 });
  });
});
