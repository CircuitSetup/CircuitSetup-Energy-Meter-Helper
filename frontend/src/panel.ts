import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from "lit";

import { HelperApi, type HomeAssistant } from "./api";
import { buildInstallStep, canLeaveTransaction } from "./components/build-install-step";
import { calibrationPlanStep } from "./components/calibration-plan-step";
import { changesFromDrafts, circuitConfigurationIsValid, ctInventoryStep, type CtDraft } from "./components/ct-inventory-step";
import { currentStep } from "./components/current-step";
import { meterSettingsStep } from "./components/meter-settings-step";
import { espWebInstaller } from "./components/esp-web-installer";
import { existingConfigurationStep } from "./components/existing-configuration-step";
import { offsetPersistence, offsetStep } from "./components/offset-step";
import { newInstallPackageOptions, resizePackageOptions } from "./components/package-options";
import { restartStep } from "./components/restart-step";
import { safetyStep } from "./components/safety-step";
import { setupDeviceStep } from "./components/setup-device-step";
import { calibrationPersistence, summaryOutcome, summaryStep } from "./components/summary-step";
import { technicalDetails } from "./components/technical-details";
import { totalsEditable } from "./components/totals-migration-review";
import { topologyMismatch, topologyStep } from "./components/topology-step";
import { voltageStep } from "./components/voltage-step";
import { workflowProgress } from "./components/workflow-progress";
import { chooseFirmwareVersion, fetchFirmwareIndex, resolveFirmwareOptions, type FirmwareIndex, type FirmwareOption } from "./firmware-installer";
import { panelStyles } from "./styles";
import {
  calibrationSubsteps,
  configurationModeFor,
  previousWorkflowRoute,
  resumeWorkflowRoute,
  workflowPhases,
  workflowRoutes,
  type CalibrationPlan,
  type ConfigurationMode,
  type ExistingConfigurationChoice,
  type JourneyOrigin,
  type TransactionPurpose,
  type WorkflowContext,
  type WorkflowRoute,
  type WorkflowSubstepId,
} from "./workflow-model";
import type {
  CalibrationResult,
  BoardPackageOptions,
  CalibrationPreparationCapability,
  AutomaticTotalSettings,
  TotalGraphPreview,
  ConnectionType,
  ElectricalSystem,
  ExistingDeviceCandidate,
  ExistingMeterInspection,
  LineFrequencyHz,
  MeterConfiguration,
  MeterConfigurationRequest,
  MeterSettings,
  MeterSettingsDraft,
  CtInventory,
  FirmwareCatalogState,
  MeterTopology,
  OffsetCalibrationResult,
  OffsetReadinessResult,
  PackageCapability,
  RestartVerificationResult,
  SessionStatus,
  SetupSnapshot,
  StabilityResult,
  TransactionStatus,
  TopologyResult,
} from "./types";

const ROUTE_LABELS: Record<WorkflowRoute, string> = {
  setup: "Choose meter",
  "legacy-review": "Review Existing Setup",
  meter: "Meter Settings",
  ct: "Circuits & CTs",
  "install-configuration": "Install Configuration",
  "calibration-plan": "Calibration — optional",
  safety: "Safety",
  offset: "Offset",
  voltage: "Voltage",
  current: "Current",
  restart: "Restart",
  "save-calibration": "Save Calibration",
  summary: "Summary",
};
const CALIBRATION_LABELS: Record<WorkflowSubstepId, string> = {
  "calibration-plan": "Plan",
  safety: "Safety",
  offset: "Offset",
  voltage: "Voltage",
  current: "Current",
  restart: "Restart & verify",
};
const CIRCUITSETUP_PROJECT_PREFIX = "circuitsetup.6c-energy-meter";
const OFFICIAL_PROJECT_REMAINDERS = new Set([
  "", "-ethernet", "-ethernet-waveshare", "-2-voltages",
  "-ethernet-2-voltages", "-2-voltages-ethernet",
  "-ethernet-waveshare-2-voltages", "-2-voltages-ethernet-waveshare",
]);
const REBIND_TIMEOUT_MS = 10_000;
const REBIND_RETRY_MS = 250;
const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
const offsetBoardLabel = (board: number) => board === 0 ? "Main Board" : `Add-on ${board}`;
const meterSettings = ({ authoritative: _authoritative, warnings: _warnings, ...meter }: MeterSettingsDraft): MeterSettings => meter;
const profileNominalVoltage = (system: ElectricalSystem): number | null => system === "split_phase_120_240" ? 120
  : system === "single_phase_230" ? 230 : null;

function isOfficialProjectName(value: string | null): boolean {
  if (!value?.startsWith(CIRCUITSETUP_PROJECT_PREFIX)) return false;
  const suffix = value.slice(CIRCUITSETUP_PROJECT_PREFIX.length);
  const addons = [...suffix.matchAll(/-(?:[1-6])-addons?(?=-|$)/g)];
  if (addons.length > 1) return false;
  const addon = addons[0];
  const remainder = addon
    ? suffix.slice(0, addon.index) + suffix.slice(addon.index + addon[0].length)
    : suffix;
  return OFFICIAL_PROJECT_REMAINDERS.has(remainder);
}

interface PanelConfig {
  config: { entry_id: string };
}

interface WsError extends Error {
  code?: string;
}

export class CircuitSetupPanel extends LitElement {
  public static override styles = panelStyles;
  public static override properties = {
    hass: { attribute: false },
    panel: { attribute: false },
  };

  public hass: HomeAssistant | null = null;
  public panel: PanelConfig | null = null;
  private api: HelperApi | null = null;
  private setup: SetupSnapshot | null = null;
  private step: WorkflowRoute = "setup";
  private journeyOrigin: JourneyOrigin = "existing_meter";
  private configurationMode: ConfigurationMode | null = null;
  private existingConfigurationChoice: ExistingConfigurationChoice = null;
  private calibrationPlan: CalibrationPlan = null;
  private skipCircuitChanges = false;
  private transactionPurpose: TransactionPurpose = null;
  private selectedDeviceId: string | null = null;
  private existingCandidates: ExistingDeviceCandidate[] = [];
  private existingSearchComplete = false;
  private existingInspection: ExistingMeterInspection | null = null;
  private inspectionToken: object | null = null;
  private adoptionToken: object | null = null;
  private topology: MeterTopology | null = null;
  private inventory: CtInventory | null = null;
  private transaction: TransactionStatus | null = null;
  private session: SessionStatus | null = null;
  private stabilityByTarget = new Map<string, StabilityResult>();
  private calibrationByTarget = new Map<string, CalibrationResult>();
  private restartResult: RestartVerificationResult | null = null;
  private completedWithoutChanges = false;
  private configurationInstalled = false;
  private offsetReadinessByTarget = new Map<string, OffsetReadinessResult>();
  private offsetResultByTarget = new Map<string, OffsetCalibrationResult>();
  private calibrationHandoff = false;
  private handoffDeclined = false;
  private addonCount = 0;
  private packageOptions = newInstallPackageOptions(0);
  private packageCapabilities: PackageCapability[] = [];
  private calibrationPreparation: CalibrationPreparationCapability | null = null;
  private sourcePackageOptions: BoardPackageOptions | null = newInstallPackageOptions(0);
  private packageOptionsTouched = false;
  private connection: Exclude<ConnectionType, "unknown"> = "wifi";
  private meterSettingsDraft: MeterSettingsDraft | null = null;
  private calibrationMeterSettings: MeterSettingsDraft | null = null;
  private meterConfiguration: MeterConfiguration | null = null;
  private verifiedMeterConfiguration: MeterConfiguration | null = null;
  private sourceMeterConfiguration: { deviceId: string; meter: MeterConfiguration } | null = null;
  private multiReferencePreparationAcknowledged = false;
  private meterProfileConfirmed = false;
  private meterFrequencyTouched = false;
  private meterNominalVoltageTouched = new Set<string>();
  private canonicalConfigurationChanged = false;
  private legacyCircuitSemanticsConfirmed = false;
  private totalGraphPreview: TotalGraphPreview | null = null;
  private totalGraphState: "ready" | "pending" | "invalid" = "ready";
  private issuedAutomaticSettings: AutomaticTotalSettings[] = [];
  private acceptedAutomaticInputs: string | null = null;
  private board = 0;
  private group = 0;
  private channel = 1;
  private voltageReferences = new Map<string, number>();
  private currentReferences = new Map<number, number>();
  private reportingMultiplier: number | null = null;
  private safetyAcknowledged = false;
  private offsetStage: 1 | 2 = 1;
  private offsetAcknowledged = [false, false];
  private offsetRetryConfirmed = false;
  private offsetBackupAcknowledged = false;
  private offsetPreparation: import("./types").OffsetPreparationStatus | null = null;
  private offsetFinalization: import("./types").OffsetFinalizationStatus | null = null;
  private drafts = new Map<number, CtDraft>();
  private reviewCorrection: {
    sourceSha256: string;
    configuration: MeterConfigurationRequest;
    drafts: Map<number, CtDraft>;
    packageOptions: BoardPackageOptions;
    packageOptionsTouched: boolean;
    meterFrequencyTouched: boolean;
    meterNominalVoltageTouched: Set<string>;
  } | null = null;
  private labelOnly = false;
  private error = "";
  private announcement = "";
  private firmwareIndex: FirmwareIndex | null = null;
  private firmwareCatalogState: FirmwareCatalogState = "idle";
  private firmwareCatalogError = "";
  private selectedEspHomeVersion: string | null = null;
  private resolvedFirmwareOptions: FirmwareOption[] = [];
  private firmwareFetchController: AbortController | null = null;
  private setupDeviceIds = new Set<string>();
  private unsubs: Array<() => void> = [];
  private connectionGeneration = 0;
  private operationGeneration = 0;
  private transactionSubscriptionScope = 0;
  private sessionSubscriptionScope = 0;
  private transactionUnsub: (() => void) | null = null;
  private sessionUnsub: (() => void) | null = null;
  private setupUnsub: (() => void) | null = null;
  private sessionStarting = false;
  private pendingAction = "";
  private importFailedDeviceId: string | null = null;
  private newInstallDeviceId: string | null = null;
  private voltageBusy = false;
  private offsetBusy = false;
  private finishBusy = false;
  private restartBusy = false;
  private voltageSkipped = false;
  private currentSkipped = false;
  private mobileStepsOpen = false;
  private focusHeading = false;
  private lastFocusedError = "";

  public override connectedCallback(): void {
    super.connectedCallback();
    const generation = ++this.connectionGeneration;
    this.loadFirmwareIndex();
    void this.ensureApi(generation);
  }

  public override disconnectedCallback(): void {
    ++this.connectionGeneration;
    ++this.operationGeneration;
    ++this.transactionSubscriptionScope;
    ++this.sessionSubscriptionScope;
    for (const unsub of this.unsubs.splice(0)) {
      try { unsub(); } catch { /* A later attach must still get a fresh generation. */ }
    }
    this.transactionUnsub = null;
    this.sessionUnsub = null;
    this.setupUnsub = null;
    this.api = null;
    this.firmwareFetchController?.abort();
    this.firmwareFetchController = null;
    this.firmwareIndex = null;
    this.firmwareCatalogState = "idle";
    this.firmwareCatalogError = "";
    this.resolvedFirmwareOptions = [];
    this.setupDeviceIds = new Set();
    this.existingCandidates = [];
    this.existingSearchComplete = false;
    this.existingInspection = null;
    this.calibrationPreparation = null;
    this.inspectionToken = null;
    this.adoptionToken = null;
    this.newInstallDeviceId = null;
    this.pendingAction = "";
    super.disconnectedCallback();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if ((changed.has("hass") || changed.has("panel")) && this.isConnected) void this.ensureApi(this.connectionGeneration);
    if (!this.error) this.lastFocusedError = "";
    if (this.error && this.error !== this.lastFocusedError) {
      this.lastFocusedError = this.error;
      this.shadowRoot?.querySelector<HTMLElement>("[role=alert]")?.focus();
    }
    else if (this.focusHeading) {
      this.focusHeading = false;
      const heading = this.shadowRoot?.querySelector<HTMLElement>("#step-heading");
      heading?.scrollIntoView?.({ block: "start" });
      heading?.focus({ preventScroll: true });
    }
  }

  private async ensureApi(generation: number): Promise<void> {
    if (this.api || !this.isConnected || !this.hass || !this.panel?.config.entry_id) return;
    const api = new HelperApi(this.hass, this.panel.config.entry_id);
    this.api = api;
    this.error = "";
    try {
      const setup = await api.setupStatus();
      if (!this.owns(generation, api)) return;
      this.setup = setup;
      this.setupDeviceIds = new Set(setup.devices.map((device) => device.entry_id));
      const intent = this.setup.installer_intent;
      if (intent) {
        this.addonCount = intent.addon_count;
        this.connection = intent.connection_type;
        this.packageOptions = intent.power_quality && intent.status_fields
          ? { power_quality: [...intent.power_quality], status_fields: [...intent.status_fields] }
          : newInstallPackageOptions(intent.addon_count);
        this.sourcePackageOptions = newInstallPackageOptions(intent.addon_count);
        this.refreshFirmwareOptions();
      }
      if (this.setup.devices.length && !this.selectedDeviceId) {
        const bound = this.setup.devices.find(device => device.entry_id === this.setup?.bound_device_id);
        if (bound) await this.configureDevice(bound.entry_id);
      }
      await this.subscribeSetup(generation, api);
      if (this.transaction) await this.subscribeTransaction(generation);
      if (this.session && this.session.state !== "cancelled") await this.subscribeSession(generation);
    } catch (error) {
      if (this.owns(generation, api)) {
        this.fail(error, "Setup status could not be loaded.");
        if (this.setupUnsub === null) this.api = null;
      }
    }
    this.requestUpdate();
  }

  private owns(generation: number, api: HelperApi): boolean {
    return this.isConnected && generation === this.connectionGeneration && api === this.api;
  }

  private ownsFirmwareCatalog(generation: number, controller: AbortController): boolean {
    return this.isConnected && generation === this.connectionGeneration && controller === this.firmwareFetchController;
  }

  private async subscribeSetup(generation: number, api: HelperApi): Promise<void> {
    await this.ownSubscription(api.subscribeSetup((snapshot) => {
      if (!this.owns(generation, api)) return;
      this.receiveSetupSnapshot(snapshot, true);
    }), generation, api, () => this.setupUnsub === null, (unsubscribe) => { this.setupUnsub = unsubscribe; });
  }

  private receiveSetupSnapshot(snapshot: SetupSnapshot, allowAutomaticImport: boolean): void {
    const discovered = snapshot.devices
      .filter((device) => !this.setupDeviceIds.has(device.entry_id))
      .sort((first, second) => first.entry_id.localeCompare(second.entry_id));
    const eligible = discovered.filter((device) => device.project_name.startsWith(CIRCUITSETUP_PROJECT_PREFIX));
    this.setup = snapshot;
    this.setupDeviceIds = new Set(snapshot.devices.map((device) => device.entry_id));
    if (this.pendingAction) { this.requestUpdate(); return; }
    if (this.step !== "setup" || this.topology) return this.requestUpdate();
    const bound = snapshot.devices.find(device => device.entry_id === snapshot.bound_device_id);
    if (bound && !this.selectedDeviceId) { void this.configureDevice(bound.entry_id); return; }
    if (!eligible.length) return this.requestUpdate();
    if (allowAutomaticImport && eligible.length === 1 && !this.pendingAction) {
      const deviceId = eligible[0]!.entry_id;
      this.selectDevice(deviceId);
      this.announcement = "Device added to Home Assistant. Importing into ESPHome Builder…";
      void this.adopt(deviceId);
      return;
    }
    this.selectDevice(eligible.length === 1 ? eligible[0]!.entry_id : null);
    this.announcement = eligible.length > 1
      ? "Multiple CircuitSetup meters were discovered. Choose one to import."
      : "CircuitSetup energy meter discovered.";
    this.requestUpdate();
  }

  private loadFirmwareIndex(): void {
    if (this.firmwareCatalogState === "loading" || this.firmwareIndex) return;
    const generation = this.connectionGeneration;
    const controller = new AbortController();
    this.firmwareFetchController?.abort();
    this.firmwareFetchController = controller;
    this.firmwareCatalogState = "loading";
    this.firmwareCatalogError = "";
    this.requestUpdate();
    void fetchFirmwareIndex(globalThis.fetch, controller.signal).then((index) => {
      if (!this.ownsFirmwareCatalog(generation, controller)) return;
      this.firmwareIndex = index;
      this.firmwareFetchController = null;
      this.firmwareCatalogState = "ready";
      this.refreshFirmwareOptions();
    }).catch(() => {
      if (!this.ownsFirmwareCatalog(generation, controller)) return;
      this.firmwareFetchController = null;
      this.firmwareCatalogState = "error";
      this.firmwareCatalogError = "Firmware catalog could not be loaded.";
      this.requestUpdate();
    });
  }

  private refreshFirmwareOptions(): void {
    const options = this.firmwareIndex
      ? resolveFirmwareOptions(this.firmwareIndex, this.addonCount, this.connection)
      : [];
    const previous = this.selectedEspHomeVersion;
    const selected = chooseFirmwareVersion(options, previous);
    this.resolvedFirmwareOptions = options;
    this.selectedEspHomeVersion = selected;
    if (previous && selected !== previous) this.announcement = selected
      ? `Firmware version changed to ${selected}.`
      : "No firmware version is available for this hardware.";
    this.requestUpdate();
  }

  private selectFirmwareVersion(version: string): void {
    if (!this.resolvedFirmwareOptions.some((option) => option.version === version)) return;
    this.selectedEspHomeVersion = version;
    this.requestUpdate();
  }

  private retryFirmwareIndex(): void {
    this.firmwareCatalogError = "";
    this.firmwareCatalogState = "idle";
    this.requestUpdate();
    this.loadFirmwareIndex();
  }

  private selectedFirmware(): FirmwareOption | null {
    return this.resolvedFirmwareOptions.find((option) => option.version === this.selectedEspHomeVersion) ?? null;
  }

  private ownsOperation(generation: number, api: HelperApi, deviceId: string | null): boolean {
    return generation === this.operationGeneration && api === this.api && deviceId === this.selectedDeviceId;
  }

  private ownsInspection(token: object, api: HelperApi, deviceId: string | null = null): boolean {
    return this.isConnected && api === this.api && token === this.inspectionToken
      && (deviceId === null || deviceId === this.inspectionTargetId);
  }

