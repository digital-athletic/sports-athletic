import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

type Feedback = "too_easy" | "too_hard";

/** Feedback to give on the last set of the named exercise. */
export type ExerciseFeedback = { exerciseName: string; feedback: Feedback };

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

  private get sheetSet() {
    return this.page.locator('[data-testid^="training-list-sheet-set-"]');
  }

  private get sheetNextButton() {
    return this.page.getByTestId("training-list-sheet-next");
  }

  private get sheetSucceededButton() {
    return this.page.getByTestId("training-list-sheet-checkmark");
  }

  private get restSkipButton() {
    return this.page.getByTestId("training-list-sheet-rest-skip");
  }

  get nextSetPreview() {
    return this.page.getByTestId("training-list-sheet-next-set");
  }

  private get sheetRepsInput() {
    return this.page.getByTestId("training-list-sheet-reps-input");
  }

  private get sheetRepsSaveButton() {
    return this.page.getByTestId("training-list-sheet-reps-save");
  }

  private sheetFeedbackButtonFor(feedback: Feedback) {
    const suffix = feedback === "too_easy" ? "too-easy" : "too-hard";
    return this.page.getByTestId(`training-list-sheet-${suffix}`);
  }

  private startFor(testId: string) {
    return this.page.getByTestId(`${testId}-start`);
  }

  private get sheetSkipButton() {
    return this.page.getByTestId("training-list-sheet-skip");
  }

  // Needs page.clock.install() before navigating. Jumps past a timed
  // exercise's countdown instead of waiting it out in real time.
  private async waitOutCountdown() {
    await expect(this.sheetNextButton).toBeVisible();
    if (!(await this.sheetNextButton.isEnabled())) {
      await this.page.clock.fastForward("10:00");
    }
    await expect(this.sheetNextButton).toBeEnabled();
  }

  async expectVisible() {
    await expect(this.title).toBeVisible();
  }

  entry(testId: string) {
    return this.page.getByTestId(testId);
  }

  superset(key: number) {
    return this.page.getByTestId(`training-list-superset-${key}`);
  }

  nextArrow(testId: string) {
    return this.page.getByTestId(`${testId}-next-arrow`);
  }

  /** Test id of the set the open sheet shows, e.g. "training-list-sheet-set-4". */
  async currentSheetSet() {
    await expect(this.sheetSet).toBeVisible();
    return this.sheetSet.getAttribute("data-testid");
  }

  async expectNextButton() {
    await expect(this.sheetNextButton).toBeVisible();
  }

  /**
   * Opens a row's exercise sheet and skips its first open set without waiting
   * out the countdown. The sheet then shows the next open set, or closes.
   */
  async skipRow(testId: string) {
    await this.startFor(testId).click({ timeout: 3000 });
    const setBefore = await this.currentSheetSet();
    await this.sheetSkipButton.click({ timeout: 3000 });
    await this.waitForSheetChange([setBefore]);
  }

  async startRow(testId: string) {
    await this.startFor(testId).click({ timeout: 3000 });
  }

  /** The entry of an exercise, found by its visible name. */
  rowByExerciseName(exerciseName: string) {
    return this.page
      .locator('[data-testid^="training-list-row-"]')
      .filter({ hasText: exerciseName })
      .first();
  }

  /**
   * Row ids carry the set list index of the entry's first set and rests get
   * no row, so a gap of one index marks a single set followed by a rest, e.g.
   * rows 3 and 5 with the rest at 4. Returns that row id, the rest's index
   * and the next row's exercise name.
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
    const nextRowText = await this.page
      .getByTestId(`training-list-row-${rowIndices[position + 1]}`)
      .innerText();
    return {
      rowId: `training-list-row-${setIndex}`,
      restIndex: setIndex + 1,
      nextExerciseName: nextRowText.split("\n")[0].trim(),
    };
  }

  async expectRowCompleted(testId: string) {
    await expect(this.startFor(testId)).toBeHidden();
  }

  /**
   * Starts a row and presses Next, leaving the sheet on its rest screen.
   * A feedback row first asks for feedback, which this answers with succeeded.
   */
  async startRowIntoRest(testId: string) {
    await this.startFor(testId).click({ timeout: 3000 });
    await this.waitOutCountdown();
    await this.sheetNextButton.click({ timeout: 3000 });

    await expect(this.restSkipButton.or(this.sheetSucceededButton)).toBeVisible();
    if (await this.sheetSucceededButton.isVisible()) {
      await this.sheetSucceededButton.click({ timeout: 3000 });
    }
    await expect(this.restSkipButton).toBeVisible();
  }

  async skipRest() {
    await this.restSkipButton.click({ timeout: 3000 });
  }

  /**
   * Completes the set the open sheet shows with Next (or saves 10 reps for a
   * strength test set), picks feedback when the sheet asks for it, and skips
   * or waits out a rest that follows. Resolves with true once the sheet has
   * closed and false once it shows the next open set.
   */
  async completeSheetSet({
    feedbackFor,
    rest = "skip",
  }: { feedbackFor?: ExerciseFeedback; rest?: "skip" | "wait" } = {}): Promise<boolean> {
    const setBefore = await this.currentSheetSet();
    if (await this.sheetRepsInput.isVisible().catch(() => false)) {
      if (!(await this.sheetRepsInput.inputValue().catch(() => ""))) {
        await this.sheetRepsInput.fill("10");
      }
      await this.sheetRepsSaveButton.click({ timeout: 3000 });
    } else {
      await this.waitOutCountdown();
      await this.sheetNextButton.click({ timeout: 3000 });
    }

    let state = await this.waitForSheetChange([setBefore]);
    if (state === "feedback") {
      await this.answerFeedback(feedbackFor);
      state = await this.waitForSheetChange([setBefore, "feedback"]);
    }
    if (state === "rest") {
      // Needs page.clock.install(): waiting jumps past the rest countdown.
      if (rest === "skip") await this.restSkipButton.click({ timeout: 3000 });
      else await this.page.clock.fastForward("10:00");
      state = await this.waitForSheetChange([setBefore, "feedback", "rest"]);
    }
    return state === "closed";
  }

  /** "closed", "feedback", "rest", or the id of the set the sheet shows. */
  private async sheetState(): Promise<string | null> {
    if (!(await this.sheet.isVisible().catch(() => false))) return "closed";
    if (await this.sheetSucceededButton.isVisible().catch(() => false)) {
      return "feedback";
    }
    if (await this.restSkipButton.isVisible().catch(() => false)) return "rest";
    return this.sheetSet.getAttribute("data-testid").catch(() => null);
  }

  private async waitForSheetChange(
    previous: (string | null)[],
  ): Promise<string | null> {
    let state: string | null = null;
    await expect
      .poll(async () => {
        state = await this.sheetState();
        return state !== null && !previous.includes(state);
      })
      .toBe(true);
    return state;
  }

  private async answerFeedback(feedbackFor?: ExerciseFeedback) {
    const isAskedExercise =
      !!feedbackFor &&
      (await this.sheet
        .getByText(feedbackFor.exerciseName)
        .isVisible()
        .catch(() => false));
    const button = isAskedExercise
      ? this.sheetFeedbackButtonFor(feedbackFor.feedback)
      : this.sheetSucceededButton;
    await button.click({ timeout: 3000 });
  }

  /** Presses Next until the sheet closes after the last open set. */
  async completeSheet(feedbackFor?: ExerciseFeedback) {
    for (let i = 0; i < 60; i++) {
      if (await this.completeSheetSet({ feedbackFor })) return;
    }
    throw new Error("The sheet did not close after 60 sets");
  }

  /** Starts an entry, then presses Next until the sheet closes. */
  async completeFromRow(row: Locator, feedbackFor?: ExerciseFeedback) {
    await row.getByRole("button", { name: "Start exercise" }).click({
      timeout: 3000,
    });
    await this.completeSheet(feedbackFor);
  }

  /**
   * Completes every remaining set, then presses the finish button (enabled
   * only once every set is done) to navigate to training-success. Sets
   * already skipped by the caller are left alone. Strength test sets fall
   * back to 10 reps, and feedback-eligible sets default to SUCCEEDED.
   */
  async completeAll() {
    for (let i = 0; i < 60; i++) {
      if (await this.goOnButton.isVisible().catch(() => false)) {
        break;
      }

      // A skip leaves the sheet open on the next set.
      if (await this.sheet.isVisible().catch(() => false)) {
        await this.completeSheet();
        continue;
      }

      if (await this.finishButton.isEnabled().catch(() => false)) {
        await this.finishButton.click({ timeout: 3000 });
        await expect(this.goOnButton).toBeVisible();
        continue;
      }

      if (await this.firstStartButton.isVisible().catch(() => false)) {
        await this.firstStartButton.click({ timeout: 3000 });
        await this.completeSheet();
        continue;
      }

      await Promise.race([
        this.goOnButton.waitFor({ state: "visible", timeout: 3000 }),
        this.firstStartButton.waitFor({ state: "visible", timeout: 3000 }),
      ]).catch(() => {});
    }

    await expect(this.goOnButton).toBeVisible();
  }

  async expectFinishEnabled() {
    await expect(this.finishButton).toBeEnabled();
  }
}
