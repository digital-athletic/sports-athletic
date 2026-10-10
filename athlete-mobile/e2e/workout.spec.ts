import { expect, test } from "./fixtures";
import { createBranchThresholdProfile } from "./mocks/stores/profiles/branchThresholdProfile";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { createMaxExerciseProfile } from "./mocks/stores/profiles/maxExerciseProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { WorkoutPage } from "./pages";

test.describe("Workout: progression after completing a workout", () => {
  const EXERCISE_NAME = "KH-Frontkniebeuge";
  // Hypertrophy starts at 8 of its binding 8 to 12 repetitions
  const EXPECTED_INITIAL_REPS = 8;
  const EXPECTED_INITIAL_WEIGHT = 14;
  const EXPECTED_AFTER_REPS = 9;
  // Positive feedback raises only the repetitions until the target is reached
  const EXPECTED_AFTER_WEIGHT = 14;

  test.describe("Standard progression", () => {
    test.use({ profile: createCompletedProfile(), signedIn: true });

    test("athlete completes a workout and sees more repetitions", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      const initialValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(initialValues.reps).toBe(EXPECTED_INITIAL_REPS);
      expect(initialValues.weight).toBe(EXPECTED_INITIAL_WEIGHT);

      await workoutPage.beginWorkout();
      await workoutPage.completeWorkout();
      await workoutPage.returnToHome();

      await workoutPage.startWorkout("Tuesday");

      const afterValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(afterValues.reps).toBe(EXPECTED_AFTER_REPS);
      expect(afterValues.weight).toBe(EXPECTED_AFTER_WEIGHT);
    });

    test("athlete rates the last set too easy and sees a larger repetition increase", async ({
      page,
    }) => {
      test.setTimeout(60000);

      const EXPECTED_TOO_EASY_REPS = 10;
      const EXPECTED_TOO_EASY_WEIGHT = 14;

      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      const initialValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(initialValues.reps).toBe(EXPECTED_INITIAL_REPS);
      expect(initialValues.weight).toBe(EXPECTED_INITIAL_WEIGHT);

      await workoutPage.beginWorkout();
      await workoutPage.completeWorkout({ lastSetFeedback: "too_easy" });
      await workoutPage.returnToHome();

      await workoutPage.startWorkout("Tuesday");

      const afterValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(afterValues.reps).toBe(EXPECTED_TOO_EASY_REPS);
      expect(afterValues.weight).toBe(EXPECTED_TOO_EASY_WEIGHT);
    });

    test("athlete rates the last set too hard and keeps the repetitions", async ({
      page,
    }) => {
      test.setTimeout(60000);

      // On a weighted exercise TOO_HARD lowers only the weight
      const EXPECTED_TOO_HARD_REPS = 8;
      // A weight step always changes the shown load: 14 x 0.975 drops to 12
      const EXPECTED_TOO_HARD_WEIGHT = 12;

      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      const initialValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(initialValues.reps).toBe(EXPECTED_INITIAL_REPS);
      expect(initialValues.weight).toBe(EXPECTED_INITIAL_WEIGHT);

      await workoutPage.beginWorkout();
      await workoutPage.completeWorkout({ lastSetFeedback: "too_hard" });
      await workoutPage.returnToHome();

      await workoutPage.startWorkout("Tuesday");

      const afterValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(afterValues.reps).toBe(EXPECTED_TOO_HARD_REPS);
      expect(afterValues.weight).toBe(EXPECTED_TOO_HARD_WEIGHT);
    });
  });

  test.describe("Branch level up", () => {
    test.use({ profile: createBranchThresholdProfile(), signedIn: true });

    test("athlete at the max threshold levels up to the barbell variant", async ({
      page,
    }) => {
      test.setTimeout(60000);

      const INITIAL_EXERCISE = "KH-Frontkniebeuge";
      const UPGRADED_EXERCISE = "LH-Frontkniebeuge";

      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      await expect(page.getByText(INITIAL_EXERCISE)).toBeVisible();

      await workoutPage.beginWorkout();
      await workoutPage.completeWorkout();
      await workoutPage.returnToHome();

      await workoutPage.startWorkout("Tuesday");

      await expect(page.getByText(UPGRADED_EXERCISE)).toBeVisible();
      await expect(page.getByText(INITIAL_EXERCISE)).not.toBeVisible();
    });
  });

  test.describe("MAX exercise ladder progression", () => {
    test.use({ profile: createMaxExerciseProfile(), signedIn: true });

    test("athlete rates a MAX exercise too easy and its last set moves two ladder steps", async ({
      page,
    }) => {
      test.setTimeout(120000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);

      await page.goto("/");
      await workoutPage.expectLoggedIn();

      await workoutPage.startWorkout("Tuesday");
      await expect(page.getByText("KH-Bankdrücken (Max-K)")).toBeVisible();
      await workoutPage.beginWorkout();
      await workoutPage.completeWorkout({ lastSetFeedback: "too_easy" });
      await workoutPage.returnToHome();

      await workoutPage.startWorkout("Tuesday");
      await workoutPage.beginWorkout();

      // Advanced set 3 starts at 75% x 2; TOO_EASY moves it two steps to 75% x 5
      expect(await workoutPage.getLastMaxRepetition("8")).toEqual(
        expect.objectContaining({ weightPercentage: 75, repetitions: 5 }),
      );
    });
  });
});
