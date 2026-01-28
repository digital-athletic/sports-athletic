import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ExerciseInformationPage extends BasePage {
  private get musclesTrainedHeading() {
    return this.page.getByText("Muscles trained");
  }

  private get activeMusclesLegend() {
    return this.page.getByText("Active working muscles");
  }

  private get supportingMusclesLegend() {
    return this.page.getByText("Supportive working muscles");
  }

  private get exerciseHintsHeading() {
    return this.page.getByText("Exercise hints");
  }

  private get muscleChips() {
    return this.page.locator(
      "text=/left|right|thigh|shoulder|back|buttock|bicep|latissimus|abdominal|breast|calf/i",
    );
  }

  async expectVisible() {
    await expect(this.musclesTrainedHeading).toBeVisible({ timeout: 10000 });
  }

  async expectMusclesSectionComplete() {
    await expect(this.musclesTrainedHeading).toBeVisible();
    await expect(this.activeMusclesLegend).toBeVisible();
    await expect(this.supportingMusclesLegend).toBeVisible();
  }

  async expectMuscleChips(minCount = 2) {
    await expect(this.muscleChips.first()).toBeVisible({ timeout: 5000 });
    const count = await this.muscleChips.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Asserts that every label in the list is visible as a muscle chip.
   * Labels should be the translated muscle names (e.g. "buttock", "lower back").
   */
  async expectMuscleChipLabels(labels: string[]) {
    for (const label of labels) {
      await expect(this.page.getByText(label, { exact: true })).toBeVisible({
        timeout: 5000,
      });
    }
  }

  async expectExerciseHintsVisible() {
    await expect(this.exerciseHintsHeading).toBeVisible();
  }
}
