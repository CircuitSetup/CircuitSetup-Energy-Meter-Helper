import { html, type TemplateResult } from "lit";
import type { TransactionStatus } from "../types";
import { configReview } from "./config-review-step";

export function buildInstallStep(
  status: TransactionStatus | null,
  apply: () => void,
  compile: () => void,
  install: () => void,
  rollback: () => void,
  continueFlow: () => void,
): TemplateResult {
  const state = status?.state ?? "previewed";
  return html`
    <section class="step-content" aria-labelledby="step-heading">
      ${configReview(status)}
      ${state === "failed" ? html`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${status?.evidence.join(", ") || "The operation did not complete."}</p>
          ${status?.rollback_available ? html`<button class="danger" @click=${rollback}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${apply} ?disabled=${state !== "previewed"}>Apply</button>
        <button class="secondary" @click=${compile} ?disabled=${state !== "validated"}>Compile</button>
        <button class="primary" @click=${install} ?disabled=${state !== "install_confirmation_required"}>Install</button>
      </div>
      <footer class="action-footer">
        <button class="secondary">Back</button>
        <button class="primary" data-action="continue" @click=${continueFlow} ?disabled=${state !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
