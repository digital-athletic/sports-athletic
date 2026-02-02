import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { expect, test } from "@playwright/test";
import { seedCompletedProfile } from "./mocks/stores";
import { mockSupabaseAuth } from "./mocks/supabase";
import { WorkoutPage } from "./pages";
import {
  expectExerciseTotalsClear,
  waitForAnyExerciseTotals,
  waitForTotalsToChange,
} from "./utils/storage";

/**
 * Expected exercise IDs from the seeded Tuesday workout at Level 1.
 * BEGINNER user starts at branch level 1:
 * - Branch 410 (WU): Level 1 = exercise 431
 * - Branch 22 (SWR1): Level 1 = exercise 118
 */
const EXPECTED_EXERCISE_IDS = ["431", "118"];

test.describe("Exercise Totals Feature", () => {
  test("completing workout updates exercise totals", async ({ page }) => {
    await seedCompletedProfile(page);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);

    await workoutPage.login("test@example.com", "password123");
    await workoutPage.expectLoggedIn();

    // Verify initial totals are empty (clear state before workout)
    await expectExerciseTotalsClear(page);

    // Start and complete workout
    await workoutPage.startWorkout("Tuesday");
    await workoutPage.beginWorkout();
    await workoutPage.completeWorkout();
    await workoutPage.returnToHome();

    // Wait for exercise totals to be persisted
    const finalTotals = await waitForAnyExerciseTotals(page);
    const exerciseIds = Object.keys(finalTotals);

    // Verify expected exercises are present (excluding pause exercise)
    for (const expectedId of EXPECTED_EXERCISE_IDS) {
      expect(
        exerciseIds.includes(expectedId),
        `Exercise ${expectedId} should be in totals`,
      ).toBe(true);
    }

    // Verify pause exercise is NOT in totals
    expect(
      exerciseIds.includes(PAUSE_EXERCISE_ID),
      `Pause exercise ${PAUSE_EXERCISE_ID} should NOT be in totals`,
    ).toBe(false);

    // Verify each exercise has non-negative values
    for (const exerciseId of exerciseIds) {
      const totals = finalTotals[exerciseId];
      expect(totals.weight).toBeGreaterThanOrEqual(0);
      expect(totals.duration).toBeGreaterThanOrEqual(0);
      expect(totals.repetition).toBeGreaterThanOrEqual(0);
      expect(totals.height).toBeGreaterThanOrEqual(0);
    }
  });

  test("exercise totals accumulate across multiple workouts", async ({
    page,
  }) => {
    await seedCompletedProfile(page);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);

    await workoutPage.login("test@example.com", "password123");
    await workoutPage.expectLoggedIn();

    // First workout
    await workoutPage.startWorkout("Tuesday");
    await workoutPage.beginWorkout();
    await workoutPage.completeWorkout();
    await workoutPage.returnToHome();

    // Wait for totals to be persisted and capture first workout values
    const totalsAfterFirst = await waitForAnyExerciseTotals(page, {
      timeoutMs: 15000,
    });

    // Second workout - same day (Tuesday)
    await workoutPage.startWorkout("Tuesday");
    await workoutPage.beginWorkout();
    await workoutPage.completeWorkout();
    await workoutPage.returnToHome();

    // Wait for totals to change (accumulate) from first workout values
    const totalsAfterSecond = await waitForTotalsToChange(
      page,
      totalsAfterFirst,
      { timeoutMs: 15000 },
    );

    // Verify accumulation for exercise 118 (SWR) which appears in both workouts.
    // Note: Warm-up exercise may change between workouts due to branch level progression
    // (e.g., 431 at level 1, 432 at level 2), so we check the consistent SWR exercise.
    const exerciseId = "118";
    const first = totalsAfterFirst[exerciseId];
    const second = totalsAfterSecond[exerciseId];

    expect(
      first,
      `First workout totals for ${exerciseId} should exist`,
    ).toBeDefined();
    expect(
      second,
      `Second workout totals for ${exerciseId} should exist`,
    ).toBeDefined();

    // After two workouts, totals should be approximately doubled
    // (slight variations due to progression adjustments are acceptable)
    expect(second.weight).toBeGreaterThan(first.weight);
    expect(second.repetition).toBeGreaterThan(first.repetition);
    // Duration and height may be 0 for this exercise type
    expect(second.duration).toBeGreaterThanOrEqual(first.duration);
    expect(second.height).toBeGreaterThanOrEqual(first.height);
  });

  test("pause exercises do NOT affect totals", async ({ page }) => {
    await seedCompletedProfile(page);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);

    await workoutPage.login("test@example.com", "password123");
    await workoutPage.expectLoggedIn();
    await workoutPage.startWorkout("Tuesday");
    await workoutPage.beginWorkout();
    await workoutPage.completeWorkout();
    await workoutPage.returnToHome();

    // Wait for totals to be persisted
    const totals = await waitForAnyExerciseTotals(page);
    const exerciseIds = Object.keys(totals);

    // Verify pause exercise ID (999999) is NOT in totals
    expect(
      exerciseIds.includes(PAUSE_EXERCISE_ID),
      `Pause exercise ${PAUSE_EXERCISE_ID} should NOT be in totals`,
    ).toBe(false);

    // Verify only expected workout exercises are in totals
    for (const exerciseId of exerciseIds) {
      expect(
        EXPECTED_EXERCISE_IDS.includes(exerciseId),
        `Exercise ${exerciseId} should be one of the expected workout exercises`,
      ).toBe(true);
    }
  });
});
