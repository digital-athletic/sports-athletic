import { expect, test } from "@playwright/test";
import { seedCompletedProfile } from "./mocks/stores";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";

test.describe("User Deletion", () => {
  test("delete user and return to login page", async ({ page }) => {
    test.setTimeout(60000);

    await seedCompletedProfile(page);
    await mockSupabaseAuth(page);

    // Log browser console for debugging
    page.on("console", (msg) => console.log("BROWSER:", msg.text()));

    const basePage = new BasePage(page);
    await basePage.login("test@example.com", "password123");
    await basePage.expectLoggedIn();

    // Navigate to Profile tab
    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    // Scroll to and click Delete User button
    const deleteUserButton = page.getByText("Delete User");
    await deleteUserButton.scrollIntoViewIfNeeded();
    await deleteUserButton.click();

    // First dialog: "Delete User?" - click YES
    await expect(page.getByText("Delete User?")).toBeVisible();
    await page.getByText("YES").first().click();

    // Second dialog: "Logout?" - click YES
    await expect(page.getByText("Logout?", { exact: true })).toBeVisible();
    await page.getByText("YES").first().click();

    // Wait for dialog to close and navigation to complete
    await expect(page.getByText("Logout?", { exact: true })).not.toBeVisible();

    // Should land on login/onboarding page
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });
});
