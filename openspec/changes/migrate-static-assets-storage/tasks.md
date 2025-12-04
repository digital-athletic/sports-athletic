# Tasks: Migrate Video Storage

## 1. Infrastructure Setup

- [ ] 1.1 Create `videos` bucket in Supabase (private)
- [ ] 1.2 Configure bucket RLS policies to allow signed URL generation
  - Add SELECT policy on `storage.objects` for `bucket_id = 'videos'`
  - Policy should allow `anon` role to enable signed URL generation
- [ ] 1.3 Upload existing video assets to Supabase bucket (operational)

## 2. Supabase Client Setup

- [ ] 2.1 Install Supabase dependencies: `pnpm add @supabase/supabase-js react-native-url-polyfill`
- [ ] 2.2 Create `src/services/supabaseClient.ts` with singleton client initialization
  - Import `react-native-url-polyfill/auto` for React Native compatibility
  - Configure with AsyncStorage for session persistence
  - Export typed Supabase client instance
- [ ] 2.3 Add Supabase credentials to `src/constants/sharedConstants.ts`:
  - `SUPABASE_URL`: Project URL (e.g., `https://<project-ref>.supabase.co`)
  - `SUPABASE_ANON_KEY`: Public anonymous key from Supabase dashboard → Settings → API
- [ ] 2.4 Add `.env.example` with placeholder credentials for documentation

## 3. StorageService Implementation

- [ ] 3.1 Create `src/services/StorageService.ts` importing Supabase client
- [ ] 3.2 Implement `createSignedUrl(bucket, path, expiresIn)` for time-limited URL generation
  - Uses `supabase.storage.from(bucket).createSignedUrl(path, expiresIn)`
  - Default expiry: 3600 seconds (1 hour)
- [ ] 3.3 Implement `getSignedVideoUrl(path, expiresIn)` for video URLs with configurable expiry
- [ ] 3.4 Implement URL caching to avoid regenerating signed URLs within validity window
  - Cache key: bucket + path
  - Refresh when cached URL is within 5 minutes of expiry
- [ ] 3.5 Add error handling and logging for storage operations
- [ ] 3.6 Write unit tests for `StorageService`

## 4. Constants and Configuration

- [ ] 4.1 Add Supabase video bucket name constant: `SUPABASE_VIDEO_BUCKET = 'videos'`
- [ ] 4.2 Add video path mapping (Firebase `Videos/` → Supabase path)

## 5. Video Component Integration

- [ ] 5.1 Update video player components to use `StorageService` for video URLs
- [ ] 5.2 Handle signed URL expiry and refresh in video components

## 6. Validation and Testing

- [ ] 6.1 Test Supabase client connection with anon key
- [ ] 6.2 Test video URL generation from Supabase
- [ ] 6.3 Test video streaming with signed URLs
- [ ] 6.4 Test signed URL expiry behavior
- [ ] 6.5 Run E2E test of video playback flow
