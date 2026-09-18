-- Who may read an athlete's training data.
--
-- Covers every role against can_view_athlete_data(): owner, co-owner, plain
-- member, outsider and anon. The cross-group case is the one that matters most:
-- being a co-owner of one group must grant nothing in another.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(12);

-- Group A: T owns it, C is co-owner, M is a plain member.
-- Group B: T2 owns it, X is a plain member. O belongs to neither.
\set T     '11111111-1111-1111-1111-111111111111'
\set C     '22222222-2222-2222-2222-222222222222'
\set M     '33333333-3333-3333-3333-333333333333'
\set O     '44444444-4444-4444-4444-444444444444'
\set T2    '66666666-6666-6666-6666-666666666666'
\set X     '77777777-7777-7777-7777-777777777777'
\set TEAM  '55555555-5555-5555-5555-555555555551'
\set TEAM2 '55555555-5555-5555-5555-555555555552'

INSERT INTO auth.users (id, email) VALUES
  (:'T',  'trainer.test@example.local'),
  (:'C',  'coowner.test@example.local'),
  (:'M',  'member.test@example.local'),
  (:'O',  'outsider.test@example.local'),
  (:'T2', 'trainer2.test@example.local'),
  (:'X',  'other.test@example.local');

INSERT INTO public.user_profiles (user_id, trainer_granted_at) VALUES
  (:'T', now()), (:'T2', now());

INSERT INTO public.teams (id, name, owner_id) VALUES
  (:'TEAM', 'Group A', :'T'), (:'TEAM2', 'Group B', :'T2');

INSERT INTO public.team_members (team_id, user_id, role) VALUES
  (:'TEAM',  :'T',  'owner'),
  (:'TEAM',  :'C',  'co_owner'),
  (:'TEAM',  :'M',  'member'),
  (:'TEAM2', :'T2', 'owner'),
  (:'TEAM2', :'X',  'member');

INSERT INTO public.user_completed_workouts (user_id, workout_id, workout_date, duration)
  VALUES (:'M', 'workout-1', 1, 60), (:'X', 'workout-2', 2, 30);
INSERT INTO public.user_exercises (user_id, exercise_id) VALUES (:'M', 'exercise-1');
INSERT INTO public.strength_tests (user_id, test_at) VALUES (:'M', 1);

SET LOCAL ROLE authenticated;

-- As the group's owner.
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT is((SELECT count(*) FROM public.user_completed_workouts WHERE user_id = :'M'), 1::bigint,
  'owner with a trainer grant sees a member''s completed workouts');

-- As a co-owner.
SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT is((SELECT count(*) FROM public.user_completed_workouts WHERE user_id = :'M'), 1::bigint,
  'co-owner sees a member''s completed workouts without a trainer grant of their own');

SELECT is((SELECT count(*) FROM public.user_exercises WHERE user_id = :'M'), 1::bigint,
  'co-owner sees a member''s exercises');
SELECT is((SELECT count(*) FROM public.strength_tests WHERE user_id = :'M'), 1::bigint,
  'co-owner sees a member''s strength tests');

-- Being staff in one group grants nothing in another.
SELECT is((SELECT count(*) FROM public.user_completed_workouts WHERE user_id = :'X'), 0::bigint,
  'co-owner of group A cannot see a member of group B');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT is((SELECT count(*) FROM public.user_completed_workouts WHERE user_id = :'X'), 0::bigint,
  'plain member cannot see another user''s completed workouts');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT is((SELECT count(*) FROM public.user_completed_workouts WHERE user_id = :'M'), 0::bigint,
  'outsider sees nothing');

-- Visibility hangs on the group owner's grant, so revoking it blinds the
-- co-owner too.
RESET ROLE;
UPDATE public.user_profiles SET trainer_granted_at = NULL WHERE user_id = :'T';
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT is((SELECT count(*) FROM public.user_completed_workouts WHERE user_id = :'M'), 0::bigint,
  'co-owner sees nothing once the group owner loses their trainer grant');

-- Nothing is readable without a session at all. anon holds no SELECT grant on
-- these tables, so this fails on the grant before RLS is even consulted.
RESET ROLE;
SET LOCAL ROLE anon;
SELECT throws_ok($$ SELECT count(*) FROM public.user_completed_workouts $$,
  '42501', NULL, 'anon cannot read completed workouts');
SELECT throws_ok($$ SELECT count(*) FROM public.user_exercises $$,
  '42501', NULL, 'anon cannot read exercises');
SELECT throws_ok($$ SELECT count(*) FROM public.strength_tests $$,
  '42501', NULL, 'anon cannot read strength tests');

-- The policies above were the only callers of the old trainer-only predicate.
RESET ROLE;
SELECT hasnt_function('public', 'is_trainer_of_user', ARRAY['uuid'],
  'is_trainer_of_user() is dropped');

SELECT * FROM finish();
ROLLBACK;
