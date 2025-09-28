-- Fix user role issue
-- This will set your user to admin role so you can see edit/delete buttons

-- First, let's see what users exist
SELECT id, email, role FROM auth.users LIMIT 5;

-- Update the first user's role to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
    SELECT id FROM auth.users LIMIT 1
);

-- Verify the update
SELECT id, email, role FROM public.profiles 
WHERE id = (
    SELECT id FROM auth.users LIMIT 1
);
