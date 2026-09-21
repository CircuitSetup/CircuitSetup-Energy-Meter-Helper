import { html, nothing, type TemplateResult } from "lit";
import type { MeterConfiguration, ExistingDeviceCandidate, ExistingMeterInspection } from "../types";

export interface ExistingConfigurationMetadata {
  configurationFilename: string;
  projectName: string;
  projectVersion: string;
  boardCount: number;
  ctCount: number;
}

const warningCopy: Record<string, string> = {
  electrical_profile_requires_confirmation: "Electrical profile was inferred. Confirm it before applying changes.",
  legacy_generic_totals_unmanaged: "Existing generic totals stay unchanged unless you replace them.",
  stored_semantics_stale: "ESPHome source changed since the last helper save; the live source was read again.",
  config_contract_upgrade_required: "Configuration needs a helper contract update. Review it before applying.",
};

export function existingConfigurationStep(
  configuration: MeterConfiguration,
  metadata: ExistingConfigurationMetadata,
  onManage: () => void,
  onCalibrateOnly: () => void,
  onBack: () => void,
): TemplateResult {
  if (!configuration.capabilities.configuration_authoritative
    || configuration.capabilities.semantic_source !== "legacy_inferred") return html``;
  const warnings = [...new Set([...configuration.warnings, ...configuration.capabilities.reason_codes])];
  return html`<section class="existing-configuration" aria-label="Review Existing Setup">
    <p class="info-band"><strong>${warnings.includes("stored_semantics_stale") ? "Configuration changed externally" : "Ready for setup"}</strong></p>
    <p>This meter already has an ESPHome configuration. Manage it here or leave it unchanged.</p>
    <dl class="status-list">
      <div><dt>ESPHome configuration</dt><dd>${metadata.configurationFilename}</dd></div>
      <div><dt>Project</dt><dd>${metadata.projectName} · ${metadata.projectVersion}</dd></div>
      <div><dt>Detected hardware</dt><dd>${metadata.boardCount} ${metadata.boardCount === 1 ? "board" : "boards"} · ${metadata.ctCount} CT inputs</dd></div>
    </dl>
    <dl class="status-list">
      <div><dt>Read directly</dt><dd>Names, substitutions, current gains, line frequency, reporting interval, package state, and physical topology.</dd></div>
      <div><dt>Inferred or not recorded</dt><dd>Electrical profile, transformer and CT identity, used channels, circuit roles, and aggregate intent.</dd></div>
      <div><dt>Existing settings</dt><dd>Current gains, reporting multipliers, totals, and unowned YAML stay unchanged unless reviewed changes replace them.</dd></div>
    </dl>
    <dl class="status-list">
      <div><dt>What setup records</dt><dd>Reviewed meter profile, circuit settings, helper totals, and package options become helper-managed.</dd></div>
      <div><dt>What to confirm</dt><dd>Confirm settings the source cannot establish, such as CT identity and circuit purpose. Keep existing CT gains without choosing a replacement model.</dd></div>
    </dl>
    ${warnings.length ? html`<div class="warning-band" role="note"><strong>Review notes</strong><ul>${warnings.map((warning) => html`<li>${warningCopy[warning] ?? "Some settings could not be identified from the source and need review."}</li>`)}</ul><details><summary>Technical details</summary><code>${warnings.join(", ")}</code></details></div>` : nothing}
    <div class="action-footer"><button class="secondary" @click=${onBack}>Back</button><button class="secondary" @click=${onCalibrateOnly}>Keep ESPHome configuration and calibrate only</button><button class="primary" @click=${onManage}>Review and manage with helper</button></div>
  </section>`;
}

export function existingMeterInspection(
  candidates: ExistingDeviceCandidate[],
  inspection: ExistingMeterInspection | null,
  busyAction: string,
  find: () => void,
  inspect: (deviceId: string) => void,
  adopt: (deviceId: string) => void,
  searched = false,
): TemplateResult {
  return html`<section class="existing-inspection" aria-labelledby="find-existing-heading">
    <h3 id="find-existing-heading">Find another ESPHome meter</h3>
    <p>Checks one selected ESPHome entry before adoption. It does not install firmware.</p>
    <button class="secondary" data-action="find-existing" ?disabled=${Boolean(busyAction)} @click=${find}>
      ${busyAction === "find-existing" ? "Finding meters…" : "Find another ESPHome meter"}
    </button>
    ${searched && !candidates.length ? html`<p class="info-band" role="status">Could not find any more CircuitSetup energy meters</p>` : nothing}
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
