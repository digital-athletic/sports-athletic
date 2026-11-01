import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class TrainingListPage extends BasePage {
  private get title() {
    return this.page.getByText("Training Checklist");
  }

  private get startButtons() {
    return this.page.getByRole("button", { name: "Start exercise" });
  }

  private get firstStartButton() {
    return this.startButtons.first();
  }

  private get finishButton() {
    return this.page.getByTestId("training-list-finish-button");
  }

  private get sheet() {
    return this.page.getByTestId("training-list-sheet");
  }

  // The web sheet's overlay animates out after closing and swallows clicks.
  private async waitForSheetClosed() {
    await expect(this.sheet).toBeHidden();
  }

  private get restSkipButton() {
    return this.page.getByTestId("training-list-sheet-rest-skip");
  }

  get restTimer() {
    return this.page.getByTestId("training-list-sheet-rest-timer");
  }

  async skipRest() {
    await this.restSkipButton.click({ timeout: 3000 });
    await this.waitForSheetClosed();
  }

  // A set followed by a rest keeps the sheet open on the rest screen.
  private async closeSheetSkippingRest() {
    await Promise.race([
      this.restSkipButton.waitFor({ state: "visible" }).catch(() => {}),
      this.sheet.waitFor({ state: "hidden" }).catch(() => {}),
    ]);
    if (await this.restSkipButton.isVisible().catch(() => false)) {
      await this.restSkipButton.click({ timeout: 3000 });
    }
    await this.waitForSheetClosed();
  }

  // Needs page.clock.install() before navigating. Jumps past a timed
  // exercise's countdown instead of waiting it out in real time.
  private async waitOutCountdown() {
    await expect(this.sheetContinueButton).toBeVisible();
    if (!(await this.sheetContinueButton.isEnabled())) {
      await this.page.clock.fastForward("10:00");
    }
    await expect(this.sheetContinueButton).toBeEnabled();
  }

  private get sheetContinueButton() {
    return this.page.getByTestId("training-list-sheet-continue");
  }

  private get sheetRepsInput() {
    return this.page.getByTestId("training-list-sheet-reps-input");
  }

  private get sheetRepsSaveButton() {
    return this.page.getByTestId("training-list-sheet-reps-save");
  }

  private sheetFeedbackButtonFor(feedback: "too_easy" | "too_hard") {
    const suffix = feedback === "too_easy" ? "too-easy" : "too-hard";
    return this.page.getByTestId(`training-list-sheet-${suffix}`);
  }

  private startFor(testId: string) {
    return this.page.getByTestId(`${testId}-start`);
  }

  private skipFor(testId: string) {
    return this.page.getByTestId(`${testId}-skip`);
  }

  async expectVisible() {
    await expect(this.title).toBeVisible();
  }

  async skipRow(testId: string) {
    await this.skipFor(testId).click({ timeout: 3000 });
  }

  /**
   * Finds a row by its visible exercise name, without needing to know its
   * numeric index. When an exercise appears more than once (multiple sets,
   * e.g. warmup + working sets for a MAX exercise), rows are rendered in the
   * same order the generator produced them, so the LAST match is always the
   * final/working set, the same assumption workout.spec.ts already relies
   * on for the sequential flow with this same profile.
   */
  lastRowByExerciseName(exerciseName: string) {
    return this.page
      .locator('[data-testid^="training-list-row-"]')
      .filter({ hasText: exerciseName })
      .last();
  }

  /**
   * Opens a row's exercise sheet from its Start button, waits out any
   * running countdown, and continues. Pass reps for a strength-test row
   * (fills and saves the sheet's reps input instead of waiting on a timer),
   * or feedback for a row that reveals the too-easy/too-hard choice after
   * Continue.
   */
  async completeRow(
    testId: string,
    options?: { feedback?: "too_easy" | "too_hard"; reps?: number },
  ) {
    await this.startFor(testId).click({ timeout: 3000 });
    await this.continueActiveSheet(options);
  }

  private async continueActiveSheet(options?: {
    feedback?: "too_easy" | "too_hard";
    reps?: number;
  }) {
    if (typeof options?.reps === "number") {
      await this.sheetRepsInput.fill(String(options.reps));
      await this.sheetRepsSaveButton.click({ timeout: 3000 });
      await this.closeSheetSkippingRest();
      return;
    }

    await this.waitOutCountdown();
    await this.sheetContinueButton.click({ timeout: 3000 });

    if (options?.feedback) {
      await this.sheetFeedbackButtonFor(options.feedback).click({
        timeout: 3000,
      });
    }
    await this.closeSheetSkippingRest();
  }

  /**
   * Row ids carry the set list index and rests get no row, so a gap of one
   * index marks a set followed by a rest, e.g. rows 3 and 5 with the rest at 4.
   * Returns that set's row id and the rest's index.
   */
  async firstRowFollowedByRest() {
    const rowIndices = await this.page
      .locator('[data-testid^="training-list-row-"]')
      .evaluateAll((elements) =>
        elements
          .map((element) => element.getAttribute("data-testid") ?? "")
          .filter((id) => /^training-list-row-\d+$/.test(id))
          .map((id) => Number(id.replace("training-list-row-", ""))),
      );
    const position = rowIndices.findIndex(
      (index, i) => rowIndices[i + 1] === index + 2,
    );
    if (position === -1) {
      throw new Error("No checklist row is followed by a rest");
    }

    const setIndex = rowIndices[position];
    return {
      rowId: `training-list-row-${setIndex}`,
      restIndex: setIndex + 1,
    };
  }

  async expectRowCompleted(testId: string) {
    await expect(this.startFor(testId)).toBeHidden();
  }

  /**
   * Starts a row and presses Continue, leaving the sheet on its rest screen.
   * A feedback row first asks for feedback, which this answers with succeeded.
   */
  async continueRowIntoRest(testId: string) {
    await this.startFor(testId).click({ timeout: 3000 });
    await this.waitOutCountdown();
    await this.sheetContinueButton.click({ timeout: 3000 });

    const succeededButton = this.page.getByTestId(
      "training-list-sheet-checkmark",
    );
    await expect(this.restSkipButton.or(succeededButton)).toBeVisible();
    if (await succeededButton.isVisible()) {
      await succeededButton.click({ timeout: 3000 });
    }
    await expect(this.restSkipButton).toBeVisible();
  }

  async selectFeedbackInRow(row: Locator, feedback: "too_easy" | "too_hard") {
    await row.getByRole("button", { name: "Start exercise" }).click({
      timeout: 3000,
    });
    await this.continueActiveSheet({ feedback });
  }

  /**
   * Completes every remaining row in the checklist, regardless of order,
   * then presses the finish button (enabled only once every row is done) to
   * navigate to training-success. Rows already skipped by the caller are
   * left alone. Strength-test rows (reps input in the sheet) fall back to a
   * default value of 10, and feedback-eligible rows default to SUCCEEDED.
   */
  async completeAll() {
    for (let i = 0; i < 60; i++) {
      if (await this.goOnButton.isVisible().catch(() => false)) {
        break;
      }

      if (await this.finishButton.isEnabled().catch(() => false)) {
        await this.finishButton.click({ timeout: 3000 });
        await expect(this.goOnButton).toBeVisible();
        continue;
      }

      if (await this.firstStartButton.isVisible().catch(() => false)) {
        await this.firstStartButton.click({ timeout: 3000 });
        await this.finishActiveSheet();
        continue;
      }

      await Promise.race([
        this.goOnButton.waitFor({ state: "visible", timeout: 3000 }),
        this.firstStartButton.waitFor({ state: "visible", timeout: 3000 }),
      ]).catch(() => {});
    }

    await expect(this.goOnButton).toBeVisible();
  }

  /** Drives whichever step the currently open sheet is on to completion. */
  private async finishActiveSheet() {
    if (await this.sheetRepsInput.isVisible().catch(() => false)) {
      if (!(await this.sheetRepsInput.inputValue().catch(() => ""))) {
        await this.sheetRepsInput.fill("10");
      }
      await this.sheetRepsSaveButton.click({ timeout: 3000 });
      await this.closeSheetSkippingRest();
      return;
    }

    await this.waitOutCountdown();
    await this.sheetContinueButton.click({ timeout: 3000 });

    const succeededButton = this.page.getByTestId(
      "training-list-sheet-checkmark",
    );
    if (await succeededButton.isVisible().catch(() => false)) {
      await succeededButton.click({ timeout: 3000 });
    }
    await this.closeSheetSkippingRest();
  }
}
