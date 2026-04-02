import { test, expect } from "@playwright/test";

const ROLES = [
  {
    name: "clinician",
    email: "clinician@test.com",
    password: "password",
    visibleTabs: ["Chat", "Conversations", "Reports"],
    hiddenTabs: ["Policies", "Audit", "Users", "Organizations"],
  },
  {
    name: "security_admin",
    email: "security@test.com",
    password: "password",
    visibleTabs: ["Chat", "Conversations", "Policies", "Audit", "Reports"],
    hiddenTabs: ["Users", "Organizations"],
  },
  {
    name: "system_admin",
    email: "admin@test.com",
    password: "password",
    visibleTabs: ["Chat", "Conversations", "Policies", "Audit", "Users", "Organizations", "Reports"],
    hiddenTabs: [],
  },
] as const;

test.describe("Role-based dashboard E2E", () => {
  for (const role of ROLES) {
    test(`${role.name} sees only allowed tabs`, async ({ page }) => {
      await page.goto("/login");
      await page.getByPlaceholder("Email").fill(role.email);
      await page.getByPlaceholder("Password").fill(role.password);
      await page.getByRole("button", { name: "Login" }).click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole("heading", { name: /ClinGuard Dashboard/i })).toBeVisible();

      for (const tabName of role.visibleTabs) {
        await expect(page.getByRole("tab", { name: tabName })).toBeVisible();
      }
      for (const tabName of role.hiddenTabs) {
        await expect(page.getByRole("tab", { name: tabName })).not.toBeVisible();
      }
    });

    test(`${role.name} can open Chat and send (smoke)`, async ({ page }) => {
      await page.goto("/login");
      await page.getByPlaceholder("Email").fill(role.email);
      await page.getByPlaceholder("Password").fill(role.password);
      await page.getByRole("button", { name: "Login" }).click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole("tab", { name: "Chat" })).toBeVisible();
      await page.getByRole("tab", { name: "Chat" }).click();
      await expect(page.getByPlaceholder(/Enter clinical note/i)).toBeVisible({ timeout: 5000 });
    });
  }

  test("clinician can open Conversations tab and see list area", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("clinician@test.com");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole("tab", { name: "Conversations" }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  });

  test("security_admin can open Policies tab and see content", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("security@test.com");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole("tab", { name: "Policies" }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  });

  test("system_admin can open Users and Organizations tabs", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("admin@test.com");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole("tab", { name: "Users" }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
    await page.getByRole("tab", { name: "Organizations" }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  });
});
