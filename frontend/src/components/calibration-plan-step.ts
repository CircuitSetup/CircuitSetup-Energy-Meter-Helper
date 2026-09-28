import { html, type TemplateResult } from "lit";
import type { CalibrationPlan } from "../workflow-model";

export function calibrationPlanStep(
  selected: CalibrationPlan,
  choose: (plan: CalibrationPlan) => void,
  back: () => void,
  runtimeOnly: boolean,
  busy: boolean,
): TemplateResult {
  return html`<section class="step-content" aria-labelledby="calibration-plan-heading" aria-busy=${busy ? "true" : "false"}>
    <h2 id="calibration-plan-heading">Choose calibration</h2>
    <p>Verified calibration stays in meter flash until an ESPHome handoff.</p>
    ${runtimeOnly ? html`<section class="info-band" aria-label="Runtime-only capabilities">
      <strong>Meter connected to Home Assistant.</strong>
      <p>ESPHome source editing is unavailable.</p>
      <p>This helper cannot change circuit names, CT models, roles, multipliers, entities, or totals in this mode.</p>
      <p>Calibration is saved in meter flash. A later firmware install may replace it.</p>
      <p>When available, import the meter into ESPHome Device Builder to edit its configuration.</p>
      <p>Current calibration requires a reporting multiplier because authoritative CT inventory is unavailable.</p>
    </section>` : ""}
    <fieldset class="name-mode" ?disabled=${busy}><legend>Calibration plan</legend>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "keep_existing"} @change=${() => choose("keep_existing")}> Keep existing calibration — no live session or safety acknowledgement.</label>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "standard"} @change=${() => choose("standard")}> Standard calibration — preserve existing offset values, then calibrate voltage and current.</label>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "full"} @change=${() => choose("full")}> Full calibration — includes optional offset calibration before voltage and current.</label>
    </fieldset>
    ${busy ? html`<p role="status"><span class="loading-spinner" aria-hidden="true"></span>Loading calibration…</p>` : ""}
    <footer class="action-footer"><button class="secondary" ?disabled=${busy} @click=${back}>Back</button></footer>
  </section>`;
}
