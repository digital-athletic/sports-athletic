-- Sport tests and their reference values (issue #631).
--
-- sport_tests defines a fitness test per sport and region. Each test has an
-- optional set of reference ranges per gender, position and training stage.
-- Both tables are reference data: authenticated users read them, nobody but
-- service_role writes them, and anon has no access.
--
-- 23505 = unique violation, 23514 = check violation, 23502 = not null violation,
-- 23503 = foreign key violation, 42501 = insufficient privilege.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(53);

-- T1 is the handball example. T2 is a second test for the same sport and region.
-- T3 is deleted to prove the cascade. A is an authenticated user.
\set T1 'aaaaaaaa-0000-0000-0000-000000000001'
\set T2 'aaaaaaaa-0000-0000-0000-000000000002'
\set T3 'aaaaaaaa-0000-0000-0000-000000000003'
\set A  'bbbbbbbb-0000-0000-0000-000000000001'

INSERT INTO auth.users (id, email) VALUES (:'A', 'athlete.test@example.local');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
SELECT has_table('public', 'sport_tests', 'table: sport_tests exists');
SELECT has_table('public', 'sport_test_reference_values',
  'table: sport_test_reference_values exists');
SELECT is((SELECT count(*) FROM public.sport_tests), 0::bigint,
  'table: sport_tests is empty after the migration');
SELECT is((SELECT count(*) FROM public.sport_test_reference_values), 0::bigint,
  'table: sport_test_reference_values is empty after the migration');
SELECT is((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.sport_tests'::regclass),
  true, 'table: RLS is enabled on sport_tests');
SELECT is((SELECT relrowsecurity FROM pg_class
           WHERE oid = 'public.sport_test_reference_values'::regclass),
  true, 'table: RLS is enabled on sport_test_reference_values');

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
INSERT INTO public.sport_tests (id, sport, region, code, unit) VALUES
  (:'T1', 'HANDBALL_SPORT', 'DE', 'SPRINT_5M', 's'),
  (:'T2', 'FAKE_SPORT_A', 'DE', 'FAKE_TEST_ONE', 'm'),
  (:'T3', 'FAKE_SPORT_B', 'DE', 'FAKE_CASCADE', 'kg');

INSERT INTO public.sport_test_reference_values
  (test_id, gender, position, training_stage, range_start, range_end) VALUES
  (:'T1', 'FEMALE', 'WING', 'GRUNDLAGENTRAINING', 9.87, 6.54),
  (:'T3', 'FEMALE', 'FAKE_POSITION_ONE', 'FAKE_STAGE', 10, 20),
  (:'T3', 'MALE', 'FAKE_POSITION_ONE', 'FAKE_STAGE', 12, 22);

-- ---------------------------------------------------------------------------
-- Defaults
-- ---------------------------------------------------------------------------
INSERT INTO public.sport_tests (sport, region, code, unit)
  VALUES ('FAKE_DEFAULTS', 'DE', 'FAKE_DEFAULT_TEST', 'm');
INSERT INTO public.sport_test_reference_values
  (test_id, gender, position, training_stage, range_start, range_end)
  VALUES (:'T2', 'MALE', 'FAKE_DEFAULT_POSITION', 'FAKE_STAGE', 1, 2);

SELECT ok((SELECT id IS NOT NULL FROM public.sport_tests WHERE sport = 'FAKE_DEFAULTS'),
  'defaults: a test inserted without an id gets one');
SELECT ok((SELECT created_at IS NOT NULL FROM public.sport_tests WHERE sport = 'FAKE_DEFAULTS'),
  'defaults: a test gets created_at');
SELECT ok((SELECT updated_at IS NOT NULL FROM public.sport_tests WHERE sport = 'FAKE_DEFAULTS'),
  'defaults: a test gets updated_at');
SELECT ok((SELECT id IS NOT NULL FROM public.sport_test_reference_values
           WHERE position = 'FAKE_DEFAULT_POSITION'),
  'defaults: a reference value inserted without an id gets one');
SELECT ok((SELECT created_at IS NOT NULL FROM public.sport_test_reference_values
           WHERE position = 'FAKE_DEFAULT_POSITION'),
  'defaults: a reference value gets created_at');
SELECT ok((SELECT updated_at IS NOT NULL FROM public.sport_test_reference_values
           WHERE position = 'FAKE_DEFAULT_POSITION'),
  'defaults: a reference value gets updated_at');

-- ---------------------------------------------------------------------------
-- Uniqueness
-- ---------------------------------------------------------------------------
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('HANDBALL_SPORT', 'DE', 'SPRINT_5M', 's') $$,
  '23505', NULL, 'unique: the same sport, region and code twice is rejected');
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('HANDBALL_SPORT', 'FR', 'SPRINT_5M', 's') $$,
  'unique: the same sport and code in another region is accepted');
SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'FEMALE', 'WING',
            'GRUNDLAGENTRAINING', 2, 3) $$,
  '23505', NULL,
  'unique: the same test, gender, position and training stage twice is rejected');
SELECT lives_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'FEMALE', 'WING',
            'GRUNDLAGENTRAINING', 2, 3) $$,
  'unique: the same gender, position and training stage for another test is accepted');

-- ---------------------------------------------------------------------------
-- Checks on sport_tests
-- ---------------------------------------------------------------------------
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_REGION_COUNTRY', 'm') $$,
  'region: a country code such as DE is accepted');
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'GB-ENG', 'FAKE_REGION_SUBDIVISION', 'm') $$,
  'region: a subdivision code such as GB-ENG is accepted');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'de', 'FAKE_REGION_LOWER', 'm') $$,
  '23514', NULL, 'region: lower case is rejected');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'Germany', 'FAKE_REGION_NAME', 'm') $$,
  '23514', NULL, 'region: a country name is rejected');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DEU', 'FAKE_REGION_THREE_LETTERS', 'm') $$,
  '23514', NULL, 'region: a three-letter country code is rejected');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'GB-ENGL', 'FAKE_REGION_LONG_SUBDIVISION', 'm') $$,
  '23514', NULL, 'region: a subdivision part longer than three characters is rejected');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DE', repeat('C', 101), 'm') $$,
  '23514', NULL, 'code: more than 100 characters are rejected');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_UNIT_TOO_LONG', repeat('u', 21)) $$,
  '23514', NULL, 'unit: more than 20 characters are rejected');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', '', 'FAKE_REGION_EMPTY', 'm') $$,
  '23514', NULL, 'region: an empty string is rejected');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('', 'DE', 'FAKE_EMPTY_SPORT', 'm') $$,
  '23514', NULL, 'sport: an empty string is rejected');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DE', '', 'm') $$,
  '23514', NULL, 'code: an empty string is rejected');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_EMPTY_UNIT', '') $$,
  '23514', NULL, 'unit: an empty string is rejected');

-- ---------------------------------------------------------------------------
-- Checks on sport_test_reference_values
-- ---------------------------------------------------------------------------
SELECT lives_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'MALE', 'FAKE_POSITION_TWO',
            'FAKE_STAGE', 1, 2) $$,
  'gender: MALE is accepted');
SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'OTHER', 'FAKE_POSITION_THREE',
            'FAKE_STAGE', 1, 2) $$,
  '23514', NULL, 'gender: a value other than MALE or FEMALE is rejected');
SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'MALE', '', 'FAKE_STAGE', 1, 2) $$,
  '23514', NULL, 'position: an empty string is rejected');
SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'MALE', 'FAKE_POSITION_FOUR', '', 1, 2) $$,
  '23514', NULL, 'training_stage: an empty string is rejected');

-- ---------------------------------------------------------------------------
-- Range
-- ---------------------------------------------------------------------------
SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'MALE', 'FAKE_POSITION_FIVE',
            'FAKE_STAGE', NULL, 2) $$,
  '23502', NULL, 'range: range_start cannot be NULL');
SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'MALE', 'FAKE_POSITION_SIX',
            'FAKE_STAGE', 1, NULL) $$,
  '23502', NULL, 'range: range_end cannot be NULL');
SELECT is((SELECT range_start::text || '/' || range_end::text
           FROM public.sport_test_reference_values
           WHERE test_id = :'T1' AND position = 'WING'),
  '9.87/6.54', 'range: values are stored in source order, start may exceed end');

