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

/** Collects the bodies of every call to one RPC, to prove a call never left. */
function recordRpc(page: Page, name: string) {
  const bodies: unknown[] = [];
  page.on("request", (request) => {
    if (request.url().includes(`/rpc/${name}`)) {
      bodies.push(request.postDataJSON());
    }
  });
  return bodies;
}

test.describe("Workout builder", () => {
  test("an owner creates a workout with a tagged stability section and a cardio section, then deletes it", async ({
    page,
  }) => {
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [],
    });
    const workouts = await openWorkouts(page);
    await workouts.expectNoWorkouts();

    await workouts.startNewWorkout();
    await workouts.fillName("Tuesday stability");
    await workouts.addSection({
      skill: "GKS",
      tags: ["REGION_UPPER_BODY"],
      amount: 5,
    });
    await workouts.addSection({ skill: "CARDIO_2", amount: 20 });

    // After the save, the list query returns the saved workout.
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [SAVED],
    });
    const saved = nextRpcBody(page, "save_team_workout");
    await workouts.save();
    expect(await saved).toMatchObject({
      p_team_id: TEAM.id,
      p_workout_id: null,
      p_template: {
        aiwl: 1,
        name: { en: "Tuesday stability" },
        blocks: SAVED.template.blocks,
      },
    });

    await workouts.expectBuilderClosed();
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

  test("a cardio section asks for minutes and every other section for exercises", async ({
    page,
  }) => {
    await mockSupabase(page, { trainerGrantedAt: TRAINER, teams: [TEAM] });
    const workouts = await openWorkouts(page);

    await workouts.startNewWorkout();
    await workouts.addSection({ skill: "MOB", amount: 4 });
    await workouts.expectSectionUnit(0, "exercises");

    await workouts.fillSection(workouts.section(0), {
      skill: "CARDIO_4",
      amount: 30,
    });
    await workouts.expectSectionUnit(0, "minutes");
  });

  test("the builder refuses a draft that lacks a name or a section, or has an amount out of range", async ({
    page,
  }) => {
    await mockSupabase(page, { trainerGrantedAt: TRAINER, teams: [TEAM] });
    const saves = recordRpc(page, "save_team_workout");
    const workouts = await openWorkouts(page);

    await workouts.startNewWorkout();
    await workouts.save();
    await workouts.expectError("NAME_REQUIRED");
    await workouts.expectError("SECTION_REQUIRED");

    await workouts.fillName("Too much");
    await workouts.addSection({ skill: "GKS", amount: 21 });
    await workouts.addSection({ skill: "CARDIO_3", amount: 4 });
    await workouts.save();
    await workouts.expectError("AMOUNT_OUT_OF_RANGE-0");
    await workouts.expectError("AMOUNT_OUT_OF_RANGE-1");

    expect(saves).toHaveLength(0);
  });

  test("an owner reorders and removes sections of a saved workout", async ({
    page,
  }) => {
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [SAVED],
    });
    const workouts = await openWorkouts(page);

    await workouts.editWorkout("Tuesday stability");
    await workouts.expectSectionSkills(["GKS", "CARDIO_2"]);
    await workouts.addSection({ skill: "WU", amount: 3 });
    await workouts.moveSectionUp(2);
    await workouts.moveSectionUp(1);
    await workouts.expectSectionSkills(["WU", "GKS", "CARDIO_2"]);
    await workouts.removeSection(1);
    await workouts.expectSectionSkills(["WU", "CARDIO_2"]);

    const saved = nextRpcBody(page, "save_team_workout");
    await workouts.save();
    expect(await saved).toMatchObject({
      p_team_id: TEAM.id,
      p_workout_id: SAVED.id,
      p_template: {
        id: SAVED.id,
        blocks: [
          { kind: "picks", skill: "WU", picks: [{ tags: [], count: 3 }] },
          { kind: "duration", skill: "CARDIO_2", duration: 1200 },
        ],
      },
    });
    await workouts.expectBuilderClosed();
  });

  test("after a rejected save, the builder stays open and shows the reason", async ({
    page,
  }) => {
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      rpc: { save_team_workout: { error: "INVALID_WORKOUT_TEMPLATE" } },
    });
    const workouts = await openWorkouts(page);

    await workouts.startNewWorkout();
    await workouts.fillName("Tuesday stability");
    await workouts.addSection({ skill: "PREV", amount: 6 });
    await workouts.save();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText("INVALID_WORKOUT_TEMPLATE");
    await expect(page.getByTestId("workout-builder")).toBeVisible();
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
