-- Sport tests and their reference values (issue #631).
--
-- sport_tests stores one fitness test per sport and region. The sport is an app
-- code such as HANDBALL_SPORT and the region is an ISO 3166 country or
-- subdivision code such as DE or GB-ENG. sport_test_reference_values stores the
-- reference ranges of a test per gender, position and training stage. A test
-- may have no reference values.
--
-- An administrator imports the data in Supabase. The migration seeds no rows.
--
-- The database does not store an athlete's sport, so every signed-in user may
-- read every row of both tables. The device filters by sport and region.
-- Signed-in users cannot write. Anonymous requests have no access.
--
-- A range keeps its source order: range_start may be greater than range_end.

BEGIN;

-- ============================================================================
-- 1. sport_tests
-- ============================================================================
CREATE TABLE public.sport_tests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport      TEXT NOT NULL,
  region     TEXT NOT NULL,
  code       TEXT NOT NULL,
  unit       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sport_tests_sport_check
    CHECK (char_length(sport) BETWEEN 1 AND 100),
  CONSTRAINT sport_tests_region_check
    CHECK (region ~ '^[A-Z]{2}(-[A-Z0-9]{1,3})?$'),
  CONSTRAINT sport_tests_code_check
    CHECK (char_length(code) BETWEEN 1 AND 100),
  CONSTRAINT sport_tests_unit_check
    CHECK (char_length(unit) BETWEEN 1 AND 20),
  -- The unique index also serves the device's filter by sport and region.
  CONSTRAINT sport_tests_sport_region_code_key
    UNIQUE (sport, region, code)
);

CREATE TRIGGER update_sport_tests_updated_at
  BEFORE UPDATE ON public.sport_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sport_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sport tests"
  ON public.sport_tests FOR SELECT
  TO authenticated
  USING (true);

-- Hosted Supabase hands every API role full DML on new tables through default
-- privileges. Reset that and grant only what the access model needs.
REVOKE ALL ON public.sport_tests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.sport_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sport_tests TO service_role;

-- ============================================================================
-- 2. sport_test_reference_values
-- ============================================================================
CREATE TABLE public.sport_test_reference_values (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id        UUID NOT NULL REFERENCES public.sport_tests(id) ON DELETE CASCADE,
  gender         TEXT NOT NULL,
  position       TEXT NOT NULL,
  training_stage TEXT NOT NULL,
  range_start    NUMERIC NOT NULL,
  range_end      NUMERIC NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sport_test_reference_values_gender_check
    CHECK (gender IN ('MALE', 'FEMALE')),
  CONSTRAINT sport_test_reference_values_position_check
    CHECK (char_length(position) BETWEEN 1 AND 100),
  CONSTRAINT sport_test_reference_values_training_stage_check
    CHECK (char_length(training_stage) BETWEEN 1 AND 100),
  CONSTRAINT sport_test_reference_values_test_gender_position_stage_key
    UNIQUE (test_id, gender, position, training_stage)
);

CREATE TRIGGER update_sport_test_reference_values_updated_at
  BEFORE UPDATE ON public.sport_test_reference_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sport_test_reference_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sport test reference values"
  ON public.sport_test_reference_values FOR SELECT
  TO authenticated
  USING (true);

REVOKE ALL ON public.sport_test_reference_values FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.sport_test_reference_values TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sport_test_reference_values TO service_role;

COMMIT;
