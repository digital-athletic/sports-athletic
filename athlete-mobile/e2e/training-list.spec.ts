import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { createMaxExerciseProfile } from "./mocks/stores/profiles/maxExerciseProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { TrainingListPage, TrainingOverviewPage, WorkoutPage } from "./pages";
import {
  getComparableCompletedWorkout,
  getComparableExerciseProgress,
  getTrainingStorageState,
  getUserProfileStorageState,
} from "./utils/storage";

test.describe("Training list: checklist session", () => {
  test.describe("Standard progression", () => {
    test.use({ profile: createCompletedProfile(), signedIn: true });

    test("athlete completes every row of a checklist session", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

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
      await page.clock.install();

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

  test.describe("Rest after a set", () => {
    test.use({ profile: createCompletedProfile(), signedIn: true });

    test("athlete sees the rest countdown, skips the rest and returns to the list", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      await page.clock.install();

      const workoutPage = new WorkoutPage(page);
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");
      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();

      const { rowId, restIndex } =
        await trainingListPage.firstRowFollowedByRest();
      await trainingListPage.continueRowIntoRest(rowId);
      await expect(trainingListPage.restTimer).toBeVisible();

      await trainingListPage.skipRest();
      await trainingListPage.expectRowCompleted(rowId);
      await expect
        .poll(
          async () =>
            (await getTrainingStorageState(page))?.exerciseList?.[restIndex],
        )
        .toEqual(
          expect.objectContaining({
            exerciseId: "999999",
            completed: true,
            skipped: true,
          }),
        );
    });
  });

  test.describe("Parity with the step-by-step view", () => {
    test.use({ profile: createCompletedProfile(), signedIn: true });

    test("checklist and step-by-step view store the same data for the same plan and skipped row", async ({
      page,
      storageState,
    }) => {
      test.setTimeout(120000);
      if (typeof storageState !== "object") {
        throw new Error("The profile fixture must seed a storage state");
      }

      // Step-by-step view: the helper skips the timed warmup row (row 0)
      await mockSupabaseAuth(page);
      await mockWakeLock(page);
      const stepByStepWorkoutPage = new WorkoutPage(page);

      await page.goto("/");
      await stepByStepWorkoutPage.expectLoggedIn();
      await stepByStepWorkoutPage.startWorkout("Tuesday");
      await stepByStepWorkoutPage.beginWorkout();
      await stepByStepWorkoutPage.completeWorkout();
      await stepByStepWorkoutPage.returnToHome();

      const stepByStep = {
        workout: await getComparableCompletedWorkout(page),
        progress: await getComparableExerciseProgress(page),
        profile: await getUserProfileStorageState(page),
        training: await getTrainingStorageState(page),
      };

      // Checklist view: reseed the same profile, then run the same plan
      await page.evaluate((items) => {
        localStorage.clear();
        for (const { name, value } of items) localStorage.setItem(name, value);
      }, storageState.origins[0].localStorage);
      await page.clock.install();
      const trainingOverviewPage = new TrainingOverviewPage(page);
      const trainingListPage = new TrainingListPage(page);

      await page.goto("/");
      await stepByStepWorkoutPage.expectLoggedIn();
      await stepByStepWorkoutPage.startWorkout("Tuesday");
      await trainingOverviewPage.startAsChecklist();
      await trainingListPage.expectVisible();
      await trainingListPage.skipRow("training-list-row-0");
      await trainingListPage.completeAll();
      await stepByStepWorkoutPage.returnToHome();

      const checklist = {
        workout: await getComparableCompletedWorkout(page),
        progress: await getComparableExerciseProgress(page),
        profile: await getUserProfileStorageState(page),
        training: await getTrainingStorageState(page),
      };

      expect(checklist.workout).toEqual(stepByStep.workout);
      expect(checklist.progress).toEqual(stepByStep.progress);
      expect(checklist.profile).toEqual(stepByStep.profile);
      expect(checklist.training.exerciseList).toBeNull();
      expect(checklist.training).toEqual(stepByStep.training);
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
      await page.clock.install();

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
