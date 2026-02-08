import { expect, test } from "./fixtures";
import { createFreshAnamnesisProfile } from "./mocks/stores/profiles/freshAnamnesisProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { ManualStrengthTestPage } from "./pages";

test.describe("Manual Strength Test", () => {
  test.use({ profile: createFreshAnamnesisProfile() });

  test("enter manual test results and see success screen", async ({ page }) => {
    await mockSupabaseAuth(page);

    const manualTestPage = new ManualStrengthTestPage(page);
    await manualTestPage.login("test@example.com");
    await manualTestPage.expectLoggedIn();

    await manualTestPage.navigateFromStatistics();
    await manualTestPage.expectAllExerciseSectionsVisible();

    // Fill in squat: 100kg barbell, 8 reps
    await manualTestPage.fillExercise("squat", "100", "8");

    // Fill in bench press: 15kg dumbbells, 10 reps
    await manualTestPage.fillExercise("benchPress", "15", "10", "dumbbells");

    await manualTestPage.saveAndExpectSuccess();

    // Click "Go on" to navigate back
    await manualTestPage.goOn();
  });

  test("enter manual test results from more screen", async ({ page }) => {
    await mockSupabaseAuth(page);

    const manualTestPage = new ManualStrengthTestPage(page);
    await manualTestPage.login("test@example.com");
    await manualTestPage.expectLoggedIn();

    await manualTestPage.navigateFromMore();
  });

  test("shows validation error when no exercises filled", async ({ page }) => {
    await mockSupabaseAuth(page);

    const manualTestPage = new ManualStrengthTestPage(page);
    await manualTestPage.login("test@example.com");
    await manualTestPage.expectLoggedIn();

    await manualTestPage.navigateFromStatistics();
    await manualTestPage.saveAndExpectValidationError();
  });

  test("shows incomplete error when only weight is filled", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);

    const manualTestPage = new ManualStrengthTestPage(page);
    await manualTestPage.login("test@example.com");
    await manualTestPage.expectLoggedIn();

    await manualTestPage.navigateFromStatistics();
    await manualTestPage.fillWeightOnly("squat", "100");
    await manualTestPage.saveAndExpectIncompleteError();
  });
});
