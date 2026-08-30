import { expect, test, type Page } from "@playwright/test";
import sanitizerContract from "../../../tests/fixtures/task20_sanitized_change.json" with { type: "json" };
import type { OffsetBoardStatus, RestartVerificationResult, SessionStatus } from "../../src/types";

type Frame = Record<string, unknown> & { id?: number; type: string; response?: unknown };
type Outcome = "success" | "collision" | "validation" | "compile";
type Calibration = "main-success" | "addon-indeterminate" | undefined;
type Scenario = "single-phase-pq" | undefined;
type GuidedMode = "helper" | "legacy" | "runtime";

const hash = "a".repeat(64);
const FIRMWARE_INDEX_URL = "https://circuitsetup.github.io/ESPWebInstaller/manifests/firmware_index.json";
const FIRMWARE_INDEX = [
  { productId: "6chan_energy_meter_main_board", name: "Main board", versions: [{ version: "2026.8.0" }, { version: "2026.7.0" }] },
  { productId: "6chan_energy_meter_1-addon", name: "One add-on", versions: [{ version: "2026.8.0" }, { version: "2026.7.0" }] },
  { productId: "6chan_energy_meter_6-addons_ethernet", name: "Six add-ons LilyGO", versions: [{ version: "2026.8.0" }, { version: "2026.7.0" }] },
  { productId: "6chan_energy_meter_6-addons_ethernet_waveshare", name: "Six add-ons Waveshare", versions: [{ version: "2026.8.0" }, { version: "2026.7.0" }] },
];

async function mockFirmwareIndex(page: Page, index: typeof FIRMWARE_INDEX | null = FIRMWARE_INDEX, requests?: string[]) {
  await page.route(FIRMWARE_INDEX_URL, async (route) => {
    requests?.push(route.request().url());
    await route.fulfill(index === null
      ? { status: 503, contentType: "application/json", body: "[]" }
      : { contentType: "application/json", body: JSON.stringify(index) });
  });
}

function project(addons: number): string {
  return addons ? `circuitsetup.6c-energy-meter-${addons}-addons` : "circuitsetup.6c-energy-meter";
}

function device(addons: number, importable = false, entryId = "meter-1") {
  return { entry_id: entryId, title: "CircuitSetup meter", project_name: project(addons),
    project_version: "2026.8.0", importable, configuration: importable ? null : "meter.yaml" };
}

function topology(addons: number) {
  const boards = addons + 1;
  return { addon_count: addons, board_count: boards, ct_count: 6 * boards, group_count: 2 * boards,
    connection_type: "wifi", voltage_layout: "two_groups_per_board", project_name: project(addons),
    evidence: [{ source: "config_project", addon_count: addons, detail: "Project identity" },
      { source: "config_packages", addon_count: addons, detail: `${boards} board packages` },
      { source: "native_entity_counts", addon_count: addons, detail: `${6 * boards} current sensors` }] };
}

function inventory(addons: number, scenario: Scenario = undefined) {
  const count = 6 * (addons + 1);
  return { plan_id: `plan-${count}`, source_sha256: hash,
    channels: Array.from({ length: count }, (_, index) => ({
      channel: index + 1, name: `CT${index + 1}`, raw_gain_ct: index === 3 ? 27518 : 5500,
      reporting_multiplier: scenario === "single-phase-pq" && index === 6 ? 4 : 1, selected_model_id: index === 3 ? null : "cs-ct-200a",
      selection_verified_against_config: index !== 3,
      address: { channel: index + 1, board_index: Math.floor(index / 6),
        group_index: Math.floor((index % 6) / 3),
        phase: (["A", "B", "C"] as const)[index % 3] },
      display_label: null, stored_selection_present: false,
    })),
  catalog: { presets: [{ model_id: "cs-ct-200a", label: "CS-CT-200A-333mV", rated_current_a: 60,
      secondary: "333 mV @ 200 A", default_gain_ct: 5500, requires_burden_jumper_cut: false,
      notes: "Use burden at least 1 VA for best accuracy." },
    { model_id: "sct-016", label: "SCT-016", rated_current_a: 120, secondary: "50 mA @ 120 A",
      default_gain_ct: 41787, requires_burden_jumper_cut: true,
      notes: "Review the board burden jumper before use." }],
    source_repository: "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter", source_ref: "4d1d14f",
    schema_version: 1 } };
}

function meterConfiguration(addons: number, scenario: Scenario = undefined, mode: GuidedMode = "helper") {
  const live = inventory(addons, scenario); const references = Array.from({ length: addons + 1 }, (_, board) => ({
    reference_id: board ? `addon${board}` : "main", label: board ? `Add-on ${board}` : "Main", phase_label: "A/B",
    nominal_voltage_v: 120, transformer_model_id: "default", gain_voltage: 7305,
    group_keys: board ? [`addon${board}_1`, `addon${board}_2`] : ["main_1", "main_2"],
  }));
  const channels = live.channels.map((channel) => ({ channel: channel.channel, enabled: true, name: channel.name,
    model_id: channel.selected_model_id ?? "custom", reporting_multiplier: channel.reporting_multiplier, role: "branch",
    voltage_reference_id: channel.address.board_index ? `addon${channel.address.board_index}` : "main",
    custom_gain_ct: channel.selected_model_id === null ? channel.raw_gain_ct : null,
    custom_label: channel.selected_model_id === null ? "Custom CT" : null,
    burden_output_acknowledged: channel.selected_model_id === null }));
  const singlePhase = scenario === "single-phase-pq";
  const numericEntityCount = live.channels.length * 2 + 2 * (addons + 1) + (singlePhase ? 24 : 0);
  return { plan_id: "b".repeat(32), source_sha256: live.source_sha256, topology: { ...topology(addons), voltage_layout: "standard" },
    configuration: { meter: { friendly_name: "Energy meter", electrical_system: singlePhase ? "single_phase_230" : "split_phase_120_240", line_frequency_hz: singlePhase ? 50 : 60,
      update_interval_s: 5, voltage_layout: addons ? "multi_reference" : "standard", voltage_references: references.map((reference) => singlePhase ? { ...reference, nominal_voltage_v: 230 } : reference) }, channels, aggregates: [],
      power_quality: Array.from({ length: addons + 1 }, (_value, board) => singlePhase && board === 1), status_fields: Array(addons + 1).fill(false), multi_reference_preparation_acknowledged: false },
    capabilities: { configuration_authoritative: mode !== "runtime", managed_totals: mode === "helper", multi_reference: true,
      semantic_source: mode === "legacy" ? "legacy_inferred" : "helper_managed", reason_codes: mode === "legacy" ? ["electrical_profile_requires_confirmation"] : [] },
    voltage_topology: { references: references.map((reference) => [reference.reference_id, reference.group_keys]), source: "legacy" },
    voltage_transformer_catalog: { presets: [{ model_id: "default", label: "Default", primary_nominal_v: 120, secondary_nominal_v: 9, default_gain_voltage: 7305, notes: "Approved" }], source_repository: "CircuitSetup/repo", source_ref: "a".repeat(40), schema_version: 1 },
    ct_catalog: live.catalog, warnings: [], configuration_impact: { enabled_channel_count: live.channels.length, numeric_entity_count: numericEntityCount, text_entity_count: 0, energy_entity_count: 0, approximate_publications_per_second: numericEntityCount / 5 }, channels: live.channels, catalog: live.catalog };
}

function transaction(state: string, channel: number, options: { evidence?: string[]; progress?: string[];
  rollback?: boolean; validation?: boolean } = {}) {
  return { ...sanitizerContract.sanitized, transaction_id: "b".repeat(32), state, source_sha256: hash,
    changes: [{ key: `channel.${channel}.name`, old_value: `CT${channel}`, new_value: `Load ${channel}` }],
    redacted_diff: `- ct${channel}_name: <redacted>\n+ ct${channel}_name: <redacted>`,
    rollback_available: options.rollback ?? false, evidence: options.evidence ?? [], progress: options.progress ?? [],
    validation_detail: options.validation ? { code: 1, reported_error_count: 1,
      reported_warning_count: 0, error_record_count: 1, warning_record_count: 0 } : null,
    upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: true };
}

function offsetBoards(addons: number, stageState: "not_started" | "skipped" = "not_started"): OffsetBoardStatus[] {
  return Array.from({ length: addons + 1 }, (_, board_index) => ({ board_index,
    stages: [{ stage: 1, state: stageState }, { stage: 2, state: stageState }] }));
}

function session(state: string, acknowledged: boolean, addons = 0, pending = false,
  offsetState: "not_started" | "skipped" = "not_started", calibrationPlan: "standard" | "full" = "full"): SessionStatus {
  return { session_id: "session-1", device_id: "meter-1", state, safety_acknowledged: acknowledged,
    preflight: { issues: [], zeroed_roles: ["main_1.reference_voltage", "ct1.reference_current"] },
    entity_role_counts: {}, offset_capability: { status: "available", repair_reason: null },
    calibration_plan: calibrationPlan, offset_disposition: offsetState, offset_boards: offsetBoards(addons, offsetState),
    has_pending_calibration: pending };
}

