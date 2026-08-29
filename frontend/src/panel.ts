import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from "lit";

import { HelperApi, type HomeAssistant } from "./api";
import { buildInstallStep } from "./components/build-install-step";
import { changesFromDrafts, circuitConfigurationIsValid, ctInventoryStep, reconcileSplitPhaseAggregates, type CtDraft } from "./components/ct-inventory-step";
import { currentStep } from "./components/current-step";
import { meterSettingsStep } from "./components/meter-settings-step";
import { espWebInstaller } from "./components/esp-web-installer";
import { offsetStep } from "./components/offset-step";
import { newInstallPackageOptions, resizePackageOptions } from "./components/package-options";
import { restartStep } from "./components/restart-step";
import { safetyStep } from "./components/safety-step";
import { setupDeviceStep } from "./components/setup-device-step";
import { summaryStep } from "./components/summary-step";
import { technicalDetails } from "./components/technical-details";
import { topologyMismatch, topologyStep } from "./components/topology-step";
import { voltageStep } from "./components/voltage-step";
import { chooseFirmwareVersion, fetchFirmwareIndex, resolveFirmwareOptions, type FirmwareIndex, type FirmwareOption } from "./firmware-installer";
import { configurationImpact } from "./configuration-impact";
import { panelStyles } from "./styles";
import type {
  CalibrationResult,
  BoardPackageOptions,
  CircuitAggregate,
  ConnectionType,
  ElectricalSystem,
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
  PanelStep,
  RestartVerificationResult,
  SessionStatus,
  SetupSnapshot,
  StabilityResult,
  TransactionStatus,
  TopologyResult,
} from "./types";

const STEPS: Array<[PanelStep, string]> = [
  ["setup", "Setup Device"],
  ["meter", "Meter Settings"],
  ["ct", "Circuits & CTs"],
  ["safety", "Safety"],
  ["offset", "Offset"],
  ["voltage", "Voltage"],
  ["current", "Current"],
  ["restart", "Restart"],
  ["build", "Flash & Verify"],
  ["summary", "Summary"],
];
const CIRCUITSETUP_PROJECT_PREFIX = "circuitsetup.6c-energy-meter";
const REBIND_TIMEOUT_MS = 10_000;
const REBIND_RETRY_MS = 250;
const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
const meterSettings = ({ authoritative: _authoritative, warnings: _warnings, ...meter }: MeterSettingsDraft): MeterSettings => meter;
const profileNominalVoltage = (system: ElectricalSystem): number | null => system === "split_phase_120_240" ? 120
  : system === "single_phase_230" ? 230 : null;
