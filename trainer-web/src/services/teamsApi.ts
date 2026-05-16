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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class ApiError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "ApiError";
  }
}

async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const token = await getAuthToken();
  if (!token) {
    throw new ApiError("AUTH_REQUIRED");
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || "INTERNAL_ERROR");
  }

  return data as T;
}

export async function createTeam(
  name: string,
  description?: string,
): Promise<CreateTeamResponse> {
  return callEdgeFunction<CreateTeamResponse>("create-team", {
    name,
    description,
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
  return callEdgeFunction<InviteCode>("generate-invite-code", {
    team_id: teamId,
    ...options,
  });
}

export async function acceptInvitation(
  code: string,
): Promise<AcceptInvitationResponse> {
  return callEdgeFunction<AcceptInvitationResponse>("accept-invitation", {
    code,
  });
}

export async function leaveTeam(teamId: string): Promise<LeaveTeamResponse> {
  return callEdgeFunction<LeaveTeamResponse>("leave-team", {
    team_id: teamId,
  });
}

export async function deleteTeam(teamId: string): Promise<DeleteTeamResponse> {
  return callEdgeFunction<DeleteTeamResponse>("delete-team", {
    team_id: teamId,
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

  return data ?? [];
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
  return callEdgeFunction<RemoveMemberResponse>("remove-member", {
    team_id: teamId,
    member_user_id: memberUserId,
  });
}
