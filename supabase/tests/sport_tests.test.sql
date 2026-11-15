-- Sport tests and their reference values (issue #631).
--
-- sport_tests defines a fitness test per sport and region. Each test has an
-- optional set of reference ranges per gender, position and training stage.
-- Both tables are reference data: authenticated users read them, nobody but
-- service_role writes them, and anon has no access.
--
-- 23505 = unique violation, 23514 = check violation, 42501 = insufficient privilege.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(23);

-- T1 is the handball example. T2 is deleted to prove the cascade.
-- A is an authenticated user.
\set T1 'aaaaaaaa-0000-0000-0000-000000000001'
\set T2 'aaaaaaaa-0000-0000-0000-000000000002'
\set A  'bbbbbbbb-0000-0000-0000-000000000001'

INSERT INTO auth.users (id, email) VALUES (:'A', 'athlete.test@example.local');

-- ---------------------------------------------------------------------------
-- State after the migration
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT count(*) FROM public.sport_tests)
    + (SELECT count(*) FROM public.sport_test_reference_values),
  0::bigint, 'migration: both tables are empty');
SELECT is(
  (SELECT bool_and(relrowsecurity) FROM pg_class
   WHERE oid IN ('public.sport_tests'::regclass,
                 'public.sport_test_reference_values'::regclass)),
  true, 'migration: RLS is enabled on both tables');

-- ---------------------------------------------------------------------------
-- Fixtures, typed in lower case and with padding like an import
-- ---------------------------------------------------------------------------
INSERT INTO public.sport_tests (id, sport, region, code, unit, updated_at) VALUES
  (:'T1', ' sport_handball ', 'de', ' sprint_5m ', ' s ', '2000-01-01 00:00:00+00'),
  (:'T2', 'FAKE_SPORT_A', 'DE', 'FAKE_CASCADE', 'kg', now());

INSERT INTO public.sport_test_reference_values
  (test_id, gender, position, training_stage, min_age, max_age,
   range_start, range_end, updated_at) VALUES
  (:'T1', ' female ', ' wing ', ' grundlagentraining ', 13, 14, 9.87, 6.54,
   '2000-01-01 00:00:00+00'),
  (:'T2', 'MALE', 'FAKE_POSITION', 'FAKE_STAGE', 13, 14, 10, 20, now());

-- ---------------------------------------------------------------------------
-- One spelling: codes are stored trimmed and in upper case
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT sport || '|' || region || '|' || code || '|' || unit
   FROM public.sport_tests WHERE id = :'T1'),
  'SPORT_HANDBALL|DE|SPRINT_5M|s',
  'spelling: a test is stored with upper case codes and a trimmed unit');
SELECT is(
  (SELECT gender || '|' || position || '|' || training_stage
   FROM public.sport_test_reference_values WHERE test_id = :'T1'),
  'FEMALE|WING|GRUNDLAGENTRAINING',
  'spelling: a reference value is stored with upper case codes');

-- ---------------------------------------------------------------------------
-- Stored values
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT min_age::text || '-' || max_age::text || ' ' ||
          range_start::text || '/' || range_end::text
   FROM public.sport_test_reference_values WHERE test_id = :'T1'),
  '13-14 9.87/6.54',
  'values: the age range and the range are stored, the range in source order');

-- now() is constant inside a transaction. The rows start with an old timestamp
-- so an UPDATE must move it forward.
UPDATE public.sport_tests SET unit = 'cm' WHERE id = :'T1';
UPDATE public.sport_test_reference_values SET range_end = 6.5 WHERE test_id = :'T1';
SELECT ok(
  (SELECT updated_at > '2000-01-01 00:00:00+00'::timestamptz
   FROM public.sport_tests WHERE id = :'T1')
  AND
  (SELECT updated_at > '2000-01-01 00:00:00+00'::timestamptz
   FROM public.sport_test_reference_values WHERE test_id = :'T1'),
  'updated_at: an UPDATE moves the timestamp of a test and of a reference value forward');

