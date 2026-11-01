import { html, nothing, type TemplateResult } from "lit";

import type { WorkflowPhase, WorkflowPhaseId } from "../workflow-model";

const LABELS: Record<WorkflowPhaseId, string> = {
  device: "Choose meter",
  meter: "Configure meter",
  "install-configuration": "Review and install",
  calibration: "Calibrate — optional",
  complete: "Done",
};

export function workflowProgress(
  phases: readonly WorkflowPhase[],
  mobileOpen: boolean,
  toggle: () => void,
  navigateToSetup: () => void,
  busy: boolean,
): TemplateResult {
  const current = phases.find((phase) => phase.status === "current");
  return html`
    <aside class=${mobileOpen ? "workflow mobile-open" : "workflow"}>
      <div class="brand">CircuitSetup</div>
      <nav aria-label="Setup progress">
        <ol>${phases.map((phase) => html`
          <li class=${phase.status}>
            ${phase.id === "device" && phase.status === "completed"
              ? html`<button class="step-button" ?disabled=${busy} @click=${navigateToSetup}>
                  <span class="number">${phase.index + 1}</span><span>Choose another meter</span>
                </button>`
              : html`<div class="step-button" aria-current=${phase.status === "current" ? "step" : nothing}>
                  <span class="number">${phase.index + 1}</span><span>${LABELS[phase.id]}${phase.status === "skipped" ? " · Not needed" : ""}</span>
                </div>`}
          </li>
        `)}</ol>
      </nav>
    </aside>
    <div class="mobile-progress">
      <span>${current
        ? `Phase ${current.index + 1} of ${phases.length} — ${LABELS[current.id]}`
        : "Workflow complete"}</span>
      <button aria-label="Show setup steps" aria-expanded=${mobileOpen} @click=${toggle}>Steps</button>
    </div>
  `;
}
