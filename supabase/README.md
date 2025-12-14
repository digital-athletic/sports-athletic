# Supabase Backend

This directory contains the Supabase backend configuration for the Sports Athletic platform, including the PostgreSQL database schema, migrations, and Edge Functions.

> **Note:** This is part of the Sports Athletic monorepo. For overall project setup and information about other packages (athlete-mobile, trainer-web), see the [README in the parent directory](../README.md).

## Prerequisites

### Install Supabase CLI

The Supabase CLI is required to run the local development environment.

**macOS (Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Verify installation:**
```bash
supabase --version
```

## Getting Started

### Start Local Supabase

Navigate to the parent directory (monorepo root) and run:

```bash
cd ..
supabase start
```

### Start Edge Functions

To serve Edge Functions locally (from the monorepo root):

```bash
supabase functions serve
```

### Stop Supabase

```bash
supabase stop
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Guide](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Database Migrations](https://supabase.com/docs/guides/local-development/cli/managing-database-migrations)
