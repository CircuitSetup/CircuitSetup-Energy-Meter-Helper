import { html, type TemplateResult } from "lit";
import type { ConfigurationImpact, MeterConfigurationRequest, TransactionStatus } from "../types";

const aggregateFormula = (aggregate: MeterConfigurationRequest["aggregates"][number]): string => {
  const channels = aggregate.channels.map((channel) => `CT${channel}`);
  if (aggregate.measurement_method === "one_ct_double_power") return `2 × ${channels[0] ?? "CT"}`;
  if (aggregate.measurement_method === "both_conductors_one_ct") return `${channels[0] ?? "CT"} (both conductors)`;
  return channels.join(" + ");
};

export function configReview(
  status: TransactionStatus | null,
  configuration: MeterConfigurationRequest | null = null,
  impact: ConfigurationImpact | null = null,
): TemplateResult {
  const diff = (status?.redacted_diff || "No reviewed configuration changes yet.").split("\n");
  const channels = configuration?.channels ?? [];
  const pqBoards = configuration?.power_quality.flatMap((enabled, board) => enabled ? [board + 1] : []) ?? [];
  const statusBoards = configuration?.status_fields.flatMap((enabled, board) => enabled ? [board + 1] : []) ?? [];
  return html`
    <section class="review-region" aria-labelledby="review-heading">
      <h2 id="review-heading">Review changes</h2>
      <p class="warning-band">Firmware configuration changes can alter Home Assistant rename/entity-key bindings. Review every change before Apply.</p>
      ${configuration ? html`
        <h3>Meter</h3>
        <dl class="status-list"><div><dt>Electrical profile</dt><dd>${configuration.meter.electrical_system.replaceAll("_", " ")} · ${configuration.meter.line_frequency_hz} Hz</dd></div><div><dt>Reporting interval</dt><dd>${configuration.meter.update_interval_s} seconds</dd></div><div><dt>Friendly name</dt><dd>${configuration.meter.friendly_name}</dd></div></dl>
        <h3>Voltage references</h3>
        <ul class="status-list">${configuration.meter.voltage_references.map((reference) => html`<li>${reference.label} (${reference.phase_label}): ${reference.nominal_voltage_v} V · ${reference.transformer_model_id} · ${reference.group_keys.join(", ")}</li>`)}</ul>
        ${configuration.meter.voltage_references.length > 1 ? html`<p class=${configuration.multi_reference_preparation_acknowledged ? "info-band" : "warning-band"}>Multi-reference hardware preparation: ${configuration.multi_reference_preparation_acknowledged ? "acknowledged" : "not acknowledged"}.</p>` : ""}
        <h3>Channels</h3>
        <ul class="status-list">${channels.map((channel) => html`<li>CT${channel.channel} ${channel.name}: ${channel.enabled ? `${channel.role.replaceAll("_", " ")} on ${channel.voltage_reference_id}; ${channel.model_id || "no model"} × ${channel.reporting_multiplier}; burden ${channel.burden_output_acknowledged ? "acknowledged" : "not acknowledged"}` : "unused"}</li>`)}</ul>
        <h3>Aggregates</h3>
        ${configuration.aggregates.length ? html`<ul class="status-list">${configuration.aggregates.map((aggregate) => html`<li>${aggregate.name} = ${aggregateFormula(aggregate)} · ${aggregate.measurement_method.replaceAll("_", " ")} · ${aggregate.energy_mode} energy${aggregate.parent_id ? ` · parent ${aggregate.parent_id}` : ""}</li>`)}</ul>` : html`<p class="info-band">No aggregate totals are configured.</p>`}
        <h3>Package and entity impact</h3>
        <dl class="status-list"><div><dt>Power quality</dt><dd>${pqBoards.length ? `Boards ${pqBoards.join(", ")}` : "Not selected"}</dd></div><div><dt>Phase status</dt><dd>${statusBoards.length ? `Boards ${statusBoards.join(", ")}` : "Not selected"}</dd></div>${impact ? html`<div><dt>Entity impact</dt><dd>${impact.numeric_entity_count} numeric, ${impact.text_entity_count} text, ${impact.energy_entity_count} energy; ~${impact.approximate_publications_per_second.toFixed(1)} publications/sec</dd></div>` : ""}</dl>
      ` : ""}
      <dl class="status-list">
        <div><dt>Validation</dt><dd>${status?.state === "validated" || status?.progress.includes("config_validated") ? "Validated" : "Pending"}</dd></div>
        <div><dt>Compile</dt><dd>${status?.state === "compiled" || status?.progress.includes("firmware_compiled") ? "Compiled" : "Pending"}</dd></div>
        <div><dt>Install</dt><dd>${status?.state === "install_confirmation_required" ? "Confirmation required" : status?.state ?? "Pending"}</dd></div>
      </dl>
      <details>
        <summary>Technical details</summary>
        <dl class="status-list evidence-list">
          <div><dt>Transaction ID</dt><dd>${status?.transaction_id ?? "Unavailable"}</dd></div>
          <div><dt>Validation records</dt><dd>${status?.validation_detail ? `${status.validation_detail.error_record_count} errors; ${status.validation_detail.warning_record_count} warnings` : "Not available"}</dd></div>
          <div><dt>Evidence</dt><dd>${status?.evidence.join(", ") || "No evidence recorded."}</dd></div>
          <div><dt>Upload trace</dt><dd>${status?.upload_progress.map((item) => `${item.stage}: ${item.percentage ?? "in progress"}`).join(", ") || "No upload trace."}</dd></div>
        </dl>
        <pre class="config-diff" aria-label="Redacted substitution diff"><code>${diff.map((line, index) => html`<span class=${`diff-line ${line.startsWith("+") ? "added" : line.startsWith("-") ? "removed" : "context"}`}>${line}</span>${index < diff.length - 1 ? "\n" : ""}`)}</code></pre>
      </details>
    </section>
  `;
}
