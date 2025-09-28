-- Clean database for signup approach
-- This script cleans up the database and removes problematic functions

-- Step 1: Clean up any existing test users
DELETE FROM public.profiles WHERE username LIKE 'testuser%';
DELETE FROM auth.users WHERE email LIKE 'testuser%@local.com';

-- Step 2: Drop all problematic functions
DROP FUNCTION IF EXISTS public.create_username_user(text, text, text, text);
DROP FUNCTION IF EXISTS public.create_auth_user(uuid, text, text);
DROP FUNCTION IF EXISTS public.create_user_profile(text, text, text, text);

-- Step 3: Test the profiles query that was failing
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 4: Verify current users
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as username_users FROM public.profiles WHERE username IS NOT NULL;
SELECT id, username, full_name, role FROM public.profiles WHERE username IS NOT NULL;

-- Step 5: Test that we can query auth.users table
SELECT COUNT(*) as total_auth_users FROM auth.users;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;
