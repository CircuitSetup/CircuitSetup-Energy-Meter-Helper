import { html, nothing, type TemplateResult } from "lit";
import "esp-web-tools/dist/web/install-button.js";

import { manifestUrlFor, type FirmwareOption } from "../firmware-installer";

export function espWebInstaller(option: FirmwareOption | null): TemplateResult | typeof nothing {
  if (!option) return nothing;

  try {
    const manifestUrl = manifestUrlFor(option.productId, option.version);
    return html`
      <esp-web-install-button class="esp-web-installer" .manifest=${manifestUrl}>
        <button slot="activate" aria-label="Install firmware">Install firmware</button>
        <p slot="unsupported">Use a supported Chromium browser with Web Serial to install firmware.</p>
        <p slot="not-allowed">Open this helper on HTTPS or localhost to install firmware.</p>
      </esp-web-install-button>
    `;
  } catch {
    return nothing;
  }
}
