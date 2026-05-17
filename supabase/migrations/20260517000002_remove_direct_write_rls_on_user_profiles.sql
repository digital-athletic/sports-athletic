-- All writes now go through save_user_consent (SECURITY DEFINER, bypasses RLS).
-- Drop direct INSERT/UPDATE policies and grants — RLS default-deny closes the path.
-- SELECT policy kept for fetchConsentFromProfile.

BEGIN;

DROP POLICY "Users can insert their own profile" ON public.user_profiles;
DROP POLICY "Users can update their own profile" ON public.user_profiles;

REVOKE INSERT ON public.user_profiles FROM authenticated;
REVOKE UPDATE ON public.user_profiles FROM authenticated;

COMMIT;
