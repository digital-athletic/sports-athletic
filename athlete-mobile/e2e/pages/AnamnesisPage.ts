import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

type TrainingDay = "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su";

export interface AnamnesisParams {
  name?: string;
  gender?: "Male" | "Female";
  heightCm?: number;
  weightKg?: number;
  position?:
    | "Fieldplayer"
    | "Goalkeeper"
    | "Backcourt"
    | "Wing"
    | "Pivot"
    | "Referee";
  seasonPhase: "Preparation" | "Competitive" | "Transition";
  trainingDays: TrainingDay[];
}

export class AnamnesisPage extends BasePage {
  private get sportHeading() {
    return this.page.getByRole("heading", { name: "Sport" });
  }

  private get personalDataHeading() {
    return this.page.getByRole("heading", { name: "Personal Data" });
  }

  private get heightWeightHeading() {
    return this.page.getByRole("heading", { name: "Height & Weight" });
  }

  private get positionFitnessHeading() {
    return this.page.getByRole("heading", { name: "Position & Fitness" });
  }

  private get painsHeading() {
    return this.page
      .getByRole("heading", { name: "Pains", exact: true })
      .first();
  }

  private get seasonPhaseHeading() {
    return this.page
      .getByRole("heading", { name: "Season phase", exact: true })
      .first();
  }

  private get trainingDaysHeading() {
    return this.page.getByRole("heading", { name: "Training Days" });
  }

  private get nameInput() {
    return this.page.getByPlaceholder(/enter your name/i);
  }

  private get heightInput() {
    return this.page.getByPlaceholder("175");
  }

  private get weightInput() {
    return this.page.getByPlaceholder("75", { exact: true });
  }

  private get chooseButton() {
    return this.page.getByText("Choose").first();
  }

  private get okButton() {
    return this.page.getByText("OK").last();
  }

  async selectSport(sportName: string) {
    await expect(this.sportHeading).toBeVisible();
    await this.page.getByRole("button", { name: sportName }).click();
    await this.goOnButton.click();
  }

  async completeAnamnesis(params: AnamnesisParams) {
    await this.fillPersonalData(params);
    await this.fillHeightAndWeight(params);
    await this.fillPositionAndFitness(params);
    await this.skipPainsScreen();
    await this.selectSeasonPhase(params.seasonPhase);
    await this.selectTrainingDays(params.trainingDays);
    await this.expectGeneratingTrainingPlan();
  }

  private async fillPersonalData(params: AnamnesisParams) {
    await expect(this.personalDataHeading).toBeVisible();

    if (params.name) {
      await this.nameInput.fill(params.name);
    }

    if (params.gender) {
      await this.page.getByText(params.gender).first().click();
      await this.okButton.click();
    }

    await this.goOnButton.click();
  }

  private async fillHeightAndWeight(params: AnamnesisParams) {
    await expect(this.heightWeightHeading).toBeVisible();

    if (params.heightCm) {
      await this.heightInput.fill(`${params.heightCm}`);
    }

    if (params.weightKg) {
      await this.weightInput.fill(`${params.weightKg}`);
    }

    await this.goOnButton.click();
  }

  private async fillPositionAndFitness(params: AnamnesisParams) {
    await expect(this.positionFitnessHeading).toBeVisible();

    if (params.position) {
      await this.chooseButton.click();
      await this.page.getByText(params.position).click();
      await this.okButton.click();
    }

    await this.goOnButton.click();
  }

  private async skipPainsScreen() {
    await expect(this.painsHeading).toBeVisible();
    await this.goOnButton.click();
  }

  private async selectSeasonPhase(
    phase: "Preparation" | "Competitive" | "Transition",
  ) {
    await expect(this.seasonPhaseHeading).toBeVisible();
    await this.chooseButton.click();
    await this.page.getByText(phase).click();
    await this.okButton.click();

    // Note: The @react-native-community/datetimepicker doesn't render on web,
    // so the end date is auto-calculated by the app (12 weeks from now).
    // We verify the stored date is valid in the test assertions.

    await this.goOnButton.click();
  }

  private async selectTrainingDays(days: TrainingDay[]) {
    await expect(this.trainingDaysHeading).toBeVisible();

    for (const day of days) {
      await this.page.getByRole("button", { name: day }).click();
    }

    await this.goOnButton.click();
  }

  private async expectGeneratingTrainingPlan() {
    await expect(this.page.getByText(/thank you for your/i)).toBeVisible();
    await expect(
      this.page.getByText(/generating training plan/i),
    ).toBeVisible();
  }

  /**
   * Gets the stored season phase data from the user-workout-storage.
   * The final season phase is stored in workoutData.seasonPhase in userWorkoutStore,
   * not in the anamnesisStore (which only holds temporary form state).
   */
  async getStoredSeasonPhase(): Promise<{
    type: string | null;
    endDate: string | null;
    numOfWeeks?: number;
  } | null> {
    return await this.page.evaluate(() => {
      const workoutStorage = localStorage.getItem("user-workout-storage");
      if (!workoutStorage) return null;

      const parsed = JSON.parse(workoutStorage);
      // Zustand persist middleware stores state in a 'state' property
      const state = parsed?.state;
      if (!state) return null;

      return state.workoutData?.seasonPhase ?? null;
    });
  }

  /**
   * Debug helper: Returns all localStorage keys and their values.
   * Useful for understanding what data is actually stored.
   */
  async debugLocalStorage(): Promise<Record<string, unknown>> {
    return await this.page.evaluate(() => {
      const result: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            result[key] = JSON.parse(localStorage.getItem(key) || "null");
          } catch {
            result[key] = localStorage.getItem(key);
          }
        }
      }
      return result;
    });
  }
}
