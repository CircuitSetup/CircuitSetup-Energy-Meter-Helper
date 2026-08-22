import { html, type TemplateResult } from "lit";
import type { CalibrationResult, CtInventory, MeterTopology, StabilityResult } from "../types";
import { calibrationEvidence, stabilityEvidence } from "./measurement-evidence";
import { moveTab } from "./tab-keyboard";

export function currentStep(
  topology: MeterTopology | null,
  inventory: CtInventory | null,
  channel: number,
  reference: number,
  reportingMultiplier: number | null,
  stability: StabilityResult | null,
  result: CalibrationResult | null,
  select: (channel: number) => void,
  setReference: (value: number) => void,
  setReportingMultiplier: (value: number | null) => void,
  check: () => void,
  calibrate: () => void,
  reconnect: () => void,
  cancel: () => void,
): TemplateResult {
  const ctCount = topology?.ct_count ?? inventory?.channels.length ?? 6;
  const board = Math.floor((channel - 1) / 6);
  const first = board * 6 + 1;
  const multiplierRequired = inventory === null;
  const multiplierValid = reportingMultiplier !== null
    && Number.isFinite(reportingMultiplier)
    && reportingMultiplier >= 0.001
    && reportingMultiplier <= 1000;
  return html`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(ctCount / 6) }, (_, index) => html`<button role="tab"
          id=${`current-board-tab-${index}`} aria-controls="current-board-panel"
          aria-selected=${index === board} tabindex=${index === board ? "0" : "-1"}
          @keydown=${(event: KeyboardEvent) => moveTab(event, index)}
          @click=${() => select(index * 6 + 1)}>${index === 0 ? "Main Board" : `Add-on ${index}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${board}`}>
      <div class="group-grid">
        ${[0, 3].map((offset) => html`<section><h2>Group ${board * 2 + offset / 3 + 1}</h2>${Array.from({ length: 3 }, (_, index) => {
          const value = first + offset + index;
          return html`<button class=${value === channel ? "selected" : ""} @click=${() => select(value)}>CT${value}</button>`;
        })}</section>`)}
      </div>
      <h2>Calibrate CT${channel}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(reference)} @input=${(event: Event) => setReference(Number((event.target as HTMLInputElement).value))} /></label>
      ${multiplierRequired ? html`<label>Reporting multiplier <input data-role="reporting-multiplier" type="number" min="0.001" max="1000" step="0.001" required .value=${reportingMultiplier === null ? "" : String(reportingMultiplier)} @input=${(event: Event) => { const value = Number((event.target as HTMLInputElement).value); setReportingMultiplier(Number.isFinite(value) && value >= 0.001 && value <= 1000 ? value : null); }} /></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
      <button class="secondary" @click=${check}>Check stability</button>
      ${stability ? html`<div class=${stability.stable ? "success-band" : "warning-band"} role="status">${stability.stable ? "Stable" : "Retake samples"}</div>` : ""}
      ${stabilityEvidence(stability)}
      ${calibrationEvidence(result)}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration ${result?.iteration ?? 1} of 3</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${calibrate} ?disabled=${!stability?.stable || (multiplierRequired && !multiplierValid) || (result?.iteration ?? 0) >= 3 || Boolean(result && !result.retry_allowed && result.iteration > 0)}>${result?.retry_allowed ? "Retry calibration" : "Calibrate"} CT${channel}</button>
      ${result?.state.includes("indeterminate") ? html`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${reconnect}>Reconnect and inspect</button><button class="danger" @click=${cancel}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
