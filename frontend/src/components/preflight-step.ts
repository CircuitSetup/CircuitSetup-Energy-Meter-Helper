import { html, type TemplateResult } from "lit";
import type { SessionStatus } from "../types";

export function preflightStatus(session: SessionStatus | null): TemplateResult {
  if (!session) return html`<p>Starting a calibration session…</p>`;
  return session.preflight.issues.length
    ? html`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${session.preflight.issues.map((issue) => html`<li>${issue.role}: ${issue.detail}</li>`)}</ul></div>`
    : html`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>`;
}
