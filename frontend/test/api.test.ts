import { describe, expect, it } from "vitest";

import { HelperApi, type HomeAssistant } from "../src/api";
import type { MeterTopology } from "../src/types";
import sanitizerContract from "../../tests/fixtures/task20_sanitized_change.json";

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
const topology: MeterTopology = {
  addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
  connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
  evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime project metadata" }],
};
const inventory = {
  plan_id: "plan-1", source_sha256: "a".repeat(64),
  channels: Array.from({ length: 6 }, (_, index) => ({ channel: index + 1, name: `CT${index + 1}`,
    raw_gain_ct: 5500, reporting_multiplier: 1, selected_model_id: "model",
    selection_verified_against_config: true, address: { channel: index + 1, board_index: 0,
      group_index: Math.floor(index / 3) + 1, phase: (["A", "B", "C"] as const)[index % 3] } })),
  catalog: { presets: [{ model_id: "model", label: "Model", rated_current_a: 100,
    secondary: "50 mA", default_gain_ct: 5500, requires_burden_jumper_cut: false, notes: "Approved" }],
    source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
};
const transaction = { transaction_id: "tx-1", state: "previewed", source_sha256: "a".repeat(64),
  changes: [], redacted_diff: "- old\n+ new", rollback_available: false, evidence: [], progress: [], upload_progress: [] };
const session = { session_id: "session-1", device_id: "meter-1", state: "ready", safety_acknowledged: true,
  preflight: { issues: [], zeroed_roles: ["reference"] } };
const stability = { target: "current", target_id: "1", stable: true,
  windows: [{ samples: [1], mean: 1, standard_deviation: 0, range_percent: 0 }] };
const gainEvidence = (instanceId: string, target: "voltage" | "current", reference: number, phase = "A") => ({
  connection_generation: 1,
  operation_sequence: 1,
  instance_id: instanceId,
  phases: (["A", "B", "C"] as const).map((item) => ({
    phase: item,
    measured_voltage: 120,
    measured_current: 10,
    reference_voltage: target === "voltage" ? reference : 0,
    reference_current: target === "current" && item === phase ? reference : 0,
    old_voltage_gain: 7305,
    new_voltage_gain: target === "voltage" ? 7310 : 7305,
    old_current_gain: 27518,
    new_current_gain: target === "current" && item === phase ? 28000 : 27518,
  })),
  flash_saved: true,
  register_mismatch_phases: [],
  calibration_disabled: false,
  matching_lines: ["[CALIBRATION] verified gain evidence"],
});
const calibration = { state: "applied_pending_restart_verification", group_key: "main_1", phase: "A",
  changed_channels: [1], iteration: 1, before_values: [4.9], after_values: [5], error_percent_values: [0],
  gain_evidence: gainEvidence("meter_main1", "current", 5), restore_evidence: null, retry_allowed: false };
const restart = { mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: "a".repeat(64),
  topology_addon_count: 0, topology_project_name: device.project_name, topology_connection_type: "wifi",
  topology_voltage_layout: "two_groups", connection_generation: 2,
  groups: ["meter_main1", "meter_main2"].map((instance_id) => ({
    instance_id, phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]],
  })), verification_id: "1".repeat(32),
  source_authority: "saved_flash", source_handoff_available: true, source_handoff_transaction_id: null,
  source_handoff_firmware_installed: false };

