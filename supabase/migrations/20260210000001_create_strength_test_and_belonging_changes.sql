-- Migration: Sync schema updates
-- Description: Create strength_tests table, adjust user_exercises and
--   user_completed_workouts columns/constraints for mobile sync.

BEGIN;

-- ============================================
-- 1. STRENGTH_TESTS – new table
-- ============================================

CREATE TABLE strength_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_at BIGINT NOT NULL,
  vertical_push JSONB,
  vertical_pull JSONB,
  horizontal_push JSONB,
  horizontal_pull JSONB,
  hip_hinge JSONB,
  knee_dominant JSONB,
  lower_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, test_at)
);

CREATE INDEX idx_strength_tests_user_id ON strength_tests(user_id);
CREATE INDEX idx_strength_tests_user_date ON strength_tests(user_id, test_at DESC);

CREATE TRIGGER update_strength_tests_updated_at
  BEFORE UPDATE ON strength_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE strength_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own strength tests"
  ON strength_tests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own strength tests or as trainer"
  ON strength_tests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_trainer_of_user(auth.uid(), user_id)
  );

CREATE POLICY "Users can update only their own strength tests"
  ON strength_tests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete only their own strength tests"
  ON strength_tests FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 2. USER_EXERCISES – widen ID columns, add workout_id
-- ============================================

ALTER TABLE user_exercises
  ALTER COLUMN exercise_id TYPE TEXT USING exercise_id::TEXT;

ALTER TABLE user_exercises
  ALTER COLUMN branch_id TYPE TEXT USING branch_id::TEXT;

ALTER TABLE user_exercises
  ADD COLUMN workout_id TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE user_exercises
  ADD CONSTRAINT chk_workout_id_length CHECK (char_length(workout_id) <= 100);

-- Replace the old 2-column unique with a 3-column unique.
DO $$
DECLARE
  _con_name TEXT;
BEGIN
  SELECT conname INTO _con_name
  FROM pg_constraint
  WHERE conrelid = 'user_exercises'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 2;
  IF _con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE user_exercises DROP CONSTRAINT %I', _con_name);
  END IF;
END $$;

ALTER TABLE user_exercises
  ADD CONSTRAINT user_exercises_user_exercise_workout_key
  UNIQUE (user_id, exercise_id, workout_id);

-- ============================================
-- 3. USER_COMPLETED_WORKOUTS – rename column, add fields & constraint
-- ============================================

ALTER TABLE user_completed_workouts
  RENAME COLUMN points TO xp_earned;

ALTER TABLE user_completed_workouts
  ADD COLUMN user_skills JSONB;

ALTER TABLE user_completed_workouts
  ADD CONSTRAINT uq_user_completed_workouts_user_workout
  UNIQUE (user_id, workout_id);

COMMIT;
