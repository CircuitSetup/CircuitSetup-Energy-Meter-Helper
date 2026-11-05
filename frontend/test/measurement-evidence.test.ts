import { render } from "lit";
import { expect, it, vi } from "vitest";
import { calibrationEvidence, calibrationProgress, stabilityEvidence } from "../src/components/measurement-evidence";
import { currentStep } from "../src/components/current-step";
import type { CalibrationResult } from "../src/types";
const result: CalibrationResult = { state: "applied_pending_restart_verification", group_key: "main_1", phase: "B", changed_channels: [2], iteration: 1, before_values: [1], after_values: [2], error_percent_values: [0], retry_allowed: false, gain_evidence: null, restore_evidence: null };
it("hides iteration and raw evidence while identifying expected rather than live after readings", () => {
 const root = document.createElement("div"); render(calibrationEvidence(result), root);
 expect(root.querySelector("details:not([open])")?.textContent).toContain("Calibration iteration 1");
 expect(root.textContent).toContain("Expected reading from gain change");
 expect(root.querySelector("details")?.textContent).toContain("Backend state");
});
it("hides sample evidence and removes automatic zero cleanup from user progress", () => {
 const root = document.createElement("div"); render(stabilityEvidence({ target: "current", target_id: "main_1", stable: true, windows: [{ samples: [1, 1, 1], mean: 1, standard_deviation: 0, range_percent: 0 }] }), root);
 expect(root.querySelector("details:not([open])")?.textContent).toContain("1.00 A");
 render(calibrationProgress(true, null, result, "full"), root);
 expect(root.querySelectorAll("li")).toHaveLength(4);
 expect(root.textContent).not.toContain("Zero reference");
});
it("reports current completion only for channels whose gains changed", () => {
 const root = document.createElement("div"); const noop=vi.fn();
 render(currentStep(null, null, null, 1, new Map([[2, 2]]), 1, null, result, new Set(), noop, noop, noop, noop, noop, noop, noop), root);
 expect(root.querySelector(".success-band")?.textContent).toContain("Current calibration complete for CT2.");
 expect(root.querySelector(".success-band")?.textContent).not.toContain("CT1");
});