  private inspectionTargetId: string | null = null;

  private async ownSubscription(
    pending: Promise<() => void>,
    generation: number,
    api: HelperApi,
    isCurrent: () => boolean = () => true,
    onOwned: (unsubscribe: () => void) => void = () => undefined,
  ): Promise<void> {
    const unsubscribe = await pending;
    if (!this.owns(generation, api) || !isCurrent()) {
      try { unsubscribe(); } catch { /* The stale generation no longer owns panel state. */ }
      return;
    }
    this.unsubs.push(unsubscribe);
    onOwned(unsubscribe);
  }

  private clearSubscription(kind: "transaction" | "session"): void {
    if (kind === "transaction") ++this.transactionSubscriptionScope;
    else ++this.sessionSubscriptionScope;
    const unsubscribe = kind === "transaction" ? this.transactionUnsub : this.sessionUnsub;
    if (kind === "transaction") this.transactionUnsub = null;
    else this.sessionUnsub = null;
    if (!unsubscribe) return;
    const index = this.unsubs.indexOf(unsubscribe);
    if (index >= 0) this.unsubs.splice(index, 1);
    try { unsubscribe(); } catch { /* Replacement ownership must still advance. */ }
  }

  private clearSetupSubscription(): void {
    const unsubscribe = this.setupUnsub;
    this.setupUnsub = null;
    if (!unsubscribe) return;
    const index = this.unsubs.indexOf(unsubscribe);
    if (index >= 0) this.unsubs.splice(index, 1);
    try { unsubscribe(); } catch { /* Replacement ownership must still advance. */ }
  }

  private resetCalibrationRun(): void {
    this.calibrationMeterSettings = null;
    this.safetyAcknowledged = false;
    this.stabilityByTarget = new Map();
    this.calibrationByTarget = new Map();
    this.restartResult = null;
    this.completedWithoutChanges = false;
    this.offsetReadinessByTarget = new Map();
    this.offsetResultByTarget = new Map();
    this.calibrationHandoff = false;
    this.handoffDeclined = false;
    this.group = 0;
    this.channel = 1;
    this.voltageReferences = new Map();
    this.currentReferences = new Map();
    this.reportingMultiplier = null;
    this.offsetStage = 1;
    this.offsetAcknowledged = [false, false];
    this.offsetRetryConfirmed = false;
    this.offsetBackupAcknowledged = false;
    this.offsetPreparation = null;
    this.offsetFinalization = null;
    this.finishBusy = false;
    this.restartBusy = false;
    this.voltageSkipped = false;
    this.currentSkipped = false;
  }

  private selectDevice(deviceId: string | null): void {
    ++this.operationGeneration;
    this.inspectionToken = null;
    this.inspectionTargetId = null;
    this.adoptionToken = null;
    this.clearSubscription("transaction");
    this.clearSubscription("session");
    const isNewInstall = deviceId !== null && deviceId === this.newInstallDeviceId;
    this.selectedDeviceId = deviceId;
    this.existingCandidates = [];
    this.existingSearchComplete = false;
    this.existingInspection = null;
    if (deviceId !== this.newInstallDeviceId) this.newInstallDeviceId = null;
    this.journeyOrigin = isNewInstall ? "new_install" : "existing_meter";
    this.configurationMode = null;
    this.existingConfigurationChoice = null;
    this.calibrationPlan = null;
    this.skipCircuitChanges = false;
    this.transactionPurpose = null;
    this.topology = null;
    this.packageCapabilities = [];
    this.calibrationPreparation = null;
    this.inventory = null;
    this.transaction = null;
    this.reviewCorrection = null;
    this.session = null;
    this.drafts = new Map();
    this.meterSettingsDraft = null;
    this.meterConfiguration = null;
    this.verifiedMeterConfiguration = null;
    this.sourceMeterConfiguration = null;
    this.packageOptionsTouched = false;
    this.multiReferencePreparationAcknowledged = false;
    this.meterProfileConfirmed = false;
    this.meterFrequencyTouched = false;
    this.meterNominalVoltageTouched = new Set();
    this.canonicalConfigurationChanged = false;
    this.configurationInstalled = false;
    this.totalGraphPreview = null;
    this.totalGraphState = "ready";
    this.issuedAutomaticSettings = [];
    this.acceptedAutomaticInputs = null;
    this.board = 0;
    this.resetCalibrationRun();
  }

  public showTopology(topology: MeterTopology): void {
    this.topology = topology;
    const selectedProject = this.selectedProjectName();
    const projectMismatch = selectedProject !== null && selectedProject !== "unknown"
      && topology.project_name !== selectedProject;
    this.error = topologyMismatch(topology)
      || projectMismatch
      ? "Topology mismatch"
      : "";
    this.requestUpdate();
  }

  private showTopologyResult(result: MeterTopology | TopologyResult): void {
    if ("topology" in result && result.topology) {
      if (result.package_options) {
        if (this.selectedDeviceId !== this.newInstallDeviceId) {
          this.packageOptions = {
            power_quality: [...result.package_options.power_quality],
            status_fields: [...result.package_options.status_fields],
          };
        }
        this.sourcePackageOptions = {
          power_quality: [...result.package_options.power_quality],
          status_fields: [...result.package_options.status_fields],
        };
      }
      this.packageCapabilities = result.package_capabilities ? [...result.package_capabilities] : [];
      this.calibrationPreparation = result.calibration_preparation ?? null;
      this.showTopology(result.topology);
    } else {
      this.sourcePackageOptions = null;
      this.packageCapabilities = [];
      this.calibrationPreparation = null;
      this.showTopology(result as MeterTopology);
    }
  }

  private setAddonCount(value: number): void {
    this.addonCount = value;
    this.packageOptions = resizePackageOptions(this.packageOptions, value);
    this.sourcePackageOptions = newInstallPackageOptions(value);
    this.packageCapabilities = [];
    this.refreshFirmwareOptions();
  }

  private initializeInventory(inventory: CtInventory): void {
    const configured = new Map(this.meterConfiguration?.configuration.channels.map((channel) => [channel.channel, channel]) ?? []);
    this.inventory = { ...inventory, channels: inventory.channels.map((channel) => {
      const settings = configured.get(channel.channel);
      return settings && this.configurationMode !== "legacy_editable" ? { ...channel, name: settings.name, selected_model_id: settings.model_id,
        reporting_multiplier: settings.reporting_multiplier, display_label: settings.custom_label,
        selection_verified_against_config: true, stored_selection_present: true } : channel;
    }) };
    this.drafts = new Map(this.inventory.channels.map((channel) => {
      const settings = configured.get(channel.channel);
      const modelId = channel.selected_model_id ?? settings?.model_id ?? "";
      const preset = inventory.catalog.presets.find((item) => item.model_id === modelId);
      return [channel.channel, {
        name: channel.name,
        modelId,
        multiplier: channel.reporting_multiplier,
        customGainCt: modelId === "custom"
          ? settings?.custom_gain_ct ?? channel.raw_gain_ct * channel.reporting_multiplier : undefined,
        burdenAcknowledged: settings?.burden_output_acknowledged
          ?? (channel.selection_verified_against_config
            && (modelId === "custom" || preset?.requires_burden_jumper_cut === true)),
        expanded: false,
        preserveExistingGain: this.configurationMode === "legacy_editable" && !channel.selection_verified_against_config && channel.raw_gain_ct > 0,
        multiplierMode: "automatic" as const,
      }];
    }));
    this.error = "";
    this.requestUpdate();
  }

  public showInventory(inventory: CtInventory): void {
    this.initializeInventory(inventory);
    const routes = workflowRoutes(this.workflowContext());
    this.navigate(routes.includes("ct") ? "ct" : this.configurationMode === "legacy_editable"
      && this.existingConfigurationChoice === null ? "legacy-review" : "calibration-plan");
  }

  private acceptInstalledDrafts(): void {
    if (!this.inventory) return;
    this.inventory = { ...this.inventory, channels: this.inventory.channels.map((channel) => {
      const draft = this.drafts.get(channel.channel);
      if (!draft) return channel;
      if (draft.preserveExistingGain) return { ...channel, name: draft.name.trim() };
      const preset = this.inventory!.catalog.presets.find((item) => item.model_id === draft.modelId);
      const gain = preset?.default_gain_ct ?? draft.customGainCt;
      return { ...channel, name: draft.name.trim(), selected_model_id: draft.modelId,
        reporting_multiplier: draft.multiplier,
        raw_gain_ct: gain === undefined ? channel.raw_gain_ct : Math.round(gain / draft.multiplier),
        display_label: draft.modelId === "custom" ? draft.name.trim() || null : null,
        selection_verified_against_config: true, stored_selection_present: true };
    }) };
  }

  private workflowContext(): WorkflowContext {
    const runtimeOnly = this.configurationMode === "runtime_only"
      || (this.configurationMode === null
        && !this.selectedConfigurationAvailable()
        && this.meterConfiguration === null);
    const mode = this.configurationMode ?? configurationModeFor({
      journeyOrigin: this.journeyOrigin,
      semanticSource: this.meterConfiguration?.capabilities.semantic_source ?? null,
      runtimeOnly,
    });
    const purpose = this.transaction?.purpose ?? this.transactionPurpose;
    const normalTransaction = purpose === "install_configuration" ? this.transaction : null;
    return {
      configurationMode: mode,
      legacyChoice: this.existingConfigurationChoice,
      calibrationPlan: this.completedWithoutChanges ? "keep_existing" : this.session?.state !== "cancelled" ? this.session?.calibration_plan ?? this.calibrationPlan : this.calibrationPlan,
      normalTransactionRequired: this.hasCanonicalChanges() || normalTransaction !== null,
      normalTransactionActive: normalTransaction !== null
        && !["verified", "rolled_back"].includes(normalTransaction.state),
      normalTransactionVerified: normalTransaction?.state === "verified",
      transactionPurpose: purpose,
      sessionState: this.session?.state ?? null,
      offsetDisposition: this.session?.offset_disposition ?? null,
      pendingCalibration: this.session?.has_pending_calibration ?? false,
      restartVerification: this.restartResult !== null,
      handoffAvailable: this.restartResult?.source_handoff_available ?? false,
      handoffInstalled: this.restartResult?.source_handoff_firmware_installed ?? false,
      completedWithoutCalibration: this.completedWithoutChanges,
      offsetRecoveryPending: this.offsetRecoveryPending(),
      offsetConfigurationSelected: this.offsetFinalization?.configuration_selected === true,
    };
  }

  public showState(step: WorkflowRoute): void {
    this.navigate(step, true);
  }

  private navigate(step: WorkflowRoute, controlledRecovery = false): void {
    if (!controlledRecovery && !workflowRoutes(this.workflowContext()).includes(step)) {
      this.fail(new Error(), "That workflow step is not available for the selected meter.");
      return;
    }
    if (step === "calibration-plan") this.calibrationPlan = null;
    this.step = step;
    this.error = "";
    this.mobileStepsOpen = false;
    this.focusHeading = true;
    this.requestUpdate();
  }

  private navigationBusy(): boolean {
    return Boolean(this.pendingAction) || this.sessionStarting || this.voltageBusy || this.offsetBusy || this.finishBusy || this.restartBusy;
  }

  private back(): void {
    if (this.navigationBusy()) return;
    if (this.step === "calibration-plan" && this.skipCircuitChanges) {
      this.calibrationPlan = null;
      this.navigate("ct");
      return;
    }
    if ((this.step === "install-configuration" || this.step === "save-calibration") && !this.transaction) {
      const routes = workflowRoutes(this.workflowContext());
      this.navigate(this.step === "save-calibration" && routes.includes("restart") ? "restart" : routes.includes("ct") ? "ct" : "calibration-plan");
      return;
    }
    const previous = previousWorkflowRoute(this.workflowContext(), this.step);
    if (previous === null) return;
    if (this.step === "safety") void this.cancelSession(previous);
    else if (this.step === "install-configuration" || this.step === "save-calibration") {
      void this.backFromBuild();
    } else this.navigate(previous);
  }

  private returnToSetup(): void {
    if (this.navigationBusy() || !canLeaveTransaction(this.transaction)
      || this.restartResult?.source_handoff_firmware_installed && this.restartResult.source_authority !== "configuration") return;
    if (this.transaction && this.transaction.state !== "verified") {
      void this.backFromBuild().then(() => { if (!this.error && !this.transaction) this.returnToSetup(); });
      return;
    }
    if (this.session && this.session.state !== "cancelled") void this.cancelSession("setup");
    else {
      this.selectDevice(null);
      this.navigate("setup");
    }
  }

  private async configureDevice(deviceId: string): Promise<void> {
    if (this.pendingAction) return;
    const device = this.setup?.devices.find((item) => item.entry_id === deviceId);
    if (device && this.setup?.bound_device_id !== deviceId && !isOfficialProjectName(device.project_name)) {
      await this.inspectExistingMeter(deviceId);
      return;
    }
    if (this.setup?.bound_device_id !== undefined && this.setup.bound_device_id !== deviceId) {
      await this.adopt(deviceId);
      return;
    }
    this.newInstallDeviceId = null;
    this.selectDevice(deviceId);
    this.pendingAction = `topology:${deviceId}`;
    this.requestUpdate();
    try { await this.loadTopology(); }
    finally { this.pendingAction = ""; this.requestUpdate(); }
  }

  private selectedProjectVersion(): string | null {
    return this.setup?.devices.find((device) => device.entry_id === this.selectedDeviceId)?.project_version ?? null;
  }

  private selectedProjectName(): string | null {
    return this.setup?.devices.find((device) => device.entry_id === this.selectedDeviceId)?.project_name ?? null;
  }

  private selectedConfiguration(): string | null {
    return this.setup?.devices.find((device) => device.entry_id === this.selectedDeviceId)?.configuration ?? null;
  }

  private selectedConfigurationAvailable(): boolean {
    return this.selectedConfiguration() !== null || this.setup?.configuration_authoritative !== false;
  }

  public showRecovery(state: "calibration_outcome_indeterminate" | "restart_failed"): void {
    if (state === "calibration_outcome_indeterminate") {
      this.navigate("current", true);
      this.calibrationByTarget = new Map(this.calibrationByTarget).set(`current:${this.channel}`, {
        state,
        group_key: "",
        phase: null,
        changed_channels: [],
        iteration: 1,
        before_values: [],
        after_values: [],
        error_percent_values: [],
        gain_evidence: null,
        restore_evidence: null,
        retry_allowed: false,
      });
    } else {
      this.navigate("restart", true);
      if (this.session) this.session = { ...this.session, state };
      else this.error = "Restart verification failed; review rollback and recovery evidence.";
    }
    this.requestUpdate();
  }

