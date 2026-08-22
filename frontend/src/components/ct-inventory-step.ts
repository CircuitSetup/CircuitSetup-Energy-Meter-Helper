import { html, nothing, type TemplateResult } from "lit";
import type { CtChange, CtInventory, CtPreset } from "../types";

export interface CtDraft {
  name: string;
  modelId: string;
  multiplier: number;
  expanded: boolean;
}

const resultingGain = (preset: CtPreset | undefined, multiplier: number) =>
  preset?.default_gain_ct == null || !Number.isFinite(multiplier) || multiplier <= 0
    ? null
    : Math.round(preset.default_gain_ct / multiplier);

export function ctInventoryStep(
  inventory: CtInventory,
  board: number,
  group: number,
  drafts: Map<number, CtDraft>,
  setBoard: (board: number) => void,
  setGroup: (group: number) => void,
  update: (channel: number, patch: Partial<CtDraft>) => void,
  review: () => void,
): TemplateResult {
  const boardCount = Math.ceil(inventory.channels.length / 6);
  const rows = inventory.channels.filter((channel) => channel.address.board_index === board).slice(0, 8);
  return html`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards">
        ${Array.from({ length: boardCount }, (_, index) => html`
          <button role="tab" data-board-tab=${index} aria-selected=${index === board}
            @click=${() => setBoard(index)}>${index === 0 ? "Main Board" : `Add-on ${index}`}</button>
        `)}
      </div>
      <div class="group-nav" aria-label="Three-channel groups">
        <button data-group-nav aria-current=${group === 0} @click=${() => setGroup(0)}>Group 1 · CT${board * 6 + 1}–${board * 6 + 3}</button>
        <button data-group-nav aria-current=${group === 1} @click=${() => setGroup(1)}>Group 2 · CT${board * 6 + 4}–${board * 6 + 6}</button>
      </div>
      <p>Configure each CT on this board. Select its model, adjust the multiplier, and review the resulting gain.</p>
      <div class="ct-table" role="table" aria-rowcount=${inventory.channels.length}>
        <div class="ct-header" role="row">
          <span>Name</span><span>Model</span><span>Current gain</span><span>Multiplier</span><span>Resulting gain</span><span>Burden</span><span>Status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${rows.map((channel) => {
            const draft = drafts.get(channel.channel) ?? {
              name: channel.name,
              modelId: channel.selected_model_id ?? "",
              multiplier: channel.reporting_multiplier,
              expanded: false,
            };
            const preset = inventory.catalog.presets.find((item) => item.model_id === draft.modelId);
            const gain = resultingGain(preset, draft.multiplier);
            const dirty = draft.name !== channel.name || draft.modelId !== (channel.selected_model_id ?? "") || draft.multiplier !== channel.reporting_multiplier;
            return html`
              <div class="ct-row" data-ct-row data-ct-group=${channel.address.group_index - 1} role="row" aria-label=${`CT${channel.channel}`}>
                <label><span class="mobile-label">Name</span><input aria-label=${`CT${channel.channel} name`} .value=${draft.name}
                  @input=${(event: Event) => update(channel.channel, { name: (event.target as HTMLInputElement).value })} /></label>
                <label><span class="mobile-label">Model</span><select aria-label=${`CT${channel.channel} model`}
                  @change=${(event: Event) => update(channel.channel, { modelId: (event.target as HTMLSelectElement).value, expanded: true })}>
                  <option value="" ?selected=${draft.modelId === ""}>Choose model</option>
                  ${inventory.catalog.presets.map((item) => html`<option value=${item.model_id} ?selected=${draft.modelId === item.model_id}>${item.label}</option>`)}
                  <option value="custom" ?selected=${draft.modelId === "custom"}>Custom</option>
                </select></label>
                <span><span class="mobile-label">Current gain</span>${channel.raw_gain_ct}</span>
                <label><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${channel.channel} multiplier`}
                  .value=${String(draft.multiplier)} @input=${(event: Event) => update(channel.channel, { multiplier: Number((event.target as HTMLInputElement).value) })} /></label>
                <span><span class="mobile-label">Resulting gain</span>${gain ?? "—"}</span>
                <span><span class="mobile-label">Burden</span>${preset?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button class="row-toggle" aria-expanded=${draft.expanded} @click=${() => update(channel.channel, { expanded: !draft.expanded })}>
                  ${draft.modelId ? dirty ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
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
      <p class="row-count">Showing ${rows.length} of ${inventory.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary">Back</button>
        <button class="primary" ?disabled=${[...drafts.values()].every((draft, index) => {
          const channel = inventory.channels[index];
          return channel !== undefined && draft.name === channel.name && draft.modelId === (channel.selected_model_id ?? "") && draft.multiplier === channel.reporting_multiplier;
        })} @click=${review}>Review changes</button>
      </footer>
    </section>
  `;
}

export function changesFromDrafts(inventory: CtInventory, drafts: Map<number, CtDraft>): CtChange[] {
  return inventory.channels.flatMap((channel) => {
    const draft = drafts.get(channel.channel);
    if (!draft || (draft.name === channel.name && draft.modelId === (channel.selected_model_id ?? "") && draft.multiplier === channel.reporting_multiplier)) return [];
    return [{ channel: channel.channel, name: draft.name, model_id: draft.modelId, reporting_multiplier: draft.multiplier }];
  });
}
