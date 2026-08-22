import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from "lit";

import { HelperApi, type HomeAssistant } from "./api";
import { adoptionStep } from "./components/adoption-step";
import { buildInstallStep } from "./components/build-install-step";
import { changesFromDrafts, ctInventoryStep, type CtDraft } from "./components/ct-inventory-step";
import { currentStep } from "./components/current-step";
import { restartStep } from "./components/restart-step";
import { safetyStep } from "./components/safety-step";
import { setupDeviceStep } from "./components/setup-device-step";
import { summaryStep } from "./components/summary-step";
import { technicalDetails } from "./components/technical-details";
import { topologyMismatch, topologyStep } from "./components/topology-step";
import { voltageStep } from "./components/voltage-step";
import { panelStyles } from "./styles";
import type {
  CalibrationResult,
  ConnectionType,
  CtInventory,
  MeterTopology,
  PanelStep,
  RestartVerificationResult,
  SessionStatus,
  SetupSnapshot,
  StabilityResult,
  TransactionStatus,
} from "./types";

const STEPS: Array<[PanelStep, string]> = [
  ["setup", "Setup Device"],
  ["discover", "Discover"],
  ["topology", "Topology"],
  ["ct", "CT Configuration"],
  ["build", "Build & Install"],
  ["safety", "Safety"],
  ["voltage", "Voltage"],
  ["current", "Current"],
  ["restart", "Restart"],
  ["summary", "Summary"],
];

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
  private addonCount = 0;
  private connection: Exclude<ConnectionType, "unknown"> = "wifi";
  private board = 0;
  private ctGroup = 0;
  private group = 0;
  private channel = 1;
  private reference = 0;
  private safetyAcknowledged = false;
  private drafts = new Map<number, CtDraft>();
  private error = "";
  private announcement = "";
  private unsubs: Array<() => void> = [];
  private connectionGeneration = 0;
  private operationGeneration = 0;
  private transactionSubscriptionScope = 0;
  private sessionSubscriptionScope = 0;
  private transactionUnsub: (() => void) | null = null;
  private sessionUnsub: (() => void) | null = null;
  private mobileStepsOpen = false;
  private focusHeading = false;

  public override connectedCallback(): void {
    super.connectedCallback();
    const generation = ++this.connectionGeneration;
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
    this.api = null;
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
      const intent = this.setup.installer_intent;
      if (intent) {
        this.addonCount = intent.addon_count;
        this.connection = intent.connection_type;
      }
      if (this.setup.devices.length && !this.selectedDeviceId) this.selectDevice(this.setup.devices[0]?.entry_id ?? null);
      await this.ownSubscription(api.subscribeSetup((snapshot) => {
        if (!this.owns(generation, api)) return;
        this.setup = snapshot;
        if (!this.selectedDeviceId && snapshot.devices.length) this.selectDevice(snapshot.devices[0]?.entry_id ?? null);
        this.requestUpdate();
      }), generation, api);
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

  private resetCalibrationRun(): void {
    this.safetyAcknowledged = false;
    this.stabilityByTarget = new Map();
    this.calibrationByTarget = new Map();
    this.restartResult = null;
    this.group = 0;
    this.channel = 1;
    this.reference = 0;
  }

  private selectDevice(deviceId: string | null): void {
    if (deviceId === this.selectedDeviceId) return;
    ++this.operationGeneration;
    this.clearSubscription("transaction");
    this.clearSubscription("session");
    this.selectedDeviceId = deviceId;
    this.topology = null;
    this.inventory = null;
    this.transaction = null;
    this.session = null;
    this.drafts = new Map();
    this.board = 0;
    this.ctGroup = 0;
    this.resetCalibrationRun();
  }

  public showTopology(topology: MeterTopology): void {
    this.topology = topology;
    this.navigate("topology");
    this.error = topologyMismatch(topology)
      || topology.project_name !== this.selectedProjectName()
      ? "Topology mismatch"
      : "";
    this.requestUpdate();
  }

  public showInventory(inventory: CtInventory): void {
    this.inventory = inventory;
    this.drafts = new Map(inventory.channels.map((channel) => {
      const modelId = channel.selected_model_id ?? "";
      const preset = inventory.catalog.presets.find((item) => item.model_id === modelId);
      return [channel.channel, {
        name: channel.name,
        modelId,
        multiplier: channel.reporting_multiplier,
        customGainCt: modelId === "custom" || channel.selected_model_id === null ? channel.raw_gain_ct : undefined,
        customLabel: channel.display_label ?? undefined,
        burdenAcknowledged: channel.selection_verified_against_config
          && (modelId === "custom" || preset?.requires_burden_jumper_cut === true),
        expanded: channel.selected_model_id === null && channel.raw_gain_ct === 27518,
      }];
    }));
    this.navigate("ct");
    this.error = "";
    this.requestUpdate();
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
    const index = STEPS.findIndex(([step]) => step === this.step);
    if (index > 0) this.navigate(STEPS[index - 1]![0]);
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
    if (!this.api) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      await api.setInstallerIntent(this.addonCount, this.connection);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      const setup = await api.rescan();
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.setup = setup;
      if (setup.devices.length) {
        this.selectDevice(setup.devices[0]?.entry_id ?? null);
        this.navigate("discover");
        this.announcement = "Compatible meter discovered.";
      } else {
        this.announcement = "No compatible meter found. Check the network and rescan.";
      }
    }, "Rescan failed.", () => this.ownsOperation(generation, api, deviceId));
  }

  private async adopt(): Promise<void> {
    if (!this.api || !this.selectedDeviceId) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const generation = ++this.operationGeneration;
    await this.run(async () => {
      await api.adoptDevice(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.announcement = "Meter adopted in Device Builder.";
    }, "Adoption is unavailable for this meter.", () => this.ownsOperation(generation, api, deviceId));
  }

  private async loadTopology(): Promise<void> {
    if (!this.api || !this.selectedDeviceId) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const generation = ++this.operationGeneration;
    await this.run(async () => {
      const result = await api.getTopology(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.showTopology("topology" in result ? result.topology : result);
    }, "Topology evidence could not be loaded.", () => this.ownsOperation(generation, api, deviceId));
  }

  private async loadInventory(): Promise<void> {
    if (!this.api || !this.selectedDeviceId) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const generation = ++this.operationGeneration;
    await this.run(async () => {
      const result = await api.getCtInventory(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.showInventory(result);
    }, "CT inventory could not be loaded.", () => this.ownsOperation(generation, api, deviceId));
  }

  private updateDraft(channel: number, patch: Partial<CtDraft>): void {
    const current = this.drafts.get(channel);
    if (!current) return;
    this.drafts = new Map(this.drafts).set(channel, { ...current, ...patch });
    this.requestUpdate();
  }

  private selectCtGroup(group: number): void {
    this.ctGroup = group;
    this.requestUpdate();
    void this.updateComplete.then(() => {
      this.shadowRoot
        ?.querySelector<HTMLInputElement>(`[data-ct-group="${group}"] input`)
        ?.focus();
    });
  }

  private async reviewChanges(): Promise<void> {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    const changes = changesFromDrafts(this.inventory, this.drafts);
    if (!changes.length) return this.fail(new Error(), "Select at least one CT change before review.");
    const api = this.api; const deviceId = this.selectedDeviceId; const inventory = this.inventory;
    const generation = ++this.operationGeneration;
    this.clearSubscription("transaction");
    this.transaction = null;
    await this.run(async () => {
      const transaction = await api.previewCtConfig(
        deviceId,
        inventory.plan_id,
        inventory.source_sha256,
        changes,
      );
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

  private async transactionAction(action: "apply" | "compile" | "install" | "rollback"): Promise<void> {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const current = this.transaction;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      const args = [deviceId, current.transaction_id, current.source_sha256] as const;
      const transaction = action === "apply" ? await api.applyCtConfig(...args)
        : action === "compile" ? await api.compileCtConfig(...args)
        : action === "install" ? await api.installCtConfig(...args)
        : await api.rollbackCtConfig(...args);
      if (!this.ownsOperation(generation, api, deviceId)
        || this.transaction?.transaction_id !== current.transaction_id
        || this.transaction.source_sha256 !== current.source_sha256) return;
      this.transaction = transaction;
      this.announcement = `Configuration ${this.transaction.state}.`;
    }, "This confirmation is stale. Reload the CT inventory before making another change.",
    () => this.ownsOperation(generation, api, deviceId));
  }

  private async startSession(): Promise<void> {
    if (!this.api || !this.selectedDeviceId) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const generation = ++this.operationGeneration;
    this.clearSubscription("session");
    this.session = null;
    this.resetCalibrationRun();
    await this.run(async () => {
      const session = await api.startSession(deviceId);
      if (!this.ownsOperation(generation, api, deviceId) || session.device_id !== deviceId) return;
      this.session = session;
      this.navigate("safety");
      await this.subscribeSession(this.connectionGeneration);
    }, "Calibration session could not be started.", () => this.ownsOperation(generation, api, deviceId));
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
    if (!this.api || !this.session) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      const session = await api.acknowledgeSafety(sessionId);
      if (!this.ownsOperation(generation, api, deviceId) || session.session_id !== sessionId) return;
      this.session = session;
      this.navigate("voltage");
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(generation, api, deviceId));
  }

  private async checkStability(target: "voltage" | "current"): Promise<void> {
    if (!this.api || !this.session) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    const targetId = target === "voltage" ? this.groupKey(this.group) : String(this.channel);
    await this.run(async () => {
      const result = await api.checkStability(sessionId, target, targetId);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${target}:${targetId}`, result);
    }, "Stable samples could not be collected.", () => this.ownsOperation(generation, api, deviceId));
  }

  private async calibrate(target: "voltage" | "current"): Promise<void> {
    if (!this.api || !this.session) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    const targetId = target === "voltage" ? this.groupKey(this.group) : String(this.channel);
    const groupKey = this.groupKey(this.group); const channel = this.channel; const reference = this.reference;
    await this.run(async () => {
      const result = target === "voltage"
        ? await api.calibrateVoltage(sessionId, groupKey, reference, true)
        : await api.calibrateCurrent(sessionId, channel, reference, true,
          this.inventory?.channels[channel - 1]?.reporting_multiplier ?? 1);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      this.calibrationByTarget = new Map(this.calibrationByTarget).set(`${target}:${targetId}`, result);
      this.announcement = `Calibration iteration ${result.iteration} finished with state ${result.state}.`;
    }, "Calibration did not complete. Reconnect and inspect before another attempt.",
    () => this.ownsOperation(generation, api, deviceId));
  }

  private groupKey(index: number): string {
    const board = Math.floor(index / 2);
    const group = index % 2 + 1;
    return board === 0 ? `main_${group}` : `addon${board}_${group}`;
  }

  private async restart(): Promise<void> {
    if (!this.api || !this.session || !this.topology) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const topology = this.topology;
    const generation = ++this.operationGeneration;
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
      this.session = { ...this.session!, state: "verified" };
      this.navigate("summary");
    }, "Restart verification failed; review recovery evidence before rollback.",
    () => this.ownsOperation(generation, api, deviceId));
  }

  private async cancelSession(): Promise<void> {
    if (!this.api || !this.session) return;
    const api = this.api; const deviceId = this.selectedDeviceId; const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      const cancelled = await api.cancelSession(sessionId);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      this.clearSubscription("session");
      this.session = cancelled;
      this.restartResult = null;
      this.navigate("safety");
      this.announcement = "Calibration session cancelled; cleanup completed without restart verification.";
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(generation, api, deviceId));
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
    const targetId = target === "voltage" ? this.groupKey(this.group) : String(this.channel);
    return this.calibrationByTarget.get(`${target}:${targetId}`) ?? null;
  }

  private stabilityFor(target: "voltage" | "current"): StabilityResult | null {
    const targetId = target === "voltage" ? this.groupKey(this.group) : String(this.channel);
    return this.stabilityByTarget.get(`${target}:${targetId}`) ?? null;
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
      this.fail(error, code === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : fallback);
    }
    if (isCurrent()) this.requestUpdate();
  }

  private fail(_error: unknown, safeMessage: string): void {
    this.error = safeMessage;
    this.announcement = safeMessage;
    this.requestUpdate();
  }

  private stepBody(): TemplateResult {
    if (this.step === "setup") return setupDeviceStep(this.setup, this.addonCount, this.connection,
      (value) => { this.addonCount = value; this.requestUpdate(); },
      (value) => { this.connection = value; this.requestUpdate(); },
      () => void this.rescan());
    if (this.step === "discover") return adoptionStep(this.setup?.devices ?? [], this.selectedDeviceId,
      (id) => { this.selectDevice(id); this.requestUpdate(); }, () => void this.adopt(), () => this.back(), () => void this.loadTopology());
    if (this.step === "topology" && this.topology) return topologyStep(this.topology, this.selectedProjectVersion(),
      () => this.back(), () => void this.loadInventory(), Boolean(this.error));
    if (this.step === "ct" && this.inventory) return ctInventoryStep(this.inventory, this.board, this.ctGroup, this.drafts,
      (board) => { this.board = board; this.ctGroup = 0; this.requestUpdate(); },
      (group) => this.selectCtGroup(group), (channel, patch) => this.updateDraft(channel, patch), () => this.back(), () => void this.reviewChanges());
    if (this.step === "build") return buildInstallStep(this.transaction,
      () => void this.transactionAction("apply"), () => void this.transactionAction("compile"),
      () => void this.transactionAction("install"), () => void this.transactionAction("rollback"), () => this.back(), () => void this.startSession());
    if (this.step === "safety") return safetyStep(this.session, this.safetyAcknowledged,
      (value) => { this.safetyAcknowledged = value; this.requestUpdate(); }, () => void this.acknowledgeSafety(), () => void this.cancelSession(), () => this.back());
    if (this.step === "voltage") return html`${voltageStep(this.topology, this.group, this.reference, this.stabilityFor("voltage"), this.resultFor("voltage"),
      (value) => { this.group = value; this.requestUpdate(); },
      (value) => { this.reference = value; this.requestUpdate(); }, () => void this.checkStability("voltage"), () => void this.calibrate("voltage"), () => void this.reconnectSession(), () => void this.cancelSession())}
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" @click=${() => this.navigate("current")}>Continue</button></footer>`;
    if (this.step === "current") return html`${currentStep(this.topology, this.inventory, this.channel, this.reference, this.stabilityFor("current"), this.resultFor("current"),
      (value) => { this.channel = value; this.requestUpdate(); },
      (value) => { this.reference = value; this.requestUpdate(); }, () => void this.checkStability("current"), () => void this.calibrate("current"), () => void this.reconnectSession(), () => void this.cancelSession())}
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" @click=${() => this.navigate("restart")}>Continue</button></footer>`;
    if (this.step === "restart") return restartStep(this.session?.state ?? this.error, this.restartResult,
      Boolean(this.transaction?.rollback_available), () => void this.restart(), () => void this.transactionAction("rollback"), () => this.back());
    return summaryStep(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.selectedProjectVersion(), () => this.back());
  }

  public override render(): TemplateResult {
    const currentIndex = STEPS.findIndex(([step]) => step === this.step);
    return html`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${STEPS.map(([step, label], index) => html`
            <li class=${index === currentIndex ? "current" : ""}>
              <button class="step-button" aria-current=${index === currentIndex ? "step" : nothing} ?disabled=${index > currentIndex}
                @click=${() => index <= currentIndex && this.navigate(step)}><span class="number">${index + 1}</span><span>${label}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${currentIndex + 1} of 10 — ${STEPS[currentIndex]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => { this.mobileStepsOpen = !this.mobileStepsOpen; this.requestUpdate(); }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${STEPS[currentIndex]?.[1]}</h1>
          ${this.error ? html`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : nothing}
          ${this.stepBody()}
          ${currentIndex >= 4 && this.step !== "summary" ? technicalDetails(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult) : nothing}
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
