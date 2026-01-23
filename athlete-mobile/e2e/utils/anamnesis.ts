import { expect, Page } from "@playwright/test";

/**
 * Selects a sport during the anamnesis process.
 */
export async function selectSport(page: Page, sportName: string) {
  const goOnButton = page.getByRole("button", { name: /go on/i });
  await expect(page.getByRole("heading", { name: "Sport" })).toBeVisible();

  await page.getByRole("button", { name: sportName }).click();

  await goOnButton.click();
}

/**
 * Completes profile setup by navigating through all anamnesis screens.
 */
type TrainingDay = "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su";

export async function completeAnamnesis(
  page: Page,
  params: {
    name?: string;
    gender?: "Male" | "Female";
    heightCm?: number;
    weightKg?: number;
    position?: "Fieldplayer" | "Goalkeeper";
    seasonPhase: "Preparation" | "Competitive" | "Transition";
    trainingDays: TrainingDay[];
  },
) {
  const goOnButton = page.getByRole("button", { name: /go on/i });

  // Screen 1: Personal Data
  await expect(
    page.getByRole("heading", { name: "Personal Data" }),
  ).toBeVisible();

  if (params.name) {
    await page.getByPlaceholder(/enter your name/i).fill(params.name);
  }

  if (params.gender) {
    await page.getByText(params.gender).first().click();
    await page.getByText("OK").last().click();
  }

  await goOnButton.click();

  // Screen 2: Height & Weight
  await expect(
    page.getByRole("heading", { name: "Height & Weight" }),
  ).toBeVisible();

  if (params.heightCm) {
    await page.getByPlaceholder("175").fill(`${params.heightCm}`);
  }

  if (params.weightKg) {
    await page
      .getByPlaceholder("75", { exact: true })
      .fill(`${params.weightKg}`);
  }

  await goOnButton.click();

  // Screen 3: Position & Fitness
  await expect(
    page.getByRole("heading", { name: "Position & Fitness" }),
  ).toBeVisible();

  if (params.position) {
    await page.getByText("Choose").first().click();
    await page.getByText(params.position).click();
    await page.getByText("OK").last().click();
  }

  await goOnButton.click();

  // Screen 4: Pains/Injuries
  await expect(page.getByRole("heading", { name: "Pains" })).toBeVisible();
  await goOnButton.click();

  // Screen 5: Season Phase
  await expect(
    page.getByRole("heading", { name: "Season Phase" }),
  ).toBeVisible();

  await page.getByText("Choose").first().click();
  await page.getByText(params.seasonPhase).click();
  await page.getByText("OK").last().click();
  await goOnButton.click();

  // Screen 6: Training Days
  await expect(
    page.getByRole("heading", { name: "Training Days" }),
  ).toBeVisible();

  for (const day of params.trainingDays || []) {
    await page.getByRole("button", { name: day }).click();
  }

  await goOnButton.click();

  // Wait for training plan generation
  await expect(page.getByText(/thank you for your/i)).toBeVisible();
  await expect(page.getByText(/generating training plan/i)).toBeVisible();
}
