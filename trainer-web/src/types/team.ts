export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  invite_code?: string;
  created_at: string;
  updated_at?: string;
}

export type TeamRole = "owner" | "member" | "co_owner";

/**
 * Roles set_member_role accepts. Ownership lives in teams.owner_id and is not
 * handed out through the role column, so "owner" is excluded here as well.
 */
export type AssignableTeamRole = Exclude<TeamRole, "owner">;

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  display_name?: string | null;
}

export interface InviteCode {
  code: string;
  expires_at?: string;
  max_uses?: number;
  use_count?: number;
  created_at: string;
}

export interface CreateTeamResponse {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

export interface AcceptInvitationResponse {
  member_id: string;
  team_id: string;
  team_name: string;
  user_id: string;
  role: "member";
  joined_at: string;
}

export interface LeaveTeamResponse {
  action: "left_team";
  team_id: string;
}

export interface DeleteTeamResponse {
  action: "team_deleted";
  team_id: string;
}

export interface RemoveMemberResponse {
  success: boolean;
  team_id: string;
  removed_user_id: string;
}

export interface SetMemberRoleResponse {
  success: boolean;
  team_id: string;
  user_id: string;
  role: AssignableTeamRole;
}

export interface TeamWithMemberCount extends Team {
  member_count: number;
}
