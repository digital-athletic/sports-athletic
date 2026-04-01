-- Rename consent_terms_and_privacy_accepted to consent_privacy_accepted.
ALTER TABLE user_profiles
  RENAME COLUMN consent_terms_and_privacy_accepted TO consent_privacy_accepted;

-- Update the consent_updated_at trigger to reference the renamed column.
CREATE OR REPLACE FUNCTION update_consent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.consent_health_accepted IS DISTINCT FROM OLD.consent_health_accepted)
     OR (NEW.consent_privacy_accepted IS DISTINCT FROM OLD.consent_privacy_accepted)
  THEN
    NEW.consent_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
