import { render } from "lit";
import { afterEach, expect, it, vi } from "vitest";
import { totalsMigrationReview } from "../src/components/totals-migration-review";
import { configReview } from "../src/components/config-review-step";
import { summaryStep } from "../src/components/summary-step";
import type { CircuitAggregate, MeterConfiguration, TotalGraphPreview, TotalSource } from "../src/types";
import { meterResponse } from "./workflow-scenarios";

const total = (aggregate_id: string, sources: TotalSource[]): CircuitAggregate => ({ aggregate_id, name: aggregate_id,
  role: "custom", sources, measurement_method: "direct", energy_mode: "consumption",
  outputs: { watts: true, amps: false, kwh: true }, origin: "migrated" });
const ct = (channel: number): TotalSource => ({ kind: "channel", channel });
const child = (aggregate_id: string): TotalSource => ({ kind: "aggregate", aggregate_id });
const legacy = () => {
  const meter = meterResponse();
  meter.configuration.aggregates = [total("child", [ct(1)]), total("parent", [ct(2)]), total("other", [ct(3)])];
  meter.totals.migration.parent_review_required = true;
  meter.totals.migration.legacy_parent_links = [{ child_id: "child", proposed_parent_id: "parent" }, { child_id: "other", proposed_parent_id: "parent" }];
  return meter;
};
const unowned = () => {
  const meter = meterResponse();
  Object.assign(meter.capabilities, { native_totals_writable: false, managed_automatic_totals: false, managed_advanced_totals: false,
    reason_codes: ["totals_adoption_required", "legacy_custom_totals_unmanaged"] });
  return meter;
};
let host: HTMLDivElement;
afterEach(() => { host?.remove(); });
const mount = (meter: MeterConfiguration, preview: TotalGraphPreview | null = null, fresh = true) => {
  host = document.createElement("div"); document.body.append(host);
  const update = vi.fn((configuration) => { meter = { ...meter, configuration }; draw(); });
  const draw = () => render(totalsMigrationReview(meter, update, preview, fresh), host);
  draw(); return { update, meter: () => meter };
};
const button = (label: string, index = 0) => [...host.querySelectorAll<HTMLButtonElement>("button")].filter((node) => node.textContent?.trim() === label)[index];

it("lists individual pending links without changing the direct CT formulas on load", () => {
  const state = mount(legacy());
  expect(host.textContent).toContain("Existing totals continue using their direct CT formulas.");
  expect(host.querySelectorAll("fieldset legend")).toHaveLength(2);
  expect(state.update).not.toHaveBeenCalled();
  expect(state.meter().configuration.aggregates[1]!.sources).toEqual([ct(2)]);
});

it("rejects only the chosen link, preserving formulas and leaving omitted links pending until commit", () => {
  const state = mount(legacy()); button("Keep totals independent")?.click();
  expect(state.meter().configuration.totals_change_intent?.legacy_parent_decisions).toEqual([{ child_id: "child", proposed_parent_id: "parent", accepted: false }]);
  expect(state.meter().configuration.aggregates[1]!.sources).toEqual([ct(2)]);
  expect(host.textContent).toContain("Pending review");
  expect(host.textContent).toContain("awaiting successful commit");
});

it("blocks acceptance of a raw-CT parent without silently dropping its sources", () => {
  const state = mount(legacy());
  expect(button("Use this parent relationship")?.disabled).toBe(true);
  expect(host.textContent).toContain("cannot mix CTs");
  button("Use this parent relationship")?.dispatchEvent(new Event("click"));
  expect(state.update).not.toHaveBeenCalled();
});

it("accepts a valid explicit graph edge without mutating the input", () => {
  const meter = legacy(); meter.configuration.aggregates[1]!.sources = [child("other")];
  meter.totals.migration.legacy_parent_links = [meter.totals.migration.legacy_parent_links[0]!];
  const state = mount(meter); button("Use this parent relationship")?.click();
  expect(state.meter().configuration.aggregates[1]!.sources).toEqual([child("other"), child("child")]);
  expect(state.meter().configuration.totals_change_intent?.legacy_parent_decisions).toEqual([{ child_id: "child", proposed_parent_id: "parent", accepted: true }]);
  expect(meter.configuration.aggregates[1]!.sources).toEqual([child("other")]);
});

