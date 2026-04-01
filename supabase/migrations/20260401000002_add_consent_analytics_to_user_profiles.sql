-- Rename consent columns for consistency, and add analytics consent column to user_profiles.
ALTER TABLE user_profiles
  RENAME COLUMN consent_terms_privacy TO consent_terms_and_privacy_accepted;

ALTER TABLE user_profiles
  RENAME COLUMN consent_health_use TO consent_health_accepted;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS consent_analytics boolean NOT NULL DEFAULT false;
