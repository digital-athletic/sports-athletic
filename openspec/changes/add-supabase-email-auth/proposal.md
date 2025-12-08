# Change: Add Supabase Email/Password Authentication

## Why
Replace mock authentication with real Supabase email/password authentication. The current `AuthService.ts` uses hardcoded mock responses - users cannot actually sign up or log in. Supabase Auth is already configured in the project (`src/services/supabaseClient.ts`) but not yet used for authentication.

## What Changes
- Update `AuthService.ts` to use Supabase Auth API instead of mock implementations
- Update `authStore.ts` to sync with Supabase session state
- Add auth state listener to handle session changes (refresh, expiry)

## API Stability
**Existing public API preserved** - no breaking changes for consumers:

| Existing Method | Implementation Change |
|-----------------|----------------------|
| `signInWithEmail(email, password)` | Uses `supabase.auth.signInWithPassword` internally |
| `registerWithEmail(email, password, anonymisedDataUse)` | Uses `supabase.auth.signUp` internally |
| `resetPassword(email)` | Uses `supabase.auth.resetPasswordForEmail` internally |
| `logout()` | Uses `supabase.auth.signOut` internally |
| `checkEmailExists(email)` | Removed - Supabase handles this during signIn/signUp |

The `AuthType` interface (`{ userId, token }`) and error codes (`auth/*`) remain compatible.

## Impact
- Affected specs: New `auth` capability spec
- Affected code:
  - `src/services/AuthService.ts` - Replace mock with Supabase calls (same API)
  - `src/store/authStore.ts` - Integrate Supabase session
  - `app/onboarding/index.tsx` - Remove `checkEmailExists` call, let Supabase handle
  - `app/_layout.tsx` - Add auth state listener on app init
