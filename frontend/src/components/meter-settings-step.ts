import { html, type TemplateResult } from "lit";

import type { ElectricalSystem, LineFrequencyHz, MeterSettingsDraft, VoltageTransformerCatalog } from "../types";

const SYSTEMS: Array<[ElectricalSystem, string]> = [
  ["split_phase_120_240", "Split phase 120/240 V"], ["single_phase_230", "Single phase 230 V"],
  ["three_phase", "Three phase"], ["custom", "Custom"],
];
const INTERVALS = [1, 2, 5, 10, 30, 60] as const;

export function meterSettingsStep(
  draft: MeterSettingsDraft,
  catalog: VoltageTransformerCatalog,
  acknowledged: boolean,
  update: (draft: MeterSettingsDraft) => void,
  setAcknowledged: (value: boolean) => void,
  back: () => void,
  continueToCircuits: () => void,
): TemplateResult {
  const multiReference = draft.voltage_references.length > 1;
  const valid = Boolean(draft.friendly_name.trim()) && draft.voltage_references.every((reference) =>
    reference.label.trim() && reference.phase_label.trim() && Number.isFinite(reference.nominal_voltage_v)
      && reference.nominal_voltage_v >= 1 && reference.nominal_voltage_v <= 600
      && Number.isInteger(reference.gain_voltage) && reference.gain_voltage >= 1 && reference.gain_voltage <= 65535
      && reference.group_keys.length) && (!multiReference || acknowledged);
  const patch = (change: Partial<MeterSettingsDraft>) => update({ ...draft, ...change });
  const moveGroup = (group: string, referenceId: string) => {
    const source = draft.voltage_references.find((reference) => reference.group_keys.includes(group));
    const target = draft.voltage_references.find((reference) => reference.reference_id === referenceId);
    if (!source || !target || source === target) return;
    const replacement = source.group_keys.length === 1 ? target.group_keys[0] : undefined;
    patch({ voltage_references: draft.voltage_references.map((reference) => ({ ...reference,
      group_keys: reference === source ? replacement ? [replacement] : reference.group_keys.filter((key) => key !== group)
        : reference === target ? [...reference.group_keys.filter((key) => key !== replacement), group] : reference.group_keys,
    })) });
  };
  return html`
    <section class="step-content meter-settings-step" aria-labelledby="step-heading">
      <h2>Meter settings</h2>
      <p>These values are written to the meter configuration. Setup Device choices remain onboarding suggestions.</p>
      <div class="meter-settings-grid">
        <label>Friendly name <input aria-label="Friendly name" maxlength="64" .value=${draft.friendly_name}
          @input=${(event: Event) => patch({ friendly_name: (event.target as HTMLInputElement).value })} /></label>
        <label>Electrical system <select aria-label="Electrical system" .value=${draft.electrical_system}
          @change=${(event: Event) => patch({ electrical_system: (event.target as HTMLSelectElement).value as ElectricalSystem })}>${SYSTEMS.map(([value, label]) => html`<option value=${value}>${label}</option>`)}</select></label>
        <label>Line frequency <select aria-label="Line frequency" .value=${String(draft.line_frequency_hz)}
          @change=${(event: Event) => patch({ line_frequency_hz: Number((event.target as HTMLSelectElement).value) as LineFrequencyHz })}>${[50, 60].map((value) => html`<option value=${value}>${value} Hz</option>`)}</select></label>
        <label>Reporting interval <select aria-label="Reporting interval" .value=${String(draft.update_interval_s)}
          @change=${(event: Event) => patch({ update_interval_s: Number((event.target as HTMLSelectElement).value) as MeterSettingsDraft["update_interval_s"] })}>${INTERVALS.map((value) => html`<option value=${value}>${value} seconds</option>`)}</select></label>
      </div>
      <p class="info-band" role="status">Longer reporting intervals reduce update traffic but make live checks and calibration take longer.</p>
      <h3>Voltage references</h3>
      <div class="voltage-reference-cards">${draft.voltage_references.map((reference) => html`
        <section class="voltage-reference-card" aria-label=${`${reference.label} voltage reference`}>
          <label>Label <input aria-label=${`${reference.reference_id} label`} maxlength="64" .value=${reference.label}
            @input=${(event: Event) => patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, label: (event.target as HTMLInputElement).value } : item) })} /></label>
          <label>Phase label <input aria-label=${`${reference.reference_id} phase label`} maxlength="64" .value=${reference.phase_label}
            @input=${(event: Event) => patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, phase_label: (event.target as HTMLInputElement).value } : item) })} /></label>
          <label>Transformer <select aria-label=${`${reference.reference_id} transformer`} .value=${reference.transformer_model_id}
            @change=${(event: Event) => { const model = (event.target as HTMLSelectElement).value; const preset = catalog.presets.find((item) => item.model_id === model); patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, transformer_model_id: model, gain_voltage: preset?.default_gain_voltage ?? item.gain_voltage } : item) }); }}>
            ${catalog.presets.map((preset) => html`<option value=${preset.model_id}>${preset.label}</option>`)}</select></label>
          <label>Custom voltage gain <input aria-label=${`${reference.reference_id} custom voltage gain`} type="number" min="1" max="65535" step="1" .value=${String(reference.gain_voltage)}
            @input=${(event: Event) => patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, gain_voltage: Number((event.target as HTMLInputElement).value) } : item) })} /></label>
          <label>Nominal voltage <input aria-label=${`${reference.reference_id} nominal voltage`} type="number" min="1" max="600" step="0.1" .value=${String(reference.nominal_voltage_v)}
            @input=${(event: Event) => patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, nominal_voltage_v: Number((event.target as HTMLInputElement).value) } : item) })} /></label>
        </section>`)}
      </div>
      <h3>Voltage group assignment</h3>
      <div class="meter-settings-grid">${draft.voltage_references.flatMap((reference) => reference.group_keys).sort().map((group) => html`<label>${group}<select aria-label=${`${group} voltage reference`} .value=${draft.voltage_references.find((reference) => reference.group_keys.includes(group))?.reference_id ?? ""}
        @change=${(event: Event) => moveGroup(group, (event.target as HTMLSelectElement).value)}>${draft.voltage_references.map((reference) => html`<option value=${reference.reference_id}>${reference.label || reference.reference_id}</option>`)}</select></label>`)}</div>
      ${multiReference ? html`<label class="check-row"><input type="checkbox" aria-label="Multi-reference preparation acknowledgement" .checked=${acknowledged}
        @change=${(event: Event) => setAcknowledged((event.target as HTMLInputElement).checked)} />I prepared the separate voltage references.</label>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${back}>Back</button><button class="primary" data-action="continue-meter-settings" ?disabled=${!valid} @click=${continueToCircuits}>Continue to Circuits & CTs</button></footer>
    </section>
  `;
}
