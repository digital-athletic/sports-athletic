import { requireAuth } from "../_shared/auth.ts";
import {
  ErrorCodes,
  HttpMethods,
  HttpStatus,
  Roles,
} from "../_shared/constants.ts";
import {
  AcceptInvitationSchema,
  parseRequestBody,
} from "../_shared/validation.ts";
import {
  errorResponse,
  internalErrorResponse,
  jsonResponse,
  requireMethod,
} from "../_shared/response.ts";
import {
  addTeamMember,
  getInvitationByCode,
  getTeamMembership,
  getTeamName,
  incrementInviteUseCount,
  validateInvitation,
} from "../_shared/team-operations.ts";

Deno.serve(async (req) => {
  const methodCheck = requireMethod(req, HttpMethods.POST);
  if (methodCheck.error) return methodCheck.error;

  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const parsed = await parseRequestBody(req, AcceptInvitationSchema);
    if (!parsed.success) return parsed.error;

    const { code } = parsed.data;

    const invitation = await getInvitationByCode(auth.client, code);
    if (!invitation) {
      return errorResponse(
        ErrorCodes.INVITE_CODE_INVALID,
        HttpStatus.NOT_FOUND,
      );
    }

    const validationError = validateInvitation(invitation);
    if (validationError) return validationError;

    const existingTeamMember = await getTeamMembership(
      auth.client,
      invitation.team_id,
      auth.userId,
    );
    if (existingTeamMember) {
      return errorResponse(
        ErrorCodes.ALREADY_TEAM_MEMBER,
        HttpStatus.BAD_REQUEST,
      );
    }

    const member = await addTeamMember(
      invitation.team_id,
      auth.userId,
      Roles.MEMBER,
    );
    await incrementInviteUseCount(invitation.id);
    const teamName = await getTeamName(auth.client, invitation.team_id);

    return jsonResponse(
      {
        member_id: member.id,
        team_id: invitation.team_id,
        team_name: teamName,
        user_id: auth.userId,
        role: Roles.MEMBER,
        joined_at: member.joined_at,
      },
      HttpStatus.CREATED,
    );
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return internalErrorResponse();
  }
});
