-- Avoid the foreign key constraint issue
-- This script uses a different approach to avoid the foreign key constraint

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
  '66666666-6666-6666-6666-666666666666',
  'testuser999@local.com',
  'YWRtaW4='
);

-- Step 3: Check if the test user was created
SELECT id, email, encrypted_password FROM auth.users WHERE email = 'testuser999@local.com';

-- Step 4: Don't clean up the test user to avoid foreign key constraint issues
-- The test user will remain in the database
