import { html, type TemplateResult } from "lit";
import type { CalibrationResult, MeterTopology, RestartVerificationResult, SessionStatus, StabilityResult, TransactionStatus } from "../types";
import { technicalDetails } from "./technical-details";

export function summaryStep(topology: MeterTopology | null, session: SessionStatus | null, transaction: TransactionStatus | null,
  stability: Map<string, StabilityResult>, calibration: Map<string, CalibrationResult>, restart: RestartVerificationResult | null,
  projectVersion: string | null, back: () => void): TemplateResult {
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      ${restart ? html`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>`
        : html`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${topology?.ct_count ?? "—"} CTs in ${topology?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${projectVersion ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${restart?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${restart?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${technicalDetails(topology, session, transaction, stability, calibration, restart)}
      <footer class="action-footer"><button class="secondary" @click=${back}>Back</button></footer>
    </section>
  `;
}
