export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  invite_code?: string;
  created_at: string;
  updated_at?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
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

export interface TeamWithMemberCount extends Team {
  member_count: number;
}
