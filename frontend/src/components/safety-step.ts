import { html, type TemplateResult } from "lit";
import type { SessionStatus } from "../types";
import { preflightStatus } from "./preflight-step";

export function safetyStep(
  session: SessionStatus | null,
  acknowledged: boolean,
  setAcknowledged: (value: boolean) => void,
  confirm: () => void,
  cancel: () => void,
  back: () => void,
  busy = false,
): TemplateResult {
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      ${preflightStatus(session)}
      ${session?.state === "cancelled" ? html`<div class="status-band" role="status">Calibration session cancelled. No restart verification was claimed.</div>` : ""}
      <ul class="safety-list">
        <li>Mains voltage is hazardous.</li>
        <li>Use a properly rated true-RMS reference instrument.</li>
        <li>Clamp the same conductor represented by the selected CT and keep the load stable.</li>
        <li>Do not work inside an energized panel unless qualified.</li>
        <li>The helper cannot electrically verify a burden-jumper change.</li>
      </ul>
      <section class="warning-band" aria-labelledby="safety-heading">
        <h2 id="safety-heading">Safety acknowledgement</h2>
        <p>Confirm the test setup is safe, isolated, and accessible before calibration.</p>
        <label class="check-row"><input type="checkbox" .checked=${acknowledged} @change=${(event: Event) => setAcknowledged((event.target as HTMLInputElement).checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${cancel}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary" @click=${back}>Back</button>
        <button class="primary" @click=${confirm} ?disabled=${busy || session?.state === "cancelled" || !acknowledged || Boolean(session?.preflight.issues.length)}>${busy ? "Loading calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
