-- Avoid the foreign key constraint issue with alternative approach
-- This script uses a different approach to avoid the foreign key constraint

-- Step 1: Drop the problematic function
DROP FUNCTION IF EXISTS public.create_user_profile(text, text, text, text);

-- Step 2: Create a function that uses the existing create_auth_user function
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
  
  -- First, create the user in auth.users table using the existing function
  PERFORM public.create_auth_user(
    new_user_id,
    p_username || '@local.com',
    p_password_hash
  );
  
  -- Then insert into profiles table
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

-- Step 3: Test the function
SELECT public.create_user_profile(
  'testuser999',
  'YWRtaW4=',
  'Test User 999',
  'lister'
) as new_user_id;

-- Step 4: Check if the test user was created in both tables
SELECT 'auth.users' as table_name, id, email, encrypted_password FROM auth.users WHERE email = 'testuser999@local.com'
UNION ALL
SELECT 'profiles' as table_name, id::text, email, password_hash FROM public.profiles WHERE username = 'testuser999';

-- Step 5: Test the profiles query that was failing
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 6: Clean up test user (delete from profiles first, then auth.users)
DELETE FROM public.profiles WHERE username = 'testuser999';
DELETE FROM auth.users WHERE email = 'testuser999@local.com';

-- Step 7: Verify current users
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as username_users FROM public.profiles WHERE username IS NOT NULL;
SELECT id, username, full_name, role FROM public.profiles WHERE username IS NOT NULL;
