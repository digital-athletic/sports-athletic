-- delete_my_account RPC callable via supabase.rpc(...). A SECURITY DEFINER function
-- that performs a HARD delete of the calling user.
--
-- A definer function bypasses auth.users table grants only if its owner can
-- delete from it. The migration owner (postgres) holds an explicit DELETE grant
-- on auth.users, so no ALTER FUNCTION ... OWNER TO supabase_auth_admin is needed.
-- Every FK child of auth.users is ON DELETE CASCADE, so one DELETE removes the
-- user and all their data atomically.
--
-- If a future environment's postgres role lacks DELETE on auth.users, add
-- `ALTER FUNCTION public.delete_my_account() OWNER TO supabase_auth_admin;`.

BEGIN;

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;

  -- Hard delete; cascades to all auth.* and public.* child rows.
  DELETE FROM auth.users WHERE id = auth.uid();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'USER_NOT_FOUND';
  END IF;

  RETURN json_build_object('deleted', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

COMMIT;
