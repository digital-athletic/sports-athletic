import { requireAuth } from "../_shared/auth.ts";
import { HttpMethods, HttpStatus, Roles } from "../_shared/constants.ts";
import { generateUniqueInviteCode } from "../_shared/invite-code.ts";
import {
  internalErrorResponse,
  jsonResponse,
  requireMethod,
} from "../_shared/response.ts";
import {
  addTeamMember,
  createInvitation,
  createTeam,
  deleteTeam,
} from "../_shared/team-operations.ts";
import { CreateTeamSchema, parseRequestBody } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  const methodCheck = requireMethod(req, HttpMethods.POST);
  if (methodCheck.error) return methodCheck.error;

  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const parsed = await parseRequestBody(req, CreateTeamSchema);
    if (!parsed.success) return parsed.error;

    const { name, description } = parsed.data;

    const team = await createTeam(name, description ?? null, auth.userId);

    try {
      await addTeamMember(team.id, auth.userId, Roles.OWNER);
    } catch (error) {
      await deleteTeam(auth.client, team.id);
      throw error;
    }

    let inviteCode: string;
    try {
      inviteCode = await generateUniqueInviteCode(auth.client);
      await createInvitation(auth.client, team.id, inviteCode, auth.userId);
    } catch (error) {
      await deleteTeam(auth.client, team.id);
      throw error;
    }

    return jsonResponse(
      {
        id: team.id,
        name: team.name,
        description: team.description,
        owner_id: team.owner_id,
        invite_code: inviteCode,
        created_at: team.created_at,
      },
      HttpStatus.CREATED,
    );
  } catch (error) {
    console.error("Error creating team:", error);
    return internalErrorResponse();
  }
});
