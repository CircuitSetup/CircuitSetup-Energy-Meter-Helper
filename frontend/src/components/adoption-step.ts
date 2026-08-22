import { html, type TemplateResult } from "lit";
import type { DiscoveredDevice } from "../types";

export function adoptionStep(
  devices: DiscoveredDevice[],
  selectedId: string | null,
  select: (id: string) => void,
  adopt: () => void,
  back: () => void,
  continueFlow: () => void,
): TemplateResult {
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Select the compatible meter discovered on your network.</p>
      <div class="meter-list">
        ${devices.map((device) => html`
          <label class=${device.entry_id === selectedId ? "meter-row selected" : "meter-row"}>
            <input type="radio" name="meter" .checked=${device.entry_id === selectedId}
              @change=${() => select(device.entry_id)} />
            <span><strong>${device.title}</strong><small>${device.project_name} · ${device.project_version ?? "version unavailable"}</small></span>
            <span>Device Builder: ${device.configuration ? "Configured" : device.importable ? "Importable" : device.importable === null ? "Unavailable" : "Not importable"}</span>
          </label>
        `)}
      </div>
      ${devices.some((device) => device.entry_id === selectedId && device.importable) ? html`
        <button class="secondary" @click=${adopt}>Adopt</button>
      ` : ""}
      <footer class="action-footer">
        <button class="secondary" data-action="back" @click=${back}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${!selectedId} @click=${continueFlow}>Continue</button>
      </footer>
    </section>
  `;
}
