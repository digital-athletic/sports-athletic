-- Team workouts: the owner writes through save_team_workout and
-- delete_team_workout. Owner, co-owners and members read; outsiders see nothing.
-- save_team_workout checks the outer frame of the AIWL template. Deleting a team
-- deletes its workouts.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(52);

-- Team A: T owns it, C is co-owner, M is a plain member. O belongs to no team.
-- Team B: T2 owns it.
\set T     '11111111-1111-1111-1111-111111111111'
\set C     '22222222-2222-2222-2222-222222222222'
\set M     '33333333-3333-3333-3333-333333333333'
\set O     '44444444-4444-4444-4444-444444444444'
\set T2    '66666666-6666-6666-6666-666666666666'
\set TEAM  '55555555-5555-5555-5555-555555555551'
\set TEAM2 '55555555-5555-5555-5555-555555555552'
\set W1    '88888888-8888-8888-8888-888888888881'
\set W2    '88888888-8888-8888-8888-888888888882'

INSERT INTO auth.users (id, email) VALUES
  (:'T',  'trainer.test@example.local'),
  (:'C',  'coowner.test@example.local'),
  (:'M',  'member.test@example.local'),
  (:'O',  'outsider.test@example.local'),
  (:'T2', 'trainer2.test@example.local');

INSERT INTO public.teams (id, name, owner_id) VALUES
  (:'TEAM', 'Team A', :'T'), (:'TEAM2', 'Team B', :'T2');

INSERT INTO public.team_members (team_id, user_id, role) VALUES
  (:'TEAM',  :'T',  'owner'),
  (:'TEAM',  :'C',  'co_owner'),
  (:'TEAM',  :'M',  'member'),
  (:'TEAM2', :'T2', 'owner');

-- W1 belongs to team A, W2 to team B.
INSERT INTO public.team_workouts (id, team_id, template) VALUES
  (:'W1', :'TEAM',
   '{"aiwl": 1, "id": "88888888-8888-8888-8888-888888888881", "name": {"en": "Seeded"}, "blocks": [{}]}'),
  (:'W2', :'TEAM2',
   '{"aiwl": 1, "id": "88888888-8888-8888-8888-888888888882", "name": {"en": "Other team"}, "blocks": [{}]}');

-- ---------------------------------------------------------------------------
-- Create
-- ---------------------------------------------------------------------------
SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "X"}, "blocks": [{}]}') $$,
  'P0001', 'AUTH_REQUIRED', 'save: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT lives_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "Tuesday stability"}, "blocks": [{"exercises": []}]}') $$,
  'save: owner creates a team workout');

RESET ROLE;
SELECT is((SELECT count(*) FROM public.team_workouts
           WHERE team_id = :'TEAM' AND template->'name'->>'en' = 'Tuesday stability'), 1::bigint,
  'save: the created row is stored');
SELECT is((SELECT template->>'id' FROM public.team_workouts
           WHERE template->'name'->>'en' = 'Tuesday stability'),
          (SELECT id::text FROM public.team_workouts
           WHERE template->'name'->>'en' = 'Tuesday stability'),
  'save: template.id equals the row id');
SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT is((public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "Returned"}, "blocks": [{}]}')).team_id,
  '55555555-5555-5555-5555-555555555551'::uuid,
  'save: returns the saved row');

SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "X"}, "blocks": [{}]}') $$,
  'P0001', 'NOT_TEAM_OWNER', 'save: co-owner cannot create -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "X"}, "blocks": [{}]}') $$,
  'P0001', 'NOT_TEAM_OWNER', 'save: member cannot create -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "X"}, "blocks": [{}]}') $$,
  'P0001', 'TEAM_NOT_FOUND', 'save: outsider cannot create -> TEAM_NOT_FOUND (existence hidden)');

-- ---------------------------------------------------------------------------
-- Change
-- ---------------------------------------------------------------------------
SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "Hijack"}, "blocks": [{}]}', '88888888-8888-8888-8888-888888888881') $$,
  'P0001', 'NOT_TEAM_OWNER', 'save: co-owner cannot change -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "Hijack"}, "blocks": [{}]}', '88888888-8888-8888-8888-888888888881') $$,
  'P0001', 'NOT_TEAM_OWNER', 'save: member cannot change -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "Hijack"}, "blocks": [{}]}', '88888888-8888-8888-8888-888888888881') $$,
  'P0001', 'TEAM_NOT_FOUND', 'save: outsider cannot change -> TEAM_NOT_FOUND');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT lives_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "id": "ignored", "name": {"en": "Renamed"}, "blocks": [{}, {}]}',
    '88888888-8888-8888-8888-888888888881') $$,
  'save: owner changes a team workout');

