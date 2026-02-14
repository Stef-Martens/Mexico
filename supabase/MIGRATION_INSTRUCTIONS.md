# Admin Migration Instructions

This migration adds admin functionality to the Mexico app.

## What it does:

1. Adds `is_admin` column to the `app_members` table
2. Sets `stef.m@hotmail.be` as an admin
3. Creates RLS policies for admins to manage members
4. Creates helper functions for admin operations

## To apply this migration:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `migration_add_admin_role.sql`
4. Run the query

## After migration:

- The email `stef.m@hotmail.be` will have admin privileges
- Admins can access the `/admin` page to add new members
- Admins see an "Admin" button in the navigation menu
- No more manual SQL needed to add members!

## Adding members as an admin:

1. Users must first sign up and authenticate with Google
2. Once signed in, they'll see "Vraag de patron voor toegang"
3. As admin, go to `/admin` page
4. Enter the user's email and click "Add Member"
5. The user will now have access to the app

## Testing:

1. Sign in as `stef.m@hotmail.be`
2. You should see an "Admin" button in the navigation
3. Click it to access the admin panel
4. You can see all registered users and add them as members
