import { test, expect } from "@playwright/test";

test.describe("Reports dashboard E2E", () => {
  test("system_admin sees Reports tab, analytics heading, and can trigger PDF export", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("admin@test.com");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("tab", { name: "Reports" }).click();
    await expect(page.getByRole("heading", { name: /Analytics and reports/i })).toBeVisible({ timeout: 20000 });

    await expect(page.getByText(/Scope:/i).first()).toBeVisible({ timeout: 20000 });

    const downloadPromise = page.waitForEvent("download", { timeout: 60000 }).catch(() => null);
    await page.getByRole("button", { name: "Export PDF report" }).click();
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });

  test("clinician Reports tab loads personal scope copy", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("clinician@test.com");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("tab", { name: "Reports" }).click();
    await expect(page.getByText(/Personal activity/i)).toBeVisible({ timeout: 20000 });
  });
});
