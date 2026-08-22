import { html, type TemplateResult } from "lit";
import type { MeterTopology, SessionStatus, StabilityResult, TransactionStatus } from "../types";

export function technicalDetails(
  topology: MeterTopology | null,
  session: SessionStatus | null,
  transaction: TransactionStatus | null,
  stability: StabilityResult | null,
): TemplateResult {
  return html`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${topology?.evidence.map((item) => html`<li>${item.source}: ${item.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${session?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows</h3><p>${stability?.windows.length ?? 0} bounded sample windows.</p></section>
        <section><h3>Gains and parsed matching lines</h3><p>${transaction?.progress.join(", ") || "No transaction evidence."}</p></section>
        <section><h3>Authority source</h3><p>${topology ? "Configuration and verified native API evidence" : "Not yet established"}</p></section>
      </div>
    </details>
  `;
}
