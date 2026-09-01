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

    // The dashboard reads the group back through getTeamById, so what the form
    // sent is only visible on the request itself.
    const created = page.waitForRequest((request) =>
      request.url().includes("/rpc/create_team"),
    );
    await teamSelection.createTeam(NEW_TEAM.name);
    expect((await created).postDataJSON()).toMatchObject({
      p_name: NEW_TEAM.name,
    });

    await dashboard.expectVisible(NEW_TEAM.id);
    await dashboard.expectTeamName(NEW_TEAM.name);
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

  test("a rejected creation keeps the user on the selection", async ({
    page,
  }) => {
    // The grant can be revoked between loading the page and submitting, which
    // is the one way this button reaches a NOT_A_TRAINER.
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [],
      rpc: { create_team: { error: "NOT_A_TRAINER" } },
    });

    const login = new LoginPage(page);
    const teamSelection = new TeamSelectionPage(page);

    await login.goto();
    await login.signIn(MOCK_USER.email);
    await teamSelection.createTeam("U19 Handball");

    await teamSelection.expectErrorWithoutCode("NOT_A_TRAINER");
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
    await teamSelection.joinTeam(NEW_TEAM.invite_code);

    await dashboard.expectVisible(NEW_TEAM.id);
  });

  test("a wrong invite code keeps the user on the selection", async ({
    page,
  }) => {
    // Unlike the group name, a code that does not match really is rejected by
    // the backend, so the mock checks it rather than accepting anything. Which
    // codes exist is settled in supabase/tests/accept_invitation.test.sql.
    await mockSupabase(page, { trainerGrantedAt: null, teams: [NEW_TEAM] });

    const login = new LoginPage(page);
    const teamSelection = new TeamSelectionPage(page);

    await login.goto();
    await login.signIn(MOCK_USER.email);
    await teamSelection.joinTeam("WRONG1");

    await teamSelection.expectErrorWithoutCode("INVITE_CODE_INVALID");
  });
});
