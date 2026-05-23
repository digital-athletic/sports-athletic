BEGIN;

CREATE OR REPLACE FUNCTION public.increment_invite_use_count(invitation_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.team_invitations
  SET use_count = use_count + 1
  WHERE id = invitation_id
  RETURNING use_count INTO new_count;

  RETURN new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_invite_use_count(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_invite_use_count(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_invite_use_count(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_invite_use_count(UUID) TO service_role;

COMMIT;
