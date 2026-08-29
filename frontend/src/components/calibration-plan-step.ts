import { html, type TemplateResult } from "lit";
import type { CalibrationPlan } from "../workflow-model";

export function calibrationPlanStep(
  selected: CalibrationPlan,
  choose: (plan: CalibrationPlan) => void,
  back: () => void,
): TemplateResult {
  return html`<section class="step-content" aria-labelledby="calibration-plan-heading">
    <h2 id="calibration-plan-heading">Choose calibration</h2>
    <p>Calibration values stay in meter flash until a verified ESPHome handoff is available.</p>
    <fieldset><legend>Calibration plan</legend>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "keep_existing"} @change=${() => choose("keep_existing")}> Keep existing calibration — no live session or safety acknowledgement.</label>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "standard"} @change=${() => choose("standard")}> Standard calibration — preserve existing offset values, then calibrate voltage and current.</label>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "full"} @change=${() => choose("full")}> Full calibration — includes optional offset calibration before voltage and current.</label>
    </fieldset>
    <footer class="action-footer"><button class="secondary" @click=${back}>Back</button></footer>
  </section>`;
}