function offsetReadiness(frame: Frame) {
  const board = Number(frame.board_index); const stage = Number(frame.stage) as 1 | 2;
  const voltage = stage === 1 ? 0 : 120;
  const entities = [0, 1].flatMap((groupOffset) => {
    const group = board === 0 ? `main_${groupOffset + 1}` : `addon${board}_${groupOffset + 1}`;
    return [
      ...["a", "b", "c"].map((phase) => ({ role: `${group}.voltage_${phase}`, quantity: "voltage", ready: true, reasons: [],
        window: { values: [voltage, voltage, voltage], received_at: [1, 2, 3], connection_generation: 2,
          mean: voltage, minimum: voltage, maximum: voltage, absolute_peak: voltage, absolute_spread: 0 } })),
      ...[1, 2, 3].map((offset) => ({ role: `ct${board * 6 + groupOffset * 3 + offset}.current_sensor`, quantity: "current", ready: true, reasons: [],
        window: { values: [0, 0, 0], received_at: [1, 2, 3], connection_generation: 2,
          mean: 0, minimum: 0, maximum: 0, absolute_peak: 0, absolute_spread: 0 } })),
    ];
  });
  return { stage, ready: true, connection_generation: 2, entities, reasons: [], thresholds: {
    sample_count: 3, zero_voltage_peak_volts: 1, zero_voltage_spread_volts: 0.5,
    zero_current_peak_amps: 0.25, zero_current_spread_amps: 0.1,
    voltage_present_minimum_volts: 90, voltage_present_spread_volts: 2,
  } };
}

function stability(frame: Frame) {
  const target = String(frame.target);
  const targetId = String(frame.target_id);
  const sample = { samples: [5], mean: 5, standard_deviation: 0, range_percent: 0 };
  return { target, target_id: targetId, stable: true, windows: target === "voltage" ? [sample, sample, sample] : [sample] };
}

function gainEvidence(instanceId: string, reference: number, phase: string) {
  return { connection_generation: 2, operation_sequence: 7, instance_id: instanceId,
    phases: ["A", "B", "C"].map((item) => ({ phase: item, measured_voltage: 120, measured_current: 5,
      reference_voltage: 0, reference_current: item === phase ? reference : 0,
      old_voltage_gain: 7305, new_voltage_gain: 7305, old_current_gain: 27518,
      new_current_gain: item === phase ? 28000 : 27518 })), flash_saved: true,
    register_mismatch_phases: [], calibration_disabled: false,
    matching_lines: ["[CALIBRATION] parsed gain and flash acknowledgement"] };
}

function restart(addons: number): RestartVerificationResult {
  const groups = Array.from({ length: 2 * (addons + 1) }, (_, index) => {
    const board = Math.floor(index / 2); const group = index % 2 + 1;
    return { instance_id: board ? `addon${board}_${group}` : `meter_main${group}`,
      phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]] };
  });
  return { mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: hash,
    topology_addon_count: addons, topology_project_name: project(addons), topology_connection_type: "wifi" as const,
    topology_voltage_layout: "two_groups_per_board", connection_generation: 3, groups,
    verification_id: "b".repeat(32), offset_groups: [], power_offset_groups: [], source_authority: "saved_flash",
    source_handoff_available: true, source_handoff_transaction_id: null,
    source_handoff_firmware_installed: false };
}

