import { type Page } from "@playwright/test";
import path from "node:path";
import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { BasePage, WorkoutPage } from "./pages";
import { getCompletedWorkouts } from "./utils/storage";

const FIXTURE_DIRECTORY = path.join(__dirname, "mocks", "files");
const VALID_FILE = path.join(FIXTURE_DIRECTORY, "custom-workout.json");
const RENAMED_FILE = path.join(
  FIXTURE_DIRECTORY,
  "custom-workout-renamed.json",
);
const INVALID_FILE = path.join(
  FIXTURE_DIRECTORY,
  "custom-workout-invalid.json",
);

/** Clicks the button and answers the browser file dialog with the file. */
async function importFileThrough(
  page: Page,
  buttonName: string,
  filePath: string,
) {
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: buttonName }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(filePath);
}

test.describe("Custom workouts: import of own trainings", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete imports a training file, replaces it and completes it", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const basePage = new BasePage(page);
    const workoutPage = new WorkoutPage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();
    const startCount = await getCompletedWorkouts(page);

    await page.getByRole("button", { name: "Additional trainings" }).click();
    await page.getByRole("button", { name: "Your trainings" }).click();
    await expect(
      page.getByText("Currently no workouts available"),
    ).toBeVisible();
    await page.screenshot({
      path: "playwright/screenshots/custom-workouts-empty.png",
      fullPage: true,
    });

    await importFileThrough(page, "Import training", INVALID_FILE);
    await expect(
      page.getByText(
        "The file contains skills or blocks that this app does not support yet.",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(
      page.getByText("Currently no workouts available"),
    ).toBeVisible();

    await importFileThrough(page, "Import training", VALID_FILE);
    await expect(page.getByRole("button", { name: "My core" })).toBeVisible();
    await expect(page.getByText("Currently no workouts available")).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Import training" }),
    ).toBeVisible();
    await page.screenshot({
      path: "playwright/screenshots/custom-workouts-list.png",
      fullPage: true,
    });

    await importFileThrough(page, "Import training", RENAMED_FILE);
    await expect(
      page.getByRole("button", { name: "My core v2" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "My core", exact: true }),
    ).toHaveCount(0);

    await page.reload();
    await expect(
      page.getByRole("button", { name: "My core v2" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "My core v2" }).click();
    await expect(
      page.getByRole("heading", { name: "Place & Equipment" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^At home, \d+ pieces$/ }).click();
    await expect(
      page.getByRole("heading", { name: "Training Overview" }),
    ).toBeVisible({ timeout: 15000 });

    await workoutPage.beginWorkout();
    await expect(
      page.getByRole("heading", { name: "My core v2" }),
    ).toBeVisible();
    await workoutPage.completeWorkout();
    await workoutPage.returnToHome();

    expect(await getCompletedWorkouts(page)).toBe(startCount + 1);
  });
});
