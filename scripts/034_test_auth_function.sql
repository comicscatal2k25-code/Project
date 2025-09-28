-- Test the authentication function
-- This will help us debug the login issue

-- First, let's check if the admin user exists
SELECT 
    id,
    username,
    password_hash,
    full_name,
    role,
    email
FROM public.profiles 
WHERE username = 'admin';

-- Test the authentication function
SELECT * FROM public.authenticate_username_user('admin', 'YWRtaW4=');

-- Check if the function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'authenticate_username_user' 
  AND routine_schema = 'public';
