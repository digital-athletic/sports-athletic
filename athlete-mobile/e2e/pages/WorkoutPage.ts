import { expect } from "@playwright/test";
import * as v from "valibot";
import { BasePage } from "./BasePage";

const PersistedExerciseEntrySchema = v.object({
  exerciseId: v.string(),
  weight: v.optional(v.number()),
  repetition: v.optional(v.number()),
  skipped: v.optional(v.boolean()),
  duration: v.optional(v.number()),
});

const PersistedExerciseProgressStorageSchema = v.object({
  state: v.object({
    exerciseData: v.record(v.string(), PersistedExerciseEntrySchema),
    exerciseTotals: v.optional(v.record(v.string(), v.unknown()), {}),
  }),
});

const GeneratedExerciseListStorageSchema = v.object({
  state: v.object({
    exerciseList: v.array(
      v.object({
        exerciseId: v.string(),
        maxFRepetitions: v.optional(
          v.array(
            v.object({
              level: v.optional(v.string()),
              repetitions: v.optional(v.number()),
              weightPercentage: v.optional(v.number()),
            }),
          ),
        ),
      }),
    ),
  }),
});

export class WorkoutPage extends BasePage {
  private get skipButton() {
    return this.page.getByRole("button", { name: "Skip exercise" }).first();
  }

  private get checkmarkButton() {
    return this.page.getByRole("button", { name: "Finish exercise" }).first();
  }

  private get startTrainingButton() {
    return this.page.getByRole("button", { name: "Start Training" });
  }

  private get tooEasyButton() {
    return this.page.getByText("too easy");
  }

  private get tooHardButton() {
    return this.page.getByText("too hard");
  }

  /**
   * Checks if the current set is the last set by finding "N of M" text where N === M.
   */
  private async isLastSet(): Promise<boolean> {
    try {
      const elements = this.page.getByText(/\d+ of \d+/);
      const count = await elements.count();
      for (let i = 0; i < count; i++) {
        const text = await elements.nth(i).textContent();
        const match = text?.match(/(\d+) of (\d+)/);
        if (match && match[1] === match[2]) return true;
      }
    } catch {
      /* element not found */
    }
    return false;
  }

  /** Identifies the current workout step: set counters plus the visible controls. */
  private async stepSignature(): Promise<string> {
    const counters = await this.page.getByText(/\d+ of \d+/).allTextContents();
    const [goOn, checkmark, skip] = await Promise.all([
      this.goOnButton.isVisible(),
      this.checkmarkButton.isVisible(),
      this.skipButton.isVisible(),
    ]);
    return [...counters, goOn, checkmark, skip].join("|");
  }

  async startWorkout(weekday: string) {
    await this.startTrainingButton.click({ timeout: 15000 });
    await expect(
      this.page.getByRole("heading", { name: /Start.*training/i }),
    ).toBeVisible();
    await this.page
      .getByRole("button", { name: new RegExp(weekday, "i") })
      .click();

    await this.skipMuscleSoreness();

    await expect(this.page.getByText("Training Overview")).toBeVisible();
  }

  async getExerciseValues(exerciseName: string) {
    const card = this.page.locator(`text=${exerciseName}`).locator("..");
    const repsText = await card
      .locator("text=/\\d+\\s*repetitions?/i")
      .first()
      .textContent()
      .catch(() => null);
    const weightText = await card
      .locator("text=/[\\d.]+\\s*kg/i")
      .first()
      .textContent()
      .catch(() => null);

    return {
      reps: repsText ? parseInt(repsText.match(/(\d+)/)?.[1] || "0") : 0,
      weight: weightText
        ? parseFloat(weightText.match(/([\d.]+)/)?.[1] || "0")
        : 0,
    };
  }

  async beginWorkout() {
    await this.startTrainingButton.click({ timeout: 15000 });
  }

