-- Migration: Drop the user_exercises key without the skill
-- Description: The same exercise can appear under two skills in one workout.
--   While the key on (user_id, exercise_id, workout_id) exists, the second
--   skill's upload fails. App builds upsert on the per-skill key from
--   20261029000001 instead, and no released build uploads individual
--   exercises yet, so no client depends on the old key.

ALTER TABLE user_exercises
  DROP CONSTRAINT IF EXISTS user_exercises_user_exercise_workout_key;