async function mockHomeAssistant(page: Page, options: { addons?: number; outcome?: Outcome;
  calibration?: Calibration; rescan?: Array<"none" | "device" | "devices">; importable?: boolean;
  setupEvent?: "none" | "device" | "devices"; firmwareIndex?: typeof FIRMWARE_INDEX | null;
  firmwareRequests?: string[]; consumePlans?: boolean; freshSourceChanged?: boolean; scenario?: Scenario;
  slowClearCalibration?: boolean; guidedMode?: GuidedMode; activeWork?: "normal" | "handoff" | "safety" | "ready"; oneDevice?: boolean } = {}) {
  const addons = options.addons ?? 0;
  const outcome = options.outcome ?? "success";
  const frames: Frame[] = [];
  let rescans = 0;
  let boundDeviceId: string | null = null;
  let deviceSeen = false;
  let imported = false;
  let nextSetupStatusUnavailable = false;
  let setupSubscriptionGeneration = 0;
  let currentTransaction = transaction("previewed", addons ? 42 : 1);
  let currentSession = session("safety_required", false, addons);
  let currentRestart: RestartVerificationResult | null = null;
  let resumeRestart: RestartVerificationResult | null = null;
  let transactionActive = false;
  let sessionActive = false;
  let offsetCalibrated = false;
  let activePlan: string | null = "b".repeat(32);
  let activeSourceSha256 = hash;
  let pendingPreview = false;
  let freshPlanGeneration = 0;
  const discoveredDevice = (entryId = "meter-1") => ({
    ...device(addons, options.importable, entryId),
    configuration: options.guidedMode === "runtime" || options.importable ? null : "meter.yaml",
  });
  const setupDevices = options.setupEvent === "devices"
    ? [discoveredDevice(), discoveredDevice("meter-2")]
    : options.setupEvent === "device" ? [discoveredDevice()] : [];
  const authoritative = () => options.guidedMode !== "runtime" && (!options.importable || imported);
  const setupSnapshot = () => boundDeviceId || deviceSeen
    ? { state: "topology_review", devices: (setupDevices.length ? setupDevices : [discoveredDevice()]).map((item) => item.entry_id === (boundDeviceId ?? "meter-1") && imported
      ? { ...item, importable: false, configuration: "meter.yaml" } : item), bound_device_id: boundDeviceId ?? "meter-1",
    configuration_authoritative: authoritative() }
    : { state: "no_device", devices: [] };

  await mockFirmwareIndex(page, options.firmwareIndex, options.firmwareRequests);

  await page.routeWebSocket("**/api/websocket", (socket) => {
    socket.send(JSON.stringify({ type: "auth_required", ha_version: "2026.8.0" }));
    socket.onMessage((message) => {
      const frame = JSON.parse(String(message)) as Frame;
      frames.push(frame);
      if (frame.type === "auth") {
        socket.send(JSON.stringify(frame.access_token === "playwright-token"
          ? { type: "auth_ok", ha_version: "2026.8.0" }
          : { type: "auth_invalid", message: "invalid token" }));
        return;
      }
      const id = frame.id!;
      const operation = frame.type.split("/").at(-1)!;
      const ok = (result: unknown) => {
        frame.response = result;
        socket.send(JSON.stringify({ id, type: "result", success: true, result }));
      };
      const fail = (code: string, message: string) => socket.send(JSON.stringify({ id, type: "result", success: false,
        error: { code, message } }));
      if (operation === "unsubscribe_events") return ok(null);
      let result: unknown;
      if (operation === "setup_status") {
        if (nextSetupStatusUnavailable) {
          nextSetupStatusUnavailable = false;
          return fail("capability_unavailable", "helper reload in progress");
        }
        result = setupSnapshot();
      }
      else if (operation === "set_installer_intent") result = { state: "installer_guide", devices: [],
        installer_intent: { addon_count: frame.addon_count, connection_type: frame.connection_type } };
      else if (operation === "rescan") {
        const state = options.rescan?.[rescans++] ?? "devices";
        if (state !== "none") deviceSeen = true;
        result = state === "none" ? { state: "no_device", devices: [] }
          : { state: "device_discovered", devices: state === "devices" && !options.oneDevice
            ? [discoveredDevice(), discoveredDevice("meter-2")]
            : [discoveredDevice()], configuration_authoritative: authoritative() };
      } else if (operation === "adopt_device") {
        boundDeviceId = "meter-1";
        imported = true;
        nextSetupStatusUnavailable = true;
        result = { device_id: "meter-1", configuration: "meter.yaml" };
      }
      else if (operation === "get_topology") result = {
        topology: topology(addons),
        package_options: {
          power_quality: Array.from({ length: addons + 1 }, (_value, board) => options.scenario === "single-phase-pq" && board === 1),
          status_fields: Array.from({ length: addons + 1 }, () => false),
        },
      };
      else if (operation === "get_meter_configuration") {
        const refreshingConsumedPlan = options.consumePlans && activePlan === null;
        if (options.consumePlans && activePlan === null) {
          activePlan = String.fromCharCode("c".charCodeAt(0) + freshPlanGeneration).repeat(32);
          freshPlanGeneration += 1;
          if (options.freshSourceChanged) activeSourceSha256 = "f".repeat(64);
        }
        const live = meterConfiguration(addons, options.scenario, options.guidedMode);
        result = { ...live, plan_id: activePlan ?? "b".repeat(32), source_sha256: activeSourceSha256,
          configuration: refreshingConsumedPlan && options.freshSourceChanged
            ? { ...live.configuration, meter: { ...live.configuration.meter, friendly_name: "External meter" } }
            : live.configuration };
      }
      else if (operation === "get_ct_inventory") result = inventory(addons, options.scenario);
      else if (operation === "get_active_work") result = transactionActive || sessionActive
        ? { session: sessionActive ? currentSession : null, transaction: transactionActive ? currentTransaction : null,
          verified_calibration: resumeRestart ?? currentRestart }
        : options.activeWork === "normal"
        ? { session: null, transaction: { ...transaction("validated", 1), changes: [] }, verified_calibration: null }
        : options.activeWork === "handoff"
          ? { session: session("verified", true, addons, false, "skipped", "standard"),
            transaction: { ...transaction("previewed", 1), transaction_id: "d".repeat(32), changes: [] },
            verified_calibration: { ...restart(addons), source_authority: "configuration",
              source_handoff_available: false, source_handoff_transaction_id: "d".repeat(32),
              source_handoff_firmware_installed: true } }
          : options.activeWork === "safety"
            ? { session: session("safety_required", false, addons, false, "skipped", "standard"), transaction: null, verified_calibration: null }
          : options.activeWork === "ready"
            ? { session: session("ready", true, addons, false, "skipped", "standard"), transaction: null, verified_calibration: null }
          : { session: null, transaction: null, verified_calibration: null };
      else if (operation === "set_ha_labels") result = { mode: "home_assistant_labels",
        results: [{ channel: 1, state: "updated" }] };
      else if (operation === "preview_ct_config") {
        if (outcome === "collision") return fail("CT_NAME_COLLISION", "Names resolve to the same entity ID");
        transactionActive = true;
        result = currentTransaction = transaction("previewed", Number((frame.changes as Array<{ channel: number }>)[0]?.channel ?? 1));
      } else if (operation === "preview_meter_configuration") {
        if (options.consumePlans && (frame.plan_id !== activePlan || frame.source_sha256 !== activeSourceSha256 || pendingPreview)) {
          return fail("stale_confirmation", "preview plan was already consumed");
        }
        transactionActive = true;
        result = currentTransaction = transaction("previewed", 1);
        if (options.consumePlans) {
          activePlan = null;
          pendingPreview = true;
        }
      } else if (operation === "preview_calibrated_gains") {
        transactionActive = true;
        result = currentTransaction = { ...transaction("previewed", 1), transaction_id: "d".repeat(32) };
        if (currentRestart) resumeRestart = { ...currentRestart, source_authority: "configuration",
          source_handoff_available: false, source_handoff_transaction_id: currentTransaction.transaction_id,
          source_handoff_firmware_installed: true };
      } else if (operation === "apply_ct_config") {
        result = currentTransaction = { ...(outcome === "validation"
          ? transaction("failed", addons ? 42 : 1, { evidence: ["validation_failed"], rollback: true, validation: true })
          : transaction("validated", addons ? 42 : 1, { progress: ["config_written", "config_validated"], rollback: true })),
          transaction_id: String(frame.transaction_id) };
      } else if (operation === "compile_ct_config") {
        result = currentTransaction = { ...(outcome === "compile"
          ? transaction("failed", addons ? 42 : 1, { evidence: ["compile_failed"], progress: ["config_written", "config_validated"], rollback: true })
          : transaction("install_confirmation_required", addons ? 42 : 1,
            { progress: ["config_written", "config_validated", "firmware_compiled"], rollback: true })),
          transaction_id: String(frame.transaction_id) };
      } else if (operation === "install_ct_config") {
        transactionActive = false;
        result = currentTransaction = { ...transaction("verified", addons ? 42 : 1,
          { progress: ["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted"] }),
          transaction_id: String(frame.transaction_id) };
      }
      else if (operation === "abandon_ct_config") {
        if (options.consumePlans && !pendingPreview) return fail("stale_confirmation", "no pending preview");
        pendingPreview = false;
        result = currentTransaction = { ...currentTransaction, state: "failed", evidence: ["cancelled"] };
      }
      else if (operation === "clear_calibration_flash") {
        result = { ...restart(addons), source_authority: "configuration", source_handoff_available: false,
          source_handoff_transaction_id: frame.transaction_id, source_handoff_firmware_installed: true };
        if (options.slowClearCalibration) {
          setTimeout(() => ok(result), 250);
          return;
        }
      }
      else if (operation === "rollback_ct_config") result = currentTransaction = transaction("rolled_back", addons ? 42 : 1,
        { progress: ["config_restored"] });
      else if (operation === "start_session") {
        sessionActive = true;
        result = currentSession = session("safety_required", false, addons, false,
          frame.calibration_plan === "standard" ? "skipped" : "not_started", frame.calibration_plan === "standard" ? "standard" : "full");
      }
      else if (operation === "acknowledge_safety") result = currentSession = { ...currentSession, state: "ready", safety_acknowledged: true };
      else if (operation === "check_offset_readiness") result = offsetReadiness(frame);
      else if (operation === "calibrate_offset") {
        const board = Number(frame.board_index); const stage = Number(frame.stage) as 1 | 2;
        const keys = board === 0 ? ["main_1", "main_2"] : [`addon${board}_1`, `addon${board}_2`];
        const boards = currentSession.offset_boards as ReturnType<typeof offsetBoards>;
        currentSession = { ...currentSession,
          offset_disposition: stage === 2 ? "completed" : currentSession.offset_disposition ?? "not_started",
          offset_boards: boards.map((item) => item.board_index === board
            ? { ...item, stages: item.stages.map((itemStage) => itemStage.stage === stage ? { ...itemStage, state: "completed" } : itemStage) }
            : item),
          state: "applied_pending_restart_verification", has_pending_calibration: true };
        if (stage === 2) offsetCalibrated = true;
        result = { state: "applied_pending_restart_verification", board_index: board, stage,
          expected_tables: keys.map((key) => [key, [[1, -1], [2, -2], [3, -3]]]),
          unfinished_group_keys: [], retry_allowed: false, error: null };
      } else if (operation === "skip_offset_calibration") {
        result = currentSession = session("ready", true, addons, currentSession.has_pending_calibration as boolean, "skipped");
      }
      else if (operation === "check_stability") result = stability(frame);
      else if (operation === "calibrate_voltage") result = voltageCalibration(frame);
      else if (operation === "calibrate_current") {
        const references = frame.references as Array<{ channel: number; reference: number }>;
        const channel = Number(references[0]?.channel); const reference = Number(references[0]?.reference);
        const addon = channel === 42; const group = addon ? "addon6_2" : "main_1"; const phase = addon ? "C" : "A";
        result = options.calibration === "addon-indeterminate"
          ? { state: "indeterminate", group_key: group, phase, changed_channels: [channel], iteration: 1,
            before_values: [24.9], after_values: [], error_percent_values: [], gain_evidence: null,
            restore_evidence: { references_zeroed: true }, retry_allowed: false }
          : { state: "applied_pending_restart_verification", group_key: group, phase, changed_channels: [channel],
            iteration: 1, before_values: [reference - 0.1], after_values: [reference], error_percent_values: [0],
            gain_evidence: gainEvidence(addon ? "addon6_2" : "meter_main1", reference, phase),
            restore_evidence: null, retry_allowed: false };
        if (options.calibration !== "addon-indeterminate") currentSession = { ...currentSession,
          state: "applied_pending_restart_verification", has_pending_calibration: true };
      } else if (operation === "get_session") result = currentSession;
      else if (operation === "restart_and_verify") {
        const base = restart(addons);
        currentSession = { ...currentSession, state: "verified" };
        result = currentRestart = { ...base,
          config_filename: options.guidedMode === "runtime" ? null : base.config_filename,
          config_sha256: options.guidedMode === "runtime" ? null : base.config_sha256,
          offset_groups: offsetCalibrated ? [{ instance_id: "meter_main1", phase_offsets: [[1, -1], [2, -2], [3, -3]] }] : [],
          source_handoff_available: options.guidedMode !== "runtime" && !offsetCalibrated };
      }
      else if (operation === "complete_calibration_without_changes") result = currentSession = {
        ...currentSession, state: "verified", has_pending_calibration: false,
      };
      else if (operation === "cancel_session") result = currentSession = session("cancelled", false);
      else if (operation === "subscribe_setup") {
        ++setupSubscriptionGeneration;
        result = setupSnapshot();
      }
      else if (operation === "subscribe_config_transaction") result = currentTransaction;
      else if (operation === "subscribe_session") result = currentSession;
      else return fail("unknown_command", operation);
      ok(result);
      if (operation.startsWith("subscribe_")) {
        const event = operation === "subscribe_setup" && setupSubscriptionGeneration === 1 && setupDevices.length
          ? { state: "device_discovered", devices: setupDevices }
          : result;
        setTimeout(() => socket.send(JSON.stringify({ id, type: "event", event })), 0);
      }
    });
  });
  return frames;
}

const operations = (frames: Frame[]) => frames.map((frame) => frame.type.split("/").at(-1) ?? "");

async function openInventory(page: Page): Promise<void> {
  await page.goto("/test/harness.html");
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();
  await expect(page.getByRole("heading", { name: "Setup Device", exact: true })).toBeVisible();
  await expect(page.getByText(/Detected .* CTs on a .* connection/)).toBeVisible();
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole("heading", { name: "Meter Settings", exact: true })).toBeVisible();
  const preparation = page.getByLabel("Multi-reference preparation acknowledgement");
  if (await preparation.count()) {
    await page.locator('[data-section="advanced-meter-settings"] summary').click();
    await preparation.check();
  }
  await page.locator('[data-action="continue-meter-settings"]').click();
  await expect(page.locator("#step-heading")).toHaveText("Circuits & CTs");
}

function voltageCalibration(frame: Frame) {
  const referenceId = String(frame.reference_id); const reference = Number(frame.reference_voltage);
  const board = referenceId === "main" ? 0 : Number(referenceId.replace("addon", ""));
  return [1, 2].map((group) => {
    const groupKey = board ? `addon${board}_${group}` : `main_${group}`;
    const first = board * 6 + (group - 1) * 3 + 1;
    return { state: "applied_pending_restart_verification", group_key: groupKey, phase: null,
      changed_channels: [first, first + 1, first + 2], iteration: 1,
      before_values: [reference - 0.1, reference - 0.1, reference - 0.1], after_values: [reference, reference, reference], error_percent_values: [0, 0, 0], retry_allowed: false,
      gain_evidence: { connection_generation: 2, operation_sequence: 7, instance_id: board ? groupKey : `meter_main${group}`,
        phases: ["A", "B", "C"].map((phase) => ({ phase, measured_voltage: reference, measured_current: 0,
          reference_voltage: reference, reference_current: 0, old_voltage_gain: 7305, new_voltage_gain: 7305,
          old_current_gain: 5500, new_current_gain: 5500 })), flash_saved: true, register_mismatch_phases: [], calibration_disabled: false,
        matching_lines: ["[CALIBRATION] voltage gain saved"] }, restore_evidence: null };
  });
}

async function reviewChannel(page: Page, channel: number): Promise<void> {
  if (channel === 42) {
    await page.getByRole("tab", { name: "Add-on 6" }).click();
  }
  await page.getByLabel(`CT${channel} name`).fill(`Load ${channel}`);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Install meter configuration" })).toBeVisible();
}

