-- delete_my_account: auth gate, and a hard delete scoped strictly to the caller.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(5);

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
SELECT throws_ok($$ SELECT public.delete_my_account() $$,
  'P0001', 'AUTH_REQUIRED', 'delete_my_account: no auth -> AUTH_REQUIRED');

-- a valid JWT whose user no longer exists (stale token) deletes nothing
SET LOCAL "request.jwt.claim.sub" TO '99999999-9999-9999-9999-999999999999';
SELECT throws_ok($$ SELECT public.delete_my_account() $$,
  'P0001', 'USER_NOT_FOUND', 'delete_my_account: unknown caller (stale token) -> USER_NOT_FOUND');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT lives_ok($$ SELECT public.delete_my_account() $$,
  'delete_my_account: caller deletes own account');

RESET ROLE;
SELECT is((SELECT count(*) FROM auth.users WHERE id = :'O'), 0::bigint,
  'delete_my_account: caller row is gone');
SELECT is((SELECT count(*) FROM auth.users WHERE id IN (:'T', :'A', :'M')), 3::bigint,
  'delete_my_account: only the caller is deleted, other users remain');

SELECT * FROM finish();
ROLLBACK;
