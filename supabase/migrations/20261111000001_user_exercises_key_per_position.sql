-- Migration: Key user_exercises by the entry's position in the workout
-- Description: The same exercise can appear twice in one workout. The app
--   uploads each entry with its index in the workout list and upserts on
--   (user_id, workout_id, exercise_id, position), so a retry updates the row
--   instead of duplicating it. The position tells entries apart, which makes
--   the key without the skill and the per-skill key from 20261029000001
--   redundant; both are dropped. Rows uploaded before the position existed
--   get 0. They were unique on (user_id, exercise_id, workout_id), so 0 cannot
--   collide. The exercise upload is off in every released build, so no client
--   depends on the old keys.

ALTER TABLE user_exercises
  ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_exercises
  ADD CONSTRAINT chk_user_exercises_position_non_negative CHECK (position >= 0);

ALTER TABLE user_exercises
  DROP CONSTRAINT IF EXISTS user_exercises_user_exercise_workout_key;

ALTER TABLE user_exercises
  DROP CONSTRAINT IF EXISTS user_exercises_user_exercise_workout_skill_key;

ALTER TABLE user_exercises
  ADD CONSTRAINT user_exercises_user_workout_exercise_position_key
  UNIQUE (user_id, workout_id, exercise_id, position);
