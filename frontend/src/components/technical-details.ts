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
        <section><h3>Semantic API mapping</h3><p>${session?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...stability.entries()].map(([target, result]) => html`<div data-target=${target}>${stabilityEvidence(result)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...calibration.entries()].map(([target, result]) => html`<div data-target=${target}>${calibrationEvidence(result)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${transaction?.evidence.join(", ") || "No build evidence."}</p><p>${transaction?.progress.join(", ") || "No transaction progress."}</p>
          ${transaction?.validation_detail ? html`<p>Validation code ${transaction.validation_detail.code ?? "unavailable"}; ${transaction.validation_detail.error_record_count} error records; ${transaction.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${transaction?.upload_progress?.length ? html`<ul>${transaction.upload_progress.map((item) => html`<li>${item.stage}: ${item.percentage ?? item.progress ?? "in progress"}${item.percentage != null || item.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Calibration completion record</h3><p>${restart ? `Restart-verified ${restart.source_authority.replaceAll("_", " ")} calibration record` : completedWithoutChanges ? "No-change completion; no restart-verified record was created" : "Not yet established"}</p><p>${restart ? `Verification ${restart.verification_id}, generation ${restart.connection_generation}; ${restart.offset_groups?.length ?? 0} voltage/current offset tables; ${restart.power_offset_groups?.length ?? 0} power-offset tables.` : completedWithoutChanges ? "The server confirmed there were no pending gain or offset changes." : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
