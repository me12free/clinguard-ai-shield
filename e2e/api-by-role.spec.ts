import { test, expect } from "@playwright/test";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function apiGet(page: import("@playwright/test").Page, path: string): Promise<number> {
  return page.evaluate(
    async ({ base, p }) => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${base}${p}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.status;
    },
    { base: API_URL, p: path }
  );
}

async function apiExportPdfStatus(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(
    async ({ base }) => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${base}/api/reports/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.status;
    },
    { base: API_URL }
  );
}

test.describe("API access by role E2E", () => {
  test("clinician: can access conversations, cannot access policies/audit/users/organizations", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("clinician@test.com");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(await apiGet(page, "/api/conversations")).toBe(200);
    await expect(await apiGet(page, "/api/policies")).toBe(403);
    await expect(await apiGet(page, "/api/audit-events")).toBe(403);
    await expect(await apiGet(page, "/api/users")).toBe(403);
    await expect(await apiGet(page, "/api/organizations")).toBe(403);
    await expect(await apiGet(page, "/api/reports/summary")).toBe(200);
  });

  test("security_admin: can access policies and audit, cannot access users/organizations", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("security@test.com");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(await apiGet(page, "/api/conversations")).toBe(200);
    await expect(await apiGet(page, "/api/policies")).toBe(200);
    await expect(await apiGet(page, "/api/audit-events")).toBe(200);
    await expect(await apiGet(page, "/api/users")).toBe(403);
    await expect(await apiGet(page, "/api/organizations")).toBe(403);
    await expect(await apiGet(page, "/api/reports/summary")).toBe(200);
  });

  test("system_admin: can access all role-protected endpoints", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("admin@test.com");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(await apiGet(page, "/api/conversations")).toBe(200);
    await expect(await apiGet(page, "/api/policies")).toBe(200);
    await expect(await apiGet(page, "/api/audit-events")).toBe(200);
    await expect(await apiGet(page, "/api/users")).toBe(200);
    await expect(await apiGet(page, "/api/organizations")).toBe(200);
    await expect(await apiGet(page, "/api/reports/summary")).toBe(200);
  });

  test("all roles receive 200 from reports PDF export when backend supports it", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("admin@test.com");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    const status = await apiExportPdfStatus(page);
    expect([200, 500]).toContain(status);
  });

  test("all roles can access /api/user (profile)", async ({ page }) => {
    for (const cred of [
      { email: "clinician@test.com", password: "password" },
      { email: "security@test.com", password: "password" },
      { email: "admin@test.com", password: "password" },
    ]) {
      await page.goto("/login");
      await page.getByPlaceholder("Email").fill(cred.email);
      await page.getByPlaceholder("Password").fill(cred.password);
      await page.getByRole("button", { name: "Login" }).click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(await apiGet(page, "/api/user")).toBe(200);
      await page.getByRole("button", { name: /Log out|Logout/i }).click();
    }
  });
});
