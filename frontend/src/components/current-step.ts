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
  completedInstanceIds: ReadonlySet<string>,
  select: (channel: number) => void,
  setReference: (channel: number, value: number | null) => void,
  setReportingMultiplier: (value: number | null) => void,
  check: () => void,
  calibrate: () => void,
  reconnect: () => void,
  cancel: () => void,
  busy = false,
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
    && [1, 2, 4, 8].includes(reportingMultiplier);
  const referenceReady = selected.length > 0 && (!multiplierRequired || multiplierValid);
  return html`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${calibrationProgress(referenceReady, stability, result, session?.calibration_plan ?? "full")}
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
      <p>Blank entries keep the existing gains. Select a reference only for channels you want to calibrate.</p>
      ${calibrationSourceEvidence(session, sourceIds, "Current", completedInstanceIds)}
      <div class="reference-block">
        ${channels.map((value) => html`<label>CT${value} · ${inventory?.channels.find((item) => item.channel === value)?.name ?? "Unnamed circuit"} reference (A)
          <input data-current-reference=${value} aria-label=${`CT${value} reference`} type="number" min="0.01" step="0.01"
            .value=${references.has(value) ? String(references.get(value)) : ""}
            @input=${(event: Event) => { const input = event.target as HTMLInputElement; setReference(value, input.value === "" ? null : Number(input.value)); }} /></label>`)}
      ${multiplierRequired ? html`<label>Reporting multiplier <select data-role="reporting-multiplier" required @change=${(event: Event) => { const value = Number((event.target as HTMLSelectElement).value); setReportingMultiplier(value || null); }}><option value="" ?selected=${reportingMultiplier === null}>Choose multiplier</option>${[1, 2, 4, 8].map((value) => html`<option value=${value} ?selected=${reportingMultiplier === value}>${value}</option>`)}</select></label><p>ESPHome source editing is unavailable, so the multiplier cannot be read from authoritative configuration. Choose it explicitly.</p>` : ""}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${check} ?disabled=${busy || !referenceReady}>${busy ? "Loading live current data…" : "Check stability"}</button>
        <button class="primary" @click=${calibrate} ?disabled=${busy || !referenceReady || !stability?.stable || (result?.iteration ?? 0) >= 3 || Boolean(result && !result.retry_allowed && result.iteration > 0)}>${result?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button></div>
      ${stability ? html`<div class=${stability.stable ? "success-band" : "warning-band"} role="status">${stability.stable ? "Stable and ready for calibration." : stability.windows.length ? "Data is changing too much; keep the load steady." : "Waiting for live data…"}</div>` : ""}
      ${stabilityEvidence(stability, selected.map((value) => `CT${value}`))}
      ${result?.state === "applied_pending_restart_verification" ? html`<div class="success-band" role="status">Current calibration complete for CT${first}–CT${first + 2}.</div>` : ""}
      ${calibrationEvidence(result)}
      ${result?.state.includes("indeterminate") ? html`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${reconnect}>Reconnect and inspect</button><button class="danger" @click=${cancel}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
