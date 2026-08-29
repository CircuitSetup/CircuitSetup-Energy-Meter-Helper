import { html, nothing, type TemplateResult } from "lit";
import type { ChannelSettings, CircuitAggregate, CircuitRole, CtChange, CtInventory, CtPreset, MeterConfigurationRequest } from "../types";
import { moveTab } from "./tab-keyboard";

export interface CtDraft {
  name: string;
  modelId: string;
  multiplier: number;
  customGainCt?: number | undefined;
  customLabel?: string | undefined;
  burdenAcknowledged: boolean;
  expanded: boolean;
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
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: boardCount }, (_, index) => html`
          <button role="tab" id=${`board-tab-${index}`} data-board-tab=${index} aria-selected=${index === board}
            aria-controls="board-panel" tabindex=${index === board ? "0" : "-1"}
            @keydown=${(event: KeyboardEvent) => moveTab(event, index)}
            @click=${() => setBoard(index)}>${index === 0 ? "Main Board" : `Add-on ${index}`}</button>
        `)}
      </div>
      <p>Configure each CT on this board. Select its model, adjust the multiplier, and review the resulting gain.</p>
      <p class="info-band">If you expect to measure more than 65.535 A on a CT, use a multiplier of 2 for a 120 A CT or 4 for a 200 A CT. The multiplier divides the gain and multiplies current and power output by the same amount.</p>
      <div id="board-panel" role="tabpanel" aria-labelledby=${`board-tab-${board}`}>
      <div class="ct-table" role="table" aria-rowcount=${inventory.channels.length + 1}>
        <div class="ct-header" role="row" aria-rowindex="1">
          <span role="columnheader">CT</span><span role="columnheader">Used</span><span role="columnheader">Role</span><span role="columnheader">Voltage reference</span><span role="columnheader">Name</span><span role="columnheader">Model</span><span role="columnheader">Current gain</span><span role="columnheader">Multiplier</span><span role="columnheader">Resulting gain</span><span role="columnheader">Burden</span><span role="columnheader">Status</span>
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
            const circuit = configuration?.channels.find((item) => item.channel === channel.channel);
            const reference = referenceByGroup.get(`${channel.address.board_index === 0 ? "main" : `addon${channel.address.board_index}`}_${channel.address.group_index + 1}`);
            return html`
              <div class="ct-row" data-ct-row data-ct-group=${channel.address.group_index} role="row" aria-rowindex=${channel.channel + 1} aria-label=${`CT${channel.channel}`}>
                <strong class="ct-index" role="cell">CT${channel.channel}</strong>
                ${circuit ? html`<label role="cell" class="check-row"><span class="mobile-label">Used</span><input type="checkbox" aria-label=${`CT${channel.channel} used`} .checked=${circuit.enabled}
                  @change=${(event: Event) => (event.target as HTMLInputElement).checked
                    ? patchChannel(channel.channel, { enabled: true, role: circuit.role === "unused" ? "branch" : circuit.role })
                    : disableChannel(channel.channel)} /></label>` : html`<span role="cell"><span class="mobile-label">Used</span>—</span>`}
                ${circuit ? html`<label role="cell"><span class="mobile-label">Role</span><select aria-label=${`CT${channel.channel} role`} .value=${circuit.role} ?disabled=${!circuit.enabled}
                  @change=${(event: Event) => patchChannel(channel.channel, { role: (event.target as HTMLSelectElement).value as ChannelSettings["role"] })}>
                  ${ROLES.filter((role) => role !== "unused").map((role) => html`<option value=${role}>${roleLabel(role)}</option>`)}</select></label>` : html`<span role="cell"><span class="mobile-label">Role</span>—</span>`}
                <span role="cell" data-voltage-reference><span class="mobile-label">Voltage reference</span>${reference?.label || reference?.reference_id || circuit?.voltage_reference_id || "—"}</span>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${channel.channel} name`} .value=${draft.name}
                  @input=${(event: Event) => update(channel.channel, { name: (event.target as HTMLInputElement).value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${channel.channel} model`} .value=${draft.modelId} ?disabled=${labelOnly}
                  @change=${(event: Event) => {
                    const modelId = (event.target as HTMLSelectElement).value;
                    const selectedPreset = inventory.catalog.presets.find((item) => item.model_id === modelId);
                    update(channel.channel, {
                      modelId,
                      burdenAcknowledged: channel.selection_verified_against_config
                        && modelId === channel.selected_model_id
                        && (modelId === "custom" || selectedPreset?.requires_burden_jumper_cut === true),
                      expanded: true,
                    });
                  }}>
                  <option value="" ?selected=${draft.modelId === ""}>Choose model</option>
                  ${inventory.catalog.presets.map((item) => html`<option value=${item.model_id} ?selected=${draft.modelId === item.model_id}>${item.label}</option>`)}
                  <option value="custom" ?selected=${draft.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${channel.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><select aria-label=${`CT${channel.channel} multiplier`} .value=${String(draft.multiplier)} ?disabled=${labelOnly}
                  @change=${(event: Event) => update(channel.channel, { multiplier: Number((event.target as HTMLSelectElement).value) })}>
                  ${[1, 2, 4, 8].map((value) => html`<option value=${value} ?selected=${draft.multiplier === value}>${value}</option>`)}
                </select></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${gain ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${preset?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${draft.expanded} @click=${() => update(channel.channel, { expanded: !draft.expanded })}>
                  ${draft.modelId ? dirty ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
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
              ${preset && preset.rated_current_a > 65.535 && draft.multiplier === 1 ? html`<div class="warning-band" role="status">CT${channel.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : nothing}
              ${draft.expanded && preset ? html`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${preset.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${preset.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${preset.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${preset.notes || (preset.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : nothing}
            `;
          })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${rows[0]?.channel ?? 0}–${rows.at(-1)?.channel ?? 0} of ${inventory.channels.length} CTs</p>
      ${configuration ? circuitsEditor(configuration, drafts, updateConfiguration, managedTotals, managedTotalsReason) : nothing}
      <footer class="action-footer">
        <button class="secondary" @click=${back}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${busy || !draftsAreValid(inventory, drafts, labelOnly)} @click=${review}>${busy ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}

const ROLES = ["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom", "unused"] as const;
const METHODS = ["direct", "two_ct_sum", "one_ct_double_power", "both_conductors_one_ct"] as const;
const ENERGY = ["none", "consumption", "bidirectional", "generation"] as const;
const automaticAggregates = {
  grid: { aggregate_id: "auto-mains", name: "Mains", energy_mode: "bidirectional", expose_current: false },
  solar: { aggregate_id: "auto-solar", name: "Solar", energy_mode: "generation", expose_current: false },
  subpanel: { aggregate_id: "auto-subpanel", name: "Subpanel", energy_mode: "consumption", expose_current: false },
  two_pole: { aggregate_id: "auto-two-pole", name: "Two-pole circuit", energy_mode: "consumption", expose_current: false },
} as const;

function roleLabel(role: CircuitRole): string {
  return role === "grid" ? "Mains" : role === "branch" ? "Branch circuit" : role.replaceAll("_", " ");
}

function sameAggregate(first: CircuitAggregate, second: CircuitAggregate): boolean {
  return first.aggregate_id === second.aggregate_id && first.name === second.name && first.role === second.role
    && first.measurement_method === second.measurement_method && first.parent_id === second.parent_id
    && first.energy_mode === second.energy_mode && first.expose_power === second.expose_power
    && first.expose_current === second.expose_current && first.channels.length === second.channels.length
    && first.channels.every((channel, index) => channel === second.channels[index]);
}

export function reconcileSplitPhaseAggregates(
  configuration: MeterConfigurationRequest,
  previousManaged: readonly CircuitAggregate[] | null = null,
): { configuration: MeterConfigurationRequest; managed: CircuitAggregate[]; changed: boolean } {
  const definitionFor = (aggregate: CircuitAggregate) => Object.entries(automaticAggregates)
    .find(([, definition]) => definition.aggregate_id === aggregate.aggregate_id) as [keyof typeof automaticAggregates, (typeof automaticAggregates)[keyof typeof automaticAggregates]] | undefined;
  const isManaged = (aggregate: CircuitAggregate) => {
    if (previousManaged !== null) return previousManaged.some((item) => sameAggregate(item, aggregate));
    const definition = definitionFor(aggregate);
    const channels = definition === undefined ? [] : configuration.channels
      .filter((channel) => channel.enabled && channel.role === definition[0]).map((channel) => channel.channel);
    return definition !== undefined && aggregate.role === definition[0] && aggregate.name === definition[1].name
      && aggregate.measurement_method === "two_ct_sum" && aggregate.parent_id === null
      && aggregate.energy_mode === definition[1].energy_mode && aggregate.expose_power && aggregate.expose_current === definition[1].expose_current
      && aggregate.channels.length === 2 && aggregate.channels.every((channel, index) => channel === channels[index]);
  };
  const managed = configuration.aggregates.filter(isManaged);
  const preserved = configuration.aggregates.filter((aggregate) => !isManaged(aggregate));
  const preservedIds = new Set(preserved.map((aggregate) => aggregate.aggregate_id));
  const claimed = new Set(preserved.flatMap((aggregate) => aggregate.channels));
  const rebuilt = ["split_phase_120_240", "custom"].includes(configuration.meter.electrical_system)
    ? (Object.keys(automaticAggregates) as Array<keyof typeof automaticAggregates>).flatMap((role) => {
      const channels = configuration.channels.filter((channel) => channel.enabled && channel.role === role && !claimed.has(channel.channel)).map((channel) => channel.channel);
      const definition = automaticAggregates[role];
      return channels.length === 2 && !preservedIds.has(definition.aggregate_id) ? [{ ...definition, role, channels, measurement_method: "two_ct_sum" as const,
        parent_id: null, expose_power: true }] : [];
    }) : [];
  const rebuiltIds = new Set<string>(rebuilt.map((aggregate) => aggregate.aggregate_id));
  const removedIds = new Set(managed.map((aggregate) => aggregate.aggregate_id));
  const aggregates = [...preserved.map((aggregate) => aggregate.parent_id !== null
    && removedIds.has(aggregate.parent_id) && !rebuiltIds.has(aggregate.parent_id) ? { ...aggregate, parent_id: null } : aggregate), ...rebuilt];
  const changed = aggregates.length !== configuration.aggregates.length
    || aggregates.some((aggregate, index) => !sameAggregate(aggregate, configuration.aggregates[index]!));
  return { configuration: changed ? { ...configuration, aggregates } : configuration, managed: rebuilt, changed };
}

function circuitsEditor(
  configuration: MeterConfigurationRequest,
  drafts: Map<number, CtDraft>,
  update: (configuration: MeterConfigurationRequest) => void,
  managedTotals: boolean,
  managedTotalsReason: string,
): TemplateResult {
  const patchAggregate = (index: number, patch: Partial<CircuitAggregate>) => update({ ...configuration,
    aggregates: configuration.aggregates.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  const renameAggregate = (index: number, aggregateId: string) => {
    const old = configuration.aggregates[index]!.aggregate_id;
    update({ ...configuration, aggregates: configuration.aggregates.map((item, itemIndex) => itemIndex === index
      ? { ...item, aggregate_id: aggregateId } : item.parent_id === old ? { ...item, parent_id: aggregateId } : item) });
  };
  const addAggregate = () => {
    const ids = new Set(configuration.aggregates.map((aggregate) => aggregate.aggregate_id));
    let number = 1;
    while (ids.has(`aggregate-${number}`)) number += 1;
    update({ ...configuration, aggregates: [...configuration.aggregates, {
      aggregate_id: `aggregate-${number}`, name: `Aggregate total ${number}`, role: "branch", channels: [],
      measurement_method: "two_ct_sum", parent_id: null, energy_mode: "consumption", expose_power: true, expose_current: false,
    }] });
  };
  const channelGroups = Array.from({ length: Math.ceil(configuration.channels.length / 6) }, (_, board) => ({
    board,
    channels: configuration.channels.filter((channel) => channel.enabled && Math.floor((channel.channel - 1) / 6) === board),
  })).filter((group) => group.channels.length);
  const warnings = configuration.aggregates.flatMap((aggregate) => [
    aggregate.role === "grid" && aggregate.channels.some((channel) => configuration.channels[channel - 1]?.role === "branch") ? `${aggregate.name}: keep branch loads out of the root-grid total.` : "",
    aggregate.measurement_method === "one_ct_double_power" && aggregate.channels.length !== 1 ? `${aggregate.name}: doubled-one-leg measurement requires exactly one CT.` : "",
    aggregate.role === "two_pole" && !["one_ct_double_power", "both_conductors_one_ct", "two_ct_sum"].includes(aggregate.measurement_method) ? `${aggregate.name}: select a two-pole measurement method.` : "",
    aggregate.role === "two_pole" && aggregate.channels.some((channel) => configuration.aggregates.filter((item) => item.role === "two_pole" && item.channels.includes(channel)).length > 1) ? `${aggregate.name}: a CT cannot belong to two two-pole aggregates.` : "",
  ].filter(Boolean));
  return html`<section class="step-content" aria-labelledby="aggregates-heading">
    <h2 id="aggregates-heading">Aggregate totals</h2>
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
        @change=${(event: Event) => patchAggregate(index, { role: (event.target as HTMLSelectElement).value as CircuitAggregate["role"] })}>${ROLES.filter((role) => role !== "unused").map((role) => html`<option value=${role}>${roleLabel(role)}</option>`)}</select>
        <small>Describes how this total is used, such as mains, solar, or a branch circuit.</small></label>
      <label>Method <select aria-label=${`${aggregate.aggregate_id} aggregate method`} .value=${aggregate.measurement_method}
        @change=${(event: Event) => patchAggregate(index, { measurement_method: (event.target as HTMLSelectElement).value as CircuitAggregate["measurement_method"] })}>${METHODS.map((method) => html`<option value=${method}>${method === "two_ct_sum" ? "Two CT Sum" : method.replaceAll("_", " ")}</option>`)}</select>
        <small>Controls how CT readings are combined. Two CT Sum adds exactly two CTs.</small></label>
      <label>Energy <select aria-label=${`${aggregate.aggregate_id} aggregate energy`} .value=${aggregate.energy_mode}
        @change=${(event: Event) => patchAggregate(index, { energy_mode: (event.target as HTMLSelectElement).value as CircuitAggregate["energy_mode"] })}>${ENERGY.map((mode) => html`<option value=${mode}>${mode[0]!.toUpperCase()}${mode.slice(1)}</option>`)}</select>
        <small>Any option except None adds ESPHome platform: total_daily_energy sensors in kWh.</small></label>
      <label>Parent <select aria-label=${`${aggregate.aggregate_id} aggregate parent`} .value=${aggregate.parent_id ?? ""}
        @change=${(event: Event) => patchAggregate(index, { parent_id: (event.target as HTMLSelectElement).value || null })}><option value="">None</option>${configuration.aggregates.filter((item) => item.aggregate_id !== aggregate.aggregate_id).map((item) => html`<option value=${item.aggregate_id}>${item.name}</option>`)}</select></label>
      </div>
      <fieldset class="aggregate-channels"><legend>Selected channels</legend>
        <div class="aggregate-channel-groups">${channelGroups.map((group) => html`<section class="aggregate-channel-group" aria-label=${group.board === 0 ? "Main Board channels" : `Add-on ${group.board} channels`}>
          <h4>${group.board === 0 ? "Main Board" : `Add-on ${group.board}`}</h4>
          <div>${group.channels.map((channel) => html`<label class=${`aggregate-channel-option${aggregate.channels.includes(channel.channel) ? " selected" : ""}`}><input type="checkbox" aria-label=${`${aggregate.aggregate_id} CT${channel.channel}`} .checked=${aggregate.channels.includes(channel.channel)}
            @change=${(event: Event) => patchAggregate(index, { channels: (event.target as HTMLInputElement).checked ? [...aggregate.channels, channel.channel].sort((first, second) => first - second) : aggregate.channels.filter((item) => item !== channel.channel) })} />CT${channel.channel} · ${drafts.get(channel.channel)?.name ?? channel.name}</label>`)}</div>
        </section>`)}</div>
      </fieldset>
      <div class="aggregate-actions">
      <label class="check-row"><input type="checkbox" aria-label=${`${aggregate.aggregate_id} expose power`} .checked=${aggregate.expose_power}
        @change=${(event: Event) => patchAggregate(index, { expose_power: (event.target as HTMLInputElement).checked })} />Power</label>
      <label class="check-row"><input type="checkbox" aria-label=${`${aggregate.aggregate_id} expose current`} .checked=${aggregate.expose_current}
        @change=${(event: Event) => patchAggregate(index, { expose_current: (event.target as HTMLInputElement).checked })} />Current</label>
      <button class="secondary" @click=${() => update({ ...configuration, aggregates: configuration.aggregates.filter((_item, itemIndex) => itemIndex !== index).map((item) => item.parent_id === aggregate.aggregate_id ? { ...item, parent_id: null } : item) })}>Delete aggregate</button>
      </div>
    </fieldset>`)}
    </div>
    ${managedTotals ? html`<button class="secondary" data-action="add-aggregate" @click=${addAggregate}>Create aggregate total</button>` : nothing}
  </section>`;
}

export function circuitConfigurationIsValid(configuration: MeterConfigurationRequest, ctCount: number): boolean {
  const references = new Set(configuration.meter.voltage_references.map((reference) => reference.reference_id));
  const referenceByGroup = new Map(configuration.meter.voltage_references.flatMap((reference) => reference.group_keys.map((group) => [group, reference.reference_id] as const)));
  if (configuration.channels.length !== ctCount || new Set(configuration.channels.map((channel) => channel.channel)).size !== ctCount
    || configuration.channels.some((channel) => channel.channel < 1 || channel.channel > ctCount || !channel.name.trim()
      || !references.has(channel.voltage_reference_id) || channel.enabled === (channel.role === "unused")
      || referenceByGroup.get(`${channel.channel <= 6 ? "main" : `addon${Math.floor((channel.channel - 1) / 6)}`}_${Math.floor(((channel.channel - 1) % 6) / 3) + 1}`) !== channel.voltage_reference_id)) return false;
  const ids = new Set<string>(); const claimed = new Set<number>(); const parents = new Map<string, string | null>();
  for (const aggregate of configuration.aggregates) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(aggregate.aggregate_id) || ids.has(aggregate.aggregate_id)
      || !aggregate.name.trim() || !aggregate.channels.length || new Set(aggregate.channels).size !== aggregate.channels.length) return false;
    ids.add(aggregate.aggregate_id); parents.set(aggregate.aggregate_id, aggregate.parent_id);
    const needed = aggregate.measurement_method === "two_ct_sum" ? 2
      : aggregate.measurement_method === "one_ct_double_power" || aggregate.measurement_method === "both_conductors_one_ct" ? 1 : undefined;
    if (needed !== undefined && aggregate.channels.length !== needed
      || aggregate.channels.some((channel) => channel < 1 || channel > ctCount || claimed.has(channel)
        || !configuration.channels[channel - 1]?.enabled)) return false;
    aggregate.channels.forEach((channel) => claimed.add(channel));
  }
  for (const [id, parent] of parents) {
    const seen = new Set<string>();
    for (let current = parent; current !== null; current = parents.get(current) ?? null) {
      if (!ids.has(current) || current === id || seen.has(current)) return false;
      seen.add(current);
    }
  }
  return true;
}

export function changesFromDrafts(inventory: CtInventory, drafts: Map<number, CtDraft>): CtChange[] {
  return inventory.channels.flatMap((channel) => {
    const draft = drafts.get(channel.channel);
    if (!draft || !isDirty(channel, draft)) return [];
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
  return draft.name !== channel.name || draft.modelId !== (channel.selected_model_id ?? "") || draft.multiplier !== channel.reporting_multiplier
    || draft.modelId === "custom" && (resultingGain(undefined, draft.multiplier, draft.customGainCt) !== channel.raw_gain_ct
      || (draft.customLabel?.trim() ?? "") !== (channel.display_label ?? ""));
}

function validDraft(inventory: CtInventory, draft: CtDraft): boolean {
  if (!draft.name.trim() || !draft.modelId || ![1, 2, 4, 8].includes(draft.multiplier)) return false;
  if (draft.modelId === "custom") return Number.isInteger(draft.customGainCt) && draft.customGainCt! >= 1 && draft.customGainCt! <= 65535
    && Boolean(draft.customLabel?.trim()) && !/[\r\n]/.test(draft.customLabel!) && draft.burdenAcknowledged;
  const preset = inventory.catalog.presets.find((item) => item.model_id === draft.modelId);
  return Boolean(preset) && (!preset?.requires_burden_jumper_cut || draft.burdenAcknowledged);
}

export function draftsAreValid(inventory: CtInventory, drafts: Map<number, CtDraft>, labelOnly = false): boolean {
  if (labelOnly) return [...drafts].every(([channel, draft]) => {
    const current = inventory.channels.find((item) => item.channel === channel);
    return Boolean(current) && Boolean(draft.name.trim())
      && draft.modelId === (current!.selected_model_id ?? "")
      && draft.multiplier === current!.reporting_multiplier;
  });
  for (const channel of inventory.channels) {
    const draft = drafts.get(channel.channel);
    if (!draft) return false;
    if (isDirty(channel, draft)) {
      if (!validDraft(inventory, draft)) return false;
    }
  }
  return true;
}
