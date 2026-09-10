import { html, type TemplateResult } from "lit";

import type { ExistingDeviceCandidate, ExistingMeterInspection } from "../types";

export function existingConfigurationStep(
  candidates: ExistingDeviceCandidate[],
  inspection: ExistingMeterInspection | null,
  busyAction: string,
  find: () => void,
  inspect: (deviceId: string) => void,
  adopt: (deviceId: string) => void,
): TemplateResult {
  return html`<section class="existing-inspection" aria-labelledby="find-existing-heading">
    <h3 id="find-existing-heading">Find another ESPHome meter</h3>
    <p>This checks one selected ESPHome entry before it can be adopted. It does not install firmware.</p>
    <button class="secondary" data-action="find-existing" ?disabled=${Boolean(busyAction)} @click=${find}>
      ${busyAction === "find-existing" ? "Finding meters…" : "Find another ESPHome meter"}
    </button>
    ${candidates.length ? html`<div class="meter-list">
      ${candidates.map((candidate) => html`<div class="meter-row">
        <span><strong>${candidate.title}</strong><small>${candidate.project_name ?? "Project label unavailable"}${candidate.project_version ? ` · ${candidate.project_version}` : ""}</small></span>
        <span>${candidate.compatibility.join(", ")}</span>
        <button class="primary" data-action="inspect-existing" ?disabled=${Boolean(busyAction)} @click=${() => inspect(candidate.entry_id)}>
          ${busyAction === `inspect:${candidate.entry_id}` ? "Inspecting…" : "Inspect"}
        </button>
      </div>`)}
    </div>` : ""}
    ${inspection ? html`<div class="info-band" role="status">
      <strong>${inspection.device.title} passed inspection.</strong>
      <span>${inspection.topology.board_count} board${inspection.topology.board_count === 1 ? "" : "s"}; live meter-chip communication corroborated.</span>
      <button class="primary" data-action="adopt-inspected" ?disabled=${Boolean(busyAction)} @click=${() => adopt(inspection.device.entry_id)}>
        ${busyAction === `adopt:${inspection.device.entry_id}` ? "Adopting…" : "Adopt inspected meter"}
      </button>
    </div>` : ""}
  </section>`;
}
