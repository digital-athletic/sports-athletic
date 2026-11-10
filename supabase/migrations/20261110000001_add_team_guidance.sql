-- Team guidance and weekly target.
--
-- The team owner writes free-text guidance (for example the team training
-- days) and a weekly target in training days per week. Athletes read both on
-- the team info page in the app. The target is a displayed count only and does
-- not feed the athlete's training plan.
--
-- Teams stay closed to direct UPDATEs (20260610000001); the owner writes both
-- fields through update_team_guidance, which follows the pattern of the other
-- owner-only team functions.

BEGIN;

-- ============================================================================
-- 1. Columns
-- ============================================================================
-- Both nullable, so existing teams keep both empty. The CHECKs repeat the
-- function's validation as a last line of defence against other write paths.
ALTER TABLE public.teams
  ADD COLUMN guidance text
      CONSTRAINT teams_guidance_length_check CHECK (char_length(guidance) <= 1000),
  ADD COLUMN weekly_training_days smallint
      CONSTRAINT teams_weekly_training_days_check CHECK (weekly_training_days BETWEEN 1 AND 7);

-- ============================================================================
-- 2. update_team_guidance
-- ============================================================================
-- Saves both fields in one call. Blank guidance (only spaces, tabs or line
-- breaks) and a NULL target clear the stored value. assert_visible_team_owner raises TEAM_NOT_FOUND for callers
-- outside the team and NOT_TEAM_OWNER for co-owners and members. Validation
-- runs before the write, so a rejected call changes nothing.
CREATE OR REPLACE FUNCTION public.update_team_guidance(
  p_team_id              uuid,
  p_guidance             text,
  p_weekly_training_days integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- btrim strips spaces only by default; tabs and line breaks count as blank too.
  v_guidance text := nullif(btrim(p_guidance, E' \t\r\n'), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF p_team_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  PERFORM public.assert_visible_team_owner(p_team_id);

  IF char_length(v_guidance) > 1000 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'GUIDANCE_TOO_LONG';
  END IF;
  IF p_weekly_training_days NOT BETWEEN 1 AND 7 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'WEEKLY_TARGET_OUT_OF_RANGE';
  END IF;

  UPDATE public.teams
  SET    guidance             = v_guidance,
         weekly_training_days = p_weekly_training_days
  WHERE  id = p_team_id;

  RETURN json_build_object(
    'team_id',              p_team_id,
    'guidance',             v_guidance,
    'weekly_training_days', p_weekly_training_days
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_team_guidance(uuid, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_team_guidance(uuid, text, integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.update_team_guidance(uuid, text, integer) TO   authenticated;

COMMIT;
