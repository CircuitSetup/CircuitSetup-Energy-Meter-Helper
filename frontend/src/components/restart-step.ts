import { html, type TemplateResult } from "lit";

export function restartStep(
  state: string,
  restart: () => void,
  rollback: () => void,
): TemplateResult {
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, and entity bindings.</p>
      <div class="status-band" role="status">${state || "Ready for restart verification"}</div>
      ${state.includes("failed") || state.includes("indeterminate") ? html`<div class="recovery-panel"><strong>Recovery required</strong><button class="danger" @click=${rollback}>Review rollback</button></div>` : ""}
      <button class="primary" @click=${restart}>Restart and verify</button>
    </section>
  `;
}
