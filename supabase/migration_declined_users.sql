-- Track users whose access request was declined by an admin

CREATE TABLE IF NOT EXISTS declined_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  declined_at timestamptz DEFAULT now(),
  declined_by uuid REFERENCES auth.users(id)
);

ALTER TABLE declined_users ENABLE ROW LEVEL SECURITY;

-- No direct table access — use SECURITY DEFINER functions instead

CREATE OR REPLACE FUNCTION admin_decline_user(target_user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_members
    WHERE app_members.user_id = auth.uid()
    AND app_members.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can decline users';
  END IF;

  IF EXISTS (
    SELECT 1 FROM app_members
    WHERE app_members.user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'Cannot decline an existing member';
  END IF;

  INSERT INTO declined_users (user_id, declined_by)
  VALUES (target_user_id, auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

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
  IF NOT EXISTS (
    SELECT 1 FROM app_members
    WHERE app_members.user_id = auth.uid()
    AND app_members.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text AS email,
    (am.user_id IS NOT NULL) AS is_member,
    COALESCE(am.is_admin, false) AS is_admin,
    u.created_at AS created_at
  FROM auth.users u
  LEFT JOIN app_members am ON u.id = am.user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM declined_users du WHERE du.user_id = u.id
  )
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;
