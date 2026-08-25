import { html, type TemplateResult } from "lit";
import type { TransactionStatus } from "../types";

export function configReview(status: TransactionStatus | null): TemplateResult {
  const diff = (status?.redacted_diff || "No reviewed configuration changes yet.").split("\n");
  return html`
    <section class="review-region" aria-labelledby="review-heading">
      <h2 id="review-heading">Review changes</h2>
      <p class="warning-band">Firmware configuration changes can alter Home Assistant rename/entity-key bindings. Review every change before Apply.</p>
      <pre class="config-diff" aria-label="Redacted substitution diff"><code>${diff.map((line, index) => html`<span class=${`diff-line ${line.startsWith("+") ? "added" : line.startsWith("-") ? "removed" : "context"}`}>${line}</span>${index < diff.length - 1 ? "\n" : ""}`)}</code></pre>
      <dl class="status-list">
        <div><dt>Validation</dt><dd>${status?.state === "validated" || status?.progress.includes("config_validated") ? "Validated" : "Pending"}</dd></div>
        <div><dt>Compile</dt><dd>${status?.state === "compiled" || status?.progress.includes("firmware_compiled") ? "Compiled" : "Pending"}</dd></div>
        <div><dt>Install</dt><dd>${status?.state === "install_confirmation_required" ? "Confirmation required" : status?.state ?? "Pending"}</dd></div>
      </dl>
    </section>
  `;
}
