import { createClient } from "npm:@supabase/supabase-js@2";

export const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

export function getSupabaseClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader! } },
    },
  );
}

export async function getUserId(authHeader: string): Promise<string | null> {
  const token = authHeader.replace("Bearer ", "");

  // Use admin client to verify the token and get user
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error) {
    return null;
  }

  return user?.id ?? null;
}
