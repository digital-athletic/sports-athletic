-- Restrict who sees the members of a group.
--
-- The owner and the co-owners see every member. A member sees only the owner
-- and themselves. If a new feature needs members to see each other, this has
-- to be enabled again.

BEGIN;

-- ============================================================================
-- 1. Whose membership the caller may see
-- ============================================================================
-- True for the membership of p_target_user_id in p_team_id when the caller
--   * is that user,
--   * is the owner or a co-owner of the team, or
--   * is a member of the team and p_target_user_id is its owner.
--
-- SECURITY DEFINER because the policy on team_members cannot read teams or
-- team_members itself: the teams policy reads team_members, which would recurse.
-- The owner is taken from teams.owner_id, the same source is_team_staff uses.
CREATE FUNCTION public.can_view_team_member(p_team_id uuid, p_target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p_target_user_id = auth.uid()
  OR public.is_team_staff(p_team_id)
  OR (
    public.is_team_member(p_team_id)
    AND EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = p_team_id AND owner_id = p_target_user_id
    )
  );
$$;

-- Only the RLS policy calls this function; it is not a public RPC.
-- authenticated needs EXECUTE because the policy runs with the caller's rights.
REVOKE EXECUTE ON FUNCTION public.can_view_team_member(uuid, uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_team_member(uuid, uuid) TO authenticated;

-- ============================================================================
-- 2. Read access
-- ============================================================================
DROP POLICY "Users can view members of their teams" ON public.team_members;

CREATE POLICY "Members view themselves and the owner, staff view all"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (public.can_view_team_member(team_id, user_id));

DROP POLICY "Team members can read each other's details" ON public.team_member_details;

-- A display name is visible when the caller may see a membership of its owner.
-- The subquery runs under the team_members policy above, so it finds only the
-- memberships can_view_team_member allows. A display name belongs to the
-- person, not to a group, so one such membership is enough.
--
-- The own row is readable without a membership, so a user who has not joined a
-- group yet still reads the display name they saved.
CREATE POLICY "Members read their own, the owner's and, as staff, all details"
  ON public.team_member_details FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = team_member_details.user_id
    )
  );

COMMIT;
