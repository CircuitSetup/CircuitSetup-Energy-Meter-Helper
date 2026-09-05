import { render } from "lit";
import { afterEach, expect, it, vi } from "vitest";
import { automaticTotalsSection } from "../src/components/automatic-totals-section";
import { meterResponse } from "./workflow-scenarios";

let container: HTMLDivElement;
afterEach(() => {
  container?.remove();
  expect(document.querySelector(".automatic-totals")).toBeNull();
});

const mount = (energyMode: "consumption" | "none" = "consumption", parent = false) => {
  const response = meterResponse();
  const candidate = { candidate_id: "grid-ct1-ct2", aggregate_id: "auto-grid", name: "Service mains", role: "grid" as const,
    sources: [{ kind: "channel" as const, channel: 1 }, { kind: "channel" as const, channel: 2 }], measurement_method: "two_ct_sum" as const,
    energy_mode: energyMode, recommended_outputs: { watts: true, amps: false, kwh: energyMode !== "none" } };
  response.totals.automatic_candidates = [candidate];
  response.totals.automatic_totals = [{ candidate, enabled: true, outputs: { watts: true, amps: false, kwh: energyMode !== "none" } }];
  response.configuration.automatic_totals = [{ candidate_id: candidate.candidate_id, enabled: true, outputs: { watts: true, amps: false, kwh: energyMode !== "none" } }];
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
  expect(container.querySelector<HTMLInputElement>('[aria-label="Create Service mains total"]')?.checked).toBe(true);
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
