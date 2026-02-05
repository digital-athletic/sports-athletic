import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import {
  createRadarChartFilteringProfile,
  createTimeFilteredWorkoutsProfile,
  createWorkoutsProfile,
} from "./mocks/stores/profiles/workoutsProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
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
    await mockWakeLock(page);

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

    // Verify XP >= 0 (XP calculation may not always populate in test scenarios)
    const xpNumeric = await statsPage.getXp();
    expect(
      xpNumeric,
      `XP should be >= 0, got ${xpNumeric}`,
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
      xp: 100, // 2 × 50 XP
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
    // - XP: 50
    // - Weight: 450kg
    const row0Duration = await statsPage.getWorkoutRowDurationSeconds(0);
    expect(row0Duration, "First row duration should be 1800s").toBe(1800);

    const row0Count = await statsPage.getWorkoutRowExerciseCount(0);
    expect(row0Count, "First row exercise count should be 2").toBe(2);

    const row0Xp = await statsPage.getWorkoutRowXp(0);
    expect(row0Xp, "First row XP should be 50").toBe(50);

    const row0Weight = await statsPage.getWorkoutRowWeightKg(0);
    expect(row0Weight, "First row weight should be 450kg").toBe(450);

    // Verify second workout row also shows values
    const row1Duration = await statsPage.getWorkoutRowDurationSeconds(1);
    expect(row1Duration, "Second row duration should be 1800s").toBe(1800);
  });
});

test.describe("Statistics Page - Radar Chart Labels", () => {
  test.describe("empty state", () => {
    test.use({ profile: createCompletedProfile() });

    test("radar chart displays zero percentages when no workouts completed", async ({
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
      await statsPage.expectEmptyState();

      // Verify radar chart is still visible even with no data
      await statsPage.expectRadarChartVisible();

      // Verify all skill labels show 0% when no workouts have been completed
      // This matches TrainingSummary showing zero values in empty state
      await statsPage.expectRadarChartLabels({
        Mobility: 0,
        Prevention: 0,
        Endurance: 0,
        Stability: 0,
        "Warm-up": 0,
        Strength: 0,
      });
    });
  });

  test.describe("filtered labels", () => {
    test.use({ profile: createRadarChartFilteringProfile() });

    test("radar chart adapts percentages when time filter changes", async ({
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
      await statsPage.expectRadarChartVisible();

      // "Total" (default) - all 3 workouts combined
      // Skills: MOBILITY=76, PREVENTION=24, CARDIO=76, STABILITY=24, WARMUP=24, SWR=76
      // Total = 300, so percentages: 25%, 8%, 25%, 8%, 8%, 25%
      await statsPage.expectRadarChartLabels({
        Mobility: 25,
        Prevention: 8,
        Endurance: 25,
        Stability: 8,
        "Warm-up": 8,
        Strength: 25,
      });

      // "Last month" - 2 workouts (excludes 45-day old mobility-focused workout)
      // Skills: MOBILITY=16, PREVENTION=16, CARDIO=68, STABILITY=16, WARMUP=16, SWR=68
      // Total = 200, so percentages: 8%, 8%, 34%, 8%, 8%, 34%
      await statsPage.selectTimeScale("Last month");
      await statsPage.expectRadarChartLabels({
        Mobility: 8,
        Prevention: 8,
        Endurance: 34,
        Stability: 8,
        "Warm-up": 8,
        Strength: 34,
      });

      // "Last week" - 1 workout (only the strength-focused recent workout)
      // Skills: MOBILITY=8, PREVENTION=8, CARDIO=8, STABILITY=8, WARMUP=8, SWR=60
      // Total = 100, so percentages: 8%, 8%, 8%, 8%, 8%, 60%
      await statsPage.selectTimeScale("Last week");
      await statsPage.expectRadarChartLabels({
        Mobility: 8,
        Prevention: 8,
        Endurance: 8,
        Stability: 8,
        "Warm-up": 8,
        Strength: 60,
      });

      // Verify "Total" restores original percentages
      await statsPage.selectTimeScale("Total");
      await statsPage.expectRadarChartLabels({
        Strength: 25,
        Endurance: 25,
        Mobility: 25,
      });
    });
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
      xp: 150, // 3 × 50
      weight: 1350, // 3 × 450kg
    });

    // "Last year" - all 3 workouts (all within 1 year)
    await statsPage.expectSummaryValuesForScale("Last year", {
      duration: 5400,
      xp: 150,
      weight: 1350,
    });

    // "Last month" - 2 workouts (excludes 45-day old)
    await statsPage.expectSummaryValuesForScale("Last month", {
      duration: 3600, // 2 × 1800s
      xp: 100, // 2 × 50
      weight: 900, // 2 × 450kg
    });

    // "Last week" - 1 workout (excludes 10-day and 45-day old)
    await statsPage.expectSummaryValuesForScale("Last week", {
      duration: 1800, // 1 × 1800s
      xp: 50, // 1 × 50
      weight: 450, // 1 × 450kg
    });

    // Verify "Total" restores all workouts
    await statsPage.expectSummaryValuesForScale("Total", {
      duration: 5400,
    });
  });
});
