import { type Page } from "@playwright/test";

/**
 * Intercepts the Supabase calls the app makes, so the e2e suite runs without a
 * backend. Every route is matched by its REST path, which keeps this the single
 * seam between the tests and Supabase: pointing the suite at a real instance
 * later means not calling this, rather than rewriting the tests.
 *
 * Keep it free of state: a call answers from the fixture and remembers nothing.
 * A test that writes describes the world before and the world after instead.
 * Whether a write persists, and which errors Postgres raises, belongs to the
 * pgTAP suite in `supabase/tests/`.
 *
 * Note that `getSession` is not mocked. supabase-js keeps the session in
 * localStorage and reads it from there, so a test signs in through the real
 * client and the session appears as a side effect of the mocked verify call.
 */

export const MOCK_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "trainer@example.com",
};

export type MockMember = {
  user_id: string;
  display_name?: string | null;
  role?: "owner" | "member";
  joined_at?: string;
};

export type MockWorkout = {
  workout_date?: number;
  duration?: number;
  exercise_count?: number;
  xp_earned?: number;
  moved_weight?: number;
  training_type?: string | null;
  training_focus?: string | null;
};

export type MockTeam = {
  id: string;
  name: string;
  description?: string | null;
  member_count?: number;
  owner_id?: string;
  invite_code?: string;
  members?: MockMember[];
};

/** Makes an RPC fail; the string is the ErrorCode the app maps back. */
export type MockRpcError = { error: string };

