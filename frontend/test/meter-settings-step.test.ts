import { render } from "lit";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  afterEach(() => vi.unstubAllGlobals());

  it("moves a voltage group atomically and requires multi-reference acknowledgement", () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    const root = document.createElement("div");
    let updated = draft;
    render(meterSettingsStep(draft, catalog, false, (value) => { updated = value; }, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined), root);
    const continueButton = root.querySelector<HTMLButtonElement>('[data-action="continue-meter-settings"]')!;
    expect(continueButton.disabled).toBe(true);
    const group = root.querySelector<HTMLSelectElement>('[aria-label="main_2 voltage reference"]')!;
    group.value = "main";
    group.dispatchEvent(new Event("change"));
    expect(updated.voltage_references.map((reference) => reference.group_keys)).toEqual([["main_2"], ["main_1"]]);
  });

  it("supports custom transformer gain and restores a preset gain", () => {
    const root = document.createElement("div");
    let updated = draft;
    const renderStep = () => render(meterSettingsStep(updated, catalog, true, (value) => { updated = value; }, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined), root);
    renderStep();
    const transformer = root.querySelector<HTMLSelectElement>('[aria-label="main transformer"]')!;
    transformer.value = "custom";
    transformer.dispatchEvent(new Event("change"));
    expect(updated.voltage_references[0]).toMatchObject({ transformer_model_id: "custom", gain_voltage: 7305 });
    renderStep();
    const gain = root.querySelector<HTMLInputElement>('[aria-label="main custom voltage gain"]')!;
    gain.value = "7011";
    gain.dispatchEvent(new Event("input"));
    renderStep();
    root.querySelector<HTMLSelectElement>('[aria-label="main transformer"]')!.value = "default";
    root.querySelector<HTMLSelectElement>('[aria-label="main transformer"]')!.dispatchEvent(new Event("change"));
    expect(updated.voltage_references[0]).toMatchObject({ transformer_model_id: "default", gain_voltage: 7305 });
    expect(root.textContent).toContain("1–5 seconds: high traffic.");
  });

  it("shows the reporting default and derives voltage for fixed profiles", () => {
    const root = document.createElement("div");
    const standard = { ...draft, update_interval_s: 10 as const };
    render(meterSettingsStep(standard, catalog, true, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined), root);
    expect(root.textContent).toContain("Reporting interval (default: 10 seconds)");
    expect(root.textContent).not.toContain("10 seconds: standard");
    expect(root.querySelector('[aria-label="main nominal voltage"]')).toBeNull();

    render(meterSettingsStep({ ...standard, electrical_system: "custom" }, catalog, true, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined), root);
    expect(root.querySelector('[aria-label="main nominal voltage"]')).not.toBeNull();
  });

  it("renders authoritative frequency and interval selections", () => {
    const root = document.createElement("div");
    const renderStep = (value: MeterSettingsDraft) => render(meterSettingsStep(value, catalog, true, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined), root);

    renderStep({ ...draft, line_frequency_hz: 60, update_interval_s: 10 });
    expect(root.querySelector<HTMLSelectElement>('[aria-label="Line frequency"] option:checked')?.value).toBe("60");
    expect(root.querySelector<HTMLSelectElement>('[aria-label="Reporting interval"] option:checked')?.value).toBe("10");
    expect(root.textContent).toContain("Line frequency (N. America: 60Hz)");

    renderStep({ ...draft, line_frequency_hz: 50, update_interval_s: 30 });
    expect(root.querySelector<HTMLSelectElement>('[aria-label="Line frequency"] option:checked')?.value).toBe("50");
    expect(root.querySelector<HTMLSelectElement>('[aria-label="Reporting interval"] option:checked')?.value).toBe("30");
  });

  it("collapses advanced settings and only shows editable gain for custom transformers", () => {
    const root = document.createElement("div");
    render(meterSettingsStep(draft, catalog, true, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined), root);
    expect(root.querySelector("details[data-section=advanced-meter-settings]")).not.toBeNull();
    expect(root.querySelector('[aria-label="main custom voltage gain"]')).toBeNull();
    expect(root.textContent).toContain("Starting gain: 7305");
  });

  it("keeps only the five guided fields outside collapsed advanced controls", () => {
    const root = document.createElement("div");
    render(meterSettingsStep(draft, catalog, true, () => undefined, () => undefined, () => undefined,
      () => undefined, () => undefined, () => undefined, () => undefined, null, () => undefined, false), root);

    const advanced = [...root.querySelectorAll<HTMLDetailsElement>("details")];
    expect(advanced.map((section) => section.open)).toEqual([false, false]);
    expect([...root.querySelectorAll(".step-content > .meter-settings-grid > label")].map((label) => label.childNodes[0]?.textContent?.trim()))
      .toEqual(["Friendly name", "Electrical system", "Line frequency (N. America: 60Hz)",
        "Reporting interval (default: 10 seconds)", "Transformer"]);
    expect(root.querySelector('[aria-label="main transformer"]')?.closest("details")).toBeNull();
    expect(root.querySelector('[aria-label="main phase label"]')?.closest("details")?.dataset.section)
      .toBe("advanced-meter-settings");
    expect(root.querySelector('[aria-label="main_1 voltage reference"]')?.closest("details")?.dataset.section)
      .toBe("advanced-meter-settings");
    expect(root.querySelector<HTMLInputElement>('[aria-label="Confirm electrical profile"]')?.checked).toBe(false);
    expect(root.querySelector<HTMLButtonElement>('[data-action="continue-meter-settings"]')?.disabled).toBe(true);
  });

  it.each(["new install", "legacy management"])("requires electrical-profile confirmation for %s", (_mode) => {
    const root = document.createElement("div");
    render(meterSettingsStep(draft, catalog, true, () => undefined, () => undefined, () => undefined,
      () => undefined, () => undefined, () => undefined, () => undefined, null, () => undefined, false,
      () => undefined, "legacy_editable"), root);

    expect(root.querySelector<HTMLButtonElement>('[data-action="continue-meter-settings"]')?.disabled).toBe(true);
  });

  it("allows an unchanged helper-managed profile to continue", () => {
    const root = document.createElement("div");
    render(meterSettingsStep(draft, catalog, true, () => undefined, () => undefined, () => undefined,
      () => undefined, () => undefined, () => undefined, () => undefined, null, () => undefined, true,
      () => undefined, "helper_managed"), root);

    expect(root.querySelector<HTMLButtonElement>('[data-action="continue-meter-settings"]')?.disabled).toBe(false);
  });

  it("keeps package and multi-reference wiring controls in advanced sections", () => {
    const root = document.createElement("div");
    render(meterSettingsStep({ ...draft, electrical_system: "custom" }, catalog, true, () => undefined,
      () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined,
      { power_quality: [false], status_fields: [true] }, () => undefined), root);

    expect(root.querySelector(".package-options")?.closest("details")?.dataset.section).toBe("advanced-meter-settings");
    expect(root.querySelector('[aria-label="main phase label"]')?.closest("details")?.dataset.section).toBe("advanced-meter-settings");
    expect(root.querySelector('[aria-label="main_1 voltage reference"]')?.closest("details")?.dataset.section).toBe("advanced-meter-settings");
    expect(root.querySelector('[aria-label="main nominal voltage"]')?.closest("details")?.dataset.section).toBe("advanced-voltage-options");
  });

  it("adds and removes references by explicitly transferring physical groups", () => {
    const root = document.createElement("div");
    let updated = { ...draft, voltage_references: [{ ...draft.voltage_references[0]!, group_keys: ["main_1", "main_2"] }] };
    let acknowledged = true;
    const renderStep = () => render(meterSettingsStep(updated, catalog, acknowledged, (value) => { updated = value; }, () => undefined, () => undefined, () => undefined, (value) => { acknowledged = value; }, () => undefined, () => undefined), root);
    renderStep();
    const transfer = root.querySelector<HTMLSelectElement>('[aria-label="Group transferred to new reference"]')!;
    transfer.value = "main_2";
    root.querySelector<HTMLButtonElement>('[data-action="add-voltage-reference"]')!.click();
    expect(updated.voltage_references).toHaveLength(2);
    expect(updated.voltage_references[1]).toMatchObject({ reference_id: "reference-2", group_keys: ["main_2"] });
    expect(acknowledged).toBe(false);

    vi.stubGlobal("confirm", vi.fn(() => true));
    renderStep();
    root.querySelector<HTMLButtonElement>('[aria-label="Remove reference-2 voltage reference"]')!.click();
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("main_2"));
    expect(updated.voltage_references).toHaveLength(1);
    expect(updated.voltage_references[0]!.group_keys).toEqual(["main_1", "main_2"]);
  });

  it("requires confirmation before swapping the last physical group", () => {
    const root = document.createElement("div");
    let updated = draft;
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    render(meterSettingsStep(draft, catalog, true, (value) => { updated = value; }, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined), root);
    const group = root.querySelector<HTMLSelectElement>('[aria-label="main_2 voltage reference"]')!;
    group.value = "main";
    group.dispatchEvent(new Event("change"));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("swap"));
    expect(updated).toBe(draft);
  });
});
