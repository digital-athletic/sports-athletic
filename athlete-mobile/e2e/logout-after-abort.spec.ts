import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";

/**
 * Regression tests for: logout after navigating away and returning to profile tab
 *
 * Bug: when opening the profile tab, navigating to a sub-screen (aborting it by
 * pressing back), and then logging out, the user is stuck on the profile page
 * instead of being redirected to onboarding.
 */

async function expectOnboardingInsteadOfProfile(page: Page) {
  await expect(page.getByRole("button", { name: "Send code" })).toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByRole("heading", { name: "Profile" })).not.toBeVisible({
    timeout: 3000,
  });
}

test.describe("Logout after profile tab abort", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test.beforeEach(async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/");
    await new BasePage(page).expectLoggedIn();
  });

  test("logout from the profile tab without sub navigation", async ({
    page,
  }) => {
    await new BasePage(page).navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    await new BasePage(page).confirmLogout();

    await expectOnboardingInsteadOfProfile(page);
  });

  test("logout after opening Notification Settings and pressing back", async ({
    page,
  }) => {
    await new BasePage(page).navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    const notifButton = page.getByText("Notification Settings", {
      exact: true,
    });
    await notifButton.scrollIntoViewIfNeeded();
    await notifButton.click();
    await expect(
      page.getByRole("heading", { name: /notification/i }),
    ).toBeVisible({ timeout: 5000 });

    await page.goBack();
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible({
      timeout: 5000,
    });

    await new BasePage(page).confirmLogout();

    await expectOnboardingInsteadOfProfile(page);
  });

  test("logout after opening My Profile and pressing back", async ({
    page,
  }) => {
    await new BasePage(page).navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    // My Profile is a shared route group: /(more)/anamnesis/userprofile
    const myProfileButton = page.getByText("My Profile", { exact: true });
    await myProfileButton.scrollIntoViewIfNeeded();
    await myProfileButton.click();
    await expect(
      page
        .getByRole("heading", { name: /personal data/i })
        .or(page.getByText(/username/i).first()),
    ).toBeVisible({ timeout: 5000 });

    await page.goBack();
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible({
      timeout: 5000,
    });

    await new BasePage(page).confirmLogout();

    await expectOnboardingInsteadOfProfile(page);
  });

  test("logout after declining the logout dialog and confirming it again", async ({
    page,
  }) => {
    await new BasePage(page).navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    const logoutButton = page.getByText("Logout", { exact: true });
    await logoutButton.scrollIntoViewIfNeeded();
    await logoutButton.click();
    // Exact match, because the dialog message also contains "logout?"
    await expect(page.getByText("Logout?", { exact: true })).toBeVisible({
      timeout: 3000,
    });
    await page.getByText("No", { exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    await new BasePage(page).confirmLogout();

    await expectOnboardingInsteadOfProfile(page);
  });

  test("logout after switching from the Training tab to the Profile tab", async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await basePage.navigateToTab("Training");
    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    await basePage.confirmLogout();

    await expectOnboardingInsteadOfProfile(page);
  });

  /**
   * Simulates the native Android abort path in userprofile.tsx: hardware back,
   * "Abort anamnesis?" dialog, YES, router.replace("/(tabs)/(home)"). On web
   * page.goto() to the home tab stands in for router.replace.
   */
  test("logout after the My Profile abort dialog redirects to the Home tab and the user returns to the Profile tab", async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    const myProfileButton = page.getByText("My Profile", { exact: true });
    await myProfileButton.scrollIntoViewIfNeeded();
    await myProfileButton.click();
    await expect(
      page
        .getByRole("heading", { name: /personal data/i })
        .or(page.getByText(/username/i).first()),
    ).toBeVisible({ timeout: 5000 });

    await page.goto("/(tabs)/(home)");
    await expect(page.getByRole("heading", { name: /Hello/i })).toBeVisible({
      timeout: 5000,
    });

    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible({
      timeout: 5000,
    });

    await basePage.confirmLogout();

    await expectOnboardingInsteadOfProfile(page);
  });
});
