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
    <p>Power quality sensors are used with the CircuitSetup Energy Analyzer. Enable them for the boards you want to analyze.</p>
    <table class="package-options-table">
      <thead><tr><th scope="col">Board</th>${FEATURES.map(([_feature, label]) => html`<th scope="col">${label}</th>`)}</tr></thead>
      <tbody>
        <tr><th scope="row">All boards</th>${FEATURES.map(([feature, label]) => {
          const states = options[feature];
          const all = states.every(Boolean);
          return html`<td><input type="checkbox" data-all-feature=${feature} aria-label=${`All boards ${label}`}
            .checked=${all} .indeterminate=${states.some(Boolean) && !all}
            @change=${(event: Event) => change({ ...options,
              [feature]: states.map(() => (event.currentTarget as HTMLInputElement).checked), })} /></td>`;
        })}</tr>
        ${options.power_quality.map((_enabled, board) => html`<tr>
          <th scope="row">${board === 0 ? "Main board" : `Add-on ${board}`}</th>
          ${FEATURES.map(([feature, label]) => html`<td><input type="checkbox" data-feature=${feature} data-board=${board}
            aria-label=${`${board === 0 ? "Main board" : `Add-on ${board}`} ${label}`} .checked=${options[feature][board] ?? false}
            @change=${(event: Event) => change({ ...options,
              [feature]: options[feature].map((value, index) => index === board ? (event.currentTarget as HTMLInputElement).checked : value), })} /></td>`)}
        </tr>`)}
      </tbody>
    </table>
  </section>`;
}
