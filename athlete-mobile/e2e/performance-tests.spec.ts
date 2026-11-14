import { expect, test } from "./fixtures";
import { createHandballWingProfile } from "./mocks/stores/profiles/handballWingProfile";
import { mockSportTests } from "./mocks/sportTests";
import { mockSupabaseAuth } from "./mocks/supabase";
import { ProfilePage } from "./pages";

// Numeric columns arrive as strings from PostgREST.
const SPRINT_5M_ROW = {
  id: "55555555-5555-4555-8555-555555555555",
  code: "SPRINT_5M",
  unit: "s",
  sport_test_reference_values: [
    {
      gender: "FEMALE" as const,
      position: "WING",
      training_stage: "GRUNDLAGENTRAINING",
      range_start: "1.25",
      range_end: "1.15",
    },
  ],
};

test.describe("Performance tests: listing the tests of the sport", () => {
  test.use({ profile: createHandballWingProfile(14), signedIn: true });

  test("athlete sees the reference range for her training stage", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await mockSportTests(page, [SPRINT_5M_ROW]);
    const profilePage = new ProfilePage(page);
    await page.goto("/");
    await profilePage.expectLoggedIn();
    await profilePage.navigateToProfile();
    await page.getByText("Performance tests", { exact: true }).click();

    await expect(page.getByText("5 m sprint")).toBeVisible();
    await expect(page.getByText("Reference 1.25 to 1.15 s")).toBeVisible();
  });
});
