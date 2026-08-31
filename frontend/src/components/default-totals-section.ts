import { html, nothing, type TemplateResult } from "lit";
import type { DefaultTotalsSettings, MeterConfigurationRequest, TotalsInventory } from "../types";

const range = (channels: number[]) => channels.length ? `CT${channels[0]}–CT${channels.at(-1)}` : "No CTs";

export function defaultTotalsSection(
  configuration: MeterConfigurationRequest,
  totals: TotalsInventory,
  readable: boolean,
  writable: boolean,
  update: (configuration: MeterConfigurationRequest) => void,
  graphState: "ready" | "pending" | "invalid" = "ready",
): TemplateResult {
  if (!readable) return html`<section class="default-totals" aria-labelledby="default-totals-heading"><h2 id="default-totals-heading">Default meter totals</h2><p class="info-band" role="status">Native default totals are unavailable for this configuration.</p></section>`;
  const overall = totals.native_sources.find((source) => source.source_id === "overall");
  const boards = totals.native_sources.filter((source) => source.source_id !== "overall");
  const patch = (outputs: DefaultTotalsSettings["overall"], boardIndex?: number) => update({ ...configuration,
    default_totals: boardIndex === undefined
      ? { ...configuration.default_totals, overall: outputs }
      : { ...configuration.default_totals, boards: configuration.default_totals.boards.map((board) => board.board_index === boardIndex ? { ...board, outputs } : board) },
  });
  const control = (label: string, checked: boolean, onChange: (checked: boolean) => void) => html`<label class="default-total-control"><input type="checkbox" role="switch" aria-label=${label} .checked=${checked} ?disabled=${!writable}
    @change=${(event: Event) => onChange((event.target as HTMLInputElement).checked)} />${label.replace(/.* (Watts|Amps|kWh)$/, "$1")}</label>`;
  const boardFormula = boards.map((source) => source.label).join(" + ");
  const boardRanges = boards.map((source) => range(source.leaf_channels)).join(" + ");
  const visibilityUnresolved = !totals.migration.native_visibility_resolved;
  return html`<section class="default-totals" aria-labelledby="default-totals-heading">
    <h2 id="default-totals-heading">Default meter totals</h2>
    ${visibilityUnresolved ? html`<p class="info-band" role="status">Native source visibility is unconfirmed; these controls show requested outputs, not confirmed installed publications.</p>` : nothing}
    ${graphState === "pending" ? html`<p class="info-band" role="status">Updating total graph; current native cards remain available.</p>` : graphState === "invalid" ? html`<p class="warning-band" role="status">Total graph unavailable; native cards show saved draft status and not current dependency results.</p>` : nothing}
    <p>These switches control Home Assistant visibility.</p>
    <ul class="native-total-status" role="status">
      <li>Watts is hidden from Home Assistant when off and retained internally when needed by Overall meter total, enabled kWh, or other totals.</li>
      <li>Amps is hidden from Home Assistant when off and retained internally when needed by Overall meter total or other totals.</li>
      <li>kWh is hidden from Home Assistant when off.</li>
    </ul>
    ${overall ? html`<fieldset class="default-total-card"><legend>Overall meter total (all monitored channels)</legend>
      <p>${boardFormula || "All monitored channels"}. Downstream circuit CTs can double-count the service mains, so this native total is not relabeled Mains.</p>
      <p>Covers: ${boardRanges || range(overall.leaf_channels)}.</p>
      <div class="default-total-controls">
        ${control("Overall meter total Watts", configuration.default_totals.overall.watts, (watts) => patch({ ...configuration.default_totals.overall, watts }))}
        ${control("Overall meter total Amps", configuration.default_totals.overall.amps, (amps) => patch({ ...configuration.default_totals.overall, amps }))}
        ${control("Overall meter total kWh", configuration.default_totals.overall.kwh, (kwh) => patch({ ...configuration.default_totals.overall, kwh }))}
      </div>
    </fieldset>` : nothing}
    ${boards.map((source, boardIndex) => {
      const settings = configuration.default_totals.boards.find((board) => board.board_index === boardIndex)?.outputs;
      if (!settings) return nothing;
      return html`<fieldset class="default-total-card"><legend>${source.label}</legend><p>${range(source.leaf_channels)}</p>
        <div class="default-total-controls">
          ${control(`${source.label} Watts`, settings.watts, (watts) => patch({ ...settings, watts }, boardIndex))}
          ${control(`${source.label} Amps`, settings.amps, (amps) => patch({ ...settings, amps }, boardIndex))}
          ${control(`${source.label} kWh`, settings.kwh, (kwh) => patch({ ...settings, kwh }, boardIndex))}
        </div>
      </fieldset>`;
    })}
  </section>`;
}