async function reachCurrent(page: Page, channel: number): Promise<void> {
  if (channel === 42) {
    await page.getByRole("tab", { name: "Add-on 6" }).click();
  }
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Choose calibration" })).toBeVisible();
  await page.getByLabel(/Full calibration/).check();
  await expect(page.getByRole("heading", { name: "Safety", exact: true })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Offset", exact: true })).toBeVisible();
  const offsetCopy = await page.locator(".offset-step").textContent() ?? "";
  expect(offsetCopy.indexOf("open-circuit current-output CT")).toBeLessThan(offsetCopy.indexOf("unplug the voltage transformer"));
  await expect(page.getByRole("button", { name: "Run Stage 1 calibration" })).toBeDisabled();
  await page.getByRole("button", { name: "Skip offset calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Voltage", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Skip voltage calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Current", exact: true })).toBeVisible();
}

test("native mocked HA websocket covers automatic onboarding after rescan discovery", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { addons: 6, rescan: ["none", "device"], importable: true });
  await page.goto("/test/harness.html");
  await expect(page.getByRole("heading", { name: "Set up a new meter" })).toBeVisible();

  await page.locator('[data-action="rescan"]').click();
  await expect(page.getByRole("heading", { name: "Set up a new meter" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Setup Device", exact: true })).toBeVisible();
  await expect(page.getByText(/(?:USB flash|installation|provisioning) complete/i)).toHaveCount(0);
  await page.locator('[name="addon-count"][value="6"]').locator("..").click();
  await page.locator('[name="connection-type"][value="ethernet_waveshare"]').locator("..").click();
  await expect(page.getByText("(15, 26)")).toBeVisible();
  await page.locator('[data-action="rescan"]').click();
  await expect(page.getByText("Device added to Home Assistant. Importing into ESPHome Builder…")).toBeVisible();
  await expect(page.getByText("Meter imported into ESPHome Builder.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Setup Device", exact: true })).toBeVisible();
  await expect(page.getByText(/Detected .* CTs on a .* connection/)).toBeVisible();

  expect(frames[0]).toEqual({ type: "auth", access_token: "playwright-token" });
  const intents = frames.filter((frame) => frame.type.endsWith("/set_installer_intent"));
  expect(intents).toMatchObject([{ addon_count: 0, connection_type: "wifi" },
    { addon_count: 6, connection_type: "ethernet_waveshare" }]);
  expect(operations(frames).filter((operation) => operation === "adopt_device")).toHaveLength(1);
  expect(operations(frames).filter((operation) => operation === "subscribe_setup")).toHaveLength(2);
  expect(operations(frames)).toEqual(expect.arrayContaining(["setup_status", "get_topology"]));
});

test("multiple newly discovered meters wait for an Import click", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { setupEvent: "devices", importable: true });
  await page.goto("/test/harness.html");

  await expect(page.getByRole("button", { name: "Import" })).toHaveCount(2);
  expect(operations(frames)).not.toContain("adopt_device");
  await page.getByRole("button", { name: "Import" }).first().click();
  await expect.poll(() => operations(frames).filter((operation) => operation === "adopt_device").length).toBe(1);
});

test("inline provisioning resolves selected manifests without popup, navigation, credentials, or URL payloads", async ({ page }) => {
  const firmwareRequests: string[] = [];
  const frames = await mockHomeAssistant(page, { firmwareRequests });
  const popups: Page[] = [];
  const navigations: string[] = [];
  page.on("popup", (popup) => popups.push(popup));
  page.on("framenavigated", (frame) => { if (frame === page.mainFrame()) navigations.push(frame.url()); });
  await page.goto("/test/harness.html");

  const manifest = () => page.locator("esp-web-install-button").evaluate((element) =>
    (element as HTMLElement & { manifest: string }).manifest,
  );
  const manifestUrl = (productId: string, version: string) =>
    `https://circuitsetup.github.io/ESPWebInstaller/manifests/manifest_${productId}-${version}.json`;
  await expect.poll(manifest).toBe(manifestUrl("6chan_energy_meter_main_board", "2026.8.0"));
  expect(firmwareRequests).toEqual([FIRMWARE_INDEX_URL]);
  await expect(page.getByText("6chan_energy_meter_main_board · ESPHome 2026.8.0", { exact: true })).toBeVisible();
  expect(await page.locator(".setup-step").evaluate((step) => {
    const order = [
      step.querySelector('[name="addon-count"]')?.closest("fieldset"),
      step.querySelector('[name="connection-type"]')?.closest("fieldset"),
      step.querySelector('[aria-labelledby="jumper-heading"]'),
      step.querySelector('[data-action="firmware-version"]'),
      step.querySelector("esp-web-install-button"),
      step.querySelector(".next-steps"),
      step.querySelector('[data-action="rescan"]'),
    ];
    return order.slice(1).every((element, index) => Boolean(order[index] && element &&
      order[index].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING));
  })).toBe(true);
  await expect(page.locator('esp-web-install-button [slot="unsupported"]')).toContainText("supported Chromium browser");
  await expect(page.locator('esp-web-install-button [slot="not-allowed"]')).toContainText("HTTPS or localhost");

  await page.locator('[name="addon-count"][value="1"]').locator("..").click();
  await expect.poll(manifest).toBe(manifestUrl("6chan_energy_meter_1-addon", "2026.8.0"));
  await page.locator('[name="addon-count"][value="6"]').locator("..").click();
  await page.locator('[name="connection-type"][value="ethernet_lilygo"]').locator("..").click();
  await expect.poll(manifest).toBe(manifestUrl("6chan_energy_meter_6-addons_ethernet", "2026.8.0"));
  await page.locator('[name="connection-type"][value="ethernet_waveshare"]').locator("..").click();
  await expect.poll(manifest).toBe(manifestUrl("6chan_energy_meter_6-addons_ethernet_waveshare", "2026.8.0"));
  await page.locator('[data-action="firmware-version"]').selectOption("2026.7.0");
  await expect.poll(manifest).toBe(manifestUrl("6chan_energy_meter_6-addons_ethernet_waveshare", "2026.7.0"));

  const credentialInputs = await page.locator("input").evaluateAll((inputs) => inputs.filter((input) =>
    ["name", "aria-label", "autocomplete", "data-testid", "placeholder"].some((attribute) =>
      /ssid|password|passphrase|credentials/i.test(input.getAttribute(attribute) ?? "")),
  ).map((input) => input.outerHTML));
  const frameKeys = (value: unknown): string[] => Array.isArray(value) ? value.flatMap(frameKeys)
    : value && typeof value === "object" ? Object.entries(value).flatMap(([key, entry]) => [key, ...frameKeys(entry)]) : [];
  const payloadKeys = frames.flatMap(frameKeys);
  expect(credentialInputs).toEqual([]);
  expect(payloadKeys.filter((key) => /ssid|password|passphrase|credentials/i.test(key))).toEqual([]);
  expect(JSON.stringify(frames)).not.toMatch(/manifest|binary(?:_url)?|firmware_url/i);
  expect(popups).toEqual([]);
  expect(navigations).toEqual([page.url()]);
});

test("a firmware catalog failure leaves Retry and Rescan available", async ({ page }) => {
  await mockHomeAssistant(page, { firmwareIndex: null });
  await page.goto("/test/harness.html");

  await expect(page.getByText("Firmware catalog could not be loaded.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Rescan for device", exact: true })).toBeVisible();
});

test("six-channel inventory routes canonical edits through Meter Settings and full preview", async ({ page }) => {
  const frames = await mockHomeAssistant(page);
  await openInventory(page);
  await expect(page.locator('[data-ct-row]')).toHaveCount(6);
  await expect(page.locator('[data-group-nav]')).toHaveCount(0);
  await expect(page.locator('.ct-index')).toHaveText(["CT1", "CT2", "CT3", "CT4", "CT5", "CT6"]);
  await expect(page.locator('.row-count')).toHaveText("Showing 1–6 of 6 CTs");
  await page.setViewportSize({ width: 900, height: 900 });
  expect(await page.locator('.ct-table').evaluate((table) => getComputedStyle(table).overflowX)).toBe("auto");
  await page.setViewportSize({ width: 1280, height: 720 });
  const alignment = await page.locator('.name-mode label').evaluateAll((labels) => labels.map((label) => {
    const input = label.querySelector('input')!.getBoundingClientRect();
    const row = label.getBoundingClientRect();
    return Math.abs(input.y + input.height / 2 - row.y - row.height / 2);
  }));
  expect(alignment.every((difference) => difference < 1)).toBe(true);
  await expect(page.getByLabel("CT4 model")).toHaveValue("custom");
  await expect(page.getByLabel("CT4 custom gain")).toHaveCount(0);
  await page.getByLabel("Home Assistant labels only").check();
  await expect(page.getByLabel("CT1 model")).toBeDisabled();
  await expect(page.getByLabel("CT1 multiplier")).toBeDisabled();
  await page.getByLabel("CT1 name").fill("Kitchen mains");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Home Assistant labels saved.")).toBeVisible();
  expect(operations(frames).filter((value) => value === "set_ha_labels")).toHaveLength(1);
  expect(operations(frames)).not.toContain("preview_ct_config");

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#step-heading")).toHaveText("Circuits & CTs");
  await page.getByLabel("ESPHome / firmware names").check();
  await page.getByLabel("CT2 name").fill("Kitchen mains");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Install meter configuration" })).toBeVisible();
  expect(operations(frames)).toContain("preview_meter_configuration");
  expect(operations(frames)).not.toContain("preview_ct_config");
  const preview = frames.find((frame) => frame.type.endsWith("/preview_meter_configuration"))!;
  expect(preview.configuration).toMatchObject({ meter: { friendly_name: "Energy meter" } });
  expect(JSON.stringify(preview.configuration)).not.toContain("authoritative");
  expect(JSON.stringify(preview.configuration)).not.toContain("warnings");
});

