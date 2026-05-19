-- Fix update_consent_updated_at trigger to also fire on consent_analytics_accepted changes.
-- Previously only consent_privacy_accepted changes updated the audit timestamp,
-- leaving analytics consent updates invisible in the GDPR audit trail.

BEGIN;

CREATE OR REPLACE FUNCTION update_consent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.consent_privacy_accepted IS DISTINCT FROM OLD.consent_privacy_accepted)
     OR (NEW.consent_analytics_accepted IS DISTINCT FROM OLD.consent_analytics_accepted)
  THEN
    NEW.consent_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
