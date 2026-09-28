import { describe, expect, it } from "vitest";

import {
  calibrationSubsteps,
  configurationModeFor,
  previousWorkflowRoute,
  resumeWorkflowRoute,
  workflowPhases,
  workflowRoutes,
  type WorkflowContext,
  type WorkflowRoute,
} from "../src/workflow-model";

const base: WorkflowContext = {
  journeyOrigin: "new_install",
  configurationMode: "helper_managed",
  legacyChoice: null,
  calibrationPlan: "standard",
  canonicalConfigurationChanged: true,
  normalTransactionRequired: true,
  normalTransactionActive: false,
  normalTransactionVerified: false,
  transactionPurpose: null,
  sessionState: null,
  offsetDisposition: "skipped",
  pendingCalibration: false,
  restartVerification: false,
  handoffAvailable: false,
  handoffInstalled: false,
  completedWithoutCalibration: false,
};

const context = (changes: Partial<WorkflowContext> = {}): WorkflowContext => ({
  ...base,
  ...changes,
});

describe("workflowRoutes", () => {
  it("routes stock reviews and pending recovery before generic verified/no-change completion", () => {
    const stock = context({ calibrationPlan: "full", normalTransactionRequired: false, offsetDisposition: "not_started", offsetRecoveryPending: true });
    expect(workflowRoutes({ ...stock, transactionPurpose: "offset_preparation" })).toContain("install-configuration");
    expect(resumeWorkflowRoute({ ...stock, transactionPurpose: "offset_preparation" })).toBe("install-configuration");
    expect(resumeWorkflowRoute({ ...stock, transactionPurpose: "offset_finalization" })).toBe("save-calibration");
    expect(resumeWorkflowRoute({ ...stock, sessionState: "gains_verified_offsets_pending", restartVerification: true })).toBe("save-calibration");
    expect(resumeWorkflowRoute({ ...stock, sessionState: "verified", restartVerification: true })).toBe("offset");
    expect(resumeWorkflowRoute({ ...stock, sessionState: "offset_configuration_selected", offsetRecoveryPending: false, offsetConfigurationSelected: true })).toBe("summary");
  });
  const matrix: Array<{
    name: string;
    changes: Partial<WorkflowContext>;
    expected: WorkflowRoute[];
  }> = [
    {
      name: "new install",
      changes: {},
      expected: ["setup", "meter", "ct", "install-configuration", "calibration-plan", "safety", "voltage", "current", "summary"],
    },
    {
      name: "existing helper-managed meter",
      changes: { journeyOrigin: "existing_meter", normalTransactionRequired: false },
      expected: ["setup", "meter", "ct", "calibration-plan", "safety", "voltage", "current", "summary"],
    },
    {
      name: "legacy meter awaiting a choice",
      changes: { journeyOrigin: "existing_meter", configurationMode: "legacy_editable" },
      expected: ["setup", "legacy-review"],
    },
    {
      name: "legacy meter managed by the helper",
      changes: { journeyOrigin: "existing_meter", configurationMode: "legacy_editable", legacyChoice: "manage_with_helper" },
      expected: ["setup", "legacy-review", "meter", "ct", "install-configuration", "calibration-plan", "safety", "voltage", "current", "summary"],
    },
    {
      name: "legacy meter calibrated without migration",
      changes: { journeyOrigin: "existing_meter", configurationMode: "legacy_editable", legacyChoice: "calibrate_only", normalTransactionRequired: false },
      expected: ["setup", "legacy-review", "calibration-plan", "safety", "voltage", "current", "summary"],
    },
    {
      name: "runtime-only meter",
      changes: { configurationMode: "runtime_only", normalTransactionRequired: false },
      expected: ["setup", "calibration-plan", "safety", "voltage", "current", "summary"],
    },
    {
      name: "full calibration",
      changes: { calibrationPlan: "full", pendingCalibration: true },
      expected: ["setup", "meter", "ct", "install-configuration", "calibration-plan", "safety", "offset", "voltage", "current", "restart", "summary"],
    },
    {
      name: "existing calibration kept",
      changes: { calibrationPlan: "keep_existing" },
      expected: ["setup", "meter", "ct", "install-configuration", "calibration-plan", "summary"],
    },
    {
      name: "verified configuration install",
      changes: { normalTransactionRequired: false, normalTransactionVerified: true },
      expected: ["setup", "meter", "ct", "install-configuration", "calibration-plan", "safety", "voltage", "current", "summary"],
    },
    {
      name: "verified calibration handoff",
      changes: { normalTransactionRequired: false, pendingCalibration: true, handoffAvailable: true, transactionPurpose: "save_calibration" },
      expected: ["setup", "meter", "ct", "calibration-plan", "safety", "voltage", "current", "restart", "save-calibration", "summary"],
    },
  ];

  it.each(matrix)("derives the $name path", ({ changes, expected }) => {
    expect(workflowRoutes(context(changes))).toEqual(expected);
  });

  it("waits for a calibration-plan choice before exposing live calibration", () => {
    expect(workflowRoutes(context({ calibrationPlan: null }))).toEqual([
      "setup", "meter", "ct", "install-configuration", "calibration-plan",
    ]);
  });

  it("never exposes configuration or save routes for runtime-only meters", () => {
    const routes = workflowRoutes(context({
      configurationMode: "runtime_only",
      normalTransactionRequired: false,
      handoffAvailable: true,
    }));
    const forbidden: WorkflowRoute[] = [
      "meter", "ct", "install-configuration", "save-calibration",
    ];
    expect(routes.some((route) => forbidden.includes(route))).toBe(false);
  });

  it("uses distinct route IDs for the two transaction purposes", () => {
    const routes = workflowRoutes(context({
      pendingCalibration: true,
      handoffAvailable: true,
      transactionPurpose: "save_calibration",
    }));
    expect(routes.filter((route) => route === "install-configuration")).toHaveLength(1);
    expect(routes.filter((route) => route === "save-calibration")).toHaveLength(1);
    expect(routes).not.toContain("build");
  });
});

