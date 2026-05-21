-- Redefine helper functions to accept only the non-caller parameter and derive
-- the calling user from auth.uid() internally.

BEGIN;

-- ============================================
-- 1. Drop policies that reference the old signatures
-- ============================================

DROP POLICY IF EXISTS "Users can view members of their teams"       ON public.team_members;
DROP POLICY IF EXISTS "Users can view own data or as trainer"        ON public.user_exercises;
DROP POLICY IF EXISTS "Users can view own completed workouts or as trainer" ON public.user_completed_workouts;
DROP POLICY IF EXISTS "Users can view own strength tests or as trainer"    ON public.strength_tests;

-- ============================================
-- 2. Drop old two-parameter functions
-- ============================================

DROP FUNCTION IF EXISTS public.is_team_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_trainer_of_user(UUID, UUID);

-- ============================================
-- 3. Single-parameter replacements
-- ============================================

-- Checks whether the calling user is a member of the given team.
CREATE FUNCTION public.is_team_member(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
    AND   user_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_team_member(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_team_member(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_member(UUID) FROM service_role;
GRANT  EXECUTE ON FUNCTION public.is_team_member(UUID) TO   authenticated;

-- Checks whether the calling user is a trainer (team owner) of the given user.
CREATE FUNCTION public.is_trainer_of_user(p_target_user_id UUID)
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
    WHERE  t.owner_id = auth.uid()
    AND    tm.user_id = p_target_user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_trainer_of_user(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_trainer_of_user(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_trainer_of_user(UUID) FROM service_role;
GRANT  EXECUTE ON FUNCTION public.is_trainer_of_user(UUID) TO   authenticated;

-- ============================================
-- 4. Recreate RLS policies with updated calls
-- ============================================

CREATE POLICY "Users can view members of their teams"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (is_team_member(team_id));

CREATE POLICY "Users can view own data or as trainer"
  ON public.user_exercises FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_trainer_of_user(user_id)
  );

CREATE POLICY "Users can view own completed workouts or as trainer"
  ON public.user_completed_workouts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_trainer_of_user(user_id)
  );

CREATE POLICY "Users can view own strength tests or as trainer"
  ON public.strength_tests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_trainer_of_user(user_id)
  );

COMMIT;
