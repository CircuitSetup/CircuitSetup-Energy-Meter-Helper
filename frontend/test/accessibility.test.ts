import { render } from "lit";
import "../src/index";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ctInventoryStep, type CtDraft } from "../src/components/ct-inventory-step";
import { currentStep } from "../src/components/current-step";
import { espWebInstaller } from "../src/components/esp-web-installer";
import { meterSettingsStep } from "../src/components/meter-settings-step";
import { setupDeviceStep } from "../src/components/setup-device-step";
import { panelStyles } from "../src/styles";
import { voltageStep } from "../src/components/voltage-step";
import type { CtInventory, MeterTopology } from "../src/types";
import { meterResponse, newInstallScenario } from "./workflow-scenarios";

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

it("marks exactly the active workflow step and exposes mobile progress state", async () => {
  const panel = document.createElement("circuitsetup-energy-meter-helper-panel") as import("../src/panel").CircuitSetupPanel;
  panel.panel = { config: { entry_id: "entry-1" } };
  panel.hass = {
    callWS: async <T>() => newInstallScenario.setup as T,
    connection: { subscribeMessage: async () => () => undefined },
  };
  document.body.append(panel);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await panel.updateComplete;

  expect(panel.shadowRoot?.querySelectorAll("nav [aria-current=step]")).toHaveLength(1);
  const heading = panel.shadowRoot?.querySelector<HTMLElement>("#step-heading");
  expect(heading?.getAttribute("tabindex")).toBe("-1");
  expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".mobile-progress button")?.getAttribute("aria-expanded")).toBe("false");
  panel.shadowRoot?.querySelector<HTMLButtonElement>(".mobile-progress button")?.click();
  await panel.updateComplete;
  expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".mobile-progress button")?.getAttribute("aria-expanded")).toBe("true");
});

it("gives the firmware activation control the panel target size and focus treatment", async () => {
  container = document.createElement("div");
  document.body.append(container);
  render(espWebInstaller({ productId: "6chan_energy_meter_main_board", version: "2026.8.0" }), container);

  await vi.waitFor(() => expect(container.querySelector("esp-web-install-button")).not.toBeNull());

  const activate = container.querySelector<HTMLButtonElement>('[slot="activate"]');
  expect(container.textContent).toContain("6chan_energy_meter_main_board · ESPHome 2026.8.0");
  expect(container.textContent).not.toContain("https://");
  expect(activate?.getAttribute("aria-label")).toBe("Install firmware");
  expect(activate?.matches("button")).toBe(true);
  expect(panelStyles.cssText).toContain(".esp-web-installer [slot=\"activate\"]");
  expect(panelStyles.cssText).toContain("min-height: 44px");
  expect(panelStyles.cssText).toContain(".esp-web-installer [slot=\"activate\"]:focus-visible");
});

it("keeps Setup Device free of legacy installer and IO0 controls", () => {
  container = document.createElement("div");
  document.body.append(container);
  render(setupDeviceStep(null, 0, "wifi", noop, noop, noop, noop, noop), container);

  expect(container.querySelector('[data-action="rescan"]')?.textContent).toContain("Rescan for device");
  expect(container.querySelector("button.installer")).toBeNull();
  expect(container.querySelector(".package-options")).toBeNull();
  expect([...container.querySelectorAll("dt")].some((term) => term.textContent === "IO0")).toBe(false);
  expect(container.querySelector(".io-guidance")).toBeNull();
  expect([...container.querySelectorAll("input")].some((input) =>
    [input.getAttribute("name"), input.getAttribute("aria-label"), input.getAttribute("autocomplete"), input.getAttribute("data-testid")]
      .some((value) => /ssid|network password|wifi password|passphrase/i.test(value ?? "")))).toBe(false);
});

it("opens advanced meter settings and confirms the profile with keyboard focus", () => {
  container = document.createElement("div");
  document.body.append(container);
  const response = meterResponse();
  let confirmed = false;
  render(meterSettingsStep({ ...response.configuration.meter, authoritative: true, warnings: [] }, response.voltage_transformer_catalog, false,
    noop, noop, noop, noop, noop, noop, noop, null, noop, false,
    (value) => { confirmed = value; }), container);

  const advanced = container.querySelector<HTMLDetailsElement>('[data-section="advanced-meter-settings"]')!;
  const summary = advanced.querySelector<HTMLElement>("summary")!;
  summary.focus();
  summary.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  summary.click();
  expect(document.activeElement).toBe(summary);
  expect(advanced.open).toBe(true);

  const confirmation = container.querySelector<HTMLInputElement>('[aria-label="Confirm electrical profile"]')!;
  confirmation.focus();
  confirmation.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
  confirmation.click();
  expect(document.activeElement).toBe(confirmation);
  expect(confirmed).toBe(true);
});

