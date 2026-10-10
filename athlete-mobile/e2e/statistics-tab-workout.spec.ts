import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import {
  createRadarChartFilteringProfile,
  createWorkoutsProfile,
} from "./mocks/stores/profiles/workoutsProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { BasePage, StatisticsPage, WorkoutPage } from "./pages";

test.describe("Statistics: athlete without workouts", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("shows the empty state with zero totals and zero radar percentages", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const statsPage = new StatisticsPage(page);

    await statsPage.openStatisticsTab();

    await statsPage.expectEmptyState();
    await statsPage.expectTrainingTabActive();
    await statsPage.expectSummaryValues({ duration: 0, weight: 0 });
    await expect(page.getByText("Recent workouts")).not.toBeVisible();
    await statsPage.expectTimeScaleButtonsVisible();

    // The radar chart stays visible and matches the zero values of the summary
    await statsPage.expectRadarChartVisible();
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

test.describe("Statistics: workout completed in the app", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("shows non zero totals after completing a workout", async ({ page }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);
    const statsPage = new StatisticsPage(page);

    await page.goto("/");
    await workoutPage.expectLoggedIn();

    await workoutPage.startWorkout("Tuesday");
    await workoutPage.beginWorkout();
    await workoutPage.completeWorkout();
    await workoutPage.returnToHome();

    await basePage.navigateToTab("Statistics");

    await expect(page.getByText("No trainings yet")).not.toBeVisible();
    await statsPage.expectHasWorkouts();

    const durationNumeric = await statsPage.getDurationSeconds();
    expect(
      durationNumeric,
      `Duration should be > 0, got ${durationNumeric}s`,
    ).toBeGreaterThan(0);

    const countNumeric = await statsPage.getExerciseCount();
    expect(
      countNumeric,
      `Exercise count should be > 0, got ${countNumeric}`,
    ).toBeGreaterThan(0);
  });
});

test.describe("Statistics: athlete with completed workouts", () => {
  test.use({ profile: createWorkoutsProfile(2), signedIn: true });

  test("accumulates totals and shows the summary of each workout row", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const statsPage = new StatisticsPage(page);

    await statsPage.openStatisticsTab();
    await statsPage.expectHasWorkouts();

    await statsPage.expectSummaryValues({
      duration: 3600, // 2 × 1800s
      exerciseCount: 4, // 2 × 2 exercises
      xp: 100, // 2 × 50 XP
      weight: 900, // 2 × 450kg
    });
    await expect(page.getByText("Recent workouts").last()).toBeVisible();

    await statsPage.expectAllWorkoutRowsHaveSummary();
    expect(
      await statsPage.getWorkoutRowDurationSeconds(0),
      "First row duration should be 1800s",
    ).toBe(1800);
    expect(
      await statsPage.getWorkoutRowExerciseCount(0),
      "First row exercise count should be 2",
    ).toBe(2);
    expect(
      await statsPage.getWorkoutRowXp(0),
      "First row XP should be 50",
    ).toBe(50);
    expect(
      await statsPage.getWorkoutRowWeightKg(0),
      "First row weight should be 450kg",
    ).toBe(450);
    expect(
      await statsPage.getWorkoutRowDurationSeconds(1),
      "Second row duration should be 1800s",
    ).toBe(1800);
  });
});

test.describe("Statistics: time scale filter", () => {
  test.use({ profile: createRadarChartFilteringProfile(), signedIn: true });

  // Workouts: 1, 10 and 45 days old, each with 1800s, 50 XP and 450kg
  test("filters summary totals and radar chart percentages by time scale", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const statsPage = new StatisticsPage(page);

    await statsPage.openStatisticsTab();
    await statsPage.expectHasWorkouts();
    await statsPage.expectRadarChartVisible();

    // "Total" (default): all 3 workouts, skill points sum to 300
    await statsPage.expectSummaryValues({
      duration: 5400, // 3 × 1800s
      xp: 150, // 3 × 50
      weight: 1350, // 3 × 450kg
    });
    await statsPage.expectRadarChartLabels({
      Mobility: 25,
      Prevention: 8,
      Endurance: 25,
      Stability: 8,
      "Warm-up": 8,
      Strength: 25,
    });

    // "Last year": all 3 workouts are within one year
    await statsPage.expectSummaryValuesForScale("Last year", {
      duration: 5400,
      xp: 150,
      weight: 1350,
    });

    // "Last month": excludes the 45 day old mobility focused workout, skill points sum to 200
    await statsPage.expectSummaryValuesForScale("Last month", {
      duration: 3600, // 2 × 1800s
      xp: 100, // 2 × 50
      weight: 900, // 2 × 450kg
    });
    await statsPage.expectRadarChartLabels({
      Mobility: 8,
      Prevention: 8,
      Endurance: 34,
      Stability: 8,
      "Warm-up": 8,
      Strength: 34,
    });

    // "Last week": only the strength focused workout, skill points sum to 100
    await statsPage.expectSummaryValuesForScale("Last week", {
      duration: 1800, // 1 × 1800s
      xp: 50, // 1 × 50
      weight: 450, // 1 × 450kg
    });
    await statsPage.expectRadarChartLabels({
      Mobility: 8,
      Prevention: 8,
      Endurance: 8,
      Stability: 8,
      "Warm-up": 8,
      Strength: 60,
    });

    // "Total" restores all workouts
    await statsPage.expectSummaryValuesForScale("Total", { duration: 5400 });
    await statsPage.expectRadarChartLabels({
      Strength: 25,
      Endurance: 25,
      Mobility: 25,
    });
  });
});
