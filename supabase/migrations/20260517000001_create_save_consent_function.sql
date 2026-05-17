-- Migration: Create save_user_consent RPC function
--
-- Replaces direct table upserts from the mobile client for consent updates.
-- Using a SECURITY DEFINER function with an explicit column list is the correct
-- pattern here because:
--   1. The column-level REVOKE on `authenticated` (added in 20260516) excludes
--      consent_updated_at, so a direct upsert from the client fails.
--   2. An explicit ON CONFLICT DO UPDATE SET with a named column list guarantees
--      that trainer_granted_at, admin_granted_at, created_at and any future
--      protected columns are never touched, regardless of what the client sends.
--   3. user_id is resolved from auth.uid() server-side — the client cannot
--      supply or spoof it.

BEGIN;

CREATE OR REPLACE FUNCTION save_user_consent(
  p_privacy_accepted   BOOLEAN,
  p_analytics_accepted BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Defence-in-depth: reject unauthenticated calls even though the GRANT below
  -- already limits execution to the authenticated role.
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.user_profiles (
    user_id,
    consent_privacy_accepted,
    consent_analytics_accepted,
    consent_updated_at
  ) VALUES (
    auth.uid(),
    p_privacy_accepted,
    p_analytics_accepted,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    consent_privacy_accepted  = EXCLUDED.consent_privacy_accepted,
    consent_analytics_accepted = EXCLUDED.consent_analytics_accepted,
    consent_updated_at        = NOW();
    -- Intentionally omitted: created_at, updated_at (trigger), trainer_granted_at,
    -- admin_granted_at — these must never be touched by this function.
END;
$$;

REVOKE EXECUTE ON FUNCTION save_user_consent(BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION save_user_consent(BOOLEAN, BOOLEAN) TO   authenticated;

COMMIT;
