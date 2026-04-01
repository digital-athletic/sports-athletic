-- Rename consent_analytics to consent_analytics_accepted for consistency.
ALTER TABLE user_profiles
  RENAME COLUMN consent_analytics TO consent_analytics_accepted;
