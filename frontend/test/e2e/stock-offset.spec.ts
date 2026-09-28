import { expect, test, type Page } from "@playwright/test";

const fixturePort = Number(process.env.CSEMH_FIXTURE_PORT ?? 4174);

async function runStage(page: Page, stage: 1 | 2) {
  const acknowledgement = page.getByLabel(stage === 1
    ? "I completed the USB-only, de-energized preparation."
    : "I powered down for rewiring and safely enclosed and energized only the voltage reference.", { exact: true });
  await acknowledgement.check();
  await expect(acknowledgement).toBeChecked();
  const check = page.getByRole("button", { name: "Check measured readiness", exact: true });
  await expect(check).toBeEnabled();
  await check.click();
  await expect(page.getByText("Measured readiness passed.", { exact: true })).toBeVisible();
  const run = page.getByRole("button", { name: `Run Stage ${stage} calibration`, exact: true });
  await expect(run).toBeEnabled();
  await run.click();
}

test("native stock offset review stays on Offset and runs both first-use stages", async ({ page, request }) => {
  const session = `stock-${Date.now()}`;
  const query = `fixture=stock-offset&session=${session}&fixturePort=${fixturePort}`;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://circuitsetup.github.io/ESPWebInstaller/manifests/firmware_index.json", (route) => route.fulfill({ json: [] }));
  const state = async () => (await (await request.post(`http://127.0.0.1:${fixturePort}/rpc?${query}`, {
    data: { type: "fixture_state" },
  })).json()) as { frames: Array<{ type: string }>; builder_calls: string[]; stock_button_names: string[] };

  await page.goto(`/test/harness.html?${query}`);
  await page.locator('[data-action="configure-device"]').click();
  await expect(page.getByRole("heading", { name: /Optional offset calibration/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run Stage 1 calibration", exact: true })).toBeDisabled();
  await page.getByLabel("I understand that this step creates a private backup and uses the meter's native offset controls; no firmware is installed.", { exact: true }).check();
  await page.getByRole("button", { name: "Review native offset readiness", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Optional offset calibration/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Install offset preparation", exact: true })).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Native offset controls are ready." })).toBeVisible();

  await runStage(page, 1);
  await expect(page.getByText("0/0, 0/0, 0/0", { exact: true })).toHaveCount(2);
  await page.locator('[data-offset-stage="2"]').click();
  await expect(page.getByRole("heading", { name: /Optional offset calibration · Stage 2/ })).toBeVisible();
  await page.getByRole("button", { name: "Review native offset readiness", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Install offset preparation", exact: true })).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Native offset controls are ready." })).toBeVisible();
  await runStage(page, 2);
  await expect(page.getByText("0/0, 0/0, 0/0", { exact: true })).toHaveCount(2);

  const fixture = await state();
  expect(fixture.builder_calls.filter((call) => ["write", "compile", "upload"].includes(call))).toEqual([]);
  expect(fixture.stock_button_names).toEqual([
    "main_1.run_offset", "main_2.run_offset",
    "main_1.run_power_offset", "main_2.run_power_offset",
  ]);
  expect(fixture.frames.some((frame) => /apply_ct_config|compile_ct_config|install_ct_config|clear_calibration_flash|restart_and_verify/.test(frame.type))).toBe(false);
  expect(errors).toEqual([]);
});

test("native stock offset recovery survives reload, back, retry, finalization, and a new cycle", async ({ page, request }) => {
  const session = `stock-partial-${Date.now()}`;
  const query = `fixture=stock-offset&session=${session}&fixturePort=${fixturePort}`;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://circuitsetup.github.io/ESPWebInstaller/manifests/firmware_index.json", (route) => route.fulfill({ json: [] }));
  const state = async () => (await (await request.post(`http://127.0.0.1:${fixturePort}/rpc?${query}`, {
    data: { type: "fixture_state" },
  })).json()) as { frames: Array<{ type: string }>; builder_calls: string[]; stock_button_names: string[] };
  const openOffset = async () => {
    await page.locator('[data-action="configure-device"]').click();
    await expect(page.getByRole("heading", { name: /Optional offset calibration/ })).toBeVisible();
  };
  const nativeBackup = page.getByLabel("I understand that this step creates a private backup and uses the meter's native offset controls; no firmware is installed.", { exact: true });

  await page.goto(`/test/harness.html?${query}`);
  await openOffset();
  await nativeBackup.check();
  await page.getByRole("button", { name: "Review native offset readiness", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Native offset controls are ready." })).toBeVisible();

  const outcome = await request.post(`http://127.0.0.1:${fixturePort}/rpc?${query}`, {
    data: { type: "fixture_outcome", fail_second: true },
  });
  expect(outcome.ok()).toBeTruthy();
  await runStage(page, 1);
  await expect(page.getByText("One chip finished; recovery is required")).toBeVisible();
  await expect(page.getByText("0/0, 0/0, 0/0", { exact: true })).toBeVisible();

  await page.reload();
  await openOffset();
  await expect(page.getByRole("button", { name: "Run Stage 1 calibration", exact: true })).toBeDisabled();
  await page.getByLabel("I reviewed the evidence and confirm this retry.", { exact: true }).check();
  await nativeBackup.check();
  await page.getByRole("button", { name: "Review unfinished-chip readiness", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Optional offset calibration/ })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Native offset controls are ready." })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Safety acknowledgement", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Optional offset calibration/ })).toBeVisible();
  await runStage(page, 1);
  await expect(page.getByText("0/0, 0/0, 0/0", { exact: true })).toHaveCount(2);

  await page.locator('[data-offset-stage="2"]').click();
  await expect(page.getByRole("heading", { name: /Optional offset calibration · Stage 2/ })).toBeVisible();
  await nativeBackup.check();
  await page.getByRole("button", { name: "Review native offset readiness", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Native offset controls are ready." })).toBeVisible();
  await runStage(page, 2);
  await expect(page.getByText("0/0, 0/0, 0/0", { exact: true })).toHaveCount(2);

  await page.getByRole("button", { name: "Continue to Voltage", exact: true }).click();
  await page.getByRole("button", { name: "Skip voltage calibration", exact: true }).click();
  await page.getByRole("button", { name: "Continue to Current", exact: true }).click();
  await page.getByRole("button", { name: "Skip current calibration", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Review captured offsets for installation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Install captured offsets", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save and validate configuration", exact: true }).click();
  await page.getByRole("button", { name: "Build firmware", exact: true }).click();
  await page.getByRole("button", { name: "Install on meter", exact: true }).click();
  await page.getByRole("button", { name: "Confirm installed offset selection", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Setup complete", exact: true })).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await page.locator('[data-action="configure-device"]').click();
  await expect(page.getByRole("heading", { name: "Review complete", exact: true })).toBeVisible();
  await page.getByLabel("I acknowledge a new offset cycle and backup retention.", { exact: true }).check();
  await page.getByRole("button", { name: "Start new offset cycle", exact: true }).click();
  await expect(page.getByRole("button", { name: "Review native offset readiness", exact: true })).toBeVisible({ timeout: 10_000 });

  const fixture = await state();
  expect(fixture.stock_button_names).toEqual([
    "main_1.run_offset", "main_2.run_offset", "main_2.restore_offset", "main_2.run_offset",
    "main_1.run_power_offset", "main_2.run_power_offset",
  ]);
  expect(fixture.frames.filter((frame) => frame.type.endsWith("/resume_offset_calibration"))).toHaveLength(3);
  expect(fixture.frames.filter((frame) => /\/(calibrate_offset|restart_and_verify|clear_calibration_flash|complete_calibration_without_changes|cancel_session)$/.test(frame.type))).toEqual([]);
  expect(fixture.builder_calls.filter((call) => ["write", "compile", "upload"].includes(call))).toEqual(["write", "compile", "upload"]);
  expect(errors).toEqual([]);
});
