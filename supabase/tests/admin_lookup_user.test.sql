-- admin_lookup_user: admin gate runs before anything else, plus email validation
-- and not-found handling.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(6);

\set T '11111111-1111-1111-1111-111111111111'
\set A '22222222-2222-2222-2222-222222222222'
\set M '33333333-3333-3333-3333-333333333333'
\set O '44444444-4444-4444-4444-444444444444'

INSERT INTO auth.users (id, email) VALUES
  (:'T', 'trainer.test@example.local'),
  (:'A', 'admin.test@example.local'),
  (:'M', 'member.test@example.local'),
  (:'O', 'outsider.test@example.local');
INSERT INTO public.user_profiles (user_id, trainer_granted_at, admin_granted_at) VALUES
  (:'T', now(), NULL),
  (:'A', NULL, now());

SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok($$ SELECT public.admin_lookup_user('member.test@example.local') $$,
  'P0001', 'AUTH_REQUIRED', 'admin_lookup_user: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT throws_ok($$ SELECT public.admin_lookup_user('member.test@example.local') $$,
  'P0001', 'NOT_AN_ADMIN', 'admin_lookup_user: non-admin -> NOT_AN_ADMIN');

-- the admin gate must run before input validation, so a non-admin cannot probe
SELECT throws_ok($$ SELECT public.admin_lookup_user('not-an-email') $$,
  'P0001', 'NOT_AN_ADMIN', 'admin_lookup_user: admin gate precedes input validation');

SET LOCAL "request.jwt.claim.sub" TO :'A';
SELECT throws_ok($$ SELECT public.admin_lookup_user('not-an-email') $$,
  'P0001', 'INVALID_REQUEST_BODY', 'admin_lookup_user: malformed email -> INVALID_REQUEST_BODY');

SELECT throws_ok($$ SELECT public.admin_lookup_user('nobody@example.local') $$,
  'P0001', 'USER_NOT_FOUND', 'admin_lookup_user: unknown email -> USER_NOT_FOUND');

SELECT lives_ok($$ SELECT public.admin_lookup_user('member.test@example.local') $$,
  'admin_lookup_user: admin finds an existing user');

SELECT * FROM finish();
ROLLBACK;
