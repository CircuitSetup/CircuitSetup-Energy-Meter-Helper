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
import { topologyStep } from "./components/topology-step";
import { voltageStep } from "./components/voltage-step";
import { panelStyles } from "./styles";
import type {
  CalibrationResult,
  ConnectionType,
  CtInventory,
  MeterTopology,
  PanelStep,
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
  private stability: StabilityResult | null = null;
  private calibration: CalibrationResult | null = null;
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

  public override connectedCallback(): void {
    super.connectedCallback();
    void this.ensureApi();
  }

  public override disconnectedCallback(): void {
    for (const unsub of this.unsubs.splice(0)) unsub();
    super.disconnectedCallback();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("hass") || changed.has("panel")) void this.ensureApi();
    if (this.error) this.shadowRoot?.querySelector<HTMLElement>("[role=alert]")?.focus();
  }

  private async ensureApi(): Promise<void> {
    if (this.api || !this.hass || !this.panel?.config.entry_id) return;
    this.api = new HelperApi(this.hass, this.panel.config.entry_id);
    try {
      this.setup = await this.api.setupStatus();
      const intent = this.setup.installer_intent;
      if (intent) {
        this.addonCount = intent.addon_count;
        this.connection = intent.connection_type;
      }
      if (this.setup.devices.length) this.selectedDeviceId = this.setup.devices[0]?.entry_id ?? null;
      const unsub = await this.api.subscribeSetup((snapshot) => {
        this.setup = snapshot;
        if (!this.selectedDeviceId && snapshot.devices.length) this.selectedDeviceId = snapshot.devices[0]?.entry_id ?? null;
        this.requestUpdate();
      });
      this.unsubs.push(unsub);
    } catch (error) {
      this.fail(error, "Setup status could not be loaded.");
    }
    this.requestUpdate();
  }

  public showTopology(topology: MeterTopology): void {
    this.topology = topology;
    this.step = "topology";
    this.error = topology.evidence.some((item) => item.addon_count !== topology.addon_count)
      || topology.ct_count !== 6 * topology.board_count
      || topology.group_count !== 2 * topology.board_count
      ? "Topology mismatch"
      : "";
    this.requestUpdate();
  }

  public showInventory(inventory: CtInventory): void {
    this.inventory = inventory;
    this.drafts = new Map(inventory.channels.map((channel) => [channel.channel, {
      name: channel.name,
      modelId: channel.selected_model_id ?? "",
      multiplier: channel.reporting_multiplier,
      expanded: channel.selected_model_id === null && channel.raw_gain_ct === 27518,
    }]));
    this.step = "ct";
    this.error = "";
    this.requestUpdate();
  }

  public showState(step: PanelStep): void {
    this.step = step;
    this.error = "";
    this.requestUpdate();
  }

  public showRecovery(state: "calibration_outcome_indeterminate" | "restart_failed"): void {
    if (state === "calibration_outcome_indeterminate") {
      this.step = "current";
      this.calibration = {
        state,
        group_key: "",
        phase: null,
        changed_channels: [],
        iteration: 1,
        before_values: [],
        after_values: [],
        error_percent_values: [],
        retry_allowed: false,
      };
    } else {
      this.step = "restart";
      if (this.session) this.session = { ...this.session, state };
      else this.error = "Restart verification failed; review rollback and recovery evidence.";
    }
    this.requestUpdate();
  }

  private async rescan(): Promise<void> {
    if (!this.api) return;
    const api = this.api;
    await this.run(async () => {
      await api.setInstallerIntent(this.addonCount, this.connection);
      const setup = await api.rescan();
      this.setup = setup;
      if (setup.devices.length) {
        this.selectedDeviceId = setup.devices[0]?.entry_id ?? null;
        this.step = "discover";
        this.announcement = "Compatible meter discovered.";
      } else {
        this.announcement = "No compatible meter found. Check the network and rescan.";
      }
    }, "Rescan failed.");
  }

  private async adopt(): Promise<void> {
    if (!this.api || !this.selectedDeviceId) return;
    await this.run(async () => {
      await this.api?.adoptDevice(this.selectedDeviceId!);
      this.announcement = "Meter adopted in Device Builder.";
    }, "Adoption is unavailable for this meter.");
  }

  private async loadTopology(): Promise<void> {
    if (!this.api || !this.selectedDeviceId) return;
    await this.run(async () => {
      const result = await this.api?.getTopology(this.selectedDeviceId!);
      if (!result) return;
      this.showTopology("topology" in result ? result.topology : result);
    }, "Topology evidence could not be loaded.");
  }

  private async loadInventory(): Promise<void> {
    if (!this.api || !this.selectedDeviceId) return;
    await this.run(async () => {
      const result = await this.api?.getCtInventory(this.selectedDeviceId!);
      if (result) this.showInventory(result);
    }, "CT inventory could not be loaded.");
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
    await this.run(async () => {
      this.transaction = await this.api?.previewCtConfig(
        this.selectedDeviceId!,
        this.inventory!.plan_id,
        this.inventory!.source_sha256,
        changes,
      ) ?? null;
      this.step = "build";
      await this.subscribeTransaction();
    }, "The configuration preview is stale. Reload the CT inventory and review again.");
  }

  private async subscribeTransaction(): Promise<void> {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const unsub = await this.api.subscribeConfigTransaction(
      this.selectedDeviceId,
      this.transaction.transaction_id,
      this.transaction.source_sha256,
      (status) => { this.transaction = status; this.requestUpdate(); },
    );
    this.unsubs.push(unsub);
  }

  private async transactionAction(action: "apply" | "compile" | "install" | "rollback"): Promise<void> {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    await this.run(async () => {
      const args = [this.selectedDeviceId!, this.transaction!.transaction_id, this.transaction!.source_sha256] as const;
      this.transaction = action === "apply" ? await this.api!.applyCtConfig(...args)
        : action === "compile" ? await this.api!.compileCtConfig(...args)
        : action === "install" ? await this.api!.installCtConfig(...args)
        : await this.api!.rollbackCtConfig(...args);
      this.announcement = `Configuration ${this.transaction.state}.`;
    }, "This confirmation is stale. Reload the CT inventory before making another change.");
  }

  private async startSession(): Promise<void> {
    if (!this.api || !this.selectedDeviceId) return;
    await this.run(async () => {
      this.session = await this.api!.startSession(this.selectedDeviceId!);
      this.step = "safety";
      const unsub = await this.api!.subscribeSession(this.session.session_id, (session) => {
        this.session = session;
        this.requestUpdate();
      });
      this.unsubs.push(unsub);
    }, "Calibration session could not be started.");
  }

  private async acknowledgeSafety(): Promise<void> {
    if (!this.api || !this.session) return;
    await this.run(async () => {
      this.session = await this.api!.acknowledgeSafety(this.session!.session_id);
      this.step = "voltage";
    }, "Safety acknowledgement could not be accepted.");
  }

  private async checkStability(target: "voltage" | "current"): Promise<void> {
    if (!this.api || !this.session) return;
    const targetId = target === "voltage" ? this.groupKey(this.group) : String(this.channel);
    await this.run(async () => {
      this.stability = await this.api!.checkStability(this.session!.session_id, target, targetId);
    }, "Stable samples could not be collected.");
  }

  private async calibrate(target: "voltage" | "current"): Promise<void> {
    if (!this.api || !this.session) return;
    await this.run(async () => {
      this.calibration = target === "voltage"
        ? await this.api!.calibrateVoltage(this.session!.session_id, this.groupKey(this.group), this.reference, true)
        : await this.api!.calibrateCurrent(this.session!.session_id, this.channel, this.reference, true);
      this.announcement = `Calibration iteration ${this.calibration.iteration} finished with state ${this.calibration.state}.`;
    }, "Calibration did not complete. Reconnect and inspect before another attempt.");
  }

  private groupKey(index: number): string {
    const board = Math.floor(index / 2);
    const group = index % 2 + 1;
    return board === 0 ? `meter_main${group}` : `addon${board}_${group}`;
  }

  private async restart(): Promise<void> {
    if (!this.api || !this.session) return;
    await this.run(async () => {
      await this.api!.restartAndVerify(this.session!.session_id);
      this.session = { ...this.session!, state: "verified" };
      this.step = "summary";
    }, "Restart verification failed; review recovery evidence before rollback.");
  }

  private async cancelSession(): Promise<void> {
    if (!this.api || !this.session) return;
    await this.run(async () => {
      this.session = await this.api!.cancelSession(this.session!.session_id);
      this.step = "summary";
    }, "The session cleanup could not be confirmed.");
  }

  private async run(operation: () => Promise<void>, fallback: string): Promise<void> {
    this.error = "";
    try {
      await operation();
    } catch (error) {
      const code = (error as WsError).code;
      this.fail(error, code === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : fallback);
    }
    this.requestUpdate();
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
      (id) => { this.selectedDeviceId = id; this.requestUpdate(); }, () => void this.adopt(), () => void this.loadTopology());
    if (this.step === "topology" && this.topology) return topologyStep(this.topology, () => void this.loadInventory());
    if (this.step === "ct" && this.inventory) return ctInventoryStep(this.inventory, this.board, this.ctGroup, this.drafts,
      (board) => { this.board = board; this.ctGroup = 0; this.requestUpdate(); },
      (group) => this.selectCtGroup(group), (channel, patch) => this.updateDraft(channel, patch), () => void this.reviewChanges());
    if (this.step === "build") return buildInstallStep(this.transaction,
      () => void this.transactionAction("apply"), () => void this.transactionAction("compile"),
      () => void this.transactionAction("install"), () => void this.transactionAction("rollback"), () => void this.startSession());
    if (this.step === "safety") return safetyStep(this.session, this.safetyAcknowledged,
      (value) => { this.safetyAcknowledged = value; this.requestUpdate(); }, () => void this.acknowledgeSafety(), () => void this.cancelSession());
    if (this.step === "voltage") return html`${voltageStep(this.topology, this.group, this.reference, this.stability,
      (value) => { this.group = value; this.stability = null; this.requestUpdate(); },
      (value) => { this.reference = value; this.requestUpdate(); }, () => void this.checkStability("voltage"), () => void this.calibrate("voltage"))}
      <footer class="action-footer"><button class="secondary">Back</button><button class="primary" @click=${() => this.showState("current")}>Continue</button></footer>`;
    if (this.step === "current") return html`${currentStep(this.topology, this.inventory, this.channel, this.reference, this.stability, this.calibration,
      (value) => { this.channel = value; this.stability = null; this.requestUpdate(); },
      (value) => { this.reference = value; this.requestUpdate(); }, () => void this.checkStability("current"), () => void this.calibrate("current"), () => void this.api?.getSession(this.session?.session_id ?? ""))}
      <footer class="action-footer"><button class="secondary">Back</button><button class="primary" @click=${() => this.showState("restart")}>Continue</button></footer>`;
    if (this.step === "restart") return restartStep(this.session?.state ?? this.error, () => void this.restart(), () => void this.transactionAction("rollback"));
    return summaryStep(this.topology, this.session, this.transaction, this.stability);
  }

  public override render(): TemplateResult {
    const currentIndex = STEPS.findIndex(([step]) => step === this.step);
    return html`
      <div class="app">
        <aside class="workflow">
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${STEPS.map(([step, label], index) => html`
            <li class=${index === currentIndex ? "current" : ""}>
              <button class="step-button" aria-current=${index === currentIndex ? "step" : nothing} ?disabled=${index > currentIndex}
                @click=${() => index <= currentIndex && this.showState(step)}><span class="number">${index + 1}</span><span>${label}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${currentIndex + 1} of 10 — ${STEPS[currentIndex]?.[1]}</span><button aria-label="Show setup steps">Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${STEPS[currentIndex]?.[1]}</h1>
          ${this.error ? html`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : nothing}
          ${this.stepBody()}
          ${currentIndex >= 4 && this.step !== "summary" ? technicalDetails(this.topology, this.session, this.transaction, this.stability) : nothing}
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