describe("calibration tab semantics", () => {
  it("keeps the skip action centered in a three-column footer", () => {
    expect(panelStyles.cssText).toContain(".action-footer.offset-footer { display: grid; grid-template-columns: 1fr auto 1fr;");
    expect(panelStyles.cssText).not.toContain(".offset-footer .primary { grid-column: 1 / -1; }");
  });

  it("supports roving keyboard focus and a linked current-board tabpanel", () => {
    const select = vi.fn();
    const root = mount(
      currentStep(topology, null, null, 1, new Map(), null, null, null, new Set(), select, noop, noop, noop, noop, noop, noop),
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
    const root = mount(voltageStep({ ...topology, voltage_layout: "two_voltages" }, null, 0, [0, 0], [], null, [],
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
    }, null, new Set(), noop, noop, noop, noop, noop, noop, noop));
    const source = root.querySelector('[aria-label="Current calibration source"]');
    const live = root.querySelector('[aria-label="current Current group 3 stability evidence"]');

    expect(source?.textContent).toContain("addon1_1");
    expect(source?.textContent).toContain("Saved flash");
    expect(source?.textContent).toContain("No");
    expect(source?.textContent).not.toContain("meter_main");
    expect(live?.textContent).toContain("CT7");
    expect(live?.textContent).toContain("5.00 A");
    expect(live?.textContent).not.toMatch(/Mean|Standard deviation|Range/);
  });

  it("does not misreport an unresolved active gain source as configuration", () => {
    const root = mount(currentStep(topology, null, {
      session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, calibration_sources: { meter_main1: "unknown" },
    }, 1, new Map(), 1, null, null, new Set(), noop, noop, noop, noop, noop, noop, noop));

    expect(root.querySelector('[aria-label="Current calibration source"]')?.textContent).toContain("Unknown");
  });

  it("labels selected-board voltage readings V1 through V3 without statistics", () => {
    const root = mount(voltageStep(topology, null, 1, [120, 0], [], {
      target: "voltage", target_id: "Board 2", stable: true,
      windows: Array.from({ length: 3 }, (_, index) => ({ samples: [120 + index], mean: 120 + index,
        standard_deviation: 0, range_percent: 0 })),
    }, [], false, noop, noop, noop, noop, noop, noop));
    const live = root.querySelector('[aria-label="voltage Board 2 stability evidence"]');

    expect(live?.textContent).toContain("V1");
    expect(live?.textContent).toContain("V2");
    expect(live?.textContent).toContain("V3");
    expect(live?.textContent).toContain("120.00 V");
    expect(live?.textContent).not.toMatch(/Mean|Standard deviation|Range/);
  });

  it("keeps a board with partial shared voltage evidence actionable", () => {
    const calibrate = vi.fn();
    const root = mount(voltageStep(topology, null, 1, [120], ["C"], {
      target: "voltage", target_id: "C", stable: true,
      windows: Array.from({ length: 3 }, () => ({ samples: [120], mean: 120, standard_deviation: 0, range_percent: 0 })),
    }, [{ state: "applied_pending_restart_verification", group_key: "main_1", phase: null, changed_channels: [1, 2, 3],
      iteration: 1, before_values: [120, 120, 120], after_values: [120, 120, 120], error_percent_values: [0, 0, 0],
      gain_evidence: null, restore_evidence: null, retry_allowed: false }], false, noop, noop, noop, calibrate, noop, noop));

    const button = root.querySelector<HTMLButtonElement>(".calibration-actions .primary");
    expect(root.textContent).not.toContain("Voltage calibration complete for Add-on 1");
    expect(button?.disabled).toBe(false);
    button?.click();
    expect(calibrate).toHaveBeenCalledOnce();
  });

  it.each(["indeterminate", "result_outside_tolerance"] as const)("blocks terminal %s voltage recovery without retry", (state) => {
    const calibrate = vi.fn();
    const root = mount(voltageStep(topology, null, 1, [120], ["C"], {
      target: "voltage", target_id: "C", stable: true,
      windows: Array.from({ length: 3 }, () => ({ samples: [120], mean: 120, standard_deviation: 0, range_percent: 0 })),
    }, [{ state, group_key: "addon1_1", phase: null, changed_channels: [4, 5, 6], iteration: 3,
      before_values: [120, 120, 120], after_values: [], error_percent_values: [], gain_evidence: null,
      restore_evidence: null, retry_allowed: false }], false, noop, noop, noop, calibrate, noop, noop));

    const button = root.querySelector<HTMLButtonElement>(".calibration-actions .primary");
    expect(button?.disabled).toBe(true);
    button?.click();
    expect(calibrate).not.toHaveBeenCalled();
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
      display_label: null,
      stored_selection_present: false,
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

  expect(container.querySelectorAll('[role="columnheader"]')).toHaveLength(11);
  expect(container.querySelector('[data-ct-row]')?.querySelectorAll(':scope > [role="cell"]')).toHaveLength(11);
  const table = container.querySelector('[role="table"]');
  expect(table?.getAttribute("aria-rowcount")).toBe("7");
  expect(table?.querySelector('.ct-header')?.getAttribute("aria-rowindex")).toBe("1");
  expect(Array.from(table?.querySelectorAll('[data-ct-row]') ?? []).map((row) => row.getAttribute("aria-rowindex"))).toEqual([
    "2", "3", "4", "5", "6", "7",
  ]);
});
