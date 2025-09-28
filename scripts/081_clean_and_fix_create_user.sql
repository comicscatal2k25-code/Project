-- Clean up test data and fix the create_user_profile function
-- This script cleans up test data and uses a different approach

-- Step 1: Clean up any existing test users
DELETE FROM public.profiles WHERE username LIKE 'testuser%';
DELETE FROM auth.users WHERE email LIKE 'testuser%@local.com';

-- Step 2: Drop the problematic function
DROP FUNCTION IF EXISTS public.create_user_profile(text, text, text, text);

-- Step 3: Create a function that uses a different approach to avoid UUID collisions
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
  max_attempts integer := 100;
  attempt integer := 0;
BEGIN
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username already exists: %', p_username;
  END IF;
  
  -- Generate a unique UUID with collision detection
  LOOP
    attempt := attempt + 1;
    
    -- Use a different UUID generation method
    new_user_id := uuid_generate_v4();
    
    -- Check if this UUID already exists in either table
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) AND
       NOT EXISTS (SELECT 1 FROM auth.users WHERE id = new_user_id) THEN
      EXIT; -- UUID is unique, exit the loop
    END IF;
    
    -- If we've tried too many times, raise an error
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique UUID after % attempts', max_attempts;
    END IF;
  END LOOP;
  
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
    p_password_hash,
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

-- Step 4: Test the function
SELECT public.create_user_profile(
  'testuser111',
  'YWRtaW4=',
  'Test User 111',
  'lister'
) as new_user_id;

-- Step 5: Check if the test user was created in both tables
SELECT 'auth.users' as table_name, id, email, encrypted_password FROM auth.users WHERE email = 'testuser111@local.com'
UNION ALL
SELECT 'profiles' as table_name, id::text, email, password_hash FROM public.profiles WHERE username = 'testuser111';

-- Step 6: Test the profiles query that was failing
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 7: Clean up test user
DELETE FROM public.profiles WHERE username = 'testuser111';
DELETE FROM auth.users WHERE email = 'testuser111@local.com';

-- Step 8: Verify current users
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as username_users FROM public.profiles WHERE username IS NOT NULL;
SELECT id, username, full_name, role FROM public.profiles WHERE username IS NOT NULL;
