import { expect, test } from "./fixtures";
import { createEnduranceProfile } from "./mocks/stores/profiles/enduranceProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { WorkoutPage } from "./pages";

// CARDIO_4 suggested duration: 30 min = 1800 s (getDurationDefaultBySkill)
const CARDIO_4_DURATION_S = 1800;
const CARDIO_4_DURATION_MIN = Math.round(CARDIO_4_DURATION_S / 60);
const EXERCISE_ID = "38";

test.describe("Endurance exercise: CARDIO_4", () => {
  test.use({ profile: createEnduranceProfile(), signedIn: true });

  test("athlete performs an endurance exercise", async ({ page }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const workoutPage = new WorkoutPage(page);
    await page.goto("/");
    await workoutPage.expectLoggedIn();
    await workoutPage.startWorkout("Tuesday");
    await workoutPage.beginWorkout();

    // CARDIO_4 is the only exercise in this profile
    await expect(page.getByLabel("checkmark")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/^\d{2}:\d{2}$/)).not.toBeVisible();

    await expect(
      page.getByText(String(CARDIO_4_DURATION_MIN), { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("min", { exact: true })).toBeVisible();

    await expect(page.getByText("too easy")).not.toBeVisible();
    await expect(page.getByText("too hard")).not.toBeVisible();

    await page.getByLabel("checkmark").click();

    // The suggested duration is recorded although no timer ran
    await expect
      .poll(
        async () =>
          (await workoutPage.getExerciseTotals(EXERCISE_ID))?.duration,
      )
      .toBe(CARDIO_4_DURATION_S);
  });
});
