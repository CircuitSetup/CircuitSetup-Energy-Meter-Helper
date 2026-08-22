import { html, type TemplateResult } from "lit";
import type { TransactionStatus } from "../types";
import { configReview } from "./config-review-step";

export function buildInstallStep(
  status: TransactionStatus | null,
  apply: () => void,
  compile: () => void,
  install: () => void,
  rollback: () => void,
  back: () => void,
  continueFlow: () => void,
): TemplateResult {
  const state = status?.state ?? "previewed";
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      ${configReview(status)}
      ${state === "failed" ? html`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${status?.evidence.join(", ") || "The operation did not complete."}</p>
          ${status?.rollback_available ? html`<button class="danger" @click=${rollback}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${apply} ?disabled=${state !== "previewed"}>Apply</button>
        <button class="secondary" @click=${compile} ?disabled=${state !== "validated"}>Compile</button>
        <button class="primary" @click=${install} ?disabled=${state !== "install_confirmation_required"}>Install</button>
      </div>
      ${status?.validation_detail ? html`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${status.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${status.validation_detail.error_record_count} records (${status.validation_detail.reported_error_count ?? "unreported"} reported)</dd></div>
        <div><dt>Warnings</dt><dd>${status.validation_detail.warning_record_count} records (${status.validation_detail.reported_warning_count ?? "unreported"} reported)</dd></div>
      </dl>` : ""}
      ${status?.upload_progress?.length ? html`<ul class="upload-progress">${status.upload_progress.map((item) => html`
        <li>${item.stage}: ${item.percentage ?? item.progress ?? "in progress"}${item.percentage != null || item.progress != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${back}>Back</button>
        <button class="primary" data-action="continue" @click=${continueFlow} ?disabled=${state !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
