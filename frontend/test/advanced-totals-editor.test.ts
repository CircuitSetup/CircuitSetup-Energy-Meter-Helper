import { render } from "lit";
import { afterEach, expect, it, vi } from "vitest";
import { advancedTotalsEditor } from "../src/components/advanced-totals-editor";
import type { CircuitAggregate, TotalGraphPreview, TotalSource } from "../src/types";
import { meterResponse } from "./workflow-scenarios";

const ct = (channel: number): TotalSource => ({ kind: "channel", channel });
const native = (source_id: string): TotalSource => ({ kind: "native_total", source_id });
const child = (aggregate_id: string): TotalSource => ({ kind: "aggregate", aggregate_id });
const total = (aggregate_id: string, name: string, sources: TotalSource[] = []): CircuitAggregate => ({
  aggregate_id, name, sources, role: "custom", measurement_method: "direct", energy_mode: "consumption",
  outputs: { watts: true, amps: false, kwh: true }, origin: "advanced",
});
let container: HTMLDivElement;
afterEach(() => { container?.remove(); vi.restoreAllMocks(); });

function mount(aggregates = [total("home", "Home")], writable = true, fresh = true, preview: TotalGraphPreview | null = null) {
  const response = meterResponse();
  response.configuration.aggregates = aggregates;
  const base = response.totals.native_sources[0]!;
  response.totals.native_sources = [
    { ...base, source_id: "opaque-main", label: "Main Board total", leaf_channels: [1, 2, 3, 4, 5, 6] },
    { ...base, source_id: "opaque-addon", label: "Add-on 1 total", leaf_channels: [7, 8, 9, 10, 11, 12] },
    { ...base, source_id: "opaque-overall", label: "Overall meter total", leaf_channels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  ];
  const candidate = { candidate_id: "server-setting", aggregate_id: "server-aggregate", name: "Solar report", role: "solar" as const,
    sources: [{ kind: "channel" as const, channel: 4 }, { kind: "channel" as const, channel: 5 }], measurement_method: "two_ct_sum" as const,
    energy_mode: "generation" as const, recommended_outputs: { watts: false, amps: false, kwh: false } };
  response.totals.automatic_candidates = [candidate];
  response.totals.automatic_totals = [{ candidate, enabled: true, outputs: candidate.recommended_outputs }];
  let configuration = response.configuration;
  container = document.createElement("div"); document.body.append(container);
  const update = vi.fn((next: typeof configuration) => { configuration = next; draw(); });
  const draw = () => render(advancedTotalsEditor(configuration, new Map(), update, writable, "unmanaged_total_present", response.totals, preview, fresh), container);
  draw();
  return { response, update, draw, configuration: () => configuration };
}
const input = (label: string) => container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
const select = (label: string) => container.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`);
function choose(label: string, value: string) {
  const control = select(label);
  if (control) { control.value = value; control.dispatchEvent(new Event("change")); }
}
const card = (name: string) => container.querySelector<HTMLFieldSetElement>(`[aria-label="${name} aggregate"]`);

it("groups server native sources, enabled existing totals and named CTs", () => {
  mount([total("home", "Home"), total("garage", "Garage", [ct(3)])]);
  expect([...card("Home")?.querySelectorAll(".aggregate-sources > legend") ?? []].map((node) => node.textContent))
    .toEqual(["Native totals", "Existing totals", "CTs"]);
  expect(input("Home: Main Board total")).not.toBeNull();
  expect(input("Home: Garage")).not.toBeNull();
  expect(input("Home: Solar report")?.disabled).toBe(false);
  expect(card("Home")?.textContent).toContain("CT1 ·");
});

it("selects board totals as immediate sources and previews names separately from physical coverage", () => {
  const state = mount();
  input("Home: Main Board total")?.click(); input("Home: Add-on 1 total")?.click();
  expect(state.configuration().aggregates[0]!.sources).toEqual([native("opaque-main"), native("opaque-addon")]);
  expect(card("Home")?.querySelector(".aggregate-formula")?.textContent).toBe("Formula: Main Board total + Add-on 1 total");
  expect(card("Home")?.textContent).toContain("Coverage: CT1–CT12");
});

it("moves Feeds into by removing the old edge without mutating its input", () => {
  const original = [total("child", "Child", [ct(1)]), total("old", "Old", [child("child")]), total("next", "Next")];
  const state = mount(original);
  choose("Child Feeds into", "next");
  expect(state.configuration().aggregates[1]!.sources).toEqual([]);
  expect(state.configuration().aggregates[2]!.sources).toEqual([child("child")]);
  expect(original[1]!.sources).toEqual([child("child")]);
  expect(select("Child Feeds into")?.value).toBe("next");
});

it("disables cycle parents and restores the visible selection after a forged change", () => {
  const state = mount([total("child", "Child", [ct(1)]), total("parent", "Parent", [child("child")])]);
  expect(select("Parent Feeds into")?.querySelector<HTMLOptionElement>('[value="child"]')?.disabled).toBe(true);
  choose("Parent Feeds into", "child");
  expect(state.update).not.toHaveBeenCalled();
  expect(select("Parent Feeds into")?.value).toBe("");
});

it("disables overlapping native sources using physical leaves even when a CT is disabled", () => {
  const state = mount([total("home", "Home", [native("opaque-main")])]);
  state.response.configuration.channels[0]!.enabled = false; state.draw();
  expect(input("Home: Overall meter total")?.disabled).toBe(true);
  expect(input("Home: Overall meter total")?.closest("label")?.textContent).toMatch(/overlap/i);
  const control = input("Home: Overall meter total")!;
  control.checked = true; control.dispatchEvent(new Event("change"));
  expect(state.update).not.toHaveBeenCalled();
  expect(control.checked).toBe(false);
});

it("allows independent reports to reuse a CT and warns against adding them", () => {
  const state = mount([total("a", "Report A", [ct(1)]), total("b", "Report B")]);
  input("Report B: CT1")?.click();
  expect(state.configuration().aggregates[1]!.sources).toEqual([ct(1)]);
  expect(card("Report B")?.textContent).toContain("This total overlaps another report. They are valid independently but must not be added together.");
});

it("clears and disables kWh for Energy behavior None", () => {
  const state = mount([total("home", "Home", [ct(1)])]);
  choose("home aggregate energy", "none");
  expect(state.configuration().aggregates[0]!.outputs.kwh).toBe(false);
  expect(input("Home kWh")?.disabled).toBe(true);
  expect(input("Home kWh")?.checked).toBe(false);
});

it("allows Watts off while kWh remains on", () => {
  const state = mount([total("home", "Home", [ct(1)])]);
  input("Home Watts")?.click();
  expect(state.configuration().aggregates[0]!.outputs).toEqual({ watts: false, amps: false, kwh: true });
});

it("cancels referenced-child deletion and explicitly removes only its parent edge on confirmation", () => {
  const state = mount([total("child", "Child", [ct(1)]), total("parent", "Parent", [child("child")]), total("other", "Other", [ct(2)])]);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  card("Child")?.querySelector<HTMLButtonElement>('[data-action="delete-aggregate"]')?.click();
  expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/Parent.*Child|Child.*Parent/));
  expect(state.update).not.toHaveBeenCalled();
  confirm.mockReturnValue(true); card("Child")?.querySelector<HTMLButtonElement>('[data-action="delete-aggregate"]')?.click();
  expect(state.configuration().aggregates).toEqual([total("parent", "Parent"), total("other", "Other", [ct(2)])]);
});

it("names children becoming independent when deleting a parent and preserves them", () => {
  const state = mount([total("child", "Child", [ct(1)]), total("parent", "Parent", [child("child")])]);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  card("Parent")?.querySelector<HTMLButtonElement>('[data-action="delete-aggregate"]')?.click();
  expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/Child.*independent/));
  expect(state.update).not.toHaveBeenCalled();
  confirm.mockReturnValue(true); card("Parent")?.querySelector<HTMLButtonElement>('[data-action="delete-aggregate"]')?.click();
  expect(state.configuration().aggregates).toEqual([total("child", "Child", [ct(1)])]);
});

it("keeps the stable raw ID only in Advanced details while names remain editable", () => {
  const state = mount([total("opaque-id", "Friendly name", [ct(1)])]);
  expect(card("Friendly name")?.querySelector("details")?.textContent ?? "").toContain("opaque-id");
  expect(card("Friendly name")?.querySelector("legend")?.textContent).toBe("Friendly name");
  const name = input("opaque-id aggregate name")!;
  name.value = "Renamed"; name.dispatchEvent(new Event("input"));
  expect(state.configuration().aggregates[0]!.aggregate_id).toBe("opaque-id");
});

it("does not steal an already-parented child through the ordinary source picker", () => {
  const state = mount([total("child", "Child", [ct(1)]), total("old", "Old", [child("child")]), total("next", "Next")]);
  expect(input("Next: Child")?.disabled).toBe(true);
  expect(input("Next: Child")?.closest("label")?.textContent).toMatch(/Feeds into/);
  const control = input("Next: Child")!; control.checked = true; control.dispatchEvent(new Event("change"));
  expect(state.update).not.toHaveBeenCalled(); expect(control.checked).toBe(false);
});

it("does not mix source classes or silently change a special measurement method", () => {
  const state = mount([{ ...total("raw", "Raw", [ct(1)]), measurement_method: "one_ct_double_power" }, total("child", "Child", [ct(2)])]);
  expect(input("Raw: Main Board total")?.disabled).toBe(true);
  expect(select("Child Feeds into")?.querySelector<HTMLOptionElement>('[value="raw"]')?.disabled).toBe(true);
  choose("Child Feeds into", "raw");
  expect(state.update).not.toHaveBeenCalled(); expect(select("Child Feeds into")?.value).toBe("");
  expect(state.configuration().aggregates[0]!.measurement_method).toBe("one_ct_double_power");
});

it("excludes disabled automatic definitions while retaining enabled children with hidden outputs", () => {
  const state = mount();
  expect(input("Home: Solar report")?.disabled).toBe(false);
  state.response.configuration.automatic_totals = [{ candidate_id: "server-setting", enabled: false, outputs: { watts: false, amps: false, kwh: false } }];
  state.draw();
  expect(input("Home: Solar report")).toBeNull();
});

it("references an enabled automatic child by aggregate ID without changing its candidate settings", () => {
  const state = mount();
  input("Home: Solar report")?.click();
  expect(state.configuration().aggregates[0]!.sources).toEqual([child("server-aggregate")]);
  expect(state.configuration().automatic_totals).toEqual([]);
});

it("guards read-only handlers as well as native controls", () => {
  const state = mount([total("home", "Home", [ct(1)])], false);
  expect(card("Home")?.disabled).toBe(true);
  const control = input("Home Watts")!; control.checked = false; control.dispatchEvent(new Event("change"));
  expect(state.update).not.toHaveBeenCalled(); expect(control.checked).toBe(true);
  expect(container.querySelector('[data-action="add-aggregate"]')).toBeNull();
});

it("withholds stale automatic choices and coverage while native topology can repair an invalid draft", () => {
  const state = mount([total("home", "Home", [native("opaque-main")])], true, false);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  expect(input("Home: Add-on 1 total")?.disabled).toBe(false);
  expect(input("Home: Solar report")).toBeNull();
  expect(card("Home")?.textContent).not.toContain("Coverage: CT1–CT6");
  input("Home: Main Board total")?.click();
  expect(state.configuration().aggregates[0]!.sources).toEqual([]);
  expect(card("Home")?.textContent).toMatch(/incomplete|select.*source/i);
  input("Home: Add-on 1 total")?.click();
  expect(state.configuration().aggregates[0]!.sources).toEqual([native("opaque-addon")]);
});

it("keeps unknown sources visible and removable rather than crashing or guessing coverage", () => {
  const state = mount([total("home", "Home", [native("missing")])]);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  expect(card("Home")?.textContent ?? "").toMatch(/unknown.*source/i);
  input("Home: Unknown source")?.click();
  expect(state.configuration().aggregates[0]!.sources).toEqual([]);
});

it("cancels native source removal without leaving an unchecked control", () => {
  const state = mount([total("home", "Home", [native("opaque-main")])]);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  input("Home: Main Board total")?.click();
  expect(state.update).not.toHaveBeenCalled();
  expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/Main Board total.*Home/));
  expect(input("Home: Main Board total")?.checked).toBe(true);
});

it("cancels Feeds into detachment without losing the visible parent", () => {
  const state = mount([total("child", "Child", [ct(1)]), total("parent", "Parent", [child("child")])]);
  vi.spyOn(window, "confirm").mockReturnValue(false);
  choose("Child Feeds into", "");
  expect(state.update).not.toHaveBeenCalled();
  expect(select("Child Feeds into")?.value).toBe("parent");
});

it("does not attach an incomplete special-method child by picker or Feeds into", () => {
  mount([{ ...total("child", "Child", [ct(1)]), measurement_method: "two_ct_sum" }, total("parent", "Parent")]);
  expect(input("Parent: Child")?.disabled).toBe(true);
  expect(select("Child Feeds into")?.querySelector<HTMLOptionElement>('[value="parent"]')?.disabled).toBe(true);
});

it("rejects edits that would introduce overlap through an existing ancestor", () => {
  const state = mount([total("child", "Child", [native("opaque-main")]), total("parent", "Parent", [child("child"), native("opaque-addon")])]);
  expect(input("Child: Add-on 1 total")?.disabled).toBe(true);
  const control = input("Child: Add-on 1 total")!;
  control.checked = true; control.dispatchEvent(new Event("change"));
  expect(state.update).not.toHaveBeenCalled(); expect(control.checked).toBe(false);
});

it("can repair an empty Two CT Sum child without silently detaching it", () => {
  const state = mount([{ ...total("child", "Child"), measurement_method: "two_ct_sum" }, total("parent", "Parent", [child("child")])]);
  input("Child: CT1")?.click();
  expect(state.configuration().aggregates[0]!.sources).toEqual([ct(1)]);
  expect(card("Child")?.textContent).toContain("Incomplete total");
  input("Child: CT2")?.click();
  expect(state.configuration().aggregates[0]!.sources).toEqual([ct(1), ct(2)]);
  expect(state.configuration().aggregates[1]!.sources).toEqual([child("child")]);
});

it("recognizes selected sources regardless of server JSON property order", () => {
  const state = mount([total("home", "Home", [{ source_id: "opaque-main", kind: "native_total" }])]);
  expect(input("Home: Main Board total")?.checked).toBe(true);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  input("Home: Main Board total")?.click();
  expect(state.configuration().aggregates[0]!.sources).toEqual([]);
});

it("uses current server recursive leaves and independent overlap warnings", () => {
  const response = meterResponse();
  const preview: TotalGraphPreview = { plan_id: response.plan_id, source_sha256: response.source_sha256,
    configuration_impact: response.configuration_impact, automatic_candidates: [], automatic_totals: [], stale_automatic_total_settings: [],
    graph: { native_visibility: [], ordered_nodes: [], leaf_channels: { home: [2, 5] }, independent_overlap_warnings: [{ first_id: "home", second_id: "server-aggregate", leaf_channels: [5] }] } };
  mount([total("home", "Home", [ct(2), ct(5)])], true, true, preview);
  expect(card("Home")?.textContent ?? "").toContain("Coverage: CT2, CT5");
  expect(card("Home")?.textContent).toContain("This total overlaps another report.");
});
