export interface Team {
  id: string;
  name: string;
  description?: string;
  /** Free text from the owner, e.g. the team training days. */
  guidance?: string | null;
  /** Expected training days per week, 1 to 7. Display only. */
  weekly_training_days?: number | null;
  owner_id: string;
  invite_code?: string;
  created_at: string;
  updated_at?: string;
}

export type TeamRole = "owner" | "member" | "co_owner";

/**
 * The roles set_member_role accepts. Ownership is stored in teams.owner_id and
 * cannot be assigned through the role column, so "owner" is not in this type.
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

export interface UpdateTeamGuidanceResponse {
  team_id: string;
  guidance: string | null;
  weekly_training_days: number | null;
}

export interface TeamWithMemberCount extends Team {
  member_count: number;
}

/** One block of an AIWL template, in the two kinds the workout builder writes. */
export type AiwlBlock =
  | {
      kind: "picks";
      skill: string;
      picks: { tags: string[]; count: number }[];
    }
  | { kind: "duration"; skill: string; duration: number };

/** An AIWL workout template as save_team_workout takes it. */
export interface AiwlTemplate {
  aiwl: 1;
  id: string;
  name: { en: string };
  blocks: AiwlBlock[];
}

/**
 * A row of team_workouts. The template is JSON any client may have written, so
 * it is typed unknown and read through utils/workoutBuilder.
 */
export interface TeamWorkout {
  id: string;
  team_id: string;
  template: unknown;
  status: TeamWorkoutStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Members, and with them the athlete app, read published workouts only. The
 * owner and co-owners read drafts too.
 */
export type TeamWorkoutStatus = "draft" | "published";