export type MockOptions = {
  user?: { id: string; email: string };
  /** Non-null grants trainer rights, which gates team creation. */
  trainerGrantedAt?: string | null;
  adminGrantedAt?: string | null;
  teams?: MockTeam[];
  /** Completed workouts per athlete user id. */
  workouts?: Record<string, MockWorkout[]>;
  /** Keyed by RPC function name, e.g. `create_team`. */
  rpc?: Record<string, MockRpcError>;
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

/** The shape PostgREST returns for a RAISE, with the ErrorCode in `message`. */
function postgrestError(code: string) {
  return { code: "P0001", message: code, details: null, hint: null };
}

function json(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

function equalsFilter(url: string, column: string): string | null {
  const value = new URL(url).searchParams.get(column);
  return value?.startsWith("eq.") ? value.slice(3) : null;
}

export async function mockSupabase(page: Page, options: MockOptions = {}) {
  const user = options.user ?? MOCK_USER;
  const teams = options.teams ?? [];
  const workouts = options.workouts ?? {};
  const rpcOverrides = options.rpc ?? {};
  const trainerGrantedAt = options.trainerGrantedAt ?? null;
  const adminGrantedAt = options.adminGrantedAt ?? null;

  const ownerOf = (team: MockTeam) => team.owner_id ?? user.id;

  const membersOf = (team: MockTeam): MockMember[] =>
    team.members ?? [{ user_id: ownerOf(team), role: "owner" }];

  const memberRow = (team: MockTeam, member: MockMember, index: number) => ({
    id: `${team.id}-member-${index}`,
    team_id: team.id,
    user_id: member.user_id,
    role: member.role ?? "member",
    joined_at: member.joined_at ?? new Date().toISOString(),
  });

  const teamRow = (team: MockTeam) => ({
    id: team.id,
    name: team.name,
    description: team.description ?? null,
    owner_id: ownerOf(team),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Registered first on purpose. Playwright matches routes last-in-first-out, so
  // everything below takes priority and this only catches what no fixture
  // covers. Without it such a call would leave the page and hang instead of
  // failing where the test can see it.
  await page.route("**/rest/v1/**", (route) => route.fulfill(json([])));

  // The app only checks for an error, so the body can be anything.
  await page.route("**/auth/v1/otp**", (route) =>
    route.fulfill(json({ data: null, error: null })),
  );

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

  await page.route("**/rest/v1/team_members**", (route) => {
    const teamId = equalsFilter(route.request().url(), "team_id");
    if (teamId === null) {
      return route.fulfill(json(teams.map((team) => ({ team_id: team.id }))));
    }
    const team = teams.find((candidate) => candidate.id === teamId);
    if (!team) return route.fulfill(json([]));
    return route.fulfill(
      json(membersOf(team).map((member, i) => memberRow(team, member, i))),
    );
  });

  // getTeamById uses single(), which expects an object rather than an array.
  await page.route("**/rest/v1/teams**", (route) => {
    const teamId = equalsFilter(route.request().url(), "id");
    if (teamId !== null) {
      const team = teams.find((candidate) => candidate.id === teamId);
      return team
        ? route.fulfill(json(teamRow(team)))
        : route.fulfill(json({ message: "Not found" }, 406));
    }
    return route.fulfill(
      json(
        teams.map((team) => ({
          ...teamRow(team),
          team_members: [
            { count: team.member_count ?? membersOf(team).length },
          ],
        })),
      ),
    );
  });

  await page.route("**/rest/v1/team_member_details**", (route) =>
    route.fulfill(
      json(
        teams.flatMap((team) =>
          membersOf(team)
            .filter((member) => member.display_name)
            .map((member) => ({
              user_id: member.user_id,
              display_name: member.display_name,
            })),
        ),
      ),
    ),
  );

  await page.route("**/rest/v1/team_invitations**", (route) => {
    const teamId = equalsFilter(route.request().url(), "team_id");
    const team = teams.find((candidate) => candidate.id === teamId);
    return route.fulfill(
      json(team?.invite_code ? [{ code: team.invite_code }] : []),
    );
  });

  await page.route("**/rest/v1/user_completed_workouts**", (route) => {
    const ids = new URL(route.request().url()).searchParams.get("user_id");
    const wanted = ids?.startsWith("in.")
      ? ids.slice(3).replace(/[()"]/g, "").split(",")
      : Object.keys(workouts);
    return route.fulfill(
      json(
        wanted.flatMap((userId) =>
          (workouts[userId] ?? []).map((workout, index) => ({
            id: `${userId}-workout-${index}`,
            user_id: userId,
            workout_id: `workout-${index}`,
            workout_date: workout.workout_date ?? Date.now(),
            duration: workout.duration ?? 3600,
            exercise_count: workout.exercise_count ?? 5,
            xp_earned: workout.xp_earned ?? 100,
            moved_weight: workout.moved_weight ?? 1000,
            training_type: workout.training_type ?? "PLAN",
            training_focus: workout.training_focus ?? "GKS",
            created_at: new Date().toISOString(),
          })),
        ),
      ),
    );
  });

  await page.route("**/rest/v1/rpc/**", (route) => {
    const name = new URL(route.request().url()).pathname.split("/").pop() ?? "";
    const override = rpcOverrides[name];
    if (override) {
      return route.fulfill(json(postgrestError(override.error), 400));
    }

    // The team a write results in is the last entry of `teams`.
    const written = () => {
      const team = teams[teams.length - 1];
      if (!team) {
        throw new Error(
          `mockSupabase: ${name} needs the resulting team as the last entry of \`teams\``,
        );
      }
      return team;
    };

    const body = route.request().postDataJSON() ?? {};

    if (name === "create_team") {
      const team = written();
      return route.fulfill(
        json({
          ...teamRow(team),
          name: body.p_name ?? team.name,
          description: body.p_description ?? team.description ?? null,
          invite_code: team.invite_code ?? "ABC123",
        }),
      );
    }

    if (name === "accept_invitation") {
      const team = written();
      if (team.invite_code && body.p_code !== team.invite_code) {
        return route.fulfill(json(postgrestError("INVITE_CODE_INVALID"), 400));
      }
      return route.fulfill(
        json({
          member_id: `${team.id}-member-joined`,
          team_id: team.id,
          team_name: team.name,
          user_id: user.id,
          role: "member",
          joined_at: new Date().toISOString(),
        }),
      );
    }

    return route.fulfill(json({ success: true }));
  });
}
