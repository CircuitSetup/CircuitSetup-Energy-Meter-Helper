import { html, nothing, type TemplateResult } from "lit";
import type { ChannelSettings, CircuitAggregate, CircuitRole, CtChange, CtInventory, CtPreset, MeterConfigurationRequest, TotalsInventory } from "../types";
import { derivedParentId, reparentAggregate, sourceFormula } from "../total-graph";
import { moveTab } from "./tab-keyboard";
import { defaultTotalsSection } from "./default-totals-section";

export interface CtDraft {
  name: string;
  modelId: string;
  multiplier: number;
  customGainCt?: number | undefined;
  customLabel?: string | undefined;
  burdenAcknowledged: boolean;
  expanded: boolean;
  preserveExistingGain?: boolean;
  multiplierMode?: "automatic" | "manual";
}

export function recommendedReportingMultiplier(ratedCurrentA: number): 1 | 2 | 4 | 8 | null {
  if (!Number.isFinite(ratedCurrentA) || ratedCurrentA < 0) return null;
  return ratedCurrentA <= 65.535 ? 1 : ratedCurrentA <= 131.07 ? 2
    : ratedCurrentA <= 262.14 ? 4 : ratedCurrentA <= 524.28 ? 8 : null;
}

const resultingGain = (preset: CtPreset | undefined, multiplier: number, customGain?: number) =>
  (preset?.default_gain_ct ?? customGain) == null || !Number.isFinite(multiplier) || multiplier <= 0
    ? null
    : Math.round((preset?.default_gain_ct ?? customGain!) / multiplier);

