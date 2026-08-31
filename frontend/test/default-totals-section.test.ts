import { render } from "lit";
import { afterEach, expect, it, vi } from "vitest";
import { defaultTotalsSection } from "../src/components/default-totals-section";
import { meterResponse } from "./workflow-scenarios";

let container: HTMLDivElement;

afterEach(() => container?.remove());

const mount = (response = meterResponse(), writable = true, readable = true, graphState: "ready" | "pending" | "invalid" = "ready") => {
  container = document.createElement("div");
  document.body.append(container);
  const update = vi.fn();
  render(defaultTotalsSection(response.configuration, response.totals, readable, writable, update, graphState), container);
  return { update, response };
};

it("renders one shared conditional visibility note before the main-only card controls", () => {
  mount();

  expect(container.querySelectorAll(".default-total-card")).toHaveLength(1);
  expect(container.querySelectorAll(".native-total-status")).toHaveLength(1);
  expect(container.querySelectorAll(".native-total-status li")).toHaveLength(3);
  expect(container.querySelectorAll(".default-total-card .native-total-status")).toHaveLength(0);
  const note = container.querySelector(".native-total-status");
  const card = container.querySelector(".default-total-card");
  expect(note).not.toBeNull();
  expect(card).not.toBeNull();
  expect(note!.compareDocumentPosition(card!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(container.textContent).toContain("Overall meter total (all monitored channels)");
  expect(container.textContent).toContain("all monitored channels");
  expect(container.textContent).toContain("Watts is hidden from Home Assistant when off");
  expect(container.textContent).not.toContain("Native source visibility is unconfirmed");
  expect(container.textContent).not.toContain("Main Board total");
  expect([...container.querySelectorAll<HTMLInputElement>("input")].map((input) => input.getAttribute("aria-label"))).toEqual([
    "Overall meter total Watts", "Overall meter total Amps", "Overall meter total kWh",
  ]);
});

it("uses catalog board labels and persisted output switches for add-ons", () => {
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
  expect(container.querySelectorAll(".native-total-status")).toHaveLength(1);
  expect(container.querySelectorAll(".default-total-card .native-total-status")).toHaveLength(0);
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

it("patches only the selected board, keeps mixed output switches, and warns when visibility is unresolved", () => {
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
  expect([...container.querySelectorAll(".info-band")].filter((element) => element.textContent?.includes("Native source visibility is unconfirmed"))).toHaveLength(1);
  expect(container.querySelectorAll(".native-total-status")).toHaveLength(1);
  expect(container.querySelectorAll(".native-total-status li")).toHaveLength(3);
  expect(container.querySelectorAll(".default-total-card .native-total-status")).toHaveLength(0);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Overall meter total Watts"]')?.checked).toBe(true);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Overall meter total Amps"]')?.checked).toBe(true);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Overall meter total kWh"]')?.checked).toBe(true);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Main Board Watts"]')?.checked).toBe(false);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Main Board Amps"]')?.checked).toBe(true);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Add-on 1 Watts"]')?.checked).toBe(true);
  expect(container.querySelector<HTMLInputElement>('[aria-label="Add-on 1 Amps"]')?.checked).toBe(false);
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
