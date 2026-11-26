-- table_grants: the exact table privileges of the API roles.
--
-- RLS decides which rows a caller sees. These tests check the layer below it:
-- which tables a role may touch at all. The lists are complete, so a new
-- privilege on any table fails a test, whatever default privileges the
-- database had when the table was created.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(27);

-- anon has no privilege on any table.
SELECT table_privs_are('public', t, 'anon', ARRAY[]::text[], 'anon has no privilege on ' || t)
FROM unnest(ARRAY[
  'teams', 'team_members', 'team_invitations', 'team_member_details', 'team_workouts',
  'user_profiles', 'user_completed_workouts', 'user_exercises', 'strength_tests',
  'sport_tests', 'sport_test_reference_values'
]) AS t;

-- authenticated: sync tables the mobile client writes directly.
SELECT table_privs_are('public', t, 'authenticated', ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  'authenticated reads and writes ' || t)
FROM unnest(ARRAY['user_completed_workouts', 'user_exercises', 'strength_tests']) AS t;

SELECT table_privs_are('public', 'team_member_details', 'authenticated', ARRAY['SELECT', 'INSERT', 'UPDATE'],
  'authenticated reads, inserts and updates team_member_details');

-- DELETE backs leave_team and delete_team, which run with the caller's rights.
SELECT table_privs_are('public', t, 'authenticated', ARRAY['SELECT', 'DELETE'],
  'authenticated reads and deletes ' || t)
FROM unnest(ARRAY['teams', 'team_members']) AS t;

SELECT table_privs_are('public', t, 'authenticated', ARRAY['SELECT'], 'authenticated only reads ' || t)
FROM unnest(ARRAY[
  'team_invitations', 'team_workouts', 'user_profiles', 'sport_tests', 'sport_test_reference_values'
]) AS t;

-- Trigger functions are not callable by the API roles.
SELECT is(has_function_privilege('anon', 'public.update_updated_at_column()', 'EXECUTE'), false,
  'anon cannot EXECUTE update_updated_at_column');
SELECT is(has_function_privilege('authenticated', 'public.update_updated_at_column()', 'EXECUTE'), false,
  'authenticated cannot EXECUTE update_updated_at_column');
SELECT is(has_function_privilege('anon', 'public.update_consent_updated_at()', 'EXECUTE'), false,
  'anon cannot EXECUTE update_consent_updated_at');
SELECT is(has_function_privilege('authenticated', 'public.update_consent_updated_at()', 'EXECUTE'), false,
  'authenticated cannot EXECUTE update_consent_updated_at');

-- The triggers still fire for a caller without EXECUTE on their function.
\set U 'dddddddd-dddd-dddd-dddd-dddddddddddd'
INSERT INTO auth.users (id, email) VALUES (:'U', 'grants.test@example.local');
INSERT INTO public.user_exercises (user_id, exercise_id, updated_at)
VALUES (:'U', 'FAKE_EXERCISE', '2000-01-01T00:00:00Z');

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'U';
UPDATE public.user_exercises SET exercise_id = 'FAKE_EXERCISE_2' WHERE user_id = :'U';
SELECT cmp_ok((SELECT updated_at FROM public.user_exercises WHERE user_id = :'U'), '>',
  '2000-01-01T00:00:00Z'::timestamptz, 'the updated_at trigger still fires for authenticated');

SELECT * FROM finish();
ROLLBACK;
