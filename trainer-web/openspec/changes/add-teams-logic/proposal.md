# Change: Add Teams and Invitation Logic for Supabase

## Why
The app needs team functionality to allow users to create teams, invite others via invite codes, and join existing teams. The Firebase migration plan already defines the `teams` table schema (currently a disabled feature) that needs to be implemented in Supabase. This enables collaborative training tracking and future team-based features.

## What Changes
- Create `teams` Supabase table with owner, name, description, and short identifier
- Create `team_invitations` table for invite code management
- Create `team_members` join table for team membership
- Implement Row Level Security (RLS) policies for team data access
- Create API functions for:
  - Creating a team (generates invite code)
  - Generating/regenerating invite codes
  - Accepting an invitation (joining a team)
  - Listing team members
  - Leaving a team

## Impact
- Affected specs: New `teams` capability spec
- Affected code:
  - `supabase/` - New SQL migration files for tables, RLS, and database functions
- Integration: Trainer dashboard will consume these Supabase APIs directly
