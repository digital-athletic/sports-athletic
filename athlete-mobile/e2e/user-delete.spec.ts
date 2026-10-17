import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage, ProfilePage } from "./pages";

test.describe("User Deletion", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test.beforeEach(async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/");
    await new BasePage(page).expectLoggedIn();
  });

  test("delete user and return to the login page", async ({ page }) => {
    await new BasePage(page).navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    const deleteUserButton = page.getByRole("button", {
      name: "Delete account",
    });
    await deleteUserButton.scrollIntoViewIfNeeded();
    await deleteUserButton.click();

    await expect(page.getByText("Delete account?")).toBeVisible();
    await page.getByText("YES").first().click();

    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();
  });

  test("change training data, then delete user and return to the login page", async ({
    page,
  }) => {
    const profilePage = new ProfilePage(page);

    await profilePage.navigateToProfile();
    await profilePage.openMyTrainingData();
    await profilePage.changeSeasonPhase("Competitive", "Preparatory");
    await profilePage.proceedToTrainingDays();
    // Saving triggers a new training plan generation
    await profilePage.saveTrainingDataChanges();

    await profilePage.navigateToProfile();
    await profilePage.deleteAccount();

    await profilePage.expectLoginPage();
  });
});
