import { render } from "lit";
import { describe, expect, it } from "vitest";

import { meterSettingsStep } from "../src/components/meter-settings-step";
import type { MeterSettingsDraft, VoltageTransformerCatalog } from "../src/types";

const catalog: VoltageTransformerCatalog = { presets: [{ model_id: "default", label: "Default transformer", primary_nominal_v: 120,
  secondary_nominal_v: 9, default_gain_voltage: 7305, notes: "" }], source_repository: "repo", source_ref: "a".repeat(40), schema_version: 1 };
const draft: MeterSettingsDraft = { friendly_name: "Meter", electrical_system: "split_phase_120_240", line_frequency_hz: 60,
  update_interval_s: 5, voltage_layout: "multi_reference", authoritative: true, warnings: [], voltage_references: [
    { reference_id: "main", label: "Main", phase_label: "A", nominal_voltage_v: 120, transformer_model_id: "default", gain_voltage: 7305, group_keys: ["main_1"] },
    { reference_id: "solar", label: "Solar", phase_label: "B", nominal_voltage_v: 120, transformer_model_id: "default", gain_voltage: 7305, group_keys: ["main_2"] },
  ] };

describe("meterSettingsStep", () => {
  it("moves a voltage group atomically and requires multi-reference acknowledgement", () => {
    const root = document.createElement("div");
    let updated = draft;
    render(meterSettingsStep(draft, catalog, false, (value) => { updated = value; }, () => undefined, () => undefined, () => undefined), root);
    const continueButton = root.querySelector<HTMLButtonElement>('[data-action="continue-meter-settings"]')!;
    expect(continueButton.disabled).toBe(true);
    const group = root.querySelector<HTMLSelectElement>('[aria-label="main_2 voltage reference"]')!;
    group.value = "main";
    group.dispatchEvent(new Event("change"));
    expect(updated.voltage_references.map((reference) => reference.group_keys)).toEqual([["main_2"], ["main_1"]]);
  });
});
