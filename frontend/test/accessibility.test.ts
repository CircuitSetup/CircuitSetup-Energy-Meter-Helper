import { render } from "lit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ctInventoryStep, type CtDraft } from "../src/components/ct-inventory-step";
import { currentStep } from "../src/components/current-step";
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

describe("calibration tab semantics", () => {
  it("supports roving keyboard focus and a linked current-board tabpanel", () => {
    const select = vi.fn();
    const root = mount(
      currentStep(topology, null, 1, 0, null, null, null, select, noop, noop, noop, noop, noop, noop),
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
    const root = mount(voltageStep({ ...topology, voltage_layout: "two_voltages" }, 0, 0, null, null,
      false, select, noop, noop, noop, noop, noop));
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1]);
    expect(tabs[0]?.getAttribute("aria-controls")).toBe("voltage-group-panel");
    expect(root.querySelector('[role="tabpanel"]')?.getAttribute("aria-labelledby")).toBe(
      "voltage-group-tab-0",
    );
    tabs[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(select).toHaveBeenCalledWith(1);
    expect(document.activeElement).toBe(tabs[1]);
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
        group_index: Math.floor(index / 3) + 1,
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
  render(ctInventoryStep(inventory, 0, 0, drafts, noop, noop, noop, noop, noop), container);

  expect(container.querySelectorAll('[role="columnheader"]')).toHaveLength(7);
  expect(container.querySelector('[data-ct-row]')?.querySelectorAll(':scope > [role="cell"]')).toHaveLength(7);
  const table = container.querySelector('[role="table"]');
  expect(table?.getAttribute("aria-rowcount")).toBe("7");
  expect(table?.querySelector('.ct-header')?.getAttribute("aria-rowindex")).toBe("1");
  expect(Array.from(table?.querySelectorAll('[data-ct-row]') ?? []).map((row) => row.getAttribute("aria-rowindex"))).toEqual([
    "2", "3", "4", "5", "6", "7",
  ]);
});
