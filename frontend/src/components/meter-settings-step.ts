import { html, nothing, type TemplateResult } from "lit";

import type { BoardPackageOptions, ElectricalSystem, LineFrequencyHz, MeterSettingsDraft, VoltageTransformerCatalog } from "../types";
import { packageOptions } from "./package-options";

const SYSTEMS: Array<[ElectricalSystem, string]> = [
  ["split_phase_120_240", "Split phase 120/240 V"], ["single_phase_230", "Single phase 230 V"],
  ["three_phase", "Three phase"], ["custom", "Custom"],
];
const INTERVALS = [1, 2, 5, 10, 30, 60] as const;
const intervalImpact = (interval: number): string | null => interval <= 5
  ? "1–5 seconds: high traffic."
  : interval === 10 ? null
    : interval >= 30 ? "30–60 seconds: lower traffic; guided calibration takes longer."
      : "This interval affects update traffic and guided calibration time.";

export function meterSettingsStep(
  draft: MeterSettingsDraft,
  catalog: VoltageTransformerCatalog,
  acknowledged: boolean,
  update: (draft: MeterSettingsDraft) => void,
  setProfile: (value: ElectricalSystem) => void,
  setFrequency: (value: LineFrequencyHz) => void,
  setNominalVoltage: (referenceId: string, value: number) => void,
  setAcknowledged: (value: boolean) => void,
  back: () => void,
  continueToCircuits: () => void,
  boardPackages: BoardPackageOptions | null = null,
  setBoardPackages: (options: BoardPackageOptions) => void = () => undefined,
  profileConfirmed = true,
  setProfileConfirmed: (value: boolean) => void = () => undefined,
): TemplateResult {
  const multiReference = draft.voltage_references.length > 1;
  const valid = profileConfirmed && Boolean(draft.friendly_name.trim()) && draft.voltage_references.every((reference) =>
    reference.label.trim() && reference.phase_label.trim() && Number.isFinite(reference.nominal_voltage_v)
      && reference.nominal_voltage_v >= 1 && reference.nominal_voltage_v <= 600
      && Number.isInteger(reference.gain_voltage) && reference.gain_voltage >= 1 && reference.gain_voltage <= 65535
      && reference.group_keys.length) && (!multiReference || acknowledged);
  const patch = (change: Partial<MeterSettingsDraft>) => {
    setAcknowledged(false);
    update({ ...draft, ...change });
  };
  const moveGroup = (group: string, referenceId: string, select: HTMLSelectElement) => {
    const source = draft.voltage_references.find((reference) => reference.group_keys.includes(group));
    const target = draft.voltage_references.find((reference) => reference.reference_id === referenceId);
    if (!source || !target || source === target) return;
    const replacement = source.group_keys.length === 1 ? target.group_keys[0] : undefined;
    if (replacement && !window.confirm(`Moving ${group} would empty ${source.label || source.reference_id}. Confirm the disclosed swap with ${replacement}.`)) {
      select.value = source.reference_id;
      return;
    }
    patch({ voltage_references: draft.voltage_references.map((reference) => ({ ...reference,
      group_keys: reference === source ? replacement ? [replacement] : reference.group_keys.filter((key) => key !== group)
        : reference === target ? [...reference.group_keys.filter((key) => key !== replacement), group] : reference.group_keys,
    })) });
  };
  const addableGroups = draft.voltage_references.flatMap((reference) => reference.group_keys.length > 1 ? reference.group_keys : []);
  const addReference = (event: Event) => {
    const select = (event.currentTarget as HTMLElement).parentElement?.querySelector<HTMLSelectElement>("[data-new-reference-group]");
    const group = select?.value;
    const source = draft.voltage_references.find((reference) => group && reference.group_keys.includes(group));
    if (!group || !source || source.group_keys.length < 2) return;
    const ids = new Set(draft.voltage_references.map((reference) => reference.reference_id));
    let suffix = 2;
    while (ids.has(`reference-${suffix}`)) suffix++;
    const referenceId = `reference-${suffix}`;
    patch({ voltage_layout: "multi_reference", voltage_references: [
      ...draft.voltage_references.map((reference) => reference === source
        ? { ...reference, group_keys: reference.group_keys.filter((key) => key !== group) }
        : reference),
      { ...source, reference_id: referenceId, label: `Reference ${suffix}`, phase_label: String(suffix), group_keys: [group] },
    ] });
  };
  const removeReference = (referenceId: string) => {
    const source = draft.voltage_references.find((reference) => reference.reference_id === referenceId);
    const target = draft.voltage_references.find((reference) => reference.reference_id !== referenceId);
    if (!source || !target || !window.confirm(`Remove ${source.label || source.reference_id} and reassign ${source.group_keys.join(", ")} to ${target.label || target.reference_id}?`)) return;
    const references = draft.voltage_references.filter((reference) => reference !== source).map((reference) => reference === target
      ? { ...reference, group_keys: [...reference.group_keys, ...source.group_keys].sort() }
      : reference);
    patch({ voltage_layout: references.length === 1 ? "standard" : "multi_reference", voltage_references: references });
  };
  return html`
    <section class="step-content meter-settings-step" aria-labelledby="step-heading">
      <h2>Meter settings</h2>
      <p>These values are written to the meter configuration. Setup Device choices remain onboarding suggestions.</p>
      <div class="meter-settings-grid">
        <label>Friendly name <input aria-label="Friendly name" maxlength="64" .value=${draft.friendly_name}
          @input=${(event: Event) => patch({ friendly_name: (event.target as HTMLInputElement).value })} /></label>
        <label>Electrical system <select aria-label="Electrical system" .value=${draft.electrical_system}
          @change=${(event: Event) => setProfile((event.target as HTMLSelectElement).value as ElectricalSystem)}>${SYSTEMS.map(([value, label]) => html`<option value=${value}>${label}</option>`)}</select></label>
        <label>Line frequency (N. America: 60Hz) <select aria-label="Line frequency" .value=${String(draft.line_frequency_hz)}
          @change=${(event: Event) => setFrequency(Number((event.target as HTMLSelectElement).value) as LineFrequencyHz)}>${[50, 60].map((value) => html`<option value=${value} ?selected=${draft.line_frequency_hz === value}>${value} Hz</option>`)}</select></label>
        <label>Reporting interval (default: 10 seconds) <select aria-label="Reporting interval" .value=${String(draft.update_interval_s)}
          @change=${(event: Event) => patch({ update_interval_s: Number((event.target as HTMLSelectElement).value) as MeterSettingsDraft["update_interval_s"] })}>${INTERVALS.map((value) => html`<option value=${value} ?selected=${draft.update_interval_s === value}>${value} seconds</option>`)}</select></label>
      </div>
      ${intervalImpact(draft.update_interval_s) ? html`<p class="info-band" role="status">${intervalImpact(draft.update_interval_s)}</p>` : nothing}
      <h3>Voltage references</h3>
      <p class="info-band">The configured voltage-reference setup must match the meter's physical voltage wiring. By default, the main-board voltage reference applies to every board.</p>
      <div class="voltage-reference-cards">${draft.voltage_references.map((reference) => html`
        <section class="voltage-reference-card" aria-label=${`${reference.label} voltage reference`}>
          <label>Label <input aria-label=${`${reference.reference_id} label`} maxlength="64" .value=${reference.label}
            @input=${(event: Event) => patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, label: (event.target as HTMLInputElement).value } : item) })} /></label>
          <label>Transformer <select aria-label=${`${reference.reference_id} transformer`} .value=${reference.transformer_model_id}
            @change=${(event: Event) => { const model = (event.target as HTMLSelectElement).value; const preset = catalog.presets.find((item) => item.model_id === model); patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, transformer_model_id: model, gain_voltage: preset?.default_gain_voltage ?? item.gain_voltage } : item) }); }}>
            ${catalog.presets.map((preset) => html`<option value=${preset.model_id}>${preset.label}</option>`)}
            <option value="custom">Custom starting gain</option>
            ${reference.transformer_model_id !== "custom" && !catalog.presets.some((preset) => preset.model_id === reference.transformer_model_id) ? html`<option value=${reference.transformer_model_id}>${reference.transformer_model_id}</option>` : ""}</select></label>
          ${reference.transformer_model_id !== "custom" ? html`<p>Starting gain: ${reference.gain_voltage}</p>` : html`<label>Custom voltage gain <input aria-label=${`${reference.reference_id} custom voltage gain`} type="number" min="1" max="65535" step="1" .value=${String(reference.gain_voltage)}
            @input=${(event: Event) => patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, gain_voltage: Number((event.target as HTMLInputElement).value) } : item) })} /></label>
          `}
          ${["three_phase", "custom"].includes(draft.electrical_system) ? html`<label>Nominal voltage <input aria-label=${`${reference.reference_id} nominal voltage`} type="number" min="1" max="600" step="0.1" .value=${String(reference.nominal_voltage_v)}
            @input=${(event: Event) => setNominalVoltage(reference.reference_id, Number((event.target as HTMLInputElement).value))} /></label>` : nothing}
          ${draft.voltage_references.length > 1 ? html`<button class="secondary" aria-label=${`Remove ${reference.reference_id} voltage reference`} @click=${() => removeReference(reference.reference_id)}>Remove reference</button>` : ""}
        </section>`)}
      </div>
      <details data-section="advanced-meter-settings"><summary>Advanced meter settings</summary>
      ${boardPackages ? packageOptions(boardPackages, setBoardPackages) : ""}
      ${draft.voltage_references.map((reference) => html`<label>Phase label <input aria-label=${`${reference.reference_id} phase label`} maxlength="64" .value=${reference.phase_label}
            @input=${(event: Event) => patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, phase_label: (event.target as HTMLInputElement).value } : item) })} /></label>`)}
      ${addableGroups.length ? html`<div class="reference-block"><label>Group transferred to new reference <select data-new-reference-group aria-label="Group transferred to new reference">${addableGroups.map((group) => html`<option value=${group}>${group}</option>`)}</select></label><button class="secondary" data-action="add-voltage-reference" @click=${addReference}>Add voltage reference</button></div>` : ""}
      <h3>Voltage group assignment</h3>
      <div class="meter-settings-grid">${draft.voltage_references.flatMap((reference) => reference.group_keys).sort().map((group) => html`<label>${group}<select aria-label=${`${group} voltage reference`} .value=${draft.voltage_references.find((reference) => reference.group_keys.includes(group))?.reference_id ?? ""}
        @change=${(event: Event) => moveGroup(group, (event.target as HTMLSelectElement).value, event.target as HTMLSelectElement)}>${draft.voltage_references.map((reference) => html`<option value=${reference.reference_id}>${reference.label || reference.reference_id}</option>`)}</select></label>`)}</div>
      ${multiReference ? html`<label class="check-row"><input type="checkbox" aria-label="Multi-reference preparation acknowledgement" .checked=${acknowledged}
        @change=${(event: Event) => setAcknowledged((event.target as HTMLInputElement).checked)} />I prepared the separate voltage references.</label>` : ""}
      </details>
      <label class="check-row"><input type="checkbox" aria-label="Confirm electrical profile" .checked=${profileConfirmed}
        @change=${(event: Event) => setProfileConfirmed((event.target as HTMLInputElement).checked)} />I confirm the electrical profile and frequency.</label>
      <footer class="action-footer"><button class="secondary" @click=${back}>Back</button><button class="primary" data-action="continue-meter-settings" ?disabled=${!valid} @click=${continueToCircuits}>Continue to Circuits & CTs</button></footer>
    </section>
  `;
}
