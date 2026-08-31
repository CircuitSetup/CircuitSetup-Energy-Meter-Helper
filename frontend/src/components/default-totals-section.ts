import { html, nothing, type TemplateResult } from "lit";
import type { DefaultTotalsSettings, MeterConfigurationRequest, TotalGraphPreview, TotalsInventory } from "../types";

const range = (channels: number[]) => channels.length ? `CT${channels[0]}–CT${channels.at(-1)}` : "No CTs";

export function defaultTotalsSection(
  configuration: MeterConfigurationRequest,
  totals: TotalsInventory,
  readable: boolean,
  writable: boolean,
  update: (configuration: MeterConfigurationRequest) => void,
  preview: TotalGraphPreview | null = null,
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
  const consumers = (sourceId: string, output: keyof DefaultTotalsSettings["overall"]) => {
    const names = new Set<string>();
    if (sourceId !== "overall" && (output === "watts" || output === "amps")) names.add("Overall meter total");
    configuration.aggregates.filter((aggregate) => aggregate.sources.some((source) => source.kind === "native_total" && source.source_id === sourceId))
      .forEach((aggregate) => {
        if (output === "watts" && (aggregate.outputs.watts || aggregate.outputs.kwh)) names.add(aggregate.outputs.kwh ? `${aggregate.name} kWh` : `${aggregate.name} Watts`);
        if (output === "amps" && aggregate.outputs.amps) names.add(`${aggregate.name} Amps`);
      });
    const native = totals.native_sources.find((source) => source.source_id === sourceId);
    if (native && preview) preview.graph.ordered_nodes.forEach((node) => {
      const used = node.sources.some((source) => source.power_id === native.power_id || source.current_id === native.current_id);
      if (!used) return;
      if (output === "watts" && node.power_required) names.add(`${node.aggregate.name} Watts`);
      if (output === "amps" && node.current_required) names.add(`${node.aggregate.name} Amps`);
      if (output === "kwh" && node.energy_required) names.add(`${node.aggregate.name} kWh`);
    });
    return [...names];
  };
  const outputStatus = (sourceId: string, output: keyof DefaultTotalsSettings["overall"], enabled: boolean) => {
    const dependency = consumers(sourceId, output);
    const visibility = !totals.migration.native_visibility_resolved
      ? `${enabled ? "Requested for Home Assistant" : "Hidden from Home Assistant"}; source visibility is unconfirmed.`
      : enabled ? "Requested for Home Assistant." : "Hidden from Home Assistant.";
    if (!dependency.length) return visibility;
    return enabled ? `${visibility} Retained internally for ${dependency.join(" and ")}.`
      : `${visibility.replace(/\.$/, "")}; retained internally for ${dependency.join(" and ")}.`;
  };
  const control = (label: string, checked: boolean, onChange: (checked: boolean) => void) => html`<label class="default-total-control"><input type="checkbox" role="switch" aria-label=${label} .checked=${checked} ?disabled=${!writable}
    @change=${(event: Event) => onChange((event.target as HTMLInputElement).checked)} />${label.replace(/.* (Watts|Amps|kWh)$/, "$1")}</label>`;
  const boardFormula = boards.map((source) => source.label).join(" + ");
  const boardRanges = boards.map((source) => range(source.leaf_channels)).join(" + ");
  const visibilityUnresolved = !totals.migration.native_visibility_resolved;
  return html`<section class="default-totals" aria-labelledby="default-totals-heading">
    <h2 id="default-totals-heading">Default meter totals</h2>
    ${visibilityUnresolved ? html`<p class="info-band" role="status">Native source visibility is unconfirmed; these controls show requested outputs, not confirmed installed publications.</p>` : nothing}
    ${graphState === "pending" ? html`<p class="info-band" role="status">Updating total graph; current native cards remain available.</p>` : graphState === "invalid" ? html`<p class="warning-band" role="status">Total graph unavailable; native cards show saved draft status and not current dependency results.</p>` : nothing}
    ${overall ? html`<fieldset class="default-total-card"><legend>Overall meter total (all monitored channels)</legend>
      <p>${boardFormula || "All monitored channels"}. Downstream circuit CTs can double-count the service mains, so this native total is not relabeled Mains.</p>
      <p>Covers: ${boardRanges || range(overall.leaf_channels)}.</p>
      <div class="default-total-controls">
        ${control("Overall meter total Watts", configuration.default_totals.overall.watts, (watts) => patch({ ...configuration.default_totals.overall, watts }))}
        ${control("Overall meter total Amps", configuration.default_totals.overall.amps, (amps) => patch({ ...configuration.default_totals.overall, amps }))}
        ${control("Overall meter total kWh", configuration.default_totals.overall.kwh, (kwh) => patch({ ...configuration.default_totals.overall, kwh }))}
      </div>
      <ul class="native-total-status" role="status"><li>Watts: ${outputStatus("overall", "watts", configuration.default_totals.overall.watts)}</li><li>Amps: ${outputStatus("overall", "amps", configuration.default_totals.overall.amps)}</li><li>kWh: ${outputStatus("overall", "kwh", configuration.default_totals.overall.kwh)}</li></ul>
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
        <ul class="native-total-status" role="status"><li>Watts: ${outputStatus(source.source_id, "watts", settings.watts)}</li><li>Amps: ${outputStatus(source.source_id, "amps", settings.amps)}</li><li>kWh: ${outputStatus(source.source_id, "kwh", settings.kwh)}</li></ul>
      </fieldset>`;
    })}
  </section>`;
}
