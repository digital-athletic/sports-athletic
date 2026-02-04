import { expect, type Page } from "@playwright/test";
import { parseTimeString, parseWeightString } from "../utils/storage";
import { BasePage } from "./BasePage";

type TimeScale = "Last week" | "Last month" | "Last year" | "Total";

/**
 * Expected radar chart label values.
 * Keys are the translated skill names, values are expected percentages.
 */
export interface RadarChartLabelExpectations {
  Mobility?: number;
  Prevention?: number;
  Endurance?: number; // CARDIO in the data model
  Stability?: number;
  "Warm-up"?: number; // WARMUP in the data model
  Strength?: number; // SWR in the data model
}

/**
 * Expected summary values for assertions.
 * All fields are optional - only provided fields will be verified.
 */
export interface SummaryExpectations {
  /** Expected duration in seconds */
  duration?: number;
  /** Expected XP */
  xp?: number;
  /** Expected moved weight in kg */
  weight?: number;
  /** Expected exercise count */
  exerciseCount?: number;
}

export class StatisticsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Extracts text value from a summary section by label.
   * The TrainingSummary component shows label and value in a column layout.
   * Uses parent traversal to find the value element adjacent to the label.
   */
  private async getSummaryValueFromContainer(
    container: ReturnType<Page["locator"]>,
    label: string,
  ): Promise<string> {
    const section = container
      .locator(`text=${label}`)
      .locator("..")
      .locator("..");
    const valueLocator = section.locator(
      "text=/^[0-9]|^\\d+\\s*(s|min|h|kg|t)/",
    );
    const text = await valueLocator.first().textContent();
    return text?.trim() ?? "0";
  }

  /**
   * Gets the overall summary container using testID.
   */
  private getOverallSummary() {
    return this.page.getByTestId("overall-summary");
  }

  /**
   * Extracts text value from the overall summary by label.
   */
  async getSummaryValue(label: string): Promise<string> {
    return this.getSummaryValueFromContainer(this.getOverallSummary(), label);
  }

  /**
   * Gets duration from summary as numeric seconds.
   */
  async getDurationSeconds(): Promise<number> {
    const text = await this.getSummaryValue("Duration");
    return parseTimeString(text);
  }

  /**
   * Gets exercise count from summary.
   */
  async getExerciseCount(): Promise<number> {
    const text = await this.getSummaryValue("Exercise count");
    return parseInt(text.match(/(\d+)/)?.[1] ?? "0", 10);
  }

  /**
   * Gets XP from summary.
   */
  async getXp(): Promise<number> {
    const text = await this.getSummaryValue("Points");
    return parseInt(text.match(/(\d+)/)?.[1] ?? "0", 10);
  }

  /**
   * Gets moved weight from summary as numeric kg.
   */
  async getMovedWeightKg(): Promise<number> {
    const text = await this.getSummaryValue("Moved weight");
    return parseWeightString(text);
  }

  /**
   * Verifies the overall summary matches expected values.
   * Only provided fields are verified.
   */
  async expectSummaryValues(expected: SummaryExpectations): Promise<void> {
    if (expected.duration) {
      const actual = await this.getDurationSeconds();
      expect(actual, `Duration should be ${expected.duration}s`).toBe(
        expected.duration,
      );
    }
    if (expected.xp) {
      const actual = await this.getXp();
      expect(actual, `XP should be ${expected.xp}`).toBe(expected.xp);
    }
    if (expected.weight) {
      const actual = await this.getMovedWeightKg();
      expect(actual, `Weight should be ${expected.weight}kg`).toBe(
        expected.weight,
      );
    }
    if (expected.exerciseCount) {
      const actual = await this.getExerciseCount();
      expect(actual, `Exercise count should be ${expected.exerciseCount}`).toBe(
        expected.exerciseCount,
      );
    }
  }

  /**
   * Selects a time scale and verifies the summary matches expected values.
   * Convenience method combining selectTimeScale() and expectSummaryValues().
   */
  async expectSummaryValuesForScale(
    scale: TimeScale,
    expected: SummaryExpectations,
  ): Promise<void> {
    await this.selectTimeScale(scale);
    await this.expectSummaryValues(expected);
  }

  /**
   * Verifies the empty state is displayed (no workouts completed).
   */
  async expectEmptyState(): Promise<void> {
    await expect(this.page.getByTestId("no-workouts-message")).toBeVisible();
  }

  /**
   * Verifies workouts are displayed (at least one workout completed).
   */
  async expectHasWorkouts(): Promise<void> {
    await expect(
      this.page.getByTestId("workouts-list-container"),
    ).toBeVisible();
  }

  /**
   * Selects a time scale filter button.
   */
  async selectTimeScale(scale: TimeScale): Promise<void> {
    await this.page.getByText(scale).click();
  }

  /**
   * Verifies all time scale buttons are visible.
   */
  async expectTimeScaleButtonsVisible(): Promise<void> {
    await expect(this.page.getByText("Last week")).toBeVisible();
    await expect(this.page.getByText("Last month")).toBeVisible();
    await expect(this.page.getByText("Last year")).toBeVisible();
    await expect(this.page.getByText("Total")).toBeVisible();
  }

  /**
   * Verifies the Training tab is active.
   */
  async expectTrainingTabActive(): Promise<void> {
    await expect(
      this.page.getByRole("tab", { name: "Training", exact: true }),
    ).toBeVisible();
  }

  /**
   * Clicks on the Workouts tab.
   */
  async clickWorkoutsTab(): Promise<void> {
    await this.page.getByTestId("statistics-tab-workouts").click();
  }

  /**
   * Clicks on the Tests tab.
   */
  async clickTestsTab(): Promise<void> {
    await this.page.getByTestId("statistics-tab-tests").click();
  }

  /**
   * Verifies the Tests (PowerTest) container is visible.
   */
  async expectTestsTabVisible(): Promise<void> {
    await expect(this.page.getByTestId("power-test-container")).toBeVisible();
  }

  /**
   * Verifies the Workouts container is NOT visible (hidden when Tests tab active).
   */
  async expectWorkoutsContainerNotVisible(): Promise<void> {
    await expect(
      this.page.getByTestId("workouts-list-container"),
    ).not.toBeVisible();
    await expect(
      this.page.getByTestId("no-workouts-message"),
    ).not.toBeVisible();
  }

  /**
   * Verifies the empty state for test results is displayed.
   */
  async expectNoTestResults(): Promise<void> {
    await expect(this.page.getByTestId("power-test-no-results")).toBeVisible();
  }

  /**
   * Verifies test results are displayed (at least one test completed).
   */
  async expectHasTestResults(): Promise<void> {
    await expect(
      this.page.getByTestId("power-test-results-container"),
    ).toBeVisible();
  }

  /**
   * Gets all power test entry locators.
   */
  getPowerTestEntries() {
    return this.page.locator('[data-testid^="power-test-entry-"]');
  }

  /**
   * Gets the number of test result entries.
   */
  async getTestResultsCount(): Promise<number> {
    return this.getPowerTestEntries().count();
  }

  /**
   * Verifies the "Start New Test" button is visible.
   */
  async expectStartTestButtonVisible(): Promise<void> {
    await expect(
      this.page.getByTestId("power-test-start-button"),
    ).toBeVisible();
  }

  /**
   * Gets all workout row locators using testID prefix matching.
   */
  getWorkoutRows() {
    return this.page.locator(
      '[data-testid^="workout-row-"]:not([data-testid$="-summary"]):not([data-testid$="-test-label"])',
    );
  }

  /**
   * Gets a specific workout row by index.
   */
  getWorkoutRow(index: number) {
    return this.getWorkoutRows().nth(index);
  }

  /**
   * Gets the workout row's testID to extract the workout ID.
   */
  private async getWorkoutIdFromRow(
    row: ReturnType<Page["locator"]>,
  ): Promise<string> {
    const testId = await row.getAttribute("data-testid");
    // Extract ID from "workout-row-{id}"
    return testId?.replace("workout-row-", "") ?? "";
  }

  /**
   * Gets the TrainingSummary values for a specific workout row by index.
   * Returns null if the row shows "Test Workout" instead of summary.
   */
  async getWorkoutRowSummary(rowIndex: number): Promise<{
    duration: string;
    count: string;
    xp: string;
    weight: string;
  } | null> {
    const row = this.getWorkoutRow(rowIndex);
    const workoutId = await this.getWorkoutIdFromRow(row);

    // Check if this row has a test label (no summary)
    const testLabel = this.page.getByTestId(
      `workout-row-${workoutId}-test-label`,
    );
    if (await testLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
      return null;
    }

    // Check if this row has a summary
    const summary = this.page.getByTestId(`workout-row-${workoutId}-summary`);
    if (!(await summary.isVisible({ timeout: 1000 }).catch(() => false))) {
      return null;
    }

    // Extract values from the summary
    return {
      duration: await this.getSummaryValueFromContainer(summary, "Duration"),
      count: await this.getSummaryValueFromContainer(summary, "Exercise count"),
      xp: await this.getSummaryValueFromContainer(summary, "Points"),
      weight: await this.getSummaryValueFromContainer(summary, "Moved weight"),
    };
  }

  /**
   * Verifies that a workout row displays its TrainingSummary (not "Test Workout").
   */
  async expectWorkoutRowHasSummary(rowIndex: number): Promise<void> {
    const row = this.getWorkoutRow(rowIndex);
    const workoutId = await this.getWorkoutIdFromRow(row);

    const summary = this.page.getByTestId(`workout-row-${workoutId}-summary`);
    await expect(
      summary,
      `Workout row ${rowIndex} (id: ${workoutId}) should display TrainingSummary`,
    ).toBeVisible();
  }

  /**
   * Verifies that all visible workout rows display their TrainingSummary.
   */
  async expectAllWorkoutRowsHaveSummary(): Promise<void> {
    const rows = this.getWorkoutRows();
    const count = await rows.count();

    expect(count, "Should have at least one workout row").toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await this.expectWorkoutRowHasSummary(i);
    }
  }

  /**
   * Gets the duration value from a specific workout row as numeric seconds.
   */
  async getWorkoutRowDurationSeconds(rowIndex: number): Promise<number> {
    const summary = await this.getWorkoutRowSummary(rowIndex);
    if (!summary) return 0;
    return parseTimeString(summary.duration);
  }

  /**
   * Gets the exercise count from a specific workout row.
   */
  async getWorkoutRowExerciseCount(rowIndex: number): Promise<number> {
    const summary = await this.getWorkoutRowSummary(rowIndex);
    if (!summary) return 0;
    return parseInt(summary.count.match(/(\d+)/)?.[1] ?? "0", 10);
  }

  /**
   * Gets the XP from a specific workout row.
   */
  async getWorkoutRowXp(rowIndex: number): Promise<number> {
    const summary = await this.getWorkoutRowSummary(rowIndex);
    if (!summary) return 0;
    return parseInt(summary.xp.match(/(\d+)/)?.[1] ?? "0", 10);
  }

  /**
   * Gets the weight from a specific workout row as numeric kg.
   */
  async getWorkoutRowWeightKg(rowIndex: number): Promise<number> {
    const summary = await this.getWorkoutRowSummary(rowIndex);
    if (!summary) return 0;
    return parseWeightString(summary.weight);
  }

  /**
   * Gets the radar chart container.
   */
  getRadarChartContainer() {
    return this.page.getByTestId("radar-chart-container");
  }

  /**
   * Verifies the radar chart is visible.
   */
  async expectRadarChartVisible(): Promise<void> {
    await expect(this.getRadarChartContainer()).toBeVisible();
  }

  /**
   * Extracts the percentage from a radar chart label.
   * Labels are formatted as "Skill Name\nXX%"
   */
  private parseRadarChartLabelPercentage(labelText: string): number {
    const match = labelText.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Gets the percentage value for a specific skill label in the radar chart.
   * The radar chart uses SVG text elements with tspans for multiline labels.
   *
   * DOM structure: SVG text element contains "SkillName\nXX%" rendered as tspans.
   * We find the skill name, traverse to parent text element, and extract percentage.
   */
  async getRadarChartSkillPercentage(skillName: string): Promise<number> {
    const chartContainer = this.getRadarChartContainer();

    // Find the skill name text within the radar chart
    const skillLabel = chartContainer.getByText(skillName, { exact: true });
    await expect(
      skillLabel,
      `Radar chart should display ${skillName} label`,
    ).toBeVisible({ timeout: 5000 });

    // The label is formatted as "SkillName\nXX%" which renders as tspans inside SVG text
    // Navigate to parent text element to get the full content including percentage
    const parent = skillLabel.locator("..");
    const percentageText = await parent.textContent();

    if (percentageText) {
      return this.parseRadarChartLabelPercentage(percentageText);
    }

    return 0;
  }

  /**
   * Verifies all provided radar chart labels match expected percentages.
   * Only provided fields are verified.
   */
  async expectRadarChartLabels(
    expected: RadarChartLabelExpectations,
  ): Promise<void> {
    for (const [skillName, expectedPercentage] of Object.entries(expected)) {
      if (expectedPercentage !== undefined) {
        const actual = await this.getRadarChartSkillPercentage(skillName);
        expect(
          actual,
          `${skillName} percentage should be ${expectedPercentage}%`,
        ).toBe(expectedPercentage);
      }
    }
  }

  // ==================== Power Test LineChart Methods ====================

  /**
   * Gets the power test line chart container.
   */
  getPowerTestLineChart() {
    return this.page.getByTestId("power-test-line-chart");
  }

  /**
   * Verifies the power test line chart is visible.
   */
  async expectPowerTestLineChartVisible(): Promise<void> {
    await expect(
      this.getPowerTestLineChart(),
      "Power test line chart should be visible",
    ).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verifies the power test line chart is NOT visible (empty state).
   */
  async expectPowerTestLineChartNotVisible(): Promise<void> {
    await expect(
      this.getPowerTestLineChart(),
      "Power test line chart should not be visible in empty state",
    ).not.toBeVisible();
  }

  /**
   * Verifies the legend items are visible for the power test chart.
   * Legend items: Kniebeuge (Squad), Bankdrücken (Bench Press), Rudern (Rowing), Schulterdrücken (Shoulder Press)
   */
  async expectPowerTestLegendVisible(): Promise<void> {
    const container = this.page.getByTestId("power-test-container");
    // English legend labels from translations
    await expect(container.getByText("Squat")).toBeVisible();
    await expect(container.getByText("Bench press")).toBeVisible();
    await expect(container.getByText("Rowing")).toBeVisible();
    await expect(container.getByText("Shoulder press")).toBeVisible();
  }

  /**
   * Takes a screenshot of the power test section for visual verification.
   */
  async screenshotPowerTestChart(filename: string): Promise<void> {
    const container = this.page.getByTestId("power-test-container");
    await container.screenshot({
      path: `playwright/screenshots/${filename}`,
    });
  }
}
