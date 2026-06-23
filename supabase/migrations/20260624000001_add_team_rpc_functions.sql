-- Team RPC functions callable via supabase.rpc(...), each atomic in one transaction.
--
-- Most functions are SECURITY DEFINER, enforcing authorization inside via
-- auth.uid(). leave_team and delete_team are SECURITY INVOKER, gated by the
-- self-removal and owner-delete RLS policies below.
--
-- Errors RAISE with ERRCODE 'P0001' and a MESSAGE matching the ErrorCodes enum
-- (functions/_shared/constants.ts); the RPC client maps error.message -> ErrorCode.

BEGIN;

-- ============================================================================
-- A0. Private invite-code generator (36-char alphabet, length 6)
-- ============================================================================
-- gen_random_bytes must be schema-qualified because search_path is empty.
-- Produces a candidate only; uniqueness is enforced by the code UNIQUE constraint.
CREATE OR REPLACE FUNCTION public.gen_invite_code()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SET search_path = ''
AS $$
  SELECT string_agg(
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
           (get_byte(b, i) % 36) + 1, 1), '' ORDER BY i)
  FROM (SELECT extensions.gen_random_bytes(6) AS b) g,
       generate_series(0, 5) AS i;
$$;

-- Callable only from inside the definer functions below (via the function owner).
REVOKE EXECUTE ON FUNCTION public.gen_invite_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.gen_invite_code() FROM anon;
REVOKE EXECUTE ON FUNCTION public.gen_invite_code() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.gen_invite_code() FROM service_role;

-- ============================================================================
-- A0.5. Shared owner-visibility check
-- ============================================================================
-- Re-derives the caller's team visibility under SECURITY DEFINER, which would
-- otherwise see every team:
--   * missing, or caller neither owner nor member -> TEAM_NOT_FOUND (RLS hides it)
--   * caller is a non-owner member                -> NOT_TEAM_OWNER
--   * caller owns it -> the row, locked FOR UPDATE to serialize rotation/deletion
CREATE OR REPLACE FUNCTION public.assert_visible_team_owner(p_team_id uuid)
RETURNS public.teams
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team public.teams%ROWTYPE;
BEGIN
  -- Defense in depth: a definer helper must never return a row to an anon caller.
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF p_team_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  SELECT * INTO v_team FROM public.teams WHERE id = p_team_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'TEAM_NOT_FOUND';
  END IF;

  IF v_team.owner_id <> auth.uid()
     AND NOT EXISTS (
       SELECT 1 FROM public.team_members
       WHERE team_id = p_team_id AND user_id = auth.uid()
     ) THEN
    -- Caller cannot see the team under SELECT RLS: hide its existence.
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'TEAM_NOT_FOUND';
  END IF;

  IF v_team.owner_id <> auth.uid() THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_TEAM_OWNER';
  END IF;

  RETURN v_team;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assert_visible_team_owner(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assert_visible_team_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.assert_visible_team_owner(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.assert_visible_team_owner(uuid) FROM service_role;

-- ============================================================================
-- A0.6. Write RLS policies backing the SECURITY INVOKER functions
-- ============================================================================
-- Narrow re-adds of policies 20260610000001 dropped. INSERT/UPDATE stay closed.

-- Owner exclusion enforces OWNER_CANNOT_LEAVE against a raw DELETE.
DROP POLICY IF EXISTS "Members can remove their own membership" ON public.team_members;
CREATE POLICY "Members can remove their own membership"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
        AND teams.owner_id = auth.uid()
    )
  );

