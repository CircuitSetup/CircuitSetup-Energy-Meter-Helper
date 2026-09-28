import { html, nothing, type TemplateResult } from "lit";
import type { ConnectionType, ExistingDeviceCandidate, ExistingMeterInspection, SetupSnapshot } from "../types";
import { existingMeterInspection } from "./existing-configuration-step";

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
  existingCandidates: ExistingDeviceCandidate[] = [],
  inspection: ExistingMeterInspection | null = null,
  findExisting: () => void = () => undefined,
  inspectExisting: (deviceId: string) => void = () => undefined,
  adoptInspected: (deviceId: string) => void = () => undefined,
  existingSearchComplete = false,
): TemplateResult {
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
      ${discoverOnly ? "" : html`<hr />
      <h2>Set up a new meter</h2>
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
          <li>After firmware installs, click <strong>Next</strong>.</li>
          <li>For Wi-Fi, enter your credentials.</li>
          <li>Select <strong>Add to Home Assistant</strong>, then approve the ESPHome device in <strong>ESPHome Device Builder</strong>.</li>
          <li>Return here to import the meter and customize its settings.</li>
        </ol>
      </section>
      <p class="info-band">${connection === "wifi"
        ? "Use a USB data cable. ESP Web Tools sends Wi-Fi credentials directly to the meter; this helper does not store or send them to Home Assistant."
        : "Use a USB data cable, connect Ethernet and power, then wait for a DHCP address."}</p>
      `}
      ${discoverOnly ? nothing : html`<button class="rescan" data-action="rescan" ?disabled=${Boolean(busyAction)} @click=${rescan}>${busyAction === "rescan" ? "Rescanning…" : "Rescan for device"}</button>`}
    </section>
  `;
}
