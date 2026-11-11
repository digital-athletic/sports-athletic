import { expect, test, type Page } from "@playwright/test";
import {
  mockSupabase,
  MOCK_USER,
  type MockTeamWorkout,
} from "./mocks/supabase";
import { LoginPage } from "./pages/LoginPage";
import { TeamSelectionPage } from "./pages/TeamSelectionPage";
import { WorkoutsPage } from "./pages/WorkoutsPage";

const TRAINER = new Date().toISOString();
const OTHER_OWNER = "11111111-1111-4111-8111-11111111cccc";

const TEAM = {
  id: "55555555-5555-4555-8555-555555555555",
  name: "U15 Handball",
  members: [{ user_id: MOCK_USER.id, role: "owner" as const }],
};

const SAVED: MockTeamWorkout = {
  id: "44444444-4444-4444-8444-444444444444",
  team_id: TEAM.id,
  template: {
    aiwl: 1,
    id: "44444444-4444-4444-8444-444444444444",
    name: { en: "Tuesday stability" },
    blocks: [
      {
        kind: "picks",
        skill: "GKS",
        picks: [{ tags: ["REGION_UPPER_BODY"], count: 5 }],
      },
      { kind: "duration", skill: "CARDIO_2", duration: 1200 },
    ],
  },
};

async function openWorkouts(page: Page) {
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(MOCK_USER.email);
  await new TeamSelectionPage(page).openTeam(TEAM.name);
  const workouts = new WorkoutsPage(page);
  await workouts.open();
  return workouts;
}

/** Resolves with the body of the next call to the RPC `name`. */
async function nextRpcBody(page: Page, name: string): Promise<unknown> {
  const request = await page.waitForRequest((r) =>
    r.url().includes(`/rpc/${name}`),
  );
  return request.postDataJSON();
}

test.describe("Workouts tab", () => {
  test("an owner sees a saved workout with its section tags and deletes it", async ({
    page,
  }) => {
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [SAVED],
    });
    const workouts = await openWorkouts(page);

    await workouts.expectWorkout("Tuesday stability");
    await workouts.expectSectionTags("Tuesday stability", 0, [
      "REGION_UPPER_BODY",
    ]);
    await workouts.expectSectionTags("Tuesday stability", 1, []);

    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [],
    });
    const deleted = nextRpcBody(page, "delete_team_workout");
    await workouts.deleteWorkout("Tuesday stability");
    expect(await deleted).toEqual({
      p_team_id: TEAM.id,
      p_workout_id: SAVED.id,
    });
    await workouts.expectNoWorkouts();
  });

  test("a team without workouts shows the empty state", async ({ page }) => {
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [],
    });
    const workouts = await openWorkouts(page);

    await workouts.expectNoWorkouts();
  });

  test("a co-owner sees the workouts without edit actions", async ({
    page,
  }) => {
    const coOwned = {
      ...TEAM,
      owner_id: OTHER_OWNER,
      members: [
        { user_id: OTHER_OWNER, role: "owner" as const },
        { user_id: MOCK_USER.id, role: "co_owner" as const },
      ],
    };
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [coOwned],
      teamWorkouts: [SAVED],
    });
    const workouts = await openWorkouts(page);

    await workouts.expectWorkout("Tuesday stability");
    await workouts.expectNoEditActions();
  });
});
