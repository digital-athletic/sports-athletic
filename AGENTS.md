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
- **Package Manager**: pnpm, one independent project per app folder (own `pnpm-lock.yaml` and `pnpm-workspace.yaml`)

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

## TypeScript & Lint Strictness

- **Never use `// eslint-disable-next-line`, `// eslint-disable`, `// @ts-ignore`, or any other inline suppression comment.** If a lint or type error appears, fix the root cause.
- **`// @ts-expect-error` is only permitted when suppressing a known incompatibility in a third-party library** where the types are wrong and no workaround exists. It must always be accompanied by a comment explaining exactly why it is needed and why fixing it properly is not possible.
- All new code must use strict TypeScript types. Avoid `any` — use `unknown` and narrow safely, or introduce a proper type.

## Dependency Security (`pnpm audit`)

When `pnpm audit` reports vulnerabilities, fix them in this order:

1. **Bump the direct dependency first** — upgrade the package that pulls in the vulnerable transitive dep to a version that resolves it. This is the clean fix.
2. **Use `pnpm overrides` only as a last resort** — if bumping the origin lib is not possible (e.g. no release exists yet, or upgrading causes breaking changes that cannot be resolved), add an override in `package.json` to force the safe version of the transitive dep.

Never add an override if bumping the origin lib resolves the audit.
