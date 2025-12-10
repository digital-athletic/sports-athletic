## Context

This design implements team management functionality in Supabase with a normalized PostgreSQL schema and proper RLS. The trainer dashboard will use these APIs to create teams and generate invite codes for athletes.

## Goals / Non-Goals

**Goals:**
- Create teams with auto-generated invite codes
- Allow users to join teams via invite code
- Track team membership with roles (owner vs member)
- Secure data access via RLS (users see only their teams)

**Non-Goals:**
- Team chat/messaging (separate future feature)
- Team workouts (separate future feature)
- Email-based invitations (out of scope per requirements)
- Multiple teams per user (one team at a time for simplicity)

## Decisions

### Decision 1: Separate `team_invitations` table vs column on `teams`

**Choice:** Separate `team_invitations` table

**Rationale:**
- Allows multiple invite codes per team (e.g., different expiration dates)
- Can track who created each invite and usage count
- Enables future invite-specific features (single-use codes, role-based invites)
- Cleaner audit trail

### Decision 2: Invite code format

**Choice:** 6-character alphanumeric uppercase codes (e.g., `ABC123`)

**Rationale:**
- Easy to type and share verbally
- 36^6 = ~2 billion combinations (sufficient for app scale)
- Case-insensitive for user-friendliness

### Decision 3: Team membership via join table vs FK on profiles

**Choice:** Separate `team_members` join table

**Rationale:**
- Cleaner than adding `team_id` FK to profiles (separation of concerns)
- Allows storing membership metadata (joined_at, role)
- Easier to extend for multiple teams per user in future
- Better for RLS policies

### Decision 4: RLS Policy Strategy

**Choice:** Row-level security based on team membership

**Policies:**
1. `teams`: Owner can manage, members can view
2. `team_members`: Users can view members of their teams, owners can manage
3. `team_invitations`: Only team owners can create/manage invites, public can validate codes

## Database Schema

```sql
-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team members join table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team invitations table
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_invitations_code ON team_invitations(code);
CREATE INDEX idx_team_invitations_team_id ON team_invitations(team_id);
```

### Decision 5: Edge Functions vs PostgreSQL RPC Functions

**Choice:** Supabase Edge Functions (TypeScript/Deno)

**Rationale:**
- TypeScript is easier to maintain and test than PL/pgSQL
- Better error handling and debugging capabilities
- Familiar syntax for the trainer dashboard team
- The business logic is simple CRUD, not complex queries
- Easier to extend with additional validation or integrations

## Edge Functions (Supabase Functions)

All functions are HTTP endpoints that require Bearer token authentication.

### `POST /functions/v1/create-team`

**Request:**
```json
{ "name": "Team Name", "description": "Optional description" }
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Team Name",
  "description": "Optional description",
  "owner_id": "user-uuid",
  "invite_code": "ABC123",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### `POST /functions/v1/generate-invite-code`

**Request:**
```json
{
  "team_id": "uuid",
  "expires_at": "2024-12-31T23:59:59Z",  // optional
  "max_uses": 10  // optional
}
```

**Response (201):**
```json
{
  "code": "XYZ789",
  "expires_at": "2024-12-31T23:59:59Z",
  "max_uses": 10,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### `POST /functions/v1/accept-invitation`

**Request:**
```json
{ "code": "ABC123" }
```

**Response (201):**
```json
{
  "member_id": "uuid",
  "team_id": "uuid",
  "team_name": "Team Name",
  "user_id": "user-uuid",
  "role": "member",
  "joined_at": "2024-01-01T00:00:00Z"
}
```

### `POST /functions/v1/leave-team`

**Request:**
```json
{ "team_id": "uuid" }
```

**Response (200):**
```json
{ "action": "left_team", "team_id": "uuid" }
// or
{ "action": "ownership_transferred", "new_owner_id": "uuid", "team_id": "uuid" }
// or
{ "action": "team_deleted", "team_id": "uuid" }
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Invite code collisions | Use retry loop with unique constraint |
| Orphaned teams | Cascade delete or ownership transfer |
| RLS complexity | Thorough testing, simple policies |

## Deployment Plan

1. Deploy database schema (tables, indexes, RLS)
2. Deploy Edge Functions
3. Integrate with trainer dashboard (separate change)

## Open Questions

1. Should team deletion cascade to all members immediately, or soft-delete?
   - **Recommendation:** Hard delete with cascade

2. Should users be limited to one team at a time?
   - **Recommendation:** Yes, for simplicity. Can extend later.

3. Should invite codes expire by default?
   - **Recommendation:** No default expiration, but support optional expiration
