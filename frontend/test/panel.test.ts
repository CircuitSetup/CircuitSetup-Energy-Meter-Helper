import { afterEach, describe, expect, it } from "vitest";

import "../src/index";
import type { HomeAssistant } from "../src/api";
import type { CircuitSetupPanel } from "../src/panel";
import { changesFromDrafts, type CtDraft } from "../src/components/ct-inventory-step";
import { panelStyles } from "../src/styles";
import type { CtInventory } from "../src/types";

const tick = async () => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const device = {
  entry_id: "meter-1",
  title: "Basement meter",
  project_name: "circuitsetup.6c-energy-meter",
  project_version: "2026.8.0",
  importable: true,
  configuration: null,
};

const makeHass = (responses: Record<string, unknown>): HomeAssistant => ({
  callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
    const operation = String(message.type).split("/").at(-1) ?? "";
    const response = responses[operation] ?? {};
    if (response instanceof Error) throw response;
    return response as T;
  },
  connection: {
    subscribeMessage: async () => () => undefined,
  },
});

const mount = async (hass: HomeAssistant) => {
  const panel = document.createElement(
    "circuitsetup-energy-meter-helper-panel",
  ) as CircuitSetupPanel;
  panel.panel = { config: { entry_id: "entry-1" } };
  panel.hass = hass;
  document.body.append(panel);
  await tick();
  await panel.updateComplete;
  return panel;
};

const text = (panel: CircuitSetupPanel) => panel.shadowRoot?.textContent ?? "";

