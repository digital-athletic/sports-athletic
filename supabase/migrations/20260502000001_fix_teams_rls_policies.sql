-- Fix F2: teams INSERT policy must enforce owner_id = auth.uid()
-- The old WITH CHECK (true) allowed spoofing any owner_id on insert.
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Fix F3: drop the broad team_invitations SELECT policy that exposed every
-- active invite code to any authenticated user. Invitation code lookup is
-- now handled exclusively via the admin client inside edge functions.
DROP POLICY IF EXISTS "Authenticated users can validate invite codes" ON team_invitations;

-- Fix F4: restrict increment_invite_use_count to service-role only.
-- The function is called exclusively via supabaseAdmin.rpc() inside edge
-- functions; no client-facing code should invoke it directly.
ALTER FUNCTION increment_invite_use_count(UUID) SET search_path = public;
REVOKE EXECUTE ON FUNCTION increment_invite_use_count(UUID) FROM PUBLIC;
