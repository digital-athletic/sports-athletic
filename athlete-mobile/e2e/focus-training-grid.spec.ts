import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";

test.describe("Focus trainings: photo grid", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete starts the mobility training from the grid", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();

    await page.getByRole("button", { name: "Focus & Prevention" }).click();
    await page.getByRole("button", { name: /^Focus-Trainings/ }).click();

    await expect(page.getByText("Focus training · 10-20 min")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "What do you want to train?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Cool Down, Recovery and stretching",
      }),
    ).toBeVisible();
    await page.screenshot({
      path: "playwright/screenshots/focus-training-grid.png",
      fullPage: true,
    });

    await page
      .getByRole("button", { name: "Mobility, Improve your range of motion" })
      .click();
    // Mobility asks no soreness, so its muscle soreness step opens on the place.
    await expect(page).toHaveURL(/\/training\/muscle-soreness\?type=MOB/);
    await expect(
      page.getByRole("heading", { name: "Where do you train today?" }),
    ).toBeVisible();
  });
});
