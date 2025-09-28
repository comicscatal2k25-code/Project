-- Create Initial Admin User
-- This script creates an initial admin user if none exists
-- Run this after the RBAC migration to ensure there's at least one admin

-- Function to create initial admin user
CREATE OR REPLACE FUNCTION public.create_initial_admin(
  admin_email text,
  admin_password text,
  admin_full_name text DEFAULT 'System Administrator'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
  existing_admin_count integer;
  result jsonb;
BEGIN
  -- Check if any admin users already exist
  SELECT COUNT(*) INTO existing_admin_count
  FROM public.profiles 
  WHERE role = 'admin';
  
  IF existing_admin_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Admin users already exist. Skipping initial admin creation.',
      'existing_admin_count', existing_admin_count
    );
  END IF;
  
  -- Create the admin user in auth.users (this will trigger the profile creation)
  -- Note: This requires the admin to be created through Supabase Auth API
  -- We'll just create the profile record here and log the action
  
  -- For now, we'll create a placeholder that needs to be completed via the admin UI
  -- or through Supabase Auth directly
  
  -- Log the attempt
  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    resource,
    outcome,
    metadata
  ) VALUES (
    NULL, -- No actor since this is system-initiated
    'create_initial_admin_attempt',
    'users',
    'pending',
    jsonb_build_object(
      'email', admin_email,
      'full_name', admin_full_name,
      'note', 'Admin user creation initiated. Complete via Supabase Auth or admin UI.'
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Initial admin creation initiated. Please complete via Supabase Auth or admin UI.',
    'email', admin_email,
    'full_name', admin_full_name,
    'next_steps', ARRAY[
      '1. Create user in Supabase Auth with email: ' || admin_email,
      '2. Set password: ' || admin_password,
      '3. Update profile role to admin via admin UI or SQL',
      '4. User will then have full admin access'
    ]
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_initial_admin TO anon, authenticated;

-- Alternative: Direct admin profile creation (if user already exists in auth.users)
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  result jsonb;
BEGIN
  -- Find the user by email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found with email: ' || user_email
    );
  END IF;
  
  -- Update their profile to admin role
  UPDATE public.profiles
  SET role = 'admin', updated_at = now()
  WHERE id = user_id;
  
  -- Log the promotion
  INSERT INTO public.audit_logs (
    actor_user_id,
    target_user_id,
    action,
    resource,
    outcome,
    metadata
  ) VALUES (
    NULL, -- System-initiated
    user_id,
    'promote_to_admin',
    'users',
    'success',
    jsonb_build_object(
      'email', user_email,
      'previous_role', 'user'
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User promoted to admin successfully',
    'user_id', user_id,
    'email', user_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.promote_user_to_admin TO anon, authenticated;

-- Create a view to check admin status
CREATE OR REPLACE VIEW public.admin_status AS
SELECT 
  COUNT(*) as total_admins,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as recent_admins,
  MIN(created_at) as first_admin_created,
  MAX(created_at) as last_admin_created
FROM public.profiles 
WHERE role = 'admin';

GRANT SELECT ON public.admin_status TO anon, authenticated;

-- Instructions for manual admin creation (if needed)
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Create a new user with the desired email
-- 3. Run: SELECT promote_user_to_admin('admin@example.com');
-- 4. Or use the admin UI once it's available
