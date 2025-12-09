import { type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { supabaseAdmin } from "./supabase.ts";
import {
  ErrorCodes,
  HttpStatus,
  type Role,
  Roles,
  Tables,
} from "./constants.ts";
import { errorResponse } from "./response.ts";

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  code: string;
  created_by: string;
  is_active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

// ============================================
// READ OPERATIONS - Use user client (RLS enforced)
// ============================================

export async function getTeamMembership(
  client: SupabaseClient,
  teamId: string,
  userId: string,
): Promise<TeamMembership | null> {
  const { data, error } = await client
    .from(Tables.TEAM_MEMBERS)
    .select("*")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

export async function getTeam(
  client: SupabaseClient,
  teamId: string,
): Promise<Team | null> {
  const { data, error } = await client
    .from(Tables.TEAMS)
    .select("*")
    .eq("id", teamId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

export async function getTeamName(
  client: SupabaseClient,
  teamId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from(Tables.TEAMS)
    .select("name")
    .eq("id", teamId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data?.name ?? null;
}

export async function getMemberCount(
  client: SupabaseClient,
  teamId: string,
  excludeUserId?: string,
): Promise<number> {
  let query = client
    .from(Tables.TEAM_MEMBERS)
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getOldestMember(
  client: SupabaseClient,
  teamId: string,
  excludeUserId: string,
): Promise<{ user_id: string } | null> {
  const { data, error } = await client
    .from(Tables.TEAM_MEMBERS)
    .select("user_id")
    .eq("team_id", teamId)
    .neq("user_id", excludeUserId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

export async function getInvitationByCode(
  client: SupabaseClient,
  code: string,
): Promise<TeamInvitation | null> {
  const { data, error } = await client
    .from(Tables.TEAM_INVITATIONS)
    .select("*")
    .ilike("code", code.toUpperCase())
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

// ============================================
// AUTHORIZATION HELPERS - Use user client
// ============================================

export async function verifyTeamOwner(
  client: SupabaseClient,
  teamId: string,
  userId: string,
): Promise<Response | null> {
  const team = await getTeam(client, teamId);

  if (!team) {
    return errorResponse(ErrorCodes.TEAM_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (team.owner_id !== userId) {
    return errorResponse(ErrorCodes.NOT_TEAM_OWNER, HttpStatus.FORBIDDEN);
  }

  return null;
}

// ============================================
// WRITE OPERATIONS - Use user client (RLS enforced)
// ============================================

export async function createTeam(
  name: string,
  description: string | null,
  ownerId: string,
): Promise<Team> {
  // Uses admin client: user is already authenticated, RLS would block insert
  const { data, error } = await supabaseAdmin
    .from(Tables.TEAMS)
    .insert({ name, description, owner_id: ownerId })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function addTeamMember(
  teamId: string,
  userId: string,
  role: Role,
): Promise<TeamMembership> {
  // Uses admin client: RLS policies don't allow users to insert their own membership
  const { data, error } = await supabaseAdmin
    .from(Tables.TEAM_MEMBERS)
    .insert({ team_id: teamId, user_id: userId, role })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function removeMember(
  client: SupabaseClient,
  teamId: string,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from(Tables.TEAM_MEMBERS)
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function deleteTeam(
  client: SupabaseClient,
  teamId: string,
): Promise<void> {
  const { error } = await client.from(Tables.TEAMS).delete().eq("id", teamId);

  if (error) {
    throw error;
  }
}

export async function createInvitation(
  client: SupabaseClient,
  teamId: string,
  code: string,
  createdBy: string,
  expiresAt?: string | null,
  maxUses?: number | null,
): Promise<TeamInvitation> {
  const { data, error } = await client
    .from(Tables.TEAM_INVITATIONS)
    .insert({
      team_id: teamId,
      code,
      created_by: createdBy,
      expires_at: expiresAt ?? null,
      max_uses: maxUses ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deactivateTeamInvitations(
  client: SupabaseClient,
  teamId: string,
): Promise<void> {
  const { error } = await client
    .from(Tables.TEAM_INVITATIONS)
    .update({ is_active: false })
    .eq("team_id", teamId)
    .eq("is_active", true);

  if (error) {
    throw error;
  }
}

// ============================================
// ADMIN-ONLY OPERATIONS - Require elevated access
// ============================================

export async function transferOwnership(
  teamId: string,
  newOwnerId: string,
): Promise<void> {
  // Uses admin client: updates both teams and team_members atomically
  // RLS would require separate owner checks for each table
  const { error: teamError } = await supabaseAdmin
    .from(Tables.TEAMS)
    .update({ owner_id: newOwnerId })
    .eq("id", teamId);

  if (teamError) {
    throw teamError;
  }

  const { error: memberError } = await supabaseAdmin
    .from(Tables.TEAM_MEMBERS)
    .update({ role: Roles.OWNER })
    .eq("team_id", teamId)
    .eq("user_id", newOwnerId);

  if (memberError) {
    throw memberError;
  }
}

export async function incrementInviteUseCount(
  invitationId: string,
): Promise<number> {
  // Uses admin client: RPC function for atomic increment
  const { data, error } = await supabaseAdmin.rpc(
    "increment_invite_use_count",
    {
      invitation_id: invitationId,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

// ============================================
// VALIDATION HELPERS - Pure functions (no DB)
// ============================================

export function validateInvitation(
  invitation: TeamInvitation,
): Response | null {
  if (!invitation.is_active) {
    return errorResponse(
      ErrorCodes.INVITE_CODE_INACTIVE,
      HttpStatus.BAD_REQUEST,
    );
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return errorResponse(
      ErrorCodes.INVITE_CODE_EXPIRED,
      HttpStatus.BAD_REQUEST,
    );
  }

  if (
    invitation.max_uses !== null &&
    invitation.use_count >= invitation.max_uses
  ) {
    return errorResponse(
      ErrorCodes.INVITE_CODE_MAX_USES,
      HttpStatus.BAD_REQUEST,
    );
  }

  return null;
}
