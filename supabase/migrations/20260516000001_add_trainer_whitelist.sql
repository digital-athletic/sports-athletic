-- Migration: Add trainer/admin whitelisting to user_profiles
-- trainer_granted_at: NULL = not a trainer, non-NULL = timestamp when trainer role was granted.
-- admin_granted_at:   NULL = not an admin,  non-NULL = timestamp when admin role was granted.
-- lookup_user_by_email: service_role-only helper for the admin edge functions.

BEGIN;

ALTER TABLE user_profiles
  ADD COLUMN trainer_granted_at TIMESTAMPTZ,
  ADD COLUMN admin_granted_at   TIMESTAMPTZ;

-- Prevent authenticated users from self-promoting.
-- Column-level REVOKE is silently overridden by a table-level grant, so we must
-- first drop the table-level INSERT/UPDATE, then re-grant only the safe columns.
-- service_role is a superuser-equivalent and bypasses column privileges entirely.
REVOKE INSERT, UPDATE ON user_profiles FROM authenticated;

GRANT INSERT (user_id, consent_privacy_accepted, consent_analytics_accepted)
  ON user_profiles TO authenticated;

GRANT UPDATE (consent_privacy_accepted, consent_analytics_accepted)
  ON user_profiles TO authenticated;

CREATE OR REPLACE FUNCTION lookup_user_by_email(lookup_email TEXT)
RETURNS TABLE(id UUID, email TEXT, trainer_granted_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    au.id,
    au.email::TEXT,
    up.trainer_granted_at
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.user_id = au.id
  WHERE au.email = lookup_email
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION lookup_user_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lookup_user_by_email(TEXT) TO service_role;

COMMIT;