  private async rescan(): Promise<void> {
    if (!this.api && !this.pendingAction) await this.ensureApi(this.connectionGeneration);
    if (!this.api || this.pendingAction) return;
    this.pendingAction = "rescan";
    this.requestUpdate();
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const setupDeviceIds = new Set(this.setupDeviceIds);
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      if (deviceId === null || this.setup?.bound_device_id !== deviceId) {
        await api.setInstallerIntent(
          this.addonCount,
          this.connection,
          this.selectedFirmware(),
          this.packageOptions,
          null,
          null,
        );
      }
      if (!this.ownsOperation(generation, api, deviceId)) return;
      const setup = await api.rescan();
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.pendingAction = "";
      this.setupDeviceIds = setupDeviceIds;
      this.receiveSetupSnapshot(setup, true);
      if (!setup.devices.length) {
        this.announcement = "No compatible meter found. Check the network and rescan.";
      }
    }, "Rescan failed.", () => this.ownsOperation(generation, api, deviceId));
    if (this.pendingAction === "rescan") this.pendingAction = "";
    this.requestUpdate();
  }

  private async findExistingMeters(): Promise<void> {
    if (!this.api || this.pendingAction) return;
    this.pendingAction = "find-existing";
    this.existingCandidates = [];
    this.existingSearchComplete = false;
    this.existingInspection = null;
    this.requestUpdate();
    const api = this.api;
    const token = {};
    this.inspectionToken = token;
    this.inspectionTargetId = null;
    await this.run(async () => {
      const candidates = await api.listExistingMeters();
      if (!this.ownsInspection(token, api)) return;
      this.existingCandidates = candidates;
      this.existingSearchComplete = true;
      this.announcement = candidates.length
        ? "Select an ESPHome meter to inspect."
        : "Could not find any more CircuitSetup energy meters";
    }, "Could not find any more CircuitSetup energy meters", () => this.ownsInspection(token, api));
    if (this.ownsInspection(token, api)) {
      this.pendingAction = "";
      this.requestUpdate();
    }
  }

  private async inspectExistingMeter(deviceId: string): Promise<void> {
    if (!this.api || this.pendingAction) return;
    this.pendingAction = `inspect:${deviceId}`;
    this.existingInspection = null;
    this.error = "";
    this.requestUpdate();
    const api = this.api;
    const token = {};
    this.inspectionToken = token;
    this.inspectionTargetId = deviceId;
    await this.run(async () => {
      const inspection = await api.inspectExistingMeter(deviceId);
      if (!this.ownsInspection(token, api, deviceId)) return;
      this.existingInspection = inspection;
      this.announcement = "The selected meter passed live identity and topology inspection. Review it before adoption.";
    }, "This ESPHome meter could not be safely inspected.", () => this.ownsInspection(token, api, deviceId));
    if (this.ownsInspection(token, api, deviceId)) {
      this.pendingAction = "";
      this.requestUpdate();
    }
  }

  private async adopt(deviceId = this.selectedDeviceId): Promise<void> {
    if (!this.api || !deviceId || this.pendingAction) return;
    const inspected = this.existingInspection?.device.entry_id === deviceId;
    const api = this.api;
    const token = {};
    this.adoptionToken = token;
    const ownsAdoption = () => this.isConnected && api === this.api && token === this.adoptionToken;
    let generation: number | null = null;
    const owns = () => generation === null ? ownsAdoption() : this.ownsOperation(generation, api, deviceId);
    const connectionGeneration = this.connectionGeneration;
    this.pendingAction = `adopt:${deviceId}`;
    this.importFailedDeviceId = null;
    this.error = "";
    this.requestUpdate();
    let fallback = "Adoption is unavailable for this meter.";
    try {
      const adoption = await api.adoptDevice(deviceId);
      if (!ownsAdoption()) return;
      if (deviceId !== this.selectedDeviceId) {
        this.selectDevice(deviceId);
        this.adoptionToken = token;
      }
      this.newInstallDeviceId = !inspected && adoption.imported === true ? deviceId : null;
      this.journeyOrigin = this.newInstallDeviceId === deviceId ? "new_install" : "existing_meter";
      generation = ++this.operationGeneration;
      this.clearSetupSubscription();
      const setup = await this.waitForBinding(api, deviceId, generation);
      if (!owns()) return;
      this.setup = setup;
      this.setupDeviceIds = new Set(setup.devices.map((device) => device.entry_id));
      fallback = "Meter setup could not be loaded.";
      await this.subscribeSetup(connectionGeneration, api);
      if (!owns()) return;
      fallback = "Meter settings could not be loaded.";
      const importedConfiguration = await api.getMeterConfiguration(deviceId);
      if (!owns()) return;
      this.setMeterConfiguration(importedConfiguration);
      fallback = "Topology evidence could not be loaded.";
      const result = await api.getTopology(deviceId);
      if (!owns()) return;
      this.importFailedDeviceId = null;
      this.existingInspection = null;
      this.announcement = "Meter imported into ESPHome Builder.";
      this.showTopologyResult(result);
      fallback = "Saved work could not be loaded.";
      await this.restoreActiveWork(api, deviceId, generation);
    } catch (error) {
      if (!owns()) return;
      this.importFailedDeviceId = deviceId;
      const message = (error as WsError).code === "device_busy"
        ? "Finish or cancel current work before importing another meter."
        : error instanceof Error && error.message === "helper rebind timed out"
          ? "Import completed, but Home Assistant is still reconnecting. Retry import or reload the helper."
          : this.safeErrorMessage(error, fallback);
      this.fail(error, message);
    } finally {
      if (owns()) {
        this.adoptionToken = null;
        this.pendingAction = "";
        this.requestUpdate();
      }
    }
  }

  private async waitForBinding(api: HelperApi, deviceId: string, generation: number): Promise<SetupSnapshot> {
    const deadline = Date.now() + REBIND_TIMEOUT_MS;
    while (this.ownsOperation(generation, api, deviceId)) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      try {
        const snapshot = await Promise.race([
          api.setupStatus(),
          wait(remaining).then(() => { throw new Error("helper rebind timed out"); }),
        ]);
        if (snapshot.bound_device_id === deviceId) return snapshot;
      } catch (error) {
        if ((error as WsError).code !== "capability_unavailable") throw error;
      }
      if (Date.now() >= deadline) break;
      await wait(Math.min(REBIND_RETRY_MS, deadline - Date.now()));
    }
    throw new Error("helper rebind timed out");
  }

  private async loadTopology(): Promise<void> {
    if (!this.api || !this.selectedDeviceId) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const generation = ++this.operationGeneration;
    let fallback = "Topology evidence could not be loaded.";
    await this.run(async () => {
      const result = await api.getTopology(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.showTopologyResult(result);
      if (!this.selectedConfigurationAvailable()) {
        this.configurationMode = "runtime_only";
      } else {
        fallback = "Meter settings could not be loaded.";
        const configuration = await api.getMeterConfiguration(deviceId);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.setMeterConfiguration(configuration);
      }
      fallback = "Saved work could not be loaded.";
      await this.restoreActiveWork(api, deviceId, generation);
    }, () => fallback, () => this.ownsOperation(generation, api, deviceId));
  }

  private async restoreActiveWork(api: HelperApi, deviceId: string, generation: number): Promise<void> {
    if (!this.topology) return;
    const active = await api.getActiveWork(deviceId, this.topology);
    if (!this.ownsOperation(generation, api, deviceId)) return;
    this.session = active.session?.state === "cancelled" ? null : active.session;
    this.calibrationPlan = this.session?.calibration_plan ?? null;
    this.transaction = active.transaction;
    this.safetyAcknowledged = this.session?.safety_acknowledged ?? false;
    this.calibrationHandoff = this.transaction?.purpose === "save_calibration";
    this.transactionPurpose = this.transaction?.purpose ?? null;
    if (this.transactionPurpose === "install_configuration"
      && this.configurationMode === "legacy_editable"
      && this.existingConfigurationChoice === null) this.existingConfigurationChoice = "manage_with_helper";
    this.restartResult = active.verified_calibration;
    if (this.configurationMode === "legacy_editable"
      && this.existingConfigurationChoice === null
      && (this.session || this.calibrationHandoff || this.restartResult)) this.existingConfigurationChoice = "calibrate_only";
    if (!this.transaction && !this.session && !this.restartResult) {
      if (!this.error && !topologyMismatch(this.topology)) {
        if (this.configurationMode === "runtime_only") this.navigate("calibration-plan");
        else if (this.meterConfiguration) { this.initializeInventory(this.meterConfiguration); this.navigate(this.configurationMode === "legacy_editable" ? "legacy-review" : "meter"); }
      }
      return;
    }
    if (!this.transaction || ["previewed", "verified", "rolled_back", "failed"].includes(this.transaction.state)) {
      await this.refreshOffsetRecovery(api, generation, true);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      if (this.transaction?.state === "verified" && this.transaction.purpose.startsWith("offset_")) {
        this.transaction = null; this.transactionPurpose = null;
      }
    }
    this.navigate(resumeWorkflowRoute(this.workflowContext()));
    if (this.transaction) await this.subscribeTransaction(this.connectionGeneration);
    if (this.session) await this.subscribeSession(this.connectionGeneration);
  }

  private async loadInventory(): Promise<void> {
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
    this.pendingAction = "inventory";
    this.requestUpdate();
    const api = this.api; const deviceId = this.selectedDeviceId; const generation = ++this.operationGeneration;
    try {
      await this.run(async () => {
        if (!this.meterConfiguration) {
          const configuration = await api.getMeterConfiguration(deviceId);
          if (!this.ownsOperation(generation, api, deviceId)) return;
          this.setMeterConfiguration(configuration);
        }
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.initializeInventory(this.meterConfiguration!);
        this.navigate(this.configurationMode === "legacy_editable"
          && this.existingConfigurationChoice === null ? "legacy-review" : "meter");
      }, "Meter settings could not be loaded.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.pendingAction = "";
      this.requestUpdate();
    }
  }

  private async backFromBuild(): Promise<void> {
    if (!canLeaveTransaction(this.transaction, true)) return;
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const current = this.transaction;
    const calibrationPreparation = current !== null && this.isCalibrationPreparationTransaction(current);
    const appliedInstallRetry = current?.purpose === "install_configuration"
      && current.state === "install_confirmation_required"
      && current.evidence.some((code) => ["upload_outcome_unknown", "reconnect_unavailable", "entity_mismatch", "sensor_count_mismatch", "meter_communication_failed", "persistence_failed", "source_changed"].includes(code));
    const terminalInstallFailure = current?.purpose === "install_configuration"
      && current.state === "failed" && !current.rollback_available
      && current.evidence.some((code) => ["persistence_failed", "upload_failed", "identity_mismatch", "topology_mismatch"].includes(code));
    if (current?.purpose.startsWith("offset_")) {
      if (!["previewed", "rolled_back", "failed"].includes(current.state)) {
        this.fail(new Error(), "This review has already advanced. Complete or roll back this transaction first."); return;
      }
      const generation = ++this.operationGeneration;
      this.pendingAction = "review-back"; this.requestUpdate();
      await this.run(async () => {
        if (current.state === "previewed") await api.abandonCtConfig(deviceId, current.transaction_id, current.source_sha256);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.clearSubscription("transaction"); this.transaction = null; this.transactionPurpose = null;
        await this.refreshOffsetRecovery(api, generation);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.offsetBackupAcknowledged = false;
        this.navigate(current.purpose === "offset_preparation" ? "offset" : "save-calibration");
      }, "The review could not be cancelled. Recovery and captured values are retained.", () => this.ownsOperation(generation, api, deviceId));
      this.pendingAction = ""; this.requestUpdate(); return;
    }
    if (current && !["previewed", "rolled_back"].includes(current.state) && !appliedInstallRetry && !terminalInstallFailure) {
      this.fail(new Error(), "This review has already advanced. Roll it back before changing the configuration.");
      return;
    }
    const correction = this.reviewCorrection ?? (this.meterConfiguration ? {
      sourceSha256: this.meterConfiguration.source_sha256,
      configuration: { ...this.meterConfiguration.configuration,
        multi_reference_preparation_acknowledged: false },
      drafts: new Map(this.drafts),
      packageOptions: {
        power_quality: [...this.packageOptions.power_quality],
        status_fields: [...this.packageOptions.status_fields],
      },
      packageOptionsTouched: this.packageOptionsTouched,
      meterFrequencyTouched: this.meterFrequencyTouched,
      meterNominalVoltageTouched: new Set(this.meterNominalVoltageTouched),
    } : null);
    if (!appliedInstallRetry && !terminalInstallFailure && !this.calibrationHandoff && !calibrationPreparation && !correction) {
      this.fail(new Error(), "The edited configuration is unavailable. Return to setup and reload the meter.");
      return;
    }
    this.pendingAction = "review-back";
    this.error = "";
    this.requestUpdate();
    const generation = ++this.operationGeneration;
    let abandoned = current === null || current?.state === "rolled_back";
    try {
      if (current?.state === "previewed" || appliedInstallRetry) {
        await api.abandonCtConfig(deviceId, current.transaction_id, current.source_sha256);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.clearSubscription("transaction");
        this.transaction = null;
        abandoned = true;
      } else if (current?.state === "rolled_back" || terminalInstallFailure) {
        this.clearSubscription("transaction");
        this.transaction = null;
        abandoned = true;
      }
      if (calibrationPreparation) {
        this.clearSubscription("session");
        this.session = null;
        this.reviewCorrection = null;
        this.navigate("setup");
        this.announcement = "Calibration preparation review cancelled. Start a new calibration session to try again.";
        return;
      }
      if (this.calibrationHandoff) {
        this.calibrationHandoff = false;
        this.navigate("restart");
        return;
      }
      this.reviewCorrection = correction;
      const fresh = await api.getMeterConfiguration(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      if (appliedInstallRetry || terminalInstallFailure) {
        this.packageOptionsTouched = false;
        this.meterFrequencyTouched = false;
        this.meterNominalVoltageTouched = new Set();
        this.setMeterConfiguration(fresh);
        this.showInventory(this.meterConfiguration!);
        this.reviewCorrection = null;
        this.announcement = current?.evidence.includes("persistence_failed")
          ? current.progress.includes("device_verified") ? "Installed configuration was reloaded." : "Configuration was reloaded."
          : "Review cancelled. Live saved configuration was reloaded.";
        return;
      }
      if (fresh.source_sha256 !== correction!.sourceSha256) {
        this.packageOptionsTouched = false;
        this.meterFrequencyTouched = false;
        this.meterNominalVoltageTouched = new Set();
        this.setMeterConfiguration(fresh);
        this.showInventory(this.meterConfiguration!);
        this.reviewCorrection = null;
        this.error = "The meter source changed while this review was open. Preserved drafts were not restored to avoid overwriting external edits; review the live configuration and reapply changes.";
        this.announcement = this.error;
        return;
      }
      this.setMeterConfiguration(fresh);
      const restoredConfiguration = { ...correction!.configuration,
        multi_reference_preparation_acknowledged: false };
      this.packageOptions = {
        power_quality: [...correction!.packageOptions.power_quality],
        status_fields: [...correction!.packageOptions.status_fields],
      };
      this.packageOptionsTouched = correction!.packageOptionsTouched;
      this.meterFrequencyTouched = correction!.meterFrequencyTouched;
      this.meterNominalVoltageTouched = new Set(correction!.meterNominalVoltageTouched);
      this.updateCircuitConfiguration(restoredConfiguration);
      this.meterSettingsDraft = { ...restoredConfiguration.meter,
        authoritative: fresh.capabilities.configuration_authoritative,
        warnings: fresh.warnings };
      this.multiReferencePreparationAcknowledged = false;
      this.canonicalConfigurationChanged = true;
      this.showInventory(this.meterConfiguration!);
      this.drafts = new Map(correction!.drafts);
      this.reviewCorrection = null;
      this.announcement = "Review cancelled. Live meter data was reloaded and your edits were preserved.";
    } catch (error) {
      if (!this.ownsOperation(generation, api, deviceId)) return;
      if (abandoned) this.reviewCorrection = correction;
      this.fail(error, abandoned
        ? "The review was cancelled, but fresh meter data could not be loaded. Retry Back to preserve your edits."
        : "The review could not be cancelled. Retry Back before editing the configuration.");
    } finally {
      if (this.ownsOperation(generation, api, deviceId)) {
        this.pendingAction = "";
        this.requestUpdate();
      }
    }
  }

  private setMeterConfiguration(configuration: MeterConfiguration): void {
    this.sourceMeterConfiguration = this.selectedDeviceId && configuration.capabilities.configuration_authoritative
      ? { deviceId: this.selectedDeviceId, meter: structuredClone(configuration) } : null;
    this.configurationMode = configurationModeFor({
      journeyOrigin: this.journeyOrigin,
      semanticSource: configuration.capabilities.semantic_source,
      runtimeOnly: !configuration.capabilities.configuration_authoritative,
    });
    this.legacyCircuitSemanticsConfirmed = false;
    this.meterProfileConfirmed = this.journeyOrigin === "existing_meter" && this.configurationMode === "helper_managed";
    const normalized = { ...configuration, configuration: {
      ...configuration.configuration, multi_reference_preparation_acknowledged: false,
    } };
    const importedMeter = normalized.configuration.meter;
    const fixedVoltage = profileNominalVoltage(importedMeter.electrical_system);
    const voltageMismatch = fixedVoltage !== null
      && importedMeter.voltage_references.some((reference) => reference.nominal_voltage_v !== fixedVoltage);
    const existingReadOnly = this.journeyOrigin === "existing_meter";
    const resolvedMeter = voltageMismatch ? { ...importedMeter, voltage_references: importedMeter.voltage_references.map((reference) =>
      ({ ...reference, nominal_voltage_v: fixedVoltage })) } : importedMeter;
    const seeded = { ...normalized, configuration: { ...normalized.configuration, meter: resolvedMeter } };
    this.verifiedMeterConfiguration = existingReadOnly && this.configurationMode === "helper_managed"
      && configuration.capabilities.configuration_authoritative
      ? configuration : null;
    this.sourcePackageOptions = {
      power_quality: [...normalized.configuration.power_quality],
      status_fields: [...normalized.configuration.status_fields],
    };
    const editable = this.configurationMode === "legacy_editable" ? normalized : seeded;
    this.meterConfiguration = this.packageOptionsTouched ? {
      ...editable,
      configuration: { ...editable.configuration, ...this.packageOptions },
    } : editable;
    this.totalGraphPreview = null;
    this.totalGraphState = "ready";
    this.issuedAutomaticSettings = [...this.meterConfiguration.configuration.automatic_totals];
    this.acceptedAutomaticInputs = this.automaticCandidateInputs();
    if (!this.packageOptionsTouched) this.packageOptions = {
      power_quality: [...normalized.configuration.power_quality],
      status_fields: [...normalized.configuration.status_fields],
    };
    this.canonicalConfigurationChanged = this.packageOptionsTouched
      || (this.configurationMode !== "legacy_editable" && resolvedMeter !== importedMeter);
    this.meterSettingsDraft = { ...this.meterConfiguration.configuration.meter,
      authoritative: configuration.capabilities.configuration_authoritative, warnings: configuration.warnings };
    this.multiReferencePreparationAcknowledged = false;
    this.meterFrequencyTouched = false;
    this.meterNominalVoltageTouched = new Set();
    this.initializeInventory(this.meterConfiguration);
    if (JSON.stringify(this.meterConfiguration.configuration) !== JSON.stringify(configuration.configuration)) {
      this.totalGraphState = "pending";
      void this.refreshTotalGraph(this.meterConfiguration.configuration);
    }
  }

  private chooseExistingConfiguration(choice: ExistingConfigurationChoice): void {
    this.existingConfigurationChoice = choice;
    this.canonicalConfigurationChanged = false;
    this.configurationInstalled = false;
    if (choice === "manage_with_helper") this.navigate("meter");
    else if (choice === "calibrate_only") {
      this.labelOnly = false;
      this.navigate("calibration-plan");
    }
  }

  private calibrationDraftChanges() {
    return this.existingConfigurationChoice === "calibrate_only" || !this.inventory || this.labelOnly
      ? [] : changesFromDrafts(this.inventory, this.drafts);
  }

  private setMeterProfile(electricalSystem: ElectricalSystem): void {
    if (!this.meterSettingsDraft) return;
    this.meterProfileConfirmed = false;
    const defaults = electricalSystem === "split_phase_120_240" ? { frequency: 60 as LineFrequencyHz, voltage: 120 }
      : electricalSystem === "single_phase_230" ? { frequency: 50 as LineFrequencyHz, voltage: 230 } : null;
    this.meterSettingsDraft = { ...this.meterSettingsDraft, electrical_system: electricalSystem,
      ...(defaults && !this.meterFrequencyTouched ? { line_frequency_hz: defaults.frequency } : {}),
      ...(defaults ? { voltage_references: this.meterSettingsDraft.voltage_references.map((reference) =>
        ({ ...reference, nominal_voltage_v: defaults.voltage })) } : {}) };
    this.updateMeterSettings(this.meterSettingsDraft);
    this.requestUpdate();
  }

  private setMeterFrequency(lineFrequencyHz: LineFrequencyHz): void {
    if (!this.meterSettingsDraft) return;
    this.meterProfileConfirmed = false;
    this.meterFrequencyTouched = true;
    this.meterSettingsDraft = { ...this.meterSettingsDraft, line_frequency_hz: lineFrequencyHz };
    this.updateMeterSettings(this.meterSettingsDraft);
    this.requestUpdate();
  }

  private setMeterNominalVoltage(referenceId: string, nominalVoltage: number): void {
    if (!this.meterSettingsDraft) return;
    this.meterProfileConfirmed = false;
    this.meterNominalVoltageTouched = new Set(this.meterNominalVoltageTouched).add(referenceId);
    this.meterSettingsDraft = { ...this.meterSettingsDraft, voltage_references: this.meterSettingsDraft.voltage_references.map((reference) =>
      reference.reference_id === referenceId ? { ...reference, nominal_voltage_v: nominalVoltage } : reference) };
    this.updateMeterSettings(this.meterSettingsDraft);
    this.requestUpdate();
  }

  private async continueFromMeterSettings(): Promise<void> {
    if (!this.api || !this.selectedDeviceId || !this.meterSettingsDraft || this.pendingAction || !this.meterProfileConfirmed) return;
    this.pendingAction = "inventory";
    this.requestUpdate();
    const api = this.api; const deviceId = this.selectedDeviceId; const generation = this.operationGeneration;
    try {
      await this.run(async () => {
        this.updateCircuitConfiguration({ ...this.meterConfiguration!.configuration, meter: meterSettings(this.meterSettingsDraft!),
          multi_reference_preparation_acknowledged: this.multiReferencePreparationAcknowledged }, false);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.showInventory(this.meterConfiguration!);
      }, "CT inventory could not be loaded.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.pendingAction = "";
      this.requestUpdate();
    }
  }

  private async recoverCtInventory(
    api: HelperApi,
    deviceId: string,
    generation: number,
    drafts: Map<number, CtDraft>,
  ): Promise<void> {
    const inventory = await api.getCtInventory(deviceId);
    if (!this.ownsOperation(generation, api, deviceId)) return;
    this.clearSubscription("transaction");
    this.transaction = null;
    this.showInventory(inventory);
    this.drafts = new Map(Array.from(this.drafts, ([channel, fresh]) =>
      [channel, drafts.get(channel) ?? fresh]));
    this.announcement = "Live CT data reloaded. Review the preserved changes again.";
  }

  private updateDraft(channel: number, patch: Partial<CtDraft>): void {
    const current = this.drafts.get(channel);
    if (!current) return;
    this.drafts = new Map(this.drafts).set(channel, { ...current, ...patch });
    if (Object.keys(patch).every((key) => key === "expanded")) return this.requestUpdate();
    if (this.meterConfiguration && !this.labelOnly) {
      const draft = { ...current, ...patch };
      if (draft.preserveExistingGain && this.meterConfiguration.configuration.channels
        .find((item) => item.channel === channel)?.name === draft.name) return this.requestUpdate();
      this.updateCircuitConfiguration({ ...this.meterConfiguration.configuration,
        channels: this.meterConfiguration.configuration.channels.map((item) => item.channel === channel ? draft.preserveExistingGain
          ? { ...item, name: draft.name } : {
          ...item, name: draft.name, model_id: draft.modelId,
          reporting_multiplier: draft.multiplier,
          custom_gain_ct: draft.modelId === "custom" ? draft.customGainCt ?? null : null,
          custom_label: draft.modelId === "custom" ? draft.name.trim() || null : null,
          burden_output_acknowledged: draft.burdenAcknowledged,
        } : item) });
    }
    this.requestUpdate();
  }

  private updateCircuitConfiguration(configuration: MeterConfigurationRequest, changed = true): void {
    if (!this.meterConfiguration) return;
    const unchanged = JSON.stringify(configuration) === JSON.stringify(this.meterConfiguration.configuration);
    this.canonicalConfigurationChanged ||= changed;
    if (unchanged) { this.requestUpdate(); return; }
    this.meterConfiguration = { ...this.meterConfiguration, configuration };
    this.totalGraphPreview = null;
    this.totalGraphState = "pending";
    void this.refreshTotalGraph(configuration);
    this.requestUpdate();
  }

  private automaticCandidateInputs(): string | null {
    const meter = this.meterConfiguration;
    if (!this.api || !this.selectedDeviceId || !meter?.capabilities.configuration_authoritative) return null;
    const issuedIds = new Set(meter.totals.automatic_candidates.map((item) => item.aggregate_id));
    // This checks inputs to an issued catalog; it never constructs candidates or a graph.
    return JSON.stringify({ connection: this.connectionGeneration, device: this.selectedDeviceId,
      plan: meter.plan_id, hash: meter.source_sha256,
      channels: meter.configuration.channels.map(({ channel, enabled, role, name }) => ({ channel, enabled, role, name })),
      collisions: meter.configuration.aggregates.map((item) => item.aggregate_id).filter((id) => issuedIds.has(id)).sort() });
  }

  private automaticSourcesFresh(): boolean {
    return this.acceptedAutomaticInputs !== null && this.acceptedAutomaticInputs === this.automaticCandidateInputs();
  }

  private hasCanonicalChanges(): boolean {
    const intent = this.meterConfiguration?.configuration.totals_change_intent;
    const source = this.sourceMeterConfiguration?.meter.configuration;
    const current = this.meterConfiguration?.configuration;
    const reverted = source && current && JSON.stringify({ ...source, multi_reference_preparation_acknowledged: false })
      === JSON.stringify({ ...current, multi_reference_preparation_acknowledged: false });
    return Boolean(this.configurationMode === "legacy_editable" && this.existingConfigurationChoice === "manage_with_helper" && !this.configurationInstalled
      || intent?.adopt_managed_totals || intent?.legacy_parent_decisions.length
      || this.existingConfigurationChoice !== "calibrate_only" && !this.labelOnly && this.canonicalConfigurationChanged && !reverted);
  }

  private hasUnsupportedCalibrationChanges(): boolean {
    const meter = this.meterConfiguration;
    if (!meter) return false;
    const intent = meter.configuration.totals_change_intent;
    if (intent?.adopt_managed_totals || intent?.legacy_parent_decisions.length) return true;
    const source = this.sourceMeterConfiguration?.meter;
    if (!source) return this.canonicalConfigurationChanged;
    const unsupported = (configuration: MeterConfigurationRequest) => ({ meter: configuration.meter,
      channels: configuration.channels.map(({ channel, enabled, role, voltage_reference_id }) => ({ channel, enabled, role, voltage_reference_id })),
      default_totals: configuration.default_totals, automatic_totals: configuration.automatic_totals, aggregates: configuration.aggregates });
    return JSON.stringify(unsupported(meter.configuration)) !== JSON.stringify(unsupported(source.configuration));
  }

  private totalsIntentNeedsResolution(): boolean {
    return this.hasCanonicalChanges() && (this.labelOnly || this.existingConfigurationChoice === "calibrate_only");
  }

  private explainTotalsModeConflict(): void {
    this.fail(new Error(), "Pending totals choices are outside the selected calibration-only or labels-only mode. No configuration or calibration was changed. Explicitly discard the local choices, or return to configuration editing before reviewing them.");
  }

  private explainCalibrationConfigurationConflict(): void {
    this.fail(new Error(), "Local configuration choices cannot be included in calibration-only saving. Keep your gains and either cancel this action or explicitly discard those local choices to continue calibration. Stored legacy proposals remain pending for a later totals review.");
  }

  private discardUnsupportedCalibrationChanges(): void {
    const baseline = this.sourceMeterConfiguration;
    if (!baseline || baseline.deviceId !== this.selectedDeviceId || baseline.meter.source_sha256 !== this.meterConfiguration?.source_sha256) {
      this.fail(new Error(), "The source baseline no longer matches this meter. No choices or calibration were discarded. Reload the selected meter before reviewing local choices.");
      return;
    }
    if (!window.confirm("Discard uncommitted meter, circuit-role and totals choices to continue calibration? Calibration gains, CT names/models/multipliers and package choices are kept. Stored legacy proposals are not resolved.")) return;
    const source = structuredClone(baseline.meter.configuration);
    const current = this.meterConfiguration.configuration;
    this.canonicalConfigurationChanged = false;
    this.updateCircuitConfiguration({ ...source,
      channels: source.channels.map((channel) => ({ ...current.channels.find((item) => item.channel === channel.channel) ?? channel,
        enabled: channel.enabled, role: channel.role, voltage_reference_id: channel.voltage_reference_id })),
      power_quality: [...this.packageOptions.power_quality], status_fields: [...this.packageOptions.status_fields] }, false);
    this.meterSettingsDraft = { ...source.meter, authoritative: true, warnings: baseline.meter.warnings };
    this.error = "";
    this.announcement = "Unsupported local configuration choices discarded. Calibration gains, CT changes and package choices were kept; stored legacy proposals remain pending.";
  }

  private async refreshTotalGraph(configuration: MeterConfigurationRequest): Promise<void> {
    if (!this.api || !this.selectedDeviceId || !this.meterConfiguration?.capabilities.configuration_authoritative
      || this.configurationMode === "runtime_only") { this.totalGraphState = "invalid"; return; }
    if (configuration.automatic_totals.some((item) => item.name !== undefined && !item.name.trim())) {
      this.totalGraphPreview = null;
      this.totalGraphState = "invalid";
      this.requestUpdate();
      return;
    }
    const api = this.api; const deviceId = this.selectedDeviceId; const generation = this.operationGeneration;
    const meter = this.meterConfiguration;
    const settings = new Map(this.issuedAutomaticSettings.map((item) => [item.candidate_id, item]));
    configuration.automatic_totals.forEach((item) => settings.set(item.candidate_id, item));
    this.issuedAutomaticSettings = [...settings.values()];
    const current = () => this.ownsOperation(generation, api, deviceId)
      && this.meterConfiguration?.configuration === configuration
      && this.meterConfiguration.plan_id === meter.plan_id && this.meterConfiguration.source_sha256 === meter.source_sha256;
    try {
      const preview = await api.previewTotalGraph(deviceId, meter.plan_id, meter.source_sha256,
        { ...configuration, automatic_totals: this.issuedAutomaticSettings });
      if (!current()) return;
      const automatic = preview.automatic_totals.map((item) => {
        const previous = settings.get(item.candidate.candidate_id);
        return { candidate_id: item.candidate.candidate_id, enabled: item.enabled, outputs: item.outputs,
          ...(previous?.name !== undefined ? { name: item.candidate.name } : {}) };
      });
      automatic.forEach((item) => settings.set(item.candidate_id, item));
      this.issuedAutomaticSettings = [...settings.values()];
      this.meterConfiguration = { ...meter, configuration: { ...configuration, automatic_totals: automatic },
        totals: { ...meter.totals, automatic_candidates: preview.automatic_candidates, automatic_totals: preview.automatic_totals,
          stale_automatic_total_settings: preview.stale_automatic_total_settings },
        configuration_impact: preview.configuration_impact };
      this.totalGraphPreview = preview;
      this.totalGraphState = "ready";
      if (["source_owned_totals", "generated_total_id_conflict"].some((code) => this.error === this.safeErrorMessage({ code }, ""))) this.error = "";
      this.acceptedAutomaticInputs = this.automaticCandidateInputs();
    } catch (error) {
      if (!current()) return;
      this.totalGraphPreview = null;
      this.totalGraphState = "invalid";
      if (["source_owned_totals", "generated_total_id_conflict"].includes((error as WsError).code ?? "")) this.fail(error, this.safeErrorMessage(error, ""));
    }
    this.requestUpdate();
  }

  private setPackageOptions(options: BoardPackageOptions): void {
    const packageOptions = {
      power_quality: [...options.power_quality],
      status_fields: [...options.status_fields],
    };
    this.packageOptionsTouched = true;
    this.packageOptions = packageOptions;
    if (this.meterConfiguration) this.updateCircuitConfiguration({
      ...this.meterConfiguration.configuration,
      ...packageOptions,
    });
    else this.requestUpdate();
  }

  private updateMeterSettings(draft: MeterSettingsDraft): void {
    this.meterSettingsDraft = draft;
    this.multiReferencePreparationAcknowledged = false;
    if (this.meterConfiguration) {
      const referenceByGroup = new Map(draft.voltage_references.flatMap((reference) => reference.group_keys.map((group) => [group, reference.reference_id] as const)));
      this.updateCircuitConfiguration({ ...this.meterConfiguration.configuration, meter: meterSettings(draft),
        channels: this.meterConfiguration.configuration.channels.map((channel) => {
          const address = this.meterConfiguration!.channels.find((item) => item.channel === channel.channel)?.address;
          const group = address ? `${address.board_index === 0 ? "main" : `addon${address.board_index}`}_${address.group_index + 1}`
            : `${channel.channel <= 6 ? "main" : `addon${Math.floor((channel.channel - 1) / 6)}`}_${Math.floor(((channel.channel - 1) % 6) / 3) + 1}`;
          return { ...channel, voltage_reference_id: referenceByGroup.get(group) ?? channel.voltage_reference_id };
        }),
        multi_reference_preparation_acknowledged: false });
    }
  }

  private disableCircuit(channel: number): void {
    if (!this.meterConfiguration) return;
    const configuration = this.meterConfiguration.configuration;
    const removedIds = new Set<string>();
    const changedIds = new Set(configuration.aggregates.filter((aggregate) => aggregate.sources.some((source) => source.kind === "channel" && source.channel === channel)).map((aggregate) => aggregate.aggregate_id));
    // Native sources retain their server-described physical coverage when a CT is disabled.
    let aggregates = configuration.aggregates.map((aggregate) => ({ ...aggregate,
      sources: aggregate.sources.filter((source) => source.kind !== "channel" || source.channel !== channel) }));
    let removed: boolean;
    do {
      removed = false;
      aggregates = aggregates.filter((aggregate) => {
        const needed = aggregate.measurement_method === "two_ct_sum" ? 2 : aggregate.measurement_method === "direct" ? undefined : 1;
        if (changedIds.has(aggregate.aggregate_id) && (!aggregate.sources.length || needed !== undefined && aggregate.sources.length !== needed)) {
          removedIds.add(aggregate.aggregate_id); removed = true; return false;
        }
        return true;
      }).map((aggregate) => {
        const sources = aggregate.sources.filter((source) => source.kind !== "aggregate" || !removedIds.has(source.aggregate_id));
        if (sources.length !== aggregate.sources.length) changedIds.add(aggregate.aggregate_id);
        return { ...aggregate, sources };
      });
    } while (removed);
    const affected = configuration.aggregates.filter((aggregate) => removedIds.has(aggregate.aggregate_id)
      || aggregate.sources.some((source) => source.kind === "channel" && source.channel === channel
        || source.kind === "aggregate" && removedIds.has(source.aggregate_id)));
    if (affected.length && !window.confirm(`Marking CT${channel} unused changes ${affected.map((aggregate) => aggregate.name).join(", ")}${removedIds.size ? " and deletes totals with invalid sources. Removing their outputs may affect Home Assistant dashboards, automations, or Energy settings after installation" : ""}. Continue?`)) {
      this.requestUpdate(); return;
    }
    this.updateCircuitConfiguration({ ...configuration, aggregates,
      channels: configuration.channels.map((item) => item.channel === channel ? { ...item, enabled: false, role: "unused" } : item) });
  }

  private hasPackageChanges(): boolean {
    return Boolean(this.sourcePackageOptions && (["power_quality", "status_fields"] as const)
      .some((feature) => this.packageOptions[feature]
        .some((enabled, board) => enabled !== this.sourcePackageOptions?.[feature][board])));
  }

  private async reviewChanges(): Promise<void> {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    let changes = changesFromDrafts(this.inventory, this.drafts);
    if (!changes.length && !this.hasPackageChanges()) {
      return this.fail(new Error(), "Select at least one configuration change before review.");
    }
    const api = this.api; const deviceId = this.selectedDeviceId; const inventory = this.inventory;
    const generation = ++this.operationGeneration;
    this.clearSubscription("transaction");
    this.transaction = null;
    this.transactionPurpose = "install_configuration";
    if (this.labelOnly && changes.length) {
      const labels = changes.filter((change) => change.name !== this.inventory!.channels.find((item) => item.channel === change.channel)?.name)
        .map(({ channel, name }) => ({ channel, name }));
      if (!labels.length || changes.some((change) => {
        const current = this.inventory!.channels.find((item) => item.channel === change.channel);
        return !current || change.model_id !== (current.selected_model_id ?? "") || (change.reporting_multiplier ?? 1) !== current.reporting_multiplier;
      })) {
        return this.fail(new Error(), "Home Assistant label mode only permits display-name edits.");
      }
      await this.run(async () => { await api.setHaLabels(deviceId, inventory.plan_id, inventory.source_sha256, labels); this.announcement = "Home Assistant labels saved."; },
        "Home Assistant labels could not be saved.", () => this.ownsOperation(generation, api, deviceId));
      if (this.error) return;
      if (!this.hasPackageChanges()) {
        this.navigate("calibration-plan");
        return;
      }
      changes = [];
    }
    await this.run(async () => {
      let transaction: TransactionStatus;
      try {
        const liveInventory = await api.getCtInventory(deviceId);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        transaction = await api.previewCtConfig(
          deviceId,
          liveInventory.plan_id,
          liveInventory.source_sha256,
          changes,
          this.sourcePackageOptions ? this.packageOptions : undefined,
        );
      } catch (error) {
        if ((error as WsError).code !== "stale_confirmation") throw error;
        await this.recoverCtInventory(api, deviceId, generation, this.drafts);
        return;
      }
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.transaction = transaction;
      this.navigate("install-configuration");
      await this.subscribeTransaction(this.connectionGeneration);
    }, "The configuration preview is stale. Reload the CT inventory and review again.",
    () => this.ownsOperation(generation, api, deviceId));
  }

  private async subscribeTransaction(generation: number): Promise<void> {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const api = this.api;
    this.clearSubscription("transaction");
    const scope = this.transactionSubscriptionScope;
    const deviceId = this.selectedDeviceId;
    const transactionId = this.transaction.transaction_id;
    const sourceSha256 = this.transaction.source_sha256;
    await this.ownSubscription(api.subscribeConfigTransaction(
      deviceId,
      transactionId,
      sourceSha256,
      (status) => {
        if (this.owns(generation, api)
          && scope === this.transactionSubscriptionScope
          && this.selectedDeviceId === deviceId
          && this.transaction?.transaction_id === transactionId
          && this.transaction.source_sha256 === sourceSha256
          && status.transaction_id === transactionId
          && status.source_sha256 === sourceSha256) {
          this.transaction = status;
          this.requestUpdate();
        }
      },
    ), generation, api, () => scope === this.transactionSubscriptionScope
      && this.selectedDeviceId === deviceId
      && this.transaction?.transaction_id === transactionId
      && this.transaction.source_sha256 === sourceSha256,
    (unsubscribe) => { this.transactionUnsub = unsubscribe; });
  }

  private async continueFromCt(): Promise<void> {
    this.skipCircuitChanges = false;
    if (!this.api || !this.inventory || !this.selectedDeviceId || this.pendingAction) return;
    if (!this.labelOnly && this.meterConfiguration && this.totalGraphState !== "ready") return;
    if (!this.labelOnly && this.configurationMode === "legacy_editable" && this.existingConfigurationChoice === "manage_with_helper" && !this.legacyCircuitSemanticsConfirmed) {
      return this.fail(new Error(), "Confirm that you reviewed used and unused channels and circuit roles before continuing.");
    }
    if (!this.labelOnly && this.meterConfiguration && this.hasCanonicalChanges()) return this.previewCanonicalConfiguration();
    const changes = changesFromDrafts(this.inventory, this.drafts);
    if (this.labelOnly && changes.length) {
      const labels = changes.map(({ channel, name }) => ({ channel, name }));
      const api = this.api; const deviceId = this.selectedDeviceId; const inventory = this.inventory;
      const generation = ++this.operationGeneration;
      this.pendingAction = "session";
      this.requestUpdate();
      await this.run(async () => {
        await api.setHaLabels(deviceId, inventory.plan_id, inventory.source_sha256, labels);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.inventory = { ...inventory, channels: inventory.channels.map((channel) => {
          const changed = labels.find((item) => item.channel === channel.channel);
          return changed ? { ...channel, name: changed.name } : channel;
        }) };
        this.announcement = "Home Assistant labels saved.";
      }, "Home Assistant labels could not be saved.", () => this.ownsOperation(generation, api, deviceId));
      this.pendingAction = "";
      if (this.error) return;
    }
    if (!this.labelOnly && this.meterConfiguration && this.hasCanonicalChanges()) return this.previewCanonicalConfiguration();
    this.skipCircuitChanges = this.labelOnly && this.hasCanonicalChanges();
    this.navigate("calibration-plan");
  }

  private async previewCanonicalConfiguration(): Promise<void> {
    if (!this.api || !this.inventory || !this.selectedDeviceId || !this.meterConfiguration) return;
    if (this.totalsIntentNeedsResolution()) { this.explainTotalsModeConflict(); return; }
    const configuration = this.meterConfiguration.configuration;
    const missingModel = configuration.channels.find((channel) => !channel.model_id.trim()
      || this.drafts.has(channel.channel) && !this.drafts.get(channel.channel)!.preserveExistingGain
        && !this.drafts.get(channel.channel)!.modelId.trim());
    if (missingModel) return this.fail(new Error(), `Choose a CT model for CT${missingModel.channel} before review, or keep its existing gain.`);
    if (!circuitConfigurationIsValid(configuration, this.inventory.channels.length)) return this.fail(new Error(), "Complete the circuit and aggregate assignments before review.");
    this.pendingAction = "session";
    this.transactionPurpose = "install_configuration";
    const api = this.api; const deviceId = this.selectedDeviceId; const meter = this.meterConfiguration; const generation = ++this.operationGeneration;
    await this.run(async () => {
      this.transaction = await api.previewMeterConfiguration(deviceId, meter.plan_id, meter.source_sha256, configuration);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.navigate("install-configuration"); await this.subscribeTransaction(this.connectionGeneration);
    }, "Circuit configuration could not be reviewed.", () => this.ownsOperation(generation, api, deviceId));
    this.pendingAction = ""; this.requestUpdate();
  }

  private async reviewCalibrationHandoff(): Promise<void> {
    if (!this.api || !this.session || !this.restartResult?.source_handoff_available || this.pendingAction) return;
    if (this.hasUnsupportedCalibrationChanges()) { this.explainCalibrationConfigurationConflict(); return; }
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const verificationId = this.restartResult.verification_id; const generation = ++this.operationGeneration;
    this.clearSubscription("transaction");
    this.transaction = null;
    this.transactionPurpose = "save_calibration";
    this.pendingAction = "calibration-handoff";
    this.requestUpdate();
    try {
      await this.run(async () => {
        const changes = this.calibrationDraftChanges();
        const transaction = await api.previewCalibratedGains(
          sessionId,
          verificationId,
          changes,
          this.sourcePackageOptions ? this.packageOptions : undefined,
        );
        if (!this.ownsOperation(generation, api, deviceId)
          || this.session?.session_id !== sessionId
          || this.restartResult?.verification_id !== verificationId) return;
        this.calibrationHandoff = true;
        this.transaction = transaction;
        this.navigate("save-calibration");
        await this.subscribeTransaction(this.connectionGeneration);
      }, "Calibration gains could not be prepared for YAML review.",
      () => this.ownsOperation(generation, api, deviceId));
    } finally {
      if (this.pendingAction === "calibration-handoff") {
        this.pendingAction = "";
        this.requestUpdate();
      }
    }
  }

  private async clearCalibrationHandoff(): Promise<void> {
    const restart = this.restartResult;
    if (!this.api || !this.session || !this.topology || !restart?.source_handoff_firmware_installed
      || !restart.source_handoff_transaction_id) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    if (this.navigationBusy()) return;
    const generation = ++this.operationGeneration;
    this.pendingAction = "clear-calibration"; this.requestUpdate();
    await this.run(async () => {
      const result = await api.clearCalibrationFlash(
        sessionId, restart.verification_id, restart.source_handoff_transaction_id!, this.topology!,
      );
      if (!this.ownsOperation(generation, api, deviceId)
        || this.session?.session_id !== sessionId) return;
      this.restartResult = result;
      this.announcement = "Calibration was saved to YAML, installed, verified, and cleared from flash.";
      this.navigate("summary");
    }, "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values.",
    () => this.ownsOperation(generation, api, deviceId));
    if (this.pendingAction === "clear-calibration") this.pendingAction = "";
    this.requestUpdate();
  }

  private async transactionAction(action: "apply" | "compile" | "install" | "rollback"): Promise<void> {
    if (!this.api || !this.transaction || !this.selectedDeviceId || this.pendingAction) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const current = this.transaction;
    const generation = ++this.operationGeneration;
    this.pendingAction = action;
    this.requestUpdate();
    await this.run(async () => {
      const args = [deviceId, current.transaction_id, current.source_sha256] as const;
      let transaction: TransactionStatus;
      try {
        transaction = action === "apply" ? await api.applyCtConfig(...args)
          : action === "compile" ? await api.compileCtConfig(...args)
          : action === "install" ? await api.installCtConfig(...args)
          : await api.rollbackCtConfig(...args);
      } catch (error) {
        if ((error as WsError).code !== "stale_confirmation") throw error;
        await this.recoverCtInventory(api, deviceId, generation, this.drafts);
        return;
      }
      if (!this.ownsOperation(generation, api, deviceId)
        || this.transaction?.transaction_id !== current.transaction_id
        || this.transaction.source_sha256 !== current.source_sha256) return;
      this.transaction = transaction;
      this.announcement = `Configuration ${this.transaction.state}.`;
      if (action === "install" && transaction.state === "verified" && this.isCalibrationPreparationTransaction(transaction)) {
        const topology = await api.getTopology(deviceId);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.showTopologyResult(topology);
      }
      const unchangedConfirmed = action === "apply" && transaction.purpose === "install_configuration"
        && transaction.state === "verified" && !transaction.progress.includes("device_verified");
      if (action === "apply" && (transaction.state === "validated" || unchangedConfirmed) && this.sourcePackageOptions) {
        this.sourcePackageOptions = {
          power_quality: [...this.packageOptions.power_quality],
          status_fields: [...this.packageOptions.status_fields],
        };
      } else if (action === "rollback" && transaction.state === "rolled_back" && this.sourcePackageOptions) {
        const restored = {
          power_quality: [...this.sourcePackageOptions.power_quality],
          status_fields: [...this.sourcePackageOptions.status_fields],
        };
        for (const change of transaction.changes) {
          const match = /^package\.(main|addon([1-6]))\.(power_quality|status_fields)$/.exec(change.key);
          if (!match || !["enabled", "disabled"].includes(change.old_value ?? "")) continue;
          const board = match[1] === "main" ? 0 : Number(match[2]);
          const feature = match[3] as keyof BoardPackageOptions;
          restored[feature][board] = change.old_value === "enabled";
        }
        this.sourcePackageOptions = restored;
      }
      if (action === "install" && transaction.state === "verified" && transaction.purpose.startsWith("offset_")) {
        this.clearSubscription("transaction");
        this.offsetAcknowledged = [false, false]; this.offsetReadinessByTarget = new Map();
        this.offsetBackupAcknowledged = false; this.offsetRetryConfirmed = false;
        await this.refreshOffsetRecovery(api, generation, true);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.transaction = null; this.transactionPurpose = null;
        this.navigate(transaction.purpose === "offset_preparation" ? "offset" : "save-calibration");
        this.announcement = transaction.purpose === "offset_preparation"
          ? "Preparation installed. Acknowledge physical preparation again and check measured readiness before Run."
          : "Captured offsets installed. Confirm the installed configuration selection; register readback is not verified.";
      } else if (action === "install" && this.calibrationHandoff
        && transaction.state === "verified" && this.session && this.topology && this.restartResult) {
        this.restartResult = {
          ...this.restartResult,
          source_handoff_available: false,
          source_handoff_transaction_id: transaction.transaction_id,
          source_handoff_firmware_installed: true,
        };
        const result = await api.clearCalibrationFlash(
          this.session.session_id,
          this.restartResult.verification_id,
          transaction.transaction_id,
          this.topology,
        );
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.restartResult = result;
        this.announcement = "Calibration was saved to YAML, installed, verified, and cleared from flash.";
        this.navigate("summary");
      } else if ((action === "install" || unchangedConfirmed) && transaction.state === "verified") {
        this.configurationInstalled = action === "install";
        this.verifiedMeterConfiguration = null;
        this.sourceMeterConfiguration = null;
        this.acceptInstalledDrafts();
        this.canonicalConfigurationChanged = false;
        if (transaction.full_meter_configuration_verified && this.meterConfiguration) {
          const meter = this.meterConfiguration;
          const decisions = meter.configuration.totals_change_intent?.legacy_parent_decisions ?? [];
          const links = meter.totals.migration.legacy_parent_links.filter((link) => !decisions.some((decision) =>
            decision.child_id === link.child_id && decision.proposed_parent_id === link.proposed_parent_id));
          this.meterConfiguration = { ...meter,
            configuration: { ...meter.configuration, totals_change_intent: { adopt_managed_totals: false, legacy_parent_decisions: [] } },
            totals: { ...meter.totals, migration: { ...meter.totals.migration, legacy_parent_links: links, parent_review_required: links.length > 0 } } };
        }
        this.announcement = unchangedConfirmed
          ? "Unchanged configuration confirmed and Helper settings saved. Continue to calibration."
          : "Configuration changes were installed and verified. Continue to safety and calibration.";
        if (this.meterConfiguration?.capabilities.configuration_authoritative
          && (transaction.full_meter_configuration_verified || unchangedConfirmed)) {
          await this.refreshInstalledConfiguration();
        }
      }
    }, action === "rollback"
      ? "Rollback could not be completed. The failed configuration remains active; retry Rollback or reload before navigating."
      : action === "install" && this.calibrationHandoff
      ? "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values."
      : "This confirmation is stale. Reload the CT inventory before making another change.",
    () => this.ownsOperation(generation, api, deviceId));
    if (this.pendingAction === action) this.pendingAction = "";
    this.requestUpdate();
  }

  private async refreshInstalledConfiguration(): Promise<void> {
    if (!this.api || !this.selectedDeviceId || this.transaction?.state !== "verified"
      || (!this.transaction.full_meter_configuration_verified
        && !(this.transaction.redacted_diff === "" && this.transaction.progress.includes("metadata_persisted")))
      || this.configurationMode === "runtime_only") return;
    const api = this.api; const deviceId = this.selectedDeviceId; const generation = this.operationGeneration;
    const transaction = this.transaction;
    const current = () => this.ownsOperation(generation, api, deviceId) && this.transaction?.state === "verified"
      && this.transaction.transaction_id === transaction.transaction_id && this.transaction.source_sha256 === transaction.source_sha256;
    this.totalGraphState = "pending";
    this.requestUpdate();
    try {
      const fresh = await api.getMeterConfiguration(deviceId);
      if (!current()) return;
      if (!fresh.capabilities.configuration_authoritative) throw new Error("Fresh configuration is not authoritative");
      this.packageOptionsTouched = false;
      this.setMeterConfiguration(fresh);
      this.verifiedMeterConfiguration = this.configurationInstalled ? fresh : null;
      this.canonicalConfigurationChanged = false;
      this.error = "";
      this.announcement = this.configurationInstalled
        ? "Installed configuration and totals inventory are verified."
        : "Unchanged configuration confirmed and Helper settings refreshed.";
    } catch {
      if (!current()) return;
      this.verifiedMeterConfiguration = null;
      this.totalGraphState = "invalid";
      this.error = this.configurationInstalled
        ? "Installed configuration is verified, but fresh totals inventory could not be loaded. Retry inventory refresh; do not reinstall."
        : "Helper settings were saved, but fresh totals inventory could not be loaded. Retry inventory refresh.";
    }
    this.requestUpdate();
  }

  private async continueCalibrationPlan(plan = this.calibrationPlan): Promise<void> {
    if (!plan || this.navigationBusy()) return;
    if (plan !== "keep_existing") {
      if (this.calibrationPreparation?.state === "available_to_prepare") await this.prepareCalibration();
      else await this.startSession(plan, this.skipCircuitChanges);
      return;
    }
    if (this.session?.has_pending_calibration || this.offsetRecoveryPending()) {
      this.completedWithoutChanges = false;
      this.navigate(this.offsetRecoveryPending() ? resumeWorkflowRoute(this.workflowContext()) : "restart");
      this.announcement = "Finish verifying or saving the retained calibration before completing.";
      return;
    }
    if (this.restartResult) {
      if (this.restartResult.source_authority === "saved_flash") this.keepCalibrationInFlash();
      else this.navigate("summary");
      return;
    }
    if (!this.skipCircuitChanges && this.hasCanonicalChanges()) { await this.previewCanonicalConfiguration(); return; }
    if (this.session?.state === "cancelled") this.session = null;
    if (this.session && ["safety_required", "preflight_failed"].includes(this.session.state)) {
      await this.cancelSession(null);
      if (this.error) return;
      this.session = null;
    }
    if (this.session && this.session.state !== "verified") {
      if (!this.api) return;
      const api = this.api, deviceId = this.selectedDeviceId, sessionId = this.session.session_id;
      const generation = ++this.operationGeneration;
      this.pendingAction = "finish"; this.requestUpdate();
      await this.run(async () => {
        const session = await api.completeCalibrationWithoutChanges(sessionId);
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        if (session.state !== "verified" || session.has_pending_calibration !== false) throw new Error("Completion not verified");
        this.session = session;
        this.completedWithoutChanges = true; this.navigate("summary");
      }, "Existing calibration could not be confirmed. Retained work remains available.", () => this.ownsOperation(generation, api, deviceId));
      if (this.pendingAction === "finish") this.pendingAction = "";
      this.requestUpdate(); return;
    }
    this.completedWithoutChanges = true; this.navigate("summary");
  }

  private async startSession(plan: Exclude<CalibrationPlan, "keep_existing" | null>, skipCircuitChanges = false): Promise<void> {
    if (!this.api || !this.selectedDeviceId || this.sessionStarting || this.pendingAction) return;
    this.sessionStarting = true;
    this.pendingAction = "session";
    this.requestUpdate();
    try {
      const api = this.api; const deviceId = this.selectedDeviceId; const generation = ++this.operationGeneration;
      this.clearSubscription("session");
      this.session = null;
      this.resetCalibrationRun();
      await this.run(async () => {
        if (!this.topology) throw new Error("Topology is required before calibration");
        const active = await api.getActiveWork(deviceId, this.topology);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.session = active.session?.state === "cancelled" ? null : active.session;
        this.transaction = active.transaction;
        this.safetyAcknowledged = this.session?.safety_acknowledged ?? false;
        this.calibrationHandoff = this.transaction?.purpose === "save_calibration";
        this.transactionPurpose = this.transaction?.purpose ?? null;
        this.restartResult = active.verified_calibration;
        if (this.transaction) {
          this.navigate(resumeWorkflowRoute(this.workflowContext()));
          await this.subscribeTransaction(this.connectionGeneration);
          if (this.session) await this.subscribeSession(this.connectionGeneration);
          return;
        }
        if (skipCircuitChanges) {
          const saved = await api.getMeterConfiguration(deviceId);
          if (!this.ownsOperation(generation, api, deviceId)) return;
          // Calibration targets must match the saved device configuration, not pending edits.
          this.calibrationMeterSettings = { ...saved.configuration.meter,
            authoritative: saved.capabilities.configuration_authoritative, warnings: saved.warnings };
          this.topology = saved.topology;
        }
        if (this.session) {
          await this.refreshOffsetRecovery(api, generation, true);
          if (!this.ownsOperation(generation, api, deviceId)) return;
          this.navigate(resumeWorkflowRoute(this.workflowContext()));
          await this.subscribeSession(this.connectionGeneration);
          return;
        }
        const session = await api.startSession(deviceId, plan);
        if (!this.ownsOperation(generation, api, deviceId) || session.device_id !== deviceId) return;
        this.session = session;
        this.calibrationPlan = session.calibration_plan ?? plan;
        await this.refreshOffsetRecovery(api, generation, true);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.navigate(resumeWorkflowRoute(this.workflowContext()));
        await this.subscribeSession(this.connectionGeneration);
      }, "Calibration session could not be started.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.sessionStarting = false;
      this.pendingAction = "";
      this.requestUpdate();
    }
  }

  private async prepareCalibration(): Promise<void> {
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const generation = ++this.operationGeneration;
    this.pendingAction = "prepare-calibration";
    this.clearSubscription("transaction");
    this.requestUpdate();
    await this.run(async () => {
      const transaction = await api.prepareCalibration(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.clearSubscription("session");
      this.session = null;
      this.transaction = transaction;
      this.navigate("install-configuration");
      await this.subscribeTransaction(this.connectionGeneration);
    }, "Reviewed calibration controls could not be prepared. No firmware was changed.",
    () => this.ownsOperation(generation, api, deviceId));
    if (this.ownsOperation(generation, api, deviceId)) this.pendingAction = "";
    this.requestUpdate();
  }

  private isCalibrationPreparationTransaction(transaction: TransactionStatus | null): boolean {
    return Boolean(transaction?.changes.length && transaction.changes.every((change) =>
      /^(?:offset_calibration|gain_calibration|calibration\.(?:offset_calibration|gain_calibration)|package\.(?:main|addon[1-6])\.calibration)$/.test(change.key)));
  }

  private async finishFlow(message: string): Promise<void> {
    if (this.offsetRecoveryPending()) { this.navigate("save-calibration"); return; }
    if (this.hasUnsupportedCalibrationChanges()) { this.explainCalibrationConfigurationConflict(); return; }
    if (this.pendingAction) return;
    if (!this.api) { this.fail(new Error(), "Calibration session could not be closed. Summary remains available; retry Finish."); return; }
    if (!this.session) {
      this.selectDevice(null);
      this.navigate("setup");
      this.announcement = message;
      return;
    }
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    this.pendingAction = "finish"; this.requestUpdate();
    await this.run(async () => {
      await api.closeSession(sessionId);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      this.selectDevice(null); this.pendingAction = ""; this.navigate("setup"); this.announcement = message;
    }, "Calibration session could not be closed. Summary remains available; retry Finish.",
    () => this.ownsOperation(generation, api, deviceId));
    if (this.ownsOperation(generation, api, deviceId)) { this.pendingAction = ""; this.requestUpdate(); }
  }

  private async subscribeSession(generation: number): Promise<void> {
    if (!this.api || !this.session) return;
    const api = this.api;
    this.clearSubscription("session");
    const scope = this.sessionSubscriptionScope;
    const sessionId = this.session.session_id;
    const deviceId = this.session.device_id;
    await this.ownSubscription(api.subscribeSession(sessionId, (session) => {
      if (this.owns(generation, api)
        && scope === this.sessionSubscriptionScope
        && this.session?.session_id === sessionId
        && this.session.device_id === deviceId
        && session.session_id === sessionId
        && session.device_id === deviceId) {
        this.session = session;
        this.requestUpdate();
      }
    }), generation, api, () => scope === this.sessionSubscriptionScope
      && this.session?.session_id === sessionId
      && this.session.device_id === deviceId,
    (unsubscribe) => { this.sessionUnsub = unsubscribe; });
  }

  private async acknowledgeSafety(): Promise<void> {
    if (!this.api || !this.session || this.pendingAction) return;
    this.pendingAction = "safety";
    this.requestUpdate();
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      const session = await api.acknowledgeSafety(sessionId);
      if (!this.ownsOperation(generation, api, deviceId) || session.session_id !== sessionId) return;
      this.session = session;
      this.calibrationPlan = session.calibration_plan ?? this.calibrationPlan;
      this.navigate(resumeWorkflowRoute(this.workflowContext()));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(generation, api, deviceId));
    this.pendingAction = "";
    this.requestUpdate();
  }

  private offsetKey(board = this.board, stage = this.offsetStage): string {
    return `${board}:${stage}`;
  }

  private stockOffsetMode(): boolean {
    return Boolean(this.offsetPreparation?.backup_available || this.offsetFinalization?.backup_available
      || this.configurationMode !== "runtime_only" && this.selectedConfigurationAvailable()
      && this.session?.offset_capability?.status === "available");
  }

  private offsetRecoveryPending(): boolean {
    return Boolean((this.offsetPreparation?.backup_available || this.offsetFinalization?.backup_available)
      && !(this.offsetFinalization?.configuration_selected && this.offsetFinalization.action_ready
        && this.session?.has_pending_calibration === false));
  }

  private async refreshOffsetRecovery(api: HelperApi, generation: number, restoreSelection = false): Promise<void> {
    if (!this.session || !this.stockOffsetMode()) return;
    const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const preparation = await api.getOffsetPreparation(sessionId);
    const finalization = await api.getOffsetFinalization(sessionId);
    const session = await api.getSession(sessionId);
    if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId
      || session.session_id !== sessionId || session.device_id !== deviceId) return;
    this.offsetPreparation = preparation; this.offsetFinalization = finalization; this.session = session;
    if (restoreSelection && finalization.board_index !== null && finalization.stage !== null) {
      this.board = finalization.board_index; this.offsetStage = finalization.stage;
    }
    const results = new Map<string, OffsetCalibrationResult>();
    for (let board = 0; board < (this.topology?.board_count ?? 0); ++board) for (const stage of [1, 2] as const) {
      const groups = board === 0 ? ["main_1", "main_2"] : [`addon${board}_1`, `addon${board}_2`];
      const tables: OffsetCalibrationResult["expected_tables"] = finalization.results
        .filter(([id, family]) => family === stage && groups.includes(id.replace("meter_main", "main_")))
        .map(([id, , table]) => [id.replace("meter_main", "main_"), table]);
      const unfinished = groups.filter((key) => !tables.some(([id]) => id === key));
      if (tables.length) results.set(this.offsetKey(board, stage), {
        board_index: board, stage, state: unfinished.length ? "partial" : "captured_pending_configuration",
        expected_tables: tables, unfinished_group_keys: unfinished, retry_allowed: false,
        error: unfinished.length ? "Captured values retained; unfinished chips require a new reviewed preparation." : null,
      });
    }
    this.offsetResultByTarget = results;
  }

  private async reviewOffsetPreparation(): Promise<void> {
    if (!this.api || !this.session || this.offsetBusy || this.pendingAction || !this.offsetBackupAcknowledged) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const board = this.board; const stage = this.offsetStage; const generation = ++this.operationGeneration;
    this.offsetBusy = true; this.requestUpdate();
    await this.run(async () => {
      const review = await api.previewOffsetPreparation(sessionId, board, stage, true);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      if (review.mode === "native") {
        this.clearSubscription("transaction");
        this.transaction = null; this.transactionPurpose = null;
        this.offsetPreparation = await api.getOffsetPreparation(sessionId);
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        this.calibrationHandoff = false;
        this.offsetAcknowledged = [false, false]; this.offsetReadinessByTarget = new Map();
        this.navigate("offset");
        this.announcement = "Native offset controls are ready. Check measured readiness before Run.";
        return;
      }
      this.transaction = review.transaction; this.transactionPurpose = review.transaction!.purpose;
      this.calibrationHandoff = false;
      this.offsetAcknowledged = [false, false]; this.offsetReadinessByTarget = new Map();
      this.navigate("install-configuration"); await this.subscribeTransaction(this.connectionGeneration);
    }, `${offsetBoardLabel(board)} Stage ${stage} preparation could not be reviewed. Check ESPHome Device Builder and the meter connection, then retry. Existing recovery data, if any, is retained.`,
    () => this.ownsOperation(generation, api, deviceId));
    this.offsetBusy = false; this.requestUpdate();
  }

  private async reviewOffsetFinalization(): Promise<void> {
    if (!this.api || !this.session || this.pendingAction) return;
    if (this.hasUnsupportedCalibrationChanges()) { this.explainCalibrationConfigurationConflict(); return; }
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    this.pendingAction = "offset-finalization"; this.requestUpdate();
    await this.run(async () => {
      const review = await api.previewOffsetFinalization(sessionId, this.restartResult?.source_handoff_available ? this.restartResult.verification_id : undefined,
        this.calibrationDraftChanges(), this.hasPackageChanges() ? this.packageOptions : undefined);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      this.transaction = review.transaction; this.transactionPurpose = review.transaction.purpose; this.calibrationHandoff = false;
      this.navigate("save-calibration"); await this.subscribeTransaction(this.connectionGeneration);
    }, "Final review is unavailable. Both RMS and power tables must be known for each selected chip; verify pending gains first if needed. Unknown evidence is not zero. Captured values are retained.",
    () => this.ownsOperation(generation, api, deviceId));
    this.pendingAction = ""; this.requestUpdate();
  }

  private async reconcileOffsetFinalization(): Promise<void> {
    if (!this.api || !this.session || !this.offsetFinalization?.operation_id || this.pendingAction) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const operationId = this.offsetFinalization.operation_id; const generation = ++this.operationGeneration;
    this.pendingAction = "offset-selection"; this.requestUpdate();
    await this.run(async () => {
      try { await api.reconcileOffsetFinalization(sessionId, operationId); }
      finally { if (this.ownsOperation(generation, api, deviceId) && this.session?.session_id === sessionId) await this.refreshOffsetRecovery(api, generation); }
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      await this.refreshOffsetRecovery(api, generation);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      if (this.offsetRecoveryPending()) throw new Error("Pending groups remain");
      this.navigate("summary");
    }, "Offset selection could not be confirmed or calibration groups remain pending. Retained values are not lost. Review the refreshed installation status before retrying.",
    () => this.ownsOperation(generation, api, deviceId));
    this.pendingAction = ""; this.requestUpdate();
  }

  private async beginOffsetCycle(): Promise<void> {
    if (!this.api || !this.session || !this.offsetBackupAcknowledged || this.pendingAction) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    this.pendingAction = "offset-cycle"; this.requestUpdate();
    await this.run(async () => {
      await api.beginOffsetCycle(sessionId, true);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      this.offsetAcknowledged = [false, false]; this.offsetReadinessByTarget = new Map();
      this.offsetBackupAcknowledged = false; this.offsetRetryConfirmed = false;
      await this.refreshOffsetRecovery(api, generation, true);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.navigate("offset");
    }, "A new cycle could not be started. Confirm the current final installation and resolve pending work first; backups and results are retained.",
    () => this.ownsOperation(generation, api, deviceId));
    this.pendingAction = ""; this.requestUpdate();
  }

  private async checkOffsetReadiness(): Promise<void> {
    if (!this.api || !this.session || this.offsetBusy || !this.offsetAcknowledged[this.offsetStage - 1]) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const board = this.board; const stage = this.offsetStage; const generation = ++this.operationGeneration;
    this.offsetBusy = true; this.requestUpdate();
    try {
      await this.run(async () => {
        const result = await api.checkOffsetReadiness(sessionId, board, stage);
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget).set(this.offsetKey(board, stage), result);
        this.announcement = result.ready ? `Board ${board + 1} Stage ${stage} measured readiness passed.`
          : `Board ${board + 1} Stage ${stage} measured readiness did not pass.`;
      }, "Measured offset readiness could not be collected. Reconnect and inspect the meter.",
      () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.offsetBusy = false; this.requestUpdate();
    }
  }

  private async calibrateOffset(): Promise<void> {
    if (!this.api || !this.session || this.offsetBusy || this.session.configured_offset_targets?.some(([board, stage]) => board === this.board && stage === this.offsetStage)) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const board = this.board; const stage = this.offsetStage; const key = this.offsetKey(board, stage);
    const prior = this.offsetResultByTarget.get(key);
    const stageState = this.session.offset_boards?.[board]?.stages[stage - 1]?.state;
    const retryRequired = Boolean(prior?.retry_allowed) || stageState === "partial" || stageState === "indeterminate";
    if (this.offsetAcknowledged[stage - 1] !== true || !this.offsetReadinessByTarget.get(key)?.ready || !this.stockOffsetMode() && retryRequired && !this.offsetRetryConfirmed) return;
    const generation = ++this.operationGeneration;
    this.offsetBusy = true; this.requestUpdate();
    try {
      await this.run(async () => {
        const prepared = this.offsetPreparation;
        if (this.stockOffsetMode() && (!prepared?.action_ready || !prepared.operation_id || prepared.stage !== stage
          || prepared.attempted.length || !prepared.targets.every((id) => (board === 0 ? ["meter_main1", "meter_main2"] : [`addon${board}_1`, `addon${board}_2`]).includes(id)))) return;
        const result = this.stockOffsetMode()
          ? await api.resumeOffsetCalibration(sessionId, prepared!.operation_id!, board, stage, true)
          : await api.calibrateOffset(sessionId, board, stage, true, retryRequired);
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        this.offsetResultByTarget = new Map(this.offsetResultByTarget).set(key, result);
        const session = await api.getSession(sessionId);
        if (!this.ownsOperation(generation, api, deviceId) || session.session_id !== sessionId || session.device_id !== deviceId) return;
        this.session = session;
        this.offsetAcknowledged = this.offsetAcknowledged.map((value, index) => index === stage - 1 ? false : value);
        this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget);
        this.offsetReadinessByTarget.delete(key);
        this.offsetRetryConfirmed = false;
        if (this.stockOffsetMode()) await this.refreshOffsetRecovery(api, generation);
        this.announcement = result.state === "applied_pending_restart_verification"
          ? `Board ${board + 1} Stage ${stage} saved; restart verification required.`
          : `Board ${board + 1} Stage ${stage} requires recovery before retry.`;
      }, "Offset calibration did not complete. Reconnect and inspect before another attempt.",
      () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.offsetBusy = false; this.requestUpdate();
    }
  }

  private async skipOffset(): Promise<void> {
    if (!this.api || !this.session || this.offsetBusy) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    this.offsetBusy = true; this.requestUpdate();
    try {
      await this.run(async () => {
        const session = await api.skipOffsetCalibration(sessionId);
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        this.session = session;
        this.announcement = "Offset calibration skipped; existing flash values were preserved.";
      }, "Offset calibration could not be skipped.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.offsetBusy = false; this.requestUpdate();
    }
  }

  private continueOffset(): void {
    if (!this.session || this.offsetBusy) return;
    const finalized = this.session.offset_disposition === "completed"
      || this.session.offset_disposition === "skipped"
      || this.session.offset_disposition === "partial" && this.session.state === "applied_pending_restart_verification";
    if (finalized) { this.navigate("voltage"); return; }
    if (this.session.offset_boards?.[this.board]?.stages[this.offsetStage - 1]?.state !== "completed") return;
    const boardCount = this.topology?.board_count ?? this.session.offset_boards?.length ?? 1;
    if (this.board + 1 < boardCount) this.board += 1;
    else if (this.offsetStage === 1) { this.offsetStage = 2; this.board = 0; }
    else { this.navigate("voltage"); return; }
    this.offsetAcknowledged = this.offsetAcknowledged.map((value, index) => index === this.offsetStage - 1 ? false : value);
    this.offsetRetryConfirmed = false;
    this.offsetReadinessByTarget = new Map();
    this.focusHeading = true;
    this.requestUpdate();
  }

  private async finishCurrent(): Promise<void> {
    if (!this.session || this.finishBusy) return;
    if (this.totalsIntentNeedsResolution()) { this.explainTotalsModeConflict(); return; }
    if (this.offsetRecoveryPending()) { this.navigate("save-calibration"); return; }
    if (this.session.has_pending_calibration) {
      this.navigate("restart");
      if (this.hasUnsupportedCalibrationChanges()) this.explainCalibrationConfigurationConflict();
      return;
    }
    if (this.calibrationDraftChanges().length || this.hasCanonicalChanges() || this.hasPackageChanges()) {
      await this.finishWithoutCalibration();
      return;
    }
    if (!this.api) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    this.finishBusy = true; this.requestUpdate();
    try {
      await this.run(async () => {
        const session = await api.completeCalibrationWithoutChanges(sessionId);
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        if (session.session_id !== sessionId || session.state !== "verified" || session.has_pending_calibration !== false) {
          throw new Error("No-change completion response is not authoritative");
        }
        this.session = session;
        this.completedWithoutChanges = true;
        this.navigate("summary");
        this.announcement = "Completed without calibration changes; no restart was required.";
      }, "Calibration completion could not be confirmed.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.finishBusy = false; this.requestUpdate();
    }
  }

  private async checkStability(target: "voltage" | "current"): Promise<void> {
    if (!this.api || !this.session || this.pendingAction === "session" || (target === "voltage" && this.voltageBusy)) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    const targetIds = target === "voltage" ? this.selectedVoltageReferences().map(item => item.referenceId)
      : this.currentReferenceEntries().map((item) => String(item.channel));
    if (!targetIds.length) return;
    this.pendingAction = "session"; if (target === "voltage") this.voltageBusy = true; this.requestUpdate();
    try {
      await this.run(async () => {
        if (target === "voltage") {
          const updated = new Map(this.stabilityByTarget);
          for (const referenceId of targetIds) {
            const result = await api.checkStability(sessionId, "voltage", referenceId);
            if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
            updated.set(`voltage:${referenceId}`, result);
          }
          this.stabilityByTarget = updated;
          this.announcement = "Loaded voltage data for the selected reference.";
          return;
        }
        for (const [index, targetId] of targetIds.entries()) {
          const result = await api.checkStability(sessionId, target, targetId);
          if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
          this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${target}:${targetId}`, result);
          if (index < targetIds.length - 1) this.requestUpdate();
        }
      }, "Stable samples could not be collected.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      if (target === "voltage") this.voltageBusy = false; this.pendingAction = ""; this.requestUpdate();
    }
  }

  private async calibrate(target: "voltage" | "current"): Promise<void> {
    if (!this.api || !this.session || this.pendingAction === "session" || (target === "voltage" && this.voltageBusy)) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id; this.pendingAction = "session"; this.requestUpdate();
    const generation = ++this.operationGeneration;
    const currentReferences = this.currentReferenceEntries();
    if (target === "current" && !currentReferences.length) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      this.pendingAction = "";
      return;
    }
    if (target === "voltage") { this.voltageBusy = true; this.requestUpdate(); }
    try {
      await this.run(async () => {
        if (target === "voltage") {
          if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
          const updated = new Map(this.calibrationByTarget);
          const references = this.selectedVoltageReferences();
          if (!references.length || references.some(({ value }) => !Number.isFinite(value) || value < 1 || value > 600)
            || references.some(({ referenceId }) => !this.stabilityByTarget.get(`voltage:${referenceId}`)?.stable)) {
            throw new Error("Voltage references must be valid and stable before calibration.");
          }
          for (const { referenceId, value } of references) {
            const results = await api.calibrateVoltage(sessionId, referenceId, value, true);
            if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
            results.forEach((result) => updated.set(`voltage:${result.group_key}`, result));
            this.calibrationByTarget = new Map(updated);
            this.requestUpdate();
          }
          this.calibrationByTarget = updated;
          const session = await api.getSession(sessionId);
          if (!this.ownsOperation(generation, api, deviceId) || session.session_id !== sessionId || session.device_id !== deviceId) return;
          this.session = session;
          this.announcement = "Calibrated the selected voltage reference.";
          return;
        }
        const result = await api.calibrateCurrent(sessionId, currentReferences, true,
          this.calibrationDraftChanges().map((change) => ({
              channel: change.channel,
              reporting_multiplier: change.reporting_multiplier ?? 1,
            })));
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        const updated = new Map(this.calibrationByTarget);
        currentReferences.forEach((item) => updated.set(`current:${item.channel}`, result));
        this.calibrationByTarget = updated;
        const session = await api.getSession(sessionId);
        if (!this.ownsOperation(generation, api, deviceId) || session.session_id !== sessionId || session.device_id !== deviceId) return;
        this.session = session;
        this.announcement = `Current calibration iteration ${result.iteration} finished. Review the result before continuing.`;
      }, "Calibration did not complete. Reconnect and inspect before another attempt.",
      () => this.ownsOperation(generation, api, deviceId));
    } finally {
      if (target === "voltage") { this.voltageBusy = false; this.requestUpdate(); }
      this.pendingAction = "";
      this.requestUpdate();
    }
  }

  private keepCalibrationInFlash(): void {
    if (this.hasUnsupportedCalibrationChanges()) { this.explainCalibrationConfigurationConflict(); return; }
    ++this.operationGeneration;
    if (this.pendingAction === "calibration-handoff") this.pendingAction = "";
    this.clearSubscription("transaction");
    if (this.transaction?.state !== "verified") this.transaction = null;
    this.handoffDeclined = true;
    this.announcement = "Calibration remains in meter flash. Installing firmware may replace it.";
    this.navigate("summary");
  }

  private groupKey(index: number): string {
    const board = Math.floor(index / 2);
    const group = index % 2 + 1;
    return board === 0 ? `main_${group}` : `addon${board}_${group}`;
  }

  private voltageReferenceIds(): string[] {
    const groups = this.voltageGroupKeys();
    const references = (this.calibrationMeterSettings ?? this.meterSettingsDraft)?.voltage_references.filter((reference) => reference.group_keys.some((key) => groups.includes(key))) ?? [];
    if (references.length) return references.map((reference) => reference.reference_id);
    return this.topology?.voltage_layout === "two_voltages" ? ["main", "secondary"] : ["main"];
  }

  private selectedVoltageReferences(): Array<{ referenceId: string; value: number }> {
    return this.voltageReferenceIds().map((referenceId, index) => ({ referenceId,
      value: this.voltageReferences instanceof Map ? this.voltageReferences.get(referenceId) ?? 0 : this.voltageReferences[index] ?? 0 }))
      .filter(({ referenceId, value }) => value !== 0 && !this.voltageReferenceComplete(referenceId));
  }

  private voltageReferenceLabel(referenceId: string): string {
    return (this.calibrationMeterSettings ?? this.meterSettingsDraft)?.voltage_references.find((reference) => reference.reference_id === referenceId)?.label
      ?? `${referenceId === "secondary" ? "Secondary" : "Main"} voltage (all boards)`;
  }

  private voltageReferenceComplete(referenceId: string): boolean {
    const groups = (this.calibrationMeterSettings ?? this.meterSettingsDraft)?.voltage_references.find((reference) => reference.reference_id === referenceId)?.group_keys
      ?? Array.from({ length: this.topology?.group_count ?? 2 }, (_, index) => this.groupKey(index))
        .filter((_, index) => this.topology?.voltage_layout !== "two_voltages" || index % 2 === (referenceId === "secondary" ? 1 : 0));
    return groups.every((group) => this.calibrationByTarget.get(`voltage:${group}`)?.state === "applied_pending_restart_verification");
  }

  private voltageGroupKeys(): string[] {
    if (!this.topology) return [this.groupKey(this.group)];
    return [this.groupKey(this.board * 2), this.groupKey(this.board * 2 + 1)];
  }

  private currentReferenceEntries(): Array<{ channel: number; reference: number; reporting_multiplier: number }> {
    const first = Math.floor((this.channel - 1) / 3) * 3 + 1;
    return Array.from({ length: 3 }, (_, index) => first + index).flatMap((channel) => {
      const reference = this.currentReferences.get(channel);
      const multiplier = this.drafts.get(channel)?.multiplier
        ?? this.inventory?.channels[channel - 1]?.reporting_multiplier
        ?? this.reportingMultiplier;
      return reference && reference > 0 && multiplier !== null
        ? [{ channel, reference, reporting_multiplier: multiplier }]
        : [];
    });
  }

  private async restart(): Promise<void> {
    if (!this.api || !this.session || !this.topology || this.restartBusy) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const topology = this.topology;
    const generation = ++this.operationGeneration;
    this.restartResult = null;
    this.restartBusy = true;
    this.announcement = "Restarting the meter and verifying restored calibration values.";
    this.requestUpdate();
    try {
      await this.run(async () => {
        let result: RestartVerificationResult;
        try {
          result = this.offsetRecoveryPending() ? await api.restartAndVerifyGains(sessionId, topology) : await api.restartAndVerify(sessionId, topology);
        } catch (error) {
          if (this.ownsOperation(generation, api, deviceId)
            && this.session?.session_id === sessionId && this.topology === topology) {
            this.restartResult = null;
            this.session = { ...this.session, state: "restart_failed" };
          }
          throw error;
        }
        if (!this.ownsOperation(generation, api, deviceId)
          || this.session?.session_id !== sessionId || this.topology !== topology) return;
        this.restartResult = result;
        this.completedWithoutChanges = false;
        this.session = { ...this.session!, state: this.offsetRecoveryPending() ? "gains_verified_offsets_pending" : "verified" };
      }, "Restart verification failed; review recovery evidence before rollback.",
      () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.restartBusy = false;
      this.requestUpdate();
    }
    const restartResult = this.restartResult as RestartVerificationResult | null;
    if (this.offsetRecoveryPending() && restartResult) {
      this.navigate("save-calibration");
    } else if (restartResult?.source_handoff_available) {
      this.navigate("save-calibration");
    } else if (restartResult) {
      this.navigate("summary");
    }
  }

  private async cancelSession(destination: WorkflowRoute | null = "safety"): Promise<void> {
    if (!this.api || !this.session) return;
    if (this.session.state === "cancelled") {
      if (destination) this.navigate(destination);
      return;
    }
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    const action = this.pendingAction;
    if (!action) this.pendingAction = "cancel-session";
    this.requestUpdate();
    await this.run(async () => {
      const cancelled = await api.cancelSession(sessionId);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      const installed = this.configurationInstalled;
      this.clearSubscription("session");
      this.session = cancelled;
      this.restartResult = null;
      if (destination === "setup") this.selectDevice(null);
      if (destination) this.navigate(destination);
      this.announcement = destination === "setup"
        ? installed ? "Calibration closed. Installed configuration is unchanged. Choose another meter." : "Calibration closed. Choose another meter."
        : destination === "ct"
        ? "Calibration session closed. Review CT names and types before continuing."
        : "Calibration session cancelled; cleanup completed without restart verification.";
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(generation, api, deviceId));
    if (!action && this.pendingAction === "cancel-session") this.pendingAction = "";
    this.requestUpdate();
  }

  private async finishWithoutCalibration(): Promise<void> {
    if (this.pendingAction) return;
    if (this.totalsIntentNeedsResolution()) { this.explainTotalsModeConflict(); return; }
    this.pendingAction = "finish";
    this.requestUpdate();
    const changes = this.calibrationDraftChanges();
    try {
      await this.cancelSession(null);
      if (this.error) return;
      if (this.meterConfiguration && this.hasCanonicalChanges()) await this.previewCanonicalConfiguration();
      else if (changes.length || this.hasPackageChanges()) await this.reviewChanges();
      else {
        this.selectDevice(null);
        this.pendingAction = "";
        this.navigate("setup");
        this.announcement = "No changes were made. Select another device to configure.";
      }
    } finally {
      this.pendingAction = "";
      this.requestUpdate();
    }
  }

  private async reconnectSession(): Promise<void> {
    if (!this.api || !this.session) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      const session = this.step === "offset"
        ? await api.reconnectSession(sessionId, this.board, this.offsetStage)
        : await api.reconnectSession(sessionId);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      this.session = session;
      this.offsetAcknowledged = [false, false]; this.offsetReadinessByTarget = new Map();
      await this.refreshOffsetRecovery(api, generation, true);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      this.announcement = `Session reconnected with state ${this.session.state}.`;
    }, "Session reconnection failed. Retry only after checking the meter connection.",
    () => this.ownsOperation(generation, api, deviceId));
  }

  private resultFor(target: "voltage" | "current"): CalibrationResult | null {
    const currentIds = this.currentReferenceEntries().map((item) => String(item.channel));
    const first = Math.floor((this.channel - 1) / 3) * 3 + 1;
    const targetIds = target === "voltage" ? this.voltageGroupKeys()
      : currentIds.length ? currentIds : Array.from({ length: 3 }, (_, index) => String(first + index));
    for (const targetId of [...targetIds].reverse()) {
      const result = this.calibrationByTarget.get(`${target}:${targetId}`);
      if (result) return result;
    }
    return null;
  }

  private voltageResultsForBoard(): CalibrationResult[] {
    return this.voltageGroupKeys().flatMap((targetId) => {
      const result = this.calibrationByTarget.get(`voltage:${targetId}`);
      return result ? [result] : [];
    });
  }

  private calibratedInstances(target: "voltage" | "current"): Set<string> {
    return new Set([...this.calibrationByTarget.entries()].flatMap(([key, result]) =>
      key.startsWith(`${target}:`) && result.state === "applied_pending_restart_verification"
        && result.gain_evidence?.flash_saved ? [result.gain_evidence.instance_id] : []));
  }

  private calibrationContinuationBlocked(target: "voltage" | "current"): boolean {
    return this.navigationBusy() || ["calibration_outcome_indeterminate", "restart_failed", "preflight_failed"].includes(this.session?.state ?? "")
      || [...this.calibrationByTarget].some(([key, result]) => key.startsWith(target + ":") && result.state !== "applied_pending_restart_verification");
  }

  private unrunReferences(target: "voltage" | "current"): string[] {
    if (target === "current") return [...this.currentReferences].filter(([channel, value]) => value > 0
      && this.calibrationByTarget.get("current:" + channel)?.state !== "applied_pending_restart_verification").map(([channel]) => "CT" + channel);
    return [...this.voltageReferences].filter(([id, value]) => value > 0 && !this.voltageReferenceComplete(id)).map(([id]) => this.voltageReferenceLabel(id));
  }

  private calibrationContinueLabel(target: "voltage" | "current"): string {
    if (this.unrunReferences(target).length) return "Keep entered references unchanged and continue";
    if (this.hasCompletedCalibration(target)) return target === "voltage" ? "Continue to Current" : "Continue";
    const any = [...this.calibrationByTarget].some(([key, result]) => key.startsWith(target + ":") && result.state === "applied_pending_restart_verification");
    return any ? "Keep remaining gains and continue" : "Keep existing " + target + " calibration";
  }

  private calibrationContinuation(target: "voltage" | "current"): TemplateResult {
    const unrun = this.unrunReferences(target);
    return html`${this.calibrationContinuationBlocked(target) && !this.navigationBusy() ? html`<p class="warning-band" role="status">Resolve the unsuccessful calibration using the recovery actions before continuing.</p>` : nothing}
      ${unrun.length ? html`<p class="warning-band" role="status">References entered for ${unrun.join(", ")} have not been applied. Calibrate them, or explicitly keep their existing gains below.</p>` : nothing}`;
  }

  private hasCompletedCalibration(target: "voltage" | "current"): boolean {
    if (target === "voltage") return this.voltageGroupKeys().every((targetId) =>
      this.calibrationByTarget.get(`voltage:${targetId}`)?.state === "applied_pending_restart_verification");
    const channels = this.meterConfiguration?.configuration.channels
      .filter((channel) => channel.enabled).map((channel) => channel.channel)
      ?? this.inventory?.channels.map((channel) => channel.channel)
      ?? Array.from({ length: this.topology?.ct_count ?? 0 }, (_, index) => index + 1);
    return channels.length > 0 && channels.every((channel) =>
      this.calibrationByTarget.get(`current:${channel}`)?.state === "applied_pending_restart_verification");
  }

  private stabilityFor(target: "voltage" | "current"): StabilityResult | null {
    const targetIds = target === "voltage" ? this.selectedVoltageReferences().map(item => item.referenceId)
      : this.currentReferenceEntries().map((item) => String(item.channel));
    const results = targetIds.flatMap((targetId) => {
      const result = this.stabilityByTarget.get(`${target}:${targetId}`);
      return result ? [result] : [];
    });
    if (!results.length) return null;
    return {
      target,
      target_id: target === "voltage" ? `Board ${this.board + 1}` : `Current group ${Math.floor((this.channel - 1) / 3) + 1}`,
      stable: results.length === targetIds.length && results.every((result) => result.stable),
      windows: results.flatMap((result) => result.windows),
    };
  }

  private async run(
    operation: () => Promise<void>,
    fallback: string | (() => string),
    isCurrent: () => boolean = () => true,
  ): Promise<void> {
    this.error = "";
    try {
      await operation();
    } catch (error) {
      if (!isCurrent()) return;
      this.fail(error, this.safeErrorMessage(error, typeof fallback === "function" ? fallback() : fallback));
    }
    if (isCurrent()) this.requestUpdate();
  }

  private safeErrorMessage(error: unknown, fallback: string): string {
    const code = (error as WsError).code;
    const board = offsetBoardLabel(this.board);
    if (code === "offset_communication_failed") return `The selected ${board} could not verify meter-chip communication. Check the meter connection and retry. Existing recovery data is unchanged.`;
    if (code === "meter_communication_failed") return this.step === "offset"
      ? `The selected ${board} could not verify meter-chip communication. Check the meter connection and retry. Existing recovery data is unchanged.`
      : "Meter-chip communication could not be verified. Check the meter connection and retry.";
    if (code === "meter_unavailable") return "The meter is offline or its ESPHome API is unreachable. Restore its connection in Home Assistant and retry.";
    if (code === "offset_diagnostics_incomplete") return `Fresh offset diagnostics for the selected ${board} were incomplete. Retry to request fresh diagnostics. Existing recovery data is unchanged.`;
    if (code === "offset_chip_identity_unavailable") return `The meter-chip mapping for the selected ${board} could not be verified from the authoritative configuration. Review the source/package definitions and retry. Existing recovery data is unchanged.`;
    if (code === "offset_tables_unavailable") return `The meter did not report all offset values needed to back up this calibration stage for the selected ${board}. This can happen before the first offset calibration, even when the firmware supports offset calibration. Retry to request fresh diagnostics, or choose Skip offset calibration to continue with voltage/current calibration. Existing recovery data is unchanged.`;
    if (code === "source_owned_totals") return "Edit these existing totals in ESPHome Device Builder to preserve their energy links and entity identities.";
    if (code === "generated_total_id_conflict") return "Rename one of the totals so its generated sensor IDs are unique and do not conflict with existing sensors.";
    return code === "stale_confirmation"
      ? "This confirmation expired. Reload live data and review again."
      : code === "stale_handle"
        ? "The selected device changed or is no longer available. Rescan and try again."
        : fallback;
  }

  private fail(_error: unknown, safeMessage: string): void {
    this.error = safeMessage;
    this.announcement = safeMessage;
    this.requestUpdate();
  }

  private stepBody(): TemplateResult {
    if (this.step === "setup") return html`${setupDeviceStep({ snapshot: this.setup,
      addonCount: this.addonCount,
      connection: this.connection,
      busyAction: this.pendingAction,
      discoverOnly: Boolean(this.topology),
      firmwareCatalog: this.firmwareCatalog(),
      importFailedDeviceId: this.importFailedDeviceId,
      existingCandidates: this.existingCandidates,
      inspection: this.existingInspection,
      existingSearchComplete: this.existingSearchComplete }, { setAddon: (value) => this.setAddonCount(value),
      setConnection: (value) => { this.connection = value; this.refreshFirmwareOptions(); },
      rescan: () => void this.rescan(),
      configure: (id) => void this.configureDevice(id),
      adopt: (id) => void this.adopt(id),
      findExisting: () => void this.findExistingMeters(),
      inspectExisting: (id) => void this.inspectExistingMeter(id),
      adoptInspected: (id) => void this.adopt(id) })}
      ${this.topology ? topologyStep(this.topology, this.selectedProjectVersion(),
        () => { this.selectDevice(null); this.navigate("setup"); }, () => void (this.selectedConfigurationAvailable()
          ? this.loadInventory() : this.navigate("calibration-plan")), this.error === "Topology mismatch", this.pendingAction.startsWith("topology:") || this.pendingAction === "inventory" || this.pendingAction === "session" || this.pendingAction === "prepare-calibration", this.calibrationPreparation, () => void this.prepareCalibration()) : nothing}`;
    if (this.step === "legacy-review" && this.meterConfiguration) return existingConfigurationStep(this.meterConfiguration, {
      configurationFilename: this.selectedConfiguration() ?? "Unavailable",
      projectName: this.selectedProjectName() ?? this.meterConfiguration.topology.project_name,
      projectVersion: this.selectedProjectVersion() ?? "Unavailable",
      boardCount: this.meterConfiguration.topology.board_count,
      ctCount: this.meterConfiguration.topology.ct_count,
    },
      () => this.chooseExistingConfiguration("manage_with_helper"),
      () => this.chooseExistingConfiguration("calibrate_only"),
      () => this.back());
    if (this.step === "meter" && this.meterSettingsDraft && this.meterConfiguration) return meterSettingsStep(
      this.meterSettingsDraft, this.meterConfiguration.voltage_transformer_catalog, this.multiReferencePreparationAcknowledged,
      (draft) => this.updateMeterSettings(draft),
      (value) => this.setMeterProfile(value), (value) => this.setMeterFrequency(value),
      (referenceId, value) => this.setMeterNominalVoltage(referenceId, value),
      (value) => { this.multiReferencePreparationAcknowledged = value; if (this.meterConfiguration) this.updateCircuitConfiguration({ ...this.meterConfiguration.configuration,
        multi_reference_preparation_acknowledged: value }, false); this.requestUpdate(); },
      () => this.back(), () => void this.continueFromMeterSettings(),
      this.packageOptions, (options) => this.setPackageOptions(options),
      this.meterProfileConfirmed,
      (value) => { this.meterProfileConfirmed = value; this.requestUpdate(); },
      this.configurationMode ?? "helper_managed", this.packageCapabilities,
    );
    if (this.step === "ct" && this.inventory) return ctInventoryStep({ inventory: this.inventory,
      impact: this.totalGraphState === "ready" ? this.meterConfiguration?.configuration_impact ?? null : null,
      board: this.board,
      drafts: this.drafts,
      actionLabel: this.labelOnly && changesFromDrafts(this.inventory, this.drafts).length ? "Save Home Assistant names" : !this.labelOnly && this.hasCanonicalChanges() ? "Review configuration changes" : "Continue to calibration",
      busyLabel: this.labelOnly ? "Saving Home Assistant names…" : this.hasCanonicalChanges() ? "Preparing configuration review…" : "Continuing to calibration…",
      blockedReason: this.totalGraphState !== "ready" ? "Wait for valid totals before continuing." : !this.legacyCircuitSemanticsConfirmed && this.configurationMode === "legacy_editable" ? "Confirm used/unused channels and circuit roles above." : "",
      labelOnly: this.labelOnly,
      busy: this.pendingAction === "session",
      configuration: this.labelOnly ? null : this.meterConfiguration?.configuration ?? null,
      managedTotals: this.configurationMode !== "runtime_only" && this.meterConfiguration?.capabilities.configuration_authoritative === true
        && totalsEditable(this.meterConfiguration, "managed_advanced_totals"),
      managedTotalsReason: this.meterConfiguration?.capabilities.reason_codes.join(", ") ?? "",
      allowPreserveExistingGain: this.configurationMode === "legacy_editable",
      continueAllowed: this.labelOnly || (!this.meterConfiguration || this.totalGraphState === "ready") && (this.configurationMode !== "legacy_editable" || this.existingConfigurationChoice !== "manage_with_helper" || this.labelOnly || this.legacyCircuitSemanticsConfirmed),
      totals: this.meterConfiguration?.totals ?? null,
      nativeTotalsReadable: this.meterConfiguration?.capabilities.native_totals_readable === true,
      nativeTotalsWritable: Boolean(this.meterConfiguration && totalsEditable(this.meterConfiguration, "native_totals_writable")),
      nativePreview: this.totalGraphState === "ready" ? this.totalGraphPreview : null,
      freshTotals: this.totalGraphState === "ready",
      nativeGraphState: this.totalGraphState,
      automaticTotalsWritable: this.configurationMode !== "runtime_only" && this.meterConfiguration?.capabilities.configuration_authoritative === true
        && totalsEditable(this.meterConfiguration, "managed_automatic_totals"),
      meterInventory: this.meterConfiguration,
      automaticSourcesFresh: this.automaticSourcesFresh(),
      existingConfiguration: this.journeyOrigin === "existing_meter" && this.sourceMeterConfiguration?.deviceId === this.selectedDeviceId
        && this.sourceMeterConfiguration?.meter.source_sha256 === this.meterConfiguration?.source_sha256
        ? this.sourceMeterConfiguration?.meter.configuration ?? null : null,
      reviewRequirements: this.configurationMode === "legacy_editable" && this.existingConfigurationChoice === "manage_with_helper" && !this.labelOnly ? html`
        ${!this.legacyCircuitSemanticsConfirmed ? html`<p class="info-band" role="status">Review and confirm used/unused channels and circuit roles to enable Continue.</p>` : nothing}
        <label class="check-row legacy-semantics"><input type="checkbox" aria-label="I reviewed used/unused channels and circuit roles" .checked=${this.legacyCircuitSemanticsConfirmed} @change=${(event: Event) => { this.legacyCircuitSemanticsConfirmed = (event.target as HTMLInputElement).checked; if (this.legacyCircuitSemanticsConfirmed && this.meterConfiguration) this.updateCircuitConfiguration(this.meterConfiguration.configuration); else this.requestUpdate(); }} />I reviewed used/unused channels and circuit roles.</label>
        ${this.meterConfiguration?.warnings.includes("legacy_generic_totals_unmanaged") ? html`<p class="warning-band" role="status">Existing generic totals are unmanaged and stay unchanged unless reviewed migration replaces them.</p>` : nothing}` : nothing }, { setBoard: (board) => { this.board = board; this.requestUpdate(); },
      update: (channel, patch) => this.updateDraft(channel, patch),
      back: () => this.back(),
      review: () => void this.continueFromCt(),
      updateConfiguration: (configuration) => this.updateCircuitConfiguration(configuration),
      disableChannel: (channel) => this.disableCircuit(channel),
      setLabelOnly: value => { this.labelOnly = value; this.requestUpdate(); },
      ...(this.hasCanonicalChanges() ? { skip: () => { this.skipCircuitChanges = true; this.navigate("calibration-plan"); } } : {}) });
    if (this.step === "save-calibration" && !this.transaction && this.offsetRecoveryPending()) return offsetPersistence({
      offsetFinalization: this.offsetFinalization, restartResult: this.restartResult,
      hasPendingGains: this.session?.has_pending_gain_calibration === true,
      busy: this.navigationBusy(), restartBusy: this.restartBusy,
    }, { backToOffsets: () => this.navigate("offset"), restart: () => void this.restart(),
      review: () => void this.reviewOffsetFinalization(), reconcile: () => void this.reconcileOffsetFinalization() });
    if (this.step === "save-calibration" && !this.transaction && this.restartResult?.source_handoff_available) return calibrationPersistence({ busy: this.navigationBusy(), installed: this.restartResult.source_handoff_firmware_installed }, {
      keep: () => this.keepCalibrationInFlash(), save: () => void (this.restartResult?.source_handoff_firmware_installed ? this.clearCalibrationHandoff() : this.reviewCalibrationHandoff()),
    });
    if (this.step === "install-configuration" || this.step === "save-calibration") return buildInstallStep({ purpose: this.transaction?.purpose ?? (this.step === "save-calibration" ? "save_calibration" : "install_configuration"),
      status: this.transaction,
      configuration: this.meterConfiguration?.configuration ?? null,
      impact: this.totalGraphState === "ready" ? this.meterConfiguration?.configuration_impact ?? null : null,
      reviewBackBusy: this.pendingAction === "review-back",
      correctionPending: this.reviewCorrection !== null,
      pendingAction: this.pendingAction,
      legacyMigration: this.configurationMode === "legacy_editable" && this.existingConfigurationChoice === "manage_with_helper",
      meterInventory: this.meterConfiguration,
      totalPreview: this.totalGraphState === "ready" ? this.totalGraphPreview : null }, { apply: () => void this.transactionAction("apply"),
      compile: () => void this.transactionAction("compile"),
      install: () => void (this.calibrationHandoff && this.transaction?.state === "verified" && this.restartResult?.source_handoff_firmware_installed
        ? this.clearCalibrationHandoff() : this.transactionAction("install")),
      rollback: () => void this.transactionAction("rollback"),
      back: () => this.back(),
      continueFlow: () => this.navigate(this.step === "save-calibration" ? "summary" : "calibration-plan") });
    if (this.step === "safety") return safetyStep(this.session, this.safetyAcknowledged,
      (value) => { this.safetyAcknowledged = value; this.requestUpdate(); }, () => void this.acknowledgeSafety(), () => void this.cancelSession(), () => this.back(), this.pendingAction === "safety");
    if (this.step === "calibration-plan") return calibrationPlanStep(this.calibrationPlan,
      plan => { this.calibrationPlan = plan; this.requestUpdate(); }, () => this.back(),
      this.workflowContext().configurationMode === "runtime_only", this.navigationBusy(), () => void this.continueCalibrationPlan());
    if (this.step === "offset") return offsetStep({topology: this.topology,
      session: this.session,
      board: this.board,
      stage: this.offsetStage,
      acknowledged: this.offsetAcknowledged[this.offsetStage - 1] ?? false,
      retryConfirmed: this.offsetRetryConfirmed,
      readiness: this.offsetReadinessByTarget.get(this.offsetKey()) ?? null,
      result: this.offsetResultByTarget.get(this.offsetKey()) ?? null,
      busy: this.offsetBusy,
      stock: this.stockOffsetMode() ? { preparation: this.offsetPreparation, backupAcknowledged: this.offsetBackupAcknowledged,
        setBackup: (value) => { this.offsetBackupAcknowledged = value; this.requestUpdate(); },
        prepare: () => void this.reviewOffsetPreparation() } : null}, {selectBoard: (value) => { this.board = value; this.offsetRetryConfirmed = false; this.requestUpdate(); },
      selectStage: (value) => { if (value === 1 || this.session?.offset_boards?.every((item) => item.stages[0]?.state === "completed")) {
        this.offsetStage = value; this.board = 0; this.offsetRetryConfirmed = false; this.requestUpdate();
      } },
      setAcknowledged: (value) => { this.offsetAcknowledged = this.offsetAcknowledged.map((current, index) => index === this.offsetStage - 1 ? value : current); this.requestUpdate(); },
      setRetryConfirmed: (value) => { this.offsetRetryConfirmed = value; this.requestUpdate(); },
      check: () => void this.checkOffsetReadiness(),
      calibrate: () => void this.calibrateOffset(),
      reconnect: () => void this.reconnectSession(),
      skip: () => void this.skipOffset(),
      back: () => this.back(),
      continueOffset: () => this.continueOffset()});
    if (this.step === "voltage") return html`${(this.calibrationMeterSettings ?? this.meterSettingsDraft)?.warnings.includes("slow_interval_extends_calibration") ? html`<div class="warning-band" role="status">This meter uses a ${(this.calibrationMeterSettings ?? this.meterSettingsDraft)!.update_interval_s}-second update interval. Calibration takes longer; keep the reference stable until each check finishes.</div>` : nothing}${voltageStep(this.topology, this.session, this.board, this.voltageReferenceIds().map((id, index) => this.voltageReferences instanceof Map ? this.voltageReferences.get(id) ?? 0 : this.voltageReferences[index] ?? 0), this.voltageReferenceIds().map((id) => this.voltageReferenceLabel(id)), this.stabilityFor("voltage"), this.voltageResultsForBoard(), this.navigationBusy(),
      (value) => { this.board = value; this.requestUpdate(); },
      (index, value) => { const id = this.voltageReferenceIds()[index]; if (id) this.voltageReferences = new Map(this.voltageReferences).set(id, value); this.requestUpdate(); }, () => void this.checkStability("voltage"), () => void this.calibrate("voltage"), () => void this.reconnectSession(), () => void this.cancelSession(), this.selectedVoltageReferences().length > 0)}
      ${this.calibrationContinuation("voltage")}
      <footer class="action-footer offset-footer"><button class="secondary" ?disabled=${this.navigationBusy()} @click=${() => this.back()}>Back</button>
        <button class="primary" ?disabled=${this.calibrationContinuationBlocked("voltage")} @click=${() => { this.voltageSkipped = !this.hasCompletedCalibration("voltage"); this.navigate("current"); }}>${this.calibrationContinueLabel("voltage")}</button></footer>`;
    if (this.step === "current") return html`${currentStep(this.topology, this.inventory, this.session, this.channel, this.currentReferences, this.reportingMultiplier, this.stabilityFor("current"), this.resultFor("current"),
      this.calibratedInstances("current"),
      (value) => { this.channel = value; this.requestUpdate(); },
      (channel, value) => { const references = new Map(this.currentReferences); if (value === null || !Number.isFinite(value) || value <= 0) references.delete(channel); else references.set(channel, value); this.currentReferences = references; this.requestUpdate(); },
      (value) => { this.reportingMultiplier = value; this.requestUpdate(); },
      () => void this.checkStability("current"), () => void this.calibrate("current"), () => void this.reconnectSession(), () => void this.cancelSession(), this.navigationBusy())}
      ${this.calibrationContinuation("current")}
      <footer class="action-footer offset-footer"><button class="secondary" ?disabled=${this.navigationBusy()} @click=${() => this.back()}>Back</button>
        <button class="primary" ?disabled=${this.calibrationContinuationBlocked("current")} @click=${() => { this.currentSkipped = !this.hasCompletedCalibration("current"); void this.finishCurrent(); }}>${this.finishBusy ? "Finishing…" : this.calibrationContinueLabel("current")}</button></footer>`;
    if (this.step === "restart") return restartStep(this.session?.state ?? this.error, this.restartResult,
      Boolean(this.transaction?.rollback_available), this.restartBusy, () => void this.restart(), () => void this.transactionAction("rollback"), () => this.back());
    if (this.step === "summary") return summaryStep({ topology: this.topology,
      session: this.session,
      transaction: this.transaction,
      stability: this.stabilityByTarget,
      calibration: this.calibrationByTarget,
      restart: this.restartResult,
      completedWithoutChanges: this.completedWithoutChanges,
      projectVersion: this.selectedProjectVersion(),
      meterConfiguration: this.verifiedMeterConfiguration,
      impact: this.verifiedMeterConfiguration?.configuration_impact ?? null,
      configurationMode: this.workflowContext().configurationMode,
      legacyChoice: this.existingConfigurationChoice,
      configurationInstalled: this.configurationInstalled,
      handoffDeclined: this.handoffDeclined,
      sourceConfiguration: this.configurationMode === "legacy_editable" && this.sourceMeterConfiguration?.deviceId === this.selectedDeviceId
        && this.sourceMeterConfiguration?.meter.source_sha256 === this.meterConfiguration?.source_sha256
        ? this.sourceMeterConfiguration?.meter ?? null : null,
      offsetFinalization: this.offsetFinalization,
      newCycleAcknowledged: this.offsetBackupAcknowledged,
      busy: Boolean(this.pendingAction) }, { saveCalibration: () => void (this.restartResult?.source_handoff_firmware_installed
        ? this.clearCalibrationHandoff() : this.reviewCalibrationHandoff()),
      back: () => this.back(),
      finish: () => this.finishFlow("Meter configuration and calibration are complete."),
      keepCalibrationInFlash: () => this.keepCalibrationInFlash(),
      setNewCycleAcknowledged: (value) => { this.offsetBackupAcknowledged = value; this.requestUpdate(); },
      newCycle: () => void this.beginOffsetCycle() });
    return html`<section class="step-content"><div class="info-band" role="status"><strong>${this.step === "ct"
      ? "Circuits & CTs are not loaded" : "Live step data is not loaded"}</strong><p>Go back and reload the live device data.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button></footer></section>`;
  }

  private firmwareCatalog(): TemplateResult {
    const loading = this.firmwareCatalogState === "loading";
    return html`<section class="step-content" aria-labelledby="firmware-heading">
      <h2 id="firmware-heading">Install firmware</h2>
      <ol class="firmware-steps">
        <li>Connect the ESP32 to your computer with a USB cable.</li>
        <li>Click <strong>Install firmware</strong>, select the ESP32's <strong>CP2102 USB to UART</strong>, then click <strong>Connect</strong>.</li>
        <li>Select <strong>Install CircuitSetup 6 Channel Energy Meter</strong> in ESP Web Tools.</li>
        <li>Before clicking <strong>Install</strong>, hold the ESP32's right <strong>IO0</strong> (or <strong>BOOT</strong>) button.</li>
      </ol>
      <label>ESPHome firmware version
        <select data-action="firmware-version" ?disabled=${loading || this.firmwareCatalogState !== "ready" || !this.resolvedFirmwareOptions.length}
          @change=${(event: Event) => this.selectFirmwareVersion((event.target as HTMLSelectElement).value)}>
          ${this.resolvedFirmwareOptions.map((option, index) => html`<option value=${option.version} ?selected=${option.version === this.selectedEspHomeVersion}>${option.version}${index === 0 ? " (newest)" : ""}</option>`)}
        </select>
      </label>
      ${this.firmwareCatalogState === "error" ? html`<div class="error-panel" role="status">
        <strong>${this.firmwareCatalogError}</strong>
        <button class="secondary" data-action="firmware-retry" @click=${() => this.retryFirmwareIndex()}>Retry</button>
      </div>` : nothing}
      ${loading ? html`<p role="status">Loading firmware versions…</p>` : nothing}
      ${this.firmwareCatalogState === "ready" && !this.resolvedFirmwareOptions.length ? html`<p role="status">No firmware version is available for this hardware.</p>` : nothing}
      ${this.firmwareCatalogState === "ready" ? espWebInstaller(this.selectedFirmware()) : nothing}
    </section>`;
  }

  public override render(): TemplateResult {
    const context = this.workflowContext();
    const phases = workflowPhases(context, this.step);
    const activePhase = phases.find((phase) => phase.status === "current");
    const substeps = activePhase?.id === "calibration"
      ? calibrationSubsteps(context, this.step) : [];
    return html`
      <div class="app">
        ${workflowProgress(phases, this.mobileStepsOpen,
          () => { this.mobileStepsOpen = !this.mobileStepsOpen; this.requestUpdate(); },
          () => this.returnToSetup(), this.navigationBusy() || !canLeaveTransaction(this.transaction)
            || Boolean(this.restartResult?.source_handoff_firmware_installed && this.restartResult.source_authority !== "configuration"))}
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <h1 id="step-heading" tabindex="-1">${this.step === "summary"
            ? summaryOutcome({ configurationMode: this.workflowContext().configurationMode,
              legacyChoice: this.existingConfigurationChoice, completedWithoutChanges: this.completedWithoutChanges,
              configurationInstalled: this.configurationInstalled, restart: this.restartResult, verifiedConfiguration: this.verifiedMeterConfiguration !== null }).heading
            : ROUTE_LABELS[this.step]}</h1>
          ${substeps.length ? html`<nav class="calibration-subprogress" aria-label="Calibration progress"><ol>
            ${substeps.map((substep, index) => html`<li class=${substep.status}
              aria-current=${substep.status === "current" ? "step" : nothing}>
              <span>${index + 1}</span> ${CALIBRATION_LABELS[substep.id]}
            </li>`)}
          </ol></nav>` : nothing}
          ${this.error ? html`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : nothing}
          ${this.totalsIntentNeedsResolution() || this.hasUnsupportedCalibrationChanges() && (this.session?.has_pending_calibration || this.restartResult)
            && ["restart", "save-calibration", "summary"].includes(this.step) ? html`<button class="secondary"
              ?disabled=${Boolean(this.pendingAction)} @click=${() => this.discardUnsupportedCalibrationChanges()}>Discard local configuration choices and continue calibration</button>` : nothing}
          ${this.transaction?.state === "verified"
            && (this.configurationInstalled && this.transaction.full_meter_configuration_verified
              || this.transaction.redacted_diff === "" && this.transaction.progress.includes("metadata_persisted"))
            && !this.verifiedMeterConfiguration && this.configurationMode !== "runtime_only" ? html`<button class="secondary"
              ?disabled=${this.totalGraphState === "pending"} @click=${() => void this.refreshInstalledConfiguration()}>Retry totals inventory refresh</button>` : nothing}
          ${this.topology && this.step !== "setup" ? html`<p class="info-band selected-meter" role="status"><strong>${this.setup?.devices.find(device => device.entry_id === this.selectedDeviceId)?.title ?? "Selected meter"}</strong> · ${this.topology.ct_count} CTs · Hardware checked</p>` : nothing}
          ${this.stepBody()}
          ${!["setup", "legacy-review", "meter", "voltage", "current", "summary"].includes(this.step) ? technicalDetails(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges) : nothing}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "circuitsetup-energy-meter-helper-panel": CircuitSetupPanel;
  }
}
