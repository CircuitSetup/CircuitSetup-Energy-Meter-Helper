import { html, nothing, type TemplateResult } from "lit";
import type { MeterConfiguration, MeterConfigurationCapabilities, MeterConfigurationRequest, TotalGraphPreview, TotalsInventory, TransactionStatus } from "../types";
import { derivedParentId, reparentAggregate, sourceLeaves } from "../total-graph";

export function canAdoptTotals(meter: MeterConfiguration): boolean {
  return meter.capabilities.configuration_authoritative && meter.totals.migration.native_visibility_resolved
    && !meter.capabilities.reason_codes.includes("config_contract_upgrade_required");
}

export function totalsEditable(meter: MeterConfiguration, capability: "native_totals_writable" | "managed_automatic_totals" | "managed_advanced_totals"): boolean {
  return meter.capabilities.configuration_authoritative && (meter.capabilities[capability]
    || meter.configuration.totals_change_intent?.adopt_managed_totals === true && canAdoptTotals(meter));
}

export function legacyTotalsNotice(capabilities: MeterConfigurationCapabilities): TemplateResult {
  return html`${capabilities.reason_codes.includes("legacy_custom_totals_unmanaged") || capabilities.reason_codes.includes("legacy_generic_totals_unmanaged")
    ? html`<p class="warning-band">Arbitrary unmanaged custom totals remain outside helper control. Unchanged custom Watts/Amps retain their source visibility and names. Editing a detected custom total or using it in a changed hierarchy selects a managed replacement: its original Watts/Amps are hidden and the requested helper outputs replace them. Preserved unsupported external custom energy is unchanged and outside the computed entity count.</p>` : nothing}`;
}

