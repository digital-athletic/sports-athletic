import { expect, test } from "./fixtures";
import { createCompletedProfileWithoutTestHistory } from "./mocks/stores/profiles/completedProfileWithoutTestHistory";
import {
  createManyPowerTestsProfile,
  createPowerTestChartProfile,
  createSinglePowerTestProfile,
} from "./mocks/stores/profiles/powerTestChartProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { StatisticsPage } from "./pages";

test.describe("Power test line chart: multiple test results", () => {
  test.use({ profile: createPowerTestChartProfile(), signedIn: true });

  test("shows the progression of 4 test results and expands the latest one", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const statsPage = new StatisticsPage(page);

    await statsPage.openStatisticsTab();
    await statsPage.clickTestsTab();
    await statsPage.expectTestsTabVisible();

    await statsPage.expectPowerTestLineChartVisible();
    await statsPage.expectPowerTestLegendVisible();
    expect(await statsPage.getTestResultsCount()).toBe(4);

    // Most recent result: knee=115, benchPress=75, rowing=65, shoulderPress=50
    await page.getByTestId("power-test-entry-0").click();
    await expect(page.getByText("115 kg")).toBeVisible();
    await expect(page.getByText("75 kg")).toBeVisible();
    await expect(page.getByText("65 kg")).toBeVisible();
    await expect(page.getByText("50 kg")).toBeVisible();
  });
});

test.describe("Power test line chart: single test result", () => {
  test.use({ profile: createSinglePowerTestProfile(), signedIn: true });

  test("draws the line from the origin for one test result", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const statsPage = new StatisticsPage(page);

    await statsPage.openStatisticsTab();
    await statsPage.clickTestsTab();
    await statsPage.expectTestsTabVisible();

    await statsPage.expectPowerTestLineChartVisible();
    await statsPage.expectPowerTestLegendVisible();
    expect(await statsPage.getTestResultsCount()).toBe(1);
  });
});

test.describe("Power test line chart: no test history", () => {
  test.use({
    profile: createCompletedProfileWithoutTestHistory(),
    signedIn: true,
  });

  test("shows the empty state without a chart and offers a new test", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const statsPage = new StatisticsPage(page);

    await statsPage.openStatisticsTab();
    await statsPage.clickTestsTab();
    await statsPage.expectTestsTabVisible();

    await statsPage.expectNoTestResults();
    await statsPage.expectPowerTestLineChartNotVisible();
    await statsPage.expectStartTestButtonVisible();
  });
});

test.describe("Power test line chart: many test results", () => {
  test.use({ profile: createManyPowerTestsProfile(), signedIn: true });

  test("shows 9 test results with crowded x axis labels and expands the latest one", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const statsPage = new StatisticsPage(page);

    await statsPage.openStatisticsTab();
    await statsPage.clickTestsTab();
    await statsPage.expectTestsTabVisible();

    await statsPage.expectPowerTestLineChartVisible();
    await statsPage.expectPowerTestLegendVisible();
    expect(await statsPage.getTestResultsCount()).toBe(9);

    // Most recent result: knee=140, benchPress=100, rowing=85, shoulderPress=65.
    // Scoped to the entry to avoid matching y axis labels.
    const firstEntry = page.getByTestId("power-test-entry-0");
    await firstEntry.click();
    await expect(firstEntry.getByText("140 kg")).toBeVisible();
    await expect(firstEntry.getByText("100 kg")).toBeVisible();
    await expect(firstEntry.getByText("85 kg")).toBeVisible();
    await expect(firstEntry.getByText("65 kg")).toBeVisible();
  });
});
