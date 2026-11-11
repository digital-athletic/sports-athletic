-- Team workout status: every team workout is a draft or published.
--
-- Members read published workouts only. Owner and co-owners read drafts too.
-- save_team_workout creates drafts; a changed workout retains its status.
-- Only the owner changes the status, through set_team_workout_status.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(39);

-- Team A: T owns it, C is co-owner, M is a plain member. O belongs to no team.
-- Team B: T2 owns it.
\set T     '11111111-1111-1111-1111-111111111111'
\set C     '22222222-2222-2222-2222-222222222222'
\set M     '33333333-3333-3333-3333-333333333333'
\set O     '44444444-4444-4444-4444-444444444444'
\set T2    '66666666-6666-6666-6666-666666666666'
\set TEAM  '55555555-5555-5555-5555-555555555551'
\set TEAM2 '55555555-5555-5555-5555-555555555552'
\set WP    '88888888-8888-8888-8888-888888888881'
\set WD    '88888888-8888-8888-8888-888888888882'
\set WB    '88888888-8888-8888-8888-888888888883'

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

-- WP is published. WD is a draft of team A, WB a draft of team B.
INSERT INTO public.team_workouts (id, team_id, template, status) VALUES
  (:'WP', :'TEAM',
   '{"aiwl": 1, "id": "88888888-8888-8888-8888-888888888881", "name": {"en": "Old"}, "blocks": [{}]}',
   'published'),
  (:'WD', :'TEAM',
   '{"aiwl": 1, "id": "88888888-8888-8888-8888-888888888882", "name": {"en": "Draft"}, "blocks": [{}]}',
   'draft'),
  (:'WB', :'TEAM2',
   '{"aiwl": 1, "id": "88888888-8888-8888-8888-888888888883", "name": {"en": "Other draft"}, "blocks": [{}]}',
   'draft');

-- ---------------------------------------------------------------------------
-- Column
-- ---------------------------------------------------------------------------
SELECT col_default_is('public', 'team_workouts', 'status', 'draft',
  'column: a row inserted without a status is a draft');
SELECT throws_ok($$ INSERT INTO public.team_workouts (team_id, template, status)
    VALUES ('55555555-5555-5555-5555-555555555551',
            '{"aiwl": 1, "name": {"en": "X"}, "blocks": [{}]}', 'archived') $$,
  '23514', NULL, 'column: an unknown status violates the check');
SELECT throws_ok($$ INSERT INTO public.team_workouts (team_id, template, status)
    VALUES ('55555555-5555-5555-5555-555555555551',
            '{"aiwl": 1, "name": {"en": "X"}, "blocks": [{}]}', NULL) $$,
  '23502', NULL, 'column: status cannot be NULL');

-- ---------------------------------------------------------------------------
-- Read
-- ---------------------------------------------------------------------------
SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT is((SELECT count(*) FROM public.team_workouts WHERE status = 'draft'), 0::bigint,
  'read: member reads no drafts');
SELECT is((SELECT array_agg(id) FROM public.team_workouts), ARRAY[:'WP'::uuid],
  'read: member reads the published workout of their team');

SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT is((SELECT count(*) FROM public.team_workouts WHERE team_id = :'TEAM'), 2::bigint,
  'read: co-owner reads drafts and published workouts');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT is((SELECT count(*) FROM public.team_workouts WHERE team_id = :'TEAM'), 2::bigint,
  'read: owner reads drafts and published workouts');
SELECT is((SELECT count(*) FROM public.team_workouts WHERE team_id = :'TEAM2'), 0::bigint,
  'read: owner reads no drafts of another team');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT is((SELECT count(*) FROM public.team_workouts), 0::bigint,
  'read: outsider reads no team workouts');

-- ---------------------------------------------------------------------------
-- save_team_workout
-- ---------------------------------------------------------------------------
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT is((public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "Tuesday stability"}, "blocks": [{}]}')).status,
  'draft', 'save: a new workout is a draft');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT is((SELECT count(*) FROM public.team_workouts
           WHERE template->'name'->>'en' = 'Tuesday stability'), 0::bigint,
  'save: member does not read the new draft');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT is((public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "Old, changed"}, "blocks": [{}]}',
    '88888888-8888-8888-8888-888888888881')).status,
  'published', 'save: a changed published workout stays published');
SELECT is((public.save_team_workout('55555555-5555-5555-5555-555555555551',
    '{"aiwl": 1, "name": {"en": "Draft, changed"}, "blocks": [{}]}',
    '88888888-8888-8888-8888-888888888882')).status,
  'draft', 'save: a changed draft stays a draft');

