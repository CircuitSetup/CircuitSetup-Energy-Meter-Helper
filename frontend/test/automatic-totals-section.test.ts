import { render } from "lit";
import { afterEach, expect, it, vi } from "vitest";
import { automaticTotalsSection } from "../src/components/automatic-totals-section";
import type { TotalOutputSettings } from "../src/types";
import { meterResponse } from "./workflow-scenarios";

let container: HTMLDivElement;
afterEach(() => {
  container?.remove();
  expect(document.querySelector(".automatic-totals")).toBeNull();
});

const mount = (energyMode: "consumption" | "bidirectional" | "none" = "consumption", parent = false,
  outputs: TotalOutputSettings = { watts: true, amps: false, kwh: energyMode !== "none" }) => {
  const response = meterResponse();
  const candidate = { candidate_id: "grid-ct1-ct2", aggregate_id: "auto-grid", name: "Service mains", role: "grid" as const,
    sources: [{ kind: "channel" as const, channel: 1 }, { kind: "channel" as const, channel: 2 }], measurement_method: "two_ct_sum" as const,
    energy_mode: energyMode, recommended_outputs: outputs };
  response.totals.automatic_candidates = [candidate];
  response.totals.automatic_totals = [{ candidate, enabled: true, outputs }];
  response.configuration.automatic_totals = [{ candidate_id: candidate.candidate_id, enabled: true, outputs }];
  if (parent) response.configuration.aggregates = [{ aggregate_id: "home", name: "Home load", role: "branch", sources: [{ kind: "aggregate", aggregate_id: candidate.aggregate_id }], measurement_method: "direct", energy_mode: "consumption", outputs: { watts: true, amps: false, kwh: true }, origin: "advanced" }];
  const update = vi.fn();
  container = document.createElement("div"); document.body.append(container);
  render(automaticTotalsSection(response.configuration, response.totals, true, update), container);
  return { response, update };
};

it("shows the server candidate CT names, formula, persisted switch, and feeds-into parent", () => {
  const { response } = mount("consumption", true);
  response.configuration.channels[0]!.name = "Service leg A"; response.configuration.channels[1]!.name = "Service leg B";
  render(automaticTotalsSection(response.configuration, response.totals, true, vi.fn()), container);
  expect(container.textContent).toContain("Service mains");
  expect(container.textContent).toContain("CT1 · Service leg A");
  expect(container.textContent).toContain("CT1 + CT2");
  expect(container.textContent).toContain("Feeds into: Home load");
  expect(container.querySelector(".aggregate-id code")?.textContent).toBe("auto-grid");
  expect(container.querySelector<HTMLInputElement>('[aria-label="Create Service mains total"]')?.checked).toBe(true);
});

it("lets suggested totals inherit or edit a name and previews name-based sensor IDs", () => {
  const { response, update } = mount();
  const name = container.querySelector<HTMLInputElement>('[aria-label="grid-ct1-ct2 suggested total name"]')!;
  expect(name.value).toBe("Service mains");
  name.value = "Dryer";
  name.dispatchEvent(new Event("input"));
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ automatic_totals: [{
    candidate_id: "grid-ct1-ct2", enabled: true, outputs: { watts: true, amps: false, kwh: true }, name: "Dryer",
  }] }));
  const updated = update.mock.calls.at(-1)![0];
  render(automaticTotalsSection(updated, response.totals, true, update), container);
  expect(container.textContent).toContain("dryerWatts");
  expect(container.textContent).toContain("dryerEnergy");
  expect(container.textContent).not.toContain("dryerAmps");
});

