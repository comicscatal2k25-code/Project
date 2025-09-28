-- Test database connection and profiles table
-- This script tests if we can access the profiles table

-- Check if profiles table exists and has data
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Check profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any username-based users
SELECT id, username, full_name, role, created_at 
FROM public.profiles 
WHERE username IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles' 
  AND schemaname = 'public';
