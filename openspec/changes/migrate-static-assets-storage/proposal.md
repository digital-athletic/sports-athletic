# Change: Migrate Video Storage to Supabase

## Why

Firebase Storage is being replaced by Supabase Storage as part of the broader Firebase-to-Supabase migration. Exercise demonstration videos currently served from Firebase Storage need to migrate to a Supabase Storage bucket for consistent backend infrastructure.

## What Changes

- **NEW**: Create `src/services/supabaseClient.ts` with Supabase client initialization using `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- **NEW**: Add Supabase credentials (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) to `sharedConstants.ts`
- **NEW**: Introduce `StorageService` in `src/services/` to abstract Supabase Storage operations
- **NEW**: Configure `videos` bucket in Supabase Storage (private) with RLS policy for signed URL generation
- **NEW**: Implement signed URL generation with configurable expiry (default: 1 hour)
- **NEW**: Add video bucket path constants to `sharedConstants.ts`
- **UPDATE**: Video player components receive time-limited signed URLs for streaming

### Security Model

The `videos` bucket is **private** by default. Access is granted via signed URLs with time-limited validity:
- Videos: Signed URLs with 1-hour expiry for streaming

### Out of Scope

- Exercise data JSON, skill trees, notification texts, pictures - separate proposals
- User-generated content uploads (workout details) - separate proposal
- Data migration tooling (bucket seeding scripts) - operational task
- CDN configuration - infrastructure task

## Impact

- **Affected specs**: `storage` (new capability)
- **Affected code**:
  - `src/services/supabaseClient.ts` (new - Supabase client singleton)
  - `src/services/StorageService.ts` (new - Storage abstraction)
  - `src/constants/sharedConstants.ts` (Supabase credentials + bucket paths)
  - `src/video/` components (consumer)
  - `legacy/services/FirebaseStorageService.js` (video methods to be deprecated)
