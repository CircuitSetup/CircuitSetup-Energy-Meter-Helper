import { html, type TemplateResult } from "lit";

import type { BoardPackageOptions, PackageCapability } from "../types";

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
  capabilities: PackageCapability[] = [],
): TemplateResult {
  const capability = (feature: keyof BoardPackageOptions, board: number) => capabilities.find((item) => item.feature === feature && item.board_index === board);
  const reason = (feature: keyof BoardPackageOptions, board: number): string | null => {
    const item = capability(feature, board);
    if (!item) return null;
    if (item.state === "already_present") return "Already included";
    if (item.state === "available_to_prepare") return "Can be prepared";
    return item.reason_code === "unsupported_package_source" ? "Read-only: unsupported package source"
      : item.reason_code === "ambiguous_package_source" ? "Read-only: multiple package sources"
        : "Read-only: package source cannot be managed safely";
  };
  return html`<section class="package-options" aria-labelledby="package-options-heading">
    <h2 id="package-options-heading">Optional meter fields</h2>
    <p>Choose which meter boards include additional firmware measurements.</p>
    <p>Power quality adds reactive power, apparent power, and power factor for each used CT for the CircuitSetup Energy Analyzer. Status diagnostics remain available through the native API and are disabled by default in Home Assistant.</p>
    <table class="package-options-table">
      <thead><tr><th scope="col">Board</th>${FEATURES.map(([_feature, label]) => html`<th scope="col">${label}</th>`)}</tr></thead>
      <tbody>
        <tr><th scope="row">All boards</th>${FEATURES.map(([feature, label]) => {
          const states = options[feature];
          const all = states.every(Boolean);
          const blocked = states.some((_state, board) => capability(feature, board)?.state === "cannot_safely_manage");
          return html`<td><input type="checkbox" data-all-feature=${feature} aria-label=${`All boards ${label}`}
            ?disabled=${blocked} title=${blocked ? "Some boards are read-only" : ""}
            .checked=${all} .indeterminate=${states.some(Boolean) && !all}
            @change=${(event: Event) => change({ ...options,
              [feature]: states.map(() => (event.currentTarget as HTMLInputElement).checked), })} /></td>`;
        })}</tr>
        ${options.power_quality.map((_enabled, board) => html`<tr>
          <th scope="row">${board === 0 ? "Main board" : `Add-on ${board}`}</th>
          ${FEATURES.map(([feature, label]) => { const disabled = capability(feature, board)?.state === "cannot_safely_manage"; const status = reason(feature, board); return html`<td><input type="checkbox" data-feature=${feature} data-board=${board}
            aria-label=${`${board === 0 ? "Main board" : `Add-on ${board}`} ${label}`} .checked=${options[feature][board] ?? false}
            ?disabled=${disabled} title=${status ?? ""}
            @change=${(event: Event) => change({ ...options,
              [feature]: options[feature].map((value, index) => index === board ? (event.currentTarget as HTMLInputElement).checked : value), })} /></td>`; })}
        </tr>`)}
      </tbody>
    </table>
  </section>`;
}
