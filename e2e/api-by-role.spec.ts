import { test, expect } from "@playwright/test";

/** Same-origin `/api/*` so Vite dev proxy forwards to Laravel (`VITE_PROXY_TARGET`). */
async function apiGet(page: import("@playwright/test").Page, path: string): Promise<number> {
  return page.evaluate(async (p) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(p, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.status;
  }, path);
}

async function apiExportPdfStatus(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(async () => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/api/reports/export", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.status;
  });
}

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("you@organization.org").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe("API access by role E2E", () => {
  test("clinician: conversations OK; policies/audit/admin users/orgs forbidden", async ({ page }) => {
    await signIn(page, "sarah.chen@clinguard.local", "password");

    await expect(await apiGet(page, "/api/conversations")).toBe(200);
    await expect(await apiGet(page, "/api/policies")).toBe(403);
    await expect(await apiGet(page, "/api/audit-events")).toBe(403);
    await expect(await apiGet(page, "/api/admin/users")).toBe(403);
    await expect(await apiGet(page, "/api/organizations")).toBe(403);
    await expect(await apiGet(page, "/api/reports/summary")).toBe(200);
  });

  test("security_admin: policies and audit OK; admin users/orgs forbidden", async ({ page }) => {
    await signIn(page, "marcus.webb@clinguard.local", "password");

    await expect(await apiGet(page, "/api/conversations")).toBe(200);
    await expect(await apiGet(page, "/api/policies")).toBe(200);
    await expect(await apiGet(page, "/api/audit-events")).toBe(200);
    await expect(await apiGet(page, "/api/admin/users")).toBe(403);
    await expect(await apiGet(page, "/api/organizations")).toBe(403);
    await expect(await apiGet(page, "/api/reports/summary")).toBe(200);
  });

  test("system_admin: can access role-protected endpoints", async ({ page }) => {
    await signIn(page, "priya.nair@clinguard.local", "password");

    await expect(await apiGet(page, "/api/conversations")).toBe(200);
    await expect(await apiGet(page, "/api/policies")).toBe(200);
    await expect(await apiGet(page, "/api/audit-events")).toBe(200);
    await expect(await apiGet(page, "/api/admin/users")).toBe(200);
    await expect(await apiGet(page, "/api/organizations")).toBe(200);
    await expect(await apiGet(page, "/api/reports/summary")).toBe(200);
  });

  test("admin receives 200 or 503 from reports PDF export (DomPDF optional)", async ({ page }) => {
    await signIn(page, "priya.nair@clinguard.local", "password");
    const status = await apiExportPdfStatus(page);
    expect([200, 503]).toContain(status);
  });

  test("all roles can access /api/user (profile)", async ({ page }) => {
    for (const cred of [
      { email: "sarah.chen@clinguard.local", password: "password" },
      { email: "marcus.webb@clinguard.local", password: "password" },
      { email: "priya.nair@clinguard.local", password: "password" },
    ]) {
      await signIn(page, cred.email, cred.password);
      await expect(await apiGet(page, "/api/user")).toBe(200);
      await page.getByRole("button", { name: /Sign out/i }).click();
    }
  });
});
