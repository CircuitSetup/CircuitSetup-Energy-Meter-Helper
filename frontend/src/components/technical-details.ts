import { html, type TemplateResult } from "lit";
import type { CalibrationResult, MeterTopology, RestartVerificationResult, SessionStatus, StabilityResult, TransactionStatus } from "../types";
import { calibrationEvidence, stabilityEvidence } from "./measurement-evidence";

export function technicalDetails(
  topology: MeterTopology | null,
  session: SessionStatus | null,
  transaction: TransactionStatus | null,
  stability: Map<string, StabilityResult>,
  calibration: Map<string, CalibrationResult>,
  restart: RestartVerificationResult | null = null,
  completedWithoutChanges = false,
): TemplateResult {
  return html`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${topology?.evidence.map((item) => html`<li>${item.source}: ${item.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        ${session ? html`<section><h3>Semantic API mapping</h3><p>${session.preflight.zeroed_roles.length} reference roles verified and zeroed.</p></section>` : ""}
        ${stability.size ? html`<section><h3>Sample windows by target</h3>${[...stability.entries()].map(([target, result]) => html`<div data-target=${target}>${stabilityEvidence(result)}</div>`)}</section>` : ""}
        ${calibration.size ? html`<section><h3>Calibration results by target</h3>${[...calibration.entries()].map(([target, result]) => html`<div data-target=${target}>${calibrationEvidence(result)}</div>`)}</section>` : ""}
        ${transaction ? html`<section><h3>Build evidence</h3><p>${transaction.evidence.join(", ") || "No build issues recorded."}</p>
          ${transaction.progress.length ? html`<p>${transaction.progress.join(", ")}</p>` : ""}
          <p>Transaction ID: ${transaction.transaction_id}; source hash: ${transaction.source_sha256}.</p>
          ${transaction.validation_detail ? html`<p>${transaction.validation_detail.code === null ? "" : `Validation code ${transaction.validation_detail.code}; `}${transaction.validation_detail.error_record_count} error records; ${transaction.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${transaction.upload_progress.length ? html`<ul>${transaction.upload_progress.map((item) => html`<li>${item.stage}: ${item.percentage ?? "in progress"}${item.percentage != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>` : ""}
        ${restart || completedWithoutChanges ? html`<section><h3>Calibration completion record</h3><p>${restart ? `Restart-verified ${restart.source_authority.replaceAll("_", " ")} calibration record` : "No-change completion; no restart-verified record was created"}</p><p>${restart ? `Verification ${restart.verification_id}, source hash ${restart.config_sha256 ?? "Unavailable"}, generation ${restart.connection_generation}; ${restart.offset_groups?.length ?? 0} voltage/current offset tables; ${restart.power_offset_groups?.length ?? 0} power-offset tables.` : "The server confirmed there were no pending gain or offset changes."}</p></section>` : ""}
      </div>
    </details>
  `;
}
