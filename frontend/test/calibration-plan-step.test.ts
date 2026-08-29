import { render } from "lit";
import { describe, expect, it, vi } from "vitest";
import { calibrationPlanStep } from "../src/components/calibration-plan-step";

describe("calibrationPlanStep", () => {
  it("offers keep-existing, standard, and full choices", async () => {
    const choose = vi.fn();
    const root = document.createElement("div");
    render(calibrationPlanStep(null, choose, () => {}), root);
    expect(root.textContent).to.contain("Keep existing calibration");
    expect(root.textContent).to.contain("Standard calibration");
    expect(root.textContent).to.contain("Full calibration");
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
