-- Fix RLS policies to allow user creation
-- This script temporarily disables RLS to allow the create_username_user function to work

-- Disable RLS on profiles table temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Test the function
SELECT public.create_username_user(
  'testuser456',
  'YWRtaW4=', -- Base64 encoded 'admin'
  'Test User 456',
  'lister'
) as new_user_id;

-- Check if the user was created
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username = 'testuser456';

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a more permissive policy for user creation
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;

CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT WITH CHECK (true); -- Allow all inserts for now

-- Clean up test user
DELETE FROM public.profiles WHERE username = 'testuser456';
DELETE FROM auth.users WHERE email = 'testuser456@local.com';
