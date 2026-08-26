import { expect, test, type Page } from "@playwright/test";
import sanitizerContract from "../../../tests/fixtures/task20_sanitized_change.json" with { type: "json" };

type Frame = Record<string, unknown> & { id?: number; type: string };
type Outcome = "success" | "collision" | "validation" | "compile";
type Calibration = "main-success" | "addon-indeterminate" | undefined;

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

function inventory(addons: number) {
  const count = 6 * (addons + 1);
  return { plan_id: `plan-${count}`, source_sha256: hash,
    channels: Array.from({ length: count }, (_, index) => ({
      channel: index + 1, name: `CT${index + 1}`, raw_gain_ct: index === 3 ? 27518 : 5500,
      reporting_multiplier: 1, selected_model_id: index === 3 ? null : "cs-ct-200a",
      selection_verified_against_config: index !== 3,
      address: { channel: index + 1, board_index: Math.floor(index / 6),
        group_index: Math.floor((index % 6) / 3),
        phase: (["A", "B", "C"] as const)[index % 3] },
      display_label: null, stored_selection_present: false,
    })),
    catalog: { presets: [{ model_id: "cs-ct-200a", label: "CS-CT-200A-333mV", rated_current_a: 200,
      secondary: "333 mV @ 200 A", default_gain_ct: 5500, requires_burden_jumper_cut: false,
      notes: "Use burden at least 1 VA for best accuracy." },
    { model_id: "sct-016", label: "SCT-016", rated_current_a: 120, secondary: "50 mA @ 120 A",
      default_gain_ct: 41787, requires_burden_jumper_cut: true,
      notes: "Review the board burden jumper before use." }],
    source_repository: "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter", source_ref: "4d1d14f",
    schema_version: 1 } };
}

