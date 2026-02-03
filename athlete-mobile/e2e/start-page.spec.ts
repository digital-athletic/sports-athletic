import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";

test.describe("Start Page", () => {
  test.use({ profile: createCompletedProfile() });

  test("displays start page", async ({ page }) => {
    await mockSupabaseAuth(page);

    const basePage = new BasePage(page);
    await basePage.login("test@example.com", "password123");
    await basePage.expectLoggedIn();

    await expect(page).toHaveURL("/");
    await basePage.expectTrainingPlanVisible();
  });
});
