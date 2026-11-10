-- One user_exercises row per skill.
--
-- The same exercise can appear under two skills in one workout. The app upserts
-- on (user_id, exercise_id, workout_id, skill), so both skills must persist and
-- update independently. Rows without a skill still collapse into one row.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(6);

\set U '11111111-1111-1111-1111-111111111111'
\set O '22222222-2222-2222-2222-222222222222'

INSERT INTO auth.users (id, email) VALUES
  (:'U', 'athlete.test@example.local'),
  (:'O', 'other.test@example.local');

-- Upload the way the app does: as the athlete, upserting on the per-skill key.
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'U';

INSERT INTO public.user_exercises (user_id, exercise_id, workout_id, skill, repetition)
  VALUES (:'U', 'exercise-1', 'workout-1', 'skill-a', 5)
  ON CONFLICT (user_id, exercise_id, workout_id, skill)
  DO UPDATE SET repetition = EXCLUDED.repetition;

SELECT lives_ok(
  $$INSERT INTO public.user_exercises (user_id, exercise_id, workout_id, skill, repetition)
      VALUES ('11111111-1111-1111-1111-111111111111', 'exercise-1', 'workout-1', 'skill-b', 8)
      ON CONFLICT (user_id, exercise_id, workout_id, skill)
      DO UPDATE SET repetition = EXCLUDED.repetition$$,
  'a second skill for the same exercise and workout uploads'
);

SELECT is(
  (SELECT count(*) FROM public.user_exercises
    WHERE user_id = :'U' AND exercise_id = 'exercise-1' AND workout_id = 'workout-1'),
  2::bigint,
  'both skill rows persist'
);

-- Updating one skill leaves the other untouched.
INSERT INTO public.user_exercises (user_id, exercise_id, workout_id, skill, repetition)
  VALUES (:'U', 'exercise-1', 'workout-1', 'skill-a', 6)
  ON CONFLICT (user_id, exercise_id, workout_id, skill)
  DO UPDATE SET repetition = EXCLUDED.repetition;

SELECT results_eq(
  $$SELECT skill, repetition FROM public.user_exercises
      WHERE exercise_id = 'exercise-1' AND workout_id = 'workout-1'
      ORDER BY skill$$,
  $$VALUES ('skill-a'::text, 6), ('skill-b'::text, 8)$$,
  'each skill row updates independently'
);

-- Rows without a skill still match each other.
INSERT INTO public.user_exercises (user_id, exercise_id, workout_id, skill, repetition)
  VALUES (:'U', 'exercise-2', 'workout-1', NULL, 1)
  ON CONFLICT (user_id, exercise_id, workout_id, skill)
  DO UPDATE SET repetition = EXCLUDED.repetition;
INSERT INTO public.user_exercises (user_id, exercise_id, workout_id, skill, repetition)
  VALUES (:'U', 'exercise-2', 'workout-1', NULL, 2)
  ON CONFLICT (user_id, exercise_id, workout_id, skill)
  DO UPDATE SET repetition = EXCLUDED.repetition;

SELECT results_eq(
  $$SELECT repetition FROM public.user_exercises WHERE exercise_id = 'exercise-2'$$,
  $$VALUES (2)$$,
  'rows without a skill upsert into one row'
);

-- The per-skill key does not open writes to another user's rows.
SELECT throws_ok(
  $$INSERT INTO public.user_exercises (user_id, exercise_id, workout_id, skill)
      VALUES ('22222222-2222-2222-2222-222222222222', 'exercise-1', 'workout-1', 'skill-a')$$,
  '42501',
  NULL,
  'an athlete cannot upload exercises for another user'
);

RESET ROLE;

SELECT is(
  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.user_exercises'::regclass
      AND conname = 'user_exercises_user_exercise_workout_key'),
  0::bigint,
  'the old key without the skill is gone'
);

SELECT * FROM finish();
ROLLBACK;
