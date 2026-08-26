import { html, type TemplateResult } from "lit";
import type { CalibrationResult, MeterTopology, SessionStatus, StabilityResult } from "../types";
import { calibrationEvidence, calibrationProgress, calibrationSourceEvidence, stabilityEvidence } from "./measurement-evidence";
import { moveTab } from "./tab-keyboard";

export function voltageStep(
  topology: MeterTopology | null,
  session: SessionStatus | null,
  board: number,
  references: number[],
  referenceLabels: string[] = [],
  stability: StabilityResult | null,
  results: CalibrationResult[],
  busy: boolean,
  selectBoard: (board: number) => void,
  setReference: (index: number, value: number) => void,
  check: () => void,
  calibrate: () => void,
  reconnect: () => void,
  cancel: () => void,
): TemplateResult {
  const count = references.length;
  const referenceReady = references.slice(0, count).every((value) => Number.isFinite(value) && value > 0);
  const sourceIds = board === 0 ? ["meter_main1", "meter_main2"] : [`addon${board}_1`, `addon${board}_2`];
  const completedInstanceIds = new Set(results.flatMap((result) => result.state === "applied_pending_restart_verification"
    && result.gain_evidence?.flash_saved ? [result.gain_evidence.instance_id] : []));
  const complete = completedInstanceIds.size === sourceIds.length && sourceIds.every((instance) => completedInstanceIds.has(instance));
  const retry = results.find((result) => result.retry_allowed) ?? null;
  const terminal = results.some((result) => result.state !== "applied_pending_restart_verification" && !result.retry_allowed);
  const boardLabel = board === 0 ? "Main Board" : `Add-on ${board}`;
  return html`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${calibrationProgress(referenceReady, stability, complete ? results[0] ?? null : null)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: topology?.board_count ?? 1 }, (_, index) => html`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${index}`} aria-controls="voltage-board-panel"
          aria-selected=${index === board} tabindex=${index === board ? "0" : "-1"}
          @keydown=${(event: KeyboardEvent) => moveTab(event, index)}
          @click=${() => selectBoard(index)}>${index === 0 ? "Main Board" : `Add-on ${index}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${board}`}>
      <h2>Calibrate Voltage</h2>
      ${calibrationSourceEvidence(session, sourceIds, "Voltage", completedInstanceIds)}
      <div class="reference-block">
        ${Array.from({ length: count }, (_, index) => html`<label>${referenceLabels[index] ?? (count === 1 ? "Trusted instrument" : `Voltage ${index + 1}`)} trusted reference
          <input type="number" min="0.01" step="0.01" .value=${references[index] ? String(references[index]) : ""}
            @input=${(event: Event) => setReference(index, Number((event.target as HTMLInputElement).value))} /></label>`)}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${check} ?disabled=${busy}>${busy ? "Loading live voltage data…" : "Check stability"}</button>
        <button class="primary" @click=${calibrate} ?disabled=${busy || !referenceReady || !stability?.stable || terminal || complete && !retry}>${retry ? "Retry voltage calibration" : "Calibrate voltage"}</button></div>
      ${stability ? html`<div class=${stability.stable ? "success-band" : "warning-band"} role="status">${stability.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${stabilityEvidence(stability)}
      ${complete ? html`<div class="success-band" role="status">Voltage calibration complete for ${boardLabel}.</div>` : ""}
      ${results.map((result) => calibrationEvidence(result))}
      ${results.some((result) => result.state === "indeterminate") ? html`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${reconnect}>Reconnect and inspect</button><button class="danger" @click=${cancel}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
