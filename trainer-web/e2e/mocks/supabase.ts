import { type Page } from "@playwright/test";

/**
 * Intercepts the Supabase calls the app makes, so the e2e suite runs without a
 * backend. Every route is matched by its REST path, which keeps this the single
 * seam between the tests and Supabase: pointing the suite at a real instance
 * later means not calling this, rather than rewriting the tests.
 *
 * Note that `getSession` is not mocked. supabase-js keeps the session in
 * localStorage and reads it from there, so a test signs in through the real
 * client and the session appears as a side effect of the mocked verify call.
 */

export const MOCK_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "trainer@example.com",
};

export type MockTeam = {
  id: string;
  name: string;
  description?: string | null;
  member_count?: number;
};

export type MockOptions = {
  user?: { id: string; email: string };
  /** Non-null grants trainer rights, which gates team creation. */
  trainerGrantedAt?: string | null;
  adminGrantedAt?: string | null;
  teams?: MockTeam[];
};

function authUser(user: { id: string; email: string }) {
  const now = new Date().toISOString();
  return {
    id: user.id,
    email: user.email,
    aud: "authenticated",
    role: "authenticated",
    created_at: now,
    updated_at: now,
    email_confirmed_at: now,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
  };
}

function authSession(user: { id: string; email: string }) {
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: authUser(user),
  };
}

function json(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

export async function mockSupabase(page: Page, options: MockOptions = {}) {
  const user = options.user ?? MOCK_USER;
  const teams = options.teams ?? [];
  const trainerGrantedAt = options.trainerGrantedAt ?? null;
  const adminGrantedAt = options.adminGrantedAt ?? null;

  // Requesting a one time code. The app only checks for an error.
  await page.route("**/auth/v1/otp**", (route) =>
    route.fulfill(json({ data: null, error: null })),
  );

  // Redeeming the code. supabase-js stores the returned session itself.
  await page.route("**/auth/v1/verify**", (route) =>
    route.fulfill(json(authSession(user))),
  );

  await page.route("**/auth/v1/user**", (route) =>
    route.fulfill(json(authUser(user))),
  );

  await page.route("**/auth/v1/logout**", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );

  // maybeSingle() asks for a single object rather than an array.
  await page.route("**/rest/v1/user_profiles**", (route) =>
    route.fulfill(
      json({
        trainer_granted_at: trainerGrantedAt,
        admin_granted_at: adminGrantedAt,
      }),
    ),
  );

  await page.route("**/rest/v1/team_members**", (route) =>
    route.fulfill(json(teams.map((team) => ({ team_id: team.id })))),
  );

  await page.route("**/rest/v1/teams**", (route) =>
    route.fulfill(
      json(
        teams.map((team) => ({
          id: team.id,
          name: team.name,
          description: team.description ?? null,
          owner_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          team_members: [{ count: team.member_count ?? 1 }],
        })),
      ),
    ),
  );
}
