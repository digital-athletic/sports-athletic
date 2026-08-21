import { test } from "@playwright/test";
import { mockSupabase, MOCK_USER } from "./mocks/supabase";
import { LoginPage } from "./pages/LoginPage";
import { TeamSelectionPage } from "./pages/TeamSelectionPage";
import { DashboardPage } from "./pages/DashboardPage";

const ANNA = "11111111-1111-4111-8111-11111111aaaa";
const BEN = "11111111-1111-4111-8111-11111111bbbb";

const TEAM = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "U17 Handball",
  invite_code: "JOIN01",
  members: [
    { user_id: MOCK_USER.id, role: "owner" as const, display_name: "Trainer" },
    { user_id: ANNA, display_name: "Anna Schmidt" },
    { user_id: BEN, display_name: "Ben Weber" },
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
        [ANNA]: [
          { workout_date: recently(1) },
          { workout_date: recently(2) },
          { workout_date: recently(3) },
        ],
        [BEN]: [{ workout_date: recently(1) }],
      },
    });

    const login = new LoginPage(page);
    const teamSelection = new TeamSelectionPage(page);
    const dashboard = new DashboardPage(page);

    await login.goto();
    await login.signIn(MOCK_USER.email);

    await teamSelection.openTeam(TEAM.name);
    await dashboard.expectVisible(TEAM.id);
    await dashboard.expectMember("Anna Schmidt");

    await dashboard.openEvaluations();

    // The owner runs the group and is not one of its athletes.
    await dashboard.expectAthletes(["Anna Schmidt", "Ben Weber"]);

    await dashboard.selectAthlete("Anna Schmidt");
    await dashboard.expectTrainingCount(3);

    await dashboard.selectAthlete("Ben Weber");
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