const contrastRatio = (first: string, second: string): number => {
  const luminance = (color: string) => {
    const channels = color.slice(1).match(/../g)!.map((value) => Number.parseInt(value, 16) / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
  };
  const values = [luminance(first), luminance(second)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
};

afterEach(() => document.body.replaceChildren());

describe("CircuitSetup panel", () => {
  it("renders exact product identity, semantic eleven-step navigation, and setup controls", async () => {
    const panel = await mount(
      makeHass({ setup_status: { state: "no_device", devices: [] } }),
    );

    expect(text(panel)).toContain("CircuitSetup Energy Meter Helper");
    expect(panel.shadowRoot?.querySelectorAll("nav ol li")).toHaveLength(11);
    expect(Array.from(panel.shadowRoot?.querySelectorAll("nav ol li") ?? []).map((item) => item.textContent?.trim()))
      .toContain("7Offset");
    expect(panel.shadowRoot?.querySelector(".mobile-progress")?.textContent).toContain("of 11");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
    expect(panel.shadowRoot?.querySelectorAll('[name="addon-count"]')).toHaveLength(7);
    expect(panel.shadowRoot?.querySelectorAll('[name="connection-type"]')).toHaveLength(3);
    expect(text(panel)).toContain("Open CircuitSetup Web Installer");
    expect(text(panel)).toContain("helper continues only after");
    expect(text(panel)).toContain("USB data cable");
    expect(panel.shadowRoot?.querySelector("details")).toBeNull();
    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="addon-count"][value="6"]')?.click();
    await panel.updateComplete;
    expect(text(panel)).toContain("Add-on 6");
    expect(text(panel)).toContain("(15, 26)");
  });

  it("routes accepted safety acknowledgement to the Offset step", async () => {
    const ready = { session_id: "session", device_id: "meter-1", state: "ready",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "unavailable", repair_reason: null }, offset_disposition: "not_started",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "not_started" }, { stage: 2, state: "not_started" }] }],
      has_pending_calibration: false };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] },
      acknowledge_safety: ready }));
    const state = panel as unknown as Record<string, unknown> & { acknowledgeSafety(): Promise<void> };
    state.session = { ...ready, state: "safety_required", safety_acknowledged: false };

    await state.acknowledgeSafety();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Offset");
  });

  it("renders ordered offset preparation, gates Stage 2, and bounds seven-board tabs", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.topology = { addon_count: 6, board_count: 7, ct_count: 42, group_count: 14,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 6, detail: "Runtime identity" }] };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "available", repair_reason: null }, offset_disposition: "not_started",
      offset_boards: Array.from({ length: 7 }, (_, board_index) => ({ board_index, stages: [
        { stage: 1, state: "not_started" }, { stage: 2, state: "not_started" },
      ] })), has_pending_calibration: false };

    panel.showState("offset" as never);
    await panel.updateComplete;

    const copy = text(panel);
    expect(copy.indexOf("open-circuit current-output CT")).toBeLessThan(copy.indexOf("unplug the voltage transformer"));
    expect(copy).toContain("de-energize all conductors");
    expect(copy).toContain("power the meter from USB only");
    expect(copy).toContain("Measurements cannot prove");
    expect(panel.shadowRoot?.querySelectorAll("[data-offset-board]")).toHaveLength(7);
    expect(panel.shadowRoot?.querySelector("[data-offset-stage='1']")?.getAttribute("aria-current")).toBe("step");
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-offset-stage='2']")?.disabled).toBe(true);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='calibrate-offset']")?.disabled).toBe(true);
  });

  it("shows invalid offset capability as repair-aware skip-only", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name, evidence: [] };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "invalid", repair_reason: "duplicate run control" }, offset_disposition: "not_started",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "not_started" }, { stage: 2, state: "not_started" }] }],
      has_pending_calibration: false };

    panel.showState("offset" as never);
    await panel.updateComplete;

    expect(text(panel)).toContain("duplicate run control");
    expect(panel.shadowRoot?.querySelector("[data-action='check-offset']")).toBeNull();
    expect(panel.shadowRoot?.querySelector("[data-action='calibrate-offset']")).toBeNull();
    expect(panel.shadowRoot?.querySelector("[data-action='skip-offset']")).not.toBeNull();
  });

  it("runs measured readiness and requires confirmation before retrying an unfinished chip", async () => {
    const messages: Record<string, unknown>[] = [];
    let runs = 0;
    const readiness = { stage: 1, ready: true, connection_generation: 4,
      entities: ["voltage", "current"].flatMap((quantity) => Array.from({ length: 6 }, (_, index) => ({
        role: `${quantity}_${index + 1}`, quantity, ready: true, reasons: [],
        window: { values: [0, 0, 0], received_at: [1, 2, 3], connection_generation: 4,
          mean: 0, minimum: 0, maximum: 0, absolute_peak: 0, absolute_spread: 0 },
      }))), reasons: [], thresholds: { sample_count: 3, zero_voltage_peak_volts: 1,
        zero_voltage_spread_volts: 0.5, zero_current_peak_amps: 0.25, zero_current_spread_amps: 0.1,
        voltage_present_minimum_volts: 90, voltage_present_spread_volts: 2 } };
    const panel = await mount({
      callWS: async <T>(message: Record<string, unknown>) => {
        messages.push(message);
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "check_offset_readiness") return readiness as T;
        if (operation === "calibrate_offset") {
          runs += 1;
          return (runs === 1 ? { state: "partial", board_index: 0, stage: 1,
            expected_tables: [["meter_main1", [[1, -1], [2, -2], [3, -3]]]],
            unfinished_group_keys: ["meter_main2"], retry_allowed: true, error: "second chip failed" }
            : { state: "applied_pending_restart_verification", board_index: 0, stage: 1,
              expected_tables: [["meter_main1", [[1, -1], [2, -2], [3, -3]]], ["meter_main2", [[4, -4], [5, -5], [6, -6]]]],
              unfinished_group_keys: [], retry_allowed: false, error: null }) as T;
        }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    });
    const state = panel as unknown as Record<string, unknown>;
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name, evidence: [] };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "available", repair_reason: null }, offset_disposition: "not_started",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "not_started" }, { stage: 2, state: "not_started" }] }],
      has_pending_calibration: false };
    panel.showState("offset" as never);
    await panel.updateComplete;

    panel.shadowRoot?.querySelector<HTMLInputElement>("#offset-board-panel > label.check-row input")?.click();
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='check-offset']")?.click();
    await tick(); await panel.updateComplete;
    expect(text(panel)).toContain("Measured readiness passed");
    expect(text(panel)).toContain("Zero current peak0.25 A");

    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='calibrate-offset']")?.click();
    await tick(); await panel.updateComplete;
    expect(text(panel)).toContain("One chip finished; recovery is required");
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='calibrate-offset']")?.disabled).toBe(true);
    panel.shadowRoot?.querySelector<HTMLInputElement>(".recovery-panel input")?.click();
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='calibrate-offset']")?.click();
    await tick(); await panel.updateComplete;

    expect(messages.filter((message) => String(message.type).endsWith("/calibrate_offset"))
      .map((message) => ({ board_index: message.board_index, stage: message.stage, confirm_retry: message.confirm_retry })))
      .toEqual([{ board_index: 0, stage: 1, confirm_retry: false }, { board_index: 0, stage: 1, confirm_retry: true }]);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-offset-stage='2']")?.disabled).toBe(false);
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-offset-stage='2']")?.click();
    await panel.updateComplete;
    expect(text(panel)).toContain("Power down before rewiring, keep CT inputs unplugged and CTs off current-carrying conductors");
    expect(text(panel)).toContain("connect/enclose/energize only the voltage reference");
    expect(text(panel)).toContain("voltage is present on both chips and every current phase is near zero");
  });

  it("restores a server-skipped Offset step with only Back and Continue enabled", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "unavailable", repair_reason: null }, offset_disposition: "skipped",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "skipped" }, { stage: 2, state: "skipped" }] }],
      has_pending_calibration: false };
    panel.showState("offset" as never);
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='skip-offset']")?.disabled).toBe(true);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".offset-footer .primary")?.disabled).toBe(false);
  });

  it("restores partial recovery and enables Continue after the server finalizes a partial skip", async () => {
    const partial = { session_id: "session", device_id: "meter-1", state: "partial", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "available", repair_reason: null }, offset_disposition: "partial",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "partial" }, { stage: 2, state: "not_started" }] }],
      has_pending_calibration: true };
    const skipped = { ...partial, state: "applied_pending_restart_verification",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "partial" }, { stage: 2, state: "skipped" }] }] };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] },
      skip_offset_calibration: skipped }));
    const state = panel as unknown as Record<string, unknown>;
    state.session = partial;
    panel.showState("offset" as never);
    await panel.updateComplete;

    expect(text(panel)).toContain("Recovery is required");
    expect(text(panel)).toContain("Reconnect and inspect");
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='skip-offset']")?.click();
    await tick(); await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".offset-footer .primary")?.disabled).toBe(false);
  });

  it("finishes unchanged calibration without restart and routes to Summary", async () => {
    const calls: string[] = [];
    const completed = { session_id: "session", device_id: "meter-1", state: "verified", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "unavailable", repair_reason: null }, offset_disposition: "skipped",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "skipped" }, { stage: 2, state: "skipped" }] }],
      has_pending_calibration: false };
    const panel = await mount({
      callWS: async <T>(message: Record<string, unknown>) => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        calls.push(operation);
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "complete_calibration_without_changes") return completed as T;
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    });
    const state = panel as unknown as Record<string, unknown>;
    state.session = { ...completed, state: "ready" };
    panel.showState("current");
    await panel.updateComplete;

    panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.click();
    await tick();
    await panel.updateComplete;

    expect(calls).toContain("complete_calibration_without_changes");
    expect(calls).not.toContain("restart_and_verify");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Summary");
    expect(text(panel)).toContain("Completed without calibration changes");
  });

  it("routes pending calibration to Restart without calling no-change completion", async () => {
    const calls: string[] = [];
    const panel = await mount({
      callWS: async <T>(message: Record<string, unknown>) => {
        calls.push(String(message.type).split("/").at(-1) ?? "");
        return { state: "device_discovered", devices: [device] } as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    });
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "applied_pending_restart_verification",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] }, has_pending_calibration: true };
    panel.showState("current");
    await panel.updateComplete;

    panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.click();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Restart");
    expect(calls).not.toContain("complete_calibration_without_changes");
  });

  it("does not infer no-change completion from an unowned verified subscription", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "verified", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] } };
    panel.showState("summary");
    await panel.updateComplete;

    expect(text(panel)).not.toContain("Completed without calibration changes");
    expect(text(panel)).toContain("Restart verification is not complete");
  });

  it("rescans live setup state and advances to discovery without claiming USB completion", async () => {
    const hass = makeHass({
      setup_status: { state: "no_device", devices: [] },
      set_installer_intent: { state: "installer_guide", devices: [] },
      rescan: { state: "device_discovered", devices: [device] },
    });
    const panel = await mount(hass);
    const button = panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]");
    button?.click();
    await tick();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Discover");
    expect(text(panel)).toContain("Basement meter");
    expect(text(panel)).toContain("2026.8.0");
    expect(text(panel)).not.toContain("USB flash complete");
  });

  it("blocks topology mismatch and announces a focused live error", async () => {
    const panel = await mount(
      makeHass({ setup_status: { state: "device_discovered", devices: [device] } }),
    );
    panel.showTopology({
      addon_count: 1,
      board_count: 2,
      ct_count: 11,
      group_count: 4,
      connection_type: "wifi",
      voltage_layout: "single",
      project_name: device.project_name,
      evidence: [
        { source: "config_project", addon_count: 1, detail: "project" },
        { source: "native_entity_counts", addon_count: 0, detail: "entities" },
      ],
    });
    await panel.updateComplete;

    const alert = panel.shadowRoot?.querySelector<HTMLElement>("[role=alert]");
    expect(alert?.textContent).toContain("Topology mismatch");
    expect(panel.shadowRoot?.querySelector("[data-action=continue]")).toBeNull();
    expect(panel.shadowRoot?.activeElement).toBe(alert);
  });

  it("blocks Continue when topology evidence is empty or non-authoritative", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    for (const evidence of [[], [{ source: "dashboard_import", addon_count: 0, detail: "Import hint" }]]) {
      panel.showTopology({ addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
        connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
        evidence: evidence as never });
      await panel.updateComplete;
      expect(panel.shadowRoot?.querySelector("[data-action=continue]")).toBeNull();
      expect(panel.shadowRoot?.querySelector("[role=alert]")).not.toBeNull();
    }
  });

  it("starts runtime-only calibration directly from authoritative native topology", async () => {
    const operations: string[] = [];
    const setup = { state: "device_discovered", devices: [device], configuration_authoritative: false };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        operations.push(operation);
        if (operation === "setup_status") return setup as T;
        if (operation === "start_session") return { session_id: "native-session", device_id: "meter-1",
          state: "safety_required", safety_acknowledged: false, preflight: { issues: [], zeroed_roles: [] } } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    panel.showTopology({ addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime project metadata" }] });
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=continue]")?.click();
    await tick(); await panel.updateComplete;
    expect(operations).toContain("start_session");
    expect(operations).not.toContain("get_ct_inventory");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Safety");
  });

  it("starts only one calibration session when Continue is clicked repeatedly", async () => {
    let starts = 0;
    let resolveStart!: (value: unknown) => void;
    const start = new Promise<unknown>((resolve) => { resolveStart = resolve; });
    const setup = { state: "device_discovered", devices: [device], configuration_authoritative: false };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return setup as T;
        if (operation === "start_session") { starts += 1; return await start as T; }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    panel.showTopology({ addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime project metadata" }] });
    await panel.updateComplete;
    const continueButton = panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=continue]");
    continueButton?.click();
    continueButton?.click();
    await tick();

    expect(starts).toBe(1);

    resolveStart({ session_id: "native-session", device_id: "meter-1", state: "safety_required",
      safety_acknowledged: false, preflight: { issues: [], zeroed_roles: [] } });
    await tick(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Safety");
  });

  it("requires an explicit bounded multiplier for runtime-only current calibration", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    state.inventory = null;
    state.currentReferences = new Map([[1, 5]]);
    state.stabilityByTarget = new Map([["current:1", { target: "current", target_id: "1", stable: true,
      windows: [{ samples: [5, 5, 5], mean: 5, standard_deviation: 0, range_percent: 0 }] }]]);
    panel.showState("current"); await panel.updateComplete;
    const input = panel.shadowRoot?.querySelector<HTMLInputElement>("[data-role=reporting-multiplier]");
    const calibrate = Array.from(panel.shadowRoot?.querySelectorAll<HTMLButtonElement>("button.primary") ?? [])
      .find((button) => button.textContent?.includes("Calibrate current"));
    expect(input).not.toBeNull();
    expect(calibrate?.disabled).toBe(true);
    input!.value = "2";
    input!.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await panel.updateComplete;
    const enabled = Array.from(panel.shadowRoot?.querySelectorAll<HTMLButtonElement>("button.primary") ?? [])
      .find((button) => button.textContent?.includes("Calibrate current"));
    expect(enabled?.disabled).toBe(false);
  });

  it("bounds the DOM for 42 CTs while preserving board and three-channel navigation", async () => {
    const panel = await mount(
      makeHass({ setup_status: { state: "device_discovered", devices: [device] } }),
    );
    panel.showInventory({
      plan_id: "plan-1",
      source_sha256: "a".repeat(64),
      channels: Array.from({ length: 42 }, (_, index) => ({
        channel: index + 1,
        name: `CT${index + 1}`,
        raw_gain_ct: index === 3 ? 27518 : 5500,
        reporting_multiplier: 1,
        selected_model_id: index === 3 ? null : "cs-ct-200a",
        selection_verified_against_config: false,
        address: {
          channel: index + 1,
          board_index: Math.floor(index / 6),
          group_index: Math.floor((index % 6) / 3) + 1,
          phase: (["A", "B", "C"] as const)[index % 3]!,
        },
      })),
      catalog: {
        presets: [
          {
            model_id: "cs-ct-200a",
            label: "CS-CT-200A-333mV",
            rated_current_a: 200,
            secondary: "333 mV @ 200 A",
            default_gain_ct: 5500,
            requires_burden_jumper_cut: false,
            notes: "Use burden at least 1 VA.",
          },
        ],
        source_repository: "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter",
        source_ref: "approved",
        schema_version: 1,
      },
    });
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelectorAll("[data-board-tab]")).toHaveLength(7);
    const tabs = panel.shadowRoot?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(tabs?.[0]?.getAttribute("aria-controls")).toBe("board-panel");
    expect(tabs?.[0]?.getAttribute("tabindex")).toBe("0");
    expect(tabs?.[1]?.getAttribute("tabindex")).toBe("-1");
    expect(panel.shadowRoot?.querySelector('[role="tabpanel"]')?.getAttribute("aria-labelledby")).toBe("board-tab-0");
    expect(panel.shadowRoot?.querySelectorAll("[data-ct-row]").length).toBeLessThanOrEqual(8);
    expect(panel.shadowRoot?.querySelectorAll("[data-group-nav]")).toHaveLength(2);
    expect(text(panel)).toContain("Choose model");
    expect(panel.shadowRoot?.querySelector<HTMLSelectElement>('select[aria-label="CT2 model"]')?.value).toBe("cs-ct-200a");

    tabs?.[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await panel.updateComplete;
    expect(tabs?.[1]?.getAttribute("aria-selected")).toBe("true");
    expect(panel.shadowRoot?.activeElement).toBe(tabs?.[1]);

    panel.shadowRoot?.querySelector<HTMLButtonElement>('[data-board-tab="6"]')?.click();
    await panel.updateComplete;
    panel.shadowRoot?.querySelectorAll<HTMLButtonElement>("[data-group-nav]")[1]?.click();
    await panel.updateComplete;
    await tick();
    expect(panel.shadowRoot?.querySelectorAll("[data-ct-row]")).toHaveLength(6);
    expect(panel.shadowRoot?.querySelector('[data-group-nav][aria-current="true"]')?.textContent).toContain("CT40");
    expect((panel.shadowRoot?.activeElement as HTMLInputElement | null)?.ariaLabel).toBe("CT40 name");
  });

  it("reloads a stale CT preview while preserving the reviewed draft", async () => {
    const stale = Object.assign(new Error("expired"), { code: "stale_confirmation" });
    const fresh = {
      plan_id: "fresh-plan",
      source_sha256: "b".repeat(64),
      channels: Array.from({ length: 6 }, (_, index) => ({
        channel: index + 1,
        name: `CT${index + 1}`,
        raw_gain_ct: 27518,
        reporting_multiplier: 1,
        selected_model_id: null,
        selection_verified_against_config: false,
        address: { channel: index + 1, board_index: 0, group_index: index < 3 ? 1 : 2,
          phase: (["A", "B", "C"] as const)[index % 3] },
      })),
      catalog: {
        presets: [{
          model_id: "cs-ct-200a", label: "CS-CT-200A-333mV", rated_current_a: 200,
          secondary: "333 mV @ 200 A", default_gain_ct: 5500,
          requires_burden_jumper_cut: false, notes: "Use burden at least 1 VA.",
        }],
        source_repository: "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter",
        source_ref: "approved", schema_version: 1,
      },
    };
    const hass = makeHass({
      setup_status: { state: "device_discovered", devices: [device] },
      preview_ct_config: stale,
      get_ct_inventory: fresh,
    });
    const panel = await mount(hass);
    panel.showInventory({
      plan_id: "expired-plan",
      source_sha256: "a".repeat(64),
      channels: [{
        channel: 1,
        name: "CT1",
        raw_gain_ct: 27518,
        reporting_multiplier: 1,
        selected_model_id: null,
        selection_verified_against_config: false,
        address: { channel: 1, board_index: 0, group_index: 1, phase: "A" },
      }],
      catalog: {
        presets: [{
          model_id: "cs-ct-200a",
          label: "CS-CT-200A-333mV",
          rated_current_a: 200,
          secondary: "333 mV @ 200 A",
          default_gain_ct: 5500,
          requires_burden_jumper_cut: false,
          notes: "Use burden at least 1 VA.",
        }],
        source_repository: "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter",
        source_ref: "approved",
        schema_version: 1,
      },
    });
    await panel.updateComplete;
    const model = panel.shadowRoot?.querySelector<HTMLSelectElement>('select[aria-label="CT1 model"]');
    if (model) {
      model.value = "cs-ct-200a";
      model.dispatchEvent(new Event("change"));
    }
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.click();
    await tick();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("[role=alert]")).toBeNull();
    expect(text(panel)).toContain("CT Configuration");
    expect(text(panel)).toContain("Live CT data reloaded");
    expect(panel.shadowRoot?.querySelector<HTMLSelectElement>('select[aria-label="CT1 model"]')?.value)
      .toBe("cs-ct-200a");
  });

  it("calibrates both chips on only the selected voltage board", async () => {
    const targets: string[] = [];
    const calibrated: string[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "check_stability") {
          const targetId = String(message.target_id);
          targets.push(targetId);
          return { target: "voltage", target_id: targetId, stable: true,
            windows: Array.from({ length: 3 }, () => ({ samples: [120], mean: 120,
              standard_deviation: 0, range_percent: 0 })) } as T;
        }
        if (operation === "calibrate_voltage") {
          const groupKey = String(message.group_key);
          calibrated.push(groupKey);
          const firstChannel = (calibrated.length - 1) * 3 + 1;
          return { state: "indeterminate", group_key: groupKey, phase: null,
            changed_channels: [firstChannel, firstChannel + 1, firstChannel + 2], iteration: 1,
            before_values: [120, 120, 120], after_values: [], error_percent_values: [], gain_evidence: null,
            restore_evidence: null, retry_allowed: false } as T;
        }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      voltageGroupKeys(): string[];
    };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] },
      calibration_sources: { meter_main1: "flash", meter_main2: "configuration" } };
    state.voltageReferences = [120, 121];
    state.topology = { addon_count: 1, board_count: 2, ct_count: 12, group_count: 4,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 1, detail: "Runtime identity" }] };
    panel.showState("voltage");
    await panel.updateComplete;

    expect(state.voltageGroupKeys()).toEqual(["main_1", "main_2"]);
    expect(panel.shadowRoot?.querySelectorAll('[data-voltage-board]')).toHaveLength(2);
    const progress = panel.shadowRoot?.querySelector(".progress-steps");
    const reference = panel.shadowRoot?.querySelector(".reference-block input");
    expect(Boolean(progress && reference
      && (progress.compareDocumentPosition(reference) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    expect(reference?.closest(".reference-block")?.querySelector("button.primary")).not.toBeNull();
    const check = panel.shadowRoot?.querySelector<HTMLButtonElement>(".calibration-step button.secondary");
    expect(check?.parentElement?.classList.contains("stability-line")).toBe(true);
    check?.click();
    check?.click();
    await tick(); await panel.updateComplete;
    expect(targets).toEqual(["main_1", "main_2"]);
    expect(text(panel)).toContain("Live data loaded");
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".calibration-step button.primary")?.click();
    await expect.poll(() => calibrated).toEqual(["main_1", "main_2"]);
    await panel.updateComplete;

    state.board = 1;
    state.topology = { ...(state.topology as object), voltage_layout: "two_voltages" };
    panel.requestUpdate();
    await panel.updateComplete;
    expect(state.voltageGroupKeys()).toEqual(["addon1_1", "addon1_2"]);
    expect(panel.shadowRoot?.querySelectorAll(".reference-block input")).toHaveLength(2);
    expect(text(panel)).toContain("Saved in flash");
    expect(text(panel)).toContain("Configuration");
  });

  it("shows one three-CT group and skips blank current references", async () => {
    const sent: Array<Record<string, unknown>> = [];
    const panel = await mount({
      callWS: async <T>(message: Record<string, unknown>) => { sent.push(message); return {} as T; },
      connection: { subscribeMessage: async () => () => undefined },
    });
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "ready",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] }, calibration_sources: {} };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name, evidence: [] };
    state.inventory = { channels: Array.from({ length: 6 }, (_, index) => ({ channel: index + 1,
      reporting_multiplier: 1 })) };
    state.currentReferences = new Map([[1, 5], [3, 7]]);
    const live = (targetId: string) => ({ target: "current", target_id: targetId, stable: true,
      windows: [{ samples: [5], mean: 5, standard_deviation: 0, range_percent: 0 }] });
    state.stabilityByTarget = new Map([["current:1", live("1")], ["current:3", live("3")]]);
    panel.showState("current");
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelectorAll('[data-current-reference]')).toHaveLength(3);
    expect(text(panel)).toContain("CT1");
    expect(text(panel)).toContain("CT3");
    expect(text(panel)).not.toContain("CT4 reference");
    panel.shadowRoot?.querySelector<HTMLButtonElement>("button.primary")?.click();
    await tick();
    expect(sent.find((message) => String(message.type).endsWith("calibrate_current"))?.references)
      .toEqual([{ channel: 1, reference: 5, reporting_multiplier: 1 },
        { channel: 3, reference: 7, reporting_multiplier: 1 }]);
  });

  it("renders review, safety, voltage, current, restart, summary, recovery, and technical states", async () => {
    const panel = await mount(
      makeHass({ setup_status: { state: "device_discovered", devices: [device] } }),
    );
    for (const [step, required] of [
      ["build", ["Build & Install", "Apply", "Install", "rename/entity-key"]],
      ["safety", ["Safety", "acknowledge", "Cancel session"]],
      ["voltage", ["Voltage", "reference", "check stability"]],
      ["current", ["Current", "calibration"]],
      ["restart", ["Restart", "restart verification"]],
      ["summary", ["Summary", "authority source", "Technical details"]],
    ] as const) {
      panel.showState(step);
      await panel.updateComplete;
      for (const copy of required) expect(text(panel).toLowerCase()).toContain(copy.toLowerCase());
    }
    panel.showRecovery("calibration_outcome_indeterminate");
    await panel.updateComplete;
    expect(text(panel)).toContain("Reconnect and inspect");
    panel.showRecovery("restart_failed");
    await panel.updateComplete;
    expect(text(panel).toLowerCase()).toContain("rollback");
    expect(panel.shadowRoot?.querySelector("details")).not.toBeNull();
  });

  it("exposes mobile and reduced-motion contracts without horizontal page scrolling", async () => {
    const panel = await mount(
      makeHass({ setup_status: { state: "no_device", devices: [] } }),
    );
    const style = panel.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(style).toContain("prefers-reduced-motion: reduce");
    expect(style).toContain("min-height: 44px");
    expect(style).toContain("overflow-x: hidden");
    expect(style).toContain("@media (max-width: 720px)");
  });

  it("keeps every core text and focus pairing at the plan's 4.5:1 contrast", () => {
    const cssText = panelStyles.cssText;
    const token = (name: string) => new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i").exec(cssText)?.[1] ?? "";
    expect(cssText).toContain(".primary { color: #fff; background: var(--orange)");
    expect(cssText).toContain(".brand { color: var(--orange-on-navy)");
    expect(cssText).toContain("li.current .step-button { color: var(--orange-on-navy)");
    expect(cssText).toContain("li.current .number { color: #fff; background: var(--orange)");
    expect(cssText).toContain(".summary-band strong, .success-band { color: var(--teal)");
    expect(cssText).toContain(".rescan { color: #fff; background: var(--teal)");
    expect(cssText).toContain("summary:focus-visible { outline: 3px solid var(--focus)");
    expect(cssText).toContain(".step-button:focus-visible { outline-color: var(--focus-on-navy)");
    const pairs: Array<[string, string]> = [
      ["#ffffff", token("--orange")],
      [token("--orange"), "#ffffff"],
      [token("--orange-on-navy"), token("--navy")],
      [token("--teal"), token("--band")],
      [token("--teal"), "#ffffff"],
      ["#ffffff", token("--teal")],
      [token("--focus"), "#ffffff"],
      [token("--focus"), token("--band")],
      [token("--focus-on-navy"), token("--navy")],
    ];
    for (const [foreground, background] of pairs)
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("requires exact Custom CT fields and burden acknowledgement before review", async () => {
    const inventory: CtInventory = {
      plan_id: "plan-1", source_sha256: "a".repeat(64),
      channels: [{ channel: 1, name: "CT1", raw_gain_ct: 5500, reporting_multiplier: 1,
        selected_model_id: "preset-burden", selection_verified_against_config: true,
        address: { channel: 1, board_index: 0, group_index: 1, phase: "A" } }],
      catalog: { presets: [{ model_id: "preset-burden", label: "Burden model", rated_current_a: 100,
        secondary: "50 mA", default_gain_ct: 5500, requires_burden_jumper_cut: true, notes: "Cut jumper" }],
        source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
    };
    const custom = new Map<number, CtDraft>([[1, { name: "Workshop", modelId: "custom", multiplier: 2,
      customGainCt: 32000, customLabel: "Clamp", burdenAcknowledged: true, expanded: true }]]);
    expect(changesFromDrafts(inventory, custom)).toEqual([{ channel: 1, name: "Workshop", model_id: "custom",
      reporting_multiplier: 2, custom_gain_ct: 32000, custom_label: "Clamp", burden_output_acknowledged: true }]);
    custom.set(1, { ...custom.get(1)!, modelId: "preset-burden", burdenAcknowledged: false });
    expect(changesFromDrafts(inventory, custom)).toEqual([{ channel: 1, name: "Workshop", model_id: "preset-burden",
      reporting_multiplier: 2, burden_output_acknowledged: false }]);
    custom.set(1, { ...custom.get(1)!, burdenAcknowledged: true });
    expect(changesFromDrafts(inventory, custom)[0]?.burden_output_acknowledged).toBe(true);

    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    panel.showInventory(inventory);
    await panel.updateComplete;
    const model = panel.shadowRoot?.querySelector<HTMLSelectElement>('[aria-label="CT1 model"]');
    if (model) { model.value = "custom"; model.dispatchEvent(new Event("change")); }
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector('[aria-label="CT1 custom gain"]')).not.toBeNull();
    expect(panel.shadowRoot?.querySelector('[aria-label="CT1 custom label"]')).not.toBeNull();
    expect(panel.shadowRoot?.querySelector('[aria-label="CT1 burden output acknowledgement"]')).not.toBeNull();
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.disabled).toBe(true);
    const gain = panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 custom gain"]');
    const label = panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 custom label"]');
    const burden = panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 burden output acknowledgement"]');
    if (gain) { gain.value = "32000"; gain.dispatchEvent(new Event("input")); }
    if (label) { label.value = "Clamp"; label.dispatchEvent(new Event("input")); }
    burden?.click(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.disabled).toBe(false);
  });

  it("keeps a persisted verified Custom selection clean during an unrelated edit", async () => {
    const inventory: CtInventory = {
      plan_id: "plan-1", source_sha256: "a".repeat(64),
      channels: Array.from({ length: 6 }, (_, index) => ({
        channel: index + 1, name: `CT${index + 1}`, raw_gain_ct: index === 0 ? 32000 : 5500,
        reporting_multiplier: 1, selected_model_id: index === 0 ? "custom" : "model",
        selection_verified_against_config: true, display_label: index === 0 ? "Existing clamp" : null,
        address: { channel: index + 1, board_index: 0, group_index: Math.floor(index / 3) + 1,
          phase: (["A", "B", "C"] as const)[index % 3]! },
      })),
      catalog: { presets: [{ model_id: "model", label: "Model", rated_current_a: 100,
        secondary: "50 mA", default_gain_ct: 5500, requires_burden_jumper_cut: false, notes: "Approved" }],
        source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
    };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    panel.showInventory(inventory);
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 custom gain"]')?.value).toBe("32000");
    expect(panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 custom label"]')?.value).toBe("Existing clamp");
    expect(panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 burden output acknowledgement"]')?.checked).toBe(true);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.disabled).toBe(true);

    const name = panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT2 name"]');
    if (name) { name.value = "Unrelated rename"; name.dispatchEvent(new Event("input")); }
    await panel.updateComplete;
    const state = panel as unknown as { drafts: Map<number, CtDraft> };
    expect(changesFromDrafts(inventory, state.drafts)).toEqual([{
      channel: 2, name: "Unrelated rename", model_id: "model", reporting_multiplier: 1,
    }]);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.disabled).toBe(false);
  });

  it("keeps label-only edits out of every firmware control and preview route", async () => {
    const messages: Record<string, unknown>[] = [];
    const hass = makeHass({ setup_status: { state: "device_discovered", devices: [device] },
      set_ha_labels: { mode: "home_assistant_labels", results: [{ channel: 1, state: "updated" }] } });
    const callWS = hass.callWS;
    hass.callWS = async <T>(message: Record<string, unknown>) => {
      messages.push(message);
      return callWS<T>(message);
    };
    const inventory: CtInventory = {
      plan_id: "plan-1", source_sha256: "a".repeat(64),
      channels: [{ channel: 1, name: "CT1", raw_gain_ct: 32000, reporting_multiplier: 2,
        selected_model_id: "custom", selection_verified_against_config: true, display_label: "Existing clamp",
        address: { channel: 1, board_index: 0, group_index: 1, phase: "A" } }],
      catalog: { presets: [], source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
    };
    const panel = await mount(hass);
    panel.showInventory(inventory);
    await panel.updateComplete;
    panel.shadowRoot?.querySelectorAll<HTMLInputElement>('[name="name-mode"]')[1]?.click();
    await panel.updateComplete;

    for (const selector of ['[aria-label="CT1 model"]', '[aria-label="CT1 multiplier"]',
      '[aria-label="CT1 custom gain"]', '[aria-label="CT1 custom label"]',
      '[aria-label="CT1 burden output acknowledgement"]']) {
      expect(panel.shadowRoot?.querySelector<HTMLInputElement>(selector)?.disabled).toBe(true);
    }
    const name = panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 name"]');
    if (name) { name.value = "Kitchen mains"; name.dispatchEvent(new Event("input")); }
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.click();
    await tick();

    expect(messages.map((message) => String(message.type).split("/").at(-1))).toContain("set_ha_labels");
    expect(messages.map((message) => String(message.type).split("/").at(-1))).not.toContain("preview_ct_config");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("CT Configuration");
  });

  it("owns late subscriptions by connection generation and resubscribes live handles", async () => {
    let resolveFirst: ((unsubscribe: () => void) => void) | undefined;
    let unsubscribed = 0;
    let subscriptions = 0;
    const hass: HomeAssistant = {
      callWS: async <T>() => ({ state: "no_device", devices: [] } as T),
      connection: { subscribeMessage: async () => {
        subscriptions += 1;
        if (subscriptions === 1) return await new Promise<() => void>((resolve) => { resolveFirst = resolve; });
        return () => { unsubscribed += 1; };
      } },
    };
    const panel = document.createElement("circuitsetup-energy-meter-helper-panel") as CircuitSetupPanel;
    panel.panel = { config: { entry_id: "entry-1" } }; panel.hass = hass; document.body.append(panel);
    await tick(); panel.remove(); resolveFirst?.(() => { unsubscribed += 1; }); await tick();
    document.body.append(panel); await tick(); await panel.updateComplete;
    expect(subscriptions).toBe(2);
    expect(unsubscribed).toBe(1);
    panel.remove();
    expect(unsubscribed).toBe(2);
  });

  it("reattaches setup, transaction, and session subscriptions for retained live handles", async () => {
    const operations: string[] = [];
    const hass = makeHass({ setup_status: { state: "device_discovered", devices: [device] } });
    hass.connection.subscribeMessage = async (_callback, message) => {
      operations.push(String(message.type).split("/").at(-1) ?? "");
      return () => undefined;
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown>;
    state.selectedDeviceId = "meter-1";
    state.transaction = { transaction_id: "tx", state: "previewed", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [] };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] } };
    panel.remove(); document.body.append(panel); await tick(); await panel.updateComplete;
    expect(operations).toEqual(["subscribe_setup", "subscribe_setup", "subscribe_config_transaction", "subscribe_session"]);
  });

  it("revokes replaced transaction and session subscriptions and ignores captured old callbacks", async () => {
    const callbacks: Array<(message: unknown) => void> = [];
    const unsubscriptions: number[] = [];
    const hass = makeHass({ setup_status: { state: "device_discovered", devices: [device] } });
    hass.connection.subscribeMessage = async (callback, message) => {
      callbacks.push(callback as (message: unknown) => void);
      const index = callbacks.length - 1;
      return () => { unsubscriptions.push(index); };
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      subscribeTransaction(generation: number): Promise<void>;
      subscribeSession(generation: number): Promise<void>;
    };
    const generation = state.connectionGeneration as number;
    state.selectedDeviceId = "meter-1";
    state.transaction = { transaction_id: "tx-old", state: "previewed", source_sha256: "a".repeat(64),
      changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [] };
    await state.subscribeTransaction(generation);
    state.transaction = { transaction_id: "tx-new", state: "previewed", source_sha256: "b".repeat(64),
      changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [] };
    await state.subscribeTransaction(generation);
    callbacks[1]?.({ transaction_id: "tx-old", state: "failed", source_sha256: "a".repeat(64),
      changes: [], redacted_diff: "- old\n+ new", rollback_available: false, evidence: [], progress: [] });
    expect((state.transaction as { transaction_id: string }).transaction_id).toBe("tx-new");
    expect(unsubscriptions).toContain(1);

    state.session = { session_id: "session-old", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] } };
    await state.subscribeSession(generation);
    state.session = { session_id: "session-new", device_id: "meter-1", state: "ready", safety_acknowledged: false,
      preflight: { issues: [], zeroed_roles: [] } };
    await state.subscribeSession(generation);
    callbacks[3]?.({ session_id: "session-old", device_id: "meter-1", state: "cancelled", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] } });
    expect((state.session as { session_id: string }).session_id).toBe("session-new");
    expect(unsubscriptions).toContain(3);
  });

  it("requires fresh calibration safety and restart evidence for a replacement session or device", async () => {
    const freshSession = { session_id: "session-new", device_id: "meter-1", state: "safety_required",
      safety_acknowledged: false, preflight: { issues: [], zeroed_roles: [] } };
    const panel = await mount(makeHass({
      setup_status: { state: "device_discovered", devices: [device] },
      start_session: freshSession,
    }));
    const state = panel as unknown as Record<string, unknown> & {
      startSession(): Promise<void>;
      selectDevice(deviceId: string): void;
    };
    state.safetyAcknowledged = true;
    state.voltageReferences = [25, 0];
    state.currentReferences = new Map([[1, 5]]);
    state.stabilityByTarget = new Map([["current:1", { target: "current", target_id: "1", stable: true,
      windows: [{ samples: [1, 1, 1], mean: 1, standard_deviation: 0, range_percent: 0 }] }]]);
    state.calibrationByTarget = new Map([["current:1", { state: "applied_pending_restart_verification",
      group_key: "meter_main1", phase: null, changed_channels: [1], iteration: 1, before_values: [5500],
      after_values: [5501], error_percent_values: [0.1], retry_allowed: false }]]);
    state.restartResult = { verification_id: "stale" };
    await state.startSession();
    expect(state.safetyAcknowledged).toBe(false);
    expect(state.voltageReferences).toEqual([0, 0]);
    expect((state.currentReferences as Map<number, number>).size).toBe(0);
    expect((state.stabilityByTarget as Map<string, unknown>).size).toBe(0);
    expect((state.calibrationByTarget as Map<string, unknown>).size).toBe(0);
    expect(state.restartResult).toBeNull();

    state.safetyAcknowledged = true;
    state.voltageReferences = [120, 0];
    state.currentReferences = new Map([[1, 5]]);
    state.restartResult = { verification_id: "also-stale" };
    state.selectDevice("meter-2");
    expect(state.selectedDeviceId).toBe("meter-2");
    expect(state.session).toBeNull();
    expect(state.transaction).toBeNull();
    expect(state.safetyAcknowledged).toBe(false);
    expect(state.voltageReferences).toEqual([0, 0]);
    expect((state.currentReferences as Map<number, number>).size).toBe(0);
    expect(state.restartResult).toBeNull();
  });

  it("drops every pending device response when another meter is selected", async () => {
    const pending = new Map<string, (value: unknown) => void>();
    const subscribed: string[] = [];
    const meter2 = { ...device, entry_id: "meter-2", title: "Garage meter" };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>) => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "device_discovered", devices: [device, meter2] } as T;
        return await new Promise<T>((resolve) => pending.set(operation, resolve as (value: unknown) => void));
      },
      connection: { subscribeMessage: async (_callback, message) => {
        subscribed.push(String(message.type).split("/").at(-1) ?? "");
        return () => undefined;
      } },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      loadTopology(): Promise<void>;
      loadInventory(): Promise<void>;
      reviewChanges(): Promise<void>;
      startSession(): Promise<void>;
      selectDevice(deviceId: string): void;
    };
    const topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    const inventory: CtInventory = {
      plan_id: "plan-1", source_sha256: "a".repeat(64),
      channels: Array.from({ length: 6 }, (_, index) => ({ channel: index + 1, name: `CT${index + 1}`,
        raw_gain_ct: 5500, reporting_multiplier: 1, selected_model_id: "model", selection_verified_against_config: true,
        address: { channel: index + 1, board_index: 0, group_index: Math.floor(index / 3) + 1,
          phase: (["A", "B", "C"] as const)[index % 3]! } })),
      catalog: { presets: [{ model_id: "model", label: "Model", rated_current_a: 100, secondary: "50 mA",
        default_gain_ct: 5500, requires_burden_jumper_cut: false, notes: "Approved" }],
        source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
    };

    const topologyCall = state.loadTopology();
    state.selectDevice("meter-2");
    pending.get("get_topology")?.(topology);
    await topologyCall;
    expect(state.topology).toBeNull();

    state.selectDevice("meter-1");
    const inventoryCall = state.loadInventory();
    state.selectDevice("meter-2");
    pending.get("get_ct_inventory")?.(inventory);
    await inventoryCall;
    expect(state.inventory).toBeNull();

    state.selectDevice("meter-1");
    state.inventory = inventory;
    state.drafts = new Map([[1, { name: "Changed", modelId: "model", multiplier: 1,
      burdenAcknowledged: false, expanded: false }]]);
    const previewCall = state.reviewChanges();
    state.selectDevice("meter-2");
    pending.get("preview_ct_config")?.({ transaction_id: "tx-a", state: "previewed", source_sha256: "a".repeat(64),
      changes: [], redacted_diff: "- old\n+ new", rollback_available: false, evidence: [], progress: [] });
    await previewCall;
    expect(state.transaction).toBeNull();
    expect(subscribed).not.toContain("subscribe_config_transaction");

    state.selectDevice("meter-1");
    const sessionCall = state.startSession();
    state.selectDevice("meter-2");
    pending.get("start_session")?.({ session_id: "session-a", device_id: "meter-1", state: "safety_required",
      safety_acknowledged: false, preflight: { issues: [], zeroed_roles: [] } });
    await sessionCall;
    expect(state.session).toBeNull();
    expect(subscribed).not.toContain("subscribe_session");
  });

  it("never renders verified success for an impossible restart group collection", async () => {
    const invalidRestart = { mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: "a".repeat(64),
      topology_addon_count: 6, topology_project_name: device.project_name, topology_connection_type: "wifi",
      topology_voltage_layout: "two_groups", connection_generation: 4,
      groups: Array.from({ length: 15 }, (_, index) => ({ instance_id: `group-${index}`,
        phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]] })), verification_id: "invalid",
      source_authority: "saved_flash", source_handoff_available: true, source_handoff_transaction_id: null };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] },
      restart_and_verify: invalidRestart }));
    const state = panel as unknown as Record<string, unknown> & { restart(): Promise<void> };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] } };
    state.topology = { addon_count: 6, board_count: 7, ct_count: 42, group_count: 14,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 6, detail: "Runtime identity" }] };
    panel.showState("restart");
    await state.restart();
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Restart");
    expect(state.restartResult).toBeNull();
    expect(text(panel)).not.toContain("invalid");
  });

  it("enters recovery after a rejected restart and only offers an available rollback", async () => {
    let rollbackCalls = 0;
    const failedTransaction = { transaction_id: "tx", state: "failed", source_sha256: "a".repeat(64),
      changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [] };
    const rolledBack = { ...failedTransaction, state: "rolled_back", rollback_available: false };
    const hass = makeHass({ setup_status: { state: "device_discovered", devices: [device] },
      restart_and_verify: new Error("private backend detail"), rollback_ct_config: rolledBack });
    const callWS = hass.callWS;
    hass.callWS = async <T>(message: Record<string, unknown>) => {
      if (String(message.type).endsWith("/rollback_ct_config")) rollbackCalls += 1;
      return callWS<T>(message);
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & { restart(): Promise<void> };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] } };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    panel.showState("restart");
    await state.restart(); await panel.updateComplete;

    expect((state.session as { state: string }).state).toBe("restart_failed");
    expect(text(panel)).toContain("Reconnect to the meter");
    expect(text(panel)).not.toContain("private backend detail");
    expect(panel.shadowRoot?.querySelector("[data-action=rollback]")).toBeNull();

    state.transaction = failedTransaction; panel.requestUpdate(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("[data-action=rollback]")).toBeNull();

    state.transaction = { ...failedTransaction, rollback_available: true }; panel.requestUpdate(); await panel.updateComplete;
    const rollback = panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rollback]");
    expect(rollback?.disabled).toBe(false);
    rollback?.click(); await tick(); await panel.updateComplete;
    expect(rollbackCalls).toBe(1);
  });

  it("makes Back and mobile Steps navigation functional with deterministic heading focus", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    panel.showState("safety"); await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .secondary")?.click();
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Build & Install");
    expect(panel.shadowRoot?.activeElement).toBe(panel.shadowRoot?.querySelector("h1"));
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".mobile-progress button")?.click();
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("aside.workflow")?.classList.contains("mobile-open")).toBe(true);
    expect(panel.shadowRoot?.querySelector("style")?.textContent).toContain("focus-within");
  });

  it("renders scoped samples, calibration, build, and restart authority without fabricating Summary", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    panel.showState("summary"); await panel.updateComplete;
    expect(text(panel)).not.toContain("exact restart verification are complete");

    const state = panel as unknown as Record<string, unknown>;
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    state.transaction = { transaction_id: "tx", state: "installing", source_sha256: "a".repeat(64), changes: [],
      redacted_diff: "", rollback_available: true, evidence: ["write_verified"], progress: ["firmware_compiled"],
      validation_detail: { code: 0, reported_error_count: 0, reported_warning_count: 1, error_record_count: 0, warning_record_count: 1 },
      upload_progress: [{ stage: "uploading", progress: 65 }] };
    state.stabilityByTarget = new Map([["current:1", { target: "current", target_id: "1", stable: true,
      windows: [{ samples: [9.9, 10, 10.1], mean: 10, standard_deviation: 0.08, range_percent: 2 }] }]]);
    state.calibrationByTarget = new Map([["current:1", { state: "applied_pending_restart_verification", group_key: "meter_main1", phase: null,
      changed_channels: [1], iteration: 2, before_values: [5500], after_values: [5600], error_percent_values: [0.4],
      gain_evidence: { outcome: "success" }, restore_evidence: { reference: "zeroed" }, retry_allowed: true }]]);
    state.restartResult = { mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: "a".repeat(64),
      topology_addon_count: 0, topology_project_name: device.project_name, topology_connection_type: "wifi",
      topology_voltage_layout: "two_groups", connection_generation: 3, groups: [], verification_id: "verify-1",
      source_authority: "saved_flash", source_handoff_available: true, source_handoff_transaction_id: null };
    panel.showState("summary"); await panel.updateComplete;
    for (const expected of ["saved flash", "9.9", "Standard deviation", "5500", "5600", "0.4", "65%", "warning"])
      expect(text(panel).toLowerCase()).toContain(expected.toLowerCase());
  });

  it("keeps cancellation distinct and preserves the authoritative restart result", async () => {
    const restartResult = { mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: "a".repeat(64),
      topology_addon_count: 0, topology_project_name: device.project_name, topology_connection_type: "wifi",
      topology_voltage_layout: "two_groups", connection_generation: 4,
      groups: ["meter_main1", "meter_main2"].map((instance_id) => ({ instance_id,
        phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]] })), verification_id: "4".repeat(32),
      source_authority: "saved_flash", source_handoff_available: true, source_handoff_transaction_id: null };
    const cancelled = { session_id: "session", device_id: "meter-1", state: "cancelled", safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] } };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] }, cancel_session: cancelled,
      restart_and_verify: restartResult }));
    const state = panel as unknown as Record<string, unknown> & { cancelSession(): Promise<void>; restart(): Promise<void> };
    state.session = { ...cancelled, state: "ready" };
    await state.cancelSession(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Safety");
    expect(text(panel)).toContain("session cancelled");
    expect(text(panel)).not.toContain("exact restart verification are complete");

    state.session = { ...cancelled, state: "ready" };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    await state.restart(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Summary");
    expect(text(panel)).toContain("4".repeat(32));
    expect(text(panel)).toContain("saved flash");
  });

  it("renders runtime-only restart verification without a source identity", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.restartResult = {
      mac: "aabbccddeeff", config_filename: null, config_sha256: null,
      topology_addon_count: 0, topology_project_name: device.project_name,
      topology_connection_type: "wifi", topology_voltage_layout: "two_groups",
      connection_generation: 2, groups: [], verification_id: "2".repeat(32),
      source_authority: "saved_flash", source_handoff_available: false,
      source_handoff_transaction_id: null,
    };
    state.session = { session_id: "session", device_id: "meter-1", state: "verified",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] } };
    panel.showState("restart"); await panel.updateComplete;
    expect(text(panel)).toContain("Source handoff");
    expect(text(panel)).toContain("Unavailable in runtime-only mode");
  });

  it("reconnect assigns the returned live session instead of discarding it", async () => {
    const live = { session_id: "session", device_id: "meter-1", state: "unstable", safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] } };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] }, get_session: live }));
    const state = panel as unknown as Record<string, unknown> & { reconnectSession(): Promise<void> };
    state.session = { ...live, state: "indeterminate" };
    await state.reconnectSession();
    expect((state.session as { state: string }).state).toBe("unstable");
  });
});
