-- Require a current trainer grant for trainer-level access.
--
-- is_trainer_of_user() now also checks that the caller's
-- user_profiles.trainer_granted_at is set, so trainer visibility into athlete
-- data follows the active trainer grant rather than team ownership alone.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_trainer_of_user(p_target_user_id UUID)
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
    JOIN   public.user_profiles up ON up.user_id = t.owner_id
    WHERE  t.owner_id = auth.uid()
    AND    tm.user_id = p_target_user_id
    AND    up.trainer_granted_at IS NOT NULL
  );
$$;

COMMIT;
