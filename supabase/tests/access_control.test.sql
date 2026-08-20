-- access_control: cross-cutting invariants of the RPC access model.
--   * EXECUTE grant matrix per role (the "are permissions correctly given?" check)
--   * internal helpers are not directly callable
--   * direct table writes that the RPCs exist to mediate stay blocked
-- 42501 = insufficient_privilege, raised both by RLS violations and grant denials.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(16);

\set O '44444444-4444-4444-4444-444444444444'

INSERT INTO auth.users (id, email) VALUES (:'O', 'outsider.test@example.local');

-- Grant matrix (evaluated as postgres; independent of current role).
SELECT is(has_function_privilege('anon', 'public.create_team(text,text)', 'EXECUTE'), false,
  'anon cannot EXECUTE create_team');
SELECT is(has_function_privilege('authenticated', 'public.create_team(text,text)', 'EXECUTE'), true,
  'authenticated can EXECUTE create_team');
SELECT is(has_function_privilege('anon', 'public.delete_my_account()', 'EXECUTE'), false,
  'anon cannot EXECUTE delete_my_account');
SELECT is(has_function_privilege('authenticated', 'public.admin_set_trainer(uuid,boolean)', 'EXECUTE'), true,
  'authenticated can EXECUTE admin_set_trainer (gated internally)');
SELECT is(has_function_privilege('authenticated', 'public.gen_invite_code()', 'EXECUTE'), false,
  'authenticated cannot EXECUTE internal helper gen_invite_code');
SELECT is(has_function_privilege('authenticated', 'public.assert_admin()', 'EXECUTE'), false,
  'authenticated cannot EXECUTE internal helper assert_admin');
SELECT is(has_function_privilege('authenticated', 'public.assert_visible_team_owner(uuid)', 'EXECUTE'), false,
  'authenticated cannot EXECUTE internal helper assert_visible_team_owner');
SELECT is(has_function_privilege('anon', 'public.set_member_role(uuid,uuid,text)', 'EXECUTE'), false,
  'anon cannot EXECUTE set_member_role');
SELECT is(has_function_privilege('authenticated', 'public.set_member_role(uuid,uuid,text)', 'EXECUTE'), true,
  'authenticated can EXECUTE set_member_role');

-- can_view_athlete_data is a policy helper, not an RPC, but the policies are
-- evaluated as the caller, so authenticated needs EXECUTE on it.
SELECT is(has_function_privilege('authenticated', 'public.can_view_athlete_data(uuid)', 'EXECUTE'), true,
  'authenticated can EXECUTE can_view_athlete_data (required by the SELECT policies)');
SELECT is(has_function_privilege('anon', 'public.can_view_athlete_data(uuid)', 'EXECUTE'), false,
  'anon cannot EXECUTE can_view_athlete_data');

-- Direct writes and helper calls, as a real authenticated client.
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO :'O';

SELECT throws_ok($$ INSERT INTO public.teams (name, owner_id) VALUES ('hack','44444444-4444-4444-4444-444444444444') $$,
  '42501', NULL, 'direct INSERT into teams is blocked');
SELECT throws_ok($$ UPDATE public.user_profiles SET admin_granted_at = now() WHERE user_id = '44444444-4444-4444-4444-444444444444' $$,
  '42501', NULL, 'direct self-promotion via user_profiles.admin_granted_at is blocked');
SELECT throws_ok($$ SELECT public.gen_invite_code() $$,
  '42501', NULL, 'gen_invite_code is not directly callable by authenticated');
SELECT throws_ok($$ SELECT public.assert_admin() $$,
  '42501', NULL, 'assert_admin is not directly callable by authenticated');
SELECT throws_ok($$ SELECT public.assert_visible_team_owner('55555555-5555-5555-5555-555555555551') $$,
  '42501', NULL, 'assert_visible_team_owner is not directly callable by authenticated');

SELECT * FROM finish();
ROLLBACK;
