import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import customWorkout from "./mocks/files/custom-workout.json";
import invalidWorkout from "./mocks/files/custom-workout-invalid.json";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import {
  generateTeamWorkoutRow,
  mockTeamWithWorkouts,
  type TeamWorkoutRow,
} from "./mocks/teams";
import { mockWakeLock } from "./mocks/wakeLock";
import { BasePage, WorkoutPage } from "./pages";
import { getCompletedWorkouts } from "./utils/storage";

const TEAM = { id: "11111111-1111-4111-8111-111111111111", name: "Team Alpha" };

const TEAM_CORE_ROW = generateTeamWorkoutRow(
  "22222222-2222-4222-8222-222222222222",
  { ...customWorkout, name: { en: "Team core", de: "Team Rumpf" } },
);
const TEAM_SPRINT_ROW = generateTeamWorkoutRow(
  "33333333-3333-4333-8333-333333333333",
  { ...customWorkout, name: { en: "Team sprint", de: "Team Sprint" } },
);
const INVALID_ROW = generateTeamWorkoutRow(
  "44444444-4444-4444-8444-444444444444",
  invalidWorkout,
);
const TEAM_DRAFT_ROW: TeamWorkoutRow = {
  ...generateTeamWorkoutRow("55555555-5555-4555-8555-555555555555", {
    ...customWorkout,
    name: { en: "Team draft", de: "Team Entwurf" },
  }),
  status: "draft",
};

async function openTeamTile(page: Page) {
  await page.getByRole("button", { name: "Additional trainings" }).click();
  await page.getByRole("button", { name: TEAM.name }).click();
}

test.describe("Team workouts: sync on a team tile", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete opens a team tile, completes a team workout and sees the trainer's deletion on the next tap", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);
    const server = await mockTeamWithWorkouts(page, TEAM);
    server.setRows([
      TEAM_CORE_ROW,
      TEAM_SPRINT_ROW,
      INVALID_ROW,
      TEAM_DRAFT_ROW,
    ]);

    const basePage = new BasePage(page);
    const workoutPage = new WorkoutPage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();
    const startCount = await getCompletedWorkouts(page);

    const releaseFirstSync = server.holdNextResponse();
    await openTeamTile(page);
    await expect(page.getByLabel("Loading trainings")).toBeVisible();
    releaseFirstSync();

    await expect(page.getByRole("button", { name: "Team core" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Team sprint" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Broken" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Team draft" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Import training" }),
    ).toHaveCount(0);
    await page.screenshot({
      path: "playwright/screenshots/team-workouts-list.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: "Team sprint" }).click();
    await expect(
      page.getByRole("heading", { name: "Where do you train today?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^At home, \d+ pieces$/ }).click();
    await expect(
      page.getByRole("heading", { name: "Training Overview" }),
    ).toBeVisible({ timeout: 15000 });
    await workoutPage.beginWorkout();
    await expect(
      page.getByRole("heading", { name: "Team sprint" }),
    ).toBeVisible();
    await workoutPage.completeWorkout();
    await workoutPage.returnToHome();
    expect(await getCompletedWorkouts(page)).toBe(startCount + 1);

    server.setRows([TEAM_SPRINT_ROW]);
    await openTeamTile(page);
    await expect(
      page.getByRole("button", { name: "Team sprint" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Team core" })).toHaveCount(
      0,
    );

    server.goOffline();
    await page.goBack();
    await page.getByRole("button", { name: TEAM.name }).click();
    await expect(
      page.getByText(
        "You are offline. The list shows the trainings of the last sync.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Team sprint" }),
    ).toBeVisible();
  });
});
