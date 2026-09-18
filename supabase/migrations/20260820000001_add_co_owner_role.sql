-- Add a co-owner role to training groups.
--
-- A co-owner is promoted from an existing member and may see the training data
-- of the group's athletes, without being a granted trainer themselves. Every
-- other owner-only action stays owner-only.

BEGIN;

-- ============================================================================
-- 1. Allow the new role value
-- ============================================================================
-- The constraint name is the default Postgres gave the inline CHECK in
-- 20251209000001, so it is the same in every environment. No IF EXISTS on
-- purpose: if the name does not match, this migration must fail. Otherwise the
-- old CHECK would stay and reject 'co_owner' at runtime.
ALTER TABLE public.team_members
  DROP CONSTRAINT team_members_role_check,
  ADD  CONSTRAINT team_members_role_check
       CHECK (role IN ('owner', 'member', 'co_owner'));

-- ============================================================================
-- 2. Who may see an athlete's training data
-- ============================================================================
-- Replaces is_trainer_of_user() in the three SELECT policies below. A co-owner
-- is not a trainer, so that function would have been the wrong name for the
-- new rule. Section 3 drops it.
--
-- The trainer grant is checked on the group owner (t.owner_id), not on the
-- caller. That is what lets a co-owner without a grant of their own see the
-- data: the group must belong to a granted trainer. Do not change the join to
-- auth.uid(), that would lock co-owners out again.
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

-- Only the RLS policies call this function; it is not a public RPC. Supabase
-- grants EXECUTE to every role when a function is created, so each grant is
-- revoked one by one.
REVOKE EXECUTE ON FUNCTION public.can_view_athlete_data(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_view_athlete_data(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_view_athlete_data(UUID) FROM service_role;
GRANT  EXECUTE ON FUNCTION public.can_view_athlete_data(UUID) TO   authenticated;

-- ============================================================================
-- 3. Point the three visibility policies at the new predicate
-- ============================================================================
-- The policies get new names: "as trainer" would be wrong now that co-owners
-- qualify too.

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

-- No policy, function, client or test uses is_trainer_of_user() any more.
DROP FUNCTION IF EXISTS public.is_trainer_of_user(UUID);

-- ============================================================================
-- 4. set_member_role
-- ============================================================================
-- One function for both directions: promoting a member and demoting a co-owner
-- are the same write, and the UI offers them as a single toggle.
--
-- Only the team owner may call this (assert_visible_team_owner below). A
-- caller who cannot see the team gets TEAM_NOT_FOUND instead of
-- NOT_TEAM_OWNER, so the function does not reveal that the team exists. The
-- checks run in the same order as in remove_member.
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

  -- 'owner' cannot be assigned here. Ownership is stored in teams.owner_id;
  -- writing it into the role column as well would create two places that can
  -- contradict each other.
  IF p_role NOT IN ('member', 'co_owner') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  v_team := public.assert_visible_team_owner(p_team_id);

  -- The owner's own row cannot be changed. An owner can never be removed from
  -- a team, and the role column follows the same rule.
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
