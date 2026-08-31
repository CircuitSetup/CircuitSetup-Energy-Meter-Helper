import type { CircuitAggregate, TotalSource, TotalsInventory } from "./types";

export function derivedParentId(aggregateId: string, aggregates: readonly CircuitAggregate[]): string | null {
  const parents = aggregates.filter((item) => item.sources.some((source) => source.kind === "aggregate" && source.aggregate_id === aggregateId));
  if (parents.length > 1) throw new Error("A total cannot have multiple parents.");
  return parents[0]?.aggregate_id ?? null;
}

export function reparentAggregate(aggregateId: string, parentId: string | null, aggregates: readonly CircuitAggregate[]): CircuitAggregate[] {
  if (!aggregates.some((item) => item.aggregate_id === aggregateId)) throw new Error("Unknown child total.");
  derivedParentId(aggregateId, aggregates);
  if (parentId !== null) {
    const parent = aggregates.find((item) => item.aggregate_id === parentId);
    if (!parent || parentId === aggregateId) throw new Error("Invalid parent total.");
    if (parent.measurement_method !== "direct" || parent.sources.some((source) => source.kind === "channel")) throw new Error("A parent cannot mix CTs with nested totals.");
    const seen = new Set([aggregateId]);
    for (let current: string | null = parentId; current !== null; current = derivedParentId(current, aggregates)) {
      if (seen.has(current)) throw new Error("Totals cannot form a cycle.");
      seen.add(current);
    }
  }
  return aggregates.map((item) => {
    const sources = item.sources.filter((source) => source.kind !== "aggregate" || source.aggregate_id !== aggregateId);
    if (item.aggregate_id === parentId) sources.push({ kind: "aggregate", aggregate_id: aggregateId });
    return { ...item, sources };
  });
}

export function sourceFormula(sources: readonly TotalSource[], inventory: TotalsInventory, aggregates: readonly CircuitAggregate[]): string {
  return sources.map((source) => {
    if (source.kind === "channel") return `CT${source.channel}`;
    const label = source.kind === "native_total"
      ? inventory.native_sources.find((item) => item.source_id === source.source_id)?.label
      : aggregates.find((item) => item.aggregate_id === source.aggregate_id)?.name
        ?? inventory.automatic_candidates.find((item) => item.aggregate_id === source.aggregate_id)?.name;
    if (!label) throw new Error("Unknown total source.");
    return label;
  }).join(" + ");
}
