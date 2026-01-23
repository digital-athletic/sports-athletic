import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class WorkoutPage extends BasePage {
  private get skipButton() {
    return this.page.locator('[aria-label="play-forward"]').first();
  }

  private get checkmarkButton() {
    return this.page.locator('[aria-label="checkmark"]').first();
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

  private get lastSetIndicator() {
    return this.page.getByText("3 of 3");
  }

  async startWorkout(weekday: string) {
    await this.startTrainingButton.waitFor({
      state: "visible",
      timeout: 15000,
    });
    await this.startTrainingButton.click();
    await expect(
      this.page.getByRole("heading", { name: /Start.*training/i }),
    ).toBeVisible();
    await this.page
      .getByRole("button", { name: new RegExp(weekday, "i") })
      .click();

    await this.skipMuscleSoreness();

    await expect(this.page.getByText("Training Overview")).toBeVisible({
      timeout: 10000,
    });
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
    await this.startTrainingButton.waitFor({
      state: "visible",
      timeout: 15000,
    });
    await this.startTrainingButton.click();
  }

  async completeWorkout(options?: {
    lastSetFeedback?: "normal" | "too_easy" | "too_hard";
  }) {
    const { lastSetFeedback = "normal" } = options ?? {};

    for (let i = 0; i < 20; i++) {
      await Promise.race([
        this.goOnButton.waitFor({ state: "visible", timeout: 3000 }),
        this.checkmarkButton.waitFor({ state: "visible", timeout: 3000 }),
        this.skipButton.waitFor({ state: "visible", timeout: 3000 }),
      ]).catch(() => {});

      if (await this.goOnButton.isVisible().catch(() => false)) {
        break;
      }

      if (await this.checkmarkButton.isVisible().catch(() => false)) {
        const isLastSet = await this.lastSetIndicator
          .isVisible()
          .catch(() => false);

        if (isLastSet && lastSetFeedback === "too_easy") {
          await this.tooEasyButton.click({ force: true });
        } else if (isLastSet && lastSetFeedback === "too_hard") {
          await this.tooHardButton.click({ force: true });
        } else {
          await this.checkmarkButton.click({ force: true });
        }
        continue;
      }

      if (await this.skipButton.isVisible().catch(() => false)) {
        await this.skipButton.click({ force: true });
      }
    }

    await expect(this.goOnButton).toBeVisible({ timeout: 10000 });
  }

  async returnToHome() {
    await this.goOnButton.click();
    await this.expectLoggedIn();
  }
}
