-- Fix the create_username_user function to use proper password hashing
-- This script updates the function to work correctly

-- Drop and recreate the function with proper password handling
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
    p_password_hash, -- Store the base64 encoded password
    p_full_name,
    p_role,
    p_username || '@local.com' -- Generate a fake email for compatibility
  );
  
  RETURN new_user_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_username_user TO anon, authenticated;

-- Test the function
SELECT public.create_username_user(
  'testuser999',
  'YWRtaW4=', -- Base64 encoded 'admin'
  'Test User 999',
  'lister'
) as new_user_id;

-- Check if the test user was created
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username = 'testuser999';

-- Clean up test user
DELETE FROM public.profiles WHERE username = 'testuser999';
DELETE FROM auth.users WHERE email = 'testuser999@local.com';
