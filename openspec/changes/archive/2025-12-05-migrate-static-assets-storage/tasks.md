# Tasks: Migrate Video Storage

## 1. Infrastructure Setup (Complete)

- [x] 1.1 Create `videos` bucket in Supabase (public)
- [x] 1.2 Create `images` bucket in Supabase (public)
- [x] 1.3 `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` environment variables configured

## 2. Supabase Client Setup (Complete)

- [x] 2.1 Install Supabase dependencies: `pnpm add @supabase/supabase-js react-native-url-polyfill`
- [x] 2.2 Create `src/services/supabaseClient.ts` with singleton client initialization
  - Import `react-native-url-polyfill/auto` for React Native compatibility
  - Configure with AsyncStorage for session persistence
  - Export typed Supabase client instance

## 3. StorageService Implementation (Complete)

- [x] 3.1 Create `src/services/StorageService.ts` importing Supabase client
- [x] 3.2 Implement `getPublicUrl(bucket, path)` for public URL generation
  - Uses `supabase.storage.from(bucket).getPublicUrl(path)`
- [x] 3.3 Implement `getVideoUrl(path)` for video URLs
- [x] 3.4 Implement `getImageUrl(path)` for image URLs

## 4. Constants and Configuration (Complete)

- [x] 4.1 Add Supabase video bucket name constant: `SUPABASE_VIDEO_BUCKET = 'videos'`
- [x] 4.2 Add Supabase image bucket name constant: `SUPABASE_IMAGE_BUCKET = 'images'`
