-- Migration: Create RLS policies for teams tables
-- Description: Row Level Security policies for team data access

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- SECURITY DEFINER function to check team membership (prevents RLS recursion)
CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
    AND user_id = p_user_id
  );
$$;

-- Atomic increment function for invite code use count
CREATE OR REPLACE FUNCTION increment_invite_use_count(invitation_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE team_invitations
  SET use_count = use_count + 1
  WHERE id = invitation_id
  RETURNING use_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TEAMS TABLE POLICIES
-- ============================================

-- Users can view teams they own or are members of
CREATE POLICY "Users can view teams they belong to"
  ON teams FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

-- Authenticated users can create teams
CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Team owners can update their teams
CREATE POLICY "Team owners can update their teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Team owners can delete their teams
CREATE POLICY "Team owners can delete their teams"
  ON teams FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================
-- TEAM_MEMBERS TABLE POLICIES
-- ============================================

-- Users can view members of teams they belong to
CREATE POLICY "Users can view members of their teams"
  ON team_members FOR SELECT
  TO authenticated
  USING (is_team_member(team_id, auth.uid()));

-- Team owners can add members
CREATE POLICY "Team owners can add members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Team owners can remove members, members can remove themselves
CREATE POLICY "Team owners can remove members or self-remove"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- Team owners can update member roles
CREATE POLICY "Team owners can update member roles"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- ============================================
-- TEAM_INVITATIONS TABLE POLICIES
-- ============================================

-- Team owners can view all invitations for their teams
CREATE POLICY "Team owners can view their team invitations"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- Authenticated users can validate active invite codes
CREATE POLICY "Authenticated users can validate invite codes"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Team owners can create invitations
CREATE POLICY "Team owners can create invitations"
  ON team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
      AND teams.owner_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Team owners can update invitations
CREATE POLICY "Team owners can update invitations"
  ON team_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- Team owners can delete invitations
CREATE POLICY "Team owners can delete invitations"
  ON team_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
      AND teams.owner_id = auth.uid()
    )
  );
