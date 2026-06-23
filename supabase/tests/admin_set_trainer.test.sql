-- admin_set_trainer: admin gate, target-must-exist, grant/revoke of
-- trainer_granted_at, and the invariant that admin_granted_at is never written
-- (no privilege escalation).

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(10);

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
SELECT throws_ok($$ SELECT public.admin_set_trainer('44444444-4444-4444-4444-444444444444', true) $$,
  'P0001', 'AUTH_REQUIRED', 'admin_set_trainer: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.admin_set_trainer('44444444-4444-4444-4444-444444444444', true) $$,
  'P0001', 'NOT_AN_ADMIN', 'admin_set_trainer: non-admin -> NOT_AN_ADMIN');

-- the admin gate must run before input validation, so a non-admin cannot probe
SELECT throws_ok($$ SELECT public.admin_set_trainer(NULL, NULL) $$,
  'P0001', 'NOT_AN_ADMIN', 'admin_set_trainer: admin gate precedes input validation');

SET LOCAL "request.jwt.claim.sub" TO :'A';
SELECT throws_ok($$ SELECT public.admin_set_trainer(NULL, NULL) $$,
  'P0001', 'INVALID_REQUEST_BODY', 'admin_set_trainer: null args -> INVALID_REQUEST_BODY');
SELECT throws_ok($$ SELECT public.admin_set_trainer('99999999-9999-9999-9999-999999999999', true) $$,
  'P0001', 'USER_NOT_FOUND', 'admin_set_trainer: unknown user -> USER_NOT_FOUND');

SELECT lives_ok($$ SELECT public.admin_set_trainer('44444444-4444-4444-4444-444444444444', true) $$,
  'admin_set_trainer: admin grants trainer to a user');

RESET ROLE;
SELECT is((SELECT trainer_granted_at IS NOT NULL FROM public.user_profiles WHERE user_id = :'O'), true,
  'admin_set_trainer: trainer_granted_at was set');
SELECT is((SELECT admin_granted_at FROM public.user_profiles WHERE user_id = :'O'), NULL,
  'admin_set_trainer: admin_granted_at is never written (no privilege escalation)');

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'A';
SELECT lives_ok($$ SELECT public.admin_set_trainer('44444444-4444-4444-4444-444444444444', false) $$,
  'admin_set_trainer: admin revokes trainer');

RESET ROLE;
SELECT is((SELECT trainer_granted_at FROM public.user_profiles WHERE user_id = :'O'), NULL,
  'admin_set_trainer: trainer_granted_at was cleared on revoke');

SELECT * FROM finish();
ROLLBACK;
