## 1. Database Setup

- [x] 1.1 Create SQL migration file for `teams` table
- [x] 1.2 Create SQL migration file for `team_members` table
- [x] 1.3 Create SQL migration file for `team_invitations` table
- [x] 1.4 Create indexes for efficient querying
- [x] 1.5 Create `updated_at` trigger function for teams table

## 2. Row Level Security

- [x] 2.1 Create RLS policy: users can SELECT teams where they are members
- [x] 2.2 Create RLS policy: team owners can UPDATE/DELETE their teams
- [x] 2.3 Create RLS policy: authenticated users can INSERT teams (become owner)
- [x] 2.4 Create RLS policy: users can SELECT team_members for their teams
- [x] 2.5 Create RLS policy: team owners can INSERT/DELETE team_members
- [x] 2.6 Create RLS policy: authenticated users can validate invite codes
- [x] 2.7 Create RLS policy: team owners can manage invitations

## 3. Edge Functions

- [x] 3.1 Create shared utilities (`_shared/supabase.ts`, `_shared/cors.ts`, `_shared/invite-code.ts`)
- [x] 3.2 Create Edge Function `create-team` - creates team + owner membership + invite
- [x] 3.3 Create Edge Function `generate-invite-code` - generates unique 6-char code for team
- [x] 3.4 Create Edge Function `accept-invitation` - validates code and joins team
- [x] 3.5 Create Edge Function `leave-team` - handles ownership transfer or deletion

## 4. Testing

- [ ] 4.1 Test RLS policies via Supabase client
- [ ] 4.2 Test Edge Functions via HTTP requests
- [ ] 4.3 Test invite code generation uniqueness
- [ ] 4.4 Test invitation acceptance edge cases (expired, max uses, inactive)
- [ ] 4.5 Test ownership transfer on owner leave
