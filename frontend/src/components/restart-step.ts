import { html, type TemplateResult } from "lit";
import type { RestartVerificationResult } from "../types";

export function restartStep(
  state: string,
  result: RestartVerificationResult | null,
  restart: () => void,
  rollback: () => void,
  back: () => void,
): TemplateResult {
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, and entity bindings.</p>
      <div class="status-band" role="status">${state || "Ready for restart verification"}</div>
      ${result ? html`<dl class="status-list"><div><dt>Verification</dt><dd>${result.verification_id}</dd></div><div><dt>Authority</dt><dd>${result.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${result.connection_generation}</dd></div></dl>` : ""}
      ${state === "cancelled" ? html`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${state.includes("failed") || state.includes("indeterminate") ? html`<div class="recovery-panel"><strong>Recovery required</strong><button class="danger" @click=${rollback}>Review rollback</button></div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${back}>Back</button><button class="primary" @click=${restart} ?disabled=${state === "cancelled" || Boolean(result)}>${state.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
