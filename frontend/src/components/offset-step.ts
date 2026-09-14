import { html, nothing, type TemplateResult } from "lit";

import type { MeterTopology, OffsetCalibrationResult, OffsetReadinessResult, OffsetPreparationStatus, SessionStatus } from "../types";
import { moveTab } from "./tab-keyboard";

const boardLabel = (index: number) => index === 0 ? "Main Board" : `Add-on ${index}`;
const groupKeys = (board: number) => board === 0 ? ["main_1", "main_2"] : [`addon${board}_1`, `addon${board}_2`];

export function offsetStep(
  topology: MeterTopology | null,
  session: SessionStatus | null,
  board: number,
  stage: 1 | 2,
  acknowledged: boolean,
  retryConfirmed: boolean,
  readiness: OffsetReadinessResult | null,
  result: OffsetCalibrationResult | null,
  busy: boolean,
  selectBoard: (board: number) => void,
  selectStage: (stage: 1 | 2) => void,
  setAcknowledged: (value: boolean) => void,
  setRetryConfirmed: (value: boolean) => void,
  check: () => void,
  calibrate: () => void,
  reconnect: () => void,
  skip: () => void,
  back: () => void,
  continueOffset: () => void,
  stock: { preparation: OffsetPreparationStatus | null; backupAcknowledged: boolean; setBackup: (value: boolean) => void; firstCalibrationConfirmed: boolean; setFirstCalibrationConfirmed: (value: boolean) => void; prepare: () => void } | null = null,
): TemplateResult {
  const capability = session?.offset_capability;
  const boards = session?.offset_boards ?? [];
  const finalized = session?.offset_disposition === "completed" || session?.offset_disposition === "skipped"
    || session?.offset_disposition === "partial" && session.state === "applied_pending_restart_verification";
  const stageTwoReady = boards.length > 0 && boards.every((item) => item.stages[0]?.state === "completed");
  const stageState = boards[board]?.stages[stage - 1]?.state ?? "not_started";
  const canContinue = finalized || stageState === "completed";
  const preparation = stock?.preparation;
  const nativePreparation = Boolean(stock && (preparation?.mode ?? "native") === "native");
  const selectedInstances = groupKeys(board).map((id) => id.replace("main_", "meter_main"));
  const matching = preparation?.stage === stage && preparation.targets.length > 0 && preparation.targets.every((id) => selectedInstances.includes(id));
  const attempted = Boolean(matching && preparation?.attempted.length);
  const nativeReview = nativePreparation || Boolean(preparation && (!preparation.installed || !preparation.action_ready || attempted));
  const recovery = Boolean(result?.retry_allowed) || stageState === "partial" || stageState === "indeterminate" || attempted && stageState !== "completed";
  const actionReady = !stock || Boolean(matching && preparation?.action_ready && !attempted);
  const unavailable = capability?.status !== "available";
  const keys = groupKeys(board);
  const tableByGroup = new Map(result?.expected_tables ?? []);
  const savedSources = new Map(readiness?.saved_offset_sources ?? []);

  return html`
    <section class="step-content offset-step" aria-labelledby="step-heading">
      ${unavailable ? html`
        <div class="warning-band" role="status">
          <strong>Offset calibration is ${capability?.status === "invalid" ? "not safely available" : "not available on this firmware"}.</strong>
          ${capability?.status === "invalid" ? html`<p>Repair reason: ${capability.repair_reason}</p>` : nothing}
          <p>Skip preserves the offset values already saved in flash. No clear control is invoked.</p>
        </div>
      ` : html`
        <ol class="offset-stage-stepper" aria-label="Offset calibration stages">
          <li class=${stage === 1 ? "active" : stageTwoReady ? "complete" : "pending"}>
            <button data-offset-stage="1" aria-current=${stage === 1 ? "step" : nothing} @click=${() => selectStage(1)}>1. Voltage/current zero offset</button>
          </li>
          <li class=${stage === 2 ? "active" : finalized ? "complete" : "pending"}>
            <button data-offset-stage="2" aria-current=${stage === 2 ? "step" : nothing} ?disabled=${!stageTwoReady}
              @click=${() => selectStage(2)}>2. Active/reactive power offset</button>
          </li>
        </ol>
        <div class="board-tabs" role="tablist" aria-label="Offset calibration boards">
          ${Array.from({ length: topology?.board_count ?? boards.length }, (_, index) => html`
            <button role="tab" data-offset-board id=${`offset-board-tab-${index}`} aria-controls="offset-board-panel"
              aria-selected=${index === board} tabindex=${index === board ? "0" : "-1"}
              @keydown=${(event: KeyboardEvent) => moveTab(event, index)} @click=${() => selectBoard(index)}>
              ${boardLabel(index)}
            </button>
          `)}
        </div>
        <div id="offset-board-panel" role="tabpanel" aria-labelledby=${`offset-board-tab-${board}`}>
          <h2>Optional offset calibration · Stage ${stage} · ${boardLabel(board)}</h2>
          <p>Offset calibration is optional and requires changing the power and wiring state as described below. ${stock ? "Captured values remain pending until reviewed configuration installation and selection are confirmed." : "Offset values remain stored in meter flash."}</p>
          ${stock ? html`<section class="measurement-evidence" aria-label="Offset preparation backup">
            <h3>${nativeReview ? "Native offset readiness" : "Why preparation is required"}</h3>
            <p>${nativeReview ? "The helper uses the meter's native ATM90E32 offset controls; no firmware or zero-offset YAML is installed." : "Before calibration, the helper temporarily installs zero offsets for the selected chips so existing corrections do not affect the new measurements."}</p>
            <p>The helper saves both offset stages for the selected chips in a private recovery backup. It uses fresh meter tables when available; with the first-run confirmation below, a missing table may use the current Device Builder YAML. This is not flash readback, and unknown values stay blocked.</p>
            ${matching && preparation?.installed ? html`<p>${preparation.action_ready ? "Preparation installed in this backend owner." : nativeReview ? "This historical preparation is not authorized by this backend owner. Review native offset readiness again; retained values are not lost." : "Preparation was installed, but this backend owner has not confirmed its receipt. Review the preparation for unfinished chips; retained values are not lost."}</p>` : nothing}
            <label class="check-row"><input type="checkbox" .checked=${stock.backupAcknowledged} @change=${(event: Event) => stock.setBackup((event.target as HTMLInputElement).checked)}> I understand that this step creates a private backup and ${nativeReview ? "uses the meter's native offset controls; no firmware is installed" : "installs a temporary zero-offset configuration"}.</label>
            ${!recovery ? html`<label class="check-row"><input type="checkbox" .checked=${stock.firstCalibrationConfirmed} @change=${(event: Event) => stock.setFirstCalibrationConfirmed((event.target as HTMLInputElement).checked)}> I confirm the selected chips have never had offset calibration applied.</label>` : nothing}
            <button class="secondary" data-action="prepare-offset" ?disabled=${busy || !stock.backupAcknowledged || stageState === "completed" || recovery && !retryConfirmed}
              @click=${stock.prepare}>${recovery ? (nativeReview ? "Review unfinished-chip readiness" : "Review unfinished-chip preparation") : (nativeReview ? "Review native offset readiness" : "Review offset preparation")}</button>
            ${attempted ? html`<p>${nativeReview ? "This run was already attempted. Review unfinished-chip readiness again before retrying; completed values, including zeros, are retained." : "This historical preparation was already attempted. Review the historical preparation again before retrying; completed values, including zeros, are retained."}</p>` : nothing}
          </section>` : nothing}
          <div class="warning-band"><strong>Warning:</strong> An open-circuit current-output CT on a live conductor can be hazardous. De-energize conductors before unplugging any CT.</div>
          ${stage === 1 ? html`
            <p>First, de-energize all conductors. Then unplug the voltage transformer/AC voltage input and CT inputs, power the meter from USB only, then check that every voltage/current phase reads near zero.</p>
          ` : html`
            <p>Power down before rewiring, keep CT inputs unplugged and CTs off current-carrying conductors, connect/enclose/energize only the voltage reference, then check that voltage is present on both chips and every current phase reads near zero.</p>
          `}
          <p>Measurements cannot prove that a transformer or CT is physically unplugged. Physical acknowledgement never substitutes for measured readiness.</p>
          <label class="check-row"><input type="checkbox" .checked=${acknowledged} @change=${(event: Event) => setAcknowledged((event.target as HTMLInputElement).checked)}>
            ${stage === 1 ? "I completed the USB-only, de-energized preparation." : "I powered down for rewiring and safely enclosed and energized only the voltage reference."}
          </label>
          <div class="offset-actions">
            <button class="secondary" data-action="check-offset" ?disabled=${busy || !acknowledged || stageState === "completed"} @click=${check}>
              ${busy ? "Checking measured readiness…" : "Check measured readiness"}
            </button>
            <button class="primary" data-action="calibrate-offset"
              ?disabled=${busy || !actionReady || !acknowledged || !readiness?.ready || stageState === "completed" || !stock && recovery && !retryConfirmed}
              @click=${calibrate}>${result?.retry_allowed ? "Retry unfinished chip" : `Run Stage ${stage} calibration`}</button>
          </div>
          ${readiness ? html`
            <section class="measurement-evidence" aria-label="Offset readiness evidence">
              <h3>Measured readiness</h3>
              <div class=${readiness.ready ? "success-band" : "warning-band"} role="status" aria-live="polite">
                ${readiness.ready ? "Measured readiness passed." : "Measured readiness did not pass. Physical acknowledgement is not enough."}
              </div>
              ${readiness.reasons.length ? html`<ul>${readiness.reasons.map((reason) => html`<li>${reason}</li>`)}</ul>` : nothing}
              <dl class="threshold-grid">
                <div><dt>Samples per phase</dt><dd>${readiness.thresholds.sample_count}</dd></div>
                <div><dt>Zero voltage peak</dt><dd>${readiness.thresholds.zero_voltage_peak_volts} V</dd></div>
                <div><dt>Zero voltage spread</dt><dd>${readiness.thresholds.zero_voltage_spread_volts} V</dd></div>
                <div><dt>Zero current peak</dt><dd>${readiness.thresholds.zero_current_peak_amps} A</dd></div>
                <div><dt>Zero current spread</dt><dd>${readiness.thresholds.zero_current_spread_amps} A</dd></div>
                <div><dt>Voltage present minimum</dt><dd>${readiness.thresholds.voltage_present_minimum_volts} V</dd></div>
                <div><dt>Voltage present spread</dt><dd>${readiness.thresholds.voltage_present_spread_volts} V</dd></div>
              </dl>
              <table class="evidence-table"><thead><tr><th>Phase role</th><th>Quantity</th><th>Status</th><th>Mean</th><th>Peak</th><th>Spread</th></tr></thead><tbody>
                ${readiness.entities.map((entity) => html`<tr><td>${entity.role}</td><td>${entity.quantity}</td><td>${entity.ready ? "Ready" : entity.reasons.join("; ")}</td>
                  <td>${entity.window?.mean ?? "—"}</td><td>${entity.window?.absolute_peak ?? "—"}</td><td>${entity.window?.absolute_spread ?? "—"}</td></tr>`)}
              </tbody></table>
            </section>
          ` : nothing}
          <section class="measurement-evidence" aria-label="Per-chip offset progress" aria-live="polite">
            <h3>Per-chip progress</h3>
            <table><thead><tr><th>Chip</th><th>Previously saved offsets</th><th>This run</th><th>Backend evidence</th></tr></thead><tbody>
              ${keys.map((key) => html`<tr><td>${key}</td>
                <td>${!readiness ? "Check measured readiness to inspect saved offsets."
                  : tableByGroup.has(key) || stageState === "completed" ? "Fresh calibration saved during this session."
                    : savedSources.get(key) === "flash" ? "Saved offsets detected; this run will recalibrate this chip."
                      : savedSources.get(key) === "configuration" ? "Configuration offsets reported; this run will calibrate this chip."
                        : "Saved-offset status unknown; this run still requires fresh calibration."}</td>
                <td>${tableByGroup.has(key) || stageState === "completed" ? stock ? "Captured; pending configuration installation." : "Saved; restart verification required." : result?.unfinished_group_keys.includes(key) ? "Unfinished" : stageState.replaceAll("_", " ")}</td>
                <td>${tableByGroup.has(key) ? tableByGroup.get(key)!.map(([first, second]) => `${first}/${second}`).join(", ") : "—"}</td></tr>`)}
            </tbody></table>
          </section>
          ${recovery ? html`<aside class="recovery-panel" role="status" aria-live="assertive">
            <strong>${result ? result.state === "partial" ? "One chip finished; recovery is required" : "Calibration outcome is indeterminate" : "Recovery is required"}</strong>
            <p>${result?.error ?? "The prior operation did not finish cleanly"}. Reconnect and inspect before retrying only the unfinished chip.</p>
            <label class="check-row"><input type="checkbox" .checked=${retryConfirmed} @change=${(event: Event) => setRetryConfirmed((event.target as HTMLInputElement).checked)}> I reviewed the evidence and confirm this retry.</label>
            <button class="secondary" @click=${reconnect}>Reconnect and inspect</button>
          </aside>` : nothing}
        </div>
      `}
      <footer class="action-footer offset-footer">
        <button class="secondary" ?disabled=${busy} @click=${back}>Back</button>
        <button class="secondary" data-action="skip-offset" ?disabled=${busy || finalized} @click=${skip}>Skip offset calibration</button>
        <button class="primary" ?disabled=${busy || !canContinue} @click=${continueOffset}>Continue</button>
      </footer>
    </section>
  `;
}
