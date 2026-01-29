import { expect, test } from "@playwright/test";
import { PROFILE_MALE_COMPETITVE } from "./constants";
import { mockSupabaseAuth } from "./mocks/supabase";
import { AnamnesisPage } from "./pages";
import { addDays, dateToISODate } from "@/utils/date";

const weeksFromNow = (weeks: number): string =>
  dateToISODate(addDays(new Date(), weeks * 7));

test.describe("Profile Setup", () => {
  test.slow();

  test("complete profile setup flow (anamnesis)", async ({ page }) => {
    await mockSupabaseAuth(page);

    const anamnesisPage = new AnamnesisPage(page);
    await anamnesisPage.login("test@example.com", "password123");

    // Should see anamnesis CTA on first login
    await expect(
      page.getByText(
        "Hi! I am Ingemar. I am your personal athletics coach. Let's get started generating your personal workout plan right away.",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: /let's go/i }).click();

    // Select sport
    await anamnesisPage.selectSport("Handball");

    // Complete all profile setup screens
    // Note: The date picker UI (@react-native-community/datetimepicker) doesn't render on web,
    // so the end date is auto-calculated as 12 weeks from now
    await anamnesisPage.completeAnamnesis({
      name: "Test User",
      heightCm: 180,
      weightKg: 80,
      position: "Fieldplayer",
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

    await page.context().storageState({ path: PROFILE_MALE_COMPETITVE });
  });
});