// UI capacity warning only; it does not configure the meter or firmware.
const ENTITY_COUNT_WARNING_THRESHOLD = 100;

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
  private step: PanelStep = "setup";
  private selectedDeviceId: string | null = null;
  private topology: MeterTopology | null = null;
  private inventory: CtInventory | null = null;
  private transaction: TransactionStatus | null = null;
  private session: SessionStatus | null = null;
  private stabilityByTarget = new Map<string, StabilityResult>();
  private calibrationByTarget = new Map<string, CalibrationResult>();
  private restartResult: RestartVerificationResult | null = null;
  private completedWithoutChanges = false;
  private offsetReadinessByTarget = new Map<string, OffsetReadinessResult>();
  private offsetResultByTarget = new Map<string, OffsetCalibrationResult>();
  private calibrationHandoff = false;
  private addonCount = 0;
  private packageOptions = newInstallPackageOptions(0);
  private sourcePackageOptions: BoardPackageOptions | null = newInstallPackageOptions(0);
  private packageOptionsTouched = false;
  private connection: Exclude<ConnectionType, "unknown"> = "wifi";
  private electricalSystem: ElectricalSystem = "split_phase_120_240";
  private lineFrequencyHz: LineFrequencyHz | null = 60;
  private electricalProfileConfirmed = false;
  private meterSettingsDraft: MeterSettingsDraft | null = null;
  private meterConfiguration: MeterConfiguration | null = null;
  private verifiedMeterConfiguration: MeterConfiguration | null = null;
  private multiReferencePreparationAcknowledged = false;
  private meterFrequencyTouched = false;
  private meterNominalVoltageTouched = new Set<string>();
  private canonicalConfigurationChanged = false;
  private managedAutomaticAggregates: CircuitAggregate[] = [];
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
    this.newInstallDeviceId = null;
    this.pendingAction = "";
    super.disconnectedCallback();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if ((changed.has("hass") || changed.has("panel")) && this.isConnected) void this.ensureApi(this.connectionGeneration);
    if (this.error) this.shadowRoot?.querySelector<HTMLElement>("[role=alert]")?.focus();
    else if (this.focusHeading) {
      this.focusHeading = false;
      this.shadowRoot?.querySelector<HTMLElement>("#step-heading")?.focus();
    }
  }

  private async ensureApi(generation: number): Promise<void> {
    if (this.api || !this.isConnected || !this.hass || !this.panel?.config.entry_id) return;
    const api = new HelperApi(this.hass, this.panel.config.entry_id);
    this.api = api;
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
        if (intent.electrical_system !== undefined && intent.line_frequency_hz !== undefined) {
          this.electricalSystem = intent.electrical_system;
          this.lineFrequencyHz = intent.line_frequency_hz;
          this.electricalProfileConfirmed = true;
        } else {
          this.electricalSystem = "split_phase_120_240";
          this.lineFrequencyHz = 60;
          this.electricalProfileConfirmed = false;
        }
        this.refreshFirmwareOptions();
      }
      if (this.setup.devices.length && !this.selectedDeviceId) this.selectDevice(this.firstDeviceId(this.setup.devices));
      await this.subscribeSetup(generation, api);
      if (this.transaction) await this.subscribeTransaction(generation);
      if (this.session && this.session.state !== "cancelled") await this.subscribeSession(generation);
    } catch (error) {
      if (this.owns(generation, api)) this.fail(error, "Setup status could not be loaded.");
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
    if (this.step !== "setup" || this.topology || !eligible.length) return this.requestUpdate();
    if (allowAutomaticImport && eligible.length === 1 && !this.pendingAction) {
      const deviceId = eligible[0]!.entry_id;
      this.newInstallDeviceId = deviceId;
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
    this.safetyAcknowledged = false;
    this.stabilityByTarget = new Map();
    this.calibrationByTarget = new Map();
    this.restartResult = null;
    this.completedWithoutChanges = false;
    this.offsetReadinessByTarget = new Map();
    this.offsetResultByTarget = new Map();
    this.calibrationHandoff = false;
    this.group = 0;
    this.channel = 1;
    this.voltageReferences = new Map();
    this.currentReferences = new Map();
    this.reportingMultiplier = null;
    this.offsetStage = 1;
    this.offsetAcknowledged = [false, false];
    this.offsetRetryConfirmed = false;
    this.finishBusy = false;
    this.restartBusy = false;
    this.voltageSkipped = false;
    this.currentSkipped = false;
  }

  private selectDevice(deviceId: string | null): void {
    ++this.operationGeneration;
    this.clearSubscription("transaction");
    this.clearSubscription("session");
    this.selectedDeviceId = deviceId;
    if (deviceId !== this.newInstallDeviceId) this.newInstallDeviceId = null;
    this.topology = null;
    this.inventory = null;
    this.transaction = null;
    this.reviewCorrection = null;
    this.session = null;
    this.drafts = new Map();
    this.meterSettingsDraft = null;
    this.meterConfiguration = null;
    this.verifiedMeterConfiguration = null;
    this.packageOptionsTouched = false;
    this.multiReferencePreparationAcknowledged = false;
    this.meterFrequencyTouched = false;
    this.meterNominalVoltageTouched = new Set();
    this.canonicalConfigurationChanged = false;
    this.managedAutomaticAggregates = [];
    this.board = 0;
    this.resetCalibrationRun();
  }

  private firstDeviceId(devices: SetupSnapshot["devices"]): string | null {
    return devices.map((device) => device.entry_id).sort((first, second) => first.localeCompare(second))[0] ?? null;
  }

  public showTopology(topology: MeterTopology): void {
    this.topology = topology;
    this.error = topologyMismatch(topology)
      || topology.project_name !== this.selectedProjectName()
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
      this.showTopology(result.topology);
    } else {
      this.sourcePackageOptions = null;
      this.showTopology(result as MeterTopology);
    }
  }

  private setAddonCount(value: number): void {
    this.addonCount = value;
    this.packageOptions = resizePackageOptions(this.packageOptions, value);
    this.sourcePackageOptions = newInstallPackageOptions(value);
    this.refreshFirmwareOptions();
  }

  private setElectricalSystem(value: ElectricalSystem): void {
    this.electricalSystem = value;
    const suggested = value === "split_phase_120_240" ? 60 : value === "single_phase_230" ? 50 : null;
    this.lineFrequencyHz = suggested;
    this.electricalProfileConfirmed = false;
    this.requestUpdate();
  }

  private setLineFrequency(value: LineFrequencyHz): void {
    this.lineFrequencyHz = value;
    this.electricalProfileConfirmed = false;
    this.requestUpdate();
  }

  private confirmElectricalProfile(): void {
    if (this.lineFrequencyHz === null) return;
    this.electricalProfileConfirmed = true;
    this.announcement = `Electrical profile confirmed: ${this.electricalSystem.replaceAll("_", " ")}, ${this.lineFrequencyHz} Hz.`;
    this.requestUpdate();
  }

  public showInventory(inventory: CtInventory): void {
    const configured = new Map(this.meterConfiguration?.configuration.channels.map((channel) => [channel.channel, channel]) ?? []);
    this.inventory = { ...inventory, channels: inventory.channels.map((channel) => {
      const settings = configured.get(channel.channel);
      return settings ? { ...channel, name: settings.name, selected_model_id: settings.model_id,
        reporting_multiplier: settings.reporting_multiplier, display_label: settings.custom_label,
        selection_verified_against_config: true, stored_selection_present: true } : channel;
    }) };
    this.drafts = new Map(this.inventory.channels.map((channel) => {
      const settings = configured.get(channel.channel);
      const modelId = channel.selected_model_id ?? "";
      const preset = inventory.catalog.presets.find((item) => item.model_id === modelId);
      return [channel.channel, {
        name: channel.name,
        modelId,
        multiplier: channel.reporting_multiplier,
        customGainCt: modelId === "custom"
          ? settings?.custom_gain_ct ?? channel.raw_gain_ct * channel.reporting_multiplier : undefined,
        customLabel: channel.display_label ?? undefined,
        burdenAcknowledged: settings?.burden_output_acknowledged
          ?? (channel.selection_verified_against_config
            && (modelId === "custom" || preset?.requires_burden_jumper_cut === true)),
        expanded: channel.selected_model_id === null && channel.raw_gain_ct === 27518,
      }];
    }));
    this.navigate("ct");
    this.error = "";
    this.requestUpdate();
  }

  private acceptInstalledDrafts(): void {
    if (!this.inventory) return;
    this.inventory = { ...this.inventory, channels: this.inventory.channels.map((channel) => {
      const draft = this.drafts.get(channel.channel);
      if (!draft) return channel;
      const preset = this.inventory!.catalog.presets.find((item) => item.model_id === draft.modelId);
      const gain = preset?.default_gain_ct ?? draft.customGainCt;
      return { ...channel, name: draft.name.trim(), selected_model_id: draft.modelId,
        reporting_multiplier: draft.multiplier,
        raw_gain_ct: gain === undefined ? channel.raw_gain_ct : Math.round(gain / draft.multiplier),
        display_label: draft.modelId === "custom" ? draft.customLabel?.trim() || null : null,
        selection_verified_against_config: true, stored_selection_present: true };
    }) };
  }

  public showState(step: PanelStep): void {
    this.navigate(step);
  }

  private navigate(step: PanelStep): void {
    this.step = step;
    this.error = "";
    this.mobileStepsOpen = false;
    this.focusHeading = true;
    this.requestUpdate();
  }

  private back(): void {
    if (this.step === "meter") this.navigate("setup");
    else if (this.step === "ct") this.navigate("meter");
    else if (this.step === "safety") void this.cancelSession("ct");
    else if (this.step === "offset") this.navigate("safety");
    else if (this.step === "voltage") this.navigate("offset");
    else if (this.step === "current") this.navigate("voltage");
    else if (this.step === "restart") this.navigate("current");
    else if (this.step === "build") void this.backFromBuild();
    else if (this.step === "summary") this.navigate(this.transaction ? "build" : this.restartResult ? "restart" : "current");
  }

  private returnToSetup(): void {
    if (this.session && this.session.state !== "cancelled") void this.cancelSession("setup");
    else {
      this.selectDevice(null);
      this.navigate("setup");
    }
  }

  private async configureDevice(deviceId: string): Promise<void> {
    if (this.pendingAction) return;
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

  public showRecovery(state: "calibration_outcome_indeterminate" | "restart_failed"): void {
    if (state === "calibration_outcome_indeterminate") {
      this.navigate("current");
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
      this.navigate("restart");
      if (this.session) this.session = { ...this.session, state };
      else this.error = "Restart verification failed; review rollback and recovery evidence.";
    }
    this.requestUpdate();
  }

  private async rescan(): Promise<void> {
    if (!this.api || this.pendingAction) return;
    this.pendingAction = "rescan";
    this.requestUpdate();
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const setupDeviceIds = new Set(this.setupDeviceIds);
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      await api.setInstallerIntent(
        this.addonCount,
        this.connection,
        this.selectedFirmware(),
        this.packageOptions,
        this.electricalProfileConfirmed ? this.electricalSystem : null,
        this.electricalProfileConfirmed && this.lineFrequencyHz !== null ? this.lineFrequencyHz : null,
      );
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

  private async adopt(deviceId = this.selectedDeviceId): Promise<void> {
    if (!this.api || !deviceId || this.pendingAction) return;
    this.newInstallDeviceId = this.setup?.devices.find((device) => device.entry_id === deviceId)?.configuration
      ? null : deviceId;
    if (deviceId !== this.selectedDeviceId) this.selectDevice(deviceId);
    const api = this.api; const generation = ++this.operationGeneration;
    const connectionGeneration = this.connectionGeneration;
    this.pendingAction = `adopt:${deviceId}`;
    this.importFailedDeviceId = null;
    this.error = "";
    this.requestUpdate();
    try {
      await api.adoptDevice(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.clearSetupSubscription();
      const setup = await this.waitForBinding(api, deviceId, generation);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.setup = setup;
      this.setupDeviceIds = new Set(setup.devices.map((device) => device.entry_id));
      await this.subscribeSetup(connectionGeneration, api);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      const importedConfiguration = await api.getMeterConfiguration(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.setMeterConfiguration(importedConfiguration);
      const result = await api.getTopology(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.importFailedDeviceId = null;
      this.announcement = "Meter imported into ESPHome Builder.";
      this.showTopologyResult(result);
    } catch (error) {
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.importFailedDeviceId = deviceId;
      const message = (error as WsError).code === "device_busy"
        ? "Finish or cancel current work before importing another meter."
        : error instanceof Error && error.message === "helper rebind timed out"
          ? "Import completed, but Home Assistant is still reconnecting. Retry import or reload the helper."
          : this.safeErrorMessage(error, "Adoption is unavailable for this meter.");
      this.fail(error, message);
    } finally {
      if (this.ownsOperation(generation, api, deviceId)) {
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
    await this.run(async () => {
      const result = await api.getTopology(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.showTopologyResult(result);
    }, "Topology evidence could not be loaded.", () => this.ownsOperation(generation, api, deviceId));
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
          this.setMeterConfiguration(configuration);
        }
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.navigate("meter");
      }, "Meter settings could not be loaded.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.pendingAction = "";
      this.requestUpdate();
    }
  }

  private async backFromBuild(): Promise<void> {
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const current = this.transaction;
    if (current && current.state !== "previewed") {
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
    if (!this.calibrationHandoff && !correction) {
      this.fail(new Error(), "The edited configuration is unavailable. Return to setup and reload the meter.");
      return;
    }
    this.pendingAction = "review-back";
    this.error = "";
    this.requestUpdate();
    const generation = ++this.operationGeneration;
    let abandoned = current === null;
    try {
      if (current) {
        await api.abandonCtConfig(deviceId, current.transaction_id, current.source_sha256);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.clearSubscription("transaction");
        this.transaction = null;
        abandoned = true;
      }
      if (this.calibrationHandoff) {
        this.calibrationHandoff = false;
        this.navigate("restart");
        return;
      }
      this.reviewCorrection = correction;
      const fresh = await api.getMeterConfiguration(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
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
      this.meterConfiguration = { ...fresh, configuration: restoredConfiguration };
      this.meterSettingsDraft = { ...restoredConfiguration.meter,
        authoritative: fresh.capabilities.configuration_authoritative,
        warnings: fresh.warnings };
      this.multiReferencePreparationAcknowledged = false;
      this.canonicalConfigurationChanged = true;
      this.showInventory(this.meterConfiguration);
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
    const normalized = { ...configuration, configuration: {
      ...configuration.configuration, multi_reference_preparation_acknowledged: false,
    } };
    const importedMeter = normalized.configuration.meter;
    const profileDefault = profileNominalVoltage(this.electricalSystem);
    const defaultImport = importedMeter.voltage_layout === "standard"
      && importedMeter.electrical_system === "split_phase_120_240"
      && importedMeter.line_frequency_hz === 60
      && importedMeter.voltage_references.every((reference) => reference.nominal_voltage_v === 120);
    const seedInstallerIntent = this.newInstallDeviceId !== null && this.selectedDeviceId === this.newInstallDeviceId
      && this.electricalProfileConfirmed && this.lineFrequencyHz !== null && defaultImport;
    const seededMeter = seedInstallerIntent ? { ...importedMeter,
      electrical_system: this.electricalSystem, line_frequency_hz: this.lineFrequencyHz!,
      voltage_references: importedMeter.voltage_references.map((reference) => profileDefault !== null
        ? { ...reference, nominal_voltage_v: profileDefault } : reference),
    } : importedMeter;
    const fixedVoltage = profileNominalVoltage(seededMeter.electrical_system);
    const voltageMismatch = fixedVoltage !== null
      && seededMeter.voltage_references.some((reference) => reference.nominal_voltage_v !== fixedVoltage);
    const resolvedMeter = voltageMismatch ? { ...seededMeter, voltage_references: seededMeter.voltage_references.map((reference) =>
      ({ ...reference, nominal_voltage_v: fixedVoltage })) } : seededMeter;
    const seeded = { ...normalized, configuration: { ...normalized.configuration, meter: resolvedMeter } };
    this.verifiedMeterConfiguration = configuration.capabilities.configuration_authoritative
      ? normalized : null;
    this.sourcePackageOptions = {
      power_quality: [...normalized.configuration.power_quality],
      status_fields: [...normalized.configuration.status_fields],
    };
    this.meterConfiguration = this.packageOptionsTouched ? {
      ...seeded,
      configuration: { ...seeded.configuration, ...this.packageOptions },
    } : seeded;
    const reconciliation = this.meterConfiguration.capabilities.managed_totals
      ? reconcileSplitPhaseAggregates(this.meterConfiguration.configuration) : null;
    this.managedAutomaticAggregates = reconciliation?.managed ?? [];
    if (reconciliation) this.meterConfiguration = { ...this.meterConfiguration, configuration: reconciliation.configuration };
    if (!this.packageOptionsTouched) this.packageOptions = {
      power_quality: [...normalized.configuration.power_quality],
      status_fields: [...normalized.configuration.status_fields],
    };
    this.canonicalConfigurationChanged = this.packageOptionsTouched || resolvedMeter !== importedMeter || reconciliation?.changed === true;
    this.meterSettingsDraft = { ...resolvedMeter,
      authoritative: configuration.capabilities.configuration_authoritative, warnings: configuration.warnings };
    this.multiReferencePreparationAcknowledged = false;
    this.meterFrequencyTouched = false;
    this.meterNominalVoltageTouched = new Set();
  }

  private setMeterProfile(electricalSystem: ElectricalSystem): void {
    if (!this.meterSettingsDraft) return;
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
    this.meterFrequencyTouched = true;
    this.meterSettingsDraft = { ...this.meterSettingsDraft, line_frequency_hz: lineFrequencyHz };
    this.updateMeterSettings(this.meterSettingsDraft);
    this.requestUpdate();
  }

  private setMeterNominalVoltage(referenceId: string, nominalVoltage: number): void {
    if (!this.meterSettingsDraft) return;
    this.meterNominalVoltageTouched = new Set(this.meterNominalVoltageTouched).add(referenceId);
    this.meterSettingsDraft = { ...this.meterSettingsDraft, voltage_references: this.meterSettingsDraft.voltage_references.map((reference) =>
      reference.reference_id === referenceId ? { ...reference, nominal_voltage_v: nominalVoltage } : reference) };
    this.updateMeterSettings(this.meterSettingsDraft);
    this.requestUpdate();
  }

  private async continueFromMeterSettings(): Promise<void> {
    if (!this.api || !this.selectedDeviceId || !this.meterSettingsDraft || this.pendingAction) return;
    this.pendingAction = "inventory";
    this.requestUpdate();
    const api = this.api; const deviceId = this.selectedDeviceId; const generation = ++this.operationGeneration;
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
    if (this.meterConfiguration && !this.labelOnly) {
      const draft = { ...current, ...patch };
      this.updateCircuitConfiguration({ ...this.meterConfiguration.configuration,
        channels: this.meterConfiguration.configuration.channels.map((item) => item.channel === channel ? {
          ...item, name: draft.name, model_id: draft.modelId,
          reporting_multiplier: draft.multiplier,
          custom_gain_ct: draft.modelId === "custom" ? draft.customGainCt ?? null : null,
          custom_label: draft.modelId === "custom" ? draft.customLabel?.trim() || null : null,
          burden_output_acknowledged: draft.burdenAcknowledged,
        } : item) });
    }
    this.requestUpdate();
  }

  private updateCircuitConfiguration(configuration: MeterConfigurationRequest, changed = true): void {
    if (!this.meterConfiguration) return;
    const reconciliation = this.meterConfiguration.capabilities.managed_totals
      ? reconcileSplitPhaseAggregates(configuration, this.managedAutomaticAggregates) : null;
    this.managedAutomaticAggregates = reconciliation?.managed ?? [];
    this.meterConfiguration = { ...this.meterConfiguration, configuration: reconciliation?.configuration ?? configuration };
    this.canonicalConfigurationChanged ||= changed;
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
    const affected = this.meterConfiguration.configuration.aggregates.filter((aggregate) => aggregate.channels.includes(channel));
    const invalid = affected.filter((aggregate) => {
      const remaining = aggregate.channels.filter((item) => item !== channel).length;
      return !remaining || aggregate.measurement_method === "two_ct_sum" && remaining !== 2
        || (aggregate.measurement_method === "one_ct_double_power" || aggregate.measurement_method === "both_conductors_one_ct") && remaining !== 1;
    });
    const removed = invalid.map((aggregate) => aggregate.name);
    if (affected.length && !window.confirm(`Marking CT${channel} unused removes it from ${affected.map((aggregate) => aggregate.name).join(", ")}${removed.length ? ` and deletes invalid aggregate ${removed.join(", ")}` : ""}. Continue?`)) {
      this.requestUpdate();
      return;
    }
    const removedIds = new Set(invalid.map((aggregate) => aggregate.aggregate_id));
    this.updateCircuitConfiguration({ ...this.meterConfiguration.configuration,
      channels: this.meterConfiguration.configuration.channels.map((item) => item.channel === channel
        ? { ...item, enabled: false, role: "unused" } : item),
      aggregates: this.meterConfiguration.configuration.aggregates.filter((aggregate) => !invalid.includes(aggregate)).map((aggregate) => ({ ...aggregate,
        parent_id: aggregate.parent_id !== null && removedIds.has(aggregate.parent_id) ? null : aggregate.parent_id,
        channels: aggregate.channels.filter((item) => item !== channel) })), });
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
      if (this.error || !this.hasPackageChanges()) return;
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
      this.navigate("build");
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
    if (!this.api || !this.inventory || !this.selectedDeviceId || this.pendingAction) return;
    if (this.meterConfiguration && !this.labelOnly && this.canonicalConfigurationChanged) return this.previewCanonicalConfiguration();
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
    if (this.meterConfiguration && this.canonicalConfigurationChanged) return this.previewCanonicalConfiguration();
    await this.startSession();
  }

  private async previewCanonicalConfiguration(): Promise<void> {
    if (!this.api || !this.inventory || !this.selectedDeviceId || !this.meterConfiguration) return;
    const configuration = this.meterConfiguration.configuration;
    if (!circuitConfigurationIsValid(configuration, this.inventory.channels.length)) return this.fail(new Error(), "Complete the circuit and aggregate assignments before review.");
    this.pendingAction = "session";
    const api = this.api; const deviceId = this.selectedDeviceId; const meter = this.meterConfiguration; const generation = ++this.operationGeneration;
    await this.run(async () => {
      this.transaction = await api.previewMeterConfiguration(deviceId, meter.plan_id, meter.source_sha256, configuration);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.navigate("build"); await this.subscribeTransaction(this.connectionGeneration);
    }, "Circuit configuration could not be reviewed.", () => this.ownsOperation(generation, api, deviceId));
    this.pendingAction = ""; this.requestUpdate();
  }

  private async reviewCalibrationHandoff(): Promise<void> {
    if (!this.api || !this.session || !this.restartResult?.source_handoff_available) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const verificationId = this.restartResult.verification_id; const generation = ++this.operationGeneration;
    this.clearSubscription("transaction");
    this.transaction = null;
    await this.run(async () => {
      const changes = this.inventory && !this.labelOnly
        ? changesFromDrafts(this.inventory, this.drafts)
        : [];
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
      this.navigate("build");
      await this.subscribeTransaction(this.connectionGeneration);
    }, "Calibration gains could not be prepared for YAML review.",
    () => this.ownsOperation(generation, api, deviceId));
  }

  private async clearCalibrationHandoff(): Promise<void> {
    const restart = this.restartResult;
    if (!this.api || !this.session || !this.topology || !restart?.source_handoff_firmware_installed
      || !restart.source_handoff_transaction_id) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      const result = await api.clearCalibrationFlash(
        sessionId, restart.verification_id, restart.source_handoff_transaction_id!, this.topology!,
      );
      if (!this.ownsOperation(generation, api, deviceId)
        || this.session?.session_id !== sessionId) return;
      this.restartResult = result;
      this.announcement = "Calibration saved to YAML; flash values cleared.";
      this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash.");
    }, "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values.",
    () => this.ownsOperation(generation, api, deviceId));
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
      if (action === "apply" && transaction.state === "validated" && this.sourcePackageOptions) {
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
      if (action === "install" && this.calibrationHandoff
        && transaction.state === "verified" && this.session && this.topology && this.restartResult) {
        this.restartResult = {
          ...this.restartResult,
          source_handoff_available: false,
          source_handoff_transaction_id: transaction.transaction_id,
          source_handoff_firmware_installed: true,
        };
        this.navigate("summary");
        const result = await api.clearCalibrationFlash(
          this.session.session_id,
          this.restartResult.verification_id,
          transaction.transaction_id,
          this.topology,
        );
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.restartResult = result;
        this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash.");
      } else if (action === "install" && transaction.state === "verified") {
        if (this.meterConfiguration) this.verifiedMeterConfiguration = { ...this.meterConfiguration,
          configuration: { ...this.meterConfiguration.configuration, multi_reference_preparation_acknowledged: false } };
        this.acceptInstalledDrafts();
        this.canonicalConfigurationChanged = false;
        this.announcement = "Configuration changes were installed and verified. Continue to safety and calibration.";
      }
    }, action === "install" && this.calibrationHandoff
      ? "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values."
      : "This confirmation is stale. Reload the CT inventory before making another change.",
    () => this.ownsOperation(generation, api, deviceId));
    if (this.pendingAction === action) this.pendingAction = "";
    this.requestUpdate();
  }

  private async startSession(): Promise<void> {
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
        this.calibrationHandoff = Boolean(this.transaction && active.verified_calibration
          && active.verified_calibration.source_handoff_transaction_id === this.transaction.transaction_id);
        this.restartResult = this.calibrationHandoff || this.session?.state === "verified"
          ? active.verified_calibration : null;
        if (this.transaction) {
          this.navigate("build");
          await this.subscribeTransaction(this.connectionGeneration);
          if (this.session) await this.subscribeSession(this.connectionGeneration);
          return;
        }
        if (this.session) {
          this.navigate(this.session.state === "safety_required" || this.session.state === "preflight_failed"
            ? "safety"
            : this.session.state === "applied_pending_restart_verification" ? "restart"
            : this.session.state === "verified" && this.restartResult ? "summary"
            : ["completed", "skipped"].includes(this.session.offset_disposition ?? "") ? "voltage" : "offset");
          await this.subscribeSession(this.connectionGeneration);
          return;
        }
        const session = await api.startSession(deviceId);
        if (!this.ownsOperation(generation, api, deviceId) || session.device_id !== deviceId) return;
        this.session = session;
        this.navigate("safety");
        await this.subscribeSession(this.connectionGeneration);
      }, "Calibration session could not be started.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.sessionStarting = false;
      this.pendingAction = "";
      this.requestUpdate();
    }
  }

  private finishFlow(message: string): void {
    this.selectDevice(null);
    this.navigate("setup");
    this.announcement = message;
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
      this.navigate("offset");
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(generation, api, deviceId));
    this.pendingAction = "";
    this.requestUpdate();
  }

  private offsetKey(board = this.board, stage = this.offsetStage): string {
    return `${board}:${stage}`;
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
    if (!this.api || !this.session || this.offsetBusy) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const board = this.board; const stage = this.offsetStage; const key = this.offsetKey(board, stage);
    const prior = this.offsetResultByTarget.get(key);
    const stageState = this.session.offset_boards?.[board]?.stages[stage - 1]?.state;
    const retryRequired = Boolean(prior?.retry_allowed) || stageState === "partial" || stageState === "indeterminate";
    if (this.offsetAcknowledged[stage - 1] !== true || retryRequired && !this.offsetRetryConfirmed) return;
    const generation = ++this.operationGeneration;
    this.offsetBusy = true; this.requestUpdate();
    try {
      await this.run(async () => {
        const result = await api.calibrateOffset(sessionId, board, stage, true, retryRequired);
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        this.offsetResultByTarget = new Map(this.offsetResultByTarget).set(key, result);
        const boards = (this.session.offset_boards ?? []).map((item) => item.board_index !== board ? item : ({
          ...item,
          stages: item.stages.map((entry) => entry.stage !== stage ? entry : ({
            ...entry,
            state: result.state === "applied_pending_restart_verification" ? "completed" as const : result.state,
          })),
        }));
        const states = boards.flatMap((item) => item.stages.map((entry) => entry.state));
        const disposition = states.every((state) => state === "completed") ? "completed" as const
          : states.some((state) => state === "partial" || state === "indeterminate") ? "partial" as const : "in_progress" as const;
        this.session = { ...this.session, offset_boards: boards, offset_disposition: disposition,
          has_pending_calibration: this.session.has_pending_calibration || result.expected_tables.length > 0 };
        this.offsetAcknowledged = this.offsetAcknowledged.map((value, index) => index === stage - 1 ? false : value);
        this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget);
        this.offsetReadinessByTarget.delete(key);
        this.offsetRetryConfirmed = false;
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

  private async finishCurrent(): Promise<void> {
    if (!this.session || this.finishBusy) return;
    if (this.session.has_pending_calibration) {
      this.navigate("restart");
      return;
    }
    if (this.inventory && !this.labelOnly && changesFromDrafts(this.inventory, this.drafts).length) {
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
    if (!this.api || !this.session || (target === "voltage" && this.voltageBusy)) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    const targetIds = target === "voltage" ? this.voltageReferenceIds()
      : this.currentReferenceEntries().map((item) => String(item.channel));
    if (!targetIds.length) return;
    if (target === "voltage") { this.voltageBusy = true; this.requestUpdate(); }
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
      if (target === "voltage") { this.voltageBusy = false; this.requestUpdate(); }
    }
  }

  private async calibrate(target: "voltage" | "current"): Promise<void> {
    if (!this.api || !this.session || (target === "voltage" && this.voltageBusy)) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    const targetIds = target === "voltage" ? this.voltageReferenceIds()
      : this.currentReferenceEntries().map((item) => String(item.channel));
    const currentReferences = this.currentReferenceEntries();
    if (target === "current" && !currentReferences.length) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      return;
    }
    if (target === "voltage") { this.voltageBusy = true; this.requestUpdate(); }
    try {
      await this.run(async () => {
        if (target === "voltage") {
          if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
          const updated = new Map(this.calibrationByTarget);
          const references = this.voltageReferenceIds().map((referenceId, index) => ({ referenceId, value: this.voltageReferences instanceof Map ? this.voltageReferences.get(referenceId) ?? 0 : this.voltageReferences[index] ?? 0 }))
            .filter(({ referenceId }) => !this.voltageReferenceComplete(referenceId));
          if (references.some(({ value }) => !Number.isFinite(value) || value < 1 || value > 600)
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
          this.session = { ...this.session!, has_pending_calibration: true };
          this.announcement = "Calibrated the selected voltage reference.";
          return;
        }
        const result = await api.calibrateCurrent(sessionId, currentReferences, true,
          this.inventory && !this.labelOnly
            ? changesFromDrafts(this.inventory, this.drafts).map((change) => ({
              channel: change.channel,
              reporting_multiplier: change.reporting_multiplier ?? 1,
            }))
            : []);
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        const updated = new Map(this.calibrationByTarget);
        currentReferences.forEach((item) => updated.set(`current:${item.channel}`, result));
        this.calibrationByTarget = updated;
        this.session = { ...this.session!, has_pending_calibration: true };
        this.announcement = `Calibration iteration ${result.iteration} finished with state ${result.state}.`;
      }, "Calibration did not complete. Reconnect and inspect before another attempt.",
      () => this.ownsOperation(generation, api, deviceId));
    } finally {
      if (target === "voltage") { this.voltageBusy = false; this.requestUpdate(); }
    }
  }

  private groupKey(index: number): string {
    const board = Math.floor(index / 2);
    const group = index % 2 + 1;
    return board === 0 ? `main_${group}` : `addon${board}_${group}`;
  }

  private voltageReferenceIds(): string[] {
    const groups = this.voltageGroupKeys();
    const references = this.meterSettingsDraft?.voltage_references.filter((reference) => reference.group_keys.some((key) => groups.includes(key))) ?? [];
    if (references.length) return references.map((reference) => reference.reference_id);
    return this.topology?.voltage_layout === "two_voltages" ? groups : [this.board === 0 ? "main" : `addon${this.board}`];
  }

  private voltageReferenceLabel(referenceId: string): string {
    return this.meterSettingsDraft?.voltage_references.find((reference) => reference.reference_id === referenceId)?.label ?? referenceId;
  }

  private voltageReferenceComplete(referenceId: string): boolean {
    const groups = this.meterSettingsDraft?.voltage_references.find((reference) => reference.reference_id === referenceId)?.group_keys ?? [referenceId];
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
          result = await api.restartAndVerify(sessionId, topology);
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
        this.session = { ...this.session!, state: "verified" };
      }, "Restart verification failed; review recovery evidence before rollback.",
      () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.restartBusy = false;
      this.requestUpdate();
    }
    const restartResult = this.restartResult as RestartVerificationResult | null;
    if (restartResult?.source_handoff_available) {
      await this.reviewCalibrationHandoff();
    } else if (restartResult) {
      this.navigate("summary");
    }
  }

  private async cancelSession(destination: PanelStep | null = "safety"): Promise<void> {
    if (!this.api || !this.session) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      const cancelled = await api.cancelSession(sessionId);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      this.clearSubscription("session");
      this.session = cancelled;
      this.restartResult = null;
      if (destination) this.navigate(destination);
      this.announcement = destination === "setup"
        ? "No changes were made. Select another device to configure."
        : destination === "ct"
        ? "Calibration session closed. Review CT names and types before continuing."
        : "Calibration session cancelled; cleanup completed without restart verification.";
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(generation, api, deviceId));
  }

  private async finishWithoutCalibration(): Promise<void> {
    if (this.pendingAction) return;
    this.pendingAction = "finish";
    this.requestUpdate();
    const changes = this.inventory && !this.labelOnly
      ? changesFromDrafts(this.inventory, this.drafts)
      : [];
    try {
      await this.cancelSession(null);
      if (this.error) return;
      if (changes.length || this.hasPackageChanges()) await this.reviewChanges();
      else this.finishFlow("No changes were made. Select another device to configure.");
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
      const session = await api.getSession(sessionId);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      this.session = session;
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

  private hasCompletedCalibration(target: "voltage" | "current"): boolean {
    if (target === "voltage") return this.voltageGroupKeys().every((targetId) =>
      this.calibrationByTarget.get(`voltage:${targetId}`)?.state === "applied_pending_restart_verification");
    const channels = this.meterConfiguration?.configuration.channels
      .filter((channel) => channel.enabled).map((channel) => channel.channel)
      ?? this.inventory?.channels.map((channel) => channel.channel)
      ?? [];
    return channels.length > 0 && channels.every((channel) =>
      this.calibrationByTarget.get(`current:${channel}`)?.state === "applied_pending_restart_verification");
  }

  private stabilityFor(target: "voltage" | "current"): StabilityResult | null {
    const targetIds = target === "voltage" ? this.voltageReferenceIds()
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
    fallback: string,
    isCurrent: () => boolean = () => true,
  ): Promise<void> {
    this.error = "";
    try {
      await operation();
    } catch (error) {
      if (!isCurrent()) return;
      const code = (error as WsError).code;
      const message = code === "stale_confirmation"
        ? "This confirmation expired. Reload live data and review again."
        : code === "stale_handle"
          ? "The selected device changed or is no longer available. Rescan and try again."
          : fallback;
      this.fail(error, message);
    }
    if (isCurrent()) this.requestUpdate();
  }

  private safeErrorMessage(error: unknown, fallback: string): string {
    const code = (error as WsError).code;
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
    if (this.step === "setup") return html`${setupDeviceStep(this.setup, this.addonCount, this.connection,
      (value) => this.setAddonCount(value),
      (value) => { this.connection = value; this.refreshFirmwareOptions(); },
      () => void this.rescan(), (id) => void this.configureDevice(id), (id) => void this.adopt(id), this.pendingAction, Boolean(this.topology),
      this.firmwareCatalog(), this.importFailedDeviceId, this.electricalSystem,
      this.lineFrequencyHz, this.electricalProfileConfirmed,
      (value) => this.setElectricalSystem(value), (value) => this.setLineFrequency(value),
      () => this.confirmElectricalProfile())}
      ${this.topology ? topologyStep(this.topology, this.selectedProjectVersion(),
        () => { this.selectDevice(null); this.navigate("setup"); }, () => void (this.setup?.devices.find((device) => device.entry_id === this.selectedDeviceId)?.configuration
          ? this.loadInventory() : this.startSession()), this.error === "Topology mismatch", this.pendingAction === "inventory" || this.pendingAction === "session") : nothing}`;
    if (this.step === "meter" && this.meterSettingsDraft && this.meterConfiguration) return meterSettingsStep(
      this.meterSettingsDraft, this.meterConfiguration.voltage_transformer_catalog, this.multiReferencePreparationAcknowledged,
      (draft) => this.updateMeterSettings(draft),
      (value) => this.setMeterProfile(value), (value) => this.setMeterFrequency(value),
      (referenceId, value) => this.setMeterNominalVoltage(referenceId, value),
      (value) => { this.multiReferencePreparationAcknowledged = value; if (this.meterConfiguration) this.updateCircuitConfiguration({ ...this.meterConfiguration.configuration,
        multi_reference_preparation_acknowledged: value }, false); this.requestUpdate(); },
      () => this.back(), () => void this.continueFromMeterSettings(),
      this.packageOptions, (options) => this.setPackageOptions(options),
    );
    if (this.step === "ct" && this.inventory) { const impact = this.meterConfiguration ? configurationImpact(this.meterConfiguration.configuration, this.meterConfiguration.topology) : null; const total = impact ? impact.numeric_entity_count + impact.text_entity_count : 0; return html`${impact ? html`<div class=${total >= ENTITY_COUNT_WARNING_THRESHOLD ? "warning-band" : "info-band"} role="status">${total >= ENTITY_COUNT_WARNING_THRESHOLD ? html`<strong>Warning: high entity count. </strong>` : nothing}${impact.enabled_channel_count} enabled channels; ${total} public entities (${impact.numeric_entity_count} numeric, ${impact.text_entity_count} text), ${impact.energy_entity_count} energy; approximately ${impact.approximate_publications_per_second.toFixed(1)} publications/sec.</div>` : nothing}<fieldset class="name-mode"><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => { this.labelOnly = false; this.requestUpdate(); }}>ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => { this.labelOnly = true; this.requestUpdate(); }}>Home Assistant labels only</label></fieldset>${ctInventoryStep(this.inventory, this.board, this.drafts,
      (board) => { this.board = board; this.requestUpdate(); },
      (channel, patch) => this.updateDraft(channel, patch), () => this.back(), () => void this.continueFromCt(), this.labelOnly, this.pendingAction === "session",
      this.labelOnly ? null : this.meterConfiguration?.configuration ?? null, (configuration) => this.updateCircuitConfiguration(configuration), (channel) => this.disableCircuit(channel),
      this.meterConfiguration?.capabilities.managed_totals ?? true, this.meterConfiguration?.capabilities.reason_codes.join(", ") ?? "")}`; }
    if (this.step === "build") return buildInstallStep(this.transaction,
      () => void this.transactionAction("apply"), () => void this.transactionAction("compile"),
      () => void this.transactionAction("install"), () => void this.transactionAction("rollback"), () => void this.backFromBuild(),
      () => void this.startSession(), this.meterConfiguration?.configuration ?? null,
      this.meterConfiguration ? configurationImpact(this.meterConfiguration.configuration, this.meterConfiguration.topology) : null,
      this.pendingAction === "review-back", this.reviewCorrection !== null, this.pendingAction);
    if (this.step === "safety") return safetyStep(this.session, this.safetyAcknowledged,
      (value) => { this.safetyAcknowledged = value; this.requestUpdate(); }, () => void this.acknowledgeSafety(), () => void this.cancelSession(), () => this.back(), this.pendingAction === "safety");
    if (this.step === "offset") return offsetStep(this.topology, this.session, this.board, this.offsetStage,
      this.offsetAcknowledged[this.offsetStage - 1] ?? false, this.offsetRetryConfirmed,
      this.offsetReadinessByTarget.get(this.offsetKey()) ?? null, this.offsetResultByTarget.get(this.offsetKey()) ?? null,
      this.offsetBusy,
      (value) => { this.board = value; this.offsetRetryConfirmed = false; this.requestUpdate(); },
      (value) => { if (value === 1 || this.session?.offset_boards?.every((item) => item.stages[0]?.state === "completed")) {
        this.offsetStage = value; this.board = 0; this.offsetRetryConfirmed = false; this.requestUpdate();
      } },
      (value) => { this.offsetAcknowledged = this.offsetAcknowledged.map((current, index) => index === this.offsetStage - 1 ? value : current); this.requestUpdate(); },
      (value) => { this.offsetRetryConfirmed = value; this.requestUpdate(); },
      () => void this.checkOffsetReadiness(), () => void this.calibrateOffset(), () => void this.reconnectSession(),
      () => void this.skipOffset(), () => this.back(), () => this.navigate("voltage"));
    if (this.step === "voltage") return html`${this.meterSettingsDraft?.warnings.includes("slow_interval_extends_calibration") ? html`<div class="warning-band" role="status">This meter uses a ${this.meterSettingsDraft.update_interval_s}-second update interval. Calibration takes longer; keep the reference stable until each check finishes.</div>` : nothing}${voltageStep(this.topology, this.session, this.board, this.voltageReferenceIds().map((id, index) => this.voltageReferences instanceof Map ? this.voltageReferences.get(id) ?? 0 : this.voltageReferences[index] ?? 0), this.voltageReferenceIds().map((id) => this.voltageReferenceLabel(id)), this.stabilityFor("voltage"), this.voltageResultsForBoard(), this.voltageBusy,
      (value) => { this.board = value; this.requestUpdate(); },
      (index, value) => { const id = this.voltageReferenceIds()[index]; if (id) this.voltageReferences = new Map(this.voltageReferences).set(id, value); this.requestUpdate(); }, () => void this.checkStability("voltage"), () => void this.calibrate("voltage"), () => void this.reconnectSession(), () => void this.cancelSession())}
      <footer class="action-footer offset-footer"><button class="secondary" @click=${() => this.back()}>Back</button>
        <button class="secondary" ?disabled=${this.voltageBusy || this.voltageSkipped} @click=${() => { this.voltageSkipped = true; this.announcement = "Remaining voltage calibration was skipped; completed gains were preserved."; this.requestUpdate(); }}>Skip voltage calibration</button>
        <button class="primary" ?disabled=${this.voltageBusy || !this.voltageSkipped && !this.hasCompletedCalibration("voltage")} @click=${() => this.navigate("current")}>Continue</button></footer>`;
    if (this.step === "current") return html`${currentStep(this.topology, this.inventory, this.session, this.channel, this.currentReferences, this.reportingMultiplier, this.stabilityFor("current"), this.resultFor("current"),
      this.calibratedInstances("current"),
      (value) => { this.channel = value; this.requestUpdate(); },
      (channel, value) => { const references = new Map(this.currentReferences); if (value === null || !Number.isFinite(value) || value <= 0) references.delete(channel); else references.set(channel, value); this.currentReferences = references; this.requestUpdate(); },
      (value) => { this.reportingMultiplier = value; this.requestUpdate(); },
      () => void this.checkStability("current"), () => void this.calibrate("current"), () => void this.reconnectSession(), () => void this.cancelSession())}
      <footer class="action-footer offset-footer"><button class="secondary" @click=${() => this.back()}>Back</button>
        <button class="secondary" ?disabled=${this.finishBusy || this.currentSkipped} @click=${() => { this.currentSkipped = true; this.announcement = "Remaining current calibration was skipped; completed gains were preserved."; this.requestUpdate(); }}>Skip current calibration</button>
        <button class="primary" ?disabled=${this.finishBusy || !this.currentSkipped && !this.hasCompletedCalibration("current")} @click=${() => void this.finishCurrent()}>${this.finishBusy ? "Finishing…" : "Continue"}</button></footer>`;
    if (this.step === "restart") return restartStep(this.session?.state ?? this.error, this.restartResult,
      Boolean(this.transaction?.rollback_available), this.restartBusy, () => void this.restart(), () => void this.transactionAction("rollback"), () => this.back());
    if (this.step === "summary") return summaryStep(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult,
      this.completedWithoutChanges, this.selectedProjectVersion(),
      () => void (this.restartResult?.source_handoff_firmware_installed
        ? this.clearCalibrationHandoff() : this.reviewCalibrationHandoff()), () => this.back(), this.verifiedMeterConfiguration,
      this.verifiedMeterConfiguration ? configurationImpact(this.verifiedMeterConfiguration.configuration, this.verifiedMeterConfiguration.topology) : null,
      () => this.finishFlow("Meter configuration and calibration are complete."));
    return html`<section class="step-content"><div class="info-band" role="status"><strong>${this.step === "ct"
      ? "Circuits & CTs are not loaded" : "Live step data is not loaded"}</strong><p>Go back and reload the live device data.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button></footer></section>`;
  }

  private firmwareCatalog(): TemplateResult {
    const loading = this.firmwareCatalogState === "loading";
    return html`<section class="step-content" aria-labelledby="firmware-heading">
      <h2 id="firmware-heading">Install firmware</h2>
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
    const currentIndex = STEPS.findIndex(([step]) => step === this.step);
    return html`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${STEPS.map(([step, label], index) => html`
            <li class=${index === currentIndex ? "current" : ""}>
              <button class="step-button" aria-current=${index === currentIndex ? "step" : nothing}
                ?disabled=${index > currentIndex || index < currentIndex && step !== "setup"}
                @click=${() => step === "setup" && index < currentIndex ? this.returnToSetup() : undefined}><span class="number">${index + 1}</span><span>${label}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${currentIndex + 1} of ${STEPS.length} — ${STEPS[currentIndex]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => { this.mobileStepsOpen = !this.mobileStepsOpen; this.requestUpdate(); }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${STEPS[currentIndex]?.[1]}</h1>
          ${this.error ? html`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : nothing}
          ${this.stepBody()}
          ${currentIndex >= 2 && !["voltage", "current", "summary"].includes(this.step) ? technicalDetails(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges) : nothing}
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
