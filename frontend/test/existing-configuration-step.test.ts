import { describe, expect, it, vi } from "vitest";
import { html, render } from "lit";
import { existingConfigurationStep } from "../src/components/existing-configuration-step";
import { panelStyles } from "../src/styles";
import { meterResponse } from "./workflow-scenarios";

const configuration = meterResponse();
configuration.capabilities.semantic_source = "legacy_inferred";
configuration.capabilities.native_totals_writable = false;
configuration.capabilities.managed_automatic_totals = false;
configuration.capabilities.managed_advanced_totals = false;
configuration.capabilities.reason_codes = ["electrical_profile_requires_confirmation", "legacy_generic_totals_unmanaged", "config_contract_upgrade_required"];
configuration.warnings = ["stored_semantics_stale"];

describe("existing configuration step", () => {
  it("explains provenance, warnings, and branch actions without writing", () => {
    const manage = vi.fn(); const calibrate = vi.fn(); const back = vi.fn();
    const host = document.createElement("div"); document.body.append(host);
    render(html`<style>${panelStyles.cssText}</style>${existingConfigurationStep(configuration, {
      configurationFilename: "production-meter.yaml",
      projectName: "circuitsetup.6c-energy-meter",
      projectVersion: "2026.8.0",
      boardCount: 1,
      ctCount: 6,
    }, manage, calibrate, back)}`, host);
    const root = host;
    expect(root.textContent).toContain("production-meter.yaml");
    expect(root.textContent).toContain("circuitsetup.6c-energy-meter");
    expect(root.textContent).toContain("2026.8.0");
    expect(root.textContent).toContain("1 board");
    expect(root.textContent).toContain("6 CT inputs");
    expect(root.textContent).toContain("Read directly");
    expect(root.textContent).toContain("Inferred or not recorded");
    expect(root.textContent).toContain("Preserved if you do not migrate");
    expect(root.textContent).toContain("What migration changes");
    expect(root.textContent).toContain("unowned YAML");
    expect(root.textContent).toContain("electrical profile was inferred");
    expect(root.textContent).toContain("Existing generic totals will be preserved");
    expect(root.textContent).toContain("older helper contract");
    expect([...root.querySelectorAll(".warning-band li")].map((item) => item.textContent).join(" ")).not.toContain("stored_semantics_stale");
    expect(root.querySelector("details")?.textContent).toContain("stored_semantics_stale");
    expect(root.querySelector(".existing-configuration")?.getAttribute("aria-label")).toBe("Review Existing Setup");
    expect(root.querySelector(".existing-configuration h2")).toBeNull();
    expect([...root.querySelectorAll(".status-list > div")].map((row) => getComputedStyle(row).display)).toEqual(
      Array(8).fill("grid"),
    );
    const buttons = [...root.querySelectorAll("button")];
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      "Back", "Keep ESPHome configuration and calibrate only", "Review and manage with helper",
    ]);
    buttons[0]?.click(); buttons[1]?.click(); buttons[2]?.click();
    expect(manage).toHaveBeenCalledOnce(); expect(calibrate).toHaveBeenCalledOnce(); expect(back).toHaveBeenCalledOnce();
  });

  it("does not render for helper-managed configuration", () => {
    const host = document.createElement("div");
    render(existingConfigurationStep(meterResponse(), {
      configurationFilename: "meter.yaml", projectName: "project", projectVersion: "1", boardCount: 1, ctCount: 6,
    }, vi.fn(), vi.fn(), vi.fn()), host);
    expect(host.textContent).toBe("");
  });
});
