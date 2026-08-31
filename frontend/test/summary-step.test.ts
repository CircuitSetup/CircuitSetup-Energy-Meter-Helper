import { render } from "lit";
import { afterEach, expect, it } from "vitest";
import { summaryStep } from "../src/components/summary-step";
import { meterResponse } from "./workflow-scenarios";

const root = document.createElement("div");
afterEach(() => { render(null, root); root.remove(); });

it("renders backend public outputs, dependencies, formulas, coverage and pending migration without estimating energy", () => {
  const meter = { ...meterResponse(), total_details: [
    { kind: "aggregate" as const, total_id: "parent", name: "Parent report", ownership: "helper_managed" as const,
      public_outputs: ["Watts", "kWh"], internal_outputs: [], unverified_outputs: [],
      sources: ["Hidden branch"], formula: "Hidden branch", leaf_channels: [3], parents: [] },
    { kind: "aggregate" as const, total_id: "hidden", name: "Hidden branch", ownership: "helper_managed" as const,
      public_outputs: [], internal_outputs: ["Watts"], unverified_outputs: [],
      sources: ["CT3"], formula: "CT3", leaf_channels: [3], parents: ["Parent report"] },
    { kind: "aggregate" as const, total_id: "auto-mains", name: "Mains", ownership: "helper_managed" as const,
      public_outputs: ["Net Watts", "Import Watts", "Return-to-grid Watts", "Import kWh", "Return-to-grid kWh"], internal_outputs: [], unverified_outputs: [],
      sources: ["CT1", "CT2"], formula: "CT1 + CT2", leaf_channels: [1, 2], parents: [] },
  ] };
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
    { kind: "aggregate" as const, total_id: "legacy", name: "Legacy report", ownership: "source_owned" as const,
      public_outputs: ["Watts"], internal_outputs: [], unverified_outputs: ["external custom kWh"],
      sources: ["CT1"], formula: "CT1", leaf_channels: [1], parents: [] },
  ] };
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
