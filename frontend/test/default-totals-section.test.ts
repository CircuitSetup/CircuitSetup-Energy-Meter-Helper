import { render } from "lit";
import { afterEach, expect, it, vi } from "vitest";
import { defaultTotalsSection } from "../src/components/default-totals-section";
import { meterResponse } from "./workflow-scenarios";

let container: HTMLDivElement;

afterEach(() => container?.remove());

const mount = (response = meterResponse(), writable = true, readable = true, graphState: "ready" | "pending" | "invalid" = "ready", preview: import("../src/types").TotalGraphPreview | null = null) => {
  container = document.createElement("div");
  document.body.append(container);
  const update = vi.fn();
  render(defaultTotalsSection(response.configuration, response.totals, readable, writable, update, preview, graphState), container);
  return { update, response };
};

it("renders one overall card and its three controls for a main-only meter", () => {
  mount();

  expect(container.querySelectorAll(".default-total-card")).toHaveLength(1);
  expect(container.textContent).toContain("Overall meter total (all monitored channels)");
  expect(container.textContent).toContain("all monitored channels");
  expect(container.textContent).not.toContain("Main Board total");
  expect([...container.querySelectorAll<HTMLInputElement>("input")].map((input) => input.getAttribute("aria-label"))).toEqual([
    "Overall meter total Watts", "Overall meter total Amps", "Overall meter total kWh",
  ]);
});

it("uses catalog board labels, persisted outputs, and internal dependency copy for add-ons", () => {
  const response = meterResponse();
  response.totals.native_sources = [
    { source_id: "board-main", label: "Service panel", leaf_channels: [1, 2, 3, 4, 5, 6], power_id: "boardPower", current_id: "boardAmps", existing_energy_id: null,
      upstream_defaults: { watts: true, amps: true, kwh: false } },
    { source_id: "board-addon-1", label: "Garage panel", leaf_channels: [7, 8, 9, 10, 11, 12], power_id: "garagePower", current_id: "garageAmps", existing_energy_id: null,
      upstream_defaults: { watts: true, amps: true, kwh: false } },
    response.totals.native_sources[0]!,
  ];
  response.configuration.default_totals.boards = [
    { board_index: 0, outputs: { watts: false, amps: true, kwh: false } },
    { board_index: 1, outputs: { watts: true, amps: false, kwh: false } },
  ];
  response.configuration.aggregates = [{ aggregate_id: "garage-branch", name: "Garage branch", role: "branch",
    sources: [{ kind: "native_total", source_id: "board-addon-1" }], measurement_method: "direct", energy_mode: "consumption",
    outputs: { watts: false, amps: false, kwh: true }, origin: "advanced" }];
  const { update } = mount(response, false);

  expect(container.querySelectorAll(".default-total-card")).toHaveLength(3);
  expect(container.textContent).toContain("Service panel");
  expect(container.textContent).toContain("Garage panel");
  expect(container.textContent).toContain("Service panel + Garage panel");
  expect(container.textContent).toContain("CT1–CT6 + CT7–CT12");
  expect(container.textContent).toContain("Hidden from Home Assistant; retained internally for Overall meter total.");
  expect(container.textContent).toContain("Garage branch kWh");
  expect(container.querySelector<HTMLInputElement>('[aria-label="Service panel Watts"]')?.checked).toBe(false);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Garage panel Amps"]')?.checked).toBe(false);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Garage panel kWh"]')).not.toBeNull();
  expect(container.querySelector<HTMLInputElement>('[aria-label="Garage panel Amps"]')?.disabled).toBe(true);
  container.querySelector<HTMLInputElement>('[aria-label="Garage panel Watts"]')?.click();
  expect(update).not.toHaveBeenCalled();
});

it("distinguishes ready inventory from pending and invalid graph previews", () => {
  mount();
  expect(container.textContent).not.toContain("Updating total graph");
  mount(meterResponse(), true, true, "pending");
  expect(container.textContent).toContain("Updating total graph");
  mount(meterResponse(), true, true, "invalid");
  expect(container.textContent).toContain("Total graph unavailable");
});

it("keeps native Watts for each enabled native kWh output but not advanced energy", () => {
  const response = meterResponse();
  response.configuration.default_totals.overall = { watts: false, amps: false, kwh: true };
  response.totals.native_sources = [
    { source_id: "board-main", label: "Main Board", leaf_channels: [1, 2, 3, 4, 5, 6], power_id: "boardPower", current_id: "boardAmps", existing_energy_id: null,
      upstream_defaults: { watts: true, amps: true, kwh: false } }, response.totals.native_sources[0]!,
  ];
  response.configuration.default_totals.boards = [{ board_index: 0, outputs: { watts: false, amps: false, kwh: true } }];
  const preview: import("../src/types").TotalGraphPreview = { plan_id: response.plan_id, source_sha256: response.source_sha256,
    automatic_candidates: [], automatic_totals: [], stale_automatic_total_settings: [], configuration_impact: response.configuration_impact,
    graph: { native_visibility: [], leaf_channels: {}, independent_overlap_warnings: [], ordered_nodes: [{ aggregate: { aggregate_id: "advanced", name: "Advanced", role: "branch", sources: [{ kind: "native_total", source_id: "board-main" }], measurement_method: "direct", energy_mode: "consumption", outputs: { watts: false, amps: false, kwh: true }, origin: "advanced" }, power_id: "advancedPower", current_id: "advancedAmps", sources: [{ label: "Main Board", power_id: "boardPower", current_id: "boardAmps", leaf_channels: [1, 2, 3, 4, 5, 6] }], power_required: true, current_required: false, energy_required: true }] },
  };
  mount(response, true, true, "ready", preview);

  expect(container.textContent).toContain("retained internally for Overall meter total kWh.");
  expect(container.textContent).toContain("Main Board kWh");
  expect(container.textContent).toContain("Advanced Watts");
  expect(container.textContent).not.toContain("Advanced kWh");
});

it("patches only the selected board and keeps cards available while visibility is unresolved", () => {
  const response = meterResponse();
  response.totals.native_sources = [
    { source_id: "board-main", label: "Main Board", leaf_channels: [1, 2, 3, 4, 5, 6], power_id: "boardPower", current_id: "boardAmps", existing_energy_id: null,
      upstream_defaults: { watts: true, amps: true, kwh: false } },
    { source_id: "board-addon-1", label: "Add-on 1", leaf_channels: [7, 8, 9, 10, 11, 12], power_id: "addonPower", current_id: "addonAmps", existing_energy_id: null,
      upstream_defaults: { watts: true, amps: true, kwh: false } }, response.totals.native_sources[0]!,
  ];
  response.configuration.default_totals.boards = [
    { board_index: 0, outputs: { watts: false, amps: true, kwh: false } },
    { board_index: 1, outputs: { watts: true, amps: false, kwh: false } },
  ];
  response.totals.migration.native_visibility_resolved = false;
  const { update } = mount(response);

  expect(container.textContent).toContain("Native source visibility is unconfirmed");
  container.querySelector<HTMLInputElement>('[aria-label="Add-on 1 Amps"]')?.click();
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ default_totals: {
    overall: response.configuration.default_totals.overall,
    boards: [response.configuration.default_totals.boards[0], { board_index: 1, outputs: { watts: true, amps: true, kwh: false } }],
  }}));
});

it("does not expose controls when native totals cannot be read", () => {
  mount(meterResponse(), false, false);

  expect(container.querySelector('[role="switch"]')).toBeNull();
  expect(container.textContent).toContain("Native default totals are unavailable");
});
