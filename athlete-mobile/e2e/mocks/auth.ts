import { mockSession } from "./supabase";

const AUTH_STORAGE = {
  state: {
    auth: { userId: mockSession.user.id, token: mockSession.access_token },
    isInitialized: true,
    _hasHydrated: true,
  },
  version: 14,
};

// supabase-js derives the key from the first host label of the Supabase URL.
// Without this entry getSession() returns null and overwrites the seeded auth.
const SUPABASE_HOST_LABEL = new URL(
  process.env.TESTING_SUPABASE_BASE_URL ?? "http://localhost:54321",
).hostname.split(".")[0];

/**
 * localStorage entries of a signed-in session. Seeding them skips the UI OTP
 * login, which only the tests whose subject is login should drive.
 */
export function signedInStores(): Record<string, unknown> {
  return {
    "auth-storage": AUTH_STORAGE,
    [`sb-${SUPABASE_HOST_LABEL}-auth-token`]: mockSession,
  };
}
