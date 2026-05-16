import { requireAuth } from "../_shared/auth.ts";
import { HttpMethods } from "../_shared/constants.ts";
import { DeleteTeamSchema, parseRequestBody } from "../_shared/validation.ts";
import {
  internalErrorResponse,
  jsonResponse,
  requireMethod,
} from "../_shared/response.ts";
import { deleteTeam, verifyTeamOwner } from "../_shared/team-operations.ts";

Deno.serve(async (req) => {
  const methodCheck = requireMethod(req, HttpMethods.POST);
  if (methodCheck.error) return methodCheck.error;

  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const parsed = await parseRequestBody(req, DeleteTeamSchema);
    if (!parsed.success) return parsed.error;

    const { team_id } = parsed.data;

    const ownerCheck = await verifyTeamOwner(auth.client, team_id, auth.userId);
    if (ownerCheck) return ownerCheck;

    await deleteTeam(auth.client, team_id);
    return jsonResponse({ action: "team_deleted", team_id });
  } catch (error) {
    console.error("Error deleting team:", error);
    return internalErrorResponse();
  }
});
