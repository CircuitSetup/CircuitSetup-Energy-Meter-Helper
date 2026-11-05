import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "lit";
import "../src/index";
import type { CircuitSetupPanel } from "../src/panel";
import { workflowPhases, workflowRoutes, resumeWorkflowRoute, type WorkflowContext } from "../src/workflow-model";
import { voltageStep } from "../src/components/voltage-step";
import { calibrationPlanStep } from "../src/components/calibration-plan-step";
import { meterResponse } from "./workflow-scenarios";

const context = (changes: Partial<WorkflowContext> = {}): WorkflowContext => ({
  configurationMode: "helper_managed", legacyChoice: null, calibrationPlan: null,
  normalTransactionRequired: false, normalTransactionActive: false, normalTransactionVerified: false,
  transactionPurpose: null, sessionState: null, offsetDisposition: null, pendingCalibration: false,
  restartVerification: false, handoffAvailable: false, handoffInstalled: false,
  completedWithoutCalibration: false, ...changes,
});
const panel = () => document.createElement("circuitsetup-energy-meter-helper-panel") as CircuitSetupPanel;
afterEach(() => document.body.replaceChildren());

describe("simplified workflow", () => {
  it("preserves unchosen calibration and external ownership in panel context", () => {
    const view = panel() as any;
    view.setup = { devices: [{ entry_id: "meter", configuration: "meter.yaml" }] };
    view.selectedDeviceId = "meter";
    expect(view.workflowContext().calibrationPlan).toBeNull();
    expect(view.workflowContext().legacyChoice).toBeNull();
    expect(view.workflowContext().configurationMode).toBe("legacy_editable");
  });
  it("represents restored offset finalization without an invented calibration plan", () => {
    const state = context({ transactionPurpose: "offset_finalization", offsetRecoveryPending: true });
    expect(workflowRoutes(state)).toContain(resumeWorkflowRoute(state));
    expect(workflowPhases(state, "save-calibration").find(p => p.status === "current")?.id).toBe("calibration");
  });
  it("keeps preparation inside calibration", () => {
    const state = context({ calibrationPlan: "full", transactionPurpose: "offset_preparation" });
    expect(workflowPhases(state, "install-configuration").find(p => p.status === "current")?.id).toBe("calibration");
  });
  it("groups configuration screens and labels unneeded calibration distinctly", () => {
    const phases = workflowPhases(context({ calibrationPlan: "keep_existing" }), "summary");
    expect(phases.map(p => p.id)).toEqual(["device", "meter", "calibration", "complete"]);
    expect(phases.find(p => p.id === "calibration")?.status).toBe("skipped");
  });
  it("radio selection does not start calibration", () => {
    const host = document.createElement("div"); document.body.append(host); const choose = vi.fn(); const start = vi.fn();
    render(calibrationPlanStep(null, choose, () => {}, false, false, start), host);
    host.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1]!.click();
    expect(choose).toHaveBeenCalledWith("standard"); expect(start).not.toHaveBeenCalled();
    render(calibrationPlanStep("standard", choose, () => {}, false, false, start), host);
    host.querySelector<HTMLButtonElement>('[data-action="start-calibration"]')!.click();
    expect(start).toHaveBeenCalledOnce();
  });
  it("refuses sidebar exit during pending operations or a saved transaction", () => {
    const view = panel() as any;
    view.selectedDeviceId = "meter"; view.pendingAction = "compile";
    view.returnToSetup(); expect(view.selectedDeviceId).toBe("meter");
    view.pendingAction = ""; view.transaction = { purpose: "install_configuration", state: "validated", evidence: [] };
    view.returnToSetup(); expect(view.selectedDeviceId).toBe("meter");
  });
  it("calibrating only CT1 allows intentionally keeping the remaining gains", () => {
    const view = panel() as any;
    view.topology = meterResponse().topology;
    view.meterConfiguration = meterResponse(); view.configurationMode = "helper_managed";
    view.session = { state: "applied_pending_restart_verification", calibration_plan: "standard", has_pending_calibration: true };
    view.currentReferences = new Map([[1, 5]]);
    view.calibrationByTarget = new Map([["current:1", { state: "applied_pending_restart_verification", changed_channels: [1], iteration: 1 }]]);
    expect(view.calibrationContinuationBlocked("current")).toBe(false);
    view.calibrationByTarget.set("current:1", { state: "calibration_outcome_indeterminate", changed_channels: [], iteration: 1 });
    expect(view.calibrationContinuationBlocked("current")).toBe(true);
  });
  it("entered unrun references are explicit before keeping existing gains", () => {
    const view = panel() as any; view.currentReferences = new Map([[1, 5]]);
    expect(view.unrunReferences("current")).toEqual(["CT1"]);
  });
});
describe("review regressions", () => {
  const connected = () => { const view = panel() as any; Object.defineProperty(view, "isConnected", { value: true }); return view; };
  const session = (state = "ready", pending = false) => ({ session_id: "s", device_id: "meter", state,
    safety_acknowledged: state !== "safety_required", calibration_plan: "standard", has_pending_calibration: pending });
  it("opens bound custom meters without requiring Builder inspection", async () => {
    const view = connected(); const meter = meterResponse(); meter.topology.project_name = "custom.meter";
    view.setup = { bound_device_id: "meter", devices: [{ entry_id: "meter", configuration: "meter.yaml", project_name: "custom.meter" }] };
    view.api = { getTopology: vi.fn(async () => meter.topology), getMeterConfiguration: vi.fn(async () => meter),
      getActiveWork: async () => ({ session: null, transaction: null, verified_calibration: null }), inspectExistingMeter: vi.fn() };
    await view.configureDevice("meter");
    expect(view.api.getTopology).toHaveBeenCalledOnce(); expect(view.api.inspectExistingMeter).not.toHaveBeenCalled();
  });
  it("uses the binding when the selected meter arrives through discovery", () => {
    const view = panel() as any; const configure = vi.fn(); const adopt = vi.fn();
    view.configureDevice = configure; view.adopt = adopt;
    view.receiveSetupSnapshot({ bound_device_id: "meter", devices: [{ entry_id: "meter", project_name: "circuitsetup.6c-energy-meter", configuration: null }] }, true);
    expect(configure).toHaveBeenCalledWith("meter"); expect(adopt).not.toHaveBeenCalled();
  });
  it("saves names despite unrelated invalid draft totals", () => {
    const view = panel() as any; const meter = meterResponse(); view.meterConfiguration = meter;
    view.configurationMode = "helper_managed"; view.initializeInventory(meter); view.step = "ct";
    view.labelOnly = true; view.totalGraphState = "invalid";
    const host = document.createElement("div"); render(view.stepBody(), host);
    expect(host.querySelector<HTMLButtonElement>('[data-action="continue"]')!.disabled).toBe(false);
  });
  it("does not mark pending calibration as unchanged when Keep is requested", async () => {
    const view = connected(); view.selectedDeviceId = "meter"; view.configurationMode = "runtime_only";
    view.session = session("applied_pending_restart_verification", true);
    await view.continueCalibrationPlan("keep_existing");
    expect(view.step).toBe("restart"); expect(view.completedWithoutChanges).toBe(false);
  });
  it("completes an existing no-change session through the server before Done", async () => {
    const view = connected(); view.selectedDeviceId = "meter"; view.configurationMode = "runtime_only";
    view.session = session(); view.api = { completeCalibrationWithoutChanges: vi.fn(async () => session("verified")) };
    await view.continueCalibrationPlan("keep_existing");
    expect(view.api.completeCalibrationWithoutChanges).toHaveBeenCalledWith("s");
    expect(view.session.state).toBe("verified"); expect(view.completedWithoutChanges).toBe(true);
  });
  it("clears old meter selection only after cancellation is confirmed", async () => {
    const view = connected(); view.selectedDeviceId = "meter"; view.session = session();
    view.configurationInstalled = true; view.topology = meterResponse().topology;
    view.api = { cancelSession: async () => session("cancelled") };
    await view.cancelSession("setup");
    expect(view.selectedDeviceId).toBeNull(); expect(view.topology).toBeNull();
    expect(view.announcement).toContain("Installed configuration");
  });
  it("checks and calibrates only voltage references the user entered", async () => {
    const view = connected(); view.selectedDeviceId = "meter"; view.session = session();
    view.configurationMode = "runtime_only"; view.topology = { ...meterResponse().topology, voltage_layout: "two_voltages" };
    view.voltageReferences = new Map([["main", 120], ["secondary", 0]]);
    const stable = { stable: true, windows: [], target: "voltage", target_id: "main" };
    view.api = { checkStability: vi.fn(async () => stable), calibrateVoltage: vi.fn(async () => []), getSession: async () => session("applied_pending_restart_verification", true) };
    await view.checkStability("voltage"); expect(view.api.checkStability).toHaveBeenCalledTimes(1);
    await view.calibrate("voltage"); expect(view.api.calibrateVoltage).toHaveBeenCalledWith("s", "main", 120, true);
  });
});
it("refreshes calibration capability after installing preparation", async () => {
  const view = panel() as any; Object.defineProperty(view, "isConnected", { value: true });
  view.selectedDeviceId = "meter"; view.configurationMode = "runtime_only";
  view.calibrationPreparation = { state: "available_to_prepare", reason_code: "calibration_flag_disabled" };
  const transaction = { transaction_id: "tx", source_sha256: "hash", purpose: "install_configuration", state: "install_confirmation_required", changes: [{ key: "package.main.calibration", old_value: "disabled", new_value: "enabled" }], progress: [], evidence: [] };
  view.transaction = transaction;
  view.api = { installCtConfig: async () => ({ ...transaction, state: "verified" }),
    getTopology: vi.fn(async () => ({ topology: meterResponse().topology, calibration_preparation: { state: "ready", reason_code: "ready" } })) };
  await view.transactionAction("install");
  expect(view.api.getTopology).toHaveBeenCalledOnce(); expect(view.calibrationPreparation.state).toBe("ready");
});
it("disables sampling when the entered voltage reference is already calibrated", () => {
  const host = document.createElement("div"); const noop = () => {};
  render(voltageStep(meterResponse().topology, null, 0, [120, 0], ["Main", "Secondary"], null, [], false,
    noop, noop, noop, noop, noop, noop, false), host);
  const check = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Check stability")!;
  expect(check.disabled).toBe(true);
});
it("keeps a retained installation reachable before source classification and during review reload", () => {
  const retained = context({ configurationMode: "legacy_editable", transactionPurpose: "install_configuration", normalTransactionActive: true });
  expect(workflowRoutes(retained)).toContain(resumeWorkflowRoute(retained));
  expect(workflowRoutes({ ...retained, configurationMode: "helper_managed", normalTransactionActive: false })).toContain("install-configuration");
});
it("keeps the calibration phase current until a Keep selection is confirmed", () => {
  const state = context({ calibrationPlan: "keep_existing" });
  expect(workflowPhases(state, "calibration-plan").find(phase => phase.id === "calibration")?.status).toBe("current");
});