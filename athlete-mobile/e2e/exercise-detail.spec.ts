import { test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import {
  BasePage,
  ExerciseInformationPage,
  TrainingOverviewPage,
} from "./pages";

test.describe("Exercise Detail View", () => {
  test.use({ profile: createCompletedProfile() });

  test("displays muscle regions on exercise information page from strength test overview", async ({
    page,
  }) => {
    test.setTimeout(60000);

    await mockSupabaseAuth(page);

    const basePage = new BasePage(page);
    await basePage.login("test@example.com", "password123");
    await basePage.expectLoggedIn();

    // Navigate to Profile tab and start strength test
    await basePage.navigateToTab("Profile");
    await page.getByText("Start New Test Workout").click();

    // Skip muscle soreness selection
    await basePage.skipMuscleSoreness();

    // Verify training overview and open first exercise
    const overviewPage = new TrainingOverviewPage(page);
    await overviewPage.expectVisible();

    await page.screenshot({
      path: "playwright/screenshots/exercise-detail-overview.png",
      fullPage: true,
    });

    await overviewPage.openExerciseInfo(0);

    // Verify exercise information page shows muscle regions
    const exerciseInfoPage = new ExerciseInformationPage(page);
    await exerciseInfoPage.expectVisible();

    await page.screenshot({
      path: "playwright/screenshots/exercise-detail-muscles.png",
      fullPage: true,
    });

    await exerciseInfoPage.expectMusclesSectionComplete();
    await exerciseInfoPage.expectMuscleChips(6);

    // LH-Kniebeuge (barbell squat, exercise 25) primary muscle tags:
    //   GLUTES, HAMSTRINGS, QUADRICEPS, LOWER_BACK
    // After expandMuscleTags these become the chip labels via t("muscles.<KEY>"):
    await exerciseInfoPage.expectMuscleChipLabels([
      "buttock",
      "left back thigh",
      "right back thigh",
      "left front thigh",
      "right front thigh",
      "lower back",
    ]);

    await exerciseInfoPage.expectExerciseHintsVisible();

    await page.screenshot({
      path: "playwright/screenshots/exercise-detail-complete.png",
      fullPage: true,
    });
  });

  test("displays equipment tags correctly on exercise information page", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);

    const basePage = new BasePage(page);
    await basePage.login("test@example.com", "password123");
    await basePage.expectLoggedIn();

    // Navigate to Profile tab and start strength test
    await basePage.navigateToTab("Profile");
    await page.getByText("Start New Test Workout").click();

    // Skip muscle soreness selection
    await basePage.skipMuscleSoreness();

    // Verify training overview and open first exercise
    const overviewPage = new TrainingOverviewPage(page);
    await overviewPage.expectVisible();
    await overviewPage.openExerciseInfo(0);

    // Verify exercise information page shows equipment correctly
    const exerciseInfoPage = new ExerciseInformationPage(page);
    await exerciseInfoPage.expectVisible();

    // Exercise 25 (LH-Kniebeuge / barbell squat) has EQ_BARBELL and EQ_POWER_RACK
    await exerciseInfoPage.expectEquipmentItems(["Barbell", "Power Rack"]);
  });
});
