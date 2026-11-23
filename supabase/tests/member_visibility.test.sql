-- Who may see the membership and the display name of a group's members.
--
-- A plain member sees themselves and the group owner. The owner and the
-- co-owners see every member. The cross-group cases matter most: sharing one
-- group with somebody must reveal nothing about their other groups.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(20);

-- Group A: OWNER owns it, CO_OWNER is co-owner, MEMBER and MEMBER_OF_BOTH are
--          plain members.
-- Group B: OTHER_OWNER owns it, MEMBER_OF_BOTH and OTHER_MEMBER are plain
--          members.
-- OUTSIDER belongs to neither.
\set OWNER          '11111111-1111-1111-1111-111111111111'
\set CO_OWNER       '22222222-2222-2222-2222-222222222222'
\set MEMBER         '33333333-3333-3333-3333-333333333333'
\set MEMBER_OF_BOTH '88888888-8888-8888-8888-888888888888'
\set OUTSIDER       '44444444-4444-4444-4444-444444444444'
\set OTHER_OWNER    '66666666-6666-6666-6666-666666666666'
\set OTHER_MEMBER   '77777777-7777-7777-7777-777777777777'
\set GROUP_A        '55555555-5555-5555-5555-555555555551'
\set GROUP_B        '55555555-5555-5555-5555-555555555552'

INSERT INTO auth.users (id, email) VALUES
  (:'OWNER',          'owner.test@example.local'),
  (:'CO_OWNER',       'coowner.test@example.local'),
  (:'MEMBER',         'member.test@example.local'),
  (:'MEMBER_OF_BOTH', 'memberofboth.test@example.local'),
  (:'OUTSIDER',       'outsider.test@example.local'),
  (:'OTHER_OWNER',    'otherowner.test@example.local'),
  (:'OTHER_MEMBER',   'othermember.test@example.local');

INSERT INTO public.teams (id, name, owner_id) VALUES
  (:'GROUP_A', 'Group A', :'OWNER'),
  (:'GROUP_B', 'Group B', :'OTHER_OWNER');

INSERT INTO public.team_members (team_id, user_id, role) VALUES
  (:'GROUP_A', :'OWNER',          'owner'),
  (:'GROUP_A', :'CO_OWNER',       'co_owner'),
  (:'GROUP_A', :'MEMBER',         'member'),
  (:'GROUP_A', :'MEMBER_OF_BOTH', 'member'),
  (:'GROUP_B', :'OTHER_OWNER',    'owner'),
  (:'GROUP_B', :'MEMBER_OF_BOTH', 'member'),
  (:'GROUP_B', :'OTHER_MEMBER',   'member');

INSERT INTO public.team_member_details (user_id, display_name) VALUES
  (:'OWNER',          'Owner'),
  (:'CO_OWNER',       'Co-owner'),
  (:'MEMBER',         'Member'),
  (:'MEMBER_OF_BOTH', 'Member of both'),
  (:'OUTSIDER',       'Outsider'),
  (:'OTHER_OWNER',    'Other owner'),
  (:'OTHER_MEMBER',   'Other member');

SET LOCAL ROLE authenticated;

-- As a plain member of group A.
SET LOCAL "request.jwt.claim.sub" TO :'MEMBER';
SELECT set_eq(
  'SELECT user_id FROM public.team_members',
  ARRAY[:'MEMBER'::uuid, :'OWNER'::uuid],
  'member sees the membership of themselves and the owner only');
SELECT set_eq(
  'SELECT user_id FROM public.team_member_details',
  ARRAY[:'MEMBER'::uuid, :'OWNER'::uuid],
  'member sees the display name of themselves and the owner only');
SELECT is((SELECT count(*) FROM public.team_members WHERE user_id = :'MEMBER_OF_BOTH'), 0::bigint,
  'member does not see another member of the same group');
SELECT is((SELECT count(*) FROM public.team_members WHERE user_id = :'CO_OWNER'), 0::bigint,
  'member does not see a co-owner of the same group');
