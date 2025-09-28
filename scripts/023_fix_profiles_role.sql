-- Fix user role issue - Check profiles table and update role
-- The issue is that we're looking at auth.users instead of public.profiles

-- First, let's check what's in the profiles table
SELECT id, email, role FROM public.profiles LIMIT 5;

-- Check if your user exists in profiles table
SELECT id, email, role FROM public.profiles 
WHERE email = 'mailforbucks645@gmail.com';

-- If the user doesn't exist in profiles, create the profile
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, COALESCE(raw_user_meta_data ->> 'full_name', email), 'admin'
FROM auth.users 
WHERE email = 'mailforbucks645@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- If the user exists but has wrong role, update it
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'mailforbucks645@gmail.com';

-- Verify the final result
SELECT id, email, role FROM public.profiles 
WHERE email = 'mailforbucks645@gmail.com';
