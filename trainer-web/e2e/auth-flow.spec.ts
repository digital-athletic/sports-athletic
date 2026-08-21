import { test } from "@playwright/test";
import { mockSupabase, MOCK_USER } from "./mocks/supabase";
import { LoginPage } from "./pages/LoginPage";
import { TeamSelectionPage } from "./pages/TeamSelectionPage";

test.describe("Auth flow: signing in", () => {
  test("a trainer without teams reaches the empty team selection", async ({
    page,
  }) => {
    await mockSupabase(page, { trainerGrantedAt: new Date().toISOString() });

    const login = new LoginPage(page);
    const teamSelection = new TeamSelectionPage(page);

    await login.goto();
    await login.signIn(MOCK_USER.email);

    await teamSelection.expectVisible();
    await teamSelection.expectNoTeams();
  });

  test("existing teams are listed after signing in", async ({ page }) => {
    await mockSupabase(page, {
      trainerGrantedAt: new Date().toISOString(),
      teams: [
        { id: "11111111-1111-4111-8111-111111111111", name: "U17 Handball" },
      ],
    });

    const login = new LoginPage(page);
    const teamSelection = new TeamSelectionPage(page);

    await login.goto();
    await login.signIn(MOCK_USER.email);

    await teamSelection.expectVisible();
    await teamSelection.expectTeam("U17 Handball");
  });
});
