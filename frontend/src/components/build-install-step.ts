import { html, type TemplateResult } from "lit";
import type { ConfigurationImpact, MeterConfigurationRequest, TransactionStatus } from "../types";
import type { TransactionPurpose } from "../workflow-model";
import { configReview } from "./config-review-step";

export function buildInstallStep(
  purpose: Exclude<TransactionPurpose, null>,
  status: TransactionStatus | null,
  apply: () => void,
  compile: () => void,
  install: () => void,
  rollback: () => void,
  back: () => void,
  continueFlow: () => void,
  configuration: MeterConfigurationRequest | null = null,
  impact: ConfigurationImpact | null = null,
  reviewBackBusy = false,
  correctionPending = false,
  pendingAction = "",
  legacyMigration = false,
): TemplateResult {
  if (!status) return html`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="recovery-panel" role="status"><strong>No active review</strong><p>Return to the previous step and review the current configuration before continuing.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${back}>Back</button></footer>
    </section>
  `;
  const labels = purpose === "save_calibration"
    ? { heading: "Save verified calibration", apply: "Write verified gains to ESPHome", compile: "Build firmware", install: "Install calibrated firmware" }
    : { heading: legacyMigration ? "Install reviewed helper configuration" : "Install meter configuration", apply: "Save and validate configuration", compile: "Build firmware", install: "Install on meter" };
  const state = status.state;
  const retryClear = purpose === "save_calibration" && state === "verified";
  const busy = Boolean(pendingAction);
  const retryableInstall = state === "install_confirmation_required" && status?.evidence.some((code) =>
    ["reconnect_unavailable", "entity_mismatch", "sensor_count_mismatch"].includes(code)) === true;
  const waitingForStartup = state === "reconnecting";
  const latestProgress = status?.upload_progress.slice().reverse().find((item) => item.percentage !== null)
    ?? status?.upload_progress.at(-1) ?? null;
  const jobProgress = pendingAction === "install" && state === "install_confirmation_required"
    ? null
    : latestProgress;
  const progressAction = waitingForStartup ? null : pendingAction === "compile" ? "Compile" : pendingAction === "install" ? "Install"
    : status?.upload_progress.length ? status.progress.includes("firmware_compiled") ? "Install" : "Compile" : null;
  const percentage = jobProgress?.percentage ?? null;
  const validationFailed = state === "rolled_back" && status?.evidence.includes("validation_failed");
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      <h2>${labels.heading}</h2>
      ${configReview(status, configuration, impact)}
      ${state === "failed" || retryableInstall ? html`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${status?.evidence.join(", ") || "The operation did not complete."}</p>
          ${status?.rollback_available ? html`<button class="danger" @click=${rollback} ?disabled=${busy}>${pendingAction === "rollback" ? "Rolling back…" : "Rollback"}</button>` : ""}
        </div>
      ` : ""}
      ${validationFailed ? html`<div class="recovery-panel" role="status"><strong>ESPHome rejected the config (code ${status?.validation_detail?.code ?? "unavailable"})</strong><p>The original config was restored. Review the config changes and open ESPHome Device Builder logs for the exact validation error.</p></div>` : ""}
      ${waitingForStartup ? html`<div class="job-progress" role="status" aria-live="polite">
        <span>Meter is rebooting. Waiting for startup verification.</span>
        <progress max="100" aria-label="Waiting for meter startup"></progress>
      </div>` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${apply} ?disabled=${busy || reviewBackBusy || correctionPending || state !== "previewed"}>${pendingAction === "apply" ? "Applying…" : labels.apply}</button>
        <button class="secondary" @click=${compile} ?disabled=${busy || reviewBackBusy || correctionPending || state !== "validated"}>${pendingAction === "compile" ? "Compiling…" : labels.compile}</button>
        <button class="primary" @click=${install} ?disabled=${busy || reviewBackBusy || correctionPending || (state !== "install_confirmation_required" && !retryClear)}>${pendingAction === "install" ? "Installing…" : retryClear ? "Retry clearing saved flash values" : retryableInstall ? "Retry Install" : labels.install}</button>
      </div>
      ${progressAction ? html`<div class="job-progress" role="status" aria-live="polite">
        <span>${progressAction} progress: ${percentage === null ? "in progress" : `${percentage}%`}</span>
        ${percentage === null
          ? html`<progress max="100" aria-label="${progressAction} progress: in progress"></progress>`
          : html`<progress max="100" value=${percentage} aria-label="${progressAction} progress: ${percentage}%"></progress>`}
      </div>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${back} ?disabled=${busy || reviewBackBusy}>${reviewBackBusy ? "Loading…" : "Back"}</button>
        <button class="primary" data-action="continue" @click=${continueFlow} ?disabled=${busy || reviewBackBusy || correctionPending || state !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
