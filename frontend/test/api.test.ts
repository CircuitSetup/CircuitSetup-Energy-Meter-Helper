import { describe, expect, it } from "vitest";

import { HelperApi, type HomeAssistant } from "../src/api";

class FakeHass implements HomeAssistant {
  public messages: Record<string, unknown>[] = [];
  public callbacks: Array<(message: unknown) => void> = [];
  public responses: Record<string, unknown> = {};
  public connection: HomeAssistant["connection"] = {
    subscribeMessage: async <T>(
      callback: (message: T) => void,
      message: Record<string, unknown>,
    ) => {
      this.messages.push(message);
      this.callbacks.push(callback as (message: unknown) => void);
      return () => undefined;
    },
  };

  public async callWS<T>(message: Record<string, unknown>): Promise<T> {
    this.messages.push(message);
    const operation = String(message.type).split("/").at(-1) ?? "";
    return (this.responses[operation] ?? validResponse(operation)) as T;
  }
}

const device = {
  entry_id: "meter-1", title: "Meter", project_name: "circuitsetup.6c-energy-meter",
  project_version: "2026.8.0", importable: true, configuration: null,
};
const topology = {
  addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
  connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
  evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime project metadata" }],
};
const inventory = {
  plan_id: "plan-1", source_sha256: "a".repeat(64),
  channels: [{ channel: 1, name: "CT1", raw_gain_ct: 5500, reporting_multiplier: 1,
    selected_model_id: "model", selection_verified_against_config: true,
    address: { channel: 1, board_index: 0, group_index: 1, phase: "A" } }],
  catalog: { presets: [{ model_id: "model", label: "Model", rated_current_a: 100,
    secondary: "50 mA", default_gain_ct: 5500, requires_burden_jumper_cut: false, notes: "Approved" }],
    source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
};
const transaction = { transaction_id: "tx-1", state: "previewed", source_sha256: "a".repeat(64),
  changes: [], redacted_diff: "- old\n+ new", rollback_available: false, evidence: [], progress: [], upload_progress: [] };
const session = { session_id: "session-1", device_id: "meter-1", state: "ready", safety_acknowledged: true,
  preflight: { issues: [], zeroed_roles: ["reference"] } };
const stability = { target: "current", target_id: "1", stable: true,
  windows: [{ samples: [1, 1, 1], mean: 1, standard_deviation: 0, range_percent: 0 }] };
const calibration = { state: "applied_pending_restart_verification", group_key: "meter_main1", phase: null,
  changed_channels: [1], iteration: 1, before_values: [5500], after_values: [5520], error_percent_values: [0.2],
  gain_evidence: { outcome: "success" }, restore_evidence: { reference: "zeroed" }, retry_allowed: false };
const restart = { mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: "a".repeat(64),
  topology_addon_count: 0, topology_project_name: device.project_name, topology_connection_type: "wifi",
  topology_voltage_layout: "two_groups", connection_generation: 2, groups: [], verification_id: "verify-1",
  source_authority: "saved_flash", source_handoff_available: true, source_handoff_transaction_id: null };

function validResponse(operation: string): unknown {
  if (["setup_status", "set_installer_intent", "rescan"].includes(operation)) return { state: "device_discovered", devices: [device] };
  if (operation === "list_meters") return [device];
  if (operation === "get_topology") return topology;
  if (operation === "get_ct_inventory") return inventory;
  if (["preview_ct_config", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config"].includes(operation)) return transaction;
  if (["start_session", "get_session", "acknowledge_safety", "cancel_session"].includes(operation)) return session;
  if (operation === "check_stability") return stability;
  if (["calibrate_voltage", "calibrate_current"].includes(operation)) return calibration;
  if (operation === "restart_and_verify") return restart;
  if (operation === "adopt_device") return { device_id: "meter-1", configuration: "meter.yaml" };
  if (operation === "get_diagnostics_summary") return { setup_state: "device_discovered", meter_count: 1 };
  throw new Error(`missing fixture for ${operation}`);
}

describe("HelperApi", () => {
  it("sends the exact Task 19 command identifiers and confirmation handles", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    const hash = "a".repeat(64);

    await api.setupStatus();
    await api.listMeters();
    await api.getTopology("meter-1");
    await api.getCtInventory("meter-1");
    await api.setInstallerIntent(6, "ethernet_waveshare");
    await api.rescan();
    await api.adoptDevice("meter-1");
    await api.previewCtConfig("meter-1", "plan-1", hash, [
      {
        channel: 42,
        name: "Workshop",
        model_id: "custom",
        reporting_multiplier: 2,
        custom_gain_ct: 32000,
        custom_label: "Clamp",
        burden_output_acknowledged: true,
      },
    ]);
    await api.applyCtConfig("meter-1", "tx-1", hash);
    await api.compileCtConfig("meter-1", "tx-1", hash);
    await api.installCtConfig("meter-1", "tx-1", hash);
    await api.rollbackCtConfig("meter-1", "tx-1", hash);
    await api.startSession("meter-1");
    await api.getSession("session-1");
    await api.acknowledgeSafety("session-1");
    await api.checkStability("session-1", "current", "42");
    await api.calibrateVoltage("session-1", "addon6_2", 120, true);
    await api.calibrateCurrent("session-1", 42, 25, true);
    await api.restartAndVerify("session-1");
    await api.cancelSession("session-1");
    await api.getDiagnosticsSummary();
    await api.subscribeSetup(() => undefined);
    await api.subscribeConfigTransaction("meter-1", "tx-1", hash, () => undefined);
    await api.subscribeSession("session-1", () => undefined);

    expect(hass.messages.map((message) => message.type)).toEqual([
      "circuitsetup_energy_meter_helper/setup_status",
      "circuitsetup_energy_meter_helper/list_meters",
      "circuitsetup_energy_meter_helper/get_topology",
      "circuitsetup_energy_meter_helper/get_ct_inventory",
      "circuitsetup_energy_meter_helper/set_installer_intent",
      "circuitsetup_energy_meter_helper/rescan",
      "circuitsetup_energy_meter_helper/adopt_device",
      "circuitsetup_energy_meter_helper/preview_ct_config",
      "circuitsetup_energy_meter_helper/apply_ct_config",
      "circuitsetup_energy_meter_helper/compile_ct_config",
      "circuitsetup_energy_meter_helper/install_ct_config",
      "circuitsetup_energy_meter_helper/rollback_ct_config",
      "circuitsetup_energy_meter_helper/start_session",
      "circuitsetup_energy_meter_helper/get_session",
      "circuitsetup_energy_meter_helper/acknowledge_safety",
      "circuitsetup_energy_meter_helper/check_stability",
      "circuitsetup_energy_meter_helper/calibrate_voltage",
      "circuitsetup_energy_meter_helper/calibrate_current",
      "circuitsetup_energy_meter_helper/restart_and_verify",
      "circuitsetup_energy_meter_helper/cancel_session",
      "circuitsetup_energy_meter_helper/get_diagnostics_summary",
      "circuitsetup_energy_meter_helper/subscribe_setup",
      "circuitsetup_energy_meter_helper/subscribe_config_transaction",
      "circuitsetup_energy_meter_helper/subscribe_session",
    ]);
    expect(hass.messages[7]).toEqual({
      type: "circuitsetup_energy_meter_helper/preview_ct_config",
      entry_id: "entry-1",
      device_id: "meter-1",
      plan_id: "plan-1",
      source_sha256: hash,
      changes: [
        {
          channel: 42,
          name: "Workshop",
          model_id: "custom",
          reporting_multiplier: 2,
          custom_gain_ct: 32000,
          custom_label: "Clamp",
          burden_output_acknowledged: true,
        },
      ],
    });
  });

  it("refuses recursively nested browser payload fields that may contain secrets", () => {
    expect(() => HelperApi.assertPublicPayload({ raw_gain_ct: 27518 })).not.toThrow();
    expect(() => HelperApi.assertPublicPayload({ raw_gain_ct_secret: "no" })).toThrow(
      "private field",
    );
    expect(() => HelperApi.assertPublicPayload({ raw_gain_ct_debug: "no" })).toThrow(
      "private field",
    );
    expect(() =>
      HelperApi.assertPublicPayload({
        safe: [{ nested: { api_key: "must never render" } }],
      }),
    ).toThrow("private field");
    for (const key of ["raw", "raw_log", "raw_logs"]) {
      expect(() => HelperApi.assertPublicPayload({ [key]: ["line"] })).toThrow(
        "private field",
      );
    }
    expect(() => HelperApi.assertPublicPayload({ nested: { wifi_password: "no" } })).toThrow(
      "private field",
    );
    expect(() => HelperApi.assertPublicPayload({ authentication_token_value: "no" })).toThrow(
      "private field",
    );
    for (const hostile of ["line one\nline two", "safe\u001b[31mred", "safe\u0085next", "password=secret"]) {
      expect(() => HelperApi.assertPublicPayload({ detail: hostile })).toThrow("unsafe string");
    }
    expect(() => HelperApi.assertPublicPayload({ redacted_diff: "- old\n+ new" })).not.toThrow();
  });

  it("fails closed on command-specific shapes and enums before returning data", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    hass.responses.setup_status = { state: "invented", devices: [] };
    await expect(api.setupStatus()).rejects.toThrow("setup_status");
    hass.responses.get_ct_inventory = { ...inventory, channels: [{ ...inventory.channels[0], raw_gain_ct: "5500" }] };
    await expect(api.getCtInventory("meter-1")).rejects.toThrow("get_ct_inventory");
    hass.responses.check_stability = { ...stability, windows: [{ ...stability.windows[0], samples: [1, "bad"] }] };
    await expect(api.checkStability("session-1", "current", "1")).rejects.toThrow("check_stability");
    hass.responses.preview_ct_config = { ...transaction, changes: [{ old_value: "old", new_value: "new" }] };
    await expect(api.previewCtConfig("meter-1", "plan-1", "a".repeat(64), [])).rejects.toThrow("preview_ct_config");
    hass.responses.restart_and_verify = { ...restart, source_authority: "browser_claim" };
    await expect(api.restartAndVerify("session-1")).rejects.toThrow("restart_and_verify");
  });

  it("validates subscription events before invoking browser state callbacks", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    const received: unknown[] = [];
    await api.subscribeSetup((value) => received.push(value));
    expect(() => hass.callbacks[0]?.({ state: "failed", devices: [{ ...device, title: "bad\nline" }] })).toThrow("unsafe string");
    expect(received).toEqual([]);
    hass.callbacks[0]?.({ state: "device_discovered", devices: [device] });
    expect(received).toHaveLength(1);

    await api.subscribeConfigTransaction("meter-1", "tx-1", "a".repeat(64), (value) => received.push(value));
    expect(() => hass.callbacks[1]?.({ ...transaction, state: "invented" })).toThrow("subscribe_config_transaction");
    await api.subscribeSession("session-1", (value) => received.push(value));
    expect(() => hass.callbacks[2]?.({ ...session, preflight: { issues: [{ code: "invented", role: "meter", detail: "bad" }], zeroed_roles: [] } })).toThrow("subscribe_session");
    expect(received).toHaveLength(1);
  });
});
