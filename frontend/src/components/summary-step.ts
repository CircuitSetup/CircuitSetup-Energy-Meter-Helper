import { html, type TemplateResult } from "lit";
import type { CalibrationResult, ConfigurationImpact, MeterConfiguration, MeterTopology, RestartVerificationResult, SessionStatus, StabilityResult, TransactionStatus } from "../types";
import type { ConfigurationMode, ExistingConfigurationChoice } from "../workflow-model";
import { technicalDetails } from "./technical-details";
import { legacyTotalsNotice } from "./totals-migration-review";

export interface SummaryOutcomeInput {
  configurationMode: ConfigurationMode;
  legacyChoice: ExistingConfigurationChoice;
  completedWithoutChanges: boolean;
  configurationInstalled?: boolean;
  restart: { source_authority: RestartVerificationResult["source_authority"]; offset_groups?: readonly unknown[]; power_offset_groups?: readonly unknown[] } | null;
  verifiedConfiguration: boolean;
  unmanagedLegacyItems?: readonly string[];
}

export interface SummaryOutcome {
  heading: "Setup complete" | "Review complete";
  configurationStatus: string;
  migrationStatus: string | null;
  calibrationStatus: string;
  authorityMessage: string;
  warnings: string[];
}

export function summaryOutcome(input: SummaryOutcomeInput): SummaryOutcome {
  const offset = Boolean(input.restart?.offset_groups?.length || input.restart?.power_offset_groups?.length);
  const calibrationOnly = input.configurationMode === "legacy_editable" && input.legacyChoice === "calibrate_only";
  const migrated = input.legacyChoice === "manage_with_helper" && input.verifiedConfiguration;
  const warnings = input.unmanagedLegacyItems?.length ? [`Unmanaged legacy items: ${input.unmanagedLegacyItems.join(", ")}.`] : [];
  const heading = input.legacyChoice !== null ? "Review complete" : "Setup complete";
  if (offset) return { heading, configurationStatus: calibrationOnly ? "ESPHome configuration was left untouched." : "Configuration authority is unchanged.", migrationStatus: migrated ? "Migration installed." : null, calibrationStatus: "Offset calibration remains stored in meter flash by design.", authorityMessage: "Offset calibration remains stored in meter flash by design.", warnings: [...warnings, "Offset calibration remains stored in meter flash by design."] };
  if (input.completedWithoutChanges) return { heading, configurationStatus: input.configurationInstalled ? "Configuration installed in ESPHome." : input.configurationMode === "runtime_only" ? "ESPHome source was not changed because no authoritative configuration was available." : calibrationOnly ? "ESPHome configuration was left untouched." : input.verifiedConfiguration ? "Helper-managed configuration was left unchanged." : "Configuration was left unchanged.", migrationStatus: migrated ? "Migration installed." : null, calibrationStatus: "Existing calibration was kept unchanged.", authorityMessage: "No restart-verified calibration record was required.", warnings };
  if (input.configurationMode === "runtime_only") return { heading: "Setup complete", configurationStatus: "ESPHome source was not changed because no authoritative configuration was available.", migrationStatus: null, calibrationStatus: "Calibration is stored in meter flash. Installing firmware may replace it.", authorityMessage: "No authoritative ESPHome source is available.", warnings: [...warnings, "Calibration is stored in meter flash. Installing firmware may replace it."] };
  if (calibrationOnly && input.restart?.source_authority === "configuration") return { heading, configurationStatus: "ESPHome configuration was left untouched.", migrationStatus: null, calibrationStatus: "Calibration gains were saved; the remaining legacy configuration was not migrated.", authorityMessage: "Calibration gains are installed in ESPHome.", warnings };
  if (calibrationOnly) return { heading, configurationStatus: "ESPHome configuration was left untouched.", migrationStatus: null, calibrationStatus: "ESPHome configuration was left untouched.", authorityMessage: "Calibration is stored in meter flash.", warnings: [...warnings, "Calibration is stored in meter flash. Installing firmware may replace it."] };
  if (input.restart?.source_authority === "configuration") return { heading, configurationStatus: "Configuration installed in ESPHome.", migrationStatus: migrated ? "Migration installed." : null, calibrationStatus: "Configuration and calibration are installed in ESPHome.", authorityMessage: "Calibration is stored in ESPHome.", warnings };
  return { heading, configurationStatus: input.verifiedConfiguration ? "Configuration authority is available." : "Configuration authority is unavailable.", migrationStatus: migrated ? "Migration installed." : null, calibrationStatus: "Calibration is stored in meter flash. Installing firmware may replace it.", authorityMessage: "Calibration is stored in meter flash.", warnings: [...warnings, "Calibration is stored in meter flash. Installing firmware may replace it."] };
}

