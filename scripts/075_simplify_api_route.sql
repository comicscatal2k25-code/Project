-- Simplify the API route by handling user creation directly
-- This script creates a simple function that works

-- Step 1: Create a simple function that just creates a profile
CREATE OR REPLACE FUNCTION public.create_user_profile(
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
  
  -- Generate a new UUID
  new_user_id := gen_random_uuid();
  
  -- Insert into profiles table only
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
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon, authenticated;

-- Step 2: Test the function
SELECT public.create_user_profile(
  'testuser888',
  'YWRtaW4=',
  'Test User 888',
  'lister'
) as new_user_id;

-- Step 3: Check if the test user was created
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username = 'testuser888';

-- Step 4: Clean up test user
DELETE FROM public.profiles WHERE username = 'testuser888';

-- Step 5: Verify current users
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as username_users FROM public.profiles WHERE username IS NOT NULL;
SELECT id, username, full_name, role FROM public.profiles WHERE username IS NOT NULL;
