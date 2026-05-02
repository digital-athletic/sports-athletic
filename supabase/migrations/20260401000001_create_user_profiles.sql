-- Migration: Create user_profiles table with consent columns
-- Description: Adds a user_profiles table to store GDPR-relevant consent data
--   (consent_health_accepted, consent_privacy_accepted, consent_analytics_accepted)
--   with RLS and audit timestamps.
--   Closes #334.

BEGIN;

-- ============================================
-- 1. TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id                    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_privacy_accepted   BOOLEAN     NOT NULL DEFAULT FALSE,
  consent_analytics_accepted BOOLEAN     NOT NULL DEFAULT FALSE,
  consent_updated_at         TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. TRIGGERS
-- ============================================

-- Reuse existing update_updated_at_column() for the updated_at column.
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Set consent_updated_at whenever either consent column changes.
CREATE OR REPLACE FUNCTION update_consent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.consent_privacy_accepted IS DISTINCT FROM OLD.consent_privacy_accepted)
  THEN
    NEW.consent_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_consent_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_consent_updated_at();

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can insert their own profile row (e.g. during registration).
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own profile row.
CREATE POLICY "Users can read their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own profile row.
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
