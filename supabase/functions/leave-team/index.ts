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
  getTeam,
  getTeamMembership,
  removeMember,
} from "../_shared/team-operations.ts";

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

    if (team.owner_id === auth.userId) {
      return errorResponse(ErrorCodes.OWNER_CANNOT_LEAVE, HttpStatus.FORBIDDEN);
    }

    await removeMember(team_id, auth.userId);
    return jsonResponse({ action: "left_team", team_id });
  } catch (error) {
    console.error("Error leaving team:", error);
    return internalErrorResponse();
  }
});
