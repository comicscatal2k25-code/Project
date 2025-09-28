-- Test authentication with the new user creation approach
-- This script tests the complete user creation and authentication flow

-- Step 1: Create a test user
SELECT public.create_username_user(
  'testuser111',
  'YWRtaW4=', -- Base64 encoded 'admin'
  'Test User 111',
  'lister'
) as new_user_id;

-- Step 2: Check if the user was created in both tables
SELECT 'auth.users' as table_name, id, email, encrypted_password FROM auth.users WHERE email = 'testuser111@local.com'
UNION ALL
SELECT 'profiles' as table_name, id::text, email, password_hash FROM public.profiles WHERE username = 'testuser111';

-- Step 3: Test the authentication function
SELECT public.authenticate_username_user(
  'testuser111',
  'YWRtaW4=' -- Base64 encoded 'admin'
) as auth_result;

-- Step 4: Test with wrong password
SELECT public.authenticate_username_user(
  'testuser111',
  'd3Jvbmc=' -- Base64 encoded 'wrong'
) as auth_result_wrong;

-- Step 5: Test with non-existent user
SELECT public.authenticate_username_user(
  'nonexistent',
  'YWRtaW4=' -- Base64 encoded 'admin'
) as auth_result_nonexistent;

-- Step 6: Clean up test user
DELETE FROM public.profiles WHERE username = 'testuser111';
DELETE FROM auth.users WHERE email = 'testuser111@local.com';

-- Step 7: Verify the admin user still works
SELECT public.authenticate_username_user(
  'admin',
  'YWRtaW4=' -- Base64 encoded 'admin'
) as admin_auth_result;
