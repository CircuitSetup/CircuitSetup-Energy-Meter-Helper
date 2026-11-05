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
    render(workflowProgress(phases, false, toggle, navigate, false), host);
    expect(host.querySelector("[aria-current=step]")?.textContent).toContain("Configure meter");
    expect(host.querySelector(".completed")?.textContent).toContain("Choose another meter");
    expect(host.querySelector(".upcoming")?.textContent).toContain("Done");
    expect(host.querySelector(".mobile-progress button")?.getAttribute("aria-expanded")).toBe("false");
    expect(host.querySelector(".mobile-progress span")?.textContent).toContain("Phase 2 of 3");
    (host.querySelector(".completed button") as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledOnce();
    expect(host.querySelectorAll("li button")).toHaveLength(1);
  });
});
