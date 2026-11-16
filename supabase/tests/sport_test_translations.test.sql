-- Translations of sport tests (issue #696).
--
-- sport_tests.translations holds the name and optionally the unit of a test per
-- language, e.g. {"en": {"name": "5 m sprint"}, "de": {"name": "5-m-Sprint", "unit": "rel. 1RM"}}.
-- NULL means no translations. Once set, English is required, keys are lower case
-- ISO 639-1 codes, and every entry has a non-blank name (max 200 characters) and
-- an optional non-blank unit (max 20 characters) and no other keys.
--
-- 23514 = check violation, 42501 = insufficient privilege.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(24);

-- A is an authenticated user.
\set A 'bbbbbbbb-0000-0000-0000-000000000001'

INSERT INTO auth.users (id, email) VALUES (:'A', 'athlete.test@example.local');

-- ---------------------------------------------------------------------------
-- State after the migration
-- ---------------------------------------------------------------------------
SELECT has_column('public', 'sport_tests', 'translations',
  'migration: sport_tests has a translations column');
SELECT col_is_null('public', 'sport_tests', 'translations',
  'migration: translations accepts NULL');
SELECT col_type_is('public', 'sport_tests', 'translations', 'jsonb',
  'migration: translations is jsonb');
SELECT has_function('public', 'is_valid_sport_test_translations', ARRAY['jsonb'],
  'migration: the validation function exists');

-- ---------------------------------------------------------------------------
-- Accepted values
-- ---------------------------------------------------------------------------
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_NULL', 's') $$,
  'accepts: a test without translations (NULL)');
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_EN_ONLY', 's',
            '{"en": {"name": "Fake test"}}') $$,
  'accepts: English only');
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_EN_DE', 's',
            '{"en": {"name": "Fake test"}, "de": {"name": "Fake-Test", "unit": "rel. 1RM"}}') $$,
  'accepts: English and German with a unit');
SELECT lives_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_UNIT_20', 's',
            '{"en": {"name": "Fake test", "unit": "12345678901234567890"}}') $$,
  'accepts: a unit of exactly 20 characters');

-- ---------------------------------------------------------------------------
-- Rejected values
-- ---------------------------------------------------------------------------
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_NO_EN', 's',
            '{"de": {"name": "Fake-Test"}}') $$,
  '23514', NULL, 'rejects: translations without English');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_EMPTY_OBJECT', 's', '{}') $$,
  '23514', NULL, 'rejects: an empty object, which has no English');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_BLANK_EN', 's',
            '{"en": {"name": "   "}}') $$,
  '23514', NULL, 'rejects: a blank English name');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_BLANK_DE', 's',
            '{"en": {"name": "Fake test"}, "de": {"name": ""}}') $$,
  '23514', NULL, 'rejects: a blank name in another language');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_NAME_NUMBER', 's',
            '{"en": {"name": 42}}') $$,
  '23514', NULL, 'rejects: a name that is not a string');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_NAME_201', 's',
            jsonb_build_object('en', jsonb_build_object('name', repeat('x', 201)))) $$,
  '23514', NULL, 'rejects: a name longer than 200 characters');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_ARRAY', 's', '[]') $$,
  '23514', NULL, 'rejects: an array');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_STRING', 's', '"Fake test"') $$,
  '23514', NULL, 'rejects: a string');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_ENTRY_STRING', 's',
            '{"en": "Fake test"}') $$,
  '23514', NULL, 'rejects: a language entry that is not an object');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_UPPER_KEY', 's',
            '{"en": {"name": "Fake test"}, "DE": {"name": "Fake-Test"}}') $$,
  '23514', NULL, 'rejects: an upper case language key');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_LONG_KEY', 's',
            '{"en": {"name": "Fake test"}, "deu": {"name": "Fake-Test"}}') $$,
  '23514', NULL, 'rejects: a language key of three letters');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_UNIT_21', 's',
            '{"en": {"name": "Fake test", "unit": "123456789012345678901"}}') $$,
  '23514', NULL, 'rejects: a unit longer than 20 characters');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_BLANK_UNIT', 's',
            '{"en": {"name": "Fake test", "unit": " "}}') $$,
  '23514', NULL, 'rejects: a blank unit');
SELECT throws_ok($$ INSERT INTO public.sport_tests (sport, region, code, unit, translations)
    VALUES ('FAKE_SPORT_A', 'DE', 'FAKE_EXTRA_KEY', 's',
            '{"en": {"name": "Fake test", "description": "Fake"}}') $$,
  '23514', NULL, 'rejects: a key other than name and unit');

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'A';

SELECT is(
  (SELECT translations->'de'->>'unit' FROM public.sport_tests WHERE code = 'FAKE_EN_DE'),
  'rel. 1RM',
  'read: an authenticated user reads the translations column');

SELECT throws_ok($$ SELECT public.is_valid_sport_test_translations('{}'::jsonb) $$,
  '42501', NULL, 'privilege: an authenticated user cannot execute the validation function');

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
