-- Final test of the authentication system with guaranteed unique IDs
-- This script tests the complete user creation and authentication flow

-- Step 1: Clean up any existing test users
DELETE FROM public.profiles WHERE username LIKE 'testuser%';
DELETE FROM auth.users WHERE email LIKE 'testuser%@local.com';

-- Step 2: Create a test user
SELECT public.create_username_user(
  'testuser555',
  'YWRtaW4=', -- Base64 encoded 'admin'
  'Test User 555',
  'lister'
) as new_user_id;

-- Step 3: Check if the user was created in both tables
SELECT 'auth.users' as table_name, id, email, encrypted_password FROM auth.users WHERE email = 'testuser555@local.com'
UNION ALL
SELECT 'profiles' as table_name, id::text, email, password_hash FROM public.profiles WHERE username = 'testuser555';

-- Step 4: Test the authentication function
SELECT public.authenticate_username_user(
  'testuser555',
  'YWRtaW4=' -- Base64 encoded 'admin'
) as auth_result;

-- Step 5: Test with wrong password
SELECT public.authenticate_username_user(
  'testuser555',
  'd3Jvbmc=' -- Base64 encoded 'wrong'
) as auth_result_wrong;

-- Step 6: Test with non-existent user
SELECT public.authenticate_username_user(
  'nonexistent',
  'YWRtaW4=' -- Base64 encoded 'admin'
) as auth_result_nonexistent;

-- Step 7: Test creating a user with existing username (should fail)
SELECT public.create_username_user(
  'testuser555',
  'YWRtaW4=', -- Base64 encoded 'admin'
  'Test User 555 Duplicate',
  'lister'
) as duplicate_user_id;

-- Step 8: Clean up test user
DELETE FROM public.profiles WHERE username = 'testuser555';
DELETE FROM auth.users WHERE email = 'testuser555@local.com';

-- Step 9: Verify the admin user still works
SELECT public.authenticate_username_user(
  'admin',
  'YWRtaW4=' -- Base64 encoded 'admin'
) as admin_auth_result;

-- Step 10: Show current users
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username IS NOT NULL 
ORDER BY created_at DESC;
