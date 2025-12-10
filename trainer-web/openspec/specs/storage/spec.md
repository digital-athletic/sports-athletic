# storage Specification

## Purpose
TBD - created by archiving change migrate-static-assets-storage. Update Purpose after archive.
## Requirements
### Requirement: Supabase Client Initialization

The system SHALL initialize a Supabase client for Storage operations using environment credentials.

#### Scenario: Initialize Supabase client

- **WHEN** the application starts
- **THEN** the Supabase client is initialized using `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`
- **AND** the client is configured with AsyncStorage for React Native session persistence

#### Scenario: Supabase client singleton pattern

- **WHEN** multiple components or services need Supabase access
- **THEN** a single Supabase client instance is exported from `src/services/supabaseClient.ts`
- **AND** the client is reused across the application to avoid multiple connections

### Requirement: Public URL Generation

The system SHALL generate public URLs for accessing assets stored in public Supabase Storage buckets.

#### Scenario: Generate public URL for video

- **WHEN** the application requests a URL for a video
- **THEN** the StorageService generates a public URL using `supabase.storage.from(bucket).getPublicUrl(path)`
- **AND** the returned URL is permanently accessible

#### Scenario: Generate public URL for image

- **WHEN** the application requests a URL for an image
- **THEN** the StorageService generates a public URL using `supabase.storage.from(bucket).getPublicUrl(path)`
- **AND** the returned URL is permanently accessible

### Requirement: Public Video URL Generation

The system SHALL generate public URLs for video assets for use in video player components.

#### Scenario: Generate public video URL

- **WHEN** the application needs to play an exercise video
- **THEN** the StorageService generates a public URL for the video in the `videos` bucket
- **AND** the URL is directly usable in Video player components

### Requirement: Public Image URL Generation

The system SHALL generate public URLs for image assets for use in image components.

#### Scenario: Generate public image URL

- **WHEN** the application needs to display an image
- **THEN** the StorageService generates a public URL for the image in the `images` bucket
- **AND** the URL is directly usable in Image components

### Requirement: Public Bucket Configuration

The system SHALL store assets in public Supabase Storage buckets accessible without authentication.

#### Scenario: Videos bucket is public

- **WHEN** a user accesses a video URL
- **THEN** the video is accessible without authentication
- **AND** no signed URL or token is required

#### Scenario: Images bucket is public

- **WHEN** a user accesses an image URL
- **THEN** the image is accessible without authentication
- **AND** no signed URL or token is required

### Requirement: Video Path Resolution

The system SHALL resolve video paths within the Supabase `videos` bucket.

#### Scenario: Resolve video path

- **WHEN** requesting a video by filename
- **THEN** the StorageService resolves the path within the `videos` bucket

### Requirement: Image Path Resolution

The system SHALL resolve image paths within the Supabase `images` bucket.

#### Scenario: Resolve image path

- **WHEN** requesting an image by filename
- **THEN** the StorageService resolves the path within the `images` bucket

### Requirement: Error Handling

The system SHALL handle storage errors gracefully and provide meaningful error information.

#### Scenario: Asset not found

- **WHEN** the application requests a non-existent asset
- **THEN** the storage returns a 404 error when the URL is accessed
- **AND** the application should handle the error gracefully

#### Scenario: Network failure during asset access

- **WHEN** a network error occurs during asset loading
- **THEN** the component handles the error gracefully
- **AND** the error indicates a network/connectivity issue

