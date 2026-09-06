import { html, nothing, type TemplateResult } from "lit";
import type { MeterConfiguration } from "../types";

export interface ExistingConfigurationMetadata {
  configurationFilename: string;
  projectName: string;
  projectVersion: string;
  boardCount: number;
  ctCount: number;
}

const warningCopy: Record<string, string> = {
  electrical_profile_requires_confirmation: "The electrical profile was inferred. Confirm it before applying changes.",
  legacy_generic_totals_unmanaged: "Existing generic totals will be preserved unless you explicitly choose to replace them.",
  stored_semantics_stale: "The ESPHome source changed after the last helper save, so the live source was read again.",
  config_contract_upgrade_required: "This configuration needs a helper contract update for additional editing capabilities. Review any proposed update before applying it.",
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
    <p>This meter already has an ESPHome configuration. Choose whether to manage its configuration with this helper or leave it unchanged.</p>
    <dl class="status-list">
      <div><dt>ESPHome configuration</dt><dd>${metadata.configurationFilename}</dd></div>
      <div><dt>Project</dt><dd>${metadata.projectName} · ${metadata.projectVersion}</dd></div>
      <div><dt>Detected hardware</dt><dd>${metadata.boardCount} ${metadata.boardCount === 1 ? "board" : "boards"} · ${metadata.ctCount} CT inputs</dd></div>
    </dl>
    <dl class="status-list">
      <div><dt>Read directly</dt><dd>Names, substitutions, current gains, line frequency, reporting interval, package state, and physical topology.</dd></div>
      <div><dt>Inferred or not recorded</dt><dd>Electrical profile, transformer and CT identity, used channels, circuit roles, and aggregate intent.</dd></div>
      <div><dt>Existing settings</dt><dd>Current gains, reporting multipliers, totals, and unowned YAML are preserved unless your reviewed changes explicitly replace them.</dd></div>
    </dl>
    <dl class="status-list">
      <div><dt>What setup records</dt><dd>The reviewed meter profile, circuit settings, helper-owned totals, and package options become helper-managed.</dd></div>
      <div><dt>What to confirm</dt><dd>Confirm settings the source cannot establish, such as CT identity and circuit purpose. Existing CT gains can be kept without choosing a replacement model.</dd></div>
    </dl>
    ${warnings.length ? html`<div class="warning-band" role="note"><strong>Review notes</strong><ul>${warnings.map((warning) => html`<li>${warningCopy[warning] ?? "Some settings could not be identified from the source and need review."}</li>`)}</ul><details><summary>Technical details</summary><code>${warnings.join(", ")}</code></details></div>` : nothing}
    <div class="action-footer"><button class="secondary" @click=${onBack}>Back</button><button class="secondary" @click=${onCalibrateOnly}>Keep ESPHome configuration and calibrate only</button><button class="primary" @click=${onManage}>Review and manage with helper</button></div>
  </section>`;
}
