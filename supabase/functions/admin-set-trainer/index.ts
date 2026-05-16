import { requireAdmin } from "../_shared/auth.ts";
import { ErrorCodes, HttpMethods, HttpStatus } from "../_shared/constants.ts";
import {
  errorResponse,
  internalErrorResponse,
  jsonResponse,
  requireMethod,
} from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";
import {
  AdminSetTrainerSchema,
  parseRequestBody,
} from "../_shared/validation.ts";

Deno.serve(async (req) => {
  const methodCheck = requireMethod(req, HttpMethods.POST);
  if (methodCheck.error) return methodCheck.error;

  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const parsed = await parseRequestBody(req, AdminSetTrainerSchema);
    if (!parsed.success) return parsed.error;

    const { user_id, is_trainer } = parsed.data;

    // First verify the user exists in auth.users.
    const { data: authUser, error: authLookupError } =
      await supabaseAdmin.auth.admin.getUserById(user_id);

    if (authLookupError || !authUser.user) {
      return errorResponse(ErrorCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const trainerGrantedAt = is_trainer ? new Date().toISOString() : null;

    // Upsert so users without a profile row are handled correctly.
    // Service role bypasses the column-level REVOKE on authenticated.
    const { error: upsertError } = await supabaseAdmin
      .from("user_profiles")
      .upsert(
        { user_id, trainer_granted_at: trainerGrantedAt },
        { onConflict: "user_id" },
      );

    if (upsertError) {
      console.error("Error updating trainer status:", upsertError);
      return internalErrorResponse();
    }

    return jsonResponse({ user_id, trainer_granted_at: trainerGrantedAt });
  } catch (error) {
    console.error("Error in admin-set-trainer:", error);
    return internalErrorResponse();
  }
});
