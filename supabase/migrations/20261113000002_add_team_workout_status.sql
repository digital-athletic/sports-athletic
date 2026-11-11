-- Team workout status: every team workout is a draft or published.
--
-- Members read published workouts only, so the athlete app never receives a
-- draft. The owner and co-owners read drafts and published workouts.
-- The column is added with DEFAULT 'published', so every workout saved before
-- this migration stays visible to athletes. The default then becomes 'draft',
-- so save_team_workout creates drafts; its UPDATE leaves the status unchanged.
-- Only the owner changes the status, through set_team_workout_status.
--
-- Errors RAISE with ERRCODE 'P0001' and a MESSAGE matching the ErrorCodes enum
-- (functions/_shared/constants.ts).

BEGIN;

-- ============================================================================
-- 1. Column
-- ============================================================================
ALTER TABLE public.team_workouts
  ADD COLUMN status text NOT NULL DEFAULT 'published'
    CONSTRAINT team_workouts_status_check CHECK (status IN ('draft', 'published'));
ALTER TABLE public.team_workouts ALTER COLUMN status SET DEFAULT 'draft';

-- ============================================================================
-- 2. Who counts as team staff
-- ============================================================================
-- True when the caller owns the team or is one of its co-owners. The owner_id
-- check matches the teams SELECT policy in case the owner's 'owner' row in
-- team_members is missing.
CREATE FUNCTION public.is_team_staff(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = p_team_id AND owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
    AND   user_id = auth.uid()
    AND   role IN ('owner', 'co_owner')
  );
$$;

-- Only the RLS policy below calls this function; it is not a public RPC.
-- authenticated needs EXECUTE because the policy runs with the caller's rights.
REVOKE EXECUTE ON FUNCTION public.is_team_staff(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_team_staff(uuid) TO authenticated;

-- ============================================================================
-- 3. Read access
-- ============================================================================
DROP POLICY "Team members can view team workouts" ON public.team_workouts;

CREATE POLICY "Members view published team workouts, staff view all"
  ON public.team_workouts FOR SELECT
  TO authenticated
  USING (
    public.is_team_staff(team_id)
    OR (status = 'published' AND public.is_team_member(team_id))
  );

-- ============================================================================
-- 4. set_team_workout_status
-- ============================================================================
-- Publishes a draft ('published') or moves a published workout back to draft
-- ('draft'). Setting the status a workout already has is a no-op. Returns the
-- row.
--
-- Errors, checked in this order:
--   AUTH_REQUIRED          no caller
--   INVALID_REQUEST_BODY   p_team_id is NULL
--   TEAM_NOT_FOUND         team missing, or caller is not in the team
--   NOT_TEAM_OWNER         caller is a co-owner or member
--   INVALID_REQUEST_BODY   p_workout_id or p_status is NULL, or p_status is
--                          neither 'draft' nor 'published'
--   TEAM_WORKOUT_NOT_FOUND p_workout_id is not a workout of this team
CREATE FUNCTION public.set_team_workout_status(
  p_team_id    uuid,
  p_workout_id uuid,
  p_status     text
)
RETURNS public.team_workouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_workout public.team_workouts%ROWTYPE;
BEGIN
  -- Also locks the team row, so a concurrent delete_team waits.
  PERFORM public.assert_visible_team_owner(p_team_id);

  IF p_workout_id IS NULL OR p_status IS NULL
     OR p_status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  UPDATE public.team_workouts
  SET    status = p_status
  WHERE  id = p_workout_id AND team_id = p_team_id
  RETURNING * INTO v_workout;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'TEAM_WORKOUT_NOT_FOUND';
  END IF;

  RETURN v_workout;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_team_workout_status(uuid, uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.set_team_workout_status(uuid, uuid, text) TO authenticated;

COMMIT;
