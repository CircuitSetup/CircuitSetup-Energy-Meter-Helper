import { html, type TemplateResult } from "lit";
import type { MeterTopology, SessionStatus, StabilityResult, TransactionStatus } from "../types";
import { technicalDetails } from "./technical-details";

export function summaryStep(topology: MeterTopology | null, session: SessionStatus | null, transaction: TransactionStatus | null, stability: StabilityResult | null): TemplateResult {
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="success-band" role="status">Setup and exact restart verification are complete.</div>
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${topology?.ct_count ?? "—"} CTs in ${topology?.group_count ?? "—"} groups</dd></div><div><dt>Authority source</dt><dd>Verified configuration and native API evidence</dd></div></dl>
      ${technicalDetails(topology, session, transaction, stability)}
    </section>
  `;
}