test("review Back abandons the consumed preview and reuses preserved edits with a fresh plan", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { consumePlans: true });
  await openInventory(page);
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByLabel("Friendly name").fill("Preserved meter");
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Install meter configuration" })).toBeVisible();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#step-heading")).toHaveText("Circuits & CTs");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Friendly name")).toHaveValue("Preserved meter");
  await page.getByLabel("Friendly name").fill("Corrected meter");
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Install meter configuration" })).toBeVisible();

  const previews = frames.filter((frame) => frame.type.endsWith("/preview_meter_configuration"));
  expect(previews.map((frame) => frame.plan_id)).toEqual(["b".repeat(32), "c".repeat(32)]);
  expect(previews[1]?.configuration).toMatchObject({ meter: { friendly_name: "Corrected meter" },
    multi_reference_preparation_acknowledged: false });
  expect(operations(frames).filter((operation) => operation === "abandon_ct_config")).toHaveLength(1);
  expectLatestSourceBinding(frames, "abandon_ct_config");
});

test("review Back rejects stale drafts when the source changed externally", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { consumePlans: true, freshSourceChanged: true });
  await openInventory(page);
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByLabel("Friendly name").fill("Stale draft");
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Back" }).click();

  await expect(page.locator("#step-heading")).toHaveText("Circuits & CTs");
  await expect(page.getByRole("alert")).toContainText("source changed");
  await expect(page.getByRole("alert")).toContainText("drafts were not restored");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Friendly name")).toHaveValue("External meter");
  await page.getByLabel("Friendly name").fill("Reviewed external meter");
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByRole("button", { name: "Continue" }).click();

  const previews = frames.filter((frame) => frame.type.endsWith("/preview_meter_configuration"));
  expect(previews).toHaveLength(2);
  expect(previews[1]).toMatchObject({ plan_id: "c".repeat(32), source_sha256: "f".repeat(64),
    configuration: { meter: { friendly_name: "Reviewed external meter" } } });
  expect(JSON.stringify(previews[1]?.configuration)).not.toContain("Stale draft");
});

test("Meter Settings package choices stay in the canonical preview payload", async ({ page }) => {
  const frames = await mockHomeAssistant(page);
  await openInventory(page);
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("heading", { name: "Meter Settings", exact: true })).toBeVisible();
  await openAdvancedMeterSettings(page);
  await page.locator('[data-feature="status_fields"][data-board="0"]').check();
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Install meter configuration" })).toBeVisible();
  const preview = frames.find((frame) => frame.type.endsWith("/preview_meter_configuration"))!;
  expect(preview.configuration).toMatchObject({ power_quality: [false], status_fields: [true] });
});

test("package choices appear only after the first meter configuration load", async ({ page }) => {
  const frames = await mockHomeAssistant(page);
  await page.goto("/test/harness.html");
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();
  await expect(page.getByText(/Detected .* CTs on a .* connection/)).toBeVisible();
  await expect(page.locator('[data-feature="status_fields"]')).toHaveCount(0);
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole("heading", { name: "Meter Settings", exact: true })).toBeVisible();
  await openAdvancedMeterSettings(page);
  await page.locator('[data-feature="status_fields"][data-board="0"]').check();
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  const preview = frames.find((frame) => frame.type.endsWith("/preview_meter_configuration"))!;
  expect(preview.configuration).toMatchObject({ status_fields: [true] });
});

