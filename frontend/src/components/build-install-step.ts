import { html, type TemplateResult } from "lit";
import type { ConfigurationImpact, MeterConfiguration, MeterConfigurationRequest, TotalGraphPreview, TransactionStatus } from "../types";
import type { TransactionPurpose } from "../workflow-model";
import { configReview } from "./config-review-step";
import { totalsMigrationReview } from "./totals-migration-review";

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
  meterInventory: MeterConfiguration | null = null,
  totalPreview: TotalGraphPreview | null = null,
): TemplateResult {
  if (!status) return html`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="recovery-panel" role="status"><strong>No active review</strong><p>Return to the previous step to review the current configuration.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${back}>Back</button></footer>
    </section>
  `;
  const labels = purpose === "save_calibration"
    ? { heading: "Save verified calibration", apply: "Write verified gains to ESPHome", compile: "Build firmware", install: "Install calibrated firmware" }
    : { heading: purpose === "offset_preparation" ? "Install offset preparation" : purpose === "offset_finalization" ? "Install captured offsets" : legacyMigration ? "Install reviewed helper configuration" : "Install meter configuration", apply: "Save and validate configuration", compile: "Build firmware", install: "Install on meter" };
  const state = status.state;
  const retryClear = purpose === "save_calibration" && state === "verified";
  const busy = Boolean(pendingAction);
  const retryableInstall = state === "install_confirmation_required" && status?.evidence.some((code) =>
    ["upload_outcome_unknown", "reconnect_unavailable", "entity_mismatch", "sensor_count_mismatch", "meter_communication_failed", "persistence_failed"].includes(code)) === true;
  const uploadUnknown = status.progress.includes("ota_attempted") && !status.progress.includes("ota_uploaded") && !status.progress.includes("device_verified");
  const communicationFailure = status?.evidence.includes("meter_communication_failed") === true;
  const persistenceFailure = status?.evidence.includes("persistence_failed") === true;
  const failedPins = status?.communication_failed_cs_pins ?? [];
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
  const failureMessage = status?.failure?.reason_code === "missing_package" ? "A required supported package is missing. Review the package selection and create a fresh review." : status?.failure?.reason_code === "unsupported_component_option" ? "The selected option is not supported by this ESPHome version. Choose a supported firmware version and review again." : status?.failure?.reason_code === "required_secret" ? "A required secret name is unresolved. Add it in ESPHome and create a fresh review." : status?.failure?.reason_code === "conflicting_managed_override" ? "A managed configuration override conflicts with the reviewed source. Restore the source or create a fresh review." : status?.failure?.reason_code === "verification_incomplete" ? "Uploaded; verification incomplete. Reconnect the meter and retry verification." : null;
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      <h2>${labels.heading}</h2>
      ${purpose === "offset_preparation" ? html`<p>Installs a reviewed zero baseline for unfinished chips only. It does not calibrate. Return to the same board and stage, repeat physical preparation, then check readiness before Run.</p>` : ""}
      ${purpose === "offset_finalization" ? html`<p>Installs captured signed offsets, including zeros, with native restore disabled. Confirm configuration selection after install. This is not register readback and does not clear gain calibration.</p>` : ""}
      ${configReview(status, configuration, impact, meterInventory?.totals)}
      ${meterInventory ? totalsMigrationReview(meterInventory, () => undefined, totalPreview, impact !== null, true) : ""}
      ${state === "failed" || retryableInstall ? html`
        <div class="recovery-panel" role="status">
          <strong>${communicationFailure ? "Meter chip communication failed" : uploadUnknown ? "Installation outcome needs verification" : persistenceFailure ? "Firmware installed; Helper data was not saved" : failureMessage ?? "Build or install needs attention"}</strong>
          ${communicationFailure ? html`<p>The ESP32 reconnected but could not establish SPI communication with
            ${failedPins.length ? "the meter chip(s) on CS pin(s) " + failedPins.map((pin) => "GPIO" + pin).join(", ") : "one or more meter chips (CS pin unavailable)"}.
            This is an ESP32–meter-chip link, not a Wi-Fi or Home Assistant problem.</p>
            <ol>
              <li>Power down the meter and ESP32 before touching boards or jumpers. Do not touch exposed mains wiring.</li>
              <li>Confirm the ESP32 model and firmware. Check orientation, seated and aligned header rows, bent pins, and contact.</li>
              <li>For an affected add-on, check CS jumpers for position and contact. Match board/connection defaults or configuration overrides. Check main-board CS pins too.</li>
              <li>If the model, seating, and CS assignments are correct, try a known-good ESP32 with the correct firmware.</li>
              <li>If an add-on still fails, move its CS jumper to an unused supported pin and update the configuration before rebuilding and installing. A fault that follows the GPIO points to the ESP32 or link; one that stays with the add-on points to that board or meter chip.</li>
            </ol>
            <p>Fix the hardware or configuration, power up, and Retry verification. It rechecks installed firmware without another upload.</p>
            <p>Back keeps this saved configuration for editing; rollback is optional.</p>
          ` : uploadUnknown ? html`<p>The upload may have reached the meter. Retry verification checks the source and meter without uploading again.</p>` : persistenceFailure ? html`<p>The meter accepted and verified the firmware. Retry completion to save the Helper data without uploading again, or use Back to reload the installed configuration.</p>`
            : html`<p>${status?.evidence.join(", ") || "The operation did not complete."}</p>`}
          ${status?.rollback_available ? html`<button class="danger" @click=${rollback} ?disabled=${busy}>${pendingAction === "rollback" ? "Rolling back…" : "Rollback"}</button>` : ""}
        </div>
      ` : ""}
      ${validationFailed ? html`<div class="recovery-panel" role="status"><strong>ESPHome rejected the config (code ${status?.validation_detail?.code ?? "unavailable"})</strong><p>Original config restored. Review the changes and open ESPHome Device Builder logs for the validation error.</p></div>` : ""}
      ${status?.failure ? html`<div class="recovery-panel" role="status">
        ${failureMessage && !uploadUnknown ? html`<p>${failureMessage}</p>` : html`<p>Open ESPHome Device Builder details for the failed operation.</p>`}
        ${status.failure.context.map(([key, value]) => html`<p>${key === "secret_name" ? "Required secret" : key === "component" ? "Component" : key === "field" ? "Option" : "Package"}: <code>${value}</code></p>`)}
      </div>` : ""}
      ${waitingForStartup ? html`<div class="job-progress" role="status" aria-live="polite">
        <span>Meter rebooting; waiting for startup verification.</span>
        <progress max="100" aria-label="Waiting for meter startup"></progress>
      </div>` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${apply} ?disabled=${busy || reviewBackBusy || correctionPending || state !== "previewed"}>${pendingAction === "apply" ? "Applying…" : labels.apply}</button>
        <button class="secondary" @click=${compile} ?disabled=${busy || reviewBackBusy || correctionPending || state !== "validated"}>${pendingAction === "compile" ? "Compiling…" : labels.compile}</button>
        <button class="primary" @click=${install} ?disabled=${busy || reviewBackBusy || correctionPending || (state !== "install_confirmation_required" && !retryClear)}>${pendingAction === "install" ? retryableInstall ? "Checking…" : "Installing…" : retryClear ? "Retry clearing saved flash values" : persistenceFailure ? "Retry completion" : retryableInstall ? "Retry verification" : labels.install}</button>
      </div>
      ${status?.validation_detail ? html`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${status.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${status.validation_detail.error_record_count} records (${status.validation_detail.reported_error_count === null ? "unreported" : `${status.validation_detail.reported_error_count} reported`})</dd></div>
        <div><dt>Warnings</dt><dd>${status.validation_detail.warning_record_count} records (${status.validation_detail.reported_warning_count === null ? "unreported" : `${status.validation_detail.reported_warning_count} reported`})</dd></div>
      </dl>` : ""}
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
