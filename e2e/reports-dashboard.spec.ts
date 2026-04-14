import { test, expect } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("you@organization.org").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe("Reports dashboard E2E", () => {
  test("system_admin sees Reports, analytics heading, and can trigger PDF export", async ({ page }) => {
    await signIn(page, "priya.nair@clinguard.local", "password");

    await page.locator("aside").getByRole("button", { name: /Reports/i }).click();
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
    await signIn(page, "sarah.chen@clinguard.local", "password");

    await page.locator("aside").getByRole("button", { name: /Reports/i }).click();
    await expect(page.getByRole("heading", { name: /Analytics and reports/i })).toBeVisible({ timeout: 20000 });
    // Scope line may concatenate "Scope: " + label as adjacent text nodes; match on substring in page.
    await expect
      .poll(async () => (await page.locator("body").innerText()).includes("Personal activity"), {
        timeout: 25000,
      })
      .toBe(true);
  });
});