it("matches bidirectional generated sensor IDs and hides guessed IDs for saved totals", () => {
  const { response } = mount("bidirectional", false, { watts: true, amps: true, kwh: true });
  expect(container.textContent).toContain("serviceMainsWatts, serviceMainsAmps, serviceMainsExportWatts, serviceMainsExportEnergy, serviceMainsImportWatts, serviceMainsImportEnergy");
  expect(container.textContent).not.toContain("serviceMainsEnergy");

  const existing = structuredClone(response.configuration);
  existing.automatic_totals[0]!.name = "Old mains";
  render(automaticTotalsSection(response.configuration, response.totals, true, vi.fn(), existing), container);
  expect(container.textContent).toContain("Existing sensor IDs are preserved");
  expect(container.textContent).not.toContain("serviceMainsWatts");
  expect(container.textContent).not.toContain("oldMainsWatts");
});

it("keeps a cleared suggested-total name editable until it is valid again", () => {
  const { response, update } = mount();
  const name = container.querySelector<HTMLInputElement>('[aria-label="grid-ct1-ct2 suggested total name"]')!;
  name.value = "";
  name.dispatchEvent(new Event("input"));
  const cleared = update.mock.calls.at(-1)![0];
  render(automaticTotalsSection(cleared, response.totals, true, update), container);
  const retyped = container.querySelector<HTMLInputElement>('[aria-label="grid-ct1-ct2 suggested total name"]')!;
  expect(retyped.value).toBe("");
  expect(container.textContent).toContain("enter a name first");
  retyped.value = "Dryer";
  retyped.dispatchEvent(new Event("input"));
  expect(update.mock.calls.at(-1)![0].automatic_totals[0].name).toBe("Dryer");
});

it("keeps an explicit disabled setting after reload and only changes enabled", () => {
  const { response, update } = mount();
  response.configuration.automatic_totals[0]!.enabled = false;
  render(automaticTotalsSection(response.configuration, response.totals, true, update), container);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Create Service mains total"]')?.checked).toBe(false);
  container.querySelector<HTMLInputElement>('[aria-label="Create Service mains total"]')?.click();
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ automatic_totals: [{ candidate_id: "grid-ct1-ct2", enabled: true, outputs: { watts: true, amps: false, kwh: true } }] }));
});

it("keeps Watts, Amps, and kWh independent and disables kWh when the server says none", () => {
  const { update } = mount();
  container.querySelector<HTMLInputElement>('[aria-label="Service mains Amps"]')?.click();
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ automatic_totals: [{ candidate_id: "grid-ct1-ct2", enabled: true, outputs: { watts: true, amps: true, kwh: true } }] }));
  container.remove();
  mount("none");
  expect(container.querySelector<HTMLInputElement>('[aria-label="Service mains kWh"]')?.disabled).toBe(true);
});

it("warns about ambiguous eligible roles without guessing a candidate", () => {
  const response = meterResponse(); response.configuration.channels.slice(0, 3).forEach((channel) => { channel.role = "subpanel"; });
  container = document.createElement("div"); document.body.append(container);
  render(automaticTotalsSection(response.configuration, response.totals, true, vi.fn()), container);
  expect(container.textContent).toContain("Multiple Subpanel CTs cannot be paired automatically. Create the totals under Advanced totals.");
  expect(container.querySelector('[role="switch"]')).toBeNull();
  expect(response.totals.automatic_candidates).toEqual([]);
});

it("cancels parent removal without changing the draft or visible switch", () => {
  const { update } = mount("consumption", true);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const toggle = container.querySelector<HTMLInputElement>('[aria-label="Create Service mains total"]')!;
  toggle.click();
  expect(confirm).toHaveBeenCalledWith("Home load uses Service mains. Remove it from Home load?");
  expect(update).not.toHaveBeenCalled();
  expect(toggle.checked).toBe(true);
  confirm.mockRestore();
});

it("explicitly removes the parent source before disabling", () => {
  const { update } = mount("consumption", true);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  container.querySelector<HTMLInputElement>('[aria-label="Create Service mains total"]')?.click();
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ automatic_totals: [{ candidate_id: "grid-ct1-ct2", enabled: false, outputs: { watts: true, amps: false, kwh: true } }], aggregates: [expect.objectContaining({ sources: [] })] }));
  confirm.mockRestore();
});