  /**
   * Waits for Zustand's persist middleware to flush exercise data to localStorage.
   * A completed exercise always adds totals, as its last write; a workout without
   * progression or with a level up stores no progress values.
   */
  private async waitForExerciseDataPersisted(timeoutMs = 5000) {
    await expect
      .poll(
        async () => {
          const raw = await this.page.evaluate(() =>
            localStorage.getItem("exercise-progress-storage"),
          );
          if (!raw) return false;
          const result = v.safeParse(
            PersistedExerciseProgressStorageSchema,
            JSON.parse(raw),
          );
          if (!result.success) return false;
          const { exerciseData, exerciseTotals } = result.output.state;
          if (Object.keys(exerciseTotals).length > 0) return true;
          return Object.values(exerciseData).some(
            (ex) =>
              ex.weight !== undefined ||
              ex.repetition !== undefined ||
              ex.skipped !== undefined ||
              ex.duration !== undefined,
          );
        },
        { timeout: timeoutMs, message: "Exercise data not persisted in time" },
      )
      .toBe(true);
  }

  async completeWorkout(options?: {
    lastSetFeedback?: "normal" | "too_easy" | "too_hard";
  }) {
    const { lastSetFeedback = "normal" } = options ?? {};

    // Iterate through workout steps (sets, rest periods) clicking checkmark or skip
    // until the "Go On" button appears indicating workout completion. Max 20 iterations as safety limit.
    for (let i = 0; i < 60; i++) {
      await Promise.race([
        this.goOnButton.waitFor({ state: "visible", timeout: 3000 }),
        this.checkmarkButton.waitFor({ state: "visible", timeout: 3000 }),
        this.skipButton.waitFor({ state: "visible", timeout: 3000 }),
      ]).catch(() => {});

      if (await this.goOnButton.isVisible().catch(() => false)) {
        break;
      }

      if (await this.checkmarkButton.isVisible().catch(() => false)) {
        const isLastSet = await this.isLastSet();
        const stepBefore = await this.stepSignature();

        if (isLastSet && lastSetFeedback === "too_easy") {
          await this.tooEasyButton.click({ timeout: 3000 });
        } else if (isLastSet && lastSetFeedback === "too_hard") {
          await this.tooHardButton.click({ timeout: 3000 });
        } else {
          await this.checkmarkButton.click({ force: true });
        }
        // A second click during the set transition would confirm the next set too.
        await expect
          .poll(() => this.stepSignature(), { intervals: [50] })
          .not.toBe(stepBefore);
        continue;
      }

      if (await this.skipButton.isVisible().catch(() => false)) {
        await this.skipButton.click({ force: true });
      }
    }

    await expect(this.goOnButton).toBeVisible();
  }

  /**
   * Reads the accumulated totals of an exercise from localStorage. Cardio
   * stores no progression values, only these totals.
   */
  async getExerciseTotals(exerciseId: string) {
    return this.page.evaluate((id) => {
      const raw = localStorage.getItem("exercise-progress-storage");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.state?.exerciseTotals?.[id] ?? null;
    }, exerciseId);
  }

  /**
   * Reads the last MAX ladder step of the last generated entry for an exercise
   * from the training store. The last entry is the working set, not a warmup.
   */
  async getLastMaxRepetition(exerciseId: string) {
    const raw = await this.page.evaluate(() =>
      localStorage.getItem("training-storage"),
    );
    if (!raw) return undefined;
    const result = v.safeParse(
      GeneratedExerciseListStorageSchema,
      JSON.parse(raw),
    );
    if (!result.success) return undefined;
    const entries = result.output.state.exerciseList.filter(
      (e) => e.exerciseId === exerciseId,
    );
    const maxFRepetitions = entries[entries.length - 1]?.maxFRepetitions;
    return maxFRepetitions?.[maxFRepetitions.length - 1];
  }

  async returnToHome() {
    // Wait for all exercise data to be persisted to localStorage before navigating away.
    // Zustand's persist middleware writes asynchronously, and on slower CI environments
    // the write may not complete before the page transitions.
    await this.waitForExerciseDataPersisted();
    await this.goOnButton.click();
    await this.expectLoggedIn();
  }
}