-- ---------------------------------------------------------------------------
-- Uniqueness
-- ---------------------------------------------------------------------------
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('Sport_Handball', 'DE', 'sprint_5m', 's') $$,
  '23505', NULL, 'unique: the same sport, region and code in another case is rejected');
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('SPORT_HANDBALL', 'GB-ENG', 'SPRINT_5M', 's') $$,
  'unique: the same sport and code in another region is accepted');
SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, min_age, max_age, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'FEMALE', 'WING',
            'GRUNDLAGENTRAINING', 13, 14, 2, 3) $$,
  '23505', NULL,
  'unique: the same test, gender, position and training stage twice is rejected');

-- ---------------------------------------------------------------------------
-- Checks
-- ---------------------------------------------------------------------------
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'Germany', 'FAKE_REGION_NAME', 'm') $$,
  '23514', NULL, 'region: a country name is rejected');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('   ', 'DE', 'FAKE_BLANK_SPORT', 'm') $$,
  '23514', NULL, 'sport: blanks only are rejected');
SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, min_age, max_age, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'OTHER', 'FAKE_POSITION',
            'FAKE_STAGE', 13, 14, 1, 2) $$,
  '23514', NULL, 'gender: a value other than MALE or FEMALE is rejected');
SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, min_age, max_age, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'MALE', 'FAKE_POSITION',
            'FAKE_STAGE', 15, 14, 1, 2) $$,
  '23514', NULL, 'age: a max_age below the min_age is rejected');

-- ---------------------------------------------------------------------------
-- Relation between the tables
-- ---------------------------------------------------------------------------
DELETE FROM public.sport_tests WHERE id = :'T2';
SELECT is((SELECT count(*) FROM public.sport_test_reference_values WHERE test_id = :'T2'),
  0::bigint, 'relation: deleting a test deletes its reference values');

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------
SELECT count(*) AS n_tests FROM public.sport_tests \gset
SELECT count(*) AS n_values FROM public.sport_test_reference_values \gset

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'A';

SELECT is(
  (SELECT count(*) FROM public.sport_tests)
    + (SELECT count(*) FROM public.sport_test_reference_values),
  :n_tests::bigint + :n_values::bigint,
  'read: an authenticated user reads every row of both tables');

SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_AUTH_INSERT', 'm') $$,
  '42501', NULL, 'write: an authenticated user cannot INSERT into sport_tests');
SELECT throws_ok($$ UPDATE public.sport_tests SET unit = 'x' $$,
  '42501', NULL, 'write: an authenticated user cannot UPDATE sport_tests');
SELECT throws_ok($$ DELETE FROM public.sport_tests $$,
  '42501', NULL, 'write: an authenticated user cannot DELETE from sport_tests');
SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, min_age, max_age, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'MALE', 'FAKE_AUTH_INSERT',
            'FAKE_STAGE', 13, 14, 1, 2) $$,
  '42501', NULL, 'write: an authenticated user cannot INSERT into sport_test_reference_values');

-- anon has no SELECT grant, so the query fails on the missing grant before RLS.
RESET ROLE;
SET LOCAL ROLE anon;
SELECT throws_ok($$ SELECT count(*) FROM public.sport_tests $$,
  '42501', NULL, 'anon cannot read sport_tests');
SELECT throws_ok($$ SELECT count(*) FROM public.sport_test_reference_values $$,
  '42501', NULL, 'anon cannot read sport_test_reference_values');

-- service_role maintains the reference data.
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_SERVICE_INSERT', 'm') $$,
  'write: service_role can INSERT into sport_tests');
SELECT lives_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, min_age, max_age, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'MALE', 'FAKE_SERVICE_INSERT',
            'FAKE_STAGE', 13, 14, 1, 2) $$,
  'write: service_role can INSERT into sport_test_reference_values');

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
