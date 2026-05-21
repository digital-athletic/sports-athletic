import { supabase } from "./supabaseClient";
import { type I18nKey } from "@/i18n";

export interface UserTeam {
  id: string;
  name: string;
  ownerId: string;
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

const EDGE_FUNCTION_ERROR_MAP: Record<string, I18nKey> = {
  INVITE_CODE_INVALID: "more.joinTeam.errorInvalidCode",
  INVITE_CODE_INACTIVE: "more.joinTeam.errorInactive",
  INVITE_CODE_EXPIRED: "more.joinTeam.errorExpired",
  INVITE_CODE_MAX_USES: "more.joinTeam.errorMaxUses",
  ALREADY_TEAM_MEMBER: "more.joinTeam.errorAlreadyMember",
  NOT_TEAM_MEMBER: "more.joinTeam.leaveErrorNotMember",
  TEAM_NOT_FOUND: "more.joinTeam.leaveErrorNotFound",
  OWNER_CANNOT_LEAVE: "more.joinTeam.leaveErrorOwner",
};

async function mapEdgeFunctionError(error: unknown): Promise<I18nKey> {
  try {
    const body = await (error as { context: Response }).context.json();
    const code: unknown = body?.error;
    return (
      (typeof code === "string" && EDGE_FUNCTION_ERROR_MAP[code]) ||
      "more.joinTeam.errorGeneric"
    );
  } catch {
    return "more.joinTeam.errorGeneric";
  }
}

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

  if (membershipsError || !memberships || memberships.length === 0) return [];

  const teamIds = memberships.map((m) => m.team_id);

  const { data: teams, error: teamsError } = (await supabase
    .from("teams")
    .select("id, name, owner_id")
    .in("id", teamIds)
    .order("created_at", { ascending: false })) as {
    data: TeamRow[] | null;
    error: unknown;
  };

  if (teamsError || !teams) return [];

  return teams.map((t) => ({ id: t.id, name: t.name, ownerId: t.owner_id }));
}

export async function acceptInvitation(code: string): Promise<JoinTeamResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("more.joinTeam.errorGeneric");

  const { data, error } = await supabase.functions.invoke("accept-invitation", {
    body: { code },
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
  });

  if (error) {
    throw new Error(await mapEdgeFunctionError(error));
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

  const { error } = await supabase.functions.invoke("leave-team", {
    body: { team_id: teamId },
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
  });

  if (error) {
    throw new Error(await mapEdgeFunctionError(error));
  }
}
