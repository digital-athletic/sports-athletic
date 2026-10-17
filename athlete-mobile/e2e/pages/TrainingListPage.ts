import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class TrainingListPage extends BasePage {
  private get title() {
    return this.page.getByText("Training Checklist");
  }

  private get uncompletedCheckmarks() {
    return this.page.getByRole("button", { name: "Finish exercise" });
  }

  private get firstUncompletedCheckmark() {
    return this.uncompletedCheckmarks.first();
  }

  private get repsSaveButtons() {
    return this.page.getByRole("button", { name: "Save" });
  }

  private get firstVisibleRepsSaveButton() {
    return this.repsSaveButtons.first();
  }

  /** Clicks the first match and waits until the row it belonged to is done. */
  private async clickAndWaitForFewer(rows: Locator) {
    const before = await rows.count();
    await rows.first().click({ force: true });
    await expect
      .poll(() => rows.count(), { intervals: [50] })
      .toBeLessThan(before);
  }

  private get finishButton() {
    return this.page.getByTestId("training-list-finish-button");
  }

  private checkmarkFor(testId: string) {
    return this.page.getByTestId(`${testId}-checkmark`);
  }

  private skipFor(testId: string) {
    return this.page.getByTestId(`${testId}-skip`);
  }

  private repsInputFor(testId: string) {
    return this.page.getByTestId(`${testId}-reps-input`);
  }

  private repsSaveFor(testId: string) {
    return this.page.getByTestId(`${testId}-reps-save`);
  }

  private tooEasyFor(testId: string) {
    return this.page.getByTestId(`${testId}-too-easy`);
  }

  private tooHardFor(testId: string) {
    return this.page.getByTestId(`${testId}-too-hard`);
  }

  async expectVisible() {
    await expect(this.title).toBeVisible();
  }

  async completeRow(testId: string, feedback?: "too_easy" | "too_hard") {
    if (feedback === "too_easy") {
      await this.tooEasyFor(testId).click({ timeout: 3000 });
      return;
    }
    if (feedback === "too_hard") {
      await this.tooHardFor(testId).click({ timeout: 3000 });
      return;
    }
    await this.checkmarkFor(testId).click({ timeout: 3000 });
  }

  async skipRow(testId: string) {
    await this.skipFor(testId).click({ timeout: 3000 });
  }

  async submitReps(testId: string, reps: number) {
    await this.repsInputFor(testId).fill(String(reps));
    await this.repsSaveFor(testId).click({ timeout: 3000 });
  }

  /**
   * Finds a row by its visible exercise name, without needing to know its
   * numeric index. When an exercise appears more than once (multiple sets,
   * e.g. warmup + working sets for a MAX exercise), rows are rendered in the
   * same order the generator produced them, so the LAST match is always the
   * final/working set — the same assumption `workout.spec.ts` already relies
   * on for the sequential flow with this same profile.
   */
  lastRowByExerciseName(exerciseName: string) {
    return this.page
      .locator('[data-testid^="training-list-row-"]')
      .filter({ hasText: exerciseName })
      .last();
  }

  async selectFeedbackInRow(row: Locator, feedback: "too_easy" | "too_hard") {
    const suffix = feedback === "too_easy" ? "too-easy" : "too-hard";
    await row.locator(`[data-testid$="-${suffix}"]`).click({ timeout: 3000 });
  }

  /**
   * Completes every remaining checkbox/reps row in the checklist, regardless of
   * order, then presses the finish button (enabled only once every row is
   * done) to navigate to training-success. Rows already skipped by the caller
   * are left alone. Reps rows fall back to a default value of 10 when no
   * specific value has been entered.
   */
  async completeAll() {
    for (let i = 0; i < 60; i++) {
      if (await this.goOnButton.isVisible().catch(() => false)) {
        break;
      }

      if (await this.finishButton.isEnabled().catch(() => false)) {
        await this.finishButton.click({ force: true });
        await expect(this.goOnButton).toBeVisible();
        continue;
      }

      if (await this.firstUncompletedCheckmark.isVisible().catch(() => false)) {
        await this.clickAndWaitForFewer(this.uncompletedCheckmarks);
        continue;
      }

      if (
        await this.firstVisibleRepsSaveButton.isVisible().catch(() => false)
      ) {
        const input = this.page.getByPlaceholder("Repetitions").first();
        if (!(await input.inputValue().catch(() => ""))) {
          await input.fill("10");
        }
        await this.clickAndWaitForFewer(this.repsSaveButtons);
        continue;
      }

      await Promise.race([
        this.goOnButton.waitFor({ state: "visible", timeout: 3000 }),
        this.firstUncompletedCheckmark.waitFor({
          state: "visible",
          timeout: 3000,
        }),
        this.firstVisibleRepsSaveButton.waitFor({
          state: "visible",
          timeout: 3000,
        }),
      ]).catch(() => {});
    }

    await expect(this.goOnButton).toBeVisible();
  }
}