-- ---------------------------------------------------------------------------
-- set_team_workout_status: rejected callers and input
-- ---------------------------------------------------------------------------
SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok($$ SELECT public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888882', 'published') $$,
  'P0001', 'AUTH_REQUIRED', 'status: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT throws_ok($$ SELECT public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888882', 'published') $$,
  'P0001', 'NOT_TEAM_OWNER', 'status: co-owner -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888882', 'published') $$,
  'P0001', 'NOT_TEAM_OWNER', 'status: member -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888882', 'published') $$,
  'P0001', 'TEAM_NOT_FOUND', 'status: outsider -> TEAM_NOT_FOUND (existence hidden)');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ SELECT public.set_team_workout_status(NULL, '88888888-8888-8888-8888-888888888882', 'published') $$,
  'P0001', 'INVALID_REQUEST_BODY', 'status: null team -> INVALID_REQUEST_BODY');
SELECT throws_ok($$ SELECT public.set_team_workout_status('55555555-5555-5555-5555-555555555552', '88888888-8888-8888-8888-888888888883', 'published') $$,
  'P0001', 'TEAM_NOT_FOUND', 'status: owner passing another team -> TEAM_NOT_FOUND');
SELECT throws_ok($$ SELECT public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888883', 'published') $$,
  'P0001', 'TEAM_WORKOUT_NOT_FOUND', 'status: own team with a workout of another team -> TEAM_WORKOUT_NOT_FOUND');
SELECT throws_ok($$ SELECT public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888899', 'published') $$,
  'P0001', 'TEAM_WORKOUT_NOT_FOUND', 'status: unknown workout -> TEAM_WORKOUT_NOT_FOUND');
SELECT throws_ok($$ SELECT public.set_team_workout_status('55555555-5555-5555-5555-555555555551', NULL, 'published') $$,
  'P0001', 'INVALID_REQUEST_BODY', 'status: null workout id -> INVALID_REQUEST_BODY');
SELECT throws_ok($$ SELECT public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888882', NULL) $$,
  'P0001', 'INVALID_REQUEST_BODY', 'status: null status -> INVALID_REQUEST_BODY');
SELECT throws_ok($$ SELECT public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888882', 'archived') $$,
  'P0001', 'INVALID_REQUEST_BODY', 'status: unknown status -> INVALID_REQUEST_BODY');

RESET ROLE;
SELECT is((SELECT status FROM public.team_workouts WHERE id = :'WD'), 'draft',
  'status: rejected calls leave the draft a draft');
SELECT is((SELECT status FROM public.team_workouts WHERE id = :'WB'), 'draft',
  'status: rejected calls leave the other team''s draft a draft');
SET LOCAL ROLE authenticated;

-- ---------------------------------------------------------------------------
-- set_team_workout_status: publish and move back to draft
-- ---------------------------------------------------------------------------
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT is((public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888882', 'published')).status,
  'published', 'status: owner publishes a draft and gets the row back');
SELECT is((public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888882', 'published')).status,
  'published', 'status: publishing a published workout is a no-op');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT is((SELECT count(*) FROM public.team_workouts WHERE id = :'WD'), 1::bigint,
  'status: member reads the workout once it is published');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT is((public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888882', 'draft')).status,
  'draft', 'status: owner moves a published workout back to draft');
SELECT is((public.set_team_workout_status('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888881', 'draft')).template->'name'->>'en',
  'Old, changed', 'status: the status change leaves the template unchanged');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT is((SELECT count(*) FROM public.team_workouts WHERE team_id = :'TEAM'), 0::bigint,
  'status: member reads no workout after both moved back to draft');

SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT is((SELECT count(*) FROM public.team_workouts WHERE team_id = :'TEAM' AND status = 'draft'), 3::bigint,
  'status: co-owner still reads the drafts');

-- ---------------------------------------------------------------------------
-- A demoted co-owner loses the drafts
-- ---------------------------------------------------------------------------
RESET ROLE;
UPDATE public.team_members SET role = 'member' WHERE team_id = :'TEAM' AND user_id = :'C';
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT is((SELECT count(*) FROM public.team_workouts WHERE team_id = :'TEAM'), 0::bigint,
  'read: a co-owner demoted to member reads no drafts');

-- ---------------------------------------------------------------------------
-- Direct status writes fail, even for the owner
-- ---------------------------------------------------------------------------
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ UPDATE public.team_workouts SET status = 'published'
    WHERE id = '88888888-8888-8888-8888-888888888882' $$,
  '42501', NULL, 'direct UPDATE of the status is denied');

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
RESET ROLE;
SELECT ok(has_function_privilege('authenticated', 'public.set_team_workout_status(uuid, uuid, text)', 'EXECUTE'),
  'grant: authenticated may call set_team_workout_status');
SELECT ok(NOT has_function_privilege('anon', 'public.set_team_workout_status(uuid, uuid, text)', 'EXECUTE'),
  'grant: anon may not call set_team_workout_status');
SELECT ok(NOT has_function_privilege('service_role', 'public.set_team_workout_status(uuid, uuid, text)', 'EXECUTE'),
  'grant: service_role may not call set_team_workout_status');
SELECT ok(NOT has_function_privilege('anon', 'public.is_team_staff(uuid)', 'EXECUTE'),
  'grant: anon may not call is_team_staff');

SELECT * FROM finish();
ROLLBACK;
