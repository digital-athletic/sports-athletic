## 1. Auth Service Implementation (API stable - same method signatures)
- [x] 1.1 Update `signInWithEmail` implementation to use `supabase.auth.signInWithPassword`
- [x] 1.2 Update `registerWithEmail` implementation to use `supabase.auth.signUp`
- [x] 1.3 Update `resetPassword` implementation to use `supabase.auth.resetPasswordForEmail`
- [x] 1.4 Update `logout` implementation to use `supabase.auth.signOut`
- [x] 1.5 Remove `checkEmailExists` (Supabase handles this via signIn/signUp errors)
- [x] 1.6 Map Supabase error codes to existing `auth/*` format for UI compatibility

## 2. Auth Store Integration
- [x] 2.1 Update `AuthType` interface to include Supabase session fields (`accessToken`, `refreshToken`, `expiresAt`)
- [x] 2.2 Add `initializeFromSupabase` action to hydrate store from Supabase session
- [x] 2.3 Update `setAuth` to work with Supabase user/session objects

## 3. Auth State Listener
- [x] 3.1 Create `useAuthStateListener` hook to subscribe to `supabase.auth.onAuthStateChange`
- [x] 3.2 Integrate listener in app root layout (`app/_layout.tsx`)
- [x] 3.3 Handle `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED` events

## 4. Error Handling Updates
- [x] 4.1 Update onboarding screen error handling to handle Supabase-specific error messages
- [x] 4.2 Add network error handling for auth operations

## 5. Testing & Validation
- [x] 5.1 TypeScript type check passes
- [x] 5.2 All existing tests pass (590 tests)
- [x] 5.3 ESLint passes with zero warnings
