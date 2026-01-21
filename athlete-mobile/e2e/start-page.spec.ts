import { expect, test } from "@playwright/test";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";

test("visits start page", async ({ page }) => {
  await mockSupabaseAuth(page);

  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});

test("successful login", async ({ page }) => {
  await mockSupabaseAuth(page);

  const basePage = new BasePage(page);
  await basePage.login("test@example.com", "password123");
  await basePage.expectTrainingPlanVisible();
});
