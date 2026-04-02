import { defineConfig, devices } from "@playwright/test";

const frontendUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  timeout: 60000,
  use: {
    baseURL: frontendUrl,
    trace: "on-first-retry",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "npx vite --port 5173",
        url: frontendUrl,
        reuseExistingServer: false,
        timeout: 120000,
      },
});
