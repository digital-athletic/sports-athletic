import { generateUniqueInviteCode } from "../_shared/invite-code.ts";
import { requireAuth } from "../_shared/auth.ts";
import { HttpMethods, HttpStatus } from "../_shared/constants.ts";
import {
  GenerateInviteCodeSchema,
  parseRequestBody,
} from "../_shared/validation.ts";
import {
  internalErrorResponse,
  jsonResponse,
  requireMethod,
} from "../_shared/response.ts";
import {
  createInvitation,
  deactivateTeamInvitations,
  verifyTeamOwner,
} from "../_shared/team-operations.ts";

Deno.serve(async (req) => {
  const methodCheck = requireMethod(req, HttpMethods.POST);
  if (methodCheck.error) return methodCheck.error;

  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const parsed = await parseRequestBody(req, GenerateInviteCodeSchema);
    if (!parsed.success) return parsed.error;

    const { team_id, expires_at, max_uses, deactivate_existing } = parsed.data;

    const ownerError = await verifyTeamOwner(auth.client, team_id, auth.userId);
    if (ownerError) return ownerError;

    if (deactivate_existing) {
      await deactivateTeamInvitations(team_id);
    }

    const code = await generateUniqueInviteCode(auth.client);
    const invitation = await createInvitation(
      team_id,
      code,
      auth.userId,
      expires_at,
      max_uses,
    );

    return jsonResponse(
      {
        code: invitation.code,
        expires_at: invitation.expires_at,
        max_uses: invitation.max_uses,
        created_at: invitation.created_at,
      },
      HttpStatus.CREATED,
    );
  } catch (error) {
    console.error("Error generating invite code:", error);
    return internalErrorResponse();
  }
});
