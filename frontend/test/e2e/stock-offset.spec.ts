import { expect, test, type Page } from "@playwright/test";

const fixturePort = Number(process.env.CSEMH_FIXTURE_PORT ?? 4174);
async function install(page: Page) {
  await page.getByRole("button", { name: "Save and validate configuration", exact: true }).click();
  await page.getByRole("button", { name: "Build firmware", exact: true }).click();
  await page.getByRole("button", { name: "Install on meter", exact: true }).click();
}
async function runStage(page: Page) {
  await page.getByLabel("I completed the USB-only, de-energized preparation.", { exact: true }).check();
  await page.getByRole("button", { name: "Check measured readiness", exact: true }).click();
  await page.getByRole("button", { name: "Run Stage 1 calibration", exact: true }).click();
}
test("stock preparation installs before explicit run, retries only unfinished, finalizes and starts an intentional cycle", async ({ page, request }) => {
  const session = `stock-${Date.now()}`;
  const query = `fixture=stock-offset&session=${session}&fixturePort=${fixturePort}`;
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://circuitsetup.github.io/ESPWebInstaller/manifests/firmware_index.json", (route) => route.fulfill({ json: [] }));
  const frames = async () => (await (await request.post(`http://127.0.0.1:${fixturePort}/rpc?${query}`, { data: { type: "fixture_state" } })).json()).frames as Array<{ type: string; operation_id?: string }>;
  await page.goto(`/test/harness.html?${query}`);
  await page.locator('[data-action="configure-device"]').click();
  await expect(page.getByRole("heading", { name: /Optional offset calibration/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run Stage 1 calibration", exact: true })).toBeDisabled();
  await page.getByLabel("I acknowledge the private backup and reviewed zero-baseline installation.").check();
  await page.getByRole("button", { name: "Review offset preparation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Install offset preparation", exact: true })).toBeVisible();
  await page.reload();
  await page.locator('[data-action="configure-device"]').click();
  await expect(page.getByRole("heading", { name: "Install offset preparation", exact: true })).toBeVisible();
  await install(page);
  await expect(page.getByRole("button", { name: "Run Stage 1 calibration", exact: true })).toBeDisabled();
  expect((await frames()).filter((frame) => /resume_offset_calibration|calibrate_offset|cancel_session$/.test(frame.type))).toEqual([]);
  await runStage(page);
  await expect(page.getByText("One chip finished; recovery is required")).toBeVisible();
  await expect(page.getByText("0/0, 0/0, 0/0", { exact: true })).toBeVisible();
  await page.reload(); await page.locator('[data-action="configure-device"]').click();
  await expect(page.getByText("0/0, 0/0, 0/0", { exact: true })).toBeVisible();
  await page.getByLabel("I reviewed the evidence and confirm this retry.").check();
  await page.getByLabel("I acknowledge the private backup and reviewed zero-baseline installation.").check();
  await page.getByRole("button", { name: "Review unfinished-chip preparation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Install offset preparation", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Optional offset calibration/ })).toBeVisible();
  await page.getByLabel("I acknowledge the private backup and reviewed zero-baseline installation.").check();
  await page.getByRole("button", { name: "Review unfinished-chip preparation", exact: true }).click();
  await install(page);
  await runStage(page);
  await expect(page.getByText("0/0, 0/0, 0/0", { exact: true })).toHaveCount(2);
  await page.getByRole("button", { name: "Skip offset calibration", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip voltage calibration", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip current calibration", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Review captured offsets for installation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Install captured offsets", exact: true })).toBeVisible();
  await install(page);
  await page.getByRole("button", { name: "Confirm installed offset selection", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Offsets are installed and configuration-selected; register readback is not verified." })).toBeVisible({ timeout: 10_000 });
  await page.reload(); await page.locator('[data-action="configure-device"]').click();
  await page.getByLabel("I acknowledge a new offset cycle and backup retention.").check();
  await page.getByRole("button", { name: "Start new offset cycle", exact: true }).click();
  await expect(page.getByRole("button", { name: "Review offset preparation", exact: true })).toBeVisible({ timeout: 10_000 });
  const calls = await frames();
  expect(calls.filter((frame) => frame.type.endsWith("/resume_offset_calibration"))).toHaveLength(2);
  expect(calls.filter((frame) => /\/(calibrate_offset|restart_and_verify|clear_calibration_flash|complete_calibration_without_changes|cancel_session)$/.test(frame.type))).toEqual([]);
  expect(errors).toEqual([]);
});
