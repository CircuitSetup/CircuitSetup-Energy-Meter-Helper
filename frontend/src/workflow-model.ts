export type JourneyOrigin = "new_install" | "existing_meter";

export type ConfigurationMode =
  | "helper_managed"
  | "legacy_editable"
  | "runtime_only";

export type ExistingConfigurationChoice =
  | "manage_with_helper"
  | "calibrate_only"
  | null;

export type CalibrationPlan =
  | "keep_existing"
  | "standard"
  | "full"
  | null;

export type TransactionPurpose =
  | "install_configuration"
  | "save_calibration"
  | "offset_preparation"
  | "offset_finalization"
  | null;

export type WorkflowRoute =
  | "setup"
  | "legacy-review"
  | "meter"
  | "ct"
  | "install-configuration"
  | "calibration-plan"
  | "safety"
  | "offset"
  | "voltage"
  | "current"
  | "restart"
  | "save-calibration"
  | "summary";

export type WorkflowPhaseId =
  | "device"
  | "legacy-review"
  | "meter"
  | "ct"
  | "install-configuration"
  | "calibration"
  | "save-calibration"
  | "complete";

export type WorkflowStatus = "completed" | "current" | "upcoming";

export interface WorkflowPhase {
  id: WorkflowPhaseId;
  index: number;
  status: WorkflowStatus;
}

export type WorkflowSubstepId =
  | "calibration-plan"
  | "safety"
  | "offset"
  | "voltage"
  | "current"
  | "restart";

export interface WorkflowSubstep {
  id: WorkflowSubstepId;
  status: WorkflowStatus;
}

export interface WorkflowContext {
  journeyOrigin: JourneyOrigin;
  configurationMode: ConfigurationMode;
  legacyChoice: ExistingConfigurationChoice;
  calibrationPlan: CalibrationPlan;
  canonicalConfigurationChanged: boolean;
  normalTransactionRequired: boolean;
  normalTransactionActive: boolean;
  normalTransactionVerified: boolean;
  transactionPurpose: TransactionPurpose;
  sessionState: string | null;
  offsetDisposition: string | null;
  pendingCalibration: boolean;
  restartVerification: boolean;
  handoffAvailable: boolean;
  handoffInstalled: boolean;
  completedWithoutCalibration: boolean;
  offsetRecoveryPending?: boolean;
  offsetConfigurationSelected?: boolean;
}

export function configurationModeFor(input: {
  journeyOrigin: JourneyOrigin;
  semanticSource: "helper_managed" | "legacy_inferred" | null;
  runtimeOnly: boolean;
}): ConfigurationMode {
  if (input.runtimeOnly) return "runtime_only";
  if (input.semanticSource === "helper_managed" || input.journeyOrigin === "new_install") {
    return "helper_managed";
  }
  return "legacy_editable";
}

export function workflowRoutes(context: WorkflowContext): WorkflowRoute[] {
  const routes: WorkflowRoute[] = ["setup"];
  const legacy = context.configurationMode === "legacy_editable";
  if (legacy) routes.push("legacy-review");
  if (legacy && context.legacyChoice === null) return routes;

  const configurationEnabled = context.configurationMode !== "runtime_only"
    && (!legacy || context.legacyChoice === "manage_with_helper");
  if (configurationEnabled) {
    routes.push("meter", "ct");
    if (context.normalTransactionRequired
      || context.normalTransactionActive
      || context.normalTransactionVerified) {
      routes.push("install-configuration");
    }
  }

  routes.push("calibration-plan");
  if (context.calibrationPlan === "standard" || context.calibrationPlan === "full") {
    routes.push("safety");
    if (context.calibrationPlan === "full") routes.push("offset");
    if (context.transactionPurpose === "offset_preparation" && !routes.includes("install-configuration")) routes.push("install-configuration");
    routes.push("voltage", "current");
    if (restartRequired(context)) routes.push("restart");
    if (context.configurationMode !== "runtime_only" && saveCalibrationRequired(context)) {
      routes.push("save-calibration");
    }
  }
  if (context.calibrationPlan !== null) routes.push("summary");
  return routes;
}

