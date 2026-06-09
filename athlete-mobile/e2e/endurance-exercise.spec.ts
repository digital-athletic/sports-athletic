import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createEnduranceProfile } from "./mocks/stores/profiles/enduranceProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { WorkoutPage } from "./pages";

// CARDIO_4 suggested duration: 30 min = 1800 s (getDurationDefaultBySkill)
const CARDIO_4_DURATION_S = 1800;
const CARDIO_4_DURATION_MIN = Math.round(CARDIO_4_DURATION_S / 60);
const EXERCISE_ID = "38";

test.describe("Endurance exercise (CARDIO_4)", () => {
  test.use({ profile: createEnduranceProfile() });

  // Shared setup: login → start workout → arrive at endurance exercise (checkmark visible)
  async function navigateToEnduranceExercise(
    page: Page,
    workoutPage: WorkoutPage,
  ) {
    await workoutPage.login("test@example.com");
    await workoutPage.expectLoggedIn();
    await workoutPage.startWorkout("Tuesday");
    await workoutPage.beginWorkout();
    // Only exercise in this profile is CARDIO_4. Wait for checkmark to confirm we're there.
    await expect(page.getByLabel("checkmark")).toBeVisible({ timeout: 10000 });
  }

  test("shows checkmark instead of countdown timer", async ({ page }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const workoutPage = new WorkoutPage(page);
    await navigateToEnduranceExercise(page, workoutPage);

    await expect(page.getByLabel("checkmark")).toBeVisible();
    await expect(page.getByText(/^\d{2}:\d{2}$/)).not.toBeVisible();
  });

  test("displays the suggested duration as informational text", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const workoutPage = new WorkoutPage(page);
    await navigateToEnduranceExercise(page, workoutPage);

    await expect(
      page.getByText(String(CARDIO_4_DURATION_MIN), { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("min", { exact: true })).toBeVisible();
  });

  test("does not show difficulty feedback buttons", async ({ page }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const workoutPage = new WorkoutPage(page);
    await navigateToEnduranceExercise(page, workoutPage);

    await expect(page.getByText("too easy")).not.toBeVisible();
    await expect(page.getByText("too hard")).not.toBeVisible();
  });

  test("records suggested duration when checkmark is pressed (not skipped)", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const workoutPage = new WorkoutPage(page);
    await navigateToEnduranceExercise(page, workoutPage);

    // Press the checkmark (not skip) to complete
    await page.getByLabel("checkmark").click();
    await workoutPage.returnToHome();

    // Suggested duration must be recorded even though no timer ran
    const exerciseData = await workoutPage.getExerciseProgressData(EXERCISE_ID);
    expect(exerciseData?.duration).toBe(CARDIO_4_DURATION_S);
  });
});
