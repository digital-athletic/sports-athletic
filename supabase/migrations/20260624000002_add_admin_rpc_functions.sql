-- Admin RPC functions callable via supabase.rpc(...).
--
-- Each function runs assert_admin (auth.uid() set + admin_granted_at present)
-- BEFORE touching target-user data, since a definer function bypasses RLS and
-- column grants. The gate lives in one helper so it cannot drift. Errors RAISE
-- with ERRCODE 'P0001' and a MESSAGE matching the ErrorCodes enum.
--
-- These functions SELECT from auth.users, relying on the owner (postgres) being
-- able to read it, like the existing lookup_user_by_email definer function.

BEGIN;

-- ============================================================================
-- B0. Shared admin gate
-- ============================================================================
-- Revoked from every role: reachable only via the definer functions below, which
-- run as the function owner.
CREATE OR REPLACE FUNCTION public.assert_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND admin_granted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_AN_ADMIN';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assert_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assert_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.assert_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.assert_admin() FROM service_role;

-- ============================================================================
-- B1. admin_lookup_user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_lookup_user(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email              text := btrim(p_email);
  v_user_id            uuid;
  v_found_email        text;
  v_trainer_granted_at timestamptz;
BEGIN
  PERFORM public.assert_admin();

  IF v_email IS NULL
     OR v_email = ''
     OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  -- Exact-email match, mirroring lookup_user_by_email.
  SELECT au.id, au.email::text, up.trainer_granted_at
  INTO v_user_id, v_found_email, v_trainer_granted_at
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.user_id = au.id
  WHERE au.email = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'USER_NOT_FOUND';
  END IF;

  RETURN json_build_object(
    'user_id',            v_user_id,
    'email',              v_found_email,
    'trainer_granted_at', v_trainer_granted_at
  );
END;
$$;

-- ============================================================================
-- B2. admin_set_trainer
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_set_trainer(
  p_user_id    uuid,
  p_is_trainer boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_trainer_granted_at timestamptz;
BEGIN
  PERFORM public.assert_admin();

  IF p_user_id IS NULL OR p_is_trainer IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'USER_NOT_FOUND';
  END IF;

  -- Definer owner bypasses the column-level REVOKE on trainer_granted_at.
  v_trainer_granted_at := CASE WHEN p_is_trainer THEN now() ELSE NULL END;

  INSERT INTO public.user_profiles (user_id, trainer_granted_at)
  VALUES (p_user_id, v_trainer_granted_at)
  ON CONFLICT (user_id) DO UPDATE
    SET trainer_granted_at = v_trainer_granted_at;

  RETURN json_build_object(
    'user_id',            p_user_id,
    'trainer_granted_at', v_trainer_granted_at
  );
END;
$$;

-- ============================================================================
-- Grants: EXECUTE for authenticated; admin status checked inside.
-- ============================================================================
REVOKE EXECUTE ON FUNCTION
  public.admin_lookup_user(text),
  public.admin_set_trainer(uuid, boolean)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION
  public.admin_lookup_user(text),
  public.admin_set_trainer(uuid, boolean)
  FROM anon;
GRANT EXECUTE ON FUNCTION
  public.admin_lookup_user(text),
  public.admin_set_trainer(uuid, boolean)
  TO authenticated;

COMMIT;
