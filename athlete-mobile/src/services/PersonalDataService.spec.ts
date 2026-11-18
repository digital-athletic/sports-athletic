import { fetchServerDataExport } from "./PersonalDataService";

type QueryResult = { data: unknown; error: unknown };

const mockGetSession = jest.fn();
const mockFrom = jest.fn();

jest.mock("./supabaseClient", () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
    from: (table: string) => mockFrom(table),
  },
}));

interface QueryCall {
  table: string;
  columns?: string;
  eq?: [string, unknown];
  order: string[];
  range?: [number, number];
}

let queryCalls: QueryCall[] = [];

/**
 * Answers the paged reads `from(table).select().eq().order().range()` with the
 * pages given per table, then with an empty page, e.g.
 * `{ strength_tests: [{ data: [{ test_at: 1 }], error: null }] }`.
 * A single result counts as one page.
 */
const mockTables = (
  results: Record<string, QueryResult | QueryResult[]>,
): void => {
  queryCalls = [];
  const servedPages: Record<string, number> = {};
  mockFrom.mockImplementation((table: string) => {
    const call: QueryCall = { table, order: [] };
    queryCalls.push(call);
    const query = {
      select: (columns: string) => {
        call.columns = columns;
        return query;
      },
      eq: (column: string, value: unknown) => {
        call.eq = [column, value];
        return query;
      },
      order: (column: string) => {
        call.order.push(column);
        return query;
      },
      range: (from: number, to: number) => {
        call.range = [from, to];
        const pages = [results[table] ?? []].flat();
        const index = servedPages[table] ?? 0;
        servedPages[table] = index + 1;
        return Promise.resolve(pages[index] ?? { data: [], error: null });
      },
    };
    return query;
  });
};

/** A signed in session, e.g. for `athlete@example.com` created on 1 March 2026. */
const generateSession = () => ({
  data: {
    session: {
      user: {
        id: "user-1",
        email: "athlete@example.com",
        created_at: "2026-03-01T10:00:00Z",
      },
    },
  },
});

/** One page of rows, e.g. `rows({ workout_id: "w1" })`. */
const rows = (...data: Record<string, unknown>[]): QueryResult => ({
  data,
  error: null,
});

/** Server rows of an athlete with one team, one workout and one strength test. */
const fullTables: Record<string, QueryResult> = {
  user_profiles: rows({ user_id: "user-1", consent_privacy_accepted: true }),
  team_member_details: rows({ user_id: "user-1", display_name: "Alex" }),
  team_members: rows({ id: "m1", role: "member", team: { name: "U17" } }),
  team_invitations: rows(),
  user_completed_workouts: rows({ workout_id: "w1", exercises: null }),
  strength_tests: rows({ test_at: 1000, knee_dominant: null }),
};

describe("PersonalDataService: fetchServerDataExport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null without a session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await expect(fetchServerDataExport(new Date())).resolves.toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("collects every server row of the user as stored", async () => {
    mockGetSession.mockResolvedValue(generateSession());
    mockTables(fullTables);

    const result = await fetchServerDataExport(
      new Date("2026-11-18T09:00:00Z"),
    );

    expect(result).toEqual({
      exportedAt: "2026-11-18T09:00:00.000Z",
      account: {
        email: "athlete@example.com",
        createdAt: "2026-03-01T10:00:00Z",
      },
      profile: { user_id: "user-1", consent_privacy_accepted: true },
      teamMemberDetails: { user_id: "user-1", display_name: "Alex" },
      teamMemberships: [{ id: "m1", role: "member", team: { name: "U17" } }],
      teamInvitations: [],
      workouts: [{ workout_id: "w1", exercises: null }],
      strengthTests: [{ test_at: 1000, knee_dominant: null }],
    });
  });

  it("returns null for a missing profile or display name", async () => {
    mockGetSession.mockResolvedValue(generateSession());
    mockTables({
      ...fullTables,
      user_profiles: rows(),
      team_member_details: rows(),
    });

    const result = await fetchServerDataExport(new Date());

    expect(result?.profile).toBeNull();
    expect(result?.teamMemberDetails).toBeNull();
  });

  it("reads only the rows of the signed in user, in a stable order", async () => {
    mockGetSession.mockResolvedValue(generateSession());
    mockTables(fullTables);

    await fetchServerDataExport(new Date());

    expect(
      queryCalls.map(({ table, eq, order }) => [table, ...(eq ?? []), order]),
    ).toEqual(
      expect.arrayContaining([
        ["user_profiles", "user_id", "user-1", ["user_id"]],
        ["team_member_details", "user_id", "user-1", ["user_id"]],
        ["team_members", "user_id", "user-1", ["joined_at", "id"]],
        ["team_invitations", "created_by", "user-1", ["created_at", "id"]],
        [
          "user_completed_workouts",
          "user_id",
          "user-1",
          ["workout_date", "id"],
        ],
        ["strength_tests", "user_id", "user-1", ["test_at", "id"]],
      ]),
    );
  });

  it("reads every stored column and adds the team name to memberships and invitations", async () => {
    mockGetSession.mockResolvedValue(generateSession());
    mockTables(fullTables);

    await fetchServerDataExport(new Date());

    const columns = Object.fromEntries(
      queryCalls.map((call) => [call.table, call.columns]),
    );
    expect(columns).toEqual({
      user_profiles: "*",
      team_member_details: "*",
      team_members: "*, team:teams(name)",
      team_invitations: "*, team:teams(name)",
      user_completed_workouts: "*",
      strength_tests: "*",
    });
  });

  it("reads every page, so more rows than the server returns per request are exported", async () => {
    mockGetSession.mockResolvedValue(generateSession());
    mockTables({
      ...fullTables,
      user_completed_workouts: [
        rows({ workout_id: "w1" }, { workout_id: "w2" }),
        rows({ workout_id: "w3" }),
      ],
    });

    const result = await fetchServerDataExport(new Date());

    expect(result?.workouts).toEqual([
      { workout_id: "w1" },
      { workout_id: "w2" },
      { workout_id: "w3" },
    ]);
    const workoutReads = queryCalls.filter(
      (call) => call.table === "user_completed_workouts",
    );
    expect(workoutReads.map((call) => call.range?.[0])).toEqual([0, 2, 3]);
  });

  it("rejects when a read fails, so an incomplete copy is never exported", async () => {
    mockGetSession.mockResolvedValue(generateSession());
    mockTables({
      ...fullTables,
      strength_tests: [
        rows({ test_at: 1000 }),
        { data: null, error: { message: "timeout" } },
      ],
    });

    await expect(fetchServerDataExport(new Date())).rejects.toThrow(
      "strength_tests",
    );
  });
});
