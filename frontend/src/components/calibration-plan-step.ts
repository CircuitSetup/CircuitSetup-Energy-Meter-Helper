import { html, type TemplateResult } from "lit";
import type { CalibrationPlan } from "../workflow-model";

export function calibrationPlanStep(
  selected: CalibrationPlan,
  choose: (plan: CalibrationPlan) => void,
  back: () => void,
  runtimeOnly = false,
): TemplateResult {
  return html`<section class="step-content" aria-labelledby="calibration-plan-heading">
    <h2 id="calibration-plan-heading">Choose calibration</h2>
    <p>Calibration values stay in meter flash until a verified ESPHome handoff is available.</p>
    ${runtimeOnly ? html`<section class="info-band" aria-label="Runtime-only capabilities">
      <strong>The meter is connected to Home Assistant.</strong>
      <p>ESPHome source editing is unavailable.</p>
      <p>Circuit names, CT models, roles, multipliers, entities, and totals cannot be changed by this helper in this mode.</p>
      <p>Supported calibration is saved in meter flash. Installing firmware later may replace flash-only calibration.</p>
      <p>Importing the meter into ESPHome Device Builder, when available, is the path to editable configuration.</p>
      <p>Current calibration requires confirmation of the reporting multiplier because no authoritative CT inventory is available.</p>
    </section>` : ""}
    <fieldset class="name-mode"><legend>Calibration plan</legend>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "keep_existing"} @change=${() => choose("keep_existing")}> Keep existing calibration — no live session or safety acknowledgement.</label>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "standard"} @change=${() => choose("standard")}> Standard calibration — preserve existing offset values, then calibrate voltage and current.</label>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "full"} @change=${() => choose("full")}> Full calibration — includes optional offset calibration before voltage and current.</label>
    </fieldset>
    <footer class="action-footer"><button class="secondary" @click=${back}>Back</button></footer>
  </section>`;
}
