import { html, nothing, type TemplateResult } from "lit";
import type { ChannelSettings, CircuitAggregate, CircuitRole, CtChange, CtInventory, CtPreset, MeterConfiguration, MeterConfigurationRequest, TotalsInventory } from "../types";
import { derivedParentId, reparentAggregate } from "../total-graph";
import { moveTab } from "./tab-keyboard";
import { defaultTotalsSection } from "./default-totals-section";
import { automaticTotalsSection } from "./automatic-totals-section";
import { advancedTotalsEditor } from "./advanced-totals-editor";
import { totalsMigrationReview } from "./totals-migration-review";

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
  nativeGraphState: "ready" | "pending" | "invalid" = "ready",
  automaticTotalsWritable = false,
  meterInventory: MeterConfiguration | null = null,
  automaticSourcesFresh = freshTotals,
  existingConfiguration: MeterConfigurationRequest | null = null,
  skip: () => void = () => undefined,
  reviewRequirements: TemplateResult | typeof nothing = nothing,
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
            const existing = existingConfiguration?.channels.find((item) => item.channel === channel.channel);
            const retained = keepsExistingCtSettings(draft, existing);
            const valid = labelOnly ? Boolean(draft.name.trim()) : validDraft(inventory, draft, existing);
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
                      burdenAcknowledged: (existing ? existing.burden_output_acknowledged : channel.selection_verified_against_config)
                        && modelId === channel.selected_model_id
                        && (modelId === "custom" || selectedPreset?.requires_burden_jumper_cut === true),
                      expanded: true,
                    });
                  }}>
                  <option value="" ?selected=${draft.modelId === ""}>Choose model</option>
                  ${inventory.catalog.presets.map((item) => html`<option value=${item.model_id} ?selected=${draft.modelId === item.model_id}>${item.label}</option>`)}
                  <option value="custom" ?selected=${draft.modelId === "custom"}>${retained && existing?.model_id === "custom" && !existing.burden_output_acknowledged ? "Keep existing gain" : "Custom"}</option>
                </select>${preset ? html`<small>${preset.rated_current_a} A</small>` : nothing}<button class="row-toggle" aria-label=${`CT${channel.channel} technical details`} aria-expanded=${draft.expanded} @click=${() => update(channel.channel, { expanded: !draft.expanded })}>${!valid ? "Needs attention" : draft.modelId ? dirty ? "Changed" : "OK" : "Choose model"}</button><span class="sr-status" data-voltage-reference>${reference?.label || reference?.reference_id || circuit?.voltage_reference_id || "—"}</span></label>
                <span role="cell"><span class="mobile-label">Range status</span>${draft.preserveExistingGain ? "Existing gain kept" : recommendation === null && preset ? "Rating exceeds ×8 range" : effectiveRange < (preset?.rated_current_a ?? 0) ? `Too small: ${effectiveRange} A` : `Up to ${effectiveRange} A`}<small>Reporting multiplier: ×${draft.multiplier}</small></span>
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
              ${draft.expanded && retained && !draft.burdenAcknowledged && (draft.modelId === "custom" || preset?.requires_burden_jumper_cut) ? html`<p class="info-band">Existing CT settings retained. Changing CT settings requires any applicable burden-output confirmation.</p>` : nothing}
              ${draft.expanded && !retained && (draft.modelId === "custom" || preset?.requires_burden_jumper_cut) ? html`<div class="warning-band">
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
      ${configuration && meterInventory ? totalsMigrationReview(meterInventory, updateConfiguration, nativePreview, freshTotals) : nothing}
      ${configuration && totals ? defaultTotalsSection(configuration, totals, nativeTotalsReadable, nativeTotalsWritable, updateConfiguration, nativeGraphState) : nothing}
      ${configuration && totals ? automaticTotalsSection(configuration, freshTotals ? totals : null, automaticTotalsWritable, updateConfiguration) : nothing}
      ${configuration ? advancedTotalsEditor(configuration, drafts, updateConfiguration, managedTotals, managedTotalsReason, totals, nativePreview, freshTotals, automaticSourcesFresh) : nothing}
      ${reviewRequirements}
      <footer class="action-footer offset-footer">
        <button class="secondary" @click=${back}>Back</button>
        <button class="secondary" data-action="skip-ct" ?disabled=${busy} @click=${skip}>Skip to Calibration</button>
        <button class="primary" data-action="continue" ?disabled=${busy || !continueAllowed || !draftsAreValid(inventory, drafts, labelOnly, existingConfiguration)} @click=${review}>${busy ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}

const ROLES = ["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom", "unused"] as const;
function roleLabel(role: CircuitRole): string {
  return role === "grid" ? "Mains" : role === "branch" ? "Branch circuit" : role.replaceAll("_", " ");
}

const channelSources = (aggregate: CircuitAggregate): number[] => aggregate.sources.flatMap((source) => source.kind === "channel" ? [source.channel] : []);


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

function keepsExistingCtSettings(draft: CtDraft, existing?: ChannelSettings): boolean {
  return Boolean(existing && draft.modelId === existing.model_id && draft.multiplier === existing.reporting_multiplier
    && (draft.customGainCt ?? null) === existing.custom_gain_ct
    && (draft.customLabel?.trim() || null) === existing.custom_label);
}

function validDraft(inventory: CtInventory, draft: CtDraft, existing?: ChannelSettings): boolean {
  if (draft.preserveExistingGain) return true;
  if (!draft.name.trim() || !draft.modelId || ![1, 2, 4, 8].includes(draft.multiplier)) return false;
  if (draft.modelId === "custom") return Number.isInteger(draft.customGainCt) && draft.customGainCt! >= 1 && draft.customGainCt! <= 65535
    && Boolean(draft.customLabel?.trim()) && !/[\r\n]/.test(draft.customLabel!) && (draft.burdenAcknowledged || keepsExistingCtSettings(draft, existing));
  const preset = inventory.catalog.presets.find((item) => item.model_id === draft.modelId);
  return Boolean(preset) && effectiveRangeIsSafe(preset!, draft.multiplier)
    && (!preset?.requires_burden_jumper_cut || draft.burdenAcknowledged || keepsExistingCtSettings(draft, existing));
}

function effectiveRangeIsSafe(preset: CtPreset, multiplier: number): boolean {
  return multiplier * 65.535 >= preset.rated_current_a;
}

export function draftsAreValid(inventory: CtInventory, drafts: Map<number, CtDraft>, labelOnly = false, existingConfiguration: MeterConfigurationRequest | null = null): boolean {
  if (labelOnly) return [...drafts].every(([channel, draft]) => {
    const current = inventory.channels.find((item) => item.channel === channel);
    return Boolean(current) && Boolean(draft.name.trim());
  });
  for (const channel of inventory.channels) {
    const draft = drafts.get(channel.channel);
    if (!draft) return false;
    if (!validDraft(inventory, draft, existingConfiguration?.channels.find((item) => item.channel === channel.channel))) return false;
  }
  return true;
}
