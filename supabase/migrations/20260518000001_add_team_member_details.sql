-- Migration: Create team_member_details table
--
-- Stores display name (and future member-facing profile fields) separately from
-- the GDPR-sensitive user_profiles table. Any authenticated user who shares a
-- team with the row owner can SELECT; users write their own row directly via
-- the authenticated client (RLS enforces user_id = auth.uid()).

BEGIN;

-- ============================================
-- 1. TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.team_member_details (
  user_id      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT        CHECK (display_name IS NULL OR length(display_name) <= 64),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.team_member_details ENABLE ROW LEVEL SECURITY;

-- Users always see their own row; team peers see each other's rows.
DROP POLICY IF EXISTS "Team members can read each other's details" ON public.team_member_details;

CREATE POLICY "Team members can read each other's details"
  ON public.team_member_details
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = team_member_details.user_id
        AND tm.team_id IN (
          SELECT team_id FROM public.team_members
          WHERE user_id = auth.uid()
        )
    )
  );

-- Users can insert their own row.
DROP POLICY IF EXISTS "Users can insert their own details" ON public.team_member_details;

CREATE POLICY "Users can insert their own details"
  ON public.team_member_details
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own row.
DROP POLICY IF EXISTS "Users can update their own details" ON public.team_member_details;

CREATE POLICY "Users can update their own details"
  ON public.team_member_details
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
