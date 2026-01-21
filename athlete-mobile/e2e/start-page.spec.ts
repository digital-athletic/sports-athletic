import { expect, test } from "@playwright/test";
import { mockSupabaseAuth } from "./mocks/supabase";

test("visits start page", async ({ page }) => {
  await mockSupabaseAuth(page);

  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});

test("successful login", async ({ page }) => {
  await mockSupabaseAuth(page);

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();

  await page.getByPlaceholder("E-Mail").fill("test@example.com");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByText("Your Training Plan")).toBeVisible();
});
