import { html, type TemplateResult } from "lit";
import type { CalibrationResult, MeterTopology, RestartVerificationResult, SessionStatus, StabilityResult, TransactionStatus } from "../types";
import { technicalDetails } from "./technical-details";

export function summaryStep(topology: MeterTopology | null, session: SessionStatus | null, transaction: TransactionStatus | null,
  stability: Map<string, StabilityResult>, calibration: Map<string, CalibrationResult>, restart: RestartVerificationResult | null,
  completedWithoutChanges: boolean, projectVersion: string | null, saveCalibration: () => void,
  back: () => void): TemplateResult {
  const hasOffsets = Boolean(restart?.offset_groups?.length || restart?.power_offset_groups?.length);
  const handoffAction = restart?.source_authority === "saved_flash" && restart.config_filename
    && !hasOffsets && (restart.source_handoff_available || restart.source_handoff_firmware_installed);
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      ${restart && hasOffsets
        ? html`<div class="success-band" role="status">Setup and exact restart verification are complete. Offset calibration remains saved in flash; YAML handoff and flash clearing are unavailable.</div>`
        : restart?.source_authority === "configuration"
        ? html`<div class="success-band" role="status">Calibration saved to YAML; flash values cleared.</div>`
        : restart ? html`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>`
        : completedWithoutChanges ? html`<div class="success-band" role="status">Completed without calibration changes. No restart or restart-verified calibration record was required.</div>`
        : html`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${topology?.ct_count ?? "—"} CTs in ${topology?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${projectVersion ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${restart?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${restart?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${technicalDetails(topology, session, transaction, stability, calibration, restart, completedWithoutChanges)}
      <footer class="action-footer"><button class="secondary" @click=${back}>Back</button>
        ${handoffAction ? html`<button class="primary" data-action="save-calibration" @click=${saveCalibration}>${restart?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : ""}
      </footer>
    </section>
  `;
}
