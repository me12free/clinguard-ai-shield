import { test, expect } from "@playwright/test";

/** Seeded users — `laravel-backend/database/seeders/DatabaseSeeder.php` */
const ROLES = [
  {
    name: "clinician",
    email: "sarah.chen@clinguard.local",
    password: "password",
    visibleNav: [/Clinical AI/i, /PHI scan/i, /Reports/i],
    hiddenNav: [/Overview/i, /Policies/i, /Audit log/i, /Users/i, /Organizations/i],
  },
  {
    name: "security_admin",
    email: "marcus.webb@clinguard.local",
    password: "password",
    visibleNav: [/Overview/i, /Clinical AI/i, /PHI scan/i, /Policies/i, /Audit log/i, /Reports/i],
    hiddenNav: [/Users/i, /Organizations/i],
  },
  {
    name: "system_admin",
    email: "priya.nair@clinguard.local",
    password: "password",
    visibleNav: [
      /Overview/i,
      /Clinical AI/i,
      /PHI scan/i,
      /Policies/i,
      /Audit log/i,
      /Reports/i,
      /Organizations/i,
      /Users/i,
    ],
    hiddenNav: [] as RegExp[],
  },
] as const;

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("you@organization.org").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe("Role-based dashboard E2E", () => {
  for (const role of ROLES) {
    test(`${role.name} sees only allowed sidebar entries`, async ({ page }) => {
      await signIn(page, role.email, role.password);
      const sidebar = page.locator("aside").first();
      for (const pattern of role.visibleNav) {
        await expect(sidebar.getByRole("button", { name: pattern })).toBeVisible();
      }
      for (const pattern of role.hiddenNav) {
        await expect(sidebar.getByRole("button", { name: pattern })).toHaveCount(0);
      }
    });

    test(`${role.name} can open Clinical AI and see compose`, async ({ page }) => {
      await signIn(page, role.email, role.password);
      await page.locator("aside").getByRole("button", { name: /Clinical AI/i }).click();
      await expect(page.getByRole("heading", { level: 1, name: /Clinical AI/i })).toBeVisible();
      await expect(page.getByPlaceholder(/Clinical question or note/i)).toBeVisible({ timeout: 10000 });
    });
  }

  test("clinician can open History inside Clinical AI", async ({ page }) => {
    await signIn(page, "sarah.chen@clinguard.local", "password");
    await page.locator("aside").getByRole("button", { name: /Clinical AI/i }).click();
    await page.getByRole("tab", { name: "History" }).click();
    await expect(page.getByText(/Saved conversations/i)).toBeVisible({ timeout: 10000 });
  });

  test("security_admin can open Policies from sidebar", async ({ page }) => {
    await signIn(page, "marcus.webb@clinguard.local", "password");
    await page.locator("aside").getByRole("button", { name: /Policies/i }).click();
    await expect(page.getByRole("heading", { level: 1, name: /Policies/i })).toBeVisible();
    await expect(page.getByText(/PHI policies/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("system_admin can open Users and Organizations", async ({ page }) => {
    await signIn(page, "priya.nair@clinguard.local", "password");
    await page.locator("aside").getByRole("button", { name: /Users/i }).click();
    await expect(page.getByRole("heading", { level: 1, name: /^Users$/i })).toBeVisible();
    await page.locator("aside").getByRole("button", { name: /Organizations/i }).click();
    await expect(page.getByRole("heading", { level: 1, name: /Organizations/i })).toBeVisible();
  });
});
