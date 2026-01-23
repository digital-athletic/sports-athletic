import { expect, test } from "@playwright/test";
import { PROFILE_MALE_COMPETITVE } from "./constants";
import { BasePage } from "./pages";

test.describe("Start Page", () => {
  test.use({ storageState: PROFILE_MALE_COMPETITVE });

  test("displays start page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");

    const basePage = new BasePage(page);
    await basePage.expectTrainingPlanVisible();
  });
});
