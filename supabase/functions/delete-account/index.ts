import { requireAuth } from "../_shared/auth.ts";
import { HttpMethods } from "../_shared/constants.ts";
import {
  internalErrorResponse,
  jsonResponse,
  requireMethod,
} from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const methodCheck = requireMethod(req, HttpMethods.POST);
  if (methodCheck.error) return methodCheck.error;

  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { error } = await supabaseAdmin.auth.admin.deleteUser(auth.userId);

    if (error) {
      console.error("Failed to delete user:", error);
      return internalErrorResponse();
    }

    return jsonResponse({ deleted: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return internalErrorResponse();
  }
});
