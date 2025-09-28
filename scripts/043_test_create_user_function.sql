-- Test the create_username_user function
-- This script tests if the function works correctly

-- Test creating a user
SELECT public.create_username_user(
  'testuser123',
  'YWRtaW4=', -- Base64 encoded 'admin'
  'Test User',
  'lister'
) as new_user_id;

-- Check if the user was created
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username = 'testuser123';

-- Clean up - delete the test user
DELETE FROM public.profiles WHERE username = 'testuser123';
DELETE FROM auth.users WHERE email = 'testuser123@local.com';
