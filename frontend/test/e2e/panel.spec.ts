import { expect, test, type Page } from "@playwright/test";
import sanitizerContract from "../../../tests/fixtures/task20_sanitized_change.json" with { type: "json" };

type Frame = Record<string, unknown> & { id?: number; type: string };
type Outcome = "success" | "collision" | "validation" | "compile";
type Calibration = "main-success" | "addon-indeterminate" | undefined;

const hash = "a".repeat(64);

function project(addons: number): string {
  return addons ? `circuitsetup.6c-energy-meter-${addons}-addons` : "circuitsetup.6c-energy-meter";
}

function device(addons: number, importable = false) {
  return { entry_id: "meter-1", title: "CircuitSetup meter", project_name: project(addons),
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

function transaction(state: string, channel: number, options: { evidence?: string[]; progress?: string[];
  rollback?: boolean; validation?: boolean } = {}) {
  return { ...sanitizerContract.sanitized, transaction_id: "tx-1", state, source_sha256: hash,
    changes: [{ key: `ct${channel}_name`, old_value: `CT${channel}`, new_value: `Load ${channel}` }],
    redacted_diff: `- ct${channel}_name: <redacted>\n+ ct${channel}_name: <redacted>`,
    rollback_available: options.rollback ?? false, evidence: options.evidence ?? [], progress: options.progress ?? [],
    ...(options.validation ? { validation_detail: { code: 1, reported_error_count: 1,
      reported_warning_count: 0, error_record_count: 1, warning_record_count: 0 } } : {}) };
}

function session(state: string, acknowledged: boolean) {
  return { session_id: "session-1", device_id: "meter-1", state, safety_acknowledged: acknowledged,
    preflight: { issues: [], zeroed_roles: ["main_1.reference_voltage", "ct1.reference_current"] } };
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
    verification_id: "b".repeat(32), source_authority: "saved_flash",
    source_handoff_available: true, source_handoff_transaction_id: null,
    source_handoff_firmware_installed: false };
}

async function mockHomeAssistant(page: Page, options: { addons?: number; outcome?: Outcome;
  calibration?: Calibration; rescan?: Array<"none" | "device">; importable?: boolean } = {}) {
  const addons = options.addons ?? 0;
  const outcome = options.outcome ?? "success";
  const frames: Frame[] = [];
  let rescans = 0;
  let currentTransaction = transaction("previewed", addons ? 42 : 1);
  let currentSession = session("safety_required", false);

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
      if (operation === "setup_status") result = { state: "no_device", devices: [] };
      else if (operation === "set_installer_intent") result = { state: "installer_guide", devices: [],
        installer_intent: { addon_count: frame.addon_count, connection_type: frame.connection_type } };
      else if (operation === "rescan") {
        const state = options.rescan?.[rescans++] ?? "device";
        result = state === "none" ? { state: "no_device", devices: [] }
          : { state: "device_discovered", devices: [device(addons, options.importable)], configuration_authoritative: false };
      } else if (operation === "adopt_device") result = { device_id: "meter-1", configuration: "meter.yaml" };
      else if (operation === "get_topology") result = topology(addons);
      else if (operation === "get_ct_inventory") result = inventory(addons);
      else if (operation === "set_ha_labels") result = { mode: "home_assistant_labels",
        results: [{ channel: 1, state: "updated" }] };
      else if (operation === "preview_ct_config") {
        if (outcome === "collision") return fail("CT_NAME_COLLISION", "Names resolve to the same entity ID");
        result = currentTransaction = transaction("previewed", Number((frame.changes as Array<{ channel: number }>)[0]?.channel ?? 1));
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
      else if (operation === "start_session") result = currentSession = session("safety_required", false);
      else if (operation === "acknowledge_safety") result = currentSession = session("ready", true);
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
      } else if (operation === "get_session") result = currentSession = session("ready", true);
      else if (operation === "restart_and_verify") result = restart(addons);
      else if (operation === "cancel_session") result = currentSession = session("cancelled", false);
      else if (operation === "subscribe_setup") result = { state: "no_device", devices: [] };
      else if (operation === "subscribe_config_transaction") result = currentTransaction;
      else if (operation === "subscribe_session") result = currentSession;
      else return fail("unknown_command", operation);
      ok(result);
      if (operation.startsWith("subscribe_")) {
        setTimeout(() => socket.send(JSON.stringify({ id, type: "event", event: result })), 0);
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
  await page.locator('[data-action="configure-device"]').click();
  await expect(page.getByRole("heading", { name: "Topology", exact: true })).toBeVisible();
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole("heading", { name: "CT Verification" })).toBeVisible();
}

async function reviewChannel(page: Page, channel: number): Promise<void> {
  if (channel === 42) {
    await page.getByRole("tab", { name: "Add-on 6" }).click();
    await page.getByRole("button", { name: /Group 2 · CT40/ }).click();
  }
  await page.getByLabel(`CT${channel} name`).fill(`Load ${channel}`);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Safety", exact: true })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip voltage calibration" }).click();
  await page.getByRole("button", { name: "Skip current calibration" }).click();
  await expect(page.getByRole("heading", { name: "Flash & Verify" })).toBeVisible();
}

