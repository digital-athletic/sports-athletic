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
  AdminLookupUserSchema,
  parseRequestBody,
} from "../_shared/validation.ts";

Deno.serve(async (req) => {
  const methodCheck = requireMethod(req, HttpMethods.POST);
  if (methodCheck.error) return methodCheck.error;

  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const parsed = await parseRequestBody(req, AdminLookupUserSchema);
    if (!parsed.success) return parsed.error;

    const { email } = parsed.data;

    const { data, error } = await supabaseAdmin.rpc("lookup_user_by_email", {
      lookup_email: email,
    });

    if (error) {
      console.error("Error looking up user by email:", error);
      return internalErrorResponse();
    }

    const user = Array.isArray(data) ? (data[0] ?? null) : null;
    if (!user) {
      return errorResponse(ErrorCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return jsonResponse({
      user_id: user.id,
      email: user.email,
      trainer_granted_at: user.trainer_granted_at ?? null,
    });
  } catch (error) {
    console.error("Error in admin-lookup-user:", error);
    return internalErrorResponse();
  }
});
