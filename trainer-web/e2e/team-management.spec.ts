import { expect, test } from "@playwright/test";
import { mockSupabase, MOCK_USER } from "./mocks/supabase";
import { LoginPage } from "./pages/LoginPage";
import { TeamSelectionPage } from "./pages/TeamSelectionPage";
import { DashboardPage } from "./pages/DashboardPage";

const TRAINER = new Date().toISOString();

const NEW_TEAM = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "U19 Handball",
  invite_code: "ABC123",
  members: [{ user_id: MOCK_USER.id, role: "owner" as const }],
};

test.describe("Creating a group", () => {
  test("a trainer creates a group and lands on its dashboard", async ({
    page,
  }) => {
    // The mock holds no state, so the test names both worlds: the empty one
    // before the write and the one the backend would return after it. Routes
    // registered later win, so the second call replaces the first.
    await mockSupabase(page, { trainerGrantedAt: TRAINER, teams: [] });

    const login = new LoginPage(page);
    const teamSelection = new TeamSelectionPage(page);
    const dashboard = new DashboardPage(page);

    await login.goto();
    await login.signIn(MOCK_USER.email);
    await teamSelection.expectNoTeams();

    await mockSupabase(page, { trainerGrantedAt: TRAINER, teams: [NEW_TEAM] });
    await teamSelection.createTeam(NEW_TEAM.name);

    await dashboard.expectVisible(NEW_TEAM.id);
  });

  test("without a trainer grant the group cannot be created", async ({
    page,
  }) => {
    await mockSupabase(page, { trainerGrantedAt: null, teams: [] });

    const login = new LoginPage(page);
    const teamSelection = new TeamSelectionPage(page);

    await login.goto();
    await login.signIn(MOCK_USER.email);

    await teamSelection.expectVisible();
    await teamSelection.expectCreateUnavailable();
  });
});

test.describe("Joining a group", () => {
  test("an invite code opens the group", async ({ page }) => {
    await mockSupabase(page, { trainerGrantedAt: null, teams: [] });

    const login = new LoginPage(page);
    const teamSelection = new TeamSelectionPage(page);
    const dashboard = new DashboardPage(page);

    await login.goto();
    await login.signIn(MOCK_USER.email);
    await teamSelection.expectNoTeams();

    await mockSupabase(page, { trainerGrantedAt: null, teams: [NEW_TEAM] });
    await teamSelection.joinTeam("ABC123");

    await dashboard.expectVisible(NEW_TEAM.id);
  });

  test("a rejected invite code keeps the user on the selection", async ({
    page,
  }) => {
    // The interesting failures of accept_invitation come from Postgres, and a
    // test cannot provoke them any other way. Which codes exist and when they
    // are raised is settled in supabase/tests/accept_invitation.test.sql.
    await mockSupabase(page, {
      trainerGrantedAt: null,
      teams: [],
      rpc: { accept_invitation: { error: "INVITE_CODE_INVALID" } },
    });

    const login = new LoginPage(page);
    const teamSelection = new TeamSelectionPage(page);

    await login.goto();
    await login.signIn(MOCK_USER.email);
    await teamSelection.joinTeam("WRONG1");

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    // The message must be the translated one, never the raw error code.
    await expect(alert).not.toContainText("INVITE_CODE_INVALID");
    await expect(page).toHaveURL(/\/teams/);
  });
});
