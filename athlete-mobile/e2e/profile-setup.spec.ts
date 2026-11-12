import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { AnamnesisPage } from "./pages";
import { getUserProfileStorageState } from "./utils/storage";
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

    // Complete all profile setup screens. The test leaves the end of the season
    // phase untouched, so the app uses its default of 12 weeks from now.
    await anamnesisPage.completeAnamnesis({
      name: "Test User",
      birthday: "1990-05-17",
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

    // Verify the birthday was saved
    const storedProfile = await getUserProfileStorageState(page);
    expect(storedProfile?.personalData?.birthday).toBe("1990-05-17");

    await page.screenshot({
      path: "playwright/screenshots/profile-setup-complete.png",
      fullPage: true,
    });
  });
});

test.describe("Profile Setup: end of the season phase", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("keeps a valid date and rejects a date after the maximum", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await page.goto("/(more)/anamnesis/season-phase");
    const endDate = page.getByLabel("End of season phase");

    // After the blur the field shows the value from the store again.
    await endDate.fill(weeksFromNow(20));
    await endDate.blur();
    await expect(endDate).toHaveValue(weeksFromNow(20));

    // The maximum on this screen is one year from now.
    await endDate.fill(weeksFromNow(60));
    await endDate.blur();
    await expect(endDate).toHaveValue(weeksFromNow(20));
  });
});