-- ---------------------------------------------------------------------------
-- Relation between the tables
-- ---------------------------------------------------------------------------
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_WITHOUT_REFERENCE_VALUES', 'm') $$,
  'relation: a test without reference values is valid');

DELETE FROM public.sport_tests WHERE id = :'T3';
SELECT is((SELECT count(*) FROM public.sport_test_reference_values WHERE test_id = :'T3'),
  0::bigint, 'relation: deleting a test deletes its reference values');

SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-0000000000ff', 'MALE', 'FAKE_POSITION_SEVEN',
            'FAKE_STAGE', 1, 2) $$,
  '23503', NULL, 'relation: a reference value for an unknown test is rejected');

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
-- now() is constant inside a transaction. The rows start with an old timestamp
-- so an UPDATE must move it forward.
INSERT INTO public.sport_tests (sport, region, code, unit, updated_at)
  VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_STAMP_TEST', 'm', '2000-01-01 00:00:00+00');
INSERT INTO public.sport_test_reference_values
  (test_id, gender, position, training_stage, range_start, range_end, updated_at)
  VALUES (:'T2', 'MALE', 'FAKE_STAMP_POSITION', 'FAKE_STAGE', 1, 2, '2000-01-01 00:00:00+00');

UPDATE public.sport_tests SET unit = 'cm' WHERE code = 'FAKE_STAMP_TEST';
UPDATE public.sport_test_reference_values SET range_end = 3
  WHERE position = 'FAKE_STAMP_POSITION';

SELECT ok((SELECT updated_at > '2000-01-01 00:00:00+00'::timestamptz
           FROM public.sport_tests WHERE code = 'FAKE_STAMP_TEST'),
  'updated_at: an UPDATE of a test moves updated_at forward');
SELECT ok((SELECT updated_at > '2000-01-01 00:00:00+00'::timestamptz
           FROM public.sport_test_reference_values WHERE position = 'FAKE_STAMP_POSITION'),
  'updated_at: an UPDATE of a reference value moves updated_at forward');

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------
SELECT count(*) AS n_tests FROM public.sport_tests \gset
SELECT count(*) AS n_values FROM public.sport_test_reference_values \gset

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'A';

SELECT is((SELECT count(*) FROM public.sport_tests), :n_tests::bigint,
  'read: an authenticated user reads every row of sport_tests');
SELECT is((SELECT array_agg(DISTINCT sport ORDER BY sport) FROM public.sport_tests
           WHERE sport IN ('HANDBALL_SPORT', 'FAKE_SPORT_A')),
  ARRAY['FAKE_SPORT_A', 'HANDBALL_SPORT'],
  'read: an authenticated user reads tests of every sport');
SELECT is((SELECT count(*) FROM public.sport_test_reference_values), :n_values::bigint,
  'read: an authenticated user reads every row of sport_test_reference_values');

SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_AUTH_INSERT', 'm') $$,
  '42501', NULL, 'write: an authenticated user cannot INSERT into sport_tests');
SELECT throws_ok($$ UPDATE public.sport_tests SET unit = 'x' $$,
  '42501', NULL, 'write: an authenticated user cannot UPDATE sport_tests');
SELECT throws_ok($$ DELETE FROM public.sport_tests $$,
  '42501', NULL, 'write: an authenticated user cannot DELETE from sport_tests');
SELECT throws_ok($$ INSERT INTO public.sport_test_reference_values
      (test_id, gender, position, training_stage, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'MALE', 'FAKE_AUTH_INSERT',
            'FAKE_STAGE', 1, 2) $$,
  '42501', NULL, 'write: an authenticated user cannot INSERT into sport_test_reference_values');
SELECT throws_ok($$ UPDATE public.sport_test_reference_values SET range_end = 0 $$,
  '42501', NULL, 'write: an authenticated user cannot UPDATE sport_test_reference_values');
SELECT throws_ok($$ DELETE FROM public.sport_test_reference_values $$,
  '42501', NULL, 'write: an authenticated user cannot DELETE from sport_test_reference_values');

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
      (test_id, gender, position, training_stage, range_start, range_end)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'MALE', 'FAKE_SERVICE_INSERT',
            'FAKE_STAGE', 1, 2) $$,
  'write: service_role can INSERT into sport_test_reference_values');

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
