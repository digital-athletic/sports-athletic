import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

type TrainingDay = "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su";

export interface AnamnesisParams {
  name?: string;
  gender?: "Male" | "Female";
  heightCm?: number;
  weightKg?: number;
  position?: "Fieldplayer" | "Goalkeeper";
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
    return this.page.getByRole("heading", { name: "Pains" });
  }

  private get seasonPhaseHeading() {
    return this.page.getByRole("heading", { name: "Season Phase" });
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
}
