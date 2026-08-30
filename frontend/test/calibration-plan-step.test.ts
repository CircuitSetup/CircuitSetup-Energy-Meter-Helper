import { html, render } from "lit";
import { describe, expect, it, vi } from "vitest";
import { calibrationPlanStep } from "../src/components/calibration-plan-step";
import { panelStyles } from "../src/styles";

describe("calibrationPlanStep", () => {
  it("offers keep-existing, standard, and full choices", async () => {
    const choose = vi.fn();
    const root = document.createElement("div");
    render(calibrationPlanStep(null, choose, () => {}), root);
    expect(root.textContent).to.contain("Keep existing calibration");
    expect(root.textContent).to.contain("Standard calibration");
    expect(root.textContent).to.contain("Full calibration");
  });

  it("lays out the calibration choices as three aligned rows", () => {
    const root = document.createElement("div");
    document.body.append(root);
    render(html`<style>${panelStyles.cssText}</style>${calibrationPlanStep(null, vi.fn(), vi.fn())}`, root);

    const fieldset = root.querySelector("fieldset");
    const labels = [...root.querySelectorAll("fieldset > label")];
    expect(labels).toHaveLength(3);
    expect(getComputedStyle(fieldset!).display).toBe("grid");
    expect(labels.map((label) => getComputedStyle(label).display)).toEqual(["flex", "flex", "flex"]);
    root.remove();
  });

  it("discloses runtime-only limitations before calibration", () => {
    const root = document.createElement("div");
    render(calibrationPlanStep(null, vi.fn(), vi.fn(), true), root);

    for (const copy of [
      "connected to Home Assistant",
      "ESPHome source editing is unavailable",
      "Circuit names, CT models, roles, multipliers, entities, and totals cannot be changed",
      "saved in meter flash",
      "Installing firmware later may replace",
      "ESPHome Device Builder",
      "reporting multiplier",
    ]) expect(root.textContent).toContain(copy);
  });
});
