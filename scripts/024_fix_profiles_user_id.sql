-- Fix user role issue - Properly handle user_id column
-- The profiles table requires user_id to match the auth.users id

-- First, let's check the profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what's currently in profiles table
SELECT id, user_id, email, role FROM public.profiles LIMIT 5;

-- Check if your user exists in profiles table
SELECT id, user_id, email, role FROM public.profiles 
WHERE email = 'mailforbucks645@gmail.com';

-- If the user doesn't exist in profiles, create the profile with proper user_id
INSERT INTO public.profiles (id, user_id, email, full_name, role)
SELECT 
    id as id,
    id as user_id,  -- Set user_id to the same as id
    email, 
    COALESCE(raw_user_meta_data ->> 'full_name', email), 
    'admin'
FROM auth.users 
WHERE email = 'mailforbucks645@gmail.com'
ON CONFLICT (id) DO UPDATE SET 
    user_id = EXCLUDED.id,
    role = 'admin';

-- If the user exists but has wrong role or null user_id, update it
UPDATE public.profiles 
SET 
    user_id = id,  -- Set user_id to match id
    role = 'admin' 
WHERE email = 'mailforbucks645@gmail.com';

-- Verify the final result
SELECT id, user_id, email, role FROM public.profiles 
WHERE email = 'mailforbucks645@gmail.com';
