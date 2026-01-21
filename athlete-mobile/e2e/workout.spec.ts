import { expect, test } from "@playwright/test";
import {
  seedCompletedProfile,
  seedProfileAtBranchThreshold,
} from "./mocks/stores";
import { mockSupabaseAuth } from "./mocks/supabase";
import { WorkoutPage } from "./pages";

test.describe("Workout Flow", () => {
  const EXERCISE_NAME = "KH-Frontkniebeuge";
  const EXPECTED_INITIAL_REPS = 10;
  const EXPECTED_INITIAL_WEIGHT = 15;
  const EXPECTED_AFTER_REPS = 11;
  const EXPECTED_AFTER_WEIGHT = 16;

  test("complete workout and verify weight progression", async ({ page }) => {
    test.setTimeout(60000);

    await seedCompletedProfile(page);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);

    await workoutPage.login("test@example.com", "password123");
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
    const EXPECTED_TOO_EASY_WEIGHT = 17;

    await seedCompletedProfile(page);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);

    await workoutPage.login("test@example.com", "password123");
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

  test("clicking 'too hard' on last set decreases weight", async ({ page }) => {
    test.setTimeout(60000);

    const EXPECTED_TOO_HARD_REPS = 9;
    const EXPECTED_TOO_HARD_WEIGHT = 14;

    await seedCompletedProfile(page);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);

    await workoutPage.login("test@example.com", "password123");
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

  test("completing workout at max threshold triggers branch level up to new exercise", async ({
    page,
  }) => {
    test.setTimeout(60000);

    const INITIAL_EXERCISE = "KH-Frontkniebeuge";
    const UPGRADED_EXERCISE = "LH-Frontkniebeuge";

    await seedProfileAtBranchThreshold(page);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);

    await workoutPage.login("test@example.com", "password123");
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
