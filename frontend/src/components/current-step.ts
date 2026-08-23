import { html, type TemplateResult } from "lit";
import type { CalibrationResult, CtInventory, MeterTopology, SessionStatus, StabilityResult } from "../types";
import { calibrationEvidence, calibrationProgress, calibrationSourceEvidence, stabilityEvidence } from "./measurement-evidence";
import { moveTab } from "./tab-keyboard";

export function currentStep(
  topology: MeterTopology | null,
  inventory: CtInventory | null,
  session: SessionStatus | null,
  channel: number,
  references: Map<number, number>,
  reportingMultiplier: number | null,
  stability: StabilityResult | null,
  result: CalibrationResult | null,
  select: (channel: number) => void,
  setReference: (channel: number, value: number | null) => void,
  setReportingMultiplier: (value: number | null) => void,
  check: () => void,
  calibrate: () => void,
  reconnect: () => void,
  cancel: () => void,
): TemplateResult {
  const ctCount = topology?.ct_count ?? inventory?.channels.length ?? 6;
  const board = Math.floor((channel - 1) / 6);
  const group = Math.floor((channel - 1) / 3);
  const first = group * 3 + 1;
  const channels = Array.from({ length: 3 }, (_, index) => first + index).filter((value) => value <= ctCount);
  const selected = channels.filter((value) => (references.get(value) ?? 0) > 0);
  const sourceIds = board === 0 ? ["meter_main1", "meter_main2"] : [`addon${board}_1`, `addon${board}_2`];
  const multiplierRequired = inventory === null;
  const multiplierValid = reportingMultiplier !== null
    && Number.isFinite(reportingMultiplier)
    && reportingMultiplier >= 0.001
    && reportingMultiplier <= 1000;
  const referenceReady = selected.length > 0 && (!multiplierRequired || multiplierValid);
  return html`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${calibrationProgress(referenceReady, stability, result)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(ctCount / 6) }, (_, index) => html`<button role="tab"
          id=${`current-board-tab-${index}`} aria-controls="current-board-panel"
          aria-selected=${index === board} tabindex=${index === board ? "0" : "-1"}
          @keydown=${(event: KeyboardEvent) => moveTab(event, index)}
          @click=${() => select(index * 6 + 1)}>${index === 0 ? "Main Board" : `Add-on ${index}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${board}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((offset) => { const value = board * 6 + offset * 3 + 1; return html`<button
          aria-pressed=${value === first} @click=${() => select(value)}>Group ${board * 2 + offset + 1}</button>`; })}
      </div>
      <h2>Calibrate CT${first}–CT${first + 2}</h2>
      ${calibrationSourceEvidence(session, sourceIds)}
      <div class="reference-block">
        ${channels.map((value) => html`<label>CT${value} reference
          <input data-current-reference=${value} aria-label=${`CT${value} reference`} type="number" min="0.01" step="0.01"
            .value=${references.has(value) ? String(references.get(value)) : ""}
            @input=${(event: Event) => { const input = event.target as HTMLInputElement; setReference(value, input.value === "" ? null : Number(input.value)); }} /></label>`)}
      ${multiplierRequired ? html`<label>Reporting multiplier <input data-role="reporting-multiplier" type="number" min="0.001" max="1000" step="0.001" required .value=${reportingMultiplier === null ? "" : String(reportingMultiplier)} @input=${(event: Event) => { const value = Number((event.target as HTMLInputElement).value); setReportingMultiplier(Number.isFinite(value) && value >= 0.001 && value <= 1000 ? value : null); }} /></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
        <button class="primary" @click=${calibrate} ?disabled=${!referenceReady || !stability?.stable || (result?.iteration ?? 0) >= 3 || Boolean(result && !result.retry_allowed && result.iteration > 0)}>${result?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${check} ?disabled=${!referenceReady}>Check stability</button></div>
      ${stability ? html`<div class=${stability.stable ? "success-band" : "warning-band"} role="status">${stability.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${stabilityEvidence(stability, selected.map((value) => `CT${value}`))}
      ${calibrationEvidence(result)}
      ${result?.state.includes("indeterminate") ? html`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${reconnect}>Reconnect and inspect</button><button class="danger" @click=${cancel}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
