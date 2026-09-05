import { render } from "lit";
import { afterEach, expect, it } from "vitest";
import { summaryStep } from "../src/components/summary-step";
import type { CircuitAggregate, MeasurementMethod, TotalSource } from "../src/types";
import { meterResponse } from "./workflow-scenarios";

const root = document.createElement("div");
afterEach(() => { render(null, root); root.remove(); });

const aggregate = (aggregate_id: string, name: string, sources: TotalSource[], measurement_method: MeasurementMethod = "direct"): CircuitAggregate => ({
  aggregate_id, name, sources, measurement_method, role: "custom", energy_mode: "consumption",
  outputs: { watts: true, amps: false, kwh: true }, origin: "advanced",
});

it("shows the backend immediate board-total formula for Overall while retaining physical coverage", () => {
  const meter = meterResponse();
  const overall = meter.totals.native_sources[0]!;
  meter.totals.native_sources = [
    { ...overall, source_id: "board-main", label: "Main Board total", leaf_channels: [1, 2, 3, 4, 5, 6] },
    { ...overall, source_id: "board-addon-1", label: "Add-on 1 total", leaf_channels: [7, 8, 9, 10, 11, 12] },
    { ...overall, leaf_channels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  ];
  const evidence = { kind: "native_total" as const, total_id: "overall",
    ownership: "helper_managed" as const, public_outputs: ["Watts", "kWh"], internal_outputs: [],
    unverified_outputs: [], native_sources: ["board-main", "board-addon-1"] };
  meter.total_details = [evidence, { ...evidence, total_id: "board-main", public_outputs: [], internal_outputs: ["Watts"], native_sources: [] }];
  meter.configuration.aggregates = [aggregate("a", "First report", [{ kind: "native_total", source_id: "board-main" }]),
    aggregate("b", "Second report", [{ kind: "native_total", source_id: "board-main" }])];
  document.body.append(root);
  render(summaryStep(meter.topology, null, null, new Map(), new Map(), null, true, "version",
    () => undefined, () => undefined, meter, meter.configuration_impact), root);
  expect(root.textContent).toContain("Formula: Main Board total + Add-on 1 total");
  expect(root.textContent).toContain("Coverage: CT1, CT2, CT3, CT4, CT5, CT6, CT7, CT8, CT9, CT10, CT11, CT12");
  expect(root.textContent).toContain("Feeds into: First report, Second report");
});

it("renders backend public outputs, dependencies, formulas, coverage and pending migration without estimating energy", () => {
  const meter = { ...meterResponse(), total_details: [
    { kind: "aggregate" as const, total_id: "parent", ownership: "helper_managed" as const,
      public_outputs: ["Watts", "kWh"], internal_outputs: [], unverified_outputs: [] },
    { kind: "aggregate" as const, total_id: "hidden", ownership: "helper_managed" as const,
      public_outputs: [], internal_outputs: ["Watts"], unverified_outputs: [] },
    { kind: "aggregate" as const, total_id: "auto-mains", ownership: "helper_managed" as const,
      public_outputs: ["Net Watts", "Import Watts", "Return-to-grid Watts", "Import kWh", "Return-to-grid kWh"], internal_outputs: [], unverified_outputs: [] },
  ] };
  meter.configuration.aggregates = [aggregate("parent", "Parent report", [{ kind: "aggregate", aggregate_id: "hidden" }]),
    aggregate("hidden", "Hidden branch", [{ kind: "channel", channel: 3 }])];
  meter.totals.automatic_candidates = [{ candidate_id: "grid-ct1-ct2", aggregate_id: "auto-mains", name: "Mains", role: "grid",
    sources: [{ kind: "channel", channel: 1 }, { kind: "channel", channel: 2 }], measurement_method: "two_ct_sum",
    energy_mode: "bidirectional", recommended_outputs: { watts: true, amps: false, kwh: true } }];
  meter.configuration_impact.energy_entity_count = 4;
  meter.totals.migration.legacy_parent_links = [{ child_id: "hidden", proposed_parent_id: "parent" }];
  meter.totals.migration.parent_review_required = true;
  document.body.append(root);
  render(summaryStep(meter.topology, null, null, new Map(), new Map(), null, true, "version",
    () => undefined, () => undefined, meter, meter.configuration_impact), root);
  expect(root.textContent).toContain("Parent report");
  expect(root.textContent).toContain("Public outputs: Watts, kWh");
  expect(root.textContent).toContain("Internal outputs: Watts");
  expect(root.textContent).toContain("Feeds into: Parent report");
  expect(root.textContent).toContain("Formula: Hidden branch");
  expect(root.textContent).toContain("Coverage: CT3");
  expect(root.textContent).toContain("Import kWh, Return-to-grid kWh");
  expect(root.textContent).toContain("4 public energy entities");
  expect(root.textContent).toContain("Hidden branch → Parent report: pending review");
  expect(root.textContent).not.toContain("Aggregate energy");
});

it("labels source-owned unknown outputs as unverified and never presents runtime-only source evidence", () => {
  const meter = { ...meterResponse(), total_details: [
    { kind: "aggregate" as const, total_id: "legacy", ownership: "source_owned" as const,
      public_outputs: ["Watts"], internal_outputs: [], unverified_outputs: ["external custom kWh"] },
  ] };
  meter.configuration.aggregates = [aggregate("legacy", "Legacy report", [{ kind: "channel", channel: 1 }])];
  document.body.append(root);
  const show = (mode: "legacy_editable" | "runtime_only") => render(summaryStep(meter.topology, null, null,
    new Map(), new Map(), null, true, "version", () => undefined, () => undefined, null, null,
    () => undefined, () => undefined, mode, "calibrate_only", false, false, meter), root);
  show("legacy_editable");
  expect(root.textContent).toContain("Legacy report");
  expect(root.textContent).toContain("Read-only source YAML");
  expect(root.textContent).toContain("Unverified outputs: external custom kWh");
  expect(root.textContent).toContain("not been adopted or verified as installed");
  show("runtime_only");
  expect(root.textContent).not.toContain("Legacy report");
  expect(root.textContent).toContain("no authoritative configuration was available");
});

it.each([
  ["one_ct_double_power", "2 × (CT1) Watts; measured Amps"],
  ["both_conductors_one_ct", "CT1 (both conductors)"],
  ["two_ct_sum", "CT1 + CT2"],
] as const)("retains the %s measurement meaning in Summary", (method, formula) => {
  const meter = meterResponse();
  meter.configuration.aggregates = [aggregate("report", "Report", method === "two_ct_sum"
    ? [{ kind: "channel", channel: 1 }, { kind: "channel", channel: 2 }] : [{ kind: "channel", channel: 1 }], method)];
  meter.total_details = [{ kind: "aggregate", total_id: "report", ownership: "helper_managed",
    public_outputs: ["Watts"], internal_outputs: [], unverified_outputs: [] }];
  document.body.append(root);
  render(summaryStep(meter.topology, null, null, new Map(), new Map(), null, true, "version",
    () => undefined, () => undefined, meter, meter.configuration_impact), root);
  expect(root.textContent).toContain(`Formula: ${formula}`);
});
