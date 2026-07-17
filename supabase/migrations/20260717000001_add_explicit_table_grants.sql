-- Migration: Add explicit table grants for the API roles
--
-- The schema so far relied on default privileges to hand authenticated and
-- service_role their DML rights at CREATE TABLE time. Hosted Supabase provisions
-- ALTER DEFAULT PRIVILEGES that way, but environments with stricter defaults
-- (e.g. the local CLI stack) create postgres-owned tables WITHOUT any DML for
-- those roles, breaking every direct client read/write, the SECURITY INVOKER
-- RPCs (leave_team, delete_team), and the edge functions' service-role client.
-- RLS is unaffected by this: policies gate rows, grants gate the table itself.
--
-- These grants are idempotent and a no-op where default privileges already
-- provided them. NOTE: future tables need their own explicit grants.

BEGIN;

-- ============================================
-- authenticated: least privilege per table
-- ============================================

-- Sync tables written directly by the mobile client; RLS restricts all four
-- verbs to user_id = auth.uid() (SELECT additionally allows trainers).
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.user_completed_workouts, public.user_exercises, public.strength_tests
  TO authenticated;

-- Members maintain their own display row; no DELETE policy exists.
GRANT SELECT, INSERT, UPDATE ON public.team_member_details TO authenticated;

-- Team reads go through SELECT RLS; writes are function-only (20260610000001)
-- except the two INVOKER RPCs backed by DELETE policies:
--   leave_team  -> self-removal policy on team_members
--   delete_team -> owner-delete policy on teams
GRANT SELECT         ON public.team_invitations          TO authenticated;
GRANT SELECT, DELETE ON public.teams, public.team_members TO authenticated;

-- Read own profile only; writes must stay routed through save_user_consent
-- (INSERT/UPDATE were deliberately revoked in 20260517000002).
GRANT SELECT ON public.user_profiles TO authenticated;

-- ============================================
-- service_role: full DML, per current Supabase convention
-- ============================================
-- The live edge functions write through the service-role client, which
-- bypasses RLS but NOT table privileges.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

COMMIT;
