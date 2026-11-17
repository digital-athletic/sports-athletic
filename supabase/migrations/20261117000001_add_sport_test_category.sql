-- Category of sport tests (issue #700).
--
-- sport_tests.category is the kind of a test, e.g. SPEED, EXPLOSIVE_POWER,
-- MAXIMUM_STRENGTH or ENDURANCE. The app shows an icon and a label per
-- category and lets the athlete filter the tests by it. A category the app does
-- not know shows its code and a stopwatch icon.
--
-- The column is optional, so the migration runs on a database that already
-- contains tests. Existing tests get NULL. The app lists a test without a
-- category only when the athlete picks all categories.
--
-- The normalize trigger trims the category and writes it in upper case. The
-- trigger runs before the CHECK constraint, so a blank category becomes empty
-- and fails the constraint (23514). A category has 1 to 100 characters.
--
-- The grants and the RLS policies are unchanged. The existing SELECT grant of
-- signed-in users applies to the new column.

BEGIN;

-- ============================================================================
-- 1. Column
-- ============================================================================
ALTER TABLE public.sport_tests ADD COLUMN category TEXT;

-- ============================================================================
-- 2. Normalization
-- ============================================================================
CREATE OR REPLACE FUNCTION public.normalize_sport_test()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.sport := upper(btrim(NEW.sport));
  NEW.region := upper(btrim(NEW.region));
  NEW.code := upper(btrim(NEW.code));
  NEW.unit := btrim(NEW.unit);
  NEW.category := upper(btrim(NEW.category));
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.normalize_sport_test()
  FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 3. Constraint
-- ============================================================================
ALTER TABLE public.sport_tests
  ADD CONSTRAINT sport_tests_category_check
  CHECK (char_length(category) BETWEEN 1 AND 100);

COMMIT;
