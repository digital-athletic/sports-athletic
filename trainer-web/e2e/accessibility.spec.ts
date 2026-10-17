import { expect, test, type Page } from "@playwright/test";
import { mockSupabase, MOCK_USER } from "./mocks/supabase";
import { LoginPage } from "./pages/LoginPage";
import { TeamSelectionPage } from "./pages/TeamSelectionPage";
import { DashboardPage } from "./pages/DashboardPage";

const TEAM = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "U15 Handball",
  invite_code: "JOIN02",
  members: [
    { user_id: MOCK_USER.id, role: "owner" as const, display_name: "Trainer" },
    {
      user_id: "11111111-1111-4111-8111-11111111aaaa",
      display_name: "Erika Mustermann",
    },
    {
      user_id: "11111111-1111-4111-8111-11111111bbbb",
      display_name: "Max Mustermann",
    },
  ],
};

async function openDashboard(page: Page) {
  await mockSupabase(page, {
    trainerGrantedAt: new Date().toISOString(),
    teams: [TEAM],
  });
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(MOCK_USER.email);
  await new TeamSelectionPage(page).openTeam(TEAM.name);
  const dashboard = new DashboardPage(page);
  await dashboard.expectVisible(TEAM.id);
  return dashboard;
}

test.describe("Dashboard accessibility", () => {
  test("the document language is German", async ({ page }) => {
    await openDashboard(page);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
  });

  test("an athlete is selected with the keyboard", async ({ page }) => {
    const dashboard = await openDashboard(page);
    await dashboard.openEvaluations();

    await dashboard.selectAthleteByKeyboard("Max Mustermann");
    await dashboard.expectAthleteSelected("Max Mustermann");
  });

  test("the confirm dialog traps focus and closes with Escape", async ({
    page,
  }) => {
    const dashboard = await openDashboard(page);
    await dashboard.openDeleteTeamDialog();

    const dialog = dashboard.dialog;
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).toHaveAccessibleName(/.+/);

    const buttons = dialog.getByRole("button");
    await expect(buttons.first()).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(buttons.last()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(buttons.first()).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(buttons.last()).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("delete-team-open")).toBeFocused();
  });
});
