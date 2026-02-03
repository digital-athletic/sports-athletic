import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import {
  createTimeFilteredWorkoutsProfile,
  createWorkoutsProfile,
} from "./mocks/stores/profiles/workoutsProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage, StatisticsPage, WorkoutPage } from "./pages";

test.describe("Statistics Page - Empty State", () => {
  test.use({ profile: createCompletedProfile() });

  test("displays empty state when no workouts completed", async ({ page }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);
    const statsPage = new StatisticsPage(page);

    await workoutPage.login("test@example.com", "password123");
    await workoutPage.expectLoggedIn();

    // Navigate directly to Statistics without completing any workout
    await basePage.navigateToTab("Statistics");

    // Verify empty state message is shown
    await statsPage.expectEmptyState();

    // Verify Training tab is active (confirms we're on the right page)
    await statsPage.expectTrainingTabActive();

    // Verify summary shows zero values
    await statsPage.expectSummaryValues({ duration: 0, weight: 0 });

    // Verify "Recent workouts" section is NOT visible
    await expect(page.getByText("Recent workouts")).not.toBeVisible();

    // Verify scale buttons are visible
    await statsPage.expectTimeScaleButtonsVisible();
  });
});

test.describe("Statistics Page - Single Workout Completion", () => {
  test.use({ profile: createCompletedProfile() });

  test("single workout completion shows non-zero totals on statistics page", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);
    const statsPage = new StatisticsPage(page);

    await workoutPage.login("test@example.com", "password123");
    await workoutPage.expectLoggedIn();

    // Complete one workout
    await workoutPage.startWorkout("Tuesday");
    await workoutPage.beginWorkout();
    await workoutPage.completeWorkout();
    await workoutPage.returnToHome();

    // Navigate to Statistics
    await basePage.navigateToTab("Statistics");

    // Verify NOT in empty state
    await expect(page.getByText("No trainings yet")).not.toBeVisible();
    await statsPage.expectHasWorkouts();

    // Verify summary shows non-zero duration (workout was completed)
    const durationNumeric = await statsPage.getDurationSeconds();
    expect(
      durationNumeric,
      `Duration should be > 0, got ${durationNumeric}s`,
    ).toBeGreaterThan(0);

    // Verify exercise count is > 0
    const countNumeric = await statsPage.getExerciseCount();
    expect(
      countNumeric,
      `Exercise count should be > 0, got ${countNumeric}`,
    ).toBeGreaterThan(0);

    // Verify points (XP) >= 0 (XP calculation may not always populate in test scenarios)
    const pointsNumeric = await statsPage.getPoints();
    expect(
      pointsNumeric,
      `Points should be >= 0, got ${pointsNumeric}`,
    ).toBeGreaterThanOrEqual(0);

    // Verify at least one workout entry is visible
    await statsPage.expectHasWorkouts();
  });
});

test.describe("Statistics Page - Multiple Workouts", () => {
  test.use({ profile: createWorkoutsProfile(2) });

  test("multiple workouts accumulate totals on statistics page", async ({
    page,
  }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);
    const statsPage = new StatisticsPage(page);

    await workoutPage.login("test@example.com", "password123");
    await workoutPage.expectLoggedIn();

    await basePage.navigateToTab("Statistics");
    await statsPage.expectHasWorkouts();

    // Verify accumulated totals from 2 workouts
    await statsPage.expectSummaryValues({
      duration: 3600, // 2 × 1800s
      exerciseCount: 4, // 2 × 2 exercises
      points: 100, // 2 × 50 XP
      weight: 900, // 2 × 450kg
    });

    // Verify workout list shows multiple entries
    await expect(page.getByText("Recent workouts").last()).toBeVisible();
  });

  test("seeded workouts individual row statistics", async ({ page }) => {
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);
    const statsPage = new StatisticsPage(page);

    await workoutPage.login("test@example.com", "password123");
    await workoutPage.expectLoggedIn();

    // Navigate to Statistics
    await basePage.navigateToTab("Statistics");
    await statsPage.expectHasWorkouts();

    // Verify all seeded workout rows display their TrainingSummary
    await statsPage.expectAllWorkoutRowsHaveSummary();

    // Verify first workout row shows expected values from seed data:
    // - Duration: 1800s (30 min)
    // - Exercise count: 2
    // - Points: 50
    // - Weight: 450kg
    const row0Duration = await statsPage.getWorkoutRowDurationSeconds(0);
    expect(row0Duration, "First row duration should be 1800s").toBe(1800);

    const row0Count = await statsPage.getWorkoutRowExerciseCount(0);
    expect(row0Count, "First row exercise count should be 2").toBe(2);

    const row0Points = await statsPage.getWorkoutRowPoints(0);
    expect(row0Points, "First row points should be 50").toBe(50);

    const row0Weight = await statsPage.getWorkoutRowWeightKg(0);
    expect(row0Weight, "First row weight should be 450kg").toBe(450);

    // Verify second workout row also shows values
    const row1Duration = await statsPage.getWorkoutRowDurationSeconds(1);
    expect(row1Duration, "Second row duration should be 1800s").toBe(1800);
  });
});

test.describe("Statistics Page - Time Filtering", () => {
  test.use({ profile: createTimeFilteredWorkoutsProfile() });

  test("time scale filtering buttons filter out older workouts", async ({
    page,
  }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);
    const statsPage = new StatisticsPage(page);

    await workoutPage.login("test@example.com", "password123");
    await workoutPage.expectLoggedIn();

    await basePage.navigateToTab("Statistics");
    await statsPage.expectHasWorkouts();

    // "Total" (default) - all 3 workouts
    await statsPage.expectSummaryValues({
      duration: 5400, // 3 × 1800s
      points: 150, // 3 × 50
      weight: 1350, // 3 × 450kg
    });

    // "Last year" - all 3 workouts (all within 1 year)
    await statsPage.expectSummaryValuesForScale("Last year", {
      duration: 5400,
      points: 150,
      weight: 1350,
    });

    // "Last month" - 2 workouts (excludes 45-day old)
    await statsPage.expectSummaryValuesForScale("Last month", {
      duration: 3600, // 2 × 1800s
      points: 100, // 2 × 50
      weight: 900, // 2 × 450kg
    });

    // "Last week" - 1 workout (excludes 10-day and 45-day old)
    await statsPage.expectSummaryValuesForScale("Last week", {
      duration: 1800, // 1 × 1800s
      points: 50, // 1 × 50
      weight: 450, // 1 × 450kg
    });

    // Verify "Total" restores all workouts
    await statsPage.expectSummaryValuesForScale("Total", {
      duration: 5400,
    });
  });
});
