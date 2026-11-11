-- One user_exercises row per entry of the workout list.
--
-- The app upserts on (user_id, workout_id, exercise_id, position), where
-- position is the entry's index in the workout. Two entries of one exercise
-- in one workout persist and update independently. Rows uploaded before the
-- position existed get 0.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(7);

\set U '11111111-1111-1111-1111-111111111111'
\set O '22222222-2222-2222-2222-222222222222'

INSERT INTO auth.users (id, email) VALUES
  (:'U', 'athlete.test@example.local'),
  (:'O', 'other.test@example.local');

-- Upload the way the app does: as the athlete, upserting on the position key.
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'U';

INSERT INTO public.user_exercises (user_id, workout_id, exercise_id, position, skill, repetition)
  VALUES (:'U', 'workout-1', 'exercise-1', 0, 'skill-a', 5)
  ON CONFLICT (user_id, workout_id, exercise_id, position)
  DO UPDATE SET repetition = EXCLUDED.repetition;

SELECT lives_ok(
  $$INSERT INTO public.user_exercises (user_id, workout_id, exercise_id, position, skill, repetition)
      VALUES ('11111111-1111-1111-1111-111111111111', 'workout-1', 'exercise-1', 1, 'skill-b', 8)
      ON CONFLICT (user_id, workout_id, exercise_id, position)
      DO UPDATE SET repetition = EXCLUDED.repetition$$,
  'a second entry of the same exercise and workout uploads'
);

SELECT is(
  (SELECT count(*) FROM public.user_exercises
    WHERE user_id = :'U' AND workout_id = 'workout-1' AND exercise_id = 'exercise-1'),
  2::bigint,
  'both entry rows persist'
);

-- Re-uploading one entry leaves the other untouched.
INSERT INTO public.user_exercises (user_id, workout_id, exercise_id, position, skill, repetition)
  VALUES (:'U', 'workout-1', 'exercise-1', 0, 'skill-a', 6)
  ON CONFLICT (user_id, workout_id, exercise_id, position)
  DO UPDATE SET repetition = EXCLUDED.repetition;

SELECT results_eq(
  $$SELECT position, repetition FROM public.user_exercises
      WHERE workout_id = 'workout-1' AND exercise_id = 'exercise-1'
      ORDER BY position$$,
  $$VALUES (0, 6), (1, 8)$$,
  'each entry row updates independently'
);

-- Rows uploaded without a position get 0.
INSERT INTO public.user_exercises (user_id, workout_id, exercise_id, skill, repetition)
  VALUES (:'U', 'workout-1', 'exercise-2', NULL, 1);

SELECT is(
  (SELECT position FROM public.user_exercises WHERE exercise_id = 'exercise-2'),
  0,
  'a row without a position gets 0'
);

-- The position key does not open writes to another user's rows.
SELECT throws_ok(
  $$INSERT INTO public.user_exercises (user_id, workout_id, exercise_id, position, skill)
      VALUES ('22222222-2222-2222-2222-222222222222', 'workout-1', 'exercise-1', 0, 'skill-a')$$,
  '42501',
  NULL,
  'an athlete cannot upload exercises for another user'
);

RESET ROLE;

SELECT is(
  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.user_exercises'::regclass
      AND conname IN (
        'user_exercises_user_exercise_workout_key',
        'user_exercises_user_exercise_workout_skill_key'
      )),
  0::bigint,
  'the keys without the position are gone'
);

SELECT is(
  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.user_exercises'::regclass AND contype = 'u'),
  1::bigint,
  'the position key is the only unique key'
);

SELECT * FROM finish();
ROLLBACK;
