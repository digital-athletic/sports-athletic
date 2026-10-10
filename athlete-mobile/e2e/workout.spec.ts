import { expect, test } from "./fixtures";
import { createBranchThresholdProfile } from "./mocks/stores/profiles/branchThresholdProfile";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { createMaxExerciseProfile } from "./mocks/stores/profiles/maxExerciseProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { WorkoutPage } from "./pages";

test.describe("Workout Flow", () => {
  const EXERCISE_NAME = "KH-Frontkniebeuge";
  const EXPECTED_INITIAL_REPS = 10;
  const EXPECTED_INITIAL_WEIGHT = 14;
  const EXPECTED_AFTER_REPS = 11;
  const EXPECTED_AFTER_WEIGHT = 16;

  test.describe("Standard progression", () => {
    test.use({ profile: createCompletedProfile() });

    test("complete workout and verify weight progression", async ({ page }) => {
      test.setTimeout(60000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);

      await workoutPage.login("test@example.com");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      // Verify initial exercise values before workout
      const initialValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(initialValues.reps).toBe(EXPECTED_INITIAL_REPS);
      expect(initialValues.weight).toBe(EXPECTED_INITIAL_WEIGHT);

      // Complete the workout
      await workoutPage.beginWorkout();
      await workoutPage.completeWorkout();
      await workoutPage.returnToHome();

      // Start workout again and verify progression
      await workoutPage.startWorkout("Tuesday");

      const afterValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(afterValues.reps).toBe(EXPECTED_AFTER_REPS);
      expect(afterValues.weight).toBe(EXPECTED_AFTER_WEIGHT);
    });

    test("clicking 'too easy' on last set increases weight more", async ({
      page,
    }) => {
      test.setTimeout(60000);

      const EXPECTED_TOO_EASY_REPS = 12;
      const EXPECTED_TOO_EASY_WEIGHT = 16;

      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);

      await workoutPage.login("test@example.com");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      // Verify initial values
      const initialValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(initialValues.reps).toBe(EXPECTED_INITIAL_REPS);
      expect(initialValues.weight).toBe(EXPECTED_INITIAL_WEIGHT);

      // Complete workout clicking "too easy" on last set
      await workoutPage.beginWorkout();
      await workoutPage.completeWorkout({ lastSetFeedback: "too_easy" });
      await workoutPage.returnToHome();

      // Start workout again and verify larger progression
      await workoutPage.startWorkout("Tuesday");

      const afterValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(afterValues.reps).toBe(EXPECTED_TOO_EASY_REPS);
      expect(afterValues.weight).toBe(EXPECTED_TOO_EASY_WEIGHT);
    });

    test("clicking 'too hard' on last set decreases weight", async ({
      page,
    }) => {
      test.setTimeout(60000);

      const EXPECTED_TOO_HARD_REPS = 9;
      const EXPECTED_TOO_HARD_WEIGHT = 14;

      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);

      await workoutPage.login("test@example.com");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      // Verify initial values
      const initialValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(initialValues.reps).toBe(EXPECTED_INITIAL_REPS);
      expect(initialValues.weight).toBe(EXPECTED_INITIAL_WEIGHT);

      // Complete workout clicking "too hard" on last set
      await workoutPage.beginWorkout();
      await workoutPage.completeWorkout({ lastSetFeedback: "too_hard" });
      await workoutPage.returnToHome();

      // Start workout again and verify decreased weight
      await workoutPage.startWorkout("Tuesday");

      const afterValues = await workoutPage.getExerciseValues(EXERCISE_NAME);
      expect(afterValues.reps).toBe(EXPECTED_TOO_HARD_REPS);
      expect(afterValues.weight).toBe(EXPECTED_TOO_HARD_WEIGHT);
    });
  });

  test.describe("Branch level up", () => {
    test.use({ profile: createBranchThresholdProfile() });

    test("completing workout at max threshold triggers branch level up to new exercise", async ({
      page,
    }) => {
      test.setTimeout(60000);

      const INITIAL_EXERCISE = "KH-Frontkniebeuge";
      const UPGRADED_EXERCISE = "LH-Frontkniebeuge";

      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);

      await workoutPage.login("test@example.com");
      await workoutPage.expectLoggedIn();
      await workoutPage.startWorkout("Tuesday");

      // Verify initial exercise is KH-Frontkniebeuge (dumbbell)
      await expect(page.getByText(INITIAL_EXERCISE)).toBeVisible();

      // Complete workout - should trigger level up since at target values
      await workoutPage.beginWorkout();
      await workoutPage.completeWorkout();
      await workoutPage.returnToHome();

      // Start workout again and verify exercise changed to LH-Frontkniebeuge (barbell)
      await workoutPage.startWorkout("Tuesday");

      await expect(page.getByText(UPGRADED_EXERCISE)).toBeVisible();
      await expect(page.getByText(INITIAL_EXERCISE)).not.toBeVisible();
    });
  });

  test.describe("MAX exercise level progression", () => {
    test.use({ profile: createMaxExerciseProfile() });

    test("TOO_EASY on MAX exercise moves the last set two ladder steps", async ({
      page,
    }) => {
      test.setTimeout(120000);
      await mockSupabaseAuth(page);
      await mockWakeLock(page);

      const workoutPage = new WorkoutPage(page);

      await workoutPage.login("test@example.com");
      await workoutPage.expectLoggedIn();

      // First workout: complete with TOO_EASY feedback
      await workoutPage.startWorkout("Tuesday");
      await expect(page.getByText("KH-Bankdrücken (Max-K)")).toBeVisible();
      await workoutPage.beginWorkout();
      await workoutPage.completeWorkout({ lastSetFeedback: "too_easy" });
      await workoutPage.returnToHome();

      // Second workout: verify the last set moved two steps up its ladder
      await workoutPage.startWorkout("Tuesday");
      await workoutPage.beginWorkout();

      const exerciseList = await workoutPage.getGeneratedExerciseList();
      // Filter to MAX exercise entries (exerciseId "8")
      const maxExercises =
        exerciseList?.filter((e: any) => e.exerciseId === "8") ?? [];
      // Last entry is the working set (not warmup)
      const lastSet = maxExercises[maxExercises.length - 1];
      // Advanced set 3 starts at 75% x 2; TOO_EASY moves it two steps to 75% x 5
      const lastMaxFRep =
        lastSet?.maxFRepetitions?.[lastSet.maxFRepetitions.length - 1];
      expect(lastMaxFRep).toEqual(
        expect.objectContaining({ weightPercentage: 75, repetitions: 5 }),
      );
    });
  });
});
