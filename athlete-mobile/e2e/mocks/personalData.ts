import { type Page } from "@playwright/test";

/** Server rows of an athlete with one team, one workout and no trainer or admin role. */
const PERSONAL_DATA_TABLES: Record<string, unknown[]> = {
  user_profiles: [
    {
      consent_privacy_accepted: true,
      consent_analytics_accepted: true,
      consent_updated_at: "2026-03-02T08:00:00Z",
      trainer_granted_at: null,
      admin_granted_at: null,
    },
  ],
  team_member_details: [{ user_id: "mock-user-id-123", display_name: "Alex" }],
  team_members: [
    {
      id: "membership-1",
      user_id: "mock-user-id-123",
      role: "member",
      joined_at: "2026-05-01T12:00:00Z",
      team: { name: "U17" },
    },
  ],
  team_invitations: [],
  // Activity-only sync: the server never receives exercises, XP or moved weight.
  user_completed_workouts: [
    {
      workout_id: "server-workout-1",
      workout_date: Date.parse("2026-05-01T18:00:00Z"),
      duration: 1800,
      exercise_count: 6,
      xp_earned: null,
      moved_weight: null,
      exercises: null,
      user_skills: null,
      view_mode: "LIST",
      training_type: null,
      training_cardio_type: null,
      training_focus: null,
      created_at: "2026-05-01T18:30:00Z",
    },
  ],
};

/**
 * Answers the server reads of the account screen data export. Call after
 * mockSupabaseAuth, so Playwright's LIFO route order gives these priority.
 */
export async function mockPersonalDataTables(page: Page) {
  for (const [table, rows] of Object.entries(PERSONAL_DATA_TABLES)) {
    await page.route(`**/rest/v1/${table}**`, async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      // The app reads page by page until a page is empty.
      const offset = Number(
        new URL(route.request().url()).searchParams.get("offset") ?? 0,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(offset === 0 ? rows : []),
      });
    });
  }
}
