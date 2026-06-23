-- accept_invitation: auth gate, code validation (invalid / inactive / expired /
-- max-uses), and the already-member guard. Membership is seeded directly so each
-- branch is exercised in isolation.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(11);

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
INSERT INTO public.team_members (team_id, user_id, role) VALUES (:'TEAM', :'T', 'owner');
INSERT INTO public.team_invitations (team_id, code, created_by, is_active, expires_at, max_uses, use_count) VALUES
  (:'TEAM', 'GOODCODE', :'T', true,  NULL,                 NULL, 0),
  (:'TEAM', 'INACTIVE', :'T', false, NULL,                 NULL, 0),
  (:'TEAM', 'EXPIRED',  :'T', true,  now() - interval '1 day', NULL, 0),
  (:'TEAM', 'MAXED',    :'T', true,  NULL,                 1,    1);

SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok($$ SELECT public.accept_invitation('GOODCODE') $$,
  'P0001', 'AUTH_REQUIRED', 'accept_invitation: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.accept_invitation('bad code!') $$,
  'P0001', 'INVALID_REQUEST_BODY', 'accept_invitation: malformed code -> INVALID_REQUEST_BODY');
SELECT throws_ok($$ SELECT public.accept_invitation('ZZZZZZ') $$,
  'P0001', 'INVITE_CODE_INVALID', 'accept_invitation: unknown code -> INVITE_CODE_INVALID');
SELECT throws_ok($$ SELECT public.accept_invitation('INACTIVE') $$,
  'P0001', 'INVITE_CODE_INACTIVE', 'accept_invitation: inactive code -> INVITE_CODE_INACTIVE');
SELECT throws_ok($$ SELECT public.accept_invitation('EXPIRED') $$,
  'P0001', 'INVITE_CODE_EXPIRED', 'accept_invitation: expired code -> INVITE_CODE_EXPIRED');
SELECT throws_ok($$ SELECT public.accept_invitation('MAXED') $$,
  'P0001', 'INVITE_CODE_MAX_USES', 'accept_invitation: exhausted code -> INVITE_CODE_MAX_USES');

SELECT lives_ok($$ SELECT public.accept_invitation('GOODCODE') $$,
  'accept_invitation: member joins via valid code');

RESET ROLE;
SELECT ok(
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = :'TEAM' AND user_id = :'M'),
  'accept_invitation: member row was created');
SELECT is((SELECT use_count FROM public.team_invitations WHERE code = 'GOODCODE'), 1,
  'accept_invitation: use_count incremented on join');

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'M';
SELECT throws_ok($$ SELECT public.accept_invitation('GOODCODE') $$,
  'P0001', 'ALREADY_TEAM_MEMBER', 'accept_invitation: second time -> ALREADY_TEAM_MEMBER');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ SELECT public.accept_invitation('GOODCODE') $$,
  'P0001', 'ALREADY_TEAM_MEMBER', 'accept_invitation: owner already member -> ALREADY_TEAM_MEMBER');

SELECT * FROM finish();
ROLLBACK;
