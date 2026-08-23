import { expect, test } from "@playwright/test";

const MANIFEST_URL = "https://circuitsetup.github.io/ESPWebInstaller/manifests/manifest_6chan_energy_meter_main_board-2026.8.0.json";

test("inline ESP Web Tools registers in the helper panel without opening a page", async ({ page }) => {
  await page.goto("/test/harness.html");
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();

  const registered = await page.evaluate(async () => Promise.race([
    customElements.whenDefined("esp-web-install-button").then(() => true),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 500)),
  ]));
  expect(registered).toBe(true);

  const pageOpened = page.context().waitForEvent("page", { timeout: 250 }).then(() => true).catch(() => false);
  await page.locator("circuitsetup-energy-meter-helper-panel").evaluate((panel, manifest) => {
    const button = document.createElement("esp-web-install-button") as HTMLElement & { manifest: string };
    button.manifest = manifest;
    panel.shadowRoot!.querySelector(".setup-step")!.append(button);
  }, MANIFEST_URL);

  const installer = page.locator("esp-web-install-button").last();
  await expect(installer).toBeVisible();
  expect(await installer.evaluate((element) => (element as HTMLElement & { manifest: string }).manifest)).toBe(MANIFEST_URL);
  expect(await pageOpened).toBe(false);
});