test("validation failure exposes evidence and performs only a user-requested rollback", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { outcome: "validation" });
  await openInventory(page);
  await reviewChannel(page, 1);
  await expect(page.getByLabel("Redacted substitution diff")).toContainText("<redacted>");
  await page.getByRole("button", { name: "Save and validate configuration" }).click();
  await expect(page.locator(".recovery-panel").filter({ hasText: "validation_failed" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Rollback" }).click();
  await expect(page.getByText("rolled_back", { exact: true })).toBeVisible();
  expect(operations(frames)).toEqual(expect.arrayContaining(["preview_meter_configuration", "apply_ct_config", "rollback_ct_config"]));
  expect(operations(frames)).not.toContain("compile_ct_config");
});

test("compile failure blocks upload after a distinct apply acknowledgement", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { outcome: "compile" });
  await openInventory(page);
  await reviewChannel(page, 1);
  await page.getByRole("button", { name: "Save and validate configuration" }).click();
  await expect(page.getByText("Validated", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Build firmware" }).click();
  await expect(page.locator(".recovery-panel").filter({ hasText: "compile_failed" }).first()).toBeVisible();
  expect(operations(frames).filter((value) => value === "apply_ct_config")).toHaveLength(1);
  expect(operations(frames).filter((value) => value === "compile_ct_config")).toHaveLength(1);
  expect(operations(frames)).not.toContain("install_ct_config");
});

test("verified configuration continues through calibration and finishes only from Summary", async ({ page }) => {
  const frames = await mockHomeAssistant(page);
  await page.goto("/test/harness.html");
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole("heading", { name: "Meter Settings", exact: true })).toBeVisible();
  await page.getByLabel("Friendly name").fill("Installed Meter");
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Install meter configuration" })).toBeVisible();
  await page.getByRole("button", { name: "Save and validate configuration" }).click();
  await page.getByRole("button", { name: "Build firmware" }).click();
  await page.getByRole("button", { name: "Install on meter", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Install meter configuration" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Setup Device" })).toHaveCount(0);
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole("heading", { name: "Calibration Plan", exact: true })).toBeVisible();
  await page.getByRole("radio", { name: /Full calibration/ }).check();
  await expect(page.getByRole("heading", { name: "Safety", exact: true })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip offset calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator('.reference-block input').fill("120");
  await page.getByRole("button", { name: "Check stability" }).click();
  await page.getByRole("button", { name: "Calibrate voltage" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip current calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Restart", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Restart and verify" }).click();
  await expect(page.getByRole("heading", { name: "Save Calibration", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Review and save calibration to YAML" }).click();
  await page.getByRole("button", { name: "Write verified gains to ESPHome" }).click();
  await page.getByRole("button", { name: "Build firmware" }).click();
  await page.getByRole("button", { name: "Install calibrated firmware" }).click();

  await expect(page.getByRole("heading", { name: "Setup complete", exact: true })).toBeVisible();
  await expect(page.getByText("Installed electrical profile")).toBeVisible();
  await expect(page.getByText("Configuration installed in ESPHome.", { exact: true })).toBeVisible();
  await page.locator('[data-action="finish"]').click();
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();
  const ordered = operations(frames);
  expect(ordered.indexOf("install_ct_config")).toBeLessThan(ordered.indexOf("start_session"));
  expect(ordered.indexOf("start_session")).toBeLessThan(ordered.indexOf("restart_and_verify"));
});

test("split-phase Wi-Fi configuration previews, installs, and calibrates a bidirectional main service", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { slowClearCalibration: true });
  await page.goto("/test/harness.html");
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();
  await page.locator('[data-action="continue"]').click();
  await openAdvancedMeterSettings(page);
  await page.locator('[data-feature="status_fields"][data-board="0"]').check();
  await page.getByLabel("Reporting interval").selectOption("10");
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByLabel("CT1 role").selectOption("grid");
  await page.getByLabel("CT2 role").selectOption("grid");
  await expect(page.getByRole("region", { name: "Automatic totals", exact: true }).getByRole("row", {
    name: "Mains CT1 + CT2 Power · Current (internal) · Energy", exact: true,
  })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Install meter configuration" })).toBeVisible();
  const preview = frames.find((frame) => frame.type.endsWith("/preview_meter_configuration"))!;
  expect(preview.configuration).toEqual({
    meter: { friendly_name: "Energy meter", electrical_system: "split_phase_120_240", line_frequency_hz: 60, update_interval_s: 10,
      voltage_layout: "standard", voltage_references: [{ reference_id: "main", label: "Main", phase_label: "A/B", nominal_voltage_v: 120,
        transformer_model_id: "default", gain_voltage: 7305, group_keys: ["main_1", "main_2"] }] },
    channels: [
      { channel: 1, enabled: true, name: "CT1", model_id: "cs-ct-200a", reporting_multiplier: 1, role: "grid", voltage_reference_id: "main", custom_gain_ct: null, custom_label: null, burden_output_acknowledged: false },
      { channel: 2, enabled: true, name: "CT2", model_id: "cs-ct-200a", reporting_multiplier: 1, role: "grid", voltage_reference_id: "main", custom_gain_ct: null, custom_label: null, burden_output_acknowledged: false },
      { channel: 3, enabled: true, name: "CT3", model_id: "cs-ct-200a", reporting_multiplier: 1, role: "branch", voltage_reference_id: "main", custom_gain_ct: null, custom_label: null, burden_output_acknowledged: false },
      { channel: 4, enabled: true, name: "CT4", model_id: "custom", reporting_multiplier: 1, role: "branch", voltage_reference_id: "main", custom_gain_ct: 27518, custom_label: "Custom CT", burden_output_acknowledged: true },
      { channel: 5, enabled: true, name: "CT5", model_id: "cs-ct-200a", reporting_multiplier: 1, role: "branch", voltage_reference_id: "main", custom_gain_ct: null, custom_label: null, burden_output_acknowledged: false },
      { channel: 6, enabled: true, name: "CT6", model_id: "cs-ct-200a", reporting_multiplier: 1, role: "branch", voltage_reference_id: "main", custom_gain_ct: null, custom_label: null, burden_output_acknowledged: false },
    ],
    aggregates: [{ aggregate_id: "auto-mains", name: "Mains", role: "grid", channels: [1, 2], measurement_method: "two_ct_sum", parent_id: null, energy_mode: "bidirectional", expose_power: true, expose_current: false }],
    power_quality: [false], status_fields: [true], multi_reference_preparation_acknowledged: false,
  });
  await page.getByRole("button", { name: "Save and validate configuration" }).click();
  await page.getByRole("button", { name: "Build firmware" }).click();
  await page.getByRole("button", { name: "Install on meter", exact: true }).click();
  await page.locator('[data-action="continue"]').click();
  await page.getByRole("radio", { name: /Full calibration/ }).check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip offset calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator('.reference-block input').fill("120");
  await page.getByRole("button", { name: "Check stability" }).click();
  await page.getByRole("button", { name: "Calibrate voltage" }).click();
  await expect(page.getByText("Voltage calibration complete for Main Board.")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip current calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Restart", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Restart and verify" }).click();
  await expect(page.getByRole("heading", { name: "Save Calibration", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Review and save calibration to YAML" }).click();
  await page.getByRole("button", { name: "Write verified gains to ESPHome" }).click();
  await page.getByRole("button", { name: "Build firmware" }).click();
  await page.getByRole("button", { name: "Install calibrated firmware" }).click();
  await expect(page.getByRole("heading", { name: "Setup complete", exact: true })).toBeVisible();
  await expect(page.getByText("Installed electrical profile")).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();
  expect(operations(frames)).toEqual(expect.arrayContaining(["restart_and_verify", "preview_calibrated_gains", "clear_calibration_flash"]));
});

test("one-add-on 230 V configuration preserves scaled PQ circuit semantics without harmonic or peak entities", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { addons: 1, scenario: "single-phase-pq" });
  await openInventory(page);
  await page.getByRole("tab", { name: "Add-on 1" }).click();
  await expect(page.getByLabel("CT7 multiplier")).toHaveValue("4");
  await expect(page.locator(".ct-step")).toContainText("Divided gain1375");
  await expect(page.locator(".ct-step")).not.toContainText(/harmonic|peak/i);
  await page.getByLabel("CT7 name").fill("Scaled CT7");
  await page.getByRole("button", { name: "Continue" }).click();
  const preview = frames.find((frame) => frame.type.endsWith("/preview_meter_configuration"))!;
  expect(preview.configuration).toEqual(expect.objectContaining({ meter: expect.objectContaining({ electrical_system: "single_phase_230", line_frequency_hz: 50 }),
    power_quality: [false, true], channels: expect.arrayContaining([expect.objectContaining({ channel: 7, reporting_multiplier: 4 })]),
    aggregates: [] }));
  expect((preview.configuration as { meter: { voltage_references: Array<{ reference_id: string; nominal_voltage_v: number }> } }).meter.voltage_references
    .map(({ reference_id, nominal_voltage_v }) => ({ reference_id, nominal_voltage_v })))
    .toEqual([{ reference_id: "main", nominal_voltage_v: 230 }, { reference_id: "addon1", nominal_voltage_v: 230 }]);
});

test("three voltage references cover each three-phase board exactly once and calibrate reference by reference", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { addons: 2 });
  await page.goto("/test/harness.html");
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole("heading", { name: "Meter Settings", exact: true })).toBeVisible();
  await expect(page.getByLabel("Multi-reference preparation acknowledgement")).not.toBeChecked();
  await page.getByLabel("Electrical system").selectOption("three_phase");
  await page.getByLabel("Line frequency").selectOption("50");
  await page.locator('[data-section="advanced-voltage-options"] summary').click();
  await expect(page.locator(".voltage-reference-card")).toHaveCount(3);
  await page.locator('[data-section="advanced-meter-settings"] summary').click();
  await page.getByLabel("Multi-reference preparation acknowledgement").check();
  await page.getByLabel("Confirm electrical profile").check();
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  const preview = frames.find((frame) => frame.type.endsWith("/preview_meter_configuration"))!;
  const configuration = preview.configuration as { meter: { electrical_system: string; line_frequency_hz: number;
    voltage_references: Array<{ reference_id: string; group_keys: string[] }> };
    multi_reference_preparation_acknowledged: boolean };
  expect(configuration.meter.electrical_system).toBe("three_phase");
  expect(configuration.meter.line_frequency_hz).toBe(50);
  expect(configuration.meter.voltage_references.map(({ reference_id, group_keys }) => ({ reference_id, group_keys }))).toEqual([
    { reference_id: "main", group_keys: ["main_1", "main_2"] },
    { reference_id: "addon1", group_keys: ["addon1_1", "addon1_2"] },
    { reference_id: "addon2", group_keys: ["addon2_1", "addon2_2"] },
  ]);
  expect(configuration.multi_reference_preparation_acknowledged).toBe(true);
  await page.getByRole("button", { name: "Save and validate configuration" }).click();
  await page.getByRole("button", { name: "Build firmware" }).click();
  await page.getByRole("button", { name: "Install on meter", exact: true }).click();
  await page.locator('[data-action="continue"]').click();
  await page.getByLabel(/Full calibration/).check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip offset calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  for (const [board, label] of [[0, "Main Board"], [1, "Add-on 1"], [2, "Add-on 2"]] as const) {
    await page.getByRole("tab", { name: label }).click();
    await page.locator('.reference-block input').fill("230");
    await page.getByRole("button", { name: "Check stability" }).click();
    await page.getByRole("button", { name: "Calibrate voltage" }).click();
    await expect(page.getByText(`Voltage calibration complete for ${label}.`)).toBeVisible();
    expect(board).toBeGreaterThanOrEqual(0);
  }
  const calibrations = frames.filter((frame) => frame.type.endsWith("/calibrate_voltage"));
  expect(calibrations.map((frame) => frame.reference_id)).toEqual(["main", "addon1", "addon2"]);
  expect(calibrations.every((frame) => frame.confirm_iteration === true && frame.reference_voltage === 230)).toBe(true);
});

