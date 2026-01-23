import { expect, test } from "@playwright/test";
import { PROFILE_MALE_COMPETITVE } from "./constants";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";
import { completeAnamnesis, selectSport } from "./utils/anamnesis";

test.describe("Profile Setup", () => {
  test.slow();

  test("complete profile setup flow (anamnesis)", async ({ page }) => {
    await mockSupabaseAuth(page);

    const basePage = new BasePage(page);
    await basePage.login("test@example.com", "password123");

    // Should see anamnesis CTA on first login
    await expect(
      page.getByText(
        "Hi! I am Ingemar. I am your personal athletics coach. Let's get started generating your personal workout plan right away.",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: /let's go/i }).click();

    // Select sport
    await selectSport(page, "Handball");

    // Complete all profile setup screens
    await completeAnamnesis(page, {
      name: "Test User",
      heightCm: 180,
      weightKg: 80,
      position: "Fieldplayer",
      seasonPhase: "Competitive",
      trainingDays: ["Tu", "Fr"],
    });

    // Verify training plan was generated
    await basePage.expectLoggedIn();
    await expect(
      page.getByRole("button", { name: /Start.*Training/i }),
    ).toBeVisible();

    await page.screenshot({
      path: "playwright/screenshots/profile-setup-complete.png",
      fullPage: true,
    });

    await page.context().storageState({ path: PROFILE_MALE_COMPETITVE });
  });
});
