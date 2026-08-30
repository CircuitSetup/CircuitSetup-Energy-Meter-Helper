import { expect, test } from "@playwright/test";

const MANIFEST_URL = "https://circuitsetup.github.io/ESPWebInstaller/manifests/manifest_6chan_energy_meter_main_board-2026.8.0.json";

test("inline ESP Web Tools registers in the helper panel without opening a page", async ({ page }) => {
  await page.goto("/test/harness.html");
  await expect(page.getByRole("heading", { name: "Setup Device" })).toBeVisible();

  await expect.poll(() => page.evaluate(
    () => Boolean(customElements.get("esp-web-install-button")),
  )).toBe(true);

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

test("ESP Web Tools coexists with Home Assistant Material elements", async ({ page }) => {
  await page.addInitScript(() => {
    for (const tag of [
      "md-divider",
      "md-elevation",
      "md-filled-field",
      "md-focus-ring",
      "md-item",
      "md-menu",
      "md-ripple",
    ]) customElements.define(tag, class extends HTMLElement {});
    Object.defineProperty(navigator, "serial", {
      configurable: true,
      value: {
        requestPort: async () => {
          throw new DOMException("No port selected", "NotFoundError");
        },
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/test/harness.html");
  await page.getByRole("button", { name: "Install firmware" }).click();

  await expect.poll(() => page.evaluate(() => Boolean(customElements.get("ew-dialog")))).toBe(true);
  expect(await page.evaluate(() => [
    "md-divider",
    "md-elevation",
    "md-filled-field",
    "md-focus-ring",
    "md-item",
    "md-menu",
    "md-ripple",
  ].every((tag) => Boolean(customElements.get(tag))))).toBe(true);
  expect(errors).not.toContain(expect.stringContaining("already been used with this registry"));
});
