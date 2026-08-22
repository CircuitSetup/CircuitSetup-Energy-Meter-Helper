import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "test/e2e",
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: process.env.CI ? undefined : "chrome",
  },
  webServer: {
    command: "npx vite --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/test/harness.html",
    reuseExistingServer: !process.env.CI,
  },
});
