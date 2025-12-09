import { requireAuth } from "../_shared/auth.ts";
import { ErrorCodes, HttpMethods, HttpStatus } from "../_shared/constants.ts";
import { parseRequestBody, RemoveMemberSchema } from "../_shared/validation.ts";
import {
  errorResponse,
  internalErrorResponse,
  jsonResponse,
  requireMethod,
} from "../_shared/response.ts";
import {
  getTeamMembership,
  removeMember,
  verifyTeamOwner,
} from "../_shared/team-operations.ts";

Deno.serve(async (req) => {
  const methodCheck = requireMethod(req, HttpMethods.POST);
  if (methodCheck.error) return methodCheck.error;

  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const parsed = await parseRequestBody(req, RemoveMemberSchema);
    if (!parsed.success) return parsed.error;

    const { team_id, member_user_id } = parsed.data;

    const ownerError = await verifyTeamOwner(auth.client, team_id, auth.userId);
    if (ownerError) return ownerError;

    if (member_user_id === auth.userId) {
      return errorResponse(
        ErrorCodes.CANNOT_REMOVE_SELF,
        HttpStatus.BAD_REQUEST,
      );
    }

    const membership = await getTeamMembership(
      auth.client,
      team_id,
      member_user_id,
    );
    if (!membership) {
      return errorResponse(ErrorCodes.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await removeMember(auth.client, team_id, member_user_id);

    return jsonResponse({
      success: true,
      team_id,
      removed_user_id: member_user_id,
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return internalErrorResponse();
  }
});
