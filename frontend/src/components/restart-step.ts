import { html, type TemplateResult } from "lit";
import type { RestartVerificationResult } from "../types";

export function restartStep(
  state: string,
  result: RestartVerificationResult | null,
  rollbackAvailable: boolean,
  restart: () => void,
  rollback: () => void,
  back: () => void,
): TemplateResult {
  const recovery = state.includes("failed") || state.includes("indeterminate");
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, voltage/current offsets, power offsets, and entity bindings.</p>
      <div class="status-band" role="status">${state || "Ready for restart verification"}</div>
      ${result ? html`<dl class="status-list"><div><dt>Verification</dt><dd>${result.verification_id}</dd></div><div><dt>Authority</dt><dd>${result.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${result.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${result.source_handoff_available ? result.config_filename : "Unavailable in runtime-only mode"}</dd></div></dl>` : ""}
      ${state === "cancelled" ? html`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${recovery ? html`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${rollbackAvailable ? html`<button class="danger" data-action="rollback" @click=${rollback}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${back}>Back</button><button class="primary" @click=${restart} ?disabled=${state === "cancelled" || Boolean(result)}>${state.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
