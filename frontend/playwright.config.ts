import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

const frontend = __dirname;
const root = resolve(frontend, "..");
const port = Number(process.env.CSEMH_E2E_PORT ?? 4173);
const fixturePort = Number(process.env.CSEMH_FIXTURE_PORT ?? 4174);
const python = process.env.CSEMH_TEST_PYTHON;

export default defineConfig({
  testDir: "test/e2e",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel: process.env.CI ? undefined : "chrome",
  },
  webServer: [{
    command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    cwd: frontend,
    url: `http://127.0.0.1:${port}/test/harness.html`,
    reuseExistingServer: false,
  }, {
    command: `${python ? `"${python}"` : "uv run --no-sync python"} -m tests.totals_browser_fixture --port ${fixturePort} --frontend-port ${port}`,
    cwd: root,
    url: `http://127.0.0.1:${fixturePort}/health`,
    reuseExistingServer: false,
  }],
});
