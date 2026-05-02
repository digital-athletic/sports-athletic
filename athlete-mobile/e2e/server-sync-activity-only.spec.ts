import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { WorkoutPage } from "./pages";

/**
 * Guards against the bug where EXERCISE_DATA items queued during training
 * block the COMPLETED_WORKOUT item behind them in activity-only mode.
 *
 * EXPO_PUBLIC_SERVER_SYNC_ENABLED=true and EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED=true
 * are set in playwright.config.ts for all E2E tests.
 */
test.describe("Server Sync — activity-only mode", () => {
  test.use({ profile: createCompletedProfile() });

  test("sends workout summary to Supabase with sensitive fields stripped", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const workoutPage = new WorkoutPage(page);
    await workoutPage.login("test@example.com");
    await workoutPage.expectLoggedIn();
    await workoutPage.startWorkout("Tuesday");

    // Register before the workout so no request is missed
    const workoutSyncRequest = page.waitForRequest(
      (req) =>
        req.url().includes("/rest/v1/user_completed_workouts") &&
        req.method() === "POST",
      { timeout: 15000 },
    );

    await workoutPage.beginWorkout();
    await workoutPage.completeWorkout();

    // Resolves only if the sync reached Supabase; times out if EXERCISE_DATA blocked the queue
    const request = await workoutSyncRequest;

    const raw = JSON.parse(request.postData() ?? "{}") as unknown;
    const row = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>;

    // Activity-only: sensitive data stripped, activity counts preserved
    expect(row).toMatchObject({
      exercises: null,
      xp_earned: null,
      moved_weight: null,
      exercise_count: expect.any(Number),
      duration: expect.any(Number),
    });
  });

  test("does not sync exercise-level data in activity-only mode", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const workoutPage = new WorkoutPage(page);
    await workoutPage.login("test@example.com");
    await workoutPage.expectLoggedIn();
    await workoutPage.startWorkout("Tuesday");

    let exerciseSyncAttempted = false;
    page.on("request", (req) => {
      if (
        req.url().includes("/rest/v1/user_exercises") &&
        req.method() === "POST"
      ) {
        exerciseSyncAttempted = true;
      }
    });

    await workoutPage.beginWorkout();
    await workoutPage.completeWorkout();

    // Give the sync queue time to flush before asserting silence
    await page.waitForTimeout(3000);

    expect(exerciseSyncAttempted).toBe(false);
  });
});
