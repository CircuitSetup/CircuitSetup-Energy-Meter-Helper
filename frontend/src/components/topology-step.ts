import { html, type TemplateResult } from "lit";
import type { CalibrationPreparationCapability, MeterTopology } from "../types";

export function topologyMismatch(topology: MeterTopology): boolean {
  const expected = topology.addon_count;
  const sources = topology.evidence.map((item) => item.source);
  return expected < 0 || expected > 6
    || topology.board_count !== expected + 1
    || topology.ct_count !== 6 * (expected + 1)
    || topology.group_count !== 2 * (expected + 1)
    || topology.evidence.length < 1
    || topology.evidence.length > 5
    || new Set(sources).size !== sources.length
    || !sources.some((source) => ["config_project", "config_packages", "native_project"].includes(source))
    || topology.evidence.some((item) => item.addon_count !== expected);
}

export function topologyStep(topology: MeterTopology, projectVersion: string | null, back: () => void, continueFlow: () => void, forceMismatch = false, busy = false, calibrationPreparation: CalibrationPreparationCapability | null = null, prepareCalibration: () => void = () => undefined): TemplateResult {
  const mismatch = forceMismatch || topologyMismatch(topology);
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      <p class="info-band">Detected ${topology.board_count} boards with ${topology.ct_count} CTs on a ${topology.connection_type} connection. ${mismatch ? "The detected hardware does not agree." : "The detected hardware agrees."}</p>
      <details>
        <summary>Technical details</summary>
        <dl>
          <div><dt>Project</dt><dd>${topology.project_name}</dd></div>
          <div><dt>Version</dt><dd>${projectVersion ?? "unavailable"}</dd></div>
          <div><dt>Measurement groups</dt><dd>${topology.group_count}</dd></div>
        </dl>
        <table class="evidence-table">
          <thead><tr><th>Source</th><th>Add-ons</th><th>Evidence</th></tr></thead>
          <tbody>${topology.evidence.map((item) => html`
            <tr><td>${item.source.replaceAll("_", " ")}</td><td>${item.addon_count}</td><td>${item.detail}</td></tr>
          `)}</tbody>
        </table>
      </details>
      ${mismatch ? html`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : html`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      ${!mismatch && calibrationPreparation?.state === "available_to_prepare" ? html`
        <div class="info-band" role="status">
          <strong>Calibration controls are missing from this firmware configuration.</strong>
          <span>Review the official calibration package and its literal enable flags before installing.</span>
          <button class="secondary" data-action="prepare-calibration" ?disabled=${busy} @click=${prepareCalibration}>
            ${busy ? "Preparing calibration controls…" : "Prepare reviewed official calibration controls"}
          </button>
        </div>
      ` : !mismatch && calibrationPreparation?.state === "cannot_safely_manage" ? html`
        <div class="warning-band" role="status">
          Calibration preparation is unavailable: ${calibrationPreparation.reason_code.replaceAll("_", " ")}.
        </div>
      ` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${back}>Back</button>
        ${mismatch ? "" : html`<button class="primary" data-action="continue" ?disabled=${busy} @click=${continueFlow}>${busy ? "Loading CTs…" : "Continue"}</button>`}
      </footer>
    </section>
  `;
}
