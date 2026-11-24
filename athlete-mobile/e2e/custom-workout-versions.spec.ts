import { type Page } from "@playwright/test";
import path from "node:path";
import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { BasePage, TrainingListPage, TrainingOverviewPage } from "./pages";
import { importFileThrough } from "./utils/fileChooser";

const VERSIONS_FILE = path.join(
  __dirname,
  "mocks",
  "files",
  "custom-workout-versions.json",
);

/** Opens the list of own trainings from home. */
async function openOwnTrainings(page: Page) {
  await page.getByRole("button", { name: "Additional trainings" }).click();
  await page.getByRole("button", { name: "Your trainings" }).click();
}

/**
 * Starts "My versions" at home as a checklist, reads the exercise names of its
 * rows and discards the training. Discarding leads to the training overview,
 * so the list of own trainings is opened again from home.
 * Returns the names sorted, as the order inside a block can change.
 */
async function startAtHomeAndReadExercises(page: Page): Promise<string[]> {
  await page.getByRole("button", { name: "My versions", exact: true }).click();
  await page.getByRole("button", { name: /^At home, \d+ pieces$/ }).click();
  await expect(
    page.getByRole("heading", { name: "Training Overview" }),
  ).toBeVisible({ timeout: 15000 });
  await new TrainingOverviewPage(page).startAsChecklist();
  const trainingListPage = new TrainingListPage(page);
  await trainingListPage.expectVisible();
  const names = await trainingListPage.exerciseNames();
  await trainingListPage.discard();
  await new TrainingOverviewPage(page).expectVisible();
  await page.goto("/");
  await openOwnTrainings(page);
  await expect(
    page.getByRole("button", { name: "My versions", exact: true }),
  ).toBeVisible();
  return names.sort();
}

test.describe("Custom workouts: drawn workouts", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete starts an own training twice at home, sees the same exercises and sees a new set list after the refresh", async ({
    page,
  }) => {
    test.setTimeout(150000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    await page.goto("/");
    await new BasePage(page).expectLoggedIn();
    await openOwnTrainings(page);
    await importFileThrough(page, "Import training", VERSIONS_FILE);
    await expect(
      page.getByRole("button", { name: "My versions", exact: true }),
    ).toBeVisible();

    const firstStart = await startAtHomeAndReadExercises(page);
    const secondStart = await startAtHomeAndReadExercises(page);

    expect(firstStart.length).toBeGreaterThan(0);
    expect(secondStart).toEqual(firstStart);

    await page.getByRole("button", { name: "Refresh My versions" }).click();
    await expect(
      page.getByText("Create a new version of My versions?"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Create", exact: true }).click();

    const startAfterRefresh = await startAtHomeAndReadExercises(page);

    expect(startAfterRefresh).not.toEqual(firstStart);
  });
});
