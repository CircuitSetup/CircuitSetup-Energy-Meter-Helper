import { html, type TemplateResult } from "lit";
import type { CalibrationResult, MeterTopology, StabilityResult } from "../types";
import { calibrationEvidence, stabilityEvidence } from "./measurement-evidence";
import { moveTab } from "./tab-keyboard";

export function voltageStep(
  topology: MeterTopology | null,
  groupIndex: number,
  reference: number,
  stability: StabilityResult | null,
  result: CalibrationResult | null,
  busy: boolean,
  select: (group: number) => void,
  setReference: (value: number) => void,
  check: () => void,
  calibrate: () => void,
  reconnect: () => void,
  cancel: () => void,
): TemplateResult {
  const count = topology?.voltage_layout === "two_voltages" ? 2 : 1;
  return html`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="target-tabs" role="tablist" aria-label="Voltage references">
        ${Array.from({ length: count }, (_, index) => html`<button role="tab"
          id=${`voltage-group-tab-${index}`} aria-controls="voltage-group-panel"
          aria-selected=${index === groupIndex} tabindex=${index === groupIndex ? "0" : "-1"}
          @keydown=${(event: KeyboardEvent) => moveTab(event, index)}
          @click=${() => select(index)}>Voltage ${index + 1}</button>`)}
      </div>
      <div id="voltage-group-panel" role="tabpanel" aria-labelledby=${`voltage-group-tab-${groupIndex}`}>
      <h2>${count === 1 ? "Calibrate shared voltage" : `Calibrate voltage ${groupIndex + 1}`}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(reference)} @input=${(event: Event) => setReference(Number((event.target as HTMLInputElement).value))} /></label>
      <button class="secondary" @click=${check} ?disabled=${busy}>${busy ? "Loading live voltage data…" : "Check stability"}</button>
      ${stability ? html`<div class=${stability.stable ? "success-band" : "warning-band"} role="status">${stability.stable ? "Stable sample window" : "Samples are not stable yet"}</div>` : ""}
      ${stabilityEvidence(stability)}
      ${calibrationEvidence(result)}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${calibrate} ?disabled=${busy || !stability?.stable || Boolean(result && !result.retry_allowed && result.iteration > 0)}> ${result?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      ${result?.state === "indeterminate" ? html`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${reconnect}>Reconnect and inspect</button><button class="danger" @click=${cancel}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
