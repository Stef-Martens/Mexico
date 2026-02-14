-- Add admin role to app_members table

-- 1. Add is_admin column to app_members
ALTER TABLE app_members ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Set stef.m@hotmail.be as admin
UPDATE app_members
SET is_admin = true
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email = 'stef.m@hotmail.be'
);

-- 3. Don't create additional RLS policies on app_members (causes infinite recursion)
-- Instead, admin operations use SECURITY DEFINER functions below

-- 4. Create function to get all auth users with their membership status (for admin use)
CREATE OR REPLACE FUNCTION get_all_users_with_membership()
RETURNS TABLE (
  user_id uuid,
  email text,
  is_member boolean,
  is_admin boolean,
  created_at timestamptz
) 
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
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  -- Return all users with their membership status
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::text as email,
    (am.user_id IS NOT NULL) as is_member,
    COALESCE(am.is_admin, false) as is_admin,
    u.created_at as created_at
  FROM auth.users u
  LEFT JOIN app_members am ON u.id = am.user_id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to get user_id by email (for admin use)
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email text)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_id uuid;
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM app_members
    WHERE app_members.user_id = auth.uid()
    AND app_members.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  -- Get user id by email
  SELECT id INTO result_id
  FROM auth.users
  WHERE email = user_email;

  IF result_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', user_email;
  END IF;

  RETURN result_id;
END;
$$ LANGUAGE plpgsql;