export function ctInventoryStep(
  inventory: CtInventory,
  board: number,
  drafts: Map<number, CtDraft>,
  setBoard: (board: number) => void,
  update: (channel: number, patch: Partial<CtDraft>) => void,
  back: () => void,
  review: () => void,
  labelOnly = false,
  busy = false,
  configuration: MeterConfigurationRequest | null = null,
  updateConfiguration: (configuration: MeterConfigurationRequest) => void = () => undefined,
  disableChannel: (channel: number) => void = () => undefined,
  managedTotals = true,
  managedTotalsReason = "",
  allowPreserveExistingGain = false,
  continueAllowed = true,
  totals: TotalsInventory | null = null,
  nativeTotalsReadable = false,
  nativeTotalsWritable = false,
  nativePreview: import("../types").TotalGraphPreview | null = null,
  freshTotals = true,
): TemplateResult {
  const boardCount = Math.ceil(inventory.channels.length / 6);
  const rows = inventory.channels.filter((channel) => channel.address.board_index === board).slice(0, 8);
  const referenceByGroup = new Map(configuration?.meter.voltage_references.flatMap((reference) =>
    reference.group_keys.map((group) => [group, reference] as const)) ?? []);
  const patchChannel = (channel: number, patch: Partial<ChannelSettings>) => configuration && updateConfiguration({ ...configuration,
    channels: configuration.channels.map((item) => item.channel === channel ? { ...item, ...patch } : item) });
  return html`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <p class="info-band">CT numbering starts at the top-left connector on each board and continues counterclockwise, then continues upward through the board stack. A circuit's voltage reference is determined by the physical voltage setup and cannot be changed in software.</p>
      <p class="warning-band" role="note"><strong>Physical work required:</strong> CT wiring and panel changes must be performed safely; the helper cannot verify them.</p>
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: boardCount }, (_, index) => html`
          <button role="tab" id=${`board-tab-${index}`} data-board-tab=${index} aria-selected=${index === board}
            aria-controls="board-panel" tabindex=${index === board ? "0" : "-1"}
            @keydown=${(event: KeyboardEvent) => moveTab(event, index)}
            @click=${() => setBoard(index)}>${index === 0 ? "Main Board" : `Add-on ${index}`}</button>
        `)}
      </div>
      <p>Choose the CT model and confirm each circuit. The helper selects the smallest safe reporting range automatically.</p>
      <div id="board-panel" role="tabpanel" aria-labelledby=${`board-tab-${board}`}>
      <div class="ct-table" role="table" aria-rowcount=${inventory.channels.length + 1}>
        <div class="ct-header" role="row" aria-rowindex="1">
          <span role="columnheader">CT</span><span role="columnheader">Used</span><span role="columnheader">Circuit name</span><span role="columnheader">Circuit type</span><span role="columnheader">CT model / rating</span><span role="columnheader">Range status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${rows.map((channel) => {
            const draft = drafts.get(channel.channel) ?? {
              name: channel.name,
              modelId: channel.selected_model_id ?? "",
              multiplier: channel.reporting_multiplier,
              burdenAcknowledged: false,
              expanded: false,
            };
            const preset = inventory.catalog.presets.find((item) => item.model_id === draft.modelId);
            const gain = resultingGain(preset, draft.multiplier, draft.modelId === "custom" ? draft.customGainCt : undefined);
            const dirty = isDirty(channel, draft);
            const recommendation = preset ? recommendedReportingMultiplier(preset.rated_current_a) : null;
            const effectiveRange = draft.multiplier * 65.535;
            const circuit = configuration?.channels.find((item) => item.channel === channel.channel);
            const reference = referenceByGroup.get(`${channel.address.board_index === 0 ? "main" : `addon${channel.address.board_index}`}_${channel.address.group_index + 1}`);
            return html`
              <div class="ct-row" data-ct-row data-ct-group=${channel.address.group_index} role="row" aria-rowindex=${channel.channel + 1} aria-label=${`CT${channel.channel}`}>
                <strong class="ct-index" role="cell">CT${channel.channel}</strong>
                ${circuit ? html`<label role="cell" class="check-row"><span class="mobile-label">Used</span><input type="checkbox" aria-label=${`CT${channel.channel} used`} .checked=${circuit.enabled}
                  @change=${(event: Event) => (event.target as HTMLInputElement).checked
                    ? patchChannel(channel.channel, { enabled: true, role: circuit.role === "unused" ? "branch" : circuit.role })
                    : disableChannel(channel.channel)} /></label>` : html`<span role="cell"><span class="mobile-label">Used</span>—</span>`}
                <label role="cell"><span class="mobile-label">Circuit name</span><input aria-label=${`CT${channel.channel} name`} .value=${draft.name}
                  @input=${(event: Event) => update(channel.channel, { name: (event.target as HTMLInputElement).value })} /></label>
                ${circuit ? html`<label role="cell"><span class="mobile-label">Circuit type</span><select aria-label=${`CT${channel.channel} role`} .value=${circuit.role} ?disabled=${!circuit.enabled}
                  @change=${(event: Event) => patchChannel(channel.channel, { role: (event.target as HTMLSelectElement).value as ChannelSettings["role"] })}>
                  ${ROLES.filter((role) => role !== "unused").map((role) => html`<option value=${role} ?selected=${role === circuit.role}>${roleLabel(role)}</option>`)}</select></label>` : html`<span role="cell"><span class="mobile-label">Role</span>—</span>`}
                <label role="cell"><span class="mobile-label">CT model / rating</span><select aria-label=${`CT${channel.channel} model`} .value=${draft.modelId} ?disabled=${labelOnly || draft.preserveExistingGain}
                  @change=${(event: Event) => {
                    const modelId = (event.target as HTMLSelectElement).value;
                    const selectedPreset = inventory.catalog.presets.find((item) => item.model_id === modelId);
                    update(channel.channel, {
                      modelId,
                      preserveExistingGain: false,
                      multiplier: draft.multiplierMode === "manual" ? draft.multiplier : selectedPreset ? recommendedReportingMultiplier(selectedPreset.rated_current_a) ?? draft.multiplier : draft.multiplier,
                      multiplierMode: draft.multiplierMode ?? "automatic",
                      burdenAcknowledged: channel.selection_verified_against_config
                        && modelId === channel.selected_model_id
                        && (modelId === "custom" || selectedPreset?.requires_burden_jumper_cut === true),
                      expanded: true,
                    });
                  }}>
                  <option value="" ?selected=${draft.modelId === ""}>Choose model</option>
                  ${inventory.catalog.presets.map((item) => html`<option value=${item.model_id} ?selected=${draft.modelId === item.model_id}>${item.label}</option>`)}
                  <option value="custom" ?selected=${draft.modelId === "custom"}>Custom</option>
                </select>${preset ? html`<small>${preset.rated_current_a} A</small>` : nothing}<button class="row-toggle" aria-label=${`CT${channel.channel} technical details`} aria-expanded=${draft.expanded} @click=${() => update(channel.channel, { expanded: !draft.expanded })}>${draft.modelId ? dirty ? "Changed" : "OK" : "Choose model"}</button><span class="sr-status" data-voltage-reference>${reference?.label || reference?.reference_id || circuit?.voltage_reference_id || "—"}</span></label>
                <span role="cell"><span class="mobile-label">Range status</span>${draft.preserveExistingGain ? "Existing gain kept" : recommendation === null && preset ? "Rating exceeds ×8 range" : effectiveRange < (preset?.rated_current_a ?? 0) ? `Too small: ${effectiveRange} A` : `Up to ${effectiveRange} A`}</span>
              </div>
              ${allowPreserveExistingGain && !channel.selection_verified_against_config && channel.raw_gain_ct > 0 ? html`<label class="check-row preserve-gain"><input type="checkbox" aria-label=${`CT${channel.channel} keep existing gain`} ?disabled=${labelOnly} .checked=${draft.preserveExistingGain === true}
                @change=${(event: Event) => update(channel.channel, { preserveExistingGain: (event.target as HTMLInputElement).checked, expanded: true })} />Keep existing gain; CT model not recorded.</label>` : nothing}
              ${draft.modelId === "custom" && draft.expanded ? html`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${channel.channel} custom gain`}
                  ?disabled=${labelOnly}
                  .value=${draft.customGainCt === undefined ? "" : String(draft.customGainCt)}
                  @input=${(event: Event) => update(channel.channel, { customGainCt: Number((event.target as HTMLInputElement).value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${channel.channel} custom label`} ?disabled=${labelOnly} .value=${draft.customLabel ?? ""}
                  @input=${(event: Event) => update(channel.channel, { customLabel: (event.target as HTMLInputElement).value })} /></label>
              </div>` : nothing}
              ${draft.expanded && (draft.modelId === "custom" || preset?.requires_burden_jumper_cut) ? html`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${channel.channel} burden output acknowledgement`}
                  ?disabled=${labelOnly}
                  .checked=${draft.burdenAcknowledged}
                  @change=${(event: Event) => update(channel.channel, { burdenAcknowledged: (event.target as HTMLInputElement).checked })} />
                  I checked the burden-output requirement for CT${channel.channel}</label>
              </div>` : nothing}
              ${!draft.preserveExistingGain && preset && (recommendation === null || effectiveRange < preset.rated_current_a) ? html`<div class="warning-band" role="status">CT${channel.channel}: this selection needs a range of at least ${preset.rated_current_a} A. Continue is blocked.</div>` : nothing}
              <details class="technical-details" ?open=${draft.expanded}><summary>Technical details</summary>
                <dl class="ct-detail">
                  <div><dt>Raw gain</dt><dd>${channel.raw_gain_ct}</dd></div>
                  <div><dt>Divided gain</dt><dd>${gain ?? "—"}</dd></div>
                  <div><dt>Voltage reference</dt><dd data-voltage-reference>${reference?.label || reference?.reference_id || circuit?.voltage_reference_id || "—"}</dd></div>
                  <div><dt>Reporting multiplier</dt><dd><label><input type="checkbox" aria-label=${`CT${channel.channel} manual multiplier`} ?checked=${draft.multiplierMode === "manual"} ?disabled=${labelOnly || draft.preserveExistingGain}
                    @change=${(event: Event) => update(channel.channel, { multiplierMode: (event.target as HTMLInputElement).checked ? "manual" : "automatic", multiplier: (event.target as HTMLInputElement).checked ? draft.multiplier : recommendation ?? draft.multiplier })} /> Manual override</label>
                    <select aria-label=${`CT${channel.channel} multiplier`} .value=${String(draft.multiplier)} ?disabled=${labelOnly || draft.preserveExistingGain || draft.multiplierMode !== "manual"}
                      @change=${(event: Event) => update(channel.channel, { multiplier: Number((event.target as HTMLSelectElement).value), multiplierMode: "manual" })}>${[1, 2, 4, 8].map((value) => html`<option value=${value} ?selected=${draft.multiplier === value}>×${value}</option>`)}</select></dd></div>
                  <div><dt>Rated current</dt><dd>${preset?.rated_current_a ?? "Custom"}${preset ? " A" : ""}</dd></div>
                  <div><dt>Output</dt><dd>${preset?.secondary ?? "Custom"}</dd></div>
                  <div><dt>Official default gain</dt><dd>${preset?.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${preset?.notes || (preset?.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              </details>
            `;
          })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${rows[0]?.channel ?? 0}–${rows.at(-1)?.channel ?? 0} of ${inventory.channels.length} CTs</p>
      ${configuration && totals ? defaultTotalsSection(configuration, totals, nativeTotalsReadable, nativeTotalsWritable, updateConfiguration, nativePreview) : nothing}
      ${configuration ? circuitsEditor(configuration, drafts, updateConfiguration, managedTotals, managedTotalsReason, freshTotals ? totals : null) : nothing}
      <footer class="action-footer">
        <button class="secondary" @click=${back}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${busy || !continueAllowed || !draftsAreValid(inventory, drafts, labelOnly)} @click=${review}>${busy ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}

const ROLES = ["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom", "unused"] as const;
const METHODS = ["direct", "two_ct_sum", "one_ct_double_power", "both_conductors_one_ct"] as const;
const ENERGY = ["none", "consumption", "bidirectional", "generation"] as const;
function roleLabel(role: CircuitRole): string {
  return role === "grid" ? "Mains" : role === "branch" ? "Branch circuit" : role.replaceAll("_", " ");
}

const channelSources = (aggregate: CircuitAggregate): number[] => aggregate.sources.flatMap((source) => source.kind === "channel" ? [source.channel] : []);

function circuitsEditor(
  configuration: MeterConfigurationRequest,
  drafts: Map<number, CtDraft>,
  update: (configuration: MeterConfigurationRequest) => void,
  managedTotals: boolean,
  managedTotalsReason: string,
  totals: TotalsInventory | null,
): TemplateResult {
  const patchAggregate = (index: number, patch: Partial<CircuitAggregate>) => update({ ...configuration,
    aggregates: configuration.aggregates.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  const renameAggregate = (index: number, aggregateId: string) => {
    const old = configuration.aggregates[index]!.aggregate_id;
    update({ ...configuration, aggregates: configuration.aggregates.map((item, itemIndex) => itemIndex === index
      ? { ...item, aggregate_id: aggregateId } : { ...item, sources: item.sources.map((source) => source.kind === "aggregate" && source.aggregate_id === old ? { ...source, aggregate_id: aggregateId } : source) }) });
  };
  const addAggregate = () => {
    const ids = new Set(configuration.aggregates.map((aggregate) => aggregate.aggregate_id));
    let number = 1;
    while (ids.has(`aggregate-${number}`)) number += 1;
    update({ ...configuration, aggregates: [...configuration.aggregates, {
      aggregate_id: `aggregate-${number}`, name: `Aggregate total ${number}`, role: "branch", sources: [],
      measurement_method: "two_ct_sum", energy_mode: "consumption", outputs: { watts: true, amps: false, kwh: true }, origin: "advanced",
    }] });
  };
  const parentId = (aggregate: CircuitAggregate) => {
    try { return derivedParentId(aggregate.aggregate_id, configuration.aggregates); } catch { return null; }
  };
  const canReparent = (aggregate: CircuitAggregate, parent: CircuitAggregate) => {
    try {
      const updated = reparentAggregate(aggregate.aggregate_id, parent.aggregate_id, configuration.aggregates);
      const leaves = (sources: CircuitAggregate["sources"], path = new Set<string>()): number[] => {
        const channels = sources.flatMap((source): number[] => {
          if (source.kind === "channel") return [source.channel];
          if (source.kind === "native_total") {
            const native = totals?.native_sources.find((item) => item.source_id === source.source_id);
            if (!native) throw new Error("Native coverage unavailable.");
            return native.leaf_channels;
          }
          if (path.has(source.aggregate_id)) throw new Error("Cyclic total.");
          const child = updated.find((item) => item.aggregate_id === source.aggregate_id)
            ?? totals?.automatic_candidates.find((item) => item.aggregate_id === source.aggregate_id);
          if (!child) throw new Error("Unknown child total.");
          return leaves(child.sources, new Set(path).add(source.aggregate_id));
        });
        if (new Set(channels).size !== channels.length) throw new Error("Overlapping parent sources.");
        return channels;
      };
      let root = parent.aggregate_id;
      for (let next = derivedParentId(root, updated); next !== null; next = derivedParentId(root, updated)) root = next;
      leaves(updated.find((item) => item.aggregate_id === root)!.sources);
      return true;
    } catch { return false; }
  };
  const changeParent = (aggregate: CircuitAggregate, parent: string | null) => {
    try {
      if (parent !== null && !configuration.aggregates.some((item) => item.aggregate_id === parent && canReparent(aggregate, item))) return;
      update({ ...configuration, aggregates: reparentAggregate(aggregate.aggregate_id, parent, configuration.aggregates) });
    } catch { /* Invalid selections leave the draft unchanged. */ }
  };
  const channelGroups = Array.from({ length: Math.ceil(configuration.channels.length / 6) }, (_, board) => ({
    board,
    channels: configuration.channels.filter((channel) => channel.enabled && Math.floor((channel.channel - 1) / 6) === board),
  })).filter((group) => group.channels.length);
  const warnings = configuration.aggregates.flatMap((aggregate) => [
    aggregate.role === "grid" && channelSources(aggregate).some((channel) => configuration.channels[channel - 1]?.role === "branch") ? `${aggregate.name}: keep branch loads out of the root-grid total.` : "",
    aggregate.measurement_method === "one_ct_double_power" && channelSources(aggregate).length !== 1 ? `${aggregate.name}: doubled-one-leg measurement requires exactly one CT.` : "",
    aggregate.role === "two_pole" && !["one_ct_double_power", "both_conductors_one_ct", "two_ct_sum"].includes(aggregate.measurement_method) ? `${aggregate.name}: select a two-pole measurement method.` : "",
    aggregate.role === "two_pole" && channelSources(aggregate).some((channel) => configuration.aggregates.filter((item) => item.role === "two_pole" && channelSources(item).includes(channel)).length > 1) ? `${aggregate.name}: a CT cannot belong to two two-pole aggregates.` : "",
  ].filter(Boolean));
  return html`<section class="step-content" aria-labelledby="aggregates-heading">
    <h2 id="aggregates-heading">Automatic totals</h2>
    <table aria-label="Automatic totals"><thead><tr><th>Name</th><th>CTs / meter</th><th>Outputs</th></tr></thead><tbody>
      ${totals?.automatic_totals.length ? totals.automatic_totals.map((total) => html`<tr><td>${total.candidate.name}</td><td>${sourceFormula(total.candidate.sources, totals, configuration.aggregates)}</td><td>${total.enabled ? [total.outputs.watts ? "Power" : "", total.outputs.amps ? "Current" : "", total.outputs.kwh ? "Energy" : ""].filter(Boolean).join(" · ") : "Off"}</td></tr>`)
        : html`<tr><td colspan="3">No automatic totals are configured.</td></tr>`}
    </tbody></table>
    ${totals?.stale_automatic_total_settings.length ? html`<p class="info-band" role="status">${totals.stale_automatic_total_settings.length} inactive automatic settings are retained for this plan, not included in the active configuration.</p>` : nothing}
    <details><summary>Advanced totals</summary>
    ${!managedTotals ? html`<p class="info-band" role="status">Aggregate editing unavailable: ${managedTotalsReason === "unmanaged_total_present" ? "This meter has legacy unmanaged totals." : "This meter does not expose managed totals."} Upgrade the meter configuration before editing aggregate totals. Existing aggregates remain reviewable.</p>` : nothing}
    ${warnings.map((warning) => html`<p class="warning-band" role="status">${warning}</p>`)}
    <div class="aggregate-list">
    ${configuration.aggregates.map((aggregate, index) => html`<fieldset class="aggregate-card" aria-label=${`${aggregate.name} aggregate`} ?disabled=${!managedTotals}><legend>${aggregate.name}</legend>
      <div class="aggregate-fields">
      <label>ID <input aria-label=${`${aggregate.aggregate_id} aggregate id`} maxlength="64" .value=${aggregate.aggregate_id}
        @change=${(event: Event) => renameAggregate(index, (event.target as HTMLInputElement).value.trim())} /></label>
      <label>Name <input aria-label=${`${aggregate.aggregate_id} aggregate name`} maxlength="64" .value=${aggregate.name}
        @input=${(event: Event) => patchAggregate(index, { name: (event.target as HTMLInputElement).value })} /></label>
      <label>Role <select aria-label=${`${aggregate.aggregate_id} aggregate role`} .value=${aggregate.role}
        @change=${(event: Event) => patchAggregate(index, { role: (event.target as HTMLSelectElement).value as CircuitAggregate["role"] })}>${ROLES.filter((role) => role !== "unused").map((role) => html`<option value=${role} ?selected=${role === aggregate.role}>${roleLabel(role)}</option>`)}</select>
        <small>Describes how this total is used, such as mains, solar, or a branch circuit.</small></label>
      <label>Method <select aria-label=${`${aggregate.aggregate_id} aggregate method`} .value=${aggregate.measurement_method}
        @change=${(event: Event) => patchAggregate(index, { measurement_method: (event.target as HTMLSelectElement).value as CircuitAggregate["measurement_method"] })}>${METHODS.map((method) => html`<option value=${method} ?selected=${method === aggregate.measurement_method}>${method === "two_ct_sum" ? "Two CT Sum" : method.replaceAll("_", " ")}</option>`)}</select>
        <small>Controls how CT readings are combined. Two CT Sum adds exactly two CTs.</small></label>
      <label>Energy <select aria-label=${`${aggregate.aggregate_id} aggregate energy`} .value=${aggregate.energy_mode}
        @change=${(event: Event) => patchAggregate(index, { energy_mode: (event.target as HTMLSelectElement).value as CircuitAggregate["energy_mode"], outputs: { ...aggregate.outputs, kwh: (event.target as HTMLSelectElement).value !== "none" } })}>${ENERGY.map((mode) => html`<option value=${mode} ?selected=${mode === aggregate.energy_mode}>${mode[0]!.toUpperCase()}${mode.slice(1)}</option>`)}</select>
        <small>Any option except None adds ESPHome platform: total_daily_energy sensors in kWh.</small></label>
      <label>Parent <select aria-label=${`${aggregate.aggregate_id} aggregate parent`} .value=${parentId(aggregate) ?? ""}
        @change=${(event: Event) => changeParent(aggregate, (event.target as HTMLSelectElement).value || null)}><option value="" ?selected=${parentId(aggregate) === null}>None</option>${configuration.aggregates.filter((item) => canReparent(aggregate, item)).map((item) => html`<option value=${item.aggregate_id} ?selected=${item.aggregate_id === parentId(aggregate)}>${item.name}</option>`)}</select></label>
      </div>
      <fieldset class="aggregate-channels"><legend>Selected channels</legend>
        <div class="aggregate-channel-groups">${channelGroups.map((group) => html`<section class="aggregate-channel-group" aria-label=${group.board === 0 ? "Main Board channels" : `Add-on ${group.board} channels`}>
          <h4>${group.board === 0 ? "Main Board" : `Add-on ${group.board}`}</h4>
          <div>${group.channels.map((channel) => html`<label class=${`aggregate-channel-option${channelSources(aggregate).includes(channel.channel) ? " selected" : ""}`}><input type="checkbox" aria-label=${`${aggregate.aggregate_id} CT${channel.channel}`} .checked=${channelSources(aggregate).includes(channel.channel)} ?disabled=${aggregate.sources.some((source) => source.kind !== "channel")}
            @change=${(event: Event) => patchAggregate(index, { sources: (event.target as HTMLInputElement).checked ? [...aggregate.sources, { kind: "channel", channel: channel.channel }] : aggregate.sources.filter((source) => source.kind !== "channel" || source.channel !== channel.channel) })} />CT${channel.channel} · ${drafts.get(channel.channel)?.name ?? channel.name}</label>`)}</div>
        </section>`)}</div>
      </fieldset>
      <div class="aggregate-actions">
      <label class="check-row"><input type="checkbox" aria-label=${`${aggregate.aggregate_id} expose power`} .checked=${aggregate.outputs.watts}
        @change=${(event: Event) => patchAggregate(index, { outputs: { ...aggregate.outputs, watts: (event.target as HTMLInputElement).checked } })} />Power</label>
      <label class="check-row"><input type="checkbox" aria-label=${`${aggregate.aggregate_id} expose current`} .checked=${aggregate.outputs.amps}
        @change=${(event: Event) => patchAggregate(index, { outputs: { ...aggregate.outputs, amps: (event.target as HTMLInputElement).checked } })} />Current</label>
      <button class="secondary" @click=${() => update({ ...configuration, aggregates: configuration.aggregates.filter((_item, itemIndex) => itemIndex !== index).map((item) => ({ ...item, sources: item.sources.filter((source) => source.kind !== "aggregate" || source.aggregate_id !== aggregate.aggregate_id) })) })}>Delete aggregate</button>
      </div>
    </fieldset>`)}
    </div>
    ${managedTotals ? html`<button class="secondary" data-action="add-aggregate" @click=${addAggregate}>Create aggregate total</button>` : nothing}
    </details>
  </section>`;
}

export function circuitConfigurationIsValid(configuration: MeterConfigurationRequest, ctCount: number): boolean {
  const references = new Set(configuration.meter.voltage_references.map((reference) => reference.reference_id));
  const referenceByGroup = new Map(configuration.meter.voltage_references.flatMap((reference) => reference.group_keys.map((group) => [group, reference.reference_id] as const)));
  if (configuration.channels.length !== ctCount || new Set(configuration.channels.map((channel) => channel.channel)).size !== ctCount
    || configuration.channels.some((channel) => channel.channel < 1 || channel.channel > ctCount || !channel.name.trim()
      || !references.has(channel.voltage_reference_id) || channel.enabled === (channel.role === "unused")
      || referenceByGroup.get(`${channel.channel <= 6 ? "main" : `addon${Math.floor((channel.channel - 1) / 6)}`}_${Math.floor(((channel.channel - 1) % 6) / 3) + 1}`) !== channel.voltage_reference_id)) return false;
  const ids = new Set<string>();
  try {
    for (const aggregate of configuration.aggregates) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(aggregate.aggregate_id) || ids.has(aggregate.aggregate_id)
        || !aggregate.name.trim() || !aggregate.sources.length
        || new Set(aggregate.sources.map((source) => JSON.stringify(source))).size !== aggregate.sources.length) return false;
      ids.add(aggregate.aggregate_id);
      const needed = aggregate.measurement_method === "two_ct_sum" ? 2 : aggregate.measurement_method === "direct" ? undefined : 1;
      const channels = channelSources(aggregate);
      if (channels.length && channels.length !== aggregate.sources.length
        || needed !== undefined && (channels.length !== needed || channels.length !== aggregate.sources.length)
        || aggregate.energy_mode === "none" && aggregate.outputs.kwh
        || channels.some((channel) => channel < 1 || channel > ctCount || !configuration.channels[channel - 1]?.enabled)) return false;
      const parent = derivedParentId(aggregate.aggregate_id, configuration.aggregates);
      reparentAggregate(aggregate.aggregate_id, parent, configuration.aggregates);
    }
  } catch { return false; }
  return true;
}

export function changesFromDrafts(inventory: CtInventory, drafts: Map<number, CtDraft>): CtChange[] {
  return inventory.channels.flatMap((channel) => {
    const draft = drafts.get(channel.channel);
    if (!draft || !isDirty(channel, draft)) return [];
    if (draft.preserveExistingGain) return [{ channel: channel.channel, name: draft.name.trim(),
      model_id: channel.selected_model_id ?? "", reporting_multiplier: channel.reporting_multiplier }];
    const preset = inventory.catalog.presets.find((item) => item.model_id === draft.modelId);
    const change: CtChange = { channel: channel.channel, name: draft.name.trim(), model_id: draft.modelId, reporting_multiplier: draft.multiplier };
    if (draft.modelId === "custom") {
      if (draft.customGainCt !== undefined) change.custom_gain_ct = draft.customGainCt;
      if (draft.customLabel !== undefined) change.custom_label = draft.customLabel.trim();
      change.burden_output_acknowledged = draft.burdenAcknowledged;
    } else if (preset?.requires_burden_jumper_cut) {
      change.burden_output_acknowledged = draft.burdenAcknowledged;
    }
    return [change];
  });
}

function isDirty(channel: CtInventory["channels"][number], draft: CtDraft): boolean {
  if (draft.preserveExistingGain) return draft.name !== channel.name;
  return draft.name !== channel.name || draft.modelId !== (channel.selected_model_id ?? "") || draft.multiplier !== channel.reporting_multiplier
    || draft.modelId === "custom" && (resultingGain(undefined, draft.multiplier, draft.customGainCt) !== channel.raw_gain_ct
      || (draft.customLabel?.trim() ?? "") !== (channel.display_label ?? ""));
}

function validDraft(inventory: CtInventory, draft: CtDraft): boolean {
  if (draft.preserveExistingGain) return true;
  if (!draft.name.trim() || !draft.modelId || ![1, 2, 4, 8].includes(draft.multiplier)) return false;
  if (draft.modelId === "custom") return Number.isInteger(draft.customGainCt) && draft.customGainCt! >= 1 && draft.customGainCt! <= 65535
    && Boolean(draft.customLabel?.trim()) && !/[\r\n]/.test(draft.customLabel!) && draft.burdenAcknowledged;
  const preset = inventory.catalog.presets.find((item) => item.model_id === draft.modelId);
  return Boolean(preset) && effectiveRangeIsSafe(preset!, draft.multiplier)
    && (!preset?.requires_burden_jumper_cut || draft.burdenAcknowledged);
}

function effectiveRangeIsSafe(preset: CtPreset, multiplier: number): boolean {
  return multiplier * 65.535 >= preset.rated_current_a;
}

export function draftsAreValid(inventory: CtInventory, drafts: Map<number, CtDraft>, labelOnly = false): boolean {
  if (labelOnly) return [...drafts].every(([channel, draft]) => {
    const current = inventory.channels.find((item) => item.channel === channel);
    return Boolean(current) && Boolean(draft.name.trim());
  });
  for (const channel of inventory.channels) {
    const draft = drafts.get(channel.channel);
    if (!draft) return false;
    if (!validDraft(inventory, draft)) return false;
  }
  return true;
}
