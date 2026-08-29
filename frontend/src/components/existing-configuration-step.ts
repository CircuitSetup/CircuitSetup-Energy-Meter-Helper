import { html, nothing, type TemplateResult } from "lit";
import type { MeterConfiguration } from "../types";

const warningCopy: Record<string, string> = {
  electrical_profile_requires_confirmation: "The electrical profile was inferred and must be reviewed before migration.",
  legacy_generic_totals_unmanaged: "Existing generic totals will be preserved unless the reviewed migration explicitly replaces them.",
  stored_semantics_stale: "The ESPHome source changed after the last helper save, so the live source was read again.",
};

export function existingConfigurationStep(
  configuration: MeterConfiguration,
  onManage: () => void,
  onCalibrateOnly: () => void,
  onBack: () => void,
): TemplateResult {
  if (!configuration.capabilities.configuration_authoritative
    || configuration.capabilities.semantic_source !== "legacy_inferred") return html``;
  const warnings = [...new Set([...configuration.warnings, ...configuration.capabilities.reason_codes])];
  return html`<section class="existing-configuration" aria-labelledby="existing-configuration-heading">
    <h2 id="existing-configuration-heading">Review Existing Setup</h2>
    <p>This meter already has an ESPHome configuration. Choose whether to manage its configuration with this helper or leave it unchanged.</p>
    <dl class="status-list">
      <div><dt>Read directly</dt><dd>Names, substitutions, current gains, line frequency, reporting interval, package state, and physical topology.</dd></div>
      <div><dt>Inferred or not recorded</dt><dd>Electrical profile, transformer and CT identity, used channels, circuit roles, and aggregate intent.</dd></div>
      <div><dt>Preserved if you do not migrate</dt><dd>The existing ESPHome configuration and unowned YAML remain unchanged.</dd></div>
    </dl>
    ${warnings.length ? html`<div class="warning-band" role="note"><strong>Review notes</strong><ul>${warnings.map((warning) => html`<li>${warningCopy[warning] ?? "Some legacy settings could not be identified and must be reviewed."}</li>`)}</ul><details><summary>Technical details</summary><code>${warnings.join(", ")}</code></details></div>` : nothing}
    <div class="action-footer"><button class="primary" @click=${onManage}>Review and manage with helper</button><button class="secondary" @click=${onCalibrateOnly}>Keep ESPHome configuration and calibrate only</button><button class="secondary" @click=${onBack}>Back</button></div>
  </section>`;
}
