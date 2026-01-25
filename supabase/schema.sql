-- Mexico App Database Schema

-- 1. Create tables
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mexico_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE mexico_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_members ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- app_members policies: users can read their own row
CREATE POLICY "Users can read own app_members row"
  ON app_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Optional: allow users to insert their own row on first login
CREATE POLICY "Users can insert own app_members row"
  ON app_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- players policies: allow select/insert only if user is in app_members
CREATE POLICY "Authenticated members can read players"
  ON players
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_members
      WHERE app_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated members can insert players"
  ON players
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_members
      WHERE app_members.user_id = auth.uid()
    )
  );

-- mexico_events policies: allow select/insert only if user is in app_members
CREATE POLICY "Authenticated members can read mexico_events"
  ON mexico_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_members
      WHERE app_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated members can insert mexico_events"
  ON mexico_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_members
      WHERE app_members.user_id = auth.uid()
    )
  );

-- 4. Insert default players (hardcoded list)
INSERT INTO players (name) VALUES
  ('Alice'),
  ('Bob'),
  ('Charlie'),
  ('Diana'),
  ('Eve')
ON CONFLICT DO NOTHING;

-- 5. Manual step: Add users to app_members
-- After a user signs in for the first time, you can manually add them:
-- INSERT INTO app_members (user_id) VALUES ('user-uuid-here');
-- 
-- Or use the policy above to allow self-insertion.
-- You can get the user's UUID from the Supabase Auth dashboard.
