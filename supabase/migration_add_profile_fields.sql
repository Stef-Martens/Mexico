-- Add user_id and avatar_url to players table
-- This links players to auth users and allows profile pictures

ALTER TABLE players 
ADD COLUMN user_id uuid REFERENCES auth.users(id) UNIQUE,
ADD COLUMN avatar_url text;

-- Create index for user_id lookups
CREATE INDEX idx_players_user_id ON players(user_id);

-- Update RLS policy to allow users to update their own player profile
CREATE POLICY "Users can update own player profile"
  ON players
  FOR UPDATE
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM app_members
      WHERE app_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM app_members
      WHERE app_members.user_id = auth.uid()
    )
  );