describe("configurationModeFor", () => {
  it.each([
    ["new_install", "legacy_inferred", false, "helper_managed"],
    ["existing_meter", "helper_managed", false, "helper_managed"],
    ["existing_meter", "legacy_inferred", false, "legacy_editable"],
    ["existing_meter", null, true, "runtime_only"],
  ] as const)("classifies %s / %s", (journeyOrigin, semanticSource, runtimeOnly, expected) => {
    expect(configurationModeFor({ journeyOrigin, semanticSource, runtimeOnly })).toBe(expected);
  });
});

describe("workflow progress", () => {
  it("keeps top-level phase indexes monotonic across forward routes", () => {
    const state = context({
      calibrationPlan: "full",
      pendingCalibration: true,
      handoffAvailable: true,
    });
    const indexes = workflowRoutes(state).map((route) =>
      workflowPhases(state, route).find((phase) => phase.status === "current")!.index);
    expect(indexes.every((value, index) => index === 0 || value >= indexes[index - 1]!)).toBe(true);
  });

  it("groups all calibration routes into one phase", () => {
    const phases = workflowPhases(context({ calibrationPlan: "full" }), "current");
    expect(phases.filter((phase) => phase.id === "calibration")).toHaveLength(1);
  });

  it("shows only applicable calibration substeps", () => {
    expect(calibrationSubsteps(context(), "safety").map((step) => step.id)).toEqual([
      "calibration-plan", "safety", "voltage", "current",
    ]);
    expect(calibrationSubsteps(context({ calibrationPlan: "full", pendingCalibration: true }), "offset").map((step) => step.id)).toEqual([
      "calibration-plan", "safety", "offset", "voltage", "current", "restart",
    ]);
  });

  it("marks calibration complete after leaving its phase", () => {
    const steps = calibrationSubsteps(context({ pendingCalibration: true, handoffAvailable: true }), "save-calibration");
    expect(steps.every((step) => step.status === "completed")).toBe(true);
  });
});

describe("workflow navigation", () => {
  it("derives Back from the selected branch", () => {
    expect(previousWorkflowRoute(context(), "ct")).toBe("meter");
    expect(previousWorkflowRoute(context({
      journeyOrigin: "existing_meter",
      configurationMode: "legacy_editable",
      legacyChoice: "calibrate_only",
      normalTransactionRequired: false,
    }), "calibration-plan")).toBe("legacy-review");
  });

  it("resumes active normal and calibration-save transactions", () => {
    expect(resumeWorkflowRoute(context({
      normalTransactionActive: true,
      transactionPurpose: "install_configuration",
    }))).toBe("install-configuration");
    expect(resumeWorkflowRoute(context({
      normalTransactionRequired: false,
      transactionPurpose: "save_calibration",
      handoffAvailable: true,
    }))).toBe("save-calibration");
  });

  it("resumes restart verification and verified no-handoff outcomes", () => {
    expect(resumeWorkflowRoute(context({
      sessionState: "applied_pending_restart_verification",
      pendingCalibration: true,
    }))).toBe("restart");
    expect(resumeWorkflowRoute(context({
      sessionState: "verified",
      restartVerification: true,
    }))).toBe("summary");
  });
});
