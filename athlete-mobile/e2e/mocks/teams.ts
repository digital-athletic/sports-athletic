import { type Page, type Route } from "@playwright/test";

type MockTeam = { id: string; name: string };

/** Same columns as the select in fetchTeamWorkoutTemplates. */
export type TeamWorkoutRow = { template: unknown };

export type TeamWorkoutsServer = {
  /** Rows the next team_workouts request returns. */
  setRows: (rows: TeamWorkoutRow[]) => void;
  /** Makes team_workouts requests fail like a lost connection. */
  goOffline: () => void;
  /** Delays the next team_workouts response until the returned release function runs. */
  holdNextResponse: () => () => void;
};

const fulfillJson = (route: Route, body: unknown) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

/**
 * Serves one team for the signed in user and the team's workouts.
 * Call after mockSupabaseAuth so Playwright's LIFO routing prefers these.
 */
export async function mockTeamWithWorkouts(
  page: Page,
  team: MockTeam,
): Promise<TeamWorkoutsServer> {
  let rows: TeamWorkoutRow[] = [];
  let offline = false;
  let pendingHold: Promise<void> | null = null;

  await page.route("**/rest/v1/team_members**", (route) =>
    fulfillJson(route, [{ team_id: team.id }]),
  );
  await page.route("**/rest/v1/teams**", (route) =>
    fulfillJson(route, [
      { id: team.id, name: team.name, owner_id: "mock-trainer-id" },
    ]),
  );
  await page.route("**/rest/v1/team_workouts**", async (route) => {
    if (offline) {
      await route.abort("internetdisconnected");
      return;
    }
    const hold = pendingHold;
    pendingHold = null;
    if (hold) await hold;
    await fulfillJson(route, rows);
  });

  return {
    setRows: (nextRows) => {
      rows = nextRows;
    },
    goOffline: () => {
      offline = true;
    },
    holdNextResponse: () => {
      let release = () => {};
      pendingHold = new Promise<void>((resolve) => {
        release = resolve;
      });
      return release;
    },
  };
}

/** The server stores the row id as the template id. */
export function generateTeamWorkoutRow(
  id: string,
  template: Record<string, unknown>,
): TeamWorkoutRow {
  return { template: { ...template, id } };
}
