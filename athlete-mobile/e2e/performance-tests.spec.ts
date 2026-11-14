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
      range_start: "9.87",
      range_end: "6.54",
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
    await expect(page.getByText("Reference 9.87 to 6.54 s")).toBeVisible();
  });

  test("athlete records a value and sees it against the reference range", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await mockSportTests(page, [SPRINT_5M_ROW]);
    const profilePage = new ProfilePage(page);
    await page.goto("/");
    await profilePage.expectLoggedIn();
    await profilePage.navigateToProfile();
    await page.getByText("Performance tests", { exact: true }).click();
    await expect(
      page
        .getByTestId("performance-test-latest-SPRINT_5M")
        .getByText("No value"),
    ).toBeVisible();

    await page.getByTestId("performance-test-row-SPRINT_5M").click();
    await page.getByTestId("performance-test-value-input").fill("8,1");
    await page.getByTestId("performance-test-save").click();

    const summary = page.getByTestId("performance-test-summary");
    await expect(summary.getByText("8.1 s")).toBeVisible();
    await expect(summary.getByText("in range")).toBeVisible();
    await expect(page.getByTestId("performance-test-value-0")).toContainText(
      "8.1 s",
    );

    await page.goBack();

    const latest = page.getByTestId("performance-test-latest-SPRINT_5M");
    await expect(latest.getByText("8.1 s")).toBeVisible();
    await expect(latest.getByText("in range")).toBeVisible();
  });
});
