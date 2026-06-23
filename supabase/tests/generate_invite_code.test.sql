-- generate_invite_code: owner-only, existence hiding, max_uses validation, and
-- the optional deactivate-existing rotation.

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
INSERT INTO public.team_invitations (team_id, code, created_by, is_active) VALUES
  (:'TEAM', 'OLDCODE', :'T', true);

SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok($$ SELECT public.generate_invite_code('55555555-5555-5555-5555-555555555551', NULL, NULL, false) $$,
  'P0001', 'AUTH_REQUIRED', 'generate_invite_code: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.generate_invite_code('55555555-5555-5555-5555-555555555551', NULL, NULL, false) $$,
  'P0001', 'NOT_TEAM_OWNER', 'generate_invite_code: non-owner member -> NOT_TEAM_OWNER');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.generate_invite_code('55555555-5555-5555-5555-555555555551', NULL, NULL, false) $$,
  'P0001', 'TEAM_NOT_FOUND', 'generate_invite_code: outsider -> TEAM_NOT_FOUND (existence hidden)');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ SELECT public.generate_invite_code('55555555-5555-5555-5555-555555555551', NULL, 0, false) $$,
  'P0001', 'INVALID_REQUEST_BODY', 'generate_invite_code: max_uses < 1 -> INVALID_REQUEST_BODY');
SELECT throws_ok($$ SELECT public.generate_invite_code('55555555-5555-5555-5555-555555555551', NULL, NULL, NULL) $$,
  'P0001', 'INVALID_REQUEST_BODY', 'generate_invite_code: null deactivate flag -> INVALID_REQUEST_BODY');

SELECT lives_ok($$ SELECT public.generate_invite_code('55555555-5555-5555-5555-555555555551', NULL, NULL, false) $$,
  'generate_invite_code: owner generates without deactivating');

RESET ROLE;
SELECT is((SELECT count(*) FROM public.team_invitations WHERE team_id = :'TEAM' AND is_active), 2::bigint,
  'generate_invite_code: old + new codes are both active');

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT lives_ok($$ SELECT public.generate_invite_code('55555555-5555-5555-5555-555555555551', NULL, NULL, true) $$,
  'generate_invite_code: owner rotates with deactivate_existing');

RESET ROLE;
SELECT is((SELECT count(*) FROM public.team_invitations WHERE team_id = :'TEAM' AND is_active), 1::bigint,
  'generate_invite_code: only the newest code remains active');
SELECT is((SELECT is_active FROM public.team_invitations WHERE code = 'OLDCODE'), false,
  'generate_invite_code: the prior code was deactivated');

SELECT * FROM finish();
ROLLBACK;
