import { html, nothing, type TemplateResult } from "lit";
import type { ConnectionType, ExistingDeviceCandidate, ExistingMeterInspection, SetupSnapshot } from "../types";
import { existingMeterInspection } from "./existing-configuration-step";

const CONNECTIONS: Array<[Exclude<ConnectionType, "unknown">, string]> = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"],
];
const ADDON_PINS = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
export interface SetupDeviceData {
  snapshot: SetupSnapshot | null;
  addonCount: number;
  connection: Exclude<ConnectionType, "unknown">;
  busyAction?: string;
  discoverOnly?: boolean;
  firmwareCatalog?: TemplateResult;
  importFailedDeviceId?: string | null;
  existingCandidates?: ExistingDeviceCandidate[];
  inspection?: ExistingMeterInspection | null;
  existingSearchComplete?: boolean;
}
export interface SetupDeviceActions {
  setAddon: (value: number) => void;
  setConnection: (value: Exclude<ConnectionType, "unknown">) => void;
  rescan: () => void;
  configure: (deviceId: string) => void;
  adopt: (deviceId: string) => void;
  findExisting?: () => void;
  inspectExisting?: (deviceId: string) => void;
  adoptInspected?: (deviceId: string) => void;
}
export function setupDeviceStep(data: SetupDeviceData, actions: SetupDeviceActions): TemplateResult {
  const { snapshot, addonCount, connection, busyAction = "", discoverOnly = false, firmwareCatalog = html``, importFailedDeviceId = null, existingCandidates = [], inspection = null, existingSearchComplete = false } = data;
  const { setAddon, setConnection, rescan, configure, adopt, findExisting = () => undefined, inspectExisting = () => undefined, adoptInspected = () => undefined } = actions;

  return html`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      ${snapshot?.devices.length ? html`<section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Existing meters</h2>
        <p>Select a compatible meter connected to Home Assistant.</p>
        <div class="meter-list">
          ${snapshot.devices.map((device) => html`
            <div class="meter-row">
              <div class="meter-details">
                <strong>${device.title}</strong>
                <small>${device.project_name} · ${device.project_version ?? "version unavailable"}</small>
                <small class="meter-status">${device.configuration ? "Managed in ESPHome Device Builder" : device.importable ? "Import available" : "Calibration only — no editable source."}</small>
                ${!device.configuration && !device.importable ? html`<small>ESPHome source editing is unavailable. Calibration stays in meter flash and may be replaced by a later firmware install.</small>` : ""}
              </div>
              ${device.importable && !device.configuration
                ? html`<button class="primary" data-action="import-device" ?disabled=${Boolean(busyAction)}
                    @click=${() => adopt(device.entry_id)}>${busyAction === `adopt:${device.entry_id}` ? "Importing configuration…" : importFailedDeviceId === device.entry_id ? "Retry import" : "Import configuration"}</button>`
                : html`<button class="primary" data-action="configure-device" ?disabled=${Boolean(busyAction)}
                    @click=${() => configure(device.entry_id)}>${busyAction === `topology:${device.entry_id}` ? "Loading meter…" : device.configuration ? "Open setup" : "Open calibration"}</button>`}
            </div>
          `)}
        </div>
      </section>` : html``}
      ${existingMeterInspection(existingCandidates, inspection, busyAction, findExisting, inspectExisting, adoptInspected, existingSearchComplete)}
      ${discoverOnly ? "" : html`<details class="new-meter" ?open=${!snapshot?.devices.length}><summary>Set up a new meter</summary>
      <p class="info-band">Install and run ESPHome Device Builder in Home Assistant before setting up a new meter. <a href="https://esphome.io/install/" target="_blank" rel="noreferrer noopener">See how to install it in Home Assistant</a>.</p>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select the number of attached add-on boards.</p>
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
        <p>Choose the network connection.</p>
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
        <h2 id="jumper-heading">Add-on address jumper settings</h2>
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
          <li>After firmware installs, click <strong>Next</strong> in ESP Web Tools.</li>
          ${connection === "wifi" ? html`<li>In ESP Web Tools, enter your Wi-Fi credentials.</li>` : nothing}
          <li>Select <strong>Add to Home Assistant</strong> in ESP Web Tools, then finish adding the ESPHome integration in <strong>Home Assistant</strong>.</li>
          <li>Return to the Helper to discover the meter and import its configuration into ESPHome Device Builder. Use Rescan if it has not appeared.</li>
        </ol>
      </section>
      <p class="info-band">${connection === "wifi"
        ? "Use a USB data cable. ESP Web Tools sends Wi-Fi credentials directly to the meter; this helper does not store or send them to Home Assistant."
        : "Use a USB data cable, connect Ethernet and power, then wait for a DHCP address."}</p>
      </details>`}
      ${discoverOnly ? nothing : html`<button class="rescan" data-action="rescan" ?disabled=${Boolean(busyAction)} @click=${rescan}>${busyAction === "rescan" ? "Rescanning…" : "Rescan for device"}</button>`}
    </section>
  `;
}
