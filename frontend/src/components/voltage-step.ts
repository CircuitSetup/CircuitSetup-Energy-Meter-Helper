import { html, type TemplateResult } from "lit";
import type { CalibrationResult, MeterTopology, SessionStatus, StabilityResult } from "../types";
import { calibrationEvidence, calibrationProgress, calibrationSourceEvidence, stabilityEvidence } from "./measurement-evidence";
import { moveTab } from "./tab-keyboard";

export function voltageStep(
  topology: MeterTopology | null,
  session: SessionStatus | null,
  board: number,
  references: number[],
  stability: StabilityResult | null,
  result: CalibrationResult | null,
  busy: boolean,
  selectBoard: (board: number) => void,
  setReference: (index: number, value: number) => void,
  check: () => void,
  calibrate: () => void,
  reconnect: () => void,
  cancel: () => void,
): TemplateResult {
  const count = topology?.voltage_layout === "two_voltages" ? 2 : 1;
  const referenceReady = references.slice(0, count).every((value) => Number.isFinite(value) && value > 0);
  const sourceIds = board === 0 ? ["meter_main1", "meter_main2"] : [`addon${board}_1`, `addon${board}_2`];
  return html`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${calibrationProgress(referenceReady, stability, result)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: topology?.board_count ?? 1 }, (_, index) => html`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${index}`} aria-controls="voltage-board-panel"
          aria-selected=${index === board} tabindex=${index === board ? "0" : "-1"}
          @keydown=${(event: KeyboardEvent) => moveTab(event, index)}
          @click=${() => selectBoard(index)}>${index === 0 ? "Main Board" : `Add-on ${index}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${board}`}>
      <h2>Calibrate Voltage</h2>
      ${calibrationSourceEvidence(session, sourceIds)}
      <div class="reference-block">
        ${Array.from({ length: count }, (_, index) => html`<label>${count === 1 ? "Trusted instrument reference" : `Voltage ${index + 1} trusted reference`}
          <input type="number" min="0.01" step="0.01" .value=${references[index] ? String(references[index]) : ""}
            @input=${(event: Event) => setReference(index, Number((event.target as HTMLInputElement).value))} /></label>`)}
        <button class="primary" @click=${calibrate} ?disabled=${busy || !referenceReady || !stability?.stable || Boolean(result && !result.retry_allowed && result.iteration > 0)}>${result?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${check} ?disabled=${busy}>${busy ? "Loading live voltage data…" : "Check stability"}</button></div>
      ${stability ? html`<div class=${stability.stable ? "success-band" : "warning-band"} role="status">${stability.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${stabilityEvidence(stability)}
      ${calibrationEvidence(result)}
      ${result?.state === "indeterminate" ? html`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${reconnect}>Reconnect and inspect</button><button class="danger" @click=${cancel}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
