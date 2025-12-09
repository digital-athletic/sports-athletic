import { type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { getSupabaseClient, getUserId } from "./supabase.ts";
import { ErrorCodes, HttpStatus } from "./constants.ts";
import { errorResponse } from "./response.ts";

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
