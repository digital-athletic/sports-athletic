-- Migration: Take back the table privileges Supabase granted by default
--
-- Until 2026 hosted Supabase granted ALL on every new table in public to anon,
-- authenticated and service_role. The eight tables created before
-- 20261113000001 never revoked that, so on such a project
--   * anon holds every privilege on them, and
--   * authenticated holds more than 20260717000001 intended.
-- RLS filters the rows, but it does not cover TRUNCATE, and a single policy
-- mistake would expose a table to callers without a session.
--
-- After this migration a table is reachable only through the grants listed
-- here. The result is the same on every environment, whatever its default
-- privileges were when the tables were created.

BEGIN;

-- ============================================================================
-- 1. Reset the eight older tables
-- ============================================================================
REVOKE ALL ON
  public.teams,
  public.team_members,
  public.team_invitations,
  public.team_member_details,
  public.user_profiles,
  public.user_completed_workouts,
  public.user_exercises,
  public.strength_tests
FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 2. authenticated: the grants from 20260717000001, nothing else
-- ============================================================================
-- anon gets no grant on any table.

-- Sync tables the mobile client writes directly. RLS limits every verb to the
-- caller's own rows; SELECT also allows the staff of the caller's groups.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.user_completed_workouts, public.user_exercises, public.strength_tests
  TO authenticated;

-- Users maintain their own display name. No DELETE policy exists.
GRANT SELECT, INSERT, UPDATE ON public.team_member_details TO authenticated;

-- Group data is read under SELECT RLS and written through functions. DELETE is
-- needed by the two SECURITY INVOKER functions leave_team and delete_team.
GRANT SELECT         ON public.team_invitations           TO authenticated;
GRANT SELECT, DELETE ON public.teams, public.team_members TO authenticated;

-- Users read their own profile. Writes go through save_user_consent.
GRANT SELECT ON public.user_profiles TO authenticated;

-- ============================================================================
-- 3. Future tables start without grants
-- ============================================================================
-- Projects created before the 2026 change may still hand out the old defaults
-- to tables that postgres creates. Remove them, so a new table is closed until
-- its migration grants access. This does nothing where the defaults are
-- already strict. service_role keeps its defaults.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- ============================================================================
-- 4. Functions
-- ============================================================================
-- Trigger functions are never called directly. A trigger fires without an
-- EXECUTE check on the caller, so no API role needs the privilege.
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_consent_updated_at()
  FROM PUBLIC, anon, authenticated;

-- service_role maintains sport_tests. The CHECK constraint on translations
-- calls this function with the rights of the writing role. Without default
-- privileges service_role has no EXECUTE on it and every insert fails.
GRANT EXECUTE ON FUNCTION public.is_valid_sport_test_translations(jsonb) TO service_role;

COMMIT;
