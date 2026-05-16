# Trainer Web App

A web application for trainers to manage teams, create workouts, and track athlete progress. Built with React, TypeScript, and Vite.

> **Note:** This is part of the Sports Athletic monorepo. For overall project setup and information about other packages (athlete-mobile, supabase), see the [README in the parent directory](../README.md).

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/installation)

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | URL of the Supabase instance (e.g. `http://localhost:54321` for local dev) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |
| `VITE_FEATURE_FLAG_DEBUG_SETTINGS_TAB_ENABLED` | No | Set to `true` to show the Settings tab with debug tooling (e.g. example data generation). Disabled by default. Do not enable in production. |

## Getting Started

```bash
pnpm install
pnpm dev
```

The web app runs at http://localhost:5173.

## Useful Commands

```bash
# Start development server
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint
```