RESET ROLE;
SELECT is((SELECT template->'name'->>'en' FROM public.team_workouts WHERE id = :'W1'), 'Renamed',
  'save: the change is stored');
SELECT is((SELECT template->>'id' FROM public.team_workouts WHERE id = :'W1'), :'W1',
  'save: after a change, template.id still equals the row id');
SELECT is((SELECT count(*) FROM public.team_workouts WHERE template->'name'->>'en' = 'Hijack'), 0::bigint,
  'save: rejected changes wrote nothing');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'T';

SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "X"}, "blocks": [{}]}', '88888888-8888-8888-8888-888888888899') $$,
  'P0001', 'TEAM_WORKOUT_NOT_FOUND', 'save: unknown workout id -> TEAM_WORKOUT_NOT_FOUND');

SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "X"}, "blocks": [{}]}', '88888888-8888-8888-8888-888888888882') $$,
  'P0001', 'TEAM_WORKOUT_NOT_FOUND', 'save: workout of another team -> TEAM_WORKOUT_NOT_FOUND');

-- ---------------------------------------------------------------------------
-- Template frame validation
-- ---------------------------------------------------------------------------
SELECT throws_ok($$ SELECT public.save_team_workout(NULL,
    '{"aiwl": 1, "name": {"en": "X"}, "blocks": [{}]}') $$,
  'P0001', 'INVALID_REQUEST_BODY', 'save: null team id -> INVALID_REQUEST_BODY');

SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551', NULL) $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: null template -> INVALID_WORKOUT_TEMPLATE');
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551', '[]') $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: template is not an object -> INVALID_WORKOUT_TEMPLATE');
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"name": {"en": "X"}, "blocks": [{}]}') $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: missing aiwl -> INVALID_WORKOUT_TEMPLATE');
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 2, "name": {"en": "X"}, "blocks": [{}]}') $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: aiwl 2 -> INVALID_WORKOUT_TEMPLATE');
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": "1", "name": {"en": "X"}, "blocks": [{}]}') $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: aiwl as a string -> INVALID_WORKOUT_TEMPLATE');
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1.0, "name": {"en": "X"}, "blocks": "many"}') $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: aiwl 1.0 with blocks as a string -> INVALID_WORKOUT_TEMPLATE');
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "blocks": [{}]}') $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: missing name -> INVALID_WORKOUT_TEMPLATE');
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"de": "Nur Deutsch"}, "blocks": [{}]}') $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: name without English -> INVALID_WORKOUT_TEMPLATE');
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "   "}, "blocks": [{}]}') $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: blank English name -> INVALID_WORKOUT_TEMPLATE');
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": "X", "blocks": [{}]}') $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: name as a plain string -> INVALID_WORKOUT_TEMPLATE');
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "X"}}') $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: missing blocks -> INVALID_WORKOUT_TEMPLATE');
SELECT throws_ok($$ SELECT public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "X"}, "blocks": []}') $$,
  'P0001', 'INVALID_WORKOUT_TEMPLATE', 'save: empty blocks -> INVALID_WORKOUT_TEMPLATE');

-- ---------------------------------------------------------------------------
-- Read
-- ---------------------------------------------------------------------------
-- Team A contains W1 and the two workouts the owner created above.
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT is((SELECT count(*) FROM public.team_workouts WHERE team_id = :'TEAM'), 3::bigint,
  'read: owner reads the team''s workouts');

SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT is((SELECT count(*) FROM public.team_workouts WHERE team_id = :'TEAM'), 3::bigint,
  'read: co-owner reads the team''s workouts');

-- All three are drafts; team_workout_status.test.sql tests published workouts.
SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT is((SELECT count(*) FROM public.team_workouts WHERE team_id = :'TEAM'), 0::bigint,
  'read: member reads no drafts of the team');
SELECT is((SELECT count(*) FROM public.team_workouts WHERE team_id = :'TEAM2'), 0::bigint,
  'read: member reads nothing of another team');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT is((SELECT count(*) FROM public.team_workouts), 0::bigint,
  'read: outsider reads no team workouts');

