import { html, nothing, type TemplateResult } from "lit";
import type { CalibrationResult, StabilityResult } from "../types";

export function stabilityEvidence(result: StabilityResult | null): TemplateResult | typeof nothing {
  if (!result) return nothing;
  return html`<section class="measurement-evidence" aria-label=${`${result.target} ${result.target_id} stability evidence`}>
    <h3>Stability evidence · ${result.target_id}</h3>
    ${result.windows.map((window, index) => html`<dl>
      <div><dt>Window ${index + 1} samples</dt><dd>${window.samples.join(", ")}</dd></div>
      <div><dt>Mean</dt><dd>${window.mean}</dd></div>
      <div><dt>Standard deviation</dt><dd>${window.standard_deviation}</dd></div>
      <div><dt>Range</dt><dd>${window.range_percent}%</dd></div>
    </dl>`)}
  </section>`;
}

export function calibrationEvidence(result: CalibrationResult | null): TemplateResult | typeof nothing {
  if (!result) return nothing;
  return html`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${result.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${result.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${result.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${result.before_values.join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${result.after_values.join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${result.error_percent_values.map((value) => `${value}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Gain evidence</dt><dd>${result.gain_evidence ? JSON.stringify(result.gain_evidence) : "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${result.restore_evidence ? JSON.stringify(result.restore_evidence) : "Unavailable"}</dd></div>
    </dl>
  </section>`;
}
