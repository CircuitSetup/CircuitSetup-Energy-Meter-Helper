import { html, type TemplateResult } from "lit";
import type { ConnectionType, SetupSnapshot } from "../types";

const CONNECTIONS: Array<[Exclude<ConnectionType, "unknown">, string]> = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"],
];
const ADDON_PINS = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];

export function setupDeviceStep(
  snapshot: SetupSnapshot | null,
  addonCount: number,
  connection: Exclude<ConnectionType, "unknown">,
  setAddon: (value: number) => void,
  setConnection: (value: Exclude<ConnectionType, "unknown">) => void,
  rescan: () => void,
  configure: (deviceId: string) => void,
  adopt: (deviceId: string) => void,
  busyAction = "",
  discoverOnly = false,
  firmwareCatalog: TemplateResult = html``,
  importFailedDeviceId: string | null = null,
): TemplateResult {
  return html`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Configure an existing device</h2>
        <p>Select a compatible meter already connected to Home Assistant.</p>
        ${snapshot?.devices.length ? html`<div class="meter-list">
          ${snapshot.devices.map((device) => html`
            <div class="meter-row">
              <span><strong>${device.title}</strong><small>${device.project_name} · ${device.project_version ?? "version unavailable"}</small></span>
              <span>Device Builder: ${device.configuration ? "Yes" : device.importable ? "Yes — import available" : "No"}</span>
              ${device.importable && !device.configuration ? html`<button class="secondary" ?disabled=${Boolean(busyAction)}
                @click=${() => adopt(device.entry_id)}>${importFailedDeviceId === device.entry_id ? "Retry import" : "Import"}</button>` : ""}
              <button class="primary" data-action="configure-device" ?disabled=${Boolean(busyAction)}
                @click=${() => configure(device.entry_id)}>${busyAction === `topology:${device.entry_id}` ? "Loading topology…" : "Configure"}</button>
            </div>
          `)}
        </div>` : html`<div class="error-panel passive" role="status">
          <strong>No compatible device found</strong>
          <span>Check power and connection, then try again.</span>
        </div>`}
      </section>
      ${discoverOnly ? "" : html`<hr />
      <h2>Set up a new device</h2>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (_, value) => html`
            <label class=${value === addonCount ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(value)}
                .checked=${value === addonCount} @change=${() => setAddon(value)} />
              <span>${value}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${CONNECTIONS.map(([value, label]) => html`
            <label class=${value === connection ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${value}
                .checked=${value === connection} @change=${() => setConnection(value)} />
              <span>${label}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>Add-on boards</dt><dd>${addonCount}</dd></div>
          <div><dt>Connection</dt><dd>${CONNECTIONS.find(([value]) => value === connection)?.[1]}</dd></div>
          ${ADDON_PINS.slice(0, addonCount).map((pins, index) => html`<div><dt>Add-on ${index + 1}</dt><dd>${pins}</dd></div>`)}
        </dl>
      </section>
      ${firmwareCatalog}
      <section class="next-steps" aria-labelledby="next-steps-heading">
        <h2 id="next-steps-heading">What happens next</h2>
        <ol>
          <li>Install the selected firmware and select <strong>Next</strong> in ESP Web Tools.</li>
          <li>Select <strong>Add to Home Assistant</strong> and approve the discovered ESPHome device.</li>
          <li>Return here. The helper will import it into ESPHome Builder and continue.</li>
        </ol>
      </section>
      <p class="info-band">${connection === "wifi"
        ? "Use a USB data cable. ESP Web Tools asks for your Wi-Fi network and password and sends them directly to your meter. This helper does not store or send those credentials to Home Assistant."
        : "Use a USB data cable, connect Ethernet and power, then wait for an address from DHCP."}</p>
      `}
      <button class="rescan" data-action="rescan" ?disabled=${Boolean(busyAction)} @click=${rescan}>${busyAction === "rescan" ? "Rescanning…" : "Rescan for device"}</button>
    </section>
  `;
}
