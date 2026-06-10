import { requireAuth } from "../_shared/auth.ts";
import {
  ErrorCodes,
  HttpMethods,
  HttpStatus,
  Roles,
} from "../_shared/constants.ts";
import { generateUniqueInviteCode } from "../_shared/invite-code.ts";
import {
  errorResponse,
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
import { supabaseAdmin } from "../_shared/supabase.ts";
import { CreateTeamSchema, parseRequestBody } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  const methodCheck = requireMethod(req, HttpMethods.POST);
  if (methodCheck.error) return methodCheck.error;

  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("trainer_granted_at")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching trainer profile:", profileError);
      return internalErrorResponse();
    }

    if (!profileData?.trainer_granted_at) {
      return errorResponse(ErrorCodes.NOT_A_TRAINER, HttpStatus.FORBIDDEN);
    }

    const parsed = await parseRequestBody(req, CreateTeamSchema);
    if (!parsed.success) return parsed.error;

    const { name, description } = parsed.data;

    const team = await createTeam(name, description ?? null, auth.userId);

    try {
      await addTeamMember(team.id, auth.userId, Roles.OWNER);
    } catch (error) {
      await deleteTeam(team.id);
      throw error;
    }

    let inviteCode: string;
    try {
      inviteCode = await generateUniqueInviteCode(auth.client);
      await createInvitation(team.id, inviteCode, auth.userId);
    } catch (error) {
      await deleteTeam(team.id);
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
