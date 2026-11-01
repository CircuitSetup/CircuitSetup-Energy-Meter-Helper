import { html, render } from "lit";
import { describe, expect, it, vi } from "vitest";
import { calibrationPlanStep } from "../src/components/calibration-plan-step";
import { panelStyles } from "../src/styles";

describe("calibrationPlanStep", () => {
  it("offers keep-existing, standard, and full choices", async () => {
    const choose = vi.fn();
    const root = document.createElement("div");
    render(calibrationPlanStep(null, choose, () => {}, false, false), root);
    expect(root.textContent).to.contain("Keep existing calibration");
    expect(root.textContent).to.contain("Calibrate voltage and current");
    expect(root.textContent).to.contain("Include offset calibration");
  });

  it("lays out the calibration choices as three aligned rows", () => {
    const root = document.createElement("div");
    document.body.append(root);
    render(html`<style>${panelStyles.cssText}</style>${calibrationPlanStep(null, vi.fn(), vi.fn(), false, false)}`, root);

    const fieldset = root.querySelector("fieldset");
    const labels = [...root.querySelectorAll("fieldset label")];
    expect(labels).toHaveLength(3);
    expect(getComputedStyle(fieldset!).display).toBe("grid");
    expect(labels.map((label) => getComputedStyle(label).display)).toEqual(["flex", "flex", "flex"]);
    root.remove();
  });

  it("discloses runtime-only limitations before calibration", () => {
    const root = document.createElement("div");
    render(calibrationPlanStep(null, vi.fn(), vi.fn(), true, false), root);

    for (const copy of [
      "connected to Home Assistant",
      "ESPHome source editing is unavailable",
      "This helper cannot change circuit names, CT models, roles, multipliers, entities, or totals",
      "saved in meter flash",
      "later firmware install may replace",
      "ESPHome Device Builder",
      "reporting multiplier",
    ]) expect(root.textContent).toContain(copy);
  });

  it("shows and locks the plan while the next page loads", () => {
    const root = document.createElement("div");
    render(calibrationPlanStep("standard", vi.fn(), vi.fn(), false, true), root);

    expect(root.querySelector('[role="status"]')?.textContent).toContain("Loading calibration");
    expect(root.querySelector(".loading-spinner")?.getAttribute("aria-hidden")).toBe("true");
    expect(root.querySelector("fieldset")?.disabled).toBe(true);
    expect(root.querySelector("button")?.disabled).toBe(true);
  });
});

it("selects a plan without proceeding until the explicit primary action", () => {
  const root = document.createElement("div");
  const choose = vi.fn(), proceed = vi.fn();
  render(calibrationPlanStep("standard", choose, vi.fn(), false, false, proceed), root);
  const radio = root.querySelectorAll<HTMLInputElement>('input[type="radio"]')[0]!;
  radio.dispatchEvent(new Event("change"));
  expect(choose).toHaveBeenCalledWith("keep_existing");
  expect(proceed).not.toHaveBeenCalled();
  root.querySelector<HTMLButtonElement>('[data-action="start-calibration"]')!.click();
  expect(proceed).toHaveBeenCalledOnce();
});