function meterConfiguration(addons: number) {
  const live = inventory(addons); const references = Array.from({ length: addons + 1 }, (_, board) => ({
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
  return { plan_id: "b".repeat(32), source_sha256: live.source_sha256, topology: { ...topology(addons), voltage_layout: "standard" },
    configuration: { meter: { friendly_name: "Energy meter", electrical_system: "split_phase_120_240", line_frequency_hz: 60,
      update_interval_s: 5, voltage_layout: "standard", voltage_references: references }, channels, aggregates: [],
      power_quality: Array(addons + 1).fill(false), status_fields: Array(addons + 1).fill(false), multi_reference_preparation_acknowledged: addons > 0 },
    capabilities: { configuration_authoritative: true, managed_totals: true, multi_reference: true, reason_codes: [] },
    voltage_topology: { references: references.map((reference) => [reference.reference_id, reference.group_keys]), source: "legacy" },
    voltage_transformer_catalog: { presets: [{ model_id: "default", label: "Default", primary_nominal_v: 120, secondary_nominal_v: 9, default_gain_voltage: 7305, notes: "Approved" }], source_repository: "CircuitSetup/repo", source_ref: "a".repeat(40), schema_version: 1 },
    ct_catalog: live.catalog, warnings: [], configuration_impact: { enabled_channel_count: live.channels.length, numeric_entity_count: live.channels.length * 2 + 2 * (addons + 1), text_entity_count: 0, energy_entity_count: 0, approximate_publications_per_second: (live.channels.length * 2 + 2 * (addons + 1)) / 5 }, channels: live.channels, catalog: live.catalog };
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

function offsetBoards(addons: number, stageState: "not_started" | "skipped" = "not_started") {
  return Array.from({ length: addons + 1 }, (_, board_index) => ({ board_index,
    stages: [{ stage: 1, state: stageState }, { stage: 2, state: stageState }] }));
}

function session(state: string, acknowledged: boolean, addons = 0, pending = false,
  offsetState: "not_started" | "skipped" = "not_started") {
  return { session_id: "session-1", device_id: "meter-1", state, safety_acknowledged: acknowledged,
    preflight: { issues: [], zeroed_roles: ["main_1.reference_voltage", "ct1.reference_current"] },
    entity_role_counts: {}, offset_capability: { status: "available", repair_reason: null },
    offset_disposition: offsetState, offset_boards: offsetBoards(addons, offsetState),
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

function restart(addons: number) {
  const groups = Array.from({ length: 2 * (addons + 1) }, (_, index) => {
    const board = Math.floor(index / 2); const group = index % 2 + 1;
    return { instance_id: board ? `addon${board}_${group}` : `meter_main${group}`,
      phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]] };
  });
  return { mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: hash,
    topology_addon_count: addons, topology_project_name: project(addons), topology_connection_type: "wifi",
    topology_voltage_layout: "two_groups_per_board", connection_generation: 3, groups,
    verification_id: "b".repeat(32), offset_groups: [], power_offset_groups: [], source_authority: "saved_flash",
    source_handoff_available: true, source_handoff_transaction_id: null,
    source_handoff_firmware_installed: false };
}

async function mockHomeAssistant(page: Page, options: { addons?: number; outcome?: Outcome;
  calibration?: Calibration; rescan?: Array<"none" | "device" | "devices">; importable?: boolean;
  setupEvent?: "none" | "device" | "devices"; firmwareIndex?: typeof FIRMWARE_INDEX | null;
  firmwareRequests?: string[] } = {}) {
  const addons = options.addons ?? 0;
  const outcome = options.outcome ?? "success";
  const frames: Frame[] = [];
  let rescans = 0;
  let boundDeviceId: string | null = null;
  let nextSetupStatusUnavailable = false;
  let setupSubscriptionGeneration = 0;
  let currentTransaction = transaction("previewed", addons ? 42 : 1);
  let currentSession = session("safety_required", false, addons);
  const setupDevices = options.setupEvent === "devices"
    ? [device(addons, options.importable), device(addons, options.importable, "meter-2")]
    : options.setupEvent === "device" ? [device(addons, options.importable)] : [];
  const setupSnapshot = () => boundDeviceId
    ? { state: "topology_review", devices: setupDevices, bound_device_id: boundDeviceId }
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
      const ok = (result: unknown) => socket.send(JSON.stringify({ id, type: "result", success: true, result }));
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
        result = state === "none" ? { state: "no_device", devices: [] }
          : { state: "device_discovered", devices: state === "devices"
            ? [device(addons, options.importable), device(addons, options.importable, "meter-2")]
            : [device(addons, options.importable)], configuration_authoritative: false };
      } else if (operation === "adopt_device") {
        boundDeviceId = "meter-1";
        nextSetupStatusUnavailable = true;
        result = { device_id: "meter-1", configuration: "meter.yaml" };
      }
      else if (operation === "get_topology") result = {
        topology: topology(addons),
        package_options: {
          power_quality: Array.from({ length: addons + 1 }, () => false),
          status_fields: Array.from({ length: addons + 1 }, () => false),
        },
      };
      else if (operation === "get_meter_configuration") result = meterConfiguration(addons);
      else if (operation === "get_ct_inventory") result = inventory(addons);
      else if (operation === "get_active_work") result = {
        session: null, transaction: null, verified_calibration: null,
      };
      else if (operation === "set_ha_labels") result = { mode: "home_assistant_labels",
        results: [{ channel: 1, state: "updated" }] };
      else if (operation === "preview_ct_config") {
        if (outcome === "collision") return fail("CT_NAME_COLLISION", "Names resolve to the same entity ID");
        result = currentTransaction = transaction("previewed", Number((frame.changes as Array<{ channel: number }>)[0]?.channel ?? 1));
      } else if (operation === "preview_meter_configuration") {
        result = currentTransaction = transaction("previewed", 1);
      } else if (operation === "preview_calibrated_gains") {
        result = currentTransaction = { ...transaction("previewed", 1), transaction_id: "d".repeat(32) };
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
      } else if (operation === "install_ct_config") result = currentTransaction = { ...transaction("verified", addons ? 42 : 1,
        { progress: ["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted"] }),
        transaction_id: String(frame.transaction_id) };
      else if (operation === "clear_calibration_flash") result = { ...restart(addons), source_authority: "configuration",
        source_handoff_available: false, source_handoff_transaction_id: frame.transaction_id,
        source_handoff_firmware_installed: true };
      else if (operation === "rollback_ct_config") result = currentTransaction = transaction("rolled_back", addons ? 42 : 1,
        { progress: ["config_restored"] });
      else if (operation === "start_session") result = currentSession = session("safety_required", false, addons);
      else if (operation === "acknowledge_safety") result = currentSession = session("ready", true, addons);
      else if (operation === "check_offset_readiness") result = offsetReadiness(frame);
      else if (operation === "calibrate_offset") {
        const board = Number(frame.board_index); const stage = Number(frame.stage) as 1 | 2;
        const keys = board === 0 ? ["main_1", "main_2"] : [`addon${board}_1`, `addon${board}_2`];
        result = { state: "applied_pending_restart_verification", board_index: board, stage,
          expected_tables: keys.map((key) => [key, [[1, -1], [2, -2], [3, -3]]]),
          unfinished_group_keys: [], retry_allowed: false, error: null };
      } else if (operation === "skip_offset_calibration") {
        result = currentSession = session("ready", true, addons, currentSession.has_pending_calibration as boolean, "skipped");
      }
      else if (operation === "check_stability") result = stability(frame);
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
      else if (operation === "restart_and_verify") result = restart(addons);
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

const operations = (frames: Frame[]) => frames.map((frame) => frame.type.split("/").at(-1));

async function openInventory(page: Page): Promise<void> {
  await page.goto("/test/harness.html");
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();
  await expect(page.getByRole("heading", { name: "Setup Device", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Topology evidence", exact: true })).toBeVisible();
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole("heading", { name: "Meter Settings", exact: true })).toBeVisible();
  const preparation = page.getByLabel("Multi-reference preparation acknowledgement");
  if (await preparation.count()) await preparation.check();
  await page.locator('[data-action="continue-meter-settings"]').click();
  await expect(page.locator("#step-heading")).toHaveText("Circuits & CTs");
}

async function reviewChannel(page: Page, channel: number): Promise<void> {
  if (channel === 42) {
    await page.getByRole("tab", { name: "Add-on 6" }).click();
  }
  await page.getByLabel(`CT${channel} name`).fill(`Load ${channel}`);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Flash & Verify" })).toBeVisible();
}

async function reachCurrent(page: Page, channel: number): Promise<void> {
  if (channel === 42) {
    await page.getByRole("tab", { name: "Add-on 6" }).click();
  }
  await page.getByRole("button", { name: "Continue" }).click();
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
  await expect(page.getByText("No compatible device found")).toBeVisible();

  await page.locator('[data-action="rescan"]').click();
  await expect(page.getByText("No compatible device found")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Setup Device", exact: true })).toBeVisible();
  await expect(page.getByText(/(?:USB flash|installation|provisioning) complete/i)).toHaveCount(0);
  await page.locator('[name="addon-count"][value="6"]').locator("..").click();
  await page.locator('[name="connection-type"][value="ethernet_waveshare"]').locator("..").click();
  await expect(page.getByText("(15, 26)")).toBeVisible();
  await page.locator('[data-action="rescan"]').click();
  await expect(page.getByText("Device added to Home Assistant. Importing into ESPHome Builder…")).toBeVisible();
  await expect(page.getByText("Meter imported into ESPHome Builder.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Setup Device", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Topology evidence", exact: true })).toBeVisible();

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
  const alignment = await page.locator('.name-mode label').evaluateAll((labels) => labels.map((label) => {
    const input = label.querySelector('input')!.getBoundingClientRect();
    const row = label.getBoundingClientRect();
    return Math.abs(input.y + input.height / 2 - row.y - row.height / 2);
  }));
  expect(alignment.every((difference) => difference < 1)).toBe(true);
  await expect(page.getByLabel("CT4 model")).toHaveValue("");
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
  await expect(page.getByRole("heading", { name: "Flash & Verify" })).toBeVisible();
  expect(operations(frames)).toContain("preview_meter_configuration");
  expect(operations(frames)).not.toContain("preview_ct_config");
  const preview = frames.find((frame) => frame.type.endsWith("/preview_meter_configuration"))!;
  expect(preview.configuration).toMatchObject({ meter: { friendly_name: "Energy meter" } });
  expect(JSON.stringify(preview.configuration)).not.toContain("authoritative");
  expect(JSON.stringify(preview.configuration)).not.toContain("warnings");
});

test("topology package choices stay in the canonical preview payload", async ({ page }) => {
  const frames = await mockHomeAssistant(page);
  await openInventory(page);
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await page.locator('[data-feature="status_fields"][data-board="0"]').check();
  await page.locator('[data-action="continue"]').click();
  await page.locator('[data-action="continue-meter-settings"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Flash & Verify" })).toBeVisible();
  const preview = frames.find((frame) => frame.type.endsWith("/preview_meter_configuration"))!;
  expect(preview.configuration).toMatchObject({ power_quality: [false], status_fields: [true] });
});

test("topology package choice survives the first meter configuration load", async ({ page }) => {
  const frames = await mockHomeAssistant(page);
  await page.goto("/test/harness.html");
  await page.locator('[data-action="rescan"]').click();
  await page.locator('[data-action="configure-device"]').first().click();
  await expect(page.getByRole("heading", { name: "Topology evidence" })).toBeVisible();
  await page.locator('[data-feature="status_fields"][data-board="0"]').check();
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole("heading", { name: "Meter Settings", exact: true })).toBeVisible();
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
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.locator(".recovery-panel").filter({ hasText: "validation_failed" }).first()).toBeVisible();
  await expect(page.getByText("1 records (1 reported)")).toBeVisible();
  await page.getByRole("button", { name: "Rollback" }).click();
  await expect(page.getByText("rolled_back", { exact: true })).toBeVisible();
  expect(operations(frames)).toEqual(expect.arrayContaining(["preview_meter_configuration", "apply_ct_config", "rollback_ct_config"]));
  expect(operations(frames)).not.toContain("compile_ct_config");
});

test("compile failure blocks upload after a distinct apply acknowledgement", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { outcome: "compile" });
  await openInventory(page);
  await reviewChannel(page, 1);
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("Validated", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Compile" }).click();
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
  await expect(page.getByRole("heading", { name: "Flash & Verify" })).toBeVisible();
  await page.getByRole("button", { name: "Apply" }).click();
  await page.getByRole("button", { name: "Compile" }).click();
  await page.getByRole("button", { name: "Install", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Flash & Verify" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Setup Device" })).toHaveCount(0);
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole("heading", { name: "Safety", exact: true })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip offset calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip voltage calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip current calibration" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Summary", exact: true })).toBeVisible();
  await expect(page.getByText("Installed electrical profile")).toBeVisible();
  await expect(page.getByText("Authoritative configuration", { exact: true })).toBeVisible();
  await page.locator('[data-action="finish"]').click();
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();
  const ordered = operations(frames);
  expect(ordered.indexOf("install_ct_config")).toBeLessThan(ordered.indexOf("start_session"));
  expect(ordered.indexOf("start_session")).toBeLessThan(ordered.indexOf("complete_calibration_without_changes"));
});

test("42-channel separate install/rebind leads through main CT evidence and exact restart verification", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { addons: 6, calibration: "main-success" });
  await openInventory(page);
  await expect(page.locator('[data-board-tab]')).toHaveCount(7);
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
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Restart and verify" }).click();
  await expect(page.getByRole("heading", { name: "Flash & Verify" })).toBeVisible();
  await expect(page.getByLabel("Redacted substitution diff")).toBeVisible();
  await page.getByRole("button", { name: "Apply" }).click();
  await page.getByRole("button", { name: "Compile" }).click();
  await page.getByRole("button", { name: "Install", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();
  await expect(page.getByText(/Calibration was saved to YAML/)).toBeVisible();

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
