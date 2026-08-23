import { render } from "lit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ctInventoryStep, type CtDraft } from "../src/components/ct-inventory-step";
import { currentStep } from "../src/components/current-step";
import { espWebInstaller } from "../src/components/esp-web-installer";
import { panelStyles } from "../src/styles";
import { voltageStep } from "../src/components/voltage-step";
import type { CtInventory, MeterTopology } from "../src/types";

const topology: MeterTopology = {
  addon_count: 1,
  board_count: 2,
  ct_count: 12,
  group_count: 4,
  connection_type: "wifi",
  voltage_layout: "standard",
  project_name: "circuitsetup.6c-energy-meter-1-addon",
  evidence: [],
};

const noop = () => undefined;
let container: HTMLDivElement;

afterEach(() => container?.remove());

const mount = (template: ReturnType<typeof currentStep>) => {
  container = document.createElement("div");
  document.body.append(container);
  render(template, container);
  return container;
};

it("gives the firmware activation control the panel target size and focus treatment", () => {
  container = document.createElement("div");
  document.body.append(container);
  render(espWebInstaller({ productId: "6chan_energy_meter_main_board", version: "2026.8.0" }), container);

  const activate = container.querySelector<HTMLButtonElement>('[slot="activate"]');
  expect(activate?.getAttribute("aria-label")).toBe("Install firmware");
  expect(activate?.matches("button")).toBe(true);
  expect(panelStyles.cssText).toContain(".esp-web-installer [slot=\"activate\"]");
  expect(panelStyles.cssText).toContain("min-height: 44px");
  expect(panelStyles.cssText).toContain(".esp-web-installer [slot=\"activate\"]:focus-visible");
});

describe("calibration tab semantics", () => {
  it("supports roving keyboard focus and a linked current-board tabpanel", () => {
    const select = vi.fn();
    const root = mount(
      currentStep(topology, null, null, 1, new Map(), null, null, null, select, noop, noop, noop, noop, noop, noop),
    );
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1]);
    expect(tabs[0]?.getAttribute("aria-controls")).toBe("current-board-panel");
    expect(root.querySelector('[role="tabpanel"]')?.getAttribute("aria-labelledby")).toBe(
      "current-board-tab-0",
    );
    tabs[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(select).toHaveBeenCalledWith(7);
    expect(document.activeElement).toBe(tabs[1]);
  });

  it("supports arrow keys and a linked voltage-group tabpanel", () => {
    const select = vi.fn();
    const root = mount(voltageStep({ ...topology, voltage_layout: "two_voltages" }, null, 0, [0, 0], null, null,
      false, select, noop, noop, noop, noop, noop));
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1]);
    expect(tabs[0]?.getAttribute("aria-controls")).toBe("voltage-board-panel");
    expect(root.querySelector('[role="tabpanel"]')?.getAttribute("aria-labelledby")).toBe(
      "voltage-board-tab-0",
    );
    tabs[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(select).toHaveBeenCalledWith(1);
    expect(document.activeElement).toBe(tabs[1]);
  });

  it("scopes current source evidence to the selected board and labels live amps", () => {
    const root = mount(currentStep(topology, null, {
      session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, calibration_sources: {
        meter_main1: "configuration", meter_main2: "configuration",
        addon1_1: "flash", addon1_2: "configuration",
      },
    }, 7, new Map([[7, 5]]), 1, {
      target: "current", target_id: "Current group 3", stable: true,
      windows: [{ samples: [5, 5.01], mean: 5.005, standard_deviation: 0.005, range_percent: 0.2 }],
    }, null, noop, noop, noop, noop, noop, noop, noop));
    const source = root.querySelector('[aria-label="Current calibration source"]');
    const live = root.querySelector('[aria-label="current Current group 3 stability evidence"]');

    expect(source?.textContent).toContain("addon1_1");
    expect(source?.textContent).toContain("Saved flash");
    expect(source?.textContent).toContain("Yes");
    expect(source?.textContent).not.toContain("meter_main");
    expect(live?.textContent).toContain("CT7");
    expect(live?.textContent).toContain("5.00 A");
    expect(live?.textContent).not.toMatch(/Mean|Standard deviation|Range/);
  });

  it("labels selected-board voltage readings V1 through V3 without statistics", () => {
    const root = mount(voltageStep(topology, null, 1, [120, 0], {
      target: "voltage", target_id: "Board 2", stable: true,
      windows: Array.from({ length: 3 }, (_, index) => ({ samples: [120 + index], mean: 120 + index,
        standard_deviation: 0, range_percent: 0 })),
    }, null, false, noop, noop, noop, noop, noop, noop));
    const live = root.querySelector('[aria-label="voltage Board 2 stability evidence"]');

    expect(live?.textContent).toContain("V1");
    expect(live?.textContent).toContain("V2");
    expect(live?.textContent).toContain("V3");
    expect(live?.textContent).toContain("120.00 V");
    expect(live?.textContent).not.toMatch(/Mean|Standard deviation|Range/);
  });
});

it("gives the CT inventory table explicit header and data-cell semantics", () => {
  const inventory: CtInventory = {
    plan_id: "plan",
    source_sha256: "a".repeat(64),
    channels: Array.from({ length: 6 }, (_, index) => ({
      channel: index + 1,
      name: `CT${index + 1}`,
      raw_gain_ct: 5500,
      reporting_multiplier: 1,
      selected_model_id: "preset",
      selection_verified_against_config: true,
      address: {
        channel: index + 1,
        board_index: 0,
        group_index: Math.floor(index / 3),
        phase: (["A", "B", "C"] as const)[index % 3]!,
      },
    })),
    catalog: {
      presets: [{
        model_id: "preset",
        label: "Preset",
        rated_current_a: 100,
        secondary: "50 mA",
        default_gain_ct: 5500,
        requires_burden_jumper_cut: false,
        notes: "",
      }],
      source_repository: "CircuitSetup/repo",
      source_ref: "approved",
      schema_version: 1,
    },
  };
  const drafts = new Map<number, CtDraft>();
  container = document.createElement("div");
  document.body.append(container);
  render(ctInventoryStep(inventory, 0, drafts, noop, noop, noop, noop), container);

  expect(container.querySelectorAll('[role="columnheader"]')).toHaveLength(8);
  expect(container.querySelector('[data-ct-row]')?.querySelectorAll(':scope > [role="cell"]')).toHaveLength(8);
  const table = container.querySelector('[role="table"]');
  expect(table?.getAttribute("aria-rowcount")).toBe("7");
  expect(table?.querySelector('.ct-header')?.getAttribute("aria-rowindex")).toBe("1");
  expect(Array.from(table?.querySelectorAll('[data-ct-row]') ?? []).map((row) => row.getAttribute("aria-rowindex"))).toEqual([
    "2", "3", "4", "5", "6", "7",
  ]);
});
