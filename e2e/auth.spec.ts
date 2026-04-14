import { test, expect } from "@playwright/test";

/** Seeded in `laravel-backend/database/seeders/DatabaseSeeder.php` */
const CLINICIAN = { email: "sarah.chen@clinguard.local", password: "password" };

test.describe("Auth E2E", () => {
  test("login page shows sign-in form", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60000 });
    await expect(page.getByPlaceholder("you@organization.org")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("unauthenticated user is redirected to login from dashboard", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("user can log in and lands on dashboard", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("you@organization.org").fill(CLINICIAN.email);
    await page.getByLabel("Password", { exact: true }).fill(CLINICIAN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1, name: /Clinical AI/i })).toBeVisible({ timeout: 10000 });
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@organization.org").fill(CLINICIAN.email);
    await page.getByLabel("Password", { exact: true }).fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/Could not sign in/i)).toBeVisible({ timeout: 5000 });
  });

  test("user can sign out", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("you@organization.org").fill(CLINICIAN.email);
    await page.getByLabel("Password", { exact: true }).fill(CLINICIAN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await page.getByRole("button", { name: /Sign out/i }).click();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});
