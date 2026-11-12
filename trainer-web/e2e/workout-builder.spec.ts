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

const SAVED_BLOCKS = [
  {
    kind: "picks",
    skill: "GKS",
    picks: [{ tags: ["REGION_UPPER_BODY"], count: 5 }],
  },
  { kind: "duration", skill: "CARDIO_2", duration: 1200 },
];

const SAVED: MockTeamWorkout = {
  id: "44444444-4444-4444-8444-444444444444",
  team_id: TEAM.id,
  template: {
    aiwl: 1,
    id: "44444444-4444-4444-8444-444444444444",
    name: { en: "Tuesday stability" },
    blocks: SAVED_BLOCKS,
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
        blocks: SAVED_BLOCKS,
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

  test("an owner saves a new workout as a draft, publishes it and moves it back to draft", async ({
    page,
  }) => {
    const draft: MockTeamWorkout = { ...SAVED, status: "draft" };
    const published: MockTeamWorkout = { ...SAVED, status: "published" };
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [],
    });
    const workouts = await openWorkouts(page);

    await workouts.startNewWorkout();
    await workouts.fillName("Tuesday stability");
    await workouts.addSection({
      skill: "GKS",
      tags: ["REGION_UPPER_BODY"],
      amount: 5,
    });
    await workouts.addSection({ skill: "CARDIO_2", amount: 20 });
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [draft],
    });
    await workouts.save();
    await workouts.expectBuilderClosed();
    await workouts.expectDraft("Tuesday stability");

    const publishCall = nextRpcBody(page, "set_team_workout_status");
    await workouts.publish("Tuesday stability");
    expect(await publishCall).toEqual({
      p_team_id: TEAM.id,
      p_workout_id: SAVED.id,
      p_status: "published",
    });
    await workouts.expectPublished("Tuesday stability");
    await workouts.expectPublishedNotice("Tuesday stability");

    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [published],
    });
    const draftCall = nextRpcBody(page, "set_team_workout_status");
    await workouts.moveToDraft("Tuesday stability");
    expect(await draftCall).toEqual({
      p_team_id: TEAM.id,
      p_workout_id: SAVED.id,
      p_status: "draft",
    });
    await workouts.expectDraft("Tuesday stability");
    await workouts.expectNoPublishedNotice();
  });

  test("an owner builds a workout with warm-up, a knee and hip prevention section and cool-down, then publishes it", async ({
    page,
  }) => {
    const blocks = [
      { kind: "picks", skill: "WU", picks: [{ tags: [], count: 4 }] },
      {
        kind: "picks",
        skill: "PREV",
        picks: [{ tags: ["PREVENTION_KNEE_HIP"], count: 6 }],
      },
      { kind: "picks", skill: "CD", picks: [{ tags: [], count: 3 }] },
    ];
    const draft: MockTeamWorkout = {
      ...SAVED,
      status: "draft",
      template: { ...SAVED.template, name: { en: "Knee care" }, blocks },
    };
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [],
    });
    const workouts = await openWorkouts(page);

    await workouts.startNewWorkout();
    await workouts.fillName("Knee care");
    await workouts.tickFixedSection("warm-up", 4);
    await workouts.tickFixedSection("cool-down", 3);
    await workouts.addSection({
      skill: "PREV",
      tags: ["PREVENTION_KNEE_HIP"],
      amount: 6,
    });

    const offered = await workouts.offeredSkills(0);
    expect(offered).not.toContain("WU");
    expect(offered).not.toContain("CD");
    expect(offered).toEqual(
      expect.arrayContaining(["BAS", "BR", "WUSKSA", "CARDIO_1_SHORT"]),
    );
    expect(await workouts.offeredTags(0)).toEqual([
      "PREVENTION_SHOULDER",
      "PREVENTION_KNEE_HIP",
      "PREVENTION_SPINE",
      "PREVENTION_ANKLE",
      "PREVENTION_WRIST_ELBOW",
    ]);

    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [draft],
    });
    const saved = nextRpcBody(page, "save_team_workout");
    await workouts.save();
    expect(await saved).toMatchObject({ p_template: { blocks } });
    await workouts.expectBuilderClosed();

    await workouts.publish("Knee care");
    await workouts.expectPublishedNotice("Knee care");

    await workouts.editWorkout("Knee care");
    await workouts.expectFixedSectionTicked("warm-up", 4);
    await workouts.expectFixedSectionTicked("cool-down", 3);
    await workouts.expectSectionSkills(["PREV"]);

    await workouts.cancel();
    await workouts.expectNoPublishedNotice();
  });

  test("a saved workout with an unknown section opens in the builder without that section", async ({
    page,
  }) => {
    const withUnknown: MockTeamWorkout = {
      ...SAVED,
      template: {
        ...SAVED.template,
        blocks: [
          SAVED_BLOCKS[0],
          { kind: "picks", skill: "NOPE", picks: [{ tags: [], count: 2 }] },
          SAVED_BLOCKS[1],
        ],
      },
    };
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [TEAM],
      teamWorkouts: [withUnknown],
    });
    const workouts = await openWorkouts(page);

    await workouts.editWorkout("Tuesday stability");
    await workouts.expectSectionSkills(["GKS", "CARDIO_2"]);
  });

  test("every section other than prevention offers body regions only", async ({
    page,
  }) => {
    await mockSupabase(page, { trainerGrantedAt: TRAINER, teams: [TEAM] });
    const workouts = await openWorkouts(page);

    await workouts.startNewWorkout();
    await workouts.addSection({ skill: "MOB", amount: 4 });
    expect(await workouts.offeredTags(0)).toEqual([
      "REGION_UPPER_BODY",
      "REGION_LOWER_BODY",
      "REGION_CORE",
    ]);
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
    await workouts.addSection({ skill: "BAS", amount: 3 });
    await workouts.moveSectionUp(2);
    await workouts.moveSectionUp(1);
    await workouts.expectSectionSkills(["BAS", "GKS", "CARDIO_2"]);
    await workouts.removeSection(1);
    await workouts.expectSectionSkills(["BAS", "CARDIO_2"]);

    const saved = nextRpcBody(page, "save_team_workout");
    await workouts.save();
    expect(await saved).toMatchObject({
      p_team_id: TEAM.id,
      p_workout_id: SAVED.id,
      p_template: {
        id: SAVED.id,
        blocks: [
          { kind: "picks", skill: "BAS", picks: [{ tags: [], count: 3 }] },
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

  test("a co-owner sees drafts without edit actions", async ({ page }) => {
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
      teamWorkouts: [{ ...SAVED, status: "draft" }],
    });
    const workouts = await openWorkouts(page);

    await workouts.expectDraft("Tuesday stability");
    await workouts.expectNoEditActions();
  });

  test("a member sees the published workouts without edit actions", async ({
    page,
  }) => {
    const joined = {
      ...TEAM,
      owner_id: OTHER_OWNER,
      members: [
        { user_id: OTHER_OWNER, role: "owner" as const },
        { user_id: MOCK_USER.id, role: "member" as const },
      ],
    };
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [joined],
      teamWorkouts: [SAVED],
    });
    const workouts = await openWorkouts(page);

    await workouts.expectPublished("Tuesday stability");
    await workouts.expectNoEditActions();
  });
});