function validResponse(operation: string): unknown {
  if (["setup_status", "set_installer_intent", "rescan"].includes(operation)) return { state: "device_discovered", devices: [device] };
  if (operation === "list_meters") return [device];
  if (operation === "get_topology") return topology;
  if (operation === "get_ct_inventory") return inventory;
  if (["preview_ct_config", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config"].includes(operation)) return transaction;
  if (["start_session", "get_session", "acknowledge_safety", "cancel_session"].includes(operation)) return session;
  if (operation === "check_stability") return stability;
  if (operation === "calibrate_voltage") return { ...calibration, group_key: "addon6_2", phase: null,
    changed_channels: [40, 41, 42], before_values: [119, 119, 119], after_values: [120, 120, 120], error_percent_values: [0, 0, 0],
    gain_evidence: gainEvidence("addon6_2", "voltage", 120) };
  if (operation === "calibrate_current") return { ...calibration, group_key: "addon6_2", phase: "C",
    changed_channels: [42], before_values: [24.9], after_values: [25], error_percent_values: [0],
    gain_evidence: gainEvidence("addon6_2", "current", 25, "C") };
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
    hass.responses.check_stability = { ...stability, target_id: "42" };
    await api.checkStability("session-1", "current", "42");
    await api.calibrateVoltage("session-1", "addon6_2", 120, true);
    await api.calibrateCurrent("session-1", [{ channel: 42, reference: 25, reporting_multiplier: 1 }], true,
      [{ channel: 42, reporting_multiplier: 1 }]);
    await api.restartAndVerify("session-1", topology);
    await api.previewCalibratedGains("session-1", "1".repeat(32), [{
      channel: 1, name: "Mains", model_id: "cs-ct-200a", reporting_multiplier: 2,
    }]);
    hass.responses.clear_calibration_flash = {
      ...restart,
      source_authority: "configuration",
      source_handoff_available: false,
      source_handoff_transaction_id: "2".repeat(32),
      source_handoff_firmware_installed: true,
    };
    await api.clearCalibrationFlash(
      "session-1", "1".repeat(32), "2".repeat(32), topology,
    );
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
      "circuitsetup_energy_meter_helper/preview_calibrated_gains",
      "circuitsetup_energy_meter_helper/clear_calibration_flash",
      "circuitsetup_energy_meter_helper/cancel_session",
      "circuitsetup_energy_meter_helper/get_diagnostics_summary",
      "circuitsetup_energy_meter_helper/subscribe_setup",
      "circuitsetup_energy_meter_helper/subscribe_config_transaction",
      "circuitsetup_energy_meter_helper/subscribe_session",
    ]);
    expect(hass.messages.find((message) => String(message.type).endsWith("preview_calibrated_gains")))
      .toMatchObject({ changes: [{ channel: 1, name: "Mains", model_id: "cs-ct-200a", reporting_multiplier: 2 }] });
    expect(hass.messages.find((message) => String(message.type).endsWith("calibrate_current")))
      .toMatchObject({ pending_multipliers: [{ channel: 42, reporting_multiplier: 1 }] });
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
    expect(hass.messages.find((message) => String(message.type).endsWith("/calibrate_current"))).toMatchObject({
      references: [{ channel: 42, reference: 25, reporting_multiplier: 1 }],
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
    for (const hostile of ["safe\tlabel", "line one\nline two", "safe\u001b[31mred", "safe\u0085next", "password=secret"]) {
      expect(() => HelperApi.assertPublicPayload({ detail: hostile })).toThrow("unsafe string");
    }
    expect(() => HelperApi.assertPublicPayload({ detail: "ordinary safe whitespace" })).not.toThrow();
    expect(() => HelperApi.assertPublicPayload({ redacted_diff: "- old\n+ new" })).not.toThrow();
    for (const key of ["safe\tkey", "api\tkey", "safe\nkey", "x".repeat(257)]) {
      expect(() => HelperApi.assertPublicPayload({ evidence: [{ [key]: "value" }] })).toThrow();
    }
  });

  it("rejects impossible stability statistics and rendered collection sizes", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    for (const window of [
      { samples: Array(101).fill(1), mean: 1, standard_deviation: 0, range_percent: 0 },
      { samples: [1, 1, 1], mean: 2, standard_deviation: 0, range_percent: 0 },
      { samples: [1, 2, 3], mean: 2, standard_deviation: 0, range_percent: 100 },
      { samples: [1, 2, 3], mean: 2, standard_deviation: Math.sqrt(2 / 3), range_percent: 1 },
    ]) {
      hass.responses.check_stability = { ...stability, windows: [window] };
      await expect(api.checkStability("session-1", "current", "1")).rejects.toThrow();
    }
    hass.responses.check_stability = { ...stability, target: "voltage", target_id: "meter_main1" };
    await expect(api.checkStability("session-1", "voltage", "meter_main1")).rejects.toThrow("check_stability");
    hass.responses.get_diagnostics_summary = { values: Array(101).fill(1) };
    await expect(api.getDiagnosticsSummary()).rejects.toThrow("collection");
  });

  it("rejects cross-inconsistent calibration arrays and restart groups", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    for (const invalid of [
      { ...calibration, changed_channels: [1, 2, 3, 4], before_values: [1, 2, 3, 4], after_values: [1, 2, 3, 4], error_percent_values: [0, 0, 0, 0] },
      { ...calibration, before_values: [5500, 5501] },
      { ...calibration, state: "indeterminate", after_values: [5520], error_percent_values: [] },
      { ...calibration, iteration: 4 },
    ]) {
      hass.responses.calibrate_current = invalid;
      await expect(api.calibrateCurrent("session-1", [{ channel: 1, reference: 5, reporting_multiplier: 1 }], true)).rejects.toThrow("calibrate_current");
    }
    hass.responses.restart_and_verify = {
      ...restart,
      topology_addon_count: 6,
      groups: Array.from({ length: 15 }, (_, index) => ({
        instance_id: `group-${index}`,
        phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]],
      })),
    };
    await expect(api.restartAndVerify("session-1", { ...topology, addon_count: 6, board_count: 7,
      ct_count: 42, group_count: 14 })).rejects.toThrow("restart_and_verify");
  });

  it("accepts only coherent restart source handoff identity pairs", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    hass.responses.restart_and_verify = {
      ...restart,
      config_filename: null,
      config_sha256: null,
      source_handoff_available: false,
    };
    await expect(api.restartAndVerify("session-1", topology)).resolves.toMatchObject({
      config_filename: null,
      config_sha256: null,
      source_handoff_available: false,
    });
    for (const invalid of [
      { config_filename: "meter.yaml", config_sha256: null, source_handoff_available: false },
      { config_filename: null, config_sha256: "a".repeat(64), source_handoff_available: false },
      { config_filename: "meter.yaml", config_sha256: "a".repeat(64), source_handoff_available: false },
      { config_filename: null, config_sha256: null, source_handoff_available: true },
    ]) {
      hass.responses.restart_and_verify = { ...restart, ...invalid };
      await expect(api.restartAndVerify("session-1", topology)).rejects.toThrow("restart_and_verify");
    }
  });

  it("rejects unknown or out-of-range current reporting multipliers", async () => {
    const api = new HelperApi(new FakeHass(), "entry-1");
    for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY, 0, 0.0009, 1000.001]) {
      await expect(api.calibrateCurrent("session-1", [{ channel: 1, reference: 5, reporting_multiplier: invalid }], true)).rejects.toThrow(
        "references",
      );
    }
  });

  it("accepts the exact sanitized substitution change DTO without allowing generic keys", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    hass.responses.preview_ct_config = sanitizerContract.sanitized;
    await expect(api.previewCtConfig("meter-1", "plan-1", "a".repeat(64), [])).resolves.toMatchObject({
      changes: [{ key: "current_cal_ct42" }],
    });
    expect(() => HelperApi.assertPublicPayload({ key: "generic-provider-key" })).toThrow("private field");
    expect(() => HelperApi.assertPublicPayload({ changes: [{ key: "current_cal_ct42", new_value: "x" }] })).toThrow("private field");
    for (const invalid of [
      { ...transaction, changes: [[{ key: "current_cal_ct42", old_value: null, new_value: "x" }]] },
      { ...transaction, changes: [{ nested: { key: "current_cal_ct42" } }] },
      { ...transaction, changes: { key: "current_cal_ct42" } },
    ]) {
      hass.responses.preview_ct_config = invalid;
      await expect(api.previewCtConfig("meter-1", "plan-1", "a".repeat(64), [])).rejects.toThrow();
    }
    hass.responses.get_diagnostics_summary = { changes: { key: "current_cal_ct42" } };
    await expect(api.getDiagnosticsSummary()).rejects.toThrow("private field");
    hass.responses.preview_ct_config = { ...transaction, changes: [{ key: "logger", old_value: null, new_value: "x" }] };
    await expect(api.previewCtConfig("meter-1", "plan-1", "a".repeat(64), [])).rejects.toThrow("preview_ct_config");
  });

  it("binds stability and calibration results to the exact request identity and outcome", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    for (const invalid of [
      { ...stability, target: "voltage" },
      { ...stability, target_id: "2" },
    ]) {
      hass.responses.check_stability = invalid;
      await expect(api.checkStability("session-1", "current", "1")).rejects.toThrow("check_stability");
    }
    const calibrateCurrent = api.calibrateCurrent as unknown as (
      sessionId: string, references: Array<{ channel: number; reference: number; reporting_multiplier: number }>, confirm: boolean,
    ) => Promise<unknown>;
    for (const invalid of [
      { ...calibration, group_key: "main_2" },
      { ...calibration, phase: "B" },
      { ...calibration, changed_channels: [2] },
      { ...calibration, retry_allowed: true },
      { ...calibration, error_percent_values: [2] },
      { ...calibration, state: "result_outside_tolerance", error_percent_values: [0] },
      { ...calibration, gain_evidence: {} },
      { ...calibration, gain_evidence: { ...calibration.gain_evidence, instance_id: "meter_main2" } },
      { ...calibration, gain_evidence: { ...calibration.gain_evidence, phases: calibration.gain_evidence.phases.slice(0, 2) } },
      { ...calibration, gain_evidence: { ...calibration.gain_evidence, phases: calibration.gain_evidence.phases.map((phase, index) => index === 1 ? { ...phase, new_current_gain: 28000 } : phase) } },
      { ...calibration, gain_evidence: { ...calibration.gain_evidence, phases: calibration.gain_evidence.phases.map((phase, index) => index === 0 ? { ...phase, old_voltage_gain: 0 } : phase) } },
      { ...calibration, gain_evidence: { ...calibration.gain_evidence, phases: calibration.gain_evidence.phases.map((phase, index) => index === 0 ? { ...phase, new_voltage_gain: 65536 } : phase) } },
      { ...calibration, gain_evidence: { ...calibration.gain_evidence, phases: calibration.gain_evidence.phases.map((phase, index) => index === 0 ? { ...phase, new_current_gain: 70000 } : phase) } },
      { ...calibration, gain_evidence: { ...calibration.gain_evidence, flash_saved: false } },
      { ...calibration, gain_evidence: { ...calibration.gain_evidence, register_mismatch_phases: ["A"] } },
      { ...calibration, gain_evidence: { ...calibration.gain_evidence, calibration_disabled: true } },
      { ...calibration, gain_evidence: { ...calibration.gain_evidence, matching_lines: Array(101).fill("line") } },
      { ...calibration, gain_evidence: { ...calibration.gain_evidence, matching_lines: [] } },
      { ...calibration, state: "indeterminate", after_values: [], error_percent_values: [], gain_evidence: calibration.gain_evidence },
    ]) {
      hass.responses.calibrate_current = invalid;
      await expect(calibrateCurrent("session-1", [{ channel: 1, reference: 5, reporting_multiplier: 1 }], true)).rejects.toThrow();
    }
    hass.responses.calibrate_current = { ...calibration, state: "result_outside_tolerance",
      after_values: [5.1], error_percent_values: [2], retry_allowed: true };
    await expect(calibrateCurrent("session-1", [{ channel: 1, reference: 5, reporting_multiplier: 1 }], true)).resolves.toMatchObject({ retry_allowed: true });
    hass.responses.calibrate_current = { ...calibration, gain_evidence: gainEvidence("meter_main1", "current", 2.5) };
    await expect(api.calibrateCurrent("session-1", [{ channel: 1, reference: 5, reporting_multiplier: 2 }], true)).resolves.toMatchObject({ state: "applied_pending_restart_verification" });
  });

  it("requires authoritative topology evidence and restart identity matching that topology", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    for (const evidence of [[], [{ source: "dashboard_import", addon_count: 0, detail: "Import hint" }]]) {
      hass.responses.get_topology = { ...topology, evidence };
      await expect(api.getTopology("meter-1")).rejects.toThrow("get_topology");
    }
    const restartAndVerify = api.restartAndVerify as unknown as (
      sessionId: string, expected: typeof topology,
    ) => Promise<unknown>;
    for (const invalid of [
      { ...restart, mac: "AA:BB:CC:DD:EE:FF" },
      { ...restart, config_sha256: "z".repeat(64) },
      { ...restart, verification_id: "verify-1" },
      { ...restart, topology_project_name: "circuitsetup.6c-energy-meter-1-addon" },
      { ...restart, topology_connection_type: "ethernet_lilygo" },
      { ...restart, groups: [{ ...restart.groups[0], instance_id: "addon1_1" }] },
    ]) {
      hass.responses.restart_and_verify = invalid;
      await expect(restartAndVerify("session-1", topology)).rejects.toThrow("restart_and_verify");
    }
  });

  it("rejects impossible topology counts and bounded collections before rendering", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    for (const invalid of [
      { ...topology, addon_count: 7, board_count: 8, ct_count: 48, group_count: 16 },
      { ...topology, board_count: 8 },
      { ...topology, ct_count: 48 },
      { ...topology, group_count: 16 },
    ]) {
      hass.responses.get_topology = invalid;
      await expect(api.getTopology("meter-1")).rejects.toThrow("get_topology");
    }
    hass.responses.get_topology = {
      ...topology,
      evidence: Array.from({ length: 6 }, () => topology.evidence[0]),
    };
    await expect(api.getTopology("meter-1")).rejects.toThrow("get_topology");

    const channel = inventory.channels[0]!;
    hass.responses.get_ct_inventory = {
      ...inventory,
      channels: Array.from({ length: 43 }, (_, index) => ({
        ...channel,
        channel: index + 1,
        address: { ...channel.address, channel: index + 1 },
      })),
    };
    await expect(api.getCtInventory("meter-1")).rejects.toThrow("get_ct_inventory");
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
    await expect(api.restartAndVerify("session-1", topology)).rejects.toThrow("restart_and_verify");
  });

  it("accepts every backend preflight issue code", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    hass.responses.start_session = {
      ...session,
      state: "preflight_failed",
      preflight: {
        issues: ["count_mismatch", "invalid_kind"].map((code) => ({ code, role: "meter", detail: "blocked" })),
        zeroed_roles: [],
      },
    };

    await expect(api.startSession("meter-1")).resolves.toMatchObject({ state: "preflight_failed" });
  });

  it("validates subscription events before invoking browser state callbacks", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    const received: unknown[] = [];
    await api.subscribeSetup((value) => received.push(value));
    expect(() => hass.callbacks[0]?.({ state: "failed", devices: [{ ...device, title: "bad\nline" }] })).toThrow("unsafe string");
    expect(() => hass.callbacks[0]?.({ state: "failed", devices: [], changes: [{ key: "current_cal_ct42" }] })).toThrow("private field");
    expect(received).toEqual([]);
    hass.callbacks[0]?.({ state: "device_discovered", devices: [device] });
    expect(received).toHaveLength(1);

    await api.subscribeConfigTransaction("meter-1", "tx-1", "a".repeat(64), (value) => received.push(value));
    expect(() => hass.callbacks[1]?.({ ...transaction, state: "invented" })).toThrow("subscribe_config_transaction");
    expect(() => hass.callbacks[1]?.({ ...transaction, changes: [[{ key: "current_cal_ct42" }]] })).toThrow("private field");
    hass.callbacks[1]?.(sanitizerContract.sanitized as never);
    await api.subscribeSession("session-1", (value) => received.push(value));
    expect(() => hass.callbacks[2]?.({ ...session, preflight: { issues: [{ code: "invented", role: "meter", detail: "bad" }], zeroed_roles: [] } })).toThrow("subscribe_session");
    expect(received).toHaveLength(2);
  });
});
