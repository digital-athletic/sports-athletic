import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { createMaxExerciseProfile } from "./mocks/stores/profiles/maxExerciseProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { TrainingListPage, TrainingOverviewPage, WorkoutPage } from "./pages";

test.describe("Training List Flow", () => {
  test.describe("Standard progression", () => {
    test.use({ profile: createCompletedProfile() });

    test("complete a checklist session end to end", async ({ page }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await workoutPage.login("test@example.com");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();
      await trainingListPage.completeAll();

      await workoutPage.returnToHome();
    });

    test("skipping a row still allows the session to complete", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await workoutPage.login("test@example.com");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();

      // NOTE: assumes row 0 (first exercise in the generated Tuesday plan) is a
      // normal, skippable exercise, not a strength-test row (which has no skip
      // control). Verify against the actual rendered plan on first run and
      // adjust the index if needed.
      await trainingListPage.skipRow("training-list-row-0");
      await trainingListPage.completeAll();

      await workoutPage.returnToHome();
    });
  });

  test.describe("MAX exercise feedback via checklist", () => {
    test.use({ profile: createMaxExerciseProfile() });

    test("selecting 'too easy' on the last MAX set moves it two ladder steps", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await workoutPage.login("test@example.com");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");
      await expect(page.getByText("KH-Bankdrücken (Max-K)")).toBeVisible();

      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();

      // Rows render in the same order the generator produced them, so the
      // LAST row named "KH-Bankdrücken (Max-K)" is always the final/working
      // set (matching the assumption workout.spec.ts's own MAX test already
      // relies on for this same profile) — no need to guess a numeric index.
      const maxRow = trainingListPage.lastRowByExerciseName(
        "KH-Bankdrücken (Max-K)",
      );
      await trainingListPage.selectFeedbackInRow(maxRow, "too_easy");
      await trainingListPage.completeAll();

      await workoutPage.returnToHome();

      // Second workout: same assertion workout.spec.ts makes for the
      // sequential flow, 75% x 2 two ladder steps up to 75% x 5.
      await workoutPage.startWorkout("Tuesday");
      const exerciseList = await workoutPage.getGeneratedExerciseList();
      const maxExercises =
        exerciseList?.filter((e: any) => e.exerciseId === "8") ?? [];
      const lastSet = maxExercises[maxExercises.length - 1];
      const lastMaxFRep =
        lastSet?.maxFRepetitions?.[lastSet.maxFRepetitions.length - 1];
      expect(lastMaxFRep).toEqual(
        expect.objectContaining({ weightPercentage: 75, repetitions: 5 }),
      );
    });
  });
});
