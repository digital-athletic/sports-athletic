-- Migration: Add a user_exercises key per skill
-- Description: The same exercise can appear under two skills in one workout.
--   The new unique key includes the skill, so app builds that upsert on it
--   keep one row per skill. Older rows without a skill still match each other.
--   The old key stays until no app build upserts on it; while both exist, a
--   second skill writing the same exercise in one workout fails instead of
--   overwriting the first row.

ALTER TABLE user_exercises
  ADD CONSTRAINT user_exercises_user_exercise_workout_skill_key
  UNIQUE NULLS NOT DISTINCT (user_id, exercise_id, workout_id, skill);
