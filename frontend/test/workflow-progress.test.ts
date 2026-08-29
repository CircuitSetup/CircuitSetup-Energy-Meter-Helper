import { render } from "lit";
import { describe, expect, it, vi } from "vitest";
import { workflowProgress } from "../src/components/workflow-progress";
import type { WorkflowPhase } from "../src/workflow-model";

describe("workflowProgress", () => {
  it("shows phase status, safe setup return, and mobile disclosure state", () => {
    const host = document.createElement("div");
    const toggle = vi.fn();
    const navigate = vi.fn();
    const phases: WorkflowPhase[] = [
      { id: "device", index: 0, status: "completed" },
      { id: "meter", index: 1, status: "current" },
      { id: "complete", index: 2, status: "upcoming" },
    ];
    render(workflowProgress(phases, false, toggle, navigate), host);
    expect(host.querySelector("[aria-current=step]")?.textContent).toContain("Meter");
    expect(host.querySelector(".completed")?.textContent).toContain("Device");
    expect(host.querySelector(".upcoming")?.textContent).toContain("Complete");
    expect(host.querySelector(".mobile-progress button")?.getAttribute("aria-expanded")).toBe("false");
    (host.querySelector(".completed button") as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledOnce();
    expect(host.querySelectorAll("li button")).toHaveLength(1);
  });
});
