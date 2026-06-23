import type {
  CreateTeamResponse,
  AcceptInvitationResponse,
  DeleteTeamResponse,
  LeaveTeamResponse,
  RemoveMemberResponse,
  InviteCode,
  Team,
  TeamMember,
  TeamWithMemberCount,
} from "../types/team";
import { supabase, getAuthToken } from "./supabase";

export class ApiError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "ApiError";
  }
}

// RPC functions RAISE with MESSAGE set to an ErrorCode; anything else (e.g. a
// permission-denied sentence) is opaque, so collapse it to INTERNAL_ERROR.
function rpcErrorCode(message: string | undefined): string {
  return message && /^[A-Z][A-Z0-9_]*$/.test(message)
    ? message
    : "INTERNAL_ERROR";
}

export async function callRpc<T>(
  functionName: string,
  params: Record<string, unknown>,
): Promise<T> {
  const token = await getAuthToken();
  if (!token) {
    throw new ApiError("AUTH_REQUIRED");
  }

  const { data, error } = await supabase.rpc(functionName, params);

  if (error) {
    throw new ApiError(rpcErrorCode(error.message));
  }

  return data as T;
}

export async function createTeam(
  name: string,
  description?: string,
): Promise<CreateTeamResponse> {
  return callRpc<CreateTeamResponse>("create_team", {
    p_name: name,
    p_description: description ?? null,
  });
}

export async function generateInviteCode(
  teamId: string,
  options?: {
    expires_at?: string;
    max_uses?: number;
    deactivate_existing?: boolean;
  },
): Promise<InviteCode> {
  return callRpc<InviteCode>("generate_invite_code", {
    p_team_id: teamId,
    p_expires_at: options?.expires_at ?? null,
    p_max_uses: options?.max_uses ?? null,
    p_deactivate_existing: options?.deactivate_existing ?? false,
  });
}

export async function acceptInvitation(
  code: string,
): Promise<AcceptInvitationResponse> {
  return callRpc<AcceptInvitationResponse>("accept_invitation", {
    p_code: code,
  });
}

export async function leaveTeam(teamId: string): Promise<LeaveTeamResponse> {
  return callRpc<LeaveTeamResponse>("leave_team", {
    p_team_id: teamId,
  });
}

export async function deleteTeam(teamId: string): Promise<DeleteTeamResponse> {
  return callRpc<DeleteTeamResponse>("delete_team", {
    p_team_id: teamId,
  });
}

export async function getUserTeams(): Promise<TeamWithMemberCount[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all teams where user is a member
  const { data: memberships, error: membershipError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  if (membershipError || !memberships?.length) return [];

  const teamIds = memberships.map((m) => m.team_id);

  const { data: teams, error } = await supabase
    .from("teams")
    .select("*, team_members(count)")
    .in("id", teamIds)
    .order("created_at", { ascending: false });

  if (error || !teams) return [];

  return teams.map((team) => ({
    ...team,
    member_count: team.team_members?.[0]?.count ?? 0,
  }));
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  return team;
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) return [];

  const userIds = data.map((m) => m.user_id);
  const { data: details } = await supabase
    .from("team_member_details")
    .select("user_id, display_name")
    .in("user_id", userIds);

  const detailsMap = new Map(
    (details ?? []).map((d) => [d.user_id, d.display_name as string | null]),
  );

  return data.map((member) => ({
    ...member,
    display_name: detailsMap.get(member.user_id) ?? null,
  }));
}

export async function getTeamInviteCodes(teamId: string): Promise<string[]> {
  // Only fetch the most recent active invite code
  // Only one code should be active at a time
  const { data } = await supabase
    .from("team_invitations")
    .select("code")
    .eq("team_id", teamId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  return data?.map((row) => row.code) ?? [];
}

export async function removeMember(
  teamId: string,
  memberUserId: string,
): Promise<RemoveMemberResponse> {
  return callRpc<RemoveMemberResponse>("remove_member", {
    p_team_id: teamId,
    p_member_user_id: memberUserId,
  });
}
