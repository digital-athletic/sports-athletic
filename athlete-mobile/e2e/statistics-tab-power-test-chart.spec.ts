import { expect, test } from "./fixtures";
import { createCompletedProfileWithoutTestHistory } from "./mocks/stores/profiles/completedProfileWithoutTestHistory";
import {
  createManyPowerTestsProfile,
  createPowerTestChartProfile,
  createSinglePowerTestProfile,
} from "./mocks/stores/profiles/powerTestChartProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage, StatisticsPage, WorkoutPage } from "./pages";

test.describe("Power Test LineChart - Multiple Test Results", () => {
  test.use({ profile: createPowerTestChartProfile() });

  test("displays line chart with 4 test results showing progression", async ({
    page,
  }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);

    await workoutPage.login("test@example.com");
    await workoutPage.expectLoggedIn();

    // Navigate to Statistics tab
    await basePage.navigateToTab("Statistics");
    const statisticsPage = new StatisticsPage(page);

    // Click on Tests tab
    await statisticsPage.clickTestsTab();
    await statisticsPage.expectTestsTabVisible();

    // Verify the line chart is visible
    await statisticsPage.expectPowerTestLineChartVisible();

    // Verify the legend is visible with all 4 exercise labels
    await statisticsPage.expectPowerTestLegendVisible();

    // Verify we have 4 test result entries in the history list
    const testCount = await statisticsPage.getTestResultsCount();
    expect(testCount).toBe(4);

    // Take screenshot for visual verification
    await statisticsPage.screenshotPowerTestChart(
      "power-test-line-chart-multiple-results.png",
    );
  });

  test("test results list entries can be expanded", async ({ page }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);

    await workoutPage.login("test@example.com");
    await workoutPage.expectLoggedIn();

    await basePage.navigateToTab("Statistics");
    const statisticsPage = new StatisticsPage(page);

    await statisticsPage.clickTestsTab();
    await statisticsPage.expectTestsTabVisible();

    // Click on first test entry to expand it
    const firstEntry = page.getByTestId("power-test-entry-0");
    await firstEntry.click();

    // Verify expanded content shows exercise values
    // The profile has: knee=115, benchPress=75, rowing=65, shoulderPress=50 for most recent
    await expect(page.getByText("115 kg")).toBeVisible();
    await expect(page.getByText("75 kg")).toBeVisible();
    await expect(page.getByText("65 kg")).toBeVisible();
    await expect(page.getByText("50 kg")).toBeVisible();
  });
});

test.describe("Power Test LineChart - Single Test Result", () => {
  test.use({ profile: createSinglePowerTestProfile() });

  test("displays line chart with single test result (line from origin)", async ({
    page,
  }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);

    await workoutPage.login("test@example.com");
    await workoutPage.expectLoggedIn();

    await basePage.navigateToTab("Statistics");
    const statisticsPage = new StatisticsPage(page);

    await statisticsPage.clickTestsTab();
    await statisticsPage.expectTestsTabVisible();

    // Verify the line chart is visible even with a single data point
    await statisticsPage.expectPowerTestLineChartVisible();

    // Verify legend is visible
    await statisticsPage.expectPowerTestLegendVisible();

    // Verify we have 1 test result entry
    const testCount = await statisticsPage.getTestResultsCount();
    expect(testCount).toBe(1);

    // Take screenshot for visual verification
    await statisticsPage.screenshotPowerTestChart(
      "power-test-line-chart-single-result.png",
    );
  });
});

test.describe("Power Test LineChart - Empty State", () => {
  test.use({ profile: createCompletedProfileWithoutTestHistory() });

  test("does not display line chart when no test results exist", async ({
    page,
  }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);

    await workoutPage.login("test@example.com");
    await workoutPage.expectLoggedIn();

    await basePage.navigateToTab("Statistics");
    const statisticsPage = new StatisticsPage(page);

    await statisticsPage.clickTestsTab();
    await statisticsPage.expectTestsTabVisible();

    // Verify empty state is shown
    await statisticsPage.expectNoTestResults();

    // Verify the line chart is NOT visible (empty state shows coaching message)
    await statisticsPage.expectPowerTestLineChartNotVisible();

    // Start test button should still be visible
    await statisticsPage.expectStartTestButtonVisible();

    // Take screenshot for visual verification of empty state
    await page.screenshot({
      path: "playwright/screenshots/power-test-line-chart-empty-state.png",
    });
  });
});

test.describe("Power Test LineChart - Many Data Points (Label Crowding)", () => {
  test.use({ profile: createManyPowerTestsProfile() });

  test("displays chart with 9 test results - tests x-axis label handling", async ({
    page,
  }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);

    await workoutPage.login("test@example.com");
    await workoutPage.expectLoggedIn();

    await basePage.navigateToTab("Statistics");
    const statisticsPage = new StatisticsPage(page);

    await statisticsPage.clickTestsTab();
    await statisticsPage.expectTestsTabVisible();

    // Verify the line chart is visible with many data points
    await statisticsPage.expectPowerTestLineChartVisible();

    // Verify the legend is visible
    await statisticsPage.expectPowerTestLegendVisible();

    // Verify we have 9 test result entries in the history list
    const testCount = await statisticsPage.getTestResultsCount();
    expect(testCount).toBe(9);

    // Take screenshot for visual verification of label crowding behavior
    // This screenshot is key to inspect how the chart handles many x-axis labels
    await statisticsPage.screenshotPowerTestChart(
      "power-test-line-chart-many-data-points.png",
    );

    // Also take a full-page screenshot to see overall layout
    await page.screenshot({
      path: "playwright/screenshots/power-test-line-chart-many-data-points-full.png",
      fullPage: true,
    });
  });

  test("most recent entry shows highest values after progression", async ({
    page,
  }) => {
    test.setTimeout(30000);
    await mockSupabaseAuth(page);

    const workoutPage = new WorkoutPage(page);
    const basePage = new BasePage(page);

    await workoutPage.login("test@example.com");
    await workoutPage.expectLoggedIn();

    await basePage.navigateToTab("Statistics");
    const statisticsPage = new StatisticsPage(page);

    await statisticsPage.clickTestsTab();
    await statisticsPage.expectTestsTabVisible();

    // Click on first (most recent) test entry to expand it
    const firstEntry = page.getByTestId("power-test-entry-0");
    await firstEntry.click();

    // Verify expanded content shows the highest values from the progression
    // Most recent: knee=140, benchPress=100, rowing=85, shoulderPress=65
    // Use scoped locators to avoid matching Y-axis labels
    await expect(firstEntry.getByText("140 kg")).toBeVisible();
    await expect(firstEntry.getByText("100 kg")).toBeVisible();
    await expect(firstEntry.getByText("85 kg")).toBeVisible();
    await expect(firstEntry.getByText("65 kg")).toBeVisible();
  });
});
