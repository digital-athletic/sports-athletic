-- leave_team: auth gate, input validation, owner-cannot-leave, membership
-- requirement, and the member self-removal happy path.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(10);

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

SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok($$ SELECT public.leave_team('55555555-5555-5555-5555-555555555551') $$,
  'P0001', 'AUTH_REQUIRED', 'leave_team: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.leave_team(NULL) $$,
  'P0001', 'INVALID_REQUEST_BODY', 'leave_team: null team id -> INVALID_REQUEST_BODY');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ SELECT public.leave_team('55555555-5555-5555-5555-555555555551') $$,
  'P0001', 'OWNER_CANNOT_LEAVE', 'leave_team: owner -> OWNER_CANNOT_LEAVE');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.leave_team('55555555-5555-5555-5555-555555555551') $$,
  'P0001', 'NOT_TEAM_MEMBER', 'leave_team: non-member -> NOT_TEAM_MEMBER');

-- Raw DELETE must not bypass leave_team.
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT lives_ok($$ DELETE FROM public.team_members WHERE team_id = '55555555-5555-5555-5555-555555555551' AND user_id = '11111111-1111-1111-1111-111111111111' $$,
  'leave_team: owner direct DELETE of own membership runs but is RLS-filtered');
SELECT ok(
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = :'TEAM' AND user_id = :'T'),
  'leave_team: owner membership row survives direct DELETE (owner-cannot-leave preserved)');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT lives_ok($$ DELETE FROM public.team_members WHERE team_id = '55555555-5555-5555-5555-555555555551' AND user_id = '11111111-1111-1111-1111-111111111111' $$,
  'leave_team: member direct DELETE of another member runs but is RLS-filtered');
SELECT ok(
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = :'TEAM' AND user_id = :'T'),
  'leave_team: a member cannot delete another member row');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT lives_ok($$ SELECT public.leave_team('55555555-5555-5555-5555-555555555551') $$,
  'leave_team: member leaves');

RESET ROLE;
SELECT ok(
  NOT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = :'TEAM' AND user_id = :'M'),
  'leave_team: member row was removed');

SELECT * FROM finish();
ROLLBACK;
