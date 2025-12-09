import { type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { Tables } from "./constants.ts";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 10;

function generateSecureCode(): string {
  const randomBytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(randomBytes);

  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS.charAt(randomBytes[i] % CHARS.length);
  }

  return code;
}

export async function generateUniqueInviteCode(
  client: SupabaseClient,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateSecureCode();

    const { data, error } = await client
      .from(Tables.TEAM_INVITATIONS)
      .select("id")
      .eq("code", code)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      return code;
    }
  }

  throw new Error(
    `Failed to generate unique invite code after ${MAX_ATTEMPTS} attempts`,
  );
}
