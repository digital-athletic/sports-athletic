-- Category of sport tests (issue #700).
--
-- sport_tests.category is optional free text, stored trimmed in upper case,
-- e.g. SPEED or EXPLOSIVE_POWER. The app knows four categories and shows any
-- other code as it is, so the database accepts NULL or any non-blank code of up
-- to 100 characters.
--
-- 23514 = check violation.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(12);

-- A is an authenticated user.
\set A 'bbbbbbbb-0000-0000-0000-000000000001'

INSERT INTO auth.users (id, email) VALUES (:'A', 'athlete.test@example.local');

-- ---------------------------------------------------------------------------
-- State after the migration
-- ---------------------------------------------------------------------------
SELECT has_column('public', 'sport_tests', 'category',
  'migration: sport_tests has a category column');
SELECT col_type_is('public', 'sport_tests', 'category', 'text',
  'migration: category is text');
SELECT col_is_null('public', 'sport_tests', 'category',
  'migration: category is optional');

-- ---------------------------------------------------------------------------
-- Rejected values
-- ---------------------------------------------------------------------------
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, category)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_BLANK_CATEGORY', 's', '  ') $$,
  '23514', NULL, 'rejects: a blank category');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, category)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_CATEGORY_101', 's', repeat('X', 101)) $$,
  '23514', NULL, 'rejects: a category longer than 100 characters');

-- ---------------------------------------------------------------------------
-- Accepted values
-- ---------------------------------------------------------------------------
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_NO_CATEGORY', 's') $$,
  'accepts: a test without a category');
SELECT is(
  (SELECT category FROM public.sport_tests WHERE code = 'FAKE_NO_CATEGORY'),
  NULL,
  'storage: a missing category is stored as NULL');
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, category)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_CATEGORY_100', 's', repeat('X', 100)) $$,
  'accepts: a category of exactly 100 characters');
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, category)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_PADDED', 's', ' speed ') $$,
  'accepts: a category typed in lower case with padding');
SELECT is(
  (SELECT category FROM public.sport_tests WHERE code = 'FAKE_PADDED'),
  'SPEED',
  'spelling: a category is stored trimmed and in upper case');
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, category)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_UNKNOWN', 's', 'FAKE_CATEGORY') $$,
  'accepts: a category the app does not know');

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'A';

SELECT is(
  (SELECT category FROM public.sport_tests WHERE code = 'FAKE_UNKNOWN'),
  'FAKE_CATEGORY',
  'read: an authenticated user reads the category column');

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