SELECT is((SELECT count(*) FROM public.team_member_details WHERE user_id = :'MEMBER_OF_BOTH'), 0::bigint,
  'member does not see the display name of another member');

-- As a member of both groups.
SET LOCAL "request.jwt.claim.sub" TO :'MEMBER_OF_BOTH';
SELECT set_eq(
  format('SELECT user_id FROM public.team_members WHERE team_id = %L', :'GROUP_A'),
  ARRAY[:'MEMBER_OF_BOTH'::uuid, :'OWNER'::uuid],
  'member of two groups sees themselves and the owner in group A');
SELECT set_eq(
  format('SELECT user_id FROM public.team_members WHERE team_id = %L', :'GROUP_B'),
  ARRAY[:'MEMBER_OF_BOTH'::uuid, :'OTHER_OWNER'::uuid],
  'member of two groups sees themselves and the owner in group B');
SELECT set_eq(
  'SELECT user_id FROM public.team_member_details',
  ARRAY[:'MEMBER_OF_BOTH'::uuid, :'OWNER'::uuid, :'OTHER_OWNER'::uuid],
  'member of two groups sees the display name of both owners');

-- As the owner of group A.
SET LOCAL "request.jwt.claim.sub" TO :'OWNER';
SELECT set_eq(
  format('SELECT user_id FROM public.team_members WHERE team_id = %L', :'GROUP_A'),
  ARRAY[:'OWNER'::uuid, :'CO_OWNER'::uuid, :'MEMBER'::uuid, :'MEMBER_OF_BOTH'::uuid],
  'owner sees every member of their group');
SELECT set_eq(
  'SELECT user_id FROM public.team_member_details',
  ARRAY[:'OWNER'::uuid, :'CO_OWNER'::uuid, :'MEMBER'::uuid, :'MEMBER_OF_BOTH'::uuid],
  'owner sees the display name of every member of their group');
SELECT is((SELECT count(*) FROM public.team_members WHERE team_id = :'GROUP_B'), 0::bigint,
  'owner does not see the membership of their member in another group');
SELECT is((SELECT count(*) FROM public.team_member_details WHERE user_id IN (:'OTHER_OWNER', :'OTHER_MEMBER')), 0::bigint,
  'owner does not see display names from a group they are not in');

-- As a co-owner of group A.
SET LOCAL "request.jwt.claim.sub" TO :'CO_OWNER';
SELECT set_eq(
  'SELECT user_id FROM public.team_members',
  ARRAY[:'OWNER'::uuid, :'CO_OWNER'::uuid, :'MEMBER'::uuid, :'MEMBER_OF_BOTH'::uuid],
  'co-owner sees every member of their group');
SELECT set_eq(
  'SELECT user_id FROM public.team_member_details',
  ARRAY[:'OWNER'::uuid, :'CO_OWNER'::uuid, :'MEMBER'::uuid, :'MEMBER_OF_BOTH'::uuid],
  'co-owner sees the display name of every member of their group');

-- As a user in no group.
SET LOCAL "request.jwt.claim.sub" TO :'OUTSIDER';
SELECT is((SELECT count(*) FROM public.team_members), 0::bigint,
  'outsider sees no membership');
SELECT set_eq(
  'SELECT user_id FROM public.team_member_details',
  ARRAY[:'OUTSIDER'::uuid],
  'outsider sees their own display name only');

-- Unauthenticated.
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claim.sub" TO '';
SELECT throws_ok('SELECT 1 FROM public.team_members',
  '42501', NULL, 'anon cannot read team_members');
SELECT throws_ok('SELECT 1 FROM public.team_member_details',
  '42501', NULL, 'anon cannot read team_member_details');

RESET ROLE;
SELECT is(has_function_privilege('authenticated', 'public.can_view_team_member(uuid,uuid)', 'EXECUTE'), true,
  'authenticated can EXECUTE can_view_team_member (required by the SELECT policy)');
SELECT is(has_function_privilege('anon', 'public.can_view_team_member(uuid,uuid)', 'EXECUTE'), false,
  'anon cannot EXECUTE can_view_team_member');

SELECT * FROM finish();
ROLLBACK;
