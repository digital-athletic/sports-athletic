import { supabase } from "./supabaseClient";
import { type I18nKey } from "@/i18n";

export interface UserTeam {
  id: string;
  name: string;
  ownerId: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  guidance: string | null;
  /** Expected training days per week, 1 to 7. Independent of the training plan. */
  weeklyTrainingDays: number | null;
}

export interface JoinTeamResult {
  teamId: string;
  teamName: string;
}

interface AcceptInvitationResponse {
  team_id: string;
  team_name: string;
}

interface TeamMemberRow {
  team_id: string;
}

interface TeamRow {
  id: string;
  name: string;
  owner_id: string;
}

interface TeamInfoRow {
  id: string;
  name: string;
  guidance: string | null;
  weekly_training_days: number | null;
}

const RPC_ERROR_MAP: Record<string, I18nKey> = {
  INVITE_CODE_INVALID: "more.joinTeam.errorInvalidCode",
  INVITE_CODE_INACTIVE: "more.joinTeam.errorInactive",
  INVITE_CODE_EXPIRED: "more.joinTeam.errorExpired",
  INVITE_CODE_MAX_USES: "more.joinTeam.errorMaxUses",
  ALREADY_TEAM_MEMBER: "more.joinTeam.errorAlreadyMember",
  NOT_TEAM_MEMBER: "more.joinTeam.leaveErrorNotMember",
  TEAM_NOT_FOUND: "more.joinTeam.leaveErrorNotFound",
  OWNER_CANNOT_LEAVE: "more.joinTeam.leaveErrorOwner",
};

// RPC functions RAISE with MESSAGE set to an ErrorCode, surfaced as error.message.
function mapRpcError(error: { message?: string } | null): I18nKey {
  const code = error?.message;
  return (
    (typeof code === "string" && RPC_ERROR_MAP[code]) ||
    "more.joinTeam.errorGeneric"
  );
}

/** Rejects when a read fails, so callers never mistake a failure for no teams. */
export async function getUserTeams(): Promise<UserTeam[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const { data: memberships, error: membershipsError } = (await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", session.user.id)) as {
    data: TeamMemberRow[] | null;
    error: unknown;
  };

  if (membershipsError || !memberships)
    throw new Error("team_members read failed");
  if (memberships.length === 0) return [];

  const teamIds = memberships.map((m) => m.team_id);

  const { data: teams, error: teamsError } = (await supabase
    .from("teams")
    .select("id, name, owner_id")
    .in("id", teamIds)
    .order("created_at", { ascending: false })) as {
    data: TeamRow[] | null;
    error: unknown;
  };

  if (teamsError || !teams) throw new Error("teams read failed");

  return teams.map((t) => ({ id: t.id, name: t.name, ownerId: t.owner_id }));
}

/**
 * Returns null when the athlete can no longer see the team, which RLS reports
 * as a missing row. Read failures throw, so they never look like a missing team.
 */
export async function getTeamInfo(teamId: string): Promise<TeamInfo | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("more.teamInfo.loadError");

  const { data, error } = (await supabase
    .from("teams")
    .select("id, name, guidance, weekly_training_days")
    .eq("id", teamId)
    .maybeSingle()) as { data: TeamInfoRow | null; error: unknown };

  if (error) throw new Error("more.teamInfo.loadError");
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    guidance: data.guidance,
    weeklyTrainingDays: data.weekly_training_days,
  };
}

export async function acceptInvitation(code: string): Promise<JoinTeamResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("more.joinTeam.errorGeneric");

  const { data, error } = await supabase.rpc("accept_invitation", {
    p_code: code,
  });

  if (error) {
    throw new Error(mapRpcError(error));
  }

  const result = data as AcceptInvitationResponse;
  return {
    teamId: result.team_id,
    teamName: result.team_name,
  };
}

export async function leaveTeam(teamId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("more.joinTeam.errorGeneric");

  const { error } = await supabase.rpc("leave_team", {
    p_team_id: teamId,
  });

  if (error) {
    throw new Error(mapRpcError(error));
  }
}

/** Raw templates of the team's workouts, oldest first; rejects when the query fails. */
export async function fetchTeamWorkoutTemplates(
  teamId: string,
): Promise<unknown[]> {
  const { data, error } = (await supabase
    .from("team_workouts")
    .select("template")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })
    // Offline, the default retries wait 1s, 2s and 4s before the list falls back to the last sync.
    .retry(false)) as {
    data: { template: unknown }[] | null;
    error: { message: string } | null;
  };

  if (!data) throw new Error(error?.message);
  return data.map((row) => row.template);
}
