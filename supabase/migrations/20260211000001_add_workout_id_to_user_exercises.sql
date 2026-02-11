-- Migration: Add workout_id to user_exercises for per-workout uniqueness
-- Description: Changes unique constraint from (user_id, exercise_id) to
--   (user_id, exercise_id, workout_id) so each workout produces distinct
--   exercise records instead of overwriting the previous one.

BEGIN;

-- ============================================
-- ADD COLUMN
-- ============================================

-- Default 'legacy' marks rows that existed before this migration.
-- New inserts from the mobile app will always provide a real workout_id.
ALTER TABLE user_exercises
  ADD COLUMN workout_id TEXT NOT NULL DEFAULT 'legacy';

-- Limit workout_id length to prevent index bloat.
ALTER TABLE user_exercises
  ADD CONSTRAINT chk_workout_id_length CHECK (char_length(workout_id) <= 100);

-- ============================================
-- REPLACE UNIQUE CONSTRAINT
-- ============================================

-- Drop the old constraint that allowed only one row per user + exercise.
-- Use a DO block to find the actual constraint name safely.
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

-- New constraint: one row per user + exercise + workout.
ALTER TABLE user_exercises
  ADD CONSTRAINT user_exercises_user_exercise_workout_key
  UNIQUE (user_id, exercise_id, workout_id);

COMMIT;
