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

test.describe("Logout after profile-tab abort", () => {
  test.use({ profile: createCompletedProfile() });

  test("baseline: logout from profile tab without any sub-navigation works", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await basePage.login("test@example.com");
    await basePage.expectLoggedIn();

    // Direct logout from profile tab (no abort step)
    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    const logoutButton = page.getByText("Logout", { exact: true });
    await logoutButton.scrollIntoViewIfNeeded();
    await logoutButton.click();
    await page.getByText("YES").first().click();

    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("heading", { name: "Profile" }),
    ).not.toBeVisible({ timeout: 3000 });
  });

  test("logout after navigating to Notification Settings sub-screen and pressing back", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await basePage.login("test@example.com");
    await basePage.expectLoggedIn();

    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    // Navigate to Notification Settings sub-screen (abort step)
    const notifButton = page.getByText("Notification Settings", {
      exact: true,
    });
    await notifButton.scrollIntoViewIfNeeded();
    await notifButton.click();
    await expect(
      page.getByRole("heading", { name: /notification/i }),
    ).toBeVisible({ timeout: 5000 });

    // Press back to abort and return to profile
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible({
      timeout: 5000,
    });

    // Logout
    const logoutButton = page.getByText("Logout", { exact: true });
    await logoutButton.scrollIntoViewIfNeeded();
    await logoutButton.click();
    await page.getByText("YES").first().click();

    // Must navigate to onboarding — NOT stay on profile
    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("heading", { name: "Profile" }),
    ).not.toBeVisible({ timeout: 3000 });
  });

  test("logout after navigating to My Profile (shared route) and pressing back", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await basePage.login("test@example.com");
    await basePage.expectLoggedIn();

    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    // Navigate to My Profile (shared route group /(more)/anamnesis/userprofile)
    const myProfileButton = page.getByText("My Profile", { exact: true });
    await myProfileButton.scrollIntoViewIfNeeded();
    await myProfileButton.click();
    // Should see the userprofile screen (personal data / anamnesis step 1)
    await expect(
      page
        .getByRole("heading", { name: /personal data/i })
        .or(page.getByText(/username/i).first()),
    ).toBeVisible({ timeout: 5000 });

    // Press back to abort
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible({
      timeout: 5000,
    });

    // Logout
    const logoutButton = page.getByText("Logout", { exact: true });
    await logoutButton.scrollIntoViewIfNeeded();
    await logoutButton.click();
    await page.getByText("YES").first().click();

    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("heading", { name: "Profile" }),
    ).not.toBeVisible({ timeout: 3000 });
  });

  test("logout after opening logout dialog, pressing No (abort), then confirming", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await basePage.login("test@example.com");
    await basePage.expectLoggedIn();

    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    // Open logout dialog and press NO (abort)
    const logoutButton = page.getByText("Logout", { exact: true });
    await logoutButton.scrollIntoViewIfNeeded();
    await logoutButton.click();
    // Use exact match to avoid matching the dialog message that also contains "logout?"
    await expect(page.getByText("Logout?", { exact: true })).toBeVisible({
      timeout: 3000,
    });
    await page.getByText("No", { exact: true }).first().click();

    // Confirm we're still on profile page after abort
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    // Now actually log out
    await logoutButton.click();
    await page.getByText("Yes", { exact: true }).first().click();

    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("heading", { name: "Profile" }),
    ).not.toBeVisible({ timeout: 3000 });
  });

  test("logout after navigating Home → Profile tab (cross-tab navigation) works", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await basePage.login("test@example.com");
    await basePage.expectLoggedIn();

    // Start on home tab, then switch to profile tab
    await basePage.navigateToTab("Training");
    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    const logoutButton = page.getByText("Logout", { exact: true });
    await logoutButton.scrollIntoViewIfNeeded();
    await logoutButton.click();
    await page.getByText("Yes", { exact: true }).first().click();

    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("heading", { name: "Profile" }),
    ).not.toBeVisible({ timeout: 3000 });
  });

  /**
   * Simulates the native Android "abort" path in userprofile.tsx:
   * user presses hardware back → sees "Abort anamnesis?" dialog → presses YES
   * → router.replace("/(tabs)/(home)") fires → navigates back to Profile → logout.
   *
   * On web we simulate this by navigating to My Profile, then using page.goto()
   * to jump to the home tab (mimicking router.replace), then returning to Profile.
   */
  test("logout after My Profile abort dialog redirects to Home tab then user returns to Profile", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await basePage.login("test@example.com");
    await basePage.expectLoggedIn();

    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    // Navigate to My Profile (shared route group)
    const myProfileButton = page.getByText("My Profile", { exact: true });
    await myProfileButton.scrollIntoViewIfNeeded();
    await myProfileButton.click();
    await expect(
      page
        .getByRole("heading", { name: /personal data/i })
        .or(page.getByText(/username/i).first()),
    ).toBeVisible({ timeout: 5000 });

    // Simulate router.replace("/(tabs)/(home)") — what the Android abort dialog does
    await page.goto("/(tabs)/(home)");
    await expect(page.getByRole("heading", { name: /Hello/i })).toBeVisible({
      timeout: 5000,
    });

    // Navigate back to Profile tab (as the user would after "abort")
    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible({
      timeout: 5000,
    });

    // Logout — should navigate to onboarding, not stay on profile
    const logoutButton = page.getByText("Logout", { exact: true });
    await logoutButton.scrollIntoViewIfNeeded();
    await logoutButton.click();
    await page.getByText("Yes", { exact: true }).first().click();

    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("heading", { name: "Profile" }),
    ).not.toBeVisible({ timeout: 3000 });
  });
});