async function reachCurrent(page: Page, channel: number): Promise<void> {
  if (channel === 42) {
    await page.getByRole("tab", { name: "Add-on 6" }).click();
    await page.getByRole("button", { name: /Group 2 · CT40/ }).click();
  }
  await page.getByLabel(`CT${channel} name`).fill(`Load ${channel}`);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Safety", exact: true })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Voltage", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Skip voltage calibration" }).click();
  await expect(page.getByRole("heading", { name: "Current", exact: true })).toBeVisible();
}

test("native mocked HA websocket covers no-device, installer intent, wiring, rescan, discovery, and adoption", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { addons: 6, rescan: ["none", "device"], importable: true });
  await page.goto("/test/harness.html");
  await expect(page.getByText("No compatible device found")).toBeVisible();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Open CircuitSetup Web Installer" }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL("https://circuitsetup.github.io/ESPWebInstaller/");
  await popup.close();

  await page.locator('[data-action="rescan"]').click();
  await expect(page.getByText("No compatible device found")).toBeVisible();
  await page.locator('[name="addon-count"][value="6"]').locator("..").click();
  await page.locator('[name="connection-type"][value="ethernet_waveshare"]').locator("..").click();
  await expect(page.getByText("(15, 26)")).toBeVisible();
  await page.locator('[data-action="rescan"]').click();
  await expect(page.getByText("Device Builder: Yes — import available")).toBeVisible();
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByText("Meter adopted in Device Builder.")).toBeVisible();

  expect(frames[0]).toEqual({ type: "auth", access_token: "playwright-token" });
  const intents = frames.filter((frame) => frame.type.endsWith("/set_installer_intent"));
  expect(intents).toMatchObject([{ addon_count: 0, connection_type: "wifi" },
    { addon_count: 6, connection_type: "ethernet_waveshare" }]);
  expect(operations(frames)).toEqual(expect.arrayContaining(["subscribe_setup", "rescan", "adopt_device"]));
});

test("six-channel inventory exposes ambiguous gain while label-only stays out of preview and collisions refuse", async ({ page }) => {
  const frames = await mockHomeAssistant(page, { outcome: "collision" });
  await openInventory(page);
  await expect(page.locator('[data-ct-row]')).toHaveCount(6);
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
  await expect(page.getByRole("heading", { name: "CT Verification" })).toBeVisible();
  await page.getByLabel("ESPHome / firmware names").check();
  await page.getByLabel("CT2 name").fill("Kitchen mains");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip voltage calibration" }).click();
  await page.getByRole("button", { name: "Skip current calibration" }).click();
  await expect(page.getByRole("alert")).toContainText("preview is stale");
  expect(operations(frames).filter((value) => value === "preview_ct_config")).toHaveLength(1);
  expect(operations(frames)).not.toContain("apply_ct_config");
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
  expect(operations(frames)).toEqual(expect.arrayContaining(["preview_ct_config", "apply_ct_config", "rollback_ct_config"]));
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
  expect(frames.find((frame) => frame.type.endsWith("/preview_calibrated_gains"))).toMatchObject({
    changes: [{ channel: 42, name: "Load 42" }],
  });
  expect(frames.find((frame) => frame.type.endsWith("/acknowledge_safety"))).toMatchObject({ acknowledged: true });
  expect(frames.find((frame) => frame.type.endsWith("/calibrate_current"))).toMatchObject({ references: [{ channel: 1,
    reference: 5 }], pending_multipliers: [{ channel: 42, reporting_multiplier: 1 }], confirm_iteration: true });
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
