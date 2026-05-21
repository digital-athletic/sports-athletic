-- Tightens function and storage permissions to match the principle of least
-- privilege: each function is callable only by the roles that legitimately
-- need it, and storage access is limited to what the application actually uses.

BEGIN;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_consent_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (NEW.consent_privacy_accepted IS DISTINCT FROM OLD.consent_privacy_accepted)
     OR (NEW.consent_analytics_accepted IS DISTINCT FROM OLD.consent_analytics_accepted)
  THEN
    NEW.consent_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- Used in RLS policies on team_members only; not intended as a public RPC.
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
    AND user_id = p_user_id
  );
$$;

-- Supabase adds explicit per-role grants (anon, authenticated, service_role) when
-- a function is created in addition to the PUBLIC grant. REVOKE FROM PUBLIC only
-- strips the PUBLIC entry; explicit role grants must be revoked individually.
REVOKE EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) FROM service_role;
GRANT  EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) TO   authenticated;

-- Used in RLS policies on user_exercises and user_completed_workouts only;
-- not intended as a public RPC.
CREATE OR REPLACE FUNCTION public.is_trainer_of_user(trainer_id UUID, target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.teams t
    JOIN   public.team_members tm ON tm.team_id = t.id
    WHERE  t.owner_id = trainer_id
    AND    tm.user_id = target_user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_trainer_of_user(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_trainer_of_user(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_trainer_of_user(UUID, UUID) FROM service_role;
GRANT  EXECUTE ON FUNCTION public.is_trainer_of_user(UUID, UUID) TO   authenticated;

-- Called exclusively by edge functions via the service-role client.
REVOKE EXECUTE ON FUNCTION public.lookup_user_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lookup_user_by_email(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.lookup_user_by_email(TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.lookup_user_by_email(TEXT) TO   service_role;

-- Called by the mobile client after sign-in to record GDPR consent.
REVOKE EXECUTE ON FUNCTION public.save_user_consent(BOOLEAN, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_user_consent(BOOLEAN, BOOLEAN) FROM anon;
GRANT  EXECUTE ON FUNCTION public.save_user_consent(BOOLEAN, BOOLEAN) TO   authenticated;

COMMIT;
