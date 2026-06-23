-- DANGEROUS SCENARIOS: privilege escalation and user enumeration.
--
-- Verifies a normal authenticated user cannot:
--   * grant themselves (or anyone) admin or trainer status by writing user_profiles,
--   * escalate through the one sanctioned write path (save_user_consent),
--   * grant themselves trainer via the admin RPC,
--   * read other users' profiles, or enumerate the auth.users table.
--
-- Grant/column denials raise 42501; RLS-filtered reads return 0 rows.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(13);

-- X = attacker (a normal user),  V = another user
\set X 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'
\set V 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'

INSERT INTO auth.users (id, email) VALUES
  (:'X', 'attacker.test@example.local'),
  (:'V', 'victim.test@example.local');
INSERT INTO public.user_profiles (user_id) VALUES (:'V');  -- victim has a profile row

-- auth.users must not be readable by client roles at all (no SELECT grant).
SELECT is(has_table_privilege('authenticated', 'auth.users', 'SELECT'), false,
  'authenticated has no SELECT privilege on auth.users');
SELECT is(has_table_privilege('anon', 'auth.users', 'SELECT'), false,
  'anon has no SELECT privilege on auth.users');

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'X';

-- Enumerating users is blocked behaviourally too.
SELECT throws_ok($$ SELECT id, email FROM auth.users $$,
  '42501', NULL, 'authenticated user cannot enumerate auth.users');

-- Self-promotion via direct writes to user_profiles is blocked.
SELECT throws_ok($$ UPDATE public.user_profiles SET admin_granted_at = now()
                    WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1' $$,
  '42501', NULL, 'user cannot UPDATE themselves to admin');
SELECT throws_ok($$ UPDATE public.user_profiles SET trainer_granted_at = now()
                    WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1' $$,
  '42501', NULL, 'user cannot UPDATE themselves to trainer');
SELECT throws_ok($$ INSERT INTO public.user_profiles (user_id, admin_granted_at)
                    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', now()) $$,
  '42501', NULL, 'user cannot INSERT a profile row granting themselves admin');
SELECT throws_ok($$ INSERT INTO public.user_profiles (user_id, trainer_granted_at)
                    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', now()) $$,
  '42501', NULL, 'user cannot INSERT a profile row granting themselves trainer');

-- Tampering with someone else's profile is blocked.
SELECT throws_ok($$ UPDATE public.user_profiles SET admin_granted_at = now()
                    WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1' $$,
  '42501', NULL, 'user cannot modify another user profile');

-- Reading another user's profile is hidden by RLS.
SELECT is((SELECT count(*) FROM public.user_profiles WHERE user_id = :'V'), 0::bigint,
  'user cannot read another user profile row');

-- Cannot grant trainer (let alone admin) via the admin RPC without being an admin.
SELECT throws_ok($$ SELECT public.admin_set_trainer('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', true) $$,
  'P0001', 'NOT_AN_ADMIN', 'user cannot self-grant trainer via admin_set_trainer');

-- The one sanctioned write path persists consent but cannot escalate privileges.
SELECT lives_ok($$ SELECT public.save_user_consent(true, true) $$,
  'save_user_consent is the allowed self-write path');

RESET ROLE;
SELECT is((SELECT admin_granted_at FROM public.user_profiles WHERE user_id = :'X'), NULL,
  'save_user_consent never sets admin_granted_at');
SELECT is((SELECT trainer_granted_at FROM public.user_profiles WHERE user_id = :'X'), NULL,
  'save_user_consent never sets trainer_granted_at');

SELECT * FROM finish();
ROLLBACK;
