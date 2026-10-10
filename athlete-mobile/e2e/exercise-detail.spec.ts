import { test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import {
  BasePage,
  ExerciseInformationPage,
  TrainingOverviewPage,
} from "./pages";

test.describe("Exercise Information: strength test overview", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete inspects exercise information", async ({ page }) => {
    await mockSupabaseAuth(page);

    const basePage = new BasePage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();

    await basePage.navigateToTab("Profile");
    await page.getByText("Start Strength Test").click();
    await basePage.skipMuscleSoreness();

    const overviewPage = new TrainingOverviewPage(page);
    await overviewPage.expectVisible();
    await overviewPage.openExerciseInfo(0);

    const exerciseInfoPage = new ExerciseInformationPage(page);
    await exerciseInfoPage.expectVisible();

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

    // Exercise 25 (LH-Kniebeuge / barbell squat) has EQ_BARBELL and EQ_POWER_RACK
    await exerciseInfoPage.expectEquipmentItems(["Barbell", "Power Rack"]);

    await page.screenshot({
      path: "playwright/screenshots/exercise-detail-complete.png",
      fullPage: true,
    });
  });
});
