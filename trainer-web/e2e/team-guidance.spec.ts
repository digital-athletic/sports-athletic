import { expect, test, type Page } from "@playwright/test";
import { mockSupabase, MOCK_USER, type MockTeam } from "./mocks/supabase";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TeamSelectionPage } from "./pages/TeamSelectionPage";
import { TeamGuidanceForm } from "./pages/TeamGuidanceForm";

const TRAINER = new Date().toISOString();
const OTHER_OWNER = "11111111-1111-4111-8111-11111111cccc";

const OWNED_TEAM: MockTeam = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "U19 Keepers",
  description: "U19 squad",
  guidance: "Team sessions Mon and Thu 18:00.",
  weekly_training_days: 3,
  invite_code: "KEEP01",
};

const foreignTeam = (role: "member" | "co_owner"): MockTeam => ({
  ...OWNED_TEAM,
  owner_id: OTHER_OWNER,
  members: [
    { user_id: OTHER_OWNER, role: "owner" },
    { user_id: MOCK_USER.id, role },
  ],
});

async function signInAndOpen(page: Page, team: MockTeam) {
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(MOCK_USER.email);
  await new TeamSelectionPage(page).openTeam(team.name);
  await new DashboardPage(page).expectTeamName(team.name);
}

async function openDashboard(page: Page, team: MockTeam) {
  await mockSupabase(page, { trainerGrantedAt: TRAINER, teams: [team] });
  await signInAndOpen(page, team);
}

function guidanceRequest(page: Page) {
  return page.waitForRequest((request) =>
    request.url().includes("/rpc/update_team_guidance"),
  );
}

test.describe("Team guidance", () => {
  test("the owner sees the form prefilled with the saved values", async ({
    page,
  }) => {
    await openDashboard(page, OWNED_TEAM);

    const form = new TeamGuidanceForm(page);
    await form.expectVisible();
    await form.expectValues("Team sessions Mon and Thu 18:00.", "3");
  });

  for (const role of ["member", "co_owner"] as const) {
    test(`a ${role} does not see the form`, async ({ page }) => {
      await openDashboard(page, foreignTeam(role));

      await new TeamGuidanceForm(page).expectHidden();
    });
  }

  test("saving shows the stored values, and they survive a reload", async ({
    page,
  }) => {
    await openDashboard(page, {
      ...OWNED_TEAM,
      guidance: null,
      weekly_training_days: null,
    });
    const form = new TeamGuidanceForm(page);
    await form.expectValues("", "");

    await form.fill("  Mon and Thu 18:00. Add one strength day.  ", "4");
    const sent = guidanceRequest(page);
    await form.save();
    expect((await sent).postDataJSON()).toMatchObject({
      p_team_id: OWNED_TEAM.id,
      p_guidance: "Mon and Thu 18:00. Add one strength day.",
      p_weekly_training_days: 4,
    });

    await form.expectSaved();
    await form.expectValues("Mon and Thu 18:00. Add one strength day.", "4");

    // The world after the write: the backend now returns the stored values.
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [
        {
          ...OWNED_TEAM,
          guidance: "Mon and Thu 18:00. Add one strength day.",
          weekly_training_days: 4,
        },
      ],
    });
    await page.reload();
    await form.expectValues("Mon and Thu 18:00. Add one strength day.", "4");
  });

  test("emptying both fields and saving clears the values", async ({
    page,
  }) => {
    await openDashboard(page, OWNED_TEAM);
    const form = new TeamGuidanceForm(page);

    await form.fill("   ", "");
    const sent = guidanceRequest(page);
    await form.save();
    expect((await sent).postDataJSON()).toMatchObject({
      p_guidance: null,
      p_weekly_training_days: null,
    });

    await form.expectSaved();
    await form.expectValues("", "");
  });

  test("a weekly target outside 1 to 7 is rejected before saving", async ({
    page,
  }) => {
    await openDashboard(page, OWNED_TEAM);
    const form = new TeamGuidanceForm(page);
    let sent = false;
    page.on("request", (request) => {
      if (request.url().includes("/rpc/update_team_guidance")) sent = true;
    });

    await form.fill("Mon and Thu", "8");
    await form.save();

    await form.expectErrorWithoutCode("WEEKLY_TARGET_OUT_OF_RANGE");
    await form.expectValues("Mon and Thu", "8");
    expect(sent).toBe(false);
  });

  test("guidance over 1000 characters is rejected before saving", async ({
    page,
  }) => {
    await openDashboard(page, OWNED_TEAM);
    const form = new TeamGuidanceForm(page);
    const tooLong = "a".repeat(1001);

    await form.fill(tooLong, "3");
    await form.save();

    await form.expectErrorWithoutCode("GUIDANCE_TOO_LONG");
    await form.expectValues(tooLong, "3");
  });

  test("emoji count as one character each, as in the database", async ({
    page,
  }) => {
    await openDashboard(page, OWNED_TEAM);
    const form = new TeamGuidanceForm(page);
    // 1000 emoji are 2000 UTF-16 units but 1000 characters for the database.
    const emoji = "💪".repeat(1000);

    await form.fill(emoji, "3");
    const sent = guidanceRequest(page);
    await form.save();

    expect((await sent).postDataJSON()).toMatchObject({ p_guidance: emoji });
    await form.expectSaved();
  });

  test("a failed save shows a translated error and keeps the input", async ({
    page,
  }) => {
    await mockSupabase(page, {
      trainerGrantedAt: TRAINER,
      teams: [OWNED_TEAM],
      rpc: { update_team_guidance: { error: "INTERNAL_ERROR" } },
    });
    await signInAndOpen(page, OWNED_TEAM);
    const form = new TeamGuidanceForm(page);

    await form.fill("Only Mondays", "1");
    await form.save();

    await form.expectErrorWithoutCode("INTERNAL_ERROR");
    await form.expectValues("Only Mondays", "1");
  });
});
