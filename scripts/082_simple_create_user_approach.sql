-- Simple create user approach without UUID generation
-- This script uses a simple approach without complex UUID generation

-- Step 1: Clean up any existing test users
DELETE FROM public.profiles WHERE username LIKE 'testuser%';
DELETE FROM auth.users WHERE email LIKE 'testuser%@local.com';

-- Step 2: Drop the problematic function
DROP FUNCTION IF EXISTS public.create_user_profile(text, text, text, text);

-- Step 3: Create a simple function that just returns a success message
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_username text,
  p_password_hash text,
  p_full_name text DEFAULT NULL,
  p_role text DEFAULT 'viewer'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username already exists: %', p_username;
  END IF;
  
  -- Return success message
  RETURN 'User creation will be handled by the API route';
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon, authenticated;

-- Step 4: Test the function
SELECT public.create_user_profile(
  'testuser222',
  'YWRtaW4=',
  'Test User 222',
  'lister'
) as result;

-- Step 5: Test the profiles query that was failing
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 6: Verify current users
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as username_users FROM public.profiles WHERE username IS NOT NULL;
SELECT id, username, full_name, role FROM public.profiles WHERE username IS NOT NULL;
