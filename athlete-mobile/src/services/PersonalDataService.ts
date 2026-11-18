import { supabase } from "./supabaseClient";

type ServerRow = Record<string, unknown>;

/**
 * The GDPR copy: the account, profile and team rows of the signed in user, and
 * their workouts and strength tests. Per-exercise rows and team-owned data
 * such as team workouts are out of scope.
 */
export interface ServerDataExport {
  exportedAt: string;
  account: { email: string | null; createdAt: string };
  profile: ServerRow | null;
  teamMemberDetails: ServerRow | null;
  teamMemberships: ServerRow[];
  teamInvitations: ServerRow[];
  workouts: ServerRow[];
  strengthTests: ServerRow[];
}

interface OwnRowsQuery {
  table: string;
  columns: string;
  ownerColumn: string;
  /** Must end in a unique column, so offset pages never overlap or skip a row. */
  orderColumns: string[];
}

// PostgREST caps each response (max_rows, 1000 by default), so reads go page by page.
const PAGE_SIZE = 1000;

const WITH_TEAM_NAME = "*, team:teams(name)";

const QUERIES = {
  profile: {
    table: "user_profiles",
    columns: "*",
    ownerColumn: "user_id",
    orderColumns: ["user_id"],
  },
  teamMemberDetails: {
    table: "team_member_details",
    columns: "*",
    ownerColumn: "user_id",
    orderColumns: ["user_id"],
  },
  teamMemberships: {
    table: "team_members",
    columns: WITH_TEAM_NAME,
    ownerColumn: "user_id",
    orderColumns: ["joined_at", "id"],
  },
  teamInvitations: {
    table: "team_invitations",
    columns: WITH_TEAM_NAME,
    ownerColumn: "created_by",
    orderColumns: ["created_at", "id"],
  },
  workouts: {
    table: "user_completed_workouts",
    columns: "*",
    ownerColumn: "user_id",
    orderColumns: ["workout_date", "id"],
  },
  strengthTests: {
    table: "strength_tests",
    columns: "*",
    ownerColumn: "user_id",
    orderColumns: ["test_at", "id"],
  },
} satisfies Record<string, OwnRowsQuery>;

const readPage = async (
  { table, columns, ownerColumn, orderColumns }: OwnRowsQuery,
  userId: string,
  from: number,
): Promise<ServerRow[]> => {
  const ordered = orderColumns.reduce(
    (query, column) => query.order(column, { ascending: true }),
    supabase.from(table).select(columns).eq(ownerColumn, userId),
  );
  const { data, error } = (await ordered.range(from, from + PAGE_SIZE - 1)) as {
    data: ServerRow[] | null;
    error: unknown;
  };

  if (error || !data) {
    throw new Error(`${table} read failed`, { cause: error });
  }
  return data;
};

/**
 * Reads every row of one table that belongs to the user, in a stable order.
 * Paging stops at the first empty page, so a lower server cap never cuts the copy short.
 */
const readOwnRows = async (
  query: OwnRowsQuery,
  userId: string,
): Promise<ServerRow[]> => {
  const rows: ServerRow[] = [];
  for (;;) {
    const page = await readPage(query, userId, rows.length);
    if (page.length === 0) return rows;
    rows.push(...page);
  }
};

/**
 * Returns null without a session. Rejects when a read fails, so the export is
 * never incomplete. The rows keep every column as the server stores it.
 */
export const fetchServerDataExport = async (
  now: Date,
): Promise<ServerDataExport | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { id, email, created_at: createdAt } = session.user;
  const [
    profiles,
    teamMemberDetails,
    teamMemberships,
    teamInvitations,
    workouts,
    strengthTests,
  ] = await Promise.all(
    [
      QUERIES.profile,
      QUERIES.teamMemberDetails,
      QUERIES.teamMemberships,
      QUERIES.teamInvitations,
      QUERIES.workouts,
      QUERIES.strengthTests,
    ].map((query) => readOwnRows(query, id)),
  );

  return {
    exportedAt: now.toISOString(),
    account: { email: email ?? null, createdAt },
    profile: profiles.at(0) ?? null,
    teamMemberDetails: teamMemberDetails.at(0) ?? null,
    teamMemberships,
    teamInvitations,
    workouts,
    strengthTests,
  };
};
