# Database tests

[pgTAP](https://pgtap.org/) tests for the SECURITY DEFINER RPC functions and the
RLS access model.

## Running

```bash
cd supabase
supabase test db
```

This runs every `*.test.sql` file against the local database. Each file runs in a
transaction that is rolled back, so the tests leave no data behind and are safe to
re-run.

To run a single file directly against any database:

```bash
psql "$DB_URL" -f tests/create_team.test.sql
```

## How the RPC tests impersonate users

The RPCs derive identity from `auth.uid()`, which reads the `request.jwt.claim.sub`
GUC. A test acts as a given user by `SET ROLE authenticated` plus
`SET LOCAL "request.jwt.claim.sub"`, so EXECUTE grants and RLS are enforced exactly
as a real PostgREST client would experience them. The tests drop to `RESET ROLE`
(postgres) only to seed fixtures and to read protected rows for assertions.
