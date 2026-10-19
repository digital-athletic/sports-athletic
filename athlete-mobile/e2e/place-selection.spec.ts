import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";

test.describe("Place Selection: training location list", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete sees the training locations as a list", async ({ page }) => {
    await mockSupabaseAuth(page);

    const basePage = new BasePage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();

    await page.goto("/equipment");
    await expect(
      page.getByRole("heading", { name: "Equipment", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^At home, \d+ pieces$/ }),
    ).toBeVisible();

    await page.goto("/training/muscle-soreness?type=MOB");
    await expect(
      page.getByRole("heading", { name: "Place & Equipment" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^At home, \d+ pieces$/ }),
    ).toBeVisible();
  });
});