test("automatic role pairs remain distinct without preset aggregate controls", async ({ page }) => {
  const frames = await mockHomeAssistant(page);
  await openInventory(page);
  await expect(page.getByLabel("Preset channels")).toHaveCount(0);
  await page.getByLabel("CT1 role").selectOption("two_pole");
  await page.getByLabel("CT2 role").selectOption("two_pole");
  await page.getByLabel("CT3 role").selectOption("subpanel");
  await page.getByLabel("CT4 role").selectOption("subpanel");
  await page.getByLabel("CT5 role").selectOption("grid");
  await page.getByLabel("CT6 role").selectOption("grid");
  const totals = page.getByRole("region", { name: "Automatic totals", exact: true });
  for (const row of [
    "Mains CT5 + CT6 Power · Current (internal) · Energy",
    "Subpanel CT3 + CT4 Power · Current (internal) · Energy",
    "Two-pole circuit CT1 + CT2 Power · Current (internal) · Energy",
  ]) await expect(totals.getByRole("row", { name: row, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  const preview = frames.find((frame) => frame.type.endsWith("/preview_meter_configuration"))!;
  expect(preview.configuration).toEqual(expect.objectContaining({
    channels: expect.arrayContaining([
      expect.objectContaining({ channel: 1, enabled: true, role: "two_pole" }),
      expect.objectContaining({ channel: 2, enabled: true, role: "two_pole" }),
      expect.objectContaining({ channel: 3, enabled: true, role: "subpanel" }),
      expect.objectContaining({ channel: 4, enabled: true, role: "subpanel" }),
      expect.objectContaining({ channel: 5, enabled: true, role: "grid" }),
      expect.objectContaining({ channel: 6, enabled: true, role: "grid" }),
    ]),
    aggregates: [
      { aggregate_id: "auto-mains", name: "Mains", role: "grid", channels: [5, 6], measurement_method: "two_ct_sum", parent_id: null, energy_mode: "bidirectional", expose_power: true, expose_current: false },
      { aggregate_id: "auto-subpanel", name: "Subpanel", role: "subpanel", channels: [3, 4], measurement_method: "two_ct_sum", parent_id: null, energy_mode: "consumption", expose_power: true, expose_current: false },
      { aggregate_id: "auto-two-pole", name: "Two-pole circuit", role: "two_pole", channels: [1, 2], measurement_method: "two_ct_sum", parent_id: null, energy_mode: "consumption", expose_power: true, expose_current: false },
    ],
  }));
});

test("42-channel separate install/rebind leads through main CT evidence and exact restart verification", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { addons: 6, calibration: "main-success" });
  await openInventory(page);
  await expect(page.locator('[data-board-tab]')).toHaveCount(7);
  await page.getByRole("tab", { name: "Add-on 1" }).click();
  await expect(page.locator('[data-ct-row][aria-label="CT7"] [data-voltage-reference]')).toContainText("Add-on 1");
  await reachCurrent(page, 42);
  await page.getByRole("tab", { name: "Main Board" }).click();
  await page.getByLabel("CT1 reference").fill("5");
  await page.getByRole("button", { name: "Check stability" }).click();
  await expect(page.getByLabel("current Current group 1 stability evidence")).toContainText("CT1");
  await expect(page.getByLabel("current Current group 1 stability evidence")).toContainText("5.00 A");
  await expect(page.getByText("Standard deviation")).toHaveCount(0);
  await page.getByRole("button", { name: "Calibrate current" }).click();
  await expect(page.getByLabel("Calibration evidence").first()).toContainText("Saved in flash: Yes");
  await expect(page.getByText("Current calibration complete for CT1–CT3.")).toBeVisible();
  await page.getByRole("button", { name: "Skip current calibration" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Restart and verify" }).click();
  await expect(page.getByRole("heading", { name: "Save Calibration", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Review and save calibration to YAML" }).click();
  await expect(page.getByRole("heading", { name: "Save verified calibration" })).toBeVisible();
  await page.getByRole("region", { name: "Review changes" }).getByText("Technical details", { exact: true }).click();
  await expect(page.getByLabel("Redacted substitution diff")).toBeVisible();
  await page.getByRole("button", { name: "Write verified gains to ESPHome" }).click();
  await page.getByRole("button", { name: "Build firmware" }).click();
  await page.getByRole("button", { name: "Install calibrated firmware" }).click();
  await expect(page.getByRole("heading", { name: "Setup complete", exact: true })).toBeVisible();
  await expect(page.getByText(/Calibration was saved to YAML/)).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();

  const ordered = operations(frames);
  expect(ordered.indexOf("apply_ct_config")).toBeLessThan(ordered.indexOf("compile_ct_config"));
  expect(ordered.indexOf("compile_ct_config")).toBeLessThan(ordered.indexOf("install_ct_config"));
  expect(frames.find((frame) => frame.type.endsWith("/preview_calibrated_gains"))).toMatchObject({ changes: [] });
  expect(frames.find((frame) => frame.type.endsWith("/acknowledge_safety"))).toMatchObject({ acknowledged: true });
  expect(frames.find((frame) => frame.type.endsWith("/calibrate_current"))).toMatchObject({ references: [{ channel: 1,
    reference: 5 }], pending_multipliers: [], confirm_iteration: true });
  expect(ordered).toContain("restart_and_verify");
  expect(ordered.indexOf("restart_and_verify")).toBeLessThan(ordered.indexOf("preview_calibrated_gains"));
  expect(ordered.indexOf("install_ct_config", ordered.indexOf("preview_calibrated_gains")))
    .toBeLessThan(ordered.indexOf("clear_calibration_flash"));
});

test("add-on CT42 indeterminate disconnect never auto-represses calibration", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { addons: 6, calibration: "addon-indeterminate" });
  await openInventory(page);
  await reachCurrent(page, 42);
  await page.getByRole("tab", { name: "Add-on 6" }).click();
  await page.getByRole("button", { name: "Group 14" }).click();
  await page.getByLabel("CT42 reference").fill("25");
  await page.getByRole("button", { name: "Check stability" }).click();
  await page.getByRole("button", { name: "Calibrate current" }).click();
  await expect(page.getByText("Calibration outcome indeterminate")).toBeVisible();
  await expect(page.getByText("No automatic retry will be made.")).toBeVisible();
  await page.waitForTimeout(150);
  expect(operations(frames).filter((value) => value === "calibrate_current")).toHaveLength(1);
  expect(frames.find((frame) => frame.type.endsWith("/calibrate_current"))).toMatchObject({ references: [{ channel: 42,
    reference: 25 }], confirm_iteration: true });
  expect(operations(frames)).not.toContain("restart_and_verify");
  await page.getByRole("button", { name: "Reconnect and inspect" }).click();
  await expect.poll(() => operations(frames).filter((value) => value === "get_session").length).toBe(1);
  expect(operations(frames).filter((value) => value === "calibrate_current")).toHaveLength(1);
});

// These are deliberately browser-level tests: the assertions inspect the WebSocket
// frames that caused each route change, not panel implementation state.
const mutationOperations = new Set([
  "adopt_device", "preview_meter_configuration", "preview_ct_config", "apply_ct_config",
  "compile_ct_config", "install_ct_config", "abandon_ct_config", "set_ha_labels", "start_session",
  "acknowledge_safety", "skip_offset_calibration", "calibrate_voltage", "calibrate_current",
  "calibrate_offset", "restart_and_verify", "complete_calibration_without_changes",
  "preview_calibrated_gains", "clear_calibration_flash",
]);

function mutations(frames: Frame[]) {
  return frames.filter((frame) => mutationOperations.has(frame.type.split("/").at(-1)!));
}

async function openAdvancedMeterSettings(page: Page): Promise<void> {
  await page.locator('[data-section="advanced-meter-settings"] summary').click();
}

function expectLatestSourceBinding(frames: Frame[], operation: string) {
  const frame = frames.filter((item) => item.type.endsWith(`/${operation}`)).at(-1);
  expect(frame, `${operation} request`).toBeDefined();
  const before = frames.slice(0, frames.lastIndexOf(frame!));
  const responses = before.map((item) => item.response).filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
  if (operation === "preview_meter_configuration" || operation === "preview_ct_config") {
    const source = responses.filter((item) => "plan_id" in item && "source_sha256" in item).at(-1);
    expect(source, `source response before ${operation}`).toBeDefined();
    expect(frame!).toMatchObject({ plan_id: source!.plan_id, source_sha256: source!.source_sha256 });
  } else if (operation === "preview_calibrated_gains") {
    const verification = responses.filter((item) => "verification_id" in item).at(-1);
    const activeSession = responses.filter((item) => "session_id" in item).at(-1);
    expect(verification, "restart response before gain handoff").toBeDefined();
    expect(activeSession, "session response before gain handoff").toBeDefined();
    expect(frame!).toMatchObject({ verification_id: verification!.verification_id, session_id: activeSession!.session_id });
  } else {
    const transactionResponse = responses.filter((item) => "transaction_id" in item && "source_sha256" in item).at(-1);
    expect(transactionResponse, `transaction response before ${operation}`).toBeDefined();
    expect(frame!).toMatchObject({ transaction_id: transactionResponse!.transaction_id });
    if ("source_sha256" in frame!) expect(frame!.source_sha256).toBe(transactionResponse!.source_sha256);
    if (operation === "clear_calibration_flash") {
      const verification = responses.filter((item) => "verification_id" in item).at(-1);
      const activeSession = responses.filter((item) => "session_id" in item).at(-1);
      expect(verification, "restart response before flash clear").toBeDefined();
      expect(activeSession, "session response before flash clear").toBeDefined();
      expect(frame!).toMatchObject({ verification_id: verification!.verification_id, session_id: activeSession!.session_id });
    }
  }
}

async function openGuidedMeter(page: Page) {
  await page.goto("/test/harness.html");
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();
  await page.locator('[data-action="continue"]').click();
}

async function installConfiguration(page: Page) {
  await page.getByRole("button", { name: "Save and validate configuration" }).click();
  await page.getByRole("button", { name: "Build firmware" }).click();
  await page.getByRole("button", { name: "Install on meter" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

async function calibrateVoltageToRestart(page: Page) {
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator(".reference-block input").fill("120");
  await page.getByRole("button", { name: "Check stability" }).click();
  await page.getByRole("button", { name: "Calibrate voltage" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip current calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Restart", exact: true })).toBeVisible();
}

async function installVerifiedGains(page: Page) {
  await page.getByRole("button", { name: "Write verified gains to ESPHome" }).click();
  await page.getByRole("button", { name: "Build firmware" }).click();
  await page.getByRole("button", { name: "Install calibrated firmware" }).click();
}

async function reopenAtCalibrationPlan(page: Page) {
  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Choose calibration" })).toBeVisible();
}

test("journey 1: new meter imports, installs, then keeps calibration", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { importable: true, setupEvent: "device", oneDevice: true });
  await page.goto("/test/harness.html");
  await expect(page.getByText("Meter imported into ESPHome Builder.")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Meter Settings", exact: true }).first()).toBeVisible();
  await page.getByLabel("Friendly name").fill("Imported meter");
  await page.getByLabel("Confirm electrical profile").check();
  await page.locator('[data-action="continue-meter-settings"]').click();
  expect(mutations(frames).filter((frame) => !frame.type.endsWith("/adopt_device"))).toEqual([]);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Install meter configuration" })).toBeVisible();
  expectLatestSourceBinding(frames, "preview_meter_configuration");
  await installConfiguration(page);
  await page.getByLabel(/Keep existing calibration/).click();
  await expect(page.getByRole("heading", { name: "Setup complete", exact: true })).toBeVisible();
  await expect(page.getByText("Configuration installed in ESPHome.", { exact: true })).toBeVisible();
  await expect(page.getByText("Existing calibration was kept unchanged.").first()).toBeVisible();
  for (const operation of ["apply_ct_config", "compile_ct_config", "install_ct_config"]) expectLatestSourceBinding(frames, operation);
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();
});

test("journey 2: new standard calibration reaches restart before gain save", async ({ page }) => {
  const frames = await mockHomeAssistant(page);
  await openGuidedMeter(page);
  await page.locator('[data-action="continue-meter-settings"]').click();
  expect(mutations(frames)).toEqual([]);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/Standard calibration/).click();
  await expect(page.getByRole("heading", { name: "Safety", exact: true })).toBeVisible();
  await calibrateVoltageToRestart(page);
  await page.getByRole("button", { name: "Restart and verify" }).click();
  await expect(page.getByRole("heading", { name: "Save Calibration", exact: true })).toBeVisible();
  expect(operations(frames)).not.toContain("preview_calibrated_gains");
  await page.getByRole("button", { name: "Review and save calibration to YAML" }).click();
  await expect(page.getByRole("heading", { name: "Save verified calibration" })).toBeVisible();
  expectLatestSourceBinding(frames, "preview_calibrated_gains");
  await installVerifiedGains(page);
  await expect(page.getByRole("heading", { name: "Setup complete", exact: true })).toBeVisible();
  for (const operation of ["apply_ct_config", "compile_ct_config", "install_ct_config", "clear_calibration_flash"])
    expectLatestSourceBinding(frames, operation);
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();
});

test("restart handoff can be kept in flash before any YAML preview", async ({ page }) => {
  const frames = await mockHomeAssistant(page);
  await openGuidedMeter(page);
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/Standard calibration/).click();
  await calibrateVoltageToRestart(page);
  await page.getByRole("button", { name: "Restart and verify" }).click();

  await expect(page.getByRole("heading", { name: "Save Calibration", exact: true })).toBeVisible();
  expect(operations(frames)).not.toContain("preview_calibrated_gains");
  await page.getByRole("button", { name: "Keep calibration in meter flash" }).click();
  await expect(page.getByRole("heading", { name: "Setup complete", exact: true })).toBeVisible();
  await expect(page.getByText("Calibration is stored in meter flash. Installing firmware may replace it.").first()).toBeVisible();
  expect(operations(frames)).not.toContain("preview_calibrated_gains");
  expect(operations(frames)).not.toContain("clear_calibration_flash");
});

test("journey 3: helper-managed full calibration keeps flash authority when not handed off", async ({ page }) => {
  const frames = await mockHomeAssistant(page);
  await openInventory(page);
  expect(mutations(frames)).toEqual([]);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/Full calibration/).check();
  await expect(page.getByRole("heading", { name: "Safety", exact: true })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Offset", exact: true }).first()).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Check measured readiness" }).click();
  await page.getByRole("button", { name: "Run Stage 1 calibration" }).click();
  await page.getByRole("button", { name: /2\. Active\/reactive power offset/ }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Check measured readiness" }).click();
  await page.getByRole("button", { name: "Run Stage 2 calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip voltage calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip current calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Restart and verify" }).click();
  await expect(page.getByRole("heading", { name: "Setup complete", exact: true })).toBeVisible();
  await expect(page.getByText("Offset calibration remains stored in meter flash by design.").first()).toBeVisible();
  expect(operations(frames).filter((operation) => operation === "calibrate_offset")).toHaveLength(2);
  expect(operations(frames)).not.toContain("preview_calibrated_gains");
});

test("journey 4: legacy manage requires review before migration preview", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { guidedMode: "legacy" });
  await openGuidedMeter(page);
  await expect(page.getByRole("heading", { name: "Review Existing Setup", exact: true }).first()).toBeVisible();
  expect(mutations(frames)).toEqual([]);
  await page.getByRole("button", { name: "Review and manage with helper" }).click();
  await expect(page.getByRole("heading", { name: "Meter Settings", exact: true }).first()).toBeVisible();
  await page.getByLabel("Confirm electrical profile").check();
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByLabel("I reviewed used/unused channels and circuit roles").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Install Configuration", exact: true })).toBeVisible();
  await page.getByRole("region", { name: "Review changes" }).getByText("Technical details", { exact: true }).click();
  await expect(page.getByLabel("Redacted substitution diff")).toBeVisible();
  await installConfiguration(page);
  await page.getByLabel(/Keep existing calibration/).click();
  await expect(page.getByRole("heading", { name: "Review complete", exact: true })).toBeVisible();
  await expect(page.getByText("Migration installed.")).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();
});

test("journey 5: legacy calibrate-only never previews configuration", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { guidedMode: "legacy" });
  await openGuidedMeter(page);
  expect(mutations(frames)).toEqual([]);
  await page.getByRole("button", { name: "Keep ESPHome configuration and calibrate only" }).click();
  await page.getByLabel(/Standard calibration/).click();
  await expect(page.getByRole("heading", { name: "Safety", exact: true })).toBeVisible();
  await calibrateVoltageToRestart(page);
  await page.getByRole("button", { name: "Restart and verify" }).click();
  await expect(page.getByRole("heading", { name: "Save Calibration", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Review and save calibration to YAML" }).click();
  await expect(page.getByRole("heading", { name: "Save verified calibration" })).toBeVisible();
  await installVerifiedGains(page);
  await expect(page.getByRole("heading", { name: "Review complete", exact: true })).toBeVisible();
  await expect(page.getByText("Calibration gains were saved; the remaining legacy configuration was not migrated.").first()).toBeVisible();
  expectLatestSourceBinding(frames, "preview_calibrated_gains");
  for (const operation of ["apply_ct_config", "compile_ct_config", "install_ct_config", "clear_calibration_flash"])
    expectLatestSourceBinding(frames, operation);
  expect(operations(frames)).not.toContain("preview_meter_configuration");
  expect(operations(frames)).not.toContain("preview_ct_config");
});

test("journey 6: runtime-only skips every source configuration command", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { guidedMode: "runtime" });
  await openGuidedMeter(page);
  await expect(page.getByRole("heading", { name: "Choose calibration" })).toBeVisible();
  await expect(page.getByText("ESPHome source editing is unavailable.")).toBeVisible();
  await expect(page.getByText(/Circuit names, CT models, roles, multipliers, entities, and totals cannot be changed/)).toBeVisible();
  expect(mutations(frames)).toEqual([]);
  const classifiedAt = frames.length;
  await page.getByLabel(/Standard calibration/).check();
  await expect(page.getByRole("heading", { name: "Safety", exact: true })).toBeVisible();
  await calibrateVoltageToRestart(page);
  await page.getByRole("button", { name: "Restart and verify" }).click();
  await expect(page.getByRole("heading", { name: "Setup complete", exact: true })).toBeVisible();
  await expect(page.getByText("Calibration is stored in meter flash. Installing firmware may replace it.").first()).toBeVisible();
  const afterClassification = operations(frames.slice(classifiedAt));
  expect(afterClassification).not.toContain("get_meter_configuration");
  expect(afterClassification.filter((operation) => ["preview_meter_configuration", "preview_ct_config", "set_ha_labels",
    "apply_ct_config", "compile_ct_config", "install_ct_config", "abandon_ct_config"].includes(operation))).toEqual([]);
});

test("journey 7: imported existing configuration enters legacy review", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { importable: true, guidedMode: "legacy", setupEvent: "devices" });
  await page.goto("/test/harness.html");
  await page.locator('[data-action="rescan"]').click();
  expect(mutations(frames)).toEqual([]);
  await page.getByRole("button", { name: "Import" }).first().click();
  await expect(page.getByText("Meter imported into ESPHome Builder.")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Review Existing Setup", exact: true }).first()).toBeVisible();
  expect(mutations(frames).filter((frame) => !frame.type.endsWith("/adopt_device"))).toEqual([]);
});

test("journey 8: an active normal transaction resumes at Install Configuration", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { activeWork: "normal" });
  await page.goto("/test/harness.html");
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();
  await expect(page.getByRole("heading", { name: "Install meter configuration" })).toBeVisible();
  expect(mutations(frames)).toEqual([]);
  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).first().click();
  await expect(page.getByRole("heading", { name: "Install meter configuration" })).toBeVisible();
  expect(mutations(frames)).toEqual([]);
  expect(operations(frames).filter((operation) => operation === "get_active_work").length).toBeGreaterThan(1);
});

