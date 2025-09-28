-- Username-based Authentication Migration
-- This migration converts the system from email-based to username-based authentication

-- Step 1: Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Step 2: Add password_hash column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_hash text;

-- Step 3: Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Step 4: Update the handle_new_user function to work with username-based auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function is now only used for Supabase auth users
  -- Username-based users will be created directly in profiles table
  INSERT INTO public.profiles (id, user_id, email, full_name, role, username)
  VALUES (
    new.id,
    new.id, -- Set user_id to the same as id
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    'viewer',
    coalesce(new.raw_user_meta_data ->> 'username', new.email)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- Step 5: Create function to create username-based user
CREATE OR REPLACE FUNCTION public.create_username_user(
  p_username text,
  p_password_hash text,
  p_full_name text DEFAULT NULL,
  p_role text DEFAULT 'viewer'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- First, create the user in auth.users table
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_username || '@local.com',
    crypt(p_password_hash, gen_salt('bf')), -- Hash the password properly
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Then insert into profiles table
  INSERT INTO public.profiles (
    id,
    user_id,
    username,
    password_hash,
    full_name,
    role,
    email -- Keep email for compatibility, use username as email
  ) VALUES (
    new_user_id,
    new_user_id, -- Use the same ID for user_id
    p_username,
    p_password_hash,
    p_full_name,
    p_role,
    p_username || '@local.com' -- Generate a fake email for compatibility
  );
  
  RETURN new_user_id;
END;
$$;

-- Step 6: Create function to authenticate username/password
CREATE OR REPLACE FUNCTION public.authenticate_username_user(
  p_username text,
  p_password_hash text
)
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role
  FROM public.profiles p
  WHERE p.username = p_username 
    AND p.password_hash = p_password_hash;
END;
$$;

-- Step 7: Create function to update user password
CREATE OR REPLACE FUNCTION public.update_user_password(
  p_user_id uuid,
  p_new_password_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET password_hash = p_new_password_hash
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Step 8: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_username_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_username_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password TO anon, authenticated;

-- Step 9: Update RLS policies to work with username-based auth
-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

-- Create new policies for username-based auth
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (true); -- Allow all authenticated users to read profiles

CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 10: Create a function to get current user by username
CREATE OR REPLACE FUNCTION public.get_current_user_by_username(
  p_username text
)
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role
  FROM public.profiles p
  WHERE p.username = p_username;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_by_username TO anon, authenticated;

-- Step 11: Verification
SELECT 'Username-based authentication migration completed' as status;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT username, role FROM public.profiles WHERE username IS NOT NULL LIMIT 5;
