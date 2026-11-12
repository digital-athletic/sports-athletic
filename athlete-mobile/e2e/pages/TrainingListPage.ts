import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

type Feedback = "too_easy" | "too_hard";

/**
 * Feedback to give on the last set of the named exercise, either by its value
 * or by the button the sheet shows on the right, e.g. { position: "right" }.
 */
export type ExerciseFeedback = { exerciseName: string } & (
  | { feedback: Feedback }
  | { position: "right" }
);

export class TrainingListPage extends BasePage {
  private get title() {
    return this.page.getByText("Training Checklist");
  }

  private get startButtons() {
    return this.page.getByRole("button", {
      name: /^Start (next )?exercise$/,
    });
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

  // The e2e runs use the English app language.
  private get sheetFeedbackButtons() {
    return this.sheet.getByRole("button", {
      name: /^(Too hard|Succeeded|Too easy)$/,
    });
  }

  /** Accessible names of the feedback buttons, sorted from left to right. */
  async feedbackNamesLeftToRight(): Promise<string[]> {
    const buttons = await this.sheetFeedbackButtons.all();
    const placed = await Promise.all(
      buttons.map(async (button) => ({
        x: (await button.boundingBox())?.x ?? 0,
        name: (await button.getAttribute("aria-label")) ?? "",
      })),
    );
    return placed.sort((a, b) => a.x - b.x).map(({ name }) => name);
  }

  private async sheetFeedbackButtonFor(feedbackFor: ExerciseFeedback) {
    if ("position" in feedbackFor) {
      const names = await this.feedbackNamesLeftToRight();
      expect(names).toHaveLength(3);
      return this.sheet.getByRole("button", { name: names[2], exact: true });
    }
    const { feedback } = feedbackFor;
    const suffix = feedback === "too_easy" ? "too-easy" : "too-hard";
    return this.page.getByTestId(`training-list-sheet-${suffix}`);
  }

  /** Start button of a row. Only the filled one is named "Start next exercise". */
  startFor(testId: string) {
    return this.page.getByTestId(`${testId}-start`);
  }

  private get sheetSkipButton() {
    return this.page.getByTestId("training-list-sheet-skip");
  }

  private get sheetPauseButton() {
    return this.page.getByTestId("training-list-sheet-pause");
  }

  get sheetTimer() {
    return this.page.getByTestId("training-list-sheet-timer");
  }

  /** Tile with the planned duration of a steady run. */
  get sheetDurationTile() {
    return this.page.getByTestId("training-list-sheet-duration");
  }

  /** Tile with the heart rate band of a steady run. */
  get sheetHeartRateTile() {
    return this.page.getByTestId("training-list-sheet-heart-rate");
  }

  async completeOpenSet() {
    await this.sheetNextButton.click({ timeout: 3000 });
  }

  /** Holds the set timer and waits until the button offers Resume. */
  async holdTimer() {
    await this.sheetPauseButton.click({ timeout: 3000 });
    await expect(this.sheetPauseButton).toHaveAccessibleName("Resume");
  }

  async expectTimerRunning() {
    await expect(this.sheetPauseButton).toHaveAccessibleName("Hold");
  }

  /** Closes the sheet with a tap on the dimmed list above it. */
  async dismissSheet() {
    await this.page
      .getByTestId("expo-ui-bottom-sheet-overlay")
      .click({ position: { x: 10, y: 10 }, timeout: 3000 });
    await expect(this.sheet).toBeHidden();
  }

  /** Saved timer value a row shows when its set resumes. */
  resumeTimeFor(testId: string) {
    return this.page.getByTestId(`${testId}-start-resume-time`);
  }

  async resumeTimer() {
    await this.sheetPauseButton.click({ timeout: 3000 });
    await expect(this.sheetPauseButton).toHaveAccessibleName("Hold");
  }

  async expectNextDisabled() {
    await expect(this.sheetNextButton).toBeDisabled();
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

  /** The skill titles of the checklist, top to bottom. */
  get skillTitles() {
    return this.page.locator('[data-testid^="training-list-skill-"]');
  }

  skillTitle(key: number) {
    return this.page.getByTestId(`training-list-skill-${key}`);
  }

  /** Background color the open sheet is painted in, e.g. "rgb(255, 255, 255)". */
  async sheetBackgroundColor() {
    await expect(this.sheetSet).toBeVisible();
    return this.sheet.evaluate((element) => {
      const transparent = "rgba(0, 0, 0, 0)";
      let node: Element | null = element;
      while (node) {
        const { backgroundColor } = getComputedStyle(node);
        if (backgroundColor !== transparent) return backgroundColor;
        node = node.parentElement;
      }
      return transparent;
    });
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
    const nextExerciseName = await this.page
      .getByTestId(`training-list-row-${rowIndices[position + 1]}-name`)
      .innerText();
    return {
      rowId: `training-list-row-${setIndex}`,
      restIndex: setIndex + 1,
      nextExerciseName: nextExerciseName.trim(),
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

    await expect(
      this.restSkipButton.or(this.sheetSucceededButton),
    ).toBeVisible();
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
  }: {
    feedbackFor?: ExerciseFeedback;
    rest?: "skip" | "wait";
  } = {}): Promise<boolean> {
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
      ? await this.sheetFeedbackButtonFor(feedbackFor)
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
   * Completes every remaining set, then presses the finish button to navigate
   * to training-success. Sets already skipped by the caller are left alone.
   * Strength test sets fall back to 10 reps, and feedback-eligible sets
   * default to SUCCEEDED.
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

      if (await this.firstStartButton.isVisible().catch(() => false)) {
        await this.firstStartButton.click({ timeout: 3000 });
        await this.completeSheet();
        continue;
      }

      // Finish stays enabled with open sets, so it is pressed only once no row is left.
      if (await this.finishButton.isEnabled().catch(() => false)) {
        await this.finishButton.click({ timeout: 3000 });
        await expect(this.goOnButton).toBeVisible();
        continue;
      }

      await Promise.race([
        this.goOnButton.waitFor({ state: "visible", timeout: 3000 }),
        this.firstStartButton.waitFor({ state: "visible", timeout: 3000 }),
      ]).catch(() => {});
    }

    await expect(this.goOnButton).toBeVisible();
  }

  /** Presses back and confirms the "Discard training?" dialog. */
  async discard() {
    await this.confirmBack("Discard training?");
  }

  /** Presses back after a completed set and confirms the "Abort training?" dialog. */
  async abort() {
    await this.confirmBack("Abort training?");
  }

  private async confirmBack(question: string) {
    await this.page
      .getByTestId("training-list-back-button")
      .click({ timeout: 3000 });
    await expect(this.page.getByText(question)).toBeVisible();
    await this.page.getByText("Yes", { exact: true }).click();
  }

  /** Presses finish with open sets and confirms the "Finish training early?" dialog. */
  async finishEarly() {
    await this.finishButton.click({ timeout: 3000 });
    await expect(this.page.getByText("Finish training early?")).toBeVisible();
    await this.page.getByText("Yes", { exact: true }).click();
  }

  async expectAllRowsCompleted() {
    await expect(this.startButtons).toHaveCount(0);
  }
}
