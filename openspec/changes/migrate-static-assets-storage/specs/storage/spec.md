# Capability: Storage

Video storage for the Sports Athletic application via Supabase Storage with signed URLs.

## ADDED Requirements

### Requirement: Supabase Client Initialization

The system SHALL initialize a Supabase client for Storage operations using project credentials.

#### Scenario: Initialize Supabase client with environment configuration

- **WHEN** the application starts
- **THEN** the Supabase client is initialized using `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`
- **AND** the `SUPABASE_URL` is the project URL (e.g., `https://<project-ref>.supabase.co`)
- **AND** the `SUPABASE_ANON_KEY` is the public anonymous key from Supabase project settings
- **AND** the client is configured with AsyncStorage for React Native session persistence

#### Scenario: Supabase credentials stored in environment configuration

- **WHEN** configuring Supabase credentials
- **THEN** the `SUPABASE_URL` is stored in `sharedConstants.ts` or environment variables
- **AND** the `SUPABASE_ANON_KEY` is stored in `sharedConstants.ts` or environment variables
- **AND** credentials are NOT committed to version control if using `.env` files

#### Scenario: Supabase client singleton pattern

- **WHEN** multiple components or services need Supabase access
- **THEN** a single Supabase client instance is exported from `src/services/supabaseClient.ts`
- **AND** the client is reused across the application to avoid multiple connections

### Requirement: Signed URL Generation

The system SHALL generate time-limited signed URLs for accessing videos stored in a private Supabase Storage bucket.

#### Scenario: Generate signed URL with default expiry

- **WHEN** the application requests a signed URL for a video
- **THEN** the StorageService generates a signed URL using `supabase.storage.from(bucket).createSignedUrl(path, expiresIn)`
- **AND** the default expiry is 3600 seconds (1 hour)
- **AND** the returned URL is valid for the specified duration

#### Scenario: Generate signed URL with custom expiry

- **WHEN** the application requests a signed URL with a custom expiry time
- **THEN** the StorageService generates a signed URL with the specified expiry in seconds
- **AND** the URL becomes invalid after the expiry period

#### Scenario: Signed URL caching

- **WHEN** the application requests a signed URL for the same video within the validity window
- **THEN** the StorageService returns a cached signed URL
- **AND** does not generate a new signed URL unless the cached one is near expiry (within 5 minutes)

### Requirement: Signed Video URL Generation

The system SHALL generate signed URLs for video assets for use in video player components.

#### Scenario: Generate signed video URL

- **WHEN** the application needs to play an exercise video
- **THEN** the StorageService generates a signed URL for the video in the `videos` bucket
- **AND** the URL is valid for 1 hour by default
- **AND** the URL is directly usable in Video player components

### Requirement: Private Bucket Configuration

The system SHALL store videos in a private Supabase Storage bucket accessible only via signed URLs.

#### Scenario: Videos bucket is private

- **WHEN** an unauthenticated user attempts direct access to a video in the `videos` bucket without a signed URL
- **THEN** the request is denied with a 403 or 401 error
- **AND** access is only granted via valid signed URLs

#### Scenario: RLS policy enables signed URL generation

- **WHEN** the `videos` bucket is configured in Supabase
- **THEN** an RLS policy on `storage.objects` grants SELECT permission for the bucket
- **AND** the policy allows the `anon` role to generate signed URLs (e.g., `bucket_id = 'videos'`)
- **AND** direct object access without a signed URL remains blocked

#### Scenario: Signed URL generation uses anon key

- **WHEN** the application generates a signed URL for a video
- **THEN** the Supabase client uses the `SUPABASE_ANON_KEY` (not service role key)
- **AND** the RLS policy on `storage.objects` permits the operation
- **AND** the signed URL contains a time-limited token for direct file access

### Requirement: Video Path Mapping

The system SHALL map legacy Firebase Storage video paths to Supabase Storage paths.

#### Scenario: Videos path mapping

- **WHEN** requesting a video previously at `Videos/{filename}`
- **THEN** the StorageService maps to `{filename}` in the `videos` bucket

### Requirement: Error Handling

The system SHALL handle storage errors gracefully and provide meaningful error information.

#### Scenario: Video not found

- **WHEN** the application requests a non-existent video
- **THEN** the StorageService throws a descriptive error
- **AND** the error includes the requested path for debugging

#### Scenario: Signed URL generation failure

- **WHEN** signed URL generation fails due to invalid bucket or path
- **THEN** the StorageService throws a descriptive error
- **AND** logs the failure for debugging

#### Scenario: Expired signed URL access

- **WHEN** a client attempts to access a video using an expired signed URL
- **THEN** the storage returns a 403 or 401 error
- **AND** the application should request a new signed URL

#### Scenario: Network failure during video access

- **WHEN** a network error occurs during video streaming via signed URL
- **THEN** the video player handles the error gracefully
- **AND** the error indicates a network/connectivity issue
