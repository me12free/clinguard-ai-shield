import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/** Bind IPv4 so Playwright and Vite agree (vite.config uses `host: "::"` by default). */
const frontendUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173";
/** Laravel URL used by Vite’s dev proxy during E2E (`VITE_PROXY_TARGET`). */
const laravelUrl = process.env.PLAYWRIGHT_LARAVEL_URL ?? "http://127.0.0.1:8000";
const laravelRoot = path.join(process.cwd(), "laravel-backend");

function webServers() {
  if (process.env.PLAYWRIGHT_SKIP_WEB_SERVER) {
    return undefined;
  }

  const viteCommand = process.env.PLAYWRIGHT_SKIP_LARAVEL
    ? "npx vite --host 127.0.0.1 --port 5173 --strictPort"
    : `VITE_PROXY_TARGET=${laravelUrl} npx vite --host 127.0.0.1 --port 5173 --strictPort`;

  const servers: Array<{
    command: string;
    url: string;
    reuseExistingServer: boolean;
    timeout: number;
    cwd?: string;
  }> = [];

  if (!process.env.PLAYWRIGHT_SKIP_LARAVEL) {
    servers.push({
      command: "php artisan serve --no-reload --host=127.0.0.1 --port=8000",
      cwd: laravelRoot,
      url: laravelUrl,
      reuseExistingServer: true,
      timeout: 180000,
    });
  }

  servers.push({
    command: viteCommand,
    url: frontendUrl,
    reuseExistingServer: true,
    timeout: 120000,
  });

  return servers.length === 1 ? servers[0] : servers;
}

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
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
  /**
   * Starts Laravel (unless PLAYWRIGHT_SKIP_LARAVEL) then Vite with matching proxy.
   * Requires MySQL (or your laravel-backend DB) to be up and migrated/seeded for login tests.
   */
  webServer: webServers(),
});
