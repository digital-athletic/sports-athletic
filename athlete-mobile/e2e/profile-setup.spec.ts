import { expect, test } from "./fixtures";
import { mockSupabaseAuth } from "./mocks/supabase";
import { AnamnesisPage } from "./pages";
import { addDays, formatDateToISO } from "@/utils/date";

const weeksFromNow = (weeks: number): string =>
  formatDateToISO(addDays(new Date(), weeks * 7));

test.describe("Profile Setup: anamnesis", () => {
  test.slow();

  test("new athlete signs in and completes the anamnesis", async ({ page }) => {
    await mockSupabaseAuth(page);

    // The first time setup starts with the sign in of a new athlete, so no seeded session.
    const anamnesisPage = new AnamnesisPage(page);
    await anamnesisPage.login("test@example.com");

    // Should see anamnesis CTA on first login
    await expect(
      page.getByText(/I am Ingemar, your athletics coach/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Get started" }).click();

    // Select sport
    await anamnesisPage.selectSport("Handball");

    // Complete all profile setup screens
    // Note: The date picker UI (@react-native-community/datetimepicker) doesn't render on web,
    // so the end date is auto-calculated as 12 weeks from now
    await anamnesisPage.completeAnamnesis({
      name: "Test User",
      heightCm: 180,
      weightKg: 80,
      position: "Backcourt",
      seasonPhase: "Competitive",
      trainingDays: ["Tu", "Fr"],
    });

    // Verify training plan was generated
    await anamnesisPage.expectLoggedIn();
    await expect(
      page.getByRole("button", { name: /Start.*Training/i }),
    ).toBeVisible();

    // Verify the season phase was saved with correct type and end date (12 weeks from now)
    const storedSeasonPhase = await anamnesisPage.getStoredSeasonPhase();
    expect(storedSeasonPhase?.type).toBe("COMPETITION");
    expect(storedSeasonPhase?.endDate).toBe(weeksFromNow(12));

    await page.screenshot({
      path: "playwright/screenshots/profile-setup-complete.png",
      fullPage: true,
    });
  });
});
