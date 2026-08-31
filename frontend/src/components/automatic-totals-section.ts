import { html, type TemplateResult } from "lit";
import { sourceFormula } from "../total-graph";
import type { AutomaticTotalSettings, MeterConfigurationRequest, TotalOutputSettings, TotalsInventory } from "../types";

export function automaticTotalsSection(
  configuration: MeterConfigurationRequest,
  totals: TotalsInventory | null,
  writable: boolean,
  update: (configuration: MeterConfigurationRequest) => void,
): TemplateResult {
  if (!totals) return html`<section class="automatic-totals" aria-labelledby="automatic-totals-heading"><h2 id="automatic-totals-heading">Suggested circuit totals</h2><p class="info-band" role="status">Suggested totals are unavailable until the total graph is ready.</p></section>`;
  const patch = (candidateId: string, current: AutomaticTotalSettings, change: Partial<AutomaticTotalSettings>, aggregates = configuration.aggregates) => update({ ...configuration,
    automatic_totals: configuration.automatic_totals.some((item) => item.candidate_id === candidateId)
      ? configuration.automatic_totals.map((item) => item.candidate_id === candidateId ? { ...item, ...change } : item)
      : [...configuration.automatic_totals, { ...current, ...change }], aggregates });
  return html`<section class="automatic-totals" aria-labelledby="automatic-totals-heading">
    <h2 id="automatic-totals-heading">Suggested circuit totals</h2>
    ${totals.automatic_totals.length ? totals.automatic_totals.map((resolved) => {
      const saved = configuration.automatic_totals.find((item) => item.candidate_id === resolved.candidate.candidate_id);
      const current = saved ?? { candidate_id: resolved.candidate.candidate_id, enabled: resolved.enabled, outputs: resolved.outputs };
      const parents = configuration.aggregates.filter((aggregate) => aggregate.sources.some((source) => source.kind === "aggregate" && source.aggregate_id === resolved.candidate.aggregate_id));
      const sources = resolved.candidate.sources.map((source) => `CT${source.channel} · ${configuration.channels.find((channel) => channel.channel === source.channel)?.name ?? "Unnamed"}`).join(", ");
      const changeOutput = (key: keyof TotalOutputSettings, checked: boolean) => patch(resolved.candidate.candidate_id, current, { outputs: { ...current.outputs, [key]: checked } });
      const changeEnabled = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.checked || !parents.length) return patch(resolved.candidate.candidate_id, current, { enabled: input.checked });
        const names = parents.map((parent) => parent.name).join(" and ");
        if (!window.confirm(`${names} uses ${resolved.candidate.name}. Remove it from ${names}?`)) { input.checked = true; return; }
        patch(resolved.candidate.candidate_id, current, { enabled: false }, configuration.aggregates.map((aggregate) => ({ ...aggregate,
          sources: aggregate.sources.filter((source) => source.kind !== "aggregate" || source.aggregate_id !== resolved.candidate.aggregate_id) })));
      };
      const control = (key: keyof TotalOutputSettings, label: string, disabled = false) => html`<label class="automatic-total-control"><input type="checkbox" role="switch" aria-label=${`${resolved.candidate.name} ${label}`} .checked=${current.outputs[key]} ?disabled=${!writable || disabled}
        @change=${(event: Event) => changeOutput(key, (event.target as HTMLInputElement).checked)} />${label}</label>`;
      return html`<fieldset class="automatic-total-card"><legend>${resolved.candidate.name}</legend>
        <p>Sources: ${sources}</p><p>Formula: ${sourceFormula(resolved.candidate.sources, totals, configuration.aggregates)} · ${resolved.candidate.role.replaceAll("_", " ")} · ${resolved.candidate.measurement_method.replaceAll("_", " ")}</p>
        ${parents.length ? html`<p>Feeds into: ${parents.map((parent) => parent.name).join(" and ")}</p>` : ""}
        <label class="automatic-total-control"><input type="checkbox" role="switch" aria-label=${`Create ${resolved.candidate.name} total`} .checked=${current.enabled} ?disabled=${!writable} @change=${changeEnabled} />Create this total</label>
        <div class="automatic-total-controls">${control("watts", "Watts")}${control("amps", "Amps")}${control("kwh", "kWh", resolved.candidate.energy_mode === "none")}</div>
      </fieldset>`;
    }) : html`<p class="info-band" role="status">No server-suggested totals are available for this circuit configuration.</p>`}
  </section>`;
}
