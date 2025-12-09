import { type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";
import { ErrorCodes, HttpMethods, HttpStatus } from "../_shared/constants.ts";
import { LeaveTeamSchema, parseRequestBody } from "../_shared/validation.ts";
import {
  errorResponse,
  internalErrorResponse,
  jsonResponse,
  requireMethod,
} from "../_shared/response.ts";
import {
  deleteTeam,
  getMemberCount,
  getOldestMember,
  getTeam,
  getTeamMembership,
  removeMember,
  transferOwnership,
} from "../_shared/team-operations.ts";

async function handleOwnerLeaving(
  client: SupabaseClient,
  teamId: string,
  userId: string,
): Promise<Response> {
  const remainingMemberCount = await getMemberCount(client, teamId, userId);

  if (remainingMemberCount > 0) {
    const newOwner = await getOldestMember(client, teamId, userId);
    if (!newOwner) {
      throw new Error("Failed to find new owner");
    }

    await transferOwnership(teamId, newOwner.user_id);
    await removeMember(client, teamId, userId);

    return jsonResponse({
      action: "ownership_transferred",
      new_owner_id: newOwner.user_id,
      team_id: teamId,
    });
  }

  await deleteTeam(client, teamId);
  return jsonResponse({ action: "team_deleted", team_id: teamId });
}

async function handleMemberLeaving(
  client: SupabaseClient,
  teamId: string,
  userId: string,
): Promise<Response> {
  await removeMember(client, teamId, userId);
  return jsonResponse({ action: "left_team", team_id: teamId });
}

Deno.serve(async (req) => {
  const methodCheck = requireMethod(req, HttpMethods.POST);
  if (methodCheck.error) return methodCheck.error;

  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const parsed = await parseRequestBody(req, LeaveTeamSchema);
    if (!parsed.success) return parsed.error;

    const { team_id } = parsed.data;

    const membership = await getTeamMembership(
      auth.client,
      team_id,
      auth.userId,
    );
    if (!membership) {
      return errorResponse(ErrorCodes.NOT_TEAM_MEMBER, HttpStatus.NOT_FOUND);
    }

    const team = await getTeam(auth.client, team_id);
    if (!team) {
      return errorResponse(ErrorCodes.TEAM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const isOwner = team.owner_id === auth.userId;

    if (isOwner) {
      return handleOwnerLeaving(auth.client, team_id, auth.userId);
    }

    return handleMemberLeaving(auth.client, team_id, auth.userId);
  } catch (error) {
    console.error("Error leaving team:", error);
    return internalErrorResponse();
  }
});
