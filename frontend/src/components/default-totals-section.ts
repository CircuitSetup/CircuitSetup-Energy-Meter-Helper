import { html, nothing, type TemplateResult } from "lit";
import { confirmTotalOutputRemoval } from "./total-output-removal";
import type { DefaultTotalsSettings, MeterConfigurationRequest, TotalsInventory } from "../types";

const range = (channels: number[]) => channels.length ? `CT${channels[0]}–CT${channels.at(-1)}` : "No CTs";

export function defaultTotalsSection(
  configuration: MeterConfigurationRequest,
  totals: TotalsInventory,
  readable: boolean,
  writable: boolean,
  update: (configuration: MeterConfigurationRequest) => void,
  graphState: "ready" | "pending" | "invalid" = "ready",
  reasonCodes: readonly string[] = [],
  existingConfiguration: MeterConfigurationRequest | null = null,
): TemplateResult {
  if (!readable) return html`<section class="default-totals" aria-labelledby="default-totals-heading"><h2 id="default-totals-heading">Default meter totals</h2><p class="info-band" role="status">Native default totals are unavailable for this configuration.</p></section>`;
  const custom = totals.native_sources.filter((source) => reasonCodes.includes(`native_total_custom_formula:${source.source_id}`));
  const overall = totals.native_sources.find((source) => source.source_id === "overall" && !custom.includes(source));
  const boards = totals.native_sources.filter((source) => source.source_id !== "overall");
  const patch = (outputs: DefaultTotalsSettings["overall"], boardIndex?: number) => update({ ...configuration,
    default_totals: boardIndex === undefined
      ? { ...configuration.default_totals, overall: outputs }
      : { ...configuration.default_totals, boards: configuration.default_totals.boards.map((board) => board.board_index === boardIndex ? { ...board, outputs } : board) },
  });
  const control = (label: string, checked: boolean, onChange: (checked: boolean) => void, published?: boolean) => html`<label class="default-total-control"><input type="checkbox" role="switch" aria-label=${label} .checked=${checked} ?disabled=${!writable}
    @change=${(event: Event) => {
      const input = event.target as HTMLInputElement;
      if (!writable || !confirmTotalOutputRemoval(label, published, input.checked)) { input.checked = checked; return; }
      onChange(input.checked);
    }} />${label.replace(/.* (Watts|Amps|kWh)$/, "$1")}</label>`;
  const boardFormula = boards.map((source) => source.label).join(" + ");
  const boardRanges = boards.map((source) => range(source.leaf_channels)).join(" + ");
  const visibilityUnresolved = !totals.migration.native_visibility_resolved;
  return html`<section class="default-totals" aria-labelledby="default-totals-heading">
    <h2 id="default-totals-heading">Default meter totals</h2>
    ${custom.map((source) => html`<p class="info-band" role="status">${source.label} uses a custom formula. Edit recognized circuits under Advanced totals; other formulas require ESPHome Device Builder.</p>`)}
    ${visibilityUnresolved ? html`<p class="info-band" role="status">Native source visibility is unconfirmed; these controls show requested outputs, not confirmed installed publications.</p>` : nothing}
    ${graphState === "pending" ? html`<p class="info-band" role="status">Updating total graph; current native cards remain available.</p>` : graphState === "invalid" ? html`<p class="warning-band" role="status">Total graph unavailable; native cards show saved draft status and not current dependency results.</p>` : nothing}
    <p>Watts and Amps control Home Assistant visibility. kWh adds or removes the energy sensor.</p>
    <ul class="native-total-status" role="status">
      <li>Watts is hidden from Home Assistant when off and retained internally when needed by Overall meter total, enabled kWh, or other totals.</li>
      <li>Amps is hidden from Home Assistant when off and retained internally when needed by Overall meter total or other totals.</li>
      <li>kWh is checked when an energy sensor exists, including a hidden sensor. Turning it off removes that energy sensor.</li>
    </ul>
    ${overall ? html`<fieldset class="default-total-card"><legend>Overall meter total (all monitored channels)</legend>
      <p>${boardFormula || "All monitored channels"}. Downstream circuit CTs can double-count the service mains, so this native total is not relabeled Mains.</p>
      <p>Covers: ${boardRanges || range(overall.leaf_channels)}.</p>
      <div class="default-total-controls">
        ${control("Overall meter total Watts", configuration.default_totals.overall.watts, (watts) => patch({ ...configuration.default_totals.overall, watts }), existingConfiguration?.default_totals.overall.watts)}
        ${control("Overall meter total Amps", configuration.default_totals.overall.amps, (amps) => patch({ ...configuration.default_totals.overall, amps }), existingConfiguration?.default_totals.overall.amps)}
        ${control("Overall meter total kWh", configuration.default_totals.overall.kwh, (kwh) => patch({ ...configuration.default_totals.overall, kwh }), existingConfiguration?.default_totals.overall.kwh)}
      </div>
    </fieldset>` : nothing}
    ${boards.map((source, boardIndex) => {
      if (custom.includes(source)) return nothing;
      const settings = configuration.default_totals.boards.find((board) => board.board_index === boardIndex)?.outputs;
      if (!settings) return nothing;
      const published = existingConfiguration?.default_totals.boards.find((board) => board.board_index === boardIndex)?.outputs;
      return html`<fieldset class="default-total-card"><legend>${source.label}</legend><p>${range(source.leaf_channels)}</p>
        <div class="default-total-controls">
          ${control(`${source.label} Watts`, settings.watts, (watts) => patch({ ...settings, watts }, boardIndex), published?.watts)}
          ${control(`${source.label} Amps`, settings.amps, (amps) => patch({ ...settings, amps }, boardIndex), published?.amps)}
          ${control(`${source.label} kWh`, settings.kwh, (kwh) => patch({ ...settings, kwh }, boardIndex), published?.kwh)}
        </div>
      </fieldset>`;
    })}
  </section>`;
}
