import { expect, test } from "./fixtures";
import { createEnduranceProfile } from "./mocks/stores/profiles/enduranceProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { TrainingListPage, TrainingOverviewPage, WorkoutPage } from "./pages";

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
    const finishButton = page.getByRole("button", { name: "Finish exercise" });
    await expect(finishButton).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/^\d{2}:\d{2}$/)).not.toBeVisible();

    await expect(
      page.getByText(String(CARDIO_4_DURATION_MIN), { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("min", { exact: true })).toBeVisible();

    await expect(page.getByText("too easy")).not.toBeVisible();
    await expect(page.getByText("too hard")).not.toBeVisible();

    await finishButton.click();

    // The suggested duration is recorded although no timer ran
    await expect
      .poll(
        async () =>
          (await workoutPage.getExerciseTotals(EXERCISE_ID))?.duration,
      )
      .toBe(CARDIO_4_DURATION_S);
  });

  test("athlete sees the planned duration of a steady run in the checklist", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const workoutPage = new WorkoutPage(page);
    const trainingOverviewPage = new TrainingOverviewPage(page);
    const trainingListPage = new TrainingListPage(page);
    await page.goto("/");
    await workoutPage.expectLoggedIn();
    await workoutPage.startWorkout("Tuesday");
    await trainingOverviewPage.startAsChecklist();
    await trainingListPage.expectVisible();

    // CARDIO_4 is the only exercise in this profile
    const rowId = "training-list-row-0";
    await expect(trainingListPage.entry(rowId)).toContainText(
      `${CARDIO_4_DURATION_MIN} min`,
    );

    await trainingListPage.startRow(rowId);
    await expect(trainingListPage.sheetDurationTile).toHaveText(
      new RegExp(`^${CARDIO_4_DURATION_MIN}\\s*min$`),
    );
    await expect(trainingListPage.sheetHeartRateTile).toHaveText(
      /^\d+ - \d+\s*bpm$/,
    );
    // The stopwatch counts up, so Next is enabled from the start
    await expect(trainingListPage.sheetTimer).toHaveText(/^00:0\d$/);

    await trainingListPage.completeOpenSet();
    await trainingListPage.expectRowCompleted(rowId);
  });
});
