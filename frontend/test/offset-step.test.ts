import { render } from "lit";
import { expect, it, vi } from "vitest";
import { offsetPersistence, offsetStep } from "../src/components/offset-step";
import type { OffsetFinalizationStatus } from "../src/types";
const receipt = { purpose: "offset_finalization", operation_id: "op", installed: true, cancelled: false, configuration_selected: false, action_ready: false, results: [["meter_main1", 1, [[0, 0], [0, 0], [0, 0]], false]] } as unknown as OffsetFinalizationStatus;
const noop = () => undefined;
const actions = { backToOffsets: noop, restart: noop, review: noop, reconcile: noop };
it("reconciles installed unconfirmed receipts without requiring another install", () => {
 const root = document.createElement("div"); const reconcile = vi.fn();
 render(offsetPersistence({ offsetFinalization: receipt, restartResult: null, hasPendingGains: false, busy: false, restartBusy: false }, { ...actions, reconcile }), root);
 const button = root.querySelector<HTMLButtonElement>("button.primary")!;
 expect(button.textContent).toBe("Confirm installed offset configuration"); button.click(); expect(reconcile).toHaveBeenCalledOnce();
 expect(root.textContent).not.toContain("Restart and verify gains only");
 expect(root.querySelector("details table")?.getAttribute("aria-label")).toBe("Retained offset results");
 expect(root.textContent).toContain("not register readback");
});
it("gates persistence on pending gains and reviews absent or cancelled receipts", () => {
 const root = document.createElement("div");
 render(offsetPersistence({ offsetFinalization: { ...receipt, cancelled: true }, restartResult: null, hasPendingGains: true, busy: false, restartBusy: false }, actions), root);
 expect(root.querySelector("button.primary")?.textContent).toBe("Restart and verify gains only");
 expect(root.textContent).not.toContain("Confirm installed offset configuration");
 render(offsetPersistence({ offsetFinalization: { ...receipt, cancelled: true }, restartResult: null, hasPendingGains: false, busy: false, restartBusy: false }, actions), root);
 expect(root.querySelector("button.primary")?.textContent).toBe("Review captured offsets for installation");
});
it("keeps physical readiness instructions through the typed offset contract", () => {
 const root = document.createElement("div");
 render(offsetStep({ topology: null, session: null, board: 0, stage: 1, acknowledged: false, retryConfirmed: false, readiness: null, result: null, busy: false }, { selectBoard: noop, selectStage: noop, setAcknowledged: noop, setRetryConfirmed: noop, check: noop, calibrate: noop, reconnect: noop, skip: noop, back: noop, continueOffset: noop }), root);
 expect(root.textContent).toContain("Skip keeps offset values saved in flash");
});
it("describes historical legacy preparation as firmware installation rather than native readiness", () => {
 const root = document.createElement("div");
 render(offsetStep({ topology: null, session: { offset_capability: { status: "available" }, offset_boards: [] } as never, board: 0, stage: 1, acknowledged: false, retryConfirmed: false, readiness: null, result: null, busy: false,
 stock: { preparation: { mode: "legacy", stage: 1, targets: ["meter_main1", "meter_main2"], installed: true, action_ready: false, attempted: [] } as never, backupAcknowledged: false, setBackup: noop, prepare: noop } }, { selectBoard: noop, selectStage: noop, setAcknowledged: noop, setRetryConfirmed: noop, check: noop, calibrate: noop, reconnect: noop, skip: noop, back: noop, continueOffset: noop }), root);
 expect(root.textContent).toContain("Temporarily installs zero offsets");
 expect(root.textContent).not.toContain("installs no firmware or zero-offset YAML");
});