it("blocks overlapping proposed relationships", () => {
  const meter = legacy(); meter.configuration.aggregates[1]!.sources = [child("other")]; meter.configuration.aggregates[2]!.sources = [ct(1)];
  mount(meter); expect(button("Use this parent relationship")?.disabled).toBe(true);
  expect(host.textContent).toContain("Overlapping sources");
});

it("does not turn an automatic parent into a custom formula", () => {
  const meter = legacy(); const parent = meter.configuration.aggregates.splice(1, 1)[0]!;
  const candidate = { ...parent, candidate_id: "candidate", recommended_outputs: parent.outputs, sources: [{ kind: "channel" as const, channel: 2 }] };
  meter.totals.automatic_candidates = [candidate]; meter.totals.automatic_totals = [{ candidate, enabled: true, outputs: parent.outputs }];
  mount(meter); expect(button("Use this parent relationship")?.disabled).toBe(true);
  expect(host.textContent).toContain("fixed CT sources");
});

it("offers adoption without mutating ownership on load and records only explicit intent", () => {
  const state = mount(unowned()); expect(state.update).not.toHaveBeenCalled();
  expect(host.textContent).toContain("Legacy read-only totals");
  expect(host.textContent).toContain("outside helper control");
  button("Adopt managed totals")?.click();
  expect(state.meter().configuration.totals_change_intent?.adopt_managed_totals).toBe(true);
  expect(state.meter().capabilities.native_totals_writable).toBe(false);
});

it.each(["authority", "contract", "visibility"])("does not offer adoption without %s", (missing) => {
  const meter = unowned();
  if (missing === "authority") meter.capabilities.configuration_authoritative = false;
  if (missing === "contract") meter.capabilities.reason_codes.push("config_contract_upgrade_required");
  if (missing === "visibility") meter.totals.migration.native_visibility_resolved = false;
  mount(meter); expect(button("Adopt managed totals")).toBeUndefined();
  expect(host.textContent).toContain("Legacy read-only totals");
});

it("hides the banner only when the fresh inventory no longer has pending links", () => {
  const meter = legacy(); meter.totals.migration.legacy_parent_links = []; meter.totals.migration.parent_review_required = false;
  mount(meter); expect(host.textContent).not.toContain("Legacy relationship migration");
});

it("keeps pending decisions visible when graph preview fails", () => {
  const meter = legacy(); meter.configuration.totals_change_intent!.legacy_parent_decisions = [{ child_id: "child", proposed_parent_id: "parent", accepted: false }];
  mount(meter, null, false); expect(host.textContent).toContain("awaiting successful commit");
  expect(button("Use this parent relationship")?.disabled).toBe(true);
});

it("reviews human-readable typed formulas and separates public outputs from internal dependencies", () => {
  const meter = meterResponse(); meter.configuration.aggregates = [total("home", [{ kind: "native_total", source_id: "overall" }])];
  host = document.createElement("div");
  render(configReview(null, meter.configuration, meter.configuration_impact, meter.totals), host);
  expect(host.textContent).toContain("home = Overall meter total");
  expect(host.textContent).toContain("Suggested circuit totals");
  expect(host.textContent).toContain("Advanced total hierarchy");
  expect(host.textContent).toContain("3 public total entities");
});

it("summarizes server counts and legacy ownership, not the number of requested outputs", () => {
  const meter = unowned(); meter.configuration_impact.public_total_entity_count = 8; meter.configuration_impact.internal_total_sensor_count = 4;
  host = document.createElement("div");
  render(summaryStep(meter.topology, null, null, new Map(), new Map(), null, true, null, () => {}, () => {}, meter, meter.configuration_impact), host);
  expect(host.textContent).toContain("8 public total entities; 4 internal total sensors");
  expect(host.textContent).toContain("Legacy read-only totals");
  expect(host.textContent).toContain("unsupported external custom energy");
});

