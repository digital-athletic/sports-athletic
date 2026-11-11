-- Team workouts: one AIWL workout template per row, stored for a team.
--
-- Owner, co-owners and members read a team's workouts through SELECT RLS.
-- Only the team owner writes, through save_team_workout and
-- delete_team_workout. Like the other team tables, team_workouts has no INSERT,
-- UPDATE or DELETE policy, and the authenticated role lacks a write grant.
--
-- The server checks only the outer frame of a template: "aiwl" is the number 1,
-- "name"."en" is a non-blank string and "blocks" is a non-empty array. The
-- clients validate everything inside the blocks.
--
-- Errors RAISE with ERRCODE 'P0001' and a MESSAGE matching the ErrorCodes enum
-- (functions/_shared/constants.ts).

BEGIN;

-- ============================================================================
-- 1. Table
-- ============================================================================
CREATE TABLE public.team_workouts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  -- The AIWL template. save_team_workout sets template.id to the row id.
  template   JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_workouts_team_id ON public.team_workouts(team_id);

CREATE TRIGGER update_team_workouts_updated_at
  BEFORE UPDATE ON public.team_workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. Read access
-- ============================================================================
ALTER TABLE public.team_workouts ENABLE ROW LEVEL SECURITY;

-- The owner also has an 'owner' row in team_members. The owner_id check matches
-- the teams SELECT policy in case that row is missing.
CREATE POLICY "Team members can view team workouts"
  ON public.team_workouts FOR SELECT
  TO authenticated
  USING (
    public.is_team_member(team_id)
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_workouts.team_id
        AND t.owner_id = auth.uid()
    )
  );

-- Hosted Supabase hands every API role full DML on new tables through default
-- privileges. Reset that and grant only what the access model needs.
REVOKE ALL ON public.team_workouts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.team_workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_workouts TO service_role;

-- ============================================================================
-- 3. Template frame check
-- ============================================================================
-- True when the template has AIWL version 1, a non-blank English name and at
-- least one block. Only the definer functions below call it.
--
-- Every check works on any JSON value without raising: SQL does not promise to
-- evaluate AND operands in order, so a type check cannot guard a later cast.
-- jsonb equality compares numbers by value, so 1 and 1.0 pass and "1" fails.
CREATE FUNCTION public.is_valid_team_workout_template(p_template jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT coalesce(
    jsonb_typeof(p_template) = 'object'
    AND p_template->'aiwl' = '1'::jsonb
    AND jsonb_typeof(p_template->'name'->'en') = 'string'
    AND btrim(p_template->'name'->>'en') <> ''
    AND CASE WHEN jsonb_typeof(p_template->'blocks') = 'array'
             THEN jsonb_array_length(p_template->'blocks') > 0
             ELSE false
        END,
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_valid_team_workout_template(jsonb)
  FROM PUBLIC, anon, authenticated, service_role;

-- ============================================================================
-- 4. save_team_workout
-- ============================================================================
-- Creates a team workout when p_workout_id is NULL, otherwise replaces the
-- template of that workout. Returns the saved row. A client-sent template.id is
-- ignored.
--
-- Errors, checked in this order:
--   AUTH_REQUIRED            no caller
--   INVALID_REQUEST_BODY     p_team_id is NULL
--   TEAM_NOT_FOUND           team missing, or caller is not in the team
--   NOT_TEAM_OWNER           caller is a co-owner or member
--   INVALID_WORKOUT_TEMPLATE template frame check failed
--   TEAM_WORKOUT_NOT_FOUND   p_workout_id is not a workout of this team
CREATE FUNCTION public.save_team_workout(
  p_team_id    uuid,
  p_template   jsonb,
  p_workout_id uuid DEFAULT NULL
)
RETURNS public.team_workouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id       uuid := coalesce(p_workout_id, gen_random_uuid());
  v_template jsonb;
  v_workout  public.team_workouts%ROWTYPE;
BEGIN
  -- Also locks the team row, so a concurrent delete_team waits.
  PERFORM public.assert_visible_team_owner(p_team_id);

  IF NOT public.is_valid_team_workout_template(p_template) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_WORKOUT_TEMPLATE';
  END IF;

  v_template := jsonb_set(p_template, '{id}', to_jsonb(v_id::text));

  IF p_workout_id IS NULL THEN
    INSERT INTO public.team_workouts (id, team_id, template)
    VALUES (v_id, p_team_id, v_template)
    RETURNING * INTO v_workout;
  ELSE
    UPDATE public.team_workouts
    SET    template = v_template
    WHERE  id = p_workout_id AND team_id = p_team_id
    RETURNING * INTO v_workout;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'TEAM_WORKOUT_NOT_FOUND';
    END IF;
  END IF;

  RETURN v_workout;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_team_workout(uuid, jsonb, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.save_team_workout(uuid, jsonb, uuid) TO authenticated;

-- ============================================================================
-- 5. delete_team_workout
-- ============================================================================
-- Errors:
--   AUTH_REQUIRED          no caller
--   INVALID_REQUEST_BODY   p_workout_id is NULL
--   TEAM_WORKOUT_NOT_FOUND workout missing, or caller is not in its team
--                          (hides that the workout exists)
--   NOT_TEAM_OWNER         caller is a co-owner or member of its team
CREATE FUNCTION public.delete_team_workout(p_workout_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF p_workout_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REQUEST_BODY';
  END IF;

  SELECT team_id INTO v_team_id
  FROM   public.team_workouts
  WHERE  id = p_workout_id;

  IF NOT FOUND
     OR (
       NOT EXISTS (
         SELECT 1 FROM public.team_members
         WHERE team_id = v_team_id AND user_id = auth.uid()
       )
       AND NOT EXISTS (
         SELECT 1 FROM public.teams
         WHERE id = v_team_id AND owner_id = auth.uid()
       )
     ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'TEAM_WORKOUT_NOT_FOUND';
  END IF;

  PERFORM public.assert_visible_team_owner(v_team_id);

  DELETE FROM public.team_workouts WHERE id = p_workout_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_team_workout(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.delete_team_workout(uuid) TO authenticated;

COMMIT;
