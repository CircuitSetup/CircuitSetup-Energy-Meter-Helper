import { html, type TemplateResult } from "lit";
import type { ConfigurationImpact, MeterConfigurationRequest, TransactionStatus } from "../types";
import { configReview } from "./config-review-step";

export function buildInstallStep(
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
): TemplateResult {
  const state = status?.state ?? "previewed";
  const retryableInstall = state === "install_confirmation_required"
    && status?.evidence.includes("reconnect_unavailable") === true;
  const validationFailed = state === "rolled_back" && status?.evidence.includes("validation_failed");
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      ${configReview(status, configuration, impact)}
      ${state === "failed" || retryableInstall ? html`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${status?.evidence.join(", ") || "The operation did not complete."}</p>
          ${status?.rollback_available ? html`<button class="danger" @click=${rollback}>Rollback</button>` : ""}
        </div>
      ` : ""}
      ${validationFailed ? html`<div class="recovery-panel" role="status"><strong>ESPHome rejected the config (code ${status?.validation_detail?.code ?? "unavailable"})</strong><p>The original config was restored. Review the config changes and open ESPHome Device Builder logs for the exact validation error.</p></div>` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${apply} ?disabled=${reviewBackBusy || correctionPending || state !== "previewed"}>Apply</button>
        <button class="secondary" @click=${compile} ?disabled=${reviewBackBusy || correctionPending || state !== "validated"}>Compile</button>
        <button class="primary" @click=${install} ?disabled=${reviewBackBusy || correctionPending || state !== "install_confirmation_required"}>${retryableInstall ? "Retry Install" : "Install"}</button>
      </div>
      ${status?.validation_detail ? html`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${status.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${status.validation_detail.error_record_count} records (${status.validation_detail.reported_error_count === null ? "unreported" : `${status.validation_detail.reported_error_count} reported`})</dd></div>
        <div><dt>Warnings</dt><dd>${status.validation_detail.warning_record_count} records (${status.validation_detail.reported_warning_count === null ? "unreported" : `${status.validation_detail.reported_warning_count} reported`})</dd></div>
      </dl>` : ""}
      ${status?.upload_progress?.length ? html`<ul class="upload-progress">${status.upload_progress.map((item) => html`
        <li>${item.stage}: ${item.percentage ?? "in progress"}${item.percentage != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${back} ?disabled=${reviewBackBusy}>${reviewBackBusy ? "Loading…" : "Back"}</button>
        <button class="primary" data-action="continue" @click=${continueFlow} ?disabled=${reviewBackBusy || correctionPending || state !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
