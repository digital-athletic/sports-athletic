-- Covers set_member_role:
--   * only the owner may call it
--   * outsiders get TEAM_NOT_FOUND, so the team's existence stays hidden
--   * 'owner' cannot be assigned, and the owner's own row cannot be changed
--   * the target must already be a member
--   * promote and demote both work
--   * a co-owner gains no rights beyond reading athlete data
--
-- UUIDs are written out inside the $$ blocks because psql variables are not
-- replaced there.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(16);

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
INSERT INTO public.teams (id, name, owner_id) VALUES (:'TEAM', 'Trainer Team', :'T');
INSERT INTO public.team_members (team_id, user_id, role) VALUES
  (:'TEAM', :'T', 'owner'),
  (:'TEAM', :'C', 'co_owner'),
  (:'TEAM', :'M', 'member');

SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok($$ SELECT public.set_member_role('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333','co_owner') $$,
  'P0001', 'AUTH_REQUIRED', 'set_member_role: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.set_member_role('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333','co_owner') $$,
  'P0001', 'NOT_TEAM_OWNER', 'set_member_role: non-owner member -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.set_member_role('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333','co_owner') $$,
  'P0001', 'TEAM_NOT_FOUND', 'set_member_role: outsider -> TEAM_NOT_FOUND (existence hidden)');

-- A co-owner gains nothing beyond reading athlete data: every owner-only RPC
-- must still refuse them. assert_visible_team_owner compares owner_id only, so
-- these four calls fail today. The tests make sure that stays so.
SET LOCAL "request.jwt.claim.sub" TO :'C';
SELECT throws_ok($$ SELECT public.set_member_role('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333','co_owner') $$,
  'P0001', 'NOT_TEAM_OWNER', 'set_member_role: co-owner cannot promote anyone');
SELECT throws_ok($$ SELECT public.remove_member('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333') $$,
  'P0001', 'NOT_TEAM_OWNER', 'remove_member: co-owner cannot remove a member');
SELECT throws_ok($$ SELECT public.generate_invite_code('55555555-5555-5555-5555-555555555551') $$,
  'P0001', 'NOT_TEAM_OWNER', 'generate_invite_code: co-owner cannot rotate the invite code');
SELECT throws_ok($$ SELECT public.delete_team('55555555-5555-5555-5555-555555555551') $$,
  'P0001', 'NOT_TEAM_OWNER', 'delete_team: co-owner cannot delete the group');

SET LOCAL "request.jwt.claim.sub" TO :'T';

-- 'owner' cannot be assigned through this function.
SELECT throws_ok($$ SELECT public.set_member_role('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333','owner') $$,
  'P0001', 'INVALID_REQUEST_BODY', 'set_member_role: p_role = owner -> INVALID_REQUEST_BODY');

SELECT throws_ok($$ SELECT public.set_member_role('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333','observer') $$,
  'P0001', 'INVALID_REQUEST_BODY', 'set_member_role: unknown role -> INVALID_REQUEST_BODY');

SELECT throws_ok($$ SELECT public.set_member_role(NULL, NULL, NULL) $$,
  'P0001', 'INVALID_REQUEST_BODY', 'set_member_role: null args -> INVALID_REQUEST_BODY');

-- The owner's own row cannot be changed.
SELECT throws_ok($$ SELECT public.set_member_role('55555555-5555-5555-5555-555555555551','11111111-1111-1111-1111-111111111111','member') $$,
  'P0001', 'CANNOT_CHANGE_OWNER_ROLE', 'set_member_role: owner as target -> CANNOT_CHANGE_OWNER_ROLE');

SELECT throws_ok($$ SELECT public.set_member_role('55555555-5555-5555-5555-555555555551','44444444-4444-4444-4444-444444444444','co_owner') $$,
  'P0001', 'MEMBER_NOT_FOUND', 'set_member_role: target not a member -> MEMBER_NOT_FOUND');

SELECT lives_ok($$ SELECT public.set_member_role('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333','co_owner') $$,
  'set_member_role: owner promotes a member');

RESET ROLE;
SELECT is((SELECT role FROM public.team_members WHERE team_id = :'TEAM' AND user_id = :'M'), 'co_owner',
  'set_member_role: the member row now holds co_owner');

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT lives_ok($$ SELECT public.set_member_role('55555555-5555-5555-5555-555555555551','33333333-3333-3333-3333-333333333333','member') $$,
  'set_member_role: owner demotes a co-owner');

RESET ROLE;
SELECT is((SELECT role FROM public.team_members WHERE team_id = :'TEAM' AND user_id = :'M'), 'member',
  'set_member_role: the row is back to member');

SELECT * FROM finish();
ROLLBACK;
