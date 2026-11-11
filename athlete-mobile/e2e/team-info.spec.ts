import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";

const TEAM = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "U19 Keepers",
  owner_id: "11111111-1111-4111-8111-11111111cccc",
  guidance:
    "Team sessions Mon and Thu 18:00. Add one strength day on your own.",
  weekly_training_days: 3,
};

/** Answers the team list and the single team read the info page makes. */
async function mockTeam(page: Page, team: typeof TEAM) {
  await page.route("**/rest/v1/team_members**", (route) =>
    route.fulfill({ json: [{ team_id: team.id }] }),
  );
  await page.route("**/rest/v1/teams**", (route) => {
    // The list filters with id=in.(...), the info page with id=eq.<id>.
    const id = new URL(route.request().url()).searchParams.get("id");
    return route.fulfill({ json: id?.startsWith("eq.") ? team : [team] });
  });
}

test.describe("Team info page: opening from Your Teams", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete opens a team and reads guidance and weekly target", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();
    // mockSupabaseAuth registers its catch-all route without awaiting it.
    // Registered after the app starts, the team routes take priority (LIFO).
    await mockTeam(page, TEAM);
    await page.goto("/join-team");

    await page.getByRole("button", { name: TEAM.name }).click();

    await expect(page).toHaveURL(new RegExp(`/team/${TEAM.id}`));
    await expect(page.getByRole("heading", { name: TEAM.name })).toBeVisible();
    await expect(page.getByText("3 training days per week")).toBeVisible();
    await expect(page.getByText(TEAM.guidance)).toBeVisible();
  });
});
