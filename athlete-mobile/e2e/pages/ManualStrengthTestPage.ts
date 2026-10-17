import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

type ExerciseKey = "squat" | "benchPress" | "rowing" | "shoulderPress";

export class ManualStrengthTestPage extends BasePage {
  private get saveButton() {
    return this.page.getByTestId("manual-test-save-button");
  }

  private get manualInputButton() {
    return this.page.getByTestId("power-test-manual-input-button");
  }

  private getExerciseSection(exercise: ExerciseKey) {
    return this.page.getByTestId(`manual-test-${exercise}`);
  }

  private getWeightInput(exercise: ExerciseKey) {
    return this.getExerciseSection(exercise).locator("input").first();
  }

  private getRepsInput(exercise: ExerciseKey) {
    return this.getExerciseSection(exercise).locator("input").last();
  }

  /**
   * Navigates to the manual strength test screen via Statistics > Tests tab.
   */
  async navigateFromStatistics() {
    await this.navigateToTab("Statistics");
    await this.page.getByRole("tab", { name: /test/i }).click();
    await expect(this.page.getByTestId("power-test-container")).toBeVisible();
    await this.manualInputButton.click();
    await this.expectScreenVisible();
  }

  /**
   * Navigates to the manual strength test screen via More/Profile screen.
   */
  async navigateFromMore() {
    await this.navigateToTab("Profile");
    await expect(this.page.getByText("Profile").first()).toBeVisible();
    await this.page.getByText("Enter Strength Test Results").click();
    await this.expectScreenVisible();
  }

  /**
   * Verifies the manual strength test screen is displayed.
   */
  async expectScreenVisible() {
    await expect(this.page.getByText("Manual Strength Test")).toBeVisible();
    await expect(this.page.getByText(/enter your test results/i)).toBeVisible();
  }

  /**
   * Verifies all 4 exercise sections are visible.
   */
  async expectAllExerciseSectionsVisible() {
    await expect(this.getExerciseSection("squat")).toBeVisible();
    await expect(this.getExerciseSection("benchPress")).toBeVisible();
    await expect(this.getExerciseSection("rowing")).toBeVisible();
    await expect(this.getExerciseSection("shoulderPress")).toBeVisible();
  }

  /**
   * Fills in weight and reps for an exercise.
   */
  async fillExercise(exercise: ExerciseKey, weight: string, reps: string) {
    await this.getWeightInput(exercise).fill(weight);
    await this.getRepsInput(exercise).fill(reps);
  }

  /**
   * Fills only the weight input for an exercise (leaving reps empty).
   */
  async fillWeightOnly(exercise: ExerciseKey, weight: string) {
    await this.getWeightInput(exercise).fill(weight);
  }

  /**
   * Clicks the save button.
   */
  async save() {
    await this.saveButton.click();
  }

  /**
   * Clicks save and verifies the success/results screen appears.
   */
  async saveAndExpectSuccess() {
    await this.saveButton.click();
    await expect(this.page.getByText("Training evaluation")).toBeVisible();
    const successContainer = this.page
      .getByTestId("power-test-container")
      .last();
    await expect(successContainer).toBeVisible();
    await expect(
      successContainer.getByText("Your Test Results", { exact: true }),
    ).toBeVisible();
    await expect(this.goOnButton).toBeVisible();
  }

  /**
   * Clicks the "Go on" button on the success screen to navigate back.
   */
  async goOn() {
    await this.goOnButton.click();
  }

  /**
   * Clicks save and verifies the validation error dialog (no exercises filled).
   */
  async saveAndExpectValidationError() {
    await this.saveButton.click();
    await expect(
      this.page.getByText(/did not complete any exercise/i),
    ).toBeVisible();
  }

  /**
   * Clicks save and verifies the incomplete error dialog (weight without reps).
   */
  async saveAndExpectIncompleteError() {
    await this.saveButton.click();
    await expect(
      this.page.getByText(/only the weight or only the reps/i),
    ).toBeVisible();
  }

  /**
   * Dismisses an alert dialog by clicking OK.
   */
  async dismissAlert() {
    await this.page.getByText("OK").click();
  }
}
