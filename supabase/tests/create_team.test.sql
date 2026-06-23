-- create_team: trainer gate, auth gate, input validation, initial invite issuance.
-- See supabase/tests/README.md for the actor / fixture conventions.

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

SET LOCAL "request.jwt.claim.sub" TO :'O';
SELECT throws_ok($$ SELECT public.create_team('Outsider Team', NULL) $$,
  'P0001', 'NOT_A_TRAINER', 'create_team: non-trainer -> NOT_A_TRAINER');

-- an admin is not implicitly a trainer (role separation)
SET LOCAL "request.jwt.claim.sub" TO :'A';
SELECT throws_ok($$ SELECT public.create_team('Admin Team', NULL) $$,
  'P0001', 'NOT_A_TRAINER', 'create_team: admin without trainer grant -> NOT_A_TRAINER');

SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok($$ SELECT public.create_team('X', NULL) $$,
  'P0001', 'AUTH_REQUIRED', 'create_team: no auth -> AUTH_REQUIRED');

SET LOCAL "request.jwt.claim.sub" TO :'T';
SELECT lives_ok($$ SELECT public.create_team('Trainer Team', 'desc') $$,
  'create_team: trainer succeeds');

SELECT throws_ok($$ SELECT public.create_team('   ', NULL) $$,
  'P0001', 'INVALID_REQUEST_BODY', 'create_team: blank name -> INVALID_REQUEST_BODY');

RESET ROLE;
SELECT ok(
  EXISTS (SELECT 1 FROM public.team_invitations ti
          JOIN public.teams t ON t.id = ti.team_id
          WHERE t.owner_id = :'T'),
  'create_team: also issues an initial invite code');

SELECT * FROM finish();
ROLLBACK;
