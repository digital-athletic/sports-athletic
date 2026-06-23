-- delete_team: owner-only, existence hiding for outsiders, input validation, and
-- the cascade to team_members on delete.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(7);

\set T '11111111-1111-1111-1111-111111111111'
\set A '22222222-2222-2222-2222-222222222222'
\set M '33333333-3333-3333-3333-333333333333'
\set O '44444444-4444-4444-4444-444444444444'
\set TEAM '55555555-5555-5555-5555-555555555551'

INSERT INTO auth.users (id, email) VALUES
  (:'T', 'trainer.test@example.local'),
  (:'A', 'admin.test@example.local'),
  (:'M', 'member.test@example.local'),
  (:'O', 'outsider.test@example.local');
INSERT INTO public.user_profiles (user_id, trainer_granted_at, admin_granted_at) VALUES
  (:'T', now(), NULL),
  (:'A', NULL, now());

INSERT INTO public.teams (id, name, owner_id) VALUES (:'TEAM', 'Trainer Team', :'T');
INSERT INTO public.team_members (team_id, user_id, role) VALUES
  (:'TEAM', :'T', 'owner'),
  (:'TEAM', :'M', 'member');
INSERT INTO public.team_invitations (team_id, code, created_by) VALUES (:'TEAM', 'GOODCODE', :'T');

SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok($$ SELECT public.delete_team('55555555-5555-5555-5555-555555555551') $$,
  'P0001', 'AUTH_REQUIRED', 'delete_team: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.delete_team('55555555-5555-5555-5555-555555555551') $$,
  'P0001', 'NOT_TEAM_OWNER', 'delete_team: non-owner member -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.delete_team('55555555-5555-5555-5555-555555555551') $$,
  'P0001', 'TEAM_NOT_FOUND', 'delete_team: outsider -> TEAM_NOT_FOUND (existence hidden)');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ SELECT public.delete_team(NULL) $$,
  'P0001', 'INVALID_REQUEST_BODY', 'delete_team: null team id -> INVALID_REQUEST_BODY');

SELECT lives_ok($$ SELECT public.delete_team('55555555-5555-5555-5555-555555555551') $$,
  'delete_team: owner deletes team');

RESET ROLE;
SELECT is((SELECT count(*) FROM public.teams WHERE id = :'TEAM'), 0::bigint,
  'delete_team: team row is gone');
SELECT is((SELECT count(*) FROM public.team_members WHERE team_id = :'TEAM'), 0::bigint,
  'delete_team: members cascade-deleted');

SELECT * FROM finish();
ROLLBACK;
