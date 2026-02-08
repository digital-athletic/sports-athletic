import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { AnamnesisPage, BasePage, ProfilePage } from "./pages";

test.describe("User Deletion", () => {
  test.use({ profile: createCompletedProfile() });

  test("delete user and return to login page", async ({ page }) => {
    await mockSupabaseAuth(page);

    // Log browser console for debugging
    page.on("console", (msg) => console.log("BROWSER:", msg.text()));

    const basePage = new BasePage(page);
    await basePage.login("test@example.com");
    await basePage.expectLoggedIn();

    // Navigate to Profile tab
    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    // Scroll to and click Delete User button
    const deleteUserButton = page.getByText("Delete User");
    await deleteUserButton.scrollIntoViewIfNeeded();
    await deleteUserButton.click();

    // Confirmation dialog: "Delete User?" - click YES
    await expect(page.getByText("Delete User?")).toBeVisible();
    await page.getByText("YES").first().click();

    // Should land on login/onboarding page
    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();
  });
});

test.describe("User Deletion after Training Data Change", () => {
  // This test starts from scratch (no profile) and goes through anamnesis
  test("complete anamnesis then change training data then delete user should return to login page", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);

    const anamnesisPage = new AnamnesisPage(page);
    const profilePage = new ProfilePage(page);

    // Login and start anamnesis
    await anamnesisPage.login("test@example.com");

    // Complete welcome screen
    const letsGoButton = page.getByRole("button", { name: "Let's go" });
    await expect(letsGoButton).toBeVisible({ timeout: 10000 });
    await letsGoButton.click();

    // Select sport and complete anamnesis
    await anamnesisPage.selectSport("Handball");
    await anamnesisPage.completeAnamnesis({
      name: "Test User",
      heightCm: 180,
      weightKg: 80,
      position: "Fieldplayer",
      seasonPhase: "Competitive",
      trainingDays: ["Tu", "Fr"],
    });

    // Wait for generation to complete
    const generatingText = page.getByText(/generating.*training.*plan/i);
    if (await generatingText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(generatingText).not.toBeVisible({ timeout: 60000 });
    }

    // Wait for home screen
    await expect(page.getByRole("heading", { name: /Hello/i })).toBeVisible({
      timeout: 15000,
    });

    // Navigate to training data and modify it
    await profilePage.navigateToProfile();
    await profilePage.openMyTrainingData();
    await profilePage.changeSeasonPhase("Competitive", "Preparatory");
    await profilePage.proceedToTrainingDays();

    // Save the changes - this triggers a new training plan generation
    await profilePage.saveTrainingDataChanges();

    // Now navigate to profile and delete account
    await profilePage.navigateToProfile();
    await profilePage.deleteAccount();

    await profilePage.expectLoginPage();
  });
});
