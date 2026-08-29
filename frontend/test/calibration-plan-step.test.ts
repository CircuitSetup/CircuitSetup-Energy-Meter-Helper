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
});
