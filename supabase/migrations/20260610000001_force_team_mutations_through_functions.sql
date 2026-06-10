-- Route all team mutations through the service role.
--
-- Drop the direct INSERT/UPDATE/DELETE policies on teams, team_members, and
-- team_invitations so the only write path is the edge functions, which enforce
-- the trainer and ownership rules. SELECT policies are kept so users can still
-- read their own teams, memberships, and invitations.

BEGIN;

-- teams
DROP POLICY IF EXISTS "Authenticated users can create teams"   ON public.teams;
DROP POLICY IF EXISTS "Team owners can update their teams"      ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete their teams"      ON public.teams;

-- team_members
DROP POLICY IF EXISTS "Team owners can add members"                   ON public.team_members;
DROP POLICY IF EXISTS "Team owners can remove members or self-remove" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can update member roles"           ON public.team_members;

-- team_invitations
DROP POLICY IF EXISTS "Team owners can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team owners can update invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team owners can delete invitations" ON public.team_invitations;

COMMIT;
