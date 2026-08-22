import { html, type TemplateResult } from "lit";
import type { MeterTopology } from "../types";

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

export function topologyStep(topology: MeterTopology, projectVersion: string | null, back: () => void, continueFlow: () => void, forceMismatch = false): TemplateResult {
  const mismatch = forceMismatch || topologyMismatch(topology);
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="identity-strip">
        <strong>${topology.project_name}</strong>
        <span>Version ${projectVersion ?? "unavailable"}</span>
        <span>${topology.board_count} boards</span><span>${topology.ct_count} CTs</span>
        <span>${topology.group_count} groups</span><span>${topology.connection_type}</span>
      </div>
      <h2>Topology evidence</h2>
      <table class="evidence-table">
        <thead><tr><th>Source</th><th>Add-ons</th><th>Evidence</th></tr></thead>
        <tbody>${topology.evidence.map((item) => html`
          <tr><td>${item.source.replaceAll("_", " ")}</td><td>${item.addon_count}</td><td>${item.detail}</td></tr>
        `)}</tbody>
      </table>
      ${mismatch ? html`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : html`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${back}>Back</button>
        ${mismatch ? "" : html`<button class="primary" data-action="continue" @click=${continueFlow}>Continue</button>`}
      </footer>
    </section>
  `;
}
