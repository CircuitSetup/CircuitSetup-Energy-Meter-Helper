import { html, type TemplateResult } from "lit";
import type { MeterTopology, StabilityResult } from "../types";

export function voltageStep(
  topology: MeterTopology | null,
  groupIndex: number,
  reference: number,
  stability: StabilityResult | null,
  select: (group: number) => void,
  setReference: (value: number) => void,
  check: () => void,
  calibrate: () => void,
): TemplateResult {
  const count = topology?.group_count ?? 2;
  return html`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="target-tabs" role="tablist" aria-label="Voltage groups">
        ${Array.from({ length: count }, (_, index) => html`<button role="tab" aria-selected=${index === groupIndex} @click=${() => select(index)}>Group ${index + 1}</button>`)}
      </div>
      <h2>Calibrate voltage group ${groupIndex + 1}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(reference)} @input=${(event: Event) => setReference(Number((event.target as HTMLInputElement).value))} /></label>
      <button class="secondary" @click=${check}>Check stability</button>
      ${stability ? html`<div class=${stability.stable ? "success-band" : "warning-band"} role="status">${stability.stable ? "Stable sample window" : "Samples are not stable yet"}</div>` : ""}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${calibrate} ?disabled=${!stability?.stable}>Calibrate voltage</button>
    </section>
  `;
}