export function workflowPhases(
  context: WorkflowContext,
  activeRoute: WorkflowRoute,
): WorkflowPhase[] {
  const routes = workflowRoutes(context);
  if (!routes.includes(activeRoute)) throw new Error(`invalid workflow route: ${activeRoute}`);
  const ids = [...new Set(routes.map(phaseIdForRoute))];
  const current = ids.indexOf(phaseIdForRoute(activeRoute));
  return ids.map((id, index) => ({ id, index, status: statusFor(index, current) }));
}

export function calibrationSubsteps(
  context: WorkflowContext,
  activeRoute: WorkflowRoute,
): WorkflowSubstep[] {
  const ids: WorkflowSubstepId[] = ["calibration-plan"];
  if (context.calibrationPlan === "standard" || context.calibrationPlan === "full") {
    ids.push("safety");
    if (context.calibrationPlan === "full") ids.push("offset");
    ids.push("voltage", "current");
    if (restartRequired(context)) ids.push("restart");
  }
  const current = ids.indexOf(activeRoute as WorkflowSubstepId);
  const completed = phaseIdForRoute(activeRoute) === "save-calibration"
    || activeRoute === "summary";
  return ids.map((id, index) => ({
    id,
    status: completed ? "completed" : statusFor(index, current),
  }));
}

export function previousWorkflowRoute(
  context: WorkflowContext,
  activeRoute: WorkflowRoute,
): WorkflowRoute | null {
  const routes = workflowRoutes(context);
  const index = routes.indexOf(activeRoute);
  return index > 0 ? routes[index - 1]! : null;
}

export function resumeWorkflowRoute(context: WorkflowContext): WorkflowRoute {
  if (context.transactionPurpose === "offset_preparation") return "install-configuration";
  if (context.transactionPurpose === "offset_finalization") return "save-calibration";
  if (context.normalTransactionActive) return "install-configuration";
  if (context.offsetConfigurationSelected && !context.offsetRecoveryPending) return "summary";
  if (context.sessionState === "safety_required" || context.sessionState === "preflight_failed") return "safety";
  if (context.offsetRecoveryPending) {
    return context.sessionState === "gains_verified_offsets_pending" || ["completed", "skipped"].includes(context.offsetDisposition ?? "")
      ? "save-calibration" : "offset";
  }
  if (context.transactionPurpose === "save_calibration"
    && (context.handoffAvailable || context.handoffInstalled)) {
    return "save-calibration";
  }
  if (context.normalTransactionActive) return "install-configuration";
  if (context.sessionState === "applied_pending_restart_verification") return "restart";
  if (context.sessionState === "verified" || context.restartVerification) {
    return context.handoffAvailable ? "save-calibration" : "summary";
  }
  if (context.sessionState === "safety_required" || context.sessionState === "preflight_failed") {
    return "safety";
  }
  if (context.sessionState !== null) {
    if (context.calibrationPlan === "full"
      && !["completed", "skipped"].includes(context.offsetDisposition ?? "")) {
      return "offset";
    }
    return "voltage";
  }
  const routes = workflowRoutes(context);
  return routes.at(-1) === "summary" ? routes.at(-2) ?? "summary" : routes.at(-1) ?? "setup";
}

function restartRequired(context: WorkflowContext): boolean {
  return !context.completedWithoutCalibration && (context.pendingCalibration
    || context.restartVerification
    || context.sessionState === "applied_pending_restart_verification"
    || context.sessionState === "verified");
}

function saveCalibrationRequired(context: WorkflowContext): boolean {
  return context.offsetRecoveryPending || context.offsetConfigurationSelected || context.transactionPurpose === "offset_finalization" || context.handoffAvailable
    || context.handoffInstalled
    || context.transactionPurpose === "save_calibration";
}

function statusFor(index: number, current: number): WorkflowStatus {
  if (current < 0 || index > current) return "upcoming";
  return index < current ? "completed" : "current";
}

function phaseIdForRoute(route: WorkflowRoute): WorkflowPhaseId {
  switch (route) {
    case "setup": return "device";
    case "legacy-review": return "legacy-review";
    case "meter": return "meter";
    case "ct": return "ct";
    case "install-configuration": return "install-configuration";
    case "calibration-plan":
    case "safety":
    case "offset":
    case "voltage":
    case "current":
    case "restart":
      return "calibration";
    case "save-calibration": return "save-calibration";
    case "summary": return "complete";
    default: return assertNever(route);
  }
}

function assertNever(value: never): never {
  throw new Error(`unhandled workflow value: ${String(value)}`);
}
