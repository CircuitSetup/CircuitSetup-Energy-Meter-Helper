import { html, nothing, type TemplateResult } from "lit";
import { until } from "lit/directives/until.js";

import { manifestUrlFor, type FirmwareOption } from "../firmware-installer";

let loader: Promise<unknown> | undefined;

const loadEspWebTools = () => loader ??= import("esp-web-tools/dist/web/install-button.js");

const installer = (option: FirmwareOption, manifestUrl: string): TemplateResult => html`
  <p class="firmware-summary">${option.productId} · ESPHome ${option.version}</p>
  <esp-web-install-button class="esp-web-installer" .manifest=${manifestUrl}>
    <button slot="activate" aria-label="Install firmware">Install firmware</button>
    <p slot="unsupported">Use a supported Chromium browser with Web Serial to install firmware.</p>
    <p slot="not-allowed">Open this helper on HTTPS or localhost to install firmware.</p>
  </esp-web-install-button>
`;

export function espWebInstaller(option: FirmwareOption | null) {
  if (!option) return nothing;

  try {
    const manifestUrl = manifestUrlFor(option.productId, option.version);
    if (customElements.get("esp-web-install-button")) return installer(option, manifestUrl);
    return until(
      loadEspWebTools().then(
        () => installer(option, manifestUrl),
        () => html`<p role="alert">ESP Web Tools failed to load. Reload Home Assistant and try again.</p>`,
      ),
      html`<p role="status">Loading installer…</p>`,
    );
  } catch {
    return nothing;
  }
}
