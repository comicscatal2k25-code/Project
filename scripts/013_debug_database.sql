-- Quick test script to check if the comics table exists and has data
-- Run this in your Supabase SQL Editor to debug

-- Check if comics table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'comics';

-- Check if there are any comics in the table
SELECT COUNT(*) as comic_count FROM public.comics;

-- Check if there are any users
SELECT COUNT(*) as user_count FROM auth.users;

-- Check if there are any profiles
SELECT COUNT(*) as profile_count FROM public.profiles;

-- If you have comics but they're not showing, check the user_id
SELECT id, email FROM auth.users LIMIT 5;

-- Check comics with their user_id
SELECT id, title, issue_number, user_id FROM public.comics LIMIT 5;
