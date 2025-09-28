-- Update comics with your actual user ID
-- Run this in your Supabase SQL Editor

-- First, find your user ID
SELECT id, email FROM auth.users WHERE email = 'mailforbucks645@gmail.com';

-- Update comics with your actual user ID (replace with the ID from above query)
UPDATE public.comics 
SET user_id = (
  SELECT id FROM auth.users WHERE email = 'mailforbucks645@gmail.com'
)
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Verify the update
SELECT COUNT(*) as updated_comics_count 
FROM public.comics 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'mailforbucks645@gmail.com'
);

-- Show some sample comics with your user ID
SELECT id, title, issue_number, user_id 
FROM public.comics 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'mailforbucks645@gmail.com'
)
LIMIT 5;
