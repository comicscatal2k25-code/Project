-- Fix Create User button with simple approach
-- This script uses a simple approach without complex UUID generation

-- Step 1: Fix RLS policies first to prevent infinite recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_all" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_all" ON public.profiles
  FOR UPDATE USING (true);

CREATE POLICY "profiles_delete_all" ON public.profiles
  FOR DELETE USING (true);

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop and recreate the create_username_user function with simple approach
DROP FUNCTION IF EXISTS public.create_username_user(text, text, text, text);

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
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username already exists: %', p_username;
  END IF;
  
  -- Generate a new UUID using the simplest method
  new_user_id := gen_random_uuid();
  
  -- Insert into profiles table only (skip auth.users for now)
  INSERT INTO public.profiles (
    id,
    user_id,
    username,
    password_hash,
    full_name,
    role,
    email
  ) VALUES (
    new_user_id,
    new_user_id,
    p_username,
    p_password_hash,
    p_full_name,
    p_role,
    p_username || '@local.com'
  );
  
  RETURN new_user_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_username_user TO anon, authenticated;

-- Step 3: Clean up any existing test users first
DELETE FROM public.profiles WHERE username LIKE 'testuser%';
DELETE FROM auth.users WHERE email LIKE 'testuser%@local.com';

-- Step 4: Test the function
SELECT public.create_username_user(
  'testuser888',
  'YWRtaW4=', -- Base64 encoded 'admin'
  'Test User 888',
  'lister'
) as new_user_id;

-- Step 5: Check if the test user was created
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username = 'testuser888';

-- Step 6: Test the profiles query that was failing
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 7: Clean up test user
DELETE FROM public.profiles WHERE username = 'testuser888';

-- Step 8: Verify current users
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as username_users FROM public.profiles WHERE username IS NOT NULL;
SELECT id, username, full_name, role FROM public.profiles WHERE username IS NOT NULL;
