-- Test the authentication function to make sure it works
-- This script tests the authenticate_username_user function

-- Test the authentication function
SELECT public.authenticate_username_user(
  'admin',
  'YWRtaW4=' -- Base64 encoded 'admin'
) as auth_result;

-- Check if the admin user exists
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username = 'admin';

-- Test creating a new user and then authenticating
SELECT public.create_username_user(
  'testuser789',
  'YWRtaW4=', -- Base64 encoded 'admin'
  'Test User 789',
  'lister'
) as new_user_id;

-- Test authenticating the new user
SELECT public.authenticate_username_user(
  'testuser789',
  'YWRtaW4=' -- Base64 encoded 'admin'
) as auth_result;

-- Clean up test user
DELETE FROM public.profiles WHERE username = 'testuser789';