test("a legacy migration transaction resumes without repeating the branch choice", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { activeWork: "normal", guidedMode: "legacy" });
  await page.goto("/test/harness.html");
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();

  await expect(page.getByRole("heading", { name: "Install reviewed helper configuration" })).toBeVisible();
  expect(mutations(frames)).toEqual([]);
});

for (const [activeWork, heading] of [["safety", "Safety"], ["ready", "Voltage"]] as const) {
  test(`a legacy calibration-only ${activeWork} session resumes at ${heading}`, async ({ page }) => {
    const frames = await mockHomeAssistant(page, { activeWork, guidedMode: "legacy" });
    await page.goto("/test/harness.html");
    await page.locator('[data-action="rescan"]').click();
    await page.locator('[data-action="configure-device"]').first().click();

    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    expect(mutations(frames)).toEqual([]);
  });
}

test("journey 9: an active calibration handoff resumes at Save Calibration", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { activeWork: "handoff" });
  await page.goto("/test/harness.html");
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();
  await expect(page.getByRole("heading", { name: "Save verified calibration" })).toBeVisible();
  expect(mutations(frames)).toEqual([]);
  await page.reload();
  await page.getByRole("button", { name: "Open setup" }).first().click();
  await expect(page.getByRole("heading", { name: "Save verified calibration" })).toBeVisible();
  expect(mutations(frames)).toEqual([]);
  expect(operations(frames).filter((operation) => operation === "get_active_work").length).toBeGreaterThan(1);
});

test("a legacy calibration-only handoff resumes without repeating the branch choice", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { activeWork: "handoff", guidedMode: "legacy" });
  await page.goto("/test/harness.html");
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();

  await expect(page.getByRole("heading", { name: "Save verified calibration" })).toBeVisible();
  expect(mutations(frames)).toEqual([]);
});

test("journey 10: mobile phases only advance as the conditional flow advances", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { guidedMode: "legacy" });
  await page.setViewportSize({ width: 390, height: 844 });
  await openGuidedMeter(page);
  const progress = page.locator(".mobile-progress");
  await expect(progress).toContainText(/Phase \d+ of \d+/);
  const phase = async () => Number((await progress.textContent())?.match(/Phase (\d+) of/)?.[1]);
  const first = await phase();
  expect(mutations(frames)).toEqual([]);
  await page.getByRole("button", { name: "Review and manage with helper" }).click();
  await page.getByLabel("Confirm electrical profile").check();
  await page.locator('[data-action="continue-meter-settings"]').click();
  const second = await phase();
  await page.getByLabel("I reviewed used/unused channels and circuit roles").check();
  await page.getByRole("button", { name: "Continue" }).click();
  const third = await phase();
  expect(second).toBeGreaterThan(first);
  expect(third).toBeGreaterThan(second);
});
