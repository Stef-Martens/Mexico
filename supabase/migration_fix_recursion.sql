-- Fix infinite recursion in app_members policies

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can read all app_members" ON app_members;
DROP POLICY IF EXISTS "Admins can insert app_members" ON app_members;

-- The existing policies are sufficient:
-- "Users can read own app_members row" - users can see their own row
-- "Users can insert own app_members row" - users can self-insert

-- For admin operations, we'll use SECURITY DEFINER functions instead of policies
-- Those are already created in the migration (get_all_users_with_membership, get_user_id_by_email)

-- Create function for admins to add members (bypasses RLS)
CREATE OR REPLACE FUNCTION admin_add_member(target_user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM app_members
    WHERE app_members.user_id = auth.uid()
    AND app_members.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can add members';
  END IF;

  -- Check if user already exists
  IF EXISTS (
    SELECT 1 FROM app_members
    WHERE app_members.user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a member';
  END IF;

  -- Add the member
  INSERT INTO app_members (user_id)
  VALUES (target_user_id);

  RETURN true;
END;
$$ LANGUAGE plpgsql;
