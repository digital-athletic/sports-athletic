# Change: Migrate Video Storage to Supabase

## Why

Firebase Storage is being replaced by Supabase Storage as part of the broader Firebase-to-Supabase migration. Exercise demonstration videos currently served from Firebase Storage need to migrate to a Supabase Storage bucket for consistent backend infrastructure.

## What Changes

- **NEW**: Create `src/services/supabaseClient.ts` with Supabase client initialization
- **NEW**: Introduce `StorageService` in `src/services/` to abstract Supabase Storage operations
- **NEW**: Implement signed URL generation with configurable expiry (default: 1 hour)
- **NEW**: Add video bucket path constants to `sharedConstants.ts`
- **UPDATE**: Video player components receive time-limited signed URLs for streaming

### Prerequisites (Already Complete)

- Supabase backend running and accessible
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables configured
- `videos` bucket created in Supabase Storage (private)

### Security Model

The `videos` bucket is **private** by default. Access is granted via signed URLs with time-limited validity:
- Videos: Signed URLs with 1-hour expiry for streaming

### Out of Scope

- Exercise data JSON, skill trees, notification texts, pictures - separate proposals
- User-generated content uploads (workout details) - separate proposal
- Data migration tooling (bucket seeding scripts) - operational task
- CDN configuration - infrastructure task
- Legacy Firebase compatibility layer - not needed, implement new system directly

## Impact

- **Affected specs**: `storage` (new capability)
- **Affected code**:
  - `src/services/supabaseClient.ts` (new - Supabase client singleton)
  - `src/services/StorageService.ts` (new - Storage abstraction)
  - `src/constants/sharedConstants.ts` (bucket path constants)
  - `src/video/` components (consumer)