export function totalsMigrationReview(meter: MeterConfiguration, update: (configuration: MeterConfigurationRequest) => void,
  preview: TotalGraphPreview | null = null, fresh = true, readOnly = false, transaction: TransactionStatus | null = null): TemplateResult {
  const { configuration, totals, capabilities } = meter;
  const intent = configuration.totals_change_intent ?? { adopt_managed_totals: false, legacy_parent_decisions: [] };
  const adoptionRequired = capabilities.reason_codes.includes("totals_adoption_required");
  const writable = !readOnly && totalsEditable(meter, "managed_advanced_totals");
  const name = (id: string) => configuration.aggregates.find((item) => item.aggregate_id === id)?.name
    ?? totals.automatic_candidates.find((item) => item.aggregate_id === id)?.name ?? id;
  const available: TotalsInventory = { ...totals, automatic_candidates: totals.automatic_totals.filter((item) => item.enabled).map((item) => item.candidate) };
  return html`
    ${adoptionRequired ? html`<section class="totals-migration" aria-labelledby="totals-adoption-heading">
      <h2 id="totals-adoption-heading">Legacy read-only totals</h2>
      <p>Detected official native totals are read-only until explicit adoption. Opening this page does not change their formulas, visibility or ownership.</p>
      ${canAdoptTotals(meter) && !readOnly ? html`<button class="secondary" ?disabled=${intent.adopt_managed_totals}
        @click=${() => { if (canAdoptTotals(meter) && !intent.adopt_managed_totals) update({ ...configuration, totals_change_intent: { ...intent, adopt_managed_totals: true } }); }}>Adopt managed totals</button>`
        : !canAdoptTotals(meter) ? html`<p role="status">Adoption requires authoritative editable YAML, confirmed native visibility and supported contract.</p>` : nothing}
      ${intent.adopt_managed_totals ? html`<p role="status">Adoption selected; awaiting successful commit. Review the exact native visibility overrides and helper blocks before Save and validate.</p>
        ${fresh && preview ? html`<h3>Requested visibility changes versus firmware defaults</h3><p>These are requested outputs, not the source-aware overrides to be added. The server transaction diff below is authoritative for actual YAML changes.</p><ul>${preview.graph.native_visibility.map((item) => {
          const native = totals.native_sources.find((source) => source.power_id === item.sensor_id || source.current_id === item.sensor_id || source.existing_energy_id === item.sensor_id);
          const output = native?.power_id === item.sensor_id ? "Watts" : native?.current_id === item.sensor_id ? "Amps" : "kWh";
          return html`<li>${native?.label ?? "Native total"} ${output}: ${item.internal ? "internal dependency" : "public output"}</li>`;
        })}</ul><h3>Requested helper totals</h3><ul>${preview.graph.ordered_nodes.map((node) => html`<li>${node.aggregate.name}: ${[node.power_required ? "Watts" : "", node.current_required ? "Amps" : "", node.energy_required ? "kWh" : ""].filter(Boolean).join(", ")}</li>`)}
          ${totals.native_sources.filter((source) => source.source_id !== "overall").map((source, index) => source.existing_energy_id === null && configuration.default_totals.boards.find((board) => board.board_index === index)?.outputs.kwh
            ? html`<li>${source.label}: kWh</li>` : nothing)}</ul>`
          : html`<p role="status">Current validated total preview is required to list requested visibility and helper blocks.</p>`}
        ${transaction ? html`<details><summary>Exact source-aware additions and helper blocks (server transaction diff)</summary><pre class="config-diff" aria-label="Exact adoption transaction diff">${transaction.redacted_diff}</pre></details>`
          : html`<p>Continue to configuration review for the exact source-aware additions and helper blocks in the server transaction diff.</p>`}` : nothing}
    </section>` : nothing}
    ${legacyTotalsNotice(capabilities)}
    ${totals.migration.legacy_parent_links.length ? html`<section class="totals-migration" aria-labelledby="legacy-parent-heading">
      <h2 id="legacy-parent-heading">Legacy relationship migration</h2>
      <p>Existing totals continue using their direct CT formulas. Old parent links were metadata only; review each proposed relationship separately.</p>
      ${totals.migration.legacy_parent_links.map((link, index) => {
        const decision = intent.legacy_parent_decisions.find((item) => item.child_id === link.child_id && item.proposed_parent_id === link.proposed_parent_id);
        let aggregates = configuration.aggregates;
        let error = "";
        try {
          if (!configuration.aggregates.some((item) => item.aggregate_id === link.proposed_parent_id)) throw new Error("Automatic totals retain fixed CT sources. Edit a custom total hierarchy explicitly before accepting this relationship.");
          aggregates = reparentAggregate(link.child_id, link.proposed_parent_id, configuration.aggregates);
          for (const aggregate of aggregates) {
            derivedParentId(aggregate.aggregate_id, aggregates);
            sourceLeaves([{ kind: "aggregate", aggregate_id: aggregate.aggregate_id }], available, aggregates);
          }
        } catch (failure) { error = (failure as Error).message; }
        const choose = (accepted: boolean) => {
          if (!writable || accepted && (!fresh || error)) return;
          update({ ...configuration, aggregates: accepted ? aggregates : configuration.aggregates.map((aggregate) => aggregate.aggregate_id === link.proposed_parent_id
            ? { ...aggregate, sources: aggregate.sources.filter((source) => source.kind !== "aggregate" || source.aggregate_id !== link.child_id) } : aggregate),
          totals_change_intent: { ...intent, legacy_parent_decisions: [...intent.legacy_parent_decisions.filter((item) => item.child_id !== link.child_id || item.proposed_parent_id !== link.proposed_parent_id), { ...link, accepted }] } });
        };
        return html`<fieldset><legend>${name(link.child_id)} → ${name(link.proposed_parent_id)}</legend>
          <p role="status">${decision ? `${decision.accepted ? "Relationship selected" : "Keep independent selected"}; awaiting successful commit.` : "Pending review"}</p>
          ${error ? html`<p id=${`legacy-link-error-${index}`}>${error}</p>` : nothing}
          <div class="migration-actions"><button class="secondary" ?disabled=${!writable} @click=${() => choose(false)}>Keep totals independent</button>
          <button class="secondary" ?disabled=${!writable || !fresh || Boolean(error)} aria-describedby=${error ? `legacy-link-error-${index}` : nothing} @click=${() => choose(true)}>Use this parent relationship</button></div>
        </fieldset>`;
      })}
    </section>` : nothing}`;
}