it("labels unresolved installed native visibility as incomplete in summary", () => {
  const meter = unowned(); meter.totals.migration.native_visibility_resolved = false;
  host = document.createElement("div");
  render(summaryStep(meter.topology, null, null, new Map(), new Map(), null, true, null, () => {}, () => {}, meter, meter.configuration_impact), host);
  expect(host.textContent).toContain("Counts are confirmed but incomplete: native visibility is unresolved.");
});

it.each(["legacy_editable", "runtime_only"] as const)("keeps separate source evidence distinct from installation in %s summary", (mode) => {
  const source = unowned(); source.configuration_impact.public_total_entity_count = 11;
  host = document.createElement("div");
  render(summaryStep(source.topology, null, null, new Map(), new Map(), null, true, null, () => {}, () => {},
    null, null, () => {}, () => {}, mode, "calibrate_only", false, false, source), host);
  expect(host.querySelector("#summary-totals-heading")?.textContent ?? null).toBe(mode === "legacy_editable" ? "Legacy read-only totals" : null);
  expect(host.textContent).not.toContain("Installed electrical profile");
  if (mode === "legacy_editable") {
    expect(host.textContent).toContain("Authoritative source snapshot");
    expect(host.textContent).toContain("11 public total entities");
  }
});

it("lists exact preview visibility and helper blocks for explicit adoption", () => {
  const meter = unowned(); meter.configuration.totals_change_intent!.adopt_managed_totals = true;
  meter.totals.native_sources.push({ ...meter.totals.native_sources[0]!, source_id: "main", label: "Main Board total", existing_energy_id: null });
  meter.configuration.default_totals.boards = [{ board_index: 0, outputs: { watts: false, amps: false, kwh: true } }];
  const preview: TotalGraphPreview = { total_details: [], plan_id: meter.plan_id, source_sha256: meter.source_sha256, configuration_impact: meter.configuration_impact,
    automatic_candidates: [], automatic_totals: [], stale_automatic_total_settings: [], graph: {
      native_visibility: [{ sensor_id: "totalWattsMain", internal: true }, { sensor_id: "totalAmpsMain", internal: false }],
      ordered_nodes: [{ aggregate: total("Home", [ct(1)]), power_id: "opaque_w", current_id: "opaque_a", sources: [], power_required: true, current_required: false, energy_required: true }],
      leaf_channels: { Home: [1] }, independent_overlap_warnings: [] } };
  mount(meter, preview);
  expect(host.textContent).toContain("Overall meter total Watts: internal dependency");
  expect(host.textContent).toContain("Overall meter total Amps: public output");
  expect(host.textContent).toContain("Home: Watts, kWh");
  expect(host.textContent).toContain("Main Board total: kWh");
  expect(host.textContent).not.toContain("opaque_w");
});

it("separates requested visibility from the actual source-aware transaction additions", () => {
  const meter = unowned(); meter.configuration.totals_change_intent!.adopt_managed_totals = true;
  const preview: TotalGraphPreview = { total_details: [], plan_id: meter.plan_id, source_sha256: meter.source_sha256, configuration_impact: meter.configuration_impact,
    automatic_candidates: [], automatic_totals: [], stale_automatic_total_settings: [],
    graph: { native_visibility: [], ordered_nodes: [], leaf_channels: {}, independent_overlap_warnings: [] } };
  host = document.createElement("div");
  const status = { transaction_id: "1".repeat(32), state: "previewed" as const, source_sha256: meter.source_sha256,
    changes: [], redacted_diff: "+ id: !extend totalWattsMain\n+ internal: false", rollback_available: false, evidence: [], progress: [],
    validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
  render(totalsMigrationReview(meter, () => {}, preview, true, true, status), host);
  expect(host.textContent).toContain("Requested visibility changes versus firmware defaults");
  expect(host.querySelector('[aria-label="Exact adoption transaction diff"]')?.textContent).toContain("+ id: !extend totalWattsMain");
});