export function summaryStep(topology: MeterTopology | null, session: SessionStatus | null, transaction: TransactionStatus | null, stability: Map<string, StabilityResult>, calibration: Map<string, CalibrationResult>, restart: RestartVerificationResult | null, completedWithoutChanges: boolean, projectVersion: string | null, saveCalibration: () => void, back: () => void, meterConfiguration: MeterConfiguration | null = null, impact: ConfigurationImpact | null = null, finish: () => void = () => undefined, keepCalibrationInFlash: () => void = () => undefined, configurationMode: ConfigurationMode = "helper_managed", legacyChoice: ExistingConfigurationChoice = null, configurationInstalled = false, handoffDeclined = false, sourceConfiguration: MeterConfiguration | null = null): TemplateResult {
  const hasOffsets = Boolean(restart?.offset_groups?.length || restart?.power_offset_groups?.length);
  const handoffAction = !handoffDeclined && restart?.source_authority === "saved_flash" && restart.config_filename && !hasOffsets && (restart.source_handoff_available || restart.source_handoff_firmware_installed);
  const totalsEvidence = meterConfiguration ?? (configurationMode !== "runtime_only" && sourceConfiguration?.capabilities.configuration_authoritative ? sourceConfiguration : null);
  const totalsImpact = meterConfiguration ? impact : totalsEvidence?.configuration_impact ?? null;
  const totalName = (id: string) => totalsEvidence?.total_details.find((total) => total.kind === "aggregate" && total.total_id === id)?.name ?? id;
  const unmanagedLegacyItems = totalsEvidence?.warnings.filter((warning) => warning.includes("unmanaged"));
  const outcome = summaryOutcome({ configurationMode, legacyChoice, completedWithoutChanges, configurationInstalled, restart,
    verifiedConfiguration: meterConfiguration !== null, ...(unmanagedLegacyItems ? { unmanagedLegacyItems } : {}) });
  const boards = (values: boolean[]) => values.flatMap((enabled, board) => enabled ? [board === 0 ? "Main board" : `Add-on ${board}`] : []);
  return html`<section class="step-content" aria-labelledby="step-heading">
    <div class=${restart || completedWithoutChanges ? "success-band" : "recovery-panel"} role="status">${restart || completedWithoutChanges ? outcome.calibrationStatus : html`<strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p>`}</div>
    <dl class="summary-list"><div><dt>Meter topology</dt><dd>${topology?.ct_count ?? "—"} CTs in ${topology?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${projectVersion ?? "Unavailable"}</dd></div><div><dt>Configuration status</dt><dd>${outcome.configurationStatus}</dd></div>${outcome.migrationStatus ? html`<div><dt>Migration</dt><dd>${outcome.migrationStatus}</dd></div>` : ""}<div><dt>Calibration outcome</dt><dd>${outcome.calibrationStatus}</dd></div><div><dt>Calibration authority</dt><dd>${outcome.authorityMessage}</dd></div>${meterConfiguration ? html`<div><dt>Installed electrical profile</dt><dd>${meterConfiguration.configuration.meter.electrical_system.replaceAll("_", " ")} · ${meterConfiguration.configuration.meter.line_frequency_hz} Hz</dd></div><div><dt>Voltage references</dt><dd>${meterConfiguration.configuration.meter.voltage_references.length}</dd></div><div><dt>Used channels</dt><dd>${meterConfiguration.configuration.channels.filter((channel) => channel.enabled).length}</dd></div><div><dt>Installed package scope</dt><dd>PQ: ${boards(meterConfiguration.configuration.power_quality).join(", ") || "none"}; status: ${boards(meterConfiguration.configuration.status_fields).join(", ") || "none"}</dd></div><div><dt>Reporting and entities</dt><dd>${meterConfiguration.configuration.meter.update_interval_s} seconds${impact ? `; ${impact.numeric_entity_count + impact.text_entity_count} public entities, ~${impact.approximate_publications_per_second.toFixed(1)} publications/sec` : ""}</dd></div>` : ""}</dl>
    ${totalsEvidence ? html`<section aria-labelledby="summary-totals-heading"><h2 id="summary-totals-heading">${!meterConfiguration || totalsEvidence.capabilities.reason_codes.includes("totals_adoption_required") ? "Legacy read-only totals" : "Helper-managed totals"}</h2>
      ${!meterConfiguration ? html`<p>Authoritative source snapshot: these totals have not been adopted or verified as installed by this workflow.</p>` : ""}
      ${totalsImpact ? html`<p>${totalsImpact.public_total_entity_count} public total entities; ${totalsImpact.internal_total_sensor_count} internal total sensors; ${totalsImpact.energy_entity_count} public energy entities.</p>` : html`<p>Current total counts are unavailable.</p>`}
      ${!totalsEvidence.totals.migration.native_visibility_resolved ? html`<p>Counts are confirmed but incomplete: native visibility is unresolved.</p>` : ""}
      <p>Public outputs are exposed to Home Assistant. Internal dependencies remain in firmware for other totals or energy integration.</p>
      ${totalsEvidence.total_details.map((total) => html`<article class="total-summary" aria-label=${total.name}>
        <h3>${total.name}</h3>
        <p>${total.ownership === "helper_managed" ? "Helper-managed" : "Read-only source YAML"}</p>
        <p>Public outputs: ${total.public_outputs.join(", ") || "none"}</p>
        ${total.internal_outputs.length ? html`<p>Internal outputs: ${total.internal_outputs.join(", ")}</p>` : ""}
        ${total.unverified_outputs.length ? html`<p>Unverified outputs: ${total.unverified_outputs.join(", ")}</p>` : ""}
        <p>Formula: ${total.formula}</p><p>Coverage: ${total.leaf_channels.map((channel) => `CT${channel}`).join(", ")}</p>
        ${total.parents.length ? html`<p>Feeds into: ${total.parents.join(", ")}</p>` : ""}
      </article>`)}
      <h3>Totals migration</h3>
      ${totalsEvidence.totals.migration.legacy_parent_links.length
        ? html`<ul>${totalsEvidence.totals.migration.legacy_parent_links.map((link) => html`<li>${totalName(link.child_id)} → ${totalName(link.proposed_parent_id)}: pending review</li>`)}</ul>`
        : html`<p>No pending legacy relationships.</p>`}
      ${totalsEvidence.totals.migration.native_visibility_confirmation_required ? html`<p>Native visibility confirmation is pending a verified save.</p>` : ""}
      ${legacyTotalsNotice(totalsEvidence.capabilities)}</section>` : ""}
    ${outcome.warnings.map((warning) => html`<p class="warning-band" role="status">${warning}</p>`)}
    ${technicalDetails(topology, session, transaction, stability, calibration, restart, completedWithoutChanges)}
    <footer class="action-footer"><button class="secondary" @click=${back}>Back</button>${handoffAction ? html`${!restart?.source_handoff_firmware_installed ? html`<button class="secondary" data-action="keep-calibration-flash" @click=${keepCalibrationInFlash}>Keep calibration in meter flash</button>` : ""}<button class="primary" data-action="save-calibration" @click=${saveCalibration}>${restart?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : html`<button class="primary" data-action="finish" @click=${finish}>Finish</button>`}</footer>
  </section>`;
}
