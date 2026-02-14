-- Add DELETE policy for mexico_events (admin only)
-- This allows admins to delete mexico_events

CREATE POLICY "Admins can delete mexico_events"
  ON mexico_events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM app_members
      WHERE app_members.user_id = auth.uid()
      AND app_members.is_admin = true
    )
  );

-- Also add UPDATE policies for completeness (in case we need them later)
CREATE POLICY "Authenticated members can update players"
  ON players
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM app_members
      WHERE app_members.user_id = auth.uid()
    )
  );
