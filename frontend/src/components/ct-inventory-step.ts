import { html, nothing, type TemplateResult } from "lit";
import type { CtChange, CtInventory, CtPreset } from "../types";
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
): TemplateResult {
  const boardCount = Math.ceil(inventory.channels.length / 6);
  const rows = inventory.channels.filter((channel) => channel.address.board_index === board).slice(0, 8);
  return html`
    <section class="step-content ct-step" aria-labelledby="step-heading">
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
          <span role="columnheader">CT</span><span role="columnheader">Name</span><span role="columnheader">Model</span><span role="columnheader">Current gain</span><span role="columnheader">Multiplier</span><span role="columnheader">Resulting gain</span><span role="columnheader">Burden</span><span role="columnheader">Status</span>
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
            return html`
              <div class="ct-row" data-ct-row data-ct-group=${channel.address.group_index} role="row" aria-rowindex=${channel.channel + 1} aria-label=${`CT${channel.channel}`}>
                <strong class="ct-index" role="cell">CT${channel.channel}</strong>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${channel.channel} name`} .value=${draft.name}
                  @input=${(event: Event) => update(channel.channel, { name: (event.target as HTMLInputElement).value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${channel.channel} model`} ?disabled=${labelOnly}
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
                <label role="cell"><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${channel.channel} multiplier`} ?disabled=${labelOnly}
                  .value=${String(draft.multiplier)} @input=${(event: Event) => update(channel.channel, { multiplier: Number((event.target as HTMLInputElement).value) })} /></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${gain ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${preset?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${draft.expanded} @click=${() => update(channel.channel, { expanded: !draft.expanded })}>
                  ${draft.modelId ? dirty ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${draft.modelId === "custom" ? html`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${channel.channel} custom gain`}
                  ?disabled=${labelOnly}
                  .value=${draft.customGainCt === undefined ? "" : String(draft.customGainCt)}
                  @input=${(event: Event) => update(channel.channel, { customGainCt: Number((event.target as HTMLInputElement).value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${channel.channel} custom label`} ?disabled=${labelOnly} .value=${draft.customLabel ?? ""}
                  @input=${(event: Event) => update(channel.channel, { customLabel: (event.target as HTMLInputElement).value })} /></label>
              </div>` : nothing}
              ${draft.modelId === "custom" || preset?.requires_burden_jumper_cut ? html`<div class="warning-band">
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
      <footer class="action-footer">
        <button class="secondary" @click=${back}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${busy || !draftsAreValid(inventory, drafts, labelOnly)} @click=${review}>${busy ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
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
  if (!draft.name.trim() || !draft.modelId || !Number.isFinite(draft.multiplier) || draft.multiplier <= 0) return false;
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
