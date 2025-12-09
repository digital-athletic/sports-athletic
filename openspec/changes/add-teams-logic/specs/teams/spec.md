## ADDED Requirements

### Requirement: Teams Database Schema

The system SHALL provide PostgreSQL tables for team management in Supabase.

#### Scenario: Teams table exists with required columns

- **WHEN** the database is initialized
- **THEN** a `teams` table exists with columns: `id` (UUID PK), `name` (TEXT NOT NULL), `description` (TEXT), `owner_id` (UUID FK to auth.users), `created_at`, `updated_at`
- **AND** `owner_id` has ON DELETE CASCADE

#### Scenario: Team members table exists

- **WHEN** the database is initialized
- **THEN** a `team_members` table exists with columns: `id` (UUID PK), `team_id` (UUID FK), `user_id` (UUID FK), `role` (TEXT), `joined_at`
- **AND** a unique constraint exists on (team_id, user_id)

#### Scenario: Team invitations table exists

- **WHEN** the database is initialized
- **THEN** a `team_invitations` table exists with columns: `id` (UUID PK), `team_id` (UUID FK), `code` (TEXT UNIQUE), `created_by` (UUID FK), `expires_at`, `max_uses`, `use_count`, `is_active`, `created_at`

### Requirement: Team Creation

The system SHALL allow authenticated users to create a new team.

#### Scenario: Create team successfully

- **WHEN** an authenticated user calls createTeam with a team name
- **THEN** a new team record is created with the user as owner_id
- **AND** the user is added to team_members with role='owner'
- **AND** an initial invite code is generated
- **AND** the team data including invite code is returned

#### Scenario: Create team with description

- **WHEN** an authenticated user calls createTeam with name and description
- **THEN** both name and description are stored in the team record

#### Scenario: Create team fails without authentication

- **WHEN** an unauthenticated user attempts to create a team
- **THEN** the operation fails with an authentication error

### Requirement: Invite Code Generation

The system SHALL generate unique alphanumeric invite codes for teams.

#### Scenario: Generate invite code format

- **WHEN** an invite code is generated
- **THEN** the code is 6 characters long
- **AND** the code contains only uppercase letters and numbers
- **AND** the code is unique across all team_invitations

#### Scenario: Generate invite code with expiration

- **WHEN** generateInviteCode is called with an expiration date
- **THEN** the invite code record has expires_at set to the specified date

#### Scenario: Generate invite code with max uses

- **WHEN** generateInviteCode is called with max_uses option
- **THEN** the invite code record has max_uses set to the specified limit

#### Scenario: Only team owner can generate codes

- **WHEN** a non-owner team member attempts to generate an invite code
- **THEN** the operation fails with a permission error

### Requirement: Invitation Acceptance

The system SHALL allow users to join a team using a valid invite code.

#### Scenario: Accept valid invitation

- **WHEN** a user provides a valid, active invite code
- **THEN** the user is added to team_members with role='member'
- **AND** the invitation use_count is incremented
- **AND** the membership record is returned

#### Scenario: Reject expired invitation

- **WHEN** a user provides an invite code that has passed its expires_at
- **THEN** the operation fails with an expiration error
- **AND** the user is not added to the team

#### Scenario: Reject max uses exceeded

- **WHEN** a user provides an invite code where use_count >= max_uses
- **THEN** the operation fails with a limit exceeded error
- **AND** the user is not added to the team

#### Scenario: Reject inactive invitation

- **WHEN** a user provides an invite code where is_active is false
- **THEN** the operation fails with an invalid code error

#### Scenario: Reject invalid code

- **WHEN** a user provides a code that does not exist
- **THEN** the operation fails with a not found error

#### Scenario: Prevent duplicate membership

- **WHEN** a user already a member of a team tries to accept an invite to the same team
- **THEN** the operation fails with an already member error

### Requirement: Team Membership Management

The system SHALL allow users to view and manage their team membership.

#### Scenario: List team members

- **WHEN** a team member requests the member list
- **THEN** all members of the team are returned with their user_id, role, and joined_at

#### Scenario: Leave team as member

- **WHEN** a member (non-owner) calls leaveTeam
- **THEN** the user is removed from team_members
- **AND** the team continues to exist

#### Scenario: Leave team as owner

- **WHEN** the owner calls leaveTeam and other members exist
- **THEN** ownership is transferred to the longest-standing member
- **AND** the original owner is removed from team_members

#### Scenario: Delete team when owner leaves empty team

- **WHEN** the owner calls leaveTeam and no other members exist
- **THEN** the team is deleted
- **AND** all associated invitations are deleted

### Requirement: Row Level Security

The system SHALL enforce data access via Supabase RLS policies.

#### Scenario: Users can view their own teams

- **WHEN** a user queries the teams table
- **THEN** only teams where the user is a member are returned

#### Scenario: Team owners can update their teams

- **WHEN** a team owner updates team name or description
- **THEN** the update succeeds

#### Scenario: Non-owners cannot update teams

- **WHEN** a non-owner team member attempts to update team data
- **THEN** the update fails with a permission error

#### Scenario: Anyone can validate invite codes

- **WHEN** any authenticated user queries team_invitations by code
- **THEN** basic code validation info is returned (exists, is_active, expired)
- **AND** sensitive details like use_count are not exposed to non-owners

### Requirement: One Team Per User Constraint

The system SHALL limit users to membership in one team at a time.

#### Scenario: User can only join one team

- **WHEN** a user who is already a team member tries to join another team
- **THEN** the operation fails with an already in team error
- **AND** the user must leave their current team first

#### Scenario: Creating a team when already in a team

- **WHEN** a user who is already a team member tries to create a new team
- **THEN** the operation fails with an already in team error

### Requirement: Trainer Dashboard Team Management

The system SHALL provide Edge Functions callable from the trainer dashboard to manage teams.

#### Scenario: Trainer creates a new team from dashboard

- **WHEN** a trainer calls the `POST /functions/v1/create-team` endpoint with a team name
- **THEN** a new team is created with the trainer as owner
- **AND** the trainer is added to team_members with role='owner'
- **AND** an initial invite code is automatically generated
- **AND** the team data including the invite code is returned

#### Scenario: Trainer generates invite code from dashboard

- **WHEN** a trainer who owns a team calls the `POST /functions/v1/generate-invite-code` endpoint
- **THEN** a new unique 6-character invite code is generated for the team
- **AND** the invite code is returned to display in the dashboard

#### Scenario: Trainer views team invite code in dashboard

- **WHEN** a trainer queries their team data
- **THEN** the active invite code for the team is accessible
- **AND** the trainer can share this code with athletes to join the team

### Requirement: Edge Functions API

The system SHALL provide Supabase Edge Functions as HTTP endpoints for team operations.

#### Scenario: Edge Functions require authentication

- **WHEN** a request is made to any team Edge Function without a valid Bearer token
- **THEN** the request fails with a 401 Unauthorized error

#### Scenario: Edge Functions handle CORS

- **WHEN** a preflight OPTIONS request is made to any Edge Function
- **THEN** appropriate CORS headers are returned
- **AND** the actual request can proceed from allowed origins

#### Scenario: Edge Functions return JSON responses

- **WHEN** any Edge Function completes successfully or fails
- **THEN** the response body is valid JSON
- **AND** error responses include an `error` field with a descriptive message
