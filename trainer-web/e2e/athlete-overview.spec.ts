import { test } from "@playwright/test";
import { mockSupabase, MOCK_USER } from "./mocks/supabase";
import { LoginPage } from "./pages/LoginPage";
import { TeamSelectionPage } from "./pages/TeamSelectionPage";
import { DashboardPage } from "./pages/DashboardPage";

const ERIKA = "11111111-1111-4111-8111-11111111aaaa";
const MAX = "11111111-1111-4111-8111-11111111bbbb";

const TEAM = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "U17 Handball",
  invite_code: "JOIN01",
  members: [
    { user_id: MOCK_USER.id, role: "owner" as const, display_name: "Trainer" },
    { user_id: ERIKA, display_name: "Erika Mustermann" },
    { user_id: MAX, display_name: "Max Mustermann" },
  ],
};

// The default time period is the last week, so the dates have to fall inside it.
const recently = (daysAgo: number) =>
  Date.now() - daysAgo * 24 * 60 * 60 * 1000;

test.describe("Athlete overview", () => {
  test("the evaluation lists the athletes of a group with their workouts", async ({
    page,
  }) => {
    await mockSupabase(page, {
      trainerGrantedAt: new Date().toISOString(),
      teams: [TEAM],
      workouts: {
        [ERIKA]: [
          { workout_date: recently(1) },
          { workout_date: recently(2) },
          { workout_date: recently(3) },
        ],
        [MAX]: [{ workout_date: recently(1) }],
      },
    });

    const login = new LoginPage(page);
    const teamSelection = new TeamSelectionPage(page);
    const dashboard = new DashboardPage(page);

    await login.goto();
    await login.signIn(MOCK_USER.email);

    await teamSelection.openTeam(TEAM.name);
    await dashboard.expectVisible(TEAM.id);
    await dashboard.expectMember("Erika Mustermann");

    await dashboard.openEvaluations();

    // The owner runs the group and is not one of its athletes.
    await dashboard.expectAthletes(["Erika Mustermann", "Max Mustermann"]);

    await dashboard.selectAthlete("Erika Mustermann");
    await dashboard.expectTrainingCount(3);

    await dashboard.selectAthlete("Max Mustermann");
    await dashboard.expectTrainingCount(1);
  });

  test("a group without athletes shows the empty evaluation", async ({
    page,
  }) => {
    await mockSupabase(page, {
      trainerGrantedAt: new Date().toISOString(),
      teams: [
        {
          ...TEAM,
          members: [{ user_id: MOCK_USER.id, role: "owner" as const }],
        },
      ],
    });

    const login = new LoginPage(page);
    const teamSelection = new TeamSelectionPage(page);
    const dashboard = new DashboardPage(page);

    await login.goto();
    await login.signIn(MOCK_USER.email);

    await teamSelection.openTeam(TEAM.name);
    await dashboard.openEvaluations();
    await dashboard.expectNoAthletes();
  });
});
