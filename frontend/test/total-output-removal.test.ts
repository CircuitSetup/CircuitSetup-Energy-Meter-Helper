import { render } from "lit";
import { afterEach, expect, it, vi } from "vitest";
import { advancedTotalsEditor } from "../src/components/advanced-totals-editor";
import { automaticTotalsSection } from "../src/components/automatic-totals-section";
import { defaultTotalsSection } from "../src/components/default-totals-section";
import { meterResponse } from "./workflow-scenarios";

let container: HTMLDivElement;
afterEach(() => { container?.remove(); vi.restoreAllMocks(); });

it.each(["default", "advanced", "automatic"])("confirms disabling published %s outputs and restores canceled checkboxes", (kind) => {
  const response = meterResponse();
  const outputs = { watts: true, amps: true, kwh: true };
  response.configuration.default_totals.overall = outputs;
  response.configuration.aggregates = [{ aggregate_id: "home", name: "Home", role: "custom", sources: [{ kind: "channel", channel: 1 }],
    measurement_method: "direct", energy_mode: "consumption", outputs, origin: "advanced" }];
  const candidate = { candidate_id: "mains", aggregate_id: "auto-mains", name: "Mains", role: "grid" as const,
    sources: [{ kind: "channel" as const, channel: 1 }, { kind: "channel" as const, channel: 2 }], measurement_method: "two_ct_sum" as const,
    energy_mode: "consumption" as const, recommended_outputs: outputs };
  response.configuration.automatic_totals = [{ candidate_id: "mains", enabled: true, outputs }];
  response.totals.automatic_candidates = [candidate];
  response.totals.automatic_totals = [{ candidate, enabled: true, outputs }];
  const source = structuredClone(response.configuration);
  const update = vi.fn();
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  container = document.createElement("div"); document.body.append(container);
  const draw = () => render(kind === "default"
    ? defaultTotalsSection(response.configuration, response.totals, true, true, update, "ready", [], source)
    : kind === "advanced"
      ? advancedTotalsEditor(response.configuration, new Map(), update, true, "", response.totals, null, true, true, source)
      : automaticTotalsSection(response.configuration, response.totals, true, update, source), container);
  draw();
  for (const label of ["Watts", "Amps", "kWh"]) {
    const name = `${kind === "default" ? "Overall meter total" : kind === "advanced" ? "Home" : "Mains"} ${label}`;
    const control = container.querySelector<HTMLInputElement>(`[aria-label="${name}"]`)!;
    control.click();
    expect(confirm).toHaveBeenLastCalledWith(expect.stringContaining(name));
    expect(confirm).toHaveBeenLastCalledWith(expect.stringContaining("Home Assistant"));
    expect(control.checked).toBe(true);
    expect(update).not.toHaveBeenCalled();
    confirm.mockReturnValueOnce(true);
    control.click();
    expect(control.checked).toBe(false);
    expect(update).toHaveBeenCalledOnce();
    update.mockClear();
  }
  if (kind === "advanced") {
    const energy = container.querySelector<HTMLSelectElement>('[aria-label="home aggregate energy"]')!;
    energy.value = "none"; energy.dispatchEvent(new Event("change"));
    expect(energy.value).toBe("consumption");
    expect(update).not.toHaveBeenCalled();
  }
  if (kind === "automatic") {
    const enabled = container.querySelector<HTMLInputElement>('[aria-label="Create Mains total"]')!;
    enabled.click();
    expect(enabled.checked).toBe(true);
    expect(update).not.toHaveBeenCalled();
  }
  confirm.mockClear();
  source.default_totals.overall = { watts: false, amps: false, kwh: false };
  source.aggregates = [];
  source.automatic_totals = [];
  render(null, container); draw();
  container.querySelector<HTMLInputElement>(`[aria-label="${kind === "default" ? "Overall meter total" : kind === "advanced" ? "Home" : "Mains"} Watts"]`)!.click();
  expect(confirm).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledOnce();
});
