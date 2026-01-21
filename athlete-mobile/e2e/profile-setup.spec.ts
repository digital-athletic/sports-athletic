import { expect, test, type Page } from "@playwright/test";
import { mockSupabaseAuth } from "./mocks/supabase";

/**
 * Completes profile setup by navigating through all anamnesis screens.
 * Handles pickers, text inputs, sliders, and body part selections.
 */
async function completeProfileSetup(page: Page) {
  // Screen 1: Personal Data (Name, Gender, Birthday)
  await expect(
    page.getByRole("heading", { name: "Personal Data" }),
  ).toBeVisible();
  await page.getByPlaceholder(/enter your name/i).fill("Test User");

  // Select gender
  await page.getByText("Male").first().click();
  await page.getByText("OK").click();

  // Birthday is optional, proceed without it
  await page.getByRole("button", { name: /go on/i }).click();

  // Screen 2: Height & Weight
  await expect(
    page.getByRole("heading", { name: "Height & Weight" }),
  ).toBeVisible();
  await page.getByPlaceholder("175").fill("180");
  await page.getByPlaceholder("75", { exact: true }).fill("80");
  await page.getByRole("button", { name: /go on/i }).click();

  // Screen 3: Position & Fitness
  await expect(
    page.getByRole("heading", { name: "Position & Fitness" }),
  ).toBeVisible();

  // Select position (Fieldplayer)
  await page.getByText("Choose").first().click();
  await page.getByText("Fieldplayer").click();
  await page.getByText("OK").click();

  // Fitness level slider is already at default (Beginner)
  await page.getByRole("button", { name: /go on/i }).click();

  // Screen 4: Pains/Injuries (body parts)
  await expect(page.getByRole("heading", { name: "Pains" })).toBeVisible();
  // Skip without selecting any body parts
  await page.getByRole("button", { name: /go on/i }).click();

  // Screen 5: Season Phase
  await expect(
    page.getByRole("heading", { name: "Season Phase" }),
  ).toBeVisible();

  // Select season phase (Competitive)
  await page.getByText("Choose").first().click();
  await page.getByText("Competitive").click();
  await page.getByText("OK").click();

  // End date is optional, proceed without it
  await page.getByRole("button", { name: /go on/i }).click();

  // Screen 6: Training Days
  await expect(
    page.getByRole("heading", { name: "Training Days" }),
  ).toBeVisible();

  // Select Tuesday and Friday
  await page.getByRole("button", { name: "Tu" }).click();
  await page.getByRole("button", { name: "Fr" }).click();

  // Location and duration have defaults, proceed
  await page.getByRole("button", { name: /go on/i }).click();

  // Wait for training plan generation
  await expect(page.getByText(/thank you for your/i)).toBeVisible();
  await expect(page.getByText(/generat.*plan/i)).toBeVisible();
}

test.describe("Profile Setup", () => {
  test("complete profile setup flow (anamnesis)", async ({ page }) => {
    test.setTimeout(60000);

    await mockSupabaseAuth(page);

    // Login
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
    await page.getByPlaceholder("E-Mail").fill("test@example.com");
    await page.getByPlaceholder("Password").fill("password123");
    await page.getByRole("button", { name: "Login" }).click();

    // Should see "fill your profile" message
    await expect(
      page.getByText("Please complete your profile to get started"),
    ).toBeVisible();

    // Navigate to Profile > My Profile
    await page.getByRole("tab", { name: /Profile/i }).click();
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await page.getByText("My Profile").click();

    // Complete all profile setup screens
    await completeProfileSetup(page);

    // Verify training plan was generated and we're back on home screen
    await expect(
      page.getByRole("heading", { name: /Hello Test User/i }),
    ).toBeVisible({ timeout: 30000 });

    // Verify training start button (confirms plan was generated)
    await expect(
      page.getByRole("button", { name: /Start.*Training/i }),
    ).toBeVisible();

    // Take screenshot of final state
    await page.screenshot({
      path: "playwright/screenshots/profile-setup-complete.png",
      fullPage: true,
    });
  });
});
