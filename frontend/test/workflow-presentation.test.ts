import { render } from "lit";
import { expect, it } from "vitest";
import { setupDeviceStep } from "../src/components/setup-device-step";
import { buildInstallStep } from "../src/components/build-install-step";
import { summaryOutcome } from "../src/components/summary-step";
import { newInstallScenario } from "./workflow-scenarios";
const noop = () => undefined;
it("opens new-meter setup only when no known meters exist and gives app-specific instructions", () => {
 const root = document.createElement("div");
 render(setupDeviceStep({ snapshot: { ...newInstallScenario.setup, devices: [] }, addonCount: 0, connection: "ethernet_lilygo" }, { setAddon: noop, setConnection: noop, rescan: noop, configure: noop, adopt: noop }), root);
 expect(root.querySelector<HTMLDetailsElement>("details.new-meter")?.open).toBe(true);
 expect(root.textContent).not.toContain("enter your credentials");
 expect(root.textContent).toContain("ESP Web Tools");
 expect([...root.querySelectorAll("summary")].some(item => item.textContent === "Meter not listed?")).toBe(true);
 render(setupDeviceStep({ snapshot: newInstallScenario.setup, addonCount: 0, connection: "wifi" }, { setAddon: noop, setConnection: noop, rescan: noop, configure: noop, adopt: noop }), root);
 expect(root.querySelector<HTMLDetailsElement>("details.new-meter")?.open).toBe(false);
});
it("shows only the legal current transaction action", () => {
 const root = document.createElement("div");
 const status = { purpose: "install_configuration", transaction_id: "t", state: "previewed", source_sha256: "hash", changes: [], redacted_diff: "+a: b", rollback_available: true, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false } as const;
 render(buildInstallStep({ purpose: "install_configuration", status: status as never }, { apply: noop, compile: noop, install: noop, rollback: noop, back: noop, continueFlow: noop }), root);
 expect([...root.querySelectorAll("button.primary")].map(item => item.textContent?.trim())).toEqual(["Save and validate configuration"]);
});
it("states that installed calibration-only gains changed while preserving other source configuration", () => {
 const outcome = summaryOutcome({ configurationMode: "legacy_editable", legacyChoice: "calibrate_only", completedWithoutChanges: false, verifiedConfiguration: false, restart: { source_authority: "configuration" } });
 expect(outcome.configurationStatus).toContain("gains");
 expect(outcome.configurationStatus).not.toContain("untouched");
 expect(outcome.configurationStatus).toContain("preserved");
});
import { configReview } from "../src/components/config-review-step";
import { meterResponse } from "./workflow-scenarios";
it("leads with actual changes and discloses full config with energy existence distinct from visibility", () => {
 const root = document.createElement("div"); const meter = meterResponse();
 meter.configuration.default_totals.overall.kwh = false;
 render(configReview({ changes: [{ key: "meter_name", old_value: null, new_value: "Kitchen" }], redacted_diff: "+meter_name: Kitchen", state: "previewed", progress: [] } as never, meter.configuration), root);
 expect(root.querySelector("section > table")?.textContent).toContain("Kitchen");
 expect(root.querySelector("details.full-configuration")?.textContent).toContain("kWh sensor removed");
 expect(root.querySelector<HTMLDetailsElement>("details.full-configuration")?.open).toBe(false);
 expect(root.textContent).not.toContain("hidden kWh");
});
import { canLeaveTransaction } from "../src/components/build-install-step";
it("allows choosing another meter after verification but prevents editing its transaction", () => {
 expect(canLeaveTransaction(null)).toBe(true);
 expect(canLeaveTransaction({ state: "verified" } as never)).toBe(true);
 expect(canLeaveTransaction({ state: "verified" } as never, true)).toBe(false);
});
it.each(["previewed", "rolled_back"])("allows leaving %s safely", (state) => {
 expect(canLeaveTransaction({ state } as never, true)).toBe(true);
});
it("blocks an applied transaction except for explicit recovery states", () => {
 const status = { purpose: "install_configuration", state: "install_confirmation_required", evidence: [], rollback_available: false };
 expect(canLeaveTransaction(status as never, true)).toBe(false);
 expect(canLeaveTransaction({ ...status, evidence: ["source_changed"] } as never, true)).toBe(true);
 expect(canLeaveTransaction({ ...status, state: "failed", evidence: ["upload_failed"] } as never, true)).toBe(true);
 expect(canLeaveTransaction({ ...status, state: "failed", evidence: ["upload_failed"], rollback_available: true } as never, true)).toBe(false);
 expect(canLeaveTransaction({ ...status, purpose: "offset_preparation", state: "failed", rollback_available: true } as never, true)).toBe(true);
 expect(canLeaveTransaction({ ...status, purpose: "save_calibration", evidence: ["source_changed"] } as never, true)).toBe(false);
});
