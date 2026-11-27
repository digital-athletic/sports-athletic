-- table_grants: the exact privileges of the API roles on tables and functions.
--
-- RLS decides which rows a caller sees. These tests check the layer below it:
-- which tables a role may touch at all. They hold whatever default privileges
-- the database had when the tables were created.
--
-- A new table fails the first test until it is added to the list there and
-- gets its own privilege assertions below.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(32);

SELECT tables_are('public', ARRAY[
  'teams', 'team_members', 'team_invitations', 'team_member_details', 'team_workouts',
  'user_profiles', 'user_completed_workouts', 'user_exercises', 'strength_tests',
  'sport_tests', 'sport_test_reference_values'
], 'every table in public has privilege assertions in this file');

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

-- table_privs_are does not see privileges granted on single columns.
SELECT is_empty($$
  SELECT c.relname, p.privilege
  FROM   pg_catalog.pg_class c
  CROSS JOIN unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'REFERENCES']) AS p(privilege)
  WHERE  c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
  AND    pg_catalog.has_any_column_privilege('anon', c.oid, p.privilege)
$$, 'anon has no privilege on any column');
SELECT is_empty($$
  SELECT p.privilege
  FROM   unnest(ARRAY['INSERT', 'UPDATE']) AS p(privilege)
  WHERE  pg_catalog.has_any_column_privilege('authenticated', 'public.user_profiles', p.privilege)
$$, 'authenticated cannot write any column of user_profiles');

-- A table, sequence or function that postgres creates in public gets no
-- privileges for anon or authenticated by default.
SELECT is_empty($$
  SELECT d.defaclobjtype, a.grantee::regrole
  FROM   pg_catalog.pg_default_acl d
  CROSS JOIN LATERAL aclexplode(d.defaclacl) AS a
  WHERE  d.defaclnamespace = 'public'::regnamespace
  AND    d.defaclrole = 'postgres'::regrole
  AND    a.grantee IN ('anon'::regrole, 'authenticated'::regrole)
$$, 'new objects in public get no default privileges for anon or authenticated');

-- anon calls no function, whatever a migration adds later. Functions of an
-- extension installed in public, such as pgTAP itself, are left out.
SELECT is_empty($$
  SELECT p.oid::regprocedure
  FROM   pg_catalog.pg_proc p
  WHERE  p.pronamespace = 'public'::regnamespace
  AND    pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')
  AND    NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_depend d
    WHERE  d.classid = 'pg_catalog.pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
  )
$$, 'anon cannot EXECUTE any function in public');

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
