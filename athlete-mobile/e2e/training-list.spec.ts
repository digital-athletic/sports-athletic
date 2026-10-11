import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { createMaxExerciseProfile } from "./mocks/stores/profiles/maxExerciseProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { TrainingListPage, TrainingOverviewPage, WorkoutPage } from "./pages";

test.describe("Training list: checklist session", () => {
  test.describe("Standard progression", () => {
    test.use({ profile: createCompletedProfile(), signedIn: true });

    test("athlete completes every row of a checklist session", async ({
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
      await trainingListPage.completeAll();

      await workoutPage.returnToHome();
    });

    test("athlete skips the first row and still completes the session", async ({
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

      // Assumes row 0 of the Tuesday plan is a skippable exercise, not a
      // strength test row (which has no skip control).
      await trainingListPage.skipRow("training-list-row-0");
      await trainingListPage.completeAll();

      await workoutPage.returnToHome();
    });
  });

  test.describe("MAX exercise feedback via checklist", () => {
    test.use({ profile: createMaxExerciseProfile(), signedIn: true });

    test("athlete rates a MAX exercise too easy in the checklist and its last set moves two ladder steps", async ({
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
      await expect(page.getByText("KH-Bankdrücken (Max-K)")).toBeVisible();

      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();

      // Rows follow generator order, so the last matching row is the working set
      const maxRow = trainingListPage.lastRowByExerciseName(
        "KH-Bankdrücken (Max-K)",
      );
      await trainingListPage.selectFeedbackInRow(maxRow, "too_easy");
      await trainingListPage.completeAll();

      await workoutPage.returnToHome();

      // Same assertion workout.spec.ts makes for the sequential flow:
      // 75% x 2 moves two ladder steps up to 75% x 5
      await workoutPage.startWorkout("Tuesday");
      expect(await workoutPage.getLastMaxRepetition("8")).toEqual(
        expect.objectContaining({ weightPercentage: 75, repetitions: 5 }),
      );
    });
  });
});
