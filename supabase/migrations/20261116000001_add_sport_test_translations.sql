-- Translations of sport tests (issue #696).
--
-- sport_tests.translations holds the name and optionally the unit of a test per
-- language, e.g. {"en": {"name": "5 m sprint"}, "de": {"name": "5-m-Sprint", "unit": "rel. 1RM"}}.
-- NULL means no translations. The app shows the name in the language of the
-- athlete, falls back to the English name, and then to the test code. It shows
-- the translated unit when one exists and the stored unit otherwise.
--
-- Once the column is set, English is required, every key is a lower case
-- ISO 639-1 code, and every entry is an object with a non-blank name (max 200
-- characters) and an optional non-blank unit (max 20 characters) and no other
-- keys.
--
-- The stored unit, the reference values, the grants and the RLS policies stay as
-- they are. The existing SELECT grant of signed-in users covers the new column.

BEGIN;

-- ============================================================================
-- 1. Column
-- ============================================================================
ALTER TABLE public.sport_tests ADD COLUMN translations JSONB;

-- ============================================================================
-- 2. Validation
-- ============================================================================
-- True when the value is an object with an English entry and every entry is
-- valid. Only the CHECK constraint below calls it.
--
-- Every check works on any JSON value without raising: SQL does not promise to
-- evaluate AND operands in order, so a type check cannot guard a later cast.
-- CASE guards the jsonb_each and jsonb_object_keys calls, which raise on values
-- that are not objects.
CREATE FUNCTION public.is_valid_sport_test_translations(p_translations jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT coalesce(
    jsonb_typeof(p_translations) = 'object'
    AND jsonb_typeof(p_translations->'en') = 'object'
    AND CASE WHEN jsonb_typeof(p_translations) = 'object'
             THEN NOT EXISTS (
               SELECT 1
               FROM jsonb_each(p_translations) AS language(code, entry)
               WHERE language.code !~ '^[a-z]{2}$'
                  OR jsonb_typeof(language.entry) IS DISTINCT FROM 'object'
                  OR jsonb_typeof(language.entry->'name') IS DISTINCT FROM 'string'
                  OR btrim(language.entry->>'name') = ''
                  OR char_length(language.entry->>'name') > 200
                  OR (language.entry ? 'unit' AND (
                        jsonb_typeof(language.entry->'unit') IS DISTINCT FROM 'string'
                        OR btrim(language.entry->>'unit') = ''
                        OR char_length(language.entry->>'unit') > 20))
                  OR CASE WHEN jsonb_typeof(language.entry) = 'object'
                          THEN EXISTS (
                            SELECT 1 FROM jsonb_object_keys(language.entry) AS entry_key
                            WHERE entry_key NOT IN ('name', 'unit'))
                          ELSE true
                     END
             )
             ELSE false
        END,
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_valid_sport_test_translations(jsonb)
  FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 3. Constraint
-- ============================================================================
ALTER TABLE public.sport_tests
  ADD CONSTRAINT sport_tests_translations_check
  CHECK (translations IS NULL OR public.is_valid_sport_test_translations(translations));

COMMIT;
