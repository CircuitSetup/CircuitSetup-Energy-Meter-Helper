import { describe, expect, it } from "vitest";
import { derivedParentId, reparentAggregate, sourceFormula } from "../src/total-graph";
import type { CircuitAggregate, TotalSource } from "../src/types";
import { meterResponse } from "./workflow-scenarios";

const aggregate = (id: string, sources: TotalSource[]): CircuitAggregate => ({
  aggregate_id: id, name: `Friendly ${id}`, role: "custom", sources,
  measurement_method: "direct", energy_mode: "consumption",
  outputs: { watts: true, amps: false, kwh: true }, origin: "advanced",
});
const child = aggregate("child", [{ kind: "channel", channel: 1 }]);
const old = aggregate("old", [{ kind: "aggregate", aggregate_id: "child" }]);
const next = aggregate("next", [{ kind: "native_total", source_id: "overall" }]);

describe("total graph state", () => {
  it("moves a child by editing parent sources immutably without duplicating it", () => {
    const input = [child, old, next];
    const snapshot = structuredClone(input);
    const moved = reparentAggregate("child", "next", input);
    expect(derivedParentId("child", moved)).toBe("next");
    expect(moved[0]).toEqual(child);
    expect(moved[1]!.sources).toEqual([]);
    expect(moved[2]!.sources).toEqual([...next.sources, { kind: "aggregate", aggregate_id: "child" }]);
    expect(reparentAggregate("child", "next", moved)).toEqual(moved);
    expect(input).toEqual(snapshot);
    expect(reparentAggregate("child", null, moved)[2]!.sources).toEqual(next.sources);
  });

  it("rejects missing parents, self links, cycles, raw/nested mixing and fanout", () => {
    expect(() => reparentAggregate("child", "missing", [child])).toThrow();
    expect(() => reparentAggregate("missing", null, [child])).toThrow();
    expect(() => reparentAggregate("child", "child", [child])).toThrow();
    expect(() => reparentAggregate("old", "child", [child, old])).toThrow();
    expect(() => reparentAggregate("old", "child", [aggregate("child", []), old])).toThrow();
    expect(() => reparentAggregate("child", "raw", [child, aggregate("raw", [{ kind: "channel", channel: 2 }])])).toThrow();
    expect(() => derivedParentId("child", [child, old, aggregate("other", old.sources)])).toThrow();
    expect(() => reparentAggregate("child", null, [child, old, aggregate("other", old.sources)])).toThrow();
  });

  it("formats native and nested sources with server friendly labels", () => {
    const inventory = meterResponse().totals;
    expect(sourceFormula([{ kind: "channel", channel: 2 }, { kind: "native_total", source_id: "overall" }, { kind: "aggregate", aggregate_id: "child" }], inventory, [child]))
      .toBe("CT2 + Overall meter total + Friendly child");
    expect(() => sourceFormula([{ kind: "native_total", source_id: "unknown" }], inventory, [])).toThrow();
  });
});
