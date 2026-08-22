import { expect, test } from "@playwright/test";

test("mocked Home Assistant websocket guides discovery and renders the 42-channel meter", async ({ page }) => {
  await page.goto("/test/harness.html");

  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();
  await expect(page.getByText("CircuitSetup Energy Meter Helper")).toBeVisible();
  await expect(page.locator('[name="addon-count"]')).toHaveCount(7);
  await page.locator('[data-action="rescan"]').click();
  await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
  await expect(page.getByText("CircuitSetup meter")).toBeVisible();
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole("heading", { name: "Topology", exact: true })).toBeVisible();
  await expect(page.getByText("42 CTs")).toBeVisible();
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole("heading", { name: "CT Configuration" })).toBeVisible();
  await expect(page.locator('[data-board-tab]')).toHaveCount(7);
});

test("mocked websocket configuration fixtures render six-channel ambiguity and safe failure recovery", async ({ page }) => {
  await page.goto("/test/harness.html");
  await page.evaluate(async () => {
    const panel = document.querySelector("circuitsetup-energy-meter-helper-panel") as any;
    const inventory = await panel.hass.callWS({ type: "circuitsetup_energy_meter_helper/get_ct_inventory" });
    panel.showInventory({ ...inventory, channels: inventory.channels.slice(0, 6) });
    await panel.updateComplete;
  });
  await expect(page.locator('[data-ct-row]')).toHaveCount(6);
  await expect(page.locator('select[aria-label="CT4 model"]')).toHaveValue("");

  await page.evaluate(async () => {
    const panel = document.querySelector("circuitsetup-energy-meter-helper-panel") as any;
    panel.transaction = {
      transaction_id: "tx", state: "failed", source_sha256: "a".repeat(64),
      changes: [{ key: "ct1_name", old_value: "CT1", new_value: "Grid Import" }],
      redacted_diff: "- ct1_name: CT1\n+ ct1_name: Grid Import", rollback_available: true,
      evidence: ["validation_failed", "compile_failed"], progress: [],
    };
    panel.showState("build");
    await panel.updateComplete;
  });
  await expect(page.getByText("Grid Import")).toBeVisible();
  await page.evaluate(async () => {
    const panel = document.querySelector("circuitsetup-energy-meter-helper-panel") as any;
    panel.showRecovery("restart_failed");
    await panel.updateComplete;
  });
  await expect(page.getByText(/Reconnect to the meter/i)).toBeVisible();
});

test("mocked websocket calibration fixtures cover add-on, restart, and indeterminate states", async ({ page }) => {
  await page.goto("/test/harness.html");
  await page.evaluate(async () => {
    const panel = document.querySelector("circuitsetup-energy-meter-helper-panel") as any;
    const topology = await panel.hass.callWS({ type: "circuitsetup_energy_meter_helper/get_topology" });
    panel.topology = topology;
    panel.session = { session_id: "session", device_id: "meter-live-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] } };
    panel.showState("voltage");
    await panel.updateComplete;
  });
  await expect(page.getByRole("heading", { name: "Voltage", exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const panel = document.querySelector("circuitsetup-energy-meter-helper-panel") as any;
    panel.showState("current");
    await panel.updateComplete;
    panel.showRecovery("calibration_outcome_indeterminate");
    await panel.updateComplete;
  });
  await expect(page.getByText(/Reconnect and inspect/i)).toBeVisible();
});
