import { render } from "lit";
import { expect, it, vi } from "vitest";
import { ctInventoryStep, type CtDraft } from "../src/components/ct-inventory-step";
import { meterResponse } from "./workflow-scenarios";
import type { CtInventory } from "../src/types";

const inventory: CtInventory = { plan_id: "p", source_sha256: "a".repeat(64), channels: [{ channel: 1, name: "Main", raw_gain_ct: 100, reporting_multiplier: 1, selected_model_id: "custom", selection_verified_against_config: true, display_label: null, stored_selection_present: false, address: { channel: 1, board_index: 0, group_index: 0, phase: "A" } }], catalog: { presets: [], source_repository: "repo", source_ref: "ref", schema_version: 1 } };
const draft: CtDraft = { name: "Main", modelId: "custom", multiplier: 1, burdenAcknowledged: false, expanded: false };
const actions = () => ({ setBoard: vi.fn(), update: vi.fn(), back: vi.fn(), review: vi.fn() });
it("shows required custom gain and burden acknowledgement beside the model", () => {
  const root = document.createElement("div");
  render(ctInventoryStep({ inventory, board: 0, drafts: new Map([[1, draft]]) }, actions()), root);
  for (const label of ["CT1 custom gain", "CT1 burden output acknowledgement"]) {
    const control = root.querySelector(`[aria-label="${label}"]`);
    expect(control).not.toBeNull();
    expect(control?.closest("details")).toBeNull();
    expect(control?.closest(".ct-model-field")).not.toBeNull();
  }
  expect(root.querySelector<HTMLDetailsElement>(".technical-details")?.open).toBe(false);
  expect(root.querySelector("[data-ct-blocked-reason]")?.textContent).toContain("CT1: enter a custom gain");
});
it("renders names only and action-specific labels without configuration controls", () => {
  const root = document.createElement("div");
  const data = { inventory, board: 0, drafts: new Map([[1, draft]]), labelOnly: true, actionLabel: "Save Home Assistant names", busyLabel: "Saving Home Assistant names…" };
  render(ctInventoryStep(data, actions()), root);
  expect(root.querySelectorAll("input")).toHaveLength(1);
  expect(root.querySelector("select, details")).toBeNull();
  expect(root.querySelector("[data-action=continue]")?.textContent).toBe("Save Home Assistant names");
  render(ctInventoryStep({ ...data, busy: true }, actions()), root);
  expect(root.querySelector("[data-action=continue]")?.textContent).toContain("Saving Home Assistant names…");
});

it("keeps unused rows compact and preserves their saved CT settings", () => {
  const root = document.createElement("div");
  const configuration = meterResponse().configuration;
  configuration.channels[0] = { ...configuration.channels[0]!, enabled: false, role: "unused" };
  const updateConfiguration = vi.fn();
  const callbacks = actions();
  render(ctInventoryStep({ inventory, board: 0, drafts: new Map([[1, draft]]), configuration }, { ...callbacks, updateConfiguration }), root);
  expect(root.querySelector(".ct-unused-row")).not.toBeNull();
  expect(root.querySelector("select, details.technical-details")).toBeNull();
  root.querySelector<HTMLInputElement>('[aria-label="CT1 used"]')!.dispatchEvent(new Event("change"));
  expect(updateConfiguration.mock.calls[0]![0].channels[0]).toEqual({ ...configuration.channels[0], enabled: true, role: "branch" });
  expect(callbacks.update).not.toHaveBeenCalled();
});
it("does not expand technical details after a routine model selection", () => {
  const root = document.createElement("div");
  const callbacks = actions();
  render(ctInventoryStep({ inventory, board: 0, drafts: new Map([[1, draft]]) }, callbacks), root);
  root.querySelector<HTMLSelectElement>('[aria-label="CT1 model"]')!.dispatchEvent(new Event("change"));
  expect(callbacks.update).toHaveBeenCalledWith(1, expect.objectContaining({ expanded: false }));
});
