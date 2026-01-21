import { expect, test, type Page } from "@playwright/test";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";

/**
 * Completes profile setup by navigating through all anamnesis screens.
 */
async function completeProfileSetup(page: Page) {
  const goOnButton = page.getByRole("button", { name: /go on/i });

  // Screen 1: Personal Data
  await expect(
    page.getByRole("heading", { name: "Personal Data" }),
  ).toBeVisible();
  await page.getByPlaceholder(/enter your name/i).fill("Test User");
  await page.getByText("Male").first().click();
  await page.getByText("OK").click();
  await goOnButton.click();

  // Screen 2: Height & Weight
  await expect(
    page.getByRole("heading", { name: "Height & Weight" }),
  ).toBeVisible();
  await page.getByPlaceholder("175").fill("180");
  await page.getByPlaceholder("75", { exact: true }).fill("80");
  await goOnButton.click();

  // Screen 3: Position & Fitness
  await expect(
    page.getByRole("heading", { name: "Position & Fitness" }),
  ).toBeVisible();
  await page.getByText("Choose").first().click();
  await page.getByText("Fieldplayer").click();
  await page.getByText("OK").click();
  await goOnButton.click();

  // Screen 4: Pains/Injuries
  await expect(page.getByRole("heading", { name: "Pains" })).toBeVisible();
  await goOnButton.click();

  // Screen 5: Season Phase
  await expect(
    page.getByRole("heading", { name: "Season Phase" }),
  ).toBeVisible();
  await page.getByText("Choose").first().click();
  await page.getByText("Competitive").click();
  await page.getByText("OK").click();
  await goOnButton.click();

  // Screen 6: Training Days
  await expect(
    page.getByRole("heading", { name: "Training Days" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tu" }).click();
  await page.getByRole("button", { name: "Fr" }).click();
  await goOnButton.click();

  // Wait for training plan generation
  await expect(page.getByText(/thank you for your/i)).toBeVisible();
  await expect(page.getByText(/generat.*plan/i)).toBeVisible();
}

test.describe("Profile Setup", () => {
  test("complete profile setup flow (anamnesis)", async ({ page }) => {
    test.setTimeout(60000);

    await mockSupabaseAuth(page);

    const basePage = new BasePage(page);
    await basePage.login("test@example.com", "password123");

    // Should see "fill your profile" message (no training plan yet)
    await expect(
      page.getByText("Please complete your profile to get started"),
    ).toBeVisible();

    // Navigate to Profile > My Profile
    await basePage.navigateToTab("Profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await page.getByText("My Profile").click();

    // Complete all profile setup screens
    await completeProfileSetup(page);

    // Verify training plan was generated
    await basePage.expectLoggedIn();
    await expect(
      page.getByRole("button", { name: /Start.*Training/i }),
    ).toBeVisible();

    await page.screenshot({
      path: "playwright/screenshots/profile-setup-complete.png",
      fullPage: true,
    });
  });
});
