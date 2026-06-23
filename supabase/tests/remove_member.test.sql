-- remove_member: owner-only, existence hiding for outsiders, self-removal guard,
-- target-must-exist, input validation, and the happy path.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(8);

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
SELECT throws_ok($$ SELECT public.remove_member('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333') $$,
  'P0001', 'AUTH_REQUIRED', 'remove_member: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.remove_member('55555555-5555-5555-5555-555555555551','11111111-1111-1111-1111-111111111111') $$,
  'P0001', 'NOT_TEAM_OWNER', 'remove_member: non-owner member -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.remove_member('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333') $$,
  'P0001', 'TEAM_NOT_FOUND', 'remove_member: outsider -> TEAM_NOT_FOUND (existence hidden)');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ SELECT public.remove_member('55555555-5555-5555-5555-555555555551','11111111-1111-1111-1111-111111111111') $$,
  'P0001', 'CANNOT_REMOVE_SELF', 'remove_member: owner removing self -> CANNOT_REMOVE_SELF');

SELECT throws_ok($$ SELECT public.remove_member('55555555-5555-5555-5555-555555555551','44444444-4444-4444-4444-444444444444') $$,
  'P0001', 'MEMBER_NOT_FOUND', 'remove_member: target not a member -> MEMBER_NOT_FOUND');

SELECT throws_ok($$ SELECT public.remove_member(NULL, NULL) $$,
  'P0001', 'INVALID_REQUEST_BODY', 'remove_member: null args -> INVALID_REQUEST_BODY');

SELECT lives_ok($$ SELECT public.remove_member('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333') $$,
  'remove_member: owner removes member');

RESET ROLE;
SELECT ok(
  NOT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = :'TEAM' AND user_id = :'M'),
  'remove_member: member row was removed');

SELECT * FROM finish();
ROLLBACK;
