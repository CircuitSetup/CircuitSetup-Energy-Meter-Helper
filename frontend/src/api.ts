import type {
  ActiveWork,
  BoardPackageOptions,
  CalibrationResult,
  ConnectionType,
  CtChange,
  CtInventory,
  LabelUpdateResult,
  DiscoveredDevice,
  MeterTopology,
  MeterSettingsDraft,
  ElectricalSystem,
  LineFrequencyHz,
  OffsetCalibrationResult,
  OffsetReadinessResult,
  OffsetTable,
  RestartVerificationResult,
  SessionStatus,
  SetupSnapshot,
  StabilityResult,
  TransactionStatus,
} from "./types";
import type { FirmwareOption } from "./firmware-installer";

export interface HomeAssistant {
  callWS<T>(message: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(
      callback: (message: T) => void,
      message: Record<string, unknown>,
    ): Promise<() => void>;
  };
}

const PREFIX = "circuitsetup_energy_meter_helper/";
const PRIVATE_FIELD = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i;
const SECRET_VALUE = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i;
const CONTROL = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/;
const PROPERTY_CONTROL = /[\u0000-\u001f\u007f-\u009f]/;
const SETUP_STATES = new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]);
const TRANSACTION_STATES = new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]);
const SESSION_STATES = new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "partial", "indeterminate", "verified", "cancelled"]);
const CONNECTIONS = new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]);
const ELECTRICAL_SYSTEMS = new Set(["split_phase_120_240", "single_phase_230", "three_phase_120_208", "three_phase_230_400", "custom"]);
const EVIDENCE_SOURCES = new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]);
const PHASES = new Set(["A", "B", "C"]);
const JOB_STAGES = new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]);
const TRANSACTION_EVIDENCE = new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]);
const TRANSACTION_PROGRESS = new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]);
const PREFLIGHT_CODES = new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]);
const AUTHORITATIVE_EVIDENCE = new Set(["config_project", "config_packages", "native_project"]);
const CHANGE_KEY = /^(?:meter|voltage_reference|channel|aggregate|package)\.[a-z0-9_.-]+$/;
const MAC = /^[0-9a-f]{12}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const SERVER_ID = /^[0-9a-f]{32}$/;
const CONFIGURATION = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/;
const FIRMWARE_PRODUCT_ID = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const ESPHOME_VERSION = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/;
const TRANSACTION_OPERATIONS = new Set(["preview_ct_config", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]);
const OFFSET_CAPABILITIES = new Set(["available", "unavailable", "invalid"]);
const OFFSET_DISPOSITIONS = new Set(["not_started", "in_progress", "completed", "skipped", "partial"]);
const OFFSET_STAGE_STATES = new Set(["not_started", "in_progress", "completed", "skipped", "partial", "indeterminate"]);
const OFFSET_RESULT_STATES = new Set(["applied_pending_restart_verification", "partial", "indeterminate"]);

type PublicRecord = Record<string, unknown>;
type Validator<T> = (value: unknown) => T;
type CalibrationExpectation =
  | { target: "voltage"; groupKey: string; reference: number }
  | { target: "current"; references: Array<{ channel: number; reference: number; rawReference: number }> };

