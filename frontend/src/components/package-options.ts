import { html, type TemplateResult } from "lit";

import type { BoardPackageOptions } from "../types";

const FEATURES: Array<[keyof BoardPackageOptions, string]> = [
  ["power_quality", "Power quality sensors"],
  ["status_fields", "Status fields"],
];

export const newInstallPackageOptions = (addonCount: number): BoardPackageOptions => ({
  power_quality: Array(addonCount + 1).fill(false) as boolean[],
  status_fields: [true, ...Array(addonCount).fill(false)] as boolean[],
});

export const resizePackageOptions = (
  options: BoardPackageOptions,
  addonCount: number,
): BoardPackageOptions => {
  const defaults = newInstallPackageOptions(addonCount);
  return {
    power_quality: defaults.power_quality.map((value, index) => options.power_quality[index] ?? value),
    status_fields: defaults.status_fields.map((value, index) => options.status_fields[index] ?? value),
  };
};

export function packageOptions(
  options: BoardPackageOptions,
  change: (options: BoardPackageOptions) => void,
): TemplateResult {
  return html`<section class="package-options" aria-labelledby="package-options-heading">
    <h2 id="package-options-heading">Optional meter fields</h2>
    <p>Choose which meter boards expose additional power quality and status entities.</p>
    ${FEATURES.map(([feature, label]) => {
      const states = options[feature];
      const all = states.every(Boolean);
      const mixed = states.some(Boolean) && !all;
      return html`<fieldset class="choice-field feature-options">
        <legend>${label}</legend>
        <label>
          <input type="checkbox" data-all-feature=${feature}
            .checked=${all} .indeterminate=${mixed}
            @change=${(event: Event) => change({
              ...options,
              [feature]: states.map(() => (event.currentTarget as HTMLInputElement).checked),
            })} />
          <span>All boards</span>
        </label>
        ${states.map((enabled, board) => html`<label>
          <input type="checkbox" data-feature=${feature} data-board=${board}
            .checked=${enabled}
            @change=${(event: Event) => change({
              ...options,
              [feature]: states.map((value, index) => index === board
                ? (event.currentTarget as HTMLInputElement).checked : value),
            })} />
          <span>${board === 0 ? "Main board" : `Add-on ${board}`}</span>
        </label>`)}
      </fieldset>`;
    })}
  </section>`;
}
