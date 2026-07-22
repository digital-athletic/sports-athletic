import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class TrainingOverviewPage extends BasePage {
  private get title() {
    return this.page.getByText("Training Overview");
  }

  private get startTrainingButton() {
    return this.page.getByRole("button", { name: "Start Training" });
  }

  private get startAsChecklistButton() {
    return this.page.getByRole("button", { name: "Start without guidance" });
  }

  private get exerciseItems() {
    return this.page.getByText(
      /KH-Kniebeuge|LH-Kniebeuge|Bankdrücken|Bench press|Squat|Rowing|Shoulder press|KH-Frontkniebeuge|LH-Frontkniebeuge/i,
    );
  }

  async expectVisible() {
    await expect(this.title).toBeVisible();
  }

  async startTraining() {
    await this.startTrainingButton.click({ timeout: 15000 });
  }

  async startAsChecklist() {
    await this.startAsChecklistButton.click({ timeout: 15000 });
  }

  async openExerciseInfo(index = 0) {
    const item = this.exerciseItems.nth(index);
    await expect(item).toBeVisible({ timeout: 10000 });
    await item.click();
  }
}
