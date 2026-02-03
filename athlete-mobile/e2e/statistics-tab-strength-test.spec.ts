import { expect, test } from "./fixtures";
import { createWorkoutsProfile } from "./mocks/stores/profiles/workoutsProfile";
import { createCompletedProfileWithoutTestHistory } from "./mocks/stores/profiles/completedProfileWithoutTestHistory";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage, StatisticsPage, WorkoutPage } from "./pages";

test.describe("Statistics Tabs - Tests with workouts profile", () => {
  test.use({ profile: createWorkoutsProfile(3) });

  test("clicking Tests tab shows only test results, not workouts", async ({
    page,
  }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);

    await workoutPage.login("test@example.com", "password123");
    await workoutPage.expectLoggedIn();

    // Navigate to Statistics tab
    await basePage.navigateToTab("Statistics");
    const statisticsPage = new StatisticsPage(page);

    // Verify Workouts tab is shown by default
    await statisticsPage.expectHasWorkouts();

    // Click on Tests tab
    await statisticsPage.clickTestsTab();

    // Verify Tests content is visible
    await statisticsPage.expectTestsTabVisible();
    await statisticsPage.expectHasTestResults();
    await statisticsPage.expectStartTestButtonVisible();

    // Verify Workouts content is NOT visible
    await statisticsPage.expectWorkoutsContainerNotVisible();

    // Verify test results count matches seeded data (1 test result from completedProfile)
    const testCount = await statisticsPage.getTestResultsCount();
    expect(testCount).toBeGreaterThan(0);
  });
});

test.describe("Statistics Tabs - Tab switching with workouts", () => {
  test.use({ profile: createWorkoutsProfile(2) });

  test("switching between Workouts and Tests tabs shows correct content", async ({
    page,
  }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);

    await workoutPage.login("test@example.com", "password123");
    await workoutPage.expectLoggedIn();

    await basePage.navigateToTab("Statistics");
    const statisticsPage = new StatisticsPage(page);

    // Start on Workouts tab
    await statisticsPage.expectHasWorkouts();

    // Switch to Tests tab
    await statisticsPage.clickTestsTab();
    await statisticsPage.expectTestsTabVisible();
    await statisticsPage.expectWorkoutsContainerNotVisible();

    // Switch back to Workouts tab
    await statisticsPage.clickWorkoutsTab();
    await statisticsPage.expectHasWorkouts();

    // Verify Tests container is no longer visible
    await expect(page.getByTestId("power-test-container")).not.toBeVisible();
  });
});

test.describe("Statistics Tabs - Empty test history", () => {
  test.use({ profile: createCompletedProfileWithoutTestHistory() });

  test("Tests tab shows empty state when no test results exist", async ({
    page,
  }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);

    await workoutPage.login("test@example.com", "password123");
    await workoutPage.expectLoggedIn();

    await basePage.navigateToTab("Statistics");
    const statisticsPage = new StatisticsPage(page);

    // Click on Tests tab
    await statisticsPage.clickTestsTab();

    // Verify empty state is shown
    await statisticsPage.expectTestsTabVisible();
    await statisticsPage.expectNoTestResults();
    await statisticsPage.expectStartTestButtonVisible();

    await page.screenshot({
      path: "playwright/screenshots/statistics-tests-tab-empty.png",
    });
  });
});