function record(value: unknown, label: string): PublicRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} response is invalid`);
  return value as PublicRecord;
}
function array(value: unknown, label: string, limit = 100): unknown[] {
  if (!Array.isArray(value) || value.length > limit) throw new Error(`${label} response is invalid`);
  return value;
}
function string(value: unknown, label: string, nullable = false): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} response is invalid`);
  return value;
}
function number(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} response is invalid`);
  return value;
}
function integer(value: unknown, label: string): number {
  const result = number(value, label);
  if (!Number.isInteger(result)) throw new Error(`${label} response is invalid`);
  return result;
}
function boolean(value: unknown, label: string, nullable = false): boolean | null {
  if (nullable && value === null) return null;
  if (typeof value !== "boolean") throw new Error(`${label} response is invalid`);
  return value;
}
function enumeration(value: unknown, values: Set<string>, label: string): string {
  const result = string(value, label);
  if (!values.has(result!)) throw new Error(`${label} response is invalid`);
  return result!;
}
function optionalString(value: unknown, label: string): void {
  if (value !== undefined) string(value, label, true);
}
function close(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(actual), Math.abs(expected));
}
function exactKeys(item: PublicRecord, keys: readonly string[], label: string): void {
  const actual = Object.keys(item);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) throw new Error(`${label} response is invalid`);
}
function exactStrings(actual: string[], expected: string[]): boolean {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function device(value: unknown, label: string): void {
  const item = record(value, label);
  string(item.entry_id, label); string(item.title, label); string(item.project_name, label);
  string(item.project_version, label, true); boolean(item.importable, label, true); string(item.configuration, label, true);
}
function setup(value: unknown, label: string): SetupSnapshot {
  const item = record(value, label); enumeration(item.state, SETUP_STATES, label);
  array(item.devices, label).forEach((entry) => device(entry, label));
  if (item.configuration_authoritative !== undefined) boolean(item.configuration_authoritative, label);
  if (item.bound_device_id !== undefined && item.bound_device_id !== null) string(item.bound_device_id, label);
  if (item.installer_intent !== undefined) {
    const intent = record(item.installer_intent, label); const count = integer(intent.addon_count, label);
    if (count < 0 || count > 6) throw new Error(`${label} response is invalid`);
    const connection = enumeration(intent.connection_type, CONNECTIONS, label);
    if (connection === "unknown") throw new Error(`${label} response is invalid`);
    if ((intent.power_quality === undefined) !== (intent.status_fields === undefined)) {
      throw new Error(`${label} response is invalid`);
    }
    if (intent.power_quality !== undefined) packageOptions(intent, label, count + 1);
    const productId = intent.firmware_product_id;
    const version = intent.esphome_version;
    if ((productId === undefined) !== (version === undefined)
      || productId !== undefined && (typeof productId !== "string" || productId.length > 160 || !FIRMWARE_PRODUCT_ID.test(productId))
      || version !== undefined && (typeof version !== "string" || version.length > 160 || !ESPHOME_VERSION.test(version))) {
      throw new Error(`${label} response is invalid`);
    }
    if ((intent.electrical_system === undefined) !== (intent.line_frequency_hz === undefined)
      || intent.electrical_system !== undefined && (!ELECTRICAL_SYSTEMS.has(intent.electrical_system as string)
        || ![50, 60].includes(integer(intent.line_frequency_hz, label)))) {
      throw new Error(`${label} response is invalid`);
    }
  }
  return value as SetupSnapshot;
}
function topology(value: unknown, label: string): MeterTopology {
  const item = record(value, label);
  const addonCount = integer(item.addon_count, label);
  const boardCount = integer(item.board_count, label);
  const ctCount = integer(item.ct_count, label);
  const groupCount = integer(item.group_count, label);
  if (addonCount < 0 || addonCount > 6
    || boardCount < 1 || boardCount > 7
    || ctCount < 6 || ctCount > 42
    || groupCount < 2 || groupCount > 14
    || boardCount !== addonCount + 1
    || ctCount !== 6 * boardCount
    || groupCount !== 2 * boardCount) throw new Error(`${label} response is invalid`);
  enumeration(item.connection_type, CONNECTIONS, label); string(item.voltage_layout, label); string(item.project_name, label);
  const evidenceItems = array(item.evidence, label);
  if (evidenceItems.length < 1 || evidenceItems.length > EVIDENCE_SOURCES.size) throw new Error(`${label} response is invalid`);
  const sources = evidenceItems.map((entry) => { const evidence = record(entry, label); const source = enumeration(evidence.source, EVIDENCE_SOURCES, label); const evidenceAddons = integer(evidence.addon_count, label); if (evidenceAddons < 0 || evidenceAddons > 6) throw new Error(`${label} response is invalid`); string(evidence.detail, label); return source; });
  if (new Set(sources).size !== sources.length || !sources.some((source) => AUTHORITATIVE_EVIDENCE.has(source))) throw new Error(`${label} response is invalid`);
  return value as MeterTopology;
}
function topologyResponse(value: unknown, label: string): MeterTopology | { topology: MeterTopology } {
  const item = record(value, label);
  if ("topology" in item) {
    const parsed = topology(item.topology, label);
    if (item.configuration_authoritative !== undefined) boolean(item.configuration_authoritative, label);
    if (item.package_options !== undefined) packageOptions(item.package_options, label, parsed.board_count);
    return value as { topology: MeterTopology };
  }
  return topology(value, label);
}
function meterConfiguration(value: unknown, label: string): MeterSettingsDraft {
  const configuration = record(record(value, label).configuration, label);
  const meter = record(configuration.meter, label);
  const electricalSystem = enumeration(meter.electrical_system, ELECTRICAL_SYSTEMS, label) as ElectricalSystem;
  const lineFrequency = integer(meter.line_frequency_hz, label);
  if (lineFrequency !== 50 && lineFrequency !== 60) throw new Error(`${label} response is invalid`);
  return { electrical_system: electricalSystem, line_frequency_hz: lineFrequency as LineFrequencyHz, authoritative: true };
}

function packageOptions(value: unknown, label: string, boardCount: number): BoardPackageOptions {
  const item = record(value, label);
  for (const key of ["power_quality", "status_fields"] as const) {
    const states = array(item[key], label, 7);
    if (states.length !== boardCount) throw new Error(`${label} response is invalid`);
    states.forEach((state) => boolean(state, label));
  }
  return value as BoardPackageOptions;
}
function ctInventory(value: unknown, label: string): CtInventory {
  const item = record(value, label); string(item.plan_id, label); string(item.source_sha256, label);
  const channels = array(item.channels, label);
  if (channels.length < 6 || channels.length > 42 || channels.length % 6 !== 0) throw new Error(`${label} response is invalid`);
  channels.forEach((entry, index) => { const channel = record(entry, label); const channelNumber = integer(channel.channel, label); string(channel.name, label); integer(channel.raw_gain_ct, label); number(channel.reporting_multiplier, label); optionalString(channel.selected_model_id, label); boolean(channel.selection_verified_against_config, label); optionalString(channel.display_label, label); const address = record(channel.address, label); const addressChannel = integer(address.channel, label); const boardIndex = integer(address.board_index, label); const groupIndex = integer(address.group_index, label); const phase = enumeration(address.phase, PHASES, label); const expectedChannel = index + 1; if (channelNumber !== expectedChannel || addressChannel !== expectedChannel || boardIndex !== Math.floor(index / 6) || groupIndex !== Math.floor((index % 6) / 3) || phase !== ["A", "B", "C"][index % 3]) throw new Error(`${label} response is invalid`); });
  const catalog = record(item.catalog, label); string(catalog.source_repository, label); string(catalog.source_ref, label); integer(catalog.schema_version, label);
  const presets = array(catalog.presets, label);
  if (presets.length > 64) throw new Error(`${label} response is invalid`);
  presets.forEach((entry) => { const preset = record(entry, label); string(preset.model_id, label); string(preset.label, label); number(preset.rated_current_a, label); string(preset.secondary, label); if (preset.default_gain_ct !== null) integer(preset.default_gain_ct, label); boolean(preset.requires_burden_jumper_cut, label); string(preset.notes, label); });
  return value as CtInventory;
}
function transaction(value: unknown, label: string): TransactionStatus {
  const item = record(value, label); string(item.transaction_id, label); enumeration(item.state, TRANSACTION_STATES, label); string(item.source_sha256, label); boolean(item.rollback_available, label); string(item.redacted_diff, label);
  array(item.changes, label).forEach((entry) => { const change = record(entry, label); const key = string(change.key, label); if (!CHANGE_KEY.test(key!)) throw new Error(`${label} response is invalid`); if (change.old_value !== null) string(change.old_value, label); string(change.new_value, label); });
  array(item.evidence, label).forEach((entry) => enumeration(entry, TRANSACTION_EVIDENCE, label)); array(item.progress, label).forEach((entry) => enumeration(entry, TRANSACTION_PROGRESS, label));
  if (item.validation_detail != null) { const detail = record(item.validation_detail, label); for (const key of ["reported_error_count", "reported_warning_count"] as const) if (detail[key] !== null) integer(detail[key], label); if (detail.code !== null) integer(detail.code, label); integer(detail.error_record_count, label); integer(detail.warning_record_count, label); }
  if (item.upload_progress !== undefined) array(item.upload_progress, label).forEach((entry) => { const progress = record(entry, label); enumeration(progress.stage, JOB_STAGES, label); if (progress.progress !== null && progress.percentage !== null && progress.progress !== undefined && progress.percentage !== undefined) throw new Error(`${label} response is invalid`); const amount = progress.progress ?? progress.percentage; if (amount !== null && amount !== undefined) { const percent = integer(amount, label); if (percent < 0 || percent > 100) throw new Error(`${label} response is invalid`); } });
  return value as TransactionStatus;
}
function session(value: unknown, label: string): SessionStatus {
  const item = record(value, label); string(item.session_id, label); string(item.device_id, label); enumeration(item.state, SESSION_STATES, label); boolean(item.safety_acknowledged, label);
  const preflight = record(item.preflight, label); array(preflight.issues, label).forEach((entry) => { const issue = record(entry, label); enumeration(issue.code, PREFLIGHT_CODES, label); string(issue.role, label); string(issue.detail, label); }); array(preflight.zeroed_roles, label).forEach((entry) => string(entry, label));
  if (item.entity_role_counts !== undefined) Object.values(record(item.entity_role_counts, label)).forEach((count) => { if (integer(count, label) < 0) throw new Error(`${label} response is invalid`); });
  if (item.calibration_sources !== undefined) Object.values(record(item.calibration_sources, label)).forEach((source) => enumeration(source, new Set(["flash", "configuration", "unknown"]), label));
  const offsetFields = [item.offset_capability, item.offset_disposition, item.offset_boards, item.has_pending_calibration];
  if (offsetFields.every((field) => field === undefined)) return value as SessionStatus;
  if (offsetFields.some((field) => field === undefined)) throw new Error(`${label} response is invalid`);
  const capability = record(item.offset_capability, label);
  exactKeys(capability, ["status", "repair_reason"], label);
  const capabilityStatus = enumeration(capability.status, OFFSET_CAPABILITIES, label);
  if (capabilityStatus === "invalid") string(capability.repair_reason, label);
  else if (capability.repair_reason !== null) throw new Error(`${label} response is invalid`);
  const disposition = enumeration(item.offset_disposition, OFFSET_DISPOSITIONS, label);
  const boards = array(item.offset_boards, label, 7);
  if (boards.length < 1) throw new Error(`${label} response is invalid`);
  const stageStates: string[] = [];
  boards.forEach((entry, boardIndex) => {
    const board = record(entry, label); exactKeys(board, ["board_index", "stages"], label);
    if (integer(board.board_index, label) !== boardIndex) throw new Error(`${label} response is invalid`);
    const stages = array(board.stages, label, 2);
    if (stages.length !== 2) throw new Error(`${label} response is invalid`);
    stages.forEach((entry, index) => {
      const stage = record(entry, label); exactKeys(stage, ["stage", "state"], label);
      if (integer(stage.stage, label) !== index + 1) throw new Error(`${label} response is invalid`);
      stageStates.push(enumeration(stage.state, OFFSET_STAGE_STATES, label));
    });
  });
  const expectedDisposition = stageStates.every((state) => state === "skipped") ? "skipped"
    : stageStates.every((state) => state === "completed") ? "completed"
      : stageStates.every((state) => state === "not_started") ? "not_started"
        : stageStates.some((state) => state === "partial" || state === "indeterminate")
          || stageStates.some((state) => state === "skipped") ? "partial" : "in_progress";
  if (disposition !== expectedDisposition) throw new Error(`${label} response is invalid`);
  boolean(item.has_pending_calibration, label);
  return value as SessionStatus;
}

function offsetReadiness(value: unknown, label: string, expectedBoard: number, expectedStage: 1 | 2): OffsetReadinessResult {
  const item = record(value, label); exactKeys(item, ["stage", "ready", "connection_generation", "entities", "reasons", "thresholds"], label);
  if (integer(item.stage, label) !== expectedStage || expectedBoard < 0 || expectedBoard > 6) throw new Error(`${label} response is invalid`);
  const ready = boolean(item.ready, label); const generation = integer(item.connection_generation, label);
  if (generation < 1) throw new Error(`${label} response is invalid`);
  const thresholds = record(item.thresholds, label);
  exactKeys(thresholds, ["sample_count", "zero_voltage_peak_volts", "zero_voltage_spread_volts", "zero_current_peak_amps", "zero_current_spread_amps", "voltage_present_minimum_volts", "voltage_present_spread_volts"], label);
  const sampleCount = integer(thresholds.sample_count, label);
  const zeroVoltagePeak = number(thresholds.zero_voltage_peak_volts, label);
  const zeroVoltageSpread = number(thresholds.zero_voltage_spread_volts, label);
  const zeroCurrentPeak = number(thresholds.zero_current_peak_amps, label);
  const zeroCurrentSpread = number(thresholds.zero_current_spread_amps, label);
  const voltagePresentMinimum = number(thresholds.voltage_present_minimum_volts, label);
  const voltagePresentSpread = number(thresholds.voltage_present_spread_volts, label);
  const thresholdValues = [zeroVoltagePeak, zeroVoltageSpread, zeroCurrentPeak, zeroCurrentSpread,
    voltagePresentMinimum, voltagePresentSpread];
  if (sampleCount < 3 || sampleCount > 100 || thresholdValues.some((entry) => entry < 0)
    || thresholdValues[4] === 0) throw new Error(`${label} response is invalid`);
  const entities = array(item.entities, label, 12);
  if (entities.length !== 12) throw new Error(`${label} response is invalid`);
  const expectedRoles = new Map<string, "voltage" | "current">();
  for (const groupOffset of [0, 1]) {
    const group = expectedBoard === 0 ? `main_${groupOffset + 1}` : `addon${expectedBoard}_${groupOffset + 1}`;
    for (const phase of ["a", "b", "c"]) expectedRoles.set(`${group}.voltage_${phase}`, "voltage");
    for (let offset = 1; offset <= 3; ++offset) expectedRoles.set(`ct${expectedBoard * 6 + groupOffset * 3 + offset}.current_sensor`, "current");
  }
  const disconnectedReason = "entity binding is not on the active connection generation";
  const unavailablePrefix = "fresh window unavailable: ";
  const roles = new Set<string>(); const topLevelReasons: string[] = []; let disconnectedEntities = 0;
  entities.forEach((entry) => {
    const entity = record(entry, label); exactKeys(entity, ["role", "quantity", "ready", "reasons", "window"], label);
    const role = string(entity.role, label)!; const quantity = enumeration(entity.quantity, new Set(["voltage", "current"]), label);
    if (roles.has(role) || expectedRoles.get(role) !== quantity) throw new Error(`${label} response is invalid`); roles.add(role);
    const entityReady = boolean(entity.ready, label); const reasons = array(entity.reasons, label, 12).map((reason) => string(reason, label)!);
    let expectedReasons: string[];
    if (entity.window === null) {
      if (entityReady || reasons.length !== 1) throw new Error(`${label} response is invalid`);
      if (reasons[0] === disconnectedReason) ++disconnectedEntities;
      else if (!reasons[0]!.startsWith(unavailablePrefix) || reasons[0]!.slice(unavailablePrefix.length).trim().length === 0) {
        throw new Error(`${label} response is invalid`);
      }
      expectedReasons = reasons;
    } else {
      const window = record(entity.window, label);
      exactKeys(window, ["values", "received_at", "connection_generation", "mean", "minimum", "maximum", "absolute_peak", "absolute_spread"], label);
      const values = array(window.values, label, sampleCount).map((entry) => number(entry, label));
      const receivedAt = array(window.received_at, label, sampleCount).map((entry) => number(entry, label));
      const mean = number(window.mean, label); const minimum = number(window.minimum, label); const maximum = number(window.maximum, label);
      const peak = number(window.absolute_peak, label); const spread = number(window.absolute_spread, label);
      const calculatedMean = values.reduce((sum, entry) => sum + entry, 0) / values.length;
      const windowGeneration = integer(window.connection_generation, label);
      if (values.length !== sampleCount || receivedAt.length !== sampleCount
        || receivedAt.some((entry, index) => index > 0 && entry <= receivedAt[index - 1]!)
        || !close(mean, calculatedMean) || !close(minimum, Math.min(...values)) || !close(maximum, Math.max(...values))
        || !close(peak, Math.max(...values.map(Math.abs))) || !close(spread, maximum - minimum)) throw new Error(`${label} response is invalid`);
      expectedReasons = [];
      if (windowGeneration !== generation) expectedReasons.push("window is from another connection generation");
      else if (quantity === "current") {
        if (peak > zeroCurrentPeak) expectedReasons.push("absolute peak exceeds zero_current_peak_amps");
        if (spread > zeroCurrentSpread) expectedReasons.push("absolute spread exceeds zero_current_spread_amps");
      } else if (expectedStage === 1) {
        if (peak > zeroVoltagePeak) expectedReasons.push("absolute peak exceeds zero_voltage_peak_volts");
        if (spread > zeroVoltageSpread) expectedReasons.push("absolute spread exceeds zero_voltage_spread_volts");
      } else {
        if (minimum < voltagePresentMinimum) expectedReasons.push("minimum is below voltage_present_minimum_volts");
        if (spread > voltagePresentSpread) expectedReasons.push("absolute spread exceeds voltage_present_spread_volts");
      }
    }
    if (!exactStrings(reasons, expectedReasons) || entityReady !== (expectedReasons.length === 0)) throw new Error(`${label} response is invalid`);
    topLevelReasons.push(...expectedReasons.map((reason) => `${role}: ${reason}`));
  });
  const reasons = array(item.reasons, label, 100).map((reason) => string(reason, label)!);
  const connectionChangedReasons = [...topLevelReasons, "connection generation changed while collecting readiness"];
  const disconnected = disconnectedEntities === entities.length && exactStrings(reasons, [disconnectedReason]);
  const reasonsMatch = disconnected || (disconnectedEntities === 0
    && (exactStrings(reasons, topLevelReasons) || exactStrings(reasons, connectionChangedReasons)));
  if (roles.size !== expectedRoles.size || !reasonsMatch
    || ready !== (reasons.length === 0)) throw new Error(`${label} response is invalid`);
  return value as OffsetReadinessResult;
}

function signedTable(value: unknown, label: string): OffsetTable {
  const phases = array(value, label, 3);
  if (phases.length !== 3) throw new Error(`${label} response is invalid`);
  phases.forEach((entry) => {
    const pair = array(entry, label, 2);
    if (pair.length !== 2 || pair.some((value) => { const result = integer(value, label); return result < -32_768 || result > 32_767; })) throw new Error(`${label} response is invalid`);
  });
  return value as OffsetTable;
}

function offsetCalibration(value: unknown, label: string, expectedBoard: number, expectedStage: 1 | 2): OffsetCalibrationResult {
  const item = record(value, label); exactKeys(item, ["state", "board_index", "stage", "expected_tables", "unfinished_group_keys", "retry_allowed", "error"], label);
  const state = enumeration(item.state, OFFSET_RESULT_STATES, label);
  if (integer(item.board_index, label) !== expectedBoard || integer(item.stage, label) !== expectedStage) throw new Error(`${label} response is invalid`);
  const groupKeys = expectedBoard === 0 ? ["main_1", "main_2"] : [`addon${expectedBoard}_1`, `addon${expectedBoard}_2`];
  const completed = array(item.expected_tables, label, 2).map((entry) => {
    const table = array(entry, label, 2);
    if (table.length !== 2) throw new Error(`${label} response is invalid`);
    const key = string(table[0], label)!; if (!groupKeys.includes(key)) throw new Error(`${label} response is invalid`);
    signedTable(table[1], label); return key;
  });
  const unfinished = array(item.unfinished_group_keys, label, 2).map((entry) => string(entry, label)!);
  const all = [...completed, ...unfinished]; const retryAllowed = boolean(item.retry_allowed, label);
  if (all.length !== 2 || new Set(all).size !== 2 || all.some((key) => !groupKeys.includes(key))) throw new Error(`${label} response is invalid`);
  if (state === "applied_pending_restart_verification") {
    if (completed.length !== 2 || unfinished.length !== 0 || retryAllowed || item.error !== null) throw new Error(`${label} response is invalid`);
  } else {
    string(item.error, label);
    if (!retryAllowed || completed.length !== (state === "partial" ? 1 : 0)) throw new Error(`${label} response is invalid`);
  }
  return value as OffsetCalibrationResult;
}
function stability(value: unknown, label: string, expectedTarget: "voltage" | "current", expectedTargetId: string): StabilityResult {
  const item = record(value, label); const target = enumeration(item.target, new Set(["voltage", "current"]), label); string(item.target_id, label); const stable = boolean(item.stable, label);
  if (target !== expectedTarget || item.target_id !== expectedTargetId) throw new Error(`${label} response is invalid`);
  const windows = array(item.windows, label, target === "voltage" ? 3 : 1);
  if (windows.length !== (target === "voltage" ? 3 : 1)) throw new Error(`${label} response is invalid`);
  const ranges = windows.map((entry) => {
    const window = record(entry, label); const samples = array(window.samples, label, 1).map((sample) => number(sample, label));
    if (samples.length !== 1) throw new Error(`${label} response is invalid`);
    const mean = number(window.mean, label);
    const standardDeviation = number(window.standard_deviation, label);
    const rangePercent = number(window.range_percent, label);
    const expectedMean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
    const expectedDeviation = Math.sqrt(samples.reduce((sum, sample) => sum + (sample - expectedMean) ** 2, 0) / samples.length);
    const expectedRange = 100 * (Math.max(...samples) - Math.min(...samples)) / Math.abs(expectedMean);
    if (!close(mean, expectedMean) || !close(standardDeviation, expectedDeviation) || !close(rangePercent, expectedRange)) throw new Error(`${label} response is invalid`);
    return rangePercent;
  });
  if (stable !== ranges.every((range) => range <= 1)) throw new Error(`${label} response is invalid`);
  return value as StabilityResult;
}
function calibration(
  value: unknown,
  label: string,
  expected: CalibrationExpectation,
): CalibrationResult {
  const item = record(value, label); const state = enumeration(item.state, new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), label); string(item.group_key, label); if (item.phase !== null) enumeration(item.phase, PHASES, label); const iteration = integer(item.iteration, label);
  const changed = array(item.changed_channels, label, 3).map((entry) => integer(entry, label));
  const before = array(item.before_values, label, 3); const after = array(item.after_values, label, 3); const errors = array(item.error_percent_values, label, 3);
  for (const values of [before, after, errors]) values.forEach((entry) => number(entry, label));
  const expectedGroup = expected.target === "voltage" ? expected.groupKey : channelGroup(expected.references[0]!.channel);
  const expectedChannels = expected.target === "voltage" ? groupChannels(expected.groupKey) : expected.references.map((item) => item.channel);
  const expectedPhase = expected.target === "current" && expected.references.length === 1 ? (["A", "B", "C"] as const)[(expected.references[0]!.channel - 1) % 3] : null;
  const retryAllowed = boolean(item.retry_allowed, label);
  if (expected.target === "voltage" && (!Number.isFinite(expected.reference) || expected.reference <= 0)
    || expected.target === "current" && expected.references.some((reference) => !Number.isFinite(reference.reference) || reference.reference <= 0 || !Number.isFinite(reference.rawReference) || reference.rawReference <= 0)
    || ![1, 2, 3].includes(changed.length) || (state !== "indeterminate" && before.length !== changed.length) || new Set(changed).size !== changed.length
    || changed.some((channel) => channel < 1 || channel > 42) || iteration < 1 || iteration > 3
    || item.group_key !== expectedGroup || item.phase !== expectedPhase
    || changed.length !== expectedChannels.length || changed.some((channel, index) => channel !== expectedChannels[index])
    || (state === "indeterminate" ? after.length !== 0 || errors.length !== 0 : after.length !== changed.length || errors.length !== changed.length)) throw new Error(`${label} response is invalid`);
  if (state === "indeterminate") {
    if (item.gain_evidence !== null || retryAllowed) throw new Error(`${label} response is invalid`);
    if (item.restore_evidence != null) record(item.restore_evidence, label);
  } else {
    if (item.gain_evidence == null || item.restore_evidence !== null) throw new Error(`${label} response is invalid`);
    gainEvidence(item.gain_evidence, label, expected);
    const references = expected.target === "voltage" ? after.map(() => expected.reference) : expected.references.map((item) => item.reference);
    const expectedErrors = after.map((result, index) => 100 * Math.abs(number(result, label) - references[index]!) / references[index]!);
    if (errors.some((error, index) => number(error, label) < 0 || !close(number(error, label), expectedErrors[index]!))) throw new Error(`${label} response is invalid`);
    const outside = Math.max(...expectedErrors) > 1;
    if ((state === "result_outside_tolerance") !== outside || retryAllowed !== (outside && iteration < 3)) throw new Error(`${label} response is invalid`);
  }
  return value as CalibrationResult;
}
function channelGroup(channel: number): string {
  const board = Math.floor((channel - 1) / 6); const group = Math.floor(((channel - 1) % 6) / 3) + 1;
  return board === 0 ? `main_${group}` : `addon${board}_${group}`;
}
function gainEvidence(
  value: unknown,
  label: string,
  expected: CalibrationExpectation,
): void {
  const evidence = record(value, label);
  const generation = integer(evidence.connection_generation, label);
  const sequence = integer(evidence.operation_sequence, label);
  const groupKey = expected.target === "voltage" ? expected.groupKey : channelGroup(expected.references[0]!.channel);
  const instanceId = groupKey.startsWith("main_") ? `meter_main${groupKey.slice(-1)}` : groupKey;
  if (generation < 1 || sequence < 1 || string(evidence.instance_id, label) !== instanceId) throw new Error(`${label} response is invalid`);
  const currentByPhase: Map<string, number> = expected.target === "current" ? new Map(expected.references.map((reference) =>
    [(["A", "B", "C"] as const)[(reference.channel - 1) % 3], reference.rawReference])) : new Map();
  const phases = array(evidence.phases, label, 3);
  if (phases.length !== 3) throw new Error(`${label} response is invalid`);
  phases.forEach((entry, index) => {
    const phase = record(entry, label);
    const phaseName = enumeration(phase.phase, PHASES, label);
    if (phaseName !== ["A", "B", "C"][index]) throw new Error(`${label} response is invalid`);
    number(phase.measured_voltage, label); number(phase.measured_current, label);
    const referenceVoltage = number(phase.reference_voltage, label);
    const referenceCurrent = number(phase.reference_current, label);
    const oldVoltage = integer(phase.old_voltage_gain, label); const newVoltage = integer(phase.new_voltage_gain, label);
    const oldCurrent = integer(phase.old_current_gain, label); const newCurrent = integer(phase.new_current_gain, label);
    if ([oldVoltage, newVoltage, oldCurrent, newCurrent].some((gain) => gain < 1 || gain > 65_535)) throw new Error(`${label} response is invalid`);
    if (expected.target === "voltage") {
      if (Math.abs(referenceVoltage - expected.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(referenceVoltage), expected.reference))
        || Math.abs(referenceCurrent) > 1e-6 || oldCurrent !== newCurrent) throw new Error(`${label} response is invalid`);
    } else {
      const expectedCurrent = currentByPhase.get(phaseName);
      if (Math.abs(referenceVoltage) > 1e-6
        || (expectedCurrent === undefined
          ? Math.abs(referenceCurrent) > 1e-6
          : Math.abs(referenceCurrent - expectedCurrent) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(referenceCurrent), expectedCurrent)))
        || oldVoltage !== newVoltage || (expectedCurrent === undefined && oldCurrent !== newCurrent)) throw new Error(`${label} response is invalid`);
    }
  });
  const mismatches = array(evidence.register_mismatch_phases, label, 3);
  mismatches.forEach((phase) => enumeration(phase, PHASES, label));
  const lines = array(evidence.matching_lines, label, 100);
  if (lines.length === 0 || lines.some((line) => typeof line !== "string") || boolean(evidence.flash_saved, label) !== true
    || mismatches.length !== 0 || boolean(evidence.calibration_disabled, label) !== false) throw new Error(`${label} response is invalid`);
}
function groupChannels(groupKey: string): number[] {
  const match = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(groupKey);
  if (!match) return [];
  const board = match[2] === undefined ? 0 : Number(match[2]); const group = Number(match[1] ?? match[3]);
  const first = board * 6 + (group - 1) * 3 + 1;
  return [first, first + 1, first + 2];
}
function restart(value: unknown, label: string, expected: MeterTopology): RestartVerificationResult {
  const item = record(value, label); for (const key of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"] as const) string(item[key], label);
  const addonCount = integer(item.topology_addon_count, label); enumeration(item.topology_connection_type, CONNECTIONS, label); const generation = integer(item.connection_generation, label); const authority = enumeration(item.source_authority, new Set(["saved_flash", "configuration"]), label); const sourceHandoff = boolean(item.source_handoff_available, label); const installed = boolean(item.source_handoff_firmware_installed, label); optionalString(item.source_handoff_transaction_id, label);
  const hasConfig = item.config_filename !== null || item.config_sha256 !== null;
  if (hasConfig) {
    string(item.config_filename, label); string(item.config_sha256, label);
    if (!CONFIGURATION.test(item.config_filename as string) || !SHA256.test(item.config_sha256 as string)) throw new Error(`${label} response is invalid`);
  }
  if ((item.config_filename === null) !== (item.config_sha256 === null)) throw new Error(`${label} response is invalid`);
  if (!MAC.test(item.mac as string)
    || !SERVER_ID.test(item.verification_id as string) || generation < 1
    || item.source_handoff_transaction_id !== null && !SERVER_ID.test(item.source_handoff_transaction_id as string)
    || addonCount !== expected.addon_count || item.topology_project_name !== expected.project_name
    || item.topology_connection_type !== expected.connection_type || item.topology_voltage_layout !== expected.voltage_layout) throw new Error(`${label} response is invalid`);
  const allowedIds = new Set(["meter_main1", "meter_main2", ...Array.from({ length: addonCount }, (_, index) => [`addon${index + 1}_1`, `addon${index + 1}_2`]).flat()]);
  const validateGroups = (field: "groups" | "offset_groups" | "power_offset_groups", tableField: "phase_gains" | "phase_offsets" | "phase_power_offsets", signed: boolean) => {
    const groups = array(item[field] ?? [], label, 14); const seenIds = new Set<string>();
    groups.forEach((entry) => {
      const group = record(entry, label); exactKeys(group, ["instance_id", tableField], label);
      const instanceId = string(group.instance_id, label)!;
      if (!allowedIds.has(instanceId) || seenIds.has(instanceId)) throw new Error(`${label} response is invalid`);
      seenIds.add(instanceId);
      if (signed) signedTable(group[tableField], label);
      else {
        const phases = array(group[tableField], label, 3);
        if (phases.length !== 3) throw new Error(`${label} response is invalid`);
        phases.forEach((phase) => {
          const gains = array(phase, label, 2);
          if (gains.length !== 2 || gains.some((gain) => { const amount = integer(gain, label); return amount < 1 || amount > 65_535; })) throw new Error(`${label} response is invalid`);
        });
      }
    });
    return groups.length;
  };
  const gainCount = validateGroups("groups", "phase_gains", false);
  const offsetCount = validateGroups("offset_groups", "phase_offsets", true)
    + validateGroups("power_offset_groups", "phase_power_offsets", true);
  if (gainCount + offsetCount < 1
    || sourceHandoff && (!hasConfig || installed || item.source_handoff_transaction_id !== null || authority !== "saved_flash" || offsetCount > 0)
    || !sourceHandoff && hasConfig && item.source_handoff_transaction_id === null && offsetCount === 0
    || installed && (!hasConfig || item.source_handoff_transaction_id === null || offsetCount > 0)
    || authority === "configuration" && (!installed || sourceHandoff || offsetCount > 0)) throw new Error(`${label} response is invalid`);
  return value as RestartVerificationResult;
}

function activeWork(value: unknown, label: string, expected: MeterTopology): ActiveWork {
  const item = record(value, label);
  if (item.session !== null) session(item.session, label);
  if (item.transaction !== null) transaction(item.transaction, label);
  if (item.verified_calibration !== null) restart(item.verified_calibration, label, expected);
  return value as ActiveWork;
}

export class HelperApi {
  public constructor(
    private readonly hass: HomeAssistant,
    private readonly entryId: string,
  ) {}

  public static assertPublicPayload(
    value: unknown,
    transactionStatus = false,
    depth = 0,
    field = "",
    allowChangeKey = false,
  ): void {
    if (depth > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(value)) {
      if (value.length > 100) throw new Error(`unsafe collection ${field || "value"} refused`);
      for (const item of value) this.assertPublicPayload(item, false, depth + 1, field);
      return;
    }
    if (typeof value === "string") {
      const multiline = value.includes("\n") || value.includes("\r");
      const limit = field === "redacted_diff" ? 32_768 : 4_096;
      if (value.length > limit || CONTROL.test(value) || SECRET_VALUE.test(value) || (multiline && field !== "redacted_diff") || (field === "redacted_diff" && value.includes("\r"))) {
        throw new Error(`unsafe string ${field || "value"} refused`);
      }
      return;
    }
    if (value === null || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (key.length > 256 || PROPERTY_CONTROL.test(key)) throw new Error(`unsafe property name refused`);
      if (key.toLowerCase() === "key" && !allowChangeKey) throw new Error(`private field ${key} refused`);
      if (key.toLowerCase() !== "raw_gain_ct" && PRIVATE_FIELD.test(key)) {
        throw new Error(`private field ${key} refused`);
      }
      if (transactionStatus && depth === 0 && key === "changes" && Array.isArray(item)) {
        if (item.length > 100) throw new Error("unsafe collection changes refused");
        for (const change of item) this.assertPublicPayload(change, false, depth + 2, "", true);
      } else {
        this.assertPublicPayload(item, false, depth + 1, key.toLowerCase());
      }
    }
  }

  private async call<T>(operation: string, validator: Validator<T>, data: Record<string, unknown> = {}): Promise<T> {
    const result = await this.hass.callWS<unknown>({
      type: `${PREFIX}${operation}`,
      entry_id: this.entryId,
      ...data,
    });
    HelperApi.assertPublicPayload(result, TRANSACTION_OPERATIONS.has(operation));
    return validator(result);
  }

  private subscribe<T>(
    operation: string,
    data: Record<string, unknown>,
    validator: Validator<T>,
    callback: (message: T) => void,
  ): Promise<() => void> {
    return this.hass.connection.subscribeMessage<T>((message) => {
      HelperApi.assertPublicPayload(message, TRANSACTION_OPERATIONS.has(operation));
      callback(validator(message));
    }, { type: `${PREFIX}${operation}`, entry_id: this.entryId, ...data });
  }

  public setupStatus = () => this.call("setup_status", (value) => setup(value, "setup_status"));
  public listMeters = () => this.call("list_meters", (value) => { array(value, "list_meters").forEach((item) => device(item, "list_meters")); return value as DiscoveredDevice[]; });
  public getTopology = (deviceId: string) =>
    this.call("get_topology", (value) => topologyResponse(value, "get_topology"), { device_id: deviceId });
  public getCtInventory = (deviceId: string) =>
    this.call("get_ct_inventory", (value) => ctInventory(value, "get_ct_inventory"), { device_id: deviceId });
  public getMeterConfiguration = (deviceId: string) =>
    this.call("get_meter_configuration", (value) => meterConfiguration(value, "get_meter_configuration"), { device_id: deviceId });
  public getActiveWork = (deviceId: string, expectedTopology: MeterTopology) =>
    this.call("get_active_work", (value) => activeWork(value, "get_active_work", expectedTopology), { device_id: deviceId });
  public getSession = (sessionId: string) =>
    this.call("get_session", (value) => session(value, "get_session"), { session_id: sessionId });
  public getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (value) => record(value, "get_diagnostics_summary"));
  public setInstallerIntent = (
    addonCount: number,
    connectionType: Exclude<ConnectionType, "unknown">,
    firmware: FirmwareOption | null,
    packageOptions?: BoardPackageOptions,
    electricalSystem?: ElectricalSystem | null,
    lineFrequencyHz?: LineFrequencyHz | null,
  ) => this.call("set_installer_intent", (value) => setup(value, "set_installer_intent"), {
    addon_count: addonCount,
    connection_type: connectionType,
    ...(packageOptions ?? {}),
    ...(firmware && firmware.productId.length <= 160 && firmware.version.length <= 160
      && FIRMWARE_PRODUCT_ID.test(firmware.productId) && ESPHOME_VERSION.test(firmware.version)
      ? { firmware_product_id: firmware.productId, esphome_version: firmware.version }
      : {}),
    ...(electricalSystem !== null && electricalSystem !== undefined && lineFrequencyHz !== null && lineFrequencyHz !== undefined
      ? { electrical_system: electricalSystem, line_frequency_hz: lineFrequencyHz }
      : {}),
  });
  public rescan = () => this.call("rescan", (value) => setup(value, "rescan"));
  public adoptDevice = (deviceId: string) =>
    this.call("adopt_device", (value) => { const item = record(value, "adopt_device"); string(item.device_id, "adopt_device"); string(item.configuration, "adopt_device"); return value as { device_id: string; configuration: string }; }, { device_id: deviceId });
  public previewCtConfig = (
    deviceId: string,
    planId: string,
    sourceSha256: string,
    changes: CtChange[],
    packageOptions?: BoardPackageOptions,
  ) => this.call("preview_ct_config", (value) => transaction(value, "preview_ct_config"), {
    device_id: deviceId,
    plan_id: planId,
    source_sha256: sourceSha256,
    changes,
    ...(packageOptions ? { package_options: packageOptions } : {}),
  });
  public setHaLabels = (deviceId: string, planId: string, sourceSha256: string, changes: Array<{ channel: number; name: string }>) =>
    this.call("set_ha_labels", (value) => value as LabelUpdateResult, {
      device_id: deviceId, plan_id: planId, source_sha256: sourceSha256, changes,
    });
  private transaction = (operation: string, deviceId: string, transactionId: string, sourceSha256: string) =>
    this.call(operation, (value) => transaction(value, operation), {
      device_id: deviceId,
      transaction_id: transactionId,
      source_sha256: sourceSha256,
    });
  public applyCtConfig = (deviceId: string, transactionId: string, sourceSha256: string) =>
    this.transaction("apply_ct_config", deviceId, transactionId, sourceSha256);
  public compileCtConfig = (deviceId: string, transactionId: string, sourceSha256: string) =>
    this.transaction("compile_ct_config", deviceId, transactionId, sourceSha256);
  public installCtConfig = (deviceId: string, transactionId: string, sourceSha256: string) =>
    this.transaction("install_ct_config", deviceId, transactionId, sourceSha256);
  public rollbackCtConfig = (deviceId: string, transactionId: string, sourceSha256: string) =>
    this.transaction("rollback_ct_config", deviceId, transactionId, sourceSha256);
  public startSession = (deviceId: string) =>
    this.call("start_session", (value) => session(value, "start_session"), { device_id: deviceId });
  public acknowledgeSafety = (sessionId: string) =>
    this.call("acknowledge_safety", (value) => session(value, "acknowledge_safety"), { session_id: sessionId, acknowledged: true });
  public checkStability = (sessionId: string, target: "voltage" | "current", targetId: string) =>
    this.call("check_stability", (value) => stability(value, "check_stability", target, targetId), { session_id: sessionId, target, target_id: targetId });
  public checkOffsetReadiness = (sessionId: string, boardIndex: number, stage: 1 | 2) =>
    this.call("check_offset_readiness", (value) => offsetReadiness(value, "check_offset_readiness", boardIndex, stage), {
      session_id: sessionId, board_index: boardIndex, stage,
    });
  public calibrateOffset = (sessionId: string, boardIndex: number, stage: 1 | 2, preparationAcknowledged: true, confirmRetry: boolean) =>
    this.call("calibrate_offset", (value) => offsetCalibration(value, "calibrate_offset", boardIndex, stage), {
      session_id: sessionId, board_index: boardIndex, stage, preparation_acknowledged: preparationAcknowledged, confirm_retry: confirmRetry,
    });
  public skipOffsetCalibration = (sessionId: string) =>
    this.call("skip_offset_calibration", (value) => session(value, "skip_offset_calibration"), { session_id: sessionId });
  public checkVoltageStability = (sessionId: string, groupKeys: string[]) => {
    if (groupKeys.length !== 2 || new Set(groupKeys).size !== 2) return Promise.reject(new Error("check_stability board is invalid"));
    return this.call("check_stability", (value) => {
      const results = array(value, "check_stability", 2);
      if (results.length !== 2) throw new Error("check_stability response is invalid");
      return results.map((item, index) => stability(item, "check_stability", "voltage", groupKeys[index]!));
    }, { session_id: sessionId, target: "voltage", target_ids: groupKeys });
  };
  public calibrateVoltage = (
    sessionId: string,
    references: Array<{ group_key: string; reference: number }>,
    confirmIteration: boolean,
  ) => {
    const channels = references.map((item) => groupChannels(item.group_key));
    if (references.length !== 2 || new Set(references.map((item) => item.group_key)).size !== 2
      || channels.some((item) => item.length !== 3)
      || new Set(channels.map((item) => Math.floor((item[0]! - 1) / 6))).size !== 1
      || references.some((item) => !Number.isFinite(item.reference) || item.reference <= 0)) {
      return Promise.reject(new Error("calibrate_voltage board is invalid"));
    }
    return this.call("calibrate_voltage", (value) => {
      const results = array(value, "calibrate_voltage", 2);
      if (results.length !== 2) throw new Error("calibrate_voltage response is invalid");
      return results.map((item, index) => calibration(item, "calibrate_voltage", {
        target: "voltage", groupKey: references[index]!.group_key, reference: references[index]!.reference,
      }));
    }, { session_id: sessionId, references, confirm_iteration: confirmIteration });
  };
  public calibrateCurrent = (
    sessionId: string,
    references: Array<{ channel: number; reference: number; reporting_multiplier: number }>,
    confirmIteration: boolean,
    pendingMultipliers: Array<{ channel: number; reporting_multiplier: number }> = [],
  ) => {
    if (references.length < 1 || references.length > 3
      || new Set(references.map((item) => item.channel)).size !== references.length
      || new Set(references.map((item) => channelGroup(item.channel))).size !== 1
      || references.some((item) => !Number.isInteger(item.channel) || item.channel < 1 || item.channel > 42
        || !Number.isFinite(item.reference) || item.reference <= 0
        || ![1, 2, 4, 8].includes(item.reporting_multiplier))
      || pendingMultipliers.some((item) => ![1, 2, 4, 8].includes(item.reporting_multiplier))) {
      return Promise.reject(new Error("calibrate_current references are invalid"));
    }
    return this.call("calibrate_current", (value) => calibration(value, "calibrate_current", { target: "current",
      references: references.map((item) => ({ channel: item.channel, reference: item.reference, rawReference: item.reference / item.reporting_multiplier })) }), {
      session_id: sessionId,
      references,
      confirm_iteration: confirmIteration,
      pending_multipliers: pendingMultipliers,
    });
  };
  public restartAndVerify = (sessionId: string, expectedTopology: MeterTopology) =>
    this.call("restart_and_verify", (value) => restart(value, "restart_and_verify", expectedTopology), { session_id: sessionId });
  public completeCalibrationWithoutChanges = (sessionId: string) =>
    this.call("complete_calibration_without_changes", (value) => {
      const result = session(value, "complete_calibration_without_changes");
      if (result.session_id !== sessionId || result.state !== "verified" || result.has_pending_calibration !== false) {
        throw new Error("complete_calibration_without_changes response is invalid");
      }
      return result;
    }, { session_id: sessionId });
  public previewCalibratedGains = (sessionId: string, verificationId: string, changes: CtChange[] = [], packageOptions?: BoardPackageOptions) =>
    this.call("preview_calibrated_gains", (value) => transaction(value, "preview_calibrated_gains"), {
      session_id: sessionId,
      verification_id: verificationId,
      changes,
      ...(packageOptions ? { package_options: packageOptions } : {}),
    });
  public clearCalibrationFlash = (
    sessionId: string,
    verificationId: string,
    transactionId: string,
    expectedTopology: MeterTopology,
  ) => this.call("clear_calibration_flash", (value) => restart(value, "clear_calibration_flash", expectedTopology), {
    session_id: sessionId,
    verification_id: verificationId,
    transaction_id: transactionId,
  });
  public cancelSession = (sessionId: string) =>
    this.call("cancel_session", (value) => session(value, "cancel_session"), { session_id: sessionId });
  public subscribeSetup = (callback: (message: SetupSnapshot) => void) =>
    this.subscribe("subscribe_setup", {}, (value) => setup(value, "subscribe_setup"), callback);
  public subscribeConfigTransaction = (
    deviceId: string,
    transactionId: string,
    sourceSha256: string,
    callback: (message: TransactionStatus) => void,
  ) => this.subscribe("subscribe_config_transaction", {
    device_id: deviceId,
    transaction_id: transactionId,
    source_sha256: sourceSha256,
  }, (value) => transaction(value, "subscribe_config_transaction"), callback);
  public subscribeSession = (sessionId: string, callback: (message: SessionStatus) => void) =>
    this.subscribe("subscribe_session", { session_id: sessionId }, (value) => session(value, "subscribe_session"), callback);
}
