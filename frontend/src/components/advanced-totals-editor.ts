import { html, nothing, type TemplateResult } from "lit";
import { derivedParentId, reparentAggregate, sourceFormula, sourceLeaves } from "../total-graph";
import type { CircuitAggregate, MeterConfigurationRequest, TotalGraphPreview, TotalOutputSettings, TotalSource, TotalsInventory } from "../types";
import type { CtDraft } from "./ct-inventory-step";

const methods = ["direct", "two_ct_sum", "one_ct_double_power", "both_conductors_one_ct"] as const;
const energyModes = ["none", "consumption", "bidirectional", "generation"] as const;
const roles = ["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom"] as const;
const sameSource = (a: TotalSource, b: TotalSource) =>
  a.kind === "channel" && b.kind === "channel" ? a.channel === b.channel
    : a.kind === "native_total" && b.kind === "native_total" ? a.source_id === b.source_id
      : a.kind === "aggregate" && b.kind === "aggregate" && a.aggregate_id === b.aggregate_id;
const errorText = (error: unknown) => error instanceof Error ? error.message : "Invalid total sources.";
const coverageLabel = (leaves: number[]) => {
  const sorted = [...new Set(leaves)].sort((a, b) => a - b);
  return sorted.length > 1 && sorted.at(-1)! - sorted[0]! === sorted.length - 1
    ? `CT${sorted[0]}–CT${sorted.at(-1)}` : sorted.map((channel) => `CT${channel}`).join(", ");
};

