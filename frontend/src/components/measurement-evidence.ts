import { html, nothing, type TemplateResult } from "lit";
import type { CalibrationResult, SessionStatus, StabilityResult } from "../types";

export const formatNumber = (value: number): string => value.toFixed(2);

export function calibrationProgress(
  referenceReady: boolean,
  stability: StabilityResult | null,
  result: CalibrationResult | null,
  plan: "standard" | "full" | null = "full",
): TemplateResult {
  const complete = [referenceReady, Boolean(stability?.stable), Boolean(result), Boolean(result?.gain_evidence), Boolean(result)];
  const active = complete.findIndex((value) => !value);
  const labels = ["Set reference", "Check stability", "Run calibration", "Verify gain"];
  return html`<ol class="progress-steps">${labels.map((label, index) => html`<li
    class=${complete[index] ? "complete" : index === active ? "active" : "pending"}><span
      class="progress-number">${index + 1}</span><span>${label}</span></li>`)}</ol>`;
}

export function calibrationSourceEvidence(
  session: SessionStatus | null,
  instanceIds: string[],
  target: "Voltage" | "Current",
  completedInstanceIds: ReadonlySet<string>,
): TemplateResult {
  const sources = Object.entries(session?.calibration_sources ?? {})
    .filter(([instance]) => instanceIds.includes(instance));
  return html`<section class="measurement-evidence calibration-source" aria-label=${`${target} calibration source`}>
    <h3>Active gain source</h3>
    ${sources.length ? html`<table><thead><tr><th>Chip</th><th>Active gain source</th><th>${target} calibrated this session</th></tr></thead><tbody>
      ${sources.map(([instance, source]) => html`<tr><td>${instance}</td><td>${source === "flash" ? "Saved flash" : source === "configuration" ? "Configuration" : "Unknown"}</td><td>${completedInstanceIds.has(instance) ? "Yes" : "No"}</td></tr>`)}
    </tbody></table><p>ATM90E32 stores voltage and current gains in one table. The active source does not mean this calibration step was completed.</p>` : html`<p>Calibration source is not available.</p>`}
  </section>`;
}

export function stabilityEvidence(result: StabilityResult | null, labels?: string[]): TemplateResult | typeof nothing {
  if (!result) return nothing;
  const unit = result.target === "voltage" ? "V" : "A";
  return html`<section class="measurement-evidence" aria-label=${`${result.target} ${result.target_id} stability evidence`}>
    <h3>Stability evidence · ${result.target_id}</h3>
    ${result.windows.map((window, index) => html`<dl>
      <div><dt>${labels?.[index] ?? (result.target === "voltage" ? `V${index % 3 + 1}` : `A${index + 1}`)}</dt>
        <dd>${window.samples.map((value) => `${formatNumber(value)} ${unit}`).join(", ")}</dd></div>
    </dl>`)}
  </section>`;
}

export function calibrationEvidence(result: CalibrationResult | null): TemplateResult | typeof nothing {
  if (!result) return nothing;
  return html`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${result.iteration}</h3>
    <dl>
        <details><summary>Technical details</summary><div><dt>Backend state</dt><dd>${result.state}</dd></div></details>
      <div><dt>Changed channels</dt><dd>${result.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${result.before_values.map(formatNumber).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${result.after_values.map(formatNumber).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${result.error_percent_values.map((value) => `${formatNumber(value)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${result.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${result.gain_evidence ? html`<h4>Gain evidence · ${result.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${result.gain_evidence.phases?.map((phase) => html`<tr><td>${phase.phase}</td><td>${formatNumber(phase.measured_voltage)}</td><td>${formatNumber(phase.measured_current)}</td><td>${formatNumber(phase.reference_voltage)}</td><td>${formatNumber(phase.reference_current)}</td><td>${phase.old_voltage_gain} → ${phase.new_voltage_gain}</td><td>${phase.old_current_gain} → ${phase.new_current_gain}</td></tr>`) ?? nothing}
      </tbody></table><p>Saved in flash: ${result.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : html`<p>Gain evidence unavailable.</p>`}
  </section>`;
}