-- Children cascade on delete, so no member/invitation policies are needed.
DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;
CREATE POLICY "Team owners can delete their teams"
  ON public.teams FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- A1. create_team
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_team(
  p_name        text,
  p_description text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name        text := nullif(btrim(p_name), '');
  v_description text := CASE WHEN p_description IS NULL THEN NULL ELSE btrim(p_description) END;
  v_team        public.teams%ROWTYPE;
  v_invite      public.team_invitations%ROWTYPE;
  v_attempt     int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;

  IF v_name IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND trainer_granted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_A_TRAINER';
  END IF;

  INSERT INTO public.teams (name, description, owner_id)
  VALUES (v_name, v_description, auth.uid())
  RETURNING * INTO v_team;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (v_team.id, auth.uid(), 'owner');

  -- Bounded retry against the code UNIQUE constraint.
  FOR v_attempt IN 1..10 LOOP
    INSERT INTO public.team_invitations (team_id, code, created_by)
    VALUES (v_team.id, public.gen_invite_code(), auth.uid())
    ON CONFLICT (code) DO NOTHING
    RETURNING * INTO v_invite;
    EXIT WHEN FOUND;
  END LOOP;

  -- Check the row, not FOUND: the integer FOR loop sets FOUND=true on iteration,
  -- clobbering the INSERT result. NULL id means all 10 candidates collided.
  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERNAL_ERROR';
  END IF;

  RETURN json_build_object(
    'id',          v_team.id,
    'name',        v_team.name,
    'description', v_team.description,
    'owner_id',    v_team.owner_id,
    'invite_code', v_invite.code,
    'created_at',  v_team.created_at
  );
END;
$$;

-- ============================================================================
-- A2. accept_invitation (FOR UPDATE closes the TOCTOU race)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.accept_invitation(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code text := upper(btrim(p_code));
  inv    public.team_invitations%ROWTYPE;
  m      public.team_members%ROWTYPE;
  tname  text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;

  IF v_code IS NULL OR v_code = '' OR v_code !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  -- Lock the invitation row to serialize concurrent accepts against it.
  SELECT * INTO inv
  FROM public.team_invitations
  WHERE code = v_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVITE_CODE_INVALID';
  END IF;
  IF NOT inv.is_active THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVITE_CODE_INACTIVE';
  END IF;
  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVITE_CODE_EXPIRED';
  END IF;
  IF inv.max_uses IS NOT NULL AND inv.use_count >= inv.max_uses THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVITE_CODE_MAX_USES';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = inv.team_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ALREADY_TEAM_MEMBER';
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (inv.team_id, auth.uid(), 'member')
  ON CONFLICT (team_id, user_id) DO NOTHING
  RETURNING * INTO m;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ALREADY_TEAM_MEMBER';
  END IF;

  UPDATE public.team_invitations
  SET use_count = use_count + 1
  WHERE id = inv.id;

  SELECT name INTO tname FROM public.teams WHERE id = inv.team_id;

  RETURN json_build_object(
    'member_id', m.id,
    'team_id',   inv.team_id,
    'team_name', tname,
    'user_id',   auth.uid(),
    'role',      'member',
    'joined_at', m.joined_at
  );
END;
$$;

-- ============================================================================
-- A3. leave_team
-- ============================================================================
-- INVOKER: DELETE authorized by the self-removal policy above.
CREATE OR REPLACE FUNCTION public.leave_team(p_team_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_team public.teams%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF p_team_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  -- Check order: membership, then team existence, then owner.
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_TEAM_MEMBER';
  END IF;

  SELECT * INTO v_team FROM public.teams WHERE id = p_team_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'TEAM_NOT_FOUND';
  END IF;

  IF v_team.owner_id = auth.uid() THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'OWNER_CANNOT_LEAVE';
  END IF;

  DELETE FROM public.team_members
  WHERE team_id = p_team_id AND user_id = auth.uid();

  RETURN json_build_object('action', 'left_team', 'team_id', p_team_id);
END;
$$;

-- ============================================================================
-- A4. remove_member
-- ============================================================================
CREATE OR REPLACE FUNCTION public.remove_member(
  p_team_id        uuid,
  p_member_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF p_team_id IS NULL OR p_member_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  PERFORM public.assert_visible_team_owner(p_team_id);

  IF p_member_user_id = auth.uid() THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CANNOT_REMOVE_SELF';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_member_user_id
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'MEMBER_NOT_FOUND';
  END IF;

  DELETE FROM public.team_members
  WHERE team_id = p_team_id AND user_id = p_member_user_id;

  RETURN json_build_object(
    'success',         true,
    'team_id',         p_team_id,
    'removed_user_id', p_member_user_id
  );
END;
$$;

-- ============================================================================
-- A5. delete_team
-- ============================================================================
-- INVOKER: the teams SELECT policy hides the row from outsiders (TEAM_NOT_FOUND)
-- and the owner-delete policy gates the DELETE. Plain SELECT, not FOR UPDATE:
-- row locking does not combine with the SELECT policy's subquery, and the DELETE
-- takes its own lock.
CREATE OR REPLACE FUNCTION public.delete_team(p_team_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_team public.teams%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF p_team_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  SELECT * INTO v_team FROM public.teams WHERE id = p_team_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'TEAM_NOT_FOUND';
  END IF;
  IF v_team.owner_id <> auth.uid() THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_TEAM_OWNER';
  END IF;

  -- Cascades to team_members and team_invitations.
  DELETE FROM public.teams WHERE id = p_team_id;

  RETURN json_build_object('action', 'team_deleted', 'team_id', p_team_id);
END;
$$;

-- ============================================================================
-- A6. generate_invite_code
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_invite_code(
  p_team_id             uuid,
  p_expires_at          timestamptz DEFAULT NULL,
  p_max_uses            int         DEFAULT NULL,
  p_deactivate_existing boolean     DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invite  public.team_invitations%ROWTYPE;
  v_attempt int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF p_team_id IS NULL
     OR p_deactivate_existing IS NULL
     OR (p_max_uses IS NOT NULL AND p_max_uses < 1) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  -- Owner check + FOR UPDATE team lock serializes rotation.
  PERFORM public.assert_visible_team_owner(p_team_id);

  IF p_deactivate_existing THEN
    UPDATE public.team_invitations
    SET is_active = false
    WHERE team_id = p_team_id AND is_active = true;
  END IF;

  FOR v_attempt IN 1..10 LOOP
    INSERT INTO public.team_invitations (team_id, code, created_by, expires_at, max_uses)
    VALUES (p_team_id, public.gen_invite_code(), auth.uid(), p_expires_at, p_max_uses)
    ON CONFLICT (code) DO NOTHING
    RETURNING * INTO v_invite;
    EXIT WHEN FOUND;
  END LOOP;

  -- Check the row, not FOUND (see create_team).
  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERNAL_ERROR';
  END IF;

  RETURN json_build_object(
    'code',       v_invite.code,
    'expires_at', v_invite.expires_at,
    'max_uses',   v_invite.max_uses,
    'created_at', v_invite.created_at
  );
END;
$$;

-- ============================================================================
-- Grants: EXECUTE for authenticated only. Revoke from PUBLIC and anon explicitly,
-- since Supabase may add per-role grants beyond PUBLIC.
-- ============================================================================
REVOKE EXECUTE ON FUNCTION
  public.create_team(text, text),
  public.accept_invitation(text),
  public.leave_team(uuid),
  public.remove_member(uuid, uuid),
  public.delete_team(uuid),
  public.generate_invite_code(uuid, timestamptz, int, boolean)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION
  public.create_team(text, text),
  public.accept_invitation(text),
  public.leave_team(uuid),
  public.remove_member(uuid, uuid),
  public.delete_team(uuid),
  public.generate_invite_code(uuid, timestamptz, int, boolean)
  FROM anon;
GRANT EXECUTE ON FUNCTION
  public.create_team(text, text),
  public.accept_invitation(text),
  public.leave_team(uuid),
  public.remove_member(uuid, uuid),
  public.delete_team(uuid),
  public.generate_invite_code(uuid, timestamptz, int, boolean)
  TO authenticated;

COMMIT;
