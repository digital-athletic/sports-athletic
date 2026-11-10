-- Covers update_team_guidance and the two new team columns:
--   * only the owner may call it; co-owners and members get NOT_TEAM_OWNER
--   * outsiders and unknown teams get TEAM_NOT_FOUND, so existence stays hidden
--   * guidance is trimmed, blank guidance (spaces, tabs, newlines) and a NULL
--     target clear the value
--   * the limits 1 and 7 pass, values outside fail, guidance over 1000 fails
--   * a rejected call leaves the stored values unchanged
--   * members read both fields; direct UPDATEs on teams stay closed
--
-- UUIDs are written out inside the $$ blocks because psql variables are not
-- replaced there.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(30);

\set T    '11111111-1111-1111-1111-111111111111'
\set C    '22222222-2222-2222-2222-222222222222'
\set M    '33333333-3333-3333-3333-333333333333'
\set O    '44444444-4444-4444-4444-444444444444'
\set TEAM '55555555-5555-5555-5555-555555555551'

INSERT INTO auth.users (id, email) VALUES
  (:'T', 'trainer.test@example.local'),
  (:'C', 'coowner.test@example.local'),
  (:'M', 'member.test@example.local'),
  (:'O', 'outsider.test@example.local');
INSERT INTO public.user_profiles (user_id, trainer_granted_at) VALUES (:'T', now());
INSERT INTO public.teams (id, name, description, owner_id)
  VALUES (:'TEAM', 'Trainer Team', 'U19 squad', :'T');
INSERT INTO public.team_members (team_id, user_id, role) VALUES
  (:'TEAM', :'T', 'owner'),
  (:'TEAM', :'C', 'co_owner'),
  (:'TEAM', :'M', 'member');

-- Existing teams keep both fields empty.
SELECT is((SELECT guidance FROM public.teams WHERE id = :'TEAM'), NULL,
  'teams: guidance starts empty');
SELECT is((SELECT weekly_training_days FROM public.teams WHERE id = :'TEAM'), NULL,
  'teams: weekly_training_days starts empty');

SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', 'x', 3) $$,
  'P0001', 'AUTH_REQUIRED', 'update_team_guidance: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', 'x', 3) $$,
  'P0001', 'NOT_TEAM_OWNER', 'update_team_guidance: member -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT throws_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', 'x', 3) $$,
  'P0001', 'NOT_TEAM_OWNER', 'update_team_guidance: co-owner -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', 'x', 3) $$,
  'P0001', 'TEAM_NOT_FOUND', 'update_team_guidance: outsider -> TEAM_NOT_FOUND (existence hidden)');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ SELECT public.update_team_guidance('99999999-9999-9999-9999-999999999999', 'x', 3) $$,
  'P0001', 'TEAM_NOT_FOUND', 'update_team_guidance: unknown team -> TEAM_NOT_FOUND');

SELECT throws_ok($$ SELECT public.update_team_guidance(NULL, 'x', 3) $$,
  'P0001', 'INVALID_REQUEST_BODY', 'update_team_guidance: null team id -> INVALID_REQUEST_BODY');

-- The owner saves both fields in one call; guidance is trimmed.
SELECT lives_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551',
  '  Team sessions Mon and Thu 18:00.  ', 3) $$,
  'update_team_guidance: owner saves both fields');

SELECT is(
  (SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', 'Mon and Thu', 3)::jsonb),
  jsonb_build_object('team_id', '55555555-5555-5555-5555-555555555551',
                     'guidance', 'Mon and Thu', 'weekly_training_days', 3),
  'update_team_guidance: returns the stored values');

SELECT lives_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551',
  '  Team sessions Mon and Thu 18:00.  ', 3) $$,
  'update_team_guidance: owner saves again');

RESET ROLE;
SELECT is((SELECT guidance FROM public.teams WHERE id = :'TEAM'), 'Team sessions Mon and Thu 18:00.',
  'update_team_guidance: guidance stored trimmed');
SELECT is((SELECT weekly_training_days FROM public.teams WHERE id = :'TEAM'), 3::smallint,
  'update_team_guidance: weekly target stored');
SELECT is((SELECT description FROM public.teams WHERE id = :'TEAM'), 'U19 squad',
  'update_team_guidance: description stays untouched');

-- Members and co-owners read both fields.
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT is((SELECT guidance FROM public.teams WHERE id = '55555555-5555-5555-5555-555555555551'),
  'Team sessions Mon and Thu 18:00.', 'teams: member reads guidance');
SELECT is((SELECT weekly_training_days FROM public.teams WHERE id = '55555555-5555-5555-5555-555555555551'),
  3::smallint, 'teams: member reads weekly target');

-- Teams stay closed to direct updates, even for the owner.
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ UPDATE public.teams SET guidance = 'direct' WHERE id = '55555555-5555-5555-5555-555555555551' $$,
  '42501', NULL, 'teams: owner cannot UPDATE directly');

-- Limits.
SELECT lives_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', 'x', 1) $$,
  'update_team_guidance: target 1 accepted');
SELECT lives_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', repeat('a', 1000), 7) $$,
  'update_team_guidance: target 7 and 1000 characters accepted');

SELECT throws_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', 'changed', 0) $$,
  'P0001', 'WEEKLY_TARGET_OUT_OF_RANGE', 'update_team_guidance: target 0 rejected');
SELECT throws_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', 'changed', 8) $$,
  'P0001', 'WEEKLY_TARGET_OUT_OF_RANGE', 'update_team_guidance: target 8 rejected');
SELECT throws_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', repeat('b', 1001), 2) $$,
  'P0001', 'GUIDANCE_TOO_LONG', 'update_team_guidance: 1001 characters rejected');

RESET ROLE;
SELECT is((SELECT guidance FROM public.teams WHERE id = :'TEAM'), repeat('a', 1000),
  'update_team_guidance: rejected calls keep the stored guidance');
SELECT is((SELECT weekly_training_days FROM public.teams WHERE id = :'TEAM'), 7::smallint,
  'update_team_guidance: rejected calls keep the stored target');

-- Blank guidance and a NULL target clear the stored values.
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT lives_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', '   ', NULL) $$,
  'update_team_guidance: owner clears both fields');

RESET ROLE;
SELECT is((SELECT guidance FROM public.teams WHERE id = :'TEAM'), NULL,
  'update_team_guidance: blank guidance stored as empty');
SELECT is((SELECT weekly_training_days FROM public.teams WHERE id = :'TEAM'), NULL,
  'update_team_guidance: NULL target clears the value');

-- Tabs and newlines count as blank too.
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT lives_ok($$ SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', E'\n\t  \r\n', 2) $$,
  'update_team_guidance: owner saves whitespace-only guidance');

RESET ROLE;
SELECT is((SELECT guidance FROM public.teams WHERE id = :'TEAM'), NULL,
  'update_team_guidance: tabs and newlines stored as empty');

-- Inner line breaks stay, only the surrounding whitespace goes.
SELECT is(
  (SELECT public.update_team_guidance('55555555-5555-5555-5555-555555555551', E'\n Mon 18:00\nThu 18:00 \t', NULL)::jsonb ->> 'guidance'),
  E'Mon 18:00\nThu 18:00', 'update_team_guidance: inner line breaks kept, outer whitespace trimmed');

SELECT * FROM finish();
ROLLBACK;
