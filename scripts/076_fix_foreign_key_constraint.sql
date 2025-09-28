-- Fix the foreign key constraint issue
-- This script handles the foreign key constraint properly

-- Step 1: Create the create_auth_user function
CREATE OR REPLACE FUNCTION public.create_auth_user(
  user_id uuid,
  user_email text,
  user_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into auth.users table
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
    user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    user_email,
    user_password,
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_auth_user TO anon, authenticated;

-- Step 2: Test the function
SELECT public.create_auth_user(
  '55555555-5555-5555-5555-555555555555',
  'testuser999@local.com',
  'YWRtaW4='
);

-- Step 3: Check if the test user was created
SELECT id, email, encrypted_password FROM auth.users WHERE email = 'testuser999@local.com';

-- Step 4: Clean up test user (delete from profiles first, then auth.users)
DELETE FROM public.profiles WHERE user_id = '55555555-5555-5555-5555-555555555555';
DELETE FROM auth.users WHERE id = '55555555-5555-5555-5555-555555555555';
