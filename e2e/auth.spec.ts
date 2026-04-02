import { test, expect } from "@playwright/test";

test.describe("Auth E2E", () => {
  test("login page shows Login form", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60000 });
    await expect(page.getByPlaceholder("Email")).toBeVisible({ timeout: 15000 });
  });

  test("unauthenticated user is redirected to login from dashboard", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("user can log in and is redirected to dashboard", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Email").fill("clinician@test.com");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText(/ClinGuard Dashboard/i)).toBeVisible({ timeout: 10000 });
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("clinician@test.com");
    await page.getByPlaceholder("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText(/failed|invalid|error/i)).toBeVisible({ timeout: 5000 });
  });

  test("user can log out", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Email").fill("clinician@test.com");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await page.getByRole("button", { name: /Log out|Logout/i }).click();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});
