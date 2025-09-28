-- Check current comics table structure
-- Run this in your Supabase SQL Editor to see what columns exist

-- Check if comics table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'comics'
ORDER BY ordinal_position;

-- Check if there are any comics in the current table
SELECT COUNT(*) as comic_count FROM public.comics;

-- Show sample data from current comics table
SELECT * FROM public.comics LIMIT 3;