SET LOCAL ROLE anon;
SELECT throws_ok($$ SELECT count(*) FROM public.team_workouts $$,
  '42501', NULL, 'read: anon has no access to the table');
SET LOCAL ROLE authenticated;

-- ---------------------------------------------------------------------------
-- Direct writes fail, even for the owner
-- ---------------------------------------------------------------------------
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ INSERT INTO public.team_workouts (team_id, template)
    VALUES ('55555555-5555-5555-5555-555555555551', '{"aiwl": 1, "name": {"en": "X"}, "blocks": [{}]}') $$,
  '42501', NULL, 'direct INSERT is denied');
SELECT throws_ok($$ UPDATE public.team_workouts SET template = '{}'
    WHERE id = '88888888-8888-8888-8888-888888888881' $$,
  '42501', NULL, 'direct UPDATE is denied');
SELECT throws_ok($$ DELETE FROM public.team_workouts
    WHERE id = '88888888-8888-8888-8888-888888888881' $$,
  '42501', NULL, 'direct DELETE is denied');

-- ---------------------------------------------------------------------------
-- Delete
-- ---------------------------------------------------------------------------
SET LOCAL ROLE anon;
SELECT throws_ok($$ SELECT public.delete_team_workout('55555555-5555-5555-5555-555555555551',
    '88888888-8888-8888-8888-888888888881') $$,
  '42501', NULL, 'delete: anon role cannot execute');
SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok($$ SELECT public.delete_team_workout('55555555-5555-5555-5555-555555555551',
    '88888888-8888-8888-8888-888888888881') $$,
  'P0001', 'AUTH_REQUIRED', 'delete: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT throws_ok($$ SELECT public.delete_team_workout('55555555-5555-5555-5555-555555555551',
    '88888888-8888-8888-8888-888888888881') $$,
  'P0001', 'NOT_TEAM_OWNER', 'delete: co-owner -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.delete_team_workout('55555555-5555-5555-5555-555555555551',
    '88888888-8888-8888-8888-888888888881') $$,
  'P0001', 'NOT_TEAM_OWNER', 'delete: member -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.delete_team_workout('55555555-5555-5555-5555-555555555551',
    '88888888-8888-8888-8888-888888888881') $$,
  'P0001', 'TEAM_NOT_FOUND', 'delete: outsider -> TEAM_NOT_FOUND (existence hidden)');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ SELECT public.delete_team_workout(NULL, '88888888-8888-8888-8888-888888888881') $$,
  'P0001', 'INVALID_REQUEST_BODY', 'delete: null team id -> INVALID_REQUEST_BODY');
SELECT throws_ok($$ SELECT public.delete_team_workout('55555555-5555-5555-5555-555555555551', NULL) $$,
  'P0001', 'INVALID_REQUEST_BODY', 'delete: null workout id -> INVALID_REQUEST_BODY');
SELECT throws_ok($$ SELECT public.delete_team_workout('55555555-5555-5555-5555-555555555551',
    '88888888-8888-8888-8888-888888888899') $$,
  'P0001', 'TEAM_WORKOUT_NOT_FOUND', 'delete: unknown workout id -> TEAM_WORKOUT_NOT_FOUND');
SELECT throws_ok($$ SELECT public.delete_team_workout('55555555-5555-5555-5555-555555555551',
    '88888888-8888-8888-8888-888888888882') $$,
  'P0001', 'TEAM_WORKOUT_NOT_FOUND', 'delete: workout of another team -> TEAM_WORKOUT_NOT_FOUND');

RESET ROLE;
SELECT is((SELECT count(*) FROM public.team_workouts WHERE id = :'W2'), 1::bigint,
  'delete: the workout of the other team still exists');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'T';

SELECT lives_ok($$ SELECT public.delete_team_workout('55555555-5555-5555-5555-555555555551',
    '88888888-8888-8888-8888-888888888881') $$,
  'delete: owner deletes a team workout');

RESET ROLE;
SELECT is((SELECT count(*) FROM public.team_workouts WHERE id = :'W1'), 0::bigint,
  'delete: the row is gone');

-- ---------------------------------------------------------------------------
-- Deleting the team deletes its workouts
-- ---------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT public.delete_team('55555555-5555-5555-5555-555555555551');

RESET ROLE;
SELECT is((SELECT count(*) FROM public.team_workouts WHERE team_id = :'TEAM'), 0::bigint,
  'cascade: deleting the team deletes its team workouts');

SELECT * FROM finish();
ROLLBACK;
