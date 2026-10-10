import { test } from "./fixtures";
import { createFreshAnamnesisProfile } from "./mocks/stores/profiles/freshAnamnesisProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { ManualStrengthTestPage } from "./pages";

test.describe("Manual Strength Test: entering results", () => {
  test.use({ profile: createFreshAnamnesisProfile(), signedIn: true });

  test("athlete enters manual strength test results", async ({ page }) => {
    await mockSupabaseAuth(page);

    const manualTestPage = new ManualStrengthTestPage(page);
    await page.goto("/");
    await manualTestPage.expectLoggedIn();

    await manualTestPage.navigateFromStatistics();
    await manualTestPage.expectAllExerciseSectionsVisible();

    // Saving an empty form is rejected
    await manualTestPage.saveAndExpectValidationError();
    await manualTestPage.dismissAlert();

    // A weight without reps is rejected
    await manualTestPage.fillWeightOnly("squat", "100");
    await manualTestPage.saveAndExpectIncompleteError();
    await manualTestPage.dismissAlert();

    // Squat: 100kg barbell, 8 reps. Bench press: 15kg barbell, 10 reps.
    await manualTestPage.fillExercise("squat", "100", "8");
    await manualTestPage.fillExercise("benchPress", "15", "10");

    await manualTestPage.saveAndExpectSuccess();
    await manualTestPage.goOn();
  });

  test("athlete opens the manual strength test from the profile screen", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);

    const manualTestPage = new ManualStrengthTestPage(page);
    await page.goto("/");
    await manualTestPage.expectLoggedIn();

    await manualTestPage.navigateFromMore();
  });
});
