-- Add a co-owner role to training groups.
--
-- A co-owner is promoted from an existing member and may see the training data
-- of the group's athletes, without being a granted trainer themselves. Every
-- other owner-only action stays owner-only.

BEGIN;

-- ============================================================================
-- 1. Allow the new role value
-- ============================================================================
-- Plain DROP, not DROP IF EXISTS: the name is Postgres' deterministic default
-- for the inline CHECK in 20251209000001 and is identical in every environment.
-- If it ever is not, failing here beats silently leaving the old CHECK in place
-- and rejecting 'co_owner' at runtime instead.
ALTER TABLE public.team_members
  DROP CONSTRAINT team_members_role_check,
  ADD  CONSTRAINT team_members_role_check
       CHECK (role IN ('owner', 'member', 'co_owner'));

-- ============================================================================
-- 2. Who may see an athlete's training data
-- ============================================================================
-- Replaces is_trainer_of_user() in the three SELECT policies below. That
-- function keeps its name and its meaning and is simply no longer referenced:
-- a co-owner is not a trainer, so widening it in place would have made the name
-- lie.
--
-- The user_profiles join deliberately hangs off t.owner_id, not auth.uid(): it
-- asserts that the GROUP belongs to a granted trainer, which is what lets a
-- co-owner see the data without holding a grant of their own. In the previous
-- version the two were indistinguishable, because the WHERE clause forced
-- t.owner_id = auth.uid().
CREATE OR REPLACE FUNCTION public.can_view_athlete_data(p_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.teams t
    JOIN   public.team_members target
           ON  target.team_id = t.id
           AND target.user_id = p_target_user_id
    JOIN   public.user_profiles up ON up.user_id = t.owner_id
    WHERE  up.trainer_granted_at IS NOT NULL
    AND    (
      t.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM   public.team_members caller
        WHERE  caller.team_id = t.id
        AND    caller.user_id = auth.uid()
        AND    caller.role = 'co_owner'
      )
    )
  );
$$;

-- Used from RLS policies only; not intended as a public RPC. Supabase adds
-- per-role grants on creation, so each has to be revoked individually.
REVOKE EXECUTE ON FUNCTION public.can_view_athlete_data(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_view_athlete_data(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_view_athlete_data(UUID) FROM service_role;
GRANT  EXECUTE ON FUNCTION public.can_view_athlete_data(UUID) TO   authenticated;

-- ============================================================================
-- 3. Point the three visibility policies at the new predicate
-- ============================================================================
-- Renamed along the way: "as trainer" would be wrong once co-owners qualify.

DROP POLICY IF EXISTS "Users can view own data or as trainer" ON public.user_exercises;

CREATE POLICY "Users can view own data or as team staff"
  ON public.user_exercises FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR can_view_athlete_data(user_id)
  );

DROP POLICY IF EXISTS "Users can view own completed workouts or as trainer" ON public.user_completed_workouts;

CREATE POLICY "Users can view own completed workouts or as team staff"
  ON public.user_completed_workouts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR can_view_athlete_data(user_id)
  );

DROP POLICY IF EXISTS "Users can view own strength tests or as trainer" ON public.strength_tests;

CREATE POLICY "Users can view own strength tests or as team staff"
  ON public.strength_tests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR can_view_athlete_data(user_id)
  );

-- ============================================================================
-- 4. set_member_role
-- ============================================================================
-- One function for both directions: promoting a member and demoting a co-owner
-- are the same write, and the UI offers them as a single toggle.
--
-- Check order follows remove_member: input validation first, then the owner
-- gate, which reports TEAM_NOT_FOUND to anyone who cannot see the team at all.
CREATE OR REPLACE FUNCTION public.set_member_role(
  p_team_id        uuid,
  p_member_user_id uuid,
  p_role           text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team public.teams%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF p_team_id IS NULL OR p_member_user_id IS NULL OR p_role IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  -- 'owner' is not assignable here: ownership is defined by teams.owner_id, and
  -- writing it into the role column as well would let the two disagree.
  IF p_role NOT IN ('member', 'co_owner') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  v_team := public.assert_visible_team_owner(p_team_id);

  -- The owner's own row is never touched, which keeps "the owner can never be
  -- removed" true for the role column as well.
  IF p_member_user_id = v_team.owner_id THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CANNOT_CHANGE_OWNER_ROLE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_member_user_id
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'MEMBER_NOT_FOUND';
  END IF;

  -- Setting the role a member already holds is a no-op, not an error.
  UPDATE public.team_members
  SET    role = p_role
  WHERE  team_id = p_team_id AND user_id = p_member_user_id;

  RETURN json_build_object(
    'success', true,
    'team_id', p_team_id,
    'user_id', p_member_user_id,
    'role',    p_role
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_member_role(uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_member_role(uuid, uuid, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.set_member_role(uuid, uuid, text) TO   authenticated;

COMMIT;
