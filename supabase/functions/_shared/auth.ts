import { type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { getSupabaseClient, getUserId, supabaseAdmin } from "./supabase.ts";
import { ErrorCodes, HttpStatus } from "./constants.ts";
import { errorResponse, internalErrorResponse } from "./response.ts";

export interface AuthResult {
  userId: string;
  client: SupabaseClient;
  error?: never;
}

export interface AuthError {
  userId?: never;
  client?: never;
  error: Response;
}

export type AuthCheck = AuthResult | AuthError;

export async function requireAuth(req: Request): Promise<AuthCheck> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return {
      error: errorResponse(ErrorCodes.AUTH_REQUIRED, HttpStatus.UNAUTHORIZED),
    };
  }

  const userId = await getUserId(authHeader);

  if (!userId) {
    return {
      error: errorResponse(ErrorCodes.AUTH_INVALID, HttpStatus.UNAUTHORIZED),
    };
  }

  const client = getSupabaseClient(authHeader);

  return { userId, client };
}

export async function requireAdmin(req: Request): Promise<AuthCheck> {
  const auth = await requireAuth(req);
  if (auth.error) return auth;

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("admin_granted_at")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking admin status:", error);
    return { error: internalErrorResponse() };
  }
  if (!data?.admin_granted_at) {
    return {
      error: errorResponse(ErrorCodes.NOT_AN_ADMIN, HttpStatus.FORBIDDEN),
    };
  }
  return auth;
}