export function advancedTotalsEditor(
  configuration: MeterConfigurationRequest, drafts: Map<number, CtDraft>,
  update: (configuration: MeterConfigurationRequest) => void, writable: boolean,
  reason: string, totals: TotalsInventory | null, preview: TotalGraphPreview | null = null, fresh = true,
): TemplateResult {
  // Catalog entries remain server-owned; settings only determine which issued children are enabled.
  const catalog: TotalsInventory = totals ?? { native_sources: [], automatic_candidates: [], automatic_totals: [],
    stale_automatic_total_settings: [], migration: { parent_review_required: false, legacy_parent_links: [],
      native_visibility_confirmation_required: true, native_visibility_resolved: false } };
  const enabledAutomatic = (fresh ? catalog.automatic_totals : []).filter((item) =>
    configuration.automatic_totals.find((setting) => setting.candidate_id === item.candidate.candidate_id)?.enabled ?? item.enabled);
  const available = { ...catalog, automatic_candidates: enabledAutomatic.map((item) => item.candidate) };
  const patch = (aggregate: CircuitAggregate, change: Partial<CircuitAggregate>) => {
    if (writable) update({ ...configuration, aggregates: configuration.aggregates.map((item) => item === aggregate ? { ...item, ...change } : item) });
  };
  const parentOf = (id: string) => derivedParentId(id, configuration.aggregates);
  const label = (source: TotalSource) => {
    try { return sourceFormula([source], catalog, configuration.aggregates); } catch { return "Unknown source"; }
  };
  const rootOf = (id: string, aggregates: CircuitAggregate[]) => {
    const seen = new Set<string>();
    for (let next = derivedParentId(id, aggregates); next !== null; next = derivedParentId(id, aggregates)) {
      if (seen.has(id)) throw new Error("Totals cannot form a cycle.");
      seen.add(id); id = next;
    }
    return aggregates.find((item) => item.aggregate_id === id)!;
  };
  const validateAddition = (aggregate: CircuitAggregate, aggregates: CircuitAggregate[]) => {
    for (const item of aggregates) {
      derivedParentId(item.aggregate_id, aggregates);
      for (const source of item.sources) if (source.kind === "aggregate") derivedParentId(source.aggregate_id, aggregates);
    }
    const root = rootOf(aggregate.aggregate_id, aggregates);
    sourceLeaves(root.sources, available, aggregates, [root.aggregate_id], aggregate.aggregate_id);
  };
  const sourceReason = (aggregate: CircuitAggregate, source: TotalSource): string => {
    if (aggregate.sources.some((item) => (item.kind === "channel") !== (source.kind === "channel"))) return "Remove current sources before changing between CTs and totals.";
    if (source.kind !== "channel" && aggregate.measurement_method !== "direct") return "Nested totals require the Direct measurement method.";
    const max = aggregate.measurement_method === "direct" ? Infinity : aggregate.measurement_method === "two_ct_sum" ? 2 : 1;
    if (aggregate.sources.length >= max) return `This measurement method accepts ${max} CT${max === 1 ? "" : "s"}.`;
    try {
      if (source.kind === "aggregate") {
        const parent = parentOf(source.aggregate_id);
        if (parent && parent !== aggregate.aggregate_id) return "Already used by another total. Move it with Feeds into.";
        const candidate = configuration.aggregates.find((item) => item.aggregate_id === source.aggregate_id)
          ?? enabledAutomatic.find((item) => item.candidate.aggregate_id === source.aggregate_id)?.candidate;
        if (!candidate?.sources.length) return "Complete this child total's sources first.";
      }
      const changed = { ...aggregate, sources: [...aggregate.sources, source] };
      validateAddition(changed, configuration.aggregates.map((item) => item === aggregate ? changed : item));
      return "";
    } catch (error) { return errorText(error); }
  };
  const parentReason = (aggregate: CircuitAggregate, parentId: string | null): string => {
    if (parentId === null) return "";
    try {
      const moved = reparentAggregate(aggregate.aggregate_id, parentId, configuration.aggregates);
      validateAddition(moved.find((item) => item.aggregate_id === parentId)!, moved);
      return "";
    } catch (error) { return errorText(error); }
  };
  const add = () => {
    if (!writable) return;
    const ids = new Set([...configuration.aggregates.map((item) => item.aggregate_id), ...catalog.automatic_candidates.map((item) => item.aggregate_id)]);
    let number = 1; while (ids.has(`aggregate-${number}`)) number++;
    update({ ...configuration, aggregates: [...configuration.aggregates, {
      aggregate_id: `aggregate-${number}`, name: `Aggregate total ${number}`, role: "branch", sources: [],
      measurement_method: "two_ct_sum", energy_mode: "consumption", outputs: { watts: true, amps: false, kwh: true }, origin: "advanced",
    }] });
  };
  return html`<section aria-labelledby="advanced-totals-heading"><details class="advanced-totals"><summary id="advanced-totals-heading">Advanced totals</summary>
    ${!writable ? html`<p class="info-band" role="status">Aggregate editing unavailable: ${reason === "unmanaged_total_present" ? "This meter has legacy unmanaged totals." : "This meter does not expose managed totals."} Upgrade the meter configuration before editing aggregate totals. Existing aggregates remain reviewable.</p>` : nothing}
    ${!fresh ? html`<p class="info-band" role="status">Total graph unavailable or updating. You can still edit or remove draft sources; complete the graph before continuing.</p>` : nothing}
    ${fresh && catalog.stale_automatic_total_settings.length ? html`<p class="info-band" role="status">${catalog.stale_automatic_total_settings.length} inactive automatic settings are retained for this plan, not included in the active configuration.</p>` : nothing}
    <div class="aggregate-list">${configuration.aggregates.map((aggregate) => {
      let parent = "", problem = "", leaves: number[] = [], overlaps = false;
      try {
        parent = parentOf(aggregate.aggregate_id) ?? "";
        if (!aggregate.sources.length) throw new Error("Incomplete total: select at least one source.");
        const channels = aggregate.sources.filter((source) => source.kind === "channel");
        const needed = aggregate.measurement_method === "direct" ? null : aggregate.measurement_method === "two_ct_sum" ? 2 : 1;
        if (channels.length && channels.length !== aggregate.sources.length || needed !== null && (channels.length !== needed || channels.length !== aggregate.sources.length)) throw new Error("Incomplete total: check the measurement method and source class.");
        if (fresh) {
          leaves = sourceLeaves(aggregate.sources, available, configuration.aggregates, [aggregate.aggregate_id]);
          validateAddition(aggregate, configuration.aggregates);
          leaves = preview?.graph.leaf_channels[aggregate.aggregate_id] ?? leaves;
          overlaps = preview?.graph.independent_overlap_warnings.some((item) => item.first_id === aggregate.aggregate_id || item.second_id === aggregate.aggregate_id) ?? false;
          if (!preview && !parent) {
            const roots = [...configuration.aggregates.filter((item) => item !== aggregate && !parentOf(item.aggregate_id)),
              ...enabledAutomatic.filter((item) => !parentOf(item.candidate.aggregate_id)).map((item) => item.candidate)];
            overlaps = roots.some((item) => {
              try { return sourceLeaves(item.sources, available, configuration.aggregates, [item.aggregate_id]).some((channel) => leaves.includes(channel)); } catch { return false; }
            });
          }
        }
      } catch (error) { problem = errorText(error); }
      const option = (source: TotalSource, text: string, accessibleLabel = text) => {
        const checked = aggregate.sources.some((item) => sameSource(item, source));
        const blocked = checked ? "" : sourceReason(aggregate, source);
        return html`<label class=${`aggregate-channel-option${checked ? " selected" : ""}`}><input type="checkbox" aria-label=${`${aggregate.name}: ${accessibleLabel}`} .checked=${checked} ?disabled=${!writable || Boolean(blocked)}
          @change=${(event: Event) => {
            const input = event.target as HTMLInputElement;
            if (!writable || input.checked && sourceReason(aggregate, source)) { input.checked = checked; return; }
            if (!input.checked && source.kind !== "channel" && !window.confirm(`Remove ${label(source)} from ${aggregate.name}?${source.kind === "aggregate" ? " It becomes an independent report." : ""}`)) { input.checked = checked; return; }
            patch(aggregate, { sources: input.checked ? [...aggregate.sources, source] : aggregate.sources.filter((item) => !sameSource(item, source)) });
          }} /><span>${text}${blocked ? html`<small class="source-explanation">${blocked}</small>` : nothing}</span></label>`;
      };
      const output = (key: keyof TotalOutputSettings, text: string) => html`<label class="check-row"><input type="checkbox" aria-label=${`${aggregate.name} ${text}`} .checked=${aggregate.outputs[key]} ?disabled=${!writable || key === "kwh" && aggregate.energy_mode === "none"}
        @change=${(event: Event) => {
          const input = event.target as HTMLInputElement;
          if (!writable || key === "kwh" && aggregate.energy_mode === "none") { input.checked = aggregate.outputs[key]; return; }
          patch(aggregate, { outputs: { ...aggregate.outputs, [key]: input.checked } });
        }} />${text}</label>`;
      const existing = [...enabledAutomatic.map((item) => item.candidate), ...configuration.aggregates.filter((item) => item !== aggregate)];
      const known = [...catalog.native_sources.map((item): TotalSource => ({ kind: "native_total", source_id: item.source_id })),
        ...existing.map((item): TotalSource => ({ kind: "aggregate", aggregate_id: item.aggregate_id })),
        ...configuration.channels.filter((item) => item.enabled).map((item): TotalSource => ({ kind: "channel", channel: item.channel }))];
      return html`<fieldset class="aggregate-card" aria-label=${`${aggregate.name} aggregate`} ?disabled=${!writable}><legend>${aggregate.name}</legend>
        <div class="aggregate-fields">
          <label>Name <input aria-label=${`${aggregate.aggregate_id} aggregate name`} maxlength="64" .value=${aggregate.name}
            @input=${(event: Event) => { const input = event.target as HTMLInputElement; if (!writable) { input.value = aggregate.name; return; } patch(aggregate, { name: input.value }); }} /></label>
          <label>Role <select aria-label=${`${aggregate.aggregate_id} aggregate role`} .value=${aggregate.role}
            @change=${(event: Event) => { const input = event.target as HTMLSelectElement; if (!writable || !roles.includes(input.value as typeof roles[number])) { input.value = aggregate.role; return; } patch(aggregate, { role: input.value as CircuitAggregate["role"] }); }}>
            ${roles.map((role) => html`<option value=${role} ?selected=${role === aggregate.role}>${role === "grid" ? "Mains" : role === "branch" ? "Branch circuit" : role.replaceAll("_", " ")}</option>`)}</select></label>
          <label>Measurement method <select aria-label=${`${aggregate.aggregate_id} aggregate method`} .value=${aggregate.measurement_method}
            @change=${(event: Event) => {
              const input = event.target as HTMLSelectElement;
              if (!writable || !methods.includes(input.value as typeof methods[number]) || input.value !== "direct" && aggregate.sources.some((source) => source.kind !== "channel")) { input.value = aggregate.measurement_method; return; }
              patch(aggregate, { measurement_method: input.value as CircuitAggregate["measurement_method"] });
            }}>${methods.map((method) => html`<option value=${method} ?selected=${method === aggregate.measurement_method} ?disabled=${method !== "direct" && aggregate.sources.some((source) => source.kind !== "channel")}>${method === "two_ct_sum" ? "Two CT Sum" : method.replaceAll("_", " ")}</option>`)}</select><small>Two CT Sum adds exactly two CTs. Nested totals use Direct.</small></label>
          <label>Energy behavior <select aria-label=${`${aggregate.aggregate_id} aggregate energy`} .value=${aggregate.energy_mode}
            @change=${(event: Event) => {
              const input = event.target as HTMLSelectElement;
              if (!writable || !energyModes.includes(input.value as typeof energyModes[number])) { input.value = aggregate.energy_mode; return; }
              patch(aggregate, { energy_mode: input.value as CircuitAggregate["energy_mode"], outputs: { ...aggregate.outputs, kwh: input.value === "none" ? false : aggregate.outputs.kwh } });
            }}>${energyModes.map((mode) => html`<option value=${mode} ?selected=${mode === aggregate.energy_mode}>${mode[0]!.toUpperCase()}${mode.slice(1)}</option>`)}</select><small>kWh uses ESPHome platform: total_daily_energy, integrating this total's Watts rather than adding child kWh.</small></label>
          <label>Feeds into <select aria-label=${`${aggregate.name} Feeds into`} .value=${parent}
            @change=${(event: Event) => {
              const input = event.target as HTMLSelectElement;
              try {
                if (!writable || parentReason(aggregate, input.value || null)) { input.value = parent; return; }
                if (parent && input.value === "" && !window.confirm(`Remove ${aggregate.name} from ${configuration.aggregates.find((item) => item.aggregate_id === parent)?.name}? It becomes an independent report.`)) { input.value = parent; return; }
                update({ ...configuration, aggregates: reparentAggregate(aggregate.aggregate_id, input.value || null, configuration.aggregates) });
              } catch { input.value = parent; }
            }}><option value="" ?selected=${!parent}>Independent report</option>${configuration.aggregates.filter((item) => item !== aggregate).map((item) => {
              const blocked = item.aggregate_id === parent ? "" : parentReason(aggregate, item.aggregate_id);
              return html`<option value=${item.aggregate_id} ?selected=${item.aggregate_id === parent} ?disabled=${Boolean(blocked)}>${item.name}${blocked ? ` — ${blocked}` : ""}</option>`;
            })}</select></label>
        </div>
        <p class="aggregate-formula">Formula: ${aggregate.sources.length ? aggregate.sources.map(label).join(" + ") : "Select sources"}</p>
        ${fresh && !problem ? html`<p>Coverage: ${coverageLabel(leaves)}</p>` : nothing}
        ${problem ? html`<p class="warning-band" role="status">${problem} Complete the total before continuing.</p>` : nothing}
        ${overlaps ? html`<p class="warning-band" role="note">This total overlaps another report. They are valid independently but must not be added together.</p>` : nothing}
        <p>Select CTs or totals, not both. Remove current sources before changing source class.</p>
        <fieldset class="aggregate-sources"><legend>Native totals</legend><div class="aggregate-source-options">${catalog.native_sources.map((item) => option({ kind: "native_total", source_id: item.source_id }, item.label))}</div></fieldset>
        <fieldset class="aggregate-sources"><legend>Existing totals</legend><div class="aggregate-source-options">${existing.map((item) => option({ kind: "aggregate", aggregate_id: item.aggregate_id }, item.name))}</div></fieldset>
        <fieldset class="aggregate-sources aggregate-channels"><legend>CTs</legend><div class="aggregate-channel-groups">${Array.from({ length: Math.ceil(configuration.channels.length / 6) }, (_, board) => {
          const channels = configuration.channels.filter((item) => item.enabled && Math.floor((item.channel - 1) / 6) === board);
          return channels.length ? html`<section class="aggregate-channel-group" aria-label=${board ? `Add-on ${board} channels` : "Main Board channels"}><h4>${board ? `Add-on ${board}` : "Main Board"}</h4><div>${channels.map((item) => option({ kind: "channel", channel: item.channel }, `CT${item.channel} · ${drafts.get(item.channel)?.name ?? item.name}`, `CT${item.channel}`))}</div></section>` : nothing;
        })}</div></fieldset>
        ${aggregate.sources.filter((source) => !known.some((item) => sameSource(item, source))).map((source) => option(source, label(source)))}
        <div class="aggregate-actions">${output("watts", "Watts")}${output("amps", "Amps")}${output("kwh", "kWh")}
          <button class="secondary" data-action="delete-aggregate" @click=${() => {
            if (!writable) return;
            const parents = configuration.aggregates.filter((item) => item.sources.some((source) => source.kind === "aggregate" && source.aggregate_id === aggregate.aggregate_id));
            const children = aggregate.sources.filter((source) => source.kind === "aggregate").map(label);
            const message = `Delete ${aggregate.name}?${parents.length ? ` Remove it from ${parents.map((item) => item.name).join(" and ")}.` : ""}${children.length ? ` ${children.join(" and ")} will become independent reports.` : ""}`;
            if (!window.confirm(message)) return;
            update({ ...configuration, aggregates: configuration.aggregates.filter((item) => item !== aggregate).map((item) => ({ ...item,
              sources: item.sources.filter((source) => source.kind !== "aggregate" || source.aggregate_id !== aggregate.aggregate_id) })) });
          }}>Delete total</button>
        </div>
        <details><summary>Advanced details</summary><p>Stable aggregate ID: <code>${aggregate.aggregate_id}</code></p></details>
      </fieldset>`;
    })}</div>
    ${writable ? html`<button class="secondary" data-action="add-aggregate" @click=${add}>Create aggregate total</button>` : nothing}
  </details></section>`;
}
