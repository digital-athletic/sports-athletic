# AGENTS.md

## Project Overview

Fitness training platform monorepo with mobile app, web dashboard, and Supabase backend.

## Folder Structure

```
/workspace
├── athlete-mobile/     # React Native (Expo) - Athlete mobile app
├── trainer-web/        # React (Vite) - Trainer web dashboard
├── supabase/           # Backend: Edge functions + DB migrations
└── docker-compose.yml  # Local dev orchestration
```

## Tech Stack

- **Mobile**: React Native, Expo, Zustand, Zod
- **Web**: React, Vite, TypeScript
- **Backend**: Supabase (Postgres, Edge Functions)
- **Package Manager**: pnpm workspaces

## Important Constraints

- **Running inside Docker container** - No `docker` or `docker-compose` commands available
- Use `pnpm` for all package operations
- Supabase CLI available for DB/function work

## Key Directories

| Path | Purpose |
|------|---------|
| `athlete-mobile/src/features/` | Feature modules (domain logic) |
| `athlete-mobile/src/store/` | Zustand state stores |
| `athlete-mobile/src/services/` | API/Supabase clients |
| `trainer-web/src/components/` | Web UI components |
| `supabase/functions/` | Edge functions |
| `supabase/migrations/` | Database migrations |

## Development Commands

```bash
# Mobile
cd athlete-mobile && pnpm start

# Web
cd trainer-web && pnpm dev

# Supabase functions
cd supabase && supabase functions serve
```
